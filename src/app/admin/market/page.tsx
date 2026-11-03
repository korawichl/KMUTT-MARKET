"use client";

import React, { useState } from "react";
import { PlusCircle, Trash2 } from "lucide-react";
import { useMarket } from "@/context/MarketContext";

export default function AdminMarketSchedulePage() {
  const { db, upsertMarketEvent, deleteMarketEvent } = useMarket();
  const [name, setName] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("2");
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("17:00");
  const [description, setDescription] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    upsertMarketEvent({
      name,
      day_of_week: Number(dayOfWeek),
      start_time: startTime,
      end_time: endTime,
      description,
      status: "active",
    });
    setName("");
    setDescription("");
  };

  return (
    <div className="rounded-2xl border border-[#E5E5E5] bg-white p-6 space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-[#222222]">
          จัดการตารางตลาดนัดและประกาศวันหยุดพิเศษ
        </h1>
        <p className="text-sm text-[#525252]">
          เพิ่มรอบตลาดนัด ปรับเวลาทำการ หรือสั่งปิดตลาดนัดชั่วคราวในวันหยุดราชการ
        </p>
      </div>

      <form
        onSubmit={handleAdd}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pb-4 border-b border-[#E5E5E5]"
      >
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ชื่อรอบตลาดนัด..."
          className="rounded-xl border border-[#E5E5E5] px-3 py-2 text-sm"
        />
        <select
          value={dayOfWeek}
          onChange={(e) => setDayOfWeek(e.target.value)}
          className="rounded-xl border border-[#E5E5E5] bg-white px-3 py-2 text-sm"
        >
          <option value="2">วันอังคาร</option>
          <option value="3">วันพุธ</option>
          <option value="4">วันพฤหัสบดี</option>
          <option value="5">วันศุกร์ (พิเศษ)</option>
        </select>
        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="rounded-xl border border-[#E5E5E5] px-3 py-2 text-sm"
        />
        <input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className="rounded-xl border border-[#E5E5E5] px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="btn-tactile inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#A6192E] px-4 py-2 text-sm font-semibold text-white"
        >
          <PlusCircle className="h-4 w-4" />
          <span>เพิ่มตาราง</span>
        </button>
      </form>

      <div className="divide-y divide-[#E5E5E5]">
        {db.market_events.map((evt) => (
          <div
            key={evt.id}
            className="py-4 flex flex-wrap items-center justify-between gap-4"
          >
            <div>
              <p className="font-bold text-base text-[#222222]">{evt.name}</p>
              <p className="text-sm text-[#525252]">
                เวลา {evt.start_time}–{evt.end_time} น. • {evt.location}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  upsertMarketEvent({
                    ...evt,
                    status: evt.status === "active" ? "closed_temp" : "active",
                  })
                }
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                  evt.status === "active"
                    ? "bg-[#16A34A]/15 text-[#16A34A]"
                    : "bg-[#DC2626]/15 text-[#DC2626]"
                }`}
              >
                {evt.status === "active"
                  ? "เปิดตามปกติ (คลิกเพื่อสั่งงดชั่วคราว)"
                  : "งดจัดชั่วคราว (คลิกเพื่อเปิด)"}
              </button>
              <button
                type="button"
                onClick={() => deleteMarketEvent(evt.id)}
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
