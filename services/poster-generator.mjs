import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const PUBLIC_POSTERS_DIR = path.resolve(process.cwd(), "public", "posters");

if (!fs.existsSync(PUBLIC_POSTERS_DIR)) {
  fs.mkdirSync(PUBLIC_POSTERS_DIR, { recursive: true });
}

function escapeXml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function safeXmlText(str = "", maxLen = 100) {
  if (!str) return "";
  let clean = String(str).trim();
  if (clean.length > maxLen) {
    clean = clean.slice(0, maxLen - 1) + "…";
  }
  return escapeXml(clean);
}

function truncateText(str = "", maxLen = 60) {
  if (!str) return "";
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + "…";
}

async function fetchImageBuffer(url) {
  if (!url || typeof url !== "string") return null;

  // Local file or relative URL path
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    const candidates = [
      url,
      path.resolve(process.cwd(), url),
      path.join(process.cwd(), "public", url),
      path.join(process.cwd(), "public", url.replace(/^\//, "")),
      path.resolve(process.cwd(), url.replace(/^\//, "")),
    ];
    for (const cand of candidates) {
      try {
        if (fs.existsSync(cand) && fs.statSync(cand).isFile()) {
          return fs.readFileSync(cand);
        }
      } catch {
        // try next candidate
      }
    }
    return null;
  }

  // Remote HTTP(S) URL
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}

const DEFAULT_FOOD_PHOTOS = [
  "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=1200&q=85",
];

const THEMES = {
  "punpro": {
    name: "ปันโปรชวนชิม (Punpro Lifestyle)",
    bgGradientStart: "#18181B",
    bgGradientEnd: "#09090B",
    primary: "#FFDE00", // Punpro bright yellow
    primaryDark: "#EAB308",
    primaryLight: "#FEF08A",
    accent: "#FA4616",
    cardBg: "#FFFFFF",
    cardText: "#18181B",
    cardSubtext: "#52525B",
    border: "#FFDE00",
    tagBg: "#FEF9C3",
    tagText: "#854D0E",
  },
  "kmutt-orange": {
    name: "KMUTT Bold Orange",
    bgGradientStart: "#1E293B",
    bgGradientEnd: "#0F172A",
    primary: "#FA4616",
    primaryDark: "#C2330B",
    primaryLight: "#FF6B3D",
    accent: "#FFC72C",
    cardBg: "rgba(255, 255, 255, 0.96)",
    cardText: "#0F172A",
    cardSubtext: "#475569",
    border: "#FA4616",
    tagBg: "#FFF1EB",
    tagText: "#C2330B",
  },
  "street-neon": {
    name: "Midnight Street Food",
    bgGradientStart: "#0B0F17",
    bgGradientEnd: "#1A1528",
    primary: "#F59E0B",
    primaryDark: "#D97706",
    primaryLight: "#FBBF24",
    accent: "#EC4899",
    cardBg: "rgba(24, 20, 36, 0.94)",
    cardText: "#F8FAFC",
    cardSubtext: "#94A3B8",
    border: "#F59E0B",
    tagBg: "#372718",
    tagText: "#FBBF24",
  },
  "cafe-pastel": {
    name: "Warm Cafe & Bakery",
    bgGradientStart: "#2E241E",
    bgGradientEnd: "#1C140F",
    primary: "#EA580C",
    primaryDark: "#9A3412",
    primaryLight: "#FDBA74",
    accent: "#FDE047",
    cardBg: "rgba(255, 255, 255, 0.97)",
    cardText: "#291E16",
    cardSubtext: "#6B584C",
    border: "#EA580C",
    tagBg: "#FEF3C7",
    tagText: "#9A3412",
  },
  "market-fest": {
    name: "Market Day Festival",
    bgGradientStart: "#064E3B",
    bgGradientEnd: "#022C22",
    primary: "#FA4616",
    primaryDark: "#047857",
    primaryLight: "#34D399",
    accent: "#FBBF24",
    cardBg: "rgba(255, 255, 255, 0.97)",
    cardText: "#064E3B",
    cardSubtext: "#334155",
    border: "#10B981",
    tagBg: "#ECFDF5",
    tagText: "#047857",
  },
};

/**
 * Generate Authentic Human Campus Review Poster (Clean, realistic, actual storefront & dishes, no fake AI feel)
 */
export async function generatePunproPoster({
  shop,
  product = null,
  customHeadline = "",
}) {
  const shopName = safeXmlText(shop?.name || "ร้านอาหาร มจธ.", 32);
  const buildingName = safeXmlText(shop?.building_name || "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี (บางมด)", 45);
  const locationDesc = shop?.location_description || "โรงอาหาร S14";
  const stallNumber = safeXmlText(shop?.stall_number ? `ล็อก ${shop.stall_number}` : "", 15);
  
  const rawDishName = product?.name || shop?.name || "เมนูแนะนำประจำร้าน";
  const dishNameShort = safeXmlText(rawDishName, 26);
  const dishNameCard = safeXmlText(rawDishName, 22);

  const rawPrice = product?.price || (shop?.price_range ? shop.price_range.replace(/[^0-9]/g, "") : "40");
  const rawDishPrice = rawPrice ? (rawPrice.includes(".-") ? rawPrice : `${rawPrice}.-`) : "40.-";
  const dishPrice = safeXmlText(rawDishPrice, 10);
  
  const tagList = Array.isArray(shop?.tags) && shop.tags.length > 0 
    ? shop.tags.slice(0, 3) 
    : ["เครื่องแน่นให้เยอะ", "อิ่มคุ้มราคานักศึกษา", "ของกิน มจธ."];
  const highlightTag = safeXmlText(tagList[0] || "เครื่องแน่น ให้เยอะ อิ่มจุกๆ", 28);

  let imageUrl = product?.image_url || shop?.cover_image_url || shop?.logo_url;
  if (!imageUrl || !imageUrl.startsWith("http")) {
    imageUrl = "https://bpuu.kmutt.ac.th/wp-content/uploads/2019/07/DSC_4671.jpg";
  }

  let photoBase64 = null;
  try {
    let imgBuffer = await fetchImageBuffer(imageUrl);
    if (!imgBuffer) {
      imgBuffer = await fetchImageBuffer("https://bpuu.kmutt.ac.th/wp-content/uploads/2019/07/DSC_4671.jpg");
    }
    if (imgBuffer) {
      const resized = await sharp(imgBuffer)
        .resize(1080, 1350, { fit: "cover", position: "center" })
        .modulate({ saturation: 1.08, brightness: 1.02 })
        .jpeg({ quality: 92 })
        .toBuffer();
      photoBase64 = `data:image/jpeg;base64,${resized.toString("base64")}`;
    }
  } catch (e) {
    console.warn("Human poster image loading error:", e.message);
  }

  const zoneBadgeText = safeXmlText(
    locationDesc.includes("S14") ? "ของกิน มจธ. • โรงอาหาร S14"
    : locationDesc.includes("S11") ? "ของกิน มจธ. • โรงอาหาร S11"
    : locationDesc.includes("S2") ? "ของกิน มจธ. • ตลาดนัด S2"
    : locationDesc.includes("หน้ามอ") ? "ของกิน มจธ. • โซนหน้ามอ"
    : `ของกิน มจธ. • ${locationDesc}`,
    30
  );

  const svgTemplate = `
<svg width="1080" height="1350" viewBox="0 0 1080 1350" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="topShadow" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0F172A" stop-opacity="0.75"/>
      <stop offset="35%" stop-color="#0F172A" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#0F172A" stop-opacity="0"/>
    </linearGradient>

    <linearGradient id="bottomShadow" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0F172A" stop-opacity="0"/>
      <stop offset="40%" stop-color="#0F172A" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#0F172A" stop-opacity="0.95"/>
    </linearGradient>

    <linearGradient id="badgeYellow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FBBF24"/>
      <stop offset="100%" stop-color="#F59E0B"/>
    </linearGradient>

    <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.35"/>
    </filter>

    <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000000" flood-opacity="0.45"/>
    </filter>
  </defs>

  ${photoBase64 ? `
    <image x="0" y="0" width="1080" height="1350" preserveAspectRatio="xMidYMid slice" href="${photoBase64}"/>
  ` : `
    <rect width="1080" height="1350" fill="#1E293B"/>
  `}

  <rect x="0" y="0" width="1080" height="320" fill="url(#topShadow)"/>
  <rect x="0" y="720" width="1080" height="630" fill="url(#bottomShadow)"/>

  <!-- Top Header Bar: Authentic Campus Verification -->
  <g filter="url(#softShadow)">
    <rect x="50" y="50" width="430" height="60" rx="30" fill="#FFFFFF"/>
    <circle cx="80" cy="80" r="14" fill="#FA4616"/>
    <text x="80" y="86" font-family="'Leelawadee UI', sans-serif" font-size="16" font-weight="900" fill="#FFFFFF" text-anchor="middle">✓</text>
    <text x="110" y="88" font-family="'Leelawadee UI', sans-serif" font-size="22" font-weight="800" fill="#0F172A">
      ${zoneBadgeText}
    </text>

    <rect x="750" y="50" width="280" height="60" rx="30" fill="rgba(15, 23, 42, 0.85)" stroke="#FFFFFF" stroke-width="1.5"/>
    <text x="890" y="87" font-family="'Leelawadee UI', sans-serif" font-size="20" font-weight="700" fill="#FDE047" text-anchor="middle">
      ⭐️ แนะนำโดยเด็กบางมด
    </text>
  </g>

  <!-- Floating Callout Stickers -->
  <g filter="url(#softShadow)">
    <g transform="translate(60, 220)">
      <rect x="0" y="0" width="500" height="74" rx="20" fill="#FFFFFF" stroke="#FA4616" stroke-width="2.5"/>
      <text x="25" y="46" font-family="'Leelawadee UI', sans-serif" font-size="25" font-weight="800" fill="#0F172A">
        🍽️ ${dishNameShort}
      </text>
    </g>

    <g transform="translate(60, 310)">
      <rect x="0" y="0" width="440" height="58" rx="29" fill="#FEF3C7" stroke="#F59E0B" stroke-width="2"/>
      <text x="25" y="37" font-family="'Leelawadee UI', sans-serif" font-size="21" font-weight="800" fill="#92400E">
        ✨ ${highlightTag}
      </text>
    </g>

    <g transform="translate(860, 280) rotate(-6)">
      <rect x="-110" y="-60" width="220" height="120" rx="24" fill="url(#badgeYellow)" stroke="#FFFFFF" stroke-width="4"/>
      <text x="0" y="-18" font-family="'Leelawadee UI', sans-serif" font-size="18" font-weight="800" fill="#78350F" text-anchor="middle">
        ราคาเพียง
      </text>
      <text x="0" y="32" font-family="'Leelawadee UI', sans-serif" font-size="50" font-weight="900" fill="#0F172A" text-anchor="middle">
        ${dishPrice}
      </text>
    </g>
  </g>

  <!-- Bottom Recommendation Card -->
  <g filter="url(#cardShadow)">
    <rect x="50" y="990" width="980" height="310" rx="36" fill="#FFFFFF"/>

    <g transform="translate(90, 1055)">
      <text x="0" y="0" font-family="'Leelawadee UI', sans-serif" font-size="38" font-weight="900" fill="#0F172A">
        ${shopName}
      </text>
      
      ${stallNumber ? `
        <rect x="580" y="-32" width="160" height="42" rx="10" fill="#FFF1EB" stroke="#FA4616" stroke-width="1.5"/>
        <text x="660" y="-5" font-family="'Leelawadee UI', sans-serif" font-size="20" font-weight="800" fill="#FA4616" text-anchor="middle">
          ${stallNumber}
        </text>
      ` : ""}
    </g>

    <g transform="translate(90, 1105)">
      <text x="0" y="0" font-family="'Leelawadee UI', sans-serif" font-size="21" font-weight="700" fill="#334155">
        📍 พิกัด: ${buildingName}
      </text>
      <text x="0" y="34" font-family="'Leelawadee UI', sans-serif" font-size="20" font-weight="500" fill="#64748B">
        ⏰ เปิด: 06:00 - 15:30 น. (มื้อเช้า-เที่ยง) • น้ำซุปฟรีบริการตัวเอง
      </text>
      <text x="0" y="68" font-family="'Leelawadee UI', sans-serif" font-size="19" font-weight="600" fill="#0369A1">
        💡 แนะนำ: ${dishNameCard} รสชาติกลมกล่อม ปรุงสดใหม่ทุกวัน!
      </text>
    </g>

    <line x1="90" y1="1220" x2="990" y2="1220" stroke="#F1F5F9" stroke-width="2"/>
    <g transform="translate(90, 1260)">
      <circle cx="16" cy="0" r="16" fill="#FA4616"/>
      <text x="16" y="6" font-family="'Leelawadee UI', sans-serif" font-size="16" font-weight="900" fill="#FFFFFF" text-anchor="middle">K</text>
      <text x="44" y="6" font-family="'Leelawadee UI', sans-serif" font-size="19" font-weight="800" fill="#0F172A">
        KMUTT MARKET
      </text>
      <text x="195" y="6" font-family="'Leelawadee UI', sans-serif" font-size="17" font-weight="500" fill="#64748B">
        • ชี้เป้าของอร่อยรอบรั้ว มจธ. บางมด
      </text>
      <text x="890" y="6" font-family="'Leelawadee UI', sans-serif" font-size="17" font-weight="700" fill="#FA4616" text-anchor="end">
        @gen111_kmutt_market
      </text>
    </g>
  </g>
</svg>
  `.trim();

  const timestamp = Date.now();
  const safeSlug = (shop?.slug || "shop").replace(/[^a-zA-Z0-9-_]/g, "");
  const filename = `ig-human-${safeSlug}-${timestamp}.png`;
  const filePath = path.join(PUBLIC_POSTERS_DIR, filename);

  const pngBuffer = await sharp(Buffer.from(svgTemplate))
    .png({ quality: 95, compressionLevel: 8 })
    .toBuffer();

  fs.writeFileSync(filePath, pngBuffer);

  return {
    filename,
    filePath,
    url: `/posters/${filename}`,
    width: 1080,
    height: 1350,
    sizeBytes: pngBuffer.length,
    theme: "human-review",
  };
}

/**
 * Main Shop Poster Generator
 */
export async function generateShopPoster({
  shop,
  product = null,
  themeKey = "punpro",
  customHeadline = "",
  badgeText = "ร้านเด็ด มจธ. แนะนำวันนี้",
}) {
  if (themeKey === "punpro") {
    return generatePunproPoster({ shop, product, customHeadline });
  }

  const theme = THEMES[themeKey] || THEMES["kmutt-orange"];

  const shopName = escapeXml(shop?.name || "ร้านอาหารใน มจธ.");
  const buildingName = escapeXml(shop?.building_name || "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี (บางมด)");
  const locationDesc = escapeXml(shop?.location_description || "ชั้น 2 โรงอาหาร S14");
  const stallNumber = escapeXml(shop?.stall_number ? `ล็อก ${shop.stall_number}` : "");
  const headline = escapeXml(customHeadline || badgeText || "ร้านเด็ดขวัญใจเด็กบางมด");
  
  const dishName = escapeXml(product?.name || "เมนูแนะนำประจำร้าน");
  const dishPrice = product?.price ? `฿${product.price}` : (shop?.price_range || "฿");
  const dishDesc = escapeXml(truncateText(product?.description || shop?.description || "อิ่มคุ้มราคานักศึกษา วัตถุดิบสดใหม่ ปรุงจานต่อจาน", 110));

  const phone = escapeXml(shop?.contact_phone || "ติดต่อสอบถาม ณ หน้าร้าน");
  const tagList = Array.isArray(shop?.tags) && shop.tags.length > 0 ? shop.tags.slice(0, 3) : ["อิ่มคุ้มงบนักศึกษา", "รสชาติกลมกล่อม", "พิกัด มจธ."];

  let imageUrl = product?.image_url || shop?.cover_image_url || shop?.logo_url;
  if (!imageUrl || !imageUrl.startsWith("http")) {
    imageUrl = DEFAULT_FOOD_PHOTOS[0];
  }

  let heroImageBase64 = null;
  if (imageUrl) {
    try {
      const imgBuffer = await fetchImageBuffer(imageUrl);
      if (imgBuffer) {
        const resized = await sharp(imgBuffer)
          .resize(960, 520, { fit: "cover", position: "center" })
          .jpeg({ quality: 90 })
          .toBuffer();
        heroImageBase64 = `data:image/jpeg;base64,${resized.toString("base64")}`;
      }
    } catch (e) {
      console.warn("Could not process remote image for poster:", e.message);
    }
  }

  let heroSvgContent = "";
  if (heroImageBase64) {
    heroSvgContent = `
      <g>
        <clipPath id="heroClip">
          <rect x="60" y="240" width="960" height="520" rx="32" ry="32"/>
        </clipPath>
        <image x="60" y="240" width="960" height="520" preserveAspectRatio="xMidYMid slice" href="${heroImageBase64}" clip-path="url(#heroClip)"/>
        <rect x="60" y="560" width="960" height="200" fill="url(#heroOverlayGradient)" clip-path="url(#heroClip)"/>
      </g>
    `;
  } else {
    heroSvgContent = `
      <g>
        <rect x="60" y="240" width="960" height="520" rx="32" ry="32" fill="url(#foodPatternGradient)"/>
        <circle cx="540" cy="480" r="140" fill="#FFFFFF" opacity="0.12"/>
        <circle cx="540" cy="480" r="105" fill="#FA4616" opacity="0.25"/>
        <circle cx="540" cy="480" r="75" fill="#FFC72C" opacity="0.9"/>
        <text x="540" y="495" font-family="'Prompt', sans-serif" font-size="52" font-weight="700" fill="#FFFFFF" text-anchor="middle">🍽️</text>
        <text x="540" y="630" font-family="'Prompt', sans-serif" font-size="28" font-weight="600" fill="#FFFFFF" text-anchor="middle" opacity="0.85">KMUTT DELICIOUS FOOD</text>
      </g>
    `;
  }

  let tagsSvg = "";
  let tagX = 90;
  tagList.forEach((tag, idx) => {
    const cleanTag = escapeXml(tag);
    const tagWidth = cleanTag.length * 18 + 36;
    if (tagX + tagWidth < 980) {
      tagsSvg += `
        <rect x="${tagX}" y="1030" width="${tagWidth}" height="42" rx="21" ry="21" fill="${theme.tagBg}"/>
        <text x="${tagX + tagWidth / 2}" y="1058" font-family="'Prompt', sans-serif" font-size="18" font-weight="600" fill="${theme.tagText}" text-anchor="middle">${cleanTag}</text>
      `;
      tagX += tagWidth + 14;
    }
  });

  const svgTemplate = `
<svg width="1080" height="1350" viewBox="0 0 1080 1350" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.bgGradientStart}"/>
      <stop offset="100%" stop-color="${theme.bgGradientEnd}"/>
    </linearGradient>

    <linearGradient id="heroOverlayGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.85"/>
    </linearGradient>

    <linearGradient id="foodPatternGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#334155"/>
      <stop offset="50%" stop-color="#1E293B"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>

    <linearGradient id="primaryGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${theme.primary}"/>
      <stop offset="100%" stop-color="${theme.primaryLight}"/>
    </linearGradient>

    <filter id="shadowFilter" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000000" flood-opacity="0.45"/>
    </filter>

    <filter id="badgeShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="${theme.primary}" flood-opacity="0.4"/>
    </filter>
  </defs>

  <rect width="1080" height="1350" fill="url(#bgGradient)"/>
  <path d="M-80 0 L540 0 L380 180 L-80 180 Z" fill="${theme.primary}" opacity="0.12"/>
  <path d="M600 0 L1160 0 L1160 220 L760 220 Z" fill="${theme.primaryLight}" opacity="0.08"/>
  <circle cx="980" cy="180" r="280" fill="${theme.primary}" opacity="0.15" filter="url(#shadowFilter)"/>

  <g id="topBrand">
    <rect x="60" y="55" width="56" height="56" rx="16" ry="16" fill="${theme.primary}"/>
    <path d="M88 68 L73 78 V100 L88 110 L103 100 V78 Z" stroke="#FFFFFF" stroke-width="3" fill="none"/>
    <circle cx="88" cy="89" r="6" fill="${theme.accent}"/>
    <text x="132" y="86" font-family="'Prompt', sans-serif" font-size="28" font-weight="800" fill="#FFFFFF" letter-spacing="1">KMUTT MARKET</text>
    <text x="132" y="112" font-family="'Prompt', sans-serif" font-size="16" font-weight="500" fill="#94A3B8">ตลาดนัดและร้านค้า มจธ. บางมด • BPUU OFFICIAL</text>

    <rect x="740" y="60" width="280" height="46" rx="23" ry="23" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.18)" stroke-width="1.5"/>
    <circle cx="764" cy="83" r="6" fill="#10B981"/>
    <text x="782" y="90" font-family="'Prompt', sans-serif" font-size="16" font-weight="600" fill="#F8FAFC">เปิดบริการวันนี้ • มจธ.</text>
  </g>

  <g id="headlineGroup" filter="url(#badgeShadow)">
    <rect x="60" y="148" width="540" height="54" rx="27" ry="27" fill="url(#primaryGradient)"/>
    <text x="90" y="184" font-family="'Prompt', sans-serif" font-size="22" font-weight="700" fill="#FFFFFF">✨ ${headline}</text>
  </g>

  ${heroSvgContent}

  <g filter="url(#shadowFilter)">
    <rect x="760" y="670" width="230" height="74" rx="24" ry="24" fill="${theme.accent}"/>
    <text x="875" y="718" font-family="'Prompt', sans-serif" font-size="34" font-weight="800" fill="#0F172A" text-anchor="middle">${dishPrice}</text>
  </g>

  <g id="mainCard" filter="url(#shadowFilter)">
    <rect x="60" y="785" width="960" height="460" rx="36" ry="36" fill="${theme.cardBg}"/>
    <text x="90" y="855" font-family="'Prompt', sans-serif" font-size="38" font-weight="800" fill="${theme.cardText}">${shopName}</text>
    <text x="90" y="905" font-family="'Prompt', sans-serif" font-size="24" font-weight="700" fill="${theme.primary}">⭐️ เมนูเด็ด: ${dishName}</text>
    <text x="90" y="955" font-family="'Prompt', sans-serif" font-size="20" font-weight="400" fill="${theme.cardSubtext}">${dishDesc}</text>
    <line x1="90" y1="995" x2="990" y2="995" stroke="#E2E8F0" stroke-width="1.5"/>
    ${tagsSvg}

    <g id="locationGrid">
      <rect x="90" y="1100" width="580" height="110" rx="20" ry="20" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.5"/>
      <text x="120" y="1140" font-family="'Prompt', sans-serif" font-size="18" font-weight="700" fill="#0F172A">📍 พิกัดร้านใน มจธ.</text>
      <text x="120" y="1172" font-family="'Prompt', sans-serif" font-size="20" font-weight="600" fill="${theme.primary}">${buildingName} ${stallNumber ? "• " + stallNumber : ""}</text>
      <text x="120" y="1198" font-family="'Prompt', sans-serif" font-size="16" font-weight="400" fill="#64748B">${locationDesc}</text>

      <rect x="690" y="1100" width="300" height="110" rx="20" ry="20" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.5"/>
      <text x="715" y="1140" font-family="'Prompt', sans-serif" font-size="18" font-weight="700" fill="#0F172A">📞 ติดต่อร้าน</text>
      <text x="715" y="1178" font-family="'Prompt', sans-serif" font-size="20" font-weight="700" fill="#334155">${phone}</text>
    </g>
  </g>

  <g id="bottomBar">
    <text x="60" y="1295" font-family="'Prompt', sans-serif" font-size="20" font-weight="600" fill="#E2E8F0">🌐 ค้นหาร้านเด็ดและเมนูทั้งหมดใน มจธ. ที่</text>
    <text x="440" y="1295" font-family="'Prompt', sans-serif" font-size="22" font-weight="800" fill="${theme.accent}">kmutt.market</text>
    <text x="1020" y="1295" font-family="'Prompt', sans-serif" font-size="18" font-weight="500" fill="#94A3B8" text-anchor="end">#ของกินบางมด #KMUTT #มจธ</text>
  </g>
</svg>
  `.trim();

  const timestamp = Date.now();
  const safeSlug = (shop?.slug || "shop").replace(/[^a-zA-Z0-9-_]/g, "");
  const filename = `ig-poster-${safeSlug}-${timestamp}.png`;
  const filePath = path.join(PUBLIC_POSTERS_DIR, filename);

  const pngBuffer = await sharp(Buffer.from(svgTemplate))
    .png({ quality: 95, compressionLevel: 8 })
    .toBuffer();

  fs.writeFileSync(filePath, pngBuffer);

  return {
    filename,
    filePath,
    url: `/posters/${filename}`,
    width: 1080,
    height: 1350,
    sizeBytes: pngBuffer.length,
    theme: themeKey,
  };
}

/**
 * Generate Market Event Poster (e.g. ตลาดนัด S2 วันอังคาร/พุธ/พฤหัสบดี)
 */
export async function generateMarketEventPoster({
  marketEvent,
  featuredShops = [],
  themeKey = "punpro",
  customHeadline = "ตลาดนัด มจธ. สัปดาห์นี้!",
}) {
  const eventName = escapeXml(marketEvent?.name || "ตลาดนัด มจธ. อาคาร S2");
  const eventLocation = escapeXml(marketEvent?.location || "ลานชั้น 1 อาคารจอดรถ 14 ชั้น (S2) มจธ. บางมด");
  const eventTime = `${marketEvent?.start_time || "07:00"} - ${marketEvent?.end_time || "17:00"} น.`;
  const eventDesc = escapeXml(truncateText(marketEvent?.description || "รวมร้านอาหารปรุงสด ขนมไทย เครื่องดื่ม และของใช้สไตล์นักศึกษา", 110));

  let shopListItems = "";
  if (featuredShops && featuredShops.length > 0) {
    featuredShops.slice(0, 4).forEach((shop, i) => {
      const y = 680 + i * 95;
      const sName = escapeXml(shop.name);
      const sDesc = escapeXml(truncateText(shop.description || "ของอร่อยราคาประหยัด", 45));
      const sStall = escapeXml(shop.stall_number || `ล็อก ${i + 1}`);

      shopListItems += `
        <g>
          <rect x="90" y="${y}" width="900" height="82" rx="20" ry="20" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.5"/>
          <circle cx="135" cy="${y + 41}" r="22" fill="#FA4616"/>
          <text x="135" y="${y + 48}" font-family="'Prompt', sans-serif" font-size="18" font-weight="700" fill="#FFFFFF" text-anchor="middle">${i + 1}</text>
          <text x="180" y="${y + 37}" font-family="'Prompt', sans-serif" font-size="22" font-weight="700" fill="#0F172A">${sName}</text>
          <text x="180" y="${y + 64}" font-family="'Prompt', sans-serif" font-size="16" font-weight="400" fill="#64748B">${sDesc}</text>
          <rect x="830" y="${y + 22}" width="140" height="38" rx="14" fill="#FEF3C7"/>
          <text x="900" y="${y + 47}" font-family="'Prompt', sans-serif" font-size="16" font-weight="600" fill="#B45309" text-anchor="middle">${sStall}</text>
        </g>
      `;
    });
  }

  const svgTemplate = `
<svg width="1080" height="1350" viewBox="0 0 1080 1350" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F172A"/>
      <stop offset="100%" stop-color="#1E293B"/>
    </linearGradient>
    <linearGradient id="bannerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FA4616"/>
      <stop offset="100%" stop-color="#FF8A00"/>
    </linearGradient>
    <filter id="shadowFilter" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000000" flood-opacity="0.45"/>
    </filter>
  </defs>

  <rect width="1080" height="1350" fill="url(#bgGradient)"/>

  <!-- Top Banner Pill: Punpro Style -->
  <g filter="url(#shadowFilter)">
    <rect x="60" y="55" width="460" height="60" rx="18" fill="#FFE500" stroke="#0F172A" stroke-width="2.5"/>
    <text x="85" y="95" font-family="'Prompt', sans-serif" font-size="24" font-weight="800" fill="#0F172A">
      📣 ปันโปรพาเดินตลาดนัด มจธ.!
    </text>
  </g>

  <!-- Big Hero Event Card -->
  <g filter="url(#shadowFilter)">
    <rect x="60" y="150" width="960" height="420" rx="36" ry="36" fill="url(#bannerGradient)"/>
    <text x="110" y="235" font-family="'Prompt', sans-serif" font-size="30" font-weight="700" fill="#FFFFFF">🎪 ${escapeXml(customHeadline)}</text>
    <text x="110" y="320" font-family="'Prompt', sans-serif" font-size="52" font-weight="800" fill="#FFFFFF">${eventName}</text>
    <text x="110" y="375" font-family="'Prompt', sans-serif" font-size="22" font-weight="500" fill="#FFF1EB">${eventDesc}</text>

    <rect x="110" y="420" width="860" height="100" rx="24" ry="24" fill="rgba(0,0,0,0.25)"/>
    <text x="145" y="465" font-family="'Prompt', sans-serif" font-size="20" font-weight="700" fill="#FFC72C">⏰ เวลาเปิดตลาด: ${eventTime}</text>
    <text x="145" y="495" font-family="'Prompt', sans-serif" font-size="18" font-weight="500" fill="#FFFFFF">📍 พิกัด: ${eventLocation}</text>
  </g>

  <!-- Featured Highlights Card -->
  <g filter="url(#shadowFilter)">
    <rect x="60" y="600" width="960" height="500" rx="36" ry="36" fill="#FFFFFF"/>
    <text x="90" y="650" font-family="'Prompt', sans-serif" font-size="28" font-weight="800" fill="#0F172A">🌟 ร้านค้าและเมนูเด็ดไฮไลท์ที่ต้องแวะ!</text>
    ${shopListItems}
  </g>

  <!-- Footer -->
  <g id="bottomBar">
    <text x="60" y="1295" font-family="'Prompt', sans-serif" font-size="20" font-weight="600" fill="#E2E8F0">🌐 เช็กตารางตลาดและผังล็อกทั้งหมดได้ที่</text>
    <text x="440" y="1295" font-family="'Prompt', sans-serif" font-size="22" font-weight="800" fill="#FFC72C">kmutt.market/market</text>
    <text x="1020" y="1295" font-family="'Prompt', sans-serif" font-size="18" font-weight="500" fill="#94A3B8" text-anchor="end">#ปันโปร #ตลาดนัดมจธ #เด็กบางมด</text>
  </g>
</svg>
  `.trim();

  const timestamp = Date.now();
  const safeId = (marketEvent?.id || "market").replace(/[^a-zA-Z0-9-_]/g, "");
  const filename = `ig-market-punpro-${safeId}-${timestamp}.png`;
  const filePath = path.join(PUBLIC_POSTERS_DIR, filename);

  const pngBuffer = await sharp(Buffer.from(svgTemplate))
    .png({ quality: 95, compressionLevel: 8 })
    .toBuffer();

  fs.writeFileSync(filePath, pngBuffer);

  return {
    filename,
    filePath,
    url: `/posters/${filename}`,
    width: 1080,
    height: 1350,
    sizeBytes: pngBuffer.length,
    theme: "punpro",
  };
}

export { THEMES };
