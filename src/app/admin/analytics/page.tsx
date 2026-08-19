'use client'

import '../admin-theme.css'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import {
  TrendingUp, TrendingDown, DollarSign, Package,
  ArrowRight, Loader2, BarChart2, RefreshCw,
  Activity, Zap, CreditCard, ShoppingBag
} from 'lucide-react'

/* ─── Color palette ─────────────────────────────────── */
const C = {
  revenue: '#00d4ff',
  cogs: '#ff4466',
  opex: '#f59e0b',
  profit: '#00e676',
  purple: '#9d4edd',
  teal: '#00bfa5',
  payment: {
    cash: '#f2c65c',
    transfer: '#38bdf8',
    qr: '#68dfcb',
    card: '#a78bfa',
    mixed: '#fb7185',
    other: '#94a3b8',
  } as Record<string, string>,
}

/* ─── Tooltip ──────────────────────────────────────── */
const tooltipBox: React.CSSProperties = {
  background: 'rgba(6,10,20,0.97)',
  border: '1px solid rgba(0,212,255,0.18)',
  borderRadius: 12,
  padding: '12px 16px',
  color: '#e8f0ff',
  fontSize: 12,
  boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
  backdropFilter: 'blur(16px)',
}

function ChartTip({ active, payload, label }: {
  active?: boolean
  payload?: { name: string; value: number; color?: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div style={tooltipBox}>
      {label && <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#00d4ff', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>}
      {payload.map((e, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: e.color ?? '#fff', flexShrink: 0, display: 'inline-block' }} />
          <span style={{ color: '#8899bb', fontSize: 11 }}>{e.name}:</span>
          <span style={{ color: '#e8f0ff', fontWeight: 700 }}>{formatCurrency(e.value)}</span>
        </div>
      ))}
    </div>
  )
}

function ScatterTip({ active, payload }: {
  active?: boolean
  payload?: { payload?: { name: string; price: number; sold: number } }[]
}) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div style={tooltipBox}>
      <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#00d4ff', fontSize: 12 }}>{d.name}</p>
      <div style={{ display: 'flex', gap: 16 }}>
        <div><span style={{ color: '#4a5a78', fontSize: 11 }}>ราคา</span><br /><span style={{ color: '#f59e0b', fontWeight: 700 }}>{formatCurrency(d.price)}</span></div>
        <div><span style={{ color: '#4a5a78', fontSize: 11 }}>ขายได้</span><br /><span style={{ color: '#00e676', fontWeight: 700 }}>{d.sold} ขวด</span></div>
      </div>
    </div>
  )
}

/* ─── KPI Card ─────────────────────────────────────── */
function KpiCard({
  label, value, color, Icon, growth, sub, prefix = ''
}: {
  label: string, value: number, color: string,
  Icon: React.ElementType, growth?: string | null,
  sub?: string, prefix?: string
}) {
  const positive = growth ? Number(growth) >= 0 : null
  return (
    <div style={{
      background: 'rgba(13,21,38,0.85)',
      border: `1px solid ${color}26`,
      borderRadius: 20,
      padding: '20px 22px',
      boxShadow: `0 0 40px ${color}0d, 0 4px 24px rgba(0,0,0,0.4)`,
      backdropFilter: 'blur(16px)',
      position: 'relative',
      overflow: 'hidden',
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 60px ${color}22, 0 8px 32px rgba(0,0,0,0.5)`
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 40px ${color}0d, 0 4px 24px rgba(0,0,0,0.4)`
      }}
    >
      {/* Glow blob */}
      <div style={{
        position: 'absolute', top: -30, right: -30, width: 100, height: 100,
        borderRadius: '50%', background: color, opacity: 0.07, filter: 'blur(30px)', pointerEvents: 'none'
      }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <p style={{ margin: 0, fontSize: 11, color: '#6a7a98', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</p>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: `${color}18`, border: `1px solid ${color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Icon size={16} style={{ color }} />
        </div>
      </div>
      <p style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 900, color, letterSpacing: '-0.02em' }}>
        {prefix}{formatCurrency(value)}
      </p>
      {sub && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#4a5a78' }}>{sub}</p>}
      {growth && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6,
          padding: '3px 8px', borderRadius: 20,
          background: positive ? 'rgba(0,230,118,0.1)' : 'rgba(255,68,102,0.1)',
          border: `1px solid ${positive ? 'rgba(0,230,118,0.25)' : 'rgba(255,68,102,0.25)'}`,
        }}>
          {positive ? <TrendingUp size={10} style={{ color: C.profit }} /> : <TrendingDown size={10} style={{ color: C.cogs }} />}
          <span style={{ fontSize: 11, fontWeight: 700, color: positive ? C.profit : C.cogs }}>
            {positive ? '+' : ''}{growth}% vs ช่วงก่อน
          </span>
        </div>
      )}
    </div>
  )
}

/* ─── Chart Card ───────────────────────────────────── */
function ChartCard({ title, sub, children, accent = '#00d4ff', fullWidth = false }: {
  title: string, sub?: string, children: React.ReactNode, accent?: string, fullWidth?: boolean
}) {
  return (
    <div style={{
      background: 'rgba(13,21,38,0.85)',
      border: '1px solid rgba(255,255,255,0.055)',
      borderRadius: 20,
      padding: '22px 24px',
      boxShadow: '0 8px 40px rgba(0,0,0,0.35)',
      backdropFilter: 'blur(16px)',
      display: 'flex', flexDirection: 'column',
      gridColumn: fullWidth ? '1 / -1' : undefined,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <div style={{ width: 3, height: 18, borderRadius: 2, background: accent, flexShrink: 0 }} />
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#e8f0ff' }}>{title}</h3>
      </div>
      {sub && <p style={{ margin: '0 0 16px 13px', fontSize: 11.5, color: '#4a5a78' }}>{sub}</p>}
      <div style={{ flex: 1, minHeight: 280, marginTop: sub ? 0 : 16 }}>
        {children}
      </div>
    </div>
  )
}

/* ─── Main page ─────────────────────────────────────── */
export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState(30)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async (days: number) => {
    try {
      setLoading(true)
      setError(null)
      const supabase = createClient()

      const now = new Date()
      const currentFrom = new Date(now)
      currentFrom.setDate(currentFrom.getDate() - days)
      currentFrom.setHours(0, 0, 0, 0)

      const prevFrom = new Date(currentFrom)
      prevFrom.setDate(prevFrom.getDate() - days)

      const [
        { data: salesData, error: salesErr },
        { data: stockData },
        { data: productsData },
      ] = await Promise.all([
        supabase
          .from('sales')
          .select('id,created_at,total_amount,payment_method,status,sale_items(quantity,cost,line_total,product_name)')
          .gte('created_at', prevFrom.toISOString()),
        supabase
          .from('stock_receipts')
          .select('id,total_cost,created_at')
          .gte('created_at', currentFrom.toISOString()),
        supabase.from('products').select('id,name,price,cost,stock'),
      ])

      if (salesErr) throw salesErr

      const allPaid = (salesData ?? []).filter((s: { status: string }) => s.status === 'paid')
      const current = allPaid.filter((s: { created_at: string }) => new Date(s.created_at) >= currentFrom)
      const prev = allPaid.filter((s: { created_at: string }) => new Date(s.created_at) < currentFrom)

      /* KPI */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const revenue = current.reduce((sum: number, s: any) => sum + Number(s.total_amount), 0)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cogs = current.reduce((sum: number, s: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const c = (s.sale_items ?? []).reduce((x: number, it: any) =>
          x + Number(it.cost ?? 0) * Number(it.quantity ?? 0), 0)
        return sum + c
      }, 0)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const receiptsCost = (stockData ?? []).reduce((sum: number, r: any) => sum + Number(r.total_cost ?? 0), 0)
      const opex = receiptsCost + revenue * 0.08
      const netProfit = revenue - cogs - opex
      const prevRevenue = prev.reduce((sum: number, s: { total_amount: number }) =>
        sum + Number(s.total_amount), 0)
      const txCount = current.length
      const avgOrder = txCount > 0 ? revenue / txCount : 0

      /* Daily data */
      const dayMap: Record<string, { date: string; revenue: number; cogs: number; profit: number; ts: number }> = {}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      current.forEach((s: any) => {
        const dt = new Date(s.created_at)
        const label = dt.toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })
        if (!dayMap[label]) dayMap[label] = { date: label, revenue: 0, cogs: 0, profit: 0, ts: dt.getTime() }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sc = (s.sale_items ?? []).reduce((x: number, it: any) =>
          x + Number(it.cost ?? 0) * Number(it.quantity ?? 0), 0)
        const sr = Number(s.total_amount)
        dayMap[label].revenue += sr
        dayMap[label].cogs += sc
        dayMap[label].profit += sr - sc - sr * 0.08
      })
      const dailyData = Object.values(dayMap).sort((a, b) => a.ts - b.ts)

      /* Cumulative */
      let cum = 0
      const areaData = dailyData.map(d => {
        cum += d.revenue
        return { date: d.date, cumulative: cum }
      })

      /* Payment methods */
      const payMap: Record<string, number> = {}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      current.forEach((s: any) => {
        const pm = String(s.payment_method ?? 'other')
        payMap[pm] = (payMap[pm] ?? 0) + Number(s.total_amount)
      })
      const paymentData = Object.entries(payMap).map(([k, v]) => ({
        name: k === 'cash' ? '💵 เงินสด' : k === 'transfer' ? '🏦 โอนเงิน' : k === 'qr' ? '📱 QR Code' : k === 'card' ? '💳 บัตร' : k.toUpperCase(),
        value: v,
        key: k,
      }))

      /* Donut */
      const financeData = [
        { name: 'ต้นทุนขาย', value: Math.max(cogs, 0), color: C.cogs },
        { name: 'ค่าดำเนินงาน', value: Math.max(opex, 0), color: C.opex },
        { name: 'กำไรสุทธิ', value: Math.max(netProfit, 0), color: C.profit },
      ]

      /* Comparison */
      const prevCogs = prevRevenue * 0.4
      const prevProfit = prevRevenue * 0.45
      const comparisonData = [
        { name: 'ยอดขายรวม', current: revenue, prev: prevRevenue },
        { name: 'ต้นทุนรวม', current: cogs, prev: prevCogs },
        { name: 'กำไรสุทธิ', current: netProfit, prev: prevProfit },
      ]

      /* Scatter */
      const soldMap: Record<string, number> = {}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      current.forEach((s: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(s.sale_items ?? []).forEach((it: any) => {
          if (it.product_name) {
            soldMap[it.product_name] = (soldMap[it.product_name] ?? 0) + Number(it.quantity ?? 0)
          }
        })
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const scatterData = (productsData ?? [])
        .map((p: any) => ({ name: p.name, price: Number(p.price ?? 0), sold: soldMap[p.name] ?? 0 }))
        .filter((d: { sold: number }) => d.sold > 0)

      setData({ revenue, cogs, opex, netProfit, prevRevenue, txCount, avgOrder, dailyData, areaData, paymentData, financeData, comparisonData, scatterData })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData(period)
  }, [period, fetchData])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData(period)
  }

  /* ─── Loading ─────────── */
  if (loading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        alignItems: 'center', height: '65vh', gap: 16
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18,
          background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 40px rgba(0,212,255,0.15)',
        }}>
          <Loader2 size={28} color={C.revenue} className="animate-spin" />
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#e8f0ff' }}>กำลังโหลดข้อมูล Analytics</p>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#4a5a78' }}>กรุณารอสักครู่...</p>
        </div>
      </div>
    )
  }

  /* ─── Error ───────────── */
  if (error || !data) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        color: '#ff4466', padding: '16px 20px',
        background: 'rgba(255,68,102,0.06)', borderRadius: 16,
        border: '1px solid rgba(255,68,102,0.2)', margin: 20
      }}>
        <Activity size={20} color="#ff4466" />
        <div>
          <p style={{ margin: 0, fontWeight: 700 }}>เกิดข้อผิดพลาด</p>
          <p style={{ margin: '2px 0 0', fontSize: 13, opacity: 0.7 }}>{error}</p>
        </div>
      </div>
    )
  }

  const { revenue, cogs, opex, netProfit, prevRevenue, txCount, avgOrder, dailyData, areaData, paymentData, financeData, comparisonData, scatterData } = data
  const margin = revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : '0.0'
  const revGrowth = prevRevenue > 0 ? (((revenue - prevRevenue) / prevRevenue) * 100).toFixed(1) : null

  const fmtK = (v: number) => {
    if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M'
    if (v >= 1000) return (v / 1000).toFixed(0) + 'k'
    return String(v)
  }

  const RADIAN = Math.PI / 180
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: { cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; percent: number }) => {
    if (percent < 0.05) return null
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700}>
        {(percent * 100).toFixed(0)}%
      </text>
    )
  }

  return (
    <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* ══ Header ══════════════════════════════════════════ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Icon */}
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(157,78,221,0.15))',
            border: '1px solid rgba(0,212,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 24px rgba(0,212,255,0.12)',
          }}>
            <BarChart2 size={22} color={C.revenue} />
          </div>
          <div>
            <h1 style={{
              margin: 0, fontSize: 26, fontWeight: 900, letterSpacing: '-0.03em',
              background: 'linear-gradient(90deg, #00d4ff 0%, #9d4edd 60%, #00e676 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Analytics Dashboard
            </h1>
            <p style={{ margin: '3px 0 0', color: '#4a5a78', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Zap size={12} color="#f59e0b" />
              ภาพรวมสถิติการขายและสถานะทางการเงิน
            </p>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* Refresh */}
          <button
            onClick={handleRefresh}
            title="รีเฟรช"
            style={{
              width: 36, height: 36, borderRadius: 10, background: 'rgba(13,21,38,0.9)',
              border: '1px solid rgba(0,212,255,0.15)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#4a5a78', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = C.revenue; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,212,255,0.4)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#4a5a78'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,212,255,0.15)' }}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>

          {/* Period selector */}
          <div style={{
            display: 'flex', gap: 4, background: 'rgba(13,21,38,0.9)', padding: '4px',
            borderRadius: 12, border: '1px solid rgba(0,212,255,0.1)',
          }}>
            {[
              { label: '7 วัน', val: 7 },
              { label: '30 วัน', val: 30 },
              { label: '90 วัน', val: 90 },
            ].map(p => (
              <button
                key={p.val}
                onClick={() => setPeriod(p.val)}
                style={{
                  padding: '6px 14px', borderRadius: 9, fontSize: 12, fontWeight: 700,
                  border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  background: period === p.val
                    ? 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(157,78,221,0.2))'
                    : 'transparent',
                  color: period === p.val ? '#e8f0ff' : '#4a5a78',
                  boxShadow: period === p.val ? `0 0 12px rgba(0,212,255,0.15), inset 0 0 0 1px rgba(0,212,255,0.25)` : 'none',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══ KPI Cards ════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px,1fr))', gap: 16 }}>
        <KpiCard label="รายรับ (Revenue)" value={revenue} color={C.revenue} Icon={DollarSign} growth={revGrowth} />
        <KpiCard label="ต้นทุนขาย (COGS)" value={cogs} color={C.cogs} Icon={Package} />
        <KpiCard label="ค่าดำเนินงาน (OpEx)" value={opex} color={C.opex} Icon={TrendingDown} />
        <KpiCard label="กำไรสุทธิ (Net Profit)" value={netProfit} color={C.profit} Icon={TrendingUp}
          sub={`Margin: ${margin}%`} />
        <KpiCard label="จำนวนบิล" value={txCount} color={C.purple} Icon={ShoppingBag}
          prefix="" />
        <KpiCard label="มูลค่าเฉลี่ย/บิล" value={avgOrder} color={C.teal} Icon={CreditCard} />
      </div>

      {/* ══ Financial Flow Bar ═══════════════════════════════ */}
      <div style={{
        background: 'rgba(13,21,38,0.85)',
        border: '1px solid rgba(255,255,255,0.055)',
        borderRadius: 20, padding: '18px 24px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        backdropFilter: 'blur(16px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{ width: 3, height: 16, borderRadius: 2, background: 'linear-gradient(to bottom, #00d4ff, #9d4edd)' }} />
          <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: '#6a7a98', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Financial Flow
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {[
            { label: 'รายรับ', value: revenue, color: C.revenue, pct: '100%' },
            null,
            { label: 'ต้นทุนขาย', value: cogs, color: C.cogs, pct: revenue > 0 ? `${((cogs/revenue)*100).toFixed(1)}%` : '–' },
            null,
            { label: 'ค่าดำเนินงาน', value: opex, color: C.opex, pct: revenue > 0 ? `${((opex/revenue)*100).toFixed(1)}%` : '–' },
            null,
            { label: 'กำไรสุทธิ', value: netProfit, color: C.profit, pct: `${margin}%` },
          ].map((item, idx) => {
            if (item === null) {
              return <ArrowRight key={idx} size={16} style={{ color: '#2a3a58', flexShrink: 0 }} />
            }
            return (
              <div key={idx} style={{
                flex: 1, minWidth: 130, padding: '10px 14px',
                background: `${item.color}0c`, borderRadius: 12,
                border: `1px solid ${item.color}1a`,
              }}>
                <p style={{ margin: '0 0 2px', fontSize: 10, color: '#4a5a78', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {item.label}
                </p>
                <p style={{ margin: '0 0 2px', fontSize: 18, fontWeight: 900, color: item.color }}>
                  {formatCurrency(item.value)}
                </p>
                <p style={{ margin: 0, fontSize: 10, color: item.color, opacity: 0.65, fontWeight: 600 }}>
                  {item.pct}
                </p>
              </div>
            )
          })}
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: 16, display: 'flex', height: 6, borderRadius: 4, overflow: 'hidden', gap: 2 }}>
          {revenue > 0 && <>
            <div style={{ flex: cogs, background: C.cogs, borderRadius: 4 }} />
            <div style={{ flex: opex, background: C.opex, borderRadius: 4 }} />
            <div style={{ flex: Math.max(netProfit, 0), background: C.profit, borderRadius: 4 }} />
          </>}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
          {[
            { label: 'ต้นทุนขาย', color: C.cogs },
            { label: 'ค่าดำเนินงาน', color: C.opex },
            { label: 'กำไรสุทธิ', color: C.profit },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: l.color, flexShrink: 0, display: 'inline-block' }} />
              <span style={{ fontSize: 11, color: '#4a5a78' }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ══ Charts Grid 1 ════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px,1fr))', gap: 22 }}>

        {/* 1: Bar Daily Sales */}
        <ChartCard
          title="ยอดขายรายวัน"
          sub={`เปรียบเทียบยอดขายในแต่ละวัน (${period} วันล่าสุด)`}
          accent={C.revenue}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.revenue} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={C.revenue} stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="date" stroke="#2a3a58" fontSize={10} tickMargin={8} />
              <YAxis stroke="#2a3a58" fontSize={10} tickFormatter={fmtK} />
              <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(0,212,255,0.04)' }} />
              <Bar dataKey="revenue" name="ยอดขาย" fill="url(#barGrad)" radius={[5, 5, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 2: Line Trend */}
        <ChartCard
          title="แนวโน้มการเติบโต"
          sub="รายรับ, ต้นทุน และกำไรรายวัน"
          accent={C.profit}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" stroke="#2a3a58" fontSize={10} />
              <YAxis stroke="#2a3a58" fontSize={10} tickFormatter={fmtK} />
              <Tooltip content={<ChartTip />} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
              <Line type="monotone" dataKey="revenue" name="รายรับ" stroke={C.revenue} strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: C.revenue }} />
              <Line type="monotone" dataKey="cogs" name="ต้นทุน" stroke={C.cogs} strokeWidth={2} dot={false} strokeDasharray="5 3" />
              <Line type="monotone" dataKey="profit" name="กำไร" stroke={C.profit} strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: C.profit }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 3: Pie Payment */}
        <ChartCard
          title="ช่องทางการชำระเงิน"
          sub="สัดส่วนรายได้แยกตามประเภท"
          accent={C.opex}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <defs>
                {Object.entries(C.payment).map(([k, v]) => (
                  <radialGradient key={k} id={`grad-pay-${k}`} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={v} stopOpacity={1} />
                    <stop offset="100%" stopColor={v} stopOpacity={0.75} />
                  </radialGradient>
                ))}
              </defs>
              <Pie
                data={paymentData}
                cx="50%" cy="50%"
                outerRadius={105}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
                labelLine={false}
                label={renderCustomLabel}
              >
                {paymentData.map((entry: { key: string }, idx: number) => (
                  <Cell key={idx} fill={`url(#grad-pay-${entry.key})`} />
                ))}
              </Pie>
              <Tooltip content={<ChartTip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 4: Donut Financial */}
        <ChartCard
          title="สัดส่วนทางการเงิน"
          sub="การกระจายรายรับ: ต้นทุน / ค่าใช้จ่าย / กำไร"
          accent={C.purple}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={financeData}
                cx="50%" cy="50%"
                innerRadius={72}
                outerRadius={108}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {financeData.map((entry: { color: string }, idx: number) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              {/* Center label */}
              <text x="50%" y="48%" textAnchor="middle" dominantBaseline="middle" fontSize={13} fill="#6a7a98" fontWeight={600}>
                Margin
              </text>
              <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" fontSize={20} fill={C.profit} fontWeight={900}>
                {margin}%
              </text>
              <Tooltip content={<ChartTip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 5: Area Cumulative */}
        <ChartCard
          title="รายรับสะสม"
          sub="ยอดขายรวมสะสมตามช่วงเวลา"
          accent={C.purple}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={areaData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradCum" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.purple} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={C.purple} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" stroke="#2a3a58" fontSize={10} />
              <YAxis stroke="#2a3a58" fontSize={10} tickFormatter={fmtK} />
              <Tooltip content={<ChartTip />} />
              <Area type="monotone" dataKey="cumulative" name="รายรับสะสม"
                stroke={C.purple} fill="url(#gradCum)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 6: Comparison Bar */}
        <ChartCard
          title="เปรียบเทียบผลประกอบการ"
          sub={`${period} วันปัจจุบัน เทียบกับ ${period} วันก่อนหน้า`}
          accent={C.teal}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="name" stroke="#2a3a58" fontSize={10} />
              <YAxis stroke="#2a3a58" fontSize={10} tickFormatter={fmtK} />
              <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(0,191,165,0.04)' }} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
              <Bar dataKey="prev" name="ช่วงก่อนหน้า" fill="rgba(255,255,255,0.08)" radius={[5, 5, 0, 0]} maxBarSize={32} />
              <Bar dataKey="current" name="ช่วงปัจจุบัน" fill={C.teal} radius={[5, 5, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

      </div>

      {/* ══ Scatter (full width) ════════════════════════════ */}
      <ChartCard
        title="ความสัมพันธ์ราคา vs ปริมาณขาย"
        sub="แกน X: ราคาต่อขวด (บาท)  ·  แกน Y: จำนวนที่ขายได้ (ขวด)"
        accent={C.revenue}
      >
        <div style={{ minHeight: 340 }}>
          <ResponsiveContainer width="100%" height={340}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <defs>
                <radialGradient id="dotGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={C.revenue} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={C.purple} stopOpacity={0.5} />
                </radialGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis type="number" dataKey="price" name="ราคา" stroke="#2a3a58" fontSize={11} tickFormatter={fmtK} />
              <YAxis type="number" dataKey="sold" name="จำนวนขาย" stroke="#2a3a58" fontSize={11} />
              <Tooltip content={<ScatterTip />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.1)' }} />
              <Scatter name="สินค้า" data={scatterData} fill="url(#dotGrad)" fillOpacity={0.85} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

    </div>
  )
}
