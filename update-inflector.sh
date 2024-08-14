#!/bin/bash

# updates all necessary package.json files in this monorepo with the latest given version for pashto inflector

version=$1

if [ $# -eq 0 ]
  then
    version=$(npm show @lingdocs/ps-react version)
fi

# update all instances of @lingdocs/inflect and @lingdocs/ps-react in various package.json files
# in types etc.
tmp=$(mktemp)
echo $tmp
jq --arg version "$version" '.dependencies."@lingdocs/ps-react"=$version' "package.json" > "$tmp" && mv "$tmp" "package.json"
# in website
tmp=$(mktemp)
echo $tmp
jq --arg version "$version" '.dependencies."@lingdocs/ps-react"=$version' "website/package.json" > "$tmp" && mv "$tmp" "website/package.json"
# in functions
tmp=$(mktemp)
jq --arg version "$version" '.dependencies."@lingdocs/inflect"=$version' "functions/package.json" > "$tmp" && mv "$tmp" "functions/package.json"
# in account
tmp=$(mktemp)
jq --arg version "$version" '.dependencies."@lingdocs/inflect"=$version' "account/package.json" > "$tmp" && mv "$tmp" "account/package.json"

# install to update .lock files
cd website &&
npm install &&
cd ../functions &&
npm install &&
cd ../account &&
npm install

