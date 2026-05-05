#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"
rm -rf test/tmp
mkdir -p test/tmp

run_action() {
  env \
    ACTION_PATH="$root" \
    GITHUB_WORKSPACE="$root" \
    INPUT_PACKAGE_VERSION="0.1.4" \
    "$@" \
    node src/run-action.mjs
}

run_action \
  INPUT_MODE="render" \
  INPUT_INPUT="examples/flowchart.mmd" \
  INPUT_OUTPUT_DIR="test/tmp/render" \
  INPUT_MANIFEST="test/tmp/render/render-manifest.json"

test -s test/tmp/render/flowchart.svg
test -s test/tmp/render/flowchart.jpg
test -s test/tmp/render/render-manifest.json

run_action \
  INPUT_MODE="source" \
  INPUT_SOURCE_DIR="examples/source" \
  INPUT_OUTPUT_DIR="test/tmp/source" \
  INPUT_MANIFEST="test/tmp/source/manifest.json" \
  INPUT_ARGS=$'--render-mode\nplaceholder'

test -s test/tmp/source/manifest.json
test -s test/tmp/source/INDEX.md
find test/tmp/source -name '*.mmd' -print -quit | grep -q .
find test/tmp/source -name '*.svg' -print -quit | grep -q .
find test/tmp/source -name '*.jpg' -print -quit | grep -q .

run_action \
  INPUT_MODE="policy" \
  INPUT_INPUT="examples/policy-valid.md"

cat > test/tmp/policy-invalid.md <<'BAD'
# Invalid

```mmd
flowchart TD
  A --> B
```
BAD

if run_action INPUT_MODE="policy" INPUT_INPUT="test/tmp/policy-invalid.md"; then
  echo "Expected policy mode to fail for invalid Markdown" >&2
  exit 1
fi

echo "OK: smoke tests passed"
