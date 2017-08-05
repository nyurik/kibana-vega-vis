#!/bin/bash
set -e

mkdir -p buildall

function build {
    npm run build -- -k $1
    for old in build/vega_vis-*; do
      echo
      new=$(echo $old | sed -e "s/^build\/vega_vis-/buildall\/vega_vis--$1--/")
      mv -v "$old" "$new"
    done
}

build 5.5.0
build 5.5.1
