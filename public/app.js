// KMUTT MARKET – Full-Stack Interactive Client Application
const state = {
  db: null,
  role: localStorage.getItem("kmutt_role") || "guest", // guest | student | vendor | admin
  favorites: JSON.parse(localStorage.getItem("kmutt_favorites") || '["shop-s11-01","shop-s14-03","shop-s14-06"]'),
  route: window.location.pathname || "/",
  mobileMenuOpen: false,
  cravingModalOpen: false,
  cravingZone: "ALL",
  cravingBudget: 100,
  cravingPick: null,
  shopFilters: {
    q: "",
    category: "ALL",
    zone: "ALL",
    type: "ALL",
    day: "ALL",
    status: "ALL",
    verifiedOnly: false,
    sort: "recommended",
  },
  productFilters: {
    q: "",
    category: "ALL",
    maxPrice: "ALL",
    sort: "recommended",
  },
  filterPanelExpanded: false,
  productFilterPanelExpanded: false,
  mapMode: "gps", // gps | stalls
  selectedMapZone: "ALL",
  selectedStallCode: "A-01",
  leafletMap: null,
  igStudio: {
    targetType: "shop",
    selectedShopId: "shop-s14-01",
    selectedProductId: "",
    selectedEventId: "mkt-evt-wed",
    themeKey: "punpro",
    tone: "punpro",
    customHeadline: "ชี้เป้าของอร่อย มจธ. บางมด!",
    posterUrl: null,
    caption: "",
    isGenerating: false,
    isPublishing: false,
    activeTab: "campaign",
    history: [],
    config: null,
    statusMessage: "",
    previewLikes: 1428,
    isLiked: false,
    isCaptionExpanded: false,
    initialized: false,
    campaign: null,
    campaignSpots: [],
    isCampaignLoading: false,
    campaignIntervalMinutes: 2,
    campaignFilterZone: "ALL",
    campaignFilterStatus: "ALL",
  },
};

const DAY_NAMES_TH = {
  0: "วันอาทิตย์",
  1: "วันจันทร์",
  2: "วันอังคาร",
  3: "วันพุธ",
  4: "วันพฤหัสบดี",
  5: "วันศุกร์",
  6: "วันเสาร์",
};

function getBangkokNow() {
  const str = new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" });
  const d = new Date(str);
  return {
    dayOfWeek: d.getDay(),
    dayNameTh: DAY_NAMES_TH[d.getDay()] || "วันนี้",
    timeStr: d.toTimeString().slice(0, 5),
  };
}

function formatPrice(price, priceText) {
  if (price !== null && price !== undefined && !Number.isNaN(Number(price))) {
    return `฿${Number(price).toLocaleString("th-TH")}`;
  }
  return priceText || "สอบถามราคาที่ร้าน";
}

function getShopSchedules(shopId) {
  if (!state.db) return [];
  return state.db.shop_schedules.filter((s) => s.shop_id === shopId);
}

function isShopOpenToday(shopId) {
  const { dayOfWeek } = getBangkokNow();
  const scheds = getShopSchedules(shopId);
  return scheds.some((s) => Number(s.day_of_week) === dayOfWeek && s.is_open);
}

function getShopDaysSummary(shopId) {
  const scheds = getShopSchedules(shopId).filter((s) => s.is_open);
  if (!scheds.length) return "ตามประกาศมหาวิทยาลัย";
  const days = scheds.map((s) => DAY_NAMES_TH[s.day_of_week]?.replace("วัน", "")).join(", ");
  const first = scheds[0];
  return `${days} (${first.open_time}–${first.close_time})`;
}

function getCategoryName(catId) {
  if (!state.db) return "ทั่วไป";
  const found = state.db.categories.find((c) => c.id === catId || c.slug === catId);
  return found ? found.name_th : "ร้านค้าใน มจธ.";
}

function getShopRatingStats(shopId) {
  if (!state.db) return { count: 0, avg: null };
  const revs = state.db.reviews.filter((r) => r.shop_id === shopId && r.status === "APPROVED");
  if (!revs.length) return { count: 0, avg: null };
  const sum = revs.reduce((acc, r) => acc + Number(r.rating || 0), 0);
  return { count: revs.length, avg: (sum / revs.length).toFixed(1) };
}

function showToast(message) {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  const item = document.createElement("div");
  item.className = "toast-item";
  item.textContent = message;
  container.appendChild(item);
  setTimeout(() => {
    item.remove();
  }, 3200);
}

function normalizeDb(raw) {
  if (!raw) return raw;
  raw.categories = (raw.categories || []).map((c) => ({
    ...c,
    name_th: c.name_th || c.name || "ทั่วไป",
  }));
  raw.shops = (raw.shops || []).map((s) => ({
    ...s,
    name_th: s.name_th || s.name || "ร้านค้าใน มจธ.",
    name_en: s.name_en || s.slug || "",
    short_description: s.short_description || s.description || "",
    full_description: s.full_description || s.description || "",
    building_zone: s.building_zone || s.building_name || "มจธ. บางมด",
    price_range_label:
      s.price_range_label ||
      (s.price_range === "฿" ? "฿25 - ฿50" : s.price_range === "฿฿" ? "฿45 - ฿95" : s.price_range || "฿30 - ฿60"),
    min_price: s.min_price ?? (s.price_range === "฿" ? 25 : 45),
    max_price: s.max_price ?? (s.price_range === "฿" ? 50 : 95),
    phone: s.phone || s.contact_phone || "ติดต่อที่หน้าร้าน",
    is_verified: s.is_verified ?? (s.verification_status === "verified"),
    approval_status:
      s.approval_status || (s.status === "active" || s.status === "APPROVED" ? "APPROVED" : "PENDING"),
    updated_at: (s.updated_at || "2026-10-22").slice(0, 10),
  }));
  raw.products = (raw.products || []).map((p) => ({
    ...p,
    name_th: p.name_th || p.name || "เมนูอาหาร",
    price_label: p.price_label || null,
  }));
  raw.market_events = (raw.market_events || []).map((ev) => ({
    ...ev,
    title_th: ev.title_th || ev.name || "ตลาดนัด มจธ.",
    day_name_th: ev.day_name_th || DAY_NAMES_TH[ev.day_of_week] || "วันตลาดนัด",
    open_time: ev.open_time || ev.start_time || "07:00",
    close_time: ev.close_time || ev.end_time || "17:00",
    location_name: ev.location_name || ev.location || "ลานชั้น 1 อาคาร S2 มจธ.",
  }));
  raw.market_stalls = (raw.market_stalls || []).map((st) => ({
    ...st,
    stall_code: st.stall_code || st.stall_number || "A-01",
    zone_name: st.zone_name || st.zone || "Zone A",
    operating_day: st.operating_day || "อังคาร – พฤหัสบดี (07:00–17:00 น.)",
  }));
  raw.reviews = (raw.reviews || []).map((r) => ({
    ...r,
    status: r.status === "published" || r.status === "APPROVED" ? "APPROVED" : r.status,
  }));
  raw.activity_logs = (raw.activity_logs || []).map((l) => ({
    ...l,
    actor_name: l.actor_name || l.user_name || "ผู้ดูแลระบบ BPUU",
    action_type: l.action_type || l.action || "UPDATE",
    target_summary: l.target_summary || (l.details && l.details.message) || "อัปเดตข้อมูลระบบ",
  }));
  return raw;
}

async function fetchDatabase() {
  if (window.__INITIAL_DB__) {
    state.db = normalizeDb(window.__INITIAL_DB__);
    renderApp();
    return;
  }

  try {
    const res = await fetch("/api/market-data");
    if (res.ok) {
      const raw = await res.json();
      if (raw && raw.shops) {
        state.db = normalizeDb(raw);
        renderApp();
        return;
      }
    }
  } catch (err) {
    console.warn("API route not found, falling back to static database file...", err);
  }

  try {
    const staticRes = await fetch("/kmutt-market-db.json");
    if (staticRes.ok) {
      const rawStatic = await staticRes.json();
      if (rawStatic && rawStatic.shops) {
        state.db = normalizeDb(rawStatic);
        renderApp();
        return;
      }
    }
  } catch (err) {
    console.warn("Static json fallback failed:", err);
  }

  if (window.__INITIAL_DB__) {
    state.db = normalizeDb(window.__INITIAL_DB__);
    renderApp();
  }
}

async function persistDatabase(logAction, logSummary) {
  if (logAction && state.db) {
    state.db.activity_logs.unshift({
      id: `log-${Date.now()}`,
      actor_name: "ผู้ใช้ทั่วไป มจธ.",
      actor_role: "GUEST",
      action_type: logAction,
      target_summary: logSummary,
      created_at: new Date().toISOString(),
    });
  }
  try {
    localStorage.setItem("kmutt_market_local_db", JSON.stringify(state.db));
    await fetch("/api/market-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: state.db }),
    });
  } catch {
    // Graceful fallback on static deployments
  }
  renderApp();
}

function navigate(path) {
  state.route = path;
  state.mobileMenuOpen = false;
  window.history.pushState({}, "", path);
  window.scrollTo({ top: 0, behavior: "smooth" });
  renderApp();
}

window.addEventListener("popstate", () => {
  state.route = window.location.pathname || "/";
  renderApp();
});

function setRole(newRole) {
  state.role = newRole;
  localStorage.setItem("kmutt_role", newRole);
  const roleLabel = {
    guest: "ผู้เยี่ยมชมทั่วไป (Guest)",
    student: "นักศึกษา มจธ. (Student)",
    vendor: "เจ้าของร้านค้า (Vendor)",
    admin: "ผู้ดูแลระบบ (Admin BPUU)",
  }[newRole];
  showToast(`สลับโหมดผู้ใช้งานเป็น: ${roleLabel}`);
  renderApp();
}

function toggleFavorite(shopId, e) {
  if (e) e.stopPropagation();
  const idx = state.favorites.indexOf(shopId);
  const shop = state.db?.shops.find((s) => s.id === shopId);
  if (idx >= 0) {
    state.favorites.splice(idx, 1);
    showToast(`นำ "${shop ? shop.name_th : "ร้านค้า"}" ออกจากร้านโปรดแล้ว`);
  } else {
    state.favorites.push(shopId);
    showToast(`บันทึก "${shop ? shop.name_th : "ร้านค้า"}" ลงในร้านโปรดแล้ว`);
  }
  localStorage.setItem("kmutt_favorites", JSON.stringify(state.favorites));
  renderApp();
}

function pickRandomCraving() {
  if (!state.db) return;
  const products = state.db.products.filter((p) => {
    if (!p.is_available) return false;
    const shop = state.db.shops.find((s) => s.id === p.shop_id);
    if (!shop || shop.approval_status !== "APPROVED") return false;
    if (state.cravingZone !== "ALL" && !shop.building_zone.includes(state.cravingZone)) return false;
    if (p.price !== null && p.price > Number(state.cravingBudget)) return false;
    return true;
  });
  if (!products.length) {
    state.cravingPick = null;
    showToast("ไม่พบเมนูที่ตรงเงื่อนไข ลองเพิ่มงบหรือเปลี่ยนโซนดูนะ!");
  } else {
    const chosen = products[Math.floor(Math.random() * products.length)];
    const shop = state.db.shops.find((s) => s.id === chosen.shop_id);
    state.cravingPick = { product: chosen, shop };
  }
  renderApp();
}

function renderShopCard(shop) {
  const isOpen = isShopOpenToday(shop.id);
  const isFav = state.favorites.includes(shop.id);
  const catName = getCategoryName(shop.category_id);
  const daysText = getShopDaysSummary(shop.id);
  const shopProducts = (state.db ? state.db.products : []).filter((p) => p.shop_id === shop.id);
  const topMenus = shopProducts.slice(0, 3);

  return `
    <article class="shop-card" data-shop-slug="${shop.slug}">
      <div class="shop-card-media" onclick="window.appNavigate('/shops/${shop.slug}')" style="cursor:pointer;">
        <img class="shop-card-img" src="${shop.cover_image_url}" alt="${shop.name_th}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80'" />
        <div class="shop-card-top-badges">
          <div style="display:flex; gap:0.35rem; flex-wrap:wrap;">
            <span class="badge ${isOpen ? "badge-open" : "badge-closed"}">
              ${isOpen ? "● เปิดวันนี้" : "○ ปิดวันนี้"}
            </span>
            ${
              shop.is_verified
                ? `<span class="badge badge-verified">✓ ข้อมูลทางการ BPUU</span>`
                : ""
            }
          </div>
          <button class="fav-icon-btn ${isFav ? "active" : ""}" onclick="window.appToggleFav('${shop.id}', event)" title="บันทึกร้านโปรด" aria-label="บันทึกร้านโปรด">
            ${isFav ? "♥" : "♡"}
          </button>
        </div>
      </div>
      <div class="shop-card-body">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:0.5rem;">
          <span class="badge badge-neutral">${catName}</span>
          <span class="tabular-nums" style="font-size:0.78rem; color:var(--kmutt-dark-orange); font-weight:700;">
            ${shop.price_range_label || "ราคาประหยัด"}
          </span>
        </div>
        <h3 class="shop-card-title" onclick="window.appNavigate('/shops/${shop.slug}')">${shop.name_th}</h3>
        <p class="shop-card-desc">${shop.short_description}</p>

        <!-- Direct Menu Items Preview -->
        ${
          topMenus.length > 0
            ? `
              <div class="shop-card-menus">
                <div class="shop-card-menus-header">
                  <span>📋 เมนูเด็ดประจำร้าน:</span>
                  <span class="tabular-nums" style="font-size:0.72rem; opacity:0.85;">มีทั้งหมด ${shopProducts.length} เมนู</span>
                </div>
                <div class="shop-menu-pills">
                  ${topMenus
                    .map(
                      (m) => `
                    <div class="shop-menu-pill-item">
                      <span class="shop-menu-dish-name">🍽️ ${m.name_th}</span>
                      <span class="shop-menu-dish-price tabular-nums">${formatPrice(m.price, m.price_label)}</span>
                    </div>
                  `
                    )
                    .join("")}
                </div>
              </div>
            `
            : ""
        }

        <div style="display:flex; flex-wrap:wrap; gap:0.35rem; margin-top:0.2rem;">
          <span class="badge" style="background:var(--kmutt-light-orange); color:var(--kmutt-dark-orange); font-size:0.72rem;">📍 ${shop.building_zone} ${shop.stall_number ? `(${shop.stall_number})` : ""}</span>
        </div>
        <div class="shop-card-meta">
          <span>🕒 ${daysText}</span>
          <button class="btn btn-sm btn-cream" onclick="window.appNavigate('/shops/${shop.slug}')">ดูเมนูทั้งหมด (${shopProducts.length}) →</button>
        </div>
      </div>
    </article>
  `;
}

function renderProductCard(product) {
  const shop = state.db.shops.find((s) => s.id === product.shop_id);
  const catName = getCategoryName(product.category_id);
  return `
    <article class="product-card">
      <div style="position:relative; cursor:pointer;" onclick="window.appNavigate('/products/${product.slug}')">
        <img class="product-card-img" src="${product.image_url}" alt="${product.name_th}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'" />
        <div style="position:absolute; top:0.5rem; left:0.5rem; display:flex; gap:0.3rem; flex-wrap:wrap;">
          ${
            product.is_recommended
              ? `<span class="badge" style="background:var(--kmutt-red); color:#fff;">🔥 เมนูเด็ดต้องลอง</span>`
              : ""
          }
          <span class="badge ${product.is_available ? "badge-open" : "badge-closed"}">
            ${product.is_available ? "พร้อมจำหน่าย" : "หมดชั่วคราว"}
          </span>
        </div>
      </div>
      <div class="product-card-body">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:0.4rem;">
          <span style="font-size:0.73rem; color:var(--text-muted); font-weight:600;">${catName}</span>
          <span class="product-price tabular-nums">${formatPrice(product.price, product.price_label)}</span>
        </div>
        <h3 style="font-size:0.98rem; font-weight:700; cursor:pointer;" onclick="window.appNavigate('/products/${product.slug}')">${product.name_th}</h3>
        <p style="font-size:0.8rem; color:var(--text-muted); flex:1;">${product.description}</p>
        ${
          shop
            ? `<div style="padding-top:0.55rem; margin-top:0.35rem; border-top:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; font-size:0.78rem;">
                <span style="color:var(--text-muted);">🏪 ${shop.name_th}</span>
                <button class="btn btn-sm btn-outline" onclick="window.appNavigate('/shops/${shop.slug}')">ไปที่ร้าน</button>
              </div>`
            : ""
        }
      </div>
    </article>
  `;
}

function renderTopHeader() {
  const bkk = getBangkokNow();
  const openCount = state.db.shops.filter((s) => s.approval_status === "APPROVED" && isShopOpenToday(s.id)).length;
  const p = state.route;

  return `
    <div class="top-pulse-bar">
      <div class="container top-pulse-inner">
        <div class="top-pulse-status" style="display:flex; align-items:center; gap:0.45rem;">
          <span class="pulse-dot"></span>
          <span><strong>สถานะตลาด มจธ. (${bkk.dayNameTh} ${bkk.timeStr} น.):</strong> เปิดวันนี้ <strong class="tabular-nums">${openCount}</strong> ร้าน • ตลาดนัด S2 อังคาร–พฤหัสบดี</span>
        </div>
        <div class="top-pulse-links" style="display:flex; align-items:center; gap:0.85rem;">
          <a href="/market/map" onclick="event.preventDefault(); window.appNavigate('/market/map')" style="color:#ffffff; opacity:0.92;">📍 แผนที่โรงอาหาร S14 & ตลาดนัด S2</a>
          <span style="opacity:0.4;">|</span>
          <a href="/about" onclick="event.preventDefault(); window.appNavigate('/about')" style="color:#ffffff; opacity:0.92;">📞 สำนักงานจัดการทรัพย์สิน (BPUU)</a>
        </div>
      </div>
    </div>

    <header class="site-header">
      <div class="container nav-inner">
        <div class="brand-logo" onclick="window.appNavigate('/')">
          <div class="brand-mark" style="background:#FA4616; border-radius:12px; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 8px rgba(250,70,22,0.28);">
            <svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 6L11 14.5V33.5L24 42L37 33.5V14.5L24 6Z" stroke="#FFFFFF" stroke-width="2.5" stroke-linejoin="round" fill="#D8380A"/>
              <circle cx="24" cy="24" r="6" fill="#FFC72C"/>
              <path d="M24 10V18M24 30V38M15 24H9M39 24H33" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round"/>
            </svg>
          </div>
          <div>
            <div class="brand-title" style="color:var(--text-main); font-weight:700;">KMUTT MARKET</div>
            <div class="brand-subtitle" style="color:var(--kmutt-dark-orange); font-weight:600;">ตลาดนัดและร้านค้าภายใน มจธ. บางมด</div>
          </div>
        </div>

        <nav class="nav-links">
          <a class="nav-link ${p === "/" ? "active" : ""}" onclick="window.appNavigate('/')">หน้าแรก</a>
          <a class="nav-link ${p.startsWith("/shops") ? "active" : ""}" onclick="window.appNavigate('/shops')">ร้านค้าทั้งหมด</a>
          <a class="nav-link ${p.startsWith("/products") ? "active" : ""}" onclick="window.appNavigate('/products')">เมนูอาหาร</a>
          <a class="nav-link ${p.startsWith("/categories") ? "active" : ""}" onclick="window.appNavigate('/categories')">หมวดหมู่</a>
          <a class="nav-link ${p === "/market/map" ? "active" : ""}" onclick="window.appNavigate('/market/map')">แผนที่ตลาด</a>
          <a class="nav-link ${p === "/market/schedule" || p === "/market" ? "active" : ""}" onclick="window.appNavigate('/market/schedule')">ตารางตลาด</a>
          <a class="nav-link ${p === "/about" ? "active" : ""}" onclick="window.appNavigate('/about')">เกี่ยวกับเรา</a>
          <a class="nav-link ${p.startsWith("/instagram") ? "active" : ""}" style="color:var(--kmutt-orange); font-weight:700;" onclick="window.appNavigate('/instagram')">📸 IG Auto</a>
        </nav>

        <div class="nav-actions">
          <button class="btn btn-sm btn-cream desktop-action-btn" onclick="window.appOpenCravingModal()" title="สุ่มเมนูเด็ดใน มจธ.">
            🎲 วันนี้กินอะไรดี?
          </button>
          <button class="btn btn-sm btn-outline desktop-action-btn" onclick="window.appNavigate('/favorites')">
            ♥ ร้านโปรด (<span class="tabular-nums">${state.favorites.length}</span>)
          </button>
          <button class="btn btn-sm btn-cream mobile-quick-dice-btn" onclick="window.appOpenCravingModal()" title="สุ่มเมนูเด็ด">
            🎲 สุ่มกิน
          </button>
          <button class="btn btn-sm btn-outline mobile-menu-btn" onclick="window.appToggleMobileMenu()" aria-label="เปิดเมนูนำทาง">
            ☰
          </button>
        </div>
      </div>
    </header>
  `;
}

function renderHomePage() {
  const bkk = getBangkokNow();
  const approvedShops = state.db.shops.filter((s) => s.approval_status === "APPROVED");
  const recommendedShops = approvedShops.filter((s) => s.is_recommended).slice(0, 6);
  const todayShops = approvedShops.filter((s) => isShopOpenToday(s.id));
  const popularProducts = state.db.products.filter((p) => p.is_recommended && p.is_available).slice(0, 8);
  const heroShop = approvedShops.find((s) => s.slug === "uncle-frog-s11") || approvedShops[0];

  return `
    <!-- MOBILE VIEW (Clean Native Mobile Food App Experience) -->
    <div class="mobile-only-view">
      <div class="mobile-app-shell">
        <!-- 1. Search Bar -->
        <div class="mobile-search-section">
          <form class="mobile-search-bar" onsubmit="event.preventDefault(); window.appSubmitHeroSearch('mobile-search-input');">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.3-4.3"></path>
            </svg>
            <input
              id="mobile-search-input"
              type="search"
              placeholder="ค้นหาร้านอาหาร เมนู หรือพิกัดตึก..."
              value="${state.shopFilters.q || ""}"
            />
            <button type="submit" class="mobile-search-btn">ค้นหา</button>
          </form>

          <!-- Horizontal Trending Chips -->
          <div class="mobile-quick-chips">
            <button class="mobile-chip" onclick="window.appQuickSearch('ข้าวมันไก่')">🍗 ข้าวมันไก่</button>
            <button class="mobile-chip" onclick="window.appQuickSearch('ฮาลาล')">🕌 ฮาลาล S14</button>
            <button class="mobile-chip" onclick="window.appQuickFilterZone('S2')">🎪 ตลาดนัดใต้ตึก S2</button>
            <button class="mobile-chip" onclick="window.appQuickFilterZone('CAFES')">☕ คาเฟ่ & ชานม (9 ร้าน)</button>
            <button class="mobile-chip" onclick="window.appQuickFilterZone('S11')">🐸 ลุงกบ S11</button>
            <button class="mobile-chip" onclick="window.appQuickSearch('บะหมี่')">🍜 บะหมี่เกี๊ยว</button>
            <button class="mobile-chip" onclick="window.appNavigate('/shops')">🏪 ดูทุกร้าน (${approvedShops.length})</button>
          </div>
        </div>

        <!-- 2. Four Campus Food Hubs (2x2 Grid) -->
        <div class="mobile-hubs-section">
          <div class="mobile-section-title">
            <span>🏛️ โซนของกิน มจธ. บางมด</span>
            <span class="mobile-section-badge">พิกัดจริง BPUU</span>
          </div>
          <div class="mobile-hubs-grid">
            <div class="mobile-hub-card" onclick="window.appQuickFilterZone('S14')">
              <span class="mobile-hub-icon">🏢</span>
              <span class="mobile-hub-name">โรงอาหาร S14</span>
              <span class="mobile-hub-sub">ข้าวมันไก่ ฮาลาล ข้าวแกง 8 ร้าน</span>
            </div>
            <div class="mobile-hub-card" onclick="window.appQuickFilterZone('S2')">
              <span class="mobile-hub-icon">🎪</span>
              <span class="mobile-hub-name">ตลาดนัดใต้ตึก S2</span>
              <span class="mobile-hub-sub">6 ร้านจริง อ.-พฤหัสฯ รูป+เมนูครบ</span>
            </div>
            <div class="mobile-hub-card" onclick="window.appQuickFilterZone('CAFES')">
              <span class="mobile-hub-icon">☕</span>
              <span class="mobile-hub-name">คาเฟ่ & ชานม</span>
              <span class="mobile-hub-sub">Starbucks, Amazon, KAMU 9 ร้าน</span>
            </div>
            <div class="mobile-hub-card" onclick="window.appQuickFilterZone('S11')">
              <span class="mobile-hub-icon">🐸</span>
              <span class="mobile-hub-name">Uncle Frog S11</span>
              <span class="mobile-hub-sub">ร้านลุงกบ อาหารจานเดียว เครื่องดื่ม</span>
            </div>
          </div>
        </div>

        <!-- 3. Immediate Recommended Feed -->
        <div class="mobile-feed-section">
          <div class="mobile-section-title">
            <span>⭐ ร้านเด็ดแนะนำใน มจธ.</span>
            <button class="mobile-view-all-btn" onclick="window.appNavigate('/shops')">ดูทั้งหมด (${approvedShops.length}) →</button>
          </div>
          <div class="mobile-shop-cards">
            ${recommendedShops.slice(0, 5).map((shop) => renderShopCard(shop)).join("")}
          </div>
        </div>

        <!-- 4. Quick Craving Banner -->
        <div style="background:#ffffff; border:1px solid var(--border); border-radius:14px; padding:1rem; display:flex; align-items:center; justify-content:space-between; gap:0.75rem; box-shadow:0 1px 3px rgba(0,0,0,0.03);">
          <div>
            <div style="font-weight:700; font-size:0.92rem; color:var(--text-main);">🎲 นึกไม่ออกว่าจะกินอะไรดี?</div>
            <div style="font-size:0.75rem; color:#64748b;">สุ่มเมนูเด็ดตามงบและตึกเรียนของคุณ</div>
          </div>
          <button class="btn btn-sm btn-primary" onclick="window.appOpenCravingModal()" style="white-space:nowrap; padding:0.45rem 0.85rem; font-size:0.8rem;">สุ่มกิน</button>
        </div>

        <!-- 5. Popular Products Feed -->
        <div class="mobile-feed-section">
          <div class="mobile-section-title">
            <span>🔥 เมนูยอดฮิต (ราคาชัดเจน)</span>
            <button class="mobile-view-all-btn" onclick="window.appNavigate('/products')">ดูทั้งหมด →</button>
          </div>
          <div class="products-grid" style="grid-template-columns: repeat(2, 1fr); gap:0.65rem;">
            ${popularProducts.slice(0, 4).map((p) => renderProductCard(p)).join("")}
          </div>
        </div>
      </div>
    </div>

    <!-- DESKTOP VIEW (Spacious Desktop Layout with Full Hero, Schedules, and Category Grids) -->
    <div class="desktop-only-view">
      <!-- 5.2 HERO SECTION -->
      <section class="hero-section">
        <div class="container hero-grid">
          <div>
            <div class="hero-kicker">
              <span>🏛️ ข้อมูลจริงจากสำนักงานจัดการทรัพย์สิน มจธ. (BPUU)</span>
            </div>
            <h1 class="hero-title">
              ตลาด มจธ. <span>มีอะไรอร่อยบ้าง?</span>
            </h1>
            <p class="hero-subtitle">
              ค้นพบร้านโปรด เมนูเด็ด และสินค้าน่าสนใจในรั้ว KMUTT — รวมครบทั้งโรงอาหาร S14, คาเฟ่ S2/N10/S11, และตลาดนัดสินค้าชุมชน วันอังคาร–พฤหัสบดี
            </p>

            <form class="hero-search-box" onsubmit="event.preventDefault(); window.appSubmitHeroSearch('hero-search-input');">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left:0.6rem; color:#94a3b8; flex-shrink:0;">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.3-4.3"></path>
              </svg>
              <input
                id="hero-search-input"
                class="hero-search-input"
                type="text"
                placeholder="ค้นหาร้านอาหาร เมนู หรือสินค้า..."
                value="${state.shopFilters.q}"
              />
              <button type="submit" class="btn btn-primary">ค้นหาเลย</button>
            </form>

            <div style="margin-top:0.35rem; margin-bottom:0.35rem;">
              <div style="font-size:0.78rem; color:var(--text-muted); font-weight:600; margin-bottom:0.35rem;">
                🔥 คำค้นยอดฮิตชาวบางมด:
              </div>
              <div class="quick-tags">
                <button class="quick-tag" onclick="window.appQuickSearch('ข้าวมันไก่')">🍗 ข้าวมันไก่ S14</button>
                <button class="quick-tag" onclick="window.appQuickSearch('ฮาลาล')">🕌 อาหารฮาลาล S14</button>
                <button class="quick-tag" onclick="window.appQuickFilterZone('S11')">🐸 ลุงกบ Uncle Frog</button>
                <button class="quick-tag" onclick="window.appQuickFilterZone('S2')">🎪 ตลาดนัดใต้ตึก S2 (6 ร้านจริง)</button>
                <button class="quick-tag" onclick="window.appQuickFilterZone('CAFES')">☕ คาเฟ่ & ชานม (9 ร้าน)</button>
                <button class="quick-tag" onclick="window.appQuickFilterZone('S14')">🏢 โรงอาหาร S14</button>
                <button class="quick-tag" onclick="window.appNavigate('/shops')">🏪 ร้านทั้งหมด (${approvedShops.length})</button>
              </div>
            </div>
          </div>

          <div class="hero-visual-stack">
            <div class="hero-featured-card">
              <img class="hero-featured-img" src="${heroShop.cover_image_url}" alt="${heroShop.name_th}" onerror="this.src='https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=900&q=80'" />
              <div class="hero-featured-overlay">
                <div>
                  <span class="badge badge-verified" style="margin-bottom:0.3rem;">⭐ พิกัดยอดฮิตชาวบางมด</span>
                  <h2 style="font-size:1.05rem; font-weight:700;">${heroShop.name_th}</h2>
                  <p style="font-size:0.8rem; color:var(--text-muted);">📍 ${heroShop.building_zone} • ${heroShop.price_range_label}</p>
                </div>
                <button class="btn btn-sm btn-primary" onclick="window.appNavigate('/shops/${heroShop.slug}')">ดูร้านนี้</button>
              </div>
            </div>

            <div style="background:#ffffff; border:1px solid var(--border); border-radius:14px; padding:1rem 1.25rem; display:flex; align-items:center; justify-content:space-between; gap:1rem;">
              <div>
                <div style="font-weight:700; font-size:0.95rem;">คิดไม่ออกว่าเที่ยงนี้กินอะไรดีใน มจธ.?</div>
                <div style="font-size:0.8rem; color:var(--text-muted);">สุ่มเมนูเด็ดตามงบนักศึกษาและตึกเรียนของคุณ</div>
              </div>
              <button class="btn btn-cream" onclick="window.appOpenCravingModal()">🎲 สุ่มเมนูให้หน่อย</button>
            </div>
          </div>
        </div>
      </section>

      <!-- 5.3 MARKET INFORMATION CARDS -->
      <section class="section-block">
        <div class="container">
          <div class="section-header">
            <div>
              <h2 class="section-title">ตารางตลาดนัดภายใน มจธ. บางมด</h2>
              <p class="section-desc">เวลาทำการ 07:00–17:00 น. (ผู้ค้าเริ่มตั้งร้าน 05:30 น.) ณ ลานชั้น 1 อาคารจอดรถ S2 และพื้นที่ส่วนกลาง</p>
            </div>
            <button class="btn btn-outline btn-sm" onclick="window.appNavigate('/market/schedule')">ดูตารางและกติกาทั้งหมด →</button>
          </div>

          <div class="schedule-grid">
            ${state.db.market_events
              .map((ev) => {
                const isToday = Number(ev.day_of_week) === bkk.dayOfWeek;
                return `
                  <div class="schedule-card ${isToday ? "today-highlight" : ""}">
                    <div>
                      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.65rem;">
                        <span class="badge ${isToday ? "badge-open" : "badge-verified"}">
                          📅 ${ev.day_name_th} ${isToday ? "(วันนี้)" : ""}
                        </span>
                        <span class="tabular-nums" style="font-size:0.78rem; font-weight:600; color:var(--text-muted);">
                          ตั้งร้าน ${ev.setup_time} น.
                        </span>
                      </div>
                      <h3 style="font-size:1.18rem; font-weight:700; margin-bottom:0.35rem;">${ev.title_th}</h3>
                      <p style="font-size:0.85rem; color:var(--text-muted);">${ev.description}</p>
                    </div>
                    <div style="padding-top:0.75rem; border-top:1px solid var(--border); font-size:0.82rem; display:flex; flex-direction:column; gap:0.25rem;">
                      <div><strong>🕒 เวลาจำหน่าย:</strong> <span class="tabular-nums">${ev.open_time}–${ev.close_time} น.</span></div>
                      <div><strong>📍 สถานที่:</strong> ${ev.location_name}</div>
                    </div>
                  </div>
                `;
              })
              .join("")}
          </div>
          <p style="font-size:0.82rem; color:var(--text-muted); margin-top:0.75rem;">
            * หมายเหตุ: วันและเวลาเปิดตลาดนัดอาจมีการเปลี่ยนแปลงตามประกาศของมหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี และกลุ่มงานจัดการผลประโยชน์ (BPUU)
          </p>
        </div>
      </section>

      <!-- 5.4 CATEGORY SECTION -->
      <section class="section-block" style="background:#ffffff; border-top:1px solid var(--border); border-bottom:1px solid var(--border);">
        <div class="container">
          <div class="section-header">
            <div>
              <h2 class="section-title">เลือกตามหมวดหมู่อาหารและสินค้า (${state.db.categories.length} หมวดหมู่)</h2>
              <p class="section-desc">ครบทั้งอาหารตามสั่ง ก๋วยเตี๋ยว ฮาลาล คาเฟ่ ขนมเบเกอรี่ และสินค้าอุปโภคในรั้ว มจธ.</p>
            </div>
            <button class="btn btn-outline btn-sm" onclick="window.appNavigate('/categories')">ดูหมวดหมู่ทั้งหมด →</button>
          </div>

          <div class="category-grid">
            ${state.db.categories
              .map((cat) => {
                const count = approvedShops.filter((s) => s.category_id === cat.id).length;
                return `
                  <div class="category-card" onclick="window.appFilterByCategory('${cat.id}')">
                    <div class="category-icon-box">${cat.name_th.slice(0, 1)}</div>
                    <div>
                      <div style="font-weight:700; font-size:0.88rem;">${cat.name_th}</div>
                      <div class="tabular-nums" style="font-size:0.74rem; color:var(--text-muted);">${count} ร้านค้า</div>
                    </div>
                  </div>
                `;
              })
              .join("")}
          </div>
        </div>
      </section>

      <!-- 5.5 RECOMMENDED SHOPS -->
      <section class="section-block">
        <div class="container">
          <div class="section-header">
            <div>
              <h2 class="section-title">ร้านเด็ดแนะนำในรั้ว มจธ.</h2>
              <p class="section-desc">คัดสรรร้านอาหารประจำโรงอาหาร S14 คาเฟ่ยอดฮิต และร้านดังตลาดนัดที่นักศึกษาบางมดบอกต่อ</p>
            </div>
            <button class="btn btn-primary btn-sm" onclick="window.appNavigate('/shops')">ดูร้านค้าทั้งหมด (${approvedShops.length}) →</button>
          </div>

          <div class="shops-grid">
            ${recommendedShops.map((shop) => renderShopCard(shop)).join("")}
          </div>
        </div>
      </section>

      <!-- 5.6 POPULAR PRODUCTS -->
      <section class="section-block" style="background:var(--kmutt-cream); border-top:1px solid var(--border); border-bottom:1px solid var(--border);">
        <div class="container">
          <div class="section-header">
            <div>
              <h2 class="section-title">เมนูเด็ดและสินค้ายอดนิยม</h2>
              <p class="section-desc">อิ่มอร่อยคุ้มค่าในงบนักศึกษา พร้อมราคาชัดเจนจากฐานข้อมูลจริง</p>
            </div>
            <button class="btn btn-outline btn-sm" onclick="window.appNavigate('/products')">ดูเมนูทั้งหมด (${state.db.products.length}) →</button>
          </div>

          <div class="products-grid">
            ${popularProducts.map((p) => renderProductCard(p)).join("")}
          </div>
        </div>
      </section>

      <!-- 5.7 TODAY'S SHOPS -->
      <section class="section-block">
        <div class="container">
          <div class="section-header">
            <div>
              <h2 class="section-title">ร้านค้าที่เปิดให้บริการวันนี้ (${bkk.dayNameTh})</h2>
              <p class="section-desc">คำนวณตามเวลาประเทศไทย (Asia/Bangkok) จากตารางเปิดร้านที่ได้รับการยืนยัน</p>
            </div>
            <button class="btn btn-outline btn-sm" onclick="window.appNavigate('/market/map')">ดูพิกัดบนแผนที่ →</button>
          </div>

          ${
            todayShops.length > 0
              ? `<div class="shops-grid">${todayShops.slice(0, 6).map((s) => renderShopCard(s)).join("")}</div>`
              : `<div style="background:#ffffff; border:1px solid var(--border); border-radius:14px; padding:2.5rem; text-align:center;">
                  <p style="font-size:1.05rem; font-weight:600; color:var(--text-muted);">ยังไม่มีข้อมูลร้านค้าที่เปิดขายในวันนี้</p>
                </div>`
          }
        </div>
      </section>
    </div>
  `;
}

function renderShopsDirectoryPage() {
  const f = state.shopFilters;
  const approved = state.db.shops.filter((s) => s.approval_status === "APPROVED");

  const filtered = approved.filter((shop) => {
    if (f.q.trim()) {
      const q = f.q.trim().toLowerCase();
      const shopProducts = state.db.products.filter((p) => p.shop_id === shop.id);
      const matchName = shop.name_th.toLowerCase().includes(q) || (shop.name_en || "").toLowerCase().includes(q);
      const matchDesc = shop.short_description.toLowerCase().includes(q) || shop.full_description.toLowerCase().includes(q);
      const matchCat = getCategoryName(shop.category_id).toLowerCase().includes(q);
      const matchMenu = shopProducts.some((p) => p.name_th.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
      if (!matchName && !matchDesc && !matchCat && !matchMenu) return false;
    }
    if (f.category !== "ALL") {
      if (f.category === "CAT-CAFE") {
        if (shop.shop_type !== "cafe" && shop.category_id !== "cat-09" && shop.category_id !== "cat-10") return false;
      } else if (shop.category_id !== f.category) {
        return false;
      }
    }
    if (f.zone !== "ALL") {
      if (f.zone === "S2") {
        const isS2 = shop.building_zone.includes("S2") || shop.building_zone.includes("ตลาดนัด");
        if (!isS2) return false;
      } else if (!shop.building_zone.includes(f.zone)) {
        return false;
      }
    }
    if (f.type !== "ALL") {
      if (f.type === "cafe" || f.type === "COFFEE_DRINK") {
        if (shop.shop_type !== "cafe" && shop.category_id !== "cat-09" && shop.category_id !== "cat-10") return false;
      } else if (shop.shop_type !== f.type) {
        return false;
      }
    }
    if (f.status === "OPEN_TODAY" && !isShopOpenToday(shop.id)) return false;
    if (f.day !== "ALL") {
      const scheds = getShopSchedules(shop.id);
      if (!scheds.some((s) => String(s.day_of_week) === String(f.day) && s.is_open)) return false;
    }
    if (f.verifiedOnly && !shop.is_verified) return false;
    return true;
  });

  filtered.sort((a, b) => {
    if (f.sort === "name_asc") return a.name_th.localeCompare(b.name_th, "th");
    if (f.sort === "price_asc") return (a.min_price || 999) - (b.min_price || 999);
    if (f.sort === "price_desc") return (b.max_price || 0) - (a.max_price || 0);
    if (f.sort === "recent") return new Date(b.updated_at) - new Date(a.updated_at);
    return Number(b.is_recommended) - Number(a.is_recommended);
  });

  return `
    <section class="section-block">
      <div class="container">
        <div class="section-header">
          <div>
            <h1 class="section-title">ค้นหาร้านค้าทั้งหมดใน มจธ. บางมด</h1>
            <p class="section-desc">ค้นหาจากชื่อร้าน เมนูอาหาร หมวดหมู่ อาคาร หรือวันเปิดขาย (พบ <strong class="tabular-nums">${filtered.length}</strong> ร้าน)</p>
          </div>
          <button class="btn btn-outline btn-sm" onclick="window.appResetShopFilters()">ล้างตัวกรองทั้งหมด</button>
        </div>

        <!-- Quick 1-Tap Filter Chips for Mobile & Fast Browsing -->
        <div class="quick-tags" style="margin-bottom:0.85rem;">
          <button class="quick-tag" onclick="window.appResetShopFilters()" style="${f.status === "ALL" && f.zone === "ALL" && f.category === "ALL" && f.type === "ALL" ? "background:var(--kmutt-dark-orange); color:#fff; font-weight:700;" : ""}">
            ✨ ทั้งหมด (${approved.length})
          </button>
          <button class="quick-tag" onclick="window.appUpdateShopFilter('status', '${f.status === "OPEN_TODAY" ? "ALL" : "OPEN_TODAY"}')" style="${f.status === "OPEN_TODAY" ? "background:var(--kmutt-dark-orange); color:#fff; font-weight:700;" : ""}">
            🟢 เปิดตอนนี้
          </button>
          <button class="quick-tag" onclick="window.appQuickFilterZone('S14')" style="${f.zone === "S14" && f.type === "ALL" ? "background:var(--kmutt-dark-orange); color:#fff; font-weight:700;" : ""}">
            🏢 โรงอาหาร S14
          </button>
          <button class="quick-tag" onclick="window.appFilterS2Market()" style="${f.type === "market_stall" ? "background:var(--kmutt-dark-orange); color:#fff; font-weight:700;" : ""}">
            🎪 ตลาดนัดใต้ตึก S2 (6 ร้านจริง)
          </button>
          <button class="quick-tag" onclick="window.appQuickFilterZone('CAFES')" style="${f.type === "cafe" ? "background:var(--kmutt-dark-orange); color:#fff; font-weight:700;" : ""}">
            ☕ คาเฟ่ & ชานม (9 ร้าน)
          </button>
          <button class="quick-tag" onclick="window.appQuickFilterZone('S11')" style="${f.zone === "S11" && f.type === "ALL" ? "background:var(--kmutt-dark-orange); color:#fff; font-weight:700;" : ""}">
            🐸 ลุงกบ S11
          </button>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
          <button class="btn btn-sm btn-outline mobile-filter-toggle-btn" onclick="window.appToggleFilterPanel()">
            ${state.filterPanelExpanded ? "▲ ซ่อนตัวกรองละเอียด" : "⚙️ ค้นหาแบบละเอียด (พิมพ์ค้นหา / อาคาร / วัน) ▼"}
          </button>
        </div>

        <div class="filter-panel ${state.filterPanelExpanded ? "mobile-filter-open" : "mobile-filter-collapsed"}">
          <div class="filter-grid">
            <div>
              <label class="form-label">ค้นหาชื่อร้าน / เมนูอาหาร / คำอธิบาย</label>
              <input
                type="text"
                class="form-control"
                placeholder="เช่น ข้าวมันไก่, ฮาลาล, กาแฟ, ลุงกบ..."
                value="${f.q}"
                oninput="window.appUpdateShopFilter('q', this.value)"
              />
            </div>
            <div>
              <label class="form-label">ประเภทสถานที่</label>
              <select class="form-control" onchange="window.appUpdateShopFilter('type', this.value)">
                <option value="ALL" ${f.type === "ALL" ? "selected" : ""}>ทุกประเภท</option>
                <option value="market_stall" ${f.type === "market_stall" ? "selected" : ""}>🎪 ตลาดนัดใต้ตึก S2 (6 ร้านจริง)</option>
                <option value="campus_food_court" ${f.type === "campus_food_court" ? "selected" : ""}>🏢 โรงอาหาร มจธ. (S14)</option>
                <option value="cafe" ${f.type === "cafe" ? "selected" : ""}>☕ คาเฟ่ & ชานม (9 ร้าน)</option>
                <option value="permanent_shop" ${f.type === "permanent_shop" ? "selected" : ""}>🐸 ร้านประจำ / ลุงกบ (S11)</option>
              </select>
            </div>
            <div>
              <label class="form-label">หมวดหมู่</label>
              <select class="form-control" onchange="window.appUpdateShopFilter('category', this.value)">
                <option value="ALL">ทุกหมวดหมู่</option>
                ${state.db.categories
                  .map(
                    (c) =>
                      `<option value="${c.id}" ${f.category === c.id ? "selected" : ""}>${c.name_th}</option>`
                  )
                  .join("")}
              </select>
            </div>
            <div>
              <label class="form-label">อาคาร / โซน</label>
              <select class="form-control" onchange="window.appUpdateShopFilter('zone', this.value)">
                <option value="ALL">ทุกโซนใน มจธ.</option>
                <option value="S14" ${f.zone === "S14" ? "selected" : ""}>โรงอาหาร S14</option>
                <option value="S2" ${f.zone === "S2" ? "selected" : ""}>อาคารจอดรถ S2 / ตลาดนัด</option>
                <option value="N10" ${f.zone === "N10" ? "selected" : ""}>หอสมุด N10</option>
                <option value="S11" ${f.zone === "S11" ? "selected" : ""}>ตึก S11 (ลุงกบ)</option>
                <option value="S6" ${f.zone === "S6" ? "selected" : ""}>ตึก S6 (เรียนรวม)</option>
                <option value="N2" ${f.zone === "N2" ? "selected" : ""}>ตึก N2 (วิศวกรรมฯ)</option>
              </select>
            </div>
            <div>
              <label class="form-label">วันเปิดขาย</label>
              <select class="form-control" onchange="window.appUpdateShopFilter('day', this.value)">
                <option value="ALL">ทุกวัน</option>
                <option value="1" ${f.day === "1" ? "selected" : ""}>วันจันทร์</option>
                <option value="2" ${f.day === "2" ? "selected" : ""}>วันอังคาร (ตลาดชุมชน)</option>
                <option value="3" ${f.day === "3" ? "selected" : ""}>วันพุธ (ตลาดนัด มจธ.)</option>
                <option value="4" ${f.day === "4" ? "selected" : ""}>วันพฤหัสบดี (ตลาดนัด มจธ.)</option>
                <option value="5" ${f.day === "5" ? "selected" : ""}>วันศุกร์</option>
              </select>
            </div>
            <div>
              <label class="form-label">การเรียงลำดับ</label>
              <select class="form-control" onchange="window.appUpdateShopFilter('sort', this.value)">
                <option value="recommended" ${f.sort === "recommended" ? "selected" : ""}>ร้านแนะนำ</option>
                <option value="name_asc" ${f.sort === "name_asc" ? "selected" : ""}>ชื่อร้าน ก–ฮ</option>
                <option value="price_asc" ${f.sort === "price_asc" ? "selected" : ""}>ราคาเริ่มต้นต่ำสุด</option>
                <option value="price_desc" ${f.sort === "price_desc" ? "selected" : ""}>ราคาสูงสุด</option>
                <option value="recent" ${f.sort === "recent" ? "selected" : ""}>อัปเดตล่าสุด</option>
              </select>
            </div>
          </div>

          <div style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:0.75rem; margin-top:0.85rem; padding-top:0.85rem; border-top:1px solid var(--border);">
            <div style="display:flex; flex-wrap:wrap; gap:0.65rem; align-items:center;">
              <label style="display:inline-flex; align-items:center; gap:0.35rem; font-size:0.82rem; cursor:pointer;">
                <input type="checkbox" ${f.status === "OPEN_TODAY" ? "checked" : ""} onchange="window.appUpdateShopFilter('status', this.checked ? 'OPEN_TODAY' : 'ALL')" />
                แสดงเฉพาะร้านที่เปิดวันนี้
              </label>
              <label style="display:inline-flex; align-items:center; gap:0.35rem; font-size:0.82rem; cursor:pointer;">
                <input type="checkbox" ${f.verifiedOnly ? "checked" : ""} onchange="window.appUpdateShopFilter('verifiedOnly', this.checked)" />
                เฉพาะร้านที่ยืนยันข้อมูลทางการ BPUU
              </label>
            </div>
            <div style="font-size:0.8rem; color:var(--text-muted);">
              แสดงผล <strong class="tabular-nums">${filtered.length}</strong> จาก <strong class="tabular-nums">${approved.length}</strong> ร้านค้า
            </div>
          </div>
        </div>

        ${
          filtered.length > 0
            ? `<div class="shops-grid">${filtered.map((s) => renderShopCard(s)).join("")}</div>`
            : `<div style="background:#ffffff; border:1px solid var(--border); border-radius:14px; padding:3rem; text-align:center;">
                <h3 style="font-size:1.15rem; margin-bottom:0.4rem;">ไม่พบร้านค้าที่ตรงกับคำค้นหา</h3>
                <p style="font-size:0.88rem; color:var(--text-muted); margin-bottom:1rem;">ลองเปลี่ยนคำค้นหา หรือกดล้างตัวกรองเพื่อดูร้านทั้งหมดใน มจธ.</p>
                <button class="btn btn-primary" onclick="window.appResetShopFilters()">แสดงร้านค้าทั้งหมด</button>
              </div>`
        }
      </div>
    </section>
  `;
}

function renderShopDetailPage(slug) {
  const shop = state.db.shops.find((s) => s.slug === slug || s.id === slug);
  if (!shop) {
    return `
      <div class="container section-block" style="text-align:center;">
        <h2>ไม่พบข้อมูลร้านค้าที่คุณค้นหา</h2>
        <button class="btn btn-primary" style="margin-top:1rem;" onclick="window.appNavigate('/shops')">กลับไปหน้าร้านค้าทั้งหมด</button>
      </div>
    `;
  }

  const isOpen = isShopOpenToday(shop.id);
  const isFav = state.favorites.includes(shop.id);
  const products = state.db.products.filter((p) => p.shop_id === shop.id);
  const schedules = getShopSchedules(shop.id);
  const reviews = state.db.reviews.filter((r) => r.shop_id === shop.id && r.status === "APPROVED");
  const related = state.db.shops
    .filter((s) => s.id !== shop.id && s.approval_status === "APPROVED" && (s.category_id === shop.category_id || s.building_zone === shop.building_zone))
    .slice(0, 3);

  return `
    <section class="section-block">
      <div class="container">
        <div style="margin-bottom:1rem;">
          <button class="btn btn-sm btn-outline" onclick="window.appNavigate('/shops')">← กลับไปหน้าร้านค้าทั้งหมด</button>
        </div>

        <!-- Shop Header Card -->
        <div style="background:#ffffff; border:1px solid var(--border); border-radius:16px; overflow:hidden; box-shadow:var(--shadow-card); margin-bottom:1.5rem;">
          <div style="position:relative; height:290px; background:#f3f4f6;">
            <img src="${shop.cover_image_url}" alt="${shop.name_th}" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80'" />
          </div>
          <div style="padding:1.5rem;">
            <div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:flex-start; gap:1rem;">
              <div>
                <div style="display:flex; flex-wrap:wrap; gap:0.4rem; margin-bottom:0.5rem;">
                  <span class="badge ${isOpen ? "badge-open" : "badge-closed"}">${isOpen ? "● เปิดให้บริการวันนี้" : "○ ปิดในวันนี้"}</span>
                  <span class="badge badge-neutral">${getCategoryName(shop.category_id)}</span>
                  ${shop.is_verified ? `<span class="badge badge-verified">✓ ยืนยันข้อมูลทางการ (${shop.data_source_name || "BPUU KMUTT"})</span>` : ""}
                </div>
                <h1 style="font-size:1.85rem; font-weight:700;">${shop.name_th}</h1>
                <p style="color:var(--text-muted); margin-top:0.35rem; max-width:780px;">${shop.full_description}</p>
              </div>
              <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                <button class="btn ${isFav ? "btn-primary" : "btn-outline"}" onclick="window.appToggleFav('${shop.id}', event)">
                  ${isFav ? "♥ บันทึกในร้านโปรดแล้ว" : "♡ บันทึกร้านโปรด"}
                </button>
                <button class="btn btn-cream" onclick="window.appNavigate('/market/map')">📍 ดูพิกัดบนแผนที่</button>
              </div>
            </div>

            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:1rem; margin-top:1.35rem; padding-top:1.25rem; border-top:1px solid var(--border); font-size:0.86rem;">
              <div><strong>🏢 อาคาร / โซน:</strong> ${shop.building_zone}</div>
              <div><strong>🏷️ ล็อก / ตำแหน่ง:</strong> ${shop.stall_number || "พื้นที่ร้านค้าประจำ"}</div>
              <div><strong>💰 ช่วงราคา:</strong> <span class="tabular-nums">${shop.price_range_label || "สอบถามที่ร้าน"}</span></div>
              <div><strong>📞 ติดต่อร้าน:</strong> ${shop.phone || "ติดต่อที่หน้าร้านโดยตรง"}</div>
              <div><strong>🗓️ วันเวลาเปิด:</strong> ${getShopDaysSummary(shop.id)}</div>
              <div><strong>🔄 อัปเดตข้อมูลล่าสุด:</strong> <span class="tabular-nums">${shop.updated_at}</span></div>
            </div>
          </div>
        </div>

        <!-- Menu / Products Section -->
        <div style="margin-bottom:2rem;">
          <div class="section-header">
            <div>
              <h2 class="section-title">รายการเมนูและสินค้าของร้าน (${products.length} รายการ)</h2>
              <p class="section-desc">ข้อมูลเมนูและราคาจริง (หากรายการใดไม่ระบุราคาจะแสดงข้อความ "สอบถามราคาที่ร้าน")</p>
            </div>
          </div>
          ${
            products.length > 0
              ? `<div class="products-grid">${products.map((p) => renderProductCard(p)).join("")}</div>`
              : `<div style="background:#ffffff; border:1px solid var(--border); border-radius:12px; padding:1.5rem;">ยังไม่มีรายการเมนูที่ลงทะเบียนไว้</div>`
          }
        </div>

        <!-- Operating Schedule & Facilities Info -->
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:1.5rem; margin-bottom:2rem;">
          <div style="background:#ffffff; border:1px solid var(--border); border-radius:14px; padding:1.35rem;">
            <h3 style="font-size:1.15rem; font-weight:700; margin-bottom:0.85rem; color:var(--text-main);">🕒 ตารางวัน-เวลาเปิดทำการ</h3>
            <div style="display:flex; flex-direction:column; gap:0.5rem; font-size:0.88rem;">
              ${[1, 2, 3, 4, 5, 6, 0]
                .map((d) => {
                  const sc = schedules.find((s) => Number(s.day_of_week) === d && s.is_open);
                  return `
                    <div style="display:flex; justify-content:space-between; padding:0.45rem 0; border-bottom:1px dashed var(--border);">
                      <span style="font-weight:600;">${DAY_NAMES_TH[d]}</span>
                      <span class="tabular-nums" style="color:${sc ? "var(--status-open)" : "var(--text-muted)"}; font-weight:${sc ? "600" : "400"};">
                        ${sc ? `${sc.open_time} – ${sc.close_time} น.` : "ปิดทำการ"}
                      </span>
                    </div>
                  `;
                })
                .join("")}
            </div>
          </div>

          <div style="background:#ffffff; border:1px solid var(--border); border-radius:14px; padding:1.35rem;">
            <h3 style="font-size:1.15rem; font-weight:700; margin-bottom:0.85rem; color:var(--text-main);">ℹ️ ข้อมูลบริการและสิ่งอำนวยความสะดวก</h3>
            <div style="display:flex; flex-direction:column; gap:0.75rem; font-size:0.88rem;">
              <div style="display:flex; align-items:center; gap:0.5rem;">
                <span class="badge badge-verified">📍 พิกัด</span>
                <span>${shop.building_zone} ${shop.stall_number ? `(${shop.stall_number})` : ""}</span>
              </div>
              <div style="display:flex; align-items:center; gap:0.5rem;">
                <span class="badge badge-verified">💳 การชำระเงิน</span>
                <span>รองรับเงินสด และสแกนจ่าย QR PromptPay ทุกธนาคาร</span>
              </div>
              <div style="display:flex; align-items:center; gap:0.5rem;">
                <span class="badge badge-verified">🌱 Green KMUTT</span>
                <span>สนับสนุนการนำกล่องข้าวและแก้วส่วนตัวมาเองเพื่อลดขยะ</span>
              </div>
              <div style="display:flex; align-items:center; gap:0.5rem;">
                <span class="badge badge-verified">📞 ติดต่อหน้าร้าน</span>
                <span>${shop.phone || "ติดต่อได้ที่หน้าร้านโดยตรง"}</span>
              </div>
              <div style="margin-top:0.5rem; padding-top:0.75rem; border-top:1px solid var(--border);">
                <button class="btn btn-primary btn-sm" onclick="window.appNavigate('/market/map')">ดูตำแหน่งร้านบนแผนที่มหาวิทยาลัย →</button>
              </div>
            </div>
          </div>
        </div>

        ${
          related.length > 0
            ? `<div>
                <h3 style="font-size:1.25rem; font-weight:700; margin-bottom:1rem;">ร้านค้าใกล้เคียงหรือหมวดหมู่เดียวกัน</h3>
                <div class="shops-grid">${related.map((s) => renderShopCard(s)).join("")}</div>
              </div>`
            : ""
        }
      </div>
    </section>
  `;
}

function renderProductsDirectoryPage() {
  const pf = state.productFilters;
  const filtered = state.db.products.filter((p) => {
    if (pf.q.trim()) {
      const q = pf.q.trim().toLowerCase();
      const shop = state.db.shops.find((s) => s.id === p.shop_id);
      if (
        !p.name_th.toLowerCase().includes(q) &&
        !p.description.toLowerCase().includes(q) &&
        !(shop && shop.name_th.toLowerCase().includes(q))
      ) {
        return false;
      }
    }
    if (pf.category !== "ALL" && p.category_id !== pf.category) return false;
    if (pf.maxPrice !== "ALL" && p.price !== null && Number(p.price) > Number(pf.maxPrice)) return false;
    return true;
  });

  if (pf.sort === "price_asc") {
    filtered.sort((a, b) => (a.price ?? 999) - (b.price ?? 999));
  } else if (pf.sort === "price_desc") {
    filtered.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
  } else {
    filtered.sort((a, b) => Number(b.is_recommended) - Number(a.is_recommended));
  }

  return `
    <section class="section-block">
      <div class="container">
        <div class="section-header">
          <div>
            <h1 class="section-title">ค้นหาเมนูอาหาร เครื่องดื่ม และสินค้า (${filtered.length} รายการ)</h1>
            <p class="section-desc">เช็กราคาอาหารจานเดียว กาแฟ ขนม และของกินตลาดนัด มจธ. ก่อนเดินไปซื้อจริง</p>
          </div>
          <div style="display:flex; gap:0.5rem; align-items:center;">
            <button class="btn btn-cream btn-sm" onclick="window.appOpenCravingModal()">🎲 สุ่มเมนูตามงบ</button>
            <button class="btn btn-outline btn-sm" onclick="window.appResetProductFilters()">ล้างตัวกรอง</button>
          </div>
        </div>

        <!-- Quick 1-Tap Filter Chips for Products -->
        <div class="quick-tags" style="margin-bottom:0.85rem;">
          <button class="quick-tag" onclick="window.appResetProductFilters()" style="${pf.category === "ALL" && pf.maxPrice === "ALL" && !pf.q ? "background:var(--kmutt-dark-orange); color:#fff; font-weight:700;" : ""}">
            ✨ ทั้งหมด (${state.db.products.length})
          </button>
          <button class="quick-tag" onclick="window.appUpdateProductFilter('category', '${pf.category === "CAT-ONE-DISH" ? "ALL" : "CAT-ONE-DISH"}')" style="${pf.category === "CAT-ONE-DISH" ? "background:var(--kmutt-dark-orange); color:#fff; font-weight:700;" : ""}">
            🍛 อาหารจานเดียว
          </button>
          <button class="quick-tag" onclick="window.appUpdateProductFilter('category', '${pf.category === "CAT-NOODLE" ? "ALL" : "CAT-NOODLE"}')" style="${pf.category === "CAT-NOODLE" ? "background:var(--kmutt-dark-orange); color:#fff; font-weight:700;" : ""}">
            🍜 ก๋วยเตี๋ยว
          </button>
          <button class="quick-tag" onclick="window.appUpdateProductFilter('category', '${pf.category === "CAT-CAFE" ? "ALL" : "CAT-CAFE"}')" style="${pf.category === "CAT-CAFE" ? "background:var(--kmutt-dark-orange); color:#fff; font-weight:700;" : ""}">
            ☕ คาเฟ่ & ชานม
          </button>
          <button class="quick-tag" onclick="window.appUpdateProductFilter('maxPrice', '${pf.maxPrice === "45" ? "ALL" : "45"}')" style="${pf.maxPrice === "45" ? "background:var(--kmutt-dark-orange); color:#fff; font-weight:700;" : ""}">
            💰 ไม่เกิน ฿45
          </button>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
          <button class="btn btn-sm btn-outline mobile-filter-toggle-btn" onclick="window.appToggleProductFilterPanel()">
            ${state.productFilterPanelExpanded ? "▲ ซ่อนตัวกรองละเอียด" : "⚙️ ค้นหาแบบละเอียด (พิมพ์ค้นหา / งบ / เรียง) ▼"}
          </button>
        </div>

        <div class="filter-panel ${state.productFilterPanelExpanded ? "mobile-filter-open" : "mobile-filter-collapsed"}">
          <div class="filter-grid product-filter-grid">
            <div>
              <label class="form-label">ค้นหาชื่อเมนู / รายละเอียด</label>
              <input class="form-control" placeholder="เช่น ข้าวหมูแดง, มัทฉะ, ไก่ทอดหาดใหญ่..." value="${pf.q}" oninput="window.appUpdateProductFilter('q', this.value)" />
            </div>
            <div>
              <label class="form-label">หมวดหมู่</label>
              <select class="form-control" onchange="window.appUpdateProductFilter('category', this.value)">
                <option value="ALL">ทุกหมวดหมู่</option>
                ${state.db.categories.map((c) => `<option value="${c.id}" ${pf.category === c.id ? "selected" : ""}>${c.name_th}</option>`).join("")}
              </select>
            </div>
            <div>
              <label class="form-label">งบประมาณสูงสุด</label>
              <select class="form-control" onchange="window.appUpdateProductFilter('maxPrice', this.value)">
                <option value="ALL">ไม่จำกัดราคา</option>
                <option value="45" ${pf.maxPrice === "45" ? "selected" : ""}>ไม่เกิน ฿45</option>
                <option value="60" ${pf.maxPrice === "60" ? "selected" : ""}>ไม่เกิน ฿60</option>
                <option value="80" ${pf.maxPrice === "80" ? "selected" : ""}>ไม่เกิน ฿80</option>
              </select>
            </div>
            <div>
              <label class="form-label">เรียงตาม</label>
              <select class="form-control" onchange="window.appUpdateProductFilter('sort', this.value)">
                <option value="recommended" ${pf.sort === "recommended" ? "selected" : ""}>เมนูแนะนำ</option>
                <option value="price_asc" ${pf.sort === "price_asc" ? "selected" : ""}>ราคาต่ำไปสูง</option>
                <option value="price_desc" ${pf.sort === "price_desc" ? "selected" : ""}>ราคาสูงไปต่ำ</option>
              </select>
            </div>
          </div>
        </div>

        <div class="products-grid">
          ${filtered.map((p) => renderProductCard(p)).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderProductDetailPage(slug) {
  const product = state.db.products.find((p) => p.slug === slug || p.id === slug);
  if (!product) {
    return `<div class="container section-block"><h2>ไม่พบเมนูที่คุณค้นหา</h2><button class="btn btn-primary" onclick="window.appNavigate('/products')">กลับไปหน้าเมนูทั้งหมด</button></div>`;
  }
  const shop = state.db.shops.find((s) => s.id === product.shop_id);
  return `
    <section class="section-block">
      <div class="container">
        <button class="btn btn-sm btn-outline" style="margin-bottom:1rem;" onclick="window.appNavigate('/products')">← กลับไปหน้าเมนูอาหาร</button>
        <div style="background:#ffffff; border:1px solid var(--border); border-radius:16px; overflow:hidden; display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); box-shadow:var(--shadow-card);">
          <img src="${product.image_url}" alt="${product.name_th}" style="width:100%; height:100%; max-height:420px; object-fit:cover;" />
          <div style="padding:2rem; display:flex; flex-direction:column; gap:0.85rem;">
            <div style="display:flex; gap:0.4rem;">
              <span class="badge badge-verified">${getCategoryName(product.category_id)}</span>
              <span class="badge ${product.is_available ? "badge-open" : "badge-closed"}">${product.is_available ? "พร้อมจำหน่าย" : "หมดชั่วคราว"}</span>
            </div>
            <h1 style="font-size:1.75rem; font-weight:700;">${product.name_th}</h1>
            <div class="product-price tabular-nums" style="font-size:1.5rem;">${formatPrice(product.price, product.price_label)}</div>
            <p style="color:var(--text-muted);">${product.description}</p>
            ${
              shop
                ? `<div style="margin-top:auto; padding-top:1rem; border-top:1px solid var(--border);">
                    <div style="font-weight:700; margin-bottom:0.25rem;">จำหน่ายโดย: ${shop.name_th}</div>
                    <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:0.75rem;">📍 ${shop.building_zone} • 🕒 ${getShopDaysSummary(shop.id)}</div>
                    <button class="btn btn-primary" onclick="window.appNavigate('/shops/${shop.slug}')">ดูข้อมูลร้านและเมนูอื่นๆ ของร้านนี้ →</button>
                  </div>`
                : ""
            }
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderCategoriesPage() {
  return `
    <section class="section-block">
      <div class="container">
        <div class="section-header">
          <div>
            <h1 class="section-title">หมวดหมู่อาหาร เครื่องดื่ม และสินค้าใน มจธ.</h1>
            <p class="section-desc">เลือกดูร้านค้าและเมนูแยกตามประเภทที่คุณต้องการ (${state.db.categories.length} หมวดหมู่)</p>
          </div>
        </div>
        <div class="shops-grid">
          ${state.db.categories
            .map((c) => {
              const shopsCount = state.db.shops.filter((s) => s.category_id === c.id && s.approval_status === "APPROVED").length;
              const menuCount = state.db.products.filter((p) => p.category_id === c.id).length;
              return `
                <div style="background:#ffffff; border:1px solid var(--border); border-radius:14px; padding:1.35rem; display:flex; flex-direction:column; gap:0.6rem; cursor:pointer; box-shadow:var(--shadow-card);" onclick="window.appFilterByCategory('${c.id}')">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div class="category-icon-box">${c.name_th.slice(0, 1)}</div>
                    <span class="badge badge-verified tabular-nums">${shopsCount} ร้าน • ${menuCount} เมนู</span>
                  </div>
                  <h3 style="font-size:1.15rem; font-weight:700;">${c.name_th}</h3>
                  <p style="font-size:0.85rem; color:var(--text-muted);">${c.description}</p>
                </div>
              `;
            })
            .join("")}
        </div>
      </div>
    </section>
  `;
}

function renderMarketMapPage() {
  const approvedShops = state.db.shops.filter((s) => s.approval_status === "APPROVED");
  const filteredShops = approvedShops.filter((s) =>
    state.selectedMapZone === "ALL" ? true : s.building_zone.includes(state.selectedMapZone)
  );
  const selectedStall = state.db.market_stalls.find((st) => st.stall_code === state.selectedStallCode) || state.db.market_stalls[0];
  const stallShop = selectedStall?.shop_id ? state.db.shops.find((s) => s.id === selectedStall.shop_id) : null;

  return `
    <section class="section-block">
      <div class="container">
        <div class="section-header">
          <div>
            <h1 class="section-title">แผนที่ร้านค้าและผังล็อกตลาดนัด มจธ. บางมด</h1>
            <p class="section-desc">สลับดูพิกัดจริงบนแผนที่ OpenStreetMap (S14, S2, N10, S11, S6, N2) หรือดูผังล็อกตลาดนัดอาคาร S2</p>
          </div>
          <div style="display:flex; gap:0.5rem;">
            <button class="btn ${state.mapMode === "gps" ? "btn-primary" : "btn-outline"}" onclick="window.appSetMapMode('gps')">🗺️ แผนที่พิกัดอาคาร (GPS Map)</button>
            <button class="btn ${state.mapMode === "stalls" ? "btn-primary" : "btn-outline"}" onclick="window.appSetMapMode('stalls')">🎪 ผังล็อกตลาดนัด S2 (${state.db.market_stalls.length} ล็อก)</button>
          </div>
        </div>

        ${
          state.mapMode === "gps"
            ? `
              <div style="display:flex; flex-wrap:wrap; gap:0.45rem; margin-bottom:1rem;">
                ${["ALL", "S14", "S2", "N10", "S11", "S6", "N2"]
                  .map(
                    (z) => `
                    <button class="btn btn-sm ${state.selectedMapZone === z ? "btn-primary" : "btn-outline"}" onclick="window.appSetMapZone('${z}')">
                      ${z === "ALL" ? "แสดงทุกอาคารใน มจธ." : `โซนอาคาร ${z}`}
                    </button>
                  `
                  )
                  .join("")}
              </div>
              <div class="map-split-layout">
                <div id="kmutt-leaflet-map"></div>
                <div style="background:#ffffff; border:1px solid var(--border); border-radius:14px; padding:1.1rem; max-height:520px; overflow-y:auto;">
                  <h3 style="font-size:1.05rem; font-weight:700; margin-bottom:0.75rem;">รายการร้านค้าในโซนที่เลือก (${filteredShops.length})</h3>
                  <div style="display:flex; flex-direction:column; gap:0.65rem;">
                    ${filteredShops
                      .map(
                        (s) => `
                        <div style="border:1px solid var(--border); border-radius:10px; padding:0.75rem; cursor:pointer;" onclick="window.appFocusShopMarker('${s.id}')">
                          <div style="display:flex; justify-content:space-between; align-items:center;">
                            <strong style="font-size:0.9rem;">${s.name_th}</strong>
                            <span class="badge ${isShopOpenToday(s.id) ? "badge-open" : "badge-closed"}">${isShopOpenToday(s.id) ? "เปิดวันนี้" : "ปิด"}</span>
                          </div>
                          <div style="font-size:0.78rem; color:var(--text-muted); margin-top:0.2rem;">📍 ${s.building_zone} ${s.stall_number ? `• ${s.stall_number}` : ""}</div>
                          <div style="margin-top:0.45rem;">
                            <button class="btn btn-sm btn-cream" onclick="event.stopPropagation(); window.appNavigate('/shops/${s.slug}')">ดูรายละเอียดร้าน →</button>
                          </div>
                        </div>
                      `
                      )
                      .join("")}
                  </div>
                </div>
              </div>
            `
            : `
              <div class="map-split-layout">
                <div style="background:#ffffff; border:1px solid var(--border); border-radius:14px; padding:1.35rem;">
                  <h3 style="font-size:1.1rem; font-weight:700; margin-bottom:0.35rem;">ผังล็อกตลาดนัดสินค้าชุมชนและตลาดนัด มจธ. (ลานชั้น 1 อาคารจอดรถ S2)</h3>
                  <p style="font-size:0.84rem; color:var(--text-muted); margin-bottom:1rem;">คลิกที่หมายเลขล็อกเพื่อดูชื่อร้านค้าและวันเปิดจำหน่าย</p>
                  <div class="stall-grid">
                    ${state.db.market_stalls
                      .map((st) => {
                        const sh = st.shop_id ? state.db.shops.find((s) => s.id === st.shop_id) : null;
                        return `
                          <div class="stall-box ${state.selectedStallCode === st.stall_code ? "selected" : ""}" onclick="window.appSelectStall('${st.stall_code}')">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem;">
                              <span class="badge badge-verified tabular-nums">ล็อก ${st.stall_code}</span>
                              <span style="font-size:0.72rem; color:var(--text-muted);">${st.zone_name}</span>
                            </div>
                            <div style="font-weight:700; font-size:0.9rem;">${sh ? sh.name_th : "ล็อกว่างสำหรับร้านหมุนเวียน"}</div>
                            <div style="font-size:0.76rem; color:var(--text-muted); margin-top:0.2rem;">📅 ${st.operating_day}</div>
                          </div>
                        `;
                      })
                      .join("")}
                  </div>
                </div>
                <div style="background:#ffffff; border:1px solid var(--border); border-radius:14px; padding:1.35rem;">
                  <span class="badge badge-verified">รายละเอียดล็อก ${selectedStall.stall_code}</span>
                  <h3 style="font-size:1.2rem; font-weight:700; margin-top:0.5rem;">${stallShop ? stallShop.name_th : "พื้นที่ล็อกหมุนเวียน BPUU"}</h3>
                  <p style="font-size:0.86rem; color:var(--text-muted); margin:0.5rem 0;">โซน: ${selectedStall.zone_name} • วันเปิดขาย: ${selectedStall.operating_day}</p>
                  ${
                    stallShop
                      ? `<p style="font-size:0.86rem; margin-bottom:1rem;">${stallShop.short_description}</p>
                         <button class="btn btn-primary" onclick="window.appNavigate('/shops/${stallShop.slug}')">เปิดหน้าร้านค้า →</button>`
                      : `<p style="font-size:0.85rem; color:var(--text-muted);">สนใจจองพื้นที่ล็อกตลาดนัด ติดต่อกลุ่มงานจัดการผลประโยชน์ (BPUU) โทร. 02-470-8065</p>`
                  }
                </div>
              </div>
            `
        }
      </div>
    </section>
  `;
}

function initLeafletMapIfNeeded() {
  if (state.route !== "/market/map" || state.mapMode !== "gps") return;
  const el = document.getElementById("kmutt-leaflet-map");
  if (!el || typeof window.L === "undefined") return;

  if (state.leafletMap) {
    state.leafletMap.remove();
    state.leafletMap = null;
  }

  const map = window.L.map("kmutt-leaflet-map").setView([13.651, 100.4943], 16);
  window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> KMUTT Bangmod',
  }).addTo(map);

  const approvedShops = state.db.shops.filter((s) => s.approval_status === "APPROVED");
  const filtered = approvedShops.filter((s) =>
    state.selectedMapZone === "ALL" ? true : s.building_zone.includes(state.selectedMapZone)
  );

  filtered.forEach((shop) => {
    if (!shop.latitude || !shop.longitude) return;
    const marker = window.L.marker([shop.latitude, shop.longitude]).addTo(map);
    marker.bindPopup(`
      <div style="font-family:'Prompt',sans-serif; min-width:190px;">
        <strong style="font-size:14px; color:#A6192E;">${shop.name_th}</strong><br/>
        <span style="font-size:12px; color:#525252;">📍 ${shop.building_zone}</span><br/>
        <span style="font-size:12px;">💰 ${shop.price_range_label || "ราคาประหยัด"}</span><br/>
        <button onclick="window.appNavigate('/shops/${shop.slug}')" style="margin-top:6px; background:#A6192E; color:#fff; border:none; border-radius:6px; padding:4px 10px; cursor:pointer; font-size:12px;">ดูเมนูร้าน</button>
      </div>
    `);
  });

  state.leafletMap = map;
}

function renderMarketSchedulePage() {
  return `
    <section class="section-block">
      <div class="container">
        <div class="section-header">
          <div>
            <h1 class="section-title">ตารางวันเปิดตลาดนัดและระเบียบการใช้พื้นที่ มจธ.</h1>
            <p class="section-desc">ข้อมูลอ้างอิงจากสำนักงานจัดการทรัพย์สิน (BPUU) มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี</p>
          </div>
          <button class="btn btn-primary btn-sm" onclick="window.appNavigate('/market/map')">ดูผังล็อกและแผนที่ →</button>
        </div>

        <div class="schedule-grid" style="margin-bottom:2rem;">
          ${state.db.market_events
            .map(
              (ev) => `
              <div class="schedule-card">
                <div>
                  <span class="badge badge-verified" style="margin-bottom:0.5rem;">📅 ${ev.day_name_th}</span>
                  <h3 style="font-size:1.2rem; font-weight:700; margin-bottom:0.4rem;">${ev.title_th}</h3>
                  <p style="font-size:0.86rem; color:var(--text-muted);">${ev.description}</p>
                </div>
                <div style="border-top:1px solid var(--border); padding-top:0.75rem; font-size:0.84rem;">
                  <div><strong>เวลาตั้งร้าน:</strong> <span class="tabular-nums">${ev.setup_time} น.</span></div>
                  <div><strong>เวลาเปิดขาย:</strong> <span class="tabular-nums">${ev.open_time} – ${ev.close_time} น.</span></div>
                  <div><strong>สถานที่:</strong> ${ev.location_name}</div>
                </div>
              </div>
            `
            )
            .join("")}
        </div>

        <div style="background:#ffffff; border:1px solid var(--border); border-radius:14px; padding:1.5rem;">
          <h3 style="font-size:1.15rem; font-weight:700; margin-bottom:0.75rem;">🌱 มาตรการ KMUTT Green Market และข้อปฏิบัติผู้ค้า</h3>
          <ul style="padding-left:1.25rem; font-size:0.9rem; color:var(--text-main); display:flex; flex-direction:column; gap:0.4rem;">
            <li>รณรงค์งดใช้ภาชนะโฟมบรรจุอาหาร และสนับสนุนการใช้บรรจุภัณฑ์ที่เป็นมิตรต่อสิ่งแวดล้อม (Green University)</li>
            <li>ร้านค้าในโรงอาหาร S14 และคาเฟ่ประจำอาคารผ่านการตรวจมาตรฐานสุขาภิบาลอาหารของมหาวิทยาลัย</li>
            <li>รองรับการชำระเงินทั้งเงินสดและสแกนจ่ายผ่านระบบ QR PromptPay ทุกแผงค้า</li>
          </ul>
        </div>
      </div>
    </section>
  `;
}

function renderFavoritesPage() {
  const favShops = state.db.shops.filter((s) => state.favorites.includes(s.id));
  return `
    <section class="section-block">
      <div class="container">
        <div class="section-header">
          <div>
            <h1 class="section-title">ร้านโปรดของคุณ (${favShops.length} ร้าน)</h1>
            <p class="section-desc">บันทึกร้านประจำใน มจธ. ไว้เช็กเมนูและเวลาเปิด-ปิดได้ทันทีโดยไม่ต้องล็อกอิน</p>
          </div>
          <button class="btn btn-outline btn-sm" onclick="window.appNavigate('/shops')">+ เพิ่มร้านโปรดเพิ่มเติม</button>
        </div>
        ${
          favShops.length > 0
            ? `<div class="shops-grid">${favShops.map((s) => renderShopCard(s)).join("")}</div>`
            : `<div style="background:#ffffff; border:1px solid var(--border); border-radius:14px; padding:3rem; text-align:center;">
                <h3>คุณยังไม่ได้กดหัวใจบันทึกร้านโปรด</h3>
                <p style="color:var(--text-muted); margin:0.5rem 0 1rem;">กดปุ่ม ♡ บนการ์ดร้านค้าเพื่อเก็บไว้ดูภายหลัง</p>
                <button class="btn btn-primary" onclick="window.appNavigate('/shops')">ไปสำรวจร้านค้าใน มจธ.</button>
              </div>`
        }
      </div>
    </section>
  `;
}

function renderReviewsPage() {
  const approvedReviews = state.db.reviews.filter((r) => r.status === "APPROVED");
  return `
    <section class="section-block">
      <div class="container">
        <div class="section-header">
          <div>
            <h1 class="section-title">รีวิวร้านค้าและเมนูเด็ดจากชาวบางมด (${approvedReviews.length})</h1>
            <p class="section-desc">เสียงจริงจากนักศึกษาและบุคลากร มจธ.</p>
          </div>
        </div>
        <div class="shops-grid">
          ${approvedReviews
            .map((r) => {
              const shop = state.db.shops.find((s) => s.id === r.shop_id);
              return `
                <div style="background:#ffffff; border:1px solid var(--border); border-radius:14px; padding:1.25rem; display:flex; flex-direction:column; gap:0.6rem;">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong>${r.user_name}</strong>
                    <span style="color:#b45309; font-weight:700;">${"★".repeat(r.rating)}</span>
                  </div>
                  <p style="font-size:0.9rem;">"${r.comment}"</p>
                  ${
                    shop
                      ? `<div style="margin-top:auto; padding-top:0.6rem; border-top:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; font-size:0.8rem;">
                          <span style="color:var(--text-muted);">🏪 ${shop.name_th}</span>
                          <button class="btn btn-sm btn-cream" onclick="window.appNavigate('/shops/${shop.slug}')">ดูร้านนี้ →</button>
                        </div>`
                      : ""
                  }
                </div>
              `;
            })
            .join("")}
        </div>
      </div>
    </section>
  `;
}

function renderAboutAndContactPage() {
  return `
    <section class="section-block">
      <div class="container">
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(340px, 1fr)); gap:1.5rem;">
          <div style="background:#ffffff; border:1px solid var(--border); border-radius:16px; padding:1.75rem;">
            <span class="badge badge-verified" style="margin-bottom:0.6rem;">เกี่ยวกับโครงการ</span>
            <h1 style="font-size:1.6rem; font-weight:700; margin-bottom:0.75rem;">KMUTT MARKET – ตลาดนัดและร้านค้าภายใน มจธ.</h1>
            <p style="color:var(--text-muted); margin-bottom:1rem;">
              แพลตฟอร์มรวบรวมข้อมูลร้านอาหาร โรงอาหาร S14 คาเฟ่ประจำอาคาร และตลาดนัดภายในมหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี (บางมด) เพื่อให้นักศึกษา บุคลากร และผู้มาติดต่อสามารถค้นหาของอร่อย เช็กราคา เวลาเปิด-ปิด และพิกัดอาคารได้ครบจบในที่เดียว
            </p>
            <div style="background:var(--kmutt-cream); border-radius:12px; padding:1rem; font-size:0.86rem;">
              <strong>แหล่งข้อมูลอ้างอิงทางการ:</strong><br/>
              สำนักงานจัดการทรัพย์สิน (BPUU) มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี<br/>
              เว็บไซต์: <a href="https://bpuu.kmutt.ac.th" target="_blank" rel="noreferrer" style="color:var(--kmutt-red); text-decoration:underline;">https://bpuu.kmutt.ac.th</a>
            </div>
          </div>

          <div style="background:#ffffff; border:1px solid var(--border); border-radius:16px; padding:1.75rem;">
            <span class="badge badge-verified" style="margin-bottom:0.6rem;">ติดต่อสอบถาม / ข้อมูลตลาดนัด</span>
            <h2 style="font-size:1.4rem; font-weight:700; margin-bottom:0.75rem;">กลุ่มงานจัดการผลประโยชน์ (BPUU KMUTT)</h2>
            <div style="display:flex; flex-direction:column; gap:0.65rem; font-size:0.9rem;">
              <div><strong>📍 ที่ตั้ง:</strong> อาคารสำนักงานจัดการทรัพย์สิน มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี 126 ถนนประชาอุทิศ แขวงบางมด เขตทุ่งครุ กรุงเทพฯ 10140</div>
              <div><strong>📞 โทรศัพท์:</strong> 02-470-8065, 02-470-8068</div>
              <div><strong>🕒 เวลาทำการ:</strong> วันจันทร์ – วันศุกร์ เวลา 08:30 – 16:30 น.</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderCravingModal() {
  if (!state.cravingModalOpen) return "";
  return `
    <div class="modal-backdrop" onclick="window.appCloseCravingModal()">
      <div class="modal-card" onclick="event.stopPropagation()">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
          <span class="badge badge-verified">🎲 KMUTT Meal & Craving Finder</span>
          <button class="btn btn-sm btn-outline" onclick="window.appCloseCravingModal()">✕ ปิด</button>
        </div>
        <h2 style="font-size:1.4rem; font-weight:700; margin-bottom:0.35rem;">วันนี้กินอะไรดีใน มจธ.?</h2>
        <p style="font-size:0.86rem; color:var(--text-muted); margin-bottom:1rem;">เลือกโซนอาคารเรียนและงบประมาณของคุณ แล้วให้ระบบสุ่มเมนูจริงในบางมดให้เลย!</p>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; margin-bottom:1rem;">
          <div>
            <label class="form-label">โซนอาคารที่คุณอยู่</label>
            <select class="form-control" onchange="window.appSetCravingFilter('zone', this.value)">
              <option value="ALL" ${state.cravingZone === "ALL" ? "selected" : ""}>ทุกอาคารใน มจธ.</option>
              <option value="S14" ${state.cravingZone === "S14" ? "selected" : ""}>โรงอาหาร S14</option>
              <option value="S2" ${state.cravingZone === "S2" ? "selected" : ""}>อาคาร S2 / ตลาดนัด</option>
              <option value="N10" ${state.cravingZone === "N10" ? "selected" : ""}>หอสมุด N10</option>
              <option value="S11" ${state.cravingZone === "S11" ? "selected" : ""}>ตึก S11 (ลุงกบ)</option>
            </select>
          </div>
          <div>
            <label class="form-label">งบประมาณต่อมื้อ</label>
            <select class="form-control" onchange="window.appSetCravingFilter('budget', this.value)">
              <option value="45" ${Number(state.cravingBudget) === 45 ? "selected" : ""}>ประหยัด ไม่เกิน ฿45</option>
              <option value="65" ${Number(state.cravingBudget) === 65 ? "selected" : ""}>อิ่มกำลังดี ไม่เกิน ฿65</option>
              <option value="100" ${Number(state.cravingBudget) === 100 ? "selected" : ""}>จัดเต็ม ไม่เกิน ฿100</option>
            </select>
          </div>
        </div>

        <button class="btn btn-primary" style="width:100%; margin-bottom:1rem;" onclick="window.appPickRandomCraving()">
          🎲 สุ่มเมนูเด็ดตอนนี้เลย!
        </button>

        ${
          state.cravingPick
            ? `
              <div style="background:var(--kmutt-cream); border:2px solid var(--kmutt-red); border-radius:14px; padding:1rem; display:flex; gap:1rem; align-items:center;">
                <img src="${state.cravingPick.product.image_url}" alt="${state.cravingPick.product.name_th}" style="width:92px; height:92px; border-radius:10px; object-fit:cover; flex-shrink:0;" />
                <div style="flex:1;">
                  <div style="font-size:0.76rem; color:var(--kmutt-red); font-weight:700;">✨ เมนูที่สุ่มได้สำหรับคุณ</div>
                  <h3 style="font-size:1.1rem; font-weight:700;">${state.cravingPick.product.name_th}</h3>
                  <div class="tabular-nums" style="font-weight:700; color:var(--kmutt-red); margin:0.15rem 0;">
                    ${formatPrice(state.cravingPick.product.price, state.cravingPick.product.price_label)}
                  </div>
                  <div style="font-size:0.8rem; color:var(--text-muted);">🏪 ${state.cravingPick.shop.name_th} (${state.cravingPick.shop.building_zone})</div>
                  <button class="btn btn-sm btn-primary" style="margin-top:0.5rem;" onclick="window.appCloseCravingModal(); window.appNavigate('/shops/${state.cravingPick.shop.slug}')">
                    ไปดูพิกัดและเมนูร้านนี้ →
                  </button>
                </div>
              </div>
            `
            : ""
        }
      </div>
    </div>
  `;
}


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
    /(#w+|#[\u0E00-\u0E7F\w]+)/g,
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
    const [cfgRes, histRes, campRes] = await Promise.all([
      fetch("/api/instagram/config").catch(() => null),
      fetch("/api/instagram/posts").catch(() => null),
      fetch("/api/instagram/campaign").catch(() => null),
    ]);
    if (cfgRes && cfgRes.ok) {
      const cfgData = await cfgRes.json();
      ig.config = cfgData.config;
    }
    if (histRes && histRes.ok) {
      const histData = await histRes.json();
      ig.history = histData.posts || [];
    }
    if (campRes && campRes.ok) {
      const campData = await campRes.json();
      ig.campaign = campData.campaign || null;
      ig.campaignSpots = campData.spots || [];
      if (campData.campaign?.intervalMinutes) {
        ig.campaignIntervalMinutes = campData.campaign.intervalMinutes;
      }
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

  return `
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
            <button class="ig-studio-tab-btn ${ig.activeTab === "campaign" ? "active" : ""}" onclick="window.igSetTab('campaign')">
              🚀 แคมเปญ 100 ร้าน (${ig.campaign?.completedCount || 0}/100)
            </button>
            <button class="ig-studio-tab-btn ${ig.activeTab === "studio" ? "active" : ""}" onclick="window.igSetTab('studio')">
              🎨 สตูดิโอสร้างโพสต์
            </button>
            <button class="ig-studio-tab-btn ${ig.activeTab === "scheduler" ? "active" : ""}" onclick="window.igSetTab('scheduler')">
              ⏰ ตั้งเวลา & บัญชี IG
            </button>
            <button class="ig-studio-tab-btn ${ig.activeTab === "history" ? "active" : ""}" onclick="window.igSetTab('history')">
              📋 ประวัติโพสต์ (<span class="tabular-nums">${ig.history?.length || 0}</span>)
            </button>
          </div>
        </div>

        ${ig.statusMessage ? `
          <div style="background:#ECFDF5; border:1.5px solid #10B981; border-radius:14px; padding:1rem 1.25rem; margin-bottom:1.5rem; display:flex; justify-content:space-between; align-items:center; color:#065F46;">
            <div style="display:flex; align-items:center; gap:0.6rem;">
              <span style="font-size:1.25rem;">🎉</span>
              <div>${ig.statusMessage}</div>
            </div>
            <button onclick="window.igDismissStatus()" style="background:transparent; border:none; color:#065F46; font-weight:700; cursor:pointer;">✕</button>
          </div>
        ` : ""}

        <!-- Tab 0: 100-Post Autonomous Campaign -->
        ${ig.activeTab === "campaign" ? renderIgCampaignTab() : ""}

        <!-- Tab 1: Studio -->
        ${ig.activeTab === "studio" ? renderIgStudioTab(selectedShop, shopProducts, selectedEvent) : ""}

        <!-- Tab 2: Scheduler & Settings -->
        ${ig.activeTab === "scheduler" ? renderIgSchedulerTab() : ""}

        <!-- Tab 3: History -->
        ${ig.activeTab === "history" ? renderIgHistoryTab() : ""}
      </div>
    </div>
  `;
}

function renderIgStudioTab(selectedShop, shopProducts, selectedEvent) {
  const ig = state.igStudio;
  const shops = state.db?.shops || [];
  const events = state.db?.market_events || [];

  return `
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
              class="btn btn-sm ${ig.targetType === "shop" ? "btn-primary" : "btn-outline"}"
              style="flex:1; border-radius:12px; font-weight:700;"
              onclick="window.igSetTargetType('shop')"
            >
              🍽️ ร้านอาหารใน มจธ. (${shops.length} ร้าน)
            </button>
            <button
              class="btn btn-sm ${ig.targetType === "event" ? "btn-primary" : "btn-outline"}"
              style="flex:1; border-radius:12px; font-weight:700;"
              onclick="window.igSetTargetType('event')"
            >
              🎪 ตลาดนัด S2 ประจำวัน
            </button>
          </div>

          ${ig.targetType === "shop" ? `
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
                ${shops.map((s) => `
                  <option value="${s.id}" ${s.id === ig.selectedShopId ? "selected" : ""}>
                    ${s.name} • ${s.building_name || "มจธ."} ${s.stall_number ? " (" + s.stall_number + ")" : ""}
                  </option>
                `).join("")}
              </select>
            </div>

            ${shopProducts.length > 0 ? `
              <div class="ig-form-group">
                <label class="ig-form-label">เลือกเมนูเด็ดไฮไลท์บนโปสเตอร์:</label>
                <select class="ig-form-select" onchange="window.igSelectProduct(this.value)">
                  <option value="">-- แนะนำร้านค้าโดยรวม (หรือเลือกเมนูเด็ด) --</option>
                  ${shopProducts.map((p) => `
                    <option value="${p.id}" ${p.id === ig.selectedProductId ? "selected" : ""}>
                      ${p.name} (${p.price ? "฿" + p.price : "ราคานักศึกษา"}) ${p.is_recommended ? "⭐️ แนะนำ" : ""}
                    </option>
                  `).join("")}
                </select>
              </div>
            ` : ""}
          ` : `
            <div class="ig-form-group">
              <label class="ig-form-label">เลือกวันจัดตลาดนัด S2:</label>
              <select class="ig-form-select" onchange="window.igSelectEvent(this.value)">
                ${events.map((e) => `
                  <option value="${e.id}" ${e.id === ig.selectedEventId ? "selected" : ""}>
                    ${e.name} (${e.start_time} - ${e.end_time} น.)
                  </option>
                `).join("")}
              </select>
            </div>
          `}
        </div>

        <!-- 2. Poster Theme & Headline Card -->
        <div class="ig-card">
          <div class="ig-card-title">
            <span>🎨 2. รูปแบบธีมโปสเตอร์ (1080x1350)</span>
          </div>

          <div class="ig-theme-grid" style="margin-bottom:1.25rem;">
            <!-- Recommended Punpromotion Style -->
            <div class="ig-theme-option ${ig.themeKey === "punpro" ? "active" : ""}" style="grid-column: 1 / -1; border: 2.5px solid #FFDE00; background: #FFFDE7;" onclick="window.igSelectTheme('punpro')">
              <span style="width:24px; height:24px; border-radius:50%; background:#FFDE00; border:2.5px solid #18181B; display:flex; align-items:center; justify-content:center; font-size:12px; flex-shrink:0;">📢</span>
              <div style="flex:1;">
                <div style="font-weight:800; font-size:0.95rem; color:#0F172A; display:flex; align-items:center; gap:0.4rem;">
                  <span>ปันโปรชวนชิม (Punpro Lifestyle)</span>
                  <span style="font-size:0.7rem; background:#E11D48; color:#FFFFFF; padding:1px 6px; border-radius:4px; font-weight:700;">สไตล์คนทำจริง</span>
                </div>
                <div style="font-size:0.78rem; color:#713F12;">ภาพอาหารจริงเต็มจอ + สติกเกอร์ชี้เป้าสีเหลือง + ป้ายราคาเอียง เหมือนโพสต์เพจปันโปร</div>
              </div>
            </div>

            <div class="ig-theme-option ${ig.themeKey === "kmutt-orange" ? "active" : ""}" onclick="window.igSelectTheme('kmutt-orange')">
              <span style="width:20px; height:20px; border-radius:50%; background:#FA4616; display:inline-block; flex-shrink:0;"></span>
              <div>
                <div style="font-weight:700; font-size:0.88rem; color:var(--text-main);">KMUTT Bold Orange</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">ส้ม-ขาว ทางการ มจธ.</div>
              </div>
            </div>

            <div class="ig-theme-option ${ig.themeKey === "street-neon" ? "active" : ""}" onclick="window.igSelectTheme('street-neon')">
              <span style="width:20px; height:20px; border-radius:50%; background:#0F172A; border:2px solid #F59E0B; display:inline-block; flex-shrink:0;"></span>
              <div>
                <div style="font-weight:700; font-size:0.88rem; color:var(--text-main);">Midnight Street Food</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">ดาร์กโหมดนีออน ชวนหิว</div>
              </div>
            </div>

            <div class="ig-theme-option ${ig.themeKey === "cafe-pastel" ? "active" : ""}" onclick="window.igSelectTheme('cafe-pastel')">
              <span style="width:20px; height:20px; border-radius:50%; background:#EA580C; border:2px solid #FDE047; display:inline-block; flex-shrink:0;"></span>
              <div>
                <div style="font-weight:700; font-size:0.88rem; color:var(--text-main);">Warm Cafe & Bakery</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">โทนครีม-คาราเมล อบอุ่น</div>
              </div>
            </div>

            <div class="ig-theme-option ${ig.themeKey === "market-fest" ? "active" : ""}" onclick="window.igSelectTheme('market-fest')">
              <span style="width:20px; height:20px; border-radius:50%; background:#047857; border:2px solid #10B981; display:inline-block; flex-shrink:0;"></span>
              <div>
                <div style="font-weight:700; font-size:0.88rem; color:var(--text-main);">Market Day Festival</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">เทศกาลตลาดนัด S2</div>
              </div>
            </div>
          </div>

          <div class="ig-form-group">
            <label class="ig-form-label">ข้อความพาดหัวโปสเตอร์ (Headline / Eyebrow):</label>
            <input
              type="text"
              class="ig-form-input"
              value="${ig.customHeadline || ""}"
              placeholder="เช่น ร้านเด็ด มจธ. แนะนำวันนี้"
              oninput="window.igUpdateCustomHeadline(this.value)"
            />
          </div>

          <button
            class="btn btn-outline btn-sm"
            style="width:100%; border-radius:12px; font-weight:700;"
            onclick="window.igRegeneratePoster()"
            ${ig.isGenerating ? "disabled" : ""}
          >
            ${ig.isGenerating ? "⏳ กำลังสร้างภาพโปสเตอร์..." : "🔄 อัปเดตภาพโปสเตอร์ใหม่ (Regenerate)"}
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
              ${ig.isGenerating ? "disabled" : ""}
            >
              ✨ สร้างแคปชั่นใหม่
            </button>
          </div>

          <div class="ig-form-group">
            <label class="ig-form-label">เลือกโทนเสียง / อารมณ์ของโพสต์:</label>
            <div class="ig-tone-chips">
              <div class="ig-tone-chip ${ig.tone === "punpro" ? "active" : ""}" style="background:${ig.tone === "punpro" ? "#FFE500" : "#FFFDE7"}; color:#18181B; border-color:#FFDE00; font-weight:800;" onclick="window.igSelectTone('punpro')">
                📣 สไตล์ปันโปร (ชี้เป้าโปรโมชั่น)
              </div>
              <div class="ig-tone-chip ${ig.tone === "student" ? "active" : ""}" onclick="window.igSelectTone('student')">
                🎒 เด็กบางมด (เป็นกันเอง)
              </div>
              <div class="ig-tone-chip ${ig.tone === "foodie" ? "active" : ""}" onclick="window.igSelectTone('foodie')">
                🤤 สายกินชวนหิว (เน้นความอร่อย)
              </div>
              <div class="ig-tone-chip ${ig.tone === "official" ? "active" : ""}" onclick="window.igSelectTone('official')">
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
            >${ig.caption || ""}</textarea>
          </div>
        </div>

        <!-- 4. Publishing & Download Actions -->
        <div class="ig-card" style="background:#FFF7ED; border:2px solid #FED7AA;">
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
              ${ig.isPublishing ? "disabled" : ""}
            >
              ${ig.isPublishing ? "⏳ กำลังเปิดบอทโพสต์ลง Instagram..." : "🤖 โพสต์อัตโนมัติด้วย User/Pass (Browser Bot)"}
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
              <span style="font-size:1.1rem; cursor:pointer;" onclick="window.igToggleLike()">${ig.isLiked ? "❤️" : "🤍"}</span>
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
            ${ig.posterUrl ? `
              <img src="${ig.posterUrl}" alt="Instagram Poster" />
            ` : `
              <div style="color:#FFFFFF; text-align:center; padding:2rem;">
                <div style="font-size:2rem; margin-bottom:0.5rem;">🎨</div>
                <div style="font-weight:600;">กำลังสร้างภาพโปสเตอร์...</div>
              </div>
            `}

            ${ig.isGenerating ? `
              <div style="position:absolute; inset:0; background:rgba(0,0,0,0.65); display:flex; flex-direction:column; align-items:center; justify-content:center; color:#FFFFFF; gap:0.75rem;">
                <span class="pulse-dot" style="width:14px; height:14px;"></span>
                <span style="font-weight:700; font-size:0.9rem;">กำลังประมวลผลโปสเตอร์...</span>
              </div>
            ` : ""}
          </div>

          <!-- Action Icons Bar -->
          <div class="ig-feed-actions">
            <div style="display:flex; gap:0.85rem; align-items:center;">
              <span style="font-size:1.35rem; cursor:pointer;" onclick="window.igToggleLike()">${ig.isLiked ? "❤️" : "🤍"}</span>
              <span style="font-size:1.3rem; cursor:pointer;">💬</span>
              <span style="font-size:1.3rem; cursor:pointer;" onclick="window.igCopyCaption()">✈️</span>
            </div>
            <span style="font-size:1.35rem; cursor:pointer;" onclick="window.igDownloadPoster()">🏷️</span>
          </div>

          <!-- Likes Count -->
          <div class="ig-feed-likes">
            ถูกใจ <span class="tabular-nums">${(ig.isLiked ? ig.previewLikes + 1 : ig.previewLikes).toLocaleString()}</span> คน
          </div>

          <!-- Caption Box -->
          <div class="ig-feed-caption-box">
            <span style="font-weight:700; margin-right:0.35rem;">kmutt.market</span>
            <span>${formatIgCaption(ig.caption, ig.isCaptionExpanded)}</span>
          </div>

          <!-- Time & Meta -->
          <div style="padding:0 0.9rem 0.9rem; font-size:0.7rem; color:#94A3B8; text-transform:uppercase;">
            15 นาทีที่แล้ว • กรุงเทพมหานคร
          </div>
        </div>
      </div>
    </div>
  `;
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
    igUsername: "",
    igPassword: "",
  };

  return `
    <div style="max-width:860px; margin:0 auto;">
      <!-- Card 1: Easy Instagram Login with Username & Password (NO TOKEN!) -->
      <div class="ig-card" style="border:2.5px solid var(--kmutt-orange); background:#FFF7ED; box-shadow:0 8px 24px rgba(250,70,22,0.12);">
        <div class="ig-card-title" style="color:var(--kmutt-dark-orange); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
          <span>🤖 1. ล็อกอินด้วย IG Username & Password (วิธีที่ง่ายที่สุด ไม่ต้องใช้ Token!)</span>
          <span style="font-size:0.75rem; background:#16A34A; color:#FFFFFF; padding:0.25rem 0.65rem; border-radius:999px; font-weight:700;">
            ${cfg.igUsername ? "🟢 บันทึกบัญชี @" + cfg.igUsername + " แล้ว" : "⚪ ยังไม่ได้ระบุบัญชี"}
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
                value="${cfg.igUsername || ""}"
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
                value="${cfg.igPassword || ""}"
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
              <input type="checkbox" name="autoPilotEnabled" ${cfg.autoPilotEnabled ? "checked" : ""} style="opacity:0; width:0; height:0;" onchange="this.nextElementSibling.style.background = this.checked ? '#FA4616' : '#CBD5E1';"/>
              <span style="position:absolute; cursor:pointer; inset:0; background:${cfg.autoPilotEnabled ? "#FA4616" : "#CBD5E1"}; border-radius:34px; transition:0.3s;">
                <span style="position:absolute; height:20px; width:20px; left:4px; bottom:4px; background:white; border-radius:50%; transition:0.3s; transform:${cfg.autoPilotEnabled ? "translateX(24px)" : "translateX(0)"};"></span>
              </span>
            </label>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.25rem; margin-bottom:1.25rem;">
            <div class="ig-form-group" style="margin-bottom:0;">
              <label class="ig-form-label">เวลาโพสต์ร้านเด็ดประจำวัน (ก่อนมื้อเที่ยง):</label>
              <input type="time" name="scheduleTime" class="ig-form-input" value="${cfg.scheduleTime || "10:30"}" />
            </div>

            <div class="ig-form-group" style="margin-bottom:0;">
              <label class="ig-form-label">เวลาแจ้งเตือนตลาดนัด S2 (อังคาร-พฤหัสฯ):</label>
              <input type="time" name="marketAlertTime" class="ig-form-input" value="${cfg.marketAlertTime || "07:30"}" />
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
              value="${cfg.accountId || ""}"
              placeholder="เช่น 17841400000000000 (ดูได้จาก Graph API Explorer / Meta Business Suite)"
            />
          </div>

          <div class="ig-form-group">
            <label class="ig-form-label">Meta Long-lived Page Access Token:</label>
            <input
              type="password"
              name="accessToken"
              class="ig-form-input"
              value="${cfg.accessToken || ""}"
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
              value="${cfg.publicBaseUrl || ""}"
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
              value="${cfg.geminiApiKey || ""}"
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
  `;
}

function renderIgCampaignTab() {
  const ig = state.igStudio;
  const camp = ig.campaign || {
    completedCount: 0,
    targetCount: 100,
    currentIndex: 0,
    status: "idle",
    intervalMinutes: 20,
    posts: [],
    lastPostAt: null,
    nextPostAt: null,
  };
  const spots = ig.campaignSpots || [];
  const completedCount = camp.completedCount || 0;
  const targetCount = camp.targetCount || 100;
  const pct = Math.min(100, Math.round((completedCount / targetCount) * 100));
  const isRunning = camp.status === "running";
  const isCompleted = camp.status === "completed" || completedCount >= targetCount;
  const isPaused = camp.status === "paused";
  const intervalMin = ig.campaignIntervalMinutes || camp.intervalMinutes || 20;

  const nextSpot = spots[camp.currentIndex] || spots[0];

  // Filtering
  const selectedZone = ig.campaignFilterZone || "ALL";
  const selectedStatus = ig.campaignFilterStatus || "ALL";

  const filteredSpots = spots.filter((s) => {
    if (selectedZone !== "ALL" && !s.zone.includes(selectedZone)) return false;
    if (selectedStatus === "posted" && !s.posted) return false;
    if (selectedStatus === "queued" && s.posted) return false;
    return true;
  });

  const zoneFilters = [
    { id: "ALL", label: "ทั้งหมด (100)" },
    { id: "S14", label: "โรงอาหาร S14" },
    { id: "S11", label: "โรงอาหาร S11" },
    { id: "ตลาดนัด S2", label: "ตลาดนัด S2" },
    { id: "หน้ามอ", label: "หน้ามอ มจธ." },
    { id: "สวนหมาก", label: "สวนหมาก & ตลาด 61" },
    { id: "พุทธบูชา", label: "พุทธบูชา" },
    { id: "ประชาอุทิศ", label: "ประชาอุทิศ 33/45/47" },
  ];

  return `
    <div style="display:flex; flex-direction:column; gap:1.5rem;">
      <!-- Hero Campaign Card -->
      <div class="ig-card" style="background:linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%); color:#FFFFFF; border:none; box-shadow:0 12px 30px rgba(49, 46, 129, 0.25);">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:1rem; margin-bottom:1.25rem;">
          <div>
            <div style="display:inline-flex; align-items:center; gap:0.5rem; background:rgba(255,255,255,0.15); backdrop-filter:blur(10px); padding:0.35rem 0.85rem; border-radius:999px; font-size:0.8rem; font-weight:700; margin-bottom:0.75rem;">
              <span>🤖 FULLY AUTONOMOUS LOOP</span>
              <span>•</span>
              <span>100 FOOD SPOTS</span>
            </div>
            <h2 style="font-size:1.75rem; font-weight:800; font-family:var(--font-display); color:#FFFFFF; margin-bottom:0.4rem;">
              🚀 แคมเปญโพสต์อัตโนมัติ 100 ร้านในและรอบ มจธ.
            </h2>
            <p style="font-size:0.95rem; color:#E0E7FF; max-width:680px; line-height:1.6;">
              ระบบสร้างภาพโปสเตอร์สไตล์ <strong>ปันโปร (@punpromotion)</strong> และเขียนแคปชั่นชวนชิมลง Instagram Feed โดยอัตโนมัติ 100 ร้านรอบมหาวิทยาลัย โดยไม่ต้องมีคนเฝ้า และหยุดการทำงานอัตโนมัติเมื่อครบ 100 โพสต์
            </p>
          </div>

          <!-- Status Indicator Pill -->
          <div>
            ${isRunning ? `
              <div style="background:#10B981; color:#FFFFFF; font-weight:800; padding:0.6rem 1.15rem; border-radius:999px; font-size:0.9rem; display:flex; align-items:center; gap:0.5rem; box-shadow:0 4px 14px rgba(16, 185, 129, 0.4);">
                <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:#FFFFFF; animation:pulse 1.5s infinite;"></span>
                บอทกำลังทำงานอัตโนมัติ (RUNNING)
              </div>
            ` : isPaused ? `
              <div style="background:#F59E0B; color:#FFFFFF; font-weight:800; padding:0.6rem 1.15rem; border-radius:999px; font-size:0.9rem; display:flex; align-items:center; gap:0.5rem;">
                ⏸️ หยุดพักชั่วคราว (PAUSED)
              </div>
            ` : isCompleted ? `
              <div style="background:#8B5CF6; color:#FFFFFF; font-weight:800; padding:0.6rem 1.15rem; border-radius:999px; font-size:0.9rem; display:flex; align-items:center; gap:0.5rem;">
                🎉 ครบ 100 โพสต์แล้ว! (COMPLETED)
              </div>
            ` : `
              <div style="background:rgba(255,255,255,0.2); color:#FFFFFF; font-weight:800; padding:0.6rem 1.15rem; border-radius:999px; font-size:0.9rem; display:flex; align-items:center; gap:0.5rem;">
                ⚪ พร้อมเริ่มทำงาน (READY)
              </div>
            `}
          </div>
        </div>

        <!-- 4 Metric Counters -->
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:1rem; margin-top:1.5rem; margin-bottom:1.5rem;">
          <div style="background:rgba(255, 255, 255, 0.1); border-radius:14px; padding:1rem 1.25rem; border:1px solid rgba(255, 255, 255, 0.15);">
            <div style="font-size:0.8rem; color:#C7D2FE; font-weight:600;">🎯 เป้าหมายแคมเปญ</div>
            <div style="font-size:1.85rem; font-weight:800; color:#FFFFFF; margin-top:0.25rem;">100 ร้าน</div>
            <div style="font-size:0.75rem; color:#A5B4FC; margin-top:0.2rem;">ใน มจธ. + รอบนอก 7 โซน</div>
          </div>

          <div style="background:rgba(255, 255, 255, 0.1); border-radius:14px; padding:1rem 1.25rem; border:1px solid rgba(255, 255, 255, 0.15);">
            <div style="font-size:0.8rem; color:#C7D2FE; font-weight:600;">✅ โพสต์สำเร็จแล้ว</div>
            <div style="font-size:1.85rem; font-weight:800; color:#FDE047; margin-top:0.25rem;">
              ${completedCount} <span style="font-size:1rem; color:#E0E7FF; font-weight:500;">/ ${targetCount}</span>
            </div>
            <div style="font-size:0.75rem; color:#A5B4FC; margin-top:0.2rem;">ความคืบหน้า ${pct}%</div>
          </div>

          <div style="background:rgba(255, 255, 255, 0.1); border-radius:14px; padding:1rem 1.25rem; border:1px solid rgba(255, 255, 255, 0.15);">
            <div style="font-size:0.8rem; color:#C7D2FE; font-weight:600;">⏱️ ความถี่การโพสต์</div>
            <div style="font-size:1.85rem; font-weight:800; color:#FFFFFF; margin-top:0.25rem;">
              ${intervalMin} <span style="font-size:1rem; color:#E0E7FF; font-weight:500;">นาที/โพสต์</span>
            </div>
            <div style="font-size:0.75rem; color:#A5B4FC; margin-top:0.2rem;">🛡️ Safe Delay ป้องกัน IG บล็อก</div>
          </div>

          <div style="background:rgba(255, 255, 255, 0.1); border-radius:14px; padding:1rem 1.25rem; border:1px solid rgba(255, 255, 255, 0.15);">
            <div style="font-size:0.8rem; color:#C7D2FE; font-weight:600;">📍 ร้านถัดไปในคิว</div>
            <div style="font-size:1.15rem; font-weight:700; color:#FFFFFF; margin-top:0.35rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
              #${(camp.currentIndex || 0) + 1} ${nextSpot?.name || "-"}
            </div>
            <div style="font-size:0.75rem; color:#A5B4FC; margin-top:0.2rem;">${nextSpot?.dish || ""}</div>
          </div>
        </div>

        <!-- Progress Bar -->
        <div style="margin-top:1rem;">
          <div style="display:flex; justify-content:space-between; font-size:0.85rem; font-weight:700; margin-bottom:0.4rem; color:#E0E7FF;">
            <span>ความคืบหน้าแคมเปญ 100 ร้าน</span>
            <span>${completedCount} / ${targetCount} ร้าน (${pct}%)</span>
          </div>
          <div style="background:rgba(0, 0, 0, 0.3); border-radius:999px; height:20px; overflow:hidden; padding:3px; border:1px solid rgba(255, 255, 255, 0.15);">
            <div style="width:${Math.max(pct, 2)}%; height:100%; border-radius:999px; background:linear-gradient(90deg, #FACC15 0%, #FA4616 100%); transition:width 0.4s ease; box-shadow:0 0 12px rgba(250, 70, 22, 0.5);"></div>
          </div>
        </div>

        <!-- Controls Toolbar -->
        <div style="margin-top:1.5rem; padding-top:1.25rem; border-top:1px solid rgba(255, 255, 255, 0.15); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
          <div style="display:flex; align-items:center; gap:0.75rem; flex-wrap:wrap;">
            ${isRunning ? `
              <button
                class="btn"
                style="background:#F59E0B; color:#FFFFFF; font-weight:800; border:none; border-radius:12px; padding:0.65rem 1.35rem; cursor:pointer;"
                onclick="window.igPauseCampaign()"
              >
                ⏸️ หยุดพักแคมเปญ (Pause)
              </button>
            ` : `
              <button
                class="btn"
                style="background:linear-gradient(135deg, #FA4616, #FF6B3D); color:#FFFFFF; font-weight:800; border:none; border-radius:12px; padding:0.65rem 1.45rem; cursor:pointer; box-shadow:0 4px 14px rgba(250, 70, 22, 0.4);"
                onclick="window.igStartCampaign()"
                ${isCompleted ? "disabled" : ""}
              >
                ▶️ เริ่มแคมเปญ 100 ร้านอัตโนมัติ
              </button>
            `}

            <button
              class="btn"
              style="background:rgba(255,255,255,0.15); color:#FFFFFF; font-weight:700; border:1px solid rgba(255,255,255,0.25); border-radius:12px; padding:0.65rem 1.25rem; cursor:pointer;"
              onclick="window.igPostNextCampaign()"
              ${isCompleted ? "disabled" : ""}
            >
              ⚡ โพสต์ร้านถัดไปทันที (Post Next)
            </button>

            <button
              class="btn"
              style="background:transparent; color:#FCA5A5; font-weight:600; border:1px solid rgba(239,68,68,0.4); border-radius:12px; padding:0.65rem 1rem; cursor:pointer;"
              onclick="window.igResetCampaign()"
            >
              🔄 รีเซ็ตแคมเปญ
            </button>
          </div>

          <div style="display:flex; align-items:center; gap:0.6rem;">
            <label style="font-size:0.85rem; color:#C7D2FE; font-weight:600;">ความถี่:</label>
            <select
              style="background:rgba(255,255,255,0.15); color:#FFFFFF; border:1px solid rgba(255,255,255,0.3); border-radius:10px; padding:0.45rem 0.85rem; font-size:0.85rem; font-weight:700; cursor:pointer; outline:none;"
              onchange="window.igSetCampaignInterval(this.value)"
            >
              <option value="2" ${intervalMin === 2 ? "selected" : ""} style="color:#000;">⚡ ทุกๆ 2 นาที (ตามคำขอ)</option>
              <option value="5" ${intervalMin === 5 ? "selected" : ""} style="color:#000;">ทุกๆ 5 นาที</option>
              <option value="10" ${intervalMin === 10 ? "selected" : ""} style="color:#000;">ทุกๆ 10 นาที</option>
              <option value="15" ${intervalMin === 15 ? "selected" : ""} style="color:#000;">ทุกๆ 15 นาที</option>
              <option value="20" ${intervalMin === 20 ? "selected" : ""} style="color:#000;">ทุกๆ 20 นาที</option>
              <option value="30" ${intervalMin === 30 ? "selected" : ""} style="color:#000;">ทุกๆ 30 นาที</option>
            </select>
            <button
              class="btn btn-sm"
              style="background:rgba(255,255,255,0.15); color:#FFFFFF; border:1px solid rgba(255,255,255,0.2); border-radius:10px; padding:0.45rem 0.75rem;"
              onclick="window.igRefreshCampaign()"
              title="รีเฟรชสถานะ"
            >
              🔄
            </button>
          </div>
        </div>
      </div>

      <!-- Punpro Guarantee & Info Banner -->
      <div class="ig-card" style="background:#FFFBEB; border:1.5px solid #FDE68A;">
        <div style="display:flex; gap:1rem; align-items:flex-start;">
          <div style="font-size:2rem; line-height:1;">✨</div>
          <div style="flex:1;">
            <h3 style="font-size:1.05rem; font-weight:800; color:#92400E; margin-bottom:0.35rem;">
              📸 มาตรฐานการโปรโมทสไตล์ "ปันโปรชวนชิม" (@punpromotion)
            </h3>
            <div style="font-size:0.88rem; color:#78350F; line-height:1.7;">
              • <strong>ภาพถ่ายอาหารจริงเต็มเฟรม 1080x1350:</strong> รูปอาหารน่ากิน ไม่ใช้ภาพตัดแปะลอยๆ<br/>
              • <strong>ป้ายหัวข้อสีเหลืองสดเด่นชัด:</strong> สไตล์ปันโปรสะดุดตาทุก Feed เลื่อนผ่านต้องหยุดดู<br/>
              • <strong>สติกเกอร์ราคาเอียง -7°:</strong> ดีไซน์เอกลักษณ์บอกราคาชัดเจน เช่น <code>40.-</code>, <code>50.-</code> อิ่มคุ้มงบเด็ก มจธ.<br/>
              • <strong>แคปชั่นนักรีวิวตัวจริง:</strong> บอก 3 เหตุผลป้ายยา แนะนำเมนูเด็ด ปักหมุดพิกัดอาคาร/ซอยอย่างแม่นยำ พร้อมแฮชแท็กครบชุด<br/>
              • <strong>หยุดเองอัตโนมัติเมื่อครบ 100 ร้าน:</strong> ระบบนับจำนวนและตัดการทำงานอัตโนมัติทันทีเมื่อโพสต์ครบเป้าหมาย
            </div>
          </div>
        </div>
      </div>

      <!-- Directory of 100 Spots -->
      <div class="ig-card">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-bottom:1.25rem;">
          <div>
            <div class="ig-card-title" style="margin-bottom:0.25rem;">
              <span>🍽️ รายชื่อร้านค้าในแคมเปญ 100 ร้าน (ครอบคลุมในและรอบ มจธ.)</span>
            </div>
            <p style="font-size:0.85rem; color:var(--text-muted); margin:0;">
              แสดง ${filteredSpots.length} จากทั้งหมด 100 ร้านค้า
            </p>
          </div>

          <!-- Status Filter -->
          <div style="display:flex; gap:0.5rem;">
            <button
              class="btn btn-sm ${selectedStatus === "ALL" ? "btn-primary" : "btn-outline"}"
              style="border-radius:10px; font-size:0.8rem; font-weight:700;"
              onclick="window.igSetCampaignFilterStatus('ALL')"
            >
              ทั้งหมด (100)
            </button>
            <button
              class="btn btn-sm ${selectedStatus === "posted" ? "btn-primary" : "btn-outline"}"
              style="border-radius:10px; font-size:0.8rem; font-weight:700;"
              onclick="window.igSetCampaignFilterStatus('posted')"
            >
              ✅ โพสต์แล้ว (${completedCount})
            </button>
            <button
              class="btn btn-sm ${selectedStatus === "queued" ? "btn-primary" : "btn-outline"}"
              style="border-radius:10px; font-size:0.8rem; font-weight:700;"
              onclick="window.igSetCampaignFilterStatus('queued')"
            >
              ⏳ ในคิว (${targetCount - completedCount})
            </button>
          </div>
        </div>

        <!-- Zone Filters -->
        <div style="display:flex; gap:0.5rem; overflow-x:auto; padding-bottom:0.75rem; margin-bottom:1.25rem;">
          ${zoneFilters.map((zf) => `
            <button
              class="btn btn-sm ${selectedZone === zf.id ? "btn-primary" : "btn-cream"}"
              style="border-radius:999px; font-size:0.78rem; font-weight:700; white-space:nowrap;"
              onclick="window.igSetCampaignFilterZone('${zf.id}')"
            >
              ${zf.label}
            </button>
          `).join("")}
        </div>

        <!-- Spots Grid / List -->
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:1rem;">
          ${filteredSpots.map((spot) => {
            const isPosted = spot.posted;
            const spotNum = String(spot.index + 1).padStart(2, "0");
            return `
              <div style="border:1.5px solid ${isPosted ? "#86EFAC" : "var(--border)"}; background:${isPosted ? "#F0FDF4" : "#FFFFFF"}; border-radius:14px; padding:1rem; display:flex; gap:0.85rem; align-items:center; transition:all 0.2s ease;">
                <div style="position:relative; width:68px; height:68px; border-radius:12px; overflow:hidden; flex-shrink:0; background:#F1F5F9;">
                  <img src="${spot.image}" alt="${spot.name}" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80'" />
                  <span style="position:absolute; top:4px; left:4px; background:rgba(0,0,0,0.7); color:#FFFFFF; font-size:0.65rem; font-weight:800; padding:1px 5px; border-radius:4px;">
                    #${spotNum}
                  </span>
                </div>

                <div style="flex:1; min-width:0;">
                  <div style="display:flex; align-items:center; justify-content:space-between; gap:0.5rem; margin-bottom:0.2rem;">
                    <span style="font-size:0.72rem; font-weight:700; padding:0.15rem 0.45rem; border-radius:6px; background:${isPosted ? "#DCFCE7" : "#F1F5F9"}; color:${isPosted ? "#15803D" : "#475569"};">
                      ${spot.zone}
                    </span>
                    <span style="font-size:0.72rem; font-weight:800; padding:0.15rem 0.45rem; border-radius:6px; background:#FEF08A; color:#854D0E;">
                      ${spot.price}
                    </span>
                  </div>

                  <h4 style="font-size:0.92rem; font-weight:700; color:var(--text-main); margin-bottom:0.15rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                    ${spot.name}
                  </h4>

                  <p style="font-size:0.8rem; color:#64748B; margin-bottom:0.4rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                    🍽️ ${spot.dish}
                  </p>

                  <div style="display:flex; align-items:center; justify-content:space-between;">
                    <span style="font-size:0.72rem; color:#94A3B8;">📍 ${spot.location}</span>
                    <span style="font-size:0.72rem; font-weight:700; color:${isPosted ? "#15803D" : "#94A3B8"};">
                      ${isPosted ? "✅ โพสต์สำเร็จ" : "⏳ ในคิว"}
                    </span>
                  </div>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    </div>
  `;
}

function renderIgHistoryTab() {
  const ig = state.igStudio;
  const history = ig.history || [];

  return `
    <div class="ig-card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
        <div class="ig-card-title" style="margin-bottom:0;">
          <span>📋 ประวัติการโพสต์ย้อนหลัง (${history.length} รายการ)</span>
        </div>
        <button
          class="btn btn-sm btn-outline"
          style="border-radius:10px; font-weight:600;"
          onclick="window.igRefreshHistory()"
        >
          🔄 รีเฟรชรายการ
        </button>
      </div>

      ${history.length === 0 ? `
        <div style="text-align:center; padding:3rem 1rem; color:var(--text-muted);">
          <div style="font-size:2.5rem; margin-bottom:0.5rem;">📭</div>
          <div style="font-weight:600; font-size:1.1rem; color:var(--text-main);">ยังไม่มีประวัติการโพสต์</div>
          <div style="font-size:0.88rem; margin-top:0.35rem;">ทดลองสร้างและโพสต์ภาพแรกได้ที่แท็บ "สตูดิโอสร้างโพสต์"</div>
          <button class="btn btn-primary btn-sm" style="margin-top:1rem; border-radius:10px;" onclick="window.igSetTab('studio')">
            ไปที่สตูดิโอสร้างโพสต์ →
          </button>
        </div>
      ` : `
        <div style="display:flex; flex-direction:column; gap:1rem;">
          ${history.map((post) => {
            const isLive = post.status === "published";
            const dateStr = new Date(post.timestamp).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
            return `
              <div style="display:flex; gap:1.25rem; padding:1.25rem; border:1.5px solid var(--border); border-radius:16px; background:#FFFFFF; align-items:flex-start; flex-wrap:wrap;">
                <img
                  src="${post.posterUrl}"
                  alt="${post.title}"
                  style="width:90px; height:112px; object-fit:cover; border-radius:10px; border:1px solid #E2E8F0; flex-shrink:0;"
                />
                <div style="flex:1; min-width:240px;">
                  <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.35rem; flex-wrap:wrap;">
                    <span style="font-size:0.75rem; font-weight:700; padding:0.2rem 0.55rem; border-radius:6px; background:${isLive ? "#DCFCE7" : "#EFF6FF"}; color:${isLive ? "#166534" : "#1D4ED8"};">
                      ${isLive ? "✅ เผยแพร่แล้ว (LIVE)" : "🧪 จำลอง (SIMULATED)"}
                    </span>
                    <span style="font-size:0.78rem; color:var(--text-muted);">🕒 ${dateStr}</span>
                  </div>

                  <h3 style="font-size:1.05rem; font-weight:700; color:var(--text-main); margin-bottom:0.4rem;">
                    ${post.title || "โพสต์โปรโมท มจธ."}
                  </h3>

                  <p style="font-size:0.85rem; color:#475569; max-height:4.2em; overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; margin-bottom:0.75rem;">
                    ${post.caption || ""}
                  </p>

                  <div style="display:flex; gap:0.75rem; align-items:center; flex-wrap:wrap;">
                    ${post.permalink ? `
                      <a href="${post.permalink}" target="_blank" class="btn btn-sm btn-outline" style="border-radius:8px; font-size:0.78rem; font-weight:600; text-decoration:none;">
                        🔗 เปิดดูบน Instagram ↗
                      </a>
                    ` : ""}
                    <a href="${post.posterUrl}" download="kmutt-poster.png" class="btn btn-sm btn-cream" style="border-radius:8px; font-size:0.78rem; font-weight:600; text-decoration:none;">
                      📥 ดาวน์โหลดภาพ
                    </a>
                  </div>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      `}
    </div>
  `;
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
  a.download = `kmutt-poster-${Date.now()}.png`;
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
        : `🎉 เผยแพร่โพสต์ลง Instagram สำเร็จแล้ว! (${data.publishResult?.id || ""})`;
      
      // Update history
      const histRes = await fetch("/api/instagram/posts");
      if (histRes.ok) {
        const histData = await histRes.json();
        ig.history = histData.posts || [];
      }
    } else {
      alert(`ไม่สามารถเผยแพร่ได้: ${data.error || "เกิดข้อผิดพลาดในการเชื่อมต่อ"}`);
    }
  } catch (err) {
    alert(`เกิดข้อผิดพลาด: ${err.message}`);
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
    alert(`บันทึกไม่สำเร็จ: ${err.message}`);
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
    alert(`บันทึกไม่สำเร็จ: ${err.message}`);
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
      alert(`✅ เชื่อมต่อ Instagram สำเร็จ!\nชื่อบัญชี: @${data.account.username}\nผู้ติดตาม: ${data.account.followersCount} คน\nจำนวนโพสต์: ${data.account.mediaCount} โพสต์`);
    } else {
      alert(`❌ การเชื่อมต่อล้มเหลว:\n${data.error || "ไม่สามารถติดต่อ Instagram API ได้"}`);
    }
  } catch (err) {
    alert(`เกิดข้อผิดพลาดในการทดสอบ: ${err.message}`);
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


function renderFooter() {
  return `
    <footer class="site-footer">
      <div class="container">
        <div class="footer-grid">
          <div>
            <div style="display:flex; align-items:center; gap:0.65rem; margin-bottom:0.75rem;">
              <div class="brand-mark" style="background:#FA4616; border-radius:10px; width:38px; height:38px; display:flex; align-items:center; justify-content:center;">
                <svg width="22" height="22" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 6L11 14.5V33.5L24 42L37 33.5V14.5L24 6Z" stroke="#FFFFFF" stroke-width="2.5" stroke-linejoin="round" fill="#D8380A"/>
                  <circle cx="24" cy="24" r="6" fill="#FFC72C"/>
                </svg>
              </div>
              <div>
                <div style="font-weight:700; font-size:1.05rem; color:#ffffff;">KMUTT MARKET</div>
                <div style="font-size:0.76rem; color:#a1a1aa;">ตลาดนัดและร้านค้าภายใน มจธ. บางมด</div>
              </div>
            </div>
            <p style="font-size:0.85rem; color:#a1a1aa; max-width:380px;">
              "หิวเมื่อไหร่ คิดถึงตลาด มจธ." — แพลตฟอร์มค้นหาร้านอาหาร โรงอาหาร S14 คาเฟ่ประจำตึก และตลาดนัด มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี
            </p>
          </div>

          <div>
            <div style="font-weight:700; margin-bottom:0.65rem; color:#ffffff;">เมนูหลัก</div>
            <ul class="footer-links">
              <li><a href="/shops" onclick="event.preventDefault(); window.appNavigate('/shops')">ร้านค้าทั้งหมด</a></li>
              <li><a href="/products" onclick="event.preventDefault(); window.appNavigate('/products')">เมนูอาหารและราคา</a></li>
              <li><a href="/categories" onclick="event.preventDefault(); window.appNavigate('/categories')">หมวดหมู่สินค้า</a></li>
              <li><a href="/market/map" onclick="event.preventDefault(); window.appNavigate('/market/map')">แผนที่และผังล็อก S2</a></li>
              <li><a href="/market/schedule" onclick="event.preventDefault(); window.appNavigate('/market/schedule')">ตารางตลาดนัด</a></li>
            </ul>
          </div>

          <div>
            <div style="font-weight:700; margin-bottom:0.65rem; color:#ffffff;">บริการนักศึกษา & ผู้มาติดต่อ</div>
            <ul class="footer-links">
              <li><a href="/favorites" onclick="event.preventDefault(); window.appNavigate('/favorites')">ร้านโปรดของฉัน</a></li>
              <li><a href="#" onclick="event.preventDefault(); window.appOpenCravingModal()">🎲 วันนี้กินอะไรดี? (สุ่มเมนู)</a></li>
              <li><a href="/categories" onclick="event.preventDefault(); window.appNavigate('/categories')">สำรวจตามประเภทอาหาร</a></li>
              <li><a href="/market/map" onclick="event.preventDefault(); window.appNavigate('/market/map')">พิกัดโรงอาหาร S14 & คาเฟ่</a></li>
            </ul>
          </div>

          <div>
            <div style="font-weight:700; margin-bottom:0.65rem; color:#ffffff;">ลิงก์หน่วยงาน มจธ.</div>
            <ul class="footer-links">
              <li><a href="https://www.kmutt.ac.th" target="_blank" rel="noreferrer">เว็บไซต์หลัก มจธ. (KMUTT) ↗</a></li>
              <li><a href="https://join.kmutt.ac.th" target="_blank" rel="noreferrer">รับสมัครนักศึกษา (JOIN KMUTT) ↗</a></li>
              <li><a href="https://bpuu.kmutt.ac.th" target="_blank" rel="noreferrer">สำนักงานจัดการทรัพย์สิน (BPUU) ↗</a></li>
              <li><a href="/about" onclick="event.preventDefault(); window.appNavigate('/about')">เกี่ยวกับโครงการ & ติดต่อเรา</a></li>
            </ul>
          </div>
        </div>

        <div style="border-top:1px solid rgba(255,255,255,0.1); padding-top:1.25rem; display:flex; flex-wrap:wrap; justify-content:space-between; font-size:0.82rem; color:#a1a1aa;">
          <span>© 2026 KMUTT MARKET – มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี (บางมด)</span>
          <span>ข้อมูลเพื่อนักศึกษา บุคลากร และผู้มาเยือน มจธ. ทุกท่าน</span>
        </div>
      </div>
    </footer>
  `;
}

function renderMainView() {
  const p =
    (state.route || "/")
      .replace(/\/index\.html$/, "")
      .replace(/^\/public/, "")
      .replace(/\/+$/, "") || "/";
  if (p === "/" || p === "") return renderHomePage();
  if (p === "/shops") return renderShopsDirectoryPage();
  if (p.startsWith("/shops/")) return renderShopDetailPage(decodeURIComponent(p.replace("/shops/", "")));
  if (p === "/products") return renderProductsDirectoryPage();
  if (p.startsWith("/products/")) return renderProductDetailPage(decodeURIComponent(p.replace("/products/", "")));
  if (p === "/categories") return renderCategoriesPage();
  if (p === "/market/map") return renderMarketMapPage();
  if (p === "/market/schedule" || p === "/market") return renderMarketSchedulePage();
  if (p === "/favorites") return renderFavoritesPage();
  if (p === "/about" || p === "/contact") return renderAboutAndContactPage();
  if (p === "/instagram" || p === "/admin/instagram" || p === "/marketing") return renderInstagramAutomationPage();
  return renderHomePage();
}

function renderMobileBottomNav() {
  const p =
    (state.route || "/")
      .replace(/\/index\.html$/, "")
      .replace(/^\/public/, "")
      .replace(/\/+$/, "") || "/";

  const isHome = p === "/" || p === "";
  const isShops = p.startsWith("/shops");
  const isProducts = p.startsWith("/products");
  const isMap = p.startsWith("/market/map");
  const isFav = p === "/favorites";

  return `
    <nav class="mobile-bottom-nav" aria-label="เมนูหลักบนมือถือ">
      <button class="bottom-tab-item ${isHome ? "active" : ""}" onclick="window.appNavigate('/')">
        <span class="tab-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </span>
        <span class="tab-label">หน้าแรก</span>
      </button>
      <button class="bottom-tab-item ${isShops ? "active" : ""}" onclick="window.appNavigate('/shops')">
        <span class="tab-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"></path>
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
            <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"></path>
            <path d="M2 7h20"></path>
          </svg>
        </span>
        <span class="tab-label">ร้านค้า</span>
      </button>
      <button class="bottom-tab-item ${isProducts ? "active" : ""}" onclick="window.appNavigate('/products')">
        <span class="tab-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2"></path>
            <path d="M15 2v18"></path>
            <path d="M9 2v4a2 2 0 0 1-2 2H4"></path>
            <path d="M6 2v18"></path>
          </svg>
        </span>
        <span class="tab-label">เมนูเด็ด</span>
      </button>
      <button class="bottom-tab-item ${isMap ? "active" : ""}" onclick="window.appNavigate('/market/map')">
        <span class="tab-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon>
            <line x1="9" y1="3" x2="9" y2="18"></line>
            <line x1="15" y1="6" x2="15" y2="21"></line>
          </svg>
        </span>
        <span class="tab-label">แผนที่</span>
      </button>
      <button class="bottom-tab-item ${isFav ? "active" : ""}" onclick="window.appNavigate('/favorites')">
        <span class="tab-icon tab-icon-badge">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="${isFav ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
          </svg>
          ${state.favorites.length ? `<span class="tab-badge">${state.favorites.length}</span>` : ""}
        </span>
        <span class="tab-label">ร้านโปรด</span>
      </button>
    </nav>
  `;
}

function renderMobileDrawer() {
  if (!state.mobileMenuOpen) return "";
  const p =
    (state.route || "/")
      .replace(/\/index\.html$/, "")
      .replace(/^\/public/, "")
      .replace(/\/+$/, "") || "/";

  return `
    <div class="mobile-drawer-backdrop" onclick="window.appToggleMobileMenu()">
      <div class="mobile-drawer-card" onclick="event.stopPropagation()">
        <div class="mobile-drawer-header">
          <div style="display:flex; align-items:center; gap:0.65rem;">
            <div class="brand-mark" style="background:#FA4616; width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center;">
              <svg width="22" height="22" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 6L11 14.5V33.5L24 42L37 33.5V14.5L24 6Z" stroke="#FFFFFF" stroke-width="2.5" stroke-linejoin="round" fill="#D8380A"/>
                <circle cx="24" cy="24" r="6" fill="#FFC72C"/>
              </svg>
            </div>
            <div>
              <div style="font-weight:700; font-size:1.02rem; color:var(--text-main);">KMUTT MARKET</div>
              <div style="font-size:0.72rem; color:var(--kmutt-dark-orange); font-weight:600;">เมนูนำทางตลาด มจธ.</div>
            </div>
          </div>
          <button class="btn btn-sm btn-outline" onclick="window.appToggleMobileMenu()" style="border-radius:999px; width:32px; height:32px; padding:0; display:flex; align-items:center; justify-content:center;">✕</button>
        </div>

        <div class="mobile-drawer-body">
          <div class="mobile-drawer-nav">
            <a class="drawer-nav-item ${p === "/" ? "active" : ""}" onclick="window.appNavigate('/')">
              <span>🏠 หน้าแรก</span>
              <span>→</span>
            </a>
            <a class="drawer-nav-item ${p.startsWith("/shops") ? "active" : ""}" onclick="window.appNavigate('/shops')">
              <span>🍜 ร้านค้าทั้งหมด (${state.db?.shops?.length || 22} ร้าน)</span>
              <span>→</span>
            </a>
            <a class="drawer-nav-item ${p.startsWith("/products") ? "active" : ""}" onclick="window.appNavigate('/products')">
              <span>📋 เมนูอาหารและราคา</span>
              <span>→</span>
            </a>
            <a class="drawer-nav-item ${p.startsWith("/categories") ? "active" : ""}" onclick="window.appNavigate('/categories')">
              <span>🍱 หมวดหมู่สินค้า</span>
              <span>→</span>
            </a>
            <a class="drawer-nav-item ${p.startsWith("/market/map") ? "active" : ""}" onclick="window.appNavigate('/market/map')">
              <span>🗺️ แผนที่อาคาร S14, S2, S11, N10</span>
              <span>→</span>
            </a>
            <a class="drawer-nav-item ${p.startsWith("/market/schedule") ? "active" : ""}" onclick="window.appNavigate('/market/schedule')">
              <span>📅 ตารางวันจัดตลาดนัด มจธ.</span>
              <span>→</span>
            </a>
            <a class="drawer-nav-item ${p === "/favorites" ? "active" : ""}" onclick="window.appNavigate('/favorites')">
              <span>♥ ร้านโปรดที่บันทึกไว้ (${state.favorites.length})</span>
              <span>→</span>
            </a>
            <a class="drawer-nav-item ${p === "/about" ? "active" : ""}" onclick="window.appNavigate('/about')">
              <span>🏛️ เกี่ยวกับโครงการ & ติดต่อ BPUU</span>
              <span>→</span>
            </a>
            <a class="drawer-nav-item ${p.startsWith("/instagram") ? "active" : ""}" style="color:var(--kmutt-orange); font-weight:700;" onclick="window.appNavigate('/instagram')">
              <span>📸 IG Automation (สร้างโพสต์และโปรโมท)</span>
              <span>→</span>
            </a>
          </div>

          <div style="margin-top:1.1rem; padding:0.9rem; background:var(--kmutt-light-orange); border-radius:12px; border:1px solid var(--kmutt-warm-border);">
            <div style="font-weight:700; font-size:0.9rem; color:var(--kmutt-dark-orange); margin-bottom:0.2rem;">🎲 คิดไม่ออกว่าจะกินอะไร?</div>
            <p style="font-size:0.78rem; color:var(--text-muted); margin-bottom:0.65rem;">ให้ระบบสุ่มเมนูเด็ดตามงบและตึกเรียนของคุณ</p>
            <button class="btn btn-primary" style="width:100%; font-size:0.82rem;" onclick="window.appToggleMobileMenu(); window.appOpenCravingModal();">
              🎲 สุ่มเมนูอาหารให้หน่อย!
            </button>
          </div>

          <div style="margin-top:auto; padding-top:1rem; font-size:0.78rem; color:var(--text-muted); border-top:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
            <span>สำนักงานจัดการทรัพย์สิน BPUU</span>
            <a href="tel:024708065" style="color:var(--kmutt-dark-orange); font-weight:600;">📞 02-470-8065</a>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderApp() {
  const root = document.getElementById("app-root");
  if (!root || !state.db) return;

  root.innerHTML = `
    ${renderTopHeader()}
    <main style="flex:1;">
      ${renderMainView()}
    </main>
    ${renderFooter()}
    ${renderMobileBottomNav()}
    ${renderMobileDrawer()}
    ${renderCravingModal()}
  `;

  if (state.route === "/market/map" && state.mapMode === "gps") {
    setTimeout(initLeafletMapIfNeeded, 60);
  }
}

// Expose Interactive Handlers on window
window.appNavigate = navigate;
window.appToggleFav = toggleFavorite;
window.appToggleMobileMenu = () => {
  state.mobileMenuOpen = !state.mobileMenuOpen;
  renderApp();
};
window.appToggleFilterPanel = () => {
  state.filterPanelExpanded = !state.filterPanelExpanded;
  renderApp();
};
window.appOpenCravingModal = () => {
  state.cravingModalOpen = true;
  if (!state.cravingPick) pickRandomCraving();
  else renderApp();
};
window.appCloseCravingModal = () => {
  state.cravingModalOpen = false;
  renderApp();
};
window.appSetCravingFilter = (key, val) => {
  if (key === "zone") state.cravingZone = val;
  if (key === "budget") state.cravingBudget = Number(val);
  pickRandomCraving();
};
window.appPickRandomCraving = pickRandomCraving;

window.appSubmitHeroSearch = (customInputId) => {
  const input = (customInputId && document.getElementById(customInputId)) ||
                document.getElementById("mobile-search-input") ||
                document.getElementById("hero-search-input");
  state.shopFilters.q = input ? input.value.trim() : "";
  navigate("/shops");
};

window.appQuickFilterZone = (zone) => {
  state.shopFilters = {
    q: "",
    category: "ALL",
    zone: "ALL",
    type: "ALL",
    day: "ALL",
    status: "ALL",
    verifiedOnly: false,
    sort: "recommended",
  };
  if (zone === "CAFES") {
    state.shopFilters.type = "cafe";
  } else if (zone === "S2") {
    state.shopFilters.zone = "S2";
    state.shopFilters.type = "market_stall";
  } else {
    state.shopFilters.zone = zone;
  }
  if (state.route === "/shops") {
    renderApp();
  } else {
    navigate("/shops");
  }
};

window.appFilterS2Market = () => {
  if (state.shopFilters.type === "market_stall") {
    window.appResetShopFilters();
  } else {
    state.shopFilters = {
      q: "",
      category: "ALL",
      zone: "S2",
      type: "market_stall",
      day: "ALL",
      status: "ALL",
      verifiedOnly: false,
      sort: "recommended",
    };
    if (state.route === "/shops") {
      renderApp();
    } else {
      navigate("/shops");
    }
  }
};

window.appQuickSearch = (keyword) => {
  window.appResetShopFilters();
  state.shopFilters.q = keyword;
  navigate("/shops");
};

window.appFilterByCategory = (catId) => {
  window.appResetShopFilters();
  state.shopFilters.category = catId;
  navigate("/shops");
};

window.appUpdateShopFilter = (key, val) => {
  state.shopFilters[key] = val;
  renderApp();
};

window.appResetShopFilters = () => {
  state.shopFilters = {
    q: "",
    category: "ALL",
    zone: "ALL",
    type: "ALL",
    day: "ALL",
    status: "ALL",
    verifiedOnly: false,
    sort: "recommended",
  };
  renderApp();
};

window.appToggleProductFilterPanel = () => {
  state.productFilterPanelExpanded = !state.productFilterPanelExpanded;
  renderApp();
};

window.appResetProductFilters = () => {
  state.productFilters = {
    q: "",
    category: "ALL",
    maxPrice: "ALL",
    sort: "recommended",
  };
  renderApp();
};

window.appUpdateProductFilter = (key, val) => {
  state.productFilters[key] = val;
  renderApp();
};

window.appSetMapMode = (mode) => {
  state.mapMode = mode;
  renderApp();
};

window.appSetMapZone = (zone) => {
  state.selectedMapZone = zone;
  renderApp();
};

window.appSelectStall = (code) => {
  state.selectedStallCode = code;
  renderApp();
};

window.appFocusShopMarker = (shopId) => {
  const shop = state.db.shops.find((s) => s.id === shopId);
  if (shop && state.leafletMap && shop.latitude && shop.longitude) {
    state.leafletMap.setView([shop.latitude, shop.longitude], 18);
  }
};

// Boot Application Synchronously if SSR DB injected, then keep synced
if (window.__INITIAL_DB__) {
  state.db = normalizeDb(window.__INITIAL_DB__);
  renderApp();
} else {
  fetchDatabase();
}


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
      alert(`เข้าสู่ระบบไม่สำเร็จ: ${data.error || "โปรดตรวจสอบ Username และ Password"}`);
    }
  } catch (err) {
    alert(`เกิดข้อผิดพลาดในการเชื่อมต่อ: ${err.message}`);
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
    const goToSettings = confirm("ยังไม่ได้ตั้งค่า Username/Password ของ Instagram!\nคุณต้องการไปที่หน้าตั้งค่าเพื่อกรอก Username & Password ตอนนี้เลยหรือไม่?");
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
      alert(`โพสต์ไม่สำเร็จ: ${data.error || "เกิดข้อผิดพลาดในการเปิดเบราว์เซอร์"}`);
    }
  } catch (err) {
    alert(`เกิดข้อผิดพลาด: ${err.message}`);
  } finally {
    ig.isPublishing = false;
    renderApp();
  }
};

// --- Handlers for 100-Post Campaign ---
window.igSetCampaignFilterZone = (zone) => {
  state.igStudio.campaignFilterZone = zone;
  renderApp();
};

window.igSetCampaignFilterStatus = (status) => {
  state.igStudio.campaignFilterStatus = status;
  renderApp();
};

window.igSetCampaignInterval = (val) => {
  state.igStudio.campaignIntervalMinutes = Number(val);
};

window.igRefreshCampaign = async () => {
  try {
    const res = await fetch("/api/instagram/campaign");
    if (res.ok) {
      const data = await res.json();
      state.igStudio.campaign = data.campaign || null;
      state.igStudio.campaignSpots = data.spots || [];
      renderApp();
    }
  } catch (e) {
    console.error("Failed to refresh campaign:", e);
  }
};

window.igStartCampaign = async () => {
  const ig = state.igStudio;
  const intervalMinutes = ig.campaignIntervalMinutes || 5;

  const confirmed = confirm(
    `🚀 ยืนยันการเริ่มแคมเปญโพสต์อัตโนมัติ 100 ร้าน?\n\n` +
    `• ความถี่: ทุกๆ ${intervalMinutes} นาที (เพื่อความปลอดภัย ไม่โดน IG บล็อก)\n` +
    `• สไตล์: ปันโปร (@punpromotion) รูปอาหารจริง + ป้ายเหลือง + แคปชั่นบล็อกเกอร์\n` +
    `• หยุดอัตโนมัติ: เมื่อครบ 100 ร้านแล้วระบบจะหยุดทันที\n\n` +
    `กด OK เพื่อเริ่มการทำงานทันที`
  );

  if (!confirmed) return;

  try {
    const res = await fetch("/api/instagram/campaign/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intervalMinutes }),
    });
    const data = await res.json();
    if (res.ok && data.ok) {
      ig.statusMessage = `🚀 แคมเปญโพสต์อัตโนมัติ 100 ร้านเริ่มทำงานแล้ว! กำลังโพสต์ร้านแรกและจะโพสต์ต่อเนื่องทุกๆ ${intervalMinutes} นาที`;
      await window.igRefreshCampaign();
    } else {
      alert(`ไม่สามารถเริ่มแคมเปญได้: ${data.error || "เกิดข้อผิดพลาด"}`);
    }
  } catch (err) {
    alert(`ข้อผิดพลาด: ${err.message}`);
  }
};

window.igPauseCampaign = async () => {
  try {
    const res = await fetch("/api/instagram/campaign/pause", { method: "POST" });
    const data = await res.json();
    if (res.ok && data.ok) {
      state.igStudio.statusMessage = "⏸️ หยุดการทำงานของแคมเปญชั่วคราวแล้ว";
      await window.igRefreshCampaign();
    }
  } catch (err) {
    alert(`ข้อผิดพลาด: ${err.message}`);
  }
};

window.igPostNextCampaign = async () => {
  const confirmed = confirm("⚡ ยืนยันการโพสต์ร้านถัดไปในคิวทันทีหรือไม่?");
  if (!confirmed) return;

  state.igStudio.statusMessage = "⏳ กำลังสร้างโปสเตอร์สไตล์ปันโปรและโพสต์ขึ้น Instagram กรุณารอสักครู่...";
  renderApp();

  try {
    const res = await fetch("/api/instagram/campaign/post-next", { method: "POST" });
    const data = await res.json();
    if (res.ok && data.ok) {
      state.igStudio.statusMessage = `🎉 โพสต์ร้านถัดไปสำเร็จเรียบร้อย! (ความคืบหน้า: ${data.postResult?.progress || ""})`;
      await window.igRefreshCampaign();
      // refresh post history
      const histRes = await fetch("/api/instagram/posts");
      if (histRes.ok) {
        const histData = await histRes.json();
        state.igStudio.history = histData.posts || [];
      }
      renderApp();
    } else {
      alert(`ไม่สามารถโพสต์ได้: ${data.error || "เกิดข้อผิดพลาด"}`);
    }
  } catch (err) {
    alert(`ข้อผิดพลาด: ${err.message}`);
  }
};

window.igResetCampaign = async () => {
  const confirmed = confirm("⚠️ ยืนยันการรีเซ็ตแคมเปญกลับเป็น 0 หรือไม่?\n(ประวัติและตัวนับจะเริ่มใหม่ตั้งแต่ร้านที่ 1)");
  if (!confirmed) return;

  try {
    const res = await fetch("/api/instagram/campaign/reset", { method: "POST" });
    const data = await res.json();
    if (res.ok && data.ok) {
      state.igStudio.statusMessage = "🔄 รีเซ็ตแคมเปญ 100 ร้านกลับเป็น 0 เรียบร้อยแล้ว";
      await window.igRefreshCampaign();
    }
  } catch (err) {
    alert(`ข้อผิดพลาด: ${err.message}`);
  }
};
