# Photography by Piv

Next.js marketing site plus private client galleries backed by PostgreSQL and Cloudflare R2.

## Marketing site (Phase 1A)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The home page includes the sticky marketing navbar; private gallery routes do not.

## Private galleries (Phase 1B)

### Prerequisites

- PostgreSQL database
- Private Cloudflare R2 bucket with photos at `galleries/{slug}/{filename}`
- Copy [`.env.example`](.env.example) to `.env` and fill in values

### Database setup

```bash
npm run db:deploy    # production (R310)
# or
npm run db:migrate   # local development
```

### Create a gallery

In `/admin/galleries` (after signing in): create a draft, upload photos, set it Active, then create a share link.

Photos are stored in R2 at `galleries/{slug}/{filename}`. Each file can be up to 50 MB.

### Register a gallery from existing R2 files (CLI fallback)

Edit a manifest (see [`scripts/seed/example.json`](scripts/seed/example.json)), then:

```bash
npm run register-gallery -- scripts/seed/example.json
```

This creates DB rows with `r2_key_original = galleries/{slug}/{filename}` and leaves `r2_key_thumb` / `r2_key_web` null.

### Create a client access link

```bash
npm run create-gallery-token -- your-gallery-slug "optional label"
```

Prints a one-time share URL: `https://yoursite.com/g/{slug}?t=...`

### Client flow

1. Client opens the share URL.
2. App validates the token and sets an httpOnly session cookie.
3. `/g/{slug}` loads photos via signed URLs (display uses `thumb ?? web ?? original`; MVP uses originals).
4. Download requests a short-lived signed URL for the original only.

### Register and share

- `/admin/galleries` — create galleries, upload photos, and create/revoke client share links (after signing in)
- `npm run register-gallery` — CLI fallback to create DB rows for existing R2 files
- `npm run create-gallery-token` — CLI fallback for share links

R2 secret keys and token peppers stay on the server; the browser only receives presigned URLs.

### Later

- Preprocess `thumbs/` and `web/` in R2 and backfill DB columns for better grid performance.

## Build

```bash
npm run build
npm start
```
