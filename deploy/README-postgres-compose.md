# Adopt `piv-postgres` with Docker Compose

Replaces the manually created container with `docker-compose.yml` while keeping the existing **`piv_postgres_data`** volume. No data migration inside Postgres is required if env vars match the initialized cluster.

## Prerequisites

- Existing volume: `piv_postgres_data` (external in compose)
- Running container today: `piv-postgres` (`postgres:16`)
- App `DATABASE_URL` in `/home/smurfslinger/photography_by_piv/.env` should keep using host `localhost:5432`

## 1. Create `.env.postgres` on the server (not committed)

Capture `POSTGRES_*` from the running container (do not commit this file):

```bash
cd /home/smurfslinger/photography_by_piv
docker inspect piv-postgres --format '{{range .Config.Env}}{{println .}}{{end}}' \
  | grep '^POSTGRES_' > .env.postgres
chmod 600 .env.postgres
```

Expected keys: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`.

## 2. Backup (before any stop)

**Logical dump:**

```bash
cd /home/smurfslinger/photography_by_piv
mkdir -p backups
source .env.postgres
docker exec piv-postgres pg_dumpall -U "$POSTGRES_USER" \
  > "backups/piv-postgres-$(date +%Y%m%d%H%M)-dumpall.sql"
```

**Volume archive (optional extra safety):**

```bash
docker run --rm \
  -v piv_postgres_data:/data:ro \
  -v "$(pwd)/backups":/backup \
  alpine tar -czf "/backup/piv_postgres_data-$(date +%Y%m%d%H%M).tar.gz" -C /data .
```

## 3. Cutover (brief DB downtime)

```bash
cd /home/smurfslinger/photography_by_piv
docker stop piv-postgres
docker rm piv-postgres
docker compose up -d
docker compose ps
ss -tln | grep 5432   # expect 127.0.0.1:5432
```

Verify:

```bash
source .env.postgres
docker exec piv-postgres pg_isready -U "$POSTGRES_USER"
# App smoke (from repo): npm run db:deploy  # only if you intend to test migrations
curl -sI http://127.0.0.1:3000/ | head -3
```

## 4. Rollback

If compose bring-up fails, restore the old container (same volume; **widen port binding again**):

```bash
cd /home/smurfslinger/photography_by_piv
docker compose down
source .env.postgres
docker run -d \
  --name piv-postgres \
  --restart no \
  -p 5432:5432 \
  -v piv_postgres_data:/var/lib/postgresql/data \
  --env-file .env.postgres \
  postgres:16
```

Restore from backup if data was damaged:

```bash
source .env.postgres
docker exec -i piv-postgres psql -U "$POSTGRES_USER" < backups/piv-postgres-YYYYMMDDHHMM-dumpall.sql
```

## Notes

- `docker compose down` does **not** remove an external volume.
- Do not run `docker compose down -v` (would not drop external volume by name, but avoid `-v` habits).
- After cutover, restrict host firewall if anything still expected Postgres on the LAN.
