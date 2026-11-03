"use client";

import React from "react";
import Link from "next/link";
import { Store, MapPin, ArrowUpRight } from "lucide-react";
import { Product } from "@/types/database";
import { useMarket } from "@/context/MarketContext";
import { cn, formatPrice } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const { db } = useMarket();

  const shop = db.shops.find((s) => s.id === product.shop_id);
  const category = db.categories.find((c) => c.id === product.category_id);

  return (
    <article className="card-editorial group flex flex-col overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#FFF8F0]">
        <img
          src={product.image_url}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold shadow-sm",
              product.is_available
                ? "bg-[#16A34A] text-white"
                : "bg-[#DC2626] text-white"
            )}
          >
            {product.is_available ? "พร้อมจำหน่าย" : "หมดชั่วคราว"}
          </span>
          {category && (
            <span className="inline-flex items-center rounded-full bg-white/95 px-3 py-1 text-sm font-medium text-[#222222] shadow-sm">
              {category.name}
            </span>
          )}
        </div>

        <div className="absolute bottom-3 right-3">
          <span className="inline-flex items-center rounded-xl bg-[#222222]/90 px-3 py-1.5 text-sm font-bold text-white tabular-nums shadow-sm">
            {formatPrice(product.price)}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-heading text-lg font-bold text-[#222222] group-hover:text-[#A6192E] transition-colors">
          <Link href={`/products/${product.slug}`}>{product.name}</Link>
        </h3>

        <p className="mt-1.5 text-sm text-[#525252] line-clamp-2 leading-relaxed">
          {product.description}
        </p>

        {shop && (
          <div className="mt-4 pt-3 border-t border-[#E5E5E5] space-y-1 text-sm text-[#525252]">
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-[#A6192E] shrink-0" />
              <Link
                href={`/shops/${shop.slug}`}
                className="font-semibold text-[#222222] hover:text-[#A6192E] line-clamp-1"
              >
                {shop.name}
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#525252] shrink-0" />
              <span className="line-clamp-1">{shop.building_name}</span>
            </div>
          </div>
        )}

        <div className="mt-4 pt-1">
          <Link
            href={`/products/${product.slug}`}
            className="btn-tactile flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] px-4 py-2.5 text-sm font-semibold text-[#222222] hover:border-[#A6192E] hover:bg-[#FFF8F0] hover:text-[#A6192E]"
          >
            <span>ดูรายละเอียดเมนู</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
