import type { Metadata } from "next";
import { Anuphan, Prompt } from "next/font/google";
import "./globals.css";
import { MarketProvider } from "@/context/MarketContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CravingPickerAndToasts } from "@/components/CravingPickerModal";

const anuphan = Anuphan({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-anuphan",
  display: "swap",
});

const prompt = Prompt({
  subsets: ["thai", "latin"],
  weight: ["500", "600", "700"],
  variable: "--font-prompt",
  display: "swap",
});

export const metadata: Metadata = {
  title: "KMUTT MARKET – ตลาดนัดและร้านค้าภายใน มจธ. บางมด",
  description:
    "หิวเมื่อไหร่ คิดถึงตลาด มจธ. ค้นหาร้านเด็ด เช็กเมนูโปรด โรงอาหาร S14 คาเฟ่ประจำตึก และตลาดนัดภายในมหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${anuphan.variable} ${prompt.variable}`}>
      <body className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#222222]">
        <MarketProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <CravingPickerAndToasts />
        </MarketProvider>
      </body>
    </html>
  );
}
