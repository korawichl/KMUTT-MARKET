"use client";

import React from "react";
import Link from "next/link";
import { Star, Store, Flag } from "lucide-react";
import { useMarket } from "@/context/MarketContext";

export default function ReviewsDirectoryPage() {
  const { db, reportReview } = useMarket();

  const publishedReviews = db.reviews.filter((r) => r.status !== "hidden");

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="rounded-3xl border border-[#E5E5E5] bg-[#FFF8F0] p-6 sm:p-8">
        <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-[#222222]">
          รีวิวร้านอาหารและคาเฟ่จากชาวบางมด ({publishedReviews.length})
        </h1>
        <p className="text-base text-[#525252] mt-1.5">
          รวมเสียงรีวิวจริงจากนักศึกษาและบุคลากร มจธ. คลิกที่ชื่อร้านเพื่อดูเมนูและเขียนรีวิวของคุณ
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {publishedReviews.map((rev) => {
          const shop = db.shops.find((s) => s.id === rev.shop_id);
          return (
            <div
              key={rev.id}
              className="rounded-2xl border border-[#E5E5E5] bg-white p-6 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {shop && (
                  <Link
                    href={`/shops/${shop.slug}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#FFF8F0] border border-[#A6192E]/25 px-3 py-1.5 text-sm font-bold text-[#A6192E] hover:bg-[#A6192E] hover:text-white transition-colors"
                  >
                    <Store className="h-4 w-4" />
                    <span>{shop.name}</span>
                  </Link>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-base text-[#222222]">
                      {rev.user_name}
                    </span>
                    {rev.user_role_badge && (
                      <span className="ml-2 rounded-md bg-[#FAFAFA] border border-[#E5E5E5] px-2 py-0.5 text-sm text-[#16A34A]">
                        {rev.user_role_badge}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < rev.rating
                            ? "fill-[#F59E0B] text-[#F59E0B]"
                            : "text-[#E5E5E5]"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-base text-[#222222] leading-relaxed">
                  &ldquo;{rev.comment}&rdquo;
                </p>
              </div>

              <div className="pt-3 border-t border-[#E5E5E5] flex items-center justify-between text-sm text-[#525252]">
                <span>
                  {new Date(rev.created_at).toLocaleDateString("th-TH", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    reportReview(rev.id, "แจ้งตรวจสอบจากหน้ารวมรีวิว")
                  }
                  className="inline-flex items-center gap-1 hover:text-[#DC2626]"
                >
                  <Flag className="h-3.5 w-3.5" />
                  <span>รายงานรีวิว</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
