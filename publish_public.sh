#!/bin/bash

# Exit on error
set -e

PUBLIC_REPO_PATH=${1:-"../iit-foosball-tournament.github.io"}

if [ -z "$PUBLIC_REPO_PATH" ]; then
    echo "Usage: ./publish_public.sh <path_to_local_public_repo_clone>"
    echo "Example: ./publish_public.sh ../iit-foosball-tournament.github.io"
    exit 1
fi

if [ ! -d "$PUBLIC_REPO_PATH" ]; then
    echo "Creating target directory '$PUBLIC_REPO_PATH'..."
    mkdir -p "$PUBLIC_REPO_PATH"
fi

echo "Step 1: Building the application in Public Website mode..."
VITE_BUILDER=false npm run build

echo "Step 2: Cleaning the target directory (preserving .git and local data/)..."
find "$PUBLIC_REPO_PATH" -mindepth 1 -maxdepth 1 -not -name ".git" -not -name "data" -not -name "README.md" -exec rm -rf {} +

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
