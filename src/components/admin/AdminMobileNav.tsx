'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, ShoppingCart, Wine, BarChart3, Monitor,
} from 'lucide-react';

const navItems = [
  { href: '/admin/bottleclub', label: 'หน้าหลัก', icon: LayoutDashboard },
  { href: '/admin/orders',    label: 'ออเดอร์', icon: ShoppingCart },
  { href: '/admin/products',  label: 'สินค้า',  icon: Wine },
  { href: '/admin/reports',   label: 'รายงาน', icon: BarChart3 },
  { href: '/admin/pos',       label: 'POS',     icon: Monitor },
];

export default function AdminMobileNav() {
  const pathname = usePathname();

  return (
    <motion.nav
      className="admin-mobile-nav-2027 lg:hidden"
      aria-label="เมนูหลัก"
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 24, delay: 0.3 }}
    >
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(href + '/');
        return (
          <Link
            key={href}
            href={href}
            className={`admin-mobile-nav-item-2027 admin-touch-tap ${isActive ? 'active' : ''}`}
          >
            <motion.div
              className="relative flex items-center justify-center"
              animate={isActive ? { scale: 1 } : { scale: 1 }}
              whileTap={{ scale: 0.85 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              {isActive && (
                <motion.div
                  className="absolute inset-0 rounded-xl"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1.6, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  style={{
                    background: 'radial-gradient(circle, rgba(196,30,58,0.12) 0%, transparent 70%)',
                  }}
                />
              )}
              <Icon
                className={isActive ? 'text-red-600 relative z-10' : 'relative z-10'}
                strokeWidth={isActive ? 2.5 : 1.8}
                style={isActive ? {
                  filter: 'drop-shadow(0 2px 6px rgba(196,30,58,0.35))',
                } : undefined}
              />
            </motion.div>
            <motion.span
              className="leading-none"
              animate={{
                fontWeight: isActive ? 800 : 700,
                color: isActive ? '#f87171' : '#475569',
              }}
              transition={{ duration: 0.2 }}
            >
              {label}
            </motion.span>
          </Link>
        );
      })}
    </motion.nav>
  );
}
