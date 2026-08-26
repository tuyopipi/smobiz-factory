#!/bin/zsh
set -u

ROOT="${SMOBIZ_FACTORY_ROOT:-/Users/apple/smobiz-factory}"
NODE_BIN="${NODE_BIN:-/opt/homebrew/bin/node}"
PHP_BIN="${PHP_BIN:-/opt/homebrew/bin/php}"
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
export NODE_BIN
export PHP_BIN
LOG_DIR="$ROOT/logs"
LOG_FILE="$LOG_DIR/auto-publish-$(date +%F).log"

mkdir -p "$LOG_DIR"
cd "$ROOT" || exit 1

{
  echo "[$(date '+%Y-%m-%d %H:%M:%S %z')] auto-publish start"
  echo "root=$ROOT"
  echo "node=$NODE_BIN"
  echo "php=$PHP_BIN"

  "$NODE_BIN" scripts/auto-publish-tool.mjs
  exit_code=$?

  echo "[$(date '+%Y-%m-%d %H:%M:%S %z')] auto-publish end status=$exit_code"
  exit "$exit_code"
} >> "$LOG_FILE" 2>&1
