#!/bin/bash

npm run build && git checkout master && cp -rf ./dist/* ./