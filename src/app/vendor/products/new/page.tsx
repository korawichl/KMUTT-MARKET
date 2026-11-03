"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle } from "lucide-react";
import { useMarket } from "@/context/MarketContext";

export default function VendorNewProductPage() {
  const router = useRouter();
  const { db, currentUser, upsertProduct } = useMarket();

  const myShop =
    db.shops.find((s) => s.owner_id === currentUser?.id) ||
    db.shops.find((s) => s.id === "shop-s11-01") ||
    db.shops[0];

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceStr, setPriceStr] = useState("");
  const [categoryId, setCategoryId] = useState(myShop.category_id);
  const [imageUrl, setImageUrl] = useState(myShop.cover_image_url);
  const [isAvailable, setIsAvailable] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericPrice =
      priceStr.trim() === "" ? null : Number(priceStr.trim());
    upsertProduct({
      shop_id: myShop.id,
      category_id: categoryId,
      name,
      description,
      price: numericPrice,
      image_url: imageUrl,
      is_available: isAvailable,
      is_recommended: false,
    });
    router.push("/vendor/products");
  };

  return (
    <div className="rounded-2xl border border-[#E5E5E5] bg-white p-6 space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-[#222222]">
          เพิ่มเมนูอาหารหรือสินค้าใหม่
        </h1>
        <p className="text-sm text-[#525252]">ร้าน: {myShop.name}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#222222] mb-1">
              ชื่อเมนู / สินค้า
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น ข้าวไข่เจียวหมูสับพริกสด"
              className="w-full rounded-xl border border-[#E5E5E5] px-3.5 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#222222] mb-1">
              ราคา (บาท) — เว้นว่างได้หากให้สอบถามราคาที่ร้าน
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={priceStr}
              onChange={(e) => setPriceStr(e.target.value)}
              placeholder="เช่น 40"
              className="w-full rounded-xl border border-[#E5E5E5] px-3.5 py-2.5 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#222222] mb-1">
              หมวดหมู่เมนู
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

          <div>
            <label className="block text-sm font-medium text-[#222222] mb-1">
              ลิงก์รูปภาพเมนู (URL)
            </label>
            <input
              type="url"
              required
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full rounded-xl border border-[#E5E5E5] px-3.5 py-2.5 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#222222] mb-1">
            คำอธิบายเมนู
          </label>
          <textarea
            rows={3}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="ระบุรายละเอียดวัตถุดิบ ปริมาณ หรือจุดเด่นของเมนู..."
            className="w-full rounded-xl border border-[#E5E5E5] p-3.5 text-sm"
          />
        </div>

        <label className="inline-flex items-center gap-2 text-sm font-medium text-[#222222] cursor-pointer">
          <input
            type="checkbox"
            checked={isAvailable}
            onChange={(e) => setIsAvailable(e.target.checked)}
            className="h-4 w-4 accent-[#A6192E]"
          />
          <span>พร้อมจำหน่ายทันที</span>
        </label>

        <div>
          <button
            type="submit"
            className="btn-tactile inline-flex items-center gap-2 rounded-xl bg-[#A6192E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#761626]"
          >
            <PlusCircle className="h-4 w-4" />
            <span>บันทึกเมนูใหม่</span>
          </button>
        </div>
      </form>
    </div>
  );
}
