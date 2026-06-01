"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Edit,
  Trash2,
  X,
  Sparkles,
  Info,
  DollarSign,
  Layers,
  Image as ImageIcon,
} from "lucide-react";

interface IChoice {
  name: string;
  priceAdded: number;
}

interface IMenuOption {
  label: string;
  choices: IChoice[];
}

interface IMenu {
  _id: string;
  name: string;
  description?: string;
  price: number;
  category: "main" | "drink" | "extra";
  imageUrl?: string;
  isAvailable: boolean;
  options: IMenuOption[];
  sortOrder: number;
}

export default function AdminMenus() {
  const [menus, setMenus] = useState<IMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<IMenu | null>(null);

  // Form fields
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPrice, setFormPrice] = useState<number>(0);
  const [formCategory, setFormCategory] = useState<"main" | "drink" | "extra">("main");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formIsAvailable, setFormIsAvailable] = useState(true);
  const [formSortOrder, setFormSortOrder] = useState<number>(0);
  const [formOptions, setFormOptions] = useState<IMenuOption[]>([]);

  // Temp option builder states
  const [newOptionLabel, setNewOptionLabel] = useState("");

  const fetchMenus = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("admin_token") || "";
      const res = await fetch("/api/admin/menus", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to load menus");
      }

      const data = await res.json();
      setMenus(data.menus || []);
      setError("");
    } catch (err) {
      console.error(err);
      setError("ไม่สามารถโหลดเมนูอาหารได้");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMenus();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchMenus]);

  // Open modal for adding a new item
  const handleOpenAddModal = () => {
    setEditingMenu(null);
    setFormName("");
    setFormDescription("");
    setFormPrice(0);
    setFormCategory("main");
    setFormImageUrl("");
    setFormIsAvailable(true);
    setFormSortOrder(0);
    setFormOptions([]);
    setIsModalOpen(true);
  };

  // Open modal for editing an existing item
  const handleOpenEditModal = (menu: IMenu) => {
    setEditingMenu(menu);
    setFormName(menu.name);
    setFormDescription(menu.description || "");
    setFormPrice(menu.price);
    setFormCategory(menu.category);
    setFormImageUrl(menu.imageUrl || "");
    setFormIsAvailable(menu.isAvailable);
    setFormSortOrder(menu.sortOrder || 0);
    setFormOptions(menu.options || []);
    setIsModalOpen(true);
  };

  // Dynamic Options Builder functions
  const handleAddOption = () => {
    if (!newOptionLabel.trim()) return;
    setFormOptions([
      ...formOptions,
      { label: newOptionLabel.trim(), choices: [{ name: "ธรรมดา", priceAdded: 0 }] },
    ]);
    setNewOptionLabel("");
  };

  const handleRemoveOption = (optIndex: number) => {
    setFormOptions(formOptions.filter((_, i) => i !== optIndex));
  };

  const handleAddChoice = (optIndex: number) => {
    const updated = [...formOptions];
    updated[optIndex].choices.push({ name: "ตัวเลือกเสริมใหม่", priceAdded: 0 });
    setFormOptions(updated);
  };

  const handleRemoveChoice = (optIndex: number, choiceIndex: number) => {
    const updated = [...formOptions];
    updated[optIndex].choices = updated[optIndex].choices.filter((_, i) => i !== choiceIndex);
    setFormOptions(updated);
  };

  const handleChoiceFieldChange = (
    optIndex: number,
    choiceIndex: number,
    field: "name" | "priceAdded",
    value: string | number
  ) => {
    const updated = [...formOptions];
    if (field === "priceAdded") {
      updated[optIndex].choices[choiceIndex].priceAdded = Number(value) || 0;
    } else {
      updated[optIndex].choices[choiceIndex].name = String(value);
    }
    setFormOptions(updated);
  };

  // Save / Submit Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) {
      alert("กรุณากรอกชื่อเมนูอาหาร");
      return;
    }

    const payload = {
      name: formName.trim(),
      description: formDescription.trim() || undefined,
      price: Number(formPrice) || 0,
      category: formCategory,
      imageUrl: formImageUrl.trim() || undefined,
      isAvailable: formIsAvailable,
      sortOrder: Number(formSortOrder) || 0,
      options: formOptions,
    };

    try {
      const token = localStorage.getItem("admin_token") || "";
      let res;
      if (editingMenu) {
        // Edit Menu (PATCH)
        res = await fetch(`/api/admin/menus/${editingMenu._id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        // Add Menu (POST)
        res = await fetch("/api/admin/menus", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        throw new Error("Failed to save menu");
      }

      setIsModalOpen(false);
      fetchMenus(); // reload list
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูลเมนูอาหาร");
    }
  };

  // Toggle isAvailable instantly in the list
  const handleToggleAvailable = async (id: string, currentVal: boolean) => {
    try {
      const token = localStorage.getItem("admin_token") || "";
      const res = await fetch(`/api/admin/menus/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isAvailable: !currentVal }),
      });

      if (!res.ok) {
        throw new Error("Failed to toggle availability");
      }

      // Update state locally
      setMenus((prev) =>
        prev.map((m) => (m._id === id ? { ...m, isAvailable: !currentVal } : m))
      );
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถสลับสถานะความพร้อมให้บริการได้");
    }
  };

  // Delete Menu item
  const handleDeleteMenu = async (id: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบเมนูนี้อย่างถาวร?")) return;

    try {
      const token = localStorage.getItem("admin_token") || "";
      const res = await fetch(`/api/admin/menus/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to delete menu");
      }

      // Remove local state
      setMenus((prev) => prev.filter((m) => m._id !== id));
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถลบรายการอาหารได้");
    }
  };

  return (
    <div className="space-y-10">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-50 via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            จัดการเมนูอาหาร
          </h1>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
            สร้าง ปรับแต่ง และเปิด/ปิดรับออเดอร์ของแต่ละเมนูอาหารเพื่อรองรับลูกค้า 🍳
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-400 hover:from-amber-400 hover:via-orange-450 hover:to-yellow-350 text-zinc-950 text-xs font-black rounded-2xl transition-all shadow-lg shadow-amber-500/20 active:scale-95 duration-300 cursor-pointer"
        >
          <Plus className="w-4.5 h-4.5 stroke-[2.5]" />
          <span>เพิ่มเมนูอาหารใหม่</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 px-5 py-4 bg-red-950/20 border border-red-900/40 text-red-400 rounded-2xl text-xs">
          <span>{error}</span>
        </div>
      )}

      {/* Menus Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 text-xs font-semibold">กำลังโหลดแค็ตตาล็อก...</p>
        </div>
      ) : menus.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 bg-zinc-900/10 border border-zinc-900 rounded-3xl text-center text-zinc-500">
          <Layers className="w-12 h-12 text-zinc-800 mb-4" />
          <p className="font-bold text-xs text-zinc-400">ยังไม่มีรายการอาหารในระบบ</p>
          <p className="text-2xs text-zinc-650 mt-1">เพิ่มเมนูแรกด่วนโดยคลิกปุ่ม &quot;เพิ่มเมนูอาหารใหม่&quot; ที่มุมบนขวาได้ทันทีค่ะ</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menus.map((menu) => {
            const defaultImage = "https://images.unsplash.com/photo-1506084868230-bb9d95c24759?auto=format&fit=crop&w=600&q=80";
            return (
              <div
                key={menu._id}
                className={`bg-zinc-900/40 backdrop-blur-2xl border rounded-3xl overflow-hidden shadow-2xl hover:border-amber-500/20 hover:shadow-amber-500/5 transition-all duration-500 flex flex-col justify-between group ${
                  menu.isAvailable ? "border-zinc-900" : "border-zinc-950/80 opacity-50"
                }`}
              >
                {/* Image and Tags */}
                <div className="relative aspect-[20/13] overflow-hidden bg-zinc-950">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={menu.imageUrl || defaultImage}
                    alt={menu.name}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                  />
                  <div className="absolute top-4 left-4 bg-zinc-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-[9px] font-extrabold text-amber-500 border border-amber-500/10 uppercase tracking-widest">
                    {menu.category === "main" ? "จานหลัก 🍳" : menu.category === "drink" ? "เครื่องดื่ม 🥤" : "เสริมพิเศษ ✨"}
                  </div>
                  <div className="absolute top-4 right-4 flex gap-1.5">
                    <span className="bg-zinc-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-[9px] font-bold text-zinc-400 border border-zinc-900">
                      ลำดับ: {menu.sortOrder}
                    </span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-4">
                      <h3 className="font-extrabold text-xs text-zinc-150 group-hover:text-amber-400 transition-colors duration-300">
                        {menu.name}
                      </h3>
                      <span className="font-black text-xs text-amber-500 bg-amber-500/5 border border-amber-500/10 px-2 py-0.5 rounded-lg">฿{menu.price}</span>
                    </div>
                    <p className="text-2xs text-zinc-450 leading-relaxed line-clamp-2">{menu.description || "เมนูไข่เจียวสูตรกลมกล่อม ทานร้อนๆ อร่อยสุดใจ"}</p>
                  </div>

                  {/* Option Summaries */}
                  {menu.options && menu.options.length > 0 && (
                    <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-3 space-y-1.5">
                      <span className="text-[9px] font-bold text-zinc-550 uppercase block tracking-widest">
                        ตัวเลือกความอร่อย
                      </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {menu.options.map((opt, idx) => (
                          <span
                            key={idx}
                            className="inline-block bg-zinc-900 border border-zinc-850 text-zinc-400 px-2 py-0.5 rounded-lg text-[9px] font-bold"
                          >
                            {opt.label} ({opt.choices.length})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Controls: Toggle & Edit/Delete */}
                <div className="px-6 py-4.5 bg-zinc-950/20 border-t border-zinc-900 flex items-center justify-between gap-4">
                  {/* Inline Toggle Switch */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleAvailable(menu._id, menu.isAvailable)}
                      className={`relative inline-flex h-6.5 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${
                        menu.isAvailable ? "bg-amber-550" : "bg-zinc-800"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5.5 w-5.5 transform rounded-full bg-zinc-950 shadow ring-0 transition duration-300 ease-in-out ${
                          menu.isAvailable ? "translate-x-5.5" : "translate-x-0"
                        }`}
                      />
                    </button>
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                      {menu.isAvailable ? "พร้อมสั่ง" : "ปิดรับ"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenEditModal(menu)}
                      className="p-2.5 bg-zinc-900 border border-zinc-850 text-zinc-500 hover:text-amber-400 hover:border-amber-550/20 rounded-xl transition-all duration-300 cursor-pointer"
                      title="แก้ไขเมนูอาหาร"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteMenu(menu._id)}
                      className="p-2.5 bg-zinc-900 border border-zinc-850 text-zinc-500 hover:text-red-400 hover:border-red-950/20 rounded-xl transition-all duration-300 cursor-pointer"
                      title="ลบเมนูอาหาร"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Menu Glassmorphic Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl p-6 relative my-8 max-h-[90vh] flex flex-col justify-between">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-850">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-md text-zinc-100">
                  {editingMenu ? `แก้ไขข้อมูลเมนู: ${editingMenu.name}` : "เพิ่มเมนูอาหารชิ้นใหม่"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 bg-zinc-800 border border-zinc-750 hover:bg-zinc-755 text-zinc-400 hover:text-zinc-200 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Form */}
            <form onSubmit={handleSubmitForm} className="flex-1 overflow-y-auto py-5 space-y-6 pr-1">
              {/* Basic Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-3xs font-semibold text-zinc-400 uppercase tracking-widest block">
                    ชื่อเมนูอาหาร *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="ตัวอย่าง: ไข่เจียวหมูสับฟู"
                    className="w-full bg-zinc-950/50 border border-zinc-850 hover:border-zinc-800 focus:border-amber-500 focus:outline-none rounded-xl px-4 py-3 text-xs text-zinc-200 placeholder-zinc-700 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-3xs font-semibold text-zinc-400 uppercase tracking-widest block">
                    ราคาเริ่มต้น (บาท) *
                  </label>
                  <div className="relative">
                    <DollarSign className="w-3.5 h-3.5 text-zinc-550 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      required
                      min="0"
                      value={formPrice}
                      onChange={(e) => setFormPrice(Number(e.target.value))}
                      placeholder="ตัวอย่าง: 60"
                      className="w-full bg-zinc-950/50 border border-zinc-850 hover:border-zinc-800 focus:border-amber-500 focus:outline-none rounded-xl pl-9 pr-4 py-3 text-xs text-zinc-200 placeholder-zinc-700 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-3xs font-semibold text-zinc-400 uppercase tracking-widest block">
                  คำอธิบาย / รายละเอียดอาหาร
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="ตัวอย่าง: ไข่ไก่สดพิเศษ ตีฟูกรอบนอกนุ่มใน หอมฉุยเสิร์ฟเคียงข้าวสวยร้อนๆ..."
                  rows={2}
                  className="w-full bg-zinc-950/50 border border-zinc-850 hover:border-zinc-800 focus:border-amber-500 focus:outline-none rounded-xl px-4 py-3 text-xs text-zinc-200 placeholder-zinc-700 transition-all"
                />
              </div>

              {/* Image URL & Category & Sort Order */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-3xs font-semibold text-zinc-400 uppercase tracking-widest block">
                    หมวดหมู่เมนู
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as IMenu["category"])}
                    className="w-full bg-zinc-950/50 border border-zinc-850 hover:border-zinc-800 focus:border-amber-500 focus:outline-none rounded-xl px-4 py-3 text-xs text-zinc-200 cursor-pointer"
                  >
                    <option value="main">จานหลัก (Main)</option>
                    <option value="drink">เครื่องดื่ม (Drink)</option>
                    <option value="extra">เสริมพิเศษ (Extra)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-3xs font-semibold text-zinc-400 uppercase tracking-widest block">
                    ลิงก์รูปภาพเมนู (Image URL)
                  </label>
                  <div className="relative">
                    <ImageIcon className="w-3.5 h-3.5 text-zinc-550 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-zinc-950/50 border border-zinc-850 hover:border-zinc-800 focus:border-amber-500 focus:outline-none rounded-xl pl-9 pr-4 py-3 text-xs text-zinc-200 placeholder-zinc-700 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-3xs font-semibold text-zinc-400 uppercase tracking-widest block">
                    ลำดับการแสดงผล (Sort Order)
                  </label>
                  <input
                    type="number"
                    value={formSortOrder}
                    onChange={(e) => setFormSortOrder(Number(e.target.value))}
                    placeholder="0"
                    className="w-full bg-zinc-950/50 border border-zinc-850 hover:border-zinc-800 focus:border-amber-500 focus:outline-none rounded-xl px-4 py-3 text-xs text-zinc-200 transition-all"
                  />
                </div>
              </div>

              {/* Dynamic Options Builder */}
              <div className="border-t border-zinc-850 pt-5 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-250">การตั้งค่าตัวเลือกเสริม (Options Configuration)</h4>
                    <p className="text-3xs text-zinc-500 mt-0.5">เช่น ความเผ็ด, เลือกเนื้อสัตว์, เพิ่มท็อปปิ้ง</p>
                  </div>
                </div>

                {/* Option Builder Controls */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newOptionLabel}
                    onChange={(e) => setNewOptionLabel(e.target.value)}
                    placeholder="เช่น ความเผ็ด หรือ เพิ่มวัตถุดิบ..."
                    className="flex-1 bg-zinc-950/40 border border-zinc-850 focus:border-amber-500 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-zinc-300 placeholder-zinc-700"
                  />
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-750 border border-zinc-750 text-amber-400 font-semibold text-xs rounded-xl active:scale-95 transition-all shrink-0 cursor-pointer"
                  >
                    + เพิ่มกลุ่มหัวข้อ
                  </button>
                </div>

                {/* Loaded Options List */}
                {formOptions.length > 0 && (
                  <div className="space-y-4 bg-zinc-950/20 border border-zinc-850/60 rounded-2xl p-4">
                    {formOptions.map((opt, optIdx) => (
                      <div key={optIdx} className="bg-zinc-950/40 border border-zinc-850 rounded-xl p-4.5 space-y-3 relative group">
                        
                        {/* Remove Option Block */}
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(optIdx)}
                          className="absolute top-4 right-4 p-1.5 bg-zinc-900 border border-zinc-800 hover:border-red-950/40 text-zinc-500 hover:text-red-400 rounded-lg transition-all cursor-pointer"
                          title="ลบหัวข้อนี้"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>

                        <span className="text-2xs font-extrabold text-zinc-300 block pr-8">
                          หัวข้อ: {opt.label}
                        </span>

                        {/* Choices Sub-list */}
                        <div className="space-y-2">
                          <span className="text-3xs font-semibold text-zinc-550 uppercase block tracking-widest">
                            ตัวเลือกย่อยและราคาบวกเพิ่ม
                          </span>
                          
                          {opt.choices.map((choice, choiceIdx) => (
                            <div key={choiceIdx} className="flex items-center gap-3">
                              <input
                                type="text"
                                value={choice.name}
                                onChange={(e) =>
                                  handleChoiceFieldChange(optIdx, choiceIdx, "name", e.target.value)
                                }
                                placeholder="ตัวอย่าง: เผ็ดมาก หรือ +หมูสับ"
                                className="flex-1 bg-zinc-950/50 border border-zinc-850 focus:border-amber-500 focus:outline-none rounded-lg px-3 py-1.5 text-xs text-zinc-300"
                              />
                              <div className="relative w-28">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-3xs text-zinc-550">+ ฿</span>
                                <input
                                  type="number"
                                  value={choice.priceAdded}
                                  onChange={(e) =>
                                    handleChoiceFieldChange(
                                      optIdx,
                                      choiceIdx,
                                      "priceAdded",
                                      e.target.value
                                    )
                                  }
                                  placeholder="0"
                                  className="w-full bg-zinc-950/50 border border-zinc-850 focus:border-amber-500 focus:outline-none rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-350 text-right"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveChoice(optIdx, choiceIdx)}
                                className="p-1.5 bg-zinc-900 border border-zinc-800 text-zinc-650 hover:text-red-400 rounded-lg transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={() => handleAddChoice(optIdx)}
                            className="text-3xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-all pt-1 focus:outline-none cursor-pointer"
                          >
                            + เพิ่มตัวเลือกย่อยในกลุ่มนี้
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </form>

            {/* Modal Footer Save Buttons */}
            <div className="pt-4 border-t border-zinc-850 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-3xs text-zinc-500 font-medium">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>* ระบุข้อมูลสำคัญความพร้อมให้ถูกต้อง</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 font-bold text-xs rounded-2xl active:scale-95 transition-all cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleSubmitForm}
                  className="px-5 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-xs rounded-2xl shadow-lg shadow-amber-500/10 active:scale-95 transition-all cursor-pointer"
                >
                  บันทึกข้อมูลเมนู
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
