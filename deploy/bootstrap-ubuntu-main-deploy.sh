#!/usr/bin/env bash
# One-time bootstrap: sudoers + runner service + optional re-registration.
# Run on ubuntu-main with sudo access.
set -euo pipefail

REPO="/home/smurfslinger/photography_by_piv"
RUNNER_ROOT="/home/smurfslinger/actions-runner-photography_by_piv"

echo "==> Install sudoers for photography-piv deploy"
sudo cp "${REPO}/deploy/github-actions-sudoers" /etc/sudoers.d/github-actions-photography-piv
sudo chmod 0440 /etc/sudoers.d/github-actions-photography-piv
sudo visudo -c -f /etc/sudoers.d/github-actions-photography-piv

if [ -n "${GITHUB_RUNNER_TOKEN:-}" ]; then
  echo "==> Re-register runner with ubuntu-main labels"
  bash "${REPO}/deploy/setup-ubuntu-main-runner.sh"
elif [ -d "${RUNNER_ROOT}" ] && [ -f "${RUNNER_ROOT}/svc.sh" ]; then
  echo "==> Install existing runner as systemd service"
  cd "${RUNNER_ROOT}"
  sudo ./svc.sh install smurfslinger
  sudo ./svc.sh start
  sudo ./svc.sh status
else
  echo "WARN: Set GITHUB_RUNNER_TOKEN to register a new runner, or copy runner files to ${RUNNER_ROOT}"
fi

echo "Bootstrap complete."
