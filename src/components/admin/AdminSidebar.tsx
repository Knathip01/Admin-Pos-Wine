'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ShoppingCart, Wine, Users, Star,
  Monitor, BarChart3, Settings, LogOut,
  ChevronLeft, ChevronRight, Menu, X, CreditCard, Zap,
} from 'lucide-react';
import CartoonBottleIcon from '@/components/icons/CartoonBottleIcon';

interface SidebarProps {
  admin?: { name: string | null; email: string; role: string };
}

const menuSections = [
  {
    label: 'MAIN',
    items: [
      { title: 'แดชบอร์ด', icon: LayoutDashboard, href: '/admin/bottleclub', badge: null },
    ],
  },
  {
    label: 'COMMERCE',
    items: [
      { title: 'ออเดอร์ทั้งหมด',      icon: ShoppingCart, href: '/admin/orders',   badge: null },
      { title: 'ตรวจสอบการชำระเงิน', icon: CreditCard,   href: '/admin/payments', badge: null },
      { title: 'จัดการสินค้า POS',     icon: Wine,         href: '/admin/products', badge: null },
      { title: 'จัดการสมาชิก',         icon: Users,        href: '/admin/members',  badge: null },
      { title: 'รีวิวสินค้า',           icon: Star,         href: '/admin/reviews',  badge: null },
    ],
  },
  {
    label: 'OPERATIONS',
    items: [
      { title: 'จุดขายหน้าร้าน', icon: Monitor,  href: '/admin/pos',      badge: 'LIVE' },
      { title: 'รายงานยอดขาย',  icon: BarChart3, href: '/admin/reports',  badge: null },
      { title: 'ตั้งค่าร้านค้า', icon: Settings, href: '/admin/settings', badge: null },
    ],
  },
  {
    label: 'AI',
    items: [
      { title: 'AI วิเคราะห์ธุรกิจ', icon: CartoonBottleIcon, href: '#ai-chat', badge: null },
    ],
  },
];

function getInitials(name?: string | null, email?: string) {
  if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  if (email) return email.slice(0, 2).toUpperCase();
  return 'AD';
}

const menuContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.1 },
  },
};

const menuItemVariants = {
  hidden: { opacity: 0, x: -16 },
  show: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

export default function AdminSidebar({ admin = { name: 'Super Admin', email: 'admin@bottleclub.com', role: 'superadmin' } }: SidebarProps) {
  const pathname   = usePathname();
  const [collapsed, setCollapsed]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileOpen) setMobileOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [mobileOpen]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleLogout = async () => {
    if (confirm('คุณต้องการออกจากระบบใช่หรือไม่?')) {
      window.location.href = '/admin';
    }
  };

  const touchStartX = React.useRef(0);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 60) setMobileOpen(false);
  }, []);

  const NavContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex flex-col h-full overflow-hidden select-none">
      {/* Top cyan gradient line */}
      <div className="h-[2px] w-full shrink-0" style={{
        background: 'linear-gradient(to right, transparent, #00d4ff 30%, #9d4edd 70%, transparent)'
      }} />

      {/* Logo */}
      <div className={`flex items-center gap-3 px-5 py-4 border-b shrink-0 ${collapsed && !isMobile ? 'justify-center px-3' : ''}`}
        style={{ borderColor: 'rgba(0,212,255,0.08)' }}>
        <div className="relative shrink-0">
          <div className="absolute -inset-1.5 rounded-xl opacity-40"
            style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.35) 0%, transparent 70%)' }} />
          <img src="/logo.jpg" alt="The Bottle Club"
            className="relative w-10 h-10 rounded-xl object-contain bg-[#e6d0a7] p-0.5"
            style={{ border: '1px solid rgba(0,212,255,0.25)' }} />
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full"
            style={{ border: '2px solid #060a14', boxShadow: '0 0 8px rgba(0,230,118,0.8)' }} />
        </div>
        {(!collapsed || isMobile) && (
          <div className="min-w-0 flex-1">
            <p className="font-black text-sm tracking-tight leading-none truncate"
              style={{ fontFamily: "'Outfit', sans-serif", color: '#e8f0ff' }}>
              THE BOTTLE CLUB
            </p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                admin?.role === 'superadmin'
                  ? 'text-amber-300'
                  : 'text-cyan-300'
              }`} style={{
                background: admin?.role === 'superadmin'
                  ? 'rgba(245,158,11,0.12)'
                  : 'rgba(0,212,255,0.12)',
                border: admin?.role === 'superadmin'
                  ? '1px solid rgba(245,158,11,0.3)'
                  : '1px solid rgba(0,212,255,0.3)',
              }}>
                {admin?.role === 'superadmin' ? '⚡ Super Admin' : '● Staff'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <motion.nav
        className="flex-1 px-3 py-4 overflow-y-auto no-scrollbar space-y-4"
        variants={isMobile ? menuContainerVariants : undefined}
        initial={isMobile ? 'hidden' : undefined}
        animate={isMobile ? 'show' : undefined}
      >
        {menuSections.map((section) => (
          <div key={section.label}>
            {(!collapsed || isMobile) && (
              <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] px-3 mb-1.5"
                style={{ color: '#1a2840' }}>
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon    = item.icon;
                const isActive = pathname === item.href || (item.href !== '#' && pathname.startsWith(item.href + '/'));
                const isAction = item.href.startsWith('#');

                const itemClass = `flex items-center gap-3 px-3 py-2.5 text-sm font-semibold transition-all duration-200 relative group ${
                  isActive ? 'sidebar-nav-active' : 'sidebar-nav-inactive'
                } ${collapsed && !isMobile ? 'justify-center' : ''}`;

                const iconContent = (
                  <>
                    {isActive && (
                      <motion.span
                        className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-r-full"
                        style={{ background: 'linear-gradient(to bottom, #00d4ff, #00bfa5)' }}
                        layoutId={isMobile ? 'mobile-active-bar' : 'desktop-active-bar'}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}

                    <div className={`flex items-center justify-center w-8 h-8 rounded-xl shrink-0 transition-all duration-200 ${
                      isActive
                        ? 'bg-cyan-950'
                        : 'group-hover:bg-cyan-950/50'
                    }`}
                      style={isActive ? {
                        boxShadow: '0 2px 12px rgba(0,212,255,0.20)',
                        border: '1px solid rgba(0,212,255,0.25)',
                        background: 'rgba(0,212,255,0.10)',
                      } : {}}>
                      <Icon className={`w-4 h-4 transition-colors ${isActive ? '' : 'opacity-50 group-hover:opacity-80'}`}
                        style={{ color: isActive ? '#00d4ff' : '#4a5a78' }} />
                    </div>

                    {(!collapsed || isMobile) && (
                      <>
                        <span className={`flex-1 truncate text-sm ${isActive ? '' : ''}`}
                          style={{ color: isActive ? '#00d4ff' : '#4a5a78' }}>
                          {item.title}
                        </span>
                        {item.badge && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase"
                            style={{
                              background: 'rgba(0,230,118,0.10)',
                              border: '1px solid rgba(0,230,118,0.25)',
                              color: '#00e676',
                              boxShadow: '0 0 8px rgba(0,230,118,0.15)'
                            }}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </>
                );

                const navElement = isAction ? (
                  <button
                    type="button"
                    title={collapsed && !isMobile ? item.title : undefined}
                    onClick={() => {
                      setMobileOpen(false);
                      document.getElementById('admin-ai-chat-btn')?.click();
                    }}
                    className={itemClass + ' w-full text-left cursor-pointer'}
                  >
                    {iconContent}
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    title={collapsed && !isMobile ? item.title : undefined}
                    className={itemClass}
                  >
                    {iconContent}
                  </Link>
                );

                return isMobile ? (
                  <motion.div key={item.href} variants={menuItemVariants}>
                    {navElement}
                  </motion.div>
                ) : (
                  <React.Fragment key={item.href}>
                    {navElement}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        ))}
      </motion.nav>

      {/* Divider */}
      <div className="mx-4 mb-3 h-px" style={{
        background: 'linear-gradient(to right, transparent, rgba(0,212,255,0.10) 30%, rgba(0,212,255,0.10) 70%, transparent)'
      }} />

      {/* User Footer */}
      <div className={`px-3 pb-4 shrink-0 ${collapsed && !isMobile ? 'flex justify-center' : ''}`}>
        {collapsed && !isMobile ? (
          <button onClick={handleLogout} title="ออกจากระบบ"
            className="w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 cursor-pointer"
            style={{ color: '#2a3a58' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#00d4ff'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,212,255,0.08)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#2a3a58'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
            <LogOut className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex items-center gap-3 p-2.5 rounded-xl transition-colors"
            style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.08)' }}>
            <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[11px] font-black text-white"
              style={{
                background: 'linear-gradient(135deg, #00d4ff22, #9d4edd22)',
                border: '1px solid rgba(0,212,255,0.35)',
                color: '#00d4ff',
                boxShadow: '0 0 12px rgba(0,212,255,0.20)'
              }}>
              {getInitials(admin?.name, admin?.email)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate leading-none" style={{ color: '#e8f0ff' }}>
                {admin?.name || 'Admin'}
              </p>
              <p className="text-[10px] truncate mt-0.5" style={{ color: '#2a3a58' }}>
                {admin?.email || 'admin@bottleclub.com'}
              </p>
            </div>
            <button onClick={handleLogout} title="ออกจากระบบ"
              className="p-1.5 rounded-lg transition-all duration-200 cursor-pointer shrink-0"
              style={{ color: '#2a3a58' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#00d4ff'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,212,255,0.08)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#2a3a58'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <div className="lg:hidden fixed top-3 left-3 z-50">
        <motion.button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2.5 rounded-2xl cursor-pointer"
          style={{
            background: 'rgba(6, 10, 20, 0.95)',
            border: '1px solid rgba(0,212,255,0.15)',
            backdropFilter: 'blur(16px) saturate(1.8)',
            WebkitBackdropFilter: 'blur(16px) saturate(1.8)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5), 0 0 16px rgba(0,212,255,0.05)',
          }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          <AnimatePresence mode="wait">
            {mobileOpen ? (
              <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <X className="w-5 h-5" style={{ color: '#00d4ff' }} />
              </motion.div>
            ) : (
              <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <Menu className="w-5 h-5" style={{ color: '#7a8faf' }} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="lg:hidden admin-drawer-overlay-2027"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="lg:hidden admin-drawer-2027"
            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <NavContent isMobile={true} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className={`hidden lg:block shrink-0 h-screen sticky top-0 z-30 transition-all duration-300 ease-out ${collapsed ? 'w-[68px]' : 'w-[256px]'}`}
        style={{
          background: 'rgba(6, 10, 20, 0.97)',
          backdropFilter: 'blur(28px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(28px) saturate(1.8)',
          borderRight: '1px solid rgba(0,212,255,0.08)',
          boxShadow: '4px 0 40px rgba(0,0,0,0.7), 1px 0 0 rgba(0,212,255,0.04)',
        }}
      >
        <NavContent isMobile={false} />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute bottom-[90px] right-[-13px] flex items-center justify-center rounded-full transition-all duration-200 shadow-md cursor-pointer z-40"
          style={{
            width: 26, height: 26,
            background: 'rgba(13,21,38,0.95)',
            border: '1px solid rgba(0,212,255,0.25)',
            color: '#00d4ff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4), 0 0 12px rgba(0,212,255,0.15)'
          }}
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>
    </>
  );
}
