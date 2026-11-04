import fs from "node:fs";
import path from "node:path";
import { generateShopPoster, generateMarketEventPoster } from "./poster-generator.mjs";
import { generateShopCaptionTemplate, generateMarketEventCaptionTemplate, generateCaptionWithAI } from "./caption-generator.mjs";
import { publishToInstagram } from "./instagram-api.mjs";

const DATA_DIR = path.resolve(process.cwd(), "data");
const CONFIG_FILE = path.join(DATA_DIR, "instagram-config.json");
const POSTS_FILE = path.join(DATA_DIR, "instagram-posts.json");
const DB_FILE = path.join(DATA_DIR, "kmutt-market-db.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DEFAULT_CONFIG = {
  accountId: process.env.INSTAGRAM_ACCOUNT_ID || "",
  accessToken: process.env.INSTAGRAM_ACCESS_TOKEN || "",
  publicBaseUrl: process.env.PUBLIC_BASE_URL || "",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  autoPilotEnabled: false,
  scheduleTime: "10:30", // 10:30 น. ก่อนมื้อเที่ยง
  marketAlertEnabled: true,
  marketAlertTime: "07:30", // 07:30 น. วันอังคาร-พฤหัสบดี
  defaultTone: "student", // 'student' | 'foodie' | 'official'
  defaultTheme: "kmutt-orange", // 'kmutt-orange' | 'street-neon' | 'cafe-pastel' | 'market-fest'
  lastRunDate: null,
};

/**
 * Load configuration
 */
export function loadConfig() {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2), "utf-8");
      return DEFAULT_CONFIG;
    }
    const data = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
    return { ...DEFAULT_CONFIG, ...data };
  } catch {
    return DEFAULT_CONFIG;
  }
}

/**
 * Save configuration
 */
export function saveConfig(updates) {
  const current = loadConfig();
  const nextConfig = { ...current, ...updates };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(nextConfig, null, 2), "utf-8");
  return nextConfig;
}

/**
 * Load post history
 */
export function loadPostsHistory() {
  try {
    if (!fs.existsSync(POSTS_FILE)) {
      fs.writeFileSync(POSTS_FILE, JSON.stringify([], null, 2), "utf-8");
      return [];
    }
    return JSON.parse(fs.readFileSync(POSTS_FILE, "utf-8")) || [];
  } catch {
    return [];
  }
}

/**
 * Save post to history
 */
export function recordPost(post) {
  const posts = loadPostsHistory();
  posts.unshift(post);
  // Keep last 100 posts
  const trimmed = posts.slice(0, 100);
  fs.writeFileSync(POSTS_FILE, JSON.stringify(trimmed, null, 2), "utf-8");
  return post;
}

/**
 * Helper to get current Bangkok time
 */
export function getBangkokTime() {
  const now = new Date();
  const bkkDateStr = now.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" }); // YYYY-MM-DD
  const bkkTimeParts = now.toLocaleTimeString("en-GB", { timeZone: "Asia/Bangkok", hour12: false }).split(":");
  const hours = bkkTimeParts[0];
  const minutes = bkkTimeParts[1];
  const timeStr = `${hours}:${minutes}`;
  const dayOfWeek = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" })).getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat

  return {
    dateStr: bkkDateStr,
    timeStr,
    dayOfWeek,
    hours: Number(hours),
    minutes: Number(minutes),
  };
}

/**
 * Helper to read KMUTT Database
 */
function getMarketDb() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
  } catch {
    return { shops: [], products: [], market_events: [] };
  }
}

/**
 * Execute automated post promotion for a Shop or Market Event
 */
export async function executeAutoPost({
  shopId = null,
  marketEventId = null,
  themeKey = null,
  tone = null,
  isSimulation = null,
} = {}) {
  const config = loadConfig();
  const db = getMarketDb();

  const activeTheme = themeKey || config.defaultTheme || "kmutt-orange";
  const activeTone = tone || config.defaultTone || "student";
  const simulationMode = isSimulation !== null ? isSimulation : (!config.accountId || !config.accessToken);

  let targetShop = null;
  let targetProduct = null;
  let targetEvent = null;

  // 1. Identify target
  if (marketEventId) {
    targetEvent = db.market_events?.find((e) => e.id === marketEventId);
  } else if (shopId) {
    targetShop = db.shops?.find((s) => s.id === shopId);
    if (targetShop) {
      targetProduct = db.products?.find((p) => p.shop_id === targetShop.id && p.is_recommended) ||
                      db.products?.find((p) => p.shop_id === targetShop.id) || null;
    }
  } else {
    // Pick recommended or active shop automatically
    const validShops = (db.shops || []).filter((s) => s.status === "active");
    if (validShops.length > 0) {
      // Prioritize shops that haven't been posted recently
      const history = loadPostsHistory();
      const recentShopIds = new Set(history.slice(0, 10).map((p) => p.targetId));
      const unpostedShops = validShops.filter((s) => !recentShopIds.has(s.id));
      targetShop = unpostedShops.length > 0 ? unpostedShops[Math.floor(Math.random() * unpostedShops.length)] : validShops[Math.floor(Math.random() * validShops.length)];

      if (targetShop) {
        targetProduct = (db.products || []).find((p) => p.shop_id === targetShop.id && p.is_recommended) ||
                        (db.products || []).find((p) => p.shop_id === targetShop.id) || null;
      }
    }
  }

  if (!targetShop && !targetEvent) {
    throw new Error("ไม่พบข้อมูลร้านค้าหรือกิจกรรมตลาดนัดสำหรับสร้างโพสต์");
  }

  // 2. Generate Poster Image
  let posterResult = null;
  let caption = "";
  let title = "";

  if (targetEvent) {
    title = targetEvent.name;
    const featuredShops = (db.shops || []).slice(0, 4);
    posterResult = await generateMarketEventPoster({
      marketEvent: targetEvent,
      featuredShops,
      themeKey: activeTheme,
    });
    caption = await generateCaptionWithAI({
      marketEvent: targetEvent,
      featuredShops,
      tone: activeTone,
      apiKey: config.geminiApiKey,
    });
  } else {
    title = `${targetShop.name} - ${targetProduct ? targetProduct.name : targetShop.building_name}`;
    posterResult = await generateShopPoster({
      shop: targetShop,
      product: targetProduct,
      themeKey: activeTheme,
    });
    caption = await generateCaptionWithAI({
      shop: targetShop,
      product: targetProduct,
      tone: activeTone,
      apiKey: config.geminiApiKey,
    });
  }

  // 3. Resolve Full Public Image URL for Instagram Graph API
  const base = config.publicBaseUrl ? config.publicBaseUrl.replace(/\/+$/, "") : "http://localhost:3080";
  const fullImageUrl = `${base}${posterResult.url}`;

  // 4. Publish to Instagram
  const publishResult = await publishToInstagram({
    accountId: config.accountId,
    accessToken: config.accessToken,
    imageUrl: fullImageUrl,
    caption: caption,
    isSimulation: simulationMode,
  });

  // 5. Record post to history
  const postRecord = {
    id: `post_${Date.now()}`,
    timestamp: new Date().toISOString(),
    type: targetEvent ? "market_event" : "shop",
    targetId: targetEvent ? targetEvent.id : targetShop.id,
    title,
    theme: activeTheme,
    tone: activeTone,
    posterUrl: posterResult.url,
    posterLocalPath: posterResult.filePath,
    caption,
    status: publishResult.ok ? (publishResult.mode === "live" ? "published" : "simulated") : "failed",
    mode: publishResult.mode || "simulation",
    permalink: publishResult.permalink || null,
    igMediaId: publishResult.id || null,
    error: publishResult.error || null,
  };

  recordPost(postRecord);

  // Update lastRunDate in config
  saveConfig({ lastRunDate: getBangkokTime().dateStr });

  return {
    post: postRecord,
    publishResult,
    poster: posterResult,
  };
}

/**
 * Background Scheduler Runner (Checks every 60 seconds)
 */
let schedulerInterval = null;

export function initScheduler() {
  if (schedulerInterval) return;

  console.log("⏰ Instagram Automation Scheduler initialized.");

  schedulerInterval = setInterval(async () => {
    try {
      const config = loadConfig();
      if (!config.autoPilotEnabled) return;

      const bkk = getBangkokTime();

      // Check if already posted today
      if (config.lastRunDate === bkk.dateStr) return;

      // 1. Market Alert (Tue, Wed, Thu at e.g. 07:30)
      if (
        config.marketAlertEnabled &&
        (bkk.dayOfWeek === 2 || bkk.dayOfWeek === 3 || bkk.dayOfWeek === 4) &&
        bkk.timeStr === config.marketAlertTime
      ) {
        console.log(`[Scheduler] 🚀 Auto-posting Market Day Alert for day ${bkk.dayOfWeek}...`);
        const db = getMarketDb();
        const eventId = bkk.dayOfWeek === 2 ? "mkt-evt-tue" : bkk.dayOfWeek === 3 ? "mkt-evt-wed" : "mkt-evt-thu";
        await executeAutoPost({ marketEventId: eventId, themeKey: "market-fest" });
        return;
      }

      // 2. Daily Shop Promotion (at e.g. 10:30 before lunch)
      if (bkk.timeStr === config.scheduleTime) {
        console.log(`[Scheduler] 🚀 Auto-posting Daily Shop Recommendation at ${bkk.timeStr}...`);
        await executeAutoPost();
      }
    } catch (err) {
      console.error("[Scheduler Error]:", err.message);
    }
  }, 60000); // 60s
}
