'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from '@/lib/mock-data'
import { Product, Category } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import {
  Plus, Search, Edit2, Trash2, Wine, Loader2, X, Save,
  Upload, Image as ImageIcon, Camera, Tag, Utensils, Package, Sparkles
} from 'lucide-react'
import FoodWinePairingManager from '@/components/admin/FoodWinePairingManager'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

const drinkKeywords = ['wine', 'rosé', 'sparkling', 'champagne', 'ไวน์', 'beer', 'drink', 'beverage', 'bar', 'เบียร์', 'เครื่องดื่ม', 'cocktail']

export default function ProductsPage() {
  const supabase = createClient()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null)
  const [addMode, setAddMode] = useState<'wine' | 'food'>('wine')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [showDiscountModal, setShowDiscountModal] = useState(false)
  const [allowedDiscounts, setAllowedDiscounts] = useState<number[]>([10, 20, 30, 40, 50, 60, 70, 80, 90])
  const [customDiscountInput, setCustomDiscountInput] = useState('')
  const [savingDiscounts, setSavingDiscounts] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState<'products' | 'pairings'>('products')
  const [pairingsCount, setPairingsCount] = useState<number>(0)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [{ data: cats }, { data: prods }, { data: discountSetting }, { data: pairingSetting }] = await Promise.all([
        supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('products').select('*, categories(name, icon)').order('name'),
        supabase.from('settings').select('value').eq('key', 'allowed_discounts').single(),
        supabase.from('settings').select('value').eq('key', 'food_wine_pairings').single()
      ])
      setCategories((cats && cats.length > 0) ? cats : INITIAL_CATEGORIES)
      setProducts((prods && prods.length > 0) ? prods : INITIAL_PRODUCTS)

    if (discountSetting?.value) {
      try {
        setAllowedDiscounts(JSON.parse(discountSetting.value))
      } catch (e) {
        console.error(e)
      }
    }

    if (pairingSetting?.value) {
      try {
        const parsed = JSON.parse(pairingSetting.value)
        if (Array.isArray(parsed)) {
          setPairingsCount(parsed.length)
        }
      } catch (e) {
        console.error(e)
      }
    }
    } catch (err) {
      console.error('Failed to load products:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveDiscounts = async (newDiscounts: number[]) => {
    setSavingDiscounts(true)
    setSaveSuccess(false)
    try {
      const sorted = [...newDiscounts].sort((a, b) => a - b)

      // 1. บันทึกผ่าน /api/admin/settings
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'allowed_discounts',
          value: JSON.stringify(sorted),
        }),
      })

      if (res.ok) {
        setAllowedDiscounts(sorted)
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 2000)
        return
      }

      // 2. Fallback: update
      const { error: updateError } = await supabase
        .from('settings')
        .update({ value: JSON.stringify(sorted) })
        .eq('key', 'allowed_discounts')

      if (!updateError) {
        setAllowedDiscounts(sorted)
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 2000)
        return
      }

      // 3. Fallback: upsert
      const { error } = await supabase
        .from('settings')
        .upsert({ key: 'allowed_discounts', value: JSON.stringify(sorted) }, { onConflict: 'key' })
      if (error) throw error
      setAllowedDiscounts(sorted)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch (err: any) {
      alert('บันทึกไม่สำเร็จ: ' + err.message)
    } finally {
      setSavingDiscounts(false)
    }
  }

  const filtered = products.filter(p => {
    const q = search.toLowerCase()
    return (catFilter === 'all' || p.category_id === catFilter) &&
      (!q || p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q))
  })

  const openEdit = (product?: Partial<Product>, defaultType?: 'wine' | 'food') => {
    const mode = defaultType || 'wine'
    if (!product) setAddMode(mode)
    else {
      const cat = categories.find(c => c.id === product.category_id)
      const isDrink = !cat || drinkKeywords.some(kw => cat.name.toLowerCase().includes(kw))
      setAddMode(isDrink ? 'wine' : 'food')
    }

    let defaultCatId: string | undefined = undefined
    if (!product) {
      if (mode === 'wine') {
        const wineCat = categories.find(c => ['wine', 'ไวน์'].some(name => c.name.toLowerCase().includes(name)))
        if (wineCat) defaultCatId = wineCat.id
      } else {
        const foodCat = categories.find(c => ['อาหาร', 'food', 'snack', 'ของทานเล่น'].some(name => c.name.toLowerCase().includes(name)))
        if (foodCat) defaultCatId = foodCat.id
      }
    }

    const p = product || {
      name: '', sku: '', barcode: '', price: 0, cost: 0, stock: 0, min_stock: 5,
      country: '', region: '', brand: '', grape: '', vintage: '',
      alcohol_percent: undefined, volume_ml: 750, is_active: true, category_id: defaultCatId, image_url: ''
    }
    setEditingProduct(p)
    setPreviewUrl(p.image_url || null)
  }

  const handleImageUpload = async (file: File) => {
    if (!file) return
    setUploading(true)

    const localUrl = URL.createObjectURL(file)
    setPreviewUrl(localUrl)

    const ext = file.name.split('.').pop()
    const fileName = `product_${Date.now()}.${ext}`

    const { data, error } = await supabase.storage
      .from('products')
      .upload(fileName, file, { upsert: true, contentType: file.type })

    if (error) {
      alert('อัพโหลดรูปไม่สำเร็จ: ' + error.message)
      setPreviewUrl(editingProduct?.image_url || null)
    } else {
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/products/${data.path}`
      setEditingProduct(prev => prev ? { ...prev, image_url: publicUrl } : prev)
      setPreviewUrl(publicUrl)
    }
    setUploading(false)
  }

  const handleSave = async () => {
    if (!editingProduct?.name?.trim()) {
      alert('กรุณาระบุชื่อสินค้า')
      return
    }
    setSaving(true)

    const payload: Record<string, any> = { ...editingProduct }
    delete payload.categories

    if (addMode === 'food') {
      delete payload.country
      delete payload.region
      delete payload.winery
      delete payload.grape
      delete payload.vintage
      delete payload.alcohol_percent
      delete payload.volume_ml
    }

    try {
      if (editingProduct.id) {
        const res = await fetch('/api/admin/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        const data = await res.json()
        if (!res.ok || data.error) {
          throw new Error(data.error || 'อัปเดตสินค้าไม่สำเร็จ')
        }
      } else {
        const res = await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        const data = await res.json()
        if (!res.ok || data.error) {
          throw new Error(data.error || 'เพิ่มสินค้าไม่สำเร็จ')
        }
      }

      setEditingProduct(null)
      setPreviewUrl(null)
      await loadData()
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + (err.message || 'ไม่สามารถบันทึกได้'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('ยืนยันการลบสินค้านี้?')) return

    try {
      const res = await fetch(`/api/admin/products?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || 'ลบสินค้าไม่สำเร็จ')
      }
      alert(data.message || 'ลบสินค้าสำเร็จ')
      await loadData()
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + (err.message || 'ไม่สามารถลบได้'))
    }
  }

  const getCategoryDisplay = (p: Product) => {
    const cat = (p.categories as unknown as { name: string; icon?: string } | null)
    return cat ? `${cat.icon || ''} ${cat.name}` : '-'
  }

  const selectedCategoryName = categories.find(c => c.id === editingProduct?.category_id)?.name || ''
  const isWineMode = addMode === 'wine'
  const isFoodMode = addMode === 'food'

  const wineCategories = categories.filter(c => drinkKeywords.some(kw => c.name.toLowerCase().includes(kw)))
  const foodCategories = categories.filter(c => !drinkKeywords.some(kw => c.name.toLowerCase().includes(kw)))

  return (
    <div className="animate-in" style={{ padding: '20px', maxWidth: '1500px' }}>
      {/* Header & Main Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-gradient-to-br from-indigo-500/20 via-purple-500/15 to-pink-500/10 border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.25)] shrink-0">
            <Package size={20} className="text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.45rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.025em', margin: 0 }}>
                จัดการสินค้า POS
              </h1>
            </div>
            <p style={{ color: '#64748b', fontSize: 13, fontWeight: 600, marginTop: 2 }}>
              {products.filter(p => p.is_active).length} รายการที่เปิดขายอยู่
            </p>
          </div>
        </div>

        {/* Action Buttons: 2x2 Grid on Mobile, Flex Row on Desktop */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-2.5 w-full lg:w-auto">
          {/* Button 1: เพิ่มสินค้า Wine */}
          <button
            onClick={() => openEdit(undefined, 'wine')}
            className="group flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 text-xs font-bold rounded-xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, rgba(6,182,212,0.22) 0%, rgba(14,116,144,0.35) 100%)',
              border: '1px solid rgba(34,229,255,0.45)',
              color: '#e0f7fa',
              boxShadow: '0 4px 18px rgba(6,182,212,0.18), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}
          >
            <Plus size={15} className="text-cyan-300 transition-transform group-hover:scale-110 shrink-0" />
            <span className="truncate">เพิ่มไวน์</span>
          </button>

          {/* Button 2: เพิ่มอาหาร */}
          <button
            onClick={() => openEdit(undefined, 'food')}
            className="group flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 text-xs font-bold rounded-xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,0.22) 0%, rgba(180,83,9,0.32) 100%)',
              border: '1px solid rgba(251,191,36,0.45)',
              color: '#fef3c7',
              boxShadow: '0 4px 18px rgba(245,158,11,0.18), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}
          >
            <Plus size={15} className="text-amber-400 transition-transform group-hover:scale-110 shrink-0" />
            <span className="truncate">เพิ่มอาหาร</span>
          </button>

          {/* Button 3: ตั้งค่าปุ่มส่วนลด */}
          <button
            onClick={() => setShowDiscountModal(true)}
            className="group flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 text-xs font-bold rounded-xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, rgba(168,85,247,0.22) 0%, rgba(126,34,206,0.32) 100%)',
              border: '1px solid rgba(192,132,252,0.45)',
              color: '#f3e8ff',
              boxShadow: '0 4px 18px rgba(168,85,247,0.18), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}
          >
            <Tag size={15} className="text-purple-300 transition-transform group-hover:scale-110 shrink-0" />
            <span className="truncate">ตั้งค่าส่วนลด</span>
          </button>

          {/* Button 4: สลับมุมมองระบบจับคู่ */}
          <button
            onClick={() => setActiveTab(activeTab === 'products' ? 'pairings' : 'products')}
            className="group flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 text-xs font-bold rounded-xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 active:scale-[0.98]"
            style={{
              background: activeTab === 'pairings'
                ? 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)'
                : 'linear-gradient(135deg, rgba(244,63,94,0.22) 0%, rgba(190,18,60,0.32) 100%)',
              border: activeTab === 'pairings'
                ? '1px solid rgba(255,255,255,0.40)'
                : '1px solid rgba(251,113,133,0.45)',
              color: activeTab === 'pairings' ? '#ffffff' : '#ffe4e6',
              boxShadow: activeTab === 'pairings'
                ? '0 4px 22px rgba(244,63,94,0.45), inset 0 1px 0 rgba(255,255,255,0.25)'
                : '0 4px 18px rgba(244,63,94,0.20), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}
          >
            <Sparkles size={15} className={`transition-transform group-hover:scale-110 shrink-0 ${activeTab === 'pairings' ? 'text-white' : 'text-rose-300'}`} />
            <span className="truncate">จัดการจับคู่</span>
          </button>
        </div>
      </div>

      {/* Navigation Segmented Control: 2 equal tabs on mobile, inline on desktop */}
      <div className="mb-6 p-1.5 rounded-2xl bg-[rgba(15,23,42,0.65)] border border-[rgba(255,255,255,0.08)] backdrop-blur-xl grid grid-cols-2 sm:inline-flex sm:w-auto gap-1.5 shadow-inner">
        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-2 text-xs sm:text-sm font-bold rounded-xl cursor-pointer transition-all duration-200 ${
            activeTab === 'products'
              ? 'bg-gradient-to-r from-cyan-500/20 via-blue-600/25 to-indigo-600/20 border border-cyan-400/40 text-cyan-200 shadow-[0_0_20px_rgba(0,212,255,0.25)]'
              : 'text-[var(--admin-text-sec)] hover:text-white hover:bg-white/[0.04] border border-transparent'
          }`}
        >
          <span className="truncate">รายการสินค้า POS</span>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
            activeTab === 'products'
              ? 'bg-cyan-400/25 text-cyan-100 border border-cyan-400/40'
              : 'bg-slate-800 text-slate-400'
          }`}>
            {products.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('pairings')}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-2 text-xs sm:text-sm font-bold rounded-xl cursor-pointer transition-all duration-200 ${
            activeTab === 'pairings'
              ? 'bg-gradient-to-r from-rose-500/25 via-pink-600/30 to-rose-600/25 border border-rose-400/50 text-rose-100 shadow-[0_0_20px_rgba(244,63,94,0.30)]'
              : 'text-[var(--admin-text-sec)] hover:text-white hover:bg-white/[0.04] border border-transparent'
          }`}
        >
          <span className="truncate">จับคู่อาหาร & ไวน์</span>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
            activeTab === 'pairings'
              ? 'bg-rose-400/25 text-rose-100 border border-rose-400/40'
              : 'bg-slate-800 text-slate-400'
          }`}>
            {pairingsCount}
          </span>
        </button>
      </div>

      {activeTab === 'pairings' ? (
        <FoodWinePairingManager onPairingsChange={(list) => setPairingsCount(list.length)} />
      ) : (
        <>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
          <input
            className="admin-input pl-10 text-xs sm:text-sm w-full py-2.5 rounded-xl border border-white/10 bg-[rgba(15,23,42,0.6)] text-slate-200 placeholder-slate-500 focus:border-cyan-400 transition-all"
            placeholder="ค้นหาชื่อ / SKU / แบรนด์..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="admin-select text-xs sm:text-sm rounded-xl py-2.5 px-4 bg-[rgba(15,23,42,0.6)] border border-white/10 text-slate-200 focus:border-cyan-400 cursor-pointer w-full sm:w-auto"
          style={{ minWidth: '180px' }}
          value={catFilter}
          onChange={e => setCatFilter(e.target.value)}
        >
          <option value="all">ทุกหมวดหมู่ ({products.length})</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin" size={32} style={{ color: '#22e5ff' }} />
        </div>
      ) : (
        <div className="admin-table-wrap overflow-hidden">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr className="admin-table-head">
                  {['รูป', 'ชื่อสินค้า', 'หมวดหมู่', 'ราคา', 'ต้นทุน', 'สต๊อก', 'สถานะ', ''].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '10px', fontWeight: 800, color: 'var(--admin-text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.12em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="admin-table-row">
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 10, overflow: 'hidden',
                        background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <Wine size={18} style={{ color: '#22e5ff', opacity: 0.6 }} />
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-text, #eef2ff)', margin: 0 }}>{p.name}</p>
                      <p style={{ fontSize: 11, color: 'var(--admin-text-muted, #94a3b8)', margin: '2px 0 0' }}>
                        {(() => {
                          const catName = (p.categories as any)?.name || ''
                          const isWine = ['wine', 'rosé', 'sparkling', 'champagne', 'ไวน์'].some(name => catName.toLowerCase().includes(name))
                          return [p.sku, isWine ? [p.vintage, p.grape].filter(Boolean).join(' · ') : p.brand].filter(Boolean).join(' · ')
                        })()}
                      </p>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 8, background: 'rgba(0,212,255,0.07)', border: '1px solid rgba(0,212,255,0.18)', color: '#22e5ff' }}>
                        {getCategoryDisplay(p)}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#fbbf24' }}>{formatCurrency(p.price)}</span>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ fontSize: 13, color: '#5a6e90' }}>{formatCurrency(p.cost)}</span>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: p.stock === 0 ? '#fb7185' : p.stock <= p.min_stock ? '#fbbf24' : '#34d399' }}>
                        {p.stock} ชิ้น/ขวด
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span className={p.is_active ? 'badge-delivered' : 'badge-rejected'}>
                        {p.is_active ? 'ขายอยู่' : 'หยุดขาย'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(p)}
                          title="แก้ไขข้อมูลสินค้า"
                          className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-150"
                          style={{
                            background: 'rgba(6,182,212,0.12)',
                            border: '1px solid rgba(6,182,212,0.25)',
                            color: '#22d3ee'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(6,182,212,0.25)'
                            e.currentTarget.style.borderColor = 'rgba(34,211,238,0.5)'
                            e.currentTarget.style.transform = 'scale(1.08)'
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(6,182,212,0.12)'
                            e.currentTarget.style.borderColor = 'rgba(6,182,212,0.25)'
                            e.currentTarget.style.transform = 'scale(1)'
                          }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          title="ลบสินค้า"
                          className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-150"
                          style={{
                            background: 'rgba(244,63,94,0.12)',
                            border: '1px solid rgba(244,63,94,0.25)',
                            color: '#fb7185'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(244,63,94,0.25)'
                            e.currentTarget.style.borderColor = 'rgba(251,113,133,0.5)'
                            e.currentTarget.style.transform = 'scale(1.08)'
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(244,63,94,0.12)'
                            e.currentTarget.style.borderColor = 'rgba(244,63,94,0.25)'
                            e.currentTarget.style.transform = 'scale(1)'
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-16" style={{ color: 'var(--admin-text-muted, #94a3b8)' }}>
                <Wine size={36} className="mx-auto mb-2 opacity-30" />
                <p style={{ fontSize: 13, fontWeight: 600 }}>ไม่พบสินค้า</p>
              </div>
            )}
          </div>
        </div>
      )}
      </>
      )}


      {editingProduct && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}>
          <div className="admin-panel w-full" style={{ maxWidth: '720px', maxHeight: '92vh', overflow: 'auto', padding: 0 }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)',
                background: isFoodMode
                  ? 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(234,88,12,0.06))'
                  : 'linear-gradient(135deg, rgba(0,212,255,0.12), rgba(168,85,247,0.06))'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 20,
                    background: isFoodMode ? 'rgba(245,158,11,0.15)' : 'rgba(0,212,255,0.12)',
                    border: `1px solid ${isFoodMode ? 'rgba(245,158,11,0.30)' : 'rgba(0,212,255,0.25)'}`
                  }}>
                    {isFoodMode ? '🍽️' : '🍷'}
                  </div>
                  <div>
                    <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 900, color: 'var(--admin-text, #eef2ff)', margin: 0 }}>
                      {editingProduct?.id
                        ? (isFoodMode ? 'แก้ไขอาหาร' : 'แก้ไขสินค้า Wine')
                        : (isFoodMode ? 'เพิ่มอาหาร' : 'เพิ่มสินค้า Wine')}
                    </h2>
                    <p style={{ fontSize: 12, color: 'var(--admin-text-muted, #94a3b8)', margin: '2px 0 0', fontWeight: 600 }}>
                      {isFoodMode ? 'กรอกข้อมูลอาหาร — ไม่มีฟิลด์ไวน์' : 'กรอกข้อมูลไวน์ / เครื่องดื่ม'}
                    </p>
                  </div>
                </div>
                <button onClick={() => { setEditingProduct(null); setPreviewUrl(null) }} className="cursor-pointer" style={{ background: 'none', border: 'none' }}>
                  <X size={20} style={{ color: 'var(--admin-text-muted, #94a3b8)' }} />
                </button>
              </div>

            <div className="p-6">
              <div className="mb-6">
                <label className="block text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#22e5ff' }}>
                  📸 รูปภาพสินค้า
                </label>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    style={{
                      width: 120, height: 120, borderRadius: 16,
                      background: previewUrl ? 'transparent' : 'rgba(0,212,255,0.04)',
                      border: `2px dashed ${previewUrl ? 'rgba(0,212,255,0.40)' : 'rgba(255,255,255,0.10)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: uploading ? 'not-allowed' : 'pointer', overflow: 'hidden',
                      transition: 'all 0.2s', flexShrink: 0, position: 'relative'
                    }}
                    onMouseEnter={e => { if (!uploading) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,212,255,0.50)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = previewUrl ? 'rgba(0,212,255,0.40)' : 'rgba(255,255,255,0.10)' }}
                  >
                    {uploading ? (
                      <Loader2 size={28} className="animate-spin" style={{ color: '#22e5ff' }} />
                    ) : previewUrl ? (
                      <>
                        <img src={previewUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '0'}>
                          <Camera size={24} color="white" />
                        </div>
                      </>
                    ) : (
                      <div style={{ textAlign: 'center', color: 'var(--admin-text-muted, #94a3b8)' }}>
                        <ImageIcon size={28} style={{ margin: '0 auto 6px', opacity: 0.5 }} />
                        <p style={{ fontSize: 10, fontWeight: 700 }}>คลิกอัพโหลด</p>
                      </div>
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold mb-3 cursor-pointer"
                      style={{ background: 'rgba(0,212,255,0.10)', border: '1px solid rgba(0,212,255,0.25)', color: '#22e5ff' }}>
                      <Upload size={14} />
                      {uploading ? 'กำลังอัพโหลด...' : 'เลือกรูปภาพ'}
                    </button>
                    <p style={{ fontSize: 11, color: 'var(--admin-text-muted, #94a3b8)', lineHeight: 1.6 }}>
                      รองรับ JPG, PNG, WEBP<br />
                      ขนาดแนะนำ 800×800px หรือสี่เหลี่ยมจัตุรัส
                    </p>
                    {previewUrl && (
                      <button
                        onClick={() => { setPreviewUrl(null); setEditingProduct(prev => prev ? { ...prev, image_url: '' } : prev) }}
                        style={{ fontSize: 11, color: '#fb7185', background: 'none', border: 'none', cursor: 'pointer', marginTop: 6, fontWeight: 700 }}>
                        ✕ ลบรูป
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: '#5a6e90' }}>ชื่อสินค้า *</label>
                  <input className="admin-input text-xs w-full py-2.5 px-3" placeholder="เช่น Premium Ribeye Steak หรือ Château Margaux" value={editingProduct.name || ''} onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: '#5a6e90' }}>SKU</label>
                  <input className="admin-input text-xs w-full py-2.5 px-3" placeholder={isWineMode ? 'WN-001' : 'FD-001'} value={editingProduct.sku || ''} onChange={e => setEditingProduct({ ...editingProduct, sku: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: '#5a6e90' }}>Barcode</label>
                  <input className="admin-input text-xs w-full py-2.5 px-3" placeholder="8850000000000" value={editingProduct.barcode || ''} onChange={e => setEditingProduct({ ...editingProduct, barcode: e.target.value })} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: '#5a6e90' }}>หมวดหมู่</label>
                  <select className="admin-select text-xs" value={editingProduct.category_id || ''} onChange={e => setEditingProduct({ ...editingProduct, category_id: e.target.value })}>
                    <option value="">-- เลือกหมวดหมู่ --</option>
                    {(isFoodMode ? foodCategories : wineCategories).length > 0
                      ? (isFoodMode ? foodCategories : wineCategories).map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)
                      : categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)
                    }
                  </select>
                  {isFoodMode && foodCategories.length === 0 && (
                    <p style={{ fontSize: 11, color: '#fbbf24', marginTop: 4 }}>⚠ ยังไม่มีหมวดหมู่อาหาร — ไปเพิ่มที่ <strong>จัดการหมวดหมู่</strong> ก่อน</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: '#5a6e90' }}>ราคาขาย (บาท) *</label>
                  <input type="number" className="admin-input text-xs w-full py-2.5 px-3" min="0" step="1" value={editingProduct.price || 0} onChange={e => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: '#5a6e90' }}>ต้นทุน (บาท)</label>
                  <input type="number" className="admin-input text-xs w-full py-2.5 px-3" min="0" step="1" value={editingProduct.cost || 0} onChange={e => setEditingProduct({ ...editingProduct, cost: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: '#5a6e90' }}>สต๊อก (ชิ้น/ขวด)</label>
                  <input type="number" className="admin-input text-xs w-full py-2.5 px-3" min="0" value={editingProduct.stock || 0} onChange={e => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: '#5a6e90' }}>แจ้งเตือนเมื่อต่ำกว่า</label>
                  <input type="number" className="admin-input text-xs w-full py-2.5 px-3" min="0" value={editingProduct.min_stock || 5} onChange={e => setEditingProduct({ ...editingProduct, min_stock: parseInt(e.target.value) || 0 })} />
                </div>

                {isWineMode && (
                  <>
                    <div style={{ gridColumn: '1 / -1', borderTop: '1px solid rgba(0,212,255,0.15)', paddingTop: '14px', marginTop: '4px' }}>
                      <p className="text-xs font-bold" style={{ color: '#22e5ff' }}>🍷 ข้อมูลเฉพาะไวน์ / เครื่องดื่ม</p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1.5" style={{ color: '#5a6e90' }}>ประเทศ</label>
                      <input className="admin-input text-xs w-full py-2.5 px-3" placeholder="France" value={editingProduct.country || ''} onChange={e => setEditingProduct({ ...editingProduct, country: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1.5" style={{ color: '#5a6e90' }}>ภูมิภาค</label>
                      <input className="admin-input text-xs w-full py-2.5 px-3" placeholder="Bordeaux" value={editingProduct.region || ''} onChange={e => setEditingProduct({ ...editingProduct, region: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1.5" style={{ color: '#5a6e90' }}>แบรนด์</label>
                      <input className="admin-input text-xs w-full py-2.5 px-3" placeholder="Château Margaux" value={editingProduct.brand || ''} onChange={e => setEditingProduct({ ...editingProduct, brand: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1.5" style={{ color: '#5a6e90' }}>Winery</label>
                      <input className="admin-input text-xs w-full py-2.5 px-3" placeholder="Margaux AOC" value={editingProduct.winery || ''} onChange={e => setEditingProduct({ ...editingProduct, winery: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1.5" style={{ color: '#5a6e90' }}>พันธุ์องุ่น</label>
                      <input className="admin-input text-xs w-full py-2.5 px-3" placeholder="Cabernet Sauvignon" value={editingProduct.grape || ''} onChange={e => setEditingProduct({ ...editingProduct, grape: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1.5" style={{ color: '#5a6e90' }}>ปีผลิต (Vintage)</label>
                      <input className="admin-input text-xs w-full py-2.5 px-3" placeholder="2020" value={editingProduct.vintage || ''} onChange={e => setEditingProduct({ ...editingProduct, vintage: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1.5" style={{ color: '#5a6e90' }}>Alcohol (%)</label>
                      <input type="number" step="0.1" min="0" max="100" className="admin-input text-xs w-full py-2.5 px-3" placeholder="13.5" value={editingProduct.alcohol_percent || ''} onChange={e => setEditingProduct({ ...editingProduct, alcohol_percent: parseFloat(e.target.value) })} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1.5" style={{ color: '#5a6e90' }}>ปริมาณ (ml)</label>
                      <select className="admin-select text-xs" value={editingProduct.volume_ml || 750} onChange={e => setEditingProduct({ ...editingProduct, volume_ml: parseInt(e.target.value) })}>
                        {[187, 375, 500, 750, 1000, 1500, 3000].map(v => <option key={v} value={v}>{v} ml{v === 750 ? ' (มาตรฐาน)' : ''}</option>)}
                      </select>
                    </div>
                  </>
                )}

                {isFoodMode && (
                  <>
                    <div style={{ gridColumn: '1 / -1', borderTop: '1px solid rgba(245,158,11,0.2)', paddingTop: '14px', marginTop: '4px', background: 'rgba(245,158,11,0.03)', borderRadius: 10, padding: '14px' }}>
                      <p className="text-xs font-bold" style={{ color: '#fbbf24' }}>🍽️ ข้อมูลเพิ่มเติมอาหาร</p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1.5" style={{ color: '#5a6e90' }}>แบรนด์ / ชื่อร้าน (ถ้ามี)</label>
                      <input className="admin-input text-xs w-full py-2.5 px-3" placeholder="เช่น ร้านแม่มาลัย, Swensen's..." value={editingProduct.brand || ''} onChange={e => setEditingProduct({ ...editingProduct, brand: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1.5" style={{ color: '#5a6e90' }}>แท็กส่วนผสม / คำอธิบายสั้น</label>
                      <input className="admin-input text-xs w-full py-2.5 px-3" placeholder="เช่น ไก่ทอด, vegan, ไม่มีผงชูรส..." value={editingProduct.winery || ''} onChange={e => setEditingProduct({ ...editingProduct, winery: e.target.value })} />
                    </div>
                  </>
                )}

                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: '#5a6e90' }}>คำอธิบาย</label>
                  <textarea className="admin-input text-xs w-full py-2.5 px-3" rows={3} placeholder="รายละเอียดสินค้า..." value={editingProduct.description || ''} onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })} style={{ resize: 'vertical' }} />
                </div>

                <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <label style={{ color: '#5a6e90', fontSize: 13, fontWeight: 700 }}>สถานะ:</label>
                  <button
                    onClick={() => setEditingProduct({ ...editingProduct, is_active: !editingProduct.is_active })}
                    className={`cursor-pointer ${editingProduct.is_active ? 'badge-delivered' : 'badge-rejected'}`}
                    style={{ padding: '6px 16px', borderRadius: 100, fontSize: 12, fontWeight: 700 }}>
                    {editingProduct.is_active ? '✓ ขายอยู่' : '✕ หยุดขาย'}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => { setEditingProduct(null); setPreviewUrl(null) }}
                  className="admin-btn-secondary flex-1 py-3 text-xs font-bold cursor-pointer">
                  ยกเลิก
                </button>
                <button onClick={handleSave} disabled={saving || uploading || !editingProduct.name}
                  className="admin-btn-primary flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                  style={isFoodMode ? {
                    background: 'linear-gradient(135deg, rgba(245,158,11,0.25), rgba(234,88,12,0.20))',
                    borderColor: 'rgba(245,158,11,0.45)',
                    color: '#fbbf24',
                    boxShadow: '0 4px 16px rgba(245,158,11,0.20)'
                  } : undefined}>
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDiscountModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}>
          <div className="admin-panel w-full" style={{ maxWidth: '520px', padding: 0 }}>
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 900, color: '#eef2ff', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                <Tag size={20} style={{ color: '#22e5ff' }} />
                ตั้งค่าปุ่มส่วนลดสินค้าสำหรับเครื่อง POS
              </h2>
              <button onClick={() => setShowDiscountModal(false)} className="cursor-pointer" style={{ background: 'none', border: 'none' }}>
                <X size={20} style={{ color: 'var(--admin-text-muted, #94a3b8)' }} />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-xs mb-4" style={{ color: '#5a6e90', lineHeight: 1.5 }}>
                เลือกเปิดใช้งานเปอร์เซ็นต์ส่วนลดมาตรฐาน หรือเพิ่มส่วนลดใหม่ เพื่อให้พนักงานหน้าร้านกดเลือกใช้งานได้ทันที
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
                {[10, 20, 30, 40, 50, 60, 70, 80, 90].map(pct => {
                  const isChecked = allowedDiscounts.includes(pct)
                  return (
                    <button
                      key={pct}
                      onClick={() => {
                        const updated = isChecked
                          ? allowedDiscounts.filter(x => x !== pct)
                          : [...allowedDiscounts, pct]
                        handleSaveDiscounts(updated)
                      }}
                      className="cursor-pointer"
                      style={{
                        padding: '12px 0',
                        borderRadius: 12,
                        fontSize: 13,
                        fontWeight: 700,
                        border: '1px solid',
                        background: isChecked ? 'rgba(0,212,255,0.14)' : 'rgba(255,255,255,0.03)',
                        borderColor: isChecked ? 'rgba(0,212,255,0.35)' : 'rgba(255,255,255,0.07)',
                        color: isChecked ? '#22e5ff' : '#5a6e90',
                        boxShadow: isChecked ? '0 2px 12px rgba(0,212,255,0.12)' : 'none',
                        transition: 'all 0.15s',
                      }}
                    >
                      ลด {pct}%
                    </button>
                  )
                })}
              </div>

              <div className="border-t pt-4 mb-4" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <label className="block text-xs font-bold mb-2" style={{ color: '#5a6e90' }}>
                  ส่วนลดแบบกำหนดเองที่มีอยู่:
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {allowedDiscounts.filter(pct => ![10,20,30,40,50,60,70,80,90].includes(pct)).map(pct => (
                    <span
                      key={pct}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
                      style={{ background: 'rgba(0,212,255,0.08)', color: '#22e5ff', border: '1px solid rgba(0,212,255,0.22)' }}
                    >
                      ลด {pct}%
                      <button
                        onClick={() => {
                          const updated = allowedDiscounts.filter(x => x !== pct)
                          handleSaveDiscounts(updated)
                        }}
                        style={{ color: '#fb7185', fontWeight: 'bold', cursor: 'pointer', padding: '0 2px', background: 'none', border: 'none' }}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                  {allowedDiscounts.filter(pct => ![10,20,30,40,50,60,70,80,90].includes(pct)).length === 0 && (
                    <span className="text-xs italic" style={{ color: 'var(--admin-text-muted, #94a3b8)' }}>ไม่มี</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    placeholder="ระบุเปอร์เซ็นต์ (เช่น 15, 25)"
                    className="admin-input text-xs pl-3 flex-1"
                    style={{ height: 38 }}
                    value={customDiscountInput}
                    onChange={e => setCustomDiscountInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        const val = parseInt(customDiscountInput)
                        if (val > 0 && val <= 100 && !allowedDiscounts.includes(val)) {
                          handleSaveDiscounts([...allowedDiscounts, val])
                          setCustomDiscountInput('')
                        }
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const val = parseInt(customDiscountInput)
                      if (val > 0 && val <= 100 && !allowedDiscounts.includes(val)) {
                        handleSaveDiscounts([...allowedDiscounts, val])
                        setCustomDiscountInput('')
                      } else {
                        alert('กรุณากรอกตัวเลขระหว่าง 1 ถึง 100 และไม่เป็นค่าซ้ำ')
                      }
                    }}
                    className="admin-btn-primary text-xs px-4 cursor-pointer"
                    style={{ height: 38 }}
                  >
                    เพิ่มปุ่ม
                  </button>
                </div>
              </div>

              {saveSuccess && (
                <p className="text-xs text-center text-emerald-400 font-bold mb-2">✓ บันทึกสำเร็จ</p>
              )}

              <button
                onClick={() => setShowDiscountModal(false)}
                className="w-full admin-btn-secondary py-3 text-xs font-bold cursor-pointer"
              >
                {savingDiscounts ? <Loader2 size={16} className="animate-spin" /> : 'ปิดการตั้งค่า'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
