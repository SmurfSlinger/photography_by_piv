# GitHub Actions production deploy (self-hosted runner)

Deploys run **on ubuntu-main** via a [self-hosted runner](https://docs.github.com/en/actions/hosting-your-own-runners/managing-self-hosted-runners/about-self-hosted-runners). GitHub-hosted runners do not SSH into the machine (no public SSH or Tailscale exposure required for deploy).

Triggers: push to `master`, or manual **Deploy production** (`workflow_dispatch`).

Workflow: `.github/workflows/deploy.yml`  
Deploy script: `deploy/github-actions-deploy.sh`

## GitHub configuration

1. Repo **Settings → Actions → Runners → New self-hosted runner** (Linux x64).
2. Register the runner on ubuntu-main using `deploy/setup-ubuntu-main-runner.sh` and a one-time registration token.
3. Install and start the runner as a **systemd service** (the setup script does this).
4. No deploy-related repository secrets are required for this workflow.

Runner labels: `self-hosted`, `linux`, `x64`, `ubuntu-main`, `photography-piv`

## One-time setup on ubuntu-main

### 1. Self-hosted runner (as `smurfslinger`)

```bash
export GITHUB_RUNNER_TOKEN='<registration token from GitHub UI>'
bash /home/smurfslinger/photography_by_piv/deploy/setup-ubuntu-main-runner.sh
```

Runner install path: `/home/smurfslinger/actions-runner-photography_by_piv`

### 2. Narrow sudoers for systemd

```bash
sudo cp /home/smurfslinger/photography_by_piv/deploy/github-actions-sudoers \
  /etc/sudoers.d/github-actions-photography-piv
sudo chmod 0440 /etc/sudoers.d/github-actions-photography-piv
sudo visudo -c -f /etc/sudoers.d/github-actions-photography-piv
```

Allows only `systemctl restart|status|is-active photography-piv` for `smurfslinger`.

### 3. Production repo and deploy script

```bash
chmod +x /home/smurfslinger/photography_by_piv/deploy/github-actions-deploy.sh
```

Ensure `git pull` works for the runner user. Remove any Turnstile **test** key exports from `~/.bashrc`, `~/.profile`, etc.

### 4. App secrets

`DATABASE_URL`, Turnstile, R2, SMTP, and other production values stay only in:

`/home/smurfslinger/photography_by_piv/.env`

Never commit `.env` or add these to GitHub Secrets for deploy.

## Production topology (ubuntu-main)

- App: `photography-piv.service` → `127.0.0.1:3003`
- Edge: Caddy :443 → `127.0.0.1:3003`
- Database: Docker `piv-postgres` on `127.0.0.1:5432`

## Deploy caching

`github-actions-deploy.sh` keeps local state under `.deploy-cache/` (not committed).

**Dependencies:** Compares sha256 of `package.json` + `package-lock.json` to `.deploy-cache/deps.sha256`. Runs `npm ci` only when `node_modules` is missing or the hash changed.

**Next build:** Preserves `.next/cache` via `/tmp/pbp-next-cache`, deletes `.next`, restores cache, then builds.

## Build safety (Turnstile)

- `unset NEXT_PUBLIC_TURNSTILE_SITE_KEY TURNSTILE_SECRET_KEY` before `source .env`
- `NODE_ENV=production npm run build`
- Fails if Cloudflare **test** site key prefix `1x00000000000000000000` appears under `.next/`

The workflow runs the script with `bash --norc --noprofile`.

## Manual test

```bash
bash --norc --noprofile /home/smurfslinger/photography_by_piv/deploy/github-actions-deploy.sh
```

This restarts `photography-piv` and runs smoke `curl`s — use only when you intend to deploy.
