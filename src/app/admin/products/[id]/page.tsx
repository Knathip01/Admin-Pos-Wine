'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save, Wine } from 'lucide-react'
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from '@/lib/mock-data'

export default function EditProductPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string
  const existing = INITIAL_PRODUCTS.find((p) => p.id === productId) || INITIAL_PRODUCTS[0]

  const [formData, setFormData] = useState({ ...existing })

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    alert(`อัปเดตสินค้าไวน์ "${formData.name}" เรียบร้อยแล้ว!`)
    router.push('/admin/products')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/admin/products" className="flex items-center space-x-2 text-xs font-semibold text-[#d4af37] hover:underline">
          <ArrowLeft className="w-4 h-4" />
          <span>ย้อนกลับไปตารางรายการสินค้า</span>
        </Link>
      </div>

      <div className="glass-panel p-8 rounded-3xl border border-[#d4af37]/40 bg-[#181622] shadow-2xl">
        <div className="pb-4 border-b border-gray-800 mb-6 flex items-center space-x-3">
          <Wine className="w-7 h-7 text-[#d4af37]" />
          <div>
            <h1 className="text-xl font-bold text-white">แก้ไขรายละเอียดสินค้าไวน์</h1>
            <p className="text-xs text-gray-400">ID: {existing.id} • บาร์โค้ด: {existing.barcode}</p>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-300 mb-1">ชื่อสินค้าไวน์</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-[#100e17] text-white text-xs px-3.5 py-3 rounded-xl border border-gray-700 focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">ราคาขาย (฿)</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className="w-full bg-[#100e17] text-[#d4af37] font-bold text-xs px-3.5 py-3 rounded-xl border border-gray-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">ราคาทุน (฿)</label>
              <input
                type="number"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                className="w-full bg-[#100e17] text-gray-300 text-xs px-3.5 py-3 rounded-xl border border-gray-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">คงเหลือสต็อก (ขวด)</label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                className="w-full bg-[#100e17] text-white font-bold text-xs px-3.5 py-3 rounded-xl border border-gray-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">เกณฑ์สต็อกต่ำ (Min Stock)</label>
              <input
                type="number"
                value={formData.min_stock}
                onChange={(e) => setFormData({ ...formData, min_stock: Number(e.target.value) })}
                className="w-full bg-[#100e17] text-red-400 font-bold text-xs px-3.5 py-3 rounded-xl border border-gray-700"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-800 flex justify-end space-x-3">
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#8b0000] to-[#d4af37] text-white font-bold text-xs shadow-xl flex items-center space-x-2 hover:brightness-110"
            >
              <Save className="w-4 h-4 text-black" />
              <span className="text-black">อัปเดตข้อมูลสินค้า</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
