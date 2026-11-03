"use client";

import React from "react";
import Link from "next/link";
import { Store, Utensils, Calendar, Star, PlusCircle, ExternalLink } from "lucide-react";
import { useMarket } from "@/context/MarketContext";
import { formatPrice, getShopOpeningStatus } from "@/lib/utils";

export default function VendorDashboardPage() {
  const { db, currentUser } = useMarket();

  const myShop =
    db.shops.find((s) => s.owner_id === currentUser?.id) ||
    db.shops.find((s) => s.id === "shop-s11-01") ||
    db.shops[0];

  const myProducts = db.products.filter((p) => p.shop_id === myShop.id);
  const myReviews = db.reviews.filter((r) => r.shop_id === myShop.id);
  const opening = getShopOpeningStatus(myShop, db.shop_schedules);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#E5E5E5] bg-[#FFF8F0] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-sm font-semibold text-[#A6192E]">
            แดชบอร์ดผู้ประกอบการร้านค้า มจธ.
          </span>
          <h1 className="font-heading text-2xl font-bold text-[#222222] mt-0.5">
            {myShop.name}
          </h1>
          <p className="text-sm text-[#525252]">
            {myShop.building_name} • สถานะปัจจุบัน: {opening.statusLabel}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/shops/${myShop.slug}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E5E5] bg-white px-4 py-2.5 text-sm font-semibold text-[#222222]"
          >
            <span>ดูหน้าร้านจริง</span>
            <ExternalLink className="h-4 w-4" />
          </Link>
          <Link
            href="/vendor/products/new"
            className="btn-tactile inline-flex items-center gap-1.5 rounded-xl bg-[#A6192E] px-4 py-2.5 text-sm font-semibold text-white"
          >
            <PlusCircle className="h-4 w-4" />
            <span>เพิ่มเมนูใหม่</span>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[#E5E5E5] bg-white p-5">
          <div className="flex items-center justify-between text-sm text-[#525252]">
            <span>จำนวนเมนูทั้งหมด</span>
            <Utensils className="h-4 w-4 text-[#A6192E]" />
          </div>
          <div className="text-2xl font-bold text-[#222222] mt-1 tabular-nums">
            {myProducts.length} เมนู
          </div>
        </div>

        <div className="rounded-2xl border border-[#E5E5E5] bg-white p-5">
          <div className="flex items-center justify-between text-sm text-[#525252]">
            <span>วันเปิดขายต่อสัปดาห์</span>
            <Calendar className="h-4 w-4 text-[#16A34A]" />
          </div>
          <div className="text-lg font-bold text-[#222222] mt-1">
            {opening.openDaysLabel}
          </div>
        </div>

        <div className="rounded-2xl border border-[#E5E5E5] bg-white p-5">
          <div className="flex items-center justify-between text-sm text-[#525252]">
            <span>รีวิวจากนักศึกษา</span>
            <Star className="h-4 w-4 text-[#F59E0B]" />
          </div>
          <div className="text-2xl font-bold text-[#222222] mt-1 tabular-nums">
            {myReviews.length} รีวิว
          </div>
        </div>
      </div>

      {/* Quick Menu Preview */}
      <div className="rounded-2xl border border-[#E5E5E5] bg-white p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-[#222222]">
            รายการเมนูในร้านของคุณ
          </h2>
          <Link
            href="/vendor/products"
            className="text-sm font-semibold text-[#A6192E] hover:underline"
          >
            จัดการเมนูทั้งหมด →
          </Link>
        </div>

        <div className="divide-y divide-[#E5E5E5]">
          {myProducts.map((prod) => (
            <div
              key={prod.id}
              className="py-3 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <img
                  src={prod.image_url}
                  alt={prod.name}
                  className="h-12 w-12 rounded-xl object-cover border border-[#E5E5E5]"
                />
                <div>
                  <p className="font-semibold text-sm text-[#222222]">
                    {prod.name}
                  </p>
                  <p className="text-sm text-[#525252] tabular-nums">
                    {formatPrice(prod.price)} •{" "}
                    {prod.is_available ? "พร้อมจำหน่าย" : "หมดชั่วคราว"}
                  </p>
                </div>
              </div>
              <Link
                href={`/vendor/products/${prod.id}/edit`}
                className="rounded-lg border border-[#E5E5E5] px-3 py-1.5 text-sm font-medium text-[#222222] hover:border-[#A6192E]"
              >
                แก้ไขราคา/สถานะ
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
