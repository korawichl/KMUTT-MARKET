import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Shop, ShopSchedule } from "@/types/database";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const THAI_DAYS: Record<number, { full: string; short: string; badgeColor: string }> = {
  0: { full: "วันอาทิตย์", short: "อา.", badgeColor: "bg-red-50 text-red-700 border-red-200" },
  1: { full: "วันจันทร์", short: "จ.", badgeColor: "bg-amber-50 text-amber-800 border-amber-200" },
  2: { full: "วันอังคาร", short: "อ.", badgeColor: "bg-pink-50 text-pink-700 border-pink-200" },
  3: { full: "วันพุธ", short: "พ.", badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  4: { full: "วันพฤหัสบดี", short: "พฤ.", badgeColor: "bg-orange-50 text-orange-700 border-orange-200" },
  5: { full: "วันศุกร์", short: "ศ.", badgeColor: "bg-sky-50 text-sky-700 border-sky-200" },
  6: { full: "วันเสาร์", short: "ส.", badgeColor: "bg-purple-50 text-purple-700 border-purple-200" },
};

export const SHOP_TYPE_LABELS: Record<Shop["shop_type"], { label: string; badge: string }> = {
  campus_food_court: {
    label: "ศูนย์อาหาร มจธ.",
    badge: "bg-[#FFF8F0] text-[#761626] border-[#A6192E]/25",
  },
  permanent_shop: {
    label: "ร้านค้าประจำใน มจธ.",
    badge: "bg-stone-100 text-stone-800 border-stone-300",
  },
  market_stall: {
    label: "ร้านตลาดนัด มจธ.",
    badge: "bg-[#A6192E]/10 text-[#A6192E] border-[#A6192E]/30",
  },
  nearby_shop: {
    label: "ร้านเด็ดรอบรั้วบางมด",
    badge: "bg-amber-50 text-amber-900 border-amber-300",
  },
};

export const MARKET_TYPE_LABELS: Record<string, string> = {
  community_tue: "ตลาดนัดสินค้าชุมชน (วันอังคาร)",
  kmutt_wed_thu: "ตลาดนัด มจธ. (วันพุธ–พฤหัสบดี)",
  all_market_days: "ตลาดนัด มจธ. (อังคาร–พฤหัสบดี)",
  daily_campus: "เปิดบริการตามเวลาอาคาร (จันทร์–ศุกร์/เสาร์)",
};

export function formatPrice(price: number | null | undefined): string {
  if (price === null || price === undefined || Number.isNaN(Number(price))) {
    return "สอบถามราคาที่ร้าน";
  }
  return `฿${Number(price).toLocaleString("th-TH", {
    minimumFractionDigits: Number(price) % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function getBangkokNow(): {
  dayOfWeek: number;
  hour: number;
  minute: number;
  timeString: string;
  thaiDateString: string;
} {
  const now = new Date();
  const bangkokStr = now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" });
  const bangkokDate = new Date(bangkokStr);
  const dayOfWeek = bangkokDate.getDay();
  const hour = bangkokDate.getHours();
  const minute = bangkokDate.getMinutes();
  const timeString = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  const thaiDateString = now.toLocaleDateString("th-TH", {
    timeZone: "Asia/Bangkok",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return { dayOfWeek, hour, minute, timeString, thaiDateString };
}

export function getShopOpeningStatus(
  shop: Shop,
  schedules: ShopSchedule[]
): {
  isOpenToday: boolean;
  isOpenNow: boolean;
  statusLabel: string;
  todaySchedule?: ShopSchedule;
  openDaysLabel: string;
} {
  const { dayOfWeek, timeString } = getBangkokNow();
  const shopSchedules = schedules.filter((s) => s.shop_id === shop.id && s.is_open);

  if (shop.status !== "active") {
    return {
      isOpenToday: false,
      isOpenNow: false,
      statusLabel: shop.status === "pending" ? "รอตรวจสอบ" : "ปิดชั่วคราว",
      openDaysLabel: "หยุดให้บริการชั่วคราว",
    };
  }

  const todaySchedule = shopSchedules.find((s) => s.day_of_week === dayOfWeek);
  const sortedDays = [...shopSchedules].sort((a, b) => a.day_of_week - b.day_of_week);

  let openDaysLabel = "ยังไม่ได้ระบุวันเปิดขาย";
  if (sortedDays.length > 0) {
    const dayNumbers = sortedDays.map((d) => d.day_of_week);
    if (
      dayNumbers.length === 5 &&
      dayNumbers.every((d) => d >= 1 && d <= 5)
    ) {
      openDaysLabel = "จันทร์–ศุกร์";
    } else if (
      dayNumbers.length === 6 &&
      dayNumbers.every((d) => d >= 1 && d <= 6)
    ) {
      openDaysLabel = "จันทร์–เสาร์";
    } else if (dayNumbers.length === 7) {
      openDaysLabel = "เปิดทุกวัน";
    } else {
      openDaysLabel = sortedDays.map((d) => THAI_DAYS[d.day_of_week]?.short || "").join(" / ");
    }
  }

  if (!todaySchedule) {
    return {
      isOpenToday: false,
      isOpenNow: false,
      statusLabel: "ปิดวันนี้",
      openDaysLabel,
    };
  }

  const isWithinHours =
    timeString >= todaySchedule.open_time && timeString <= todaySchedule.close_time;

  return {
    isOpenToday: true,
    isOpenNow: isWithinHours,
    statusLabel: isWithinHours
      ? `เปิดอยู่ (${todaySchedule.open_time}–${todaySchedule.close_time})`
      : `เปิดวันนี้ (${todaySchedule.open_time}–${todaySchedule.close_time})`,
    todaySchedule,
    openDaysLabel,
  };
}

export function slugify(text: string): string {
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\u0E00-\u0E7Fa-z0-9\-]+/g, "")
    .replace(/\-\-+/g, "-");
}
