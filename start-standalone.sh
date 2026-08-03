#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
cd "$ROOT"

if [[ ! -f misp-galaxy/clusters/threat-actor.json || ! -f pivotick/package.json ]]; then
  echo "Initialising git submodules..."
  git submodule update --init --recursive
fi

if [[ ! -f pivotick/dist/pivotick.umd.js || ! -f pivotick/dist/assets/pivotick.css ]]; then
  echo "Building the local Pivotick browser bundle..."
  npm --prefix pivotick ci
  npm --prefix pivotick run build:browser
fi

mkdir -p .local
python3 - <<'PY'
import json
import subprocess
from pathlib import Path

root = Path.cwd()
files = sorted(
    path.relative_to(root / "misp-galaxy").as_posix()
    for path in (root / "misp-galaxy" / "clusters").glob("*.json")
    if path.name != "schema.json"
)
commit = subprocess.check_output(
    ["git", "-C", "misp-galaxy", "rev-parse", "HEAD"], text=True
).strip()
(root / ".local" / "misp-clusters.json").write_text(
    json.dumps({"commit": commit, "files": files}, separators=(",", ":")),
    encoding="utf-8",
)
PY

PORT=${PORT:-8000}
echo "Open http://localhost:${PORT}/misp-threat-actor-explorer.html"
exec python3 -m http.server "$PORT" --bind "${HOST:-127.0.0.1}"
