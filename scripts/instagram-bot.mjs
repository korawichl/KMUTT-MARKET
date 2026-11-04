#!/usr/bin/env node

/**
 * KMUTT Market Instagram Automation CLI Bot
 * Usage:
 *   node scripts/instagram-bot.mjs --help
 *   node scripts/instagram-bot.mjs --post-today
 *   node scripts/instagram-bot.mjs --shop=shop-s14-01 --theme=kmutt-orange
 *   node scripts/instagram-bot.mjs --event=mkt-evt-wed
 *   node scripts/instagram-bot.mjs --simulate
 *   node scripts/instagram-bot.mjs --daemon
 */

import { executeAutoPost, initScheduler, loadConfig, saveConfig, loadPostsHistory } from "../services/instagram-scheduler.mjs";

const args = process.argv.slice(2);

function getArgValue(name) {
  const match = args.find((a) => a.startsWith(`--${name}=`));
  if (match) return match.split("=")[1];
  return null;
}

const hasFlag = (name) => args.includes(`--${name}`);

if (hasFlag("help") || args.length === 0) {
  console.log(`
📸 KMUTT MARKET INSTAGRAM AUTOMATION BOT 🤖
=============================================
คำสั่งสำหรับใช้งานระบบสร้างโพสต์และโปรโมทตลาด มจธ. อัตโนมัติ

การใช้งาน:
  node scripts/instagram-bot.mjs [ตัวเลือก]

ตัวเลือก:
  --post-today         สร้างและโพสต์โปรโมทร้านค้า/ตลาดนัดประจำวันทันที
  --shop=<shopId>      ระบุร้านค้าที่ต้องการโพสต์ (เช่น --shop=shop-s14-01)
  --event=<eventId>    ระบุตลาดนัดที่ต้องการโพสต์ (เช่น --event=mkt-evt-wed)
  --theme=<themeKey>   เลือกธีมโปสเตอร์ (kmutt-orange, street-neon, cafe-pastel, market-fest)
  --tone=<toneName>    เลือกโทนแคปชั่น (student, foodie, official)
  --simulate           รันในโหมดจำลอง (ไม่ยิง API จริง บันทึกภาพและแคปชั่นเพื่อตรวจสอบ)
  --daemon             รันตัวตั้งเวลาอัตโนมัติในพื้นหลัง (Background Scheduler)
  --history            ดูประวัติโพสต์ย้อนหลัง 5 โพสต์ล่าสุด
  --help               แสดงคำอธิบายคำสั่งนี้

ตัวอย่าง:
  node scripts/instagram-bot.mjs --post-today --simulate
  node scripts/instagram-bot.mjs --shop=shop-s14-02 --theme=kmutt-orange --tone=student
  node scripts/instagram-bot.mjs --daemon
  `);
  process.exit(0);
}

if (hasFlag("history")) {
  const history = loadPostsHistory();
  console.log(`\n📋 ประวัติการโพสต์ย้อนหลัง (${history.length} โพสต์):\n`);
  history.slice(0, 5).forEach((p, idx) => {
    console.log(`[${idx + 1}] ${p.timestamp} | ${p.status.toUpperCase()} | ${p.title}`);
    console.log(`    🖼️ โปสเตอร์: ${p.posterUrl}`);
    console.log(`    🔗 ลิงก์: ${p.permalink || "N/A"}`);
    console.log("");
  });
  process.exit(0);
}

if (hasFlag("daemon")) {
  console.log("🚀 กำลังเริ่มต้น Instagram Automation Daemon Scheduler...");
  initScheduler();
  console.log("✅ ระบบกำลังทำงานในพื้นหลัง (กด Ctrl+C เพื่อหยุดการทำงาน)");
} else {
  const shopId = getArgValue("shop");
  const eventId = getArgValue("event");
  const theme = getArgValue("theme");
  const tone = getArgValue("tone");
  const isSimulation = hasFlag("simulate");

  console.log("⏳ กำลังสร้างโปสเตอร์และแคปชั่นโปรโมทตลาด มจธ....");

  executeAutoPost({
    shopId,
    marketEventId: eventId,
    themeKey: theme,
    tone,
    isSimulation,
  })
    .then((result) => {
      console.log("\n========================================================");
      console.log("🎉 โพสต์สำเร็จ!");
      console.log(`📌 ชื่อเรื่อง: ${result.post.title}`);
      console.log(`🎨 ธีม: ${result.post.theme} | โทน: ${result.post.tone}`);
      console.log(`🖼️ โปสเตอร์: ${result.post.posterUrl}`);
      console.log(`📁 ไฟล์รูปภาพในเครื่อง: ${result.poster.filePath}`);
      console.log(`📊 สถานะ: ${result.post.status} (${result.post.mode})`);
      if (result.post.permalink) {
        console.log(`🔗 Instagram Permalink: ${result.post.permalink}`);
      }
      console.log("────────────────────────────────────────────────────────");
      console.log("📝 แคปชั่นใต้โพสต์:");
      console.log(result.post.caption);
      console.log("========================================================\n");
    })
    .catch((err) => {
      console.error("\n❌ เกิดข้อผิดพลาด:", err.message);
      process.exit(1);
    });
}
