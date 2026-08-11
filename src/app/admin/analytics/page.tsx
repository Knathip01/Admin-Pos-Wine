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
import { ArrowRight, Loader2, TrendingUp, TrendingDown, DollarSign, Package } from 'lucide-react'

/* ─── Color palette ─────────────────────────────────── */
const C = {
  revenue: '#00d4ff',
  cogs: '#ff4466',
  opex: '#f59e0b',
  profit: '#00e676',
  purple: '#9d4edd',
  payment: {
    cash: '#f2c65c',
    transfer: '#38bdf8',
    qr: '#68dfcb',
    card: '#a78bfa',
    mixed: '#fb7185',
    other: '#94a3b8',
  } as Record<string, string>,
}

/* ─── Shared styles ─────────────────────────────────── */
const card: React.CSSProperties = {
  background: 'rgba(13,21,38,0.85)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 16,
  padding: 20,
  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  display: 'flex',
  flexDirection: 'column',
}

const titleStyle: React.CSSProperties = {
  margin: '0 0 4px 0',
  fontSize: 16,
  fontWeight: 700,
  color: '#e8f0ff',
}

const subStyle: React.CSSProperties = {
  margin: '0 0 16px 0',
  fontSize: 12,
  color: '#4a5a78',
}

const tooltipBox: React.CSSProperties = {
  background: '#0d1526',
  border: '1px solid rgba(0,212,255,0.15)',
  borderRadius: 10,
  padding: '10px 14px',
  color: '#e8f0ff',
  fontSize: 12,
  boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
}

/* ─── Custom recharts tooltip ───────────────────────── */
function ChartTip({ active, payload, label }: {
  active?: boolean
  payload?: { name: string; value: number; color?: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div style={tooltipBox}>
      {label && (
        <p style={{ margin: '0 0 6px', fontWeight: 700, color: '#00d4ff' }}>
          {label}
        </p>
      )}
      {payload.map((e, i) => (
        <p key={i} style={{ margin: '2px 0', color: e.color ?? '#fff' }}>
          {e.name}: {formatCurrency(e.value)}
        </p>
      ))}
    </div>
  )
}

/* ─── Scatter custom tooltip ────────────────────────── */
function ScatterTip({ active, payload }: {
  active?: boolean
  payload?: { payload?: { name: string; price: number; sold: number } }[]
}) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div style={tooltipBox}>
      <p style={{ margin: '0 0 5px', fontWeight: 700, color: '#00d4ff' }}>{d.name}</p>
      <p style={{ margin: '2px 0' }}>
        {'ราคา: '}
        {formatCurrency(d.price)}
      </p>
      <p style={{ margin: '2px 0' }}>
        {'ขายได้: '}
        {d.sold}
        {' ขวด'}
      </p>
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
        name: k.toUpperCase(),
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

      setData({ revenue, cogs, opex, netProfit, prevRevenue, dailyData, areaData, paymentData, financeData, comparisonData, scatterData })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData(period)
  }, [period, fetchData])

  /* ─── Loading ─────────── */
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', gap: 12, color: C.revenue }}>
        <Loader2 size={36} className="animate-spin" />
        <span style={{ fontSize: 18, fontWeight: 600 }}>กำลังโหลดข้อมูล Analytics…</span>
      </div>
    )
  }

  /* ─── Error ───────────── */
  if (error || !data) {
    return (
      <div style={{ color: '#ff4466', padding: 20, background: 'rgba(255,68,102,0.08)', borderRadius: 12, margin: 20 }}>
        {'เกิดข้อผิดพลาด: '}
        {error}
      </div>
    )
  }

  const { revenue, cogs, opex, netProfit, prevRevenue, dailyData, areaData, paymentData, financeData, comparisonData, scatterData } = data
  const margin = revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : '0.0'
  const revGrowth = prevRevenue > 0 ? (((revenue - prevRevenue) / prevRevenue) * 100).toFixed(1) : null

  /* ─── Axis formatter ──── */
  const fmtK = (v: number) => {
    if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M'
    if (v >= 1000) return (v / 1000).toFixed(0) + 'k'
    return String(v)
  }

  return (
    <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{
            margin: 0, fontSize: 28, fontWeight: 800,
            background: 'linear-gradient(90deg,#00d4ff,#9d4edd)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Analytics Dashboard
          </h1>
          <p style={{ margin: '4px 0 0', color: '#4a5a78', fontSize: 14 }}>
            ภาพรวมสถิติการขายและสถานะทางการเงิน
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6, background: 'rgba(13,21,38,0.8)', padding: 4, borderRadius: 10, border: '1px solid rgba(0,212,255,0.1)' }}>
          {[7, 30, 90].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                background: period === p ? 'rgba(0,212,255,0.15)' : 'transparent',
                color: period === p ? '#00d4ff' : '#4a5a78',
              }}
            >
              {p}
              {' วัน'}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
        {[
          { label: 'รายรับ (Revenue)', value: revenue, color: C.revenue, icon: DollarSign, growth: revGrowth },
          { label: 'ต้นทุนขาย (COGS)', value: cogs, color: C.cogs, icon: Package, growth: null },
          { label: 'ค่าดำเนินงาน (OpEx)', value: opex, color: C.opex, icon: TrendingDown, growth: null },
          { label: 'กำไรสุทธิ (Net Profit)', value: netProfit, color: C.profit, icon: TrendingUp, growth: null },
        ].map(kpi => (
          <div key={kpi.label} style={{ ...card, borderColor: kpi.color + '22' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <p style={{ margin: 0, fontSize: 12, color: '#4a5a78', fontWeight: 600 }}>{kpi.label}</p>
              <kpi.icon size={18} style={{ color: kpi.color, opacity: 0.7 }} />
            </div>
            <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: kpi.color }}>
              {formatCurrency(kpi.value)}
            </p>
            {kpi.growth && (
              <p style={{ margin: '6px 0 0', fontSize: 12, color: Number(kpi.growth) >= 0 ? C.profit : C.cogs }}>
                {Number(kpi.growth) >= 0 ? '+' : ''}
                {kpi.growth}
                {'% vs ช่วงก่อน'}
              </p>
            )}
            {kpi.label.includes('กำไร') && (
              <p style={{ margin: '6px 0 0', fontSize: 12, color: C.profit }}>
                {'Margin: '}
                {margin}
                {'%'}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* ── Financial Flow ── */}
      <div style={{ ...card, padding: '16px 24px', flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'รายรับ', value: revenue, color: C.revenue },
          null,
          { label: 'ต้นทุนขาย', value: cogs, color: C.cogs },
          null,
          { label: 'ค่าดำเนินงาน', value: opex, color: C.opex },
          null,
          { label: 'กำไรสุทธิ', value: netProfit, color: C.profit },
        ].map((item, idx) => {
          if (item === null) {
            return <ArrowRight key={idx} size={18} style={{ color: '#4a5a78', flexShrink: 0 }} />
          }
          return (
            <div key={idx} style={{ flex: 1, minWidth: 130 }}>
              <p style={{ margin: '0 0 4px', fontSize: 11, color: '#4a5a78', fontWeight: 600 }}>
                {item.label}
              </p>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: item.color }}>
                {formatCurrency(item.value)}
              </p>
            </div>
          )
        })}
      </div>

      {/* ── Charts Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(380px,1fr))', gap: 24 }}>

        {/* 1 Bar – Daily Sales */}
        <div style={card}>
          <h3 style={titleStyle}>ยอดขายรายวัน</h3>
          <p style={subStyle}>
            {'เปรียบเทียบยอดขายในแต่ละวัน ('}
            {period}
            {' วันล่าสุด)'}
          </p>
          <div style={{ flex: 1, minHeight: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="#4a5a78" fontSize={11} tickMargin={8} />
                <YAxis stroke="#4a5a78" fontSize={11} tickFormatter={fmtK} />
                <Tooltip content={<ChartTip />} />
                <Bar dataKey="revenue" name="ยอดขาย" fill={C.revenue} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2 Line – Revenue vs COGS vs Profit */}
        <div style={card}>
          <h3 style={titleStyle}>แนวโน้มการเติบโต</h3>
          <p style={subStyle}>รายรับ, ต้นทุน และกำไรรายวัน</p>
          <div style={{ flex: 1, minHeight: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="#4a5a78" fontSize={11} />
                <YAxis stroke="#4a5a78" fontSize={11} tickFormatter={fmtK} />
                <Tooltip content={<ChartTip />} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Line type="monotone" dataKey="revenue" name="รายรับ" stroke={C.revenue} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="cogs" name="ต้นทุน" stroke={C.cogs} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="profit" name="กำไร" stroke={C.profit} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3 Pie – Payment Methods */}
        <div style={card}>
          <h3 style={titleStyle}>ช่องทางการชำระเงิน</h3>
          <p style={subStyle}>สัดส่วนรายได้แยกตามประเภท</p>
          <div style={{ flex: 1, minHeight: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {paymentData.map((entry: { key: string }, idx: number) => (
                    <Cell key={idx} fill={C.payment[entry.key] ?? C.payment.other} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4 Donut – Financial Breakdown */}
        <div style={card}>
          <h3 style={titleStyle}>สัดส่วนทางการเงิน</h3>
          <p style={subStyle}>การกระจายรายรับ: ต้นทุน / ค่าใช้จ่าย / กำไร</p>
          <div style={{ flex: 1, minHeight: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={financeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="rgba(0,0,0,0.4)"
                  strokeWidth={2}
                >
                  {financeData.map((entry: { color: string }, idx: number) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 5 Area – Cumulative Revenue */}
        <div style={card}>
          <h3 style={titleStyle}>รายรับสะสม</h3>
          <p style={subStyle}>ยอดขายรวมสะสมตามช่วงเวลา</p>
          <div style={{ flex: 1, minHeight: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradCum" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.purple} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={C.purple} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="#4a5a78" fontSize={11} />
                <YAxis stroke="#4a5a78" fontSize={11} tickFormatter={fmtK} />
                <Tooltip content={<ChartTip />} />
                <Area type="monotone" dataKey="cumulative" name="รายรับสะสม" stroke={C.purple} fill="url(#gradCum)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 6 Comparison Bar */}
        <div style={card}>
          <h3 style={titleStyle}>เปรียบเทียบผลประกอบการ</h3>
          <p style={subStyle}>
            {period}
            {' วันปัจจุบัน เทียบกับ '}
            {period}
            {' วันก่อนหน้า'}
          </p>
          <div style={{ flex: 1, minHeight: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#4a5a78" fontSize={11} />
                <YAxis stroke="#4a5a78" fontSize={11} tickFormatter={fmtK} />
                <Tooltip content={<ChartTip />} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Bar dataKey="prev" name="ช่วงก่อนหน้า" fill="rgba(255,255,255,0.15)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="current" name="ช่วงปัจจุบัน" fill={C.revenue} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 7 Scatter – Price vs Quantity Sold (full width) */}
      <div style={card}>
        <h3 style={titleStyle}>ความสัมพันธ์ราคา vs ปริมาณขาย</h3>
        <p style={subStyle}>แกน X: ราคาต่อขวด, แกน Y: จำนวนที่ขายได้ (ขวด)</p>
        <div style={{ minHeight: 320 }}>
          <ResponsiveContainer width="100%" height={320}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" dataKey="price" name="ราคา" stroke="#4a5a78" fontSize={11} />
              <YAxis type="number" dataKey="sold" name="จำนวนขาย" stroke="#4a5a78" fontSize={11} />
              <Tooltip content={<ScatterTip />} />
              <Scatter name="สินค้า" data={scatterData} fill={C.revenue} fillOpacity={0.7} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  )
}
