'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, ShoppingCart, Package, Tag, Warehouse,
  BarChart3, QrCode, UserCog, Settings, LogOut, Menu, X, ArrowLeft, Wine
} from 'lucide-react';

const posNavItems = [
  { href: '/admin/pos-console', icon: LayoutDashboard, label: 'ภาพรวม POS Console' },
  { href: '/admin/pos',         icon: ShoppingCart,    label: 'หน้าจุดขาย (POS Terminal)' },
  { href: '/admin/billing',     icon: Tag,             label: 'รับชำระบิล & ใบเสร็จ' },
  { href: '/admin/inventory',   icon: Warehouse,       label: 'จัดการสต็อกหน้าร้าน' },
  { href: '/admin/reports',     icon: BarChart3,       label: 'รายงานภาษี & ยอดขาย' },
  { href: '/admin/qrcode',      icon: QrCode,          label: 'QR เมนูดิจิทัล' },
  { href: '/admin/users',       icon: UserCog,         label: 'ผู้ใช้งานพนักงาน' },
  { href: '/admin/settings',    icon: Settings,        label: 'ตั้งค่าระบบ POS' },
];

export default function StandalonePosConsoleLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#080d14] text-slate-100 flex flex-col font-sans">
      {/* Top Header for project pos */}
      <header className="sticky top-0 z-40 bg-[#0c1017]/95 backdrop-blur-md border-b border-slate-800 h-14 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-300"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div className="flex items-center gap-2">
            <Link href="/admin" className="flex items-center gap-1 text-xs text-slate-400 hover:text-blue-400 font-bold transition mr-2">
              <ArrowLeft size={14} /> กลับ Super Admin Hub
            </Link>
            <div className="w-8 h-8 rounded-xl bg-blue-900/80 border border-blue-500 flex items-center justify-center text-blue-300 font-black">
              🖥️
            </div>
            <div>
              <p className="text-sm font-black tracking-tight text-white leading-none">THE BOTTLE CLUB POS</p>
              <p className="text-[10px] font-bold text-blue-400 tracking-wider">PROJECT POS ADMIN CONSOLE</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/bottleclub"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-950 text-red-300 border border-red-800 hover:bg-red-900 transition"
          >
            <Wine size={14} /> สลับไป ProjectbottleClub1 →
          </Link>
          <Link
            href="/admin/pos"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-700 to-indigo-600 text-white shadow-md hover:opacity-90 transition"
          >
            <ShoppingCart size={14} /> เปิด POS Terminal
          </Link>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar Navigation */}
        <aside className={`fixed lg:sticky top-14 left-0 z-30 w-64 h-[calc(100vh-3.5rem)] bg-[#0a0e17] border-r border-slate-800 flex flex-col transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
          <div className="p-3 bg-blue-950/40 border-b border-blue-900/30">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-blue-400">PROJECT POS FRONTEND</p>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {posNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? 'bg-blue-900/40 text-blue-300 border border-blue-700/50 shadow-sm'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'text-blue-400' : 'text-slate-400'} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-3 border-t border-slate-800 text-xs text-slate-400 text-center">
            Admin POS Console v3.1
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
