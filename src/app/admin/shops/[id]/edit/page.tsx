"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { useMarket } from "@/context/MarketContext";
import { ShopType, ShopStatus, VerificationStatus } from "@/types/database";

export default function AdminEditShopPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { db, upsertShop } = useMarket();

  const shop = db.shops.find((s) => s.id === params?.id) || db.shops[0];

  const [name, setName] = useState(shop.name);
  const [description, setDescription] = useState(shop.description);
  const [categoryId, setCategoryId] = useState(shop.category_id);
  const [shopType, setShopType] = useState<ShopType>(shop.shop_type);
  const [status, setStatus] = useState<ShopStatus>(shop.status);
  const [verification, setVerification] = useState<VerificationStatus>(
    shop.verification_status
  );
  const [buildingName, setBuildingName] = useState(shop.building_name);
  const [stallNumber, setStallNumber] = useState(shop.stall_number || "");
  const [coverImageUrl, setCoverImageUrl] = useState(shop.cover_image_url);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    upsertShop({
      ...shop,
      name,
      description,
      category_id: categoryId,
      shop_type: shopType,
      status,
      verification_status: verification,
      building_name: buildingName,
      stall_number: stallNumber || null,
      cover_image_url: coverImageUrl,
    });
    router.push("/admin/shops");
  };

  return (
    <div className="rounded-2xl border border-[#E5E5E5] bg-white p-6 space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-[#222222]">
          แก้ไขข้อมูลร้านค้า: {shop.name}
        </h1>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#222222] mb-1">
              ประเภทร้านค้า
            </label>
            <select
              value={shopType}
              onChange={(e) => setShopType(e.target.value as ShopType)}
              className="w-full rounded-xl border border-[#E5E5E5] bg-white px-3.5 py-2.5 text-sm"
            >
              <option value="campus_food_court">ศูนย์อาหาร มจธ. (S14)</option>
              <option value="permanent_shop">ร้านค้าประจำตามตึก</option>
              <option value="market_stall">ร้านตลาดนัด มจธ.</option>
              <option value="nearby_shop">ร้านเด็ดรอบรั้วบางมด</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#222222] mb-1">
              สถานะร้านค้า
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ShopStatus)}
              className="w-full rounded-xl border border-[#E5E5E5] bg-white px-3.5 py-2.5 text-sm"
            >
              <option value="active">เปิดใช้งาน (active)</option>
              <option value="pending">รอตรวจสอบ (pending)</option>
              <option value="inactive">ปิดชั่วคราว (inactive)</option>
              <option value="suspended">ระงับ (suspended)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#222222] mb-1">
              การยืนยันข้อมูล
            </label>
            <select
              value={verification}
              onChange={(e) =>
                setVerification(e.target.value as VerificationStatus)
              }
              className="w-full rounded-xl border border-[#E5E5E5] bg-white px-3.5 py-2.5 text-sm"
            >
              <option value="verified">ยืนยันแล้ว (verified)</option>
              <option value="pending">รอตรวจสอบ (pending)</option>
              <option value="unverified">ยังไม่ยืนยัน (unverified)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#222222] mb-1">
              อาคาร / โซนที่ตั้ง
            </label>
            <input
              type="text"
              value={buildingName}
              onChange={(e) => setBuildingName(e.target.value)}
              className="w-full rounded-xl border border-[#E5E5E5] px-3.5 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#222222] mb-1">
              หมายเลขล็อก
            </label>
            <input
              type="text"
              value={stallNumber}
              onChange={(e) => setStallNumber(e.target.value)}
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
            value={coverImageUrl}
            onChange={(e) => setCoverImageUrl(e.target.value)}
            className="w-full rounded-xl border border-[#E5E5E5] px-3.5 py-2.5 text-sm"
          />
        </div>

        <button
          type="submit"
          className="btn-tactile inline-flex items-center gap-2 rounded-xl bg-[#A6192E] px-6 py-3 text-sm font-semibold text-white"
        >
          <Save className="h-4 w-4" />
          <span>บันทึกการแก้ไข</span>
        </button>
      </form>
    </div>
  );
}
