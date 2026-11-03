"use client";

import React from "react";
import { useMarket } from "@/context/MarketContext";
import { UserRole } from "@/types/database";

export default function AdminUsersPage() {
  const { db, updateUserRole } = useMarket();

  return (
    <div className="rounded-2xl border border-[#E5E5E5] bg-white p-6 space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-[#222222]">
          จัดการบัญชีผู้ใช้งาน ({db.profiles.length} บัญชี)
        </h1>
        <p className="text-sm text-[#525252]">
          กำหนดสิทธิ์ผู้ใช้งานระหว่าง student, vendor และ admin ด้วยระบบฝั่งเซิร์ฟเวอร์
        </p>
      </div>

      <div className="divide-y divide-[#E5E5E5]">
        {db.profiles.map((user) => (
          <div
            key={user.id}
            className="py-4 flex flex-wrap items-center justify-between gap-4"
          >
            <div>
              <p className="font-bold text-base text-[#222222]">
                {user.full_name}
              </p>
              <p className="text-sm text-[#525252]">{user.email}</p>
            </div>

            <select
              value={user.role}
              onChange={(e) =>
                updateUserRole(user.id, e.target.value as UserRole)
              }
              className="rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] px-3.5 py-2 text-sm font-semibold"
            >
              <option value="student">นักศึกษา (student)</option>
              <option value="vendor">ผู้ประกอบการร้านค้า (vendor)</option>
              <option value="admin">ผู้ดูแลระบบ (admin)</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
