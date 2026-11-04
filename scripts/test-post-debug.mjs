import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";

async function testPostFlow() {
  const posterPath = path.resolve("public/posters/ig-punpro-spot-001-1793771696117.png");
  if (!fs.existsSync(posterPath)) {
    console.error("Poster not found:", posterPath);
    return;
  }

  const browser = await chromium.launch({ channel: "chrome", headless: false });
  const context = await browser.newContext({
    storageState: "data/ig-session.json",
    viewport: { width: 1280, height: 900 },
  });

  const page = await context.newPage();
  console.log("1. Navigating to Instagram home...");
  await page.goto("https://www.instagram.com/", { waitUntil: "networkidle", timeout: 35000 });

  // Dismiss modals
  try {
    const dismissBtn = page.locator('button:has-text("Not Now"), button:has-text("ไม่ใช่ตอนนี้")');
    if (await dismissBtn.isVisible({ timeout: 2500 })) {
      await dismissBtn.click();
    }
  } catch {}

  console.log("2. Clicking Create (+)...");
  const createBtn = page.locator(
    'svg[aria-label="New post"], svg[aria-label="สร้าง"], svg[aria-label="โพสต์ใหม่"], a[href="#"][role="link"]:has-text("Create"), a[href="#"][role="link"]:has-text("สร้าง"), span:has-text("Create"), span:has-text("สร้าง")'
  ).first();
  await createBtn.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "data/step1-create-opened.png" });

  console.log("3. Uploading file...");
  const fileInput = page.locator('input[type="file"][accept*="image"]');
  await fileInput.waitFor({ state: "attached", timeout: 10000 });
  await fileInput.setInputFiles(posterPath);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "data/step2-file-uploaded.png" });

  console.log("4. Step 1: Crop Next...");
  const nextBtn1 = page.locator(
    'div[role="dialog"] button:has-text("Next"), div[role="dialog"] div[role="button"]:has-text("Next"), div[role="dialog"] div:has-text("ถัดไป")'
  ).last();
  await nextBtn1.waitFor({ state: "visible", timeout: 8000 });
  await nextBtn1.click({ force: true });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "data/step3-crop-next.png" });

  console.log("5. Step 2: Filter Next...");
  const nextBtn2 = page.locator(
    'div[role="dialog"] button:has-text("Next"), div[role="dialog"] div[role="button"]:has-text("Next"), div[role="dialog"] div:has-text("ถัดไป")'
  ).last();
  await nextBtn2.waitFor({ state: "visible", timeout: 8000 });
  await nextBtn2.click({ force: true });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "data/step4-filter-next.png" });

  console.log("6. Step 3: Fill Caption...");
  const captionBox = page.locator(
    'div[aria-label="Write a caption..."], div[aria-label="เขียนคำบรรยาย..."], div[role="textbox"]'
  ).first();
  await captionBox.waitFor({ state: "visible", timeout: 8000 });
  await captionBox.click({ force: true });
  await captionBox.fill("ทดสอบระบบโพสต์ มจธ. สไตล์ปันโปร #KMUTT #บางมด");
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "data/step5-caption-filled.png" });

  console.log("7. Step 4: Clicking Share...");
  const shareBtn = page.locator(
    'div[role="dialog"] button:has-text("Share"), div[role="dialog"] div[role="button"]:has-text("Share"), div[role="dialog"] div:has-text("แชร์"), div[role="dialog"] div[role="button"]:has-text("แชร์")'
  ).last();
  console.log("Share button text:", await shareBtn.innerText());
  await shareBtn.click({ force: true });

  console.log("8. Waiting 15s to observe what Instagram does after Share...");
  for (let i = 1; i <= 6; i++) {
    await page.waitForTimeout(5000);
    await page.screenshot({ path: `data/step6-after-share-${i*5}s.png` });
    console.log(`Snapshot at ${i*5}s: URL=${page.url()}`);
    // Check dialog content
    const dialog = page.locator('div[role="dialog"]');
    if (await dialog.isVisible()) {
      console.log(`Dialog text at ${i*5}s:`, (await dialog.innerText()).replace(/\n/g, " | "));
    } else {
      console.log(`Dialog closed at ${i*5}s! Post might be live!`);
      break;
    }
  }

  // Check profile now!
  console.log("9. Checking profile posts...");
  await page.goto("https://www.instagram.com/gen111_kmutt_market/", { waitUntil: "networkidle", timeout: 25000 });
  await page.screenshot({ path: "data/step7-profile-result.png" });
  const postLinks = await page.locator('a[href*="/p/"]').all();
  console.log("Total post links on profile now:", postLinks.length);
  for (const l of postLinks) {
    console.log("Found post:", await l.getAttribute("href"));
  }

  await context.storageState({ path: "data/ig-session.json" });
  await browser.close();
}

testPostFlow().catch(console.error);
