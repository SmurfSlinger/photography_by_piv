# Admin

Private routes for booking inquiries, clients, and gallery share links.

## URLs

| Path | Purpose |
|------|---------|
| `/admin` | Dashboard |
| `/admin/login` | Password/token sign-in |
| `/admin/inquiries` | Inquiry list and workflow (newest first) |
| `/admin/clients` | Clients converted from inquiries (or added by hand) |
| `/admin/galleries` | Galleries, photo upload, status, and share links |

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

## Inquiry workflow

Usual path after a request:

1. **Contact** — reply, then check **Contacted**. The calendar stays locked until this is checked.
2. **Book a day** on the calendar. That holds the date (one booking per day), creates/links the client, and the dashboard calendar shows it as booked.
3. Open the client and create a gallery when you are ready to share photos.

**Manual path:** **Add without inquiry**, then book a day on the client page. Contacted is not required there.

**Canceled** frees the day. Reopen if it was a mistake, then book again.

The inquiry list is **collapsed by default**. Expand a row for contact details, the calendar, and notes. Flagged spam reasons still appear when the filter marked the request.

Inquiries saved **before** the spam migration have `spam_score` null; the admin list **recomputes** display-only assessment for those rows (IP rules still omitted).

Migration: `20250603220000_booking_inquiry_spam_assessment`

## Clients

`/admin/clients` is the directory of people you work with. Galleries attach to a client.

- **Usual path:** contact the inquiry, then book a day (creates and links the client)
- **Manual path:** **Add without inquiry**, then book a day on the client page (no contacted step)
- Open a client to edit details or start a gallery for them

## Client galleries

`/admin/galleries` is where galleries are created and photos are uploaded.

- Tap **New gallery** — choose an existing client, then title and URL slug. Always starts as Draft.
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
4. Optional: `npm run seed-example-inquiry` to add a sample wedding request.
5. Open an inquiry, check Contacted, then book a day. Or add a client without an inquiry and book from the client page. From the client, make a gallery and upload photos (requires R2).
6. View page source — no admin secret in HTML/JS.
7. Sign out — returns to login.

## Production deploy

1. Add `ADMIN_ACCESS_TOKEN` (or `ADMIN_PASSWORD`) to `/home/smurfslinger/photography_by_piv/.env`.
2. Deploy via existing CI/CD (build + restart).
3. Open `https://photographybypiv.com/admin/inquiries` over Tailscale or trusted network.
4. Optional: add a Cloudflare WAF rule or Access policy in front of `/admin/*` later.

Do not link `/admin` from the public homepage.
