import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { 
  Sparkles, 
  Clock, 
  ArrowLeft, 
  ArrowRight, 
  ShoppingBag, 
  Megaphone,
  Wine,
  Flame,
  Utensils,
  Monitor
} from 'lucide-react'
import { DEFAULT_PROMOTIONS } from '@/lib/mock-promotions'
import { Promotion } from '@/lib/types'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ id: string }>
}

async function getPromotionById(id: string): Promise<Promotion | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (supabaseUrl && serviceRoleKey) {
      const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
      const { data } = await supabase
        .from('promotions')
        .select('*')
        .eq('id', id)
        .single()
      if (data) return data as Promotion

      // Check settings fallback
      const { data: settingData } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'promotions')
        .single()
      if (settingData?.value) {
        const parsed = typeof settingData.value === 'string' ? JSON.parse(settingData.value) : settingData.value
        if (Array.isArray(parsed)) {
          const found = parsed.find((p: any) => String(p.id) === id)
          if (found) return found
        }
      }
    }
  } catch (err) {
    console.error('Error fetching promotion:', err)
  }

  const defaultFound = DEFAULT_PROMOTIONS.find(p => String(p.id) === id)
  return defaultFound || null
}

async function getAllPromotions(): Promise<Promotion[]> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (supabaseUrl && serviceRoleKey) {
      const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
      const { data } = await supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
      if (data && data.length > 0) return data as Promotion[]

      const { data: settingData } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'promotions')
        .single()
      if (settingData?.value) {
        const parsed = typeof settingData.value === 'string' ? JSON.parse(settingData.value) : settingData.value
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((p: any) => p.is_active)
        }
      }
    }
  } catch (err) {
    console.error('Error fetching all promotions:', err)
  }
  return DEFAULT_PROMOTIONS.filter(p => p.is_active)
}

export default async function AdminPromotionDetailPage({ params }: Props) {
  const resolvedParams = await params
  const id = resolvedParams?.id

  if (!id) {
    notFound()
  }

  const [promo, allPromos] = await Promise.all([
    getPromotionById(id),
    getAllPromotions(),
  ])

  if (!promo) {
    notFound()
  }

  const bannerImg = promo.image_url || '/wine_banner.png'
  const otherPromos = allPromos.filter(p => String(p.id) !== id)

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 selection:bg-rose-500 selection:text-white relative overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[500px] bg-rose-900/15 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 right-10 w-[500px] h-[500px] bg-purple-900/15 rounded-full blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] opacity-40" />
      </div>

      {/* Top Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-white/10 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-rose-500/40 p-0.5 bg-gradient-to-br from-rose-600 to-purple-800 shadow-[0_0_15px_rgba(225,29,72,0.3)] transition-transform group-hover:scale-105">
              <img src="/thebottleclub.jpg" alt="Logo" className="w-full h-full object-cover rounded-lg" />
            </div>
            <div>
              <span className="text-base sm:text-lg font-black tracking-tight text-white group-hover:text-rose-300 transition-colors">
                THE BOTTLE CLUB
              </span>
              <span className="block text-[10px] font-bold text-rose-400 tracking-widest uppercase">
                Fine Wine & Bistro
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-300">
            <Link href="/#promotions" className="hover:text-rose-400 transition-colors flex items-center gap-1.5">
              <Flame size={14} className="text-rose-400" />
              <span>โปรโมชั่นพิเศษ</span>
            </Link>
            <Link href="/menu?table=1-10" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
              <Utensils size={14} className="text-amber-400" />
              <span>เมนูดิจิทัล (QR โต๊ะ)</span>
            </Link>
            <Link href="/pos" className="hover:text-cyan-400 transition-colors flex items-center gap-1.5">
              <Monitor size={14} className="text-cyan-400" />
              <span>หน้าร้าน POS</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-xs sm:text-sm text-slate-400">
          <Link href="/" className="hover:text-white transition-colors">
            หน้าแรก
          </Link>
          <span>/</span>
          <Link href="/#promotions" className="hover:text-white transition-colors">
            โปรโมชั่นพิเศษ
          </Link>
          <span>/</span>
          <span className="text-rose-300 font-semibold truncate max-w-[200px] sm:max-w-md">
            {promo.title}
          </span>
        </nav>

        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-300 hover:text-white transition-colors group"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 group-hover:bg-white/20 transition-colors">
              <ArrowLeft size={16} />
            </div>
            <span>กลับสู่หน้าแรก</span>
          </Link>
        </div>

        {/* Detail Card */}
        <article className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 shadow-2xl backdrop-blur-xl">
          {/* Visual Banner */}
          <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] max-h-[460px] overflow-hidden bg-slate-950">
            <img
              src={bannerImg}
              alt={promo.title}
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

            {/* Badges */}
            <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex flex-wrap items-center gap-2 z-10">
              {promo.badge && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-3.5 py-1.5 text-xs font-black uppercase tracking-wider text-white shadow-lg">
                  <Sparkles size={14} />
                  <span>{promo.badge}</span>
                </span>
              )}
              {promo.discount_tag && (
                <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-black uppercase tracking-wider text-slate-950 shadow-md">
                  {promo.discount_tag}
                </span>
              )}
            </div>

            {promo.valid_until && (
              <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-10">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/70 px-3.5 py-1.5 text-xs font-bold text-white/90 backdrop-blur-md border border-white/10 shadow-md">
                  <Clock size={14} className="text-rose-400" />
                  <span>{promo.valid_until}</span>
                </span>
              </div>
            )}
          </div>

          {/* Details Content */}
          <div className="p-6 sm:p-10 lg:p-12">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-3.5 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-rose-400">
              <Megaphone size={14} />
              <span>THE BOTTLE CLUB PROMOTION</span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              {promo.title}
            </h1>

            {promo.subtitle && (
              <p className="mt-3 text-base sm:text-xl font-bold text-rose-300">
                {promo.subtitle}
              </p>
            )}

            <div className="my-6 sm:my-8 h-px w-full bg-gradient-to-r from-rose-500/30 via-white/10 to-transparent" />

            <div className="space-y-4">
              <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Wine size={18} className="text-rose-400" />
                <span>รายละเอียดโปรโมชั่นและสิทธิพิเศษ</span>
              </h3>
              <p className="text-base sm:text-lg leading-relaxed whitespace-pre-line text-slate-300">
                {promo.description}
              </p>
            </div>

            <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row items-center gap-4 pt-6 border-t border-white/10">
              <Link
                href={promo.link_url || '/#products'}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 px-8 py-4 text-sm sm:text-base font-black uppercase tracking-wider text-white shadow-[0_4px_20px_rgba(225,29,72,0.4)] transition-all hover:scale-[1.02] active:scale-95"
              >
                <ShoppingBag size={20} />
                <span>{promo.cta_text || 'เลือกซื้อสินค้าที่ร่วมรายการ'}</span>
                <ArrowRight size={20} />
              </Link>

              <Link
                href="/"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-4 text-sm font-bold text-slate-200 transition-all hover:bg-white/10 active:scale-95"
              >
                <span>ย้อนกลับไปหน้าแรก</span>
              </Link>
            </div>
          </div>
        </article>

        {/* Other Promotions Section */}
        {otherPromos.length > 0 && (
          <section className="mt-14 sm:mt-20">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  โปรโมชั่นพิเศษอื่นๆ
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  เลือกดูข้อเสนอพิเศษอื่นๆ จาก The Bottle Club
                </p>
              </div>
              <Link
                href="/#promotions"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-rose-400 hover:underline"
              >
                <span>ดูทั้งหมด</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherPromos.map(item => (
                <div
                  key={item.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-rose-500/30"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-950">
                    <img
                      src={item.image_url || '/wine_banner.png'}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="rounded-full bg-rose-600 px-2.5 py-1 text-[10px] font-black uppercase text-white shadow">
                        {item.badge || 'PROMO'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-5">
                    <div>
                      {item.discount_tag && (
                        <span className="text-[11px] font-extrabold text-amber-400 block mb-1">
                          {item.discount_tag}
                        </span>
                      )}
                      <h3 className="text-base font-black text-white line-clamp-1 group-hover:text-rose-400 transition-colors">
                        {item.title}
                      </h3>
                      <p className="mt-1.5 text-xs text-slate-300 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                      {item.valid_until ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                          <Clock size={12} />
                          <span>{item.valid_until}</span>
                        </span>
                      ) : <span />}

                      <Link
                        href={`/promotions/${item.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-rose-400 group-hover:translate-x-0.5 transition-transform"
                      >
                        <span>ดูรายละเอียด</span>
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
