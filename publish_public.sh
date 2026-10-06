#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
cd -- "$SCRIPT_DIR"
# Vite's DEBUG=vite:env logs resolved environment variables, including public keys.
unset DEBUG

PUBLIC_REPO_PATH=${1:-"../iit-foosball-tournament.github.io"}
if [ ! -d "$PUBLIC_REPO_PATH" ]; then
    echo 'Refusing to publish: target must be an existing git repository.' >&2
    exit 1
fi
PUBLIC_REPO_PATH="$(realpath -e -- "$PUBLIC_REPO_PATH")"

# Do not let a typo delete the builder, its parent, or a nested repository.
case "$SCRIPT_DIR/" in
    "$PUBLIC_REPO_PATH/"* )
        echo 'Refusing to publish into an ancestor of the builder.' >&2
        exit 1 ;;
esac
case "$PUBLIC_REPO_PATH/" in
    "$SCRIPT_DIR/"* )
        echo 'Refusing to publish into the builder.' >&2
        exit 1 ;;
esac

expected_origin='https://github.com/iit-foosball-tournament/iit-foosball-tournament.github.io'
repo_root="$(git -C "$PUBLIC_REPO_PATH" rev-parse --show-toplevel 2>/dev/null)" || {
    echo 'Refusing to publish: target is not a git repository.' >&2
    exit 1
}
repo_root="$(realpath -e -- "$repo_root")"
origin="$(git -C "$PUBLIC_REPO_PATH" remote get-url origin 2>/dev/null)" || {
    echo 'Refusing to publish: target has no origin.' >&2
    exit 1
}
push_origin="$(git -C "$PUBLIC_REPO_PATH" remote get-url --push origin 2>/dev/null)" || {
    echo 'Refusing to publish: target has no push origin.' >&2
    exit 1
}
if [ "$repo_root" != "$PUBLIC_REPO_PATH" ] ||
   { [ "$origin" != "$expected_origin" ] && [ "$origin" != "$expected_origin.git" ]; } ||
   { [ "$push_origin" != "$expected_origin" ] && [ "$push_origin" != "$expected_origin.git" ]; }; then
    echo 'Refusing to publish: target must be the expected public git repository and origin.' >&2
    exit 1
fi
check_target_clean() {
    if [ -L "$PUBLIC_REPO_PATH/.git" ] || [ -L "$PUBLIC_REPO_PATH/data" ] ||
       [ -n "$(git -C "$PUBLIC_REPO_PATH" status --porcelain=v1 --untracked-files=all)" ]; then
        echo 'Refusing to publish: target has unsafe symlinks or uncommitted/untracked changes.' >&2
        exit 1
    fi
}
check_target_clean
node scripts/check-cloud-config.mjs

echo "Step 1: Building the application in Public Website mode..."
VITE_BUILDER=false npm run build

# Recheck just before any removal; never copy from a redirected build output.
check_target_clean
if [ -L dist ] || [ ! -d dist ] || [ "$(realpath -e -- dist)" != "$SCRIPT_DIR/dist" ]; then
    echo 'Refusing to publish: dist is not a local directory.' >&2
    exit 1
fi

echo "Step 2: Cleaning the target directory (preserving .git and local data/)..."
find "$PUBLIC_REPO_PATH" -mindepth 1 -maxdepth 1 -not -name ".git" -not -name "data" -not -name "README.md" -exec rm -rf -- {} +

echo "Step 3: Copying compiled static files to target directory..."
cp -R dist/* "$PUBLIC_REPO_PATH"/

# Ensure data/ directory exists and has data.json
mkdir -p "$PUBLIC_REPO_PATH"/data
if [ -f "public/data/data.json" ]; then
    cp -u public/data/data.json "$PUBLIC_REPO_PATH"/data/data.json
fi

echo ""
echo "✅ Fatto! Il sito pubblico è stato compilato e copiato in: $PUBLIC_REPO_PATH"
echo "Per pubblicare online le modifiche su GitHub Pages, esegui:"
echo "  cd $PUBLIC_REPO_PATH"
echo "  git add ."
echo "  git commit -m \"Aggiornamento torneo\""
echo "  git push origin main"
