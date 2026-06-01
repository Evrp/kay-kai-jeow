"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
} from "lucide-react";
import Link from "next/link";

interface IOrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

interface IOrder {
  _id: string;
  orderId: string;
  customerName: string;
  items: IOrderItem[];
  totalPrice: number;
  status: string;
  createdAt: string;
}

export default function AdminOverview() {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [stats, setStats] = useState({
    todaySales: 0,
    todayOrdersCount: 0,
    pendingCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    
    try {
      const token = localStorage.getItem("admin_token") || "";
      const res = await fetch("/api/admin/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("admin_token");
          window.location.reload();
          return;
        }
        throw new Error("Failed to fetch dashboard orders");
      }

      const data = await res.json();
      const allOrders: IOrder[] = data.orders || [];

      // Calculate stats
      const today = new Date().toLocaleDateString("en-US", { timeZone: "Asia/Bangkok" });
      
      let salesSum = 0;
      let countSum = 0;
      let pendingSum = 0;

      allOrders.forEach((o) => {
        const orderDate = new Date(o.createdAt).toLocaleDateString("en-US", {
          timeZone: "Asia/Bangkok",
        });

        // Filter today's stats (ignoring cancelled)
        if (orderDate === today && o.status !== "cancelled") {
          salesSum += o.totalPrice;
          countSum += 1;
        }

        // Count pending / uncompleted states
        if (o.status === "pending" || o.status === "confirmed" || o.status === "preparing") {
          pendingSum += 1;
        }
      });

      setStats({
        todaySales: salesSum,
        todayOrdersCount: countSum,
        pendingCount: pendingSum,
      });

      // Filter down active/pending orders for real-time queue table
      const activeQueue = allOrders.filter(
        (o) => o.status === "pending" || o.status === "confirmed" || o.status === "preparing"
      );
      setOrders(activeQueue);
      setError("");
    } catch (err) {
      console.error(err);
      setError("ไม่สามารถโหลดข้อมูลแดชบอร์ดได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // Break the synchronous render cycle to comply with strict ESLint rules
    const initTimer = setTimeout(() => {
      fetchDashboardData();
    }, 0);

    // 30 Seconds real-time polling
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 30000);

    return () => {
      clearTimeout(initTimer);
      clearInterval(interval);
    };
  }, [fetchDashboardData]);

  const handleAdvanceStatus = async (id: string, currentStatus: string) => {
    try {
      const nextStatusMap: Record<string, string> = {
        pending: "confirmed",
        confirmed: "preparing",
        preparing: "ready",
      };

      const nextStatus = nextStatusMap[currentStatus];
      if (!nextStatus) return;

      const token = localStorage.getItem("admin_token") || "";
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      // Refresh data
      fetchDashboardData(true);
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถเปลี่ยนสถานะออเดอร์ได้");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            รอการยืนยัน
          </span>
        );
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            ยืนยันแล้ว
          </span>
        );
      case "preparing":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />
            กำลังปรุงอาหาร
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-400">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-500 text-xs font-semibold">กำลังโหลดข้อมูลแดชบอร์ด...</p>
      </div>
    );
  }
  return (
    <div className="space-y-10">
      {/* Header and Quick Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-50 via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            ภาพรวมวันนี้
          </h1>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
            ข้อมูลการสั่งซื้อและลำดับคิวประจำวัน อัปเดตอัตโนมัติทุก 30 วินาที 🍳
          </p>
        </div>

        <button
          onClick={() => fetchDashboardData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4.5 py-3 bg-zinc-900/60 border border-zinc-850 hover:border-amber-500/20 hover:bg-zinc-900 active:scale-95 text-2xs text-zinc-300 font-bold rounded-2xl transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-black/20"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-amber-500" : "text-zinc-400"}`} />
          <span>{refreshing ? "กำลังโหลด..." : "รีเฟรชข้อมูล"}</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 px-5 py-4 bg-red-950/20 border border-red-900/40 text-red-400 rounded-2xl text-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sales Card */}
        <div className="bg-zinc-900/40 backdrop-blur-2xl border border-zinc-900 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-amber-500/10 transition-all duration-500">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full blur-xl group-hover:bg-amber-500/10 transition-all duration-550" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">
              ยอดขายวันนี้
            </span>
            <div className="w-10 h-10 bg-amber-550/10 border border-amber-550/20 text-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-550/5 group-hover:scale-105 transition-transform duration-300">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-amber-500 bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">
              ฿{stats.todaySales.toLocaleString()}
            </span>
            <span className="text-3xs text-zinc-500 font-bold uppercase">บาท</span>
          </div>
          <p className="text-[10px] text-zinc-550 mt-2 font-medium">เฉพาะสถานะยืนยันและจัดส่งเสร็จสิ้น</p>
        </div>

        {/* Total Orders Card */}
        <div className="bg-zinc-900/40 backdrop-blur-2xl border border-zinc-900 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-orange-500/10 transition-all duration-500">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-bl-full blur-xl group-hover:bg-orange-500/10 transition-all duration-550" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">
              ออเดอร์ทั้งหมดวันนี้
            </span>
            <div className="w-10 h-10 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/5 group-hover:scale-105 transition-transform duration-300">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-orange-400 bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
              {stats.todayOrdersCount}
            </span>
            <span className="text-3xs text-zinc-500 font-bold uppercase">ออเดอร์</span>
          </div>
          <p className="text-[10px] text-zinc-550 mt-2 font-medium">ไม่นับรวมออเดอร์ที่กดยกเลิก</p>
        </div>

        {/* Active Queue Card */}
        <div className="bg-zinc-900/40 backdrop-blur-2xl border border-zinc-900 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-yellow-500/10 transition-all duration-500">
          <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-400/5 rounded-bl-full blur-xl group-hover:bg-yellow-400/10 transition-all duration-550" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">
              คิวที่ต้องปรุงในร้าน
            </span>
            <div className="w-10 h-10 bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-400/5 group-hover:scale-105 transition-transform duration-300">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-yellow-400 bg-gradient-to-r from-yellow-400 to-amber-300 bg-clip-text text-transparent">
              {stats.pendingCount}
            </span>
            <span className="text-3xs text-zinc-500 font-bold uppercase">รายการ</span>
          </div>
          <p className="text-[10px] text-zinc-550 mt-2 font-medium">สถานะ รอคอนเฟิร์ม / ยืนยัน / กำลังทำ</p>
        </div>
      </div>

      {/* Real-time Order Queue Table */}
      <div className="bg-zinc-900/20 backdrop-blur-2xl border border-zinc-900 rounded-3xl shadow-2xl shadow-black/40 overflow-hidden">
        <div className="px-6 py-5 border-b border-zinc-900 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-zinc-100">รายการคิวเตรียมอาหาร (Real-time Queue)</h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">จัดการคิวทำอาหารและจัดส่งแบบเรียลไทม์</p>
          </div>
          <Link
            href="/admin/orders"
            className="text-2xs text-amber-400 hover:text-amber-300 font-bold transition-all duration-300"
          >
            ดูประวัติทั้งหมด →
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-zinc-500">
            <CheckCircle2 className="w-12 h-12 text-zinc-800 mb-3" />
            <p className="font-bold text-xs text-zinc-400">ไม่มีคิวที่ค้างรอในขณะนี้!</p>
            <p className="text-2xs text-zinc-600 mt-1">ยินดีด้วยค่ะ ออเดอร์ทั้งหมดได้รับการจัดส่งเสร็จสิ้นแล้ว</p>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-900 bg-zinc-950/20 text-[10px] uppercase tracking-widest text-zinc-550 font-bold">
                  <th className="px-6 py-4">รหัสออเดอร์</th>
                  <th className="px-6 py-4">ลูกค้า</th>
                  <th className="px-6 py-4">รายการอาหาร</th>
                  <th className="px-6 py-4 text-center">ยอดรวม</th>
                  <th className="px-6 py-4 text-center">สถานะ</th>
                  <th className="px-6 py-4 text-center">จัดการด่วน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/60 text-xs">
                {orders.map((o) => {
                  const labelMap: Record<string, string> = {
                    pending: "กดยืนยันออเดอร์",
                    confirmed: "เริ่มปรุงอาหาร",
                    preparing: "อาหารปรุงเสร็จแล้ว",
                  };

                  const btnColorMap: Record<string, string> = {
                    pending: "bg-gradient-to-r from-amber-550 to-orange-550 hover:from-amber-500 hover:to-orange-500 shadow-amber-550/15 text-zinc-950 font-extrabold",
                    confirmed: "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-450 hover:to-red-450 shadow-orange-500/15 text-white font-bold",
                    preparing: "bg-gradient-to-r from-emerald-550 to-teal-550 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-550/15 text-zinc-950 font-extrabold",
                  };

                  return (
                    <tr
                      key={o._id}
                      className="hover:bg-zinc-900/30 transition-all duration-300 group"
                    >
                      <td className="px-6 py-5 font-bold text-zinc-300 font-mono tracking-tight text-xs">
                        {o.orderId}
                      </td>
                      <td className="px-6 py-5 font-semibold text-zinc-200">
                        {o.customerName || "ลูกค้าทั่วไป"}
                      </td>
                      <td className="px-6 py-5 text-zinc-450">
                        {o.items.map((item, idx) => (
                          <div key={idx} className="font-semibold text-zinc-300">
                            {item.name} <span className="text-zinc-550 font-medium">x{item.quantity}</span>
                          </div>
                        ))}
                      </td>
                      <td className="px-6 py-5 font-extrabold text-amber-500 text-center">
                        ฿{o.totalPrice}
                      </td>
                      <td className="px-6 py-5 text-center">{getStatusBadge(o.status)}</td>
                      <td className="px-6 py-5 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => handleAdvanceStatus(o._id, o.status)}
                            className={`px-4.5 py-2.5 text-[10px] rounded-xl shadow-md transition-all active:scale-95 duration-300 cursor-pointer ${
                              btnColorMap[o.status] || "bg-zinc-700 text-white"
                            }`}
                          >
                            {labelMap[o.status] || "ความคืบหน้า"}
                          </button>
                          
                          <Link
                            href="/admin/orders"
                            className="p-2.5 bg-zinc-900 border border-zinc-850 hover:bg-zinc-850 hover:border-zinc-750 text-zinc-500 hover:text-zinc-300 rounded-xl transition-all duration-300"
                            title="ดูออเดอร์ในหน้าจัดการ"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
