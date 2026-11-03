"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Store, ShieldCheck, LogIn } from "lucide-react";
import { useMarket } from "@/context/MarketContext";

export default function LoginPage() {
  const router = useRouter();
  const { switchDemoRole, loginWithEmail } = useMarket();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleFormLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    loginWithEmail(email);
    router.push("/");
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Standard Login Form */}
        <div className="lg:col-span-7 rounded-3xl border border-[#E5E5E5] bg-white p-6 sm:p-8 space-y-6">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#222222]">
              เข้าสู่ระบบ KMUTT MARKET
            </h1>
            <p className="text-sm text-[#525252] mt-1">
              หมายเหตุ: ผู้ชมทั่วไปสามารถดูร้านอาหาร เมนู และกดบันทึกร้านโปรดได้โดยไม่ต้องล็อกอิน
            </p>
          </div>

          <form onSubmit={handleFormLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#222222] mb-1">
                อีเมล (@mail.kmutt.ac.th หรืออีเมลทั่วไป)
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="thanaphat.stu@mail.kmutt.ac.th"
                className="w-full rounded-xl border border-[#E5E5E5] px-4 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#222222] mb-1">
                รหัสผ่าน
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-[#E5E5E5] px-4 py-2.5 text-sm"
              />
            </div>

            <button
              type="submit"
              className="btn-tactile w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#A6192E] px-5 py-3 text-base font-semibold text-white hover:bg-[#761626]"
            >
              <LogIn className="h-5 w-5" />
              <span>เข้าสู่ระบบ</span>
            </button>
          </form>

          <p className="text-sm text-[#525252] text-center pt-2 border-t border-[#E5E5E5]">
            ยังไม่มีบัญชีสมาชิก?{" "}
            <Link
              href="/auth/register"
              className="font-semibold text-[#A6192E] hover:underline"
            >
              สมัครสมาชิกใหม่ที่นี่
            </Link>
          </p>
        </div>

        {/* Right: 1-Click Demo Role Switcher */}
        <div className="lg:col-span-5 rounded-3xl border border-[#A6192E]/25 bg-[#FFF8F0] p-6 space-y-4">
          <h2 className="font-heading text-lg font-bold text-[#222222]">
            เข้าใช้งานด่วนสำหรับทดสอบระบบ (1-Click Login)
          </h2>
          <p className="text-sm text-[#525252]">
            กดเลือกบทบาทด้านล่างเพื่อทดสอบฟีเจอร์รีวิว ระบบจัดการร้านค้า (Vendor) หรือระบบแอดมิน (Admin) ได้ทันที:
          </p>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => {
                switchDemoRole("student");
                router.push("/shops");
              }}
              className="btn-tactile w-full flex items-center gap-3 rounded-xl border border-[#E5E5E5] bg-white p-3.5 text-left hover:border-[#A6192E]"
            >
              <User className="h-5 w-5 text-[#A6192E] shrink-0" />
              <div>
                <div className="text-sm font-bold text-[#222222]">
                  เข้าในฐานะ นักศึกษา มจธ. (Student)
                </div>
                <div className="text-sm text-[#525252]">
                  ธนภัทร วิศวกรรมศาสตร์ • เขียนและแก้ไขรีวิวร้านค้าได้
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                switchDemoRole("vendor");
                router.push("/vendor/dashboard");
              }}
              className="btn-tactile w-full flex items-center gap-3 rounded-xl border border-[#E5E5E5] bg-white p-3.5 text-left hover:border-[#A6192E]"
            >
              <Store className="h-5 w-5 text-[#A6192E] shrink-0" />
              <div>
                <div className="text-sm font-bold text-[#222222]">
                  เข้าในฐานะ เจ้าของร้านค้า (Vendor)
                </div>
                <div className="text-sm text-[#525252]">
                  ร้าน Uncle Frog (ลุงกบ S11) • แก้ไขเมนู ราคา และเวลาเปิด
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                switchDemoRole("admin");
                router.push("/admin/dashboard");
              }}
              className="btn-tactile w-full flex items-center gap-3 rounded-xl border border-[#E5E5E5] bg-white p-3.5 text-left hover:border-[#A6192E]"
            >
              <ShieldCheck className="h-5 w-5 text-[#16A34A] shrink-0" />
              <div>
                <div className="text-sm font-bold text-[#222222]">
                  เข้าในฐานะ ผู้ดูแลระบบ (Admin BPUU)
                </div>
                <div className="text-sm text-[#525252]">
                  จัดการร้านค้าทั้งหมด หมวดหมู่ ผังล็อกตลาดนัด และรีวิว
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
