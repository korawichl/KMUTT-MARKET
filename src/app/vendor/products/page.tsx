"use client";

import React from "react";
import Link from "next/link";
import { PlusCircle, Trash2, Edit } from "lucide-react";
import { useMarket } from "@/context/MarketContext";
import { formatPrice } from "@/lib/utils";

export default function VendorProductsPage() {
  const { db, currentUser, deleteProduct, upsertProduct } = useMarket();

  const myShop =
    db.shops.find((s) => s.owner_id === currentUser?.id) ||
    db.shops.find((s) => s.id === "shop-s11-01") ||
    db.shops[0];

  const myProducts = db.products.filter((p) => p.shop_id === myShop.id);

  return (
    <div className="rounded-2xl border border-[#E5E5E5] bg-white p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#222222]">
            จัดการรายการเมนูและสินค้า ({myProducts.length} รายการ)
          </h1>
          <p className="text-sm text-[#525252]">
            ร้าน: {myShop.name} • เปิด/ปิดสถานะพร้อมจำหน่าย หรือแก้ไขราคาได้ทันที
          </p>
        </div>

        <Link
          href="/vendor/products/new"
          className="btn-tactile inline-flex items-center gap-2 rounded-xl bg-[#A6192E] px-4 py-2.5 text-sm font-semibold text-white"
        >
          <PlusCircle className="h-4 w-4" />
          <span>เพิ่มเมนูใหม่</span>
        </Link>
      </div>

      <div className="divide-y divide-[#E5E5E5]">
        {myProducts.map((prod) => (
          <div
            key={prod.id}
            className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3.5">
              <img
                src={prod.image_url}
                alt={prod.name}
                className="h-14 w-14 rounded-xl object-cover border border-[#E5E5E5]"
              />
              <div>
                <h2 className="font-heading text-base font-bold text-[#222222]">
                  {prod.name}
                </h2>
                <p className="text-sm text-[#525252] line-clamp-1">
                  {prod.description}
                </p>
                <span className="text-sm font-bold text-[#A6192E] tabular-nums">
                  {formatPrice(prod.price)}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  upsertProduct({
                    ...prod,
                    is_available: !prod.is_available,
                  })
                }
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                  prod.is_available
                    ? "bg-[#16A34A]/15 text-[#16A34A]"
                    : "bg-[#DC2626]/15 text-[#DC2626]"
                }`}
              >
                {prod.is_available ? "พร้อมจำหน่าย" : "หมดชั่วคราว"}
              </button>

              <Link
                href={`/vendor/products/${prod.id}/edit`}
                className="inline-flex items-center gap-1 rounded-lg border border-[#E5E5E5] px-3 py-1.5 text-sm font-medium text-[#222222] hover:border-[#A6192E]"
              >
                <Edit className="h-3.5 w-3.5" />
                <span>แก้ไข</span>
              </Link>

              <button
                type="button"
                onClick={() => deleteProduct(prod.id)}
                aria-label={`ลบเมนู ${prod.name}`}
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
