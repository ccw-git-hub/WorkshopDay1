// Snip — tiny URL shortener (Bun, zero npm deps)

const PORT = Number(process.env.PORT) || 3000;
const BASE_URL =
  process.env.BASE_URL ||
  (process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : `http://localhost:${PORT}`);
const PUBLIC_DIR = process.env.PUBLIC_DIR || null;

/** @type {Map<string, {code:string,url:string,shortUrl:string,hits:number,createdAt:string}>} */
const links = new Map();

const BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function randomCode(len = 6) {
  let code = "";
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  for (const b of bytes) code += BASE62[b % 62];
  return code;
}

function isValidUrl(str) {
  try {
    const u = new URL(str);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

async function serveStatic(pathname) {
  if (!PUBLIC_DIR) return null;

  // Normalize: "/" → "/index.html"
  let filePath = pathname === "/" ? "/index.html" : pathname;
  const fullPath = PUBLIC_DIR.replace(/\/$/, "") + filePath;

  try {
    const file = Bun.file(fullPath);
    if (await file.exists()) {
      return new Response(file, { headers: CORS_HEADERS });
    }
  } catch {
    // file not found
  }
  return null;
}

Bun.serve({
  hostname: "0.0.0.0",
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const { pathname } = url;
    const method = req.method.toUpperCase();

    // ── CORS preflight ────────────────────────────────────────────────────────
    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // ── POST /api/links ───────────────────────────────────────────────────────
    if (method === "POST" && pathname === "/api/links") {
      let body;
      try {
        body = await req.json();
      } catch {
        return json({ error: "Invalid JSON" }, 400);
      }

      if (!body || typeof body.url !== "string" || !isValidUrl(body.url)) {
        return json({ error: "A valid http(s) URL is required" }, 400);
      }

      let code;
      do {
        code = randomCode();
      } while (links.has(code));

      const entry = {
        code,
        url: body.url,
        shortUrl: `${BASE_URL}/${code}`,
        hits: 0,
        createdAt: new Date().toISOString(),
      };
      links.set(code, entry);
      return json(entry, 201);
    }

    // ── GET /api/links ────────────────────────────────────────────────────────
    if (method === "GET" && pathname === "/api/links") {
      return json([...links.values()]);
    }

    // ── Static files (PUBLIC_DIR set, existing file wins over short code) ─────
    if (method === "GET" && PUBLIC_DIR) {
      const staticResponse = await serveStatic(pathname);
      if (staticResponse) return staticResponse;
    }

    // ── GET /:code  (redirect) ────────────────────────────────────────────────
    if (method === "GET" && pathname.length > 1) {
      const code = pathname.slice(1);
      const entry = links.get(code);
      if (entry) {
        entry.hits++;
        return new Response(null, {
          status: 302,
          headers: { Location: entry.url, ...CORS_HEADERS },
        });
      }
    }

    // ── Root fallback for PUBLIC_DIR (after code miss) ────────────────────────
    if (method === "GET" && PUBLIC_DIR && pathname === "/") {
      const staticResponse = await serveStatic("/index.html");
      if (staticResponse) return staticResponse;
    }

    return new Response("Not found", { status: 404, headers: CORS_HEADERS });
  },
});

console.log(`Snip listening on ${BASE_URL}`);
