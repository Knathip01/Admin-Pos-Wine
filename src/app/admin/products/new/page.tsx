'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Wine, Image as ImageIcon } from 'lucide-react'
import { INITIAL_CATEGORIES } from '@/lib/mock-data'
import { createClient } from '@/lib/supabase/client'
import { Category } from '@/lib/types'

export default function NewProductPage() {
  const router = useRouter()
  const supabase = createClient()
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES)
  const [saving, setSaving] = useState(false)
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

  useEffect(() => {
    async function loadCategories() {
      const { data } = await supabase.from('categories').select('*').eq('is_active', true).order('sort_order')
      if (data && data.length > 0) {
        setCategories(data)
        setFormData(prev => ({ ...prev, category_id: data[0].id }))
      }
    }
    loadCategories()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          category_id: formData.category_id,
          sku: formData.sku || null,
          barcode: formData.barcode || null,
          price: Number(formData.price),
          cost: Number(formData.cost),
          stock: Number(formData.stock),
          min_stock: Number(formData.min_stock),
          country: formData.country,
          region: formData.region,
          winery: formData.winery,
          grape: formData.grape,
          vintage: formData.vintage,
          alcohol_percent: Number(formData.alcohol_percent) || null,
          volume_ml: Number(formData.volume_ml) || 750,
          description: formData.description || null,
          image_url: formData.image_url || null,
          is_active: true,
        }),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || 'เพิ่มสินค้าไม่สำเร็จ')
      }

      router.push('/admin/products')
    } catch (err: any) {
      alert(`เพิ่มสินค้าไม่สำเร็จ: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 select-none font-sans animate-in" style={{ padding: '20px' }}>
      <div className="flex items-center justify-between">
        <Link href="/admin/products" className="flex items-center space-x-2 text-xs font-bold text-[#22e5ff] hover:underline" style={{ textDecoration: 'none' }}>
          <ArrowLeft className="w-4 h-4" />
          <span>ย้อนกลับไปตารางรายการสินค้า</span>
        </Link>
      </div>

      <div className="admin-panel p-6 sm:p-8">
        <div className="pb-4 border-b border-white/5 mb-6 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[rgba(0,212,255,0.12)] border border-[rgba(0,212,255,0.30)]">
            <Wine className="w-5 h-5 text-[#22e5ff]" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-[#eef2ff]" style={{ fontFamily: "'Outfit', sans-serif" }}>เพิ่มสินค้าไวน์และเครื่องดื่มใหม่</h1>
            <p className="text-xs text-[#5a6e90] mt-0.5 font-semibold">กรอกข้อมูลเฉพาะสำหรับไวน์และราคาสินค้าในระบบ POS</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="admin-label">ชื่อสินค้าไวน์ (Full Product Name) *</label>
              <input
                type="text"
                required
                placeholder="เช่น Château Lafite Rothschild 2018"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="admin-input w-full text-xs"
              />
            </div>

            <div>
              <label className="admin-label">หมวดหมู่สินค้า *</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="admin-select w-full text-xs"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="admin-label">รหัสบาร์โค้ด (Barcode Scanner)</label>
              <input
                type="text"
                placeholder="88590001XXXXX"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="admin-input w-full text-xs"
              />
            </div>

            <div>
              <label className="admin-label">ราคาขายหน้าร้าน (฿) *</label>
              <input
                type="number"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className="admin-input w-full text-xs text-[#22e5ff] font-extrabold"
              />
            </div>

            <div>
              <label className="admin-label">ราคาทุนนำเข้า (฿) *</label>
              <input
                type="number"
                required
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                className="admin-input w-full text-xs text-[#94a3c4]"
              />
            </div>

            <div>
              <label className="admin-label">จำนวนสต็อกตั้งต้น (ขวด)</label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                className="admin-input w-full text-xs"
              />
            </div>

            <div>
              <label className="admin-label">เกณฑ์แจ้งเตือนสต็อกต่ำ (Min Stock)</label>
              <input
                type="number"
                value={formData.min_stock}
                onChange={(e) => setFormData({ ...formData, min_stock: Number(e.target.value) })}
                className="admin-input w-full text-xs text-[#fb7185] font-extrabold"
              />
            </div>
          </div>

          {/* Wine Attributes */}
          <div className="pt-4 border-t border-white/5 space-y-4">
            <h3 className="text-xs font-extrabold text-[#22e5ff] uppercase tracking-wider">
              คุณลักษณะเฉพาะไวน์ (Wine & Spirits Specific Attributes)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="admin-label">ประเทศผู้ผลิต (Country)</label>
                <input
                  type="text"
                  placeholder="เช่น France, Italy"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="admin-input w-full text-xs"
                />
              </div>

              <div>
                <label className="admin-label">ปีที่ผลิต (Vintage)</label>
                <input
                  type="text"
                  placeholder="เช่น 2018, 2020"
                  value={formData.vintage}
                  onChange={(e) => setFormData({ ...formData, vintage: e.target.value })}
                  className="admin-input w-full text-xs"
                />
              </div>

              <div>
                <label className="admin-label">พันธุ์องุ่น (Grape)</label>
                <input
                  type="text"
                  placeholder="เช่น Cabernet Sauvignon"
                  value={formData.grape}
                  onChange={(e) => setFormData({ ...formData, grape: e.target.value })}
                  className="admin-input w-full text-xs"
                />
              </div>

              <div>
                <label className="admin-label">% แอลกอฮอล์ (ABV %)</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.alcohol_percent}
                  onChange={(e) => setFormData({ ...formData, alcohol_percent: Number(e.target.value) })}
                  className="admin-input w-full text-xs"
                />
              </div>

              <div>
                <label className="admin-label">ปริมาตร (ml)</label>
                <input
                  type="number"
                  value={formData.volume_ml}
                  onChange={(e) => setFormData({ ...formData, volume_ml: Number(e.target.value) })}
                  className="admin-input w-full text-xs"
                />
              </div>

              <div>
                <label className="admin-label">ภูมิภาค/แหล่งบ่ม (Region)</label>
                <input
                  type="text"
                  placeholder="เช่น Bordeaux, Napa Valley"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  className="admin-input w-full text-xs"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 flex justify-end space-x-3">
            <Link
              href="/admin/products"
              className="admin-btn-secondary px-5 py-2.5 text-xs font-bold"
              style={{ textDecoration: 'none' }}
            >
              ยกเลิก
            </Link>
            <button
              type="submit"
              className="admin-btn-primary px-6 py-2.5 text-xs font-bold flex items-center space-x-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกสินค้าใหม่</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

