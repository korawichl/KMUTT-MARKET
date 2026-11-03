"use client";

import React, { useState } from "react";
import { PlusCircle, Trash2 } from "lucide-react";
import { useMarket } from "@/context/MarketContext";
import { formatPrice } from "@/lib/utils";

export default function AdminProductsPage() {
  const { db, upsertProduct, deleteProduct } = useMarket();
  const [name, setName] = useState("");
  const [shopId, setShopId] = useState(db.shops[0]?.id || "");
  const [categoryId, setCategoryId] = useState(db.categories[0]?.id || "");
  const [priceStr, setPriceStr] = useState("");
  const [description, setDescription] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    upsertProduct({
      name,
      shop_id: shopId,
      category_id: categoryId,
      price: priceStr.trim() === "" ? null : Number(priceStr),
      description: description || "เมนูแนะนำประจำร้าน",
      is_available: true,
      is_recommended: true,
    });
    setName("");
    setPriceStr("");
    setDescription("");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#E5E5E5] bg-white p-6 space-y-4">
        <h1 className="font-heading text-2xl font-bold text-[#222222]">
          จัดการเมนูอาหารและสินค้าทั้งหมด ({db.products.length} รายการ)
        </h1>

        <form
          onSubmit={handleAdd}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-[#E5E5E5]"
        >
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ชื่อเมนูใหม่..."
            className="rounded-xl border border-[#E5E5E5] px-3 py-2 text-sm"
          />
          <select
            value={shopId}
            onChange={(e) => setShopId(e.target.value)}
            className="rounded-xl border border-[#E5E5E5] bg-white px-3 py-2 text-sm"
          >
            {db.shops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="rounded-xl border border-[#E5E5E5] bg-white px-3 py-2 text-sm"
          >
            {db.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={priceStr}
            onChange={(e) => setPriceStr(e.target.value)}
            placeholder="ราคา (บาท)"
            className="rounded-xl border border-[#E5E5E5] px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="btn-tactile inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#A6192E] px-4 py-2 text-sm font-semibold text-white"
          >
            <PlusCircle className="h-4 w-4" />
            <span>เพิ่มเมนู</span>
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-[#E5E5E5] bg-white p-6 divide-y divide-[#E5E5E5]">
        {db.products.map((prod) => {
          const shop = db.shops.find((s) => s.id === prod.shop_id);
          return (
            <div
              key={prod.id}
              className="py-3.5 flex items-center justify-between gap-4"
            >
              <div>
                <p className="font-bold text-sm text-[#222222]">{prod.name}</p>
                <p className="text-sm text-[#525252]">
                  {shop?.name} • {formatPrice(prod.price)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => deleteProduct(prod.id)}
                className="rounded-lg border border-[#E5E5E5] p-2 text-[#525252] hover:text-[#DC2626]"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
