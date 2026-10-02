'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDateShort } from '@/lib/utils'
import Link from 'next/link'
import {
  TrendingUp, ShoppingBag, Users, Package,
  AlertTriangle, Wine, ArrowUpRight, ArrowDownRight, Loader2, Clock, Receipt,
  ChevronRight, Flame, RefreshCw, User, Mail, Phone
} from 'lucide-react'
import {
  ResponsiveContainer, LineChart, Line, Area, AreaChart, Tooltip, YAxis, XAxis
} from 'recharts'

interface DashboardStats {
  todaySales: number
  todayOrders: number
  totalCustomers: number
  lowStockCount: number
  monthSales: number
  monthOrders: number
  pendingOrders: number
}

function formatLastSeen(updatedAt?: string | null) {
  if (!updatedAt) return 'ไม่มีข้อมูล'
  const diffMs = new Date().getTime() - new Date(updatedAt).getTime()
  if (diffMs < 0 || diffMs < 60000) return 'เมื่อสักครู่'
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${diffHours} ชม. ที่แล้ว`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} วันที่แล้ว`
}

const generateSparkline = (base: number, points: number, seed: number) => {
  const arr = []
  let val = base
  for (let i = 0; i < points; i++) {
    const change = (Math.sin(i + seed) * 0.4 + (Math.random() - 0.5) * 0.6) * (base * 0.05)
    val = Math.max(base * 0.5, val + change)
    arr.push({ value: val })
  }
  return arr
}

export default function AdminDashboard() {
  const supabase = createClient()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [chartData, setChartData] = useState<{ date: string; sales: number; orders: number }[]>([])
  const [topProducts, setTopProducts] = useState<{ name: string; qty: number; revenue: number }[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<{ id: string; name: string; stock: number; min_stock: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [staffUsers, setStaffUsers] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'stock' | 'staff'>('overview')

  const loadStaffStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        if (data.users && data.users.length > 0) {
          setStaffUsers(data.users)
          return
        }
      }
      const { data: staffData } = await supabase.from('profiles').select('*').order('role', { ascending: true })
      if (staffData && staffData.length > 0) {
        setStaffUsers(staffData)
      }
    } catch {
      const { data: staffData } = await supabase.from('profiles').select('*').order('role', { ascending: true })
      if (staffData && staffData.length > 0) setStaffUsers(staffData)
    }
  }, [supabase])

  useEffect(() => {
    loadDashboard()
    loadStaffStatus()

    const interval = setInterval(loadStaffStatus, 10000)

    const channel = supabase
      .channel('dashboard-staff-status')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        loadStaffStatus()
      })
      .subscribe()

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [loadStaffStatus, supabase])

  const loadDashboard = async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString()
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0).toISOString()
      const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 0, 0, 0).toISOString()

      const [todaySalesRes, monthSalesRes, customersRes, lowStockRes, saleItemsRes, pendingRes, salesLast7DaysRes, profilesRes] = await Promise.all([
        supabase.from('sales').select('total_amount').eq('status', 'paid').gte('created_at', todayStart).lte('created_at', todayEnd),
        supabase.from('sales').select('total_amount').eq('status', 'paid').gte('created_at', monthStart),
        supabase.from('customers').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id, name, stock, min_stock').eq('is_active', true),
        supabase.from('sale_items').select('product_name, quantity, line_total').limit(200),
        supabase.from('sales').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('sales').select('total_amount, created_at').in('status', ['paid', 'pending']).gte('created_at', sevenDaysAgo),
        supabase.from('profiles').select('*').order('created_at', { ascending: false })
      ])

      if (profilesRes.data && profilesRes.data.length > 0) {
        setStaffUsers(profilesRes.data)
      }

      const todaySales = (todaySalesRes.data || []).reduce((s, r) => s + (r.total_amount || 0), 0)
      const todayOrders = (todaySalesRes.data || []).length
      const monthSales = (monthSalesRes.data || []).reduce((s, r) => s + (r.total_amount || 0), 0)
      const monthOrders = (monthSalesRes.data || []).length
      const allActiveProducts = lowStockRes.data || []
      const lowStockList = allActiveProducts.filter(p => p.stock <= p.min_stock)

      setStats({
        todaySales,
        todayOrders,
        totalCustomers: customersRes.count || 0,
        lowStockCount: lowStockList.length,
        monthSales,
        monthOrders,
        pendingOrders: pendingRes.count || 0
      })
      setLowStockProducts(lowStockList.slice(0, 5))

      const productMap = new Map<string, { qty: number; revenue: number }>()
      for (const item of saleItemsRes.data || []) {
        if (!item.product_name) continue
        const existing = productMap.get(item.product_name) || { qty: 0, revenue: 0 }
        productMap.set(item.product_name, { qty: existing.qty + (item.quantity || 0), revenue: existing.revenue + (item.line_total || 0) })
      }
      const top = Array.from(productMap.entries())
        .map(([name, v]) => ({ name, qty: v.qty, revenue: v.revenue }))
        .sort((a, b) => b.revenue - a.revenue).slice(0, 5)
      setTopProducts(top)

      const salesData = salesLast7DaysRes.data || []
      const days = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
        const dateStr = d.toISOString().slice(0, 10)
        const daySales = salesData.filter(s => s.created_at && s.created_at.slice(0, 10) === dateStr)
        days.push({
          date: formatDateShort(d.toISOString()),
          sales: daySales.reduce((sum, s) => sum + (s.total_amount || 0), 0),
          orders: daySales.length
        })
      }
      setChartData(days)

      await loadStaffStatus()
    } catch (err: any) {
      console.error('Error loading dashboard from Supabase:', err)
      setErrorMsg(err.message || 'ไม่สามารถดึงข้อมูลจากฐานข้อมูล Supabase ได้')
      setStats({
        todaySales: 0,
        todayOrders: 0,
        totalCustomers: 0,
        lowStockCount: 0,
        monthSales: 0,
        monthOrders: 0,
        pendingOrders: 0,
      })
      setLowStockProducts([])
      setTopProducts([])
      setChartData([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={38} className="animate-spin" style={{ color: '#22e5ff', margin: '0 auto 14px', filter: 'drop-shadow(0 0 10px rgba(0,212,255,0.6))' }} />
          <p style={{ color: '#22e5ff', fontSize: 14, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>กำลังโหลดข้อมูลแดชบอร์ด...</p>
        </div>
      </div>
    )
  }

  const kpiCards = [
    {
      title: 'ยอดขายวันนี้',
      value: formatCurrency(stats?.todaySales || 0),
      sub: `${stats?.todayOrders || 0} ออเดอร์`,
      trend: 12.5,
      color: '#34d399',
      bg: 'rgba(52,211,153,0.08)',
      border: 'rgba(52,211,153,0.2)',
      icon: <TrendingUp size={18} />,
      spark: generateSparkline(stats?.todaySales || 15000, 10, 1),
      href: undefined
    },
    {
      title: 'ยอดขายเดือนนี้',
      value: formatCurrency(stats?.monthSales || 0),
      sub: `${stats?.monthOrders || 0} บิล`,
      trend: 8.3,
      color: '#22e5ff',
      bg: 'rgba(0,212,255,0.08)',
      border: 'rgba(0,212,255,0.2)',
      icon: <Receipt size={18} />,
      spark: generateSparkline(stats?.monthSales || 450000, 10, 5),
      href: '/admin/reports'
    },
    {
      title: 'บิลค้างชำระ',
      value: `${stats?.pendingOrders || 0} บิล`,
      sub: 'รอชำระเงิน',
      trend: stats?.pendingOrders ? 5.0 : 0,
      color: stats?.pendingOrders ? '#fbbf24' : '#34d399',
      bg: stats?.pendingOrders ? 'rgba(251,191,36,0.08)' : 'rgba(52,211,153,0.08)',
      border: stats?.pendingOrders ? 'rgba(251,191,36,0.2)' : 'rgba(52,211,153,0.2)',
      icon: <AlertTriangle size={18} />,
      spark: generateSparkline(stats?.pendingOrders || 2, 10, 15),
      href: '/admin/billing'
    },
  ]

  return (
    <div style={{ minHeight: '100vh', color: 'var(--admin-text, #f1f5f9)' }}>
      {/* Nebula bg */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 20% 10%, rgba(0,212,255,0.05) 0%, transparent 50%), radial-gradient(ellipse at 80% 30%, rgba(168,85,247,0.06) 0%, transparent 45%)'
      }} />
      <style>{`
        .dash-card {
          background: linear-gradient(145deg, rgba(14,20,35,0.90) 0%, rgba(10,14,26,0.92) 100%);
          border: 1px solid rgba(255,255,255,0.07);
          border-top: 1px solid rgba(255,255,255,0.10);
          border-radius: 18px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.55);
          transition: border-color 0.25s, box-shadow 0.25s, transform 0.25s;
        }
        .dash-card:hover {
          border-color: rgba(0,212,255,0.20);
          box-shadow: 0 8px 32px rgba(0,0,0,0.55), 0 0 28px rgba(0,212,255,0.06);
          transform: translateY(-2px);
        }
        .kpi-card {
          border-radius: 14px;
          padding: 16px;
          transition: transform 0.2s, box-shadow 0.2s;
          cursor: default;
          position: relative;
          overflow: hidden;
        }
        .kpi-card:active { transform: scale(0.98); }
        .tab-btn {
          flex: 1;
          padding: 8px 12px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: var(--admin-text-muted, #94a3b8);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .tab-btn.active {
          background: rgba(0,212,255,0.10);
          color: #22e5ff;
          border: 1px solid rgba(0,212,255,0.22);
        }
        .product-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 10px;
          transition: background 0.15s;
        }
        .product-row:hover { background: rgba(0,212,255,0.05); }
        .stock-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
        }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,212,255,0.14); border-radius: 4px; }
        @media (max-width: 640px) {
          .dash-grid-4 { grid-template-columns: repeat(2, 1fr) !important; }
          .dash-grid-2 { grid-template-columns: 1fr !important; }
          .hide-mobile { display: none !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: 'clamp(12px, 3vw, 24px)' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 12, position: 'relative', zIndex: 1 }}>
          <div>
            <h1 style={{ fontSize: 'clamp(18px, 4vw, 26px)', fontWeight: 900, color: 'var(--admin-text, #eef2ff)', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
              📊 แดชบอร์ด
            </h1>
            <p style={{ color: 'var(--admin-text-muted, #94a3b8)', fontSize: 12, margin: '2px 0 0', fontFamily: 'monospace' }}>
              {new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button
            onClick={loadDashboard}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 10,
              border: '1px solid rgba(0,212,255,0.22)',
              background: 'rgba(0,212,255,0.07)',
              color: '#22e5ff', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', whiteSpace: 'nowrap'
            }}
          >
            <RefreshCw size={14} />
            <span className="hide-mobile">รีเฟรช</span>
          </button>
        </div>

        {/* ── Error ── */}
        {errorMsg && (
          <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(244,63,94,0.10)', border: '1px solid rgba(244,63,94,0.28)', color: '#fb7185', marginBottom: 16, fontSize: 13 }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {/* ── KPI Cards ── */}
        <div className="dash-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20, position: 'relative', zIndex: 1 }}>
          {kpiCards.map((card, i) => {
            const inner = (
              <div key={i} className="kpi-card" style={{
                background: `linear-gradient(135deg, ${card.bg} 0%, rgba(14,20,35,0.90) 100%)`,
                border: `1px solid ${card.border}`,
                boxShadow: `0 4px 20px rgba(0,0,0,0.50), 0 0 24px ${card.bg}`
              }}>
                {/* Top line */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(to right, transparent, ${card.color}80, transparent)`, borderRadius: '14px 14px 0 0' }} />
                {/* Glow orb */}
                <div style={{ position: 'absolute', top: 0, right: 0, width: 120, height: 120, background: card.bg, borderRadius: '50%', filter: 'blur(40px)', transform: 'translate(40%,-40%)', pointerEvents: 'none' }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: card.bg, border: `1px solid ${card.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color }}>
                    {card.icon}
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    color: card.trend >= 0 ? '#34d399' : '#fb7185',
                    background: card.trend >= 0 ? 'rgba(52,211,153,0.10)' : 'rgba(251,113,133,0.10)',
                    border: `1px solid ${card.trend >= 0 ? 'rgba(52,211,153,0.28)' : 'rgba(251,113,133,0.28)'}`,
                    padding: '2px 7px', borderRadius: 999
                  }}>
                    {card.trend >= 0 ? `+${card.trend}%` : `${card.trend}%`}
                  </span>
                </div>
                <p style={{ fontSize: 'clamp(16px, 3vw, 24px)', fontWeight: 900, color: card.color, margin: '0 0 2px', fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.04em', textShadow: `0 0 20px ${card.bg}` }}>
                  {card.value}
                </p>
                <p style={{ fontSize: 11, color: 'var(--admin-text-muted, #94a3b8)', margin: 0 }}>{card.title}</p>
                <div style={{ height: 28, marginTop: 10 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={card.spark}>
                      <Line type="monotone" dataKey="value" stroke={card.color} strokeWidth={1.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )
            return card.href
              ? <Link key={i} href={card.href} style={{ textDecoration: 'none' }}>{inner}</Link>
              : inner
          })}
        </div>

        {/* ── Main Content Grid ── */}
        <div className="dash-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, marginBottom: 16 }}>

          {/* ── Chart Card ── */}
          <div className="dash-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
              <div>
                <p style={{ color: 'var(--admin-text-muted, #94a3b8)', fontSize: 12, fontWeight: 600, margin: 0 }}>ยอดขาย 7 วันล่าสุด</p>
                <h3 style={{ fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 900, color: '#22e5ff', margin: '4px 0 0', fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.04em' }}>
                  {formatCurrency(stats?.monthSales || 0)}
                  <span style={{ fontSize: 13, color: '#34d399', fontWeight: 600, marginLeft: 8 }}>+12.5% MTD</span>
                </h3>
              </div>
              <span style={{ fontSize: 11, color: '#2dd4bf', background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.22)', padding: '4px 10px', borderRadius: 6, whiteSpace: 'nowrap' }}>
                เรียลไทม์
              </span>
            </div>

            {/* Category Bar */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--admin-text-muted, #94a3b8)', marginBottom: 6, flexWrap: 'wrap' }}>
                {[['#22e5ff', 'Red Wine', '65%'], ['#2dd4bf', 'White Wine', '25%'], ['#c084fc', 'Sparkling', '10%']].map(([c, l, p]) => (
                  <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, flexShrink: 0, boxShadow: `0 0 6px ${c}` }} />
                    {l} ({p})
                  </div>
                ))}
              </div>
              <div style={{ width: '100%', height: 10, borderRadius: 999, overflow: 'hidden', display: 'flex', background: 'rgba(255,255,255,0.04)' }}>
                <div style={{ width: '65%', background: 'linear-gradient(90deg,#22e5ff,#2dd4bf)' }} />
                <div style={{ width: '25%', background: 'linear-gradient(90deg,#2dd4bf,#c084fc)' }} />
                <div style={{ width: '10%', background: 'linear-gradient(90deg,#c084fc,#a855f7)' }} />
              </div>
            </div>

            {/* Area Chart */}
            <div style={{ height: 'clamp(140px, 20vw, 180px)' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="spaceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22e5ff" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#22e5ff" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="spaceGrad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c084fc" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#c084fc" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fill: 'var(--admin-text-muted, #94a3b8)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ background: '#0a0e1a', border: '1px solid rgba(0,212,255,0.18)', borderRadius: 10, color: '#eef2ff', fontSize: 12 }}
                    formatter={(v) => [formatCurrency(Number(v)), 'ยอดขาย']}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#22e5ff" fill="url(#spaceGrad)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Right Panel ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Quick Links */}
            <div className="dash-card" style={{ padding: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--admin-text-muted, #94a3b8)', margin: '0 0 10px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>เมนูด่วน</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[
                  { label: 'สินค้า', icon: '📦', href: '/admin/products' },
                  { label: 'สต็อก', icon: '🏭', href: '/admin/inventory' },
                  { label: 'รายงาน', icon: '📈', href: '/admin/reports' },
                  { label: 'รับชำระ', icon: '💳', href: '/admin/billing' },
                  { label: 'ผู้ใช้', icon: '👥', href: '/admin/users' },
                  { label: 'ตั้งค่า', icon: '⚙️', href: '/admin/settings' },
                ].map(item => (
                  <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                    <div style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      gap: 4, padding: '10px 4px', borderRadius: 10,
                      background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.10)',
                      cursor: 'pointer', transition: 'all 0.15s'
                    }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,212,255,0.09)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,212,255,0.28)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,212,255,0.04)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,212,255,0.10)'; }}
                    >
                      <span style={{ fontSize: 20 }}>{item.icon}</span>
                      <span style={{ fontSize: 11, color: 'var(--admin-text-muted, #94a3b8)', fontWeight: 600 }}>{item.label}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Category Progress */}
            <div className="dash-card" style={{ padding: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--admin-text-muted, #94a3b8)', margin: '0 0 12px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>สัดส่วนหมวดหมู่</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Red Wine (ไวน์แดง)', pct: 65, color: '#22e5ff' },
                  { label: 'White Wine (ไวน์ขาว)', pct: 25, color: '#2dd4bf' },
                  { label: 'Sparkling (สปาร์คกลิ้ง)', pct: 10, color: '#c084fc' },
                ].map(item => (
                  <div key={item.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--admin-text-muted, #94a3b8)', marginBottom: 4 }}>
                      <span>{item.label}</span>
                      <span style={{ fontWeight: 700, color: 'var(--admin-text, #eef2ff)' }}>{item.pct}%</span>
                    </div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ width: `${item.pct}%`, height: '100%', background: item.color, borderRadius: 999, boxShadow: `0 0 10px ${item.color}60` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* ── Bottom Section with Tabs on Mobile ── */}
        <div style={{ display: 'flex', gap: 4, padding: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, marginBottom: 14 }} className="sm:hidden">
          {([['overview', '🏆 สินค้าขายดี'], ['stock', '⚠️ สต็อกต่ำ'], ['staff', '👥 พนักงาน']] as const).map(([tab, label]) => (
            <button key={tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
              {label}
            </button>
          ))}
        </div>

        <div className="dash-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>

          {/* ── Top Products ── */}
          <div
            className={`dash-card ${activeTab === 'overview' ? 'block' : 'hidden sm:block'}`}
            style={{ padding: 18 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--admin-text, #eef2ff)', margin: 0 }}>🏆 สินค้าขายดีสุด</h4>
              <span style={{ fontSize: 11, color: '#fbbf24', fontWeight: 600 }}>Top 5</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {topProducts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--admin-text-muted, #94a3b8)' }}>
                  <Wine size={24} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                  <p style={{ fontSize: 12, margin: 0 }}>ยังไม่มีข้อมูลการขาย</p>
                </div>
              ) : (
                topProducts.map((p, idx) => {
                  const icons = ['🍷', '🥂', '🍾', '🍇', '🍹']
                  return (
                    <div key={idx} className="product-row">
                      <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--admin-text-muted, #94a3b8)', width: 14, flexShrink: 0 }}>#{idx + 1}</span>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>{icons[idx % icons.length]}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-text, #eef2ff)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.name}
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--admin-text-muted, #94a3b8)', margin: 0 }}>ขายแล้ว {p.qty} ขวด</p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--admin-text, #eef2ff)', margin: 0 }}>{formatCurrency(p.revenue)}</p>
                        <p style={{ fontSize: 11, color: '#34d399', margin: 0 }}>+{(12 - idx).toFixed(1)}%</p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* ── Low Stock ── */}
          <div
            className={`dash-card ${activeTab === 'stock' ? 'block' : 'hidden sm:block'}`}
            style={{ padding: 18 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--admin-text, #eef2ff)', margin: 0 }}>⚠️ สต็อกต่ำ</h4>
              <Link href="/admin/inventory" style={{ fontSize: 11, color: '#fb7185', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
                ดูทั้งหมด <ChevronRight size={12} />
              </Link>
            </div>
            {lowStockProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--admin-text-muted, #94a3b8)' }}>
                <Package size={24} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                <p style={{ fontSize: 12, margin: 0 }}>สต็อกปกติทุกรายการ ✓</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {lowStockProducts.map((p) => {
                  const pct = Math.round((p.stock / Math.max(p.min_stock, 1)) * 100)
                  const isOut = p.stock === 0
                  return (
                    <div key={p.id} style={{ padding: '10px 12px', borderRadius: 10, background: isOut ? 'rgba(244,63,94,0.06)' : 'rgba(251,191,36,0.05)', border: `1px solid ${isOut ? 'rgba(244,63,94,0.18)' : 'rgba(251,191,36,0.18)'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--admin-text, #eef2ff)', margin: 0, flex: 1, paddingRight: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.name}
                        </p>
                        <span className="stock-chip" style={{ background: isOut ? 'rgba(244,63,94,0.15)' : 'rgba(251,191,36,0.10)', color: isOut ? '#fb7185' : '#fbbf24', flexShrink: 0 }}>
                          {isOut ? '🔴 หมด' : `🟡 ${p.stock}`}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 999 }}>
                          <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: isOut ? '#fb7185' : '#fbbf24', borderRadius: 999 }} />
                        </div>
                        <span style={{ fontSize: 10, color: 'var(--admin-text-muted, #94a3b8)', flexShrink: 0 }}>min {p.min_stock}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── Staff Status ── */}
          <div
            className={`dash-card ${activeTab === 'staff' ? 'block' : 'hidden sm:block'}`}
            style={{ padding: 18 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--admin-text, #eef2ff)', margin: 0 }}>👥 สถานะพนักงาน</h4>
                <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0', fontWeight: 600 }}>
                  ออนไลน์ {staffUsers.filter(u => u.is_active && u.updated_at && (new Date().getTime() - new Date(u.updated_at).getTime() < 120000)).length} / ทั้งหมด {staffUsers.length} คน
                </p>
              </div>
              <Link href="/admin/users" style={{ fontSize: 11, color: '#22e5ff', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
                จัดการ <ChevronRight size={12} />
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, maxHeight: 440, overflowY: 'auto', paddingRight: 2 }}>
              {staffUsers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--admin-text-muted, #94a3b8)' }}>
                  <User size={24} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                  <p style={{ fontSize: 12, margin: 0 }}>ไม่มีพนักงานในระบบ</p>
                </div>
              ) : (
                staffUsers.map(u => {
                  const isOnline = u.is_active && u.updated_at && (new Date().getTime() - new Date(u.updated_at).getTime() < 120000)
                  const roleIcons: Record<string, string> = { super_admin: '👑', manager: '🏢', cashier: '💰', stock_staff: '📦', kitchen: '🍳', bar: '🍸' }
                  const roleLabels: Record<string, string> = { super_admin: 'Super Admin', manager: 'Manager', cashier: 'Cashier', stock_staff: 'Stock Staff', kitchen: 'Kitchen', bar: 'Bar' }
                  const roleColors: Record<string, string> = { super_admin: '#fbbf24', manager: '#22d3ee', cashier: '#34d399', stock_staff: '#c084fc', kitchen: '#fb7185', bar: '#818cf8' }
                  return (
                    <div
                      key={u.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 12px',
                        borderRadius: 12,
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{
                        width: 34, height: 34, borderRadius: 10,
                        background: isOnline ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${isOnline ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.08)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16, flexShrink: 0
                      }}>
                        {roleIcons[u.role] || '👤'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-text, #eef2ff)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {u.full_name || 'ไม่ระบุชื่อ'}
                          </p>
                          <span style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: roleColors[u.role] || '#94a3b8',
                            background: 'rgba(255,255,255,0.05)',
                            padding: '1px 6px',
                            borderRadius: 6
                          }}>
                            {roleLabels[u.role] || u.role}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
                          {u.email && (
                            <p style={{ fontSize: 11, color: 'var(--admin-text-muted, #94a3b8)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {u.email}
                            </p>
                          )}
                          {u.phone && (
                            <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>
                              • {u.phone}
                            </p>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        {!u.is_active ? (
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#fb7185', background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.25)', padding: '3px 8px', borderRadius: 999, whiteSpace: 'nowrap' }}>
                            ระงับ
                          </span>
                        ) : isOnline ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.10)', border: '1px solid rgba(52,211,153,0.25)', padding: '3px 8px', borderRadius: 999, whiteSpace: 'nowrap' }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px rgba(52,211,153,0.8)', flexShrink: 0 }} />
                            ออนไลน์
                          </span>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, color: 'var(--admin-text-muted, #94a3b8)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', padding: '2px 7px', borderRadius: 999, whiteSpace: 'nowrap' }}>
                              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#64748b', flexShrink: 0 }} />
                              ออฟไลน์
                            </span>
                            <span style={{ fontSize: 9, color: '#475569', fontWeight: 600 }}>
                              {formatLastSeen(u.updated_at)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
