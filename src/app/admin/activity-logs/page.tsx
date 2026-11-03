"use client";

import React from "react";
import { useMarket } from "@/context/MarketContext";

export default function AdminActivityLogsPage() {
  const { db } = useMarket();

  return (
    <div className="rounded-2xl border border-[#E5E5E5] bg-white p-6 space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-[#222222]">
          บันทึกประวัติการใช้งานระบบ (Activity Logs)
        </h1>
        <p className="text-sm text-[#525252]">
          ตรวจสอบการสร้าง แก้ไข หรือลบข้อมูลในระบบทั้งหมด ({db.activity_logs.length} รายการ)
        </p>
      </div>

      <div className="divide-y divide-[#E5E5E5]">
        {db.activity_logs.map((log) => (
          <div
            key={log.id}
            className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm"
          >
            <div>
              <span className="inline-flex items-center rounded-md bg-[#FFF8F0] border border-[#A6192E]/25 px-2.5 py-0.5 font-bold text-[#A6192E] mr-2">
                {log.action}
              </span>
              <span className="font-semibold text-[#222222]">
                {log.user_name}
              </span>{" "}
              <span className="text-[#525252]">
                ({log.entity_type} • ID: {log.entity_id})
              </span>
            </div>
            <span className="text-[#525252] tabular-nums">
              {new Date(log.created_at).toLocaleString("th-TH")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
