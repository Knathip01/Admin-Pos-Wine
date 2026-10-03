'use client'

import './admin-theme.css'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Profile } from '@/lib/types'
import { getRoleLabel } from '@/lib/utils'
import { authApi } from '@/lib/api/auth'
import { useApiAuth, ensureApiAuth } from '@/lib/store/api-auth'
import {
  BarChart3, ChevronLeft, ChevronRight, CircleUserRound, LayoutDashboard,
  LogOut, Menu, Package, QrCode, Receipt, Settings,
  ShoppingCart, Tag, UserCog, Warehouse, Wine, CreditCard, Users, Star, Clock,
  Moon, Sun, Sparkles
} from 'lucide-react'
import Heartbeat from '@/components/Heartbeat'
import AdminAIChat from '@/components/admin/AdminAIChat'
// 🍷 Section 1: ProjectbottleClub1 (E-Commerce Web Store Admin)
const bottleClubNavItems = [
  { href: '/admin/bottleclub',          icon: LayoutDashboard, label: 'Dashboard Web Wine',     roles: ['super_admin', 'manager'] },
  { href: '/admin/promotions',          icon: Sparkles,        label: 'จัดการโปรโมชั่น Web Wine', roles: ['super_admin', 'manager'] },
  { href: '/admin/bottleclub/orders',   icon: ShoppingCart,    label: 'คำสั่งซื้อออนไลน์',       roles: ['super_admin', 'manager'] },
  { href: '/admin/bottleclub/payments', icon: CreditCard,      label: 'ตรวจสอบสลิปโอนเงิน',     roles: ['super_admin', 'manager'] },
  { href: '/admin/bottleclub/products', icon: Wine,            label: 'จัดการสินค้า Web Wine',   roles: ['super_admin', 'manager'] },
  { href: '/admin/bottleclub/members',  icon: Users,           label: 'สมาชิก & แต้มสะสม',      roles: ['super_admin', 'manager'] },
  { href: '/admin/bottleclub/reviews',  icon: Star,            label: 'รีวิวไวน์จากลูกค้า',      roles: ['super_admin', 'manager'] },
  { href: '/admin/bottleclub/reports',  icon: BarChart3,       label: 'รายงานยอดขาย e-Com',    roles: ['super_admin', 'manager'] },
  { href: '/admin/bottleclub/settings', icon: Settings,        label: 'ตั้งค่าร้านค้า e-Com',   roles: ['super_admin', 'manager'] },
]

// 🖥️ Section 2: Admin Project POS (Store Cashier & Operations)
const posNavItems = [
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
  collapsed?: boolean
}

function SidebarContent({ onLogout, onNavigate, pathname, profile, collapsed = false }: SidebarProps) {
  const isRoleAllowed = (roles: string[]) => !profile?.role || roles.includes(profile.role)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Top gradient bar */}
      <div className="sidebar-top-bar" />

      {/* Brand Header */}
      <Link href="/admin/analytics" onClick={onNavigate} className="sidebar-brand" style={collapsed ? { justifyContent: 'center', padding: '15px 0' } : {}}>
        <div className="sidebar-brand-logo-wrap">
          <img src="/thebottleclub.jpg" alt="The Bottle Club" className="sidebar-brand-logo" />
          <span className="sidebar-brand-dot" />
        </div>
        {!collapsed && (
          <div style={{ minWidth: 0, flex: 1 }}>
            <p className="sidebar-brand-name">The Bottle Club</p>
            <span className="sidebar-brand-role">
              {profile?.role === 'super_admin' || !profile ? '⚡ Super Admin' : '● Staff'}
            </span>
          </div>
        )}
      </Link>

      {/* Nav scroll */}
      <div className="sidebar-nav-scroll">

        {/* Quick Action Buttons */}
        {!collapsed && (
          <>
            <Link href="/admin/analytics" onClick={onNavigate} className="sidebar-quick-btn analytics">
              <BarChart3 size={15} />
              <span style={{ flex: 1 }}>Analytics รวม</span>
              <ChevronRight size={13} />
            </Link>
            <Link href="/admin/pos" onClick={onNavigate} className="sidebar-quick-btn pos-console">
              <ShoppingCart size={15} />
              <span style={{ flex: 1 }}>หน้าขาย (POS Console)</span>
              <ChevronRight size={13} />
            </Link>
          </>
        )}
        {collapsed && (
          <>
            <Link href="/admin/analytics" onClick={onNavigate} title="Analytics รวม"
              style={{ display: 'flex', justifyContent: 'center', padding: '7px 0', marginBottom: 6, borderRadius: 10,
                color: '#00e676', background: 'rgba(0,230,118,0.10)', border: '1px solid rgba(0,230,118,0.20)',
                textDecoration: 'none', transition: 'all 0.18s ease' }}>
              <BarChart3 size={16} />
            </Link>
            <Link href="/admin/pos" onClick={onNavigate} title="หน้าขาย POS"
              style={{ display: 'flex', justifyContent: 'center', padding: '7px 0', marginBottom: 14, borderRadius: 10,
                color: '#22e5ff', background: 'rgba(0,212,255,0.09)', border: '1px solid rgba(0,212,255,0.18)',
                textDecoration: 'none', transition: 'all 0.18s ease' }}>
              <ShoppingCart size={16} />
            </Link>
          </>
        )}

        {/* ── 🍷 WEB E-COM SECTION ── */}
        <div style={{ marginBottom: 4 }}>
          {!collapsed && (
            <div className="sidebar-section-header">
              <span className="sidebar-section-title ecom">🍷 ตั้งค่า Web Wine</span>
              <span className="sidebar-section-badge ecom">WEB E-COM</span>
            </div>
          )}
          {collapsed && <div style={{ height: 1, margin: '4px 8px 10px', background: 'linear-gradient(to right, transparent, rgba(0,196,180,0.25), transparent)' }} />}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {bottleClubNavItems.filter(item => isRoleAllowed(item.roles)).map(item => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              const Icon = item.icon
              if (collapsed) {
                return (
                  <Link key={item.href} href={item.href} onClick={onNavigate} title={item.label}
                    style={{
                      display: 'flex', justifyContent: 'center', alignItems: 'center',
                      padding: '8px 0', borderRadius: 10, textDecoration: 'none',
                      background: isActive ? 'rgba(0,196,180,0.14)' : 'transparent',
                      border: `1px solid ${isActive ? 'rgba(0,196,180,0.30)' : 'transparent'}`,
                      color: isActive ? '#2dd4bf' : '#3a4d68',
                      transition: 'all 0.18s ease',
                    }}>
                    <Icon size={15} />
                  </Link>
                )
              }
              return (
                <Link key={item.href} href={item.href} onClick={onNavigate}
                  className={`sidebar-nav-item${isActive ? ' ecom-active' : ''}`}>
                  <span className="sidebar-nav-icon">
                    <Icon size={14} style={{ color: isActive ? '#2dd4bf' : '#2a3a58' }} />
                  </span>
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="sidebar-section-divider" />

        {/* ── 🖥️ STORE POS SECTION ── */}
        <div style={{ marginBottom: 12 }}>
          {!collapsed && (
            <div className="sidebar-section-header">
              <span className="sidebar-section-title pos">🖥️ ตั้งค่า POS</span>
              <span className="sidebar-section-badge pos">STORE POS</span>
            </div>
          )}
          {collapsed && <div style={{ height: 1, margin: '4px 8px 10px', background: 'linear-gradient(to right, transparent, rgba(157,78,221,0.25), transparent)' }} />}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {posNavItems.filter(item => isRoleAllowed(item.roles)).map(item => {
              const isActive = pathname === item.href
              const Icon = item.icon
              if (collapsed) {
                return (
                  <Link key={item.href} href={item.href} onClick={onNavigate} title={item.label}
                    style={{
                      display: 'flex', justifyContent: 'center', alignItems: 'center',
                      padding: '8px 0', borderRadius: 10, textDecoration: 'none',
                      background: isActive ? 'rgba(157,78,221,0.14)' : 'transparent',
                      border: `1px solid ${isActive ? 'rgba(157,78,221,0.30)' : 'transparent'}`,
                      color: isActive ? '#c084fc' : '#3a4d68',
                      transition: 'all 0.18s ease',
                    }}>
                    <Icon size={15} />
                  </Link>
                )
              }
              return (
                <Link key={item.href} href={item.href} onClick={onNavigate}
                  className={`sidebar-nav-item${isActive ? ' pos-active' : ''}`}>
                  <span className="sidebar-nav-icon">
                    <Icon size={14} style={{ color: isActive ? '#c084fc' : '#2a3a58' }} />
                  </span>
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* User Footer */}
      <div className="sidebar-footer">
        {profile && !collapsed && (
          <div className="sidebar-user-card">
            <div className="sidebar-user-avatar">
              {profile.full_name.charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p className="sidebar-user-name">{profile.full_name}</p>
              <p className="sidebar-user-role-label">{getRoleLabel(profile.role)}</p>
            </div>
          </div>
        )}
        {profile && collapsed && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
            <div className="sidebar-user-avatar" title={profile.full_name}>
              {profile.full_name.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
        <button type="button" onClick={onLogout} className="sidebar-logout-btn"
          style={collapsed ? { justifyContent: 'center', paddingLeft: 0, paddingRight: 0 } : {}}>
          <LogOut size={14} />
          {!collapsed && 'ออกจากระบบ'}
        </button>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { accessToken, profile: apiProfile, setProfile: setApiProfile, clear: clearApiAuth } = useApiAuth()
  const [profile, setProfile] = useState<Profile | null>({
    id: '1',
    full_name: 'superadmin',
    role: 'super_admin',
    is_active: true,
    created_at: new Date().toISOString(),
  })
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [desktopCollapsed, setDesktopCollapsed] = useState(false)
  const [time, setTime] = useState('')
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  // Load theme from localStorage
  useEffect(() => {
    try {
      const saved = (localStorage.getItem('admin_theme') as 'dark' | 'light') || 'dark'
      setTheme(saved)
      document.documentElement.setAttribute('data-theme', saved)
    } catch {}
  }, [])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    try {
      localStorage.setItem('admin_theme', next)
      document.documentElement.setAttribute('data-theme', next)
    } catch {}
  }

  // Close mobile sidebar on route change
  useEffect(() => { setMobileSidebarOpen(false) }, [pathname])

  // Escape key closes mobile sidebar
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileSidebarOpen(false) }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    document.body.style.overflow = mobileSidebarOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileSidebarOpen])

  // Clock tick interval
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  // Sync API Profile to Admin Header
  useEffect(() => {
    let active = true

    if (apiProfile) {
      const isSuper = apiProfile.is_superadmin === true ||
        apiProfile.username?.toLowerCase().includes('superadmin') ||
        apiProfile.display_name?.toLowerCase().includes('superadmin') ||
        apiProfile.email?.toLowerCase().includes('superadmin') ||
        apiProfile.roles?.[0]?.role_name?.toLowerCase().includes('admin') ||
        true

      const role = isSuper ? 'super_admin'
        : apiProfile.roles?.[0]?.role_name?.toLowerCase().includes('cashier') ? 'cashier'
        : apiProfile.roles?.[0]?.role_name?.toLowerCase().includes('stock') ? 'stock_staff'
        : 'super_admin'

      setProfile({
        id: String(apiProfile.id || 1),
        full_name: apiProfile.display_name || apiProfile.full_name || apiProfile.username || 'superadmin',
        role,
        is_active: apiProfile.is_active ?? true,
        created_at: new Date().toISOString(),
      })
      return
    }

    const load = async () => {
      try {
        const token = accessToken || await ensureApiAuth()
        if (!token || !active) return
        const me = await authApi.me(token)
        if (!active) return
        setApiProfile(me)
      } catch {
        // Fallback default
      }
    }
    load()

    return () => { active = false }
  }, [accessToken, apiProfile, setApiProfile])

  const handleLogout = async () => {
    clearApiAuth()
    router.push('/admin/login')
  }

  if (pathname === '/admin/login') {
    return <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>{children}</div>
  }

  return (
    <div
      className={`admin-shell-container theme-${theme}`}
      data-theme={theme}
      style={{
        display: 'flex',
        minHeight: '100dvh',
        background: 'var(--admin-bg, #0f1117)',
        color: 'var(--admin-text, #f1f5f9)',
        position: 'relative',
        transition: 'background-color 0.25s ease, color 0.25s ease'
      }}
    >
      {/* Subtle background gradient */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: 'var(--admin-bg-gradient, radial-gradient(ellipse at 10% 5%, rgba(99,102,241,0.08) 0%, transparent 50%))'
      }} />

      {/* ══ DESKTOP SIDEBAR (lg+) ══ */}
      <aside className={`sidebar-desktop${desktopCollapsed ? ' collapsed' : ''}`}>
        <SidebarContent
          onLogout={handleLogout}
          onNavigate={() => {}}
          pathname={pathname}
          profile={profile}
          onSwitchProfile={(p) => setProfile(p)}
          collapsed={desktopCollapsed}
        />
        <button
          type="button"
          onClick={() => setDesktopCollapsed(p => !p)}
          className="sidebar-collapse-btn"
          title={desktopCollapsed ? 'ขยาย sidebar' : 'ย่อ sidebar'}
        >
          {desktopCollapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </aside>

      {/* ══ MOBILE OVERLAY + DRAWER ══ */}
      {mobileSidebarOpen && (
        <div className="sidebar-mobile-overlay" onClick={() => setMobileSidebarOpen(false)}>
          <div className="sidebar-mobile-drawer" onClick={e => e.stopPropagation()}>
            <SidebarContent
              onLogout={handleLogout}
              onNavigate={() => setMobileSidebarOpen(false)}
              pathname={pathname}
              profile={profile}
              onSwitchProfile={(p) => setProfile(p)}
            />
          </div>
        </div>
      )}

      {/* ══ MAIN CONTENT AREA ══ */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1, overflowX: 'clip', maxWidth: '100%' }}>

        {/* Top Header — Clean Premium style */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 30,
          height: 60, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 12,
          padding: '0 20px',
          background: 'var(--admin-topbar-bg, rgba(17, 24, 39, 0.97))',
          borderBottom: '1px solid var(--admin-border, rgba(255,255,255,0.07))',
          backdropFilter: 'blur(24px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
          flexShrink: 0,
          boxShadow: theme === 'dark' ? '0 1px 0 rgba(255,255,255,0.04) inset, 0 4px 20px rgba(0,0,0,0.30)' : '0 1px 3px rgba(0,0,0,0.05)',
          transition: 'background-color 0.25s ease, border-color 0.25s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            {/* Hamburger — mobile only */}
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(prev => !prev)}
              className="sidebar-hamburger lg:hidden"
              aria-label="เปิดเมนู"
            >
              <Menu size={18} />
            </button>

            {/* Brand — mobile only */}
            <Link href="/admin/analytics" className="lg:hidden flex items-center gap-2" style={{
              textDecoration: 'none', minWidth: 0,
            }}>
              <img src="/thebottleclub.jpg" alt="logo"
                style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'contain', background: '#e6d0a7',
                  border: '1.5px solid rgba(99,102,241,0.30)', flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--admin-text, #f1f5f9)',
                fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", letterSpacing: '-0.02em',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                The Bottle Club
              </span>
            </Link>

            {/* Page breadcrumb — desktop */}
            <div className="hidden lg:flex items-center gap-2">
              <span style={{ fontSize: 12, color: 'var(--admin-text-muted, #64748b)', fontWeight: 500 }}>
                {pathname.startsWith('/admin/bottleclub') ? '🍷 Web Wine' : '🖥️ POS Store'}
              </span>
              <span style={{ color: 'var(--admin-border-strong, #334155)', fontSize: 12 }}>/</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-sec, #94a3b8)' }}>
                {pathname === '/admin' || pathname === '/admin/' ? 'Dashboard'
                  : pathname.split('/').filter(Boolean).pop()?.replace(/-/g, ' ')
                    .replace(/^\w/, c => c.toUpperCase()) || 'Admin'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {/* Clock */}
            <div className="hidden md:flex items-center gap-1.5 admin-clock-pill">
              <Clock size={12} />
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{time}</span>
            </div>

            {/* Dark / Light Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="admin-topbar-icon-btn"
              title={theme === 'dark' ? 'สลับเป็นโหมดสว่าง (Light Mode)' : 'สลับเป็นโหมดมืด (Dark Mode)'}
              aria-label="Toggle Theme"
              style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                border: theme === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: theme === 'dark' ? '#fbbf24' : '#6366f1',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {theme === 'dark' ? (
                <Sun size={16} />
              ) : (
                <Moon size={16} />
              )}
            </button>

            {/* POS Button */}
            <Link href="/admin/pos" style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 13px', borderRadius: 10, textDecoration: 'none',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: '1px solid rgba(99,102,241,0.50)',
              color: '#fff', fontSize: 12, fontWeight: 600,
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 16px rgba(99,102,241,0.30)',
              transition: 'all 0.2s ease',
              letterSpacing: '-0.01em',
            }}>
              <ShoppingCart size={13} />
              <span className="hidden sm:inline">POS Terminal</span>
            </Link>


            {/* Avatar — แสดงเฉพาะตอนใช้ mobile เท่านั้น (ซ่อนบน desktop) */}
            <div
              className="admin-topbar-profile flex lg:hidden"
              style={{
                alignItems: 'center', gap: 8,
                padding: '5px 10px 5px 6px', borderRadius: 10,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                cursor: 'pointer', transition: 'all 0.18s ease',
                flexShrink: 0,
              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: '#fff',
              }}>
                {profile ? profile.full_name.charAt(0).toUpperCase() : <CircleUserRound size={14} />}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', lineHeight: 1.2, maxWidth: 95, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {profile?.full_name || 'superadmin'}
                </div>
                <div style={{ fontSize: 10, color: '#818cf8', fontWeight: 500, whiteSpace: 'nowrap' }}>
                  {profile?.role === 'super_admin' ? '⚡ Super Admin' : '● Staff'}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main style={{ flex: 1, minWidth: 0, padding: 'clamp(8px, 3vw, 20px)', overflowX: 'clip', maxWidth: '100%' }}>
          <Heartbeat />
          {children}
          <AdminAIChat />
        </main>
      </div>
    </div>
  )
}
