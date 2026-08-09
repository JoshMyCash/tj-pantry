#!/usr/bin/env bash
set -euo pipefail

STATUS_FILE=/tmp/vercel-agent-deploy-status
rm -f "$STATUS_FILE"

for i in $(seq 1 40); do
  pane=$(tmux -f /exec-daemon/tmux.portal.conf capture-pane -t "vercel-login:0.0" -p 2>/dev/null || true)
  if echo "$pane" | grep -qiE 'Congratulations|Login successful|Authenticated|Success!|You are now signed in|Enjoy'; then
    echo "AUTH_DETECTED"
    npx vercel link --yes --scope joshmycashs-projects --project tj-pantry
    npx tsx scripts/push-database-url-to-vercel.ts
    echo DONE >"$STATUS_FILE"
    exit 0
  fi
  if echo "$pane" | grep -qiE 'expired|denied'; then
    echo AUTH_EXPIRED >"$STATUS_FILE"
    exit 1
  fi
  echo "waiting for Vercel auth ($i)..."
  sleep 15
done

echo TIMEOUT >"$STATUS_FILE"
exit 1
