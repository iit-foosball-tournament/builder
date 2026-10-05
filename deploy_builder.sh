#!/bin/bash
set -e

echo "Step 1: Building the builder workspace..."
VITE_BUILDER=true npm run build

echo "Step 2: Publishing to gh-pages branch on iit-foosball-tournament/builder..."
cd dist
rm -rf .git
git init
git branch -m gh-pages
git remote add origin https://github.com/iit-foosball-tournament/builder.git
git add .
git commit -m "Deploy builder workspace"
git push -f origin gh-pages

echo "Success! Builder pushed to gh-pages branch."
