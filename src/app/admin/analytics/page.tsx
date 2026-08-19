'use client'

import '../admin-theme.css'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import type { PieLabelRenderProps } from 'recharts'
import {
  TrendingUp, TrendingDown, DollarSign, Package,
  Loader2, BarChart2, RefreshCw, Activity,
  Zap, CreditCard, ShoppingBag, ChevronUp, ChevronDown,
  ArrowRight, Sparkles,
} from 'lucide-react'

/* ══════════════════════════════════════════
   DESIGN TOKENS
══════════════════════════════════════════ */
const T = {
  bg:      '#060a14',
  card:    'rgba(10,16,30,0.92)',
  border:  'rgba(255,255,255,0.055)',
  textPri: '#e8f4ff',
  textSec: '#4a5a78',
  textMut: '#2a3a58',

  cyan:    '#00d4ff',
  red:     '#ff4466',
  amber:   '#f59e0b',
  green:   '#00e676',
  purple:  '#9d4edd',
  teal:    '#00bfa5',
  blue:    '#3b82f6',
  rose:    '#fb7185',
}

const PAY_COLORS: Record<string, string> = {
  cash:     '#ff7043',   // ส้มแดงสด — เงินสด
  transfer: '#42a5f5',   // ฟ้าสด — โอนเงิน
  qr:       '#ab47bc',   // ม่วงสด — QR Code
  card:     '#26c6da',   // เขียวฟ้า — บัตรเครดิต
  mixed:    '#ec407a',   // ชมพูบานเย็น — หลายช่องทาง
  other:    '#78909c',   // เทา — อื่นๆ
}

/* ══════════════════════════════════════════
   SHARED TOOLTIP
══════════════════════════════════════════ */
function ChartTip({ active, payload, label }: {
  active?: boolean
  payload?: { name: string; value: number; color?: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'rgba(4,8,18,0.97)',
      border: '1px solid rgba(0,212,255,0.2)',
      borderRadius: 14, padding: '12px 16px',
      boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
      backdropFilter: 'blur(20px)',
      minWidth: 160,
    }}>
      {label && (
        <p style={{ margin: '0 0 10px', fontSize: 10, fontWeight: 800, color: T.cyan,
          textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {label}
        </p>
      )}
      {payload.map((e, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{
            width: 8, height: 8, borderRadius: 2,
            background: e.color ?? '#fff', flexShrink: 0, display: 'inline-block',
          }} />
          <span style={{ fontSize: 11, color: '#6a7a9a', flex: 1 }}>{e.name}</span>
          <span style={{ fontSize: 12, fontWeight: 800, color: T.textPri }}>
            {formatCurrency(e.value)}
          </span>
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
    <div style={{
      background: 'rgba(4,8,18,0.97)',
      border: '1px solid rgba(0,212,255,0.2)',
      borderRadius: 14, padding: '12px 16px',
      boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
      backdropFilter: 'blur(20px)',
    }}>
      <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: T.cyan }}>{d.name}</p>
      <div style={{ display: 'flex', gap: 20 }}>
        <div>
          <p style={{ margin: 0, fontSize: 10, color: T.textSec }}>ราคา</p>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: T.amber }}>{formatCurrency(d.price)}</p>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 10, color: T.textSec }}>ขายได้</p>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: T.green }}>{d.sold} ขวด</p>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   PIE LABEL (TypeScript-safe)
══════════════════════════════════════════ */
const RADIAN = Math.PI / 180
function renderPieLabel(props: PieLabelRenderProps): React.ReactElement | null {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props
  if (percent === undefined || percent < 0.07) return null
  const cxN = typeof cx === 'number' ? cx : Number(cx ?? 0)
  const cyN = typeof cy === 'number' ? cy : Number(cy ?? 0)
  const mid = midAngle ?? 0
  const inner = typeof innerRadius === 'number' ? innerRadius : 0
  const outer = typeof outerRadius === 'number' ? outerRadius : 0
  const radius = inner + (outer - inner) * 0.55
  const x = cxN + radius * Math.cos(-mid * RADIAN)
  const y = cyN + radius * Math.sin(-mid * RADIAN)
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle"
      dominantBaseline="central" fontSize={11} fontWeight={800}
      style={{ pointerEvents: 'none' }}>
      {(percent * 100).toFixed(0)}%
    </text>
  )
}

/* ══════════════════════════════════════════
   KPI CARD
══════════════════════════════════════════ */
interface KpiProps {
  label: string
  value: number
  color: string
  Icon: React.ElementType
  growth?: string | null
  sub?: string
  isCurrency?: boolean
}
function KpiCard({ label, value, color, Icon, growth, sub, isCurrency = true }: KpiProps) {
  const pos = growth ? Number(growth) >= 0 : null
  return (
    <div
      style={{
        position: 'relative', overflow: 'hidden',
        background: T.card,
        border: `1px solid ${color}22`,
        borderRadius: 20, padding: '20px 22px',
        boxShadow: `0 0 0 1px ${color}0a, 0 8px 32px rgba(0,0,0,0.45)`,
        backdropFilter: 'blur(20px)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.transform = 'translateY(-3px)'
        el.style.boxShadow = `0 0 0 1px ${color}30, 0 20px 60px rgba(0,0,0,0.6), 0 0 40px ${color}18`
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.transform = 'translateY(0)'
        el.style.boxShadow = `0 0 0 1px ${color}0a, 0 8px 32px rgba(0,0,0,0.45)`
      }}
    >
      {/* Corner glow */}
      <div style={{
        position: 'absolute', top: -40, right: -40,
        width: 120, height: 120, borderRadius: '50%',
        background: color, opacity: 0.06, filter: 'blur(40px)', pointerEvents: 'none',
      }} />
      {/* Bottom accent bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, borderRadius: '0 0 20px 20px',
        background: `linear-gradient(90deg, transparent, ${color}60, transparent)`,
      }} />

      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <p style={{ margin: 0, fontSize: 10.5, color: T.textSec, fontWeight: 700,
          letterSpacing: '0.07em', textTransform: 'uppercase' }}>
          {label}
        </p>
        <div style={{
          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
          background: `${color}14`, border: `1px solid ${color}25`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={15} color={color} />
        </div>
      </div>

      {/* Value */}
      <p style={{
        margin: '0 0 6px',
        fontSize: isCurrency ? 26 : 30,
        fontWeight: 900, color,
        letterSpacing: '-0.03em', lineHeight: 1,
      }}>
        {isCurrency ? formatCurrency(value) : value.toLocaleString('th-TH')}
      </p>

      {/* Sub / growth */}
      {sub && (
        <p style={{ margin: '4px 0 0', fontSize: 11, color: T.textSec }}>{sub}</p>
      )}
      {growth && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 8,
          padding: '3px 9px', borderRadius: 20,
          background: pos ? 'rgba(0,230,118,0.1)' : 'rgba(255,68,102,0.1)',
          border: `1px solid ${pos ? 'rgba(0,230,118,0.2)' : 'rgba(255,68,102,0.2)'}`,
        }}>
          {pos
            ? <ChevronUp size={11} color={T.green} strokeWidth={3} />
            : <ChevronDown size={11} color={T.red} strokeWidth={3} />
          }
          <span style={{ fontSize: 11, fontWeight: 800, color: pos ? T.green : T.red }}>
            {pos ? '+' : ''}{growth}%
          </span>
          <span style={{ fontSize: 10, color: T.textSec }}>vs ก่อนหน้า</span>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════
   CHART CARD WRAPPER
══════════════════════════════════════════ */
function ChartCard({
  title, sub, badge, accent = T.cyan, children, gridSpan,
}: {
  title: string, sub?: string, badge?: string, accent?: string,
  children: React.ReactNode, gridSpan?: string,
}) {
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`,
      borderRadius: 20, padding: '22px 24px',
      boxShadow: '0 8px 48px rgba(0,0,0,0.4)',
      backdropFilter: 'blur(20px)',
      display: 'flex', flexDirection: 'column',
      gridColumn: gridSpan,
    }}>
      {/* Card header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 3, height: 18, borderRadius: 3, background: `linear-gradient(to bottom, ${accent}, ${accent}44)`, flexShrink: 0 }} />
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: T.textPri }}>{title}</h3>
        </div>
        {badge && (
          <span style={{
            fontSize: 9, fontWeight: 800, letterSpacing: '0.1em',
            padding: '3px 8px', borderRadius: 20, textTransform: 'uppercase',
            background: `${accent}14`, border: `1px solid ${accent}25`, color: accent,
          }}>
            {badge}
          </span>
        )}
      </div>
      {sub && (
        <p style={{ margin: '0 0 16px 13px', fontSize: 11, color: T.textSec, lineHeight: 1.5 }}>{sub}</p>
      )}
      {!sub && <div style={{ marginBottom: 16 }} />}
      <div style={{ flex: 1, minHeight: 260 }}>{children}</div>
    </div>
  )
}

/* ══════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════ */
export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState(30)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async (days: number) => {
    try {
      setLoading(true); setError(null)
      const supabase = createClient()
      const now = new Date()
      const from = new Date(now); from.setDate(from.getDate() - days); from.setHours(0,0,0,0)
      const prevFrom = new Date(from); prevFrom.setDate(prevFrom.getDate() - days)

      const [
        { data: salesData, error: salesErr },
        { data: stockData },
        { data: productsData },
      ] = await Promise.all([
        supabase.from('sales')
          .select('id,created_at,total_amount,payment_method,status,sale_items(quantity,cost,line_total,product_name)')
          .gte('created_at', prevFrom.toISOString()),
        supabase.from('stock_receipts').select('id,total_cost,created_at').gte('created_at', from.toISOString()),
        supabase.from('products').select('id,name,price,cost,stock'),
      ])
      if (salesErr) throw salesErr

      const allPaid = (salesData ?? []).filter((s: { status: string }) => s.status === 'paid')
      const cur = allPaid.filter((s: { created_at: string }) => new Date(s.created_at) >= from)
      const prv = allPaid.filter((s: { created_at: string }) => new Date(s.created_at) < from)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const revenue = cur.reduce((s: number, x: any) => s + Number(x.total_amount), 0)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cogs = cur.reduce((s: number, x: any) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        s + (x.sale_items ?? []).reduce((c: number, it: any) => c + Number(it.cost??0)*Number(it.quantity??0), 0), 0)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const receiptsCost = (stockData ?? []).reduce((s: number, r: any) => s + Number(r.total_cost??0), 0)
      const opex = receiptsCost + revenue * 0.08
      const netProfit = revenue - cogs - opex
      const prevRevenue = prv.reduce((s: number, x: { total_amount: number }) => s + Number(x.total_amount), 0)
      const txCount = cur.length
      const avgOrder = txCount > 0 ? revenue / txCount : 0

      // Daily
      const dayMap: Record<string, { date: string; revenue: number; cogs: number; profit: number; ts: number }> = {}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cur.forEach((s: any) => {
        const dt = new Date(s.created_at)
        const label = dt.toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })
        if (!dayMap[label]) dayMap[label] = { date: label, revenue: 0, cogs: 0, profit: 0, ts: dt.getTime() }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sc = (s.sale_items??[]).reduce((x: number, it: any) => x + Number(it.cost??0)*Number(it.quantity??0), 0)
        const sr = Number(s.total_amount)
        dayMap[label].revenue += sr; dayMap[label].cogs += sc; dayMap[label].profit += sr - sc - sr*0.08
      })
      const dailyData = Object.values(dayMap).sort((a, b) => a.ts - b.ts)

      // Cumulative
      let cum = 0
      const areaData = dailyData.map(d => { cum += d.revenue; return { date: d.date, cumulative: cum } })

      // Payments
      const payMap: Record<string, number> = {}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cur.forEach((s: any) => { const pm = String(s.payment_method ?? 'other'); payMap[pm] = (payMap[pm]??0) + Number(s.total_amount) })
      const payLabels: Record<string, string> = { cash: 'เงินสด', transfer: 'โอนเงิน', qr: 'QR Code', card: 'บัตรเครดิต', mixed: 'หลายช่องทาง' }
      const paymentData = Object.entries(payMap).map(([k, v]) => ({ name: payLabels[k] ?? k, value: v, key: k }))

      // Donut finance
      const financeData = [
        { name: 'ต้นทุนขาย', value: Math.max(cogs, 0), color: T.red },
        { name: 'ค่าดำเนินงาน', value: Math.max(opex, 0), color: T.amber },
        { name: 'กำไรสุทธิ', value: Math.max(netProfit, 0), color: T.green },
      ]

      // Comparison
      const comparisonData = [
        { name: 'ยอดขาย', current: revenue, prev: prevRevenue },
        { name: 'ต้นทุน', current: cogs, prev: prevRevenue * 0.4 },
        { name: 'กำไร', current: netProfit, prev: prevRevenue * 0.45 },
      ]

      // Scatter
      const soldMap: Record<string, number> = {}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cur.forEach((s: any) => { (s.sale_items??[]).forEach((it: any) => { if(it.product_name) soldMap[it.product_name] = (soldMap[it.product_name]??0) + Number(it.quantity??0) }) })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const scatterData = (productsData??[]).map((p: any) => ({ name: p.name, price: Number(p.price??0), sold: soldMap[p.name]??0 })).filter((d: { sold: number }) => d.sold > 0)

      // Top products
      const topProducts = Object.entries(soldMap)
        .map(([name, sold]) => ({ name, sold }))
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 6)

      setData({ revenue, cogs, opex, netProfit, prevRevenue, txCount, avgOrder,
        dailyData, areaData, paymentData, financeData, comparisonData, scatterData, topProducts })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load analytics')
    } finally { setLoading(false); setRefreshing(false) }
  }, [])

  useEffect(() => { fetchData(period) }, [period, fetchData])

  /* Loading */
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '65vh', gap: 20 }}>
      <div style={{
        width: 72, height: 72, borderRadius: 22,
        background: 'linear-gradient(135deg, rgba(0,212,255,0.12), rgba(157,78,221,0.12))',
        border: '1px solid rgba(0,212,255,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 60px rgba(0,212,255,0.15)',
      }}>
        <Loader2 size={30} color={T.cyan} className="animate-spin" />
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: T.textPri }}>กำลังโหลด Analytics</p>
        <p style={{ margin: '5px 0 0', fontSize: 13, color: T.textSec }}>กำลังดึงข้อมูลจาก Supabase...</p>
      </div>
    </div>
  )

  /* Error */
  if (error || !data) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 22px',
      background: 'rgba(255,68,102,0.07)', border: '1px solid rgba(255,68,102,0.2)', borderRadius: 18, margin: 20 }}>
      <Activity size={22} color={T.red} />
      <div><p style={{ margin: 0, fontWeight: 800, color: T.red }}>เกิดข้อผิดพลาด</p>
        <p style={{ margin: '3px 0 0', fontSize: 12, color: T.textSec }}>{error}</p></div>
    </div>
  )

  const { revenue, cogs, opex, netProfit, prevRevenue, txCount, avgOrder,
    dailyData, areaData, paymentData, financeData, comparisonData, scatterData, topProducts } = data

  const margin   = revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : '0.0'
  const revGrowth = prevRevenue > 0 ? (((revenue - prevRevenue) / prevRevenue) * 100).toFixed(1) : null
  const fmtK = (v: number) => v >= 1e6 ? (v/1e6).toFixed(1)+'M' : v >= 1e3 ? (v/1e3).toFixed(0)+'k' : String(v)
  const topSold = topProducts[0]?.sold ?? 1

  const PERIODS = [{ label: '7 วัน', val: 7 }, { label: '30 วัน', val: 30 }, { label: '90 วัน', val: 90 }]

  return (
    <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', gap: 26 }}>

      {/* ══ HEADER ════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Icon box */}
          <div style={{
            width: 52, height: 52, borderRadius: 16, flexShrink: 0,
            background: 'linear-gradient(135deg, rgba(0,212,255,0.15) 0%, rgba(157,78,221,0.18) 100%)',
            border: '1px solid rgba(0,212,255,0.22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 30px rgba(0,212,255,0.18), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}>
            <BarChart2 size={24} color={T.cyan} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{
                margin: 0, fontSize: 27, fontWeight: 900, letterSpacing: '-0.03em',
                background: `linear-gradient(100deg, ${T.cyan} 0%, ${T.purple} 55%, ${T.green} 100%)`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>Analytics Dashboard</h1>
              <span style={{
                fontSize: 9, fontWeight: 800, padding: '3px 7px', borderRadius: 6,
                background: 'rgba(0,230,118,0.12)', border: '1px solid rgba(0,230,118,0.22)',
                color: T.green, letterSpacing: '0.08em',
              }}>LIVE</span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 12.5, color: T.textSec, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Zap size={11} color={T.amber} />
              ภาพรวมสถิติการขายและสถานะทางการเงิน · อัปเดตแบบ Real-time
            </p>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={() => { setRefreshing(true); fetchData(period) }}
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: T.card, border: `1px solid ${T.border}`,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: T.textSec, transition: 'all 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = `${T.cyan}50`; (e.currentTarget as HTMLButtonElement).style.color = T.cyan }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = T.border; (e.currentTarget as HTMLButtonElement).style.color = T.textSec }}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>

          <div style={{
            display: 'flex', gap: 3, padding: 4, borderRadius: 12,
            background: T.card, border: `1px solid ${T.border}`,
          }}>
            {PERIODS.map(p => (
              <button key={p.val} onClick={() => setPeriod(p.val)} style={{
                padding: '6px 14px', borderRadius: 9, fontSize: 11.5, fontWeight: 700,
                border: 'none', cursor: 'pointer', transition: 'all 0.18s',
                background: period === p.val
                  ? `linear-gradient(135deg, rgba(0,212,255,0.2), rgba(157,78,221,0.22))`
                  : 'transparent',
                color: period === p.val ? T.textPri : T.textSec,
                boxShadow: period === p.val ? `inset 0 0 0 1px rgba(0,212,255,0.28)` : 'none',
              }}>{p.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ══ KPI CARDS ════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 14 }}>
        <KpiCard label="รายรับ (Revenue)" value={revenue} color={T.cyan} Icon={DollarSign} growth={revGrowth} />
        <KpiCard label="ต้นทุนขาย (COGS)" value={cogs} color={T.red} Icon={Package} />
        <KpiCard label="ค่าดำเนินงาน (OpEx)" value={opex} color={T.amber} Icon={TrendingDown} />
        <KpiCard label="กำไรสุทธิ (Net Profit)" value={netProfit} color={T.green} Icon={TrendingUp} sub={`Margin ${margin}%`} />
        <KpiCard label="จำนวนบิล" value={txCount} color={T.purple} Icon={ShoppingBag} isCurrency={false} sub="รายการที่ชำระแล้ว" />
        <KpiCard label="มูลค่าเฉลี่ย / บิล" value={avgOrder} color={T.teal} Icon={CreditCard} />
      </div>

      {/* ══ FINANCIAL FLOW ══════════════════════════════════════ */}
      <div style={{
        background: T.card, border: `1px solid ${T.border}`,
        borderRadius: 20, padding: '20px 24px',
        boxShadow: '0 4px 30px rgba(0,0,0,0.35)', backdropFilter: 'blur(20px)',
      }}>
        {/* Section label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          <Sparkles size={13} color={T.amber} />
          <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: T.textSec, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Financial Cascade Flow
          </p>
        </div>

        {/* Flow nodes */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: 'รายรับ', value: revenue, color: T.cyan, pct: '100%' },
            null,
            { label: 'ต้นทุนขาย', value: cogs, color: T.red, pct: revenue > 0 ? `${((cogs/revenue)*100).toFixed(1)}%` : '—' },
            null,
            { label: 'ค่าดำเนินงาน', value: opex, color: T.amber, pct: revenue > 0 ? `${((opex/revenue)*100).toFixed(1)}%` : '—' },
            null,
            { label: 'กำไรสุทธิ', value: netProfit, color: T.green, pct: `${margin}%` },
          ].map((item, idx) => {
            if (!item) return (
              <ArrowRight key={`arrow-${idx}`} size={14} style={{ color: T.textMut, flexShrink: 0, margin: '0 2px' }} />
            )
            return (
              <div key={item.label} style={{
                flex: 1, minWidth: 120, padding: '12px 16px', borderRadius: 14,
                background: `${item.color}09`, border: `1px solid ${item.color}1e`,
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
                  background: item.color, opacity: 0.35, borderRadius: '0 0 14px 14px' }} />
                <p style={{ margin: '0 0 2px', fontSize: 9.5, color: T.textSec, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</p>
                <p style={{ margin: '0 0 3px', fontSize: 18, fontWeight: 900, color: item.color, letterSpacing: '-0.02em' }}>{formatCurrency(item.value)}</p>
                <p style={{ margin: 0, fontSize: 10, color: item.color, opacity: 0.7, fontWeight: 700 }}>{item.pct}</p>
              </div>
            )
          })}
        </div>

        {/* Progress bar */}
        {revenue > 0 && (
          <div style={{ marginTop: 18 }}>
            <div style={{ display: 'flex', height: 8, borderRadius: 6, overflow: 'hidden', gap: 1 }}>
              <div style={{ flex: Math.max(cogs, 0), background: `linear-gradient(90deg, ${T.red}cc, ${T.red})`, borderRadius: '6px 0 0 6px' }} />
              <div style={{ flex: Math.max(opex, 0), background: `linear-gradient(90deg, ${T.amber}cc, ${T.amber})` }} />
              <div style={{ flex: Math.max(netProfit, 0), background: `linear-gradient(90deg, ${T.green}cc, ${T.green})`, borderRadius: '0 6px 6px 0' }} />
            </div>
            <div style={{ display: 'flex', gap: 20, marginTop: 10 }}>
              {[{ l: 'ต้นทุนขาย', c: T.red }, { l: 'ค่าดำเนินงาน', c: T.amber }, { l: 'กำไรสุทธิ', c: T.green }].map(x => (
                <div key={x.l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: x.c, display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: T.textSec }}>{x.l}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ══ CHARTS ROW 1 ════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20 }}>

        {/* Bar: Daily Sales */}
        <ChartCard title="ยอดขายรายวัน" sub={`${period} วันล่าสุด`} badge="BAR" accent={T.cyan}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyData} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gBarRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={T.cyan} stopOpacity={1} />
                  <stop offset="100%" stopColor={T.cyan} stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis dataKey="date" stroke={T.textMut} fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke={T.textMut} fontSize={10} tickLine={false} axisLine={false} tickFormatter={fmtK} />
              <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(0,212,255,0.04)' }} />
              <Bar dataKey="revenue" name="ยอดขาย" fill="url(#gBarRev)" radius={[5,5,0,0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Line: Trend */}
        <ChartCard title="แนวโน้มการเติบโต" sub="รายรับ · ต้นทุน · กำไรรายวัน" badge="LINE" accent={T.green}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyData} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="date" stroke={T.textMut} fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke={T.textMut} fontSize={10} tickLine={false} axisLine={false} tickFormatter={fmtK} />
              <Tooltip content={<ChartTip />} />
              <Legend wrapperStyle={{ fontSize: 10.5, paddingTop: 8 }} />
              <Line type="monotone" dataKey="revenue" name="รายรับ" stroke={T.cyan} strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: T.cyan }} />
              <Line type="monotone" dataKey="cogs" name="ต้นทุน" stroke={T.red} strokeWidth={1.8} dot={false} strokeDasharray="5 3" />
              <Line type="monotone" dataKey="profit" name="กำไร" stroke={T.green} strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: T.green }} />
              {dailyData.length > 0 && (
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
              )}
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Pie: Payment */}
        <ChartCard title="ช่องทางชำระเงิน" sub="สัดส่วนรายได้แยกตามประเภท" badge="PIE" accent={T.amber}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={paymentData} cx="50%" cy="50%"
                outerRadius={100} paddingAngle={4}
                dataKey="value" stroke="none"
                labelLine={false} label={renderPieLabel}
              >
                {paymentData.map((entry: { key: string }, idx: number) => (
                  <Cell key={idx} fill={PAY_COLORS[entry.key] ?? PAY_COLORS.other} />
                ))}
              </Pie>
              <Tooltip content={<ChartTip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Donut: Financial */}
        <ChartCard title="สัดส่วนทางการเงิน" sub="ต้นทุน · ค่าใช้จ่าย · กำไร" badge="DONUT" accent={T.purple}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={financeData} cx="50%" cy="50%"
                innerRadius={68} outerRadius={102}
                paddingAngle={5} dataKey="value" stroke="none"
              >
                {financeData.map((entry: { color: string }, idx: number) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              {/* Center */}
              <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" fontSize={11} fill={T.textSec} fontWeight={600}>Margin</text>
              <text x="50%" y="57%" textAnchor="middle" dominantBaseline="middle" fontSize={22} fill={Number(margin) >= 0 ? T.green : T.red} fontWeight={900}>{margin}%</text>
              <Tooltip content={<ChartTip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Area: Cumulative */}
        <ChartCard title="รายรับสะสม" sub="ยอดขายรวมสะสมตามช่วงเวลา" badge="AREA" accent={T.purple}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={areaData} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={T.purple} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={T.purple} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="date" stroke={T.textMut} fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke={T.textMut} fontSize={10} tickLine={false} axisLine={false} tickFormatter={fmtK} />
              <Tooltip content={<ChartTip />} />
              <Area type="monotone" dataKey="cumulative" name="รายรับสะสม"
                stroke={T.purple} fill="url(#gArea)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Comparison Bar */}
        <ChartCard title="เปรียบเทียบผลประกอบการ" sub={`${period} วันปัจจุบัน vs ${period} วันก่อนหน้า`} badge="COMPARE" accent={T.teal}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gBarCur" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={T.teal} stopOpacity={0.95} />
                  <stop offset="100%" stopColor={T.teal} stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis dataKey="name" stroke={T.textMut} fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke={T.textMut} fontSize={10} tickLine={false} axisLine={false} tickFormatter={fmtK} />
              <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(0,191,165,0.04)' }} />
              <Legend wrapperStyle={{ fontSize: 10.5, paddingTop: 8 }} />
              <Bar dataKey="prev" name="ก่อนหน้า" fill="rgba(255,255,255,0.07)" radius={[5,5,0,0]} maxBarSize={26} />
              <Bar dataKey="current" name="ปัจจุบัน" fill="url(#gBarCur)" radius={[5,5,0,0]} maxBarSize={26} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

      </div>

      {/* ══ ROW 2: Scatter + Top Products ═══════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>

        {/* Scatter */}
        <ChartCard title="ราคา vs ปริมาณขาย" sub="แกน X: ราคา/ขวด  ·  แกน Y: จำนวนที่ขายได้ (ขวด)" badge="SCATTER" accent={T.cyan}>
          <div style={{ minHeight: 300 }}>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart margin={{ top: 16, right: 20, bottom: 16, left: 10 }}>
                <defs>
                  <radialGradient id="dotGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={T.cyan} stopOpacity={0.95} />
                    <stop offset="100%" stopColor={T.purple} stopOpacity={0.6} />
                  </radialGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis type="number" dataKey="price" name="ราคา" stroke={T.textMut} fontSize={10} tickLine={false} axisLine={false} tickFormatter={fmtK} />
                <YAxis type="number" dataKey="sold" name="จำนวนขาย" stroke={T.textMut} fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip content={<ScatterTip />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.08)' }} />
                <Scatter name="สินค้า" data={scatterData} fill="url(#dotGrad)" fillOpacity={0.85} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Top Products */}
        <div style={{
          background: T.card, border: `1px solid ${T.border}`,
          borderRadius: 20, padding: '22px 22px',
          boxShadow: '0 8px 48px rgba(0,0,0,0.4)', backdropFilter: 'blur(20px)',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{ width: 3, height: 18, borderRadius: 3, background: `linear-gradient(to bottom, ${T.rose}, ${T.rose}44)`, flexShrink: 0 }} />
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: T.textPri }}>สินค้าขายดี</h3>
            <span style={{
              marginLeft: 'auto', fontSize: 9, fontWeight: 800, letterSpacing: '0.1em',
              padding: '3px 7px', borderRadius: 20, textTransform: 'uppercase',
              background: `${T.rose}14`, border: `1px solid ${T.rose}25`, color: T.rose,
            }}>TOP 6</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
            {topProducts.map((p: { name: string; sold: number }, idx: number) => {
              const pct = topSold > 0 ? (p.sold / topSold) * 100 : 0
              const colors = [T.cyan, T.purple, T.teal, T.amber, T.rose, T.blue]
              const col = colors[idx] ?? T.textSec
              return (
                <div key={p.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <span style={{
                        width: 20, height: 20, borderRadius: 7, flexShrink: 0,
                        background: `${col}18`, border: `1px solid ${col}30`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, fontWeight: 800, color: col,
                      }}>{idx + 1}</span>
                      <span style={{ fontSize: 11.5, fontWeight: 600, color: T.textPri,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
                        {p.name}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: col, flexShrink: 0, marginLeft: 8 }}>
                      {p.sold} ขวด
                    </span>
                  </div>
                  <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.04)' }}>
                    <div style={{
                      height: '100%', width: `${pct}%`, borderRadius: 3,
                      background: `linear-gradient(90deg, ${col}aa, ${col})`,
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

    </div>
  )
}
