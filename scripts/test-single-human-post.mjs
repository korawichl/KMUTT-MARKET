import { KMUTT_100_SPOTS } from "../data/campaign-100-shops.mjs";
import { generatePunproPoster } from "../services/poster-generator.mjs";
import { generateKmuttHumanCaption } from "../services/caption-generator.mjs";

async function verify() {
  const spot = KMUTT_100_SPOTS[3]; // spot-004: ร้านป้าสมจิตต์ ข้าวราดแกง S14 (with real curry trays!)
  console.log("=== Target Spot ===");
  console.log("Name:", spot.name);
  console.log("Location:", spot.location);
  console.log("Dish:", spot.dish);
  console.log("Price:", spot.price);
  console.log("Image URL:", spot.image);

  // 1. Poster
  console.log("\nGenerating Human Review Poster...");
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
  console.log("Poster generated at:", posterRes.filePath);
  console.log("Poster URL:", posterRes.url);

  // 2. Caption
  console.log("\nGenerating Human Review Caption...");
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

  console.log("\n--- PREVIEW CAPTION ---");
  console.log(caption);
  console.log("-----------------------\n");
}

verify().catch(console.error);
