"use client";

import React, { useEffect, useState } from "react";
import Script from "next/script";
import {
  ShoppingBag,
  CheckCircle,
  AlertCircle,
  ChevronRight,
} from "lucide-react";

interface IMenuOption {
  label: string;
  choices: Array<{ name: string; priceAdded: number }>;
}

interface IMenu {
  _id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  options: IMenuOption[];
}

interface ILiff {
  init: (config: { liffId: string }) => Promise<void>;
  isLoggedIn: () => boolean;
  login: () => void;
  getProfile: () => Promise<{ userId: string; displayName: string; pictureUrl?: string }>;
  isInClient: () => boolean;
  closeWindow: () => void;
}

interface ICreatedOrder {
  orderId: string;
  totalPrice: number;
  deliveryAddress: string;
}

export default function LiffOrderPage() {
  const [profile, setProfile] = useState<{ userId: string; displayName: string; pictureUrl?: string } | null>(null);
  const [liffError, setLiffError] = useState("");
  const [menus, setMenus] = useState<IMenu[]>([]);
  const [loadingMenus, setLoadingMenus] = useState(true);

  // Selected state
  const [selectedMenu, setSelectedMenu] = useState<IMenu | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, { choice: string; priceAdded: number }>>({});
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("รับที่ร้าน");
  const [orderStatus, setOrderStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [createdOrder, setCreatedOrder] = useState<ICreatedOrder | null>(null);

  // Load available menus and initialize mock profile immediately if in dev mode
  useEffect(() => {
    let active = true;
    let timerId: NodeJS.Timeout;

    async function loadMenus() {
      try {
        const res = await fetch("/api/menus");
        if (res.ok && active) {
          const data = await res.json();
          setMenus(data.menus || []);
        }
      } catch (err) {
        console.error("Failed to load menus:", err);
      } finally {
        if (active) setLoadingMenus(false);
      }
    }
    loadMenus();

    // Fast mock load: if LIFF ID is not configured, load mockup immediately without loading LINE CDN script
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
    if (!liffId || liffId === "dummy_liff_id") {
      console.warn("NEXT_PUBLIC_LIFF_ID is not configured. Running in Mock/Development Mode.");
      timerId = setTimeout(() => {
        if (active) {
          setProfile({
            userId: "U1234567890abcdef1234567890abcdef",
            displayName: "นักพัฒนา (Mock Profile)",
            pictureUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
          });
        }
      }, 0);
    }

    return () => {
      active = false;
      if (timerId) clearTimeout(timerId);
    };
  }, []);

  // Initialize LIFF once SDK script is loaded
  const initLiff = () => {
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
    if (!liffId || liffId === "dummy_liff_id") return;

    const globalLiff = (window as unknown as { liff?: ILiff }).liff;
    if (!globalLiff) {
      setLiffError("ไม่พบ LINE LIFF SDK กรุณารีเฟรชหน้าจออีกครั้ง");
      return;
    }

    globalLiff
      .init({ liffId })
      .then(async () => {
        if (!globalLiff.isLoggedIn()) {
          globalLiff.login();
          return;
        }

        const userProfile = await globalLiff.getProfile();
        setProfile({
          userId: userProfile.userId,
          displayName: userProfile.displayName,
          pictureUrl: userProfile.pictureUrl,
        });
      })
      .catch((err: Error) => {
        console.error("LIFF Initialization failed:", err);
        setLiffError(`LIFF Init Error: ${err.message || String(err)}`);
      });
  };

  const handleSelectMenu = (menu: IMenu) => {
    setSelectedMenu(menu);
    setQuantity(1);
    setNote("");
    // Initialize option choices with the first choice of each option
    const initialOpts: Record<string, { choice: string; priceAdded: number }> = {};
    menu.options.forEach((opt) => {
      if (opt.choices && opt.choices.length > 0) {
        initialOpts[opt.label] = {
          choice: opt.choices[0].name,
          priceAdded: opt.choices[0].priceAdded || 0,
        };
      }
    });
    setSelectedOptions(initialOpts);
  };

  const handleOptionChange = (label: string, choiceName: string, priceAdded: number) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [label]: { choice: choiceName, priceAdded },
    }));
  };

  const calculateTotalPrice = () => {
    if (!selectedMenu) return 0;
    const optionsSum = Object.values(selectedOptions).reduce((acc, curr) => acc + curr.priceAdded, 0);
    return (selectedMenu.price + optionsSum) * quantity;
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !selectedMenu) return;

    setOrderStatus("submitting");

    const items = [
      {
        menuId: selectedMenu._id,
        quantity,
        selectedOptions: Object.entries(selectedOptions).map(([label, info]) => ({
          label,
          choice: info.choice,
          priceAdded: info.priceAdded,
        })),
      },
    ];

    const payload = {
      lineUserId: profile.userId,
      customerName: profile.displayName,
      items,
      note: note.trim() || undefined,
      deliveryAddress,
      paymentMethod: "cod",
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to place order via LIFF");
      }

      const data = await res.json();
      setCreatedOrder(data.order);
      setOrderStatus("success");

      // Auto close LIFF window after success if supported
      setTimeout(() => {
        const globalLiff = (window as unknown as { liff?: ILiff }).liff;
        if (globalLiff && globalLiff.isInClient()) {
          globalLiff.closeWindow();
        }
      }, 5000);
    } catch (err) {
      console.error(err);
      setOrderStatus("error");
    }
  };

  const isMockMode = !process.env.NEXT_PUBLIC_LIFF_ID || process.env.NEXT_PUBLIC_LIFF_ID === "dummy_liff_id";

  return (
    <>
      {/* Load LINE LIFF SDK asynchronously ONLY if a real LIFF ID is configured */}
      {!isMockMode && (
        <Script
          src="https://static.line-scdn.net/liff/edge/2/sdk.js"
          onLoad={initLiff}
          onError={() => setLiffError("ไม่สามารถดึงข้อมูล LINE SDK ได้")}
        />
      )}

      <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans p-4 antialiased selection:bg-amber-500 selection:text-zinc-950 pb-10">
        <div className="max-w-md mx-auto space-y-6">
          {/* LIFF Header / Customer Profile banner */}
          <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-850 rounded-3xl p-5 shadow-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              {profile?.pictureUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.pictureUrl}
                  alt={profile.displayName}
                  className="w-12 h-12 rounded-2xl border border-zinc-800 shadow-md object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-amber-500/10 text-amber-450 rounded-2xl border border-amber-500/25 flex items-center justify-center font-bold text-sm">
                  🍳
                </div>
              )}
              <div>
                <span className="text-3xs text-zinc-500 uppercase tracking-widest block font-bold">สั่งอาหารออนไลน์</span>
                <span className="text-sm font-bold text-zinc-100 mt-0.5 block truncate max-w-[200px]">
                  {profile ? profile.displayName : "กำลังยืนยันโปรไฟล์..."}
                </span>
              </div>
            </div>
            <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-3xs font-black uppercase tracking-wider rounded-xl">
              {isMockMode ? "โหมดพัฒนา / MOCK" : "เชื่อมต่อแล้ว"}
            </div>
          </div>

          {liffError && (
            <div className="flex items-center gap-3 px-5 py-4 bg-red-950/20 border border-red-900/40 text-red-400 rounded-2xl text-xs">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{liffError}</span>
            </div>
          )}

          {/* Success Screen */}
          {orderStatus === "success" && createdOrder && (
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-850 rounded-3xl p-6 shadow-xl text-center space-y-6 animate-scale-up">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/5">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="font-extrabold text-lg text-zinc-150">สั่งอาหารสำเร็จแล้วค่ะ!</h3>
                <p className="text-xs text-zinc-450">
                  ออเดอร์หมายเลข <span className="font-bold text-amber-500 font-mono text-sm">#{createdOrder.orderId}</span> ได้ถูกยืนยันเข้าระบบเรียบร้อย
                </p>
                <p className="text-3xs text-zinc-500">
                  ทางร้านกำลังรับออเดอร์และเตรียมการปรุงอาหาร คุณจะได้รับแจ้งเตือนสถานะความก้าวหน้าโดยตรงในห้องแชท LINE OA ค่ะ
                </p>
              </div>
              <div className="bg-zinc-950/40 border border-zinc-850 rounded-2xl p-4 text-left text-3xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-zinc-500">ยอดชำระปลายทาง:</span>
                  <span className="font-bold text-amber-500">฿{createdOrder.totalPrice} บาท</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">รูปแบบจัดส่ง:</span>
                  <span className="text-zinc-300">{createdOrder.deliveryAddress}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  const globalLiff = (window as unknown as { liff?: ILiff }).liff;
                  if (globalLiff && globalLiff.isInClient()) globalLiff.closeWindow();
                }}
                className="w-full bg-zinc-800 hover:bg-zinc-750 border border-zinc-750 text-zinc-200 py-3.5 rounded-2xl text-xs font-bold transition-all cursor-pointer"
              >
                เสร็จสิ้น / ปิดหน้าต่างนี้
              </button>
            </div>
          )}

          {/* Catalog / Selection Screens */}
          {orderStatus !== "success" && (
            <>
              {/* If no menu is selected, show available menus catalog */}
              {!selectedMenu ? (
                <div className="space-y-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-zinc-400 pl-1">
                    เมนูไข่เจียวปรุงพิเศษ
                  </h3>

                  {loadingMenus ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-zinc-500 text-3xs">กำลังดึงรายการเมนู...</p>
                    </div>
                  ) : menus.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500 text-xs bg-zinc-900/20 border border-zinc-850 rounded-3xl">
                      ขออภัยด้วยค่ะ ทางร้านยังไม่มีเมนูที่พร้อมให้บริการในขณะนี้
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {menus.map((menu) => {
                        const defaultImg = "https://images.unsplash.com/photo-1506084868230-bb9d95c24759?auto=format&fit=crop&w=600&q=80";
                        return (
                          <div
                            key={menu._id}
                            onClick={() => handleSelectMenu(menu)}
                            className="bg-zinc-900/40 hover:bg-zinc-900/60 border border-zinc-850 hover:border-amber-500/20 rounded-3xl p-4 flex gap-4 cursor-pointer transition-all duration-300 group active:scale-[0.99] shadow-md shadow-zinc-950/20"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={menu.imageUrl || defaultImg}
                              alt={menu.name}
                              className="w-20 h-20 rounded-2xl object-cover border border-zinc-800 shrink-0"
                            />
                            <div className="flex-1 flex flex-col justify-between py-0.5">
                              <div>
                                <h4 className="font-extrabold text-xs text-zinc-200 group-hover:text-amber-400 transition-colors flex justify-between items-center">
                                  <span>{menu.name}</span>
                                  <span className="font-black text-amber-500 text-3xs tracking-tighter">฿{menu.price}</span>
                                </h4>
                                <p className="text-3xs text-zinc-500 mt-1 line-clamp-2">{menu.description || "สูตรหอมฟูกรอบกลมกล่อม เสิร์ฟร้อนฉุย"}</p>
                              </div>
                              <div className="flex justify-between items-center text-3xs text-amber-400 font-bold mt-2">
                                <span>ตัวเลือกปรับแต่งได้ {menu.options.length} หัวข้อ</span>
                                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                /* Menu Customization & Ordering Form */
                <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-850 rounded-3xl overflow-hidden shadow-xl animate-fade-in flex flex-col justify-between">
                  
                  {/* Banner */}
                  <div className="relative aspect-[20/11] bg-zinc-950">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedMenu.imageUrl || "https://images.unsplash.com/photo-1506084868230-bb9d95c24759?auto=format&fit=crop&w=600&q=80"}
                      alt={selectedMenu.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => setSelectedMenu(null)}
                      className="absolute top-4 left-4 px-3 py-1.5 bg-zinc-950/80 backdrop-blur-md border border-zinc-850 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 text-3xs font-extrabold rounded-xl transition-all cursor-pointer"
                    >
                      ← กลับหน้ารวม
                    </button>
                    <div className="absolute bottom-4 left-4 bg-zinc-950/80 backdrop-blur-md px-3.5 py-1.5 border border-zinc-850 text-2xs font-extrabold text-amber-500 rounded-xl">
                      ราคาพื้นฐาน: ฿{selectedMenu.price} บาท
                    </div>
                  </div>

                  <form onSubmit={handlePlaceOrder} className="p-6 space-y-6">
                    {/* Details */}
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-md text-zinc-150">{selectedMenu.name}</h3>
                      <p className="text-2xs text-zinc-450">{selectedMenu.description || "ไข่เจียวปรุงพิเศษแสนอร่อย"}</p>
                    </div>

                    {/* Option Selection Fields */}
                    {selectedMenu.options && selectedMenu.options.length > 0 && (
                      <div className="space-y-4 pt-4 border-t border-zinc-850">
                        <span className="text-3xs font-semibold text-zinc-500 uppercase tracking-widest block">
                          เลือกปรับแต่งเมนูของคุณ
                        </span>
                        
                        {selectedMenu.options.map((opt) => (
                          <div key={opt.label} className="space-y-2">
                            <span className="text-3xs text-zinc-450 font-bold block">{opt.label}</span>
                            <div className="grid grid-cols-2 gap-2">
                              {opt.choices.map((choice) => {
                                const isSelected = selectedOptions[opt.label]?.choice === choice.name;
                                return (
                                  <button
                                    key={choice.name}
                                    type="button"
                                    onClick={() => handleOptionChange(opt.label, choice.name, choice.priceAdded)}
                                    className={`px-3 py-2.5 rounded-xl text-3xs font-bold transition-all border text-left flex justify-between items-center cursor-pointer ${
                                      isSelected
                                        ? "bg-amber-500/10 border-amber-500 text-amber-400 shadow-inner"
                                        : "bg-zinc-950/30 border-zinc-850 text-zinc-400 hover:text-zinc-200"
                                    }`}
                                  >
                                    <span>{choice.name}</span>
                                    {choice.priceAdded > 0 && (
                                      <span className="font-black text-amber-500">+฿{choice.priceAdded}</span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Quantity & Address and Notes */}
                    <div className="space-y-4 pt-4 border-t border-zinc-850">
                      {/* Quantity */}
                      <div className="flex items-center justify-between">
                        <span className="text-3xs font-semibold text-zinc-500 uppercase tracking-widest">
                          จำนวนที่ต้องการ
                        </span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            disabled={quantity <= 1}
                            onClick={() => setQuantity(quantity - 1)}
                            className="w-8.5 h-8.5 bg-zinc-950/50 border border-zinc-850 hover:border-zinc-800 disabled:opacity-30 disabled:pointer-events-none text-zinc-400 rounded-xl flex items-center justify-center font-bold transition-all cursor-pointer"
                          >
                            -
                          </button>
                          <span className="font-extrabold text-xs text-zinc-200 w-6 text-center">{quantity}</span>
                          <button
                            type="button"
                            onClick={() => setQuantity(quantity + 1)}
                            className="w-8.5 h-8.5 bg-zinc-950/50 border border-zinc-850 hover:border-zinc-800 text-zinc-400 rounded-xl flex items-center justify-center font-bold transition-all cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Delivery Address Choice */}
                      <div className="space-y-2">
                        <span className="text-3xs font-semibold text-zinc-500 uppercase tracking-widest block">
                          รูปแบบการรับประทาน / สถานที่จัดส่ง
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setDeliveryAddress("รับที่ร้าน")}
                            className={`py-2.5 rounded-xl text-3xs font-bold border transition-all cursor-pointer ${
                              deliveryAddress === "รับที่ร้าน"
                                ? "bg-amber-500/10 border-amber-500 text-amber-400 shadow-inner"
                                : "bg-zinc-950/30 border-zinc-850 text-zinc-400"
                            }`}
                          >
                            ทานที่ร้าน / รับที่หน้าร้าน
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeliveryAddress("จัดส่งที่บ้าน")}
                            className={`py-2.5 rounded-xl text-3xs font-bold border transition-all cursor-pointer ${
                              deliveryAddress !== "รับที่ร้าน"
                                ? "bg-amber-500/10 border-amber-500 text-amber-400 shadow-inner"
                                : "bg-zinc-950/30 border-zinc-850 text-zinc-400"
                            }`}
                          >
                            จัดส่งตามที่อยู่
                          </button>
                        </div>

                        {deliveryAddress !== "รับที่ร้าน" && (
                          <input
                            type="text"
                            required
                            value={deliveryAddress === "จัดส่งที่บ้าน" ? "" : deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                            placeholder="ป้อนรายละเอียดที่อยู่จัดส่งโดยย่อ..."
                            className="w-full bg-zinc-950/40 border border-zinc-850 focus:border-amber-500 focus:outline-none rounded-xl px-4 py-2.5 text-3xs text-zinc-300 placeholder-zinc-700 mt-2"
                          />
                        )}
                      </div>

                      {/* Note */}
                      <div className="space-y-1.5">
                        <label className="text-3xs font-semibold text-zinc-500 uppercase tracking-widest block">
                          หมายเหตุเพิ่มเติมถึงร้านค้า
                        </label>
                        <input
                          type="text"
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="เช่น ขอไข่เจียวแบบแห้งกรอบๆ, ไม่ใส่กระเทียมเจียว..."
                          className="w-full bg-zinc-950/40 border border-zinc-850 focus:border-amber-500 focus:outline-none rounded-xl px-4 py-2.5 text-3xs text-zinc-300 placeholder-zinc-700"
                        />
                      </div>
                    </div>

                    {/* Order Placement Action Panel */}
                    <div className="pt-5 border-t border-zinc-850 space-y-4">
                      {/* Price Summary */}
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-zinc-300">ยอดรวมสุทธิ:</span>
                        <span className="text-lg font-black text-amber-500">฿{calculateTotalPrice()} บาท</span>
                      </div>

                      {orderStatus === "error" && (
                        <div className="flex items-center gap-2 text-red-400 text-3xs bg-red-950/10 border border-red-900/30 rounded-xl p-3">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>ไม่สามารถดำเนินการสั่งอาหารได้ กรุณาลองใหม่อีกครั้ง</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={orderStatus === "submitting" || !profile}
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-zinc-950 font-black rounded-2xl py-4 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 active:scale-[0.98] cursor-pointer"
                      >
                        <ShoppingBag className="w-5 h-5" />
                        <span>{orderStatus === "submitting" ? "กำลังประมวลผลสั่งซื้อ..." : "ส่งคำสั่งซื้อ (COD)"}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
