import React from "react";
import Link from "next/link";
import { MapPin, ExternalLink, Clock, ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-[#E5E5E5] bg-white text-[#222222] mt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1: Brand */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#A6192E] text-white font-bold text-base">
                KM
              </div>
              <div>
                <h2 className="font-heading text-lg font-bold text-[#222222]">
                  KMUTT MARKET
                </h2>
                <p className="text-sm text-[#525252]">
                  ตลาดนัดและร้านค้าภายใน มจธ.
                </p>
              </div>
            </div>
            <p className="text-sm text-[#525252] leading-relaxed">
              &ldquo;หิวเมื่อไหร่ คิดถึงตลาด มจธ.&rdquo; แพลตฟอร์มรวบรวมข้อมูลร้านอาหาร
              โรงอาหาร S14 คาเฟ่ประจำตึก และตลาดนัดภายในมหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี (บางมด)
            </p>
          </div>

          {/* Column 2: Quick Discovery */}
          <div>
            <h3 className="font-heading text-base font-bold text-[#222222] mb-3">
              สำรวจของกินและร้านค้า
            </h3>
            <ul className="space-y-2 text-sm text-[#525252]">
              <li>
                <Link href="/shops" className="hover:text-[#A6192E]">
                  ทำเนียบร้านค้าทั้งหมดใน มจธ.
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-[#A6192E]">
                  ค้นหาเมนูอาหารและเครื่องดื่ม
                </Link>
              </li>
              <li>
                <Link href="/categories" className="hover:text-[#A6192E]">
                  หมวดหมู่ร้านค้าและอาหาร
                </Link>
              </li>
              <li>
                <Link href="/market/map" className="hover:text-[#A6192E]">
                  แผนที่ร้านค้า & ผังล็อกตลาดนัด
                </Link>
              </li>
              <li>
                <Link href="/market/schedule" className="hover:text-[#A6192E]">
                  ตารางเปิดตลาดนัดประจำสัปดาห์
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Information & Policies */}
          <div>
            <h3 className="font-heading text-base font-bold text-[#222222] mb-3">
              ข้อมูลโครงการและนโยบาย
            </h3>
            <ul className="space-y-2 text-sm text-[#525252]">
              <li>
                <Link href="/about" className="hover:text-[#A6192E]">
                  เกี่ยวกับโครงการ (About)
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#A6192E]">
                  ติดต่อสอบถาม / แจ้งข้อมูลร้านค้า (Contact)
                </Link>
              </li>
              <li>
                <Link href="/market" className="hover:text-[#A6192E]">
                  ระเบียบการจองล็อก & อัตราค่าพื้นที่ตลาดนัด
                </Link>
              </li>
              <li>
                <Link href="/about#privacy" className="hover:text-[#A6192E]">
                  นโยบายความเป็นส่วนตัว (Privacy Policy)
                </Link>
              </li>
              <li>
                <Link href="/about#terms" className="hover:text-[#A6192E]">
                  ข้อกำหนดการใช้งาน (Terms of Service)
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Official External Links */}
          <div>
            <h3 className="font-heading text-base font-bold text-[#222222] mb-3">
              หน่วยงานหลัก มจธ.
            </h3>
            <ul className="space-y-2.5 text-sm text-[#525252]">
              <li>
                <a
                  href="https://www.kmutt.ac.th"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-medium text-[#222222] hover:text-[#A6192E]"
                >
                  <span>เว็บไซต์หลัก มจธ. (KMUTT Official)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </li>
              <li>
                <a
                  href="https://bpuu.kmutt.ac.th"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-medium text-[#222222] hover:text-[#A6192E]"
                >
                  <span>กลุ่มงานจัดการผลประโยชน์ฯ (BPUU Official)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </li>
              <li className="pt-2 flex items-start gap-2 text-sm text-[#525252]">
                <Clock className="w-4 h-4 text-[#A6192E] shrink-0 mt-0.5" />
                <span>
                  ตลาดนัดเปิดวันอังคาร–พฤหัสบดี 07:00–17:00 น. (เริ่มจัดร้าน 05:30 น.)
                </span>
              </li>
              <li className="flex items-start gap-2 text-sm text-[#525252]">
                <MapPin className="w-4 h-4 text-[#A6192E] shrink-0 mt-0.5" />
                <span>
                  126 ถนนประชาอุทิศ แขวงบางมด เขตทุ่งครุ กรุงเทพฯ 10140
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[#E5E5E5] flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#525252]">
          <p>
            © {new Date().getFullYear()} KMUTT MARKET – ตลาดนัดและร้านค้าภายในมหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี
          </p>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
            <span>ข้อมูลอ้างอิงจาก BPUU KMUTT และคอมมูนิตี้ชาวบางมด</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
