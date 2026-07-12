#!/usr/bin/env bash
# One-shot deploy for the Discord-fronted Leverage Copilot (spec steps 2-3).
#
# Run from the repo root (leverage/). REVIEW before running — it changes prod:
# it PUTs the copilot workflow, restarts n8n, and ships the relay bot container.
#
#   2a. Push the updated copilot workflow JSON to n8n, preserving the live
#       credential bindings (the export leaves the Ollama cred id blank).
#   2b. Activate it, then restart n8n so the /webhook/copilot route registers
#       (API activate alone sets active=1 but does NOT register the webhook).
#   3.  Ship the relay bot to the VPS on n8n's Docker network.
#
# Required env (export before running):
#   N8N_API_URL           e.g. https://n8n.phangan.ai
#   N8N_API_KEY           n8n Settings -> n8n API
#   LEVERAGE_COPILOT_SECRET   must match the secret on the n8n container
#   DISCORD_BOT_TOKEN
#   COPILOT_CHANNEL_ID    #copilot channel id (Discord Developer Mode -> Copy Channel ID)
# Optional overrides:
#   SSH_HOST (ovh-echo)  N8N_CONTAINER (n8n)  COPILOT_ID (XtV6NerjQnYPtXgz)
#   WF_JSON  BOT_DIR  REMOTE_BOT_DIR  FORCE=1 (skip confirm)
set -euo pipefail

: "${N8N_API_URL:?set N8N_API_URL, e.g. https://n8n.phangan.ai}"
: "${N8N_API_KEY:?set N8N_API_KEY (n8n Settings -> n8n API)}"
: "${LEVERAGE_COPILOT_SECRET:?set LEVERAGE_COPILOT_SECRET (must match the n8n container)}"
: "${DISCORD_BOT_TOKEN:?set DISCORD_BOT_TOKEN}"
: "${COPILOT_CHANNEL_ID:?set COPILOT_CHANNEL_ID}"
N8N_API_URL="${N8N_API_URL%/}"
SSH_HOST="${SSH_HOST:-ovh-echo}"
N8N_CONTAINER="${N8N_CONTAINER:-n8n}"
COPILOT_ID="${COPILOT_ID:-XtV6NerjQnYPtXgz}"
WF_JSON="${WF_JSON:-workflows/leverage-copilot-workflow.json}"
BOT_DIR="${BOT_DIR:-bot}"
REMOTE_BOT_DIR="${REMOTE_BOT_DIR:-/root/leverage-copilot-bot}"

[ -f "$WF_JSON" ] || { echo "missing $WF_JSON — run from the repo root"; exit 1; }
[ -d "$BOT_DIR" ] || { echo "missing $BOT_DIR — run from the repo root"; exit 1; }

cat <<SUMMARY
About to:
  - PUT copilot workflow $COPILOT_ID -> $N8N_API_URL   (credentials preserved)
  - restart n8n container '$N8N_CONTAINER' on $SSH_HOST (registers /webhook/copilot)
  - deploy relay bot to $SSH_HOST:$REMOTE_BOT_DIR
SUMMARY
if [ "${FORCE:-0}" != "1" ]; then
  read -r -p "Proceed? [y/N] " ans; [ "$ans" = "y" ] || { echo "aborted"; exit 1; }
fi

# --- step 2a: push workflow, preserving live credential bindings ---
echo "==> [2a] pushing copilot workflow to $N8N_API_URL"
python3 - "$COPILOT_ID" "$WF_JSON" <<'PY'
import json, os, sys, urllib.request
api = os.environ["N8N_API_URL"].rstrip("/")
key = os.environ["N8N_API_KEY"]
wf_id, wf_path = sys.argv[1], sys.argv[2]
H = {"X-N8N-API-KEY": key, "Content-Type": "application/json", "Accept": "application/json"}

def call(method, path, data=None):
    req = urllib.request.Request(
        api + path, method=method,
        data=json.dumps(data).encode() if data is not None else None, headers=H)
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read() or "{}")

live = call("GET", f"/api/v1/workflows/{wf_id}")
os.makedirs("workflows", exist_ok=True)
with open("workflows/.copilot-live-backup.json", "w") as f:   # snapshot for rollback
    json.dump(live, f, indent=2)
print("   backed up live workflow -> workflows/.copilot-live-backup.json")
live_creds = {n["name"]: n["credentials"] for n in live.get("nodes", []) if n.get("credentials")}

new = json.load(open(wf_path))
for n in new["nodes"]:
    if n["name"] in live_creds:          # transplant creds the export left blank (Ollama nodes)
        n["credentials"] = live_creds[n["name"]]

payload = {"name": new["name"], "nodes": new["nodes"],
           "connections": new["connections"], "settings": new.get("settings", {})}
call("PUT", f"/api/v1/workflows/{wf_id}", payload)
print("   updated; credentials transplanted for:", ", ".join(live_creds) or "(none)")
try:
    call("POST", f"/api/v1/workflows/{wf_id}/activate")
    print("   active=1 (webhook registers on the restart below)")
except Exception as e:
    print("   activate warning:", e)
PY

# --- step 2b: restart n8n so the webhook route registers ---
echo "==> [2b] restarting n8n '$N8N_CONTAINER' on $SSH_HOST"
ssh "$SSH_HOST" "docker restart $N8N_CONTAINER >/dev/null && echo '   n8n restarted'"

echo "==> waiting for n8n to come back (max ~60s)"
for _ in $(seq 1 30); do
  if curl -fsS -o /dev/null "$N8N_API_URL/healthz"; then echo "   n8n healthy"; break; fi
  sleep 2
done

# --- step 3: ship the relay bot ---
echo "==> [3] shipping relay bot to $SSH_HOST:$REMOTE_BOT_DIR"
ssh "$SSH_HOST" "mkdir -p $REMOTE_BOT_DIR"
rsync -az --delete --exclude node_modules --exclude .env "$BOT_DIR"/ "$SSH_HOST:$REMOTE_BOT_DIR/"

# detect n8n's docker network so the bot can reach http://n8n:5678 internally
NET=$(ssh "$SSH_HOST" "docker inspect -f '{{range \$k,\$v := .NetworkSettings.Networks}}{{\$k}} {{end}}' $N8N_CONTAINER" | awk '{print $1}')
[ -n "$NET" ] || { echo "could not detect n8n docker network"; exit 1; }
echo "   n8n network: $NET"

# write the bot .env on the VPS (secrets stay on the box, never in the repo)
ssh "$SSH_HOST" "cat > $REMOTE_BOT_DIR/.env" <<EOF
DISCORD_BOT_TOKEN=$DISCORD_BOT_TOKEN
COPILOT_CHANNEL_ID=$COPILOT_CHANNEL_ID
N8N_WEBHOOK_URL=http://$N8N_CONTAINER:5678/webhook/copilot
LEVERAGE_COPILOT_SECRET=$LEVERAGE_COPILOT_SECRET
REQUEST_TIMEOUT_MS=90000
EOF

# point the compose external network at the detected network, then build + start
ssh "$SSH_HOST" "cd $REMOTE_BOT_DIR \
  && sed -i 's/^    name: .*/    name: $NET/' docker-compose.yml \
  && docker compose up -d --build \
  && docker compose ps"

echo
echo "==> done."
echo "    bot logs:  ssh $SSH_HOST 'cd $REMOTE_BOT_DIR && docker compose logs -f'"
echo "    webhook smoke test:"
echo "    curl -sS -X POST $N8N_API_URL/webhook/copilot \\"
echo "      -H 'content-type: application/json' \\"
echo "      -H \"x-leverage-secret: \$LEVERAGE_COPILOT_SECRET\" \\"
echo "      -d '{\"message\":\"ranking\"}'"
