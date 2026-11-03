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
  mapMode: "gps", // gps | stalls
  selectedMapZone: "ALL",
  selectedStallCode: "A-01",
  leafletMap: null,
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
  const res = await fetch("/api/market-data");
  const raw = await res.json();
  state.db = normalizeDb(raw);
  renderApp();
}

async function persistDatabase(logAction, logSummary) {
  if (logAction && state.db) {
    state.db.activity_logs.unshift({
      id: `log-${Date.now()}`,
      actor_name:
        state.role === "admin"
          ? "ผู้ดูแลระบบ BPUU"
          : state.role === "vendor"
          ? "ผู้ประกอบการร้านค้า"
          : "นักศึกษา มจธ.",
      actor_role: state.role.toUpperCase(),
      action_type: logAction,
      target_summary: logSummary,
      created_at: new Date().toISOString(),
    });
  }
  await fetch("/api/market-data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state: state.db }),
  });
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
        <div style="display:flex; align-items:center; gap:0.55rem; flex-wrap:wrap;">
          <span class="pulse-dot"></span>
          <span><strong>สถานะตลาด มจธ. (${bkk.dayNameTh} ${bkk.timeStr} น.):</strong> เปิดให้บริการวันนี้ <strong class="tabular-nums">${openCount}</strong> ร้าน • ตลาดนัด อังคาร–พฤหัสบดี 07:00–17:00 น.</span>
        </div>
        <div style="display:flex; align-items:center; gap:0.85rem; flex-wrap:wrap;">
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
            <svg width="28" height="28" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
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

        <nav class="nav-links ${state.mobileMenuOpen ? "mobile-open" : ""}">
          <a class="nav-link ${p === "/" ? "active" : ""}" onclick="window.appNavigate('/')">หน้าแรก</a>
          <a class="nav-link ${p.startsWith("/shops") ? "active" : ""}" onclick="window.appNavigate('/shops')">ร้านค้าทั้งหมด</a>
          <a class="nav-link ${p.startsWith("/products") ? "active" : ""}" onclick="window.appNavigate('/products')">เมนูอาหาร</a>
          <a class="nav-link ${p.startsWith("/categories") ? "active" : ""}" onclick="window.appNavigate('/categories')">หมวดหมู่</a>
          <a class="nav-link ${p === "/market/map" ? "active" : ""}" onclick="window.appNavigate('/market/map')">แผนที่ตลาด</a>
          <a class="nav-link ${p === "/market/schedule" || p === "/market" ? "active" : ""}" onclick="window.appNavigate('/market/schedule')">ตารางตลาด</a>
          <a class="nav-link ${p === "/about" ? "active" : ""}" onclick="window.appNavigate('/about')">เกี่ยวกับเรา</a>
        </nav>

        <div class="nav-actions">
          <button class="btn btn-sm btn-cream" onclick="window.appOpenCravingModal()" title="สุ่มเมนูเด็ดใน มจธ.">
            🎲 วันนี้กินอะไรดี?
          </button>
          <button class="btn btn-sm btn-outline" onclick="window.appNavigate('/favorites')">
            ♥ ร้านโปรด (<span class="tabular-nums">${state.favorites.length}</span>)
          </button>
          <button class="btn btn-sm btn-outline mobile-menu-btn" onclick="window.appToggleMobileMenu()">
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

          <form class="hero-search-box" onsubmit="event.preventDefault(); window.appSubmitHeroSearch();">
            <span style="padding-left:0.6rem; color:var(--text-muted);">🔍</span>
            <input
              id="hero-search-input"
              class="hero-search-input"
              type="text"
              placeholder="ค้นหาร้านอาหาร เมนู หรือสินค้า..."
              value="${state.shopFilters.q}"
            />
            <button type="submit" class="btn btn-primary">ค้นหาเลย</button>
          </form>

          <div class="quick-tags">
            <span style="font-size:0.78rem; color:var(--text-muted); font-weight:600;">คำค้นยอดฮิต:</span>
            <button class="quick-tag" onclick="window.appQuickSearch('ข้าวมันไก่')">🍗 ข้าวมันไก่ S14</button>
            <button class="quick-tag" onclick="window.appQuickSearch('ฮาลาล')">🕌 อาหารฮาลาล</button>
            <button class="quick-tag" onclick="window.appQuickSearch('ลุงกบ')">☕ ลุงกบ Uncle Frog</button>
            <button class="quick-tag" onclick="window.appQuickSearch('บะหมี่เกี๊ยว')">🍜 บะหมี่เกี๊ยว</button>
            <button class="quick-tag" onclick="window.appNavigate('/shops')">🏪 ดูร้านค้าทั้งหมด (${approvedShops.length})</button>
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
    if (f.category !== "ALL" && shop.category_id !== f.category) return false;
    if (f.zone !== "ALL" && !shop.building_zone.includes(f.zone)) return false;
    if (f.type !== "ALL" && shop.shop_type !== f.type) return false;
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

        <div class="filter-panel">
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
          <button class="btn btn-cream btn-sm" onclick="window.appOpenCravingModal()">🎲 สุ่มเมนูตามงบ</button>
        </div>

        <div class="filter-panel">
          <div class="filter-grid" style="grid-template-columns:2fr 1fr 1fr 1fr;">
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
  const p = state.route;
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
  return renderHomePage();
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

window.appSubmitHeroSearch = () => {
  const input = document.getElementById("hero-search-input");
  state.shopFilters.q = input ? input.value : "";
  navigate("/shops");
};

window.appQuickSearch = (keyword) => {
  state.shopFilters.q = keyword;
  navigate("/shops");
};

window.appFilterByCategory = (catId) => {
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
