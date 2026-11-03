"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle } from "lucide-react";
import { useMarket } from "@/context/MarketContext";
import { ShopType, MarketType } from "@/types/database";

export default function AdminNewShopPage() {
  const router = useRouter();
  const { db, upsertShop } = useMarket();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState(db.categories[0]?.id || "cat-01");
  const [shopType, setShopType] = useState<ShopType>("market_stall");
  const [marketType, setMarketType] = useState<MarketType>("all_market_days");
  const [buildingName, setBuildingName] = useState(
    "ลานตลาดนัด มจธ. (ชั้น 1 อาคารจอดรถ S2)"
  );
  const [locationDescription, setLocationDescription] = useState(
    "ลานชั้น 1 อาคารจอดรถ S2"
  );
  const [stallNumber, setStallNumber] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState(
    "https://bpuu.kmutt.ac.th/wp-content/uploads/2024/03/371126.jpg"
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    upsertShop({
      name,
      description,
      category_id: categoryId,
      shop_type: shopType,
      market_type: marketType,
      building_name: buildingName,
      location_description: locationDescription,
      stall_number: stallNumber || null,
      cover_image_url: coverImageUrl,
      logo_url: coverImageUrl,
      status: "active",
      verification_status: "verified",
      is_recommended: true,
    });
    router.push("/admin/shops");
  };

  return (
    <div className="rounded-2xl border border-[#E5E5E5] bg-white p-6 space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-[#222222]">
          เพิ่มร้านค้าใหม่เข้าสู่ระบบ KMUTT MARKET
        </h1>
      </div>

      <form onSubmit={handleCreate} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#222222] mb-1">
              ชื่อร้านค้า
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น ร้านยำแซ่บคุณป้า ตลาดนัด S2"
              className="w-full rounded-xl border border-[#E5E5E5] px-3.5 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#222222] mb-1">
              หมวดหมู่
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-xl border border-[#E5E5E5] bg-white px-3.5 py-2.5 text-sm"
            >
              {db.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#222222] mb-1">
              ประเภทร้านค้า (Shop Type)
            </label>
            <select
              value={shopType}
              onChange={(e) => setShopType(e.target.value as ShopType)}
              className="w-full rounded-xl border border-[#E5E5E5] bg-white px-3.5 py-2.5 text-sm"
            >
              <option value="market_stall">ร้านแผงลอยตลาดนัด (market_stall)</option>
              <option value="campus_food_court">
                ร้านศูนย์อาหาร S14 (campus_food_court)
              </option>
              <option value="permanent_shop">
                ร้านค้าประจำตามตึก (permanent_shop)
              </option>
              <option value="nearby_shop">
                ร้านเด็ดรอบรั้ว มจธ. (nearby_shop)
              </option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#222222] mb-1">
              รอบตลาดนัด (Market Type)
            </label>
            <select
              value={marketType}
              onChange={(e) => setMarketType(e.target.value as MarketType)}
              className="w-full rounded-xl border border-[#E5E5E5] bg-white px-3.5 py-2.5 text-sm"
            >
              <option value="all_market_days">ตลาดนัด อังคาร–พฤหัสบดี</option>
              <option value="community_tue">ตลาดนัดสินค้าชุมชน (วันอังคาร)</option>
              <option value="kmutt_wed_thu">ตลาดนัด มจธ. (วันพุธ–พฤหัสบดี)</option>
              <option value="daily_campus">เปิดตามเวลาอาคารปกติ</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#222222] mb-1">
              อาคาร / โซน
            </label>
            <input
              type="text"
              required
              value={buildingName}
              onChange={(e) => setBuildingName(e.target.value)}
              className="w-full rounded-xl border border-[#E5E5E5] px-3.5 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#222222] mb-1">
              จุดที่ตั้งละเอียด
            </label>
            <input
              type="text"
              value={locationDescription}
              onChange={(e) => setLocationDescription(e.target.value)}
              className="w-full rounded-xl border border-[#E5E5E5] px-3.5 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#222222] mb-1">
              หมายเลขล็อก (ถ้ามี)
            </label>
            <input
              type="text"
              value={stallNumber}
              onChange={(e) => setStallNumber(e.target.value)}
              placeholder="เช่น A-03"
              className="w-full rounded-xl border border-[#E5E5E5] px-3.5 py-2.5 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#222222] mb-1">
            คำอธิบายร้านค้า
          </label>
          <textarea
            rows={3}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-[#E5E5E5] p-3.5 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#222222] mb-1">
            รูปภาพหน้าร้าน (URL)
          </label>
          <input
            type="url"
            required
            value={coverImageUrl}
            onChange={(e) => setCoverImageUrl(e.target.value)}
            className="w-full rounded-xl border border-[#E5E5E5] px-3.5 py-2.5 text-sm"
          />
        </div>

        <button
          type="submit"
          className="btn-tactile inline-flex items-center gap-2 rounded-xl bg-[#A6192E] px-6 py-3 text-sm font-semibold text-white"
        >
          <PlusCircle className="h-4 w-4" />
          <span>บันทึกร้านค้าใหม่</span>
        </button>
      </form>
    </div>
  );
}
