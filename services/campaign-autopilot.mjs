/**
 * Autonomous 100-Post Campaign Auto-Pilot Engine for KMUTT Market
 * Posts 100 unique food spots in & around KMUTT, then automatically stops.
 */

import fs from "node:fs";
import path from "node:path";
import { KMUTT_100_SPOTS } from "../data/campaign-100-shops.mjs";
import { generatePunproPoster } from "./poster-generator.mjs";
import { postWithBrowserBot } from "./instagram-browser-bot.mjs";
import { recordPost } from "./instagram-scheduler.mjs";
import { generateKmuttHumanCaption } from "./caption-generator.mjs";

const DATA_DIR = path.resolve(process.cwd(), "data");
const CAMPAIGN_FILE = path.join(DATA_DIR, "campaign-state.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DEFAULT_STATE = {
  targetCount: 100,
  completedCount: 0,
  currentIndex: 0,
  status: "idle", // idle | running | paused | completed
  intervalMinutes: 5, // 5 minutes interval as requested by user
  lastPostAt: null,
  nextPostAt: null,
  posts: [],
};

export function loadCampaignState() {
  try {
    if (!fs.existsSync(CAMPAIGN_FILE)) {
      fs.writeFileSync(CAMPAIGN_FILE, JSON.stringify(DEFAULT_STATE, null, 2), "utf-8");
      return DEFAULT_STATE;
    }
    const data = JSON.parse(fs.readFileSync(CAMPAIGN_FILE, "utf-8"));
    return { ...DEFAULT_STATE, ...data };
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveCampaignState(updates) {
  const current = loadCampaignState();
  const nextState = { ...current, ...updates };
  fs.writeFileSync(CAMPAIGN_FILE, JSON.stringify(nextState, null, 2), "utf-8");
  return nextState;
}

/**
 * Generate Authentic KMUTT Student Food Guide Caption
 * Not copying Punpro - focusing on why you should eat here and what menus they have!
 */
function createSpotCaption(spot) {
  return generateKmuttHumanCaption({
    shop: {
      name: spot.name,
      building_name: spot.location,
      location_description: spot.zone,
      tags: spot.tags,
    },
    product: {
      name: spot.dish,
      price: spot.price,
      description: spot.desc,
    },
    customDetails: spot,
  });
}

let campaignIntervalTimer = null;

/**
 * Execute next post in the 100-post campaign
 */
export async function executeNextCampaignPost(headless = true) {
  const state = loadCampaignState();

  if (state.completedCount >= state.targetCount) {
    saveCampaignState({ status: "completed" });
    console.log("🎉 แคมเปญโพสต์ครบ 100 โพสต์แล้ว! ระบบหยุดการทำงานอัตโนมัติเรียบร้อย");
    return { ok: true, completed: true, message: "แคมเปญครบ 100 โพสต์แล้ว" };
  }

  const spot = KMUTT_100_SPOTS[state.currentIndex];
  if (!spot) {
    saveCampaignState({ status: "completed" });
    return { ok: true, completed: true, message: "ไม่พบข้อมูลร้านค้าเพิ่มเติม" };
  }

  console.log(`\n========================================================`);
  console.log(`🚀 [แคมเปญอัตโนมัติ] กำลังโพสต์รายการที่ ${state.completedCount + 1}/${state.targetCount}`);
  console.log(`🏪 ร้าน: ${spot.name} (${spot.zone})`);
  console.log(`🍽️ เมนู: ${spot.dish} [${spot.price}]`);
  console.log(`========================================================\n`);

  // 1. Generate Poster
  const shopObj = {
    name: spot.name,
    building_name: spot.location,
    location_description: spot.zone,
    slug: spot.id,
    tags: spot.tags,
  };
  const productObj = {
    name: spot.dish,
    price: spot.price.replace(/[^0-9]/g, ""),
    image_url: spot.image,
  };

  const posterResult = await generatePunproPoster({
    shop: shopObj,
    product: productObj,
    customHeadline: `ชี้เป้าของอร่อย ${spot.zone}!`,
  });

  // 2. Generate Caption
  const caption = createSpotCaption(spot);

  // 3. Post to Instagram via Browser Bot
  const postResult = await postWithBrowserBot({
    posterPath: posterResult.filePath,
    caption,
    headless,
  });

  // 4. Update campaign state
  const nextCompleted = state.completedCount + 1;
  const nextIndex = state.currentIndex + 1;
  const isAllDone = nextCompleted >= state.targetCount;

  const now = new Date();
  const nextTime = new Date(now.getTime() + state.intervalMinutes * 60 * 1000);

  const postRecord = {
    id: `campaign_${spot.id}_${Date.now()}`,
    campaignIndex: state.completedCount + 1,
    timestamp: now.toISOString(),
    spotId: spot.id,
    name: spot.name,
    dish: spot.dish,
    price: spot.price,
    zone: spot.zone,
    posterUrl: posterResult.url,
    status: "published",
    mode: "browser_bot",
  };

  const updatedPosts = [postRecord, ...state.posts];

  saveCampaignState({
    completedCount: nextCompleted,
    currentIndex: nextIndex,
    lastPostAt: now.toISOString(),
    nextPostAt: isAllDone ? null : nextTime.toISOString(),
    status: isAllDone ? "completed" : state.status,
    posts: updatedPosts,
  });

  // Also record to main post history
  recordPost({
    id: postRecord.id,
    timestamp: postRecord.timestamp,
    type: "shop",
    targetId: spot.id,
    title: `${spot.name} - ${spot.dish}`,
    theme: "punpro",
    tone: "punpro",
    posterUrl: posterResult.url,
    caption,
    status: "published",
    mode: "browser_bot",
    permalink: "https://www.instagram.com/",
  });

  console.log(`✅ [แคมเปญ] โพสต์สำเร็จเรียบร้อย! (${nextCompleted}/${state.targetCount})`);
  if (!isAllDone) {
    console.log(`⏰ โพสต์ถัดไปเวลา: ${nextTime.toLocaleTimeString("th-TH", { timeZone: "Asia/Bangkok" })} น. (อีก ${state.intervalMinutes} นาที)`);
  } else {
    console.log(`🎉 สิ้นสุดแคมเปญ 100 โพสต์แล้ว! ระบบหยุดทำงานอัตโนมัติ`);
  }

  return {
    ok: true,
    completed: isAllDone,
    post: postRecord,
    progress: `${nextCompleted}/${state.targetCount}`,
  };
}

/**
 * Start the autonomous campaign runner
 */
export function startAutonomousCampaign({ intervalMinutes = 5, headless = true } = {}) {
  const state = loadCampaignState();
  if (state.completedCount >= state.targetCount) {
    console.log("แคมเปญ 100 โพสต์เสร็จสิ้นเรียบร้อยแล้ว หากต้องการเริ่มใหม่ให้รีเซ็ตสถานะก่อน");
    return state;
  }

  const nextState = saveCampaignState({
    status: "running",
    intervalMinutes: intervalMinutes || state.intervalMinutes || 5,
  });

  console.log(`🚀 กำลังเริ่มแคมเปญโพสต์อัตโนมัติ 100 โพสต์ (ความถี่: ทุกๆ ${nextState.intervalMinutes} นาที)...`);

  // Execute first post immediately
  executeNextCampaignPost(headless).catch((err) => {
    console.error("ข้อผิดพลาดในโพสต์แรกของแคมเปญ:", err.message);
  });

  // Init background loop check every 15s for precise timing
  if (!campaignIntervalTimer) {
    campaignIntervalTimer = setInterval(async () => {
      try {
        const cur = loadCampaignState();
        if (cur.status !== "running") return;
        if (cur.completedCount >= cur.targetCount) {
          saveCampaignState({ status: "completed" });
          clearInterval(campaignIntervalTimer);
          campaignIntervalTimer = null;
          console.log("🎉 แคมเปญครบ 100 โพสต์แล้ว! ระบบหยุดทำงานอัตโนมัติ");
          return;
        }

        if (cur.nextPostAt && new Date() >= new Date(cur.nextPostAt)) {
          console.log(`\n⏰ [${new Date().toLocaleTimeString("th-TH")}] ถึงเวลาโพสต์ถัดไปของแคมเปญ (${cur.completedCount + 1}/${cur.targetCount})...`);
          await executeNextCampaignPost(true);
        }
      } catch (e) {
        console.error("Campaign loop error:", e.message);
      }
    }, 15000);
  }

  return nextState;
}

/**
 * Pause the campaign
 */
export function pauseAutonomousCampaign() {
  saveCampaignState({ status: "paused" });
  console.log("⏸️ หยุดการทำงานของแคมเปญชั่วคราว");
  return loadCampaignState();
}

/**
 * Reset campaign state to 0
 */
export function resetAutonomousCampaign() {
  const reset = {
    targetCount: 100,
    completedCount: 0,
    currentIndex: 0,
    status: "idle",
    intervalMinutes: 20,
    lastPostAt: null,
    nextPostAt: null,
    posts: [],
  };
  fs.writeFileSync(CAMPAIGN_FILE, JSON.stringify(reset, null, 2), "utf-8");
  console.log("🔄 รีเซ็ตแคมเปญ 100 โพสต์เรียบร้อย");
  return reset;
}
