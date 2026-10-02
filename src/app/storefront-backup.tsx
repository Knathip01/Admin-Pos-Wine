'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Wine, Sparkles, ShoppingBag, QrCode, Monitor,
  ArrowRight, ShieldCheck, Truck, Clock, Star, Flame, Utensils
} from 'lucide-react'
import PromotionSection from '@/components/PromotionSection'

export default function StorefrontPage() {
  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 selection:bg-rose-500 selection:text-white relative overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[500px] bg-rose-900/15 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 right-10 w-[500px] h-[500px] bg-purple-900/15 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 left-10 w-[600px] h-[400px] bg-blue-900/10 rounded-full blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] opacity-40" />
      </div>

      {/* ── Top Navigation Bar ── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-white/10 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          {/* Brand */}
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

          {/* Quick Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-300">
            <a href="#promotions" className="hover:text-rose-400 transition-colors flex items-center gap-1.5">
              <Flame size={14} className="text-rose-400" />
              <span>โปรโมชั่นพิเศษ</span>
            </a>
            <Link href="/menu?table=1-10" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
              <Utensils size={14} className="text-amber-400" />
              <span>เมนูดิจิทัล (QR โต๊ะ)</span>
            </Link>
            <Link href="/pos" className="hover:text-cyan-400 transition-colors flex items-center gap-1.5">
              <Monitor size={14} className="text-cyan-400" />
              <span>หน้าร้าน POS</span>
            </Link>
          </nav>

          {/* Admin Hub Link */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/admin/analytics"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-[0_4px_16px_rgba(99,102,241,0.3)] border border-indigo-400/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>ระบบหลังบ้าน Admin Hub</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Content Area ── */}
      <main className="relative z-10">
        {/* Hero Welcome Bar */}
        <section className="pt-8 pb-4 text-center px-4 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold mb-4 shadow-inner">
              <Sparkles size={14} className="text-rose-400" />
              <span>THE BOTTLE CLUB • E-COMMERCE & WEB STORE</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white mb-3">
              คัดสรรไวน์ชั้นเลิศ <span className="bg-gradient-to-r from-rose-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">ส่งตรงถึงมือคุณ</span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
              สัมผัสประสบการณ์ดื่มด่ำกับไวน์ระดับโลกจากไร่องุ่นชั้นนำทั่วทุกมุมโลก พร้อมบริการจับคู่อาหารและส่งด่วนควบคุมอุณหภูมิ
            </p>
          </motion.div>
        </section>

        {/* ── Dynamic Promotions Section (ดึงข้อมูลอัตโนมัติจาก API /admin/promotions) ── */}
        <div id="promotions">
          <PromotionSection />
        </div>

        {/* ── Quick Feature highlights ── */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/10 mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
                <Wine size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-1">ไวน์แท้ 100% คัดพิเศษ</h4>
                <p className="text-xs text-slate-400 leading-relaxed">การันตีแหล่งกำเนิดและมาตรฐานการเก็บบ่มระดับสากล</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                <Utensils size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-1">ระบบจับคู่อาหาร & ไวน์</h4>
                <p className="text-xs text-slate-400 leading-relaxed">Chef & Sommelier Pairing พร้อมรับส่วนลดชุดคู่สุดคุ้ม</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
                <Truck size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-1">จัดส่งควบคุมอุณหภูมิ</h4>
                <p className="text-xs text-slate-400 leading-relaxed">รักษาคุณภาพและรสชาติตั้งแต่เซลลาร์ถึงปลายทาง</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-1">สิทธิประโยชน์สมาชิก</h4>
                <p className="text-xs text-slate-400 leading-relaxed">สะสมแต้มทุกยอดสั่งซื้อ แลกรับส่วนลดและของรางวัล</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Quick Storefront CTA ── */}
        <section className="py-10 px-4 max-w-4xl mx-auto text-center">
          <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-slate-900 via-rose-950/40 to-slate-900 border border-rose-500/20 shadow-2xl relative overflow-hidden">
            <h3 className="text-xl sm:text-2xl font-black text-white mb-2">
              ต้องการจัดการแคมเปญโปรโมชั่น หรือ บริหารจัดการร้าน?
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mb-6 max-w-xl mx-auto">
              เข้าสู่หน้าแอดมินเพื่อเพิ่มโปรโมชั่นใหม่, ตรวจสอบออเดอร์, และจัดการสินค้า
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/admin/promotions"
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm transition shadow-lg shadow-rose-900/40"
              >
                ⚙️ จัดการโปรโมชั่นใน Admin
              </Link>
              <Link
                href="/menu?table=1-10"
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 font-bold text-xs sm:text-sm border border-white/10 transition"
              >
                🍽️ เปิดเมนูดิจิทัล โต๊ะ 1-10
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="py-8 px-4 border-t border-white/10 text-center text-xs text-slate-500 relative z-10">
        <p>© 2026 The Bottle Club Fine Wine & Bistro. All rights reserved.</p>
        <p className="mt-1 text-slate-600">Admin & POS Wine Management System</p>
      </footer>
    </div>
  )
}
