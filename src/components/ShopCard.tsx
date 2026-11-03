"use client";

import React from "react";
import Link from "next/link";
import {
  Heart,
  MapPin,
  Clock,
  ShieldCheck,
  ArrowUpRight,
  Star,
} from "lucide-react";
import { Shop } from "@/types/database";
import { useMarket } from "@/context/MarketContext";
import {
  cn,
  getShopOpeningStatus,
  SHOP_TYPE_LABELS,
} from "@/lib/utils";

export function ShopCard({ shop }: { shop: Shop }) {
  const { db, favoriteShopIds, toggleFavorite } = useMarket();

  const category = db.categories.find((c) => c.id === shop.category_id);
  const isFav = favoriteShopIds.includes(shop.id);
  const opening = getShopOpeningStatus(shop, db.shop_schedules);
  const shopTypeInfo = SHOP_TYPE_LABELS[shop.shop_type];

  const publishedReviews = db.reviews.filter(
    (r) => r.shop_id === shop.id && r.status === "published"
  );
  const avgRating =
    publishedReviews.length > 0
      ? (
          publishedReviews.reduce((acc, r) => acc + r.rating, 0) /
          publishedReviews.length
        ).toFixed(1)
      : null;

  return (
    <article className="card-editorial group relative flex flex-col overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white">
      {/* Image Cover */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#FFF8F0]">
        <img
          src={shop.cover_image_url}
          alt={shop.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-14 flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold shadow-sm",
              opening.isOpenToday
                ? "bg-[#16A34A] text-white"
                : "bg-white/95 text-[#222222]"
            )}
          >
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                opening.isOpenToday ? "bg-white" : "bg-[#DC2626]"
              )}
            />
            {opening.isOpenToday ? "เปิดวันนี้" : "ปิดวันนี้"}
          </span>

          {category && (
            <span className="inline-flex items-center rounded-full bg-white/95 px-3 py-1 text-sm font-medium text-[#222222] shadow-sm">
              {category.name}
            </span>
          )}
        </div>

        {/* Favorite Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            toggleFavorite(shop.id);
          }}
          aria-label={
            isFav
              ? `นำ ${shop.name} ออกจากร้านโปรด`
              : `บันทึก ${shop.name} เป็นร้านโปรด`
          }
          className={cn(
            "btn-tactile absolute top-3 right-3 flex h-10 w-10 items-center justify-center rounded-full border shadow-sm transition-colors",
            isFav
              ? "border-[#A6192E] bg-[#A6192E] text-white"
              : "border-white/60 bg-white/95 text-[#222222] hover:text-[#A6192E]"
          )}
        >
          <Heart className={cn("h-5 w-5", isFav && "fill-current")} />
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <span
            className={cn(
              "inline-flex items-center rounded-md border px-2.5 py-0.5 text-sm font-medium",
              shopTypeInfo.badge
            )}
          >
            {shopTypeInfo.label}
          </span>

          {shop.verification_status === "verified" && (
            <span className="inline-flex items-center gap-1 text-sm font-medium text-[#16A34A]">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>ยืนยันข้อมูล</span>
            </span>
          )}
        </div>

        <h3 className="font-heading text-lg font-bold text-[#222222] group-hover:text-[#A6192E] transition-colors">
          <Link href={`/shops/${shop.slug}`} className="focus:outline-none">
            {shop.name}
          </Link>
        </h3>

        <p className="mt-1.5 text-sm text-[#525252] line-clamp-2 leading-relaxed">
          {shop.description}
        </p>

        {/* Curated Tags */}
        {shop.tags && shop.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {shop.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-[#FAFAFA] border border-[#E5E5E5] px-2.5 py-0.5 text-sm text-[#222222]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Location & Schedule Info */}
        <div className="mt-4 pt-3.5 border-t border-[#E5E5E5] space-y-1.5 text-sm text-[#525252]">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-[#A6192E] shrink-0 mt-0.5" />
            <span className="text-[#222222] font-medium line-clamp-1">
              {shop.building_name}
              {shop.stall_number ? ` (ล็อก ${shop.stall_number})` : ""}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#525252] shrink-0" />
              <span>เปิด: {opening.openDaysLabel}</span>
            </div>
            {avgRating && (
              <span className="inline-flex items-center gap-1 font-semibold text-[#222222] tabular-nums">
                <Star className="h-4 w-4 fill-[#F59E0B] text-[#F59E0B]" />
                {avgRating} ({publishedReviews.length})
              </span>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-4 pt-1">
          <Link
            href={`/shops/${shop.slug}`}
            className="btn-tactile flex w-full items-center justify-center gap-2 rounded-xl bg-[#FFF8F0] border border-[#A6192E]/25 px-4 py-2.5 text-sm font-semibold text-[#A6192E] hover:bg-[#A6192E] hover:text-white transition-colors"
          >
            <span>ดูเมนูและรายละเอียดร้าน</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
