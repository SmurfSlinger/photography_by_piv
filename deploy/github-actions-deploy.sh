#!/usr/bin/env bash
# Production deploy for GitHub Actions self-hosted runner on R310.
# Requires: repo at REPO, .env on server, passwordless sudo for photography-by-piv systemctl.
set -euo pipefail

REPO="/home/smurfslinger/photography_by_piv"
cd "$REPO"

echo "==> Git: fetch and fast-forward master"
git fetch origin master
git checkout master
git pull --ff-only origin master

echo "==> npm ci"
npm ci

echo "==> Load production .env (clear inherited Turnstile test keys first)"
unset NEXT_PUBLIC_TURNSTILE_SITE_KEY TURNSTILE_SECRET_KEY
set -a
# shellcheck disable=SC1091
source "${REPO}/.env"
set +a

echo "==> Database migrations"
npm run db:deploy

echo "==> Clean build output"
rm -rf .next

echo "==> Production build"
export NODE_ENV=production
npm run build

echo "==> Verify Turnstile test site key is not baked into client bundle"
if grep -R -F -q '1x00000000000000000000' .next/; then
  echo "ERROR: Cloudflare Turnstile TEST site key found in .next — aborting deploy"
  exit 1
fi

echo "==> Restart photography-by-piv"
sudo systemctl restart photography-by-piv
sleep 3
sudo systemctl is-active --quiet photography-by-piv

echo "==> Smoke tests (localhost and Caddy origin)"
curl -sf --max-time 10 http://127.0.0.1:3000/ >/dev/null
curl -skf --max-time 15 --resolve 'photographybypiv.com:443:127.0.0.1' \
  https://photographybypiv.com/ -o /dev/null

echo "==> Smoke tests (public)"
curl -sfI --max-time 30 https://photographybypiv.com | head -1
curl -sfI --max-time 30 https://photographybypiv.com/book | head -1

echo "Deploy finished successfully."
