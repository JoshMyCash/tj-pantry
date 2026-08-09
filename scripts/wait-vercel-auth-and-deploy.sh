#!/usr/bin/env bash
set -euo pipefail

STATUS_FILE=/tmp/vercel-agent-deploy-status
LOGIN_FILE=/tmp/vercel-login-pane.txt
rm -f "$STATUS_FILE"

authed() {
  local text
  text=$(tmux -f /exec-daemon/tmux.portal.conf capture-pane -t "vlogin:0.0" -p 2>/dev/null || true)
  text+=$'\n'
  text+=$(cat "$LOGIN_FILE" 2>/dev/null || true)
  if echo "$text" | grep -qiE 'Congratulations|Login successful|Authenticated|Success!|You are now signed in|Enjoy'; then
    return 0
  fi
  # CLI auth files
  if [ -f /home/ubuntu/.local/share/com.vercel.cli/auth.json ]; then
    return 0
  fi
  return 1
}

expired() {
  local text
  text=$(tmux -f /exec-daemon/tmux.portal.conf capture-pane -t "vlogin:0.0" -p 2>/dev/null || true)
  text+=$'\n'
  text+=$(cat "$LOGIN_FILE" 2>/dev/null || true)
  echo "$text" | grep -qiE 'expired|denied'
}

for i in $(seq 1 120); do
  if authed; then
    echo "AUTH_DETECTED"
    npx vercel link --yes --scope joshmycashs-projects --project tj-pantry
    npx tsx scripts/push-database-url-to-vercel.ts
    echo DONE >"$STATUS_FILE"
    exit 0
  fi
  if expired; then
    echo AUTH_EXPIRED >"$STATUS_FILE"
    exit 1
  fi
  echo "waiting for Vercel auth ($i)..."
  sleep 15
done

echo TIMEOUT >"$STATUS_FILE"
exit 1
