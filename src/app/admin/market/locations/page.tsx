"use client";

import React from "react";
import { useMarket } from "@/context/MarketContext";

export default function AdminMarketLocationsPage() {
  const { db, assignShopToStall } = useMarket();

  return (
    <div className="rounded-2xl border border-[#E5E5E5] bg-white p-6 space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-[#222222]">
          จัดการผังล็อกตลาดนัด มจธ. (ลานชั้น 1 อาคาร S2)
        </h1>
        <p className="text-sm text-[#525252]">
          กำหนดร้านค้าประจำแต่ละล็อก (A-01 ถึง C-04) และยืนยันตำแหน่งพิกัดล็อก
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {db.market_stalls.map((stall) => (
          <div
            key={stall.id}
            className="rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="rounded-lg bg-[#A6192E] px-3 py-1 text-sm font-bold text-white">
                ล็อก {stall.stall_number} ({stall.zone})
              </span>
              <label className="inline-flex items-center gap-1.5 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={stall.location_verified}
                  onChange={(e) =>
                    assignShopToStall(
                      stall.id,
                      stall.shop_id,
                      e.target.checked
                    )
                  }
                  className="h-4 w-4 accent-[#16A34A]"
                />
                <span>ยืนยันตำแหน่งจริงแล้ว</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#525252] mb-1">
                ร้านค้าที่ประจำในล็อกนี้:
              </label>
              <select
                value={stall.shop_id || ""}
                onChange={(e) =>
                  assignShopToStall(
                    stall.id,
                    e.target.value || null,
                    stall.location_verified
                  )
                }
                className="w-full rounded-xl border border-[#E5E5E5] bg-white px-3 py-2 text-sm"
              >
                <option value="">-- ล็อกว่าง --</option>
                {db.shops.map((shop) => (
                  <option key={shop.id} value={shop.id}>
                    {shop.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
