import sharp from "sharp";

// Curated authentic Thai food photography URLs (real dishes, appetizing food photography)
const THAI_FOOD_COLLECTION = {
  // 1. ข้าวแกง / กับข้าวไทย
  khao_rad_gaeng: [
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=85", // Replace with real curry
    "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=1200&q=85",
  ],
  // 2. ผัดกะเพราหมูสับไข่ดาว / หมูกรอบ
  pad_kra_pao: [
    "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=1200&q=85",
  ],
  // 3. ก๋วยเตี๋ยว / บะหมี่ / ต้มยำ
  noodles: [
    "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1617093727343-374698b1b08d?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=1200&q=85",
  ],
  // 4. สุกี้ / ชาบู / หม้อไฟ
  suki_hotpot: [
    "https://images.unsplash.com/photo-1547928576-a4a33237cbc3?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1200&q=85",
  ],
  // 5. ไก่ทอด / ข้าวยำไก่แซ่บ
  fried_chicken: [
    "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=1200&q=85",
  ],
  // 6. เครื่องดื่ม / ชาไทย / น้ำปั่น
  drinks: [
    "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&w=1200&q=85",
  ],
  // 7. ส้มตำ / อาหารอีสาน / ลาบ
  somtum_isaan: [
    "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1200&q=85",
  ],
  // 8. หมูกระทะ / ปิ้งย่าง / บาร์บีคิว
  mookata_bbq: [
    "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=85",
  ],
  // 9. หม่าล่าเสียบไม้
  mala_skewers: [
    "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=85",
  ],
  // 10. ของหวาน / เบเกอรี่ / เครป
  dessert_bakery: [
    "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=85",
  ]
};

async function checkUrls() {
  for (const [cat, urls] of Object.entries(THAI_FOOD_COLLECTION)) {
    for (const url of urls) {
      try {
        const res = await fetch(url, { method: "HEAD" });
        console.log(`${cat}: ${res.status === 200 ? "OK" : res.status} -> ${url.slice(0, 50)}...`);
      } catch (e) {
        console.error(`${cat}: FAIL -> ${e.message}`);
      }
    }
  }
}

checkUrls();
