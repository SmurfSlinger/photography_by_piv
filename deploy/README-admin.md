# Admin

Private routes for booking inquiries and client gallery share links.

## URLs

| Path | Purpose |
|------|---------|
| `/admin` | Dashboard (summary + navigation) |
| `/admin/login` | Password/token sign-in |
| `/admin/inquiries` | Inquiry list and workflow (newest first) |
| `/admin/galleries` | Registered galleries, status, and share links |

Pages use `robots: noindex` metadata. Admin secrets are never sent to the browser as `NEXT_PUBLIC_*`.

## Server environment

On the R310 `.env` (not committed), set **one** of:

- `ADMIN_ACCESS_TOKEN` — preferred name for a long random secret
- `ADMIN_PASSWORD` — alternative name (same behavior)

Also required (already used for gallery sessions):

- `SESSION_SECRET` — signs the httpOnly `admin_session` cookie after login

See `.env.example` for variable names only.

Generate a token locally:

```bash
openssl rand -base64 32
```

## Spam / scam display

New inquiries store `spamScore`, `spamReasons`, and `spamFlagged` at submission time (same assessment as notification email). The dashboard counts flagged rows from `spamFlagged`.

Inquiries saved **before** the spam migration have `spam_score` null; the admin list **recomputes** display-only assessment for those rows (IP rules still omitted).

Migration: `20250603220000_booking_inquiry_spam_assessment`

The inquiry list is **collapsed by default** (native `<details>` rows). Tap a row to expand full contact info, message, and spam details.

## Client galleries

`/admin/galleries` lists galleries already registered (CLI `register-gallery`). From a row you can:

- Change status (`draft` / `active` / `archived`)
- Create a client share URL (shown **once**; store it before leaving the page)
- Revoke existing links

Photo upload to R2 is still CLI-only. Creating a share link requires `GALLERY_TOKEN_PEPPER` (same as gallery sessions). Share URLs use `NEXT_PUBLIC_APP_URL`.

## Local test

```bash
# Add ADMIN_ACCESS_TOKEN and SESSION_SECRET to .env
npm run dev
```

1. Open `/admin/inquiries` — should redirect to `/admin/login`.
2. Wrong password — stays on login with an error.
3. Correct token — lists inquiries newest first.
4. Open `/admin/galleries` — lists registered galleries (or an empty state).
5. View page source — no admin secret in HTML/JS.
6. Sign out — returns to login.

## Production deploy

1. Add `ADMIN_ACCESS_TOKEN` (or `ADMIN_PASSWORD`) to `/home/smurfslinger/photography_by_piv/.env`.
2. Deploy via existing CI/CD (build + restart).
3. Open `https://photographybypiv.com/admin/inquiries` over Tailscale or trusted network.
4. Optional: add a Cloudflare WAF rule or Access policy in front of `/admin/*` later.

Do not link `/admin` from the public homepage.
