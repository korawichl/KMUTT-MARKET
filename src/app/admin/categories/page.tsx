"use client";

import React, { useState } from "react";
import { PlusCircle, Trash2 } from "lucide-react";
import { useMarket } from "@/context/MarketContext";

export default function AdminCategoriesPage() {
  const { db, upsertCategory, deleteCategory } = useMarket();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    upsertCategory({ name, description });
    setName("");
    setDescription("");
  };

  return (
    <div className="rounded-2xl border border-[#E5E5E5] bg-white p-6 space-y-6">
      <h1 className="font-heading text-2xl font-bold text-[#222222]">
        จัดการหมวดหมู่สินค้าและอาหาร ({db.categories.length} หมวด)
      </h1>

      <form
        onSubmit={handleAdd}
        className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-4 border-b border-[#E5E5E5]"
      >
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ชื่อหมวดหมู่ใหม่..."
          className="rounded-xl border border-[#E5E5E5] px-3.5 py-2 text-sm"
        />
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="คำอธิบายหมวดหมู่..."
          className="rounded-xl border border-[#E5E5E5] px-3.5 py-2 text-sm"
        />
        <button
          type="submit"
          className="btn-tactile inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#A6192E] px-4 py-2 text-sm font-semibold text-white"
        >
          <PlusCircle className="h-4 w-4" />
          <span>เพิ่มหมวดหมู่</span>
        </button>
      </form>

      <div className="divide-y divide-[#E5E5E5]">
        {db.categories.map((cat) => (
          <div
            key={cat.id}
            className="py-3 flex items-center justify-between gap-4"
          >
            <div>
              <p className="font-bold text-sm text-[#222222]">{cat.name}</p>
              <p className="text-sm text-[#525252]">{cat.description}</p>
            </div>
            <button
              type="button"
              onClick={() => deleteCategory(cat.id)}
              className="rounded-lg border border-[#E5E5E5] p-2 text-[#525252] hover:text-[#DC2626]"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
