#!/usr/bin/env bash
# One-time setup: GitHub Actions self-hosted runner on ubuntu-main.
# Usage:
#   export GITHUB_RUNNER_TOKEN='<registration token from GitHub UI>'
#   bash deploy/setup-ubuntu-main-runner.sh
set -euo pipefail

RUNNER_ROOT="/home/smurfslinger/actions-runner-photography_by_piv"
REPO_URL="https://github.com/SmurfSlinger/photography_by_piv"
RUNNER_VERSION="2.334.0"
RUNNER_TARBALL="actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz"
SOURCE_TARBALL="/home/smurfslinger/photography_by_piv/actions-runner/${RUNNER_TARBALL}"

if [ -z "${GITHUB_RUNNER_TOKEN:-}" ]; then
  echo "ERROR: Set GITHUB_RUNNER_TOKEN to the one-time registration token from:"
  echo "  GitHub → Settings → Actions → Runners → New self-hosted runner"
  exit 1
fi

mkdir -p "${RUNNER_ROOT}"
cd "${RUNNER_ROOT}"

if [ ! -f config.sh ]; then
  echo "==> Extracting actions-runner ${RUNNER_VERSION}"
  if [ -f "${SOURCE_TARBALL}" ]; then
    cp "${SOURCE_TARBALL}" "${RUNNER_TARBALL}"
  else
    curl -fsSL -o "${RUNNER_TARBALL}" \
      "https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/${RUNNER_TARBALL}"
  fi
  tar xzf "${RUNNER_TARBALL}"
  rm -f "${RUNNER_TARBALL}"
fi

echo "==> Configure runner (ubuntu-main)"
./config.sh --unattended \
  --url "${REPO_URL}" \
  --token "${GITHUB_RUNNER_TOKEN}" \
  --name ubuntu-main \
  --labels self-hosted,linux,x64,ubuntu-main,photography-piv \
  --replace \
  --work _work

echo "==> Install systemd service (requires sudo)"
sudo ./svc.sh install smurfslinger
sudo ./svc.sh start

echo "==> Runner status"
sudo ./svc.sh status

echo "Runner setup complete at ${RUNNER_ROOT}"
