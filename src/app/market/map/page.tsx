"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  MapPin,
  Navigation,
  Grid,
  Map as MapIcon,
  Info,
  Store,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { useMarket } from "@/context/MarketContext";
import { DynamicCampusMap } from "@/components/DynamicCampusMap";
import { getShopOpeningStatus, SHOP_TYPE_LABELS } from "@/lib/utils";

export default function MarketMapPage() {
  const { db, showToast } = useMarket();

  const [viewMode, setViewMode] = useState<"both" | "campus" | "stalls">("both");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDay, setSelectedDay] = useState("all");
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);

  const filteredShops = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return db.shops.filter((shop) => {
      if (shop.status !== "active") return false;
      if (q) {
        const match =
          shop.name.toLowerCase().includes(q) ||
          shop.building_name.toLowerCase().includes(q) ||
          (shop.stall_number || "").toLowerCase().includes(q);
        if (!match) return false;
      }
      if (selectedCategory !== "all" && shop.category_id !== selectedCategory) {
        return false;
      }
      if (selectedDay !== "all") {
        const dayNum = Number(selectedDay);
        const openOnDay = db.shop_schedules.some(
          (sc) =>
            sc.shop_id === shop.id && sc.day_of_week === dayNum && sc.is_open
        );
        if (!openOnDay) return false;
      }
      return true;
    });
  }, [db.shop_schedules, db.shops, searchQuery, selectedCategory, selectedDay]);

  const handleRequestGeolocation = () => {
    if (!navigator.geolocation) {
      showToast("เบราว์เซอร์ของคุณไม่รองรับการระบุตำแหน่ง", "error");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords([pos.coords.latitude, pos.coords.longitude]);
        showToast("แสดงตำแหน่งปัจจุบันของคุณบนแผนที่แล้ว", "success");
      },
      () => {
        showToast(
          "ไม่สามารถเข้าถึงตำแหน่งได้ (กรุณาอนุญาตการเข้าถึงพิกัดในเบราว์เซอร์)",
          "info"
        );
      }
    );
  };

  const zones = [
    "Zone A (อาหารและเครื่องดื่ม)",
    "Zone B (ขนมและของทานเล่น)",
    "Zone C (แฟชั่นและสินค้าทั่วไป)",
  ] as const;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="rounded-3xl border border-[#E5E5E5] bg-[#FFF8F0] p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-[#222222]">
            แผนที่ร้านค้า มจธ. & ผังล็อกตลาดนัด (อาคาร S2)
          </h1>
          <p className="text-base text-[#525252] mt-1.5">
            สำรวจพิกัดอาคารจริงทั่วมหาวิทยาลัย (S14, S2, S11, S6, N10, N2) และผังล็อกจำลองของตลาดนัด มจธ.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode("both")}
            className={`btn-tactile rounded-xl px-4 py-2.5 text-sm font-semibold ${
              viewMode === "both"
                ? "bg-[#A6192E] text-white"
                : "bg-white border border-[#E5E5E5] text-[#222222]"
            }`}
          >
            แสดงทั้งแผนที่ & ผังล็อก
          </button>
          <button
            type="button"
            onClick={() => setViewMode("campus")}
            className={`btn-tactile inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold ${
              viewMode === "campus"
                ? "bg-[#A6192E] text-white"
                : "bg-white border border-[#E5E5E5] text-[#222222]"
            }`}
          >
            <MapIcon className="h-4 w-4" />
            แผนที่มหาวิทยาลัย
          </button>
          <button
            type="button"
            onClick={() => setViewMode("stalls")}
            className={`btn-tactile inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold ${
              viewMode === "stalls"
                ? "bg-[#A6192E] text-white"
                : "bg-white border border-[#E5E5E5] text-[#222222]"
            }`}
          >
            <Grid className="h-4 w-4" />
            ผังล็อกตลาดนัด S2
          </button>
        </div>
      </div>

      {/* Map Filters & Controls */}
      <div className="rounded-2xl border border-[#E5E5E5] bg-white p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
        <div className="lg:col-span-5 flex items-center rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] px-3.5 py-2">
          <Search className="h-5 w-5 text-[#A6192E] mr-2 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อร้าน อาคาร (S14, S2, S11) หรือหมายเลขล็อก..."
            className="w-full bg-transparent text-sm text-[#222222] focus:outline-none"
          />
        </div>

        <div className="lg:col-span-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full rounded-xl border border-[#E5E5E5] bg-white px-3 py-2 text-sm text-[#222222]"
          >
            <option value="all">ทุกหมวดหมู่ร้านค้า</option>
            {db.categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-2">
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            className="w-full rounded-xl border border-[#E5E5E5] bg-white px-3 py-2 text-sm text-[#222222]"
          >
            <option value="all">ทุกวันเปิดขาย</option>
            <option value="2">วันอังคาร (ตลาดชุมชน)</option>
            <option value="3">วันพุธ (ตลาด มจธ.)</option>
            <option value="4">วันพฤหัสบดี (ตลาด มจธ.)</option>
            <option value="1">วันจันทร์–ศุกร์</option>
          </select>
        </div>

        <div className="lg:col-span-2">
          <button
            type="button"
            onClick={handleRequestGeolocation}
            className="btn-tactile w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#222222] px-3 py-2 text-sm font-semibold text-white hover:bg-[#761626]"
          >
            <Navigation className="h-4 w-4" />
            <span>ตำแหน่งของฉัน</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: LEAFLET OPENSTREETMAP CAMPUS VIEW */}
      {(viewMode === "both" || viewMode === "campus") && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-3">
            <DynamicCampusMap
              shops={filteredShops}
              categories={db.categories}
              schedules={db.shop_schedules}
              selectedShopId={selectedShopId}
              userCoords={userCoords}
              heightClass="h-[540px]"
            />
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-[#525252] px-1">
              <div className="flex flex-wrap items-center gap-4">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-[#B45309]" />
                  ศูนย์อาหาร S14
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-[#16A34A]" />
                  ร้านค้าประจำตามอาคาร
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-[#A6192E]" />
                  โซนลานตลาดนัด S2 (ตำแหน่งโดยประมาณ)
                </span>
              </div>
              <span>คลิกที่หมุดบนแผนที่เพื่อดูรูปและลิงก์ร้านค้า</span>
            </div>
          </div>

          {/* Interactive Sidebar Shop List */}
          <div className="lg:col-span-4 rounded-2xl border border-[#E5E5E5] bg-white p-4 flex flex-col h-[540px]">
            <div className="pb-3 mb-3 border-b border-[#E5E5E5] flex items-center justify-between">
              <h2 className="font-heading text-base font-bold text-[#222222]">
                รายชื่อร้านบนแผนที่ ({filteredShops.length})
              </h2>
              {selectedShopId && (
                <button
                  type="button"
                  onClick={() => setSelectedShopId(null)}
                  className="text-sm text-[#A6192E] hover:underline"
                >
                  รีเซ็ตจุดโฟกัส
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {filteredShops.map((shop) => {
                const opening = getShopOpeningStatus(shop, db.shop_schedules);
                const isSelected = selectedShopId === shop.id;
                return (
                  <div
                    key={shop.id}
                    onClick={() => setSelectedShopId(shop.id)}
                    className={`cursor-pointer rounded-xl border p-3 transition-colors ${
                      isSelected
                        ? "border-[#A6192E] bg-[#FFF8F0]"
                        : "border-[#E5E5E5] bg-[#FAFAFA] hover:bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-heading text-sm font-bold text-[#222222]">
                        {shop.name}
                      </h3>
                      <span className="shrink-0 rounded-md bg-white border border-[#E5E5E5] px-2 py-0.5 text-sm font-semibold text-[#A6192E]">
                        {shop.stall_number ||
                          shop.building_name.match(/S\d+|N\d+/)?.[0] ||
                          "มจธ."}
                      </span>
                    </div>
                    <p className="text-sm text-[#525252] mt-1">
                      {shop.building_name}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="text-[#16A34A] font-medium">
                        {opening.openDaysLabel}
                      </span>
                      <Link
                        href={`/shops/${shop.slug}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 font-semibold text-[#A6192E] hover:underline"
                      >
                        <span>ดูร้าน</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* SECTION 2: ILLUSTRATIVE MARKET STALL LAYOUT GRID (ผังล็อกตลาดนัดจำลอง อาคาร S2) */}
      {(viewMode === "both" || viewMode === "stalls") && (
        <section className="rounded-3xl border border-[#E5E5E5] bg-white p-6 sm:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E5E5E5]">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF8F0] border border-[#A6192E]/25 px-3 py-1 text-sm font-semibold text-[#A6192E] mb-2">
                ผังล็อกตลาดนัดจำลอง (Illustrative Market Stall Layout)
              </span>
              <h2 className="font-heading text-2xl font-bold text-[#222222]">
                ผังโซนตลาดนัด มจธ. (ลานชั้น 1 อาคารจอดรถ S2)
              </h2>
              <p className="text-sm text-[#525252] mt-1">
                ขนาดล็อกมาตรฐาน 180 × 200 ซม. • หมายเหตุ: ตำแหน่งล็อกด้านล่างเป็นผังจำลองเพื่อแสดงการจัดโซนร้านค้า
                ผู้ดูแลระบบสามารถปรับย้ายและยืนยันหมายเลขล็อกได้ในหน้า{" "}
                <Link
                  href="/admin/market/locations"
                  className="text-[#A6192E] font-semibold underline"
                >
                  จัดการผังตลาดนัด (Admin)
                </Link>
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {zones.map((zoneName) => {
              const stallsInZone = db.market_stalls.filter(
                (st) => st.zone === zoneName
              );
              return (
                <div
                  key={zoneName}
                  className="rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA] p-5 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading text-lg font-bold text-[#222222]">
                      {zoneName}
                    </h3>
                    <span className="text-sm text-[#525252]">
                      จำนวน {stallsInZone.length} ล็อก
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stallsInZone.map((stall) => {
                      const assignedShop = db.shops.find(
                        (s) => s.id === stall.shop_id
                      );
                      return (
                        <div
                          key={stall.id}
                          className={`rounded-xl border p-4 flex flex-col justify-between ${
                            assignedShop
                              ? "border-[#A6192E]/35 bg-white shadow-xs"
                              : "border-dashed border-[#E5E5E5] bg-white/60"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="rounded-lg bg-[#A6192E] px-2.5 py-0.5 text-sm font-bold text-white tabular-nums">
                                ล็อก {stall.stall_number}
                              </span>
                              {assignedShop ? (
                                <span className="text-sm font-medium text-[#F59E0B]">
                                  {stall.location_verified
                                    ? "ยืนยันพิกัดล็อก"
                                    : "ผังจำลองโดยประมาณ"}
                                </span>
                              ) : (
                                <span className="text-sm text-[#525252]">
                                  ล็อกว่าง
                                </span>
                              )}
                            </div>

                            {assignedShop ? (
                              <>
                                <h4 className="font-heading text-base font-bold text-[#222222]">
                                  {assignedShop.name}
                                </h4>
                                <p className="text-sm text-[#525252] mt-1 line-clamp-2">
                                  {assignedShop.description}
                                </p>
                              </>
                            ) : (
                              <p className="text-sm text-[#525252] py-3">
                                พื้นที่ว่างสำหรับจัดสรรร้านค้าตลาดนัด (180 × 200 ซม.)
                              </p>
                            )}
                          </div>

                          {assignedShop && (
                            <div className="mt-3 pt-2.5 border-t border-[#E5E5E5]">
                              <Link
                                href={`/shops/${assignedShop.slug}`}
                                className="inline-flex items-center gap-1 text-sm font-semibold text-[#A6192E] hover:underline"
                              >
                                <Store className="h-4 w-4" />
                                <span>ดูข้อมูลร้านค้า</span>
                              </Link>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
