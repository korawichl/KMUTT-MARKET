"use client";

import React, { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Heart,
  MapPin,
  Clock,
  Phone,
  ExternalLink,
  ShieldCheck,
  Star,
  Flag,
  Utensils,
  ArrowLeft,
  Calendar,
  Building2,
  CheckCircle2,
  UserCheck,
} from "lucide-react";
import { useMarket } from "@/context/MarketContext";
import { DynamicCampusMap } from "@/components/DynamicCampusMap";
import {
  cn,
  formatPrice,
  getShopOpeningStatus,
  SHOP_TYPE_LABELS,
  MARKET_TYPE_LABELS,
  THAI_DAYS,
} from "@/lib/utils";

export default function ShopDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = decodeURIComponent(params?.slug || "");

  const {
    db,
    currentUser,
    favoriteShopIds,
    toggleFavorite,
    submitOrUpdateReview,
    reportReview,
    switchDemoRole,
  } = useMarket();

  const shop = useMemo(
    () => db.shops.find((s) => s.slug === slug || s.id === slug),
    [db.shops, slug]
  );

  const [ratingInput, setRatingInput] = useState<number>(5);
  const [commentInput, setCommentInput] = useState<string>("");
  const [reportingReviewId, setReportingReviewId] = useState<string | null>(
    null
  );
  const [reportReason, setReportReason] = useState<string>(
    "ข้อความไม่เหมาะสมหรือข้อมูลคลาดเคลื่อน"
  );

  if (!shop) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center space-y-4">
        <h1 className="font-heading text-2xl font-bold text-[#222222]">
          ไม่พบข้อมูลร้านค้าที่คุณค้นหา
        </h1>
        <p className="text-base text-[#525252]">
          ร้านค้าอาจถูกย้ายหรือเปลี่ยนลิงก์แล้ว กรุณาเลือกดูจากทำเนียบร้านค้าทั้งหมด
        </p>
        <Link
          href="/shops"
          className="inline-flex items-center gap-2 rounded-xl bg-[#A6192E] px-5 py-2.5 text-sm font-semibold text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับไปหน้าทำเนียบร้านค้า
        </Link>
      </div>
    );
  }

  const category = db.categories.find((c) => c.id === shop.category_id);
  const isFav = favoriteShopIds.includes(shop.id);
  const opening = getShopOpeningStatus(shop, db.shop_schedules);
  const shopSchedules = db.shop_schedules
    .filter((s) => s.shop_id === shop.id && s.is_open)
    .sort((a, b) => a.day_of_week - b.day_of_week);
  const shopProducts = db.products.filter((p) => p.shop_id === shop.id);
  const shopReviews = db.reviews.filter(
    (r) => r.shop_id === shop.id && r.status !== "hidden"
  );
  const dataSource = db.shop_data_sources.find((ds) => ds.shop_id === shop.id);

  const existingUserReview = currentUser
    ? db.reviews.find(
        (r) => r.shop_id === shop.id && r.user_id === currentUser.id
      )
    : null;

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    const res = submitOrUpdateReview(shop.id, ratingInput, commentInput);
    if (res.ok) {
      setCommentInput("");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[#525252]">
        <div className="flex items-center gap-2">
          <Link
            href="/shops"
            className="inline-flex items-center gap-1.5 font-semibold text-[#A6192E] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>ทำเนียบร้านค้าทั้งหมด</span>
          </Link>
          <span>/</span>
          <span className="text-[#222222] font-medium">{shop.name}</span>
        </div>

        <span className="text-sm text-[#525252]">
          อัปเดตข้อมูลล่าสุด:{" "}
          {new Date(shop.updated_at).toLocaleDateString("th-TH", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </span>
      </div>

      {/* 7.1 SHOP HEADER */}
      <section className="overflow-hidden rounded-3xl border border-[#E5E5E5] bg-white shadow-xs">
        <div className="relative h-64 sm:h-80 w-full bg-[#FFF8F0]">
          <img
            src={shop.cover_image_url}
            alt={shop.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

          <div className="absolute top-4 right-4">
            <button
              type="button"
              onClick={() => toggleFavorite(shop.id)}
              className={cn(
                "btn-tactile inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-md",
                isFav
                  ? "bg-[#A6192E] text-white"
                  : "bg-white/95 text-[#222222] hover:text-[#A6192E]"
              )}
            >
              <Heart className={cn("h-4 w-4", isFav && "fill-current")} />
              <span>{isFav ? "บันทึกในร้านโปรดแล้ว" : "บันทึกร้านโปรด"}</span>
            </button>
          </div>

          <div className="absolute bottom-5 left-5 right-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-white">
            <div className="flex items-center gap-4">
              <img
                src={shop.logo_url}
                alt={`โลโก้ ${shop.name}`}
                className="h-18 w-18 sm:h-20 sm:w-20 rounded-2xl object-cover border-2 border-white shadow-md bg-white shrink-0"
              />
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-3 py-0.5 text-sm font-semibold",
                      opening.isOpenToday
                        ? "bg-[#16A34A] text-white"
                        : "bg-[#DC2626] text-white"
                    )}
                  >
                    {opening.statusLabel}
                  </span>
                  {category && (
                    <span className="rounded-full bg-white/20 backdrop-blur-xs px-3 py-0.5 text-sm font-medium text-white">
                      {category.name}
                    </span>
                  )}
                  {shop.verification_status === "verified" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-0.5 text-sm font-semibold text-[#16A34A]">
                      <ShieldCheck className="h-4 w-4" />
                      ยืนยันข้อมูลแล้ว
                    </span>
                  )}
                </div>
                <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold">
                  {shop.name}
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* Shop Description & Curated Tags */}
        <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-4">
            <h2 className="font-heading text-xl font-bold text-[#222222]">
              เกี่ยวกับร้านค้า
            </h2>
            <p className="text-base text-[#222222] leading-relaxed">
              {shop.description}
            </p>

            {shop.tags && shop.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {shop.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-lg bg-[#FFF8F0] border border-[#A6192E]/25 px-3 py-1 text-sm font-medium text-[#761626]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Data Provenance Box (Table 11.11 shop_data_sources) */}
            {dataSource && (
              <div className="mt-4 rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA] p-4 space-y-1.5 text-sm">
                <div className="flex items-center gap-2 font-semibold text-[#222222]">
                  <CheckCircle2 className="h-4 w-4 text-[#16A34A] shrink-0" />
                  <span>แหล่งที่มาของข้อมูล: {dataSource.source_name}</span>
                </div>
                <p className="text-[#525252]">{dataSource.verification_note}</p>
                {dataSource.source_url && (
                  <a
                    href={dataSource.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-[#A6192E] hover:underline"
                  >
                    <span>ดูหน้าอ้างอิงต้นฉบับ</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* 7.2 SHOP INFORMATION PANEL */}
          <div className="lg:col-span-5 rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA] p-5 space-y-3.5 text-sm">
            <h3 className="font-heading text-lg font-bold text-[#222222] pb-2 border-b border-[#E5E5E5]">
              ข้อมูลร้านค้าและเวลาเปิดทำการ
            </h3>

            <div className="flex items-start gap-3">
              <Building2 className="h-4 w-4 text-[#A6192E] shrink-0 mt-1" />
              <div>
                <span className="text-[#525252] block">ประเภทร้านค้า & ตลาด:</span>
                <span className="font-semibold text-[#222222]">
                  {SHOP_TYPE_LABELS[shop.shop_type].label} •{" "}
                  {MARKET_TYPE_LABELS[shop.market_type] || shop.market_type}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-[#A6192E] shrink-0 mt-1" />
              <div>
                <span className="text-[#525252] block">อาคารและจุดที่ตั้ง:</span>
                <span className="font-semibold text-[#222222]">
                  {shop.building_name}
                </span>
                <span className="block text-[#525252]">
                  {shop.location_description}
                  {shop.stall_number ? ` • ล็อกหมายเลข ${shop.stall_number}` : ""}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-[#A6192E] shrink-0 mt-1" />
              <div className="w-full">
                <span className="text-[#525252] block mb-1">
                  ตารางวันและเวลาเปิดทำการ:
                </span>
                {shopSchedules.length > 0 ? (
                  <div className="grid grid-cols-1 gap-1">
                    {shopSchedules.map((sc) => (
                      <div
                        key={sc.id}
                        className="flex items-center justify-between rounded-lg bg-white border border-[#E5E5E5] px-3 py-1.5"
                      >
                        <span className="font-medium text-[#222222]">
                          {THAI_DAYS[sc.day_of_week]?.full}
                        </span>
                        <span className="font-semibold text-[#16A34A] tabular-nums">
                          {sc.open_time} – {sc.close_time} น.
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-[#525252]">
                    ยังไม่มีตารางเวลาที่ยืนยัน
                  </span>
                )}
              </div>
            </div>

            {shop.contact_phone && (
              <div className="flex items-center gap-3 pt-1">
                <Phone className="h-4 w-4 text-[#A6192E] shrink-0" />
                <div>
                  <span className="text-[#525252] mr-2">เบอร์ติดต่อร้าน:</span>
                  <a
                    href={`tel:${shop.contact_phone}`}
                    className="font-semibold text-[#A6192E] hover:underline tabular-nums"
                  >
                    {shop.contact_phone}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 7.3 MENU / PRODUCTS */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-2xl font-bold text-[#222222]">
              รายการเมนูและสินค้าของร้าน ({shopProducts.length} รายการ)
            </h2>
            <p className="text-sm text-[#525252]">
              ราคาแสดงเป็นเงินบาทตามจริง (หากรายการใดขึ้นอยู่กับขนาดหรือวัตถุดิบจะแสดงข้อความ &ldquo;สอบถามราคาที่ร้าน&rdquo;)
            </p>
          </div>
        </div>

        {shopProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shopProducts.map((prod) => (
              <div
                key={prod.id}
                className="card-editorial flex flex-col overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white"
              >
                <div className="relative aspect-[16/10] w-full bg-[#FFF8F0]">
                  <img
                    src={prod.image_url}
                    alt={prod.name}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-sm font-semibold",
                        prod.is_available
                          ? "bg-[#16A34A] text-white"
                          : "bg-[#DC2626] text-white"
                      )}
                    >
                      {prod.is_available ? "พร้อมจำหน่าย" : "หมดชั่วคราว"}
                    </span>
                  </div>
                  <div className="absolute bottom-3 right-3">
                    <span className="rounded-xl bg-[#222222]/90 px-3 py-1.5 text-sm font-bold text-white tabular-nums">
                      {formatPrice(prod.price)}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-heading text-lg font-bold text-[#222222]">
                      <Link
                        href={`/products/${prod.slug}`}
                        className="hover:text-[#A6192E]"
                      >
                        {prod.name}
                      </Link>
                    </h3>
                    <p className="mt-1.5 text-sm text-[#525252] leading-relaxed">
                      {prod.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#E5E5E5] flex items-center justify-between">
                    <span className="text-sm font-bold text-[#A6192E] tabular-nums">
                      {formatPrice(prod.price)}
                    </span>
                    <Link
                      href={`/products/${prod.slug}`}
                      className="text-sm font-semibold text-[#222222] hover:text-[#A6192E]"
                    >
                      ดูรายละเอียดเมนู →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-[#E5E5E5] bg-white p-8 text-center">
            <Utensils className="mx-auto h-8 w-8 text-[#A6192E] mb-2" />
            <p className="text-base font-semibold text-[#222222]">
              ร้านนี้กำลังอยู่ระหว่างอัปเดตรายการเมนูย่อย
            </p>
            <p className="text-sm text-[#525252] mt-1">
              สามารถดูประเภทอาหารจากรายละเอียดร้านค้า หรือแวะชมเมนูประจำวันที่หน้าร้าน ({shop.building_name})
            </p>
          </div>
        )}
      </section>

      {/* 7.4 SHOP LOCATION ON MAP */}
      <section className="rounded-3xl border border-[#E5E5E5] bg-white p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-2xl font-bold text-[#222222]">
              แผนที่และพิกัดร้านค้า
            </h2>
            <p className="text-sm text-[#525252]">
              {shop.building_name} — {shop.location_description}{" "}
              {shop.location_verified
                ? "(พิกัดอาคารยืนยันจากแผนที่ มจธ.)"
                : "(ตำแหน่งโดยประมาณในโซนลานตลาดนัด อาคาร S2)"}
            </p>
          </div>
          <Link
            href="/market/map"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#A6192E] px-4 py-2 text-sm font-semibold text-[#A6192E] hover:bg-[#FFF8F0]"
          >
            <MapPin className="h-4 w-4" />
            <span>ดูแผนที่รวม & ผังล็อกตลาดนัด</span>
          </Link>
        </div>

        <DynamicCampusMap
          shops={[shop]}
          categories={db.categories}
          schedules={db.shop_schedules}
          center={[shop.latitude || 13.650954, shop.longitude || 100.491752]}
          zoom={17}
          selectedShopId={shop.id}
          heightClass="h-[380px]"
        />
      </section>

      {/* 7.5 REVIEWS & RATING SECTION */}
      <section className="rounded-3xl border border-[#E5E5E5] bg-white p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E5E5]">
          <div>
            <h2 className="font-heading text-2xl font-bold text-[#222222]">
              รีวิวจากนักศึกษาและผู้มาใช้บริการ ({shopReviews.length})
            </h2>
            <p className="text-sm text-[#525252]">
              รีวิวทั้งหมดเชื่อมโยงกับบัญชีผู้ใช้งานจริง (จำกัด 1 บัญชีต่อ 1 รีวิวร้านค้า โดยสามารถแก้ไขรีวิวเดิมได้)
            </p>
          </div>
        </div>

        {/* Review Submission / Editing Form */}
        <div className="rounded-2xl border border-[#E5E5E5] bg-[#FFF8F0] p-5">
          {currentUser ? (
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#222222]">
                  <UserCheck className="h-4 w-4 text-[#16A34A]" />
                  <span>
                    กำลังรีวิวในชื่อ: {currentUser.full_name}{" "}
                    {existingUserReview && "(คุณเคยรีวิวร้านนี้แล้ว ระบบจะอัปเดตรีวิวเดิมของคุณ)"}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-[#222222] mr-1">
                    ให้คะแนน:
                  </span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingInput(star)}
                      aria-label={`ให้คะแนน ${star} ดาว`}
                      className="p-1"
                    >
                      <Star
                        className={cn(
                          "h-5 w-5",
                          star <= ratingInput
                            ? "fill-[#F59E0B] text-[#F59E0B]"
                            : "text-[#737373]"
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                rows={3}
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder={
                  existingUserReview
                    ? `รีวิวเดิมของคุณ: "${existingUserReview.comment}" — พิมพ์ข้อความใหม่เพื่อแก้ไขรีวิว...`
                    : "แบ่งปันเมนูที่คุณสั่ง รสชาติ ความคุ้มค่า หรือช่วงเวลาที่แนะนำให้มา..."
                }
                required
                className="w-full rounded-xl border border-[#E5E5E5] bg-white p-3.5 text-sm text-[#222222] focus:border-[#A6192E] focus:outline-none"
              />

              <button
                type="submit"
                className="btn-tactile rounded-xl bg-[#A6192E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#761626]"
              >
                {existingUserReview ? "บันทึกการแก้ไขรีวิว" : "ส่งรีวิวร้านค้า"}
              </button>
            </form>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-heading text-base font-bold text-[#222222]">
                  ต้องการเขียนรีวิวบอกต่อความอร่อยของร้านนี้?
                </h3>
                <p className="text-sm text-[#525252]">
                  เข้าสู่ระบบด้วยบัญชีนักศึกษาเพื่อเขียนรีวิว (หรือกดปุ่มสลับเป็นโหมดนักศึกษาได้ในคลิกเดียว)
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => switchDemoRole("student")}
                  className="btn-tactile rounded-xl bg-[#A6192E] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#761626]"
                >
                  เข้าโหมดนักศึกษาทันที (1-Click)
                </button>
                <Link
                  href="/auth/login"
                  className="btn-tactile rounded-xl border border-[#E5E5E5] bg-white px-4 py-2.5 text-sm font-semibold text-[#222222]"
                >
                  หน้าเข้าสู่ระบบ
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Review List */}
        {shopReviews.length > 0 ? (
          <div className="space-y-4">
            {shopReviews.map((rev) => (
              <div
                key={rev.id}
                className="rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA] p-5 space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-base text-[#222222]">
                      {rev.user_name}
                    </span>
                    {rev.user_role_badge && (
                      <span className="rounded-md bg-white border border-[#E5E5E5] px-2.5 py-0.5 text-sm font-medium text-[#16A34A]">
                        {rev.user_role_badge}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-4 w-4",
                            i < rev.rating
                              ? "fill-[#F59E0B] text-[#F59E0B]"
                              : "text-[#E5E5E5]"
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-[#525252]">
                      {new Date(rev.created_at).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                <p className="text-base text-[#222222] leading-relaxed">
                  {rev.comment}
                </p>

                <div className="pt-1 flex items-center justify-between text-sm">
                  {rev.status === "reported" ? (
                    <span className="text-[#F59E0B] font-medium">
                      อยู่ระหว่างรอผู้ดูแลระบบตรวจสอบรายงาน
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setReportingReviewId(rev.id)}
                      className="inline-flex items-center gap-1 text-sm text-[#525252] hover:text-[#DC2626]"
                    >
                      <Flag className="h-3.5 w-3.5" />
                      <span>แจ้งรีวิวไม่เหมาะสม</span>
                    </button>
                  )}
                </div>

                {reportingReviewId === rev.id && (
                  <div className="mt-2 rounded-xl border border-[#E5E5E5] bg-white p-3 flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="flex-1 rounded-lg border border-[#E5E5E5] px-3 py-1.5 text-sm"
                      placeholder="ระบุเหตุผลที่แจ้งรายงาน..."
                    />
                    <button
                      type="button"
                      onClick={() => {
                        reportReview(rev.id, reportReason);
                        setReportingReviewId(null);
                      }}
                      className="rounded-lg bg-[#DC2626] px-3 py-1.5 text-sm font-semibold text-white"
                    >
                      ยืนยันการแจ้ง
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportingReviewId(null)}
                      className="rounded-lg border border-[#E5E5E5] px-3 py-1.5 text-sm text-[#525252]"
                    >
                      ยกเลิก
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-[#525252] py-4">
            ยังไม่มีรีวิวสำหรับร้านนี้ มาร่วมเป็นคนแรกที่รีวิวความอร่อยกัน!
          </p>
        )}
      </section>
    </div>
  );
}
