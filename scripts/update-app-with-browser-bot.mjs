import fs from "node:fs";
import path from "node:path";

const appJsPath = path.resolve(process.cwd(), "public", "app.js");
let content = fs.readFileSync(appJsPath, "utf-8");

// 1. Update publishing card in renderIgStudioTab
const oldPublishCard = `<div class="ig-card" style="background:#FFF7ED; border:2px solid #FED7AA;">
          <div class="ig-card-title" style="color:var(--kmutt-dark-orange);">
            <span>🚀 4. ดำเนินการโพสต์และดาวน์โหลด</span>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; margin-bottom:0.75rem;">
            <button
              class="btn btn-primary"
              style="padding:0.85rem; border-radius:12px; font-weight:700; font-size:1rem; box-shadow:0 4px 14px rgba(250,70,22,0.35);"
              onclick="window.igPublishNow(false)"
              \${ig.isPublishing ? "disabled" : ""}
            >
              \${ig.isPublishing ? "⏳ กำลังส่งโพสต์ไปที่ Instagram..." : "🚀 โพสต์ลง IG ทันที"}
            </button>

            <button
              class="btn btn-outline"
              style="padding:0.85rem; border-radius:12px; font-weight:700; background:#FFFFFF;"
              onclick="window.igDownloadPoster()"
            >
              📥 ดาวน์โหลดรูป 1080x1350
            </button>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
            <button
              class="btn btn-cream"
              style="border-radius:10px; font-weight:600; font-size:0.88rem;"
              onclick="window.igCopyCaption()"
            >
              📋 คัดลอกแคปชั่น
            </button>

            <button
              class="btn btn-outline"
              style="border-radius:10px; font-weight:600; font-size:0.88rem; background:#FFFFFF;"
              onclick="window.igPublishNow(true)"
            >
              🧪 ทดสอบโพสต์จำลอง (Dry Run)
            </button>
          </div>
        </div>`;

const newPublishCard = `<div class="ig-card" style="background:#FFF7ED; border:2px solid #FED7AA;">
          <div class="ig-card-title" style="color:var(--kmutt-dark-orange); display:flex; justify-content:space-between; align-items:center;">
            <span>🚀 4. ดำเนินการโพสต์และดาวน์โหลด</span>
            <span style="font-size:0.75rem; background:#FA4616; color:#FFFFFF; padding:0.2rem 0.55rem; border-radius:999px; font-weight:700;">ไม่ต้องใช้ Token</span>
          </div>

          <!-- Main Action: Browser Bot Auto-Post -->
          <div style="margin-bottom:0.85rem;">
            <button
              class="btn btn-primary"
              style="width:100%; padding:0.95rem; border-radius:14px; font-weight:700; font-size:1.05rem; box-shadow:0 6px 18px rgba(250,70,22,0.35); display:flex; align-items:center; justify-content:center; gap:0.5rem;"
              onclick="window.igPublishWithBrowserBot()"
              \${ig.isPublishing ? "disabled" : ""}
            >
              \${ig.isPublishing ? "⏳ กำลังเปิดบอทโพสต์ลง Instagram..." : "🤖 โพสต์อัตโนมัติด้วย User/Pass (Browser Bot)"}
            </button>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; margin-bottom:0.75rem;">
            <button
              class="btn btn-outline"
              style="padding:0.75rem; border-radius:12px; font-weight:700; background:#FFFFFF;"
              onclick="window.igDownloadPoster()"
            >
              📥 ดาวน์โหลดรูป 1080x1350
            </button>

            <button
              class="btn btn-cream"
              style="padding:0.75rem; border-radius:12px; font-weight:700;"
              onclick="window.igCopyCaption()"
            >
              📋 คัดลอกแคปชั่น
            </button>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
            <button
              class="btn btn-outline"
              style="border-radius:10px; font-weight:600; font-size:0.82rem; background:#FFFFFF;"
              onclick="window.igPublishNow(true)"
            >
              🧪 ทดสอบโพสต์จำลอง (Dry Run)
            </button>

            <button
              class="btn btn-outline"
              style="border-radius:10px; font-weight:600; font-size:0.82rem; background:#FFFFFF;"
              onclick="window.igPublishNow(false)"
              title="สำหรับผู้ที่มี Meta Graph API Token"
            >
              🌐 โพสต์ผ่าน Meta Graph API
            </button>
          </div>
        </div>`;

if (content.includes("4. ดำเนินการโพสต์และดาวน์โหลด")) {
  content = content.replace(oldPublishCard, newPublishCard);
}

// 2. Add Browser Bot Card in renderIgSchedulerTab
const oldSchedulerStart = `function renderIgSchedulerTab() {
  const ig = state.igStudio;
  const cfg = ig.config || {
    autoPilotEnabled: false,
    scheduleTime: "10:30",
    marketAlertEnabled: true,
    marketAlertTime: "07:30",
    defaultTone: "student",
    defaultTheme: "kmutt-orange",
    accountId: "",
    accessToken: "",
    publicBaseUrl: "",
    geminiApiKey: "",
  };

  return \`
    <div style="max-width:860px; margin:0 auto;">
      <!-- Auto-Pilot Card -->`;

const newSchedulerStart = `function renderIgSchedulerTab() {
  const ig = state.igStudio;
  const cfg = ig.config || {
    autoPilotEnabled: false,
    scheduleTime: "10:30",
    marketAlertEnabled: true,
    marketAlertTime: "07:30",
    defaultTone: "student",
    defaultTheme: "kmutt-orange",
    accountId: "",
    accessToken: "",
    publicBaseUrl: "",
    geminiApiKey: "",
    igUsername: "",
    igPassword: "",
  };

  return \`
    <div style="max-width:860px; margin:0 auto;">
      <!-- Card 1: Easy Instagram Login with Username & Password (NO TOKEN!) -->
      <div class="ig-card" style="border:2.5px solid var(--kmutt-orange); background:#FFF7ED; box-shadow:0 8px 24px rgba(250,70,22,0.12);">
        <div class="ig-card-title" style="color:var(--kmutt-dark-orange); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
          <span>🤖 1. ล็อกอินด้วย IG Username & Password (วิธีที่ง่ายที่สุด ไม่ต้องใช้ Token!)</span>
          <span style="font-size:0.75rem; background:#16A34A; color:#FFFFFF; padding:0.25rem 0.65rem; border-radius:999px; font-weight:700;">
            \${cfg.igUsername ? "🟢 บันทึกบัญชี @" + cfg.igUsername + " แล้ว" : "⚪ ยังไม่ได้ระบุบัญชี"}
          </span>
        </div>
        <p style="color:#475569; font-size:0.9rem; margin-bottom:1.25rem; line-height:1.5;">
          ใส่อีเมลหรือชื่อผู้ใช้และรหัสผ่านของ Instagram ระบบจะเปิดเบราว์เซอร์ล็อกอินและบันทึก Session ไว้ในเครื่องให้อัตโนมัติ (ครั้งต่อไปไม่ต้องใส่รหัสผ่านอีก บอทจะเปิดและโพสต์รูป+แคปชั่นให้เองทันที)
        </p>

        <form onsubmit="event.preventDefault(); window.igBrowserLogin(this);">
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.25rem; margin-bottom:1.25rem;">
            <div class="ig-form-group" style="margin-bottom:0;">
              <label class="ig-form-label">Instagram Username / อีเมล:</label>
              <input
                type="text"
                name="username"
                class="ig-form-input"
                value="\${cfg.igUsername || ""}"
                placeholder="เช่น kmutt.market หรือ your_account"
                required
              />
            </div>
            <div class="ig-form-group" style="margin-bottom:0;">
              <label class="ig-form-label">Instagram Password:</label>
              <input
                type="password"
                name="password"
                class="ig-form-input"
                value="\${cfg.igPassword || ""}"
                placeholder="รหัสผ่าน Instagram"
                required
              />
            </div>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem;">
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <input type="checkbox" id="show-browser-check" name="headful" checked style="cursor:pointer; width:16px; height:16px;" />
              <label for="show-browser-check" style="font-size:0.85rem; font-weight:600; color:var(--text-main); cursor:pointer;">
                เปิดหน้าต่าง Chrome ให้เห็นตอนบอทล็อกอินและโพสต์ (Headful Mode)
              </label>
            </div>

            <button type="submit" class="btn btn-primary" style="padding:0.75rem 1.75rem; border-radius:12px; font-weight:700; box-shadow:0 4px 12px rgba(250,70,22,0.3);">
              🔑 บันทึก & ล็อกอินทันที
            </button>
          </div>
        </form>
      </div>

      <!-- Auto-Pilot Card -->`;

if (content.includes("function renderIgSchedulerTab()")) {
  content = content.replace(oldSchedulerStart, newSchedulerStart);
}

// 3. Add handler functions at the bottom
const newHandlers = `
// Direct Browser Bot Handlers (Username & Password - No Token)
window.igBrowserLogin = async (form) => {
  const formData = new FormData(form);
  const username = formData.get("username")?.trim();
  const password = formData.get("password")?.trim();

  if (!username || !password) {
    alert("กรุณากรอก Username และ Password ของ Instagram");
    return;
  }

  const btn = form.querySelector('button[type="submit"]');
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = "⏳ กำลังเปิดเบราว์เซอร์เข้าสู่ระบบ...";

  try {
    const res = await fetch("/api/instagram/browser-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    if (res.ok && data.ok) {
      state.igStudio.statusMessage = "🎉 เข้าสู่ระบบ Instagram และบันทึก Session เรียบร้อยแล้ว! สามารถสั่งโพสต์อัตโนมัติได้ทันที";
      // Refresh config
      const cfgRes = await fetch("/api/instagram/config");
      if (cfgRes.ok) {
        const cfgData = await cfgRes.json();
        state.igStudio.config = cfgData.config;
      }
      renderApp();
    } else {
      alert(\`เข้าสู่ระบบไม่สำเร็จ: \${data.error || "โปรดตรวจสอบ Username และ Password"}\`);
    }
  } catch (err) {
    alert(\`เกิดข้อผิดพลาดในการเชื่อมต่อ: \${err.message}\`);
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
};

window.igPublishWithBrowserBot = async () => {
  const ig = state.igStudio;
  if (!ig.posterUrl) {
    alert("กรุณาสร้างภาพโปสเตอร์ก่อนทำการโพสต์");
    return;
  }

  const cfg = ig.config || {};
  if (!cfg.igUsername || !cfg.igPassword) {
    const goToSettings = confirm("ยังไม่ได้ตั้งค่า Username/Password ของ Instagram!\\nคุณต้องการไปที่หน้าตั้งค่าเพื่อกรอก Username & Password ตอนนี้เลยหรือไม่?");
    if (goToSettings) {
      window.igSetTab("scheduler");
    }
    return;
  }

  ig.isPublishing = true;
  renderApp();

  try {
    const selectedShop = (state.db?.shops || []).find((s) => s.id === ig.selectedShopId);
    const selectedEvent = (state.db?.market_events || []).find((e) => e.id === ig.selectedEventId);
    const title = ig.targetType === "event" ? selectedEvent?.name : selectedShop?.name;

    const res = await fetch("/api/instagram/browser-publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        posterUrl: ig.posterUrl,
        caption: ig.caption,
        title,
        targetType: ig.targetType,
        targetId: ig.targetType === "event" ? ig.selectedEventId : ig.selectedShopId,
        theme: ig.themeKey,
        tone: ig.tone,
        headless: false, // Show Chrome so user can see the post happening live!
      }),
    });

    const data = await res.json();
    if (res.ok && data.ok) {
      ig.statusMessage = "🎉 บอทเปิด Chrome โพสต์ภาพและแคปชั่นลง Instagram สำเร็จเรียบร้อยแล้ว!";
      // Update history
      const histRes = await fetch("/api/instagram/posts");
      if (histRes.ok) {
        const histData = await histRes.json();
        ig.history = histData.posts || [];
      }
    } else {
      alert(\`โพสต์ไม่สำเร็จ: \${data.error || "เกิดข้อผิดพลาดในการเปิดเบราว์เซอร์"}\`);
    }
  } catch (err) {
    alert(\`เกิดข้อผิดพลาด: \${err.message}\`);
  } finally {
    ig.isPublishing = false;
    renderApp();
  }
};
`;

content += "\n" + newHandlers;
fs.writeFileSync(appJsPath, content, "utf-8");
console.log("Successfully updated public/app.js with Browser Bot UI and handlers!");
