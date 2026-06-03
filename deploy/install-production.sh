#!/usr/bin/env bash
# Install Photography by Piv production service + Apache vhost on R310.
# Run: sudo bash deploy/install-production.sh
set -euo pipefail

REPO="/home/smurfslinger/photography_by_piv"
cd "$REPO"

echo "==> Stopping anything on port 3000"
systemctl stop photography-by-piv 2>/dev/null || true
lsof -ti :3000 2>/dev/null | xargs -r kill -9 2>/dev/null || true
pkill -9 -f "next start.*127.0.0.1" 2>/dev/null || true
sleep 2

echo "==> Installing systemd unit (ExecStartPre frees port 3000)"
install -m 0644 "$REPO/deploy/photography-by-piv.service" /etc/systemd/system/photography-by-piv.service
systemctl daemon-reload
systemctl enable photography-by-piv
systemctl restart photography-by-piv

echo "==> Enabling Apache modules"
a2enmod proxy proxy_http headers ssl rewrite

echo "==> Installing Apache vhost"
cp "$REPO/deploy/photographybypiv.com.conf" /etc/apache2/sites-available/photographybypiv.com.conf
a2ensite photographybypiv.com.conf

echo "==> Testing Apache config"
apache2ctl configtest

echo "==> Reloading Apache"
systemctl reload apache2

echo "==> Service status"
systemctl status photography-by-piv --no-pager || true

echo "Done."
