# Photography by Piv — production routing

## Live path

```
Cloudflare → Caddy :443 → 127.0.0.1:3000 → photography-by-piv (Next.js)
```

- **Edge:** Caddy on the host (`/etc/caddy/Caddyfile`) serves `photographybypiv.com` and `www.photographybypiv.com` with TLS and `reverse_proxy 127.0.0.1:3000`.
- **App:** `photography-by-piv.service` runs `next start` bound to **127.0.0.1:3000** (not exposed on the LAN).

## Legacy paths (do not use for PBP)

These repo artifacts reflect older setups and are **not** the live public stack:

| Artifact | Former path |
|----------|----------------|
| `deploy/k8s/photography-by-piv.yaml`, `traefik-apply.sh`, `traefik-fix-443.sh` | k3s Traefik → host :3000 |
| `deploy/photographybypiv.com.conf`, `install-production.sh` | Apache :443 → 127.0.0.1:3000 |

**Do not re-enable k3s or Apache on ports 80/443** for PBP without coordinating Caddy—only one service should own the public HTTPS listeners.

## Apply systemd unit changes

After updating `deploy/photography-by-piv.service` in the repo:

```bash
sudo install -m 0644 deploy/photography-by-piv.service /etc/systemd/system/photography-by-piv.service
sudo systemctl daemon-reload
sudo systemctl restart photography-by-piv
```

Verify:

```bash
ss -tln | grep ':3000'    # expect 127.0.0.1:3000
curl -sI http://127.0.0.1:3000/ | head -5
curl -sk --resolve 'photographybypiv.com:443:127.0.0.1' -sI https://photographybypiv.com/ | head -5
```

Caddy config is unchanged; no Caddy restart is required for the bind change alone.
