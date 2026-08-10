'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Search, ChevronRight, Home, X, Zap } from 'lucide-react';

const sectionMap: Record<string, { label: string; emoji: string }> = {
  bottleclub: { label: 'ภาพรวม E-Commerce', emoji: '🍷' },
  orders:    { label: 'คำสั่งซื้อออนไลน์',  emoji: '🛒' },
  products:  { label: 'จัดการสินค้า POS',   emoji: '📦' },
  members:   { label: 'สมาชิก & แต้มสะสม', emoji: '👥' },
  reviews:   { label: 'รีวิวสินค้า',        emoji: '⭐' },
  pos:       { label: 'จุดขายหน้าร้าน (POS)', emoji: '🖥️' },
  reports:   { label: 'รายงานยอดขาย',       emoji: '📈' },
  settings:  { label: 'ตั้งค่าร้านค้า',     emoji: '⚙️' },
  payments:  { label: 'ตรวจสอบการชำระเงิน', emoji: '💳' },
};

function useCurrentTime() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export default function AdminHeader() {
  const pathname = usePathname();
  const time     = useCurrentTime();
  const [focused, setFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [notifCount] = useState(3);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const prevSectionRef = useRef<string>('');

  useEffect(() => { setMounted(true); }, []);

  const segments = pathname.split('/').filter(Boolean);
  const crumbs   = segments.map((seg, idx) => ({
    seg,
    label: sectionMap[seg]?.label ?? (seg.charAt(0).toUpperCase() + seg.slice(1)),
    href:  '/' + segments.slice(0, idx + 1).join('/'),
    isLast: idx === segments.length - 1,
  }));
  const current = sectionMap[segments[segments.length - 1]];
  const today   = mounted
    ? new Date().toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' })
    : '';

  const currentKey = segments[segments.length - 1] || 'admin';
  useEffect(() => { prevSectionRef.current = currentKey; }, [currentKey]);

  useEffect(() => {
    if (mobileSearchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [mobileSearchOpen]);

  return (
    <header
      className="admin-header-2027 sticky top-0 z-20 select-none"
      style={{
        background: 'rgba(6, 10, 20, 0.96)',
        backdropFilter: 'blur(24px) saturate(1.8)',
        WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
        borderBottom: '1px solid rgba(0,212,255,0.08)',
        boxShadow: '0 2px 20px rgba(0,0,0,0.5), 0 1px 0 rgba(0,212,255,0.04) inset',
      }}
    >
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8" style={{ height: 58, minHeight: 58 }}>
        {/* Left: breadcrumb + title */}
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <div className="hidden sm:flex items-center gap-1 text-[10px] font-semibold tracking-wider" style={{ color: '#1a2840' }}>
            <Home className="w-3 h-3" style={{ color: '#1a2840' }} />
            {crumbs.map((c) => (
              <React.Fragment key={c.href}>
                <ChevronRight className="w-3 h-3" style={{ color: '#1a2840' }} />
                <span className={c.isLast ? 'font-bold' : ''} style={{ color: c.isLast ? '#4a5a78' : '#1a2840' }}>
                  {c.label}
                </span>
              </React.Fragment>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.h1
              key={currentKey}
              className="text-sm sm:text-base font-black leading-none tracking-tight truncate"
              style={{ fontFamily: "'Outfit', sans-serif", color: '#e8f0ff' }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              {current ? `${current.emoji} ${current.label}` : '🚀 Admin Panel'}
            </motion.h1>
          </AnimatePresence>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Clock pill (mobile) */}
          <div className="flex sm:hidden min-w-[50px] justify-end">
            {mounted && (
              <div className="admin-clock-pill">
                <span className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
                <span>{time.slice(0, 5)}</span>
              </div>
            )}
          </div>

          {/* Clock (desktop) */}
          <div className="hidden md:flex flex-col items-end justify-center min-h-[28px] min-w-[70px]">
            {mounted ? (
              <>
                <span className="font-mono text-xs font-bold tabular-nums leading-none" style={{ color: '#00d4ff' }}>{time}</span>
                <span className="text-[10px] font-medium leading-none mt-0.5 truncate max-w-[200px]" style={{ color: '#2a3a58' }}>{today}</span>
              </>
            ) : (
              <div className="h-5 w-16 rounded animate-pulse" style={{ background: 'rgba(0,212,255,0.06)' }} />
            )}
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px h-8" style={{ background: 'rgba(0,212,255,0.10)' }} />

          {/* Mobile search toggle */}
          <motion.button
            className="sm:hidden w-9 h-9 flex items-center justify-center rounded-xl cursor-pointer"
            style={{
              background: 'rgba(0,212,255,0.05)',
              border: '1px solid rgba(0,212,255,0.12)',
              color: '#4a5a78'
            }}
            aria-label="ค้นหา"
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            {mobileSearchOpen ? <X className="w-4 h-4" style={{ color: '#00d4ff' }} /> : <Search className="w-4 h-4" />}
          </motion.button>

          {/* Desktop search */}
          <div className="relative hidden sm:block">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none transition-colors duration-200 ${focused ? '' : ''}`}
              style={{ color: focused ? '#00d4ff' : '#2a3a58' }} />
            <input
              type="text"
              placeholder="ค้นหาด่วน..."
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              className="w-44 lg:w-56 pl-9 pr-10 py-2 text-xs rounded-xl transition-all duration-250"
              style={{
                background: focused ? 'rgba(0,212,255,0.06)' : 'rgba(255,255,255,0.03)',
                border: focused ? '1px solid rgba(0,212,255,0.40)' : '1px solid rgba(255,255,255,0.07)',
                color: '#e8f0ff',
                boxShadow: focused ? '0 0 0 3px rgba(0,212,255,0.08)' : 'none',
                outline: 'none',
                fontFamily: "'Inter', sans-serif",
              }}
            />
            <kbd className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none">
              <span className="text-[9px] font-bold px-1 py-0.5 rounded" style={{
                color: '#2a3a58',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)'
              }}>⌘K</span>
            </kbd>
          </div>

          {/* Online badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
            style={{ background: 'rgba(0,230,118,0.07)', border: '1px solid rgba(0,230,118,0.18)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#00e676' }}>Online</span>
          </div>

          {/* Notification bell */}
          <motion.button
            className="relative w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200 cursor-pointer group"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#4a5a78'
            }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            whileHover={{
              background: 'rgba(0,212,255,0.08)',
              borderColor: 'rgba(0,212,255,0.20)',
            }}
          >
            <Bell className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" style={{ color: '#7a8faf' }} />
            {notifCount > 0 && (
              <motion.span
                className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white"
                style={{ background: 'linear-gradient(135deg, #ff4466, #e040fb)', boxShadow: '0 0 8px rgba(255,68,102,0.6)' }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                {notifCount}
              </motion.span>
            )}
          </motion.button>

          {/* Profile Avatar */}
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl cursor-pointer transition-all duration-200"
            style={{
              background: 'rgba(0,212,255,0.06)',
              border: '1px solid rgba(0,212,255,0.14)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,212,255,0.28)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,212,255,0.14)'; }}
          >
            <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[11px] font-black"
              style={{
                background: 'linear-gradient(135deg, rgba(0,212,255,0.30), rgba(157,78,221,0.30))',
                border: '1px solid rgba(0,212,255,0.35)',
                color: '#00d4ff',
                boxShadow: '0 0 10px rgba(0,212,255,0.20)',
              }}>
              SA
            </div>
            <span className="hidden lg:block text-xs font-bold" style={{ color: '#e8f0ff' }}>Admin</span>
          </div>
        </div>
      </div>

      {/* Mobile search expanded */}
      <AnimatePresence>
        {mobileSearchOpen && (
          <motion.div
            className="admin-header-search-expanded sm:hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#00d4ff' }} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="ค้นหาออเดอร์, สินค้า, สมาชิก..."
                className="w-full pl-10 pr-4 py-3 text-sm rounded-2xl"
                style={{
                  background: 'rgba(13,21,38,0.95)',
                  border: '1px solid rgba(0,212,255,0.25)',
                  color: '#e8f0ff',
                  boxShadow: '0 0 0 3px rgba(0,212,255,0.06)',
                  outline: 'none',
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
