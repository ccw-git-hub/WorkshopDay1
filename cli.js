#!/usr/bin/env node
// cli.js — Snip CLI (CommonJS, zero npm dependencies, Node >=18 global fetch)
'use strict';

const BASE_URL = (process.env.SNIP_API || 'http://localhost:3000').replace(/\/$/, '');

// ── Helpers ────────────────────────────────────────────────────────────────

function die(msg) {
  process.stderr.write('error: ' + msg + '\n');
  process.exit(1);
}

function usage() {
  process.stdout.write(
    'Usage:\n' +
    '  snip add <url>    Shorten a URL and print the short link\n' +
    '  snip ls           List all shortened links\n' +
    '  snip open <code>  Open a short code in the default browser\n' +
    '  snip help         Show this help text\n' +
    '\n' +
    'Environment:\n' +
    '  SNIP_API          Backend base URL (default: http://localhost:3000)\n'
  );
}

async function apiFetch(path, options) {
  let res;
  try {
    res = await fetch(BASE_URL + path, options);
  } catch (err) {
    die('Cannot reach backend at ' + BASE_URL + ' — is it running?\n  ' + err.message);
  }
  return res;
}

// ── Commands ───────────────────────────────────────────────────────────────

async function cmdAdd(url) {
  if (!url) die('Usage: snip add <url>');

  // Basic client-side validation
  try {
    const u = new URL(url);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error();
  } catch {
    die('Invalid URL — must start with http:// or https://');
  }

  const res = await apiFetch('/api/links', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    let msg = res.statusText;
    try { const j = await res.json(); msg = j.error || msg; } catch {}
    die('Server returned ' + res.status + ': ' + msg);
  }

  const link = await res.json();
  process.stdout.write(link.shortUrl + '\n');
}

async function cmdLs() {
  const res = await apiFetch('/api/links');

  if (!res.ok) die('Server returned ' + res.status + ': ' + res.statusText);

  const links = await res.json();

  if (!links.length) {
    process.stdout.write('No links yet.\n');
    return;
  }

  // Column widths
  const codeW = Math.max(4, ...links.map(l => l.code.length));
  const hitsW = Math.max(4, ...links.map(l => String(l.hits).length));

  const pad = (s, n) => String(s).padEnd(n);
  const hr  = '-'.repeat(codeW) + '  ' + '-'.repeat(hitsW) + '  ' + '-'.repeat(40);

  process.stdout.write(pad('CODE', codeW) + '  ' + pad('HITS', hitsW) + '  URL\n');
  process.stdout.write(hr + '\n');
  for (const l of links) {
    process.stdout.write(pad(l.code, codeW) + '  ' + pad(l.hits, hitsW) + '  ' + l.url + '\n');
  }
}

async function cmdOpen(code) {
  if (!code) die('Usage: snip open <code>');

  const res = await apiFetch('/' + code, { redirect: 'manual' });

  if (res.status === 404) die('Unknown code: ' + code);

  if (res.status < 300 || res.status >= 400) {
    die('Unexpected response ' + res.status + ' for code: ' + code);
  }

  const location = res.headers.get('location');
  if (!location) die('Redirect had no Location header');

  // Open in OS default browser
  const { execSync } = require('child_process');
  const platform = process.platform;
  try {
    if (platform === 'win32')       execSync('start "" "' + location + '"',  { stdio: 'ignore', shell: true });
    else if (platform === 'darwin') execSync('open "' + location + '"',      { stdio: 'ignore' });
    else                            execSync('xdg-open "' + location + '"',  { stdio: 'ignore' });
  } catch (err) {
    die('Could not open browser: ' + err.message);
  }

  process.stdout.write('Opened: ' + location + '\n');
}

// ── Entry point ────────────────────────────────────────────────────────────

const [,, cmd, arg] = process.argv;

switch (cmd) {
  case 'add':  cmdAdd(arg).catch(e  => die(e.message)); break;
  case 'ls':   cmdLs().catch(e      => die(e.message)); break;
  case 'open': cmdOpen(arg).catch(e => die(e.message)); break;
  case 'help':
  case undefined:
    usage();
    break;
  default:
    process.stderr.write('Unknown command: ' + cmd + '\n\n');
    usage();
    process.exit(1);
}
