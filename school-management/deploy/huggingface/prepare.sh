#!/bin/bash
# Assembles a Hugging Face Space folder from the backend source.
# Usage: bash deploy/huggingface/prepare.sh [output-dir]   (run from school-management/)
set -e
OUT=${1:-../school-hf-space}
SRC=$(cd "$(dirname "$0")/../.." && pwd)
rm -rf "$OUT" && mkdir -p "$OUT"
tar -C "$SRC" --exclude=./target --exclude='*/target' --exclude=./.env --exclude=./deploy -cf - . | tar -C "$OUT" -xf -
cp "$SRC/deploy/huggingface/Dockerfile" "$SRC/deploy/huggingface/start.sh" "$SRC/deploy/huggingface/README.md" "$OUT/"
echo "Space folder ready: $OUT"
