'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Wine, Image as ImageIcon } from 'lucide-react'
import { INITIAL_CATEGORIES } from '@/lib/mock-data'

export default function NewProductPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    category_id: 'cat-red-wine',
    sku: '',
    barcode: '',
    price: 0,
    cost: 0,
    stock: 12,
    min_stock: 3,
    country: 'France',
    region: 'Bordeaux',
    winery: '',
    grape: 'Cabernet Sauvignon',
    vintage: '2020',
    alcohol_percent: 13.5,
    volume_ml: 750,
    description: '',
    image_url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    alert(`บันทึกสินค้าไวน์ "${formData.name}" เรียบร้อยแล้ว!`)
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
            <h1 className="text-xl font-bold text-white">เพิ่มสินค้าไวน์และเครื่องดื่มใหม่</h1>
            <p className="text-xs text-gray-400">กรอกข้อมูลเฉพาะสำหรับไวน์และราคาสินค้าในระบบ POS</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-300 mb-1">ชื่อสินค้าไวน์ (Full Product Name) *</label>
              <input
                type="text"
                required
                placeholder="เช่น Château Lafite Rothschild 2018"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-[#100e17] text-white text-xs px-3.5 py-3 rounded-xl border border-gray-700 focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">หมวดหมู่สินค้า *</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full bg-[#100e17] text-white text-xs px-3.5 py-3 rounded-xl border border-gray-700 focus:outline-none focus:border-[#d4af37]"
              >
                {INITIAL_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">รหัสบาร์โค้ด (Barcode Scanner)</label>
              <input
                type="text"
                placeholder="88590001XXXXX"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="w-full bg-[#100e17] text-white text-xs px-3.5 py-3 rounded-xl border border-gray-700 focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">ราคาขายหน้าร้าน (฿) *</label>
              <input
                type="number"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className="w-full bg-[#100e17] text-[#d4af37] font-bold text-xs px-3.5 py-3 rounded-xl border border-gray-700 focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">ราคาทุนนำเข้า (฿) *</label>
              <input
                type="number"
                required
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                className="w-full bg-[#100e17] text-gray-300 text-xs px-3.5 py-3 rounded-xl border border-gray-700 focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">จำนวนสต็อกตั้งต้น (ขวด)</label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                className="w-full bg-[#100e17] text-white text-xs px-3.5 py-3 rounded-xl border border-gray-700 focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">เกณฑ์แจ้งเตือนสต็อกต่ำ (Min Stock)</label>
              <input
                type="number"
                value={formData.min_stock}
                onChange={(e) => setFormData({ ...formData, min_stock: Number(e.target.value) })}
                className="w-full bg-[#100e17] text-red-400 font-bold text-xs px-3.5 py-3 rounded-xl border border-gray-700 focus:outline-none focus:border-[#d4af37]"
              />
            </div>
          </div>

          {/* Wine Attributes */}
          <div className="pt-4 border-t border-gray-800 space-y-4">
            <h3 className="text-xs font-bold text-[#d4af37] uppercase tracking-wider">
              คุณลักษณะเฉพาะไวน์ (Wine & Spirits Specific Attributes)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">ประเทศผู้ผลิต (Country)</label>
                <input
                  type="text"
                  placeholder="เช่น France, Italy"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full bg-[#100e17] text-white text-xs px-3 py-2.5 rounded-xl border border-gray-700 focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">ปีที่ผลิต (Vintage)</label>
                <input
                  type="text"
                  placeholder="เช่น 2018, 2020"
                  value={formData.vintage}
                  onChange={(e) => setFormData({ ...formData, vintage: e.target.value })}
                  className="w-full bg-[#100e17] text-white text-xs px-3 py-2.5 rounded-xl border border-gray-700 focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">พันธุ์องุ่น (Grape)</label>
                <input
                  type="text"
                  placeholder="เช่น Cabernet Sauvignon"
                  value={formData.grape}
                  onChange={(e) => setFormData({ ...formData, grape: e.target.value })}
                  className="w-full bg-[#100e17] text-white text-xs px-3 py-2.5 rounded-xl border border-gray-700 focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">% แอลกอฮอล์ (ABV %)</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.alcohol_percent}
                  onChange={(e) => setFormData({ ...formData, alcohol_percent: Number(e.target.value) })}
                  className="w-full bg-[#100e17] text-white text-xs px-3 py-2.5 rounded-xl border border-gray-700 focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">ปริมาตร (ml)</label>
                <input
                  type="number"
                  value={formData.volume_ml}
                  onChange={(e) => setFormData({ ...formData, volume_ml: Number(e.target.value) })}
                  className="w-full bg-[#100e17] text-white text-xs px-3 py-2.5 rounded-xl border border-gray-700 focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">ภูมิภาค/แหล่งบ่ม (Region)</label>
                <input
                  type="text"
                  placeholder="เช่น Bordeaux, Napa Valley"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  className="w-full bg-[#100e17] text-white text-xs px-3 py-2.5 rounded-xl border border-gray-700 focus:outline-none focus:border-[#d4af37]"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-800 flex justify-end space-x-3">
            <Link
              href="/admin/products"
              className="px-5 py-3 rounded-xl bg-gray-800 text-gray-300 text-xs font-bold hover:bg-gray-700"
            >
              ยกเลิก
            </Link>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#8b0000] to-[#d4af37] text-white font-bold text-xs shadow-xl flex items-center space-x-2 hover:brightness-110"
            >
              <Save className="w-4 h-4 text-black" />
              <span className="text-black">บันทึกสินค้าใหม่</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
