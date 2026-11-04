import fs from "node:fs";
import path from "node:path";
import { INITIAL_DATABASE_STATE } from "./data/seed-data.mjs";

const rootDir = process.cwd();
const publicDir = path.join(rootDir, "public");

// 1. Write database files to data/, public/, and root
const dbJsonStr = JSON.stringify(INITIAL_DATABASE_STATE, null, 2);
const initialDbJsStr = `window.__INITIAL_DB__ = ${JSON.stringify(INITIAL_DATABASE_STATE)};\n`;

fs.mkdirSync(path.join(rootDir, "data"), { recursive: true });
fs.mkdirSync(publicDir, { recursive: true });

fs.writeFileSync(path.join(rootDir, "data", "kmutt-market-db.json"), dbJsonStr, "utf-8");
fs.writeFileSync(path.join(publicDir, "kmutt-market-db.json"), dbJsonStr, "utf-8");
fs.writeFileSync(path.join(rootDir, "kmutt-market-db.json"), dbJsonStr, "utf-8");

fs.writeFileSync(path.join(publicDir, "initial-db.js"), initialDbJsStr, "utf-8");
fs.writeFileSync(path.join(rootDir, "initial-db.js"), initialDbJsStr, "utf-8");

// 2. Sync index.html, styles.css, app.js to root directory so Render root publish dir works
const indexHtml = fs.readFileSync(path.join(publicDir, "index.html"), "utf-8");
const stylesCss = fs.readFileSync(path.join(publicDir, "styles.css"), "utf-8");
const appJs = fs.readFileSync(path.join(publicDir, "app.js"), "utf-8");

fs.writeFileSync(path.join(rootDir, "index.html"), indexHtml, "utf-8");
fs.writeFileSync(path.join(rootDir, "404.html"), indexHtml, "utf-8");
fs.writeFileSync(path.join(publicDir, "404.html"), indexHtml, "utf-8");
fs.writeFileSync(path.join(rootDir, "styles.css"), stylesCss, "utf-8");
fs.writeFileSync(path.join(rootDir, "app.js"), appJs, "utf-8");

// 3. Pre-generate static SPA route entrypoints for static hosting
const staticRoutes = [
  "shops",
  "products",
  "categories",
  "market",
  "market/map",
  "market/schedule",
  "favorites",
  "reviews",
  "about",
  "contact",
  "instagram",
  "admin/instagram",
  ...(INITIAL_DATABASE_STATE.shops || []).map((s) => `shops/${s.slug}`),
  ...(INITIAL_DATABASE_STATE.products || []).map((p) => `products/${p.slug}`),
];

for (const route of staticRoutes) {
  for (const base of [rootDir, publicDir]) {
    const dir = path.join(base, route);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "index.html"), indexHtml, "utf-8");
  }
}

console.log("Static site & database built successfully for both root (.) and public/!");
