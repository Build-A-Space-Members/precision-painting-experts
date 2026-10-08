#!/usr/bin/env bash
# Vercel build entry used while the Vercel GitHub app is not installed on this repo:
# downloads the branch tarball from GitHub (public repo), then runs the normal build into dist/.
set -euo pipefail
REPO="${SOURCE_REPO:-Build-A-Space-Members/precision-painting-experts}"
REF="${SOURCE_REF:-claude/upbeat-wozniak-2pbgfn}"
echo "Fetching $REPO@$REF"
rm -rf .src && mkdir .src
curl -fsSL "https://codeload.github.com/$REPO/tar.gz/$REF" | tar xz -C .src --strip-components=1
for d in content src public assets api; do rm -rf "$d"; cp -R ".src/$d" "$d"; done
cp .src/package.json package.json
node src/build.js
