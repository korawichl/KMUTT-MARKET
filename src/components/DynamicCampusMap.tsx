"use client";

import dynamic from "next/dynamic";

export const DynamicCampusMap = dynamic(
  () => import("@/components/CampusLeafletMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[520px] w-full items-center justify-center rounded-2xl border border-[#E5E5E5] bg-[#FFF8F0] text-sm font-medium text-[#761626]">
        กำลังโหลดแผนที่มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี (OpenStreetMap)...
      </div>
    ),
  }
);
