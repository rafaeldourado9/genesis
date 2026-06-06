#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${1:-.}"
OPTION="${2:-}"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 16+ e necessario para instalar o Genesis." >&2
  exit 1
fi

if [ "$TARGET" = "--global" ] || [ "$TARGET" = "global" ]; then
  exec node "$ROOT/bin/genesis.js" global "$OPTION"
fi

exec node "$ROOT/bin/genesis.js" init "$TARGET" "$OPTION"
