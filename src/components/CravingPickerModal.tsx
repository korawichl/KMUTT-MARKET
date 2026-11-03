"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Sparkles,
  X,
  RefreshCw,
  MapPin,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Info,
  Utensils,
} from "lucide-react";
import { useMarket } from "@/context/MarketContext";
import { formatPrice, getShopOpeningStatus } from "@/lib/utils";

export function CravingPickerAndToasts() {
  const {
    db,
    isCravingPickerOpen,
    setIsCravingPickerOpen,
    toasts,
    dismissToast,
  } = useMarket();

  const [selectedZone, setSelectedZone] = useState<string>("all");
  const [selectedBudget, setSelectedBudget] = useState<string>("all");
  const [selectedMood, setSelectedMood] = useState<string>("all");
  const [pickedIndex, setPickedIndex] = useState<number>(0);
  const [spinSeed, setSpinSeed] = useState<number>(1);

  const activeShops = useMemo(
    () => db.shops.filter((s) => s.status === "active"),
    [db.shops]
  );

  const matchingCandidates = useMemo(() => {
    return activeShops.filter((shop) => {
      if (selectedZone !== "all") {
        if (selectedZone === "s14" && !shop.building_name.includes("S14")) return false;
        if (selectedZone === "s2" && !shop.building_name.includes("S2")) return false;
        if (
          selectedZone === "class" &&
          !shop.building_name.includes("S11") &&
          !shop.building_name.includes("N10") &&
          !shop.building_name.includes("N2") &&
          !shop.building_name.includes("ศิลปศาสตร์")
        )
          return false;
        if (selectedZone === "nearby" && shop.shop_type !== "nearby_shop" && !shop.building_name.includes("หน้ามหาวิทยาลัย"))
          return false;
      }

      if (selectedBudget === "budget" && shop.price_range !== "฿") return false;

      if (selectedMood !== "all") {
        const cat = db.categories.find((c) => c.id === shop.category_id);
        const slug = cat?.slug || "";
        if (
          selectedMood === "meal" &&
          !["made-to-order", "single-dish", "noodles", "isaan-food", "halal-food"].includes(slug)
        )
          return false;
        if (
          selectedMood === "cafe" &&
          !["coffee", "milk-tea", "beverages"].includes(slug)
        )
          return false;
        if (
          selectedMood === "snack" &&
          !["fried-snacks", "bakery-desserts", "fruits"].includes(slug)
        )
          return false;
        if (selectedMood === "halal" && slug !== "halal-food" && !shop.tags.includes("ฮาลาล"))
          return false;
      }

      return true;
    });
  }, [activeShops, db.categories, selectedBudget, selectedMood, selectedZone]);

  const currentPick = useMemo(() => {
    if (matchingCandidates.length === 0) return null;
    const idx = (pickedIndex + spinSeed) % matchingCandidates.length;
    return matchingCandidates[idx];
  }, [matchingCandidates, pickedIndex, spinSeed]);

  const currentPickProducts = useMemo(() => {
    if (!currentPick) return [];
    return db.products.filter((p) => p.shop_id === currentPick.id && p.is_available);
  }, [currentPick, db.products]);

  const handleRandomize = () => {
    if (matchingCandidates.length <= 1) {
      setSpinSeed((s) => s + 1);
      return;
    }
    const nextOffset = Math.floor(Math.random() * (matchingCandidates.length - 1)) + 1;
    setPickedIndex((prev) => (prev + nextOffset) % matchingCandidates.length);
  };

  return (
    <>
      {/* Toast Notifications Container */}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-center justify-between gap-3 rounded-xl border border-[#E5E5E5] bg-white px-4 py-3.5 shadow-lg animate-enter"
          >
            <div className="flex items-center gap-2.5">
              {t.type === "success" && (
                <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0" />
              )}
              {t.type === "error" && (
                <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0" />
              )}
              {t.type === "info" && (
                <Info className="w-5 h-5 text-[#A6192E] shrink-0" />
              )}
              <span className="text-sm font-medium text-[#222222]">{t.title}</span>
            </div>
            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              aria-label="ปิดการแจ้งเตือน"
              className="text-[#525252] hover:text-[#222222] p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Craving Picker Modal ("วันนี้กินอะไรดีใน มจธ.?") */}
      {isCravingPickerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="craving-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]"
        >
          <div className="relative w-full max-w-xl rounded-2xl border border-[#E5E5E5] bg-white p-6 shadow-2xl animate-enter max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E5E5E5]">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF8F0] border border-[#A6192E]/25 px-3 py-1 text-sm font-medium text-[#A6192E] mb-2">
                  <Sparkles className="w-4 h-4" />
                  ตัวช่วยตัดสินใจสำหรับชาวบางมด
                </span>
                <h2
                  id="craving-modal-title"
                  className="text-xl sm:text-2xl font-bold text-[#222222]"
                >
                  วันนี้กินอะไรดีใน มจธ.?
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsCravingPickerOpen(false)}
                aria-label="ปิดหน้าต่างสุ่มร้านอาหาร"
                className="rounded-lg border border-[#E5E5E5] p-2 text-[#525252] hover:bg-[#FAFAFA] hover:text-[#222222]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter selectors */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-[#222222] mb-1">
                  โซน / อาคารที่อยู่ใกล้
                </label>
                <select
                  value={selectedZone}
                  onChange={(e) => {
                    setSelectedZone(e.target.value);
                    setPickedIndex(0);
                  }}
                  className="w-full rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] px-3 py-2 text-sm text-[#222222] focus:border-[#A6192E] focus:outline-none"
                >
                  <option value="all">ทุกโซนใน มจธ.</option>
                  <option value="s14">โรงอาหาร S14 (ตึก 190 ปี)</option>
                  <option value="s2">ตึกจอดรถ S2 & ลานตลาดนัด</option>
                  <option value="class">ตึกเรียนรวม S11 / หอสมุด N10 / N2</option>
                  <option value="nearby">หน้า มจธ. & รอบรั้วประชาอุทิศ</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#222222] mb-1">
                  หมวดที่อยากทาน
                </label>
                <select
                  value={selectedMood}
                  onChange={(e) => {
                    setSelectedMood(e.target.value);
                    setPickedIndex(0);
                  }}
                  className="w-full rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] px-3 py-2 text-sm text-[#222222] focus:border-[#A6192E] focus:outline-none"
                >
                  <option value="all">ทุกประเภท (คาว/หวาน/น้ำ)</option>
                  <option value="meal">มื้อหลักอิ่มท้อง (ข้าว/ก๋วยเตี๋ยว)</option>
                  <option value="cafe">กาแฟ / ชานม / เครื่องดื่ม</option>
                  <option value="snack">ของทอด / ขนม / ของทานเล่น</option>
                  <option value="halal">อาหารฮาลาล</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#222222] mb-1">
                  งบประมาณ
                </label>
                <select
                  value={selectedBudget}
                  onChange={(e) => {
                    setSelectedBudget(e.target.value);
                    setPickedIndex(0);
                  }}
                  className="w-full rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] px-3 py-2 text-sm text-[#222222] focus:border-[#A6192E] focus:outline-none"
                >
                  <option value="all">ทุกงบประมาณ</option>
                  <option value="budget">ประหยัด (เฉลี่ย 25–55 บาท)</option>
                </select>
              </div>
            </div>

            {/* Result Display */}
            <div className="mt-5">
              {currentPick ? (
                <div className="rounded-xl border border-[#A6192E]/25 bg-[#FFF8F0] p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    <img
                      src={currentPick.cover_image_url}
                      alt={currentPick.name}
                      className="w-full sm:w-36 h-36 rounded-xl object-cover border border-[#E5E5E5] shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="inline-flex items-center rounded-md bg-[#A6192E] px-2.5 py-0.5 text-sm font-medium text-white">
                          ร้านแนะนำสำหรับคุณ ({matchingCandidates.length} ร้านที่ตรงเงื่อนไข)
                        </span>
                        <span className="text-sm font-medium text-[#16A34A]">
                          {getShopOpeningStatus(currentPick, db.shop_schedules).statusLabel}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-[#222222]">
                        {currentPick.name}
                      </h3>
                      <p className="text-sm text-[#525252] mt-1 line-clamp-2">
                        {currentPick.description}
                      </p>
                      <div className="flex items-center gap-1.5 text-sm text-[#222222] font-medium mt-2">
                        <MapPin className="w-4 h-4 text-[#A6192E] shrink-0" />
                        <span>{currentPick.building_name}</span>
                      </div>

                      {currentPickProducts.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-[#A6192E]/15">
                          <p className="text-sm font-semibold text-[#761626] mb-1">
                            เมนูเด็ดในร้าน:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {currentPickProducts.slice(0, 2).map((prod) => (
                              <span
                                key={prod.id}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-[#E5E5E5] px-2.5 py-1 text-sm text-[#222222]"
                              >
                                <Utensils className="w-3.5 h-3.5 text-[#A6192E]" />
                                {prod.name} ({formatPrice(prod.price)})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#A6192E]/15">
                    <button
                      type="button"
                      onClick={handleRandomize}
                      className="btn-tactile inline-flex items-center gap-2 rounded-xl border border-[#A6192E] bg-white px-4 py-2.5 text-sm font-semibold text-[#A6192E] hover:bg-[#FFF8F0]"
                    >
                      <RefreshCw className="w-4 h-4" />
                      สุ่มร้านใหม่อีกครั้ง
                    </button>

                    <Link
                      href={`/shops/${currentPick.slug}`}
                      onClick={() => setIsCravingPickerOpen(false)}
                      className="btn-tactile inline-flex items-center gap-2 rounded-xl bg-[#A6192E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#761626]"
                    >
                      ดูเมนูและพิกัดร้านนี้
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] p-6 text-center">
                  <p className="text-base font-medium text-[#222222]">
                    ไม่พบร้านค้าที่ตรงกับตัวกรองนี้
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedZone("all");
                      setSelectedMood("all");
                      setSelectedBudget("all");
                    }}
                    className="mt-3 rounded-xl bg-[#A6192E] px-4 py-2 text-sm font-semibold text-white"
                  >
                    ล้างเงื่อนไขทั้งหมด
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
