import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const REAL_PA_OU_IMAGE = "https://bpuu.kmutt.ac.th/wp-content/uploads/2019/07/DSC_4671.jpg";

function escapeXml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function fetchBuffer(url) {
  const res = await fetch(url);
  const arr = await res.arrayBuffer();
  return Buffer.from(arr);
}

async function generateSamplePosters() {
  console.log("Downloading real KMUTT canteen photo...");
  const rawBuf = await fetchBuffer(REAL_PA_OU_IMAGE);

  // Resize and optimize photo to 1080x1350 with nice warm saturation and clarity
  const photoBuf = await sharp(rawBuf)
    .resize(1080, 1350, { fit: "cover", position: "center" })
    .modulate({ saturation: 1.08, brightness: 1.02 })
    .jpeg({ quality: 92 })
    .toBuffer();

  const photoBase64 = `data:image/jpeg;base64,${photoBuf.toString("base64")}`;

  // DESIGN 1: Campus Foodie Photo Review (สมจริงสไตล์รุ่นพี่ มจธ. พาชิม ไม่ลอกปันโปร)
  // Clean, realistic, transparent vignettes only at edges, natural sticker pills with drop shadows
  const svgDesign1 = `
<svg width="1080" height="1350" viewBox="0 0 1080 1350" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Soft top & bottom vignette to let photo shine in the center -->
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

    <linearGradient id="badgeOrange" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FA4616"/>
      <stop offset="100%" stop-color="#FF6B3D"/>
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

  <!-- Real Storefront Background Image -->
  <image x="0" y="0" width="1080" height="1350" preserveAspectRatio="xMidYMid slice" href="${photoBase64}"/>

  <!-- Subtle Ambient Gradients -->
  <rect x="0" y="0" width="1080" height="320" fill="url(#topShadow)"/>
  <rect x="0" y="720" width="1080" height="630" fill="url(#bottomShadow)"/>

  <!-- Top Header Bar: Real Campus Badge -->
  <g filter="url(#softShadow)">
    <!-- Pill 1: Location Tag -->
    <rect x="50" y="50" width="410" height="60" rx="30" fill="#FFFFFF"/>
    <circle cx="80" cy="80" r="14" fill="#FA4616"/>
    <text x="80" y="86" font-family="'Leelawadee UI', sans-serif" font-size="16" font-weight="900" fill="#FFFFFF" text-anchor="middle">✓</text>
    <text x="110" y="88" font-family="'Leelawadee UI', sans-serif" font-size="22" font-weight="800" fill="#0F172A">
      ของกิน มจธ. • อาคาร S14
    </text>

    <!-- Pill 2: Authentic Stamp -->
    <rect x="750" y="50" width="280" height="60" rx="30" fill="rgba(15, 23, 42, 0.85)" stroke="#FFFFFF" stroke-width="1.5"/>
    <text x="890" y="87" font-family="'Leelawadee UI', sans-serif" font-size="20" font-weight="700" fill="#FDE047" text-anchor="middle">
      ⭐️ แนะนำโดยเด็กบางมด
    </text>
  </g>

  <!-- Floating Callout Stickers (Pointing to the real stall & menu) -->
  <g filter="url(#softShadow)">
    <!-- Sticker 1: Highlight Menu -->
    <g transform="translate(60, 220)">
      <rect x="0" y="0" width="480" height="74" rx="20" fill="#FFFFFF" stroke="#FA4616" stroke-width="2.5"/>
      <text x="25" y="46" font-family="'Leelawadee UI', sans-serif" font-size="26" font-weight="800" fill="#0F172A">
        🍲 สุกี้หมูน้ำข้น &amp; ข้าวราดแกง
      </text>
    </g>

    <!-- Sticker 2: Why Eat Here / Reason -->
    <g transform="translate(60, 310)">
      <rect x="0" y="0" width="420" height="58" rx="29" fill="#FEF3C7" stroke="#F59E0B" stroke-width="2"/>
      <text x="25" y="37" font-family="'Leelawadee UI', sans-serif" font-size="21" font-weight="800" fill="#92400E">
        ✨ เครื่องแน่น ให้เยอะ อิ่มจุกๆ
      </text>
    </g>

    <!-- Sticker 3: Price Tag (Angle -6 deg, Realistic Sticker) -->
    <g transform="translate(860, 280) rotate(-6)">
      <rect x="-110" y="-60" width="220" height="120" rx="24" fill="url(#badgeYellow)" stroke="#FFFFFF" stroke-width="4"/>
      <text x="0" y="-18" font-family="'Leelawadee UI', sans-serif" font-size="18" font-weight="800" fill="#78350F" text-anchor="middle">
        ราคาเพียง
      </text>
      <text x="0" y="32" font-family="'Leelawadee UI', sans-serif" font-size="50" font-weight="900" fill="#0F172A" text-anchor="middle">
        40.-
      </text>
    </g>
  </g>

  <!-- Bottom Recommendation Card (Authentic Campus Guide Layout) -->
  <g filter="url(#cardShadow)">
    <rect x="50" y="990" width="980" height="310" rx="36" fill="#FFFFFF"/>

    <!-- Shop Name & Stall Badge -->
    <g transform="translate(90, 1055)">
      <text x="0" y="0" font-family="'Leelawadee UI', sans-serif" font-size="38" font-weight="900" fill="#0F172A">
        ร้านป้าอู๋ (โรงอาหาร S14)
      </text>
      
      <rect x="580" y="-32" width="160" height="42" rx="10" fill="#FFF1EB" stroke="#FA4616" stroke-width="1.5"/>
      <text x="660" y="-5" font-family="'Leelawadee UI', sans-serif" font-size="20" font-weight="800" fill="#FA4616" text-anchor="middle">
        ล็อก S14-02
      </text>
    </g>

    <!-- Why recommend (3 Points) -->
    <g transform="translate(90, 1105)">
      <text x="0" y="0" font-family="'Leelawadee UI', sans-serif" font-size="21" font-weight="700" fill="#334155">
        📍 พิกัด: อาคารพระจอมเกล้าราชานุสรณ์ 190 ปี (S14) ชั้น 2
      </text>
      <text x="0" y="34" font-family="'Leelawadee UI', sans-serif" font-size="20" font-weight="500" fill="#64748B">
        ⏰ เปิด: 06:00 - 15:00 น. (มื้อเช้า-เที่ยง) • น้ำซุปฟรีบริการตัวเอง
      </text>
      <text x="0" y="68" font-family="'Leelawadee UI', sans-serif" font-size="19" font-weight="600" fill="#0369A1">
        💡 แนะนำ: สุกี้หมูน้ำข้นชามโต น้ำจิ้มเต้าหู้ยี้สูตรเด็ด ปรุงสดใหม่ชามต่อชาม!
      </text>
    </g>

    <!-- Footer Divider & Account Attribution -->
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

  const outPath1 = path.resolve("public/posters/test-human-design-1.png");
  await sharp(Buffer.from(svgDesign1))
    .png({ quality: 95 })
    .toFile(outPath1);
  console.log("Generated Design 1 at:", outPath1);
}

generateSamplePosters().catch(console.error);
