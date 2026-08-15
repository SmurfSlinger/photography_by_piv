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

`/admin/galleries` is where galleries are created and photos are uploaded.

- **New gallery** — title, client, optional email, and URL slug. Always starts as Draft.
- Open a gallery to **drop in photos** (stored in R2), set status, and create/revoke share links.
- Draft is unpublished only. After leaving Draft, switch between Active and Archived (cannot return to Draft).
- Share URLs are shown **once**; store them before leaving the page.

Photo files go to `galleries/{slug}/{filename}` in the private R2 bucket. Max 50 MB per file. Creating a share link requires `GALLERY_TOKEN_PEPPER`. Share URLs use `NEXT_PUBLIC_APP_URL`.

The CLI (`npm run register-gallery`) remains a fallback for photos that are already in R2.

## Local test

```bash
# Add ADMIN_ACCESS_TOKEN and SESSION_SECRET to .env
npm run dev
```

1. Open `/admin/inquiries` — should redirect to `/admin/login`.
2. Wrong password — stays on login with an error.
3. Correct token — lists inquiries newest first.
4. Open `/admin/galleries` — create a draft, open it, and upload photos (requires R2).
5. View page source — no admin secret in HTML/JS.
6. Sign out — returns to login.

## Production deploy

1. Add `ADMIN_ACCESS_TOKEN` (or `ADMIN_PASSWORD`) to `/home/smurfslinger/photography_by_piv/.env`.
2. Deploy via existing CI/CD (build + restart).
3. Open `https://photographybypiv.com/admin/inquiries` over Tailscale or trusted network.
4. Optional: add a Cloudflare WAF rule or Access policy in front of `/admin/*` later.

Do not link `/admin` from the public homepage.
