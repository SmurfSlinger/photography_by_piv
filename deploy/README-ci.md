# GitHub Actions production deploy (self-hosted runner)

Deploys run **on the R310** via a [self-hosted runner](https://docs.github.com/en/actions/hosting-your-own-runners/managing-self-hosted-runners/about-self-hosted-runners). GitHub-hosted runners do not SSH into the machine (no public SSH or Tailscale exposure required for deploy).

Triggers: push to `master`, or manual **Deploy production** (`workflow_dispatch`).

Workflow: `.github/workflows/deploy-production.yml`  
Deploy script: `deploy/github-actions-deploy.sh`

## GitHub configuration

1. Repo **Settings → Actions → Runners → New self-hosted runner** (Linux x64).
2. Register the runner on R310 using the displayed `config.sh` commands and a one-time registration token.
3. Install and start the runner as a **systemd service** (see below).
4. No deploy-related repository secrets are required for this workflow.

Optional: add a custom runner label (e.g. `r310`) in `config.sh` and set `runs-on: [self-hosted, r310]` in the workflow if you add more runners later.

## One-time setup on R310

### 1. Self-hosted runner (as `smurfslinger` or a dedicated deploy user)

Use the same user that owns the app repo and `.env` (recommended: `smurfslinger`).

```bash
# Example layout (adjust version/path from GitHub’s “New runner” instructions)
mkdir -p ~/actions-runner && cd ~/actions-runner
# Download and extract the runner package from GitHub, then:
./config.sh --url https://github.com/SmurfSlinger/photography_by_piv --token <REGISTRATION_TOKEN>
# Optional: ./config.sh ... --labels r310

sudo ./svc.sh install
sudo ./svc.sh start
sudo ./svc.sh status
```

The runner must reach `github.com` (outbound HTTPS). Tailscale is fine; inbound SSH from the internet is not needed.

### 2. Production repo and deploy script

```bash
chmod +x /home/smurfslinger/photography_by_piv/deploy/github-actions-deploy.sh

cd /home/smurfslinger/photography_by_piv
git fetch origin master
```

Ensure `git pull` works for the runner user (credential helper, deploy key, or HTTPS token stored on the server — not in GitHub Actions secrets).

Remove any Turnstile **test** key exports from `~/.bashrc`, `~/.profile`, etc.

### 3. Narrow sudoers for systemd

As root (`visudo -f /etc/sudoers.d/photography-by-piv-deploy`):

```sudoers
smurfslinger ALL=(root) NOPASSWD: /bin/systemctl restart photography-by-piv, \
                                   /bin/systemctl is-active photography-by-piv, \
                                   /bin/systemctl status photography-by-piv
```

Replace `smurfslinger` if the runner uses a different account.

### 4. App secrets

`DATABASE_URL`, Turnstile, R2, SMTP, and other production values stay only in:

`/home/smurfslinger/photography_by_piv/.env`

Never commit `.env` or add these to GitHub Secrets for deploy.

## Build safety (Turnstile)

`github-actions-deploy.sh`:

- `unset NEXT_PUBLIC_TURNSTILE_SITE_KEY TURNSTILE_SECRET_KEY` before `source .env`
- `rm -rf .next` then `NODE_ENV=production npm run build`
- Fails if Cloudflare **test** site key prefix `1x00000000000000000000` appears under `.next/`

The workflow runs the script with `bash --norc --noprofile` so the runner’s login environment cannot override `.env` during build.

## Manual test (on R310)

```bash
bash --norc --noprofile /home/smurfslinger/photography_by_piv/deploy/github-actions-deploy.sh
```

This restarts `photography-by-piv` and runs smoke `curl`s — use only when you intend to deploy.

## Alternate approach (not used)

SSH from GitHub-hosted runners (`DEPLOY_SSH_HOST`, `DEPLOY_SSH_USER`, `DEPLOY_SSH_PRIVATE_KEY`) is possible but discouraged here because R310 is usually on Tailscale and public SSH is not desired.
