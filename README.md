# snip-cli

Zero-dependency Node.js CLI for the [Snip](https://github.com/ccw-git-hub/WorkshopDay1) URL shortener. Requires Node ≥ 18 (uses global `fetch`). No `npm install` needed.

## Commands

| Command | Description |
|---------|-------------|
| `snip add <url>` | Shorten a URL; prints the short link |
| `snip ls` | List all links with codes, hit counts, and original URLs |
| `snip open <code>` | Open a short code in the OS default browser |
| `snip help` | Show usage |

## Run

```bash
node cli.js help
node cli.js add https://example.com
node cli.js ls
node cli.js open <code>
```

Or via the wrappers (after adding the folder to your PATH):

```bash
# macOS / Linux
chmod +x snip
snip ls

# Windows (cmd)
snip.cmd ls

# Windows (PowerShell)
.\snip.ps1 ls
```

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `SNIP_API` | `http://localhost:3000` | Backend base URL |

## Notes

- `cli.js` is **CommonJS** — no `"type":"module"` in `package.json` by design; a build step copies this file into a CommonJS context.
- Errors print to `stderr` and exit with code `1`.
