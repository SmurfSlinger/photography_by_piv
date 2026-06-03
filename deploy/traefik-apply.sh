#!/usr/bin/env bash
# Wire photographybypiv.com through k3s Traefik → http://HOST:3000
# Requires: sudo (k3s API + kubectl apply)
set -euo pipefail

REPO="/home/smurfslinger/photography_by_piv"
HOST_IP="$(hostname -I | awk '{print $1}')"

if [[ -z "${HOST_IP}" ]]; then
  echo "Could not determine host IP for Endpoints"
  exit 1
fi

echo "==> Host IP for Traefik backend: ${HOST_IP}"

echo "==> Installing systemd unit (bind 0.0.0.0:3000 for k3s Traefik)"
install -m 0644 "${REPO}/deploy/photography-by-piv.service" /etc/systemd/system/photography-by-piv.service
systemctl daemon-reload
systemctl restart photography-by-piv
sleep 3

if ! systemctl is-active photography-by-piv >/dev/null; then
  echo "photography-by-piv failed to start:"
  systemctl status photography-by-piv --no-pager | tail -15
  exit 1
fi

if ! curl -sf -m 3 "http://127.0.0.1:3000/" >/dev/null; then
  echo "App not reachable at http://127.0.0.1:3000"
  exit 1
fi

if ! curl -sf -m 3 "http://${HOST_IP}:3000/" >/dev/null; then
  echo "App not reachable at http://${HOST_IP}:3000 (needed for k3s Traefik Endpoints)"
  exit 1
fi

echo "==> App reachable on 127.0.0.1:3000 and ${HOST_IP}:3000"

echo "==> Starting k3s (Traefik ingress controller)"
systemctl start k3s

echo "==> Removing orphaned Traefik from before k3s (stale :443 handler)"
for pid in $(pgrep -f '^traefik traefik' 2>/dev/null || true); do
  kill "$pid" 2>/dev/null || kill -9 "$pid" 2>/dev/null || true
done
sleep 2
echo "==> Waiting for Kubernetes API..."
for i in $(seq 1 60); do
  if k3s kubectl get nodes >/dev/null 2>&1; then
    break
  fi
  sleep 2
done
k3s kubectl get nodes

echo "==> Waiting for Traefik CRDs..."
for i in $(seq 1 30); do
  if k3s kubectl get crd ingressroutes.traefik.io >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

echo "==> Applying IngressRoute + Service + Endpoints"
sed "s/__HOST_IP__/${HOST_IP}/g" "${REPO}/deploy/k8s/photography-by-piv.yaml" \
  | k3s kubectl apply -f -

echo "==> IngressRoute status"
k3s kubectl get ingressroute photography-by-piv -n default -o wide 2>/dev/null || true
k3s kubectl describe ingressroute photography-by-piv -n default 2>/dev/null | tail -20 || true

echo "==> Restarting k3s Traefik to pick up routes and bind :443"
if k3s kubectl get deployment traefik -n kube-system >/dev/null 2>&1; then
  k3s kubectl rollout restart deployment/traefik -n kube-system
  k3s kubectl rollout status deployment/traefik -n kube-system --timeout=120s || true
fi

echo "Done. If HTTPS still 404, run: sudo bash deploy/traefik-fix-443.sh"
