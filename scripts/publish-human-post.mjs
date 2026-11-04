import path from "node:path";
import { postWithBrowserBot } from "../services/instagram-browser-bot.mjs";
import { KMUTT_100_SPOTS } from "../data/campaign-100-shops.mjs";
import { generatePunproPoster } from "../services/poster-generator.mjs";
import { generateKmuttHumanCaption } from "../services/caption-generator.mjs";

async function publishNow() {
  const spot = KMUTT_100_SPOTS[3]; // spot-004: ร้านป้าสมจิตต์ ข้าวราดแกง
  console.log(`🚀 กำลังสร้างโปสเตอร์และแคปชั่นใหม่ (สไตล์เด็ก มจธ. ตัวจริง + รูปหน้าร้านจริง)...`);
  console.log(`ร้าน: ${spot.name} (${spot.location})`);

  // 1. Poster
  const posterRes = await generatePunproPoster({
    shop: {
      name: spot.name,
      building_name: spot.location,
      location_description: spot.zone,
      slug: spot.id,
      tags: spot.tags,
    },
    product: {
      name: spot.dish,
      price: spot.price.replace(/[^0-9]/g, ""),
      image_url: spot.image,
    },
    customHeadline: `ของกิน มจธ. • ${spot.zone}`,
  });

  // 2. Caption
  const caption = generateKmuttHumanCaption({
    shop: {
      name: spot.name,
      building_name: spot.location,
      location_description: spot.zone,
      tags: spot.tags,
    },
    product: {
      name: spot.dish,
      price: spot.price,
      description: spot.desc,
    },
    customDetails: spot,
  });

  console.log(`\n📸 โปสเตอร์พร้อมแล้ว: ${posterRes.filePath}`);
  console.log(`\n🚀 กำลังเปิด Browser Bot ยิงขึ้น Instagram (@gen111_kmutt_market)...`);

  const result = await postWithBrowserBot({
    posterPath: posterRes.filePath,
    caption,
    headless: false, // Keep headful so we can verify visually if needed
  });

  console.log("\n🎉 โพสต์ขึ้น Instagram สำเร็จเรียบร้อย!");
  console.log("ผลลัพธ์:", result);
}

publishNow().catch(console.error);
