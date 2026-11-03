"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useMarket } from "@/context/MarketContext";

export default function CategoriesPage() {
  const { db } = useMarket();
  const activeCategories = [...db.categories]
    .filter((c) => c.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="rounded-3xl border border-[#E5E5E5] bg-[#FFF8F0] p-6 sm:p-8">
        <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-[#222222]">
          หมวดหมู่ร้านค้าและเมนูอาหารใน มจธ.
        </h1>
        <p className="text-base text-[#525252] mt-1.5">
          เลือกสำรวจร้านอาหาร เครื่องดื่ม ขนม และสินค้าตลาดนัดแยกตามหมวดหมู่ทั้งหมด {activeCategories.length} หมวดหมู่
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeCategories.map((cat) => {
          const shopCount = db.shops.filter(
            (s) => s.status === "active" && s.category_id === cat.id
          ).length;
          const productCount = db.products.filter(
            (p) => p.category_id === cat.id
          ).length;

          return (
            <Link
              key={cat.id}
              href={`/shops?category=${encodeURIComponent(cat.id)}`}
              className="card-editorial group flex flex-col overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white"
            >
              <div className="relative h-44 w-full bg-[#FFF8F0] overflow-hidden">
                <img
                  src={cat.image_url}
                  alt={cat.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white">
                  <h2 className="font-heading text-xl font-bold">{cat.name}</h2>
                  <span className="rounded-full bg-[#A6192E] px-3 py-0.5 text-sm font-semibold tabular-nums">
                    {shopCount} ร้าน
                  </span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <p className="text-sm text-[#525252] leading-relaxed">
                  {cat.description}
                </p>
                <div className="mt-4 pt-3 border-t border-[#E5E5E5] flex items-center justify-between text-sm">
                  <span className="text-[#525252] tabular-nums">
                    เมนูในหมวดนี้ {productCount} รายการ
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-[#A6192E] group-hover:underline">
                    ดูร้านในหมวดนี้ <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
