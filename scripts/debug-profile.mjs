import { chromium } from "playwright-core";

async function check() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({ storageState: "data/ig-session.json", viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.goto("https://www.instagram.com/gen111_kmutt_market/", { waitUntil: "networkidle", timeout: 30000 });
  const links = await page.locator('a[href*="/p/"]').all();
  console.log("Total posts found:", links.length);
  for (const l of links) {
    console.log("Link:", await l.getAttribute("href"));
  }
  await browser.close();
}

check().catch(console.error);
