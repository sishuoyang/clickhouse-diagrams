#!/usr/bin/env bash
#
# deploy-aws.sh — host the static bundle (dist/) on Amazon S3 as a static website, using the AWS CLI.
#
# Creates/configures the bucket for public website hosting and uploads dist/ with sensible cache
# headers (content-hashed assets are immutable + long-cached; index.html and the layout JSON are
# no-cache so updates show immediately).
#
# Prereqs:  ./build-static.sh   (produces dist/),   AWS CLI configured (`aws configure` / SSO).
#
# Usage:
#   BUCKET=my-clickhouse-diagrams ./deploy-aws.sh
#   ./deploy-aws.sh my-clickhouse-diagrams
#
# Env vars:
#   BUCKET                      (required) target S3 bucket (globally unique)
#   REGION                      (default ap-southeast-1)
#   AWS_PROFILE                 (optional) defaults to 'sa'; set to override or "" to use the default
#   CLOUDFRONT_DISTRIBUTION_ID  (optional) invalidate this distribution after upload
set -euo pipefail
cd "$(dirname "$0")"

BUCKET="${1:-${BUCKET:-}}"
REGION="${REGION:-ap-southeast-1}"
# Default to the 'sa' SSO profile; export AWS_PROFILE to override (or AWS_PROFILE="" for the default).
export AWS_PROFILE="${AWS_PROFILE:-sa}"

[ -n "$BUCKET" ] || { echo "usage: BUCKET=<name> ./deploy-aws.sh   (or  ./deploy-aws.sh <name>)" >&2; exit 1; }
[ -d dist ] || { echo "✗ dist/ not found — run ./build-static.sh first." >&2; exit 1; }
command -v aws >/dev/null 2>&1 || { echo "✗ aws CLI not found. Install it and run 'aws configure'." >&2; exit 1; }

echo "› Target: s3://$BUCKET   region: $REGION${AWS_PROFILE:+   profile: $AWS_PROFILE}"

# 1. Create the bucket if it doesn't exist (us-east-1 must NOT send a LocationConstraint).
if ! aws s3api head-bucket --bucket "$BUCKET" >/dev/null 2>&1; then
  echo "› Creating bucket…"
  if [ "$REGION" = "us-east-1" ]; then
    aws s3api create-bucket --bucket "$BUCKET" --region "$REGION" >/dev/null
  else
    aws s3api create-bucket --bucket "$BUCKET" --region "$REGION" \
      --create-bucket-configuration LocationConstraint="$REGION" >/dev/null
  fi
fi

# 2. Allow public reads (required for S3 static website hosting).
echo "› Enabling public read access…"
aws s3api put-public-access-block --bucket "$BUCKET" \
  --public-access-block-configuration \
  "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

aws s3api put-bucket-policy --bucket "$BUCKET" --policy "$(cat <<JSON
{"Version":"2012-10-17","Statement":[{"Sid":"PublicReadGetObject","Effect":"Allow","Principal":"*","Action":"s3:GetObject","Resource":"arn:aws:s3:::$BUCKET/*"}]}
JSON
)"

# 3. Configure static website hosting (index + fallback document).
echo "› Configuring website hosting…"
aws s3api put-bucket-website --bucket "$BUCKET" \
  --website-configuration '{"IndexDocument":{"Suffix":"index.html"},"ErrorDocument":{"Key":"index.html"}}'

# 3b. (Re)bundle the saved layouts into dist/__layout — so the deployed site always reflects the
# CURRENT layouts/*.json, even if dist/ was built with plain `npm run build` (which skips this step).
if compgen -G "layouts/*.json" > /dev/null; then
  echo "› Bundling $(ls layouts/*.json | wc -l | tr -d ' ') saved layouts into dist/__layout/…"
  rm -rf dist/__layout
  mkdir -p dist/__layout
  for f in layouts/*.json; do cp "$f" "dist/__layout/$(basename "$f" .json)"; done
fi

# 4. Upload. Hashed assets are immutable; index.html + layout JSON must revalidate.
echo "› Uploading hashed assets…"
aws s3 sync dist/ "s3://$BUCKET/" --delete \
  --exclude "index.html" --exclude "__layout/*" \
  --cache-control "public,max-age=31536000,immutable"

echo "› Uploading index.html…"
aws s3 cp dist/index.html "s3://$BUCKET/index.html" \
  --content-type "text/html; charset=utf-8" --cache-control "no-cache"

if [ -d dist/__layout ]; then
  echo "› Uploading layouts (application/json)…"
  aws s3 sync dist/__layout/ "s3://$BUCKET/__layout/" --delete \
    --content-type "application/json" --cache-control "no-cache"
fi

# 5. Optional CloudFront invalidation.
if [ -n "${CLOUDFRONT_DISTRIBUTION_ID:-}" ]; then
  echo "› Invalidating CloudFront distribution $CLOUDFRONT_DISTRIBUTION_ID…"
  aws cloudfront create-invalidation --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" --paths "/*" >/dev/null
fi

echo
echo "✓ Deployed."
echo "  Website endpoint:  http://$BUCKET.s3-website-$REGION.amazonaws.com/"
echo "  (Some newer regions use the form  http://$BUCKET.s3-website.$REGION.amazonaws.com/ )"
echo "  S3 website endpoints are HTTP-only — front with CloudFront for HTTPS + a custom domain,"
echo "  then re-run with CLOUDFRONT_DISTRIBUTION_ID=<id> to invalidate the cache on each deploy."
