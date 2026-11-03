"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  PlusCircle,
  Utensils,
  Layers,
  Calendar,
  MapPin,
  Users,
  UserCheck,
  MessageSquare,
  Settings,
  Activity,
  Lock,
} from "lucide-react";
import { useMarket } from "@/context/MarketContext";
import { cn } from "@/lib/utils";

const ADMIN_LINKS = [
  { href: "/admin/dashboard", label: "ภาพรวมระบบ (Dashboard)", icon: LayoutDashboard },
  { href: "/admin/shops", label: "จัดการร้านค้าทั้งหมด", icon: Store },
  { href: "/admin/shops/new", label: "เพิ่มร้านค้าใหม่", icon: PlusCircle },
  { href: "/admin/products", label: "จัดการเมนูและสินค้า", icon: Utensils },
  { href: "/admin/categories", label: "จัดการหมวดหมู่", icon: Layers },
  { href: "/admin/market", label: "จัดการตารางตลาดนัด", icon: Calendar },
  { href: "/admin/market/locations", label: "จัดการผังล็อก & พิกัด", icon: MapPin },
  { href: "/admin/vendors", label: "จัดการผู้ประกอบการ", icon: UserCheck },
  { href: "/admin/users", label: "จัดการบัญชีผู้ใช้งาน", icon: Users },
  { href: "/admin/reviews", label: "ตรวจสอบรีวิว", icon: MessageSquare },
  { href: "/admin/settings", label: "ตั้งค่าระบบ & ค่าพื้นที่", icon: Settings },
  { href: "/admin/activity-logs", label: "ประวัติการใช้งาน (Logs)", icon: Activity },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { currentUser, switchDemoRole } = useMarket();

  if (currentUser?.role !== "admin") {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF8F0] text-[#A6192E]">
          <Lock className="h-7 w-7" />
        </div>
        <h1 className="font-heading text-2xl font-bold text-[#222222]">
          พื้นที่สำหรับผู้ดูแลระบบ (Admin Dashboard)
        </h1>
        <p className="text-sm text-[#525252]">
          หน้านี้จำกัดสิทธิ์เฉพาะผู้ดูแลระบบ (Admin) ของ KMUTT MARKET เท่านั้น
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => switchDemoRole("admin")}
            className="btn-tactile rounded-xl bg-[#A6192E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#761626]"
          >
            เข้าสู่ระบบแอดมินทันที (1-Click Admin)
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
          <div className="rounded-2xl border border-[#E5E5E5] bg-white p-4 space-y-1.5 sticky top-24">
            <div className="px-3 py-2 border-b border-[#E5E5E5] mb-2">
              <p className="text-sm font-bold text-[#A6192E]">
                ผู้ดูแลระบบ KMUTT MARKET
              </p>
              <p className="text-sm text-[#525252] truncate">
                {currentUser.full_name}
              </p>
            </div>
            {ADMIN_LINKS.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
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
