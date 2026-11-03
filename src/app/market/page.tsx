"use client";

import React from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  MapPin,
  Ruler,
  Banknote,
  Zap,
  ExternalLink,
  ShieldCheck,
  Map,
} from "lucide-react";
import { useMarket } from "@/context/MarketContext";

export default function MarketInfoPage() {
  const { db } = useMarket();
  const cfg = db.market_config;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <div className="rounded-3xl border border-[#E5E5E5] bg-[#FFF8F0] p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-white border border-[#A6192E]/25 px-3.5 py-1 text-sm font-semibold text-[#A6192E]">
            <ShieldCheck className="h-4 w-4" />
            ข้อมูลอ้างอิงจากกลุ่มงานจัดการผลประโยชน์และทรัพย์สิน (BPUU มจธ.)
          </span>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-[#222222]">
            ข้อมูลตลาดนัดสินค้าชุมชน และตลาดนัด มจธ.
          </h1>
          <p className="text-base text-[#525252] leading-relaxed">
            ตลาดนัดภายในมหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี (บางมด) จัดขึ้นบริเวณลานชั้น 1
            อาคารจอดรถ 14 ชั้น (อาคาร S2) เพื่อเป็นพื้นที่จำหน่ายอาหาร สินค้าชุมชน และสินค้าสำหรับนักศึกษาและบุคลากร
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/market/map"
              className="btn-tactile inline-flex items-center gap-2 rounded-xl bg-[#A6192E] px-5 py-3 text-sm font-semibold text-white hover:bg-[#761626]"
            >
              <Map className="h-4 w-4" />
              ดูแผนที่และผังล็อกตลาดนัด
            </Link>
            <Link
              href="/market/schedule"
              className="btn-tactile inline-flex items-center gap-2 rounded-xl border border-[#E5E5E5] bg-white px-5 py-3 text-sm font-semibold text-[#222222] hover:border-[#A6192E]"
            >
              <Calendar className="h-4 w-4 text-[#A6192E]" />
              ดูตารางเวลาเปิดตลาดนัด
            </Link>
          </div>
        </div>

        <div className="lg:col-span-5">
          <img
            src="https://bpuu.kmutt.ac.th/wp-content/uploads/2024/03/371127.jpg"
            alt="ตลาดนัดสินค้าชุมชน มจธ."
            className="w-full h-64 sm:h-72 object-cover rounded-2xl border border-[#E5E5E5]"
          />
        </div>
      </div>

      {/* Official Details Grid (Part 12) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-[#E5E5E5] bg-white p-6 space-y-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF8F0] text-[#A6192E]">
            <Clock className="h-6 w-6" />
          </div>
          <h2 className="font-heading text-xl font-bold text-[#222222]">
            วันและเวลาเปิดทำการ
          </h2>
          <ul className="space-y-2 text-sm text-[#222222]">
            <li>• <strong>วันอังคาร:</strong> ตลาดนัดสินค้าชุมชน</li>
            <li>• <strong>วันพุธ:</strong> ตลาดนัด มจธ.</li>
            <li>• <strong>วันพฤหัสบดี:</strong> ตลาดนัด มจธ.</li>
            <li>• <strong>เวลาจำหน่าย:</strong> {cfg.default_open_time}–{cfg.default_close_time} น.</li>
            <li>• <strong>เวลาตั้งร้าน:</strong> เริ่มตั้งแต่ {cfg.default_setup_time} น.</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-[#E5E5E5] bg-white p-6 space-y-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF8F0] text-[#A6192E]">
            <Ruler className="h-6 w-6" />
          </div>
          <h2 className="font-heading text-xl font-bold text-[#222222]">
            สถานที่และขนาดพื้นที่ล็อก
          </h2>
          <ul className="space-y-2 text-sm text-[#222222]">
            <li className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-[#A6192E] shrink-0 mt-0.5" />
              <span>ลานชั้น 1 อาคารจอดรถ 14 ชั้น (อาคาร S2) มจธ. บางมด</span>
            </li>
            <li>• <strong>ขนาดล็อกมาตรฐาน:</strong> {cfg.stall_dimensions}</li>
            <li>• <strong>การตรวจสอบสุขาภิบาล:</strong> มีการสุ่มตรวจความสะอาดปลอดภัยของอาหารโดยภาควิชาจุลชีววิทยาและกลุ่มงานบริการสุขภาพ มจธ.</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-[#E5E5E5] bg-white p-6 space-y-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF8F0] text-[#A6192E]">
            <Banknote className="h-6 w-6" />
          </div>
          <h2 className="font-heading text-xl font-bold text-[#222222]">
            อัตราค่าบริหารพื้นที่ (สำหรับผู้ค้า)
          </h2>
          <ul className="space-y-2 text-sm text-[#222222] tabular-nums">
            <li>• <strong>ร้านอาหารและขนม:</strong> {cfg.food_stall_fee_thb} บาท / ล็อก / วัน</li>
            <li>• <strong>ร้านเสื้อผ้า แฟชั่น และสินค้าทั่วไป:</strong> {cfg.fashion_stall_fee_thb} บาท / ล็อก / วัน</li>
            <li className="flex items-start gap-1.5">
              <Zap className="h-4 w-4 text-[#F59E0B] shrink-0 mt-0.5" />
              <span>
                <strong>ค่าไฟฟ้าเพิ่มเติม (อุปกรณ์ทำความร้อน/เตา):</strong> {cfg.electric_point_fee_thb} บาท / จุด
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-[#E5E5E5] bg-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-heading text-lg font-bold text-[#222222]">
            แหล่งข้อมูลประกาศทางการจากมหาวิทยาลัย
          </h3>
          <p className="text-sm text-[#525252]">{cfg.note}</p>
        </div>
        <a
          href={cfg.official_source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-[#A6192E] px-4 py-2.5 text-sm font-semibold text-[#A6192E] hover:bg-[#FFF8F0] shrink-0"
        >
          <span>เว็บไซต์ประกาศตลาดนัด BPUU</span>
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
