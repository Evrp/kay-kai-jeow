"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  Key,
  ShieldCheck,
  AlertCircle,
  Menu,
  X,
  LogOut,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [, setToken] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [inputToken, setInputToken] = useState("");
  const [authError, setAuthError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Check if token exists in local storage
    const savedToken = localStorage.getItem("admin_token");
    if (savedToken) {
      const timer = setTimeout(() => {
        setToken(savedToken);
        setIsAuthorized(true);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputToken.trim()) {
      setAuthError("กรุณากรอกรหัสผ่าน (Token)");
      return;
    }
    // Save token and trigger page reload or auth state change
    localStorage.setItem("admin_token", inputToken.trim());
    setToken(inputToken.trim());
    setIsAuthorized(true);
    setAuthError("");
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setToken(null);
    setIsAuthorized(false);
  };

  // If not authorized, render the glassmorphic login screen
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 font-sans text-zinc-100 antialiased selection:bg-amber-500 selection:text-black relative overflow-hidden">
        {/* Glow decorations */}
        <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-amber-500/10 rounded-full blur-[120px] animate-pulse duration-[6000ms]" />
        <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-orange-500/10 rounded-full blur-[120px] animate-pulse duration-[8000ms]" />

        <div className="w-full max-w-md bg-zinc-900/40 backdrop-blur-2xl border border-zinc-800/80 rounded-3xl p-8 shadow-2xl shadow-black/80 relative z-10 transition-all duration-500 transform hover:scale-[1.01] hover:border-amber-500/20">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/25 mb-4 animate-bounce duration-[3000ms]">
              <Key className="w-7 h-7 text-zinc-950 stroke-[2.5]" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              ผู้ดูแลระบบร้านไข่เจียว
            </h1>
            <p className="text-xs text-zinc-500 mt-2 text-center max-w-xs leading-relaxed">
              ยินดีต้อนรับสู่ระบบร้าน เก๋ไก๋เจียว 🍳 กรุณากรอกรหัสผ่านเพื่อเข้าใช้งานแดชบอร์ดจัดการร้านค้า
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                ADMIN ACCESS TOKEN
              </label>
              <input
                type="password"
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value)}
                placeholder="ป้อนรหัส Token..."
                className="w-full bg-zinc-950/70 border border-zinc-800 rounded-2xl px-5 py-4 text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all text-center tracking-widest text-sm shadow-inner"
              />
            </div>

            {authError && (
              <div className="flex items-center gap-2 text-red-400 text-xs bg-red-950/20 border border-red-900/40 rounded-xl p-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-zinc-950 font-bold rounded-2xl py-4 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 active:scale-[0.98] cursor-pointer"
            >
              <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
              <span>ยืนยันสิทธิ์เข้าใช้งาน</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  const navLinks = [
    { name: "แดชบอร์ดภาพรวม", path: "/admin", icon: LayoutDashboard },
    { name: "จัดการออเดอร์", path: "/admin/orders", icon: ShoppingBag },
    { name: "จัดการเมนูอาหาร", path: "/admin/menus", icon: UtensilsCrossed },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex antialiased selection:bg-amber-500 selection:text-black">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-72 shrink-0 border-r border-zinc-900/80 bg-zinc-950/40 backdrop-blur-2xl p-6 h-screen sticky top-0 justify-between">
        <div className="space-y-8">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/25">
              <span className="text-xl font-black">🍳</span>
            </div>
            <div>
              <h2 className="text-sm font-black tracking-tight bg-gradient-to-r from-amber-400 via-orange-300 to-yellow-200 bg-clip-text text-transparent">
                เก๋ไก๋เจียวปรุงสด
              </h2>
              <p className="text-[9px] text-zinc-550 uppercase tracking-widest font-black mt-0.5">
                Admin Console
              </p>
            </div>
          </div>

          <nav className="space-y-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.path;
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all duration-300 group border ${
                    isActive
                      ? "bg-zinc-900/60 text-amber-400 border-amber-500/10 shadow-lg shadow-amber-500/5"
                      : "text-zinc-450 border-transparent hover:text-zinc-200 hover:bg-zinc-900/30"
                  }`}
                >
                  <Icon
                    className={`w-4.5 h-4.5 transition-all duration-300 ${
                      isActive
                        ? "text-amber-400 scale-105"
                        : "text-zinc-550 group-hover:text-zinc-300"
                    }`}
                  />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-2xs font-bold text-zinc-500 hover:text-red-400 hover:bg-red-950/20 border border-transparent hover:border-red-950/20 transition-all duration-300 active:scale-[0.98] cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>ออกจากระบบผู้ดูแล</span>
        </button>
      </aside>

      {/* Mobile Top Header */}
      <div className="flex md:hidden flex-col w-full min-h-screen">
        <header className="flex items-center justify-between px-6 py-4 bg-zinc-950/60 backdrop-blur-xl border-b border-zinc-900 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <span className="text-xl">🍳</span>
            <span className="font-black text-xs tracking-tight bg-gradient-to-r from-amber-400 to-orange-300 bg-clip-text text-transparent">
              เก๋ไก๋เจียวปรุงสด
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-200 focus:outline-none"
          >
            {sidebarOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
          </button>
        </header>

        {/* Mobile Navigation Drawer */}
        {sidebarOpen && (
          <div className="fixed inset-0 top-[65px] bg-zinc-950/95 backdrop-blur-2xl z-30 flex flex-col justify-between p-6">
            <nav className="space-y-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    href={link.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold transition-all duration-300 border ${
                      isActive
                        ? "bg-zinc-900/60 text-amber-400 border-amber-500/10"
                        : "text-zinc-450 border-transparent hover:bg-zinc-900/40"
                    }`}
                  >
                    <Icon className={`w-4.5 h-4.5 ${isActive ? "text-amber-400" : "text-zinc-550"}`} />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>

            <button
              onClick={() => {
                setSidebarOpen(false);
                handleLogout();
              }}
              className="w-full bg-red-950/20 border border-red-900/30 text-red-400 font-bold py-4 rounded-2xl text-center active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>ออกจากระบบผู้ดูแล</span>
            </button>
          </div>
        )}

        {/* Mobile Main Content */}
        <main className="flex-1 p-6 relative overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Desktop Main Content */}
      <main className="hidden md:block flex-1 p-10 max-w-7xl mx-auto w-full relative overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
