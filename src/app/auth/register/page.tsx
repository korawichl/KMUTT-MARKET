"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { useMarket } from "@/context/MarketContext";
import { UserRole } from "@/types/database";

export default function RegisterPage() {
  const router = useRouter();
  const { loginWithEmail } = useMarket();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<UserRole>("student");

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !fullName.trim()) return;
    loginWithEmail(email, fullName, accountType);
    if (accountType === "vendor") {
      router.push("/vendor/dashboard");
    } else {
      router.push("/");
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="rounded-3xl border border-[#E5E5E5] bg-white p-6 sm:p-8 space-y-6">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#222222]">
            สมัครสมาชิก KMUTT MARKET
          </h1>
          <p className="text-sm text-[#525252] mt-1">
            สร้างบัญชีสำหรับรีวิวร้านโปรด หรือลงทะเบียนเป็นผู้ประกอบการร้านค้าใน มจธ.
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#222222] mb-1">
              ชื่อ – นามสกุล หรือ ชื่อที่ใช้แสดงผล
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="เช่น ณัฐวุฒิ นักศึกษาคณะวิศวกรรมศาสตร์"
              className="w-full rounded-xl border border-[#E5E5E5] px-4 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#222222] mb-1">
              อีเมล (หากใช้ @mail.kmutt.ac.th จะได้รับป้ายยืนยันนักศึกษาอัตโนมัติ)
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@mail.kmutt.ac.th"
              className="w-full rounded-xl border border-[#E5E5E5] px-4 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#222222] mb-1">
              รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-[#E5E5E5] px-4 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#222222] mb-1">
              ประเภทผู้ใช้งาน
            </label>
            <select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value as UserRole)}
              className="w-full rounded-xl border border-[#E5E5E5] bg-white px-4 py-2.5 text-sm"
            >
              <option value="student">
                นักศึกษา / บุคลากร / ผู้มาติดต่อทั่วไป
              </option>
              <option value="vendor">
                ผู้ประกอบการร้านค้าใน มจธ. (Vendor)
              </option>
            </select>
          </div>

          <button
            type="submit"
            className="btn-tactile w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#A6192E] px-5 py-3 text-base font-semibold text-white hover:bg-[#761626]"
          >
            <UserPlus className="h-5 w-5" />
            <span>ยืนยันการสมัครสมาชิก</span>
          </button>
        </form>

        <p className="text-sm text-[#525252] text-center pt-2 border-t border-[#E5E5E5]">
          มีบัญชีอยู่แล้ว?{" "}
          <Link
            href="/auth/login"
            className="font-semibold text-[#A6192E] hover:underline"
          >
            เข้าสู่ระบบที่นี่
          </Link>
        </p>
      </div>
    </div>
  );
}
