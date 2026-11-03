"use client";

import React from "react";
import Link from "next/link";
import { Heart, Store } from "lucide-react";
import { useMarket } from "@/context/MarketContext";
import { ShopCard } from "@/components/ShopCard";

export default function FavoritesPage() {
  const { db, favoriteShopIds } = useMarket();

  const favoriteShops = db.shops.filter((s) => favoriteShopIds.includes(s.id));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="rounded-3xl border border-[#E5E5E5] bg-[#FFF8F0] p-6 sm:p-8">
        <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-[#222222]">
          ร้านโปรดที่คุณบันทึกไว้ ({favoriteShops.length} ร้าน)
        </h1>
        <p className="text-base text-[#525252] mt-1.5">
          บันทึกร้านอาหารและคาเฟ่ใน มจธ. ที่อยากไปลองได้ทันทีโดยไม่ต้องบังคับล็อกอิน
        </p>
      </div>

      {favoriteShops.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favoriteShops.map((shop) => (
            <ShopCard key={shop.id} shop={shop} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-[#E5E5E5] bg-white p-12 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF8F0] text-[#A6192E]">
            <Heart className="h-7 w-7" />
          </div>
          <h2 className="font-heading text-xl font-bold text-[#222222]">
            ยังไม่มีร้านค้าในรายการโปรดของคุณ
          </h2>
          <p className="text-sm text-[#525252] max-w-md mx-auto">
            กดปุ่มรูปหัวใจบนการ์ดร้านค้าเพื่อบันทึกร้านน่ากินไว้เช็กเมนูและเวลาเปิด-ปิดได้สะดวกขึ้น
          </p>
          <Link
            href="/shops"
            className="btn-tactile inline-flex items-center gap-2 rounded-xl bg-[#A6192E] px-5 py-2.5 text-sm font-semibold text-white"
          >
            <Store className="h-4 w-4" />
            ไปสำรวจร้านค้าใน มจธ.
          </Link>
        </div>
      )}
    </div>
  );
}
