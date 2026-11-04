import { chromium } from "playwright-core";
import fs from "node:fs";

async function test() {
  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 850 },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  });

  const page = await context.newPage();
  console.log("🌐 Navigating to Instagram login...");
  await page.goto("https://www.instagram.com/accounts/login/", {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(3000);

  // Fill User
  const userInput = page.locator('input[name="username"], input[name="email"], input[type="text"]').first();
  await userInput.waitFor({ state: "visible", timeout: 8000 });
  await userInput.click();
  await userInput.fill("gen111_kmutt_market");
  console.log("👤 Filled username: gen111_kmutt_market");

  // Fill Pass
  const passInput = page.locator('input[name="password"], input[name="pass"], input[type="password"]').first();
  await passInput.waitFor({ state: "visible", timeout: 8000 });
  await passInput.click();
  await passInput.fill("Wichking_10");
  console.log("🔑 Filled password");

  // Press Enter to submit
  await page.waitForTimeout(1000);
  console.log("🚀 Pressing Enter to submit...");
  await passInput.press("Enter");

  await page.waitForTimeout(10000);
  console.log("📍 Post-login URL:", page.url());

  const bodyText = await page.innerText("body");
  console.log("📄 Page Text excerpt:", bodyText.slice(0, 300).replace(/\n+/g, " "));

  if (bodyText.includes("incorrect") || bodyText.includes("ไม่ถูกต้อง")) {
    console.log("❌ รหัสผ่านไม่ถูกต้อง");
  } else if (bodyText.includes("Save Your Login Info") || bodyText.includes("บันทึกข้อมูลการเข้าสู่ระบบ") || !page.url().includes("/accounts/login")) {
    console.log("🎉 เข้าสู่ระบบสำเร็จ 100%!");
    await context.storageState({ path: "data/ig-session.json" });
    console.log("💾 Saved session to data/ig-session.json");
  } else {
    console.log("ℹ️ Check page screenshot public/posters/post_login.png");
  }

  await page.screenshot({ path: "public/posters/post_login.png" });
  await browser.close();
}

test().catch(console.error);
