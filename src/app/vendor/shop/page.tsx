"use client";

import React, { useState } from "react";
import { Save } from "lucide-react";
import { useMarket } from "@/context/MarketContext";

export default function VendorShopPage() {
  const { db, currentUser, upsertShop } = useMarket();

  const myShop =
    db.shops.find((s) => s.owner_id === currentUser?.id) ||
    db.shops.find((s) => s.id === "shop-s11-01") ||
    db.shops[0];

  const [name, setName] = useState(myShop.name);
  const [description, setDescription] = useState(myShop.description);
  const [categoryId, setCategoryId] = useState(myShop.category_id);
  const [buildingName, setBuildingName] = useState(myShop.building_name);
  const [locationDescription, setLocationDescription] = useState(
    myShop.location_description
  );
  const [contactPhone, setContactPhone] = useState(myShop.contact_phone || "");
  const [coverImageUrl, setCoverImageUrl] = useState(myShop.cover_image_url);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    upsertShop({
      ...myShop,
      name,
      description,
      category_id: categoryId,
      building_name: buildingName,
      location_description: locationDescription,
      contact_phone: contactPhone || null,
      cover_image_url: coverImageUrl,
      logo_url: coverImageUrl,
    });
  };

  return (
    <div className="rounded-2xl border border-[#E5E5E5] bg-white p-6 space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-[#222222]">
          แก้ไขข้อมูลร้านค้าของคุณ
        </h1>
        <p className="text-sm text-[#525252]">
          อัปเดตชื่อร้าน คำอธิบาย อาคารที่ตั้ง รูปภาพหน้าร้าน และช่องทางติดต่อ
        </p>
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
              หมวดหมู่หลัก
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-xl border border-[#E5E5E5] bg-white px-3.5 py-2.5 text-sm"
            >
              {db.categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#222222] mb-1">
            คำอธิบายร้านค้าและจุดเด่น
          </label>
          <textarea
            rows={3}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-[#E5E5E5] p-3.5 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#222222] mb-1">
              อาคาร / โซนที่ตั้งใน มจธ.
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
              รายละเอียดจุดที่ตั้ง / ชั้น / หมายเลขล็อก
            </label>
            <input
              type="text"
              value={locationDescription}
              onChange={(e) => setLocationDescription(e.target.value)}
              className="w-full rounded-xl border border-[#E5E5E5] px-3.5 py-2.5 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#222222] mb-1">
              เบอร์โทรศัพท์ติดต่อร้าน
            </label>
            <input
              type="text"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="08X-XXX-XXXX"
              className="w-full rounded-xl border border-[#E5E5E5] px-3.5 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#222222] mb-1">
              ลิงก์รูปภาพหน้าร้าน (URL)
            </label>
            <input
              type="url"
              required
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              className="w-full rounded-xl border border-[#E5E5E5] px-3.5 py-2.5 text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn-tactile inline-flex items-center gap-2 rounded-xl bg-[#A6192E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#761626]"
        >
          <Save className="h-4 w-4" />
          <span>บันทึกการเปลี่ยนแปลงข้อมูลร้าน</span>
        </button>
      </form>
    </div>
  );
}
