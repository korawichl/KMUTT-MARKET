import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

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

export async function renderHumanPoster({
  shopName,
  zoneName,
  buildingName,
  stallNumber,
  dishName,
  dishPrice,
  whyHighlight,
  hoursText,
  recommendText,
  imageUrl,
  outputPath,
}) {
  const rawBuf = await fetchBuffer(imageUrl);
  const photoBuf = await sharp(rawBuf)
    .resize(1080, 1350, { fit: "cover", position: "center" })
    .modulate({ saturation: 1.08, brightness: 1.02 })
    .jpeg({ quality: 92 })
    .toBuffer();

  const photoBase64 = `data:image/jpeg;base64,${photoBuf.toString("base64")}`;

  const svg = `
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

  <image x="0" y="0" width="1080" height="1350" preserveAspectRatio="xMidYMid slice" href="${photoBase64}"/>

  <rect x="0" y="0" width="1080" height="320" fill="url(#topShadow)"/>
  <rect x="0" y="720" width="1080" height="630" fill="url(#bottomShadow)"/>

  <!-- Top Header Bar -->
  <g filter="url(#softShadow)">
    <rect x="50" y="50" width="430" height="60" rx="30" fill="#FFFFFF"/>
    <circle cx="80" cy="80" r="14" fill="#FA4616"/>
    <text x="80" y="86" font-family="'Leelawadee UI', sans-serif" font-size="16" font-weight="900" fill="#FFFFFF" text-anchor="middle">✓</text>
    <text x="110" y="88" font-family="'Leelawadee UI', sans-serif" font-size="22" font-weight="800" fill="#0F172A">
      ${escapeXml(zoneName)}
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
        🍽️ ${escapeXml(dishName)}
      </text>
    </g>

    <g transform="translate(60, 310)">
      <rect x="0" y="0" width="440" height="58" rx="29" fill="#FEF3C7" stroke="#F59E0B" stroke-width="2"/>
      <text x="25" y="37" font-family="'Leelawadee UI', sans-serif" font-size="21" font-weight="800" fill="#92400E">
        ✨ ${escapeXml(whyHighlight)}
      </text>
    </g>

    <g transform="translate(860, 280) rotate(-6)">
      <rect x="-110" y="-60" width="220" height="120" rx="24" fill="url(#badgeYellow)" stroke="#FFFFFF" stroke-width="4"/>
      <text x="0" y="-18" font-family="'Leelawadee UI', sans-serif" font-size="18" font-weight="800" fill="#78350F" text-anchor="middle">
        ราคาเพียง
      </text>
      <text x="0" y="32" font-family="'Leelawadee UI', sans-serif" font-size="50" font-weight="900" fill="#0F172A" text-anchor="middle">
        ${escapeXml(dishPrice)}
      </text>
    </g>
  </g>

  <!-- Bottom Recommendation Card -->
  <g filter="url(#cardShadow)">
    <rect x="50" y="990" width="980" height="310" rx="36" fill="#FFFFFF"/>

    <g transform="translate(90, 1055)">
      <text x="0" y="0" font-family="'Leelawadee UI', sans-serif" font-size="38" font-weight="900" fill="#0F172A">
        ${escapeXml(shopName)}
      </text>
      
      ${stallNumber ? `
        <rect x="580" y="-32" width="160" height="42" rx="10" fill="#FFF1EB" stroke="#FA4616" stroke-width="1.5"/>
        <text x="660" y="-5" font-family="'Leelawadee UI', sans-serif" font-size="20" font-weight="800" fill="#FA4616" text-anchor="middle">
          ${escapeXml(stallNumber)}
        </text>
      ` : ""}
    </g>

    <g transform="translate(90, 1105)">
      <text x="0" y="0" font-family="'Leelawadee UI', sans-serif" font-size="21" font-weight="700" fill="#334155">
        📍 พิกัด: ${escapeXml(buildingName)}
      </text>
      <text x="0" y="34" font-family="'Leelawadee UI', sans-serif" font-size="20" font-weight="500" fill="#64748B">
        ⏰ เปิด: ${escapeXml(hoursText)}
      </text>
      <text x="0" y="68" font-family="'Leelawadee UI', sans-serif" font-size="19" font-weight="600" fill="#0369A1">
        💡 แนะนำ: ${escapeXml(recommendText)}
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

  await sharp(Buffer.from(svg))
    .png({ quality: 95 })
    .toFile(outputPath);
  console.log("Rendered:", outputPath);
}

async function main() {
  // Test 1: ร้านครัวสุดารัตน์ S14
  await renderHumanPoster({
    shopName: "ร้านครัวสุดารัตน์ (โรงอาหาร S14)",
    zoneName: "ของกิน มจธ. • อาคาร S14",
    buildingName: "อาคารพระจอมเกล้าราชานุสรณ์ 190 ปี (S14) ชั้น 2",
    stallNumber: "ล็อก S14-03",
    dishName: "ข้าวยำไก่แซ่บ & ข้าวไก่กรอบ",
    dishPrice: "45.-",
    whyHighlight: "ไก่กรอบคลุกข้าวคั่วแซ่บ ข้าวพูนจาน",
    hoursText: "06:30 - 15:30 น. (มื้อเช้า-เที่ยง) • มีน้ำซุปฟรี",
    recommendText: "ข้าวยำไก่แซ่บจานโต รสจัดจ้านมะนาวแท้ ไก่ทอดกรอบใหม่ไม่อมน้ำมัน!",
    imageUrl: "https://bpuu.kmutt.ac.th/wp-content/uploads/2019/07/DSC_4676.jpg",
    outputPath: "public/posters/test-sudarat-s14.png",
  });

  // Test 2: ร้านป้าสมจิตต์ ข้าวราดแกง S14
  await renderHumanPoster({
    shopName: "ร้านป้าสมจิตต์ ข้าวราดแกง",
    zoneName: "ของกิน มจธ. • อาคาร S14",
    buildingName: "อาคารพระจอมเกล้าราชานุสรณ์ 190 ปี (S14) ชั้น 2",
    stallNumber: "ล็อก S14-04",
    dishName: "ข้าวราดแกง 2 อย่าง (กับข้าว 20 หม้อ)",
    dishPrice: "40.-",
    whyHighlight: "กับข้าวสดใหม่ทุกเช้า ป้าตักให้เยอะ",
    hoursText: "06:00 - 15:00 น. • น้ำซุปกระดูกหมูฟรีตักเอง",
    recommendText: "ผัดพริกแกงหมูกรอบ & แกงเขียวหวานไก่ยอดมะพร้าว เมนูยอดนิยมของเด็ก มจธ.!",
    imageUrl: "https://bpuu.kmutt.ac.th/wp-content/uploads/2019/07/DSC_4677.jpg",
    outputPath: "public/posters/test-somjit-s14.png",
  });
}

main().catch(console.error);
