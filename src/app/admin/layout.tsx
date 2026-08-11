'use client'

import './admin-theme.css'
import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/lib/types'
import { getRoleLabel } from '@/lib/utils'
import {
  BarChart3, ChevronRight, CircleUserRound, LayoutDashboard,
  LogOut, Menu, Package, QrCode, Receipt, Settings,
  ShoppingCart, Tag, UserCog, Warehouse, Wine, Sparkles, CreditCard, Users, Star, Clock
} from 'lucide-react'
import Heartbeat from '@/components/Heartbeat'
import AdminAIChat from '@/components/admin/AdminAIChat'
import { INITIAL_PROFILES } from '@/lib/mock-data'

// 🍷 Section 1: ProjectbottleClub1 (E-Commerce Web Store Admin)
const bottleClubNavItems = [
  { href: '/admin/bottleclub',          icon: LayoutDashboard, label: 'Dashboard Web Wine',   roles: ['super_admin', 'manager'] },
  { href: '/admin/bottleclub/orders',   icon: ShoppingCart,    label: 'คำสั่งซื้อออนไลน์',     roles: ['super_admin', 'manager'] },
  { href: '/admin/bottleclub/payments', icon: CreditCard,      label: 'ตรวจสอบสลิปโอนเงิน',   roles: ['super_admin', 'manager'] },
  { href: '/admin/bottleclub/products', icon: Wine,            label: 'จัดการสินค้า Web Wine', roles: ['super_admin', 'manager'] },
  { href: '/admin/bottleclub/members',  icon: Users,           label: 'สมาชิก & แต้มสะสม',    roles: ['super_admin', 'manager'] },
  { href: '/admin/bottleclub/reviews',  icon: Star,            label: 'รีวิวไวน์จากลูกค้า',    roles: ['super_admin', 'manager'] },
  { href: '/admin/bottleclub/reports',  icon: BarChart3,       label: 'รายงานยอดขาย e-Com',  roles: ['super_admin', 'manager'] },
  { href: '/admin/bottleclub/settings', icon: Settings,        label: 'ตั้งค่าร้านค้า e-Com', roles: ['super_admin', 'manager'] },
]

// 🖥️ Section 2: Admin Project POS (Store Cashier & Operations)
const posNavItems = [
  { href: '/admin/analytics',  icon: BarChart3,       label: 'Analytics รวม',        roles: ['super_admin', 'manager'] },
  { href: '/admin',            icon: LayoutDashboard, label: 'Dashboard POS',        roles: ['super_admin', 'manager'] },
  { href: '/admin/pos',        icon: ShoppingCart,    label: 'หน้าขาย (POS Terminal)', roles: ['super_admin', 'manager', 'cashier'] },
  { href: '/admin/billing',    icon: Receipt,         label: 'รับชำระบิล & ใบเสร็จ', roles: ['super_admin', 'manager', 'cashier'] },
  { href: '/admin/products',   icon: Package,         label: 'จัดการสินค้า POS',    roles: ['super_admin', 'manager'] },
  { href: '/admin/categories', icon: Tag,             label: 'หมวดหมู่ POS',        roles: ['super_admin', 'manager'] },
  { href: '/admin/inventory',  icon: Warehouse,       label: 'สต็อกสินค้าหน้าร้าน',   roles: ['super_admin', 'manager', 'stock_staff'] },
  { href: '/admin/reports',    icon: BarChart3,       label: 'รายงานภาษี & ยอดขาย', roles: ['super_admin', 'manager'] },
  { href: '/admin/qrcode',     icon: QrCode,          label: 'QR เมนูดิจิทัล',       roles: ['super_admin', 'manager'] },
  { href: '/admin/users',      icon: UserCog,         label: 'ผู้ใช้งานพนักงาน',     roles: ['super_admin'] },
  { href: '/admin/settings',   icon: Settings,        label: 'ตั้งค่าระบบ',          roles: ['super_admin'] },
]

type SidebarProps = {
  onLogout: () => void
  onNavigate: () => void
  pathname: string
  profile: Profile | null
  onSwitchProfile: (p: Profile) => void
}

function SidebarContent({ onLogout, onNavigate, pathname, profile, onSwitchProfile }: SidebarProps) {
  const isRoleAllowed = (roles: string[]) => !profile?.role || roles.includes(profile.role)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top cyan line */}
      <div style={{ height: 2, background: 'linear-gradient(to right, transparent, #00d4ff 30%, #9d4edd 70%, transparent)', flexShrink: 0 }} />

      {/* Brand Header */}
      <div style={{ padding: '16px 14px 12px', borderBottom: '1px solid rgba(0,212,255,0.08)', flexShrink: 0 }}>
        <Link href="/admin" onClick={onNavigate} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              position: 'absolute', inset: -6, borderRadius: 14, opacity: 0.4,
              background: 'radial-gradient(circle, rgba(0,212,255,0.35) 0%, transparent 70%)'
            }} />
            <img
              src="/logo.jpg"
              alt="The Bottle Club Logo"
              style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0, position: 'relative',
                objectFit: 'contain', background: '#e6d0a7', padding: 2,
                border: '1px solid rgba(0,212,255,0.25)',
              }}
            />
            <span style={{
              position: 'absolute', bottom: -2, right: -2, width: 10, height: 10,
              background: '#00e676', borderRadius: '50%', border: '2px solid #060a14',
              boxShadow: '0 0 8px rgba(0,230,118,0.8)'
            }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#e8f0ff', fontFamily: "'Outfit', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              The Bottle Club
            </p>
            <p style={{ margin: 0, fontSize: 9, color: '#00d4ff', letterSpacing: '0.12em', fontWeight: 700, opacity: 0.7 }}>
              SUPER ADMIN MASTER
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation Sections */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 10px', scrollbarWidth: 'none' }}>
        
        {/* POS Shortcut Button */}
        <Link
          href="/admin/pos" onClick={onNavigate}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 10px', borderRadius: 10, marginBottom: 14,
            textDecoration: 'none', fontSize: 12, fontWeight: 700,
            color: '#00d4ff',
            background: 'linear-gradient(135deg, rgba(0,212,255,0.12), rgba(0,191,165,0.08))',
            border: '1px solid rgba(0,212,255,0.25)',
            boxShadow: '0 4px 14px rgba(0,212,255,0.10)',
            transition: 'all 150ms'
          }}
        >
          <ShoppingCart size={15} style={{ color: '#00d4ff' }} />
          <span style={{ flex: 1 }}>หน้าขาย (POS Console)</span>
          <ChevronRight size={14} style={{ color: '#00bfa5' }} />
        </Link>

        {/* ── 🍷 HALF 1: PROJECTBOTTLECLUB1 (E-COMMERCE WEB STORE) ── */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 6px 6px' }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: '#00bfa5', letterSpacing: '0.1em' }}>
              🍷 ตั้งค่า Web Wine
            </p>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#00bfa5', background: 'rgba(0,191,165,0.10)', padding: '1px 5px', borderRadius: 4, border: '1px solid rgba(0,191,165,0.20)' }}>
              WEB E-COM
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {bottleClubNavItems.filter(item => isRoleAllowed(item.roles)).map(item => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.href} href={item.href} onClick={onNavigate}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', borderRadius: 8, textDecoration: 'none',
                    fontSize: 12, fontWeight: isActive ? 700 : 500,
                    background: isActive ? 'rgba(0,212,255,0.12)' : 'transparent',
                    color: isActive ? '#00d4ff' : '#4a5a78',
                    border: `1px solid ${isActive ? 'rgba(0,212,255,0.30)' : 'transparent'}`,
                    boxShadow: isActive ? '0 2px 12px rgba(0,212,255,0.12)' : 'none',
                    transition: 'all 150ms'
                  }}
                >
                  <Icon size={14} style={{ color: isActive ? '#00d4ff' : '#2a3a58' }} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* ── 🖥️ HALF 2: ADMIN PROJECT POS (STORE CASHIER & OPERATIONS) ── */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 6px 6px' }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: '#bf7fff', letterSpacing: '0.1em' }}>
              🖥️ ตั้งค่า POS
            </p>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#bf7fff', background: 'rgba(157,78,221,0.10)', padding: '1px 5px', borderRadius: 4, border: '1px solid rgba(157,78,221,0.20)' }}>
              STORE POS
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {posNavItems.filter(item => isRoleAllowed(item.roles)).map(item => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.href} href={item.href} onClick={onNavigate}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', borderRadius: 8, textDecoration: 'none',
                    fontSize: 12, fontWeight: isActive ? 700 : 500,
                    background: isActive ? 'rgba(157,78,221,0.12)' : 'transparent',
                    color: isActive ? '#bf7fff' : '#4a5a78',
                    border: `1px solid ${isActive ? 'rgba(157,78,221,0.30)' : 'transparent'}`,
                    boxShadow: isActive ? '0 2px 12px rgba(157,78,221,0.12)' : 'none',
                    transition: 'all 150ms'
                  }}
                >
                  <Icon size={14} style={{ color: isActive ? '#bf7fff' : '#2a3a58' }} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>

      </nav>

      {/* User Footer */}
      <div style={{ padding: '10px', borderTop: '1px solid rgba(0,212,255,0.08)', flexShrink: 0, position: 'relative' }}>
        {profile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px', borderRadius: 9, background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.08)', marginBottom: 4 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9, flexShrink: 0,
              background: 'linear-gradient(135deg, rgba(0,212,255,0.25), rgba(157,78,221,0.25))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: '#00d4ff',
              border: '1px solid rgba(0,212,255,0.30)',
              boxShadow: '0 0 10px rgba(0,212,255,0.15)'
            }}>
              {profile.full_name.charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#e8f0ff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile.full_name}
              </p>
              <p style={{ margin: 0, fontSize: 10, color: '#00d4ff', fontWeight: 600, opacity: 0.7 }}>
                {getRoleLabel(profile.role)}
              </p>
            </div>
          </div>
        )}

        <button
          type="button" onClick={onLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, marginTop: 4,
            width: '100%', padding: '8px 10px', borderRadius: 9,
            border: '1px solid transparent', background: 'transparent',
            fontSize: 12, fontWeight: 600, color: '#2a3a58',
            cursor: 'pointer', textAlign: 'left', transition: 'all 150ms'
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ff4466'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,68,102,0.07)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,68,102,0.15)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#2a3a58'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent'; }}
        >
          <LogOut size={14} />
          ออกจากระบบ
        </button>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = useMemo(() => createClient(), [])
  const [profile, setProfile] = useState<Profile | null>(INITIAL_PROFILES[0])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [time, setTime] = useState('')

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    tick()
    const t = setInterval(tick, 1000)

    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
          if (data) setProfile(data)
        }
      } catch {
        // Use default profile
      }
    }
    load()
    return () => clearInterval(t)
  }, [supabase])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
    } catch {}
    router.push('/admin/login')
  }

  if (pathname === '/admin/login') {
    return <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>{children}</div>
  }

  return (
    <div style={{ display: 'flex', minHeight: '100dvh', background: '#060a14', position: 'relative' }}>
      {/* Nebula background */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: [
          'radial-gradient(ellipse at 15% 10%, rgba(0,212,255,0.05) 0%, transparent 50%)',
          'radial-gradient(ellipse at 85% 20%, rgba(157,78,221,0.06) 0%, transparent 45%)',
          'radial-gradient(ellipse at 50% 80%, rgba(0,191,165,0.04) 0%, transparent 50%)',
          'radial-gradient(ellipse at 90% 90%, rgba(245,158,11,0.03) 0%, transparent 40%)',
        ].join(', ')
      }} />

      {/* Menu Dropdown / Drawer (Computers & Mobile) */}
      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60 }}>
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
            onClick={() => setSidebarOpen(false)}
          />
          <aside
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'rgba(6,10,20,0.98)',
              borderRadius: '20px 20px 0 0',
              borderTop: '1px solid rgba(0,212,255,0.15)',
              maxHeight: '88dvh',
              maxWidth: 450, margin: '0 auto',
              display: 'flex', flexDirection: 'column',
              paddingBottom: 'env(safe-area-inset-bottom)',
              boxShadow: '0 -10px 50px rgba(0,0,0,0.8)'
            }}
          >
            <div style={{ width: 40, height: 4, background: 'rgba(0,212,255,0.20)', borderRadius: 999, margin: '10px auto 0', flexShrink: 0 }} />
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
              <SidebarContent
                onLogout={handleLogout}
                onNavigate={() => setSidebarOpen(false)}
                pathname={pathname}
                profile={profile}
                onSwitchProfile={(p) => setProfile(p)}
              />
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1, overflowX: 'hidden' }}>
        {/* Top Header */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 30,
          height: 58, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 12,
          padding: '0 16px',
          background: 'rgba(6, 10, 20, 0.95)',
          borderBottom: '1px solid rgba(0,212,255,0.08)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          flexShrink: 0,
          boxShadow: '0 2px 20px rgba(0,0,0,0.4)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            {/* Hamburger 3-lines button — computers & mobile */}
            <button
              type="button"
              onClick={() => setSidebarOpen(prev => !prev)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: 'rgba(0,212,255,0.08)',
                border: '1px solid rgba(0,212,255,0.20)',
                color: '#00d4ff', cursor: 'pointer',
                transition: 'all 150ms'
              }}
              aria-label="เปิดเมนู"
            >
              <Menu size={18} />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div className="hidden md:flex items-center gap-1.5" style={{
              fontFamily: "'JetBrains Mono', monospace", color: '#00d4ff', fontSize: 12, fontWeight: 700
            }}>
              <Clock size={13} style={{ color: '#00bfa5' }} />
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{time}</span>
            </div>

            <Link
              href="/admin/pos"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 12px', borderRadius: 9, textDecoration: 'none',
                background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(0,191,165,0.10))',
                border: '1px solid rgba(0,212,255,0.30)',
                color: '#00d4ff', fontSize: 12, fontWeight: 700,
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 16px rgba(0,212,255,0.12)'
              }}
            >
              <ShoppingCart size={13} style={{ color: '#00bfa5' }} />
              <span className="hidden sm:inline">เปิด POS Terminal</span>
            </Link>

            <div style={{
              width: 32, height: 32, borderRadius: 9, flexShrink: 0,
              background: 'linear-gradient(135deg, rgba(0,212,255,0.25), rgba(157,78,221,0.25))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: '#00d4ff',
              border: '1px solid rgba(0,212,255,0.30)',
              boxShadow: '0 0 10px rgba(0,212,255,0.15)'
            }}>
              {profile ? profile.full_name.charAt(0).toUpperCase() : <CircleUserRound size={16} />}
            </div>
          </div>
        </header>

        <main style={{ flex: 1, minWidth: 0, padding: 'clamp(8px, 3vw, 16px)', overflowX: 'hidden' }}>
          <Heartbeat />
          {children}
          <AdminAIChat />
        </main>
      </div>
    </div>
  )
}
