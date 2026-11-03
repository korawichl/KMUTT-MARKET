"use client";

import React, { useState } from "react";
import { Save } from "lucide-react";
import { useMarket } from "@/context/MarketContext";

export default function AdminSettingsPage() {
  const { db, updateMarketConfig } = useMarket();
  const cfg = db.market_config;

  const [dimensions, setDimensions] = useState(cfg.stall_dimensions);
  const [foodFee, setFoodFee] = useState(String(cfg.food_stall_fee_thb));
  const [fashionFee, setFashionFee] = useState(
    String(cfg.fashion_stall_fee_thb)
  );
  const [electricFee, setElectricFee] = useState(
    String(cfg.electric_point_fee_thb)
  );
  const [openTime, setOpenTime] = useState(cfg.default_open_time);
  const [closeTime, setCloseTime] = useState(cfg.default_close_time);
  const [setupTime, setSetupTime] = useState(cfg.default_setup_time);
  const [note, setNote] = useState(cfg.note);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMarketConfig({
      stall_dimensions: dimensions,
      food_stall_fee_thb: Number(foodFee),
      fashion_stall_fee_thb: Number(fashionFee),
      electric_point_fee_thb: Number(electricFee),
      default_open_time: openTime,
      default_close_time: closeTime,
      default_setup_time: setupTime,
      note,
    });
  };

  return (
    <div className="rounded-2xl border border-[#E5E5E5] bg-white p-6 space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-[#222222]">
          ตั้งค่าระบบ & อัตราค่าบริหารพื้นที่ตลาดนัด (BPUU)
        </h1>
        <p className="text-sm text-[#525252]">
          แก้ไขเวลาทำการมาตรฐาน ขนาดล็อก และอัตราค่าพื้นที่ตลาดนัดโดยไม่ต้องแก้ไขโค้ด
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#222222] mb-1">
              ค่าพื้นที่ร้านอาหาร/ขนม (บาท/วัน)
            </label>
            <input
              type="number"
              value={foodFee}
              onChange={(e) => setFoodFee(e.target.value)}
              className="w-full rounded-xl border border-[#E5E5E5] px-3.5 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#222222] mb-1">
              ค่าพื้นที่ร้านแฟชั่น/ของใช้ (บาท/วัน)
            </label>
            <input
              type="number"
              value={fashionFee}
              onChange={(e) => setFashionFee(e.target.value)}
              className="w-full rounded-xl border border-[#E5E5E5] px-3.5 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#222222] mb-1">
              ค่าไฟฟ้าอุปกรณ์ทำความร้อน (บาท/จุด)
            </label>
            <input
              type="number"
              value={electricFee}
              onChange={(e) => setElectricFee(e.target.value)}
              className="w-full rounded-xl border border-[#E5E5E5] px-3.5 py-2.5 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#222222] mb-1">
              เวลาเปิดตลาดนัด
            </label>
            <input
              type="time"
              value={openTime}
              onChange={(e) => setOpenTime(e.target.value)}
              className="w-full rounded-xl border border-[#E5E5E5] px-3.5 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#222222] mb-1">
              เวลาปิดตลาดนัด
            </label>
            <input
              type="time"
              value={closeTime}
              onChange={(e) => setCloseTime(e.target.value)}
              className="w-full rounded-xl border border-[#E5E5E5] px-3.5 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#222222] mb-1">
              เวลาเริ่มตั้งร้าน
            </label>
            <input
              type="time"
              value={setupTime}
              onChange={(e) => setSetupTime(e.target.value)}
              className="w-full rounded-xl border border-[#E5E5E5] px-3.5 py-2.5 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#222222] mb-1">
            ขนาดล็อกมาตรฐาน
          </label>
          <input
            type="text"
            value={dimensions}
            onChange={(e) => setDimensions(e.target.value)}
            className="w-full rounded-xl border border-[#E5E5E5] px-3.5 py-2.5 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#222222] mb-1">
            ข้อความหมายเหตุประกาศตลาดนัด
          </label>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-xl border border-[#E5E5E5] p-3.5 text-sm"
          />
        </div>

        <button
          type="submit"
          className="btn-tactile inline-flex items-center gap-2 rounded-xl bg-[#A6192E] px-6 py-3 text-sm font-semibold text-white"
        >
          <Save className="h-4 w-4" />
          <span>บันทึกการตั้งค่าระบบ</span>
        </button>
      </form>
    </div>
  );
}
