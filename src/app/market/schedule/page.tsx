"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Calendar, Clock, MapPin, Megaphone, Info } from "lucide-react";
import { useMarket } from "@/context/MarketContext";
import { ShopCard } from "@/components/ShopCard";
import { getBangkokNow, THAI_DAYS } from "@/lib/utils";

export default function MarketSchedulePage() {
  const { db } = useMarket();
  const bangkokNow = useMemo(() => getBangkokNow(), []);

  const [selectedDay, setSelectedDay] = useState<number>(
    [2, 3, 4].includes(bangkokNow.dayOfWeek) ? bangkokNow.dayOfWeek : 2
  );

  const participatingShops = useMemo(() => {
    return db.shops.filter((shop) => {
      if (shop.status !== "active") return false;
      return db.shop_schedules.some(
        (sc) =>
          sc.shop_id === shop.id &&
          sc.day_of_week === selectedDay &&
          sc.is_open
      );
    });
  }, [db.shop_schedules, db.shops, selectedDay]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="rounded-3xl border border-[#E5E5E5] bg-[#FFF8F0] p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white border border-[#A6192E]/25 px-3.5 py-1 text-sm font-semibold text-[#A6192E] mb-2">
            <Clock className="h-4 w-4" />
            เวลาปัจจุบัน (Asia/Bangkok): {bangkokNow.thaiDateString} เวลา{" "}
            {bangkokNow.timeString} น.
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-[#222222]">
            ตารางตลาดนัดและปฏิทินร้านค้าประจำสัปดาห์
          </h1>
          <p className="text-base text-[#525252] mt-1">
            วันอังคาร: ตลาดนัดสินค้าชุมชน • วันพุธ–พฤหัสบดี: ตลาดนัด มจธ. • จันทร์–เสาร์: โรงอาหาร S14 และร้านประจำอาคาร
          </p>
        </div>
      </div>

      {/* Weekly Market Schedule Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {db.market_events.map((evt) => (
          <div
            key={evt.id}
            className="rounded-2xl border border-[#E5E5E5] bg-white p-6 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="rounded-lg bg-[#FFF8F0] border border-[#A6192E]/25 px-3 py-1 text-sm font-bold text-[#A6192E]">
                {evt.day_of_week !== null && evt.day_of_week !== undefined
                  ? THAI_DAYS[evt.day_of_week]?.full
                  : evt.event_date || "วันพิเศษ"}
              </span>
              <span
                className={`rounded-full px-3 py-0.5 text-sm font-semibold ${
                  evt.status === "active"
                    ? "bg-[#16A34A]/15 text-[#16A34A]"
                    : "bg-[#DC2626]/15 text-[#DC2626]"
                }`}
              >
                {evt.status === "active" ? "เปิดตามปกติ" : "ปิดชั่วคราว"}
              </span>
            </div>
            <h2 className="font-heading text-xl font-bold text-[#222222]">
              {evt.name}
            </h2>
            <p className="text-sm text-[#525252]">{evt.description}</p>
            <div className="pt-3 border-t border-[#E5E5E5] text-sm space-y-1">
              <div className="flex items-center gap-2 text-[#222222]">
                <Clock className="h-4 w-4 text-[#A6192E]" />
                <span>
                  เวลาจำหน่าย: <strong>{evt.start_time}–{evt.end_time} น.</strong> (ตั้งร้าน {evt.setup_time} น.)
                </span>
              </div>
              <div className="flex items-center gap-2 text-[#525252]">
                <MapPin className="h-4 w-4 text-[#A6192E]" />
                <span>{evt.location}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Participating Shops by Day of Week */}
      <section className="rounded-3xl border border-[#E5E5E5] bg-white p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E5E5E5]">
          <div>
            <h2 className="font-heading text-2xl font-bold text-[#222222]">
              ตรวจสอบร้านค้าที่เปิดขายตามวันในสัปดาห์
            </h2>
            <p className="text-sm text-[#525252]">
              เลือกวันเพื่อดูรายชื่อร้านตลาดนัดและร้านประจำใน มจธ. ที่เปิดให้บริการ
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { day: 2, label: "อังคาร (ตลาดชุมชน)" },
              { day: 3, label: "พุธ (ตลาด มจธ.)" },
              { day: 4, label: "พฤหัสบดี (ตลาด มจธ.)" },
              { day: 1, label: "จันทร์" },
              { day: 5, label: "ศุกร์" },
              { day: 6, label: "เสาร์" },
              { day: 0, label: "อาทิตย์" },
            ].map((item) => (
              <button
                key={item.day}
                type="button"
                onClick={() => setSelectedDay(item.day)}
                className={`btn-tactile rounded-xl px-4 py-2 text-sm font-semibold ${
                  selectedDay === item.day
                    ? "bg-[#A6192E] text-white"
                    : "bg-[#FAFAFA] border border-[#E5E5E5] text-[#222222]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {participatingShops.map((shop) => (
            <ShopCard key={shop.id} shop={shop} />
          ))}
        </div>
      </section>

      {/* Special Announcements */}
      <section className="rounded-2xl border border-[#E5E5E5] bg-[#FFF8F0] p-6 space-y-3">
        <div className="flex items-center gap-2 font-heading text-lg font-bold text-[#222222]">
          <Megaphone className="h-5 w-5 text-[#A6192E]" />
          <span>ประกาศเกี่ยวกับตารางเวลาและวันหยุด</span>
        </div>
        <p className="text-sm text-[#222222]">{db.market_config.note}</p>
      </section>
    </div>
  );
}
