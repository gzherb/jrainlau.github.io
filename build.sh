#!/bin/bash

npm run build

git checkout master

cp -rf ./dist/* ./

git add .
git commit -m "build"
git push