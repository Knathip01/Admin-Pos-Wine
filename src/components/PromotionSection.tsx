'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import {
  Clock,
  Megaphone,
  Sparkles,
  Tag,
  Wine,
  ChevronLeft,
  ChevronRight,
  Images,
  Maximize2,
  X,
} from 'lucide-react'
import { Promotion } from '@/lib/types'
import { DEFAULT_PROMOTIONS } from '@/lib/mock-promotions'

interface PromotionSectionProps {
  initialPromotions?: Promotion[]
  title?: string
  subtitle?: string
}

// ── Interactive Banner Media Viewer for Admin-POS Storefront ──
function BannerMediaViewer({
  images,
  title,
  badge,
  discountTag,
  validUntil,
  onOpenLightbox,
}: {
  images: string[]
  title: string
  badge?: string
  discountTag?: string
  validUntil?: string
  onOpenLightbox: (images: string[], startIndex: number, title: string) => void
}) {
  const [activeImgIdx, setActiveImgIdx] = useState(0)
  const touchStart = useRef<number | null>(null)

  const safeImages = images && images.length > 0 ? images : ['/wine_banner.png']
  const currentImg = safeImages[activeImgIdx] || safeImages[0]

  const nextImg = (e: React.MouseEvent) => {
    e.stopPropagation()
    setActiveImgIdx((prev) => (prev + 1) % safeImages.length)
  }

  const prevImg = (e: React.MouseEvent) => {
    e.stopPropagation()
    setActiveImgIdx((prev) => (prev - 1 + safeImages.length) % safeImages.length)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return
    const diff = touchStart.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 30) {
      if (diff > 0) {
        setActiveImgIdx((prev) => (prev + 1) % safeImages.length)
      } else {
        setActiveImgIdx((prev) => (prev - 1 + safeImages.length) % safeImages.length)
      }
    }
    touchStart.current = null
  }

  return (
    <div
      className="group/img relative aspect-[4/5] w-full overflow-hidden bg-slate-950 cursor-pointer select-none"
      onClick={() => onOpenLightbox(safeImages, activeImgIdx, title)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Ambient background blur */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img
          src={currentImg}
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover object-center blur-xl opacity-35 scale-110"
        />
      </div>

      {/* Main Full Image (Uncropped, Full Display) */}
      <img
        src={currentImg}
        alt={title || 'Promotion'}
        className="w-full h-full object-contain object-center transition-transform duration-500 group-hover/img:scale-105 relative z-10"
      />

      {/* Subtle gentle hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-slate-950/10 pointer-events-none z-10 opacity-50 group-hover/img:opacity-70 transition-opacity" />

      {/* Top Badges (Left) */}
      <div className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4 flex flex-wrap items-center gap-2 z-20">
        {badge && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-md">
            <Sparkles size={12} />
            <span>{badge}</span>
          </span>
        )}
        {discountTag && (
          <span className="rounded-full bg-amber-400 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-slate-950 shadow-md">
            {discountTag}
          </span>
        )}
      </div>

      {/* Multi-image count badge (Top Right) */}
      {safeImages.length > 1 && (
        <div className="absolute top-3.5 right-3.5 z-20 flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-black text-white backdrop-blur-md border border-white/15 shadow">
          <Images size={12} className="text-rose-400" />
          <span>{activeImgIdx + 1} / {safeImages.length} รูป</span>
        </div>
      )}

      {/* Prev / Next controls for multiple images */}
      {safeImages.length > 1 && (
        <>
          <button
            type="button"
            onClick={prevImg}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md border border-white/20 opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-black/90 active:scale-95 cursor-pointer shadow-md"
            aria-label="Previous photo"
          >
            <ChevronLeft size={16} />
          </button>

          <button
            type="button"
            onClick={nextImg}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md border border-white/20 opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-black/90 active:scale-95 cursor-pointer shadow-md"
            aria-label="Next photo"
          >
            <ChevronRight size={16} />
          </button>

          {/* Dots Indicator at bottom */}
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 p-1 rounded-full bg-black/40 backdrop-blur-sm">
            {safeImages.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setActiveImgIdx(i)
                }}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  activeImgIdx === i ? 'w-4 bg-rose-500' : 'w-1.5 bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Photo ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}

      {/* Valid Until Tag (Bottom Right on Banner) */}
      {validUntil && (
        <div className="absolute bottom-3 right-3 sm:bottom-3.5 sm:right-3.5 z-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1 text-[11px] font-bold text-white/90 backdrop-blur-md border border-white/10 shadow-sm">
            <Clock size={12} className="text-rose-400" />
            <span>{validUntil}</span>
          </span>
        </div>
      )}

      {/* Hover Zoom hint */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover/img:opacity-100 transition-opacity">
        <div className="flex items-center gap-1.5 rounded-full bg-black/65 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-md border border-white/20 shadow-lg">
          <Maximize2 size={13} className="text-rose-400" />
          <span>คลิกดูรูปขยาย</span>
        </div>
      </div>
    </div>
  )
}

// ── Lightbox Modal Component for Admin-POS Storefront ──
function PromotionLightbox({
  isOpen,
  images,
  initialIndex,
  title,
  onClose,
}: {
  isOpen: boolean
  images: string[]
  initialIndex: number
  title: string
  onClose: () => void
}) {
  const [idx, setIdx] = useState(initialIndex)

  useEffect(() => {
    setIdx(initialIndex)
  }, [initialIndex, isOpen])

  if (!isOpen || images.length === 0) return null

  const currentImg = images[idx] || images[0]

  const next = () => setIdx((prev) => (prev + 1) % images.length)
  const prev = () => setIdx((prev) => (prev - 1 + images.length) % images.length)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-lg animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="w-full flex items-center justify-between pb-3 text-white">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm sm:text-base truncate max-w-md">{title}</span>
            {images.length > 1 && (
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-bold">
                {idx + 1} / {images.length}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Main Large Image (Expands to full height up to 82vh) */}
        <div className="relative w-full h-[72vh] sm:h-[80vh] max-h-[85vh] rounded-2xl overflow-hidden bg-black/90 shadow-2xl border border-white/10 flex items-center justify-center">
          <img
            src={currentImg}
            alt={title}
            className="w-full h-full object-contain object-center"
          />

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/90 transition shadow-lg cursor-pointer"
                aria-label="Previous photo"
              >
                <ChevronLeft size={22} />
              </button>

              <button
                type="button"
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/90 transition shadow-lg cursor-pointer"
                aria-label="Next photo"
              >
                <ChevronRight size={22} />
              </button>
            </>
          )}
        </div>

        {/* Thumbnails strip below */}
        {images.length > 1 && (
          <div className="flex items-center gap-2 pt-3 overflow-x-auto max-w-full">
            {images.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIdx(i)}
                className={`relative w-12 h-15 sm:w-14 sm:h-18 rounded-lg overflow-hidden border-2 transition cursor-pointer shrink-0 ${
                  idx === i ? 'border-rose-500 scale-105' : 'border-white/20 opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={img}
                  alt={`Thumbnail ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main PromotionSection Component ──
export default function PromotionSection({
  initialPromotions,
  title = 'ข่าวสารและโปรโมชั่นพิเศษ',
  subtitle = 'อัปเดตข้อมูลข่าวสาร สิทธิพิเศษ และโปรโมชั่นลดราคาล่าสุดจาก The Bottle Club',
}: PromotionSectionProps) {
  const [promotions, setPromotions] = useState<Promotion[]>(initialPromotions || DEFAULT_PROMOTIONS)

  // Lightbox Modal state
  const [lightbox, setLightbox] = useState<{
    isOpen: boolean
    images: string[]
    startIndex: number
    title: string
  }>({
    isOpen: false,
    images: [],
    startIndex: 0,
    title: '',
  })

  const fetchPromotions = async () => {
    try {
      const res = await fetch('/api/promotions', { cache: 'no-store' })
      if (res.ok) {
        const json = await res.json()
        if (json.promotions && Array.isArray(json.promotions) && json.promotions.length > 0) {
          setPromotions(json.promotions)
          return
        }
      }
    } catch (err) {
      console.error('Failed to load promotions from API:', err)
    }
  }

  useEffect(() => {
    fetchPromotions()
  }, [])

  const activePromos = promotions.filter(p => p.is_active)
  const count = activePromos.length

  // Triple the list for an infinite, seamless continuous carousel sliding to the left
  const displayList = count > 0 ? [...activePromos, ...activePromos, ...activePromos] : []

  const [currentIndex, setCurrentIndex] = useState(count)
  const [isTransitioning, setIsTransitioning] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const touchStartX = useRef<number | null>(null)

  // Reset index when count changes
  useEffect(() => {
    setCurrentIndex(count)
  }, [count])

  const nextSlide = useCallback(() => {
    if (count <= 1) return
    setIsTransitioning(true)
    setCurrentIndex((prev) => prev + 1)
  }, [count])

  const prevSlide = useCallback(() => {
    if (count <= 1) return
    setIsTransitioning(true)
    setCurrentIndex((prev) => prev - 1)
  }, [count])

  // Auto-slide to the left every 3.5 seconds
  useEffect(() => {
    if (count <= 1 || isPaused || lightbox.isOpen) return
    const timer = setInterval(() => {
      nextSlide()
    }, 3500)
    return () => clearInterval(timer)
  }, [count, isPaused, lightbox.isOpen, nextSlide])

  // Handle seamless infinite loop on transition end
  const handleTransitionEnd = () => {
    if (currentIndex >= count * 2) {
      setIsTransitioning(false)
      setCurrentIndex(currentIndex - count)
    } else if (currentIndex < count) {
      setIsTransitioning(false)
      setCurrentIndex(currentIndex + count)
    }
  }

  // Re-enable transitioning after instant jump
  useEffect(() => {
    if (!isTransitioning) {
      const raf = requestAnimationFrame(() => {
        setIsTransitioning(true)
      })
      return () => cancelAnimationFrame(raf)
    }
  }, [isTransitioning])

  if (count === 0) return null

  // Active dot indicator (0 .. count - 1)
  const activeDot = ((currentIndex % count) + count) % count

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 40) {
      if (diff > 0) nextSlide()
      else prevSlide()
    }
    touchStartX.current = null
  }

  const handleOpenLightbox = (imgs: string[], startIdx: number, promoTitle: string) => {
    setLightbox({
      isOpen: true,
      images: imgs,
      startIndex: startIdx,
      title: promoTitle,
    })
  }

  return (
    <section className="py-12 sm:py-16 bg-[#0a0d14] border-t border-white/10 relative overflow-hidden" id="promotions">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-rose-950/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header with Left / Right Navigation */}
        <div className="mb-8 sm:mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="mb-2.5 inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-4 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-rose-400">
              <Megaphone size={14} className="text-rose-400" />
              <span>NEWS & SPECIAL PROMOTIONS</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1.5 max-w-2xl text-xs sm:text-sm text-slate-400">
                {subtitle}
              </p>
            )}
          </div>

          {/* Navigation Controls */}
          {count > 1 && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={prevSlide}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-slate-200 shadow-sm backdrop-blur-md transition-all hover:bg-white/10 hover:border-white/30 active:scale-95 cursor-pointer"
                aria-label="Previous promotion banner"
              >
                <ChevronLeft size={18} />
              </button>

              <button
                type="button"
                onClick={nextSlide}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-slate-200 shadow-sm backdrop-blur-md transition-all hover:bg-white/10 hover:border-white/30 active:scale-95 cursor-pointer"
                aria-label="Next promotion banner"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        {/* ── Auto-scroll Banner Carousel (เลื่อนไปทางซ้ายอัตโนมัติ) ── */}
        <div
          className="relative w-full overflow-hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Sliding Track */}
          <div
            className="flex gap-6 [--cards-visible:1] md:[--cards-visible:2] lg:[--cards-visible:3]"
            style={{
              transform: `translateX(calc(-1 * ${currentIndex} * (100% + 24px) / var(--cards-visible, 1)))`,
              transition: isTransitioning ? 'transform 700ms cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
            }}
            onTransitionEnd={handleTransitionEnd}
          >
            {displayList.map((item, idx) => {
              const allImages =
                Array.isArray(item.images) && item.images.length > 0
                  ? item.images
                  : [item.image_url || '/wine_banner.png']

              return (
                <article
                  key={`${item.id || 'promo'}-${idx}`}
                  className="w-full md:w-[calc((100%-24px)/2)] lg:w-[calc((100%-48px)/3)] shrink-0 flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-rose-500/30 hover:shadow-[0_8px_30px_rgba(225,29,72,0.15)]"
                >
                  {/* ── 1. Top Banner Visual Area (Interactive Multi-Image Slider) ── */}
                  <BannerMediaViewer
                    images={allImages}
                    title={item.title}
                    badge={item.badge}
                    discountTag={item.discount_tag}
                    validUntil={item.valid_until}
                    onOpenLightbox={handleOpenLightbox}
                  />

                  {/* ── 2. Sub-information Inside Each Banner (ข้อมูลย่อยข้างใน) ── */}
                  <div className="flex flex-1 flex-col justify-between p-6 sm:p-7">
                    <div>
                      {/* Discount Summary Tag if present */}
                      {item.discount_tag && (
                        <div className="mb-2 flex items-center gap-1.5 text-xs font-black text-rose-400">
                          <Tag size={14} className="text-rose-400" />
                          <span>โปรโมชั่นพิเศษ: {item.discount_tag}</span>
                        </div>
                      )}

                      {/* Headline / Title */}
                      <h3 className="text-lg sm:text-xl font-black text-white leading-snug">
                        {item.title}
                      </h3>

                      {/* Subtitle */}
                      {item.subtitle && (
                        <p className="mt-1 text-xs sm:text-sm font-bold text-rose-300">
                          {item.subtitle}
                        </p>
                      )}

                      {/* Divider */}
                      <div className="my-3.5 h-px w-full bg-white/10" />

                      {/* Sub-description (รายละเอียดโปรโมชั่นลดราคา ข้อมูลย่อย) */}
                      <p className="text-xs sm:text-sm leading-relaxed text-slate-300 whitespace-pre-line line-clamp-4">
                        {item.description}
                      </p>
                    </div>

                    {/* Sub-info Bottom Bar: Status / Highlights (No external click link) */}
                    <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                      <div className="inline-flex items-center gap-1.5 text-slate-300 font-semibold">
                        <Wine size={14} className="text-rose-400" />
                        <span>The Bottle Club Exclusive</span>
                      </div>

                      {item.valid_until && (
                        <span className="text-[11px] font-medium text-slate-400">
                          {item.valid_until}
                        </span>
                      )}
                    </div>

                  </div>
                </article>
              )
            })}
          </div>
        </div>

        {/* ── Pagination Indicator Dots ── */}
        {count > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            {activePromos.map((_, dotIdx) => (
              <button
                key={dotIdx}
                type="button"
                onClick={() => {
                  setIsTransitioning(true)
                  setCurrentIndex(count + dotIdx)
                }}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  activeDot === dotIdx
                    ? 'w-8 bg-rose-500'
                    : 'w-2 bg-white/20 hover:bg-white/40'
                }`}
                aria-label={`Go to slide ${dotIdx + 1}`}
              />
            ))}
          </div>
        )}

      </div>

      {/* ── Lightbox Modal for Fullscreen Photo Viewing ── */}
      <PromotionLightbox
        isOpen={lightbox.isOpen}
        images={lightbox.images}
        initialIndex={lightbox.startIndex}
        title={lightbox.title}
        onClose={() => setLightbox((prev) => ({ ...prev, isOpen: false }))}
      />
    </section>
  )
}
