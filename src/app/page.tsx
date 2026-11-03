"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  MapPin,
  Clock,
  Calendar,
  Sparkles,
  ArrowRight,
  Store,
  Utensils,
  Coffee,
  ShieldCheck,
  Info,
  Megaphone,
} from "lucide-react";
import { useMarket } from "@/context/MarketContext";
import { ShopCard } from "@/components/ShopCard";
import { ProductCard } from "@/components/ProductCard";
import {
  getBangkokNow,
  getShopOpeningStatus,
  formatPrice,
  THAI_DAYS,
} from "@/lib/utils";

export default function HomePage() {
  const router = useRouter();
  const { db, setIsCravingPickerOpen } = useMarket();

  const [searchQuery, setSearchQuery] = useState("");
  const [todayFilter, setTodayFilter] = useState<
    "all" | "market" | "s14" | "cafe"
  >("all");

  const bangkokNow = useMemo(() => getBangkokNow(), []);

  const activeShops = useMemo(
    () => db.shops.filter((s) => s.status === "active"),
    [db.shops]
  );

  const activeCategories = useMemo(
    () =>
      [...db.categories]
        .filter((c) => c.is_active)
        .sort((a, b) => a.sort_order - b.sort_order),
    [db.categories]
  );

  const recommendedShops = useMemo(
    () => activeShops.filter((s) => s.is_recommended).slice(0, 6),
    [activeShops]
  );

  const featuredProducts = useMemo(
    () =>
      db.products
        .filter((p) => p.is_available && p.is_recommended)
        .slice(0, 8),
    [db.products]
  );

  // Quick live search suggestions in Hero
  const searchSuggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const matchedShops = activeShops
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.building_name.toLowerCase().includes(q)
      )
      .slice(0, 3);
    const matchedProducts = db.products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      )
      .slice(0, 3);
    return { matchedShops, matchedProducts };
  }, [activeShops, db.products, searchQuery]);

  // 5.7 Today's Shops (Asia/Bangkok timezone)
  const todaysOpenShops = useMemo(() => {
    return activeShops.filter((shop) => {
      const status = getShopOpeningStatus(shop, db.shop_schedules);
      if (!status.isOpenToday) return false;
      if (todayFilter === "market") return shop.shop_type === "market_stall";
      if (todayFilter === "s14") return shop.building_name.includes("S14");
      if (todayFilter === "cafe")
        return (
          shop.category_id === "cat-09" ||
          shop.category_id === "cat-10" ||
          shop.category_id === "cat-08"
        );
      return true;
    });
  }, [activeShops, db.shop_schedules, todayFilter]);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      router.push(`/shops?q=${encodeURIComponent(q)}`);
    } else {
      router.push("/shops");
    }
  };

  return (
    <div className="space-y-16 pb-8">
      {/* 5.2 HERO SECTION — Editorial Food Magazine & Live Market Pulse */}
      <section className="border-b border-[#E5E5E5] bg-[#FFF8F0]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Left Column (7 cols): Headline, Search, Quick Filters & Actions */}
            <div className="lg:col-span-7 space-y-6 animate-enter">
              <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-[#A6192E]/25 bg-white px-3.5 py-1.5 text-sm font-semibold text-[#A6192E]">
                <Utensils className="h-4 w-4" />
                <span>หิวเมื่อไหร่ คิดถึงตลาด มจธ. • ค้นหาร้านเด็ด เช็กเมนูโปรด ครบจบในที่เดียว</span>
              </div>

              <div className="space-y-3">
                <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-[#222222] tracking-tight">
                  ตลาด มจธ. มีอะไรอร่อยบ้าง?
                </h1>
                <p className="text-base sm:text-lg text-[#525252] max-w-2xl leading-relaxed">
                  ค้นพบร้านโปรด เมนูเด็ด และสินค้าน่าสนใจในรั้ว KMUTT ทั้งโรงอาหารตึก 190 ปี (S14),
                  ร้านลุงกบ S11, คาเฟ่ประจำตึก และตลาดนัดใต้ตึกจอดรถ S2
                </p>
              </div>

              {/* Working Search Bar with Live Dropdown Suggestions */}
              <div className="relative max-w-2xl">
                <form
                  onSubmit={handleHeroSearch}
                  className="flex flex-col sm:flex-row gap-2.5 rounded-2xl border border-[#E5E5E5] bg-white p-2 shadow-sm focus-within:border-[#A6192E]"
                >
                  <div className="flex flex-1 items-center gap-2.5 px-3 py-1.5">
                    <Search className="h-5 w-5 text-[#A6192E] shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ค้นหาร้านอาหาร เมนู หรือสินค้า..."
                      aria-label="ค้นหาร้านอาหาร เมนู หรือสินค้า"
                      className="w-full bg-transparent text-base text-[#222222] placeholder:text-[#737373] focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn-tactile inline-flex items-center justify-center gap-2 rounded-xl bg-[#A6192E] px-6 py-3 text-base font-semibold text-white hover:bg-[#761626]"
                  >
                    <Search className="h-4 w-4" />
                    <span>ค้นหาเลย</span>
                  </button>
                </form>

                {/* Instant Suggestions Dropdown */}
                {searchQuery.trim() !== "" &&
                  !Array.isArray(searchSuggestions) &&
                  (searchSuggestions.matchedShops.length > 0 ||
                    searchSuggestions.matchedProducts.length > 0) && (
                    <div className="absolute left-0 right-0 mt-2 rounded-2xl border border-[#E5E5E5] bg-white p-4 shadow-xl z-30 space-y-3">
                      {searchSuggestions.matchedShops.length > 0 && (
                        <div>
                          <p className="text-sm font-bold text-[#761626] mb-1.5">
                            ร้านค้าที่ตรงกับคำค้นหา
                          </p>
                          <div className="space-y-1">
                            {searchSuggestions.matchedShops.map((s) => (
                              <Link
                                key={s.id}
                                href={`/shops/${s.slug}`}
                                className="flex items-center justify-between rounded-xl px-3 py-2 text-sm hover:bg-[#FFF8F0]"
                              >
                                <span className="font-semibold text-[#222222]">
                                  {s.name}
                                </span>
                                <span className="text-sm text-[#525252]">
                                  {s.building_name}
                                </span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {searchSuggestions.matchedProducts.length > 0 && (
                        <div className="pt-2 border-t border-[#E5E5E5]">
                          <p className="text-sm font-bold text-[#761626] mb-1.5">
                            เมนูอาหารและสินค้า
                          </p>
                          <div className="space-y-1">
                            {searchSuggestions.matchedProducts.map((p) => (
                              <Link
                                key={p.id}
                                href={`/products/${p.slug}`}
                                className="flex items-center justify-between rounded-xl px-3 py-2 text-sm hover:bg-[#FFF8F0]"
                              >
                                <span className="font-medium text-[#222222]">
                                  {p.name}
                                </span>
                                <span className="font-bold text-[#A6192E] tabular-nums">
                                  {formatPrice(p.price)}
                                </span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
              </div>

              {/* Popular Quick Search Tags */}
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-semibold text-[#222222]">คำค้นยอดฮิต:</span>
                {[
                  { label: "โรงอาหาร S14", q: "S14" },
                  { label: "ข้าวยำไก่แซ่บ", q: "ไก่แซ่บ" },
                  { label: "ลุงกบ S11", q: "ลุงกบ" },
                  { label: "อาหารฮาลาล", q: "ฮาลาล" },
                  { label: "กาแฟ & ชานม", q: "กาแฟ" },
                  { label: "หมูกรอบ", q: "หมูกรอบ" },
                ].map((chip) => (
                  <Link
                    key={chip.label}
                    href={`/shops?q=${encodeURIComponent(chip.q)}`}
                    className="rounded-lg border border-[#E5E5E5] bg-white px-3 py-1 text-sm font-medium text-[#222222] hover:border-[#A6192E] hover:text-[#A6192E] transition-colors"
                  >
                    {chip.label}
                  </Link>
                ))}
              </div>

              {/* Primary CTA Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  href="/shops"
                  className="btn-tactile inline-flex items-center gap-2 rounded-xl bg-[#222222] px-5 py-3 text-base font-semibold text-white hover:bg-[#761626]"
                >
                  <Store className="h-5 w-5" />
                  <span>ดูร้านค้าทั้งหมด ({activeShops.length} ร้าน)</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setIsCravingPickerOpen(true)}
                  className="btn-tactile inline-flex items-center gap-2 rounded-xl border border-[#A6192E] bg-white px-5 py-3 text-base font-semibold text-[#A6192E] hover:bg-[#A6192E] hover:text-white"
                >
                  <Sparkles className="h-5 w-5" />
                  <span>สุ่มร้านเด็ด: วันนี้กินอะไรดี?</span>
                </button>
              </div>
            </div>

            {/* Right Column (5 cols): Editorial Visual & Live Market Pulse */}
            <div className="lg:col-span-5">
              <div className="overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white shadow-md">
                <div className="relative aspect-[16/10] w-full overflow-hidden">
                  <img
                    src="https://bpuu.kmutt.ac.th/wp-content/uploads/2024/03/371126.jpg"
                    alt="บรรยากาศตลาดนัดสินค้าชุมชนและตลาดนัด มจธ. อาคาร S2"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#A6192E] px-3 py-1 text-sm font-semibold text-white mb-2">
                      <Clock className="h-4 w-4" />
                      อัปเดตตามเวลาจริง: {bangkokNow.thaiDateString}
                    </span>
                    <h2 className="font-heading text-xl font-bold">
                      ตลาดนัด มจธ. & ศูนย์อาหารบางมด
                    </h2>
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-[#222222]">
                      ร้านค้าที่เปิดให้บริการในวันนี้
                    </span>
                    <span className="rounded-full bg-[#16A34A]/15 px-3 py-0.5 font-bold text-[#16A34A] tabular-nums">
                      เปิดวันนี้ {todaysOpenShops.length} ร้าน
                    </span>
                  </div>
                  <p className="text-sm text-[#525252]">
                    ลานชั้น 1 อาคารจอดรถ 14 ชั้น (S2) และโรงอาหารอาคารพระจอมเกล้าราชานุสรณ์ 190 ปี (S14)
                  </p>
                  <div className="pt-2 border-t border-[#E5E5E5] flex items-center justify-between">
                    <Link
                      href="/market/map"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#A6192E] hover:underline"
                    >
                      <MapPin className="h-4 w-4" />
                      <span>เปิดแผนที่พิกัดตึก & ล็อกตลาดนัด</span>
                    </Link>
                    <Link
                      href="/market/schedule"
                      className="text-sm font-medium text-[#525252] hover:text-[#222222]"
                    >
                      เช็กตารางตลาด →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5.3 MARKET INFORMATION CARDS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#222222]">
              ตารางตลาดนัดประจำสัปดาห์ มจธ. บางมด
            </h2>
            <p className="text-base text-[#525252] mt-1">
              เวลาทำการ {db.market_config.default_open_time}–{db.market_config.default_close_time} น. (ร้านค้าเริ่มตั้งร้าน {db.market_config.default_setup_time} น.) ณ ลานชั้น 1 อาคารจอดรถ 14 ชั้น (S2)
            </p>
          </div>
          <Link
            href="/market/schedule"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#A6192E] hover:underline"
          >
            <span>ดูปฏิทินตลาดนัดและประกาศทั้งหมด</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {db.market_events.slice(0, 3).map((evt) => {
            const isToday = evt.day_of_week === bangkokNow.dayOfWeek;
            return (
              <div
                key={evt.id}
                className="rounded-2xl border border-[#E5E5E5] bg-white p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#FFF8F0] border border-[#A6192E]/25 px-3 py-1 text-sm font-semibold text-[#A6192E]">
                      <Calendar className="h-4 w-4" />
                      {evt.day_of_week !== null && evt.day_of_week !== undefined
                        ? THAI_DAYS[evt.day_of_week]?.full
                        : "วันพิเศษ"}
                    </span>
                    {isToday ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#16A34A] px-3 py-1 text-sm font-semibold text-white">
                        เปิดทำการวันนี้
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-[#FAFAFA] border border-[#E5E5E5] px-3 py-1 text-sm font-medium text-[#525252]">
                        {evt.status === "active" ? "ตามตารางปกติ" : "งดจัดชั่วคราว"}
                      </span>
                    )}
                  </div>

                  <h3 className="font-heading text-xl font-bold text-[#222222]">
                    {evt.name}
                  </h3>
                  <p className="mt-2 text-sm text-[#525252] leading-relaxed">
                    {evt.description}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-[#E5E5E5] space-y-1.5 text-sm text-[#222222]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#525252]">เวลาเปิดขาย:</span>
                    <span className="font-semibold tabular-nums">
                      {evt.start_time}–{evt.end_time} น. (จัดร้าน {evt.setup_time} น.)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#525252]">สถานที่:</span>
                    <span className="font-medium">KMUTT Bangmod (ตึก S2)</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Official Note & Announcements Banner */}
        <div className="mt-4 rounded-xl border border-[#E5E5E5] bg-[#FFF8F0] px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-[#222222]">
          <div className="flex items-start sm:items-center gap-2.5">
            <Info className="h-5 w-5 text-[#A6192E] shrink-0 mt-0.5 sm:mt-0" />
            <span>
              <strong>หมายเหตุ:</strong> {db.market_config.note}
            </span>
          </div>
          <Link
            href="/market"
            className="shrink-0 font-semibold text-[#A6192E] hover:underline"
          >
            ดูรายละเอียดขนาดล็อก & ค่าพื้นที่ →
          </Link>
        </div>
      </section>

      {/* 5.7 TODAY'S SHOPS (Calculated via Asia/Bangkok Timezone) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-[#E5E5E5] bg-white p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#E5E5E5]">
            <div>
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#16A34A] mb-1">
                <span className="h-2.5 w-2.5 rounded-full bg-[#16A34A]" />
                <span>เช็กร้านเปิดขายวันนี้ ({bangkokNow.thaiDateString})</span>
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#222222]">
                วันนี้กินร้านไหนได้บ้าง?
              </h2>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: "all", label: "ทั้งหมดที่เปิดวันนี้" },
                { id: "s14", label: "โรงอาหาร S14" },
                { id: "cafe", label: "กาแฟ & เครื่องดื่ม" },
                { id: "market", label: "ร้านตลาดนัด (อังคาร–พฤหัสฯ)" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() =>
                    setTodayFilter(tab.id as "all" | "market" | "s14" | "cafe")
                  }
                  className={`btn-tactile rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                    todayFilter === tab.id
                      ? "bg-[#A6192E] text-white"
                      : "bg-[#FAFAFA] text-[#222222] border border-[#E5E5E5] hover:bg-[#FFF8F0]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {todaysOpenShops.length > 0 ? (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {todaysOpenShops.slice(0, 6).map((shop) => (
                <ShopCard key={shop.id} shop={shop} />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA] p-10 text-center">
              <p className="text-lg font-semibold text-[#222222]">
                ยังไม่มีข้อมูลร้านค้าที่เปิดขายในวันนี้
              </p>
              <p className="text-sm text-[#525252] mt-1">
                ลองเปลี่ยนตัวกรองด้านบน หรือดูตารางเปิดทำการของร้านค้าทั้งหมดในหน้าทำเนียบร้านค้า
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 5.4 CATEGORY SECTION */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#222222]">
              เลือกตามหมวดหมู่ของกินและสินค้า
            </h2>
            <p className="text-base text-[#525252] mt-1">
              ครบทั้งอาหารตามสั่ง ข้าวราดแกง ก๋วยเตี๋ยว อาหารฮาลาล คาเฟ่ และสินค้าแฟชั่นในตลาดนัด
            </p>
          </div>
          <Link
            href="/categories"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#A6192E] hover:underline"
          >
            <span>ดูหมวดหมู่ทั้งหมด ({activeCategories.length} หมวด)</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
          {activeCategories.map((cat) => {
            const shopCount = activeShops.filter(
              (s) => s.category_id === cat.id
            ).length;
            return (
              <Link
                key={cat.id}
                href={`/shops?category=${encodeURIComponent(cat.id)}`}
                className="card-editorial group flex items-center gap-3.5 rounded-2xl border border-[#E5E5E5] bg-white p-3.5 hover:border-[#A6192E]"
              >
                <img
                  src={cat.image_url}
                  alt={cat.name}
                  loading="lazy"
                  className="h-12 w-12 rounded-xl object-cover border border-[#E5E5E5] shrink-0"
                />
                <div className="min-w-0">
                  <h3 className="font-heading text-sm font-bold text-[#222222] group-hover:text-[#A6192E] truncate">
                    {cat.name}
                  </h3>
                  <p className="text-sm text-[#525252] tabular-nums">
                    {shopCount} ร้านค้า
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 5.5 RECOMMENDED SHOPS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#222222]">
              ร้านเด็ดน่าลองในรั้วและรอบรั้ว มจธ.
            </h2>
            <p className="text-base text-[#525252] mt-1">
              คัดสรรร้านอาหารและคาเฟ่ยอดนิยมที่มีข้อมูลยืนยันจากทำเนียบ BPUU และรีวิวของนักศึกษาบางมด
            </p>
          </div>
          <Link
            href="/shops"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#A6192E] hover:underline"
          >
            <span>ดูร้านค้าทั้งหมด</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendedShops.map((shop) => (
            <ShopCard key={shop.id} shop={shop} />
          ))}
        </div>
      </section>

      {/* 5.6 POPULAR / FEATURED PRODUCTS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#222222]">
              เมนูแนะนำและของกินห้ามพลาด
            </h2>
            <p className="text-base text-[#525252] mt-1">
              ส่องเมนูจานเด็ดพร้อมราคาจริงก่อนเดินไปสั่งที่ร้าน
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#A6192E] hover:underline"
          >
            <span>ดูเมนูและสินค้าทั้งหมด ({db.products.length} รายการ)</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* ANNOUNCEMENTS & DATA PROVENANCE SECTION */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {db.announcements
            .filter((a) => a.is_published)
            .slice(0, 2)
            .map((ann) => (
              <div
                key={ann.id}
                className="rounded-2xl border border-[#E5E5E5] bg-white p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#A6192E] mb-2">
                    <Megaphone className="h-4 w-4" />
                    <span>ข่าวสารและโปรโมชันรักษ์โลก มจธ.</span>
                  </div>
                  <h3 className="font-heading text-lg font-bold text-[#222222]">
                    {ann.title}
                  </h3>
                  <p className="mt-2 text-sm text-[#525252] leading-relaxed">
                    {ann.content}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#E5E5E5] flex items-center justify-between text-sm text-[#525252]">
                  <span className="inline-flex items-center gap-1.5 text-[#16A34A] font-medium">
                    <ShieldCheck className="h-4 w-4" />
                    กลุ่มงานจัดการผลประโยชน์และทรัพย์สิน (BPUU)
                  </span>
                  <Link
                    href="/market"
                    className="font-semibold text-[#A6192E] hover:underline"
                  >
                    อ่านเพิ่มเติม →
                  </Link>
                </div>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}
