# snip-backend

Tiny URL shortener API built with [Bun](https://bun.sh). Zero npm dependencies; links stored in an in-memory `Map` (resets on restart, by design).

## API

| Method | Path | Body | Response |
|--------|------|------|----------|
| `POST` | `/api/links` | `{ "url": "https://…" }` | `201 { code, url, shortUrl, hits, createdAt }` · `400` on bad input |
| `GET`  | `/api/links` | — | `200` array of all links |
| `GET`  | `/:code` | — | `302` to original URL (+1 hit) · `404` if unknown |

## Run

```bash
bun start          # production
bun run dev        # watch mode
```

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Port to listen on |
| `BASE_URL` | `http://localhost:<PORT>` | Origin used in `shortUrl`; auto-detects Railway via `RAILWAY_PUBLIC_DOMAIN` |
| `PUBLIC_DIR` | — | When set, also serves static files from this folder (`/` → `index.html`); an existing file wins over a short code of the same name |
