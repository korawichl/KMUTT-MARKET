"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  Utensils,
  PlusCircle,
  Calendar,
  Lock,
} from "lucide-react";
import { useMarket } from "@/context/MarketContext";
import { cn } from "@/lib/utils";

const VENDOR_LINKS = [
  { href: "/vendor/dashboard", label: "ภาพรวมร้านค้า", icon: LayoutDashboard },
  { href: "/vendor/shop", label: "ข้อมูลร้านค้า", icon: Store },
  { href: "/vendor/products", label: "จัดการเมนู/สินค้า", icon: Utensils },
  { href: "/vendor/products/new", label: "เพิ่มเมนูใหม่", icon: PlusCircle },
  { href: "/vendor/schedule", label: "เวลาเปิด–ปิดร้าน", icon: Calendar },
];

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { currentUser, switchDemoRole } = useMarket();

  const isAuthorized =
    currentUser?.role === "vendor" || currentUser?.role === "admin";

  if (!isAuthorized) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF8F0] text-[#A6192E]">
          <Lock className="h-7 w-7" />
        </div>
        <h1 className="font-heading text-2xl font-bold text-[#222222]">
          พื้นที่สำหรับผู้ประกอบการร้านค้า (Vendor Portal)
        </h1>
        <p className="text-sm text-[#525252]">
          หน้านี้สงวนสิทธิ์เฉพาะเจ้าของร้านค้าที่ได้รับการยืนยันหรือผู้ดูแลระบบเท่านั้น
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => switchDemoRole("vendor")}
            className="btn-tactile rounded-xl bg-[#A6192E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#761626]"
          >
            เข้าโหมดเจ้าของร้านลุงกบ S11 ทันที (1-Click)
          </button>
          <Link
            href="/auth/login"
            className="rounded-xl border border-[#E5E5E5] bg-white px-5 py-2.5 text-sm font-semibold text-[#222222]"
          >
            ไปหน้าเข้าสู่ระบบ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-3">
          <div className="rounded-2xl border border-[#E5E5E5] bg-white p-4 space-y-2 sticky top-24">
            <div className="px-3 py-2 border-b border-[#E5E5E5] mb-2">
              <p className="text-sm font-bold text-[#A6192E]">
                ระบบจัดการร้านค้า (Vendor)
              </p>
              <p className="text-sm text-[#525252] truncate">
                {currentUser?.full_name}
              </p>
            </div>
            {VENDOR_LINKS.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-[#A6192E] text-white font-semibold"
                      : "text-[#222222] hover:bg-[#FFF8F0] hover:text-[#A6192E]"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </aside>

        <div className="lg:col-span-9">{children}</div>
      </div>
    </div>
  );
}
