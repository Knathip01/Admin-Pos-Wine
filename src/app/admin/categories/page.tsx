'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Category } from '@/lib/types'
import {
  Archive,
  Check,
  Edit3,
  FolderPlus,
  Loader2,
  Package,
  Save,
  UtensilsCrossed,
  Wine,
  X,
  Sparkles,
} from 'lucide-react'

const EMPTY_CATEGORY: Partial<Category> = {
  name: '',
  description: '',
  icon: '',
  color: '#fb923c',
  sort_order: 0,
  is_active: true,
}

const SWATCHES = ['#fb923c', '#ea580c', '#16a39b', '#38bdf8', '#a78bfa', '#f2c65c', '#fb7185', '#be185d']

type CategorySummary = Category & { productCount: number }

const DRINK_KEYWORDS = ['wine', 'rosé', 'sparkling', 'champagne', 'ไวน์', 'beer', 'drink', 'beverage', 'bar', 'เบียร์', 'เครื่องดื่ม', 'cocktail', 'mocktail', 'juice', 'soda']

function classifyCategoryType(name?: string): 'food' | 'drink' {
  if (!name) return 'food'
  const n = name.toLowerCase()
  return DRINK_KEYWORDS.some(k => n.includes(k)) ? 'drink' : 'food'
}

const FOOD_PRESETS = [
  { name: 'อาหารจานหลัก', icon: '🍲', color: '#fb923c', desc: 'อาหารจานเดียว, สเต๊ก, เมนูหลัก' },
  { name: 'ของทานเล่น / กับแกล้ม', icon: '🍟', color: '#f2c65c', desc: 'ของทอด, ของทานเล่นคู่เครื่องดื่ม' },
  { name: 'สเต๊ก & ปิ้งย่าง', icon: '🥩', color: '#fb7185', desc: 'สเต๊กเนื้อ, หมู, ซี่โครงย่าง' },
  { name: 'สลัด & ยำ', icon: '🥗', color: '#16a39b', desc: 'สลัดผักสด, ยำรสเด็ด' },
  { name: 'ต้ม & แกง', icon: '🥘', color: '#ea580c', desc: 'ต้มยำ, แกงเผ็ด, ซุป' },
  { name: 'ของหวาน & เบเกอรี่', icon: '🍰', color: '#a78bfa', desc: 'ของหวาน, เค้ก, ไอศกรีม' },
]

const DRINK_PRESETS = [
  { name: 'Red Wine', icon: '🍷', color: '#be185d', desc: 'ไวน์แดงคุณภาพสูง' },
  { name: 'White Wine', icon: '🥂', color: '#f2c65c', desc: 'ไวน์ขาวรสเลิศ' },
  { name: 'Sparkling & Champagne', icon: '🍾', color: '#38bdf8', desc: 'สปาร์กลิ้งไวน์และแชมเปญ' },
  { name: 'Cocktails & Spirits', icon: '🍸', color: '#a78bfa', desc: 'ค็อกเทลและสุราพรีเมียม' },
  { name: 'Beer & Craft Beer', icon: '🍺', color: '#fb923c', desc: 'เบียร์สดและเบียร์คราฟต์' },
]

export default function CategoriesPage() {
  const supabase = useMemo(() => createClient(), [])
  const [categories, setCategories] = useState<CategorySummary[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState<Partial<Category> | null>(null)
  const [editorMode, setEditorMode] = useState<'food' | 'drink' | 'general'>('food')
  const [error, setError] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [typeFilter, setTypeFilter] = useState<'all' | 'food' | 'drink'>('all')

  const visibleCategories = useMemo(
    () => categories
      .filter(category => showInactive || category.is_active)
      .filter(category => {
        if (typeFilter === 'all') return true
        return classifyCategoryType(category.name) === typeFilter
      }),
    [categories, showInactive, typeFilter],
  )

  const foodCount = useMemo(() => categories.filter(c => classifyCategoryType(c.name) === 'food' && c.is_active).length, [categories])
  const drinkCount = useMemo(() => categories.filter(c => classifyCategoryType(c.name) === 'drink' && c.is_active).length, [categories])

  const loadCategories = useCallback(async () => {
    setLoading(true)
    const [{ data: categoryData }, { data: productData }] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order').order('name'),
      supabase.from('products').select('category_id'),
    ])

    const counts = new Map<string, number>()
    for (const product of productData || []) {
      if (product.category_id) counts.set(product.category_id, (counts.get(product.category_id) || 0) + 1)
    }

    setCategories(
      ((categoryData as Category[]) || []).map(category => ({
        ...category,
        productCount: counts.get(category.id) || 0,
      })),
    )
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    const timeout = window.setTimeout(() => { void loadCategories() }, 0)
    return () => window.clearTimeout(timeout)
  }, [loadCategories])

  const openEditor = (category?: CategorySummary, mode: 'food' | 'drink' | 'general' = 'food') => {
    setError('')
    setEditorMode(category ? classifyCategoryType(category.name) : mode)
    if (category) {
      setDraft({ ...category })
    } else {
      const defaultIcon = mode === 'food' ? '🍽️' : mode === 'drink' ? '🍷' : '🏷️'
      const defaultColor = mode === 'food' ? '#fb923c' : mode === 'drink' ? '#be185d' : '#16a39b'
      setDraft({
        ...EMPTY_CATEGORY,
        icon: defaultIcon,
        color: defaultColor,
        sort_order: categories.length + 1,
      })
    }
  }

  const closeEditor = () => {
    if (!saving) setDraft(null)
  }

  const applyPreset = (preset: typeof FOOD_PRESETS[0]) => {
    if (!draft) return
    setDraft({
      ...draft,
      name: preset.name,
      icon: preset.icon,
      color: preset.color,
      description: preset.desc,
    })
  }

  const saveCategory = async () => {
    if (!draft?.name?.trim()) {
      setError('กรุณาระบุชื่อหมวดหมู่')
      return
    }

    setSaving(true)
    setError('')
    const payload = {
      name: draft.name.trim(),
      description: draft.description?.trim() || null,
      icon: draft.icon?.trim() || null,
      color: draft.color || '#fb923c',
      sort_order: Number(draft.sort_order) || 0,
      is_active: draft.is_active ?? true,
    }

    const result = draft.id
      ? await supabase.from('categories').update(payload).eq('id', draft.id)
      : await supabase.from('categories').insert(payload)

    if (result.error) {
      setError(result.error.message)
      setSaving(false)
      return
    }

    setSaving(false)
    setDraft(null)
    loadCategories()
  }

  const archiveCategory = async (category: CategorySummary) => {
    const action = category.is_active ? 'ซ่อน' : 'เปิดใช้งาน'
    if (!window.confirm(`${action}หมวดหมู่ “${category.name}” ?`)) return

    await supabase.from('categories').update({ is_active: !category.is_active }).eq('id', category.id)
    loadCategories()
  }

  return (
    <div className="animate-in" style={{ padding: '28px', maxWidth: 1500 }}>
      {/* Header */}
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-bold tracking-[0.12em]" style={{ color: 'var(--wine-300)' }}>CATALOG MANAGEMENT</p>
          <h1 className="admin-page-heading text-2xl font-bold text-white">จัดการหมวดหมู่สินค้า (Admin Project POS)</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            {foodCount} หมวดหมู่อาหาร · {drinkCount} หมวดหมู่เครื่องดื่ม
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => openEditor(undefined, 'food')}
            className="btn-wine gap-2"
            style={{
              background: 'linear-gradient(135deg, #ea580c, #f97316)',
              boxShadow: '0 4px 16px rgba(249,115,22,0.35)',
            }}
          >
            <UtensilsCrossed size={16} />
            เพิ่มหมวดหมู่อาหาร 🍽️
          </button>
          <button
            type="button"
            onClick={() => openEditor(undefined, 'drink')}
            className="btn-wine gap-2"
          >
            <Wine size={16} />
            เพิ่มหมวดหมู่ Wine/เครื่องดื่ม
          </button>
        </div>
      </div>

      {/* Filter Tabs & Toolbar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b pb-4" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTypeFilter('all')}
            className="rounded-lg px-4 py-2 text-xs font-bold transition-all"
            style={{
              background: typeFilter === 'all' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${typeFilter === 'all' ? 'rgba(255,255,255,0.2)' : 'transparent'}`,
              color: typeFilter === 'all' ? '#ffffff' : 'var(--text-secondary)',
            }}
          >
            ✨ ทั้งหมด ({categories.filter(c => showInactive || c.is_active).length})
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('food')}
            className="rounded-lg px-4 py-2 text-xs font-bold transition-all"
            style={{
              background: typeFilter === 'food' ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${typeFilter === 'food' ? 'rgba(249,115,22,0.4)' : 'transparent'}`,
              color: typeFilter === 'food' ? '#fb923c' : 'var(--text-secondary)',
            }}
          >
            🍽️ อาหาร ({foodCount})
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('drink')}
            className="rounded-lg px-4 py-2 text-xs font-bold transition-all"
            style={{
              background: typeFilter === 'drink' ? 'rgba(190,24,93,0.15)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${typeFilter === 'drink' ? 'rgba(190,24,93,0.4)' : 'transparent'}`,
              color: typeFilter === 'drink' ? '#f472b6' : 'var(--text-secondary)',
            }}
          >
            🍷 เครื่องดื่ม & ไวน์ ({drinkCount})
          </button>
        </div>

        <button
          type="button"
          className="flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold"
          style={{ borderColor: 'var(--border-color)', background: '#111d2d', color: 'var(--text-secondary)' }}
          onClick={() => setShowInactive(value => !value)}
        >
          <Archive size={14} />
          {showInactive ? 'ซ่อนรายการที่ปิด' : 'แสดงรายการที่ปิด'}
        </button>
      </div>

      {/* Category Grid */}
      {loading ? (
        <div className="flex min-h-72 items-center justify-center">
          <Loader2 size={30} className="animate-spin" style={{ color: 'var(--wine-400)' }} />
        </div>
      ) : visibleCategories.length === 0 ? (
        <div className="glass-card flex min-h-72 flex-col items-center justify-center px-5 text-center">
          <FolderPlus size={38} style={{ color: 'var(--wine-400)' }} />
          <p className="mt-4 text-base font-semibold text-white">
            {typeFilter === 'food' ? 'ยังไม่มีหมวดหมู่อาหาร' : typeFilter === 'drink' ? 'ยังไม่มีหมวดหมู่เครื่องดื่ม' : 'ยังไม่มีหมวดหมู่สินค้า'}
          </p>
          <div className="mt-5 flex gap-3">
            <button type="button" onClick={() => openEditor(undefined, 'food')} className="btn-wine gap-2 text-sm" style={{ background: 'linear-gradient(135deg, #ea580c, #f97316)' }}>
              <UtensilsCrossed size={15} />
              สร้างหมวดหมู่อาหาร
            </button>
            <button type="button" onClick={() => openEditor(undefined, 'drink')} className="btn-wine gap-2 text-sm">
              <Wine size={15} />
              สร้างหมวดหมู่ Wine
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleCategories.map(category => {
            const catType = classifyCategoryType(category.name)
            const isFood = catType === 'food'
            return (
              <article key={category.id} className="glass-card card-hover flex min-h-48 flex-col p-5" style={{
                borderColor: isFood ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.08)'
              }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-xl"
                      style={{ background: `${category.color || (isFood ? '#fb923c' : '#be185d')}20`, color: category.color || (isFood ? '#fb923c' : '#be185d') }}
                    >
                      {category.icon || (isFood ? '🍽️' : '🍷')}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="truncate text-base font-bold text-white">{category.name}</h2>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>ลำดับ {category.sort_order}</span>
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-extrabold"
                          style={{
                            background: isFood ? 'rgba(249,115,22,0.12)' : 'rgba(190,24,93,0.12)',
                            color: isFood ? '#fb923c' : '#f472b6',
                            border: `1px solid ${isFood ? 'rgba(249,115,22,0.25)' : 'rgba(190,24,93,0.25)'}`
                          }}
                        >
                          {isFood ? '🍽️ อาหาร' : '🍷 เครื่องดื่ม'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span
                    className="badge shrink-0"
                    style={category.is_active
                      ? { borderColor: 'rgba(47,198,181,.25)', background: 'rgba(47,198,181,.12)', color: 'var(--wine-300)' }
                      : { borderColor: 'rgba(148,163,184,.25)', background: 'rgba(148,163,184,.1)', color: '#aebdd0' }}
                  >
                    {category.is_active ? 'ใช้งาน' : 'ปิด'}
                  </span>
                </div>

                <p className="mt-5 line-clamp-2 min-h-10 text-sm leading-5" style={{ color: 'var(--text-secondary)' }}>
                  {category.description || 'ยังไม่ได้ระบุรายละเอียด'}
                </p>

                <div className="mt-auto flex items-center justify-between border-t pt-4" style={{ borderColor: 'var(--border-color)' }}>
                  <span className="flex items-center gap-2 text-sm font-semibold text-white">
                    <Package size={15} style={{ color: isFood ? '#fb923c' : 'var(--wine-300)' }} />
                    {category.productCount} สินค้า
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                      title={`แก้ไข ${category.name}`}
                      onClick={() => openEditor(category)}
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      type="button"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                      title={category.is_active ? `ซ่อน ${category.name}` : `เปิด ${category.name}`}
                      onClick={() => archiveCategory(category)}
                    >
                      <Archive size={15} />
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* Editor Modal */}
      {draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(3, 8, 16, .82)', backdropFilter: 'blur(8px)' }}>
          <div className="glass-card w-full overflow-hidden" style={{ maxWidth: 600, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }} role="dialog" aria-modal="true">
            
            <div
              className="flex items-center justify-between border-b px-6 py-4"
              style={{
                borderColor: 'var(--border-color)',
                background: editorMode === 'food'
                  ? 'linear-gradient(135deg, rgba(234,88,12,0.12), rgba(249,115,22,0.04))'
                  : 'linear-gradient(135deg, rgba(139,26,44,0.12), rgba(190,24,93,0.04))'
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-xl"
                  style={{
                    background: editorMode === 'food' ? 'rgba(249,115,22,0.2)' : 'rgba(139,26,44,0.2)',
                    border: `1px solid ${editorMode === 'food' ? 'rgba(249,115,22,0.35)' : 'rgba(139,26,44,0.35)'}`
                  }}
                >
                  {editorMode === 'food' ? '🍽️' : '🍷'}
                </div>
                <div>
                  <h2 id="category-editor-title" className="text-lg font-bold text-white">
                    {draft.id
                      ? `แก้ไขหมวดหมู่ ${draft.name}`
                      : editorMode === 'food' ? 'เพิ่มหมวดหมู่อาหาร 🍽️' : 'เพิ่มหมวดหมู่ Wine & เครื่องดื่ม 🍷'}
                  </h2>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {editorMode === 'food' ? 'จัดหมวดหมู่อาหารสำหรับส่งคิวให้ห้องครัว (Kitchen)' : 'จัดหมวดหมู่เครื่องดื่มสำหรับบาร์และแคชเชียร์'}
                  </p>
                </div>
              </div>
              <button type="button" className="p-1 text-slate-400 hover:text-white" title="ปิด" onClick={closeEditor}>
                <X size={17} />
              </button>
            </div>

            <div className="space-y-5 overflow-y-auto p-6" style={{ flex: 1 }}>
              {error && (
                <div className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: 'rgba(251,113,133,.35)', background: 'rgba(251,113,133,.1)', color: '#fda4af' }}>
                  {error}
                </div>
              )}

              {!draft.id && (
                <div>
                  <div className="mb-2 flex items-center gap-2 text-xs font-bold" style={{ color: editorMode === 'food' ? '#fb923c' : 'var(--wine-300)' }}>
                    <Sparkles size={13} />
                    <span>คำแนะนำหมวดหมู่สำเร็จรูป (คลิกเพื่อเลือก)</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(editorMode === 'food' ? FOOD_PRESETS : DRINK_PRESETS).map(preset => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => applyPreset(preset)}
                        className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all hover:scale-[1.02]"
                        style={{
                          background: draft.name === preset.name ? `${preset.color}25` : 'rgba(255,255,255,0.03)',
                          borderColor: draft.name === preset.name ? preset.color : 'rgba(255,255,255,0.08)',
                          color: draft.name === preset.name ? '#ffffff' : 'var(--text-secondary)',
                        }}
                      >
                        <span>{preset.icon}</span>
                        <span>{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-[1fr_96px]">
                <label className="block text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  ชื่อหมวดหมู่ *
                  <input
                    autoFocus
                    className="wine-input mt-2"
                    value={draft.name || ''}
                    onChange={event => setDraft(current => current ? { ...current, name: event.target.value } : current)}
                    placeholder={editorMode === 'food' ? 'เช่น อาหารจานหลัก, กับแกล้ม, สเต๊ก...' : 'เช่น Red Wine, Beer...'}
                  />
                </label>
                <label className="block text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  ไอคอน
                  <input
                    className="wine-input mt-2 text-center"
                    value={draft.icon || ''}
                    onChange={event => setDraft(current => current ? { ...current, icon: event.target.value } : current)}
                    placeholder={editorMode === 'food' ? '🍽️' : '🍷'}
                    maxLength={4}
                  />
                </label>
              </div>

              <label className="block text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                รายละเอียด
                <textarea
                  className="wine-input mt-2 min-h-20 resize-y"
                  value={draft.description || ''}
                  onChange={event => setDraft(current => current ? { ...current, description: event.target.value } : current)}
                  placeholder="รายละเอียดสั้นๆ ของหมวดหมู่นี้..."
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-[1fr_144px]">
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>สีประจำหมวดหมู่</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {SWATCHES.map(color => (
                      <button
                        key={color}
                        type="button"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border"
                        style={{ borderColor: draft.color === color ? '#ffffff' : 'transparent', background: color }}
                        onClick={() => setDraft(current => current ? { ...current, color } : current)}
                      >
                        {draft.color === color && <Check size={15} color="#07111e" strokeWidth={3} />}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="block text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  ลำดับแสดงผล
                  <input
                    type="number"
                    min="0"
                    className="wine-input mt-2"
                    value={draft.sort_order ?? 0}
                    onChange={event => setDraft(current => current ? { ...current, sort_order: Number(event.target.value) } : current)}
                  />
                </label>
              </div>

              <button
                type="button"
                className="flex items-center gap-3 text-sm font-semibold"
                style={{ color: 'var(--text-secondary)' }}
                onClick={() => setDraft(current => current ? { ...current, is_active: !current.is_active } : current)}
              >
                <span
                  className="relative h-6 w-10 rounded-full border transition-colors"
                  style={{ borderColor: draft.is_active ? 'rgba(47,198,181,.35)' : 'var(--border-color)', background: draft.is_active ? 'var(--wine-600)' : '#0d1726' }}
                >
                  <span
                    className="absolute top-0.5 h-4.5 w-4.5 rounded-full bg-white shadow transition-transform"
                    style={{ left: 3, height: 16, width: 16, transform: draft.is_active ? 'translateX(16px)' : 'translateX(0)' }}
                  />
                </span>
                เปิดใช้งานหมวดหมู่นี้
              </button>
            </div>

            <div className="flex justify-end gap-3 border-t px-6 py-4" style={{ borderColor: 'var(--border-color)' }}>
              <button type="button" className="rounded-lg px-4 py-2 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }} onClick={closeEditor}>
                ยกเลิก
              </button>
              <button
                type="button"
                className="btn-wine gap-2"
                style={editorMode === 'food' ? { background: 'linear-gradient(135deg, #ea580c, #f97316)', boxShadow: '0 4px 16px rgba(249,115,22,0.35)' } : undefined}
                disabled={saving}
                onClick={saveCategory}
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                บันทึกหมวดหมู่
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
