import React from "react";
import Link from "next/link";
import { ShieldCheck, Utensils, MapPin, Users, ExternalLink } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="rounded-3xl border border-[#E5E5E5] bg-[#FFF8F0] p-8 sm:p-10 space-y-4">
        <span className="inline-flex items-center gap-2 rounded-full bg-white border border-[#A6192E]/25 px-3.5 py-1 text-sm font-semibold text-[#A6192E]">
          เกี่ยวกับโครงการ KMUTT MARKET
        </span>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-[#222222]">
          ตลาดนัดและร้านค้าภายในมหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี
        </h1>
        <p className="text-base text-[#222222] leading-relaxed">
          <strong>KMUTT MARKET (&ldquo;หิวเมื่อไหร่ คิดถึงตลาด มจธ.&rdquo;)</strong>{" "}
          คือแพลตฟอร์มรวบรวมข้อมูลร้านอาหาร เครื่องดื่ม คาเฟ่ประจำอาคาร โรงอาหาร S14
          และร้านค้าที่เข้าร่วมตลาดนัดภายใน มจธ. บางมด เพื่อช่วยให้นักศึกษา บุคลากร และผู้มาติดต่อ
          สามารถค้นหาร้านน่ากิน เมนูโปรด พิกัดอาคาร และตารางเปิดขายได้อย่างสะดวกและแม่นยำ
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-[#E5E5E5] bg-white p-6 space-y-2.5">
          <Utensils className="h-6 w-6 text-[#A6192E]" />
          <h2 className="font-heading text-lg font-bold text-[#222222]">
            รวบรวมของกินครบทุกโซน
          </h2>
          <p className="text-sm text-[#525252] leading-relaxed">
            ตั้งแต่โรงอาหารอาคาร 190 ปี (S14), ร้านลุงกบ S11, คาเฟ่ใต้หอสมุด N10
            ไปจนถึงตลาดนัดวันอังคาร–พฤหัสบดี ที่อาคารจอดรถ S2
          </p>
        </div>

        <div className="rounded-2xl border border-[#E5E5E5] bg-white p-6 space-y-2.5">
          <ShieldCheck className="h-6 w-6 text-[#16A34A]" />
          <h2 className="font-heading text-lg font-bold text-[#222222]">
            แยกแยะแหล่งที่มาอย่างโปร่งใส
          </h2>
          <p className="text-sm text-[#525252] leading-relaxed">
            มีระบบระบุแหล่งที่มาของข้อมูล (`shop_data_sources`) แยกชัดเจนระหว่างข้อมูลทางการจาก BPUU
            ข้อมูลจากร้านค้า และรีวิวจากนักศึกษา
          </p>
        </div>

        <div className="rounded-2xl border border-[#E5E5E5] bg-white p-6 space-y-2.5">
          <Users className="h-6 w-6 text-[#A6192E]" />
          <h2 className="font-heading text-lg font-bold text-[#222222]">
            รองรับทั้งผู้ชม ร้านค้า และแอดมิน
          </h2>
          <p className="text-sm text-[#525252] leading-relaxed">
            ผู้ชมทั่วไปใช้งานได้ทันทีโดยไม่ต้องล็อกอิน พร้อมระบบจัดการร้านค้าสำหรับผู้ประกอบการและระบบบริหารจัดการสำหรับผู้ดูแล
          </p>
        </div>
      </div>

      <div
        id="privacy"
        className="rounded-2xl border border-[#E5E5E5] bg-white p-6 sm:p-8 space-y-4"
      >
        <h2 className="font-heading text-xl font-bold text-[#222222]">
          นโยบายความเป็นส่วนตัว (Privacy Policy) และข้อกำหนดการใช้งาน (Terms of Service)
        </h2>
        <div id="terms" className="space-y-2 text-sm text-[#525252] leading-relaxed">
          <p>
            1. ข้อมูลร้านค้าประจำอาคารและระเบียบตลาดนัดอ้างอิงจากประกาศของกลุ่มงานจัดการผลประโยชน์และทรัพย์สิน (BPUU) มจธ.
          </p>
          <p>
            2. รายการร้านโปรดของผู้เยี่ยมชมทั่วไปจะถูกบันทึกไว้ในเบราว์เซอร์ของผู้ใช้งานเพื่อความสะดวกรวดเร็วโดยไม่ต้องบังคับสร้างบัญชี
          </p>
          <p>
            3. การเขียนรีวิวร้านค้าจำกัด 1 บัญชีผู้ใช้งานต่อ 1 รีวิวต่อร้านค้า โดยผู้ใช้งานสามารถกลับมาแก้ไขรีวิวของตนเองได้ตลอดเวลา และมีระบบแจ้งรายงานข้อความที่ไม่เหมาะสมเพื่อให้ผู้ดูแลระบบตรวจสอบ
          </p>
        </div>
        <div className="pt-2 flex flex-wrap gap-4 text-sm font-semibold text-[#A6192E]">
          <a
            href="https://bpuu.kmutt.ac.th"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:underline"
          >
            <span>เว็บไซต์ BPUU KMUTT</span>
            <ExternalLink className="h-4 w-4" />
          </a>
          <Link href="/contact" className="hover:underline">
            ติดต่อทีมงาน / แจ้งแก้ไขข้อมูลร้านค้า →
          </Link>
        </div>
      </div>
    </div>
  );
}
