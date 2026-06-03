#!/usr/bin/env bash
# Remove orphaned Traefik (pre-k3s) still on :443 and ensure k3s Traefik is active.
# Run: sudo bash deploy/traefik-fix-443.sh
set -euo pipefail

echo "==> Traefik processes before cleanup"
pgrep -af '[t]raefik' || echo "(none)"

echo "==> Stopping orphaned Traefik (not managed by current k3s rollout)"
# PIDs from the old containerd shim (May 31) hold :443 without CRD updates
for pid in $(pgrep -f '^traefik traefik' 2>/dev/null || true); do
  kill "$pid" 2>/dev/null || kill -9 "$pid" 2>/dev/null || true
done
sleep 2

echo "==> Restarting k3s Traefik deployment"
if k3s kubectl get deployment traefik -n kube-system >/dev/null 2>&1; then
  k3s kubectl rollout restart deployment/traefik -n kube-system
elif k3s kubectl get daemonset traefik -n kube-system >/dev/null 2>&1; then
  k3s kubectl rollout restart daemonset/traefik -n kube-system
else
  echo "No traefik deployment/daemonset in kube-system; listing pods:"
  k3s kubectl get pods -n kube-system | grep -i traefik || true
fi

echo "==> Waiting for Traefik pod"
k3s kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=traefik -n kube-system --timeout=120s 2>/dev/null \
  || k3s kubectl wait --for=condition=ready pod -l app=traefik -n kube-system --timeout=120s 2>/dev/null \
  || sleep 15

echo "==> kube-system Traefik pods"
k3s kubectl get pods -n kube-system -o wide | grep -i traefik || true

echo "==> IngressRoute"
k3s kubectl get ingressroute photography-by-piv -n default 2>/dev/null || true

echo "==> Port 443 listeners"
ss -tlnp | grep ':443' || true

echo "==> Test backend from host"
curl -sf -m 3 http://127.0.0.1:3000/ >/dev/null && echo "127.0.0.1:3000 OK" || echo "127.0.0.1:3000 FAIL"
HOST_IP="$(hostname -I | awk '{print $1}')"
curl -sf -m 3 "http://${HOST_IP}:3000/" >/dev/null && echo "${HOST_IP}:3000 OK" || echo "${HOST_IP}:3000 FAIL"

echo "==> Test HTTPS via local SNI"
curl -sk --resolve "photographybypiv.com:443:127.0.0.1" https://photographybypiv.com/ -o /dev/null -w "local HTTPS status: %{http_code}\n" || true

echo "==> Test public HTTPS"
curl -sI --max-time 15 https://photographybypiv.com | head -5 || true

echo "Done."
