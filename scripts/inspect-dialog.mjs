import { chromium } from "playwright-core";
import path from "node:path";

async function inspect() {
  const browser = await chromium.launch({ channel: "chrome", headless: false });
  const context = await browser.newContext({
    storageState: "data/ig-session.json",
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();
  await page.goto("https://www.instagram.com/", { waitUntil: "networkidle", timeout: 30000 });

  // Dismiss modals
  try {
    const dismissBtn = page.locator('button:has-text("Not Now"), button:has-text("ไม่ใช่ตอนนี้")');
    if (await dismissBtn.isVisible({ timeout: 2500 })) {
      await dismissBtn.click();
    }
  } catch {}

  const createBtn = page.locator(
    'svg[aria-label="New post"], svg[aria-label="สร้าง"], svg[aria-label="โพสต์ใหม่"], a[href="#"][role="link"]:has-text("Create"), a[href="#"][role="link"]:has-text("สร้าง")'
  ).first();
  await createBtn.click();
  await page.waitForTimeout(2000);

  const fileInput = page.locator('input[type="file"][accept*="image"]');
  await fileInput.setInputFiles(path.resolve("public/posters/ig-punpro-spot-001-1793771696117.png"));
  await page.waitForTimeout(2500);

  // Next 1
  const n1 = page.locator('div[role="dialog"] div[role="button"]:has-text("Next"), div[role="dialog"] button:has-text("Next"), div[role="dialog"] div:has-text("ถัดไป")').last();
  await n1.click({ force: true });
  await page.waitForTimeout(2000);

  // Next 2
  const n2 = page.locator('div[role="dialog"] div[role="button"]:has-text("Next"), div[role="dialog"] button:has-text("Next"), div[role="dialog"] div:has-text("ถัดไป")').last();
  await n2.click({ force: true });
  await page.waitForTimeout(2000);

  console.log("=== Dialog Header Elements ===");
  const header = page.locator('div[role="dialog"] header, div[role="dialog"] > div > div > div:first-child');
  console.log("Header text:", await header.innerText().catch(() => "none"));

  console.log("\n=== Checking Share candidates ===");
  const shareExact = page.getByRole("button", { name: "Share", exact: true });
  console.log("getByRole('button', { name: 'Share', exact: true }) count:", await shareExact.count());

  const divRoleButtons = await page.locator('div[role="dialog"] div[role="button"]').all();
  for (let i = 0; i < divRoleButtons.length; i++) {
    const text = (await divRoleButtons[i].innerText().catch(() => "")).trim();
    console.log(`div[role="button"] ${i}: "${text}"`);
  }

  const buttons = await page.locator('div[role="dialog"] button').all();
  for (let i = 0; i < buttons.length; i++) {
    const text = (await buttons[i].innerText().catch(() => "")).trim();
    console.log(`button ${i}: "${text}"`);
  }

  await browser.close();
}

inspect().catch(console.error);
