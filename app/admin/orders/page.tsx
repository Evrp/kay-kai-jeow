"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  SlidersHorizontal,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  ChevronDown,
  ShoppingBag,
  HelpCircle,
} from "lucide-react";

interface ISelectedOption {
  label: string;
  choice: string;
  priceAdded: number;
}

interface IOrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
  selectedOptions: ISelectedOption[];
  subtotal: number;
}

interface IOrder {
  _id: string;
  orderId: string;
  lineUserId: string;
  customerName?: string;
  items: IOrderItem[];
  totalPrice: number;
  note?: string;
  deliveryAddress?: string;
  status: "pending" | "confirmed" | "preparing" | "ready" | "completed" | "cancelled";
  paymentMethod: string;
  paymentStatus: "unpaid" | "paid";
  createdAt: string;
}

const statusOptions = [
  { value: "all", label: "ทั้งหมด" },
  { value: "pending", label: "รอการยืนยัน" },
  { value: "confirmed", label: "ยืนยันแล้ว" },
  { value: "preparing", label: "กำลังทำ" },
  { value: "ready", label: "พร้อมเสิร์ฟ/พร้อมส่ง" },
  { value: "completed", label: "เสร็จสิ้น" },
  { value: "cancelled", label: "ยกเลิกแล้ว" },
];

export default function AdminOrders() {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filters
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Selected single order for detailed modal view
  const [activeOrderModal, setActiveOrderModal] = useState<IOrder | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("admin_token") || "";
      const res = await fetch("/api/admin/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to load orders");
      }

      const data = await res.json();
      setOrders(data.orders || []);
      setError("");
    } catch (err) {
      console.error(err);
      setError("ไม่สามารถดึงข้อมูลออเดอร์ได้");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Apply filters client-side
  useEffect(() => {
    let result = [...orders];

    // Status filter
    if (selectedStatus !== "all") {
      result = result.filter((o) => o.status === selectedStatus);
    }

    // Search query filter (matches customer name or order ID)
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.orderId?.toLowerCase().includes(query) ||
          o.customerName?.toLowerCase().includes(query)
      );
    }

    setFilteredOrders(result);
  }, [orders, selectedStatus, searchQuery]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const token = localStorage.getItem("admin_token") || "";
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      // Update locally immediately to avoid full refresh loading spinner
      setOrders((prevOrders) =>
        prevOrders.map((o) => (o._id === id ? { ...o, status: newStatus as any } : o))
      );

      // Also update open details modal if open
      if (activeOrderModal && activeOrderModal._id === id) {
        setActiveOrderModal((prev) => (prev ? { ...prev, status: newStatus as any } : null));
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาด ไม่สามารถเปลี่ยนสถานะออเดอร์ได้");
    }
  };

  const handleUpdatePaymentStatus = async (id: string, newPayStatus: "unpaid" | "paid") => {
    try {
      const token = localStorage.getItem("admin_token") || "";
      // In PATCH /api/orders/[id], we support status and optionally paymentStatus
      const orderToUpdate = orders.find((o) => o._id === id);
      if (!orderToUpdate) return;

      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: orderToUpdate.status, paymentStatus: newPayStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update payment status");
      }

      // Update local state
      setOrders((prevOrders) =>
        prevOrders.map((o) => (o._id === id ? { ...o, paymentStatus: newPayStatus } : o))
      );

      if (activeOrderModal && activeOrderModal._id === id) {
        setActiveOrderModal((prev) => (prev ? { ...prev, paymentStatus: newPayStatus } : null));
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาด ไม่สามารถเปลี่ยนสถานะชำระเงินได้");
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "pending":
        return { label: "รอการยืนยัน", style: "bg-amber-500/10 text-amber-400 border border-amber-500/20" };
      case "confirmed":
        return { label: "ยืนยันแล้ว", style: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" };
      case "preparing":
        return { label: "กำลังทำอาหาร", style: "bg-teal-500/10 text-teal-400 border border-teal-500/20" };
      case "ready":
        return { label: "พร้อมเสิร์ฟ/พร้อมส่ง", style: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" };
      case "completed":
        return { label: "เสร็จสิ้น", style: "bg-zinc-800 text-zinc-400 border border-zinc-700/50" };
      case "cancelled":
        return { label: "ยกเลิกแล้ว", style: "bg-red-500/10 text-red-400 border border-red-500/20" };
      default:
        return { label: status, style: "bg-zinc-800 text-zinc-400" };
    }
  };

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleString("th-TH", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-10">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-50 to-zinc-300 bg-clip-text text-transparent">
          จัดการออเดอร์ทั้งหมด
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          ควบคุมและตรวจสอบสถานะออเดอร์ ความก้าวหน้าการทำอาหาร และการจัดส่ง
        </p>
      </div>

      {/* Control Bar: Search & Filters */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
        {/* Search */}
        <div className="relative w-full lg:w-96 group">
          <Search className="w-4 h-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อลูกค้า หรือ รหัสออเดอร์..."
            className="w-full bg-zinc-900/50 border border-zinc-850 hover:border-zinc-750 focus:border-indigo-500 focus:outline-none rounded-2xl pl-11 pr-5 py-3.5 text-xs text-zinc-200 placeholder-zinc-555 transition-all"
          />
        </div>

        {/* Status Scroll Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 scrollbar-none">
          <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-550 shrink-0 mr-1.5 hidden md:block" />
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSelectedStatus(opt.value)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold shrink-0 transition-all border ${
                selectedStatus === opt.value
                  ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/10"
                  : "bg-zinc-900/40 border-zinc-850 text-zinc-400 hover:text-zinc-200 hover:border-zinc-800"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table Container */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-400 text-xs">กำลังประมวลผลข้อมูล...</p>
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 px-5 py-4 bg-red-950/20 border border-red-900/40 text-red-400 rounded-2xl text-xs">
          <span>{error}</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 bg-zinc-900/10 border border-zinc-850 rounded-3xl text-center text-zinc-550">
          <ShoppingBag className="w-12 h-12 text-zinc-800 mb-4" />
          <p className="font-semibold text-sm">ไม่พบรายการสั่งซื้อที่ตรงกับเงื่อนไข</p>
          <p className="text-xs text-zinc-600 mt-1">ลองเปลี่ยนการค้นหาหรือกลุ่มตัวเลือกดูนะคะ</p>
        </div>
      ) : (
        <div className="bg-zinc-900/30 backdrop-blur-md border border-zinc-850 rounded-3xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-850 bg-zinc-900/40 text-2xs uppercase tracking-wider text-zinc-500 font-bold">
                  <th className="px-6 py-4">รหัสออเดอร์ / วันเวลา</th>
                  <th className="px-6 py-4">ข้อมูลลูกค้า</th>
                  <th className="px-6 py-4">รายการอาหาร</th>
                  <th className="px-6 py-4 text-center">ชำระเงิน</th>
                  <th className="px-6 py-4 text-center">ยอดรวม</th>
                  <th className="px-6 py-4 text-center">สถานะ</th>
                  <th className="px-6 py-4 text-center">เปลี่ยนสถานะ</th>
                  <th className="px-6 py-4 text-center">ดูรายละเอียด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850/40 text-xs">
                {filteredOrders.map((o) => {
                  const statusInfo = getStatusDisplay(o.status);
                  return (
                    <tr
                      key={o._id}
                      className="hover:bg-zinc-800/10 transition-colors duration-150"
                    >
                      {/* ID and Date */}
                      <td className="px-6 py-5">
                        <div className="font-bold text-zinc-200 font-mono tracking-tight">{o.orderId}</div>
                        <div className="text-3xs text-zinc-500 mt-1">{formatDate(o.createdAt)}</div>
                      </td>

                      {/* Customer */}
                      <td className="px-6 py-5">
                        <div className="font-semibold text-zinc-200">{o.customerName || "ลูกค้าทั่วไป"}</div>
                        <div className="text-3xs text-zinc-500 mt-1 font-mono tracking-tighter max-w-[120px] truncate">
                          ID: {o.lineUserId}
                        </div>
                      </td>

                      {/* Menu Items */}
                      <td className="px-6 py-5">
                        <div className="space-y-1 max-w-xs">
                          {o.items.map((item, idx) => (
                            <div key={idx} className="font-medium text-zinc-300">
                              {item.name} <span className="text-zinc-500 font-normal text-3xs">x{item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Payment */}
                      <td className="px-6 py-5 text-center">
                        <span
                          onClick={() =>
                            handleUpdatePaymentStatus(o._id, o.paymentStatus === "paid" ? "unpaid" : "paid")
                          }
                          className={`inline-block px-2.5 py-1.5 rounded-xl font-bold cursor-pointer text-3xs transition-all border ${
                            o.paymentStatus === "paid"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                          }`}
                          title="คลิกเพื่อเปลี่ยนสถานะการชำระเงิน"
                        >
                          {o.paymentStatus === "paid" ? "จ่ายแล้ว" : "ค้างจ่าย"}
                        </span>
                      </td>

                      {/* Total Price */}
                      <td className="px-6 py-5 font-bold text-amber-500 text-center">
                        ฿{o.totalPrice}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-5 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-2xs font-semibold ${statusInfo.style}`}>
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Quick Dropdown Control */}
                      <td className="px-6 py-5 text-center">
                        <div className="relative inline-block text-left">
                          <select
                            value={o.status}
                            onChange={(e) => handleUpdateStatus(o._id, e.target.value)}
                            className="bg-zinc-850 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 px-3 py-2 text-2xs font-bold rounded-xl outline-none cursor-pointer transition-all appearance-none pr-8 relative"
                          >
                            <option value="pending">รอการยืนยัน</option>
                            <option value="confirmed">ยืนยันแล้ว</option>
                            <option value="preparing">กำลังทำ</option>
                            <option value="ready">พร้อมส่ง</option>
                            <option value="completed">เสร็จสิ้น</option>
                            <option value="cancelled">ยกเลิก</option>
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-zinc-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </td>

                      {/* Modal Trigger */}
                      <td className="px-6 py-5 text-center">
                        <button
                          onClick={() => setActiveOrderModal(o)}
                          className="p-2 bg-zinc-800/40 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 rounded-xl transition-all active:scale-95"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Details Sliding Glassmorphic Modal */}
      {activeOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl p-6 relative overflow-hidden max-h-[90vh] flex flex-col justify-between">
            <div>
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-zinc-850">
                <div>
                  <h3 className="font-bold text-md text-zinc-100">รายละเอียดออเดอร์</h3>
                  <p className="text-3xs text-zinc-500 font-mono mt-0.5">ID: {activeOrderModal.orderId}</p>
                </div>
                <button
                  onClick={() => setActiveOrderModal(null)}
                  className="px-3.5 py-2 bg-zinc-800 border border-zinc-750 hover:bg-zinc-750 text-zinc-400 hover:text-zinc-200 rounded-2xl text-xs font-bold transition-all"
                >
                  ปิดหน้าต่าง
                </button>
              </div>

              {/* Modal Body */}
              <div className="py-5 space-y-6 overflow-y-auto max-h-[50vh] pr-1">
                {/* Status and Summary Header */}
                <div className="flex justify-between items-center bg-zinc-950/50 p-4 border border-zinc-850 rounded-2xl">
                  <div>
                    <span className="text-3xs text-zinc-550 block">สถานะปัจจุบัน</span>
                    <span className="text-xs font-bold text-zinc-200 mt-1 block">
                      {getStatusDisplay(activeOrderModal.status).label}
                    </span>
                  </div>
                  <div>
                    <span className="text-3xs text-zinc-550 block text-right">ยอดรวม</span>
                    <span className="text-sm font-black text-amber-500 mt-1 block text-right">
                      ฿{activeOrderModal.totalPrice}
                    </span>
                  </div>
                </div>

                {/* Items list */}
                <div className="space-y-3.5">
                  <h4 className="text-2xs font-bold uppercase tracking-wider text-zinc-400">รายการสั่งซื้อ</h4>
                  <div className="divide-y divide-zinc-850 bg-zinc-950/20 border border-zinc-850/60 rounded-2xl px-4 py-1">
                    {activeOrderModal.items.map((item, idx) => {
                      const optionsText = item.selectedOptions
                        .map((opt) => `${opt.label}: ${opt.choice}`)
                        .join(", ");
                      return (
                        <div key={idx} className="py-3 flex justify-between items-start gap-4">
                          <div>
                            <span className="font-semibold text-zinc-250 text-xs">
                              {item.name} <span className="text-zinc-500 font-normal">x{item.quantity}</span>
                            </span>
                            {optionsText && (
                              <span className="text-3xs text-zinc-500 block mt-1">({optionsText})</span>
                            )}
                          </div>
                          <span className="font-bold text-zinc-300 text-xs">฿{item.subtotal}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Delivery and Notes Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-3xs font-semibold text-zinc-500 uppercase tracking-widest block">
                      ที่อยู่ / รูปแบบจัดส่ง
                    </span>
                    <p className="text-xs text-zinc-300 bg-zinc-950/40 border border-zinc-850/50 rounded-2xl p-4.5 min-h-[60px]">
                      {activeOrderModal.deliveryAddress || "รับที่ร้าน"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-3xs font-semibold text-zinc-500 uppercase tracking-widest block">
                      หมายเหตุจากลูกค้า
                    </span>
                    <p className="text-xs text-zinc-300 bg-zinc-950/40 border border-zinc-850/50 rounded-2xl p-4.5 min-h-[60px]">
                      {activeOrderModal.note || "ไม่มีหมายเหตุ"}
                    </p>
                  </div>
                </div>

                {/* Details Footer Stats */}
                <div className="text-3xs text-zinc-550 space-y-1 font-medium bg-zinc-950/20 border border-zinc-850/50 rounded-2xl p-4">
                  <div className="flex justify-between">
                    <span>วันที่ทำรายการ</span>
                    <span className="font-mono text-zinc-400">{formatDate(activeOrderModal.createdAt)}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span>LINE User ID</span>
                    <span className="font-mono text-zinc-400 truncate max-w-[200px]" title={activeOrderModal.lineUserId}>
                      {activeOrderModal.lineUserId}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span>วิธีการชำระเงิน</span>
                    <span className="text-zinc-400">เก็บเงินปลายทาง (COD)</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span>สถานะการชำระเงิน</span>
                    <span className={activeOrderModal.paymentStatus === "paid" ? "text-emerald-450 font-bold" : "text-red-450 font-bold"}>
                      {activeOrderModal.paymentStatus === "paid" ? "ชำระเงินเรียบร้อยแล้ว" : "ยังไม่ได้ชำระเงิน"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Bottom Controls */}
            <div className="pt-4 border-t border-zinc-850 flex items-center justify-between gap-3">
              <span className="text-3xs text-zinc-500 font-bold">ปรับเปลี่ยนขั้นตอนด่วน:</span>
              <div className="flex gap-2">
                {activeOrderModal.status === "pending" && (
                  <button
                    onClick={() => handleUpdateStatus(activeOrderModal._id, "confirmed")}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-3xs rounded-xl transition-all shadow-md active:scale-95"
                  >
                    ยืนยันออเดอร์
                  </button>
                )}
                {(activeOrderModal.status === "confirmed" || activeOrderModal.status === "pending") && (
                  <button
                    onClick={() => handleUpdateStatus(activeOrderModal._id, "preparing")}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-3xs rounded-xl transition-all shadow-md active:scale-95"
                  >
                    เริ่มทำอาหาร
                  </button>
                )}
                {activeOrderModal.status === "preparing" && (
                  <button
                    onClick={() => handleUpdateStatus(activeOrderModal._id, "ready")}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-3xs rounded-xl transition-all shadow-md active:scale-95"
                  >
                    ปรุงเสร็จเรียบร้อย
                  </button>
                )}
                {activeOrderModal.status === "ready" && (
                  <button
                    onClick={() => handleUpdateStatus(activeOrderModal._id, "completed")}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-bold text-3xs rounded-xl transition-all shadow-md active:scale-95"
                  >
                    ออเดอร์เสร็จสิ้น
                  </button>
                )}
                {activeOrderModal.status !== "completed" && activeOrderModal.status !== "cancelled" && (
                  <button
                    onClick={() => handleUpdateStatus(activeOrderModal._id, "cancelled")}
                    className="px-4 py-2 bg-red-950/30 border border-red-900/40 hover:bg-red-950/50 text-red-400 font-bold text-3xs rounded-xl transition-all active:scale-95"
                  >
                    ยกเลิกออเดอร์
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
