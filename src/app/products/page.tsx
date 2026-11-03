"use client";

import React, { useState, useMemo } from "react";
import { Search, RotateCcw, Utensils } from "lucide-react";
import { useMarket } from "@/context/MarketContext";
import { ProductCard } from "@/components/ProductCard";

export default function ProductsPage() {
  const { db } = useMarket();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedShop, setSelectedShop] = useState("all");
  const [maxPrice, setMaxPrice] = useState("all");
  const [availableOnly, setAvailableOnly] = useState(true);
  const [sortBy, setSortBy] = useState("recommended");

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = db.products.filter((prod) => {
      if (availableOnly && !prod.is_available) return false;
      if (selectedCategory !== "all" && prod.category_id !== selectedCategory)
        return false;
      if (selectedShop !== "all" && prod.shop_id !== selectedShop) return false;
      if (maxPrice !== "all") {
        if (prod.price === null || prod.price > Number(maxPrice)) return false;
      }
      if (q) {
        const shop = db.shops.find((s) => s.id === prod.shop_id);
        const matchName = prod.name.toLowerCase().includes(q);
        const matchDesc = prod.description.toLowerCase().includes(q);
        const matchShop = shop?.name.toLowerCase().includes(q) || false;
        if (!matchName && !matchDesc && !matchShop) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === "price_asc") {
        return (a.price ?? 9999) - (b.price ?? 9999);
      }
      if (sortBy === "price_desc") {
        return (b.price ?? 0) - (a.price ?? 0);
      }
      if (a.is_recommended !== b.is_recommended) {
        return a.is_recommended ? -1 : 1;
      }
      return a.name.localeCompare(b.name, "th");
    });
  }, [
    availableOnly,
    db.products,
    db.shops,
    maxPrice,
    search,
    selectedCategory,
    selectedShop,
    sortBy,
  ]);

  const handleReset = () => {
    setSearch("");
    setSelectedCategory("all");
    setSelectedShop("all");
    setMaxPrice("all");
    setAvailableOnly(true);
    setSortBy("recommended");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="rounded-3xl border border-[#E5E5E5] bg-[#FFF8F0] p-6 sm:p-8">
        <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-[#222222]">
          ค้นหาเมนูอาหาร เครื่องดื่ม และสินค้า
        </h1>
        <p className="text-base text-[#525252] mt-1.5">
          เปรียบเทียบเมนูโปรด กรองตามงบประมาณ หมวดหมู่อาหาร หรือเลือกร้านค้าใน มจธ.
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-[#E5E5E5] bg-white p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2 flex items-center rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] px-3.5 py-2">
            <Search className="h-5 w-5 text-[#A6192E] mr-2 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อเมนู เช่น ข้าวยำไก่แซ่บ, ข้าวหมกไก่, บะหมี่เกี๊ยว, มัทฉะ..."
              className="w-full bg-transparent text-sm text-[#222222] focus:outline-none"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-xl border border-[#E5E5E5] bg-white px-3 py-2 text-sm text-[#222222]"
          >
            <option value="all">ทุกหมวดหมู่</option>
            {db.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedShop}
            onChange={(e) => setSelectedShop(e.target.value)}
            className="rounded-xl border border-[#E5E5E5] bg-white px-3 py-2 text-sm text-[#222222]"
          >
            <option value="all">ทุกร้านค้า</option>
            {db.shops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="rounded-xl border border-[#E5E5E5] bg-white px-3 py-2 text-sm text-[#222222]"
          >
            <option value="all">ทุกราคา</option>
            <option value="40">ไม่เกิน 40 บาท</option>
            <option value="50">ไม่เกิน 50 บาท</option>
            <option value="70">ไม่เกิน 70 บาท</option>
            <option value="100">ไม่เกิน 100 บาท</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[#E5E5E5]">
          <div className="flex flex-wrap items-center gap-4">
            <label className="inline-flex items-center gap-2 text-sm font-medium text-[#222222] cursor-pointer">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
                className="h-4 w-4 accent-[#A6192E]"
              />
              <span>แสดงเฉพาะเมนูที่พร้อมจำหน่าย</span>
            </label>

            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-[#222222]">เรียงราคา:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] px-2.5 py-1.5 text-sm"
              >
                <option value="recommended">เมนูแนะนำ</option>
                <option value="price_asc">ราคาต่ำไปสูง</option>
                <option value="price_desc">ราคาสูงไปต่ำ</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-[#222222] tabular-nums">
              พบ {filteredProducts.length} เมนู
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E5E5] px-3 py-1.5 text-sm font-medium text-[#222222] hover:border-[#A6192E]"
            >
              <RotateCcw className="h-4 w-4" />
              ล้างตัวกรอง
            </button>
          </div>
        </div>
      </div>

      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-[#E5E5E5] bg-white p-12 text-center space-y-3">
          <Utensils className="mx-auto h-8 w-8 text-[#A6192E]" />
          <p className="text-lg font-bold text-[#222222]">
            ไม่พบเมนูที่ตรงกับตัวกรอง
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-xl bg-[#A6192E] px-4 py-2 text-sm font-semibold text-white"
          >
            แสดงเมนูทั้งหมด
          </button>
        </div>
      )}
    </div>
  );
}
