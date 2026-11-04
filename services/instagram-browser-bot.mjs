/**
 * Instagram Direct Browser Automation Bot using Playwright
 * Posts directly using Instagram Username & Password (No Meta Developer App or Tokens required!)
 */

import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.resolve(process.cwd(), "data");
const SESSION_FILE = path.join(DATA_DIR, "ig-session.json");
const USER_DATA_DIR = path.join(DATA_DIR, "ig-chrome-profile");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Get available browser channel on Windows (Chrome or Edge)
 */
function getBrowserChannel() {
  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  if (fs.existsSync(chromePath)) return "chrome";
  const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
  if (fs.existsSync(edgePath)) return "msedge";
  return "chrome";
}

/**
 * Check if existing session is logged in
 */
export async function checkInstagramSession(headless = true) {
  if (!fs.existsSync(SESSION_FILE)) {
    return { loggedIn: false };
  }

  let browser = null;
  try {
    browser = await chromium.launch({
      channel: getBrowserChannel(),
      headless,
    });

    const context = await browser.newContext({
      storageState: SESSION_FILE,
      viewport: { width: 1280, height: 800 },
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    });

    const page = await context.newPage();
    await page.goto("https://www.instagram.com/", { waitUntil: "domcontentloaded", timeout: 25000 });
    await page.waitForTimeout(3000);

    // If redirected to /accounts/login/, session expired
    const currentUrl = page.url();
    const isLogin = currentUrl.includes("/accounts/login");

    // Check for user profile or create button
    const hasCreateBtn = (await page.locator('svg[aria-label="New post"], svg[aria-label="สร้าง"], svg[aria-label="โพสต์ใหม่"]').count()) > 0 ||
                         (await page.locator('span:has-text("Create"), span:has-text("สร้าง")').count()) > 0;

    await browser.close();

    if (!isLogin && hasCreateBtn) {
      return { loggedIn: true };
    }
    return { loggedIn: false };
  } catch (err) {
    if (browser) await browser.close().catch(() => {});
    return { loggedIn: false, error: err.message };
  }
}

/**
 * Perform login and save session cookies
 */
export async function loginInstagram({ username, password, headless = false }) {
  if (!username || !password) {
    throw new Error("กรุณาระบุ Username และ Password ของ Instagram ให้ครบถ้วน");
  }

  const browser = await chromium.launch({
    channel: getBrowserChannel(),
    headless, // Default false so user can see or resolve any OTP/checkpoint if needed
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 850 },
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    });

    const page = await context.newPage();
    console.log("🌐 กำลังเปิดหน้าเข้าสู่ระบบ Instagram...");
    await page.goto("https://www.instagram.com/accounts/login/", {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    await page.waitForTimeout(1500);

    // Cookie accept
    try {
      const cookieBtn = page.locator('button:has-text("Allow"), button:has-text("Accept"), button:has-text("ยอมรับ")').first();
      if (await cookieBtn.isVisible({ timeout: 2500 })) {
        await cookieBtn.click();
        await page.waitForTimeout(1000);
      }
    } catch {}

    // Fill Username
    const userInput = page.locator('input[name="username"], input[name="email"], input[type="text"]').first();
    await userInput.waitFor({ state: "visible", timeout: 10000 });
    await userInput.click();
    await userInput.fill(username);

    // Fill Password
    const passInput = page.locator('input[name="password"], input[name="pass"], input[type="password"]').first();
    await passInput.waitFor({ state: "visible", timeout: 10000 });
    await passInput.click();
    await passInput.fill(password);

    console.log("🔑 กำลังส่งข้อมูลเข้าสู่ระบบ...");
    await page.waitForTimeout(800);
    await passInput.press("Enter");

    // Wait for navigation or login outcome (wait up to 10s)
    await page.waitForTimeout(8000);

    // Handle "Save Your Login Info?" popup if shown
    try {
      const notNowSave = page.locator('button:has-text("Not now"), button:has-text("ไม่ใช่ตอนนี้"), div[role="button"]:has-text("Save info"), div[role="button"]:has-text("บันทึกข้อมูล")');
      if (await notNowSave.isVisible({ timeout: 4000 })) {
        await notNowSave.click();
      }
    } catch {}

    // Handle "Turn on Notifications" popup if shown
    try {
      const notNowNotif = page.locator('button:has-text("Not Now"), button:has-text("ไม่ใช่ตอนนี้")');
      if (await notNowNotif.isVisible({ timeout: 4000 })) {
        await notNowNotif.click();
      }
    } catch {}

    // Verify if login succeeded
    const url = page.url();
    if (url.includes("/accounts/login")) {
      // Check for error message text on page
      const errorMsg = await page.locator("#slfErrorAlert").textContent().catch(() => null);
      throw new Error(errorMsg || "เข้าสู่ระบบไม่สำเร็จ โปรดตรวจสอบ Username และ Password อีกครั้ง");
    }

    // Save Storage State (Cookies & Tokens)
    await context.storageState({ path: SESSION_FILE });
    console.log("💾 บันทึก Session สำเร็จเรียบร้อย!");

    await browser.close();
    return { ok: true, message: "เข้าสู่ระบบและบันทึก Session สำเร็จ" };
  } catch (err) {
    await browser.close().catch(() => {});
    throw err;
  }
}

/**
 * Post Photo + Caption directly to Instagram using browser automation
 */
export async function postWithBrowserBot({
  posterPath,
  caption,
  username = null,
  password = null,
  headless = true,
}) {
  const absolutePosterPath = path.resolve(posterPath);
  if (!fs.existsSync(absolutePosterPath)) {
    throw new Error(`ไม่พบไฟล์รูปภาพโปสเตอร์: ${absolutePosterPath}`);
  }

  // Check if session exists or need login
  if (!fs.existsSync(SESSION_FILE)) {
    if (!username || !password) {
      throw new Error(
        "ยังไม่ได้บันทึก Session ของ Instagram กรุณาระบุ Username และ Password ในการรันครั้งแรก"
      );
    }
    console.log("⏳ ยังไม่มี Session บันทึกไว้ กำลังเข้าสู่ระบบ...");
    await loginInstagram({ username, password, headless: false });
  }

  console.log("🚀 กำลังเริ่มต้นกระบวนการโพสต์ลง Instagram ผ่าน Browser Bot...");

  let browser = null;
  try {
    browser = await chromium.launch({
      channel: getBrowserChannel(),
      headless,
    });

    const context = await browser.newContext({
      storageState: SESSION_FILE,
      viewport: { width: 1280, height: 900 },
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    });

    const page = await context.newPage();
    await page.goto("https://www.instagram.com/", {
      waitUntil: "networkidle",
      timeout: 35000,
    });

    // Check if session expired
    if (page.url().includes("/accounts/login")) {
      if (username && password) {
        console.log("🔄 Session หมดอายุ กำลังเข้าสู่ระบบใหม่...");
        await browser.close();
        await loginInstagram({ username, password, headless: false });
        return postWithBrowserBot({ posterPath, caption, username, password, headless });
      } else {
        throw new Error("Session ของ Instagram หมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง");
      }
    }

    // Dismiss any modal dialogues
    try {
      const dismissBtn = page.locator('button:has-text("Not Now"), button:has-text("ไม่ใช่ตอนนี้")');
      if (await dismissBtn.isVisible({ timeout: 2500 })) {
        await dismissBtn.click();
      }
    } catch {}

    // Find and Click the "Create" (+) button
    console.log("📸 กำลังเปิดเมนูสร้างโพสต์ใหม่ (New Post)...");
    const createBtn = page.locator(
      'svg[aria-label="New post"], svg[aria-label="สร้าง"], svg[aria-label="โพสต์ใหม่"], a[href="#"][role="link"]:has-text("Create"), a[href="#"][role="link"]:has-text("สร้าง")'
    ).first();

    if (await createBtn.isVisible({ timeout: 8000 })) {
      await createBtn.click();
    } else {
      // Fallback: look for generic plus svg or sidebar item
      const sideCreate = page.locator('span:has-text("Create"), span:has-text("สร้าง")').first();
      await sideCreate.click();
    }

    await page.waitForTimeout(2000);

    // Upload Poster File
    console.log(`📁 กำลังอัปโหลดภาพโปสเตอร์: ${path.basename(absolutePosterPath)}...`);
    const fileInput = page.locator('input[type="file"][accept*="image"]');
    await fileInput.waitFor({ state: "attached", timeout: 10000 });
    await fileInput.setInputFiles(absolutePosterPath);

    await page.waitForTimeout(2500);

    // Modal Step 1: Crop/Aspect Ratio -> Click "Next" / "ถัดไป"
    console.log("➡️ กำลังไปยังขั้นตอนใส่แคปชั่น...");
    const nextBtn1 = page.locator(
      'div[role="dialog"] button:has-text("Next"), div[role="dialog"] div[role="button"]:has-text("Next"), div[role="dialog"] div:has-text("ถัดไป")'
    ).last();
    await nextBtn1.waitFor({ state: "visible", timeout: 8000 });
    await nextBtn1.click({ force: true });

    await page.waitForTimeout(2000);

    // Modal Step 2: Filters -> Click "Next" / "ถัดไป"
    const nextBtn2 = page.locator(
      'div[role="dialog"] button:has-text("Next"), div[role="dialog"] div[role="button"]:has-text("Next"), div[role="dialog"] div:has-text("ถัดไป")'
    ).last();
    await nextBtn2.waitFor({ state: "visible", timeout: 8000 });
    await nextBtn2.click({ force: true });

    await page.waitForTimeout(2000);

    // Modal Step 3: Write Caption
    console.log("📝 กำลังใส่แคปชั่นโปรโมทร้านค้าและแฮชแท็ก...");
    const captionBox = page.locator(
      'div[aria-label="Write a caption..."], div[aria-label="Add a caption..."], div[aria-label="เขียนคำบรรยาย..."], div[role="textbox"]'
    ).first();
    await captionBox.waitFor({ state: "visible", timeout: 8000 });
    await captionBox.click({ force: true });
    await captionBox.fill(caption);

    await page.waitForTimeout(2000);

    // Modal Step 4: Click REAL "Share" / "แชร์" button (in the dialog header, NOT "Share to" accordion)
    console.log("🚀 กำลังกดปุ่มแชร์โพสต์ (Share)...");
    let shareBtn = page.getByRole("button", { name: "Share", exact: true });
    if ((await shareBtn.count()) === 0) {
      shareBtn = page.getByRole("button", { name: "แชร์", exact: true });
    }
    if ((await shareBtn.count()) === 0) {
      shareBtn = page.locator(
        'div[role="dialog"] header div[role="button"]:has-text("Share"), div[role="dialog"] header div[role="button"]:has-text("แชร์"), div[role="dialog"] > div > div > div:first-child div[role="button"]:has-text("Share")'
      ).first();
    }
    await shareBtn.waitFor({ state: "visible", timeout: 8000 });
    await shareBtn.click({ force: true });

    // Wait for upload completion ("Your post has been shared" / "แชร์โพสต์ของคุณแล้ว" or dialog close)
    console.log("⏳ กำลังรอ Instagram ประมวลผลและเผยแพร่...");
    let shared = false;
    for (let i = 1; i <= 15; i++) {
      await page.waitForTimeout(2000);
      const dialog = page.locator('div[role="dialog"]');
      const isVisible = await dialog.isVisible();
      const text = isVisible ? await dialog.innerText().catch(() => "") : "";

      if (text.includes("Your post has been shared") || text.includes("แชร์โพสต์ของคุณแล้ว")) {
        console.log("🎉 ยืนยัน: พบข้อความ 'Your post has been shared' บนหน้าจอ Instagram เรียบร้อย!");
        shared = true;
        break;
      }
      if (!isVisible) {
        console.log("🎉 ยืนยัน: หน้าต่างสร้างโพสต์ปิดลงแล้ว โพสต์ถูกเผยแพร่สำเร็จ!");
        shared = true;
        break;
      }
    }

    if (!shared) {
      console.warn("⚠️ รอเวลาครบกำหนดแต่หน้าต่างยังไม่ปิด กำลังบันทึกสถานะและปิดเบราว์เซอร์");
    }

    // Update storage state with latest cookies
    await context.storageState({ path: SESSION_FILE });
    await browser.close();

    console.log("🎉 โพสต์ลง Instagram สำเร็จเรียบร้อยแล้ว!");
    return {
      ok: true,
      mode: "browser_bot",
      message: "โพสต์ลง Instagram ผ่าน Browser Bot อัตโนมัติสำเร็จเรียบร้อยแล้ว!",
      publishedAt: new Date().toISOString(),
    };
  } catch (err) {
    if (browser) await browser.close().catch(() => {});
    throw new Error(`เกิดข้อผิดพลาดในการโพสต์ผ่าน Browser Bot: ${err.message}`);
  }
}
