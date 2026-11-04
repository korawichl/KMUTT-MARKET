import fs from "node:fs";
import path from "node:path";

const appJsPath = path.resolve(process.cwd(), "public", "app.js");
let content = fs.readFileSync(appJsPath, "utf-8");

const igStudioFunctions = `
// ============================================================================
// INSTAGRAM AUTOMATION STUDIO & MOBILE PREVIEW PAGE
// ============================================================================

function formatIgCaption(captionText = "", isExpanded = false) {
  if (!captionText) return "";
  const clean = String(captionText)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  
  // Highlight hashtags in blue
  const withTags = clean.replace(
    /(#\w+|#[\\u0E00-\\u0E7F\\w]+)/g,
    '<span style="color:#00376B; font-weight:600;">$1</span>'
  );

  if (!isExpanded && withTags.length > 220) {
    const truncated = withTags.slice(0, 220);
    return truncated + '… <span style="color:#64748B; cursor:pointer; font-weight:600;" onclick="window.igToggleCaptionExpand()">เพิ่มเติม</span>';
  }
  return withTags + (withTags.length > 220 ? ' <span style="color:#64748B; cursor:pointer; font-weight:600;" onclick="window.igToggleCaptionExpand()">ย่อลง</span>' : '');
}

async function initIgStudio() {
  const ig = state.igStudio;
  try {
    const [cfgRes, histRes] = await Promise.all([
      fetch("/api/instagram/config").catch(() => null),
      fetch("/api/instagram/posts").catch(() => null),
    ]);
    if (cfgRes && cfgRes.ok) {
      const cfgData = await cfgRes.json();
      ig.config = cfgData.config;
    }
    if (histRes && histRes.ok) {
      const histData = await histRes.json();
      ig.history = histData.posts || [];
    }
    if (!ig.posterUrl) {
      await window.igRegenerateAll();
    }
  } catch (err) {
    console.warn("Could not init IG studio:", err);
  }
}

function renderInstagramAutomationPage() {
  const ig = state.igStudio;

  if (!ig.initialized) {
    ig.initialized = true;
    setTimeout(() => {
      initIgStudio();
    }, 10);
  }

  const shops = state.db?.shops || [];
  const events = state.db?.market_events || [];
  const selectedShop = shops.find((s) => s.id === ig.selectedShopId) || shops[0];
  const shopProducts = (state.db?.products || []).filter((p) => p.shop_id === selectedShop?.id);
  const selectedEvent = events.find((e) => e.id === ig.selectedEventId) || events[0];

  return \`
    <div class="ig-studio-container">
      <div class="container">
        <!-- Studio Header -->
        <div class="ig-studio-header">
          <div>
            <div style="display:flex; align-items:center; gap:0.6rem; margin-bottom:0.35rem;">
              <span style="background:linear-gradient(135deg, #FA4616, #FF6B3D); color:#ffffff; font-size:0.78rem; font-weight:700; padding:0.25rem 0.65rem; border-radius:999px;">
                BPUU MARKETING AUTOMATION
              </span>
              <span style="font-size:0.82rem; color:var(--text-muted); font-weight:600;">
                📸 Instagram Content Engine v1.0
              </span>
            </div>
            <h1 style="font-size:1.85rem; font-weight:800; color:var(--text-main); font-family:var(--font-display);">
              ระบบสร้างและโพสต์โปรโมท IG อัตโนมัติ (มจธ. บางมด)
            </h1>
            <p style="color:var(--text-muted); font-size:0.95rem; margin-top:0.25rem;">
              สร้างภาพโปสเตอร์ (1080x1350) สวยงามสะดุดตา พร้อมแคปชั่นโปรโมทร้านค้าและตลาดนัด มจธ. ลง Instagram Feed ได้ในคลิกเดียว
            </p>
          </div>

          <!-- Studio Navigation Tabs -->
          <div class="ig-studio-tabs">
            <button class="ig-studio-tab-btn \${ig.activeTab === "studio" ? "active" : ""}" onclick="window.igSetTab('studio')">
              🎨 สตูดิโอสร้างโพสต์
            </button>
            <button class="ig-studio-tab-btn \${ig.activeTab === "scheduler" ? "active" : ""}" onclick="window.igSetTab('scheduler')">
              ⏰ ตั้งเวลา & Meta API
            </button>
            <button class="ig-studio-tab-btn \${ig.activeTab === "history" ? "active" : ""}" onclick="window.igSetTab('history')">
              📋 ประวัติโพสต์ (<span class="tabular-nums">\${ig.history?.length || 0}</span>)
            </button>
          </div>
        </div>

        \${ig.statusMessage ? \`
          <div style="background:#ECFDF5; border:1.5px solid #10B981; border-radius:14px; padding:1rem 1.25rem; margin-bottom:1.5rem; display:flex; justify-content:space-between; align-items:center; color:#065F46;">
            <div style="display:flex; align-items:center; gap:0.6rem;">
              <span style="font-size:1.25rem;">🎉</span>
              <div>\${ig.statusMessage}</div>
            </div>
            <button onclick="window.igDismissStatus()" style="background:transparent; border:none; color:#065F46; font-weight:700; cursor:pointer;">✕</button>
          </div>
        \` : ""}

        <!-- Tab 1: Studio -->
        \${ig.activeTab === "studio" ? renderIgStudioTab(selectedShop, shopProducts, selectedEvent) : ""}

        <!-- Tab 2: Scheduler & Settings -->
        \${ig.activeTab === "scheduler" ? renderIgSchedulerTab() : ""}

        <!-- Tab 3: History -->
        \${ig.activeTab === "history" ? renderIgHistoryTab() : ""}
      </div>
    </div>
  \`;
}

function renderIgStudioTab(selectedShop, shopProducts, selectedEvent) {
  const ig = state.igStudio;
  const shops = state.db?.shops || [];
  const events = state.db?.market_events || [];

  return \`
    <div class="ig-studio-layout">
      <!-- Left Column: Controls & Form -->
      <div>
        <!-- 1. Target Selector Card -->
        <div class="ig-card">
          <div class="ig-card-title">
            <span>🎯 1. เลือกเป้าหมายการโปรโมท</span>
          </div>

          <div style="display:flex; gap:0.75rem; margin-bottom:1.25rem;">
            <button
              class="btn btn-sm \${ig.targetType === "shop" ? "btn-primary" : "btn-outline"}"
              style="flex:1; border-radius:12px; font-weight:700;"
              onclick="window.igSetTargetType('shop')"
            >
              🍽️ ร้านอาหารใน มจธ. (\${shops.length} ร้าน)
            </button>
            <button
              class="btn btn-sm \${ig.targetType === "event" ? "btn-primary" : "btn-outline"}"
              style="flex:1; border-radius:12px; font-weight:700;"
              onclick="window.igSetTargetType('event')"
            >
              🎪 ตลาดนัด S2 ประจำวัน
            </button>
          </div>

          \${ig.targetType === "shop" ? \`
            <div class="ig-form-group">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.45rem;">
                <label class="ig-form-label" style="margin-bottom:0;">เลือกร้านค้าที่ต้องการโปรโมท:</label>
                <button
                  class="btn btn-sm btn-cream"
                  style="padding:0.25rem 0.65rem; font-size:0.8rem; border-radius:8px;"
                  onclick="window.igRandomShop()"
                >
                  🎲 สุ่มร้านเด็ดวันนี้
                </button>
              </div>
              <select class="ig-form-select" onchange="window.igSelectShop(this.value)">
                \${shops.map((s) => \`
                  <option value="\${s.id}" \${s.id === ig.selectedShopId ? "selected" : ""}>
                    \${s.name} • \${s.building_name || "มจธ."} \${s.stall_number ? " (" + s.stall_number + ")" : ""}
                  </option>
                \`).join("")}
              </select>
            </div>

            \${shopProducts.length > 0 ? \`
              <div class="ig-form-group">
                <label class="ig-form-label">เลือกเมนูเด็ดไฮไลท์บนโปสเตอร์:</label>
                <select class="ig-form-select" onchange="window.igSelectProduct(this.value)">
                  <option value="">-- แนะนำร้านค้าโดยรวม (หรือเลือกเมนูเด็ด) --</option>
                  \${shopProducts.map((p) => \`
                    <option value="\${p.id}" \${p.id === ig.selectedProductId ? "selected" : ""}>
                      \${p.name} (\${p.price ? "฿" + p.price : "ราคานักศึกษา"}) \${p.is_recommended ? "⭐️ แนะนำ" : ""}
                    </option>
                  \`).join("")}
                </select>
              </div>
            \` : ""}
          \` : \`
            <div class="ig-form-group">
              <label class="ig-form-label">เลือกวันจัดตลาดนัด S2:</label>
              <select class="ig-form-select" onchange="window.igSelectEvent(this.value)">
                \${events.map((e) => \`
                  <option value="\${e.id}" \${e.id === ig.selectedEventId ? "selected" : ""}>
                    \${e.name} (\${e.start_time} - \${e.end_time} น.)
                  </option>
                \`).join("")}
              </select>
            </div>
          \`}
        </div>

        <!-- 2. Poster Theme & Headline Card -->
        <div class="ig-card">
          <div class="ig-card-title">
            <span>🎨 2. รูปแบบธีมโปสเตอร์ (1080x1350)</span>
          </div>

          <div class="ig-theme-grid" style="margin-bottom:1.25rem;">
            <div class="ig-theme-option \${ig.themeKey === "kmutt-orange" ? "active" : ""}" onclick="window.igSelectTheme('kmutt-orange')">
              <span style="width:20px; height:20px; border-radius:50%; background:#FA4616; display:inline-block; flex-shrink:0;"></span>
              <div>
                <div style="font-weight:700; font-size:0.88rem; color:var(--text-main);">KMUTT Bold Orange</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">สีส้ม-ขาว เอกลักษณ์ มจธ.</div>
              </div>
            </div>

            <div class="ig-theme-option \${ig.themeKey === "street-neon" ? "active" : ""}" onclick="window.igSelectTheme('street-neon')">
              <span style="width:20px; height:20px; border-radius:50%; background:#0F172A; border:2px solid #F59E0B; display:inline-block; flex-shrink:0;"></span>
              <div>
                <div style="font-weight:700; font-size:0.88rem; color:var(--text-main);">Midnight Street Food</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">ดาร์กโหมดนีออน ชวนหิว</div>
              </div>
            </div>

            <div class="ig-theme-option \${ig.themeKey === "cafe-pastel" ? "active" : ""}" onclick="window.igSelectTheme('cafe-pastel')">
              <span style="width:20px; height:20px; border-radius:50%; background:#EA580C; border:2px solid #FDE047; display:inline-block; flex-shrink:0;"></span>
              <div>
                <div style="font-weight:700; font-size:0.88rem; color:var(--text-main);">Warm Cafe & Bakery</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">โทนครีม-คาราเมล อบอุ่น</div>
              </div>
            </div>

            <div class="ig-theme-option \${ig.themeKey === "market-fest" ? "active" : ""}" onclick="window.igSelectTheme('market-fest')">
              <span style="width:20px; height:20px; border-radius:50%; background:#047857; border:2px solid #10B981; display:inline-block; flex-shrink:0;"></span>
              <div>
                <div style="font-weight:700; font-size:0.88rem; color:var(--text-main);">Market Day Festival</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">เทศกาลตลาดนัด สีสดใส</div>
              </div>
            </div>
          </div>

          <div class="ig-form-group">
            <label class="ig-form-label">ข้อความพาดหัวโปสเตอร์ (Headline / Eyebrow):</label>
            <input
              type="text"
              class="ig-form-input"
              value="\${ig.customHeadline || ""}"
              placeholder="เช่น ร้านเด็ด มจธ. แนะนำวันนี้"
              oninput="window.igUpdateCustomHeadline(this.value)"
            />
          </div>

          <button
            class="btn btn-outline btn-sm"
            style="width:100%; border-radius:12px; font-weight:700;"
            onclick="window.igRegeneratePoster()"
            \${ig.isGenerating ? "disabled" : ""}
          >
            \${ig.isGenerating ? "⏳ กำลังสร้างภาพโปสเตอร์..." : "🔄 อัปเดตภาพโปสเตอร์ใหม่ (Regenerate)"}
          </button>
        </div>

        <!-- 3. Caption Copywriting Card -->
        <div class="ig-card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem;">
            <div class="ig-card-title" style="margin-bottom:0;">
              <span>📝 3. แคปชั่นใต้โพสต์ Instagram</span>
            </div>
            <button
              class="btn btn-sm btn-cream"
              style="padding:0.35rem 0.85rem; font-size:0.82rem; border-radius:10px; font-weight:700;"
              onclick="window.igRegenerateCaption()"
              \${ig.isGenerating ? "disabled" : ""}
            >
              ✨ สร้างแคปชั่นใหม่
            </button>
          </div>

          <div class="ig-form-group">
            <label class="ig-form-label">เลือกโทนเสียง / อารมณ์ของโพสต์:</label>
            <div class="ig-tone-chips">
              <div class="ig-tone-chip \${ig.tone === "student" ? "active" : ""}" onclick="window.igSelectTone('student')">
                🎒 เด็กบางมด (เป็นกันเอง)
              </div>
              <div class="ig-tone-chip \${ig.tone === "foodie" ? "active" : ""}" onclick="window.igSelectTone('foodie')">
                🤤 สายกินชวนหิว (เน้นความอร่อย)
              </div>
              <div class="ig-tone-chip \${ig.tone === "official" ? "active" : ""}" onclick="window.igSelectTone('official')">
                📢 ประชาสัมพันธ์ BPUU (ทางการ)
              </div>
            </div>
          </div>

          <div class="ig-form-group" style="margin-bottom:0;">
            <textarea
              id="ig-caption-input"
              class="ig-form-textarea"
              rows="9"
              placeholder="แคปชั่นจะถูกสร้างขึ้นอัตโนมัติ..."
              oninput="window.igUpdateCaption(this.value)"
            >\${ig.caption || ""}</textarea>
          </div>
        </div>

        <!-- 4. Publishing & Download Actions -->
        <div class="ig-card" style="background:#FFF7ED; border:2px solid #FED7AA;">
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
        </div>
      </div>

      <!-- Right Column: Authentic Instagram Phone Preview -->
      <div class="ig-preview-sticky">
        <div style="text-align:center; font-size:0.85rem; font-weight:700; color:var(--text-muted); margin-bottom:0.75rem;">
          📱 แสดงตัวอย่างโพสต์จริงบน Instagram Feed (Preview)
        </div>

        <div class="ig-phone-frame">
          <!-- Phone Notch -->
          <div class="ig-phone-notch"></div>

          <!-- App Bar -->
          <div class="ig-app-bar">
            <span style="font-size:1.15rem; font-weight:800; font-family:sans-serif; letter-spacing:-0.5px;">Instagram</span>
            <div style="display:flex; gap:0.75rem; align-items:center;">
              <span style="font-size:1.1rem; cursor:pointer;" onclick="window.igToggleLike()">\${ig.isLiked ? "❤️" : "🤍"}</span>
              <span style="font-size:1.1rem;">✈️</span>
            </div>
          </div>

          <!-- Feed Header -->
          <div class="ig-feed-header">
            <div style="display:flex; align-items:center; gap:0.6rem;">
              <div style="width:34px; height:34px; border-radius:50%; background:linear-gradient(45deg, #F59E0B, #FA4616); padding:2px; display:flex; align-items:center; justify-content:center;">
                <div style="width:100%; height:100%; border-radius:50%; background:#FA4616; display:flex; align-items:center; justify-content:center; color:#FFFFFF; font-size:0.75rem; font-weight:800;">
                  KM
                </div>
              </div>
              <div>
                <div style="font-size:0.84rem; font-weight:700; color:#0F172A; display:flex; align-items:center; gap:0.25rem;">
                  <span>kmutt.market</span>
                  <span style="color:#0284C7; font-size:0.75rem;">✓</span>
                </div>
                <div style="font-size:0.68rem; color:#64748B;">มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี (บางมด)</div>
              </div>
            </div>
            <span style="color:#64748B; font-weight:700; cursor:pointer;">•••</span>
          </div>

          <!-- Poster Image Viewport (4:5 vertical) -->
          <div class="ig-poster-viewport">
            \${ig.posterUrl ? \`
              <img src="\${ig.posterUrl}" alt="Instagram Poster" />
            \` : \`
              <div style="color:#FFFFFF; text-align:center; padding:2rem;">
                <div style="font-size:2rem; margin-bottom:0.5rem;">🎨</div>
                <div style="font-weight:600;">กำลังสร้างภาพโปสเตอร์...</div>
              </div>
            \`}

            \${ig.isGenerating ? \`
              <div style="position:absolute; inset:0; background:rgba(0,0,0,0.65); display:flex; flex-direction:column; align-items:center; justify-content:center; color:#FFFFFF; gap:0.75rem;">
                <span class="pulse-dot" style="width:14px; height:14px;"></span>
                <span style="font-weight:700; font-size:0.9rem;">กำลังประมวลผลโปสเตอร์...</span>
              </div>
            \` : ""}
          </div>

          <!-- Action Icons Bar -->
          <div class="ig-feed-actions">
            <div style="display:flex; gap:0.85rem; align-items:center;">
              <span style="font-size:1.35rem; cursor:pointer;" onclick="window.igToggleLike()">\${ig.isLiked ? "❤️" : "🤍"}</span>
              <span style="font-size:1.3rem; cursor:pointer;">💬</span>
              <span style="font-size:1.3rem; cursor:pointer;" onclick="window.igCopyCaption()">✈️</span>
            </div>
            <span style="font-size:1.35rem; cursor:pointer;" onclick="window.igDownloadPoster()">🏷️</span>
          </div>

          <!-- Likes Count -->
          <div class="ig-feed-likes">
            ถูกใจ <span class="tabular-nums">\${(ig.isLiked ? ig.previewLikes + 1 : ig.previewLikes).toLocaleString()}</span> คน
          </div>

          <!-- Caption Box -->
          <div class="ig-feed-caption-box">
            <span style="font-weight:700; margin-right:0.35rem;">kmutt.market</span>
            <span>\${formatIgCaption(ig.caption, ig.isCaptionExpanded)}</span>
          </div>

          <!-- Time & Meta -->
          <div style="padding:0 0.9rem 0.9rem; font-size:0.7rem; color:#94A3B8; text-transform:uppercase;">
            15 นาทีที่แล้ว • กรุงเทพมหานคร
          </div>
        </div>
      </div>
    </div>
  \`;
}

function renderIgSchedulerTab() {
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
      <!-- Auto-Pilot Card -->
      <div class="ig-card">
        <div class="ig-card-title">
          <span>⏰ 1. ตั้งเวลาโพสต์อัตโนมัติ (Auto-Pilot Scheduler)</span>
        </div>
        <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:1.25rem;">
          ระบบจะเลือกสุ่มร้านค้าที่ผ่านการรับรองและยังไม่เคยถูกโพสต์ เพื่อสร้างภาพโปสเตอร์และแคปชั่นลง IG อัตโนมัติทุกวันตามเวลาที่กำหนด
        </p>

        <form onsubmit="event.preventDefault(); window.igSaveSchedulerSettings(this);">
          <div style="display:flex; align-items:center; justify-content:space-between; background:#F8FAFC; border:1.5px solid var(--border); border-radius:14px; padding:1.25rem; margin-bottom:1.25rem;">
            <div>
              <div style="font-weight:700; font-size:1rem; color:var(--text-main);">เปิดการทำงาน Auto-Pilot อัตโนมัติ</div>
              <div style="font-size:0.82rem; color:var(--text-muted);">ระบบจะตรวจสอบเวลาและยิงโพสต์เมื่อถึงเวลาที่กำหนด</div>
            </div>
            <label style="position:relative; display:inline-block; width:52px; height:28px;">
              <input type="checkbox" name="autoPilotEnabled" \${cfg.autoPilotEnabled ? "checked" : ""} style="opacity:0; width:0; height:0;" onchange="this.nextElementSibling.style.background = this.checked ? '#FA4616' : '#CBD5E1';"/>
              <span style="position:absolute; cursor:pointer; inset:0; background:\${cfg.autoPilotEnabled ? "#FA4616" : "#CBD5E1"}; border-radius:34px; transition:0.3s;">
                <span style="position:absolute; height:20px; width:20px; left:4px; bottom:4px; background:white; border-radius:50%; transition:0.3s; transform:\${cfg.autoPilotEnabled ? "translateX(24px)" : "translateX(0)"};"></span>
              </span>
            </label>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.25rem; margin-bottom:1.25rem;">
            <div class="ig-form-group" style="margin-bottom:0;">
              <label class="ig-form-label">เวลาโพสต์ร้านเด็ดประจำวัน (ก่อนมื้อเที่ยง):</label>
              <input type="time" name="scheduleTime" class="ig-form-input" value="\${cfg.scheduleTime || "10:30"}" />
            </div>

            <div class="ig-form-group" style="margin-bottom:0;">
              <label class="ig-form-label">เวลาแจ้งเตือนตลาดนัด S2 (อังคาร-พฤหัสฯ):</label>
              <input type="time" name="marketAlertTime" class="ig-form-input" value="\${cfg.marketAlertTime || "07:30"}" />
            </div>
          </div>

          <button type="submit" class="btn btn-primary" style="padding:0.75rem 1.5rem; border-radius:12px; font-weight:700;">
            💾 บันทึกการตั้งค่าตารางเวลา
          </button>
        </form>
      </div>

      <!-- Meta API Configuration Card -->
      <div class="ig-card">
        <div class="ig-card-title">
          <span>🔑 2. ตั้งค่าการเชื่อมต่อ Meta Instagram Graph API</span>
        </div>
        <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:1.25rem;">
          สำหรับการโพสต์จริงไปยังบัญชี Instagram ของ มจธ. (หากยังไม่ได้ตั้งค่า สามารถใช้งานในโหมด Sandbox / จำลองได้ทันที)
        </p>

        <form onsubmit="event.preventDefault(); window.igSaveApiSettings(this);">
          <div class="ig-form-group">
            <label class="ig-form-label">Instagram Business / Creator Account ID:</label>
            <input
              type="text"
              name="accountId"
              class="ig-form-input"
              value="\${cfg.accountId || ""}"
              placeholder="เช่น 17841400000000000 (ดูได้จาก Graph API Explorer / Meta Business Suite)"
            />
          </div>

          <div class="ig-form-group">
            <label class="ig-form-label">Meta Long-lived Page Access Token:</label>
            <input
              type="password"
              name="accessToken"
              class="ig-form-input"
              value="\${cfg.accessToken || ""}"
              placeholder="EAA..."
            />
            <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.35rem;">
              ต้องการสิทธิ์: <code style="background:#F1F5F9; padding:2px 6px; border-radius:4px;">instagram_basic</code>, <code style="background:#F1F5F9; padding:2px 6px; border-radius:4px;">instagram_content_publish</code>, <code style="background:#F1F5F9; padding:2px 6px; border-radius:4px;">pages_show_list</code>
            </div>
          </div>

          <div class="ig-form-group">
            <label class="ig-form-label">Public Base URL (URL สาธารณะสำหรับให้ Meta ดึงภาพโปสเตอร์):</label>
            <input
              type="text"
              name="publicBaseUrl"
              class="ig-form-input"
              value="\${cfg.publicBaseUrl || ""}"
              placeholder="เช่น https://your-domain.com หรือ https://xxxx.ngrok-free.app"
            />
            <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.35rem;">
              💡 Meta API จำเป็นต้องเข้าถึง URL รูปภาพผ่านอินเทอร์เน็ตสาธารณะ (HTTPS) เมื่อรันในเครื่องสามารถใช้ ngrok ชี้มาที่พอร์ต 3080
            </div>
          </div>

          <div class="ig-form-group">
            <label class="ig-form-label">Gemini API Key (ตัวเลือกเสริมสำหรับให้ AI ช่วยเขียนแคปชั่นสดใหม่):</label>
            <input
              type="password"
              name="geminiApiKey"
              class="ig-form-input"
              value="\${cfg.geminiApiKey || ""}"
              placeholder="AIzaSy..."
            />
          </div>

          <div style="display:flex; gap:0.75rem;">
            <button type="submit" class="btn btn-primary" style="border-radius:12px; font-weight:700;">
              💾 บันทึก API Credentials
            </button>
            <button
              type="button"
              class="btn btn-outline"
              style="border-radius:12px; font-weight:700;"
              onclick="window.igTestConnection()"
            >
              🔍 ทดสอบการเชื่อมต่อ Meta API
            </button>
          </div>
        </form>
      </div>

      <!-- Step-by-Step Guide Accordion -->
      <div class="ig-card" style="background:#F8FAFC;">
        <div style="font-weight:700; font-size:1rem; color:var(--text-main); margin-bottom:0.75rem;">
          📖 คู่มือเริ่มต้นใช้งาน Instagram Graph API ใน 4 ขั้นตอน:
        </div>
        <ol style="padding-left:1.25rem; font-size:0.88rem; color:#334155; line-height:1.7;">
          <li><strong>เปลี่ยนเป็นบัญชีธุรกิจ:</strong> เข้าแอป Instagram ไปที่การตั้งค่าบัญชี &gt; สลับเป็นบัญชีมืออาชีพ (Professional Account - Business หรือ Creator)</li>
          <li><strong>เชื่อมต่อกับ Facebook Page:</strong> นำบัญชี IG ดังกล่าวไปผูกเข้ากับ Facebook Page ของทางตลาด/มหาวิทยาลัย</li>
          <li><strong>สร้าง App ใน Meta for Developers:</strong> ไปที่ <a href="https://developers.facebook.com" target="_blank" style="color:var(--kmutt-orange); font-weight:700;">developers.facebook.com</a> สร้างแอปประเภท "Business" และเพิ่มผลิตภัณฑ์ Instagram Graph API</li>
          <li><strong>ขอ Access Token:</strong> ใช้ Graph API Explorer สร้าง Token ที่มีสิทธิ์ <code style="background:#E2E8F0; padding:2px 4px; border-radius:4px;">instagram_content_publish</code> แล้วคัดลอกมาใส่ในแบบฟอร์มด้านบน</li>
        </ol>
      </div>
    </div>
  \`;
}

function renderIgHistoryTab() {
  const ig = state.igStudio;
  const history = ig.history || [];

  return \`
    <div class="ig-card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
        <div class="ig-card-title" style="margin-bottom:0;">
          <span>📋 ประวัติการโพสต์ย้อนหลัง (\${history.length} รายการ)</span>
        </div>
        <button
          class="btn btn-sm btn-outline"
          style="border-radius:10px; font-weight:600;"
          onclick="window.igRefreshHistory()"
        >
          🔄 รีเฟรชรายการ
        </button>
      </div>

      \${history.length === 0 ? \`
        <div style="text-align:center; padding:3rem 1rem; color:var(--text-muted);">
          <div style="font-size:2.5rem; margin-bottom:0.5rem;">📭</div>
          <div style="font-weight:600; font-size:1.1rem; color:var(--text-main);">ยังไม่มีประวัติการโพสต์</div>
          <div style="font-size:0.88rem; margin-top:0.35rem;">ทดลองสร้างและโพสต์ภาพแรกได้ที่แท็บ "สตูดิโอสร้างโพสต์"</div>
          <button class="btn btn-primary btn-sm" style="margin-top:1rem; border-radius:10px;" onclick="window.igSetTab('studio')">
            ไปที่สตูดิโอสร้างโพสต์ →
          </button>
        </div>
      \` : \`
        <div style="display:flex; flex-direction:column; gap:1rem;">
          \${history.map((post) => {
            const isLive = post.status === "published";
            const dateStr = new Date(post.timestamp).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
            return \`
              <div style="display:flex; gap:1.25rem; padding:1.25rem; border:1.5px solid var(--border); border-radius:16px; background:#FFFFFF; align-items:flex-start; flex-wrap:wrap;">
                <img
                  src="\${post.posterUrl}"
                  alt="\${post.title}"
                  style="width:90px; height:112px; object-fit:cover; border-radius:10px; border:1px solid #E2E8F0; flex-shrink:0;"
                />
                <div style="flex:1; min-width:240px;">
                  <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.35rem; flex-wrap:wrap;">
                    <span style="font-size:0.75rem; font-weight:700; padding:0.2rem 0.55rem; border-radius:6px; background:\${isLive ? "#DCFCE7" : "#EFF6FF"}; color:\${isLive ? "#166534" : "#1D4ED8"};">
                      \${isLive ? "✅ เผยแพร่แล้ว (LIVE)" : "🧪 จำลอง (SIMULATED)"}
                    </span>
                    <span style="font-size:0.78rem; color:var(--text-muted);">🕒 \${dateStr}</span>
                  </div>

                  <h3 style="font-size:1.05rem; font-weight:700; color:var(--text-main); margin-bottom:0.4rem;">
                    \${post.title || "โพสต์โปรโมท มจธ."}
                  </h3>

                  <p style="font-size:0.85rem; color:#475569; max-height:4.2em; overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; margin-bottom:0.75rem;">
                    \${post.caption || ""}
                  </p>

                  <div style="display:flex; gap:0.75rem; align-items:center; flex-wrap:wrap;">
                    \${post.permalink ? \`
                      <a href="\${post.permalink}" target="_blank" class="btn btn-sm btn-outline" style="border-radius:8px; font-size:0.78rem; font-weight:600; text-decoration:none;">
                        🔗 เปิดดูบน Instagram ↗
                      </a>
                    \` : ""}
                    <a href="\${post.posterUrl}" download="kmutt-poster.png" class="btn btn-sm btn-cream" style="border-radius:8px; font-size:0.78rem; font-weight:600; text-decoration:none;">
                      📥 ดาวน์โหลดภาพ
                    </a>
                  </div>
                </div>
              </div>
            \`;
          }).join("")}
        </div>
      \`}
    </div>
  \`;
}

// Interactive Handlers for Instagram Studio
window.igSetTab = (tab) => {
  state.igStudio.activeTab = tab;
  renderApp();
};

window.igSetTargetType = (type) => {
  state.igStudio.targetType = type;
  window.igRegenerateAll();
};

window.igSelectShop = (shopId) => {
  state.igStudio.selectedShopId = shopId;
  const products = (state.db?.products || []).filter((p) => p.shop_id === shopId);
  const recProduct = products.find((p) => p.is_recommended) || products[0];
  state.igStudio.selectedProductId = recProduct ? recProduct.id : "";
  window.igRegenerateAll();
};

window.igSelectProduct = (productId) => {
  state.igStudio.selectedProductId = productId;
  window.igRegenerateAll();
};

window.igRandomShop = () => {
  const shops = state.db?.shops || [];
  if (shops.length === 0) return;
  const randomShop = shops[Math.floor(Math.random() * shops.length)];
  window.igSelectShop(randomShop.id);
};

window.igSelectEvent = (eventId) => {
  state.igStudio.selectedEventId = eventId;
  window.igRegenerateAll();
};

window.igSelectTheme = (themeKey) => {
  state.igStudio.themeKey = themeKey;
  window.igRegeneratePoster();
};

window.igSelectTone = (tone) => {
  state.igStudio.tone = tone;
  window.igRegenerateCaption();
};

window.igUpdateCustomHeadline = (val) => {
  state.igStudio.customHeadline = val;
};

window.igUpdateCaption = (val) => {
  state.igStudio.caption = val;
  // Update live caption in preview without losing focus
  const previewBox = document.querySelector(".ig-feed-caption-box span:nth-child(2)");
  if (previewBox) {
    previewBox.innerHTML = formatIgCaption(val, state.igStudio.isCaptionExpanded);
  }
};

window.igToggleLike = () => {
  state.igStudio.isLiked = !state.igStudio.isLiked;
  renderApp();
};

window.igToggleCaptionExpand = () => {
  state.igStudio.isCaptionExpanded = !state.igStudio.isCaptionExpanded;
  renderApp();
};

window.igDismissStatus = () => {
  state.igStudio.statusMessage = "";
  renderApp();
};

window.igRegeneratePoster = async () => {
  const ig = state.igStudio;
  ig.isGenerating = true;
  renderApp();
  try {
    const res = await fetch("/api/instagram/generate-poster", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shopId: ig.targetType === "shop" ? ig.selectedShopId : null,
        productId: ig.targetType === "shop" && ig.selectedProductId ? ig.selectedProductId : null,
        marketEventId: ig.targetType === "event" ? ig.selectedEventId : null,
        themeKey: ig.themeKey,
        customHeadline: ig.customHeadline,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      ig.posterUrl = data.poster.url;
    }
  } catch (err) {
    console.error("Poster generation error:", err);
  } finally {
    ig.isGenerating = false;
    renderApp();
  }
};

window.igRegenerateCaption = async () => {
  const ig = state.igStudio;
  ig.isGenerating = true;
  renderApp();
  try {
    const res = await fetch("/api/instagram/generate-caption", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shopId: ig.targetType === "shop" ? ig.selectedShopId : null,
        productId: ig.targetType === "shop" && ig.selectedProductId ? ig.selectedProductId : null,
        marketEventId: ig.targetType === "event" ? ig.selectedEventId : null,
        tone: ig.tone,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      ig.caption = data.caption;
    }
  } catch (err) {
    console.error("Caption generation error:", err);
  } finally {
    ig.isGenerating = false;
    renderApp();
  }
};

window.igRegenerateAll = async () => {
  const ig = state.igStudio;
  ig.isGenerating = true;
  renderApp();
  try {
    const payload = {
      shopId: ig.targetType === "shop" ? ig.selectedShopId : null,
      productId: ig.targetType === "shop" && ig.selectedProductId ? ig.selectedProductId : null,
      marketEventId: ig.targetType === "event" ? ig.selectedEventId : null,
      themeKey: ig.themeKey,
      tone: ig.tone,
      customHeadline: ig.customHeadline,
    };

    const [pRes, cRes] = await Promise.all([
      fetch("/api/instagram/generate-poster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
      fetch("/api/instagram/generate-caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    ]);

    if (pRes.ok) {
      const pData = await pRes.json();
      ig.posterUrl = pData.poster.url;
    }
    if (cRes.ok) {
      const cData = await cRes.json();
      ig.caption = cData.caption;
    }
  } catch (err) {
    console.error("Error regenerating all:", err);
  } finally {
    ig.isGenerating = false;
    renderApp();
  }
};

window.igDownloadPoster = () => {
  const ig = state.igStudio;
  if (!ig.posterUrl) return;
  const a = document.createElement("a");
  a.href = ig.posterUrl;
  a.download = \`kmutt-poster-\${Date.now()}.png\`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

window.igCopyCaption = () => {
  const ig = state.igStudio;
  if (!ig.caption) return;
  navigator.clipboard.writeText(ig.caption).then(() => {
    ig.statusMessage = "📋 คัดลอกแคปชั่นสำหรับโพสต์ Instagram ลงคลิปบอร์ดแล้ว!";
    renderApp();
    setTimeout(() => {
      ig.statusMessage = "";
      renderApp();
    }, 4000);
  }).catch(() => {
    alert("ไม่สามารถคัดลอกลงคลิปบอร์ดได้อัตโนมัติ กรุณากดคัดลอกด้วยตนเอง");
  });
};

window.igPublishNow = async (isSimulation = false) => {
  const ig = state.igStudio;
  if (!ig.posterUrl) {
    alert("กรุณาสร้างภาพโปสเตอร์ก่อนดำเนินการโพสต์");
    return;
  }

  ig.isPublishing = true;
  renderApp();

  try {
    const selectedShop = (state.db?.shops || []).find((s) => s.id === ig.selectedShopId);
    const selectedEvent = (state.db?.market_events || []).find((e) => e.id === ig.selectedEventId);
    const title = ig.targetType === "event" ? selectedEvent?.name : selectedShop?.name;

    const res = await fetch("/api/instagram/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageUrl: ig.posterUrl,
        caption: ig.caption,
        isSimulation,
        title,
        targetType: ig.targetType,
        targetId: ig.targetType === "event" ? ig.selectedEventId : ig.selectedShopId,
        theme: ig.themeKey,
        tone: ig.tone,
      }),
    });

    const data = await res.json();
    if (res.ok && data.ok) {
      ig.statusMessage = isSimulation
        ? "🧪 จำลองการโพสต์สำเร็จ! บันทึกประวัติและตรวจสอบเรียบร้อยแล้ว"
        : \`🎉 เผยแพร่โพสต์ลง Instagram สำเร็จแล้ว! (\${data.publishResult?.id || ""})\`;
      
      // Update history
      const histRes = await fetch("/api/instagram/posts");
      if (histRes.ok) {
        const histData = await histRes.json();
        ig.history = histData.posts || [];
      }
    } else {
      alert(\`ไม่สามารถเผยแพร่ได้: \${data.error || "เกิดข้อผิดพลาดในการเชื่อมต่อ"}\`);
    }
  } catch (err) {
    alert(\`เกิดข้อผิดพลาด: \${err.message}\`);
  } finally {
    ig.isPublishing = false;
    renderApp();
  }
};

window.igSaveSchedulerSettings = async (form) => {
  const formData = new FormData(form);
  const autoPilotEnabled = formData.get("autoPilotEnabled") === "on";
  const scheduleTime = formData.get("scheduleTime");
  const marketAlertTime = formData.get("marketAlertTime");

  try {
    const res = await fetch("/api/instagram/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        autoPilotEnabled,
        scheduleTime,
        marketAlertTime,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      state.igStudio.config = data.config;
      state.igStudio.statusMessage = "💾 บันทึกการตั้งค่าตารางเวลาโพสต์อัตโนมัติเรียบร้อยแล้ว!";
      renderApp();
    }
  } catch (err) {
    alert(\`บันทึกไม่สำเร็จ: \${err.message}\`);
  }
};

window.igSaveApiSettings = async (form) => {
  const formData = new FormData(form);
  const accountId = formData.get("accountId")?.trim();
  const accessToken = formData.get("accessToken")?.trim();
  const publicBaseUrl = formData.get("publicBaseUrl")?.trim();
  const geminiApiKey = formData.get("geminiApiKey")?.trim();

  try {
    const res = await fetch("/api/instagram/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountId,
        accessToken,
        publicBaseUrl,
        geminiApiKey,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      state.igStudio.config = data.config;
      state.igStudio.statusMessage = "💾 บันทึกข้อมูลเชื่อมต่อ Meta API Credentials เรียบร้อยแล้ว!";
      renderApp();
    }
  } catch (err) {
    alert(\`บันทึกไม่สำเร็จ: \${err.message}\`);
  }
};

window.igTestConnection = async () => {
  const ig = state.igStudio;
  const cfg = ig.config || {};
  if (!cfg.accountId || !cfg.accessToken) {
    alert("กรุณากรอก Instagram Account ID และ Access Token ก่อนทำการทดสอบ");
    return;
  }

  try {
    const res = await fetch("/api/instagram/test-connection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountId: cfg.accountId,
        accessToken: cfg.accessToken,
      }),
    });
    const data = await res.json();
    if (res.ok && data.ok) {
      alert(\`✅ เชื่อมต่อ Instagram สำเร็จ!\\nชื่อบัญชี: @\${data.account.username}\\nผู้ติดตาม: \${data.account.followersCount} คน\\nจำนวนโพสต์: \${data.account.mediaCount} โพสต์\`);
    } else {
      alert(\`❌ การเชื่อมต่อล้มเหลว:\\n\${data.error || "ไม่สามารถติดต่อ Instagram API ได้"}\`);
    }
  } catch (err) {
    alert(\`เกิดข้อผิดพลาดในการทดสอบ: \${err.message}\`);
  }
};

window.igRefreshHistory = async () => {
  try {
    const res = await fetch("/api/instagram/posts");
    if (res.ok) {
      const data = await res.json();
      state.igStudio.history = data.posts || [];
      renderApp();
    }
  } catch (err) {
    console.error("Failed to refresh history:", err);
  }
};
`;

// Insert right before `function renderFooter()`
const target = "function renderFooter() {";
if (content.includes(target)) {
  content = content.replace(target, igStudioFunctions + "\n\n" + target);
  fs.writeFileSync(appJsPath, content, "utf-8");
  console.log("Successfully inserted IG Studio into public/app.js!");
} else {
  console.error("Could not find insertion target in public/app.js");
  process.exit(1);
}
