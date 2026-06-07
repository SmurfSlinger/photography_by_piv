#!/usr/bin/env bash
# Production deploy for GitHub Actions self-hosted runner on ubuntu-main.
# Requires: repo at REPO, .env on server, passwordless sudo for photography-piv systemctl.
set -euo pipefail

REPO="/home/smurfslinger/photography_by_piv"
cd "$REPO"

echo "==> Git: fetch and fast-forward master"
git fetch origin master
git checkout master
git pull --ff-only origin master

DEPS_CACHE_DIR="${REPO}/.deploy-cache"
DEPS_HASH_FILE="${DEPS_CACHE_DIR}/deps.sha256"
mkdir -p "${DEPS_CACHE_DIR}"
CURRENT_DEPS_HASH="$(
  sha256sum package.json package-lock.json | sha256sum | awk '{print $1}'
)"
PREVIOUS_DEPS_HASH="$(cat "${DEPS_HASH_FILE}" 2>/dev/null || true)"

echo "==> Dependencies"
if [ ! -d node_modules ] || [ "${CURRENT_DEPS_HASH}" != "${PREVIOUS_DEPS_HASH}" ]; then
  if [ ! -d node_modules ]; then
    echo "    node_modules missing — running npm ci"
  else
    echo "    package.json or package-lock.json changed — running npm ci"
  fi
  npm ci
  echo "${CURRENT_DEPS_HASH}" > "${DEPS_HASH_FILE}"
else
  echo "    Unchanged (sha256 ${CURRENT_DEPS_HASH}); skipping npm ci"
  echo "    Prisma client will refresh during npm run build"
fi

echo "==> Load production .env (clear inherited Turnstile test keys first)"
unset NEXT_PUBLIC_TURNSTILE_SITE_KEY TURNSTILE_SECRET_KEY
set -a
# shellcheck disable=SC1091
source "${REPO}/.env"
set +a

echo "==> Database migrations"
npm run db:deploy

NEXT_CACHE_STAGING="/tmp/pbp-next-cache"

echo "==> Preserve Next build cache (optional, speeds up build)"
rm -rf "${NEXT_CACHE_STAGING}"
if [ -d .next/cache ]; then
  if mkdir -p "${NEXT_CACHE_STAGING}" && cp -a .next/cache "${NEXT_CACHE_STAGING}/cache"; then
    echo "    Saved .next/cache to ${NEXT_CACHE_STAGING}"
  else
    echo "WARN: Could not preserve .next/cache — continuing with cold build"
    rm -rf "${NEXT_CACHE_STAGING}"
  fi
else
  echo "    No .next/cache present (cold build)"
fi

echo "==> Clean build output"
rm -rf .next

echo "==> Restore Next build cache"
if [ -d "${NEXT_CACHE_STAGING}/cache" ]; then
  if mkdir -p .next && cp -a "${NEXT_CACHE_STAGING}/cache" .next/cache; then
    echo "    Restored .next/cache"
  else
    echo "WARN: Could not restore .next/cache — continuing with cold build"
  fi
  rm -rf "${NEXT_CACHE_STAGING}"
else
  echo "    Nothing to restore"
fi

echo "==> Production build"
export NODE_ENV=production
npm run build

echo "==> Verify Turnstile test site key is not baked into client bundle"
if grep -R -F -q '1x00000000000000000000' .next/; then
  echo "ERROR: Cloudflare Turnstile TEST site key found in .next — aborting deploy"
  exit 1
fi

echo "==> Restart photography-piv"
sudo /usr/bin/systemctl restart photography-piv
sleep 3
sudo /usr/bin/systemctl is-active --quiet photography-piv

echo "==> Smoke tests (localhost and Caddy origin)"
curl -sf --max-time 10 http://127.0.0.1:3003/ >/dev/null
curl -skf --max-time 15 --resolve 'photographybypiv.com:443:127.0.0.1' \
  https://photographybypiv.com/ -o /dev/null

echo "==> Smoke tests (public)"
curl -sfI --max-time 30 https://photographybypiv.com | head -1
curl -sfI --max-time 30 https://photographybypiv.com/book | head -1

echo "Deploy finished successfully."
