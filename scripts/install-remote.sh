#!/usr/bin/env bash
set -euo pipefail

# Genesis Framework remote installer for Linux and macOS.
# Usage: curl -fsSL https://raw.githubusercontent.com/rafaeldourado9/genesis-skill/main/scripts/install-remote.sh | bash

TARGET="${1:-.}"

if ! command -v npx >/dev/null 2>&1; then
  echo "Node.js 16+ com npx e necessario. Instale em https://nodejs.org" >&2
  exit 1
fi

if [ "$TARGET" = "--global" ] || [ "$TARGET" = "global" ]; then
  exec npx --yes github:rafaeldourado9/genesis-skill global
fi

exec npx --yes github:rafaeldourado9/genesis-skill init "$TARGET"
