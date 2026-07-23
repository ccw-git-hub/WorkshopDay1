#!/usr/bin/env node
/**
 * build-bundle.mjs — Assemble the release bundle from source submodules
 *
 * Usage:
 *   node scripts/build-bundle.mjs        # Dry run (no push)
 *   node scripts/build-bundle.mjs --push # Commit and push
 *
 * Steps:
 * 1. Update submodules to their branch tips
 * 2. Build the frontend (ng build)
 * 3. Assemble bundle/ with server.js, cli.js, built UI, config files
 * 4. Commit (idempotently) and optionally push
 */

import { execSync } from 'child_process';
import { writeFileSync, readFileSync, cpSync, mkdirSync, rmSync, readdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const BUNDLE = resolve(ROOT, 'bundle');
const FRONTEND_BUILD = resolve(ROOT, 'frontend', 'dist', 'snip-frontend', 'browser');
const FRONTEND_INDEX = resolve(FRONTEND_BUILD, 'index.html');

const shouldPush = process.argv.includes('--push');

function log(msg) {
  process.stdout.write('[bundle] ' + msg + '\n');
}

function die(msg) {
  process.stderr.write('[bundle] ERROR: ' + msg + '\n');
  process.exit(1);
}

function runSync(cmd, opts = {}) {
  const shell = process.platform === 'win32';
  try {
    return execSync(cmd, { stdio: 'inherit', cwd: ROOT, shell, ...opts });
  } catch (err) {
    die('Command failed: ' + cmd);
  }
}

function runQuiet(cmd, opts = {}) {
  const shell = process.platform === 'win32';
  try {
    return execSync(cmd, { stdio: 'pipe', cwd: ROOT, shell, encoding: 'utf-8', ...opts });
  } catch (err) {
    return '';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 0. Check/setup git config
// ─────────────────────────────────────────────────────────────────────────────

// Ensure git user is configured (needed for commits)
let gitUserEmail = runQuiet('git config user.email').trim();
let gitUserName = runQuiet('git config user.name').trim();

if (!gitUserEmail) {
  log('Git user.email not configured; setting to workshop@snip-demo.local');
  runSync('git config user.email "workshop@snip-demo.local"');
}

if (!gitUserName) {
  log('Git user.name not configured; setting to Snip Workshop');
  runSync('git config user.name "Snip Workshop"');
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Update submodules
// ─────────────────────────────────────────────────────────────────────────────

log('Updating submodules to branch tips...');
runSync('git submodule update --init --remote backend frontend cli');

// ─────────────────────────────────────────────────────────────────────────────
// 2. Build frontend
// ─────────────────────────────────────────────────────────────────────────────

log('Building frontend...');
runSync('npm install --omit=dev', { cwd: resolve(ROOT, 'frontend') });
runSync('npx ng build', { cwd: resolve(ROOT, 'frontend') });

if (!existsSync(FRONTEND_INDEX)) {
  die('Frontend build failed: ' + FRONTEND_INDEX + ' not found');
}
log('Frontend built successfully');

// ─────────────────────────────────────────────────────────────────────────────
// 3. Assemble bundle/
// ─────────────────────────────────────────────────────────────────────────────

log('Assembling bundle folder...');

// Clean and recreate bundle/ except .git
const bundleGit = resolve(BUNDLE, '.git');
if (existsSync(BUNDLE)) {
  try {
    const items = readdirSync(BUNDLE);
    for (const item of items) {
      if (item === '.git' || item === '.gitmodules') continue;
      const path = resolve(BUNDLE, item);
      rmSync(path, { recursive: true, force: true });
    }
  } catch {}
}
mkdirSync(BUNDLE, { recursive: true });

// Copy server.js and cli.js as-is
const serverSrc = resolve(ROOT, 'backend', 'server.js');
const cliSrc = resolve(ROOT, 'cli', 'cli.js');
if (!existsSync(serverSrc)) die('backend/server.js not found');
if (!existsSync(cliSrc)) die('cli/cli.js not found');
writeFileSync(resolve(BUNDLE, 'server.js'), readFileSync(serverSrc));
writeFileSync(resolve(BUNDLE, 'cli.js'), readFileSync(cliSrc));
log('Copied server.js and cli.js');

// Copy built UI to public/
mkdirSync(resolve(BUNDLE, 'public'), { recursive: true });
cpSync(FRONTEND_BUILD, resolve(BUNDLE, 'public'), { recursive: true });
log('Copied built UI to public/');

// Write .env
writeFileSync(resolve(BUNDLE, '.env'), 'PUBLIC_DIR=./public\n');
log('Wrote .env');

// Write package.json
writeFileSync(
  resolve(BUNDLE, 'package.json'),
  JSON.stringify(
    {
      name: 'snip-bundle',
      version: '1.0.0',
      scripts: {
        start: 'bun server.js',
      },
    },
    null,
    2
  ) + '\n'
);
log('Wrote package.json');

// Write Dockerfile
writeFileSync(
  resolve(BUNDLE, 'Dockerfile'),
  `FROM oven/bun:1-alpine
WORKDIR /app
COPY . .
ENV PORT=3000
EXPOSE 3000
CMD ["bun", "server.js"]
`
);
log('Wrote Dockerfile');

// Write .dockerignore
writeFileSync(resolve(BUNDLE, '.dockerignore'), 'node_modules\nfrontend\nbackend\ncli\nscripts\n');
log('Wrote .dockerignore');

// Write railway.json
writeFileSync(
  resolve(BUNDLE, 'railway.json'),
  JSON.stringify(
    {
      $schema: 'https://railway.app/railway.schema.json',
      build: {
        builder: 'DOCKERFILE',
      },
      deploy: {
        numReplicas: 1,
        startCommand: 'bun server.js',
        restartPolicyMaxRetries: 5,
        restartPolicyWindowSeconds: 600,
      },
    },
    null,
    2
  ) + '\n'
);
log('Wrote railway.json');

// ─────────────────────────────────────────────────────────────────────────────
// 4. Commit idempotently and push
// ─────────────────────────────────────────────────────────────────────────────

// Stage all changes in bundle/
process.chdir(BUNDLE);
runSync('git add -A');

// Check if there are staged changes (not just "0 files changed")
const stagedDiff = runQuiet('git diff --cached --stat').trim();
const hasChanges = stagedDiff && !stagedDiff.includes('0 files changed');
process.chdir(ROOT);

if (hasChanges) {
  log('Committing changes in bundle...');
  process.chdir(BUNDLE);
  runSync('git commit -m "Generated: rebuilt frontend, updated binaries"');
  log('Committed bundle/');
  process.chdir(ROOT);

  // Bump the submodule pointer on main
  log('Updating bundle submodule pointer on main...');
  runSync('git add bundle');
  const mainDiff = runQuiet('git diff --cached --stat').trim();
  const mainHasChanges = mainDiff && !mainDiff.includes('0 files changed');
  
  if (mainHasChanges) {
    runSync('git commit -m "Bump bundle submodule to latest release"');
    log('Committed submodule bump');
  }
} else {
  log('No changes in bundle — nothing to commit');
}

// Push if requested
if (shouldPush) {
  log('Pushing main branch (includes bundle submodule pointer)...');
  runSync('git push origin main');
  
  log('Pushing bundle branch...');
  process.chdir(BUNDLE);
  // Ensure we're on the bundle branch (detached HEAD check)
  const currentBranch = runQuiet('git rev-parse --abbrev-ref HEAD').trim();
  if (currentBranch === 'HEAD') {
    log('Bundle is in detached HEAD; attempting to push bundle commits...');
    runSync('git push origin HEAD:refs/heads/bundle --force-if-includes');
  } else {
    runSync('git push origin ' + currentBranch);
  }
  process.chdir(ROOT);
  log('Pushed successfully');
} else {
  log('Not pushing (use --push to enable)');
}

log('Done!');
