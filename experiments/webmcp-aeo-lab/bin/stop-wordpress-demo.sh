#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/.."

if [ -f .webmcp-dev.pid ]; then
  PID="$(cat .webmcp-dev.pid)"
  if [ -n "$PID" ] && kill -0 "$PID" >/dev/null 2>&1; then
    echo "Stopping local WebMCP wrangler dev process $PID..."
    kill "$PID" >/dev/null 2>&1 || true
  fi
  rm -f .webmcp-dev.pid
fi

docker compose down --remove-orphans
