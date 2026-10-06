#!/bin/bash
# Assembles a Hugging Face Space folder from the backend source.
# Usage: bash deploy/huggingface/prepare.sh [output-dir]   (run from school-management/)
set -e
OUT=${1:-../school-hf-space}
SRC=$(cd "$(dirname "$0")/../.." && pwd)
mkdir -p "$OUT"
find "$OUT" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
tar -C "$SRC" --exclude=./target --exclude='*/target' --exclude=./.env --exclude=./deploy -cf - . | tar -C "$OUT" -xf -
mkdir -p "$OUT/deploy/huggingface"
cp -r "$SRC/deploy/huggingface/." "$OUT/deploy/huggingface/"
cp "$SRC/deploy/huggingface/Dockerfile" "$SRC/deploy/huggingface/README.md" "$OUT/"
echo "Space folder ready: $OUT"
