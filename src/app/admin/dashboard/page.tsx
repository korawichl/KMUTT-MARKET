"use client";

import React from "react";
import Link from "next/link";
import {
  Store,
  Utensils,
  Layers,
  MessageSquare,
  Users,
  PlusCircle,
  RotateCcw,
} from "lucide-react";
import { useMarket } from "@/context/MarketContext";

export default function AdminDashboardPage() {
  const { db, resetDemoData } = useMarket();

  const stats = [
    {
      label: "ร้านค้าทั้งหมดในระบบ",
      value: `${db.shops.length} ร้าน`,
      href: "/admin/shops",
      icon: Store,
    },
    {
      label: "เมนูอาหารและสินค้า",
      value: `${db.products.length} รายการ`,
      href: "/admin/products",
      icon: Utensils,
    },
    {
      label: "หมวดหมู่สินค้า",
      value: `${db.categories.length} หมวด`,
      href: "/admin/categories",
      icon: Layers,
    },
    {
      label: "รีวิวทั้งหมด",
      value: `${db.reviews.length} รีวิว`,
      href: "/admin/reviews",
      icon: MessageSquare,
    },
    {
      label: "ผู้ใช้งานในระบบ",
      value: `${db.profiles.length} บัญชี`,
      href: "/admin/users",
      icon: Users,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#E5E5E5] bg-[#FFF8F0] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#222222]">
            ศูนย์ควบคุมระบบ KMUTT MARKET (Admin Dashboard)
          </h1>
          <p className="text-sm text-[#525252]">
            บริหารจัดการข้อมูลร้านค้า เมนู ตารางตลาดนัด ผังล็อก และผู้ใช้งานโดยไม่ต้องแก้ไขโค้ด
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/shops/new"
            className="btn-tactile inline-flex items-center gap-1.5 rounded-xl bg-[#A6192E] px-4 py-2.5 text-sm font-semibold text-white"
          >
            <PlusCircle className="h-4 w-4" />
            <span>เพิ่มร้านค้าใหม่</span>
          </Link>
          <button
            type="button"
            onClick={() => resetDemoData()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E5E5] bg-white px-4 py-2.5 text-sm font-medium text-[#222222] hover:border-[#A6192E]"
          >
            <RotateCcw className="h-4 w-4" />
            <span>รีเซ็ตข้อมูลเริ่มต้น BPUU</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((st) => {
          const Icon = st.icon;
          return (
            <Link
              key={st.label}
              href={st.href}
              className="card-editorial rounded-2xl border border-[#E5E5E5] bg-white p-5 flex items-center justify-between"
            >
              <div>
                <p className="text-sm text-[#525252]">{st.label}</p>
                <p className="font-heading text-2xl font-bold text-[#222222] mt-1 tabular-nums">
                  {st.value}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF8F0] text-[#A6192E]">
                <Icon className="h-5 w-5" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent Activity Logs */}
      <div className="rounded-2xl border border-[#E5E5E5] bg-white p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-[#222222]">
            ประวัติการแก้ไขข้อมูลล่าสุด (Activity Logs)
          </h2>
          <Link
            href="/admin/activity-logs"
            className="text-sm font-semibold text-[#A6192E] hover:underline"
          >
            ดูทั้งหมด →
          </Link>
        </div>

        <div className="divide-y divide-[#E5E5E5] text-sm">
          {db.activity_logs.slice(0, 6).map((log) => (
            <div
              key={log.id}
              className="py-3 flex flex-wrap items-center justify-between gap-2"
            >
              <div>
                <span className="font-bold text-[#222222]">{log.action}</span>{" "}
                <span className="text-[#525252]">
                  โดย {log.user_name} ({log.entity_type})
                </span>
              </div>
              <span className="text-sm text-[#525252] tabular-nums">
                {new Date(log.created_at).toLocaleString("th-TH")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
