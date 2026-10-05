#!/bin/bash

# Exit on error
set -e

echo "Step 1: Building the builder workspace..."
npm run build

echo "Step 2: Publishing to gh-pages branch..."
cd dist
if [ ! -d .git ]; then
    git init
    git branch -m gh-pages
fi
git add .
git commit -m "Deploy builder workspace" || true
echo "Success! Builder compiled in dist/ folder."
