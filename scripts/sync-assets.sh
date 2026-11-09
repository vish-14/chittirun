#!/usr/bin/env bash
# Upload content-hashed game assets to the stage's S3 bucket (served via CloudFront).
# Usage: scripts/sync-assets.sh <bucket-name> [cloudfront-distribution-id]
set -euo pipefail
BUCKET="${1:?bucket name required}"
npm run assets:check
aws s3 sync public/assets "s3://${BUCKET}/assets" \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "*.json"
aws s3 sync public/assets "s3://${BUCKET}/assets" \
  --cache-control "public, max-age=31536000, immutable" \
  --content-type "application/json" --exclude "*" --include "*.json"
# Filenames are content-hashed, so invalidation is normally unnecessary.
if [[ -n "${2:-}" ]]; then aws cloudfront create-invalidation --distribution-id "$2" --paths "/assets/sprites/*" >/dev/null; fi
echo "Assets synced to s3://${BUCKET}/assets"
