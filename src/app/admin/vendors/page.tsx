"use client";

import React from "react";
import Link from "next/link";
import { useMarket } from "@/context/MarketContext";

export default function AdminVendorsPage() {
  const { db, upsertShop } = useMarket();
  const vendors = db.profiles.filter((p) => p.role === "vendor");

  return (
    <div className="rounded-2xl border border-[#E5E5E5] bg-white p-6 space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-[#222222]">
          จัดการผู้ประกอบการร้านค้า (Vendors)
        </h1>
        <p className="text-sm text-[#525252]">
          ตรวจสอบบัญชีเจ้าของร้านค้าและการอนุมัติสถานะร้านค้าในระบบ
        </p>
      </div>

      <div className="space-y-4">
        {vendors.map((v) => {
          const ownedShops = db.shops.filter((s) => s.owner_id === v.id);
          return (
            <div
              key={v.id}
              className="rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-base text-[#222222]">
                    {v.full_name}
                  </p>
                  <p className="text-sm text-[#525252]">{v.email}</p>
                </div>
                <span className="rounded-full bg-[#16A34A]/15 px-3 py-1 text-sm font-semibold text-[#16A34A]">
                  อนุมัติสิทธิ์ Vendor แล้ว
                </span>
              </div>

              {ownedShops.map((shop) => (
                <div
                  key={shop.id}
                  className="flex items-center justify-between rounded-lg bg-white border border-[#E5E5E5] px-3 py-2 text-sm"
                >
                  <span className="font-medium text-[#222222]">
                    ร้านที่ดูแล: {shop.name} ({shop.building_name})
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        upsertShop({
                          ...shop,
                          verification_status:
                            shop.verification_status === "verified"
                              ? "pending"
                              : "verified",
                        })
                      }
                      className="text-sm font-semibold text-[#A6192E] hover:underline"
                    >
                      สถานะ: {shop.verification_status}
                    </button>
                    <Link
                      href={`/admin/shops/${shop.id}/edit`}
                      className="text-sm text-[#525252] underline"
                    >
                      แก้ไขร้าน
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
