#!/usr/bin/env bash
# YDY — start the local workspace. Serves dist/ on 127.0.0.1 and proxies chat to the model API when configured.
set -euo pipefail
cd "$(dirname "$0")"
if [ ! -d dist ]; then
  echo "Building the app first…"
  npm run build
fi
PORT="${PORT:-7817}"
echo "YDY → http://127.0.0.1:${PORT}"
exec node server.mjs
