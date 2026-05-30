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
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [token, setToken] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [inputToken, setInputToken] = useState("");
  const [authError, setAuthError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Check if token exists in local storage
    const savedToken = localStorage.getItem("admin_token");
    if (savedToken) {
      setToken(savedToken);
      setIsAuthorized(true);
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
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 font-sans text-zinc-100 antialiased selection:bg-indigo-500 selection:text-white relative overflow-hidden">
        {/* Glow decorations */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />

        <div className="w-full max-w-md bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 shadow-2xl shadow-zinc-950/50 relative z-10 transition-all duration-300 transform hover:scale-[1.01]">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4 animate-pulse">
              <Key className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
              ผู้ดูแลระบบร้านไข่เจียว
            </h1>
            <p className="text-sm text-zinc-500 mt-2 text-center">
              กรุณากรอกรหัสผ่านเพื่อเข้าใช้งานแดชบอร์ดจัดการร้านค้า
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                ADMIN ACCESS TOKEN
              </label>
              <input
                type="password"
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value)}
                placeholder="ป้อนรหัส Token..."
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl px-5 py-4 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-center tracking-widest"
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
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-2xl py-4 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
            >
              <ShieldCheck className="w-5 h-5" />
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex antialiased selection:bg-indigo-500 selection:text-white">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-72 shrink-0 border-r border-zinc-800 bg-zinc-950/80 backdrop-blur-md p-6 h-screen sticky top-0 justify-between">
        <div className="space-y-8">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 bg-gradient-to-tr from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              <span className="text-xl font-black text-zinc-950">🍳</span>
            </div>
            <div>
              <h2 className="text-md font-bold tracking-tight bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">
                ไข่เจียวเจ๊เกียว
              </h2>
              <p className="text-2xs text-zinc-500 uppercase tracking-widest font-semibold mt-0.5">
                Admin Console
              </p>
            </div>
          </div>

          <nav className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.path;
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? "bg-zinc-800 text-zinc-100 shadow-inner border border-zinc-700/50"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 ${
                      isActive
                        ? "text-indigo-400 scale-105"
                        : "text-zinc-500 group-hover:text-zinc-300"
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
          className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-xs font-semibold text-zinc-500 hover:text-red-400 hover:bg-red-950/20 border border-transparent hover:border-red-900/20 transition-all duration-200 active:scale-[0.98]"
        >
          ออกจากระบบผู้ดูแล
        </button>
      </aside>

      {/* Mobile Top Header */}
      <div className="flex md:hidden flex-col w-full min-h-screen">
        <header className="flex items-center justify-between px-6 py-4 bg-zinc-950 border-b border-zinc-900 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🍳</span>
            <span className="font-bold text-sm bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">
              ไข่เจียวเจ๊เกียว
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-200 focus:outline-none"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        {/* Mobile Navigation Drawer */}
        {sidebarOpen && (
          <div className="fixed inset-0 top-[65px] bg-zinc-950 z-30 flex flex-col justify-between p-6">
            <nav className="space-y-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    href={link.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-4 px-5 py-4.5 rounded-2xl text-md font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-zinc-800 text-zinc-100 border border-zinc-700/50"
                        : "text-zinc-400 hover:bg-zinc-900/50"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? "text-indigo-400" : "text-zinc-500"}`} />
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
              className="w-full bg-red-950/20 border border-red-900/30 text-red-400 font-medium py-4.5 rounded-2xl text-center active:scale-[0.98] transition-all"
            >
              ออกจากระบบผู้ดูแล
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
