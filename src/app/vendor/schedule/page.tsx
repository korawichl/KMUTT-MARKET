"use client";

import React, { useState } from "react";
import { Save } from "lucide-react";
import { useMarket } from "@/context/MarketContext";
import { THAI_DAYS } from "@/lib/utils";

export default function VendorSchedulePage() {
  const { db, currentUser, updateShopSchedules } = useMarket();

  const myShop =
    db.shops.find((s) => s.owner_id === currentUser?.id) ||
    db.shops.find((s) => s.id === "shop-s11-01") ||
    db.shops[0];

  const [daysState, setDaysState] = useState(() =>
    [1, 2, 3, 4, 5, 6, 0].map((day) => {
      const existing = db.shop_schedules.find(
        (sc) => sc.shop_id === myShop.id && sc.day_of_week === day
      );
      return {
        day_of_week: day,
        is_open: existing ? existing.is_open : false,
        open_time: existing?.open_time || "07:00",
        close_time: existing?.close_time || "17:00",
      };
    })
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateShopSchedules(myShop.id, daysState);
  };

  return (
    <div className="rounded-2xl border border-[#E5E5E5] bg-white p-6 space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-[#222222]">
          จัดการตารางวันและเวลาเปิด–ปิดร้าน
        </h1>
        <p className="text-sm text-[#525252]">
          ร้าน: {myShop.name} • ข้อมูลนี้จะใช้แสดงผลในส่วน &ldquo;ร้านที่เปิดขายวันนี้&rdquo; บนหน้าแรกอัตโนมัติ
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="space-y-2.5">
          {daysState.map((item, idx) => (
            <div
              key={item.day_of_week}
              className="rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] p-4 flex flex-wrap items-center justify-between gap-4"
            >
              <label className="inline-flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.is_open}
                  onChange={(e) =>
                    setDaysState((prev) =>
                      prev.map((d, i) =>
                        i === idx ? { ...d, is_open: e.target.checked } : d
                      )
                    )
                  }
                  className="h-4 w-4 accent-[#A6192E]"
                />
                <span className="font-semibold text-base text-[#222222]">
                  {THAI_DAYS[item.day_of_week]?.full}
                </span>
              </label>

              {item.is_open ? (
                <div className="flex items-center gap-2 text-sm">
                  <span>เวลาเปิด:</span>
                  <input
                    type="time"
                    value={item.open_time}
                    onChange={(e) =>
                      setDaysState((prev) =>
                        prev.map((d, i) =>
                          i === idx ? { ...d, open_time: e.target.value } : d
                        )
                      )
                    }
                    className="rounded-lg border border-[#E5E5E5] bg-white px-2.5 py-1.5"
                  />
                  <span>ถึง</span>
                  <input
                    type="time"
                    value={item.close_time}
                    onChange={(e) =>
                      setDaysState((prev) =>
                        prev.map((d, i) =>
                          i === idx ? { ...d, close_time: e.target.value } : d
                        )
                      )
                    }
                    className="rounded-lg border border-[#E5E5E5] bg-white px-2.5 py-1.5"
                  />
                </div>
              ) : (
                <span className="text-sm text-[#DC2626] font-medium">
                  ปิดทำการ
                </span>
              )}
            </div>
          ))}
        </div>

        <button
          type="submit"
          className="btn-tactile inline-flex items-center gap-2 rounded-xl bg-[#A6192E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#761626]"
        >
          <Save className="h-4 w-4" />
          <span>บันทึกตารางเวลาเปิด–ปิดร้าน</span>
        </button>
      </form>
    </div>
  );
}
