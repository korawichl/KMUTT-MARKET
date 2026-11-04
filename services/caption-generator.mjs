/**
 * Caption Generator for KMUTT Market Instagram Promotion
 * Supports both smart dynamic templates and optional Gemini AI generation.
 */

const HASHTAG_BANK = [
  "#ปันโปร",
  "#ปันโปรมจธ",
  "#ชี้เป้า",
  "#KMUTT",
  "#มจธ",
  "#เด็กบางมด",
  "#ของกินบางมด",
  "#ตลาดมจธ",
  "#รีวิวมจธ",
  "#กินไรดีมจธ",
  "#โรงอาหารS14",
  "#ตลาดนัดS2",
  "#dek67",
  "#dek68",
];

const PUNPRO_HOOKS = [
  "📣 #ปันโปรบอกต่อ! ชี้เป้าของกินเด็ดในรั้ว มจธ. บางมด 🔥 อร่อยคุ้มตาแตกกก!",
  "📣 เด็ก มจธ. ต้องเซฟโพสต์นี้ไว้ด่วน! ปันโปรพามาส่องร้านดังประจำมอ 🤤",
  "📣 ปันโปรชวนชิม! เมนูซิกเนเจอร์ที่เด็กบางมดพูดเป็นเสียงเดียวกันว่า 'โคตรเด็ด!' ⭐️",
  "📣 ชี้เป้าความอร่อยงบประหยัด! พาบุกร้านเด็ดใน มจธ. เริ่มต้นเบาๆ สบายกระเป๋า 💸",
];

const STUDENT_HOOKS = [
  "เที่ยงนี้กินอะไรดีชาว มจธ.?! 🔥 ถ้ายังคิดไม่ออก วันนี้ขอมาป้ายยาร้านเด็ดในตำนาน!",
  "เด็กบางมดรู้ ทุกคนรู้! 🧡 ร้านนี้คือเดอะเบสต์ที่ต้องแวะไปซ้ำตลอดสัปดาห์",
  "ใครยังไม่เคยลองร้านนี้ถือว่ายังมาไม่ถึง มจธ.! 🤤 วันนี้พามาส่องเมนูเด็ดราคานักศึกษา",
  "เซฟโพสต์นี้ไว้ด่วน! 📌 พิกัดของกินราคาเป็นมิตรกับกระเป๋าตังค์ อิ่มจุกๆ สบายกระเป๋า",
  "หิวเมื่อไหร่ไม่ต้องเดินหาให้เหนื่อย! 🛵 วันนี้แนะนำร้านดังขวัญใจชาวบางมด",
];

const FOODIE_HOOKS = [
  "เตือนแล้วนะว่าดูโพสต์นี้ตอนดึกมีหิวแน่นอน! 🤤✨ พาบุกร้านดังรสเด็ดในรั้ว มจธ.",
  "ความอร่อยระดับตำนานที่เสิร์ฟร้อนๆ ทุกวัน! 🔥 กลิ่นหอมชวนน้ำลายสอตั้งแต่หน้าร้าน",
  "จานนี้คือที่สุด! ทั้งเครื่องแน่น ทั้งรสชาติกลมกล่อม ในราคาน่ารักสุดๆ 💸",
  "เมนูยอดฮิตที่เด็ก มจธ. พูดเป็นเสียงเดียวกันว่า 'โคตรคุ้ม!' ⭐️",
];

const OFFICIAL_HOOKS = [
  "📢 สำนักงานจัดการทรัพย์สิน (BPUU มจธ.) ขอแนะนำร้านค้ามาตรฐานประจำมหาวิทยาลัย",
  "✨ ชวนนักศึกษาและบุคลากรแวะอิ่มอร่อยกับร้านค้าที่ผ่านการรับรองความสะอาดและคุณภาพ",
  "🏢 อัปเดตพิกัดร้านอาหารและเครื่องดื่มเพื่อสุขอนามัยภายในมหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี",
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate Authentic KMUTT Student Food Guide Caption
 * Not copying Punpro - focusing on why you should eat here and what menus they have!
 */
export function generateKmuttHumanCaption({
  shop,
  product = null,
  customDetails = null,
}) {
  const shopName = shop?.name || customDetails?.name || "ร้านอาหาร มจธ.";
  const building = shop?.building_name || customDetails?.location || "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี (บางมด)";
  const location = shop?.location_description || customDetails?.location || "โรงอาหาร S14";
  const stall = shop?.stall_number ? ` (ล็อก ${shop.stall_number})` : "";
  const dishName = product?.name || (customDetails?.dish || "เมนูแนะนำประจำร้าน");
  const rawPrice = product?.price || customDetails?.price || (shop?.price_range ? shop.price_range.replace(/[^0-9]/g, "") : "40");
  const dishPrice = rawPrice.includes(".-") || rawPrice.includes("บาท") ? rawPrice : `${rawPrice}.-`;
  const desc = product?.description || customDetails?.desc || shop?.description || "รสชาติอร่อยกลมกล่อม ปรุงสดใหม่ทุกจาน";
  const zone = customDetails?.zone || shop?.location_description || "มจธ. บางมด";

  const studentGreetingHooks = [
    `เที่ยงนี้กินอะไรดีชาว มจธ.?! 🛵💨 ใครอยู่ฝั่ง ${zone} แล้วยังนึกไม่ออกว่าจะกินอะไร วันนี้พามาแวะ "${shopName}" กันครับ!`,
    `เด็กบางมดขอพามาชี้เป้า! 🤤 ใครกำลังมองหาร้านข้าวที่อิ่มคุ้ม อร่อย ไม่แพง วันนี้ต้องแวะมาที่ "${shopName}" เลย!`,
    `แวะเติมพลังระหว่างวันกันหน่อย! 🧡 ใครอยู่แถว ${zone} วันนี้ขอป้ายยาร้านอร่อยประจำมออย่าง "${shopName}" ที่เด็ก มจธ. แวะมาซ้ำบ่อยสุดๆ`,
    `รีวิวของกิน มจธ. วันนี้พามาเปิดวาร์ปร้านดังโซน ${zone}! 🍛 ใครยังไม่เคยลองร้าน "${shopName}" บอกเลยว่าพลาดมากกก`,
  ];

  const greeting = pickRandom(studentGreetingHooks);

  return `${greeting}

ทำไมถึงควรมากินร้านนี้? 🤔
• ให้เยอะ อิ่มจุกๆ ในงบนักศึกษา ราคาเริ่มต้นสบายกระเป๋าแค่ ${dishPrice}
• วัตถุดิบสดใหม่ ปรุงร้อนๆ จานต่อจาน รสชาติกลมกล่อมถึงเครื่อง
• ${shop?.tags && shop.tags[0] ? shop.tags[0] + " " : ""}บรรยากาศเป็นกันเอง คนขายใจดี ตักให้พูนจานแบบไม่หวงของเลย

เมนูเด็ดที่อยากชวนให้ลอง: 🍽️
1. ${dishName} (${dishPrice}): เมนูยอดนิยมของร้าน ${desc}
2. เมนูตามสั่งและกับข้าวประจำวัน: มีให้เลือกหลากหลาย ปรุงร้อนๆ ทานคู่ไข่ดาวฟูกรอบ
3. น้ำซุปและเครื่องเคียง: มีบริการให้ตักเพิ่มความคล่องคอ

📌 พิกัดและการเดินทาง:
• ${building}${stall}
• ${location} • โซน ${zone}
⏰ เวลาเปิด-ปิด: เปิดบริการจันทร์ - ศุกร์ (รอบอาหารเช้าและเที่ยง)

ใครเคยไปกินร้านนี้แล้วชอบเมนูไหน คอมเมนต์บอกเพื่อนๆ กันได้น้าา 👇 หรือแท็กเพื่อนในกลุ่มไปลุยด้วยกันเที่ยงนี้เลย! 🛵💨

#KMUTT #มจธ #เด็กบางมด #ของกินบางมด #รีวิวมจธ #ของกินมจธ #${zone.replace(/[^a-zA-Z0-9\u0E00-\u0E7F]/g, "")}`;
}

/**
 * Generate Shop Caption using Smart Template Engine
 */
export function generateShopCaptionTemplate({
  shop,
  product = null,
  tone = "student",
}) {
  const shopName = shop?.name || "ร้านอาหาร มจธ.";
  const building = shop?.building_name || "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี (บางมด)";
  const location = shop?.location_description || "โรงอาหาร S14";
  const stall = shop?.stall_number ? ` (ล็อก ${shop.stall_number})` : "";
  const phone = shop?.contact_phone ? `📞 โทร: ${shop.contact_phone}` : "";
  const dishName = product?.name || "เมนูซิกเนเจอร์ประจำร้าน";
  const dishPrice = product?.price ? `ราคาเพียง ${product.price} บาท` : (shop?.price_range ? `ช่วงราคา ${shop.price_range}` : "ราคานักศึกษาเริ่มต้นสบายกระเป๋า");
  const dishDesc = product?.description || shop?.description || "รสชาติอร่อยกลมกล่อม ปรุงสดใหม่ทุกจาน";

  if (tone === "punpro") {
    const hook = pickRandom(PUNPRO_HOOKS);
    return `${hook}

📍 ชี้เป้าวันนี้: **${shopName}**
✨ เมนูซิกเนเจอร์ที่ต้องสั่ง: **${dishName}**
💸 ราคา: ${dishPrice} (อิ่มจุกๆ ในงบนักศึกษา)
📝 รสชาติและความเด็ด: ${dishDesc}

━━━━━━━━━━━━━━━━━━━━━
🌟 **3 เหตุผลที่ปันโปรอยากป้ายยา:**
1. ให้เครื่องแน่นเต็มจาน ไม่หวงวัตถุดิบ
2. รสชาติกลมกล่อม ปรุงสดใหม่จานต่อจาน
3. พิกัดหาง่าย แอร์เย็น นั่งกินสบายๆ ระหว่างพักเบรก

━━━━━━━━━━━━━━━━━━━━━
📌 **พิกัดร้านใน มจธ.:**
• ${building}${stall}
• ${location}
⏰ เวลาเปิด-ปิด: เปิดบริการวันจันทร์ - เสาร์ (เช็กเวลารอบอาหาร)
${phone ? "• " + phone : ""}

👉 แท็กเพื่อนที่ชอบชวนกินด่วนนน เที่ยงนี้ไปลุยกัน! 🛵💨

📲 ดูพิกัดและเมนูร้านทั้งหมดใน มจธ. ได้ที่ https://kmutt.market

.
.
.
${HASHTAG_BANK.join(" ")}`;
  }

  let hook = "";
  let closing = "";

  if (tone === "foodie") {
    hook = pickRandom(FOODIE_HOOKS);
    closing = "ใครอยู่แถวบางมดอย่าลืมแวะไปจัดกันน้าา รับรองไม่ผิดหวังแน่นอน! 😋✨\n👉 แท็กเพื่อนที่ชอบชวนกินด่วนนน!";
  } else if (tone === "official") {
    hook = pickRandom(OFFICIAL_HOOKS);
    closing = "ขอเชิญชวนชาว มจธ. ร่วมอุดหนุนผู้ประกอบการร้านค้าภายในมหาวิทยาลัย เพื่อเสริมสร้างเศรษฐกิจชุมชนที่ยั่งยืนครับ 🙏";
  } else {
    // student default
    hook = pickRandom(STUDENT_HOOKS);
    closing = "เที่ยงนี้ลากเพื่อนไปหารด่วนนน หรือใครเคยกินเมนูไหนมารีวิวกันได้ใต้คอมเมนต์เลยน้าา 👇🧡";
  }

  const tags = HASHTAG_BANK.slice(0, 10).join(" ");

  const caption = `${hook}

📍 วันนี้ขอเสนอ: **${shopName}**
⭐️ เมนูไฮไลท์: **${dishName}**
💸 ${dishPrice}
📝 รายละเอียด: ${dishDesc}

──────────────────────
📌 **พิกัดที่ตั้งใน มจธ.:**
• ${building}${stall}
• ${location}
⏰ เวลาเปิด-ปิด: เปิดบริการวันจันทร์ - เสาร์ (เช็กเวลาตามรอบอาหาร)
${phone ? "• " + phone : ""}

──────────────────────
${closing}

📲 ค้นหาเมนูเด็ดและพิกัดร้านทั้งหมดใน มจธ. ได้ที่ https://kmutt.market

.
.
.
${tags}`;

  return caption;
}

/**
 * Generate Market Event Caption (S2 Tuesday/Wednesday/Thursday)
 */
export function generateMarketEventCaptionTemplate({
  marketEvent,
  featuredShops = [],
  tone = "student",
}) {
  const eventName = marketEvent?.name || "ตลาดนัด มจธ.";
  const location = marketEvent?.location || "ลานชั้น 1 อาคารจอดรถ 14 ชั้น (S2) มจธ. บางมด";
  const time = `${marketEvent?.start_time || "07:00"} - ${marketEvent?.end_time || "17:00"} น.`;
  const desc = marketEvent?.description || "รวมร้านอาหารปรุงสด เครื่องดื่ม เบเกอรี่ และของใช้มากมาย";

  let shopSummary = "";
  if (featuredShops && featuredShops.length > 0) {
    shopSummary = "🛍️ ร้านค้าไฮไลท์แนะนำวันนี้:\n" +
      featuredShops.slice(0, 4).map((s, i) => `  ${i + 1}. ${s.name} ${s.stall_number ? `(${s.stall_number})` : ""}`).join("\n");
  }

  if (tone === "punpro") {
    return `📣 #ปันโปรบอกต่อ! ตลาดนัด มจธ. กลับมาเปิดแล้ววว ณ ลาน S2 บางมด! 🛍️✨

สายกินสายช้อปเตรียมพุ่งตัว! วันนี้มีตลาดนัด **${eventName}** รวมของกินเพียบ ขนมไทย เครื่องดื่มชื่นใจ ของทอดร้อนๆ ในงบนักศึกษา 💸

⏰ เวลาเดินตลาด: ${time}
📍 สถานที่: ${location}
✨ ความคุ้ม: ${desc}

${shopSummary ? shopSummary + "\n\n━━━━━━━━━━━━━━━━━━━━━\n" : ""}
👉 แท็กเพื่อนไปเดินหารของกินเที่ยงนี้ด่วนนน หรือใครเลิกเรียนแล้วรีบไปตำก่อนของหมด! 🛵💨

📲 เช็กผังล็อกตลาดนัดทั้งหมดได้ที่ https://kmutt.market/market

.
.
.
${HASHTAG_BANK.join(" ")}`;
  }

  const caption = `🎉 วันนี้มีตลาดนัด! **${eventName}** ณ ลาน S2 บางมด! 🛍️✨

ชาว มจธ. ทั้งสายกิน สายช้อป ห้ามพลาดเด็ดขาด! วันนี้ตลาดนัดกลับมาเปิดให้เดินเพลินๆ กันแล้ว ของกินเพียบ ของทานเล่น ขนมหวาน เครื่องดื่มชื่นใจจัดเต็ม!

⏰ เวลาเดินตลาด: ${time}
📍 สถานที่: ${location}
✨ จุดเด่น: ${desc}

${shopSummary ? shopSummary + "\n\n──────────────────────\n" : ""}
🛵 แวะมาเติมพลังระหว่างคาบเรียน หรือซื้อของกินกลับหอกันได้เลยยย!
💬 วันนี้ใครไปเดินมาแล้วได้อะไรติดมือบ้าง? เมนต์บอกกันหน่อยน้าา 👇

📲 ดูผังล็อกและตารางตลาดนัดตลอดทั้งเดือนได้ที่ https://kmutt.market/market

.
.
.
${HASHTAG_BANK.join(" ")}`;

  return caption;
}

/**
 * Generate caption using Gemini AI if GEMINI_API_KEY is available,
 * otherwise safely falls back to template engine.
 */
export async function generateCaptionWithAI({
  shop = null,
  product = null,
  marketEvent = null,
  tone = "student",
  apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY,
}) {
  // If no API key or no network, return high-quality smart template
  if (!apiKey) {
    if (marketEvent) {
      return generateMarketEventCaptionTemplate({ marketEvent, tone });
    }
    return generateShopCaptionTemplate({ shop, product, tone });
  }

  try {
    const prompt = marketEvent
      ? `คุณเป็นโซเชียลมีเดียครีเอเตอร์ของเพจ KMUTT Market (ตลาดนัดและร้านค้า มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี - มจธ. บางมด)
ช่วยเขียนแคปชั่น Instagram สำหรับโพสต์โปรโมทตลาดนัดประจำวัน ดังนี้:
- ชื่องาน: ${marketEvent.name}
- วันและเวลา: ${marketEvent.start_time} - ${marketEvent.end_time} น.
- สถานที่: ${marketEvent.location}
- รายละเอียด: ${marketEvent.description}
- น้ำเสียง/โทน: ${tone === "official" ? "ทางการ สุภาพ ประชาสัมพันธ์ BPUU" : tone === "foodie" ? "สายรีวิวอาหาร ชวนหิว ละเอียด" : "สไตล์นักศึกษา มจธ. เป็นกันเอง ชวนไปเดินเที่ยว"}

ข้อกำหนด:
1. มีเปิดหัว (Hook) ที่น่าสนใจ ดึงดูดสายตาบน Instagram feed
2. มีจุดไข่ปลา อีโมจิ และแบ่งบรรทัดอ่านง่าย
3. ระบุเวลาและสถานที่ชัดเจน
4. มี Call to Action ชวนคอมเมนต์หรือแท็กเพื่อน
5. ปิดท้ายด้วยแฮชแท็กเกี่ยวกับ มจธ. เช่น #KMUTT #มจธ #เด็กบางมด #ตลาดนัดมจธ #ของกินบางมด`
      : `คุณเป็นโซเชียลมีเดียครีเอเตอร์ของเพจ KMUTT Market (เพจโปรโมทร้านอาหารและของกิน มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี - มจธ. บางมด)
ช่วยเขียนแคปชั่น Instagram สั้นกระชับแต่น่าสนใจ สำหรับโปรโมทร้านค้านี้:
- ชื่อร้าน: ${shop?.name}
- เมนูเด็ด: ${product?.name || "เมนูแนะนำประจำร้าน"}
- ราคา: ${product?.price ? product.price + " บาท" : shop?.price_range || "ราคานักศึกษา"}
- พิกัด: ${shop?.building_name} (${shop?.location_description}) ${shop?.stall_number ? "ล็อก " + shop.stall_number : ""}
- รายละเอียด: ${product?.description || shop?.description || ""}
- น้ำเสียง/โทน: ${tone === "official" ? "ทางการ ประชาสัมพันธ์โดยสำนักงานทรัพย์สิน BPUU" : tone === "foodie" ? "สายกินรีวิวอาหาร ชวนหิว จัดจ้าน" : "สไตล์นักศึกษา มจธ. เป็นกันเอง สนุกสนาน มีอีโมจิ"}

ข้อกำหนด:
1. Hook เปิดโพสต์ชวนหิว ดึงดูดนักศึกษา
2. ไฮไลท์เมนูและราคาชัดเจน
3. บอกพิกัดตึกและวิธีไปอย่างแม่นยำ
4. ชวนแท็กเพื่อนหรือเซฟโพสต์
5. มีแฮชแท็ก #KMUTT #มจธ #เด็กบางมด #ของกินบางมด #รีวิวมจธ`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800,
          },
        }),
      }
    );

    if (res.ok) {
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text && text.trim().length > 20) {
        return text.trim();
      }
    }
  } catch (err) {
    console.warn("Gemini API call failed, falling back to template:", err.message);
  }

  // Fallback to template if Gemini failed or key invalid
  if (marketEvent) {
    return generateMarketEventCaptionTemplate({ marketEvent, tone });
  }
  return generateShopCaptionTemplate({ shop, product, tone });
}
