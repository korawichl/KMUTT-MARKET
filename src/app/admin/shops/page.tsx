"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PlusCircle, Edit, Trash2, Search } from "lucide-react";
import { useMarket } from "@/context/MarketContext";
import { SHOP_TYPE_LABELS } from "@/lib/utils";

export default function AdminShopsPage() {
  const { db, deleteShop, upsertShop } = useMarket();
  const [search, setSearch] = useState("");

  const filtered = db.shops.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.building_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="rounded-2xl border border-[#E5E5E5] bg-white p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#222222]">
            จัดการร้านค้าทั้งหมด ({db.shops.length} ร้าน)
          </h1>
          <p className="text-sm text-[#525252]">
            เพิ่ม แก้ไข ปรับสถานะการยืนยัน หรือลบร้านค้าในระบบ
          </p>
        </div>
        <Link
          href="/admin/shops/new"
          className="btn-tactile inline-flex items-center gap-2 rounded-xl bg-[#A6192E] px-4 py-2.5 text-sm font-semibold text-white"
        >
          <PlusCircle className="h-4 w-4" />
          <span>เพิ่มร้านค้าใหม่</span>
        </Link>
      </div>

      <div className="flex items-center rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] px-3.5 py-2">
        <Search className="h-4 w-4 text-[#A6192E] mr-2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาชื่อร้านหรือชื่ออาคาร..."
          className="w-full bg-transparent text-sm focus:outline-none"
        />
      </div>

      <div className="divide-y divide-[#E5E5E5]">
        {filtered.map((shop) => (
          <div
            key={shop.id}
            className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3.5">
              <img
                src={shop.cover_image_url}
                alt={shop.name}
                className="h-14 w-14 rounded-xl object-cover border border-[#E5E5E5]"
              />
              <div>
                <h2 className="font-heading text-base font-bold text-[#222222]">
                  {shop.name}
                </h2>
                <p className="text-sm text-[#525252]">
                  {SHOP_TYPE_LABELS[shop.shop_type].label} •{" "}
                  {shop.building_name}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  upsertShop({
                    ...shop,
                    is_recommended: !shop.is_recommended,
                  })
                }
                className={`rounded-lg px-3 py-1.5 text-sm font-medium border ${
                  shop.is_recommended
                    ? "border-[#A6192E] bg-[#FFF8F0] text-[#A6192E]"
                    : "border-[#E5E5E5] text-[#525252]"
                }`}
              >
                {shop.is_recommended ? "ร้านแนะนำ" : "ตั้งเป็นร้านแนะนำ"}
              </button>

              <Link
                href={`/admin/shops/${shop.id}/edit`}
                className="inline-flex items-center gap-1 rounded-lg border border-[#E5E5E5] px-3 py-1.5 text-sm font-medium text-[#222222] hover:border-[#A6192E]"
              >
                <Edit className="h-3.5 w-3.5" />
                <span>แก้ไข</span>
              </Link>

              <button
                type="button"
                onClick={() => deleteShop(shop.id)}
                aria-label={`ลบร้าน ${shop.name}`}
                className="rounded-lg border border-[#E5E5E5] p-2 text-[#525252] hover:text-[#DC2626]"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
