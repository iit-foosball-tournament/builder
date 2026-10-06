#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
cd -- "$SCRIPT_DIR"
# Vite's DEBUG=vite:env logs resolved environment variables, including public keys.
unset DEBUG

expected_origin='https://github.com/iit-foosball-tournament/builder.git'
if [ "$(git rev-parse --show-toplevel)" != "$SCRIPT_DIR" ] ||
   [ "$(git remote get-url origin)" != "$expected_origin" ] ||
   [ "$(git remote get-url --push origin)" != "$expected_origin" ]; then
    echo 'Refusing to deploy: builder must be the expected git repository and origin.' >&2
    exit 1
fi
if [ -L dist ]; then
    echo 'Refusing to deploy: dist must not be a symlink.' >&2
    exit 1
fi
node scripts/check-cloud-config.mjs

echo "Step 1: Building the builder workspace..."
VITE_BUILDER=true npm run build

if [ -L dist ] || [ ! -d dist ] || [ "$(realpath -e -- dist)" != "$SCRIPT_DIR/dist" ]; then
    echo 'Refusing to deploy: dist is not a local directory.' >&2
    exit 1
fi

echo "Step 2: Publishing to gh-pages branch on iit-foosball-tournament/builder..."
cd dist
rm -rf -- .git
git init
git branch -m gh-pages
git remote add origin "$expected_origin"
git add .
git commit -m "Deploy builder workspace"
git push -f origin gh-pages

echo "Success! Builder pushed to gh-pages branch."
