"use client";

import React from "react";
import { useMarket } from "@/context/MarketContext";

export default function AdminReviewsPage() {
  const { db, moderateReview } = useMarket();

  return (
    <div className="rounded-2xl border border-[#E5E5E5] bg-white p-6 space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-[#222222]">
          ตรวจสอบและกลั่นกรองรีวิว ({db.reviews.length} รายการ)
        </h1>
        <p className="text-sm text-[#525252]">
          อนุมัติหรือซ่อนรีวิวที่ได้รับแจ้งรายงานความไม่เหมาะสม
        </p>
      </div>

      <div className="divide-y divide-[#E5E5E5]">
        {db.reviews.map((rev) => {
          const shop = db.shops.find((s) => s.id === rev.shop_id);
          return (
            <div
              key={rev.id}
              className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <p className="text-sm font-bold text-[#A6192E]">
                  ร้าน: {shop?.name || rev.shop_id} • คะแนน {rev.rating}/5 ดาว
                </p>
                <p className="text-base text-[#222222]">{rev.comment}</p>
                <p className="text-sm text-[#525252]">
                  โดย {rev.user_name} • สถานะปัจจุบัน: <strong>{rev.status}</strong>
                  {rev.report_reason ? ` (เหตุผลที่แจ้ง: ${rev.report_reason})` : ""}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => moderateReview(rev.id, "published")}
                  className="rounded-lg bg-[#16A34A] px-3 py-1.5 text-sm font-semibold text-white"
                >
                  แสดงผลปกติ
                </button>
                <button
                  type="button"
                  onClick={() => moderateReview(rev.id, "hidden")}
                  className="rounded-lg bg-[#DC2626] px-3 py-1.5 text-sm font-semibold text-white"
                >
                  ซ่อนรีวิว
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
