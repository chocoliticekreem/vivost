#!/usr/bin/env bash
# Wrapper around the Codeplain CLI: activates the venv, checks the API key,
# and forwards all args to plain2code.py.
#   ./render.sh app.plain        # render a spec
#   ./render.sh --status         # show account / credits
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLIENT="$HERE/plain2code_client"

if [ -z "${CODEPLAIN_API_KEY:-}" ]; then
  echo "CODEPLAIN_API_KEY not set. Run: export CODEPLAIN_API_KEY='your_key'" >&2
  exit 1
fi

source "$CLIENT/.venv/bin/activate"
exec python "$CLIENT/plain2code.py" "$@"
