import {
  loadConfig,
  saveConfig,
  loadPostsHistory,
  recordPost,
  executeAutoPost,
} from "./instagram-scheduler.mjs";
import { generateShopPoster, generateMarketEventPoster, THEMES } from "./poster-generator.mjs";
import { generateCaptionWithAI } from "./caption-generator.mjs";
import { testInstagramConnection, publishToInstagram } from "./instagram-api.mjs";
import { loginInstagram, postWithBrowserBot, checkInstagramSession } from "./instagram-browser-bot.mjs";
import {
  loadCampaignState,
  startAutonomousCampaign,
  executeNextCampaignPost,
  pauseAutonomousCampaign,
  resetAutonomousCampaign,
} from "./campaign-autopilot.mjs";
import { KMUTT_100_SPOTS } from "../data/campaign-100-shops.mjs";
import fs from "node:fs";
import path from "node:path";

const DB_FILE = path.resolve(process.cwd(), "data", "kmutt-market-db.json");

function getMarketDb() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
  } catch {
    return { shops: [], products: [], market_events: [] };
  }
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

/**
 * Handle /api/instagram/* requests
 */
export async function handleInstagramApi(req, res, pathname) {
  if (!pathname.startsWith("/api/instagram/")) {
    return false;
  }

  const endpoint = pathname.replace("/api/instagram/", "");

  try {
    // 1. GET /api/instagram/config
    if (endpoint === "config" && req.method === "GET") {
      const cfg = loadConfig();
      sendJson(res, 200, {
        ok: true,
        config: {
          ...cfg,
          // Mask sensitive token partially for display, but indicate if configured
          hasAccessToken: Boolean(cfg.accessToken),
          accessTokenMasked: cfg.accessToken
            ? `${cfg.accessToken.slice(0, 6)}...${cfg.accessToken.slice(-4)}`
            : "",
        },
        themes: Object.keys(THEMES).map((k) => ({ id: k, name: THEMES[k].name })),
      });
      return true;
    }

    // 2. POST /api/instagram/config
    if (endpoint === "config" && req.method === "POST") {
      const body = await parseJsonBody(req);
      const updated = saveConfig(body);
      sendJson(res, 200, { ok: true, config: updated });
      return true;
    }

    // 3. GET /api/instagram/posts
    if (endpoint === "posts" && req.method === "GET") {
      const posts = loadPostsHistory();
      sendJson(res, 200, { ok: true, posts });
      return true;
    }

    // 4. POST /api/instagram/test-connection
    if (endpoint === "test-connection" && req.method === "POST") {
      const body = await parseJsonBody(req);
      const cfg = loadConfig();
      const accountId = body.accountId || cfg.accountId;
      const accessToken = body.accessToken || cfg.accessToken;

      const result = await testInstagramConnection({ accountId, accessToken });
      sendJson(res, result.ok ? 200 : 400, result);
      return true;
    }

    // 5. POST /api/instagram/generate-poster
    if (endpoint === "generate-poster" && req.method === "POST") {
      const body = await parseJsonBody(req);
      const db = getMarketDb();

      let posterResult = null;
      if (body.marketEventId) {
        const ev = db.market_events?.find((e) => e.id === body.marketEventId);
        if (!ev) {
          sendJson(res, 404, { ok: false, error: "ไม่พบกิจกรรมตลาดนัด" });
          return true;
        }
        const featuredShops = (db.shops || []).slice(0, 4);
        posterResult = await generateMarketEventPoster({
          marketEvent: ev,
          featuredShops,
          themeKey: body.themeKey || "market-fest",
          customHeadline: body.customHeadline,
        });
      } else {
        const shop = db.shops?.find((s) => s.id === body.shopId) || db.shops?.[0];
        if (!shop) {
          sendJson(res, 404, { ok: false, error: "ไม่พบข้อมูลร้านค้า" });
          return true;
        }
        const product = body.productId
          ? db.products?.find((p) => p.id === body.productId)
          : db.products?.find((p) => p.shop_id === shop.id && p.is_recommended) ||
            db.products?.find((p) => p.shop_id === shop.id) || null;

        posterResult = await generateShopPoster({
          shop,
          product,
          themeKey: body.themeKey || "kmutt-orange",
          customHeadline: body.customHeadline,
        });
      }

      sendJson(res, 200, { ok: true, poster: posterResult });
      return true;
    }

    // 6. POST /api/instagram/generate-caption
    if (endpoint === "generate-caption" && req.method === "POST") {
      const body = await parseJsonBody(req);
      const db = getMarketDb();
      const cfg = loadConfig();

      let caption = "";
      if (body.marketEventId) {
        const ev = db.market_events?.find((e) => e.id === body.marketEventId);
        const featuredShops = (db.shops || []).slice(0, 4);
        caption = await generateCaptionWithAI({
          marketEvent: ev,
          featuredShops,
          tone: body.tone || "student",
          apiKey: body.geminiApiKey || cfg.geminiApiKey,
        });
      } else {
        const shop = db.shops?.find((s) => s.id === body.shopId) || db.shops?.[0];
        const product = body.productId
          ? db.products?.find((p) => p.id === body.productId)
          : db.products?.find((p) => p.shop_id === shop.id && p.is_recommended) ||
            db.products?.find((p) => p.shop_id === shop.id) || null;

        caption = await generateCaptionWithAI({
          shop,
          product,
          tone: body.tone || "student",
          apiKey: body.geminiApiKey || cfg.geminiApiKey,
        });
      }

      sendJson(res, 200, { ok: true, caption });
      return true;
    }

    // 7. POST /api/instagram/publish
    if (endpoint === "publish" && req.method === "POST") {
      const body = await parseJsonBody(req);
      const cfg = loadConfig();

      const accountId = body.accountId || cfg.accountId;
      const accessToken = body.accessToken || cfg.accessToken;
      const isSimulation = body.isSimulation !== undefined ? body.isSimulation : (!accountId || !accessToken);

      const base = cfg.publicBaseUrl ? cfg.publicBaseUrl.replace(/\/+$/, "") : "http://localhost:3080";
      const imageUrl = body.imageUrl?.startsWith("http") ? body.imageUrl : `${base}${body.imageUrl}`;

      const publishResult = await publishToInstagram({
        accountId,
        accessToken,
        imageUrl,
        caption: body.caption,
        isSimulation,
      });

      if (publishResult.ok) {
        // Record to history
        const postRecord = {
          id: `post_${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: body.targetType || "shop",
          targetId: body.targetId || "custom",
          title: body.title || "โพสต์โปรโมท มจธ.",
          theme: body.theme || "kmutt-orange",
          tone: body.tone || "student",
          posterUrl: body.imageUrl,
          caption: body.caption,
          status: publishResult.mode === "live" ? "published" : "simulated",
          mode: publishResult.mode || "simulation",
          permalink: publishResult.permalink || null,
          igMediaId: publishResult.id || null,
        };
        recordPost(postRecord);
        sendJson(res, 200, { ok: true, post: postRecord, publishResult });
      } else {
        sendJson(res, 400, { ok: false, error: publishResult.error, details: publishResult });
      }
      return true;
    }

    // 8. POST /api/instagram/trigger-auto
    if (endpoint === "trigger-auto" && req.method === "POST") {
      const body = await parseJsonBody(req);
      const result = await executeAutoPost({
        shopId: body.shopId,
        marketEventId: body.marketEventId,
        themeKey: body.themeKey,
        tone: body.tone,
        isSimulation: body.isSimulation,
      });
      sendJson(res, 200, { ok: true, result });
      return true;
    }

    // 9. GET /api/instagram/browser-session
    if (endpoint === "browser-session" && req.method === "GET") {
      const cfg = loadConfig();
      const status = await checkInstagramSession(true);
      sendJson(res, 200, {
        ok: true,
        loggedIn: status.loggedIn,
        username: cfg.igUsername || "",
      });
      return true;
    }

    // 10. POST /api/instagram/browser-login
    if (endpoint === "browser-login" && req.method === "POST") {
      const body = await parseJsonBody(req);
      const username = body.username?.trim();
      const password = body.password?.trim();

      if (!username || !password) {
        sendJson(res, 400, { ok: false, error: "กรุณาระบุ Username และ Password" });
        return true;
      }

      // Save credentials for reuse
      saveConfig({ igUsername: username, igPassword: password });

      try {
        const loginRes = await loginInstagram({ username, password, headless: false });
        sendJson(res, 200, { ok: true, message: loginRes.message });
      } catch (err) {
        sendJson(res, 400, { ok: false, error: err.message });
      }
      return true;
    }

    // 11. POST /api/instagram/browser-publish
    if (endpoint === "browser-publish" && req.method === "POST") {
      const body = await parseJsonBody(req);
      const cfg = loadConfig();

      const username = body.username?.trim() || cfg.igUsername;
      const password = body.password?.trim() || cfg.igPassword;
      const posterUrl = body.imageUrl || body.posterUrl;
      const caption = body.caption;

      if (!posterUrl) {
        sendJson(res, 400, { ok: false, error: "ไม่พบ URL ภาพโปสเตอร์" });
        return true;
      }

      // Resolve local file path
      const localRelPath = posterUrl.replace(/^\/+/, "");
      const absolutePosterPath = path.resolve(process.cwd(), "public", localRelPath.replace(/^posters\//, "posters/"));

      try {
        const result = await postWithBrowserBot({
          posterPath: absolutePosterPath,
          caption,
          username,
          password,
          headless: body.headless !== undefined ? body.headless : true,
        });

        // Record to history
        const postRecord = {
          id: `post_bot_${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: body.targetType || "shop",
          targetId: body.targetId || "custom",
          title: body.title || "โพสต์โปรโมท มจธ.",
          theme: body.theme || "kmutt-orange",
          tone: body.tone || "student",
          posterUrl,
          caption,
          status: "published",
          mode: "browser_bot",
          permalink: "https://www.instagram.com/",
        };
        recordPost(postRecord);

        sendJson(res, 200, { ok: true, post: postRecord, result });
      } catch (err) {
        sendJson(res, 500, { ok: false, error: err.message });
      }
      return true;
    }

    // 10. GET /api/instagram/campaign
    if (endpoint === "campaign" && req.method === "GET") {
      const state = loadCampaignState();
      const completedSpotIds = new Set((state.posts || []).map((p) => p.spotId));
      sendJson(res, 200, {
        ok: true,
        campaign: state,
        totalConfiguredSpots: KMUTT_100_SPOTS.length,
        spots: KMUTT_100_SPOTS.map((s, idx) => ({
          index: idx,
          id: s.id,
          name: s.name,
          dish: s.dish,
          zone: s.zone,
          location: s.location,
          price: s.price,
          desc: s.desc,
          image: s.image,
          posted: completedSpotIds.has(s.id) || idx < state.currentIndex,
        })),
      });
      return true;
    }

    // 11. POST /api/instagram/campaign/start
    if (endpoint === "campaign/start" && req.method === "POST") {
      const body = await parseJsonBody(req).catch(() => ({}));
      const intervalMinutes = body.intervalMinutes || 5;
      const state = startAutonomousCampaign({ intervalMinutes });
      sendJson(res, 200, { ok: true, state, message: `แคมเปญ 100 โพสต์เริ่มทำงานแล้ว (โพสต์ทุกๆ ${intervalMinutes} นาที)` });
      return true;
    }

    // 12. POST /api/instagram/campaign/pause
    if (endpoint === "campaign/pause" && req.method === "POST") {
      const state = pauseAutonomousCampaign();
      sendJson(res, 200, { ok: true, state, message: "หยุดพักแคมเปญชั่วคราวแล้ว" });
      return true;
    }

    // 13. POST /api/instagram/campaign/post-next
    if (endpoint === "campaign/post-next" && req.method === "POST") {
      const postResult = await executeNextCampaignPost();
      sendJson(res, 200, { ok: true, postResult, message: "ดำเนินการโพสต์ร้านถัดไปสำเร็จ" });
      return true;
    }

    // 14. POST /api/instagram/campaign/reset
    if (endpoint === "campaign/reset" && req.method === "POST") {
      const state = resetAutonomousCampaign();
      sendJson(res, 200, { ok: true, state, message: "รีเซ็ตแคมเปญ 100 ร้านเรียบร้อยแล้ว" });
      return true;
    }

    sendJson(res, 404, { ok: false, error: "Instagram API route not found" });
    return true;
  } catch (err) {
    sendJson(res, 500, { ok: false, error: String(err.message || err) });
    return true;
  }
}
