# Snip — A Tiny URL Shortener

One simple API backend, two different clients (web browser + terminal), all living in a single git repository via **git submodules**.

## The Idea

**Snip** is a URL shortening service. One Bun server handles the API. Two completely independent clients consume it:

1. **Angular 19 web UI** — paste a URL, see the short link, browse all links
2. **Node CLI** — `snip add <url>`, `snip ls`, `snip open <code>` 

Both live in the same repo but on separate orphan branches. The `main` branch mounts them all as submodules, so a clone gives you the entire app side-by-side.

## API Contract

All requests go to the backend (port 3000). **Change the contract everywhere or nowhere.**

| Method | Path | Body | Response |
|--------|------|------|----------|
| `POST` | `/api/links` | `{ "url": "https://…" }` | `201 { code, url, shortUrl, hits, createdAt }` · `400` on invalid URL |
| `GET`  | `/api/links` | — | `200` array of all links |
| `GET`  | `/:code` | — | `302` to original URL (+1 hit) · `404` if unknown |

## Repository Structure

Four orphan branches, each with its own independent git history:

| Branch | Path | Stack | What it is |
|--------|------|-------|-----------|
| `backend` | — (files at root) | Bun 1.x, zero deps | Single-file `server.js` API server, in-memory `Map` |
| `frontend` | — (files at root) | Angular 19, HttpClient | Standalone UI component, signals, minimal CSS |
| `cli` | — (files at root) | Node ≥18, CommonJS, zero deps | CLI tool with `add`, `ls`, `open` commands |
| `main` | mounted as submodules | — | Superproject: `.gitmodules` + README |

On `main`, each folder is a **git submodule** — a pointer to a specific commit on another branch. When you clone with `--recurse-submodules`, all three branches materialize side-by-side.

## Getting Started

### Clone with submodules

```bash
git clone --recurse-submodules https://github.com/ccw-git-hub/WorkshopDay1.git
cd WorkshopDay1
```

If you already cloned without `--recurse-submodules`:
```bash
git submodule update --init --recursive
```

### Run the backend

```bash
cd backend
bun start   # listens on http://localhost:3000
```

### Run the web UI

In a new terminal:
```bash
cd frontend
npm install
npx ng serve   # listens on http://localhost:4200
```

Open http://localhost:4200 in your browser.

### Run the CLI

In a third terminal:
```bash
cd cli
node cli.js ls        # list all links
node cli.js add https://example.com   # shorten a URL
node cli.js help      # show usage
```

Set `SNIP_API` to point to a different backend:
```bash
SNIP_API=http://api.example.com:3000 node cli.js ls
```

## Updating Submodules

The three branches evolve independently. To incorporate new commits:

### 1. Edit inside a submodule folder

```bash
cd backend
# ... make changes ...
git add .
git commit -m "fix: handle edge case"
git push   # pushes to origin/backend
```

### 2. Bump the pointer on main

Back in the superproject:
```bash
git submodule update --remote backend   # fetch origin/backend
git add backend                          # stage the new pointer
git commit -m "bump backend submodule"
git push                                 # pushes to origin/main
```

The `.gitmodules` file and `.git/config` stay in sync automatically.

### 3. For all three at once

```bash
git submodule update --remote   # fetch all branches
git add backend frontend cli
git commit -m "bump all submodules to latest"
git push
```

## Folder Layout (after clone)

```
WorkshopDay1/
├── backend/           → pointer to branch `backend` commit SHA
│   ├── server.js
│   ├── package.json
│   └── README.md
├── frontend/          → pointer to branch `frontend` commit SHA
│   ├── src/
│   ├── angular.json
│   ├── package.json
│   └── design.md
├── cli/               → pointer to branch `cli` commit SHA
│   ├── cli.js
│   ├── snip / snip.cmd / snip.ps1
│   ├── package.json
│   └── README.md
├── .gitmodules        # submodule URLs + tracked branches
└── README.md          # this file
```

Each folder's contents come from its branch, not `main`. The `.gitmodules` file tells git which branch to track.

## Key Files

- **`.gitmodules`** — URLs and branch tracking for each submodule
- **`backend/server.js`** — the API
- **`frontend/src/app/`** — Angular components
- **`frontend/design.md`** — design tokens reference
- **`cli/cli.js`** — the CLI entry point

## Notes

- **In-memory storage** — links live in a `Map`, restart clears all. This is intentional for the demo.
- **Zero npm dependencies** — both `backend/` and `cli/` have no npm packages; they're as minimal as possible.
- **Orphan branches** — each branch has its own independent history (`git log` won't show commits from other branches). Files at the branch root are what you see when that branch is checked out.
- **CORS enabled** — the backend accepts requests from any origin (the Angular UI is on a different port).

## Next Steps (Future)

Later steps will add:
- A `bundle` branch: a release snapshot (server + built UI + CLI, with Docker support)
- A build script that assembles the bundle from the source branches
- GitHub Actions CI/CD to rebuild the bundle hourly and push a Docker image

---

Built by pasting prompts into an AI coding agent. Each step leaves the architecture fully functional.
