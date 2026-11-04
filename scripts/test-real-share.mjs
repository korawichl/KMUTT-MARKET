import { chromium } from "playwright-core";
import path from "node:path";

async function testShare() {
  const browser = await chromium.launch({ channel: "chrome", headless: false });
  const context = await browser.newContext({
    storageState: "data/ig-session.json",
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();
  await page.goto("https://www.instagram.com/", { waitUntil: "networkidle", timeout: 35000 });

  // Dismiss modals
  try {
    const dismissBtn = page.locator('button:has-text("Not Now"), button:has-text("ไม่ใช่ตอนนี้")');
    if (await dismissBtn.isVisible({ timeout: 2500 })) {
      await dismissBtn.click();
    }
  } catch {}

  console.log("1. Opening Create modal...");
  const createBtn = page.locator(
    'svg[aria-label="New post"], svg[aria-label="สร้าง"], svg[aria-label="โพสต์ใหม่"], a[href="#"][role="link"]:has-text("Create"), a[href="#"][role="link"]:has-text("สร้าง")'
  ).first();
  await createBtn.click();
  await page.waitForTimeout(2000);

  console.log("2. Uploading poster image...");
  const fileInput = page.locator('input[type="file"][accept*="image"]');
  await fileInput.setInputFiles(path.resolve("public/posters/ig-punpro-spot-001-1793771696117.png"));
  await page.waitForTimeout(2500);

  console.log("3. Next 1 (Crop)...");
  const n1 = page.locator('div[role="dialog"] div[role="button"]:has-text("Next"), div[role="dialog"] button:has-text("Next"), div[role="dialog"] div:has-text("ถัดไป")').last();
  await n1.click({ force: true });
  await page.waitForTimeout(2000);

  console.log("4. Next 2 (Filter)...");
  const n2 = page.locator('div[role="dialog"] div[role="button"]:has-text("Next"), div[role="dialog"] button:has-text("Next"), div[role="dialog"] div:has-text("ถัดไป")').last();
  await n2.click({ force: true });
  await page.waitForTimeout(2000);

  console.log("5. Filling Caption...");
  const captionBox = page.locator(
    'div[aria-label="Write a caption..."], div[aria-label="เขียนคำบรรยาย..."], div[aria-label="Add a caption..."], div[role="textbox"]'
  ).first();
  await captionBox.waitFor({ state: "visible", timeout: 8000 });
  await captionBox.click({ force: true });
  const captionText = `📣 #ปันโปรชวนชิม ชี้เป้าของอร่อย มจธ. บางมด! 🔥
📍 ร้านป้าอู๋ สุกี้หมูน้ำข้น & ข้าวราดแกง
✨ เมนูแนะนำ: สุกี้หมูน้ำข้นหม้อไฟ & กะเพราหมูสับไข่ดาว
💸 ราคา: 40.- อิ่มคุ้มงบนักศึกษา
📌 พิกัด: อาคาร S14 ชั้น 2 (โรงอาหารพระจอมเกล้าราชานุสรณ์ 190 ปี)
.
#KMUTT #มจธ #เด็กบางมด #ของกินบางมด #ปันโปร`;
  await captionBox.fill(captionText);
  await page.waitForTimeout(2000);

  console.log("6. Clicking REAL Share button in header...");
  // Using exact role button or header child div
  const realShareBtn = page.getByRole("button", { name: "Share", exact: true });
  console.log("Found real share button count:", await realShareBtn.count());
  await realShareBtn.click({ force: true });

  console.log("7. Waiting for upload animation / checkmark / dialog disappearance...");
  let shared = false;
  for (let i = 1; i <= 15; i++) {
    await page.waitForTimeout(2000);
    const dialog = page.locator('div[role="dialog"]');
    const isVisible = await dialog.isVisible();
    const text = isVisible ? await dialog.innerText() : "";
    console.log(`[Wait ${i*2}s] Dialog visible: ${isVisible}`);

    if (text.includes("Your post has been shared") || text.includes("แชร์โพสต์ของคุณแล้ว")) {
      console.log("🎉 SUCCESS: Found 'Your post has been shared'!");
      shared = true;
      break;
    }
    if (!isVisible) {
      console.log("🎉 SUCCESS: Dialog closed completely!");
      shared = true;
      break;
    }
  }

  // Update storage state
  await context.storageState({ path: "data/ig-session.json" });

  console.log("8. Navigating to profile to VERIFY the new post...");
  await page.goto("https://www.instagram.com/gen111_kmutt_market/", { waitUntil: "networkidle", timeout: 35000 });
  await page.waitForTimeout(3000);
  const links = await page.locator('a[href*="/p/"]').all();
  console.log(`=== Profile verification: Total posts found = ${links.length} ===`);
  for (const l of links) {
    console.log("Post URL: https://www.instagram.com" + await l.getAttribute("href"));
  }

  await browser.close();
}

testShare().catch(console.error);
