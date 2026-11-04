import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { INITIAL_DATABASE_STATE } from "./data/seed-data.mjs";
import { handleInstagramApi } from "./services/instagram-api-handler.mjs";
import { initScheduler } from "./services/instagram-scheduler.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "kmutt-market-db.json");
const PUBLIC_DIR = path.join(__dirname, "public");

function loadDb() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(
        DB_FILE,
        JSON.stringify(INITIAL_DATABASE_STATE, null, 2),
        "utf-8"
      );
      return INITIAL_DATABASE_STATE;
    }
    const parsed = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
    if (!parsed.shops || !parsed.shops.length) {
      return INITIAL_DATABASE_STATE;
    }
    return parsed;
  } catch {
    return INITIAL_DATABASE_STATE;
  }
}

function saveDb(state) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), "utf-8");
  return state;
}

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
};

const server = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url || "/", `http://localhost:${PORT}`);
  const pathname = decodeURIComponent(urlObj.pathname);

  // Instagram Automation API Routes
  if (pathname.startsWith("/api/instagram/")) {
    const handled = await handleInstagramApi(req, res, pathname);
    if (handled) return;
  }

  // API Route: GET / POST /api/market-data
  if (pathname === "/api/market-data") {
    if (req.method === "GET") {
      const data = loadDb();
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(data));
      return;
    }

    if (req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        try {
          const parsed = JSON.parse(body || "{}");
          if (parsed.action === "RESET_DEMO_DATA") {
            const reset = saveDb(INITIAL_DATABASE_STATE);
            res.writeHead(200, {
              "Content-Type": "application/json; charset=utf-8",
            });
            res.end(JSON.stringify({ ok: true, data: reset }));
            return;
          }
          if (parsed.state) {
            const updated = saveDb(parsed.state);
            res.writeHead(200, {
              "Content-Type": "application/json; charset=utf-8",
            });
            res.end(JSON.stringify({ ok: true, data: updated }));
            return;
          }
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: false, error: "Invalid payload" }));
        } catch (err) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: false, error: String(err) }));
        }
      });
      return;
    }
  }

  // Static files inside /public
  const safePath = path.normalize(pathname).replace(/^(\.\.(\/|\\|$))+/, "");
  const fileCandidate = path.join(PUBLIC_DIR, safePath);

  if (
    pathname !== "/" &&
    fs.existsSync(fileCandidate) &&
    fs.statSync(fileCandidate).isFile()
  ) {
    const ext = path.extname(fileCandidate).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
    });
    fs.createReadStream(fileCandidate).pipe(res);
    return;
  }

  // Serve SPA index.html for all application routes (/shops, /products, /market/map, /vendor/*, /admin/*, etc.)
  const indexHtmlPath = path.join(PUBLIC_DIR, "index.html");
  if (fs.existsSync(indexHtmlPath)) {
    const rawHtml = fs.readFileSync(indexHtmlPath, "utf-8");
    const dbPayload = JSON.stringify(loadDb());
    const injectedHtml = rawHtml.replace(
      "<!--__INITIAL_DB_SCRIPT__-->",
      `<script>window.__INITIAL_DB__ = ${dbPayload};</script>`
    );
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(injectedHtml);
  } else {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not Found");
  }
});

let currentPort = Number(process.env.PORT || 3080);
const HOST = "0.0.0.0";

server.on("error", (err) => {
  if (err && err.code === "EADDRINUSE") {
    currentPort += 1;
    server.listen(currentPort, HOST);
  } else {
    throw err;
  }
});

server.listen(currentPort, HOST, () => {
  console.log(`KMUTT MARKET Server running at http://${HOST}:${currentPort}`);
  initScheduler();
});
