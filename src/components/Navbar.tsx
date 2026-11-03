"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  Heart,
  Menu,
  X,
  Sparkles,
  User,
  Store,
  ShieldCheck,
  ChevronDown,
  LogOut,
  MapPin,
} from "lucide-react";
import { useMarket } from "@/context/MarketContext";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "หน้าแรก" },
  { href: "/shops", label: "ร้านค้าทั้งหมด" },
  { href: "/products", label: "เมนูอาหาร" },
  { href: "/categories", label: "หมวดหมู่" },
  { href: "/market/map", label: "แผนที่ตลาด" },
  { href: "/market/schedule", label: "ตารางตลาด" },
  { href: "/about", label: "เกี่ยวกับเรา" },
];

export function Navbar() {
  const pathname = usePathname();
  const {
    currentUser,
    favoriteShopIds,
    setIsCravingPickerOpen,
    switchDemoRole,
    logout,
  } = useMarket();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E5E5E5] bg-white/95 backdrop-blur-md">
      {/* Top Campus Bar */}
      <div className="bg-[#761626] text-white text-sm py-1.5 px-4">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#FFF8F0] shrink-0" />
            <span>
              มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี (มจธ. บางมด) • ตลาดนัด อังคาร–พฤหัสบดี 07:00–17:00 น.
            </span>
          </div>
          <div className="hidden md:flex items-center gap-4 text-sm">
            <Link href="/market" className="hover:underline">
              ข้อมูลตลาดนัด & ค่าพื้นที่
            </Link>
            <span>•</span>
            <Link href="/reviews" className="hover:underline">
              รีวิวจากชาวบางมด
            </Link>
            {currentUser?.role === "vendor" && (
              <>
                <span>•</span>
                <Link
                  href="/vendor/dashboard"
                  className="font-semibold text-[#FFF8F0] underline"
                >
                  ระบบจัดการร้านค้า (Vendor)
                </Link>
              </>
            )}
            {currentUser?.role === "admin" && (
              <>
                <span>•</span>
                <Link
                  href="/admin/dashboard"
                  className="font-semibold text-[#FFF8F0] underline"
                >
                  ระบบแอดมิน (Admin Dashboard)
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-18 items-center justify-between gap-3">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#A6192E] text-white font-bold text-lg shadow-sm group-hover:bg-[#761626] transition-colors">
              KM
            </div>
            <div>
              <div className="font-heading text-lg font-bold tracking-tight text-[#222222] leading-tight">
                KMUTT MARKET
              </div>
              <div className="text-sm text-[#525252] leading-tight">
                ตลาดนัดและร้านค้าภายใน มจธ.
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav
            aria-label="เมนูหลัก"
            className="hidden xl:flex items-center gap-1"
          >
            {NAV_LINKS.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[#FFF8F0] text-[#A6192E] font-semibold"
                      : "text-[#222222] hover:bg-[#FAFAFA] hover:text-[#A6192E]"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Actions Right */}
          <div className="flex items-center gap-2">
            {/* Craving Picker Button */}
            <button
              type="button"
              onClick={() => setIsCravingPickerOpen(true)}
              className="btn-tactile hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-[#A6192E]/30 bg-[#FFF8F0] px-3.5 py-2 text-sm font-semibold text-[#A6192E] hover:bg-[#A6192E] hover:text-white"
            >
              <Sparkles className="w-4 h-4" />
              <span>วันนี้กินอะไรดี?</span>
            </button>

            {/* Quick Search Icon */}
            <Link
              href="/shops"
              aria-label="ค้นหาร้านค้าและเมนูอาหาร"
              className="btn-tactile inline-flex items-center justify-center rounded-xl border border-[#E5E5E5] bg-white p-2.5 text-[#222222] hover:border-[#A6192E] hover:text-[#A6192E]"
            >
              <Search className="w-5 h-5" />
            </Link>

            {/* Favorites Link */}
            <Link
              href="/favorites"
              aria-label={`ร้านโปรดที่บันทึกไว้ (${favoriteShopIds.length} ร้าน)`}
              className="btn-tactile relative inline-flex items-center justify-center rounded-xl border border-[#E5E5E5] bg-white p-2.5 text-[#222222] hover:border-[#A6192E] hover:text-[#A6192E]"
            >
              <Heart className="w-5 h-5" />
              {favoriteShopIds.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#A6192E] px-1 text-xs font-bold text-white tabular-nums">
                  {favoriteShopIds.length}
                </span>
              )}
            </Link>

            {/* User Profile & Quick Role Switcher Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setRoleMenuOpen((o) => !o)}
                className="btn-tactile inline-flex items-center gap-2 rounded-xl border border-[#E5E5E5] bg-white px-3 py-2 text-sm font-medium text-[#222222] hover:border-[#A6192E]"
              >
                <User className="w-4 h-4 text-[#A6192E]" />
                <span className="hidden md:inline max-w-[130px] truncate">
                  {currentUser ? currentUser.full_name.split(" ")[0] : "โหมดผู้ชม / สลับสิทธิ์"}
                </span>
                <ChevronDown className="w-4 h-4 text-[#525252]" />
              </button>

              {roleMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-[#E5E5E5] bg-white p-3 shadow-xl z-50 animate-enter">
                  <div className="pb-2.5 mb-2.5 border-b border-[#E5E5E5]">
                    <p className="text-sm font-bold text-[#222222]">
                      {currentUser ? currentUser.full_name : "ผู้เยี่ยมชมทั่วไป (ไม่ต้องล็อกอิน)"}
                    </p>
                    <p className="text-sm text-[#525252]">
                      {currentUser
                        ? `สถานะ: ${
                            currentUser.role === "admin"
                              ? "ผู้ดูแลระบบ (Admin)"
                              : currentUser.role === "vendor"
                              ? "เจ้าของร้านค้า (Vendor)"
                              : "นักศึกษา (Student)"
                          }`
                        : "ดูร้านอาหาร เมนู และกดร้านโปรดได้ทันที"}
                    </p>
                  </div>

                  {/* Role Dashboards */}
                  {currentUser?.role === "vendor" && (
                    <Link
                      href="/vendor/dashboard"
                      onClick={() => setRoleMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl bg-[#FFF8F0] px-3 py-2.5 text-sm font-semibold text-[#A6192E] mb-2 hover:bg-[#A6192E] hover:text-white transition-colors"
                    >
                      <Store className="w-4 h-4" />
                      ไปที่หน้าจัดการร้านค้า (Vendor)
                    </Link>
                  )}

                  {currentUser?.role === "admin" && (
                    <Link
                      href="/admin/dashboard"
                      onClick={() => setRoleMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl bg-[#FFF8F0] px-3 py-2.5 text-sm font-semibold text-[#A6192E] mb-2 hover:bg-[#A6192E] hover:text-white transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      ไปที่ระบบหลังบ้าน (Admin)
                    </Link>
                  )}

                  <div className="space-y-1">
                    <p className="px-2 py-1 text-sm font-semibold text-[#525252]">
                      สลับโหมดการใช้งานด่วน (1-Click):
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        switchDemoRole("guest");
                        setRoleMenuOpen(false);
                      }}
                      className="w-full text-left flex items-center justify-between rounded-lg px-3 py-2 text-sm text-[#222222] hover:bg-[#FAFAFA]"
                    >
                      <span>ผู้เยี่ยมชมทั่วไป (ไม่ต้องล็อกอิน)</span>
                      {!currentUser && (
                        <span className="text-sm font-bold text-[#16A34A]">ใช้อยู่</span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        switchDemoRole("student");
                        setRoleMenuOpen(false);
                      }}
                      className="w-full text-left flex items-center justify-between rounded-lg px-3 py-2 text-sm text-[#222222] hover:bg-[#FAFAFA]"
                    >
                      <span>นักศึกษา มจธ. (เขียนรีวิวได้)</span>
                      {currentUser?.role === "student" && (
                        <span className="text-sm font-bold text-[#16A34A]">ใช้อยู่</span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        switchDemoRole("vendor");
                        setRoleMenuOpen(false);
                      }}
                      className="w-full text-left flex items-center justify-between rounded-lg px-3 py-2 text-sm text-[#222222] hover:bg-[#FAFAFA]"
                    >
                      <span>เจ้าของร้านลุงกบ S11 (Vendor)</span>
                      {currentUser?.role === "vendor" && (
                        <span className="text-sm font-bold text-[#16A34A]">ใช้อยู่</span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        switchDemoRole("admin");
                        setRoleMenuOpen(false);
                      }}
                      className="w-full text-left flex items-center justify-between rounded-lg px-3 py-2 text-sm text-[#222222] hover:bg-[#FAFAFA]"
                    >
                      <span>ผู้ดูแลระบบ BPUU (Admin)</span>
                      {currentUser?.role === "admin" && (
                        <span className="text-sm font-bold text-[#16A34A]">ใช้อยู่</span>
                      )}
                    </button>
                  </div>

                  <div className="mt-2.5 pt-2.5 border-t border-[#E5E5E5] flex items-center justify-between gap-2">
                    <Link
                      href="/auth/login"
                      onClick={() => setRoleMenuOpen(false)}
                      className="flex-1 text-center rounded-lg bg-[#A6192E] px-3 py-2 text-sm font-semibold text-white hover:bg-[#761626]"
                    >
                      หน้าเข้าสู่ระบบ / สมัครสมาชิก
                    </Link>
                    {currentUser && (
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          setRoleMenuOpen(false);
                        }}
                        aria-label="ออกจากระบบ"
                        className="rounded-lg border border-[#E5E5E5] p-2 text-[#525252] hover:text-[#DC2626]"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((o) => !o)}
              aria-label="เปิดเมนูนำทางบนมือถือ"
              className="xl:hidden inline-flex items-center justify-center rounded-xl border border-[#E5E5E5] p-2.5 text-[#222222] hover:bg-[#FAFAFA]"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-[#E5E5E5] bg-white px-4 pt-3 pb-5 space-y-2 animate-enter">
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              setIsCravingPickerOpen(true);
            }}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#FFF8F0] border border-[#A6192E]/30 px-4 py-2.5 text-sm font-semibold text-[#A6192E]"
          >
            <Sparkles className="w-4 h-4" />
            วันนี้กินอะไรดีใน มจธ.? (สุ่ม/คัดร้านเด็ด)
          </button>

          <div className="grid grid-cols-2 gap-1.5 pt-1">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "rounded-xl px-3.5 py-2.5 text-sm font-medium",
                  pathname === item.href
                    ? "bg-[#A6192E] text-white font-semibold"
                    : "bg-[#FAFAFA] text-[#222222] hover:bg-[#FFF8F0]"
                )}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/market"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl bg-[#FAFAFA] px-3.5 py-2.5 text-sm font-medium text-[#222222]"
            >
              ข้อมูลตลาดนัด
            </Link>
            <Link
              href="/reviews"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl bg-[#FAFAFA] px-3.5 py-2.5 text-sm font-medium text-[#222222]"
            >
              รีวิวทั้งหมด
            </Link>
          </div>

          <div className="pt-2 border-t border-[#E5E5E5] flex flex-wrap gap-2">
            <Link
              href="/vendor/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex-1 text-center rounded-xl border border-[#E5E5E5] px-3 py-2 text-sm font-medium text-[#222222]"
            >
              สำหรับร้านค้า (Vendor)
            </Link>
            <Link
              href="/admin/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex-1 text-center rounded-xl border border-[#E5E5E5] px-3 py-2 text-sm font-medium text-[#222222]"
            >
              สำหรับแอดมิน (Admin)
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
