#!/usr/bin/env bash
# Rollback the Discord copilot deploy: restore the pre-deploy copilot workflow
# (the ChatTrigger version) and stop the relay bot. Safe to run before/after the
# interview if anything misbehaves.
#
# Run from the repo root (leverage/).
#
#   1. Stop + remove the relay bot container on the VPS (leaves n8n untouched).
#   2. Restore the copilot workflow from the snapshot the deploy took
#      (workflows/.copilot-live-backup.json); if absent, fall back to git HEAD.
#      Credentials are transplanted from the current live workflow.
#   3. Activate + restart n8n so the original front door re-registers.
#
# Required env:
#   N8N_API_URL   N8N_API_KEY
# Optional overrides:
#   SSH_HOST (ovh-echo)  N8N_CONTAINER (n8n)  COPILOT_ID (XtV6NerjQnYPtXgz)
#   BACKUP (workflows/.copilot-live-backup.json)  REMOTE_BOT_DIR (/root/leverage-copilot-bot)
#   FORCE=1 (skip confirm)
set -euo pipefail

: "${N8N_API_URL:?set N8N_API_URL, e.g. https://n8n.phangan.ai}"
: "${N8N_API_KEY:?set N8N_API_KEY}"
N8N_API_URL="${N8N_API_URL%/}"
SSH_HOST="${SSH_HOST:-ovh-echo}"
N8N_CONTAINER="${N8N_CONTAINER:-n8n}"
COPILOT_ID="${COPILOT_ID:-XtV6NerjQnYPtXgz}"
BACKUP="${BACKUP:-workflows/.copilot-live-backup.json}"
REMOTE_BOT_DIR="${REMOTE_BOT_DIR:-/root/leverage-copilot-bot}"

cat <<SUMMARY
About to ROLL BACK:
  - stop + remove relay bot at $SSH_HOST:$REMOTE_BOT_DIR
  - restore copilot workflow $COPILOT_ID from $( [ -f "$BACKUP" ] && echo "$BACKUP" || echo "git HEAD" )
  - restart n8n container '$N8N_CONTAINER' on $SSH_HOST
SUMMARY
if [ "${FORCE:-0}" != "1" ]; then
  read -r -p "Proceed? [y/N] " ans; [ "$ans" = "y" ] || { echo "aborted"; exit 1; }
fi

# --- step 1: stop the bot ---
echo "==> [1] stopping relay bot on $SSH_HOST"
ssh "$SSH_HOST" "cd $REMOTE_BOT_DIR 2>/dev/null && docker compose down && echo '   bot stopped + removed' || echo '   bot dir/container not present — nothing to stop'"

# --- step 2: resolve the source workflow JSON ---
SRC="$(mktemp)"
trap 'rm -f "$SRC"' EXIT
if [ -f "$BACKUP" ]; then
  cp "$BACKUP" "$SRC"
  echo "==> [2] restoring from snapshot $BACKUP"
else
  echo "==> [2] no snapshot found; restoring from git HEAD"
  git show HEAD:workflows/leverage-copilot-workflow.json > "$SRC" \
    || { echo "   ERROR: no backup and git HEAD copy unavailable — cannot restore"; exit 1; }
fi

# --- push the restored workflow, preserving live credential bindings ---
python3 - "$COPILOT_ID" "$SRC" <<'PY'
import json, os, sys, urllib.request
api = os.environ["N8N_API_URL"].rstrip("/")
key = os.environ["N8N_API_KEY"]
wf_id, src_path = sys.argv[1], sys.argv[2]
H = {"X-N8N-API-KEY": key, "Content-Type": "application/json", "Accept": "application/json"}

def call(method, path, data=None):
    req = urllib.request.Request(
        api + path, method=method,
        data=json.dumps(data).encode() if data is not None else None, headers=H)
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read() or "{}")

live = call("GET", f"/api/v1/workflows/{wf_id}")
live_creds = {n["name"]: n["credentials"] for n in live.get("nodes", []) if n.get("credentials")}

src = json.load(open(src_path))
for n in src["nodes"]:
    if n["name"] in live_creds:
        n["credentials"] = live_creds[n["name"]]

payload = {"name": src["name"], "nodes": src["nodes"],
           "connections": src["connections"], "settings": src.get("settings", {})}
call("PUT", f"/api/v1/workflows/{wf_id}", payload)
print("   restored workflow", wf_id, "- creds transplanted for:", ", ".join(live_creds) or "(none)")
try:
    call("POST", f"/api/v1/workflows/{wf_id}/activate")
    print("   active=1 (front door re-registers on the restart below)")
except Exception as e:
    print("   activate warning:", e)
PY

# --- step 3: restart n8n so the restored front door registers ---
echo "==> [3] restarting n8n '$N8N_CONTAINER' on $SSH_HOST"
ssh "$SSH_HOST" "docker restart $N8N_CONTAINER >/dev/null && echo '   n8n restarted'"

echo "==> waiting for n8n to come back (max ~60s)"
for _ in $(seq 1 30); do
  if curl -fsS -o /dev/null "$N8N_API_URL/healthz"; then echo "   n8n healthy"; break; fi
  sleep 2
done

echo
echo "==> rollback done. Copilot restored to its pre-Discord state; relay bot stopped."
