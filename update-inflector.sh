#!/bin/bash

# updates all necessary package.json files in this monorepo with the given version for @lingdocs/pashto-inflector

if [ $# -eq 0 ]
  then
    echo "Script to update the version of @lingdocs/pashto-inflector across this monorepo"
    echo ""
    echo "usage: ./update-inlector.sh [version]"
    exit 0
fi

version=$1

# update all instances of @lingdocs/pashto-inflector in various package.json files
declare -a pjs=("package.json" "website/package.json" "functions/package.json")
for i in "${pjs[@]}"
do
	tmp=$(mktemp)
	jq --arg version "$version" '.dependencies."@lingdocs/pashto-inflector"=$version' $i > "$tmp" && mv "$tmp" "$i"
	jq --arg version "$version" '.peerDependencies."@lingdocs/pashto-inflector"=$version' $i > "$tmp" && mv "$tmp" "$i"
done

# install to update .lock files
npm install &&
cd website &&
yarn install &&
cd ../functions &&
npm install

