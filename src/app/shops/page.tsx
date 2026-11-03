"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  X,
  RotateCcw,
  Filter,
  ShieldCheck,
  Sparkles,
  Store,
} from "lucide-react";
import { useMarket } from "@/context/MarketContext";
import { ShopCard } from "@/components/ShopCard";
import { getShopOpeningStatus } from "@/lib/utils";

function ShopsDirectoryContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") || "";
  const initialCat = searchParams.get("category") || "all";
  const initialBuilding = searchParams.get("building") || "all";

  const { db, setIsCravingPickerOpen } = useMarket();

  const [rawSearch, setRawSearch] = useState(initialQ);
  const [debouncedSearch, setDebouncedSearch] = useState(initialQ);
  const [selectedCategory, setSelectedCategory] = useState(initialCat);
  const [selectedShopType, setSelectedShopType] = useState("all");
  const [selectedDay, setSelectedDay] = useState("all");
  const [selectedOpenStatus, setSelectedOpenStatus] = useState("all");
  const [selectedPriceRange, setSelectedPriceRange] = useState("all");
  const [selectedBuilding, setSelectedBuilding] = useState(initialBuilding);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState("recommended");
  const [visibleCount, setVisibleCount] = useState(9);

  // Sync URL params when navigated
  useEffect(() => {
    const qParam = searchParams.get("q");
    const catParam = searchParams.get("category");
    if (qParam !== null) {
      setRawSearch(qParam);
      setDebouncedSearch(qParam);
    }
    if (catParam !== null) {
      setSelectedCategory(catParam);
    }
  }, [searchParams]);

  // Debounce search input (250ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(rawSearch);
    }, 250);
    return () => clearTimeout(timer);
  }, [rawSearch]);

  const activeShops = useMemo(
    () => db.shops.filter((s) => s.status === "active"),
    [db.shops]
  );

  // Precompute min/max product price per shop for sorting
  const shopPriceBounds = useMemo(() => {
    const map = new Map<string, { min: number; max: number }>();
    db.products.forEach((p) => {
      if (p.price === null || p.price === undefined) return;
      const cur = map.get(p.shop_id);
      if (!cur) {
        map.set(p.shop_id, { min: p.price, max: p.price });
      } else {
        map.set(p.shop_id, {
          min: Math.min(cur.min, p.price),
          max: Math.max(cur.max, p.price),
        });
      }
    });
    return map;
  }, [db.products]);

  const buildingsList = useMemo(() => {
    const set = new Set<string>();
    activeShops.forEach((s) => {
      if (s.building_name) set.add(s.building_name);
    });
    return Array.from(set);
  }, [activeShops]);

  const filteredAndSortedShops = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();

    const filtered = activeShops.filter((shop) => {
      // 1. Search by shop name, product/menu name, category, description
      if (q) {
        const cat = db.categories.find((c) => c.id === shop.category_id);
        const shopProducts = db.products.filter((p) => p.shop_id === shop.id);
        const matchShopName = shop.name.toLowerCase().includes(q);
        const matchDesc = shop.description.toLowerCase().includes(q);
        const matchBuilding = shop.building_name.toLowerCase().includes(q);
        const matchTags = shop.tags.some((t) => t.toLowerCase().includes(q));
        const matchCat = cat?.name.toLowerCase().includes(q) || false;
        const matchProd = shopProducts.some(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q)
        );
        if (
          !matchShopName &&
          !matchDesc &&
          !matchBuilding &&
          !matchTags &&
          !matchCat &&
          !matchProd
        ) {
          return false;
        }
      }

      // 2. Category filter
      if (selectedCategory !== "all" && shop.category_id !== selectedCategory) {
        return false;
      }

      // 3. Shop / Market type filter
      if (selectedShopType !== "all" && shop.shop_type !== selectedShopType) {
        return false;
      }

      // 4. Market day filter
      if (selectedDay !== "all") {
        const dayNum = Number(selectedDay);
        const isOpenOnDay = db.shop_schedules.some(
          (sc) =>
            sc.shop_id === shop.id && sc.day_of_week === dayNum && sc.is_open
        );
        if (!isOpenOnDay) return false;
      }

      // 5. Opening status filter
      if (selectedOpenStatus !== "all") {
        const op = getShopOpeningStatus(shop, db.shop_schedules);
        if (selectedOpenStatus === "open_today" && !op.isOpenToday) return false;
        if (selectedOpenStatus === "open_now" && !op.isOpenNow) return false;
      }

      // 6. Price range filter
      if (
        selectedPriceRange !== "all" &&
        shop.price_range !== selectedPriceRange
      ) {
        return false;
      }

      // 7. Building filter
      if (
        selectedBuilding !== "all" &&
        shop.building_name !== selectedBuilding
      ) {
        return false;
      }

      // 8. Verified only
      if (verifiedOnly && shop.verification_status !== "verified") {
        return false;
      }

      return true;
    });

    // Sorting
    return [...filtered].sort((a, b) => {
      if (sortBy === "recommended") {
        if (a.is_recommended !== b.is_recommended) {
          return a.is_recommended ? -1 : 1;
        }
        return a.name.localeCompare(b.name, "th");
      }
      if (sortBy === "name_asc") {
        return a.name.localeCompare(b.name, "th");
      }
      if (sortBy === "recent") {
        return (
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
      }
      if (sortBy === "price_asc") {
        const minA = shopPriceBounds.get(a.id)?.min ?? 9999;
        const minB = shopPriceBounds.get(b.id)?.min ?? 9999;
        return minA - minB;
      }
      if (sortBy === "price_desc") {
        const maxA = shopPriceBounds.get(a.id)?.max ?? 0;
        const maxB = shopPriceBounds.get(b.id)?.max ?? 0;
        return maxB - maxA;
      }
      return 0;
    });
  }, [
    activeShops,
    db.categories,
    db.products,
    db.shop_schedules,
    debouncedSearch,
    selectedBuilding,
    selectedCategory,
    selectedDay,
    selectedOpenStatus,
    selectedPriceRange,
    selectedShopType,
    shopPriceBounds,
    sortBy,
    verifiedOnly,
  ]);

  const handleResetFilters = () => {
    setRawSearch("");
    setDebouncedSearch("");
    setSelectedCategory("all");
    setSelectedShopType("all");
    setSelectedDay("all");
    setSelectedOpenStatus("all");
    setSelectedPriceRange("all");
    setSelectedBuilding("all");
    setVerifiedOnly(false);
    setSortBy("recommended");
    setVisibleCount(9);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="rounded-3xl border border-[#E5E5E5] bg-[#FFF8F0] p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-[#222222]">
            ทำเนียบร้านค้าและของกินใน มจธ.
          </h1>
          <p className="text-base text-[#525252] mt-1.5 max-w-2xl">
            ค้นหาร้านอาหารตามสั่ง ข้าวราดแกง ก๋วยเตี๋ยว ฮาลาล คาเฟ่ และร้านตลาดนัดในรั้วบางมด
            กรองตามตึกเรียน วันเปิดขาย และช่วงราคาได้ทันที
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsCravingPickerOpen(true)}
          className="btn-tactile self-start lg:self-auto inline-flex items-center gap-2 rounded-xl bg-[#A6192E] px-5 py-3 text-sm font-semibold text-white hover:bg-[#761626]"
        >
          <Sparkles className="h-4 w-4" />
          <span>ให้ระบบช่วยสุ่มร้านเด็ดวันนี้</span>
        </button>
      </div>

      {/* Search & Filters Panel */}
      <div className="rounded-2xl border border-[#E5E5E5] bg-white p-5 sm:p-6 space-y-5 shadow-xs">
        {/* Top Row: Search Input + Sort Dropdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 relative">
            <div className="flex items-center rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] px-3.5 py-2.5 focus-within:border-[#A6192E] focus-within:bg-white">
              <Search className="h-5 w-5 text-[#A6192E] shrink-0 mr-2.5" />
              <input
                type="text"
                value={rawSearch}
                onChange={(e) => setRawSearch(e.target.value)}
                placeholder="ค้นหาชื่อร้าน เมนูอาหาร หมวดหมู่ หรือชื่อตึก (เช่น S14, กะเพรา, ฮาลาล, ลุงกบ)..."
                aria-label="ค้นหาร้านค้าและเมนูอาหาร"
                className="w-full bg-transparent text-base text-[#222222] placeholder:text-[#737373] focus:outline-none"
              />
              {rawSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setRawSearch("");
                    setDebouncedSearch("");
                  }}
                  aria-label="ล้างคำค้นหา"
                  className="rounded-lg p-1 text-[#525252] hover:bg-[#E5E5E5]/50 hover:text-[#222222]"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-4 flex items-center gap-2">
            <label
              htmlFor="shop-sort-select"
              className="text-sm font-semibold text-[#222222] shrink-0"
            >
              เรียงตาม:
            </label>
            <select
              id="shop-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] px-3.5 py-2.5 text-sm font-medium text-[#222222] focus:border-[#A6192E] focus:outline-none"
            >
              <option value="recommended">ร้านแนะนำ (Recommended)</option>
              <option value="name_asc">ชื่อร้าน ก–ฮ / A–Z</option>
              <option value="recent">อัปเดตข้อมูลล่าสุด</option>
              <option value="price_asc">ราคาเมนูเริ่มต้นต่ำสุด</option>
              <option value="price_desc">ราคาเมนูสูงสุด</option>
            </select>
          </div>
        </div>

        {/* Filter Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 pt-2 border-t border-[#E5E5E5]">
          <div>
            <label className="block text-sm font-medium text-[#525252] mb-1">
              หมวดหมู่ร้านค้า
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-xl border border-[#E5E5E5] bg-white px-3 py-2 text-sm text-[#222222] focus:border-[#A6192E] focus:outline-none"
            >
              <option value="all">ทุกหมวดหมู่</option>
              {db.categories
                .filter((c) => c.is_active)
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#525252] mb-1">
              ประเภทร้าน / ตลาด
            </label>
            <select
              value={selectedShopType}
              onChange={(e) => setSelectedShopType(e.target.value)}
              className="w-full rounded-xl border border-[#E5E5E5] bg-white px-3 py-2 text-sm text-[#222222] focus:border-[#A6192E] focus:outline-none"
            >
              <option value="all">ทุกประเภทร้าน</option>
              <option value="campus_food_court">ศูนย์อาหาร มจธ. (S14)</option>
              <option value="permanent_shop">ร้านประจำตามตึกใน มจธ.</option>
              <option value="market_stall">ร้านแผงลอยตลาดนัด มจธ.</option>
              <option value="nearby_shop">ร้านเด็ดรอบรั้วบางมด</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#525252] mb-1">
              วันที่เปิดขาย
            </label>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="w-full rounded-xl border border-[#E5E5E5] bg-white px-3 py-2 text-sm text-[#222222] focus:border-[#A6192E] focus:outline-none"
            >
              <option value="all">ทุกวัน</option>
              <option value="2">วันอังคาร (ตลาดนัดชุมชน)</option>
              <option value="3">วันพุธ (ตลาดนัด มจธ.)</option>
              <option value="4">วันพฤหัสบดี (ตลาดนัด มจธ.)</option>
              <option value="1">วันจันทร์</option>
              <option value="5">วันศุกร์</option>
              <option value="6">วันเสาร์</option>
              <option value="0">วันอาทิตย์</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#525252] mb-1">
              สถานะการเปิดร้าน
            </label>
            <select
              value={selectedOpenStatus}
              onChange={(e) => setSelectedOpenStatus(e.target.value)}
              className="w-full rounded-xl border border-[#E5E5E5] bg-white px-3 py-2 text-sm text-[#222222] focus:border-[#A6192E] focus:outline-none"
            >
              <option value="all">ทุกสถานะ</option>
              <option value="open_today">เปิดขายในวันนี้</option>
              <option value="open_now">เปิดอยู่ตอนนี้</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#525252] mb-1">
              อาคาร / โซนที่ตั้ง
            </label>
            <select
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
              className="w-full rounded-xl border border-[#E5E5E5] bg-white px-3 py-2 text-sm text-[#222222] focus:border-[#A6192E] focus:outline-none"
            >
              <option value="all">ทุกอาคารและโซน</option>
              {buildingsList.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#525252] mb-1">
              ระดับราคา
            </label>
            <select
              value={selectedPriceRange}
              onChange={(e) => setSelectedPriceRange(e.target.value)}
              className="w-full rounded-xl border border-[#E5E5E5] bg-white px-3 py-2 text-sm text-[#222222] focus:border-[#A6192E] focus:outline-none"
            >
              <option value="all">ทุกระดับราคา</option>
              <option value="฿">฿ (ประหยัด 15–55 บ.)</option>
              <option value="฿฿">฿฿ (ปานกลาง 55–120 บ.)</option>
              <option value="฿฿฿">฿฿฿ (พรีเมียม 100+ บ.)</option>
            </select>
          </div>
        </div>

        {/* Bottom Filter Bar: Verified Checkbox + Result Count + Reset */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[#E5E5E5]">
          <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-[#222222]">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="h-4 w-4 rounded border-[#E5E5E5] accent-[#A6192E]"
            />
            <ShieldCheck className="h-4 w-4 text-[#16A34A]" />
            <span>แสดงเฉพาะร้านที่ยืนยันข้อมูลแล้ว (Verified BPUU)</span>
          </label>

          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-[#222222] tabular-nums">
              พบร้านค้า {filteredAndSortedShops.length} ร้าน
            </span>
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn-tactile inline-flex items-center gap-1.5 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] px-3.5 py-2 text-sm font-medium text-[#222222] hover:border-[#A6192E] hover:text-[#A6192E]"
            >
              <RotateCcw className="h-4 w-4" />
              <span>ล้างตัวกรอง</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results Grid or Empty State */}
      {filteredAndSortedShops.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedShops.slice(0, visibleCount).map((shop) => (
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </div>

          {visibleCount < filteredAndSortedShops.length && (
            <div className="text-center pt-4">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + 9)}
                className="btn-tactile inline-flex items-center gap-2 rounded-xl border border-[#A6192E] bg-white px-6 py-3 text-base font-semibold text-[#A6192E] hover:bg-[#A6192E] hover:text-white"
              >
                <span>
                  โหลดร้านค้าเพิ่มเติม (แสดงแล้ว {visibleCount} จาก{" "}
                  {filteredAndSortedShops.length} ร้าน)
                </span>
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-3xl border border-[#E5E5E5] bg-white p-12 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF8F0] text-[#A6192E]">
            <Store className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h2 className="font-heading text-xl font-bold text-[#222222]">
              ไม่พบร้านค้าที่ตรงกับเงื่อนไขการค้นหา
            </h2>
            <p className="text-sm text-[#525252] max-w-md mx-auto">
              ลองเปลี่ยนคำค้นหา เลือกหมวดหมู่อื่น หรือกดล้างตัวกรองเพื่อดูร้านค้าทั้งหมดใน มจธ.
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            className="btn-tactile inline-flex items-center gap-2 rounded-xl bg-[#A6192E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#761626]"
          >
            <RotateCcw className="h-4 w-4" />
            <span>ล้างตัวกรองทั้งหมด</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function ShopsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-12 text-center text-base text-[#525252]">
          กำลังโหลดทำเนียบร้านค้า...
        </div>
      }
    >
      <ShopsDirectoryContent />
    </Suspense>
  );
}
