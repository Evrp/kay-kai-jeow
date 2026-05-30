import Link from "next/link";
import {
  ShoppingBag,
  LayoutDashboard,
  ShieldCheck,
  Zap,
  TrendingUp,
  SlidersHorizontal,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-between p-6 font-sans text-zinc-100 antialiased relative overflow-hidden">
      {/* Decorative radial gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl" />

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full py-16 space-y-12 relative z-10">
        
        {/* Banner Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-xs text-amber-400 font-bold tracking-wide shadow-lg">
          <span>🍳</span>
          <span>LINE OA Food Shop System</span>
        </div>

        {/* Hero Headline */}
        <div className="text-center space-y-4 max-w-2xl">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight bg-gradient-to-r from-zinc-50 via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            ร้านไข่เจียวเจ๊เกียว <br className="hidden md:inline" />
            <span className="bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text">ปรุงสดใหม่ทุกจาน</span>
          </h1>
          <p className="text-xs md:text-sm text-zinc-400 font-medium max-w-lg mx-auto">
            ระบบสั่งอาหารผ่าน LINE Official Account & LIFF Mini App แบบฟลูสแตกสำหรับร้านอาหารยุคใหม่ ขยายและสเกลเพิ่มรายการอาหารได้ยืดหยุ่นโดยไม่ต้องแก้ไขโค้ด
          </p>
        </div>

        {/* Action Gateways */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl pt-4">
          
          {/* LIFF Ordering Card */}
          <Link
            href="/liff/order"
            className="bg-zinc-900/50 backdrop-blur-md border border-zinc-850 hover:border-zinc-750 hover:bg-zinc-900 rounded-3xl p-6 shadow-xl flex flex-col justify-between group transition-all duration-300 transform hover:scale-[1.01]"
          >
            <div className="space-y-4">
              <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-5 h-5 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-sm text-zinc-200 group-hover:text-indigo-450 transition-colors">
                  ระบบสั่งอาหารสำหรับลูกค้า (LIFF)
                </h3>
                <p className="text-2xs text-zinc-500 line-clamp-2">
                  จำลองหน้าจอแอปพลิเคชัน LINE LIFF สำหรับให้ลูกค้ากดยอดสั่ง เลือกตัวเลือกความต้องการของเมนูไข่เจียวเจ๊เกียวแบบอินเตอร์แอกทีฟ
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-2xs text-indigo-400 font-bold pt-6">
              <span>เข้าสู่แอปพลิเคชันลูกค้า</span>
              <span>→</span>
            </div>
          </Link>

          {/* Admin Dashboard Card */}
          <Link
            href="/admin"
            className="bg-zinc-900/50 backdrop-blur-md border border-zinc-850 hover:border-zinc-750 hover:bg-zinc-900 rounded-3xl p-6 shadow-xl flex flex-col justify-between group transition-all duration-300 transform hover:scale-[1.01]"
          >
            <div className="space-y-4">
              <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-sm text-zinc-200 group-hover:text-amber-450 transition-colors">
                  แผงควบคุมหลักผู้ดูแลร้าน (Admin)
                </h3>
                <p className="text-2xs text-zinc-500 line-clamp-2">
                  แผงควบคุมสำหรับเจ้าของร้านค้าเพื่อตรวจสอบสถิติวันนี้ จัดการลำดับคิวเตรียมอาหาร ตารางออเดอร์ และปรับแต่งแค็ตตาล็อกเมนู
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-2xs text-amber-500 font-bold pt-6">
              <span>เข้าสู่แผงจัดการผู้ดูแล</span>
              <span>→</span>
            </div>
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full pt-8 text-center md:text-left">
          
          <div className="space-y-2 bg-zinc-900/20 border border-zinc-900 rounded-2xl p-4.5">
            <div className="flex items-center justify-center md:justify-start gap-2 text-indigo-400 font-bold text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>ความปลอดภัยเต็มพิกัด</span>
            </div>
            <p className="text-3xs text-zinc-500">
              ตรวจสอบลายเซ็นดิจิทัล LINE signature webhook verification มั่นใจได้ในความปลอดภัยของข้อมูลทุก request
            </p>
          </div>

          <div className="space-y-2 bg-zinc-900/20 border border-zinc-900 rounded-2xl p-4.5">
            <div className="flex items-center justify-center md:justify-start gap-2 text-amber-500 font-bold text-xs">
              <Zap className="w-4 h-4" />
              <span>ประมวลผลทันที</span>
            </div>
            <p className="text-3xs text-zinc-500">
              ระบบเชื่อมโยง API webhook และการอัปเดตสถานะแบบเรียลไทม์ (30s polling) ช่วยให้ร้านค้าปรุงเสร็จไวใน 15 นาที
            </p>
          </div>

          <div className="space-y-2 bg-zinc-900/20 border border-zinc-900 rounded-2xl p-4.5">
            <div className="flex items-center justify-center md:justify-start gap-2 text-emerald-400 font-bold text-xs">
              <TrendingUp className="w-4 h-4" />
              <span>ความสามารถสเกลได้</span>
            </div>
            <p className="text-3xs text-zinc-500">
              สร้างเมนูย่อย จัดหมวดหมู่ เพิ่มเงื่อนไขและราคาเลือกเพิ่มได้อย่างเป็นระบบผ่าน Database Mongoose Model
            </p>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="text-center py-6 border-t border-zinc-900 text-3xs text-zinc-600 font-semibold tracking-wide">
        &copy; {new Date().getFullYear()} ร้านไข่เจียวเจ๊เกียว. พัฒนาและออกแบบด้วยสถาปัตยกรรมประสิทธิภาพสูงใน Next.js 14.
      </footer>
    </div>
  );
}
