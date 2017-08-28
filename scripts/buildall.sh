#!/bin/bash
set -e

mkdir -p buildall

function build {
    npm run build -- -k $1
    for old in build/vega_vis-*; do
      new=$(echo $old | sed -E "s/(^build)(\/vega_vis-.+)\.zip$/buildall\2--for-Kibana-$1.zip/")
      mv -v "$old" "$new"
    done
}

build 5.5.0
build 5.5.1
build 5.5.2
