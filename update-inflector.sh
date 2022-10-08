#!/bin/bash

# updates all necessary package.json files in this monorepo with the given version for pashto inflector

if [ $# -eq 0 ]
  then
    echo "Script to update the version of @lingdocs/ps-react and @lingdocs/inflect across this monorepo"
    echo ""
    echo "usage: ./update-inlector.sh [version]"
    exit 0
fi

version=$1

# update all instances of @lingdocs/inflect and @lingdocs/ps-react in various package.json files
# in website
tmp=$(mktemp)
echo $tmp
jq --arg version "$version" '.dependencies."@lingdocs/ps-react"=$version' "website/package.json" > "$tmp" && mv "$tmp" "website/package.json"
# in functions
tmp=$(mktemp)
jq --arg version "$version" '.dependencies."@lingdocs/inflect"=$version' "functions/package.json" > "$tmp" && mv "$tmp" "functions/package.json"

# install to update .lock files
cd website &&
yarn install --legacy-peer-deps &&
cd ../functions &&
npm install

