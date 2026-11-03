"use client";

import React, { useState } from "react";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import { useMarket } from "@/context/MarketContext";

export default function ContactPage() {
  const { showToast } = useMarket();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("แจ้งเพิ่ม/แก้ไขข้อมูลร้านอาหารใน มจธ.");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast(
      `ส่งข้อความเรื่อง "${topic}" เรียบร้อยแล้ว ทีมงานจะตรวจสอบโดยเร็วที่สุด`,
      "success"
    );
    setName("");
    setEmail("");
    setMessage("");
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="rounded-3xl border border-[#E5E5E5] bg-[#FFF8F0] p-6 sm:p-8">
        <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-[#222222]">
          ติดต่อสอบถาม & แจ้งอัปเดตข้อมูลร้านค้า
        </h1>
        <p className="text-base text-[#525252] mt-1.5">
          สำหรับนักศึกษา ผู้ประกอบการร้านค้า หรือผู้ที่ต้องการสอบถามการจองพื้นที่ตลาดนัด มจธ.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 rounded-2xl border border-[#E5E5E5] bg-white p-6 space-y-5">
          <h2 className="font-heading text-xl font-bold text-[#222222]">
            ข้อมูลการติดต่อหน่วยงานดูแลพื้นที่
          </h2>

          <div className="space-y-4 text-sm text-[#222222]">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-[#A6192E] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">
                  กลุ่มงานจัดการผลประโยชน์และทรัพย์สิน (BPUU)
                </p>
                <p className="text-[#525252]">
                  มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี (มจธ. บางมด) 126 ถนนประชาอุทิศ แขวงบางมด เขตทุ่งครุ กรุงเทพฯ 10140
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-[#A6192E] shrink-0" />
              <span>โทรศัพท์กลาง มจธ.: 02-470-8000</span>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-[#A6192E] shrink-0" />
              <span>เว็บไซต์ทางการ: https://bpuu.kmutt.ac.th</span>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-[#A6192E] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">เวลาทำการสำนักงาน:</p>
                <p className="text-[#525252]">วันจันทร์ – วันศุกร์ เวลา 08:30 – 16:30 น.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 rounded-2xl border border-[#E5E5E5] bg-white p-6">
          <h2 className="font-heading text-xl font-bold text-[#222222] mb-4">
            ส่งข้อความแจ้งทีมงาน KMUTT MARKET
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#222222] mb-1">
                  ชื่อผู้ติดต่อ
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ชื่อ-นามสกุล หรือชื่อร้านค้า"
                  className="w-full rounded-xl border border-[#E5E5E5] px-3.5 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#222222] mb-1">
                  อีเมลหรือเบอร์โทรศัพท์
                </label>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@mail.kmutt.ac.th"
                  className="w-full rounded-xl border border-[#E5E5E5] px-3.5 py-2.5 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#222222] mb-1">
                หัวข้อที่ต้องการติดต่อ
              </label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full rounded-xl border border-[#E5E5E5] bg-white px-3.5 py-2.5 text-sm"
              >
                <option value="แจ้งเพิ่ม/แก้ไขข้อมูลร้านอาหารใน มจธ.">
                  แจ้งเพิ่ม/แก้ไขข้อมูลร้านอาหารใน มจธ.
                </option>
                <option value="ติดต่อขอสิทธิ์เจ้าของร้านค้า (Vendor)">
                  ติดต่อขอสิทธิ์เจ้าของร้านค้า (Vendor)
                </option>
                <option value="สอบถามการจองล็อกตลาดนัด มจธ.">
                  สอบถามการจองล็อกตลาดนัด มจธ.
                </option>
                <option value="ข้อเสนอแนะทั่วไป">ข้อเสนอแนะทั่วไป</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#222222] mb-1">
                รายละเอียดข้อความ
              </label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="ระบุชื่อร้าน อาคาร เมนู หรือรายละเอียดที่ต้องการแจ้ง..."
                className="w-full rounded-xl border border-[#E5E5E5] p-3.5 text-sm"
              />
            </div>

            <button
              type="submit"
              className="btn-tactile inline-flex items-center gap-2 rounded-xl bg-[#A6192E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#761626]"
            >
              <Send className="h-4 w-4" />
              <span>ส่งข้อความ</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
