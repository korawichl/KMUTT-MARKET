"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { useMarket } from "@/context/MarketContext";

export default function VendorEditProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { db, upsertProduct } = useMarket();

  const product =
    db.products.find((p) => p.id === params?.id) || db.products[0];

  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description);
  const [priceStr, setPriceStr] = useState(
    product.price !== null ? String(product.price) : ""
  );
  const [categoryId, setCategoryId] = useState(product.category_id);
  const [imageUrl, setImageUrl] = useState(product.image_url);
  const [isAvailable, setIsAvailable] = useState(product.is_available);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const numericPrice =
      priceStr.trim() === "" ? null : Number(priceStr.trim());
    upsertProduct({
      ...product,
      name,
      description,
      price: numericPrice,
      category_id: categoryId,
      image_url: imageUrl,
      is_available: isAvailable,
    });
    router.push("/vendor/products");
  };

  return (
    <div className="rounded-2xl border border-[#E5E5E5] bg-white p-6 space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-[#222222]">
          แก้ไขเมนู: {product.name}
        </h1>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
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
              className="w-full rounded-xl border border-[#E5E5E5] px-3.5 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#222222] mb-1">
              ราคา (บาท) — เว้นว่างหากให้แสดง &ldquo;สอบถามราคาที่ร้าน&rdquo;
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={priceStr}
              onChange={(e) => setPriceStr(e.target.value)}
              className="w-full rounded-xl border border-[#E5E5E5] px-3.5 py-2.5 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#222222] mb-1">
              หมวดหมู่
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
              รูปภาพเมนู (URL)
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
          <span>พร้อมจำหน่าย</span>
        </label>

        <div>
          <button
            type="submit"
            className="btn-tactile inline-flex items-center gap-2 rounded-xl bg-[#A6192E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#761626]"
          >
            <Save className="h-4 w-4" />
            <span>บันทึกการแก้ไขเมนู</span>
          </button>
        </div>
      </form>
    </div>
  );
}
