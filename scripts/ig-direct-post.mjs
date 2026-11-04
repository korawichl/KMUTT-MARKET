#!/usr/bin/env node

/**
 * Direct Instagram Auto-Poster via Browser Bot
 * No Meta App / No Tokens needed — uses Username & Password directly!
 * 
 * Usage:
 *   node scripts/ig-direct-post.mjs --login --username=your_user --password=your_pass
 *   node scripts/ig-direct-post.mjs --post-today
 *   node scripts/ig-direct-post.mjs --shop=shop-s14-01
 *   node scripts/ig-direct-post.mjs --check-session
 */

import path from "node:path";
import fs from "node:fs";
import { loginInstagram, postWithBrowserBot, checkInstagramSession } from "../services/instagram-browser-bot.mjs";
import { generateShopPoster, generateMarketEventPoster } from "../services/poster-generator.mjs";
import { generateShopCaptionTemplate, generateMarketEventCaptionTemplate } from "../services/caption-generator.mjs";
import { loadConfig, saveConfig, recordPost } from "../services/instagram-scheduler.mjs";

const args = process.argv.slice(2);
function getArg(name) {
  const match = args.find((a) => a.startsWith(`--${name}=`));
  if (match) return match.split("=")[1];
  return null;
}
const hasFlag = (name) => args.includes(`--${name}`);

const DB_FILE = path.resolve(process.cwd(), "data", "kmutt-market-db.json");
const db = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
const config = loadConfig();

const username = getArg("username") || config.igUsername || process.env.IG_USERNAME;
const password = getArg("password") || config.igPassword || process.env.IG_PASSWORD;
const headless = !hasFlag("headful");

if (hasFlag("help") || args.length === 0) {
  console.log(`
🤖 KMUTT Instagram Direct Browser Bot (ไม่ต้องใช้ Token!)
==========================================================
การใช้งาน:
  node scripts/ig-direct-post.mjs [คำสั่ง/ตัวเลือก]

คำสั่งหลัก:
  --login              ล็อกอินเข้าสู่ระบบ Instagram และบันทึก Session ไว้ในเครื่อง
                       (ครั้งต่อไปไม่ต้องใส่รหัสผ่านอีก)
  --post-today         สุ่มร้านเด็ดใน มจธ. สร้างภาพโปสเตอร์ + แคปชั่น และโพสต์ลงไอจีทันที
  --shop=<shopId>      เลือกโพสต์ร้านค้าที่ระบุ (เช่น --shop=shop-s14-01)
  --event=<eventId>    เลือกโพสต์ตลาดนัด S2 (เช่น --event=mkt-evt-wed)
  --check-session      ตรวจสอบสถานะการเข้าสู่ระบบว่า Session ยังใช้งานได้หรือไม่

ตัวเลือกเสริม:
  --username=<user>    ระบุ IG Username
  --password=<pass>    ระบุ IG Password
  --headful            เปิดหน้าต่างเบราว์เซอร์ Chrome ให้เห็นการทำงานแบบสดๆ
  --theme=<themeKey>   เลือกธีมโปสเตอร์ (kmutt-orange, street-neon, cafe-pastel, market-fest)
  --tone=<tone>        เลือกโทนแคปชั่น (student, foodie, official)

ตัวอย่าง:
  node scripts/ig-direct-post.mjs --login --username=my_shop_ig --password=mypassword
  node scripts/ig-direct-post.mjs --post-today --headful
  node scripts/ig-direct-post.mjs --shop=shop-s14-02
  `);
  process.exit(0);
}

async function run() {
  if (hasFlag("check-session")) {
    console.log("🔍 กำลังตรวจสอบสถานะการเข้าสู่ระบบ Instagram...");
    const check = await checkInstagramSession(headless);
    if (check.loggedIn) {
      console.log("✅ สถานะ: เข้าสู่ระบบอยู่แล้ว พร้อมโพสต์ได้ทันที!");
    } else {
      console.log("❌ สถานะ: ยังไม่ได้เข้าสู่ระบบ หรือ Session หมดอายุ กรุณารันคำสั่ง --login");
    }
    return;
  }

  if (hasFlag("login")) {
    if (!username || !password) {
      console.error("❌ กรุณาระบุ --username=... และ --password=...");
      process.exit(1);
    }
    console.log(`🔑 กำลังล็อกอินเข้าสู่ระบบสำหรับบัญชี: @${username}...`);
    // Save credentials to config for future convenience
    saveConfig({ igUsername: username, igPassword: password });
    await loginInstagram({ username, password, headless: false });
    console.log("🎉 เข้าสู่ระบบสำเร็จและบันทึก Session เรียบร้อยแล้ว! สามารถใช้ --post-today ได้เลย");
    return;
  }

  // Handle Posting
  const shopId = getArg("shop");
  const eventId = getArg("event");
  const themeKey = getArg("theme") || config.defaultTheme || "kmutt-orange";
  const tone = getArg("tone") || config.defaultTone || "student";

  let targetShop = null;
  let targetProduct = null;
  let targetEvent = null;
  let posterResult = null;
  let caption = "";
  let title = "";

  if (eventId) {
    targetEvent = db.market_events?.find((e) => e.id === eventId);
    if (!targetEvent) throw new Error("ไม่พบกิจกรรมตลาดนัด");
    title = targetEvent.name;
    const featuredShops = (db.shops || []).slice(0, 4);
    posterResult = await generateMarketEventPoster({ marketEvent: targetEvent, featuredShops, themeKey });
    caption = generateMarketEventCaptionTemplate({ marketEvent: targetEvent, featuredShops, tone });
  } else {
    if (shopId) {
      targetShop = db.shops?.find((s) => s.id === shopId);
    } else {
      // Pick random active shop
      const activeShops = (db.shops || []).filter((s) => s.status === "active");
      targetShop = activeShops[Math.floor(Math.random() * activeShops.length)];
    }
    if (!targetShop) throw new Error("ไม่พบข้อมูลร้านค้า");
    targetProduct = (db.products || []).find((p) => p.shop_id === targetShop.id && p.is_recommended) ||
                    (db.products || []).find((p) => p.shop_id === targetShop.id) || null;
    title = `${targetShop.name} (${targetShop.building_name || "มจธ."})`;
    posterResult = await generateShopPoster({ shop: targetShop, product: targetProduct, themeKey });
    caption = generateShopCaptionTemplate({ shop: targetShop, product: targetProduct, tone });
  }

  console.log(`\n🖼️ สร้างภาพโปสเตอร์ 1080x1350 สำเร็จ: ${posterResult.url}`);
  console.log(`📝 สร้างแคปชั่นความยาว: ${caption.length} ตัวอักษร`);

  // Execute Browser Bot Post
  console.log("\n🤖 กำลังเปิด Browser Bot โพสต์ลง Instagram...");
  const postResult = await postWithBrowserBot({
    posterPath: posterResult.filePath,
    caption,
    username,
    password,
    headless,
  });

  // Record to history
  recordPost({
    id: `post_bot_${Date.now()}`,
    timestamp: new Date().toISOString(),
    type: targetEvent ? "market_event" : "shop",
    targetId: targetEvent ? targetEvent.id : targetShop.id,
    title,
    theme: themeKey,
    tone,
    posterUrl: posterResult.url,
    caption,
    status: "published",
    mode: "browser_bot",
    permalink: "https://www.instagram.com/",
  });

  console.log("\n========================================================");
  console.log("🎉 เผยแพร่โพสต์ลง Instagram ผ่าน Browser Bot เรียบร้อยแล้ว!");
  console.log(`📌 ชื่อเรื่อง: ${title}`);
  console.log(`📁 รูปภาพ: ${posterResult.filePath}`);
  console.log("========================================================\n");
}

run().catch((err) => {
  console.error("\n❌ เกิดข้อผิดพลาด:", err.message);
  process.exit(1);
});
