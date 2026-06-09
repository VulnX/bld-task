#!/bin/bash

set -e

npm install

docker build -t bld-chromium-head -f docker/Dockerfile ./docker

npm run dev
