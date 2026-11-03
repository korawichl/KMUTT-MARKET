"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Store, MapPin, CheckCircle2, Clock } from "lucide-react";
import { useMarket } from "@/context/MarketContext";
import { formatPrice, getShopOpeningStatus } from "@/lib/utils";

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = decodeURIComponent(params?.slug || "");
  const { db } = useMarket();

  const product = db.products.find((p) => p.slug === slug || p.id === slug);

  if (!product) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center space-y-4">
        <h1 className="font-heading text-2xl font-bold text-[#222222]">
          ไม่พบข้อมูลเมนูที่คุณค้นหา
        </h1>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 rounded-xl bg-[#A6192E] px-5 py-2.5 text-sm font-semibold text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับไปหน้าเมนูทั้งหมด
        </Link>
      </div>
    );
  }

  const shop = db.shops.find((s) => s.id === product.shop_id);
  const category = db.categories.find((c) => c.id === product.category_id);
  const opening = shop ? getShopOpeningStatus(shop, db.shop_schedules) : null;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex items-center gap-2 text-sm text-[#525252]">
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 font-semibold text-[#A6192E] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>เมนูและสินค้าทั้งหมด</span>
        </Link>
        <span>/</span>
        <span className="text-[#222222] font-medium">{product.name}</span>
      </div>

      <div className="overflow-hidden rounded-3xl border border-[#E5E5E5] bg-white grid grid-cols-1 md:grid-cols-2">
        <div className="aspect-[16/12] md:aspect-auto bg-[#FFF8F0]">
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-sm font-semibold ${
                  product.is_available
                    ? "bg-[#16A34A] text-white"
                    : "bg-[#DC2626] text-white"
                }`}
              >
                {product.is_available ? "พร้อมจำหน่าย" : "หมดชั่วคราว"}
              </span>
              {category && (
                <span className="rounded-full bg-[#FFF8F0] border border-[#A6192E]/25 px-3 py-1 text-sm font-medium text-[#A6192E]">
                  {category.name}
                </span>
              )}
            </div>

            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#222222]">
              {product.name}
            </h1>

            <div className="text-2xl font-bold text-[#A6192E] tabular-nums">
              {formatPrice(product.price)}
            </div>

            <p className="text-base text-[#222222] leading-relaxed">
              {product.description}
            </p>
          </div>

          {shop && (
            <div className="rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA] p-5 space-y-3 text-sm">
              <div className="flex items-center gap-2 font-bold text-base text-[#222222]">
                <Store className="h-5 w-5 text-[#A6192E]" />
                <span>จำหน่ายโดย: {shop.name}</span>
              </div>
              <div className="flex items-center gap-2 text-[#525252]">
                <MapPin className="h-4 w-4 text-[#A6192E] shrink-0" />
                <span>
                  {shop.building_name} ({shop.location_description})
                </span>
              </div>
              {opening && (
                <div className="flex items-center gap-2 text-[#16A34A] font-medium">
                  <Clock className="h-4 w-4 shrink-0" />
                  <span>
                    {opening.statusLabel} • เปิดวัน: {opening.openDaysLabel}
                  </span>
                </div>
              )}

              <div className="pt-2">
                <Link
                  href={`/shops/${shop.slug}`}
                  className="btn-tactile inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#A6192E] px-5 py-3 text-sm font-semibold text-white hover:bg-[#761626]"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>ไปที่หน้าร้าน {shop.name} เพื่อดูเมนูทั้งหมดและแผนที่</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
