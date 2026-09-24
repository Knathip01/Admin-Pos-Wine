'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Plus, Edit3, Trash2, CheckCircle2, AlertCircle,
  Tag, Clock, ArrowRight, ExternalLink, Image as ImageIcon,
  Flame, Layers, Eye, RefreshCw, X, Check, Search,
  SlidersHorizontal, Upload, Link as LinkIcon
} from 'lucide-react'
import Link from 'next/link'
import { Promotion } from '@/lib/types'
import { DEFAULT_PROMOTIONS, PROMOTION_IMAGE_PRESETS } from '@/lib/mock-promotions'

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'featured' | 'grid' | 'active' | 'inactive'>('all')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Form fields
  const [id, setId] = useState('')
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [newImageUrl, setNewImageUrl] = useState('')
  const [badge, setBadge] = useState('PROMOTION')
  const [discountTag, setDiscountTag] = useState('')
  const [validUntil, setValidUntil] = useState('ถึงสิ้นเดือนนี้')
  const [linkUrl, setLinkUrl] = useState('/#products')
  const [ctaText, setCtaText] = useState('ดูสินค้าโปรโมชั่น')
  const [secondaryCtaText, setSecondaryCtaText] = useState('เรียนรู้เพิ่มเติม')
  const [secondaryLinkUrl, setSecondaryLinkUrl] = useState('/#wine-categories')
  const [heroImageUrl, setHeroImageUrl] = useState('')
  const [isFeatured, setIsFeatured] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [sortOrder, setSortOrder] = useState(1)

  // Fetch promotions from API
  const loadPromotions = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/promotions', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        if (data.promotions && Array.isArray(data.promotions)) {
          setPromotions(data.promotions)
          return
        }
      }
      setPromotions(DEFAULT_PROMOTIONS)
    } catch (err) {
      console.error('Error loading promotions:', err)
      setPromotions(DEFAULT_PROMOTIONS)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPromotions()
  }, [])

  const [modalMode, setModalMode] = useState<'hero' | 'card'>('card')

  // Open Hero Banner Modal (Edit existing or create new)
  const handleOpenHeroBanner = () => {
    const existingHero = promotions.find(p => p.is_featured)
    if (existingHero) {
      handleOpenEdit(existingHero, 'hero')
      return
    }

    // Default template for new Hero Banner
    setEditingPromo(null)
    setModalMode('hero')
    setId('hero-featured-banner')
    setTitle('คัดสรรไวน์ ระดับพรีเมียม เพื่อคุณโดยเฉพาะ')
    setSubtitle('ไวน์นำเข้าคุณภาพเยี่ยมจากทั่วโลก จัดส่งถึงบ้านคุณภายใน 24 ชั่วโมง')
    setDescription('สัมผัสประสบการณ์สุนทรียภาพแห่งรสชาติกับไวน์ระดับพรีเมียม คัดสรรโดย Sommelier ผู้เชี่ยวชาญ')
    setImageUrl('/images/wine_banner.png')
    setImages(['/images/wine_banner.png', '/images/wine_hero.png'])
    setHeroImageUrl('/images/wine_hero.png')
    setNewImageUrl('')
    setBadge('ยินดีต้อนรับสู่ THE BOTTLE CLUB')
    setDiscountTag('PREMIUM SELECTION')
    setValidUntil('บริการจัดส่ง 24 ชม.')
    setLinkUrl('/#products')
    setCtaText('ดูไวน์ทั้งหมด')
    setSecondaryCtaText('เรียนรู้เพิ่มเติม')
    setSecondaryLinkUrl('/#wine-categories')
    setIsFeatured(true)
    setIsActive(true)
    setSortOrder(0)
    setErrorMessage('')
    setIsModalOpen(true)
  }

  // Open Create Promo Card Modal (News & Promotions carousel cards)
  const handleOpenCreateCard = () => {
    setEditingPromo(null)
    setModalMode('card')
    setId(`promo-${Date.now().toString().slice(-6)}`)
    setTitle('')
    setSubtitle('')
    setDescription('')
    setImageUrl(PROMOTION_IMAGE_PRESETS[0].url)
    setImages([PROMOTION_IMAGE_PRESETS[0].url])
    setHeroImageUrl('')
    setNewImageUrl('')
    setBadge('PROMOTION')
    setDiscountTag('UP TO 20% OFF')
    setValidUntil('ถึงสิ้นเดือนนี้')
    setLinkUrl('/#products')
    setCtaText('ดูสินค้าโปรโมชั่น')
    setSecondaryCtaText('')
    setSecondaryLinkUrl('')
    setIsFeatured(false)
    setIsActive(true)
    setSortOrder(promotions.filter(p => !p.is_featured).length + 1)
    setErrorMessage('')
    setIsModalOpen(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (p: Promotion, forceMode?: 'hero' | 'card') => {
    setEditingPromo(p)
    const mode = forceMode || (p.is_featured ? 'hero' : 'card')
    setModalMode(mode)
    setId(p.id)
    setTitle(p.title)
    setSubtitle(p.subtitle || '')
    setDescription(p.description || '')
    const initialImgs = Array.isArray(p.images) && p.images.length > 0
      ? p.images
      : (p.image_url ? [p.image_url] : [PROMOTION_IMAGE_PRESETS[0].url])
    setImages(initialImgs)
    setImageUrl(initialImgs[0] || p.image_url)
    setHeroImageUrl(p.hero_image_url || (initialImgs.length > 1 ? initialImgs[1] : ''))
    setNewImageUrl('')
    setBadge(p.badge || (p.is_featured ? 'ยินดีต้อนรับสู่ THE BOTTLE CLUB' : 'PROMOTION'))
    setDiscountTag(p.discount_tag || '')
    setValidUntil(p.valid_until || '')
    setLinkUrl(p.link_url || '/#products')
    setCtaText(p.cta_text || (p.is_featured ? 'ดูไวน์ทั้งหมด' : 'ดูสินค้าโปรโมชั่น'))
    setSecondaryCtaText(p.secondary_cta_text || (p.is_featured ? 'เรียนรู้เพิ่มเติม' : ''))
    setSecondaryLinkUrl(p.secondary_link_url || (p.is_featured ? '/#wine-categories' : ''))
    setIsFeatured(Boolean(p.is_featured))
    setIsActive(p.is_active !== undefined ? Boolean(p.is_active) : true)
    setSortOrder(Number(p.sort_order) || 1)
    setErrorMessage('')
    setIsModalOpen(true)
  }

  // Set as Main Hero Banner
  const handleSetFeatured = async (targetPromo: Promotion) => {
    const updatedList = promotions.map(p => ({
      ...p,
      is_featured: p.id === targetPromo.id,
    }))
    setPromotions(updatedList)

    try {
      await fetch('/api/admin/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedList),
      })
    } catch (err) {
      console.error('Failed to set featured promo:', err)
      loadPromotions()
    }
  }

  // Quick Toggle Active Status
  const handleToggleActive = async (promo: Promotion) => {
    const updated = { ...promo, is_active: !promo.is_active }
    // Optimistic UI update
    setPromotions(prev => prev.map(p => p.id === promo.id ? updated : p))

    try {
      const res = await fetch('/api/admin/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      })
      if (!res.ok) {
        // Rollback if failed
        setPromotions(prev => prev.map(p => p.id === promo.id ? promo : p))
      }
    } catch {
      setPromotions(prev => prev.map(p => p.id === promo.id ? promo : p))
    }
  }

  // Delete Promotion
  const handleDelete = async (promoId: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบโปรโมชั่นนี้?')) return

    // Optimistic UI update
    setPromotions(prev => prev.filter(p => p.id !== promoId))

    try {
      await fetch(`/api/admin/promotions?id=${promoId}`, { method: 'DELETE' })
    } catch (err) {
      console.error('Delete failed:', err)
      loadPromotions()
    }
  }

  // Restore Defaults
  const handleRestoreDefaults = async () => {
    if (!confirm('ต้องการรีเซ็ตโปรโมชั่นเป็นค่าเริ่มต้น (Default Presets) หรือไม่?')) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(DEFAULT_PROMOTIONS),
      })
      if (res.ok) {
        setPromotions(DEFAULT_PROMOTIONS)
      }
    } catch (err) {
      console.error('Failed to restore defaults:', err)
    } finally {
      setLoading(false)
    }
  }

  // Add image from URL input
  const handleAddImageUrl = () => {
    if (newImageUrl.trim()) {
      const url = newImageUrl.trim()
      setImages(prev => {
        const next = [...prev, url]
        if (!imageUrl) setImageUrl(next[0])
        return next
      })
      setNewImageUrl('')
    }
  }

  // Add preset image to list
  const handleAddPreset = (url: string) => {
    setImages(prev => {
      if (prev.includes(url)) return prev
      const next = [...prev, url]
      if (!imageUrl) setImageUrl(next[0])
      return next
    })
  }

  // Remove image from list
  const handleRemoveImage = (idxToRemove: number) => {
    setImages(prev => {
      const next = prev.filter((_, i) => i !== idxToRemove)
      if (next.length > 0) {
        setImageUrl(next[0])
      } else {
        setImageUrl('')
      }
      return next
    })
  }

  // Set as primary image (move to index 0)
  const handleSetPrimary = (idxToPrimary: number) => {
    setImages(prev => {
      const target = prev[idxToPrimary]
      const rest = prev.filter((_, i) => i !== idxToPrimary)
      const next = [target, ...rest]
      setImageUrl(target)
      return next
    })
  }

  // Image file upload converter (supports multiple file selection)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      Array.from(files).forEach(file => {
        const reader = new FileReader()
        reader.onloadend = () => {
          if (reader.result) {
            const base64 = reader.result as string
            setImages(prev => {
              const next = [...prev, base64]
              if (!imageUrl) setImageUrl(base64)
              return next
            })
          }
        }
        reader.readAsDataURL(file)
      })
    }
  }

  // Submit Modal Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setErrorMessage('กรุณากรอกชื่อแคมเปญโปรโมชั่น')
      return
    }

    const finalImages = images.length > 0 ? images : (imageUrl.trim() ? [imageUrl.trim()] : [])
    if (finalImages.length === 0) {
      setErrorMessage('กรุณาเพิ่มรูปภาพอย่างน้อย 1 รูป (เลือกพรีเซ็ต, วาง URL หรืออัปโหลดรูปภาพ)')
      return
    }

    if (isFeatured && heroImageUrl.trim() && !finalImages.includes(heroImageUrl.trim())) {
      if (finalImages.length > 1) {
        finalImages[1] = heroImageUrl.trim()
      } else {
        finalImages.push(heroImageUrl.trim())
      }
    }

    setSaving(true)
    setErrorMessage('')

    const payload: Promotion = {
      id: id.trim() || `promo-${Date.now()}`,
      title: title.trim(),
      subtitle: subtitle.trim(),
      description: description.trim(),
      image_url: finalImages[0],
      images: finalImages,
      hero_image_url: heroImageUrl.trim() || (finalImages.length > 1 ? finalImages[1] : undefined),
      badge: badge.trim(),
      discount_tag: discountTag.trim(),
      valid_until: validUntil.trim(),
      link_url: linkUrl.trim() || '/#products',
      cta_text: ctaText.trim() || (isFeatured ? 'ดูไวน์ทั้งหมด' : 'ดูสินค้าโปรโมชั่น'),
      secondary_cta_text: secondaryCtaText.trim(),
      secondary_link_url: secondaryLinkUrl.trim(),
      is_featured: isFeatured,
      is_active: isActive,
      sort_order: Number(sortOrder) || 1,
    }

    try {
      const res = await fetch('/api/admin/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to save promotion')
      }

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)

      // Update local state
      setPromotions(prev => {
        const idx = prev.findIndex(p => p.id === payload.id)
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = payload
          return next
        }
        return [payload, ...prev]
      })

      setIsModalOpen(false)
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการบันทึก')
    } finally {
      setSaving(false)
    }
  }

  // Active Hero banner (controls top of Storefront)
  const heroBanner = promotions.find(p => p.is_featured)

  // Filtered promotions
  const filtered = promotions.filter(p => {
    if (filterType === 'featured') return p.is_featured
    if (filterType === 'grid') return !p.is_featured

    const matchSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.subtitle && p.subtitle.toLowerCase().includes(search.toLowerCase())) ||
      (p.discount_tag && p.discount_tag.toLowerCase().includes(search.toLowerCase())) ||
      (p.badge && p.badge.toLowerCase().includes(search.toLowerCase()))

    if (!matchSearch) return false

    if (filterType === 'active') return p.is_active
    if (filterType === 'inactive') return !p.is_active
    return true
  })

  // KPI calculations
  const totalCount = promotions.length
  const activeCount = promotions.filter(p => p.is_active).length
  const featuredCount = promotions.filter(p => p.is_featured).length
  const inactiveCount = promotions.filter(p => !p.is_active).length

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ── Top Header & Actions ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Flame size={14} className="text-rose-500" />
            <span>WEB E-COMMERCE • PROMOTION ENGINE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <span>จัดการโปรโมชั่น Web Wine</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold">
              {totalCount} แคมเปญ
            </span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            สร้างและควบคุมแบนเนอร์โปรโมชั่นหลัก และการ์ดย่อยที่จะไปแสดงผลที่หน้าร้าน Web Store แบบเรียลไทม์
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/#promotions"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 text-xs font-bold transition-all shadow-sm"
          >
            <ExternalLink size={14} className="text-cyan-400" />
            <span>ดูหน้าร้านจริง (Storefront)</span>
          </Link>

          <button
            onClick={handleRestoreDefaults}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-white/5 text-xs font-semibold transition"
            title="รีเซ็ตโปรโมชั่นเริ่มต้น"
          >
            <RefreshCw size={13} />
            <span className="hidden sm:inline">คืนค่าเริ่มต้น</span>
          </button>

          {/* 👑 ปุ่มจัดการแบนเนอร์ใหญ่หน้าแรก (Hero Banner) แยกต่างหาก */}
          <button
            onClick={handleOpenHeroBanner}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-rose-600 to-amber-600 hover:from-amber-400 hover:to-rose-500 text-white text-xs font-extrabold shadow-[0_4px_20px_rgba(245,158,11,0.35)] transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Sparkles size={15} className="text-amber-200" />
            <span>👑 จัดการแบนเนอร์ใหญ่ (Hero)</span>
          </button>

          {/* ➕ ปุ่มเพิ่มการ์ดโปรโมชั่นใหม่ (News & Promotions) แยกต่างหาก */}
          <button
            onClick={handleOpenCreateCard}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 hover:from-rose-500 hover:to-pink-600 text-white text-xs font-extrabold shadow-[0_4px_20px_rgba(225,29,72,0.35)] transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Plus size={16} />
            <span>+ เพิ่มโปรโมชั่นใหม่ (การ์ดข่าวสาร)</span>
          </button>
        </div>
      </div>

      {/* ── KPI Cards: สรุปสถิติแคมเปญ ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">โปรโมชั่นทั้งหมด</span>
            <Layers size={16} className="text-indigo-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{totalCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">แคมเปญทั้งหมดในระบบ</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">เปิดแสดงหน้าร้าน</span>
            <CheckCircle2 size={16} className="text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400">{activeCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">กำลังแสดงผลใน Storefront</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">แบนเนอร์ใหญ่ (Featured)</span>
            <Flame size={16} className="text-rose-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-400">{featuredCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">แบนเนอร์หลักขนาดใหญ่</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">ปิดการแสดงผล</span>
            <AlertCircle size={16} className="text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400">{inactiveCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">ฉบับร่าง หรือ ซ่อนไว้</p>
        </div>
      </div>

      {/* ── 👑 ส่วนที่ 1: แบนเนอร์ใหญ่หน้าแรก (Hero Section Banner) ── */}
      <div className="space-y-3 p-5 sm:p-6 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow">
                <Sparkles size={16} />
              </span>
              <span>แบนเนอร์ใหญ่หน้าแรก (Hero Section Banner)</span>
              {heroBanner?.is_active && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                  ● กำลังแสดงผลด้านบนสุดของหน้าแรก
                </span>
              )}
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              แบนเนอร์ขนาดใหญ่เต็มหน้าจอส่วนบนสุดของ The Bottle Club Storefront (ภาพพื้นหลัง, ข้อความต้อนรับ, หัวข้อใหญ่, คำโปรย, และปุ่มกดทั้ง 2 ปุ่ม)
            </p>
          </div>

          <button
            onClick={handleOpenHeroBanner}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-rose-600 to-amber-600 hover:from-amber-400 hover:to-rose-500 text-white text-xs font-black shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer self-start sm:self-auto shrink-0"
          >
            <Edit3 size={15} />
            <span>{heroBanner ? 'แก้ไขแบนเนอร์ใหญ่หน้าแรก' : '+ ตั้งค่าแบนเนอร์ใหญ่หน้าแรก'}</span>
          </button>
        </div>

        {heroBanner ? (
          <div className="relative rounded-2xl overflow-hidden border border-amber-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/20 shadow-xl p-5 sm:p-7 flex flex-col lg:flex-row items-center justify-between gap-6">
            {/* Background preview effect */}
            <div
              className="absolute inset-0 bg-cover bg-center opacity-30 pointer-events-none"
              style={{ backgroundImage: `url(${heroBanner.image_url || '/images/wine_banner.png'})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent pointer-events-none" />

            {/* Left Content */}
            <div className="relative z-10 space-y-3.5 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow">
                  <Flame size={12} className="text-amber-400" />
                  <span>👑 HERO BANNER หน้าแรก</span>
                </span>
                {heroBanner.badge && (
                  <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15 text-white text-[11px] font-bold backdrop-blur-md">
                    {heroBanner.badge}
                  </span>
                )}
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  heroBanner.is_active ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                }`}>
                  {heroBanner.is_active ? '✓ เปิดแสดงผล' : '✕ ปิดใช้งาน'}
                </span>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  {heroBanner.title}
                </h3>
                {heroBanner.subtitle && (
                  <p className="text-xs sm:text-sm font-semibold text-rose-300 mt-1">
                    {heroBanner.subtitle}
                  </p>
                )}
                {heroBanner.description && heroBanner.description !== heroBanner.subtitle && (
                  <p className="text-xs text-slate-300 mt-1.5 line-clamp-2 leading-relaxed">
                    {heroBanner.description}
                  </p>
                )}
              </div>

              {/* Action Buttons & Links Preview */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <div className="px-4 py-2 rounded-full bg-white text-stone-950 font-black text-xs shadow flex items-center gap-1.5">
                  <span>{heroBanner.cta_text || 'ดูไวน์ทั้งหมด'}</span>
                  <ArrowRight size={13} />
                  <span className="text-[10px] font-normal text-slate-500">({heroBanner.link_url || '/#products'})</span>
                </div>
                {heroBanner.secondary_cta_text && (
                  <div className="px-4 py-2 rounded-full border border-white/30 bg-white/10 text-white font-bold text-xs backdrop-blur-md flex items-center gap-1.5">
                    <span>{heroBanner.secondary_cta_text}</span>
                    <span className="text-[10px] font-normal text-slate-400">({heroBanner.secondary_link_url || '/#wine-categories'})</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Images Preview */}
            <div className="relative z-10 shrink-0 flex items-center gap-3 sm:gap-4">
              {/* Background Thumbnail */}
              <div className="text-center space-y-1">
                <div className="w-28 h-20 sm:w-32 sm:h-24 rounded-2xl overflow-hidden border border-white/20 bg-slate-950 shadow-lg relative">
                  <img
                    src={heroBanner.image_url || '/images/wine_banner.png'}
                    alt="Background"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] text-white font-bold">
                    ภาพพื้นหลัง
                  </span>
                </div>
              </div>

              {/* Floating Hero Thumbnail */}
              <div className="text-center space-y-1">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-amber-500/30 bg-slate-950 shadow-lg relative p-1 flex items-center justify-center">
                  <img
                    src={heroBanner.hero_image_url || (heroBanner.images && heroBanner.images.length > 1 ? heroBanner.images[1] : '/images/wine_hero.png')}
                    alt="Floating Hero"
                    className="w-full h-full object-contain drop-shadow-md"
                  />
                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-amber-500 text-[9px] text-slate-950 font-black">
                    ขวดไวน์ลอย
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-2 pl-2">
                <button
                  onClick={() => handleOpenEdit(heroBanner, 'hero')}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 size={13} className="text-cyan-400" />
                  <span>แก้ไข</span>
                </button>
                <button
                  onClick={() => handleToggleActive(heroBanner)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    heroBanner.is_active
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                  title="เปิด/ปิด การแสดงผลแบนเนอร์ใหญ่"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${heroBanner.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                  <span>{heroBanner.is_active ? 'เปิดอยู่' : 'ปิดอยู่'}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 rounded-2xl border border-dashed border-amber-500/30 bg-amber-500/5 text-center flex flex-col items-center justify-center gap-3">
            <Sparkles size={32} className="text-amber-400" />
            <div>
              <h3 className="text-base font-bold text-white">ยังไม่มีการตั้งค่าแบนเนอร์ใหญ่หน้าแรก</h3>
              <p className="text-slate-400 text-xs mt-0.5">กดปุ่มด้านล่างเพื่อเริ่มกำหนดรูปภาพและข้อความสำหรับ Hero Section</p>
            </div>
            <button
              onClick={handleOpenHeroBanner}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-extrabold shadow-lg hover:bg-amber-400 transition cursor-pointer"
            >
              <Plus size={15} />
              <span>+ ตั้งค่าแบนเนอร์ใหญ่หน้าแรกทันที</span>
            </button>
          </div>
        )}
      </div>

      {/* ── 📰 ส่วนที่ 2: การ์ดข่าวสารและโปรโมชั่นลดราคา (News & Promotion Cards) ── */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <Tag size={16} />
              </span>
              <span>การ์ดข่าวสารและโปรโมชั่นลดราคา (News & Promotion Cards)</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold">
                {totalCount - featuredCount} แคมเปญ
              </span>
            </h2>
            <p className="text-slate-400 text-xs">
              การ์ดย่อยที่จะไปแสดงผลในแถบสไลด์อัตโนมัติ (Carousel) ส่วน NEWS & SPECIAL PROMOTIONS ด้านล่างของหน้าแรก
            </p>
          </div>

          <button
            onClick={handleOpenCreateCard}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 hover:from-rose-500 hover:to-pink-600 text-white text-xs font-extrabold shadow-[0_4px_20px_rgba(225,29,72,0.35)] transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer self-start sm:self-auto shrink-0"
          >
            <Plus size={16} />
            <span>+ เพิ่มโปรโมชั่นใหม่ (การ์ดข่าวสาร)</span>
          </button>
        </div>

        {/* Filter Bar & Search */}
        <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-inner">
          {/* Segmented Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto p-1 bg-black/40 rounded-xl">
            {[
              { id: 'all', label: 'ทั้งหมด', count: totalCount },
              { id: 'grid', label: 'การ์ดย่อย', count: totalCount - featuredCount },
              { id: 'featured', label: 'แบนเนอร์ใหญ่', count: featuredCount },
              { id: 'active', label: 'เปิดใช้งาน', count: activeCount },
              { id: 'inactive', label: 'ปิดใช้งาน', count: inactiveCount },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  filterType === tab.id
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  filterType === tab.id ? 'bg-black/30 text-white' : 'bg-white/10 text-slate-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search input */}
          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, ส่วนลด, ป้าย..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-xs text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Promotions List Grid ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <RefreshCw size={32} className="animate-spin text-rose-500 mb-3" />
          <p className="text-slate-400 text-xs font-medium">กำลังโหลดข้อมูลโปรโมชั่น...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-white/10 bg-slate-900/40">
          <Wine size={40} className="mx-auto text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-white mb-1">ไม่พบรายการโปรโมชั่น</h3>
          <p className="text-slate-400 text-xs mb-4">ลองเปลี่ยนคำค้นหา หรือกดสร้างโปรโมชั่นใหม่</p>
          <button
            onClick={handleOpenCreateCard}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold"
          >
            <Plus size={14} />
            <span>+ สร้างการ์ดโปรโมชั่นแรก</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(promo => (
            <div
              key={promo.id}
              className={`rounded-2xl border overflow-hidden backdrop-blur-xl transition-all duration-200 flex flex-col justify-between ${
                promo.is_featured
                  ? 'border-rose-500/40 bg-gradient-to-b from-rose-950/20 via-slate-900/70 to-slate-900/90 shadow-[0_8px_30px_rgba(225,29,72,0.15)]'
                  : 'border-white/10 bg-slate-900/60 hover:border-white/20'
              }`}
            >
              {/* Card Image header */}
              <div className="relative h-44 w-full overflow-hidden bg-slate-950">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 hover:scale-105"
                  style={{ backgroundImage: `url(${promo.image_url})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                {/* Top Badges */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {promo.is_featured && (
                      <span className="px-2.5 py-0.5 rounded-md bg-gradient-to-r from-amber-500 via-rose-600 to-pink-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
                        <Flame size={11} className="text-amber-200" />
                        👑 แบนเนอร์ใหญ่หน้าแรก (HERO)
                      </span>
                    )}
                    {promo.badge && (
                      <span className="px-2.5 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-white text-[10px] font-bold">
                        {promo.badge}
                      </span>
                    )}
                  </div>

                  {promo.discount_tag && (
                    <span className="px-2.5 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-black flex items-center gap-1 shadow-md">
                      <Tag size={10} />
                      {promo.discount_tag}
                    </span>
                  )}
                </div>

                {/* Validity Badge */}
                {promo.valid_until && (
                  <div className="absolute bottom-2.5 left-3 text-[10px] font-semibold text-slate-300 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md">
                    <Clock size={11} className="text-amber-400" />
                    <span>{promo.valid_until}</span>
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  {promo.is_featured && (
                    <div className="mb-2.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[11px] font-bold flex items-center justify-between">
                      <span>👑 ควบคุมส่วน Hero Section หน้าแรก</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200">
                        {promo.images && promo.images.length > 1 ? `${promo.images.length} รูป (พื้นหลัง+ขวด)` : '1 รูป (พื้นหลัง)'}
                      </span>
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="font-extrabold text-white text-base leading-snug line-clamp-1">
                      {promo.title}
                    </h3>
                  </div>
                  {promo.subtitle && (
                    <p className="text-xs font-semibold text-rose-300/90 line-clamp-1 mb-2">
                      {promo.subtitle}
                    </p>
                  )}
                  <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 mb-4">
                    {promo.description}
                  </p>
                </div>

                {/* Card Meta & Controls */}
                <div className="pt-3 border-t border-white/10 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1 text-[11px]">
                      <LinkIcon size={12} className="text-slate-500" />
                      <span className="truncate max-w-[120px]">{promo.link_url || '/#products'}</span>
                    </span>

                    {/* Quick Active Toggle */}
                    <button
                      onClick={() => handleToggleActive(promo)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        promo.is_active
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                      title="กดเพื่อสลับ เปิด/ปิด การแสดงผล"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${promo.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                      <span>{promo.is_active ? 'เปิดแสดงผล' : 'ปิดใช้งาน'}</span>
                    </button>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    {!promo.is_featured && (
                      <button
                        onClick={() => handleSetFeatured(promo)}
                        className="py-2 px-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                        title="ตั้งเป็นแบนเนอร์ใหญ่หน้าแรก (Hero Banner)"
                      >
                        <Flame size={12} className="text-amber-400" />
                        <span>ตั้งเป็น Hero</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenEdit(promo)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-bold transition cursor-pointer"
                    >
                      <Edit3 size={13} className="text-cyan-400" />
                      <span>แก้ไข</span>
                    </button>

                    <button
                      onClick={() => handleDelete(promo.id)}
                      className="inline-flex items-center justify-center p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-bold transition cursor-pointer"
                      title="ลบโปรโมชั่น"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create / Edit Modal with Real-time Live Preview ── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-slate-900 border border-white/15 rounded-3xl shadow-2xl overflow-hidden my-6"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-slate-950/60">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl border ${
                    modalMode === 'hero'
                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                      : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                  }`}>
                    {modalMode === 'hero' ? <Flame size={18} /> : <Sparkles size={18} />}
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white">
                      {modalMode === 'hero'
                        ? (editingPromo ? '👑 จัดการ / แก้ไขแบนเนอร์ใหญ่หน้าแรก (Hero Banner)' : '👑 สร้างแบนเนอร์ใหญ่หน้าแรก (Hero Banner)')
                        : (editingPromo ? '📰 แก้ไขการ์ดโปรโมชั่น / ข่าวสาร' : '➕ เพิ่มการ์ดโปรโมชั่น / ข่าวสารใหม่')}
                    </h2>
                    <p className="text-xs text-slate-400">
                      {modalMode === 'hero'
                        ? 'กำหนดเนื้อหา รูปภาพแบนเนอร์หลัก ขวดลอย และปุ่ม CTA หน้าแรกของเว็บไซต์'
                        : 'กำหนดเนื้อหา รูปภาพ และพรีวิวผลการแสดงผลการ์ดย่อยทันทีก่อนบันทึก'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                {errorMessage && (
                  <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                    <AlertCircle size={15} />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* ── Multi-Image Selector & Gallery Manager ── */}
                <div className="space-y-4 p-4 rounded-2xl bg-black/40 border border-white/10">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <ImageIcon size={14} className="text-rose-400" />
                      <span>รูปภาพแบนเนอร์โปรโมชั่น (ใส่ได้หลายรูป) *</span>
                    </label>
                    <span className="text-[11px] font-bold text-rose-400">
                      มีทั้งหมด {images.length} รูป
                    </span>
                  </div>

                  {/* Thumbnail gallery preview of selected images */}
                  {images.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[11px] text-slate-400 block">
                        รูปภาพที่จะแสดงในแบนเนอร์ (รูปลำดับแรกคือรูปหลัก):
                      </span>
                      <div className="flex items-center gap-2.5 overflow-x-auto pb-2">
                        {images.map((img, idx) => (
                          <div
                            key={idx}
                            className="relative group shrink-0 w-24 h-20 rounded-xl overflow-hidden border border-white/15 bg-slate-950 shadow-md"
                          >
                            <img
                              src={img}
                              alt={`Promo image ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            {/* Primary badge */}
                            {idx === 0 && (
                              <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-rose-600 text-[9px] font-black text-white shadow">
                                รูปหลัก
                              </span>
                            )}
                            {/* Overlay hover actions */}
                            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                              {idx !== 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleSetPrimary(idx)}
                                  title="ตั้งเป็นรูปหลัก"
                                  className="px-1.5 py-0.5 rounded bg-white/20 hover:bg-rose-600 text-white text-[10px] font-bold"
                                >
                                  หลัก
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(idx)}
                                title="ลบรูปนี้"
                                className="p-1 rounded-md bg-red-600 hover:bg-red-700 text-white"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preset quick buttons (Clicking adds to images array) */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-slate-400 block">
                      คลิกเพื่อเพิ่มรูปภาพพรีเซ็ตสำเร็จรูป:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                      {PROMOTION_IMAGE_PRESETS.map((preset, idx) => {
                        const isSelected = images.includes(preset.url);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleAddPreset(preset.url)}
                            className={`p-2 rounded-xl border text-left transition flex flex-col justify-between gap-2 cursor-pointer ${
                              isSelected
                                ? 'border-rose-500 bg-rose-500/20 text-white shadow-md'
                                : 'border-white/10 bg-slate-800/40 text-slate-300 hover:border-white/20'
                            }`}
                          >
                            <div
                              className="w-full h-12 rounded-lg bg-cover bg-center"
                              style={{ backgroundImage: `url(${preset.url})` }}
                            />
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold truncate leading-tight">
                                {preset.icon} {preset.name}
                              </span>
                              {isSelected && <Check size={11} className="text-rose-400 shrink-0" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* URL Input & Multiple Upload */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                    <div className="sm:col-span-2 flex gap-1.5">
                      <input
                        type="text"
                        placeholder="วาง URL รูปภาพเพิ่มเติม (https://...)"
                        value={newImageUrl}
                        onChange={e => setNewImageUrl(e.target.value)}
                        className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddImageUrl}
                        className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shrink-0 cursor-pointer"
                      >
                        + เพิ่มรูป
                      </button>
                    </div>
                    <div>
                      <label className="w-full px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition">
                        <Upload size={13} />
                        <span>+ อัปโหลดหลายรูป</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* ── Main Info Fields ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      ชื่อแคมเปญโปรโมชั่น (Title) *
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น GRAND CRU & VINTAGE SELECTION"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs sm:text-sm text-white focus:border-rose-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      คำโปรยรอง (Subtitle)
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น สัมผัสรสชาติไวน์ชั้นเลิศระดับพรีเมียม"
                      value={subtitle}
                      onChange={e => setSubtitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs sm:text-sm text-white focus:border-rose-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    รายละเอียดโปรโมชั่น (Description) *
                  </label>
                  <textarea
                    rows={3}
                    placeholder="ระบุเงื่อนไข สิทธิพิเศษ และรายละเอียดโปรโมชั่น..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs sm:text-sm text-white focus:border-rose-500 focus:outline-none resize-none"
                  />
                </div>

                {/* Badges, Discounts & Validity */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      ป้ายกำกับ (Badge)
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น FEATURED, NEW MEMBER"
                      value={badge}
                      onChange={e => setBadge(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:border-rose-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      แท็กส่วนลด (Discount Tag)
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น UP TO 30% OFF, ลด 500฿"
                      value={discountTag}
                      onChange={e => setDiscountTag(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:border-rose-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      ระยะเวลา (Valid Until)
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น ถึงสิ้นเดือนนี้, สิทธิ์จำกัด"
                      value={validUntil}
                      onChange={e => setValidUntil(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:border-rose-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Links & CTA */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      {isFeatured ? 'ลิงก์ปุ่มหลัก (Primary Link)' : 'ลิงก์ปลายทาง (Link URL)'}
                    </label>
                    <input
                      type="text"
                      placeholder="/#products หรือ /menu"
                      value={linkUrl}
                      onChange={e => setLinkUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:border-rose-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      {isFeatured ? 'ข้อความปุ่มหลัก (Primary CTA)' : 'ข้อความบนปุ่ม (CTA Text)'}
                    </label>
                    <input
                      type="text"
                      placeholder={isFeatured ? 'เช่น ดูไวน์ทั้งหมด' : 'เช่น ดูสินค้าโปรโมชั่น'}
                      value={ctaText}
                      onChange={e => setCtaText(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:border-rose-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      ลำดับแสดงผล (Sort Order)
                    </label>
                    <input
                      type="number"
                      value={sortOrder}
                      onChange={e => setSortOrder(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:border-rose-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* ── Display Style Switches ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-black/40 border border-white/10">
                  {/* Featured Banner Switch */}
                  <label className="flex items-center justify-between cursor-pointer p-3 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 border border-white/5 transition">
                    <div>
                      <span className="text-xs font-bold text-white block">
                        👑 แบนเนอร์หลักหน้าแรก (Hero Banner)
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {isFeatured ? 'แสดงด้านบนสุดขนาดใหญ่เต็มหน้าจอ (Hero Section)' : 'แสดงเป็นการ์ดย่อย (Grid Card ข่าวสาร/โปรโมชั่น)'}
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={e => setIsFeatured(e.target.checked)}
                      className="w-5 h-5 accent-rose-500 rounded cursor-pointer"
                    />
                  </label>

                  {/* Active Switch */}
                  <label className="flex items-center justify-between cursor-pointer p-3 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 border border-white/5 transition">
                    <div>
                      <span className="text-xs font-bold text-white block">
                        เปิดใช้งานการแสดงผล (Active on Storefront)
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {isActive ? 'แสดงผลทันทีที่หน้าแรก' : 'ซ่อนไว้ชั่วคราว (ฉบับร่าง)'}
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={e => setIsActive(e.target.checked)}
                      className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                    />
                  </label>
                </div>

                {/* ── Special Settings for Hero Banner Mode ── */}
                {isFeatured && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-950/30 via-slate-900 to-amber-950/20 border border-rose-500/30 space-y-4">
                    <div className="flex items-center gap-2 text-rose-300">
                      <Sparkles size={16} className="text-rose-400" />
                      <span className="text-xs font-black uppercase tracking-wider">
                        ✨ ตั้งค่าพิเศษสำหรับแบนเนอร์ใหญ่หน้าแรก (Hero Section Controls)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      ข้อมูลในส่วนนี้จะถูกส่งไปแสดงผลที่ส่วนบนสุดของหน้าร้าน The Bottle Club (แทนที่ภาพและข้อความเริ่มต้นทั้งหมด) คุณสามารถปรับแต่งรูปพื้นหลัง ภาพขวดไวน์ลอย และปุ่มกดทั้งสองปุ่มได้อิสระ
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Floating Hero Image */}
                      <div>
                        <label className="block text-xs font-bold text-slate-200 mb-1.5">
                          รูปขวดไวน์/เชลฟ์สินค้าลอยด้านขวา (Floating Hero Image)
                        </label>
                        <input
                          type="text"
                          placeholder="วาง URL รูปขวดไวน์ หรือ /images/wine_hero.png"
                          value={heroImageUrl}
                          onChange={e => setHeroImageUrl(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:border-rose-500 focus:outline-none"
                        />
                        <span className="text-[10px] text-slate-500 mt-1 block">
                          หากเว้นว่าง ระบบจะใช้รูปที่ 2 จากแกลเลอรี หรือรูปเริ่มต้น /images/wine_hero.png
                        </span>
                      </div>

                      {/* Secondary Button Text & Link */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-bold text-slate-200 mb-1.5">
                            ข้อความปุ่มรอง (Button 2)
                          </label>
                          <input
                            type="text"
                            placeholder="เช่น เรียนรู้เพิ่มเติม"
                            value={secondaryCtaText}
                            onChange={e => setSecondaryCtaText(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:border-rose-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-200 mb-1.5">
                            ลิงก์ปุ่มรอง (Link 2)
                          </label>
                          <input
                            type="text"
                            placeholder="เช่น /#wine-categories"
                            value={secondaryLinkUrl}
                            onChange={e => setSecondaryLinkUrl(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:border-rose-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Live Interactive Preview Stage ── */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Eye size={14} className="text-cyan-400" />
                      <span>พรีวิวการแสดงผลจริง (Live Preview)</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {isFeatured ? 'โหมด: แบนเนอร์หลักหน้าแรก (Hero Section Preview)' : 'โหมด: การ์ดย่อย (News/Promotion Card)'}
                    </span>
                  </div>

                  {/* Live Card Preview Container */}
                  <div className="p-3 sm:p-4 rounded-2xl bg-black/60 border border-white/10 overflow-hidden">
                    {isFeatured ? (
                      /* Featured Banner (Hero Section) Live Preview */
                      <div className="relative rounded-2xl overflow-hidden border border-rose-500/40 min-h-[300px] flex flex-col justify-end p-5 sm:p-7 bg-stone-950 text-white shadow-2xl">
                        {/* Background Banner */}
                        <div
                          className="absolute inset-0 bg-cover bg-center opacity-60"
                          style={{ backgroundImage: `url(${imageUrl || PROMOTION_IMAGE_PRESETS[0].url})` }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/70 to-stone-950/30" />

                        {/* Floating right image mockup */}
                        <div className="hidden sm:block absolute bottom-3 right-4 w-32 h-44 pointer-events-none">
                          <img
                            src={heroImageUrl || (images.length > 1 ? images[1] : '/images/wine_hero.png')}
                            alt=""
                            className="w-full h-full object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.85)]"
                          />
                        </div>

                        {/* Content */}
                        <div className="relative z-10 max-w-lg space-y-3">
                          {/* Welcome Badge */}
                          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow backdrop-blur-md">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,1)]" />
                            <span>{badge || 'ยินดีต้อนรับสู่ THE BOTTLE CLUB'}</span>
                          </div>

                          {/* Massive Title */}
                          <h4 className="text-xl sm:text-2xl font-black text-white leading-tight drop-shadow-md">
                            {title || 'คัดสรรไวน์ ระดับพรีเมียม เพื่อคุณโดยเฉพาะ'}
                          </h4>

                          {/* Subtitle */}
                          <p className="text-xs text-stone-200 line-clamp-2 max-w-md leading-relaxed">
                            {subtitle || description || 'ไวน์นำเข้าคุณภาพเยี่ยมจากทั่วโลก จัดส่งถึงบ้านคุณภายใน 24 ชั่วโมง'}
                          </p>

                          {/* CTA Buttons */}
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black text-stone-950 shadow-md">
                              <span>{ctaText || 'ดูไวน์ทั้งหมด'}</span>
                              <ArrowRight size={13} />
                            </span>
                            {secondaryCtaText && (
                              <span className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs font-bold text-white backdrop-blur-md">
                                {secondaryCtaText}
                              </span>
                            )}
                          </div>

                          {/* Service badges mini */}
                          <div className="flex items-center gap-2 pt-1 text-[10px] text-white/80">
                            <span className="px-2 py-0.5 rounded-md bg-white/10 border border-white/10">🚚 จัดส่งรวดเร็ว</span>
                            <span className="px-2 py-0.5 rounded-md bg-white/10 border border-white/10">✨ คัดสรรโดยผู้เชี่ยวชาญ</span>
                            <span className="px-2 py-0.5 rounded-md bg-white/10 border border-white/10">🔒 ชำระเงินปลอดภัย</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Grid Card Preview */
                      <div className="max-w-sm rounded-xl overflow-hidden border border-white/10 bg-slate-900/90 flex flex-col justify-between">
                        <div className="relative h-28 bg-cover bg-center" style={{ backgroundImage: `url(${imageUrl || PROMOTION_IMAGE_PRESETS[0].url})` }}>
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                          <div className="absolute top-2 left-2 flex gap-1">
                            {badge && <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[9px] font-bold">{badge}</span>}
                            {discountTag && <span className="px-2 py-0.5 rounded bg-amber-500 text-black text-[9px] font-black">{discountTag}</span>}
                          </div>
                        </div>
                        <div className="p-3">
                          <h4 className="text-sm font-bold text-white line-clamp-1">{title || 'ชื่อแคมเปญโปรโมชั่น'}</h4>
                          <p className="text-slate-400 text-xs line-clamp-1 mt-0.5">{description || 'รายละเอียดโปรโมชั่น'}</p>
                          <div className="mt-3 pt-2 border-t border-white/10 flex justify-between items-center text-xs">
                            <span className="text-rose-400 font-bold">{ctaText || 'ดูข้อเสนอ'} ➜</span>
                            <span className="text-[10px] text-slate-500">{validUntil}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Modal Footer Buttons */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition cursor-pointer"
                  >
                    ยกเลิก
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 hover:from-rose-500 hover:to-pink-600 text-white text-xs font-extrabold shadow-[0_4px_16px_rgba(225,29,72,0.4)] transition-all cursor-pointer disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>กำลังบันทึก...</span>
                      </>
                    ) : saveSuccess ? (
                      <>
                        <CheckCircle2 size={14} className="text-emerald-300" />
                        <span>บันทึกสำเร็จ!</span>
                      </>
                    ) : (
                      <>
                        <Check size={14} />
                        <span>
                          {modalMode === 'hero'
                            ? (editingPromo ? 'บันทึกแบนเนอร์ใหญ่' : 'สร้างแบนเนอร์ใหญ่')
                            : (editingPromo ? 'บันทึกการแก้ไข' : 'บันทึกโปรโมชั่นใหม่')}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
