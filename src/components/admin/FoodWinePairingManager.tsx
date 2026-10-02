'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Product, Category, FoodWinePairing } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import {
  Wine, Plus, Edit3, Trash2, CheckCircle2, AlertCircle,
  Sparkles, Tag, Percent, X, Loader2, Search, ArrowRight, Check
} from 'lucide-react'

export default function FoodWinePairingManager({ onPairingsChange }: { onPairingsChange?: (pairings: FoodWinePairing[]) => void } = {}) {
  const supabase = createClient()

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [pairings, setPairings] = useState<FoodWinePairing[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  // Modal State
  const [showPairingModal, setShowPairingModal] = useState(false)
  const [editingPairing, setEditingPairing] = useState<FoodWinePairing | null>(null)
  const [pairingTitle, setPairingTitle] = useState('')
  const [pairingDescription, setPairingDescription] = useState('')
  const [pairingFoodId, setPairingFoodId] = useState('')
  const [pairingWineId, setPairingWineId] = useState('')
  const [pairingDiscountType, setPairingDiscountType] = useState<'percent' | 'fixed'>('percent')
  const [pairingDiscountValue, setPairingDiscountValue] = useState<number>(15)
  const [pairingIsActive, setPairingIsActive] = useState(true)
  const [savingPairing, setSavingPairing] = useState(false)

  // Load products, categories & pairings
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [{ data: cats }, { data: prods }, { data: pairingSetting }] = await Promise.all([
        supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('products').select('*, categories(*)').eq('is_active', true).order('name'),
        supabase.from('settings').select('value').eq('key', 'food_wine_pairings').single()
      ])

      setCategories(cats || [])
      setProducts(prods || [])

      if (pairingSetting?.value) {
        try {
          const parsed = JSON.parse(pairingSetting.value)
          if (Array.isArray(parsed)) {
            setPairings(parsed)
            onPairingsChange?.(parsed)
          }
        } catch (e) {
          console.error('Failed to parse pairings:', e)
        }
      }
    } catch (err: any) {
      console.error('Error loading pairing data:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Food / Wine Classification Helpers
  const isWineOrDrink = (p: Product) => {
    const cat = (p.categories?.name || '').toLowerCase()
    const name = p.name.toLowerCase()
    return ['wine', 'beer', 'drink', 'beverage', 'bar', 'ไวน์', 'เบียร์', 'เครื่องดื่ม', 'rosé', 'sparkling', 'champagne', 'cocktail'].some(k => cat.includes(k) || name.includes(k)) || !!p.grape || !!p.winery
  }
  const isFoodItem = (p: Product) => !isWineOrDrink(p)

  // Save Pairings List to Supabase
  const handleSavePairingsList = async (updatedList: FoodWinePairing[]) => {
    setSavingPairing(true)
    try {
      // 1. บันทึกผ่าน /api/admin/settings (ใช้ Service Role Key เพื่อแก้ปัญหา RLS)
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'food_wine_pairings',
          value: JSON.stringify(updatedList),
        }),
      })

      if (res.ok) {
        setPairings(updatedList)
        onPairingsChange?.(updatedList)
        return
      }

      // 2. Fallback: ถ้า API ไม่ตอบสนอง ลอง update ตรงที่แถวเดิม (มักไม่ติด RLS สำหรับ update)
      const { error: updateError } = await supabase
        .from('settings')
        .update({ value: JSON.stringify(updatedList) })
        .eq('key', 'food_wine_pairings')

      if (!updateError) {
        setPairings(updatedList)
        onPairingsChange?.(updatedList)
        return
      }

      // 3. Fallback: ลอง upsert ตรงผ่าน client
      const { error } = await supabase
        .from('settings')
        .upsert({ key: 'food_wine_pairings', value: JSON.stringify(updatedList) }, { onConflict: 'key' })
      if (error) throw error
      setPairings(updatedList)
      onPairingsChange?.(updatedList)
    } catch (err: any) {
      alert('บันทึกการจับคู่ไม่สำเร็จ: ' + err.message)
    } finally {
      setSavingPairing(false)
    }
  }

  // Quick Toggle Active/Approved Status
  const handleTogglePairing = async (id: string) => {
    const updated = pairings.map(p => p.id === id ? { ...p, is_active: !p.is_active } : p)
    await handleSavePairingsList(updated)
  }

  // Delete Pairing
  const handleDeletePairing = async (id: string) => {
    if (confirm('ยืนยันลบรายการจับคู่นี้หรือไม่?')) {
      const updated = pairings.filter(p => p.id !== id)
      await handleSavePairingsList(updated)
    }
  }

  // Open Create Modal
  const handleOpenAddPairingModal = () => {
    setEditingPairing(null)
    setPairingTitle('')
    setPairingDescription('')
    const foodList = products.filter(isFoodItem)
    const wineList = products.filter(isWineOrDrink)
    setPairingFoodId(foodList[0]?.id || products[0]?.id || '')
    setPairingWineId(wineList[0]?.id || products[1]?.id || '')
    setPairingDiscountType('percent')
    setPairingDiscountValue(15)
    setPairingIsActive(true)
    setShowPairingModal(true)
  }

  // Open Edit Modal
  const handleOpenEditPairingModal = (p: FoodWinePairing) => {
    setEditingPairing(p)
    setPairingTitle(p.title)
    setPairingDescription(p.description || '')
    setPairingFoodId(p.food_product_id)
    setPairingWineId(p.wine_product_id)
    setPairingDiscountType(p.discount_type)
    setPairingDiscountValue(p.discount_value)
    setPairingIsActive(p.is_active)
    setShowPairingModal(true)
  }

  // Submit Modal Form
  const handleSubmitPairingForm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pairingFoodId || !pairingWineId) {
      alert('กรุณาเลือกทั้งอาหารและไวน์')
      return
    }
    const food = products.find(p => p.id === pairingFoodId)
    const wine = products.find(p => p.id === pairingWineId)
    const title = pairingTitle.trim() || `${food?.name || 'อาหาร'} + ${wine?.name || 'ไวน์'}`

    let updatedList: FoodWinePairing[]
    if (editingPairing) {
      updatedList = pairings.map(p => p.id === editingPairing.id ? {
        ...p,
        title,
        description: pairingDescription.trim(),
        food_product_id: pairingFoodId,
        wine_product_id: pairingWineId,
        discount_type: pairingDiscountType,
        discount_value: Number(pairingDiscountValue) || 0,
        is_active: pairingIsActive,
      } : p)
    } else {
      const newP: FoodWinePairing = {
        id: 'PAIR-' + Date.now(),
        title,
        description: pairingDescription.trim(),
        food_product_id: pairingFoodId,
        wine_product_id: pairingWineId,
        discount_type: pairingDiscountType,
        discount_value: Number(pairingDiscountValue) || 0,
        is_active: pairingIsActive,
        created_at: new Date().toISOString()
      }
      updatedList = [newP, ...pairings]
    }

    await handleSavePairingsList(updatedList)
    setShowPairingModal(false)
    setEditingPairing(null)
  }

  // Filtered list
  const filteredPairings = pairings.filter(p => {
    const matchStatus = statusFilter === 'all'
      ? true
      : statusFilter === 'active'
        ? p.is_active
        : !p.is_active
    const q = searchQuery.toLowerCase()
    const food = products.find(prod => prod.id === p.food_product_id)
    const wine = products.find(prod => prod.id === p.wine_product_id)
    const matchSearch = !q ||
      p.title.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      (food && food.name.toLowerCase().includes(q)) ||
      (wine && wine.name.toLowerCase().includes(q))
    return matchStatus && matchSearch
  })

  const activeCount = pairings.filter(p => p.is_active).length
  const inactiveCount = pairings.filter(p => !p.is_active).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header & Action Bar */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center',
        justifyContent: 'flex-end', gap: 16
      }}>

        <button
          onClick={handleOpenAddPairingModal}
          className="w-full sm:w-auto justify-center transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 active:scale-[0.98]"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '12px 22px', borderRadius: 14,
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)',
            fontSize: 14, fontWeight: 800, cursor: 'pointer',
            boxShadow: '0 4px 18px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.25)',
          }}
        >
          <Plus size={17} />
          สร้างชุดจับคู่ใหม่
        </button>
      </div>

      {/* KPI Cards: สรุปยอดชุดจับคู่ทั้งหมด, จำนวนที่อนุมัติแล้ว/เปิดขาย, และจำนวนที่ปิดใช้งาน */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16
      }}>
        {/* Total */}
        <div style={{
          background: 'var(--admin-surface)',
          border: '1px solid var(--admin-border)',
          borderRadius: 16, padding: '18px 20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--admin-text-sec)', fontWeight: 600 }}>ชุดจับคู่ทั้งหมด</span>
            <Sparkles size={18} style={{ color: '#818cf8' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
            <span style={{ fontSize: 28, fontWeight: 900, color: 'var(--admin-text)' }}>
              {pairings.length}
            </span>
            <span style={{ fontSize: 12, color: 'var(--admin-text-muted)', fontWeight: 600 }}>รายการ</span>
          </div>
        </div>

        {/* Approved & Active */}
        <div style={{
          background: 'var(--admin-surface)',
          border: '1px solid rgba(16,185,129,0.25)',
          borderLeft: '4px solid #10b981',
          borderRadius: 16, padding: '18px 20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#34d399', fontWeight: 700 }}>อนุมัติแล้ว / เปิดขายหน้าร้าน</span>
            <CheckCircle2 size={18} style={{ color: '#10b981' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
            <span style={{ fontSize: 28, fontWeight: 900, color: '#34d399' }}>
              {activeCount}
            </span>
            <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>พร้อมขาย</span>
          </div>
        </div>

        {/* Suspended / Inactive */}
        <div style={{
          background: 'var(--admin-surface)',
          border: '1px solid rgba(244,63,94,0.2)',
          borderLeft: '4px solid #f43f5e',
          borderRadius: 16, padding: '18px 20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#fb7185', fontWeight: 700 }}>ปิดใช้งาน / ระงับ</span>
            <AlertCircle size={18} style={{ color: '#f43f5e' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
            <span style={{ fontSize: 28, fontWeight: 900, color: '#fb7185' }}>
              {inactiveCount}
            </span>
            <span style={{ fontSize: 12, color: 'var(--admin-text-muted)', fontWeight: 600 }}>ปิดขาย</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between" style={{
        background: 'var(--admin-surface)', border: '1px solid var(--admin-border)',
        borderRadius: 14, padding: '12px 16px'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 400 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)' }} />
          <input
            type="text"
            placeholder="ค้นหาชื่อชุดจับคู่ หรือสินค้า..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '9px 12px 9px 36px',
              borderRadius: 10, border: '1px solid var(--admin-border)',
              background: 'var(--admin-surface-2)', color: 'var(--admin-text)',
              fontSize: 13, outline: 'none'
            }}
          />
        </div>

        {/* Status Filter: 3 columns on mobile, flex on desktop */}
        <div className="grid grid-cols-3 sm:flex gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className="transition-all duration-150 hover:brightness-110 active:scale-95 text-center"
            style={{
              padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700,
              cursor: 'pointer', border: 'none',
              background: statusFilter === 'all' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'var(--admin-surface-2)',
              color: statusFilter === 'all' ? '#ffffff' : 'var(--admin-text-sec)',
              boxShadow: statusFilter === 'all' ? '0 2px 10px rgba(99,102,241,0.3)' : 'none',
            }}
          >
            ทั้งหมด ({pairings.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className="transition-all duration-150 hover:brightness-110 active:scale-95 text-center"
            style={{
              padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700,
              cursor: 'pointer', border: 'none',
              background: statusFilter === 'active' ? 'linear-gradient(135deg, #10b981, #059669)' : 'var(--admin-surface-2)',
              color: statusFilter === 'active' ? '#ffffff' : 'var(--admin-text-sec)',
              boxShadow: statusFilter === 'active' ? '0 2px 10px rgba(16,185,129,0.3)' : 'none',
            }}
          >
            อนุมัติ ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('inactive')}
            className="transition-all duration-150 hover:brightness-110 active:scale-95 text-center"
            style={{
              padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700,
              cursor: 'pointer', border: 'none',
              background: statusFilter === 'inactive' ? 'linear-gradient(135deg, #f43f5e, #e11d48)' : 'var(--admin-surface-2)',
              color: statusFilter === 'inactive' ? '#ffffff' : 'var(--admin-text-sec)',
              boxShadow: statusFilter === 'inactive' ? '0 2px 10px rgba(244,63,94,0.3)' : 'none',
            }}
          >
            ระงับ ({inactiveCount})
          </button>
        </div>
      </div>

      {/* Pairing Cards Grid: แสดงการ์ดแสดงอาหารคู่ไวน์ รูปภาพ ราคา ส่วนลด และสถานะอนุมัติ */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <Loader2 size={32} className="animate-spin" style={{ color: '#6366f1' }} />
        </div>
      ) : filteredPairings.length === 0 ? (
        <div style={{
          background: 'var(--admin-surface)', border: '1px dashed var(--admin-border)',
          borderRadius: 18, padding: 60, textAlign: 'center'
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'rgba(244,63,94,0.1)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
          }}>
            <Wine size={32} style={{ color: '#f43f5e' }} />
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--admin-text)', marginBottom: 6 }}>
            {pairings.length === 0 ? 'ยังไม่มีรายการจับคู่อาหารและไวน์' : 'ไม่พบรายการจับคู่ที่ตรงตามเงื่อนไข'}
          </h3>
          <p style={{ fontSize: 13, color: 'var(--admin-text-muted)', maxWidth: 420, margin: '0 auto 20px' }}>
            {pairings.length === 0
              ? 'สร้างชุดจับคู่เพื่อแนะนำลูกค้าหน้าร้าน POS และมอบส่วนลดพิเศษเมื่อสั่งทั้งอาหารและไวน์คู่กัน'
              : 'ลองเปลี่ยนคำค้นหาหรือตัวกรองสถานะ'}
          </p>
          {pairings.length === 0 && (
            <button
              onClick={handleOpenAddPairingModal}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', borderRadius: 12,
                background: '#6366f1', color: '#ffffff', border: 'none',
                fontSize: 14, fontWeight: 700, cursor: 'pointer'
              }}
            >
              <Plus size={16} /> สร้างการจับคู่แรก
            </button>
          )}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 460px), 1fr))',
          gap: 18
        }}>
          {filteredPairings.map(pairing => {
            const food = products.find(p => p.id === pairing.food_product_id)
            const wine = products.find(p => p.id === pairing.wine_product_id)
            const foodPrice = food?.price || 0
            const winePrice = wine?.price || 0
            const combined = foodPrice + winePrice
            const discount = pairing.discount_type === 'percent'
              ? Math.round(combined * (pairing.discount_value / 100))
              : Math.min(pairing.discount_value, combined)
            const finalPrice = Math.max(0, combined - discount)

            return (
              <div
                key={pairing.id}
                style={{
                  background: 'var(--admin-surface)',
                  border: `1px solid ${pairing.is_active ? 'rgba(16,185,129,0.3)' : 'var(--admin-border)'}`,
                  borderLeft: `5px solid ${pairing.is_active ? '#10b981' : '#64748b'}`,
                  borderRadius: 16,
                  overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
                  display: 'flex', flexDirection: 'column',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Card Top Header */}
                <div style={{
                  padding: '14px 18px',
                  background: 'var(--admin-surface-2)',
                  borderBottom: '1px solid var(--admin-border)',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', gap: 12
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '3px 8px', borderRadius: 99,
                        fontSize: 11, fontWeight: 800,
                        background: pairing.is_active ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.2)',
                        color: pairing.is_active ? '#34d399' : '#94a3b8'
                      }}>
                        {pairing.is_active ? '🟢 อนุมัติแล้ว (ขายหน้าร้าน)' : '⚪ ปิดใช้งาน (ยังไม่อนุมัติ)'}
                      </span>
                    </div>
                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--admin-text)' }} className="truncate">
                      {pairing.title}
                    </h4>
                    {pairing.description && (
                      <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--admin-text-sec)' }} className="truncate">
                        {pairing.description}
                      </p>
                    )}
                  </div>

                  {/* Quick Toggle: ปุ่มกดสลับสถานะ "อนุมัติ / ระงับ" ทันที */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={() => handleTogglePairing(pairing.id)}
                      disabled={savingPairing}
                      title={pairing.is_active ? 'กดเพื่อระงับการขาย' : 'กดเพื่ออนุมัติและเปิดขาย'}
                      style={{
                        padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 800,
                        cursor: 'pointer', transition: 'all 0.15s',
                        border: pairing.is_active ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(100,116,139,0.3)',
                        background: pairing.is_active ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.15)',
                        color: pairing.is_active ? '#34d399' : '#94a3b8'
                      }}
                    >
                      {pairing.is_active ? 'ระงับ' : 'อนุมัติ'}
                    </button>
                    <button
                      onClick={() => handleOpenEditPairingModal(pairing)}
                      title="แก้ไข"
                      style={{
                        padding: '6px 9px', borderRadius: 8, fontSize: 11,
                        background: 'var(--admin-surface-3)', border: '1px solid var(--admin-border)',
                        color: 'var(--admin-text-sec)', cursor: 'pointer'
                      }}
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      onClick={() => handleDeletePairing(pairing.id)}
                      title="ลบชุดนี้"
                      style={{
                        padding: '6px 9px', borderRadius: 8, fontSize: 11,
                        background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)',
                        color: '#f43f5e', cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Visual Pairing Products: อาหารคู่ไวน์ 2 รายการ */}
                <div style={{
                  padding: '16px 18px',
                  display: 'grid',
                  gridTemplateColumns: '1fr auto 1fr',
                  alignItems: 'center', gap: 14,
                  flex: 1
                }}>
                  {/* Food Item */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      width: 76, height: 76, borderRadius: 14, overflow: 'hidden',
                      margin: '0 auto 8px', background: 'var(--admin-surface-2)',
                      border: '1px solid var(--admin-border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {food?.image_url ? (
                        <img src={food.image_url} alt={food.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: 32 }}>🍽️</span>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: 'var(--admin-text)' }} className="line-clamp-1">
                      {food?.name || 'ไม่พบสินค้าอาหาร'}
                    </p>
                    <span style={{ fontSize: 12, color: 'var(--admin-text-muted)', fontWeight: 600 }}>
                      {formatCurrency(foodPrice)}
                    </span>
                  </div>

                  {/* Plus Icon */}
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                    color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 900, fontSize: 16
                  }}>
                    +
                  </div>

                  {/* Wine Item */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      width: 76, height: 76, borderRadius: 14, overflow: 'hidden',
                      margin: '0 auto 8px', background: 'var(--admin-surface-2)',
                      border: '1px solid var(--admin-border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {wine?.image_url ? (
                        <img src={wine.image_url} alt={wine.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: 32 }}>🍷</span>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: 'var(--admin-text)' }} className="line-clamp-1">
                      {wine?.name || 'ไม่พบสินค้าไวน์'}
                    </p>
                    <span style={{ fontSize: 12, color: 'var(--admin-text-muted)', fontWeight: 600 }}>
                      {formatCurrency(winePrice)}
                    </span>
                  </div>
                </div>

                {/* Price & Discount Bar (ป้ายส่วนลดด้านข้าง / แถบสรุปราคา) */}
                <div style={{
                  padding: '12px 18px',
                  background: 'var(--admin-surface-raised)',
                  borderTop: '1px solid var(--admin-border)',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', gap: 12
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: 8,
                      fontSize: 12, fontWeight: 800,
                      background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)',
                      color: '#fb7185'
                    }}>
                      🏷️ ลด {pairing.discount_type === 'percent' ? `${pairing.discount_value}%` : formatCurrency(pairing.discount_value)}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--admin-text-muted)', textDecoration: 'line-through', fontWeight: 600 }}>
                      {formatCurrency(combined)}
                    </span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 11, color: 'var(--admin-text-sec)', display: 'block' }}>ราคาเซ็ตคู่</span>
                    <span style={{ fontSize: 17, fontWeight: 900, color: '#f43f5e' }}>
                      {formatCurrency(finalPrice)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal สร้าง/แก้ไขชุดจับคู่ */}
      {showPairingModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16
        }}>
          {/* Backdrop */}
          <div
            onClick={() => setShowPairingModal(false)}
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(8,10,15,0.75)', backdropFilter: 'blur(8px)'
            }}
          />

          {/* Dialog */}
          <div style={{
            position: 'relative', width: '100%', maxWidth: 540,
            background: 'var(--admin-surface)',
            borderRadius: 20, border: '1px solid var(--admin-border-strong)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '16px 22px',
              background: 'linear-gradient(135deg, #1c2232 0%, #252d44 100%)',
              borderBottom: '1px solid var(--admin-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Wine size={20} style={{ color: '#f43f5e' }} />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--admin-text)' }}>
                  {editingPairing ? 'แก้ไขชุดจับคู่อาหาร & ไวน์' : 'สร้างและอนุมัติชุดจับคู่ใหม่'}
                </h3>
              </div>
              <button
                onClick={() => setShowPairingModal(false)}
                style={{
                  background: 'none', border: 'none',
                  color: 'var(--admin-text-muted)', cursor: 'pointer', padding: 4
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form
              onSubmit={handleSubmitPairingForm}
              style={{
                padding: 22, display: 'flex', flexDirection: 'column', gap: 16,
                maxHeight: '80vh', overflowY: 'auto'
              }}
            >
              {/* 1. ตัวเลือกรายการอาหาร (กรองเฉพาะหมวดอาหาร) */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--admin-text-sec)', marginBottom: 6 }}>
                  🍽️ เลือกรายการอาหาร (Food Item) *
                </label>
                <select
                  value={pairingFoodId}
                  onChange={e => setPairingFoodId(e.target.value)}
                  required
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10,
                    border: '1px solid var(--admin-border)',
                    background: 'var(--admin-surface-2)', color: 'var(--admin-text)',
                    fontSize: 13, outline: 'none'
                  }}
                >
                  <option value="">-- เลือกรายการอาหาร --</option>
                  {products.filter(isFoodItem).map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formatCurrency(p.price)})
                    </option>
                  ))}
                  {products.filter(isFoodItem).length === 0 && products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({formatCurrency(p.price)})</option>
                  ))}
                </select>
              </div>

              {/* 2. ตัวเลือกรายการไวน์/เครื่องดื่ม (กรองเฉพาะหมวดไวน์/เครื่องดื่ม) */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--admin-text-sec)', marginBottom: 6 }}>
                  🍷 เลือกรายการไวน์ / เครื่องดื่ม (Wine Item) *
                </label>
                <select
                  value={pairingWineId}
                  onChange={e => setPairingWineId(e.target.value)}
                  required
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10,
                    border: '1px solid var(--admin-border)',
                    background: 'var(--admin-surface-2)', color: 'var(--admin-text)',
                    fontSize: 13, outline: 'none'
                  }}
                >
                  <option value="">-- เลือกรายการไวน์ / เครื่องดื่ม --</option>
                  {products.filter(isWineOrDrink).map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.vintage ? `(${p.vintage})` : ''} — {formatCurrency(p.price)}
                    </option>
                  ))}
                  {products.filter(isWineOrDrink).length === 0 && products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({formatCurrency(p.price)})</option>
                  ))}
                </select>
              </div>

              {/* 3. กำหนดชื่อโปรโมชั่น */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--admin-text-sec)', marginBottom: 6 }}>
                  ชื่อโปรโมชั่นชุดจับคู่ (เว้นว่างเพื่อใช้ชื่อสินค้าอัตโนมัติ)
                </label>
                <input
                  type="text"
                  placeholder="เช่น Wagyu Ribeye Steak x Cabernet Sauvignon"
                  value={pairingTitle}
                  onChange={e => setPairingTitle(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10,
                    border: '1px solid var(--admin-border)',
                    background: 'var(--admin-surface-2)', color: 'var(--admin-text)',
                    fontSize: 13, outline: 'none'
                  }}
                />
              </div>

              {/* 4. คำอธิบายรสชาติ / คำแนะนำ */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--admin-text-sec)', marginBottom: 6 }}>
                  คำอธิบายรสชาติ / คำแนะนำ (Optional)
                </label>
                <input
                  type="text"
                  placeholder="เช่น รสสัมผัสเนื้อย่างเข้มข้นเข้ากันได้ดีกับไวน์ฟูลบอดี้"
                  value={pairingDescription}
                  onChange={e => setPairingDescription(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10,
                    border: '1px solid var(--admin-border)',
                    background: 'var(--admin-surface-2)', color: 'var(--admin-text)',
                    fontSize: 13, outline: 'none'
                  }}
                />
              </div>

              {/* 5. ตัวเลือกส่วนลด (% หรือ บาท) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--admin-text-sec)', marginBottom: 6 }}>
                    รูปแบบส่วนลด *
                  </label>
                  <select
                    value={pairingDiscountType}
                    onChange={e => setPairingDiscountType(e.target.value as any)}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 10,
                      border: '1px solid var(--admin-border)',
                      background: 'var(--admin-surface-2)', color: 'var(--admin-text)',
                      fontSize: 13, outline: 'none'
                    }}
                  >
                    <option value="percent">เปอร์เซ็นต์ (%)</option>
                    <option value="fixed">จำนวนเงิน (บาท)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--admin-text-sec)', marginBottom: 6 }}>
                    มูลค่าส่วนลด *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      min="1"
                      required
                      value={pairingDiscountValue}
                      onChange={e => setPairingDiscountValue(Number(e.target.value))}
                      style={{
                        width: '100%', padding: '10px 32px 10px 14px', borderRadius: 10,
                        border: '1px solid var(--admin-border)',
                        background: 'var(--admin-surface-2)', color: 'var(--admin-text)',
                        fontSize: 13, outline: 'none'
                      }}
                    />
                    <span style={{
                      position: 'absolute', right: 12, top: '50%',
                      transform: 'translateY(-50%)', fontSize: 12,
                      color: 'var(--admin-text-muted)', fontWeight: 800
                    }}>
                      {pairingDiscountType === 'percent' ? '%' : '฿'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 6. Live calculation preview: คำนวณราคาแบบเรียลไทม์ */}
              {(() => {
                const food = products.find(p => p.id === pairingFoodId)
                const wine = products.find(p => p.id === pairingWineId)
                const fPrice = food?.price || 0
                const wPrice = wine?.price || 0
                const sum = fPrice + wPrice
                const disc = pairingDiscountType === 'percent'
                  ? Math.round(sum * (pairingDiscountValue / 100))
                  : Math.min(pairingDiscountValue, sum)
                const totalPay = Math.max(0, sum - disc)
                return (
                  <div style={{
                    padding: '14px 16px',
                    background: 'var(--admin-surface-2)',
                    borderRadius: 12, border: '1px dashed var(--admin-border-strong)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--admin-text-sec)', marginBottom: 6 }}>
                      <span>รวมราคาปกติ:</span>
                      <span>{formatCurrency(fPrice)} + {formatCurrency(wPrice)} = <strong style={{ color: 'var(--admin-text)' }}>{formatCurrency(sum)}</strong></span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#fb7185', marginBottom: 8 }}>
                      <span>ส่วนลดพิเศษ:</span>
                      <span style={{ fontWeight: 700 }}>
                        -{formatCurrency(disc)} ({pairingDiscountType === 'percent' ? `${pairingDiscountValue}%` : 'บาท'})
                      </span>
                    </div>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      fontSize: 15, fontWeight: 900,
                      color: 'var(--admin-text)', paddingTop: 8,
                      borderTop: '1px solid var(--admin-border)'
                    }}>
                      <span>ราคาขายสุทธิเซ็ตคู่:</span>
                      <span style={{ color: '#f43f5e' }}>{formatCurrency(totalPay)}</span>
                    </div>
                  </div>
                )
              })()}

              {/* 7. เช็กบ็อกซ์ "อนุมัติและเปิดขายหน้าร้าน POS ทันที" */}
              <label style={{
                display: 'flex', alignItems: 'center', gap: 10,
                cursor: 'pointer', padding: '6px 0'
              }}>
                <input
                  type="checkbox"
                  checked={pairingIsActive}
                  onChange={e => setPairingIsActive(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: '#10b981' }}
                />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-text)' }}>
                  อนุมัติและเปิดขายหน้าร้าน POS ทันที (Active)
                </span>
              </label>

              {/* 8. ปุ่มบันทึก / ยกเลิก */}
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowPairingModal(false)}
                  style={{
                    flex: 1, padding: '12px', borderRadius: 10,
                    border: '1px solid var(--admin-border)',
                    background: 'var(--admin-surface-2)', color: 'var(--admin-text-sec)',
                    fontWeight: 700, fontSize: 13, cursor: 'pointer'
                  }}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={savingPairing}
                  style={{
                    flex: 2, padding: '12px', borderRadius: 10,
                    border: 'none',
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    color: '#ffffff', fontWeight: 800, fontSize: 13,
                    cursor: savingPairing ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                  }}
                >
                  {savingPairing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      กำลังบันทึก...
                    </>
                  ) : editingPairing ? (
                    'บันทึกการแก้ไข'
                  ) : (
                    'อนุมัติและบันทึกชุดจับคู่'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
