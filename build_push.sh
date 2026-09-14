#!/bin/bash
set -e

REGISTRY="registry.acimisai.com"
APP_NAME="marketlens"
TAG="${1:-v1}"

echo "Building Backend for linux/amd64,linux/arm64..."
docker buildx build --platform linux/amd64,linux/arm64 \
  -t "${REGISTRY}/${APP_NAME}-backend:${TAG}" \
  --push ./backend

echo "Building Frontend for linux/amd64,linux/arm64..."
docker buildx build --platform linux/amd64,linux/arm64 \
  -t "${REGISTRY}/${APP_NAME}-frontend:${TAG}" \
  --push ./frontend

echo "Successfully built and pushed multi-platform images to ${REGISTRY} with tag ${TAG}!"
