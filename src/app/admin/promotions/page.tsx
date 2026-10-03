'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, CheckCircle2, AlertCircle, ArrowRight,
  Image as ImageIcon, Upload, Link as LinkIcon, RefreshCw,
  ExternalLink, Layers, Eye, Check
} from 'lucide-react'
import { Promotion } from '@/lib/types'

// Default Banner Presets from Projectbottleclub1
const BANNER_PRESETS = [
  {
    name: 'Doodle Mascot วงกลมตรงกลาง (ใหม่ล่าสุด)',
    url: '/images/footer-pattern.jpg',
    desc: 'ลายเส้นการ์ตูนปารีเซียง พร้อมตราสัญลักษณ์มาสคอต The Bottle Club ตรงกลาง',
  },
  {
    name: 'Doodle Mascot แบบไร้กรอบ (Seamless)',
    url: '/images/footer-pattern-seamless.jpg',
    desc: 'ลายเส้นการ์ตูนพร้อมมาสคอตกลืนไปกับลวดลาย ไร้กรอบวงกลม',
  },
  {
    name: 'ห้องเก็บไวน์พรีเมียม (Wine Cellar Banner)',
    url: '/images/wine_banner.png',
    desc: 'ภาพบรรยากาศห้องเก็บบ่มไวน์คลาสสิก แสงวอร์มไวท์หรูหรา',
  },
]

const BOTTLE_PRESETS = [
  {
    name: 'ขวดไวน์พรีเมียมคลาสสิก (ค่าเริ่มต้น)',
    url: '/images/wine_hero.png',
  },
  {
    name: 'ไม่แสดงรูปขวดลอย (ซ่อนขวด)',
    url: '',
  },
]

export default function AdminPromotionsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Banner State (Mapped directly to Projectbottleclub1 Hero Banner)
  const [bannerImageUrl, setBannerImageUrl] = useState('/images/footer-pattern.jpg')
  const [floatingBottleUrl, setFloatingBottleUrl] = useState('/images/wine_hero.png')
  const [badgeText, setBadgeText] = useState('ยินดีต้อนรับสู่ The Bottle Club')
  const [isActive, setIsActive] = useState(true)

  // Standard Projectbottleclub1 texts
  const standardTitle = 'We are your essential partner for hospitality success.'
  const standardSubtitle = 'We provide bars and restaurants with a premier selection of beverages, expert consultancy, and bespoke solutions designed to elevate your brand and operations.'

  // Fetch current banner settings from API
  const loadBannerData = async () => {
    setLoading(true)
    setErrorMessage('')
    try {
      const res = await fetch('/api/admin/promotions', { cache: 'no-store' })
      if (res.ok) {
        const json = await res.json()
        const list: Promotion[] = json.promotions || []
        const hero = list.find(p => p.is_featured || p.id === 'hero-featured-banner') || list[0]
        if (hero) {
          if (hero.image_url) setBannerImageUrl(hero.image_url)
          if (hero.hero_image_url !== undefined) setFloatingBottleUrl(hero.hero_image_url || '')
          if (hero.badge) setBadgeText(hero.badge)
          if (hero.is_active !== undefined) setIsActive(Boolean(hero.is_active))
        }
      }
    } catch (err: any) {
      console.error('Failed to load banner data:', err)
      setErrorMessage('ไม่สามารถโหลดข้อมูลล่าสุดได้ กำลังใช้ข้อมูลจากระบบ')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBannerData()
  }, [])

  // Handle Main Banner File Upload (converted to Data URL)
  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        if (reader.result) {
          setBannerImageUrl(reader.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle Floating Bottle Upload
  const handleBottleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        if (reader.result) {
          setFloatingBottleUrl(reader.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Save Banner Changes & Sync to ProjectbottleClub1
  const handleSaveBanner = async () => {
    if (!bannerImageUrl.trim()) {
      setErrorMessage('กรุณาเลือกหรือระบุ URL รูปภาพแบนเนอร์พื้นหลัง')
      return
    }

    setSaving(true)
    setErrorMessage('')

    const finalImages = [bannerImageUrl.trim()]
    if (floatingBottleUrl.trim()) {
      finalImages.push(floatingBottleUrl.trim())
    }

    const payload: Promotion = {
      id: 'hero-featured-banner',
      title: standardTitle,
      subtitle: standardSubtitle,
      description: 'สัมผัสประสบการณ์สุนทรียภาพแห่งรสชาติกับไวน์ระดับพรีเมียม คัดสรรโดย Sommelier ผู้เชี่ยวชาญ',
      image_url: bannerImageUrl.trim(),
      images: finalImages,
      hero_image_url: floatingBottleUrl.trim() || undefined,
      badge: badgeText.trim() || 'ยินดีต้อนรับสู่ The Bottle Club',
      discount_tag: 'HOSPITALITY PARTNER',
      valid_until: 'บริการจัดส่ง 24 ชม.',
      link_url: '/#products',
      cta_text: 'ดูไวน์ทั้งหมด',
      secondary_cta_text: 'เรียนรู้เพิ่มเติม',
      secondary_link_url: '/#wine-categories',
      is_featured: true,
      is_active: isActive,
      sort_order: 0,
    }

    try {
      const res = await fetch('/api/admin/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errJson = await res.json()
        throw new Error(errJson.error || 'Failed to save banner')
      }

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3500)
    } catch (err: any) {
      console.error('Error saving banner:', err)
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto pb-24 px-1 sm:px-4 md:px-6">
      {/* ── Top Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles size={13} className="text-amber-400 shrink-0" />
            <span className="truncate">PROJECTBOTTLECLUB1 • HERO BANNER MANAGER</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-2 sm:gap-3">
            <span>จัดการรูปภาพแบนเนอร์หน้าแรก</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            เปลี่ยนรูปภาพพื้นหลังและรูปภาพขวดไวน์ของ Hero Banner บน Projectbottleclub1 โดยตรงแบบเรียลไทม์
          </p>
        </div>

        {/* Action buttons: 2-column grid on mobile, inline on tablet/desktop */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3 w-full md:w-auto">
          <button
            onClick={loadBannerData}
            disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-white/10 bg-slate-900/60 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-all active:scale-95 cursor-pointer min-h-[40px] sm:min-h-[42px]"
            title="รีเฟรชข้อมูลล่าสุด"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>รีเฟรช</span>
          </button>

          <a
            href="http://localhost:3001"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all active:scale-95 min-h-[40px] sm:min-h-[42px]"
          >
            <span className="truncate">ดูหน้าร้าน</span>
            <ExternalLink size={13} className="shrink-0" />
          </a>

          <button
            onClick={handleSaveBanner}
            disabled={saving || loading}
            className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-rose-600 to-amber-600 hover:from-amber-400 hover:to-rose-500 text-white text-xs sm:text-sm font-black shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer min-h-[42px]"
          >
            {saving ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>กำลังบันทึกและซิงค์...</span>
              </>
            ) : (
              <>
                <Check size={16} />
                <span>บันทึกและซิงค์แบนเนอร์</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Notification Alerts ── */}
      <AnimatePresence>
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3.5 sm:p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl"
          >
            <div className="flex items-start sm:items-center gap-3">
              <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <p className="font-bold text-xs sm:text-sm">บันทึกและซิงค์แบนเนอร์เรียบร้อยแล้ว!</p>
                <p className="text-[11px] sm:text-xs text-emerald-300/80 mt-0.5">
                  ข้อมูลรูปภาพถูกอัปเดตและเขียนลง Projectbottleclub1 ทันที หน้าร้านจะแสดงผลตามรูปที่ท่านเลือก
                </p>
              </div>
            </div>
            <a
              href="http://localhost:3001"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-center font-bold px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 transition-all shrink-0 w-full sm:w-auto"
            >
              เปิดดูหน้าร้าน ↗
            </a>
          </motion.div>
        )}

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3.5 sm:p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 flex items-start sm:items-center gap-3 shadow-xl"
          >
            <AlertCircle size={18} className="text-rose-400 shrink-0 mt-0.5 sm:mt-0" />
            <p className="text-xs sm:text-sm font-semibold break-words">{errorMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 👁️ Live Interactive Preview of Hero Banner ── */}
      <div className="space-y-2 sm:space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <h2 className="text-xs sm:text-sm font-black text-slate-300 flex items-center gap-2">
            <Eye size={15} className="text-amber-400" />
            <span>ตัวอย่างสดแบนเนอร์หน้าร้าน (Live Preview)</span>
          </h2>
          <span className="text-[10px] sm:text-[11px] text-slate-400 sm:text-slate-500">
            *ข้อความและเลย์เอาต์ซิงค์ตาม Projectbottleclub1
          </span>
        </div>

        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-amber-500/30 bg-stone-950 shadow-2xl min-h-[300px] sm:min-h-[420px] md:min-h-[460px] flex flex-col justify-end p-4 sm:p-8 lg:p-10 text-white">
          {/* Background image preview */}
          <div
            className="absolute inset-0 bg-cover bg-center md:bg-[center_66%] transition-all duration-500"
            style={{ backgroundImage: `url(${bannerImageUrl || '/images/footer-pattern.jpg'})` }}
          />

          {/* Overlays matching Projectbottleclub1 */}
          <div className="absolute inset-0 bg-[linear-gradient(125deg,rgba(0,0,0,.85)_0%,rgba(0,0,0,.60)_45%,rgba(0,0,0,.80)_100%)] pointer-events-none" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,10,9,.3)_0%,transparent_35%,rgba(12,10,9,.75)_100%)] pointer-events-none" />
          <div className="absolute inset-0 bg-radial from-rose-950/20 via-transparent to-transparent pointer-events-none" />

          {/* Left Column Content (Constrained width to avoid center logo) */}
          <div className="relative z-10 max-w-lg space-y-2.5 sm:space-y-4">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full border border-amber-500/30 bg-white/10 backdrop-blur-md shadow max-w-full">
              <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] shrink-0" />
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-amber-200 truncate">
                {badgeText || 'ยินดีต้อนรับสู่ The Bottle Club'}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-black text-white leading-tight drop-shadow-md">
              <span>We are your </span>
              <span className="italic font-serif font-normal bg-gradient-to-r from-amber-200 via-amber-100 to-amber-400 bg-clip-text text-transparent">
                essential partner
              </span>
              <span className="block mt-0.5 sm:mt-1">
                for <span className="underline decoration-amber-500/70 underline-offset-4">hospitality success.</span>
              </span>
            </h3>

            {/* Subtitle */}
            <p className="text-[11px] sm:text-xs md:text-sm text-stone-200/90 font-light leading-relaxed max-w-md line-clamp-3 sm:line-clamp-none">
              We provide bars and restaurants with a <strong className="font-semibold text-white">premier selection of beverages</strong>, <strong className="font-semibold text-amber-200">expert consultancy</strong>, and <strong className="font-semibold text-white">bespoke solutions</strong> designed to elevate your brand and operations.
            </p>

            {/* Buttons */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1 sm:pt-2">
              <div className="px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-white text-stone-950 text-[11px] sm:text-xs font-black shadow-md flex items-center gap-1.5 sm:gap-2">
                <span>ดูไวน์ทั้งหมด</span>
                <ArrowRight size={12} className="text-rose-700" />
              </div>
              <div className="px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl border border-white/20 bg-white/10 text-white text-[11px] sm:text-xs font-bold backdrop-blur-md">
                <span>เรียนรู้เพิ่มเติม</span>
              </div>
            </div>
          </div>

          {/* Floating bottle preview on right */}
          {floatingBottleUrl && (
            <div className="absolute bottom-1 right-2 sm:bottom-2 sm:right-4 w-20 sm:w-32 md:w-44 pointer-events-none drop-shadow-2xl opacity-60 sm:opacity-100">
              <img
                src={floatingBottleUrl}
                alt="Floating bottle"
                className="w-full h-auto object-contain max-h-[160px] sm:max-h-[260px] md:max-h-[300px]"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none'
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Form Controls: จัดการรูปภาพแบนเนอร์ ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* 1. รูปภาพพื้นหลังแบนเนอร์ (Main Hero Background) */}
        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl space-y-4 sm:space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <ImageIcon size={18} />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-white truncate">1. รูปภาพพื้นหลังแบนเนอร์ (Background Image)</h3>
                <p className="text-[10px] sm:text-[11px] text-slate-400">รูปภาพขนาดใหญ่ที่จะแสดงผลเต็มส่วนบนของหน้าแรก</p>
              </div>
            </div>
          </div>

          {/* Current URL Input */}
          <div className="space-y-1.5 sm:space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <LinkIcon size={12} className="text-amber-400" />
              <span>URL รูปภาพ หรือ ที่อยู่ไฟล์ในโปรเจกต์</span>
            </label>
            <input
              type="text"
              value={bannerImageUrl}
              onChange={(e) => setBannerImageUrl(e.target.value)}
              placeholder="เช่น /images/footer-pattern.jpg หรือ https://..."
              className="w-full px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white text-xs focus:border-amber-400 focus:outline-none transition-all font-mono break-all"
            />
          </div>

          {/* Upload Button */}
          <div className="space-y-1.5 sm:space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Upload size={12} className="text-amber-400" />
              <span>หรือ อัปโหลดรูปภาพใหม่จากเครื่อง</span>
            </label>
            <label className="flex flex-col items-center justify-center p-3.5 sm:p-4 border-2 border-dashed border-white/15 rounded-xl sm:rounded-2xl hover:border-amber-400/50 hover:bg-white/5 cursor-pointer transition-all group">
              <Upload size={20} className="text-slate-400 group-hover:text-amber-400 transition-colors mb-1" />
              <span className="text-xs font-bold text-slate-300 text-center">คลิกเพื่อเลือกไฟล์รูปภาพ (JPG, PNG, WebP)</span>
              <span className="text-[10px] text-slate-500 mt-0.5 text-center">ระบบจะแปลงเป็น Base64 และซิงค์ขึ้นหน้าแรกทันที</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleBannerUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Quick Preset Selector */}
          <div className="space-y-2 pt-1 sm:pt-2">
            <label className="text-xs font-bold text-slate-300">พรีเซ็ตแนะนำสำหรับ The Bottle Club:</label>
            <div className="grid grid-cols-1 gap-2">
              {BANNER_PRESETS.map((p) => {
                const isSelected = bannerImageUrl === p.url
                return (
                  <button
                    key={p.url}
                    type="button"
                    onClick={() => setBannerImageUrl(p.url)}
                    className={`p-2.5 sm:p-3 rounded-xl border text-left flex items-start sm:items-center justify-between gap-2.5 transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/10 text-white shadow-sm'
                        : 'border-white/10 bg-slate-950/40 text-slate-300 hover:border-white/20'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <strong className="block text-xs font-bold text-white leading-tight">{p.name}</strong>
                      <span className="text-[10px] sm:text-[11px] text-slate-400 leading-snug line-clamp-2 mt-0.5">{p.desc}</span>
                    </div>
                    {isSelected && (
                      <span className="p-1 rounded-full bg-amber-500 text-stone-950 shrink-0 mt-0.5 sm:mt-0">
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* 2. รูปภาพขวดไวน์ลอย (Floating Bottle Image) & ป้ายข้อความ */}
        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl space-y-4 sm:space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                <Layers size={18} />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-white truncate">2. รูปภาพขวดไวน์ลอย (Floating Bottle Image)</h3>
                <p className="text-[10px] sm:text-[11px] text-slate-400">ภาพขวดไวน์พื้นหลังใส (PNG) แสดงผลมุมขวาล่าง</p>
              </div>
            </div>
          </div>

          {/* Bottle URL Input */}
          <div className="space-y-1.5 sm:space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <LinkIcon size={12} className="text-rose-400" />
              <span>URL รูปภาพขวดไวน์ (PNG พื้นใส)</span>
            </label>
            <input
              type="text"
              value={floatingBottleUrl}
              onChange={(e) => setFloatingBottleUrl(e.target.value)}
              placeholder="เช่น /images/wine_hero.png (เว้นว่างไว้เพื่อซ่อน)"
              className="w-full px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white text-xs focus:border-rose-400 focus:outline-none transition-all font-mono break-all"
            />
          </div>

          {/* Bottle Upload */}
          <div className="space-y-1.5 sm:space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Upload size={12} className="text-rose-400" />
              <span>หรือ อัปโหลดรูปขวดไวน์ใหม่ (PNG พื้นใส)</span>
            </label>
            <label className="flex flex-col items-center justify-center p-3 sm:p-3.5 border-2 border-dashed border-white/15 rounded-xl sm:rounded-2xl hover:border-rose-400/50 hover:bg-white/5 cursor-pointer transition-all group">
              <Upload size={20} className="text-slate-400 group-hover:text-rose-400 transition-colors mb-1" />
              <span className="text-xs font-bold text-slate-300 text-center">คลิกเพื่อเลือกไฟล์ขวด PNG</span>
              <input
                type="file"
                accept="image/png,image/webp"
                onChange={handleBottleUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Quick Bottle Presets */}
          <div className="space-y-2 pt-1 sm:pt-2">
            <label className="text-xs font-bold text-slate-300">ตัวเลือกขวดไวน์ลอย:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {BOTTLE_PRESETS.map((bp) => {
                const isSel = floatingBottleUrl === bp.url
                return (
                  <button
                    key={bp.name}
                    type="button"
                    onClick={() => setFloatingBottleUrl(bp.url)}
                    className={`p-2.5 sm:p-3 rounded-xl border text-center transition-all ${
                      isSel
                        ? 'border-rose-500 bg-rose-500/10 text-white font-bold'
                        : 'border-white/10 bg-slate-950/40 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <span className="text-xs truncate block">{bp.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ข้อความป้ายต้อนรับ (Welcome Badge) */}
          <div className="pt-3 border-t border-white/10 space-y-1.5 sm:space-y-2">
            <label className="text-xs font-bold text-slate-300">ข้อความป้ายต้อนรับ (Badge Pill):</label>
            <input
              type="text"
              value={badgeText}
              onChange={(e) => setBadgeText(e.target.value)}
              placeholder="ยินดีต้อนรับสู่ The Bottle Club"
              className="w-full px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white text-xs focus:border-amber-400 focus:outline-none transition-all"
            />
          </div>

          {/* สถานะการแสดงผล */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block">เปิดใช้งานแบนเนอร์หน้าร้าน</span>
              <span className="text-[10px] sm:text-[11px] text-slate-400">หากปิด จะใช้แบนเนอร์สำรองของระบบ</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        </div>
      </div>

      {/* ── Bottom Save Action Bar ── */}
      <div className="p-3.5 sm:p-5 rounded-2xl bg-slate-900/95 border border-amber-500/30 backdrop-blur-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 sticky bottom-2 sm:bottom-4 shadow-2xl z-30">
        <div className="text-center sm:text-left">
          <p className="text-xs font-bold text-white">พร้อมอัปเดตรูปภาพแบนเนอร์หน้าแรกหรือไม่?</p>
          <p className="text-[10px] sm:text-[11px] text-slate-400">ระบบจะบันทึกลง Database และเขียนไฟล์ซิงค์ตรงไปยัง Projectbottleclub1 ทันที</p>
        </div>

        <button
          onClick={handleSaveBanner}
          disabled={saving || loading}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-amber-500 via-rose-600 to-amber-600 hover:from-amber-400 hover:to-rose-500 text-white text-xs sm:text-sm font-black shadow-lg shadow-amber-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer min-h-[44px]"
        >
          {saving ? (
            <>
              <RefreshCw size={15} className="animate-spin" />
              <span>กำลังบันทึกและซิงค์...</span>
            </>
          ) : (
            <>
              <Check size={16} strokeWidth={2.5} />
              <span>บันทึกและซิงค์แบนเนอร์</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
