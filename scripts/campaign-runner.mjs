#!/usr/bin/env node

/**
 * Autonomous 100-Post Campaign CLI Runner
 * Posts 100 unique shops in & around KMUTT automatically, then terminates.
 * 
 * Usage:
 *   node scripts/campaign-runner.mjs --start [--interval=20]
 *   node scripts/campaign-runner.mjs --status
 *   node scripts/campaign-runner.mjs --post-next
 *   node scripts/campaign-runner.mjs --pause
 *   node scripts/campaign-runner.mjs --reset
 */

import {
  loadCampaignState,
  startAutonomousCampaign,
  executeNextCampaignPost,
  pauseAutonomousCampaign,
  resetAutonomousCampaign,
} from "../services/campaign-autopilot.mjs";
import { KMUTT_100_SPOTS } from "../data/campaign-100-shops.mjs";

const args = process.argv.slice(2);
function getArg(name) {
  const match = args.find((a) => a.startsWith(`--${name}=`));
  if (match) return match.split("=")[1];
  return null;
}
const hasFlag = (name) => args.includes(`--${name}`);

if (hasFlag("help") || args.length === 0) {
  const state = loadCampaignState();
  console.log(`
🤖 KMUTT MARKET AUTONOMOUS 100-POST CAMPAIGN 🚀
================================================
ระบบโพสต์อัตโนมัติ 100 ร้านในและรอบ มจธ. สไตล์ปันโปร แล้วหยุดทำงานเองอัตโนมัติ

สถานะปัจจุบัน:
  • โพสต์สำเร็จแล้ว: ${state.completedCount} / ${state.targetCount} โพสต์ (${Math.round((state.completedCount / state.targetCount) * 100)}%)
  • สถานะ: ${state.status.toUpperCase()}
  • ระยะห่างระหว่างโพสต์: ทุกๆ ${state.intervalMinutes} นาที
  • โพสต์ถัดไป: ${state.nextPostAt ? new Date(state.nextPostAt).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" }) : "ไม่มี"}

คำสั่งการใช้งาน:
  --start             เริ่มแคมเปญ 100 โพสต์อัตโนมัติ (รันในพื้นหลัง)
  --interval=<นาที>   ตั้งเวลาระยะห่างระหว่างโพสต์ (ค่าเริ่มต้น: 20 นาที เพื่อความปลอดภัยของไอจี)
  --status            ดูความคืบหน้าของแคมเปญ
  --post-next         สั่งยิงโพสต์ถัดไปทันที 1 โพสต์
  --pause             หยุดการทำงานชั่วคราว
  --reset             รีเซ็ตตัวนับกลับไปที่ 0
  --headful           เปิดหน้าต่าง Chrome ให้เห็นตอนบอทโพสต์สดๆ

ตัวอย่าง:
  node scripts/campaign-runner.mjs --start --interval=15
  node scripts/campaign-runner.mjs --status
  node scripts/campaign-runner.mjs --post-next
  `);
  process.exit(0);
}

async function main() {
  if (hasFlag("status")) {
    const state = loadCampaignState();
    console.log(`\n📊 รายงานสถานะแคมเปญ 100 โพสต์:`);
    console.log(`  • ความคืบหน้า: ${state.completedCount}/${state.targetCount} โพสต์ (${Math.round((state.completedCount / state.targetCount) * 100)}%)`);
    console.log(`  • สถานะ: ${state.status}`);
    console.log(`  • โพสต์ล่าสุดเมื่อ: ${state.lastPostAt ? new Date(state.lastPostAt).toLocaleString("th-TH") : "ยังไม่เริ่ม"}`);
    console.log(`  • โพสต์ถัดไป: ${state.nextPostAt ? new Date(state.nextPostAt).toLocaleString("th-TH") : "-"}`);
    console.log(`  • ร้านถัดไปในคิว: ${KMUTT_100_SPOTS[state.currentIndex]?.name || "ครบแล้ว"} (${KMUTT_100_SPOTS[state.currentIndex]?.zone || ""})`);
    console.log("");
    return;
  }

  if (hasFlag("pause")) {
    pauseAutonomousCampaign();
    console.log("⏸️ หยุดแคมเปญชั่วคราวเรียบร้อยแล้ว");
    return;
  }

  if (hasFlag("reset")) {
    resetAutonomousCampaign();
    console.log("🔄 รีเซ็ตแคมเปญเรียบร้อยแล้ว");
    return;
  }

  if (hasFlag("post-next")) {
    const headless = !hasFlag("headful");
    console.log("⚡ กำลังสั่งรันโพสต์ถัดไปของแคมเปญทันที...");
    const res = await executeNextCampaignPost(headless);
    console.log("ผลลัพธ์:", res);
    return;
  }

  if (hasFlag("start")) {
    const intervalMinutes = Number(getArg("interval") || 5);
    const headless = !hasFlag("headful");
    console.log(`🚀 กำลังเริ่มต้นแคมเปญ 100 โพสต์อัตโนมัติ (ห่างกันทุกๆ ${intervalMinutes} นาที)...`);
    startAutonomousCampaign({ intervalMinutes, headless });
    console.log("✅ ระบบเริ่มทำงานแล้วและจะโพสต์ต่อไปเรื่อยๆ จนครบ 100 โพสต์แล้วจะหยุดเองอัตโนมัติ!");
    return;
  }
}

main().catch((err) => {
  console.error("❌ เกิดข้อผิดพลาด:", err.message);
  process.exit(1);
});
