'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CreditCard,
  Loader2,
  Package,
  Receipt,
  TrendingUp,
  WalletCards,
  X,
  Coffee,
  UtensilsCrossed,
  Wine,
  CheckCircle2,
  ClipboardCheck,
} from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

type DateRange = 7 | 30 | 90 | 'all' | 'custom'

type ReadinessRole = 'all' | 'cashier' | 'stock_staff' | 'kitchen' | 'bar'

const READINESS_ROLE_CONFIG: Record<'cashier' | 'stock_staff' | 'kitchen' | 'bar', {
  label: string
  shortLabel: string
  icon: typeof Coffee
  color: string
  bg: string
  border: string
  desc: string
}> = {
  cashier: {
    label: 'Cashier (แคชเชียร์)',
    shortLabel: 'Cashier',
    icon: Coffee,
    color: '#34d399',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.28)',
    desc: 'ความพร้อมเคาน์เตอร์แคชเชียร์ ตรวจเงินทอน และการเปิด-ปิดกะ'
  },
  stock_staff: {
    label: 'Stock Staff (สต๊อกสินค้า)',
    shortLabel: 'Stock Staff',
    icon: Package,
    color: '#c084fc',
    bg: 'rgba(168, 85, 247, 0.12)',
    border: 'rgba(168, 85, 247, 0.28)',
    desc: 'ความเรียบร้อยคลังสินค้า ตรวจนับสต๊อก และพื้นที่จัดเก็บสินค้า'
  },
  kitchen: {
    label: 'Kitchen (ห้องครัว)',
    shortLabel: 'Kitchen',
    icon: UtensilsCrossed,
    color: '#fb7185',
    bg: 'rgba(244, 63, 94, 0.12)',
    border: 'rgba(244, 63, 94, 0.28)',
    desc: 'ความสะอาดห้องครัว สภาพเตา-อุปกรณ์ และความพร้อมวัตถุดิบ'
  },
  bar: {
    label: 'Bar (บาร์เครื่องดื่ม)',
    shortLabel: 'Bar',
    icon: Wine,
    color: '#818cf8',
    bg: 'rgba(99, 102, 241, 0.12)',
    border: 'rgba(99, 102, 241, 0.28)',
    desc: 'ความเรียบร้อยบาร์ สต๊อกแก้วไวน์ และความสะอาดเคาน์เตอร์บาร์'
  }
}

interface ReportSaleItem {
  product_name: string
  quantity: number
  line_total: number
  cost: number
}

interface ReportSale {
  id: string
  receipt_no: string
  created_at: string
  total_amount: number
  payment_method: 'cash' | 'transfer' | 'qr' | 'card' | 'mixed'
  profiles: { full_name: string }[] | { full_name: string } | null
  sale_items: ReportSaleItem[] | null
}

interface ChartPoint {
  date: string
  sales: number
}

const PAYMENT_META = {
  cash: { label: 'เงินสด', color: '#fbbf24' },
  transfer: { label: 'โอนเงิน', color: '#60a5fa' },
  qr: { label: 'QR Payment', color: '#34d399' },
  card: { label: 'บัตร', color: '#c084fc' },
  mixed: { label: 'หลายช่องทาง', color: '#fb7185' },
}

const numberValue = (value: number | string | null | undefined) => Number(value || 0)

export default function ReportsPage() {
  const supabase = useMemo(() => createClient(), [])
  const [range, setRange] = useState<DateRange>('all')
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date()
    d.setDate(d.getDate() - 29)
    return d.toISOString().slice(0, 10)
  })
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(true)
  const [sales, setSales] = useState<ReportSale[]>([])
  const [receipts, setReceipts] = useState<any[]>([])
  const [selectedCashierDetail, setSelectedCashierDetail] = useState<string | null>(null)
  const [selectedStockStaffDetail, setSelectedStockStaffDetail] = useState<string | null>(null)
  const [shopReports, setShopReports] = useState<any[]>([])
  const [newArrivals, setNewArrivals] = useState<any[]>([])
  const [bottomTab, setBottomTab] = useState<'staff' | 'arrivals' | 'readiness'>('staff')
  const [readinessRole, setReadinessRole] = useState<ReadinessRole>('all')
  const [selectedShopReportImage, setSelectedShopReportImage] = useState<string[] | null>(null)

  const loadReport = useCallback(async (days: DateRange, customStart?: string, customEnd?: string) => {
    setLoading(true)

    let salesQuery = supabase
      .from('sales')
      .select('id, receipt_no, created_at, total_amount, payment_method, profiles(full_name), sale_items(product_name, quantity, line_total, cost)')
      .order('created_at', { ascending: false })

    let receiptsQuery = supabase
      .from('stock_receipts')
      .select('id, receipt_no, created_at, total_cost, supplier_name, stock_receipt_items(product_id, quantity, cost)')
      .order('created_at', { ascending: false })

    let shopReportsQuery = supabase
      .from('shop_reports')
      .select('*')
      .order('created_at', { ascending: false })

    let newArrivalsQuery = supabase
      .from('inventory_movements')
      .select('*, products(name, sku, image_url)')
      .eq('movement_type', 'in')
      .order('created_at', { ascending: false })

    if (days === 'custom' && customStart) {
      const start = new Date(customStart)
      start.setHours(0, 0, 0, 0)
      const fromISO = start.toISOString()
      salesQuery = salesQuery.gte('created_at', fromISO)
      receiptsQuery = receiptsQuery.gte('created_at', fromISO)
      shopReportsQuery = shopReportsQuery.gte('created_at', fromISO)
      newArrivalsQuery = newArrivalsQuery.gte('created_at', fromISO)

      if (customEnd) {
        const end = new Date(customEnd)
        end.setHours(23, 59, 59, 999)
        const toISO = end.toISOString()
        salesQuery = salesQuery.lte('created_at', toISO)
        receiptsQuery = receiptsQuery.lte('created_at', toISO)
        shopReportsQuery = shopReportsQuery.lte('created_at', toISO)
        newArrivalsQuery = newArrivalsQuery.lte('created_at', toISO)
      }
    } else if (typeof days === 'number') {
      const from = new Date()
      from.setHours(0, 0, 0, 0)
      from.setDate(from.getDate() - (days - 1))
      const fromISO = from.toISOString()
      const toISO = new Date().toISOString()
      salesQuery = salesQuery.gte('created_at', fromISO).lte('created_at', toISO)
      receiptsQuery = receiptsQuery.gte('created_at', fromISO).lte('created_at', toISO)
      shopReportsQuery = shopReportsQuery.gte('created_at', fromISO).lte('created_at', toISO)
      newArrivalsQuery = newArrivalsQuery.gte('created_at', fromISO).lte('created_at', toISO)
    }

    try {
      const [
        salesRes,
        receiptsRes,
        shopReportsApiRes,
        newArrivalsRes
      ] = await Promise.all([
        Promise.resolve(salesQuery).catch(() => ({ data: [] })),
        Promise.resolve(receiptsQuery).catch(() => ({ data: [] })),
        fetch('/api/admin/shop-reports', { cache: 'no-store' })
          .then(r => r.json())
          .then(d => ({ data: d.reports || [] }))
          .catch(() => Promise.resolve(shopReportsQuery).catch(() => ({ data: [] }))),
        Promise.resolve(newArrivalsQuery).catch(() => ({ data: [] }))
      ])

      let loadedReports = (shopReportsApiRes as any)?.data || []
      if (days === 'custom' && customStart) {
        const start = new Date(customStart).getTime()
        const end = customEnd ? new Date(customEnd).setHours(23, 59, 59, 999) : Infinity
        loadedReports = loadedReports.filter((r: any) => {
          const t = new Date(r.created_at).getTime()
          return t >= start && t <= end
        })
      } else if (typeof days === 'number') {
        const fromTime = new Date().getTime() - days * 24 * 60 * 60 * 1000
        loadedReports = loadedReports.filter((r: any) => {
          const t = new Date(r.created_at).getTime()
          return t >= fromTime
        })
      }

      setSales(((salesRes as any)?.data as any) || [])
      setReceipts((receiptsRes as any)?.data || [])
      setShopReports(loadedReports)
      setNewArrivals((newArrivalsRes as any)?.data || [])
    } catch {
      setSales([])
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadReport(range, startDate, endDate)
  }, [range, startDate, endDate, loadReport])

  const report = useMemo(() => {
    const totalSales = sales.reduce((sum, s) => sum + numberValue(s.total_amount), 0)
    const orderCount = sales.length

    let totalCost = 0
    for (const sale of sales) {
      if (sale.sale_items) {
        for (const item of sale.sale_items) {
          totalCost += numberValue(item.cost) * numberValue(item.quantity)
        }
      }
    }
    const grossProfit = totalSales - totalCost

    const change = 12.5

    const dateMap = new Map<string, number>()
    for (const sale of sales) {
      const d = sale.created_at.slice(0, 10)
      dateMap.set(d, (dateMap.get(d) || 0) + numberValue(sale.total_amount))
    }

    const chartData: ChartPoint[] = Array.from(dateMap.entries())
      .map(([date, sales]) => ({ date, sales }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const paymentMap = new Map<string, number>()
    for (const sale of sales) {
      paymentMap.set(sale.payment_method, (paymentMap.get(sale.payment_method) || 0) + numberValue(sale.total_amount))
    }

    const paymentTotals = Array.from(paymentMap.entries()).map(([method, amount]) => ({
      method: method as keyof typeof PAYMENT_META,
      amount
    }))

    const productMap = new Map<string, { quantity: number; sales: number }>()
    for (const sale of sales) {
      if (sale.sale_items) {
        for (const item of sale.sale_items) {
          const current = productMap.get(item.product_name) || { quantity: 0, sales: 0 }
          productMap.set(item.product_name, {
            quantity: current.quantity + numberValue(item.quantity),
            sales: current.sales + numberValue(item.line_total)
          })
        }
      }
    }

    const topProducts = Array.from(productMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5)

    const recentSales = sales.slice(0, 5)

    const cashierMap = new Map<string, { totalSales: number; orderCount: number; avgBill: number }>()
    for (const sale of sales) {
      let cashierName = 'ไม่ระบุ'
      if (sale.profiles) {
        if (Array.isArray(sale.profiles)) {
          cashierName = sale.profiles[0]?.full_name || 'ไม่ระบุ'
        } else {
          cashierName = sale.profiles.full_name || 'ไม่ระบุ'
        }
      }
      const current = cashierMap.get(cashierName) || { totalSales: 0, orderCount: 0, avgBill: 0 }
      const newTotal = current.totalSales + numberValue(sale.total_amount)
      const newCount = current.orderCount + 1
      cashierMap.set(cashierName, {
        totalSales: newTotal,
        orderCount: newCount,
        avgBill: newTotal / newCount
      })
    }
    const cashierReports = Array.from(cashierMap.entries()).map(([name, data]) => ({
      name,
      totalSales: data.totalSales,
      orderCount: data.orderCount,
      avgBill: data.avgBill
    })).sort((a, b) => b.totalSales - a.totalSales)

    const stockStaffMap = new Map<string, { totalCost: number; receiptCount: number }>()
    for (const receipt of receipts) {
      let staffName = 'ไม่ระบุ'
      if (receipt.profiles) {
        if (Array.isArray(receipt.profiles)) {
          staffName = receipt.profiles[0]?.full_name || 'ไม่ระบุ'
        } else {
          staffName = receipt.profiles.full_name || 'ไม่ระบุ'
        }
      }
      const current = stockStaffMap.get(staffName) || { totalCost: 0, receiptCount: 0 }
      stockStaffMap.set(staffName, {
        totalCost: current.totalCost + numberValue(receipt.total_cost),
        receiptCount: current.receiptCount + 1
      })
    }
    const stockStaffReports = Array.from(stockStaffMap.entries()).map(([name, data]) => ({
      name,
      totalCost: data.totalCost,
      receiptCount: data.receiptCount
    })).sort((a, b) => b.totalCost - a.totalCost)

    return {
      totalSales,
      orderCount,
      grossProfit,
      averageOrder: orderCount ? totalSales / orderCount : 0,
      change,
      chartData,
      paymentTotals,
      topProducts,
      recentSales,
      cashierReports,
      stockStaffReports,
    }
  }, [range, sales, receipts, startDate, endDate])

  return (
    <div className="animate-in" style={{ padding: '20px', maxWidth: 1540 }}>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.4rem', fontWeight: 900, color: '#eef2ff', letterSpacing: '-0.025em', margin: 0 }}>
              📈 รายงานยอดขายและสถิติ
            </h1>
          </div>
          <p style={{ color: '#3d4d6a', fontSize: 13, fontWeight: 600, marginTop: 4 }}>
            ภาพรวมยอดขายและสินค้าที่ทำผลงานดี
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="flex rounded-xl p-1" style={{ border: '1px solid rgba(255,255,255,0.07)', background: '#161b27' }}>
            <button
              type="button"
              onClick={() => setRange('all')}
              className="rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer"
              style={range === 'all'
                ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: '1px solid rgba(99,102,241,0.50)', boxShadow: '0 2px 10px rgba(99,102,241,0.30)' }
                : { color: '#64748b', border: '1px solid transparent' }}
            >
              ทั้งหมด
            </button>
            {([90, 30, 7] as (7 | 30 | 90)[]).map(days => (
              <button
                key={days}
                type="button"
                onClick={() => setRange(days)}
                className="rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer"
                style={range === days
                  ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: '1px solid rgba(99,102,241,0.50)', boxShadow: '0 2px 10px rgba(99,102,241,0.30)' }
                  : { color: '#64748b', border: '1px solid transparent' }}
              >
                {days} วัน
              </button>
            ))}
            <button
              type="button"
              onClick={() => setRange('custom')}
              className="rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer"
              style={range === 'custom'
                ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: '1px solid rgba(99,102,241,0.50)', boxShadow: '0 2px 10px rgba(99,102,241,0.30)' }
                : { color: '#64748b', border: '1px solid transparent' }}
            >
              กำหนดเอง
            </button>
          </div>

          {range === 'custom' && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }} className="animate-in">
              <input
                type="date"
                className="admin-input text-xs"
                style={{ padding: '6px 12px', width: 'auto' }}
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
              <span className="text-xs" style={{ color: '#3d4d6a', fontWeight: 700 }}>ถึง</span>
              <input
                type="date"
                className="admin-input text-xs"
                style={{ padding: '6px 12px', width: 'auto' }}
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-96 items-center justify-center">
          <Loader2 size={32} className="animate-spin" style={{ color: '#22e5ff' }} />
        </div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={WalletCards} label="ยอดขายรวม" value={formatCurrency(report.totalSales)} tone="#22e5ff" />
            <MetricCard icon={Receipt} label="จำนวนบิล" value={`${report.orderCount.toLocaleString('th-TH')} บิล`} tone="#2dd4bf" />
            <MetricCard icon={TrendingUp} label="ยอดขายเฉลี่ยต่อบิล" value={formatCurrency(report.averageOrder)} tone="#fbbf24" />
            <MetricCard icon={BarChart3} label="กำไรขั้นต้น" value={formatCurrency(report.grossProfit)} tone="#c084fc" />
          </section>

          <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,.85fr)]">
            <div className="glass-card p-5">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-white">แนวโน้มยอดขาย</h2>
                  <p className="mt-1 text-xs" style={{ color: '#64748b' }}>
                    ยอดขายที่ชำระแล้วในช่วง {range === 'all' ? 'ทั้งหมด' : range === 'custom' ? `${startDate} ถึง ${endDate}` : `${range} วันล่าสุด`}
                  </p>
                </div>
                <span
                  className="flex items-center gap-1 text-xs font-bold"
                  style={{ color: report.change >= 0 ? '#68dfcb' : '#fda4af' }}
                >
                  {report.change >= 0 ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
                  {Math.abs(report.change).toFixed(1)}%
                </span>
              </div>
              <div style={{ height: 285 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={report.chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="sales-area" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#2fc6b5" stopOpacity={0.34} />
                        <stop offset="100%" stopColor="#2fc6b5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#25364d" strokeDasharray="3 3" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#718198', fontSize: 11 }} minTickGap={22} />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#718198', fontSize: 11 }}
                      width={68}
                      tickFormatter={value => `฿${Math.round(value / 1000)}k`}
                    />
                    <Tooltip
                      cursor={{ stroke: '#22e5ff', strokeOpacity: 0.35 }}
                      contentStyle={{ border: '1px solid rgba(0,212,255,0.30)', borderRadius: 12, background: 'rgba(10,14,26,0.95)', color: '#eef2ff', boxShadow: '0 12px 32px rgba(0,0,0,0.7)' }}
                      formatter={value => [
                        formatCurrency(typeof value === 'number' || typeof value === 'string' ? Number(value) : 0),
                        'ยอดขาย',
                      ]}
                    />
                    <Area type="monotone" dataKey="sales" stroke="#22e5ff" strokeWidth={2.5} fill="url(#sales-area)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="admin-panel p-5">
              <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 900, color: '#eef2ff', margin: 0 }}>ช่องทางการชำระ</h2>
              <p style={{ color: '#3d4d6a', fontSize: 12, fontWeight: 600, marginTop: 4 }}>สัดส่วนตามยอดรับชำระ</p>
              <div className="mt-6 space-y-5">
                {report.paymentTotals.length === 0 ? (
                  <EmptyState label="ยังไม่มีรายการชำระเงิน" />
                ) : report.paymentTotals.map(item => {
                  const meta = PAYMENT_META[item.method]
                  const share = report.totalSales ? (item.amount / report.totalSales) * 100 : 0
                  return (
                    <div key={item.method}>
                      <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                        <span className="flex items-center gap-2 font-bold" style={{ color: '#94a3c4' }}>
                          <span className="h-2 w-2 rounded-full" style={{ background: meta.color, boxShadow: `0 0 8px ${meta.color}` }} />
                          {meta.label}
                        </span>
                        <span className="font-extrabold text-[#eef2ff]">{share.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${share}%`, background: meta.color, boxShadow: `0 0 10px ${meta.color}66` }} />
                      </div>
                      <p className="mt-1.5 text-right text-xs font-bold" style={{ color: '#5a6e90' }}>{formatCurrency(item.amount)}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          <section className="mt-5 grid gap-5 xl:grid-cols-2">
            <div className="admin-panel overflow-hidden p-0">
              <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <div>
                  <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 900, color: '#eef2ff', margin: 0 }}>สินค้าขายดี</h2>
                  <p style={{ color: '#3d4d6a', fontSize: 12, fontWeight: 600, marginTop: 4 }}>เรียงตามยอดขาย</p>
                </div>
                <Package size={18} style={{ color: '#22e5ff' }} />
              </div>
              {report.topProducts.length === 0 ? <EmptyState label="ยังไม่มีข้อมูลสินค้า" /> : (
                <div>
                  {report.topProducts.map((product, index) => (
                    <div key={product.name} className="flex items-center gap-3 border-b px-5 py-3.5 last:border-b-0 hover:bg-[rgba(0,212,255,0.03)] transition-colors" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black" style={{ background: index === 0 ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.05)', color: index === 0 ? '#fbbf24' : '#5a6e90', border: index === 0 ? '1px solid rgba(251,191,36,0.30)' : '1px solid rgba(255,255,255,0.05)' }}>
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-[#eef2ff] m-0">{product.name}</p>
                        <p className="mt-0.5 text-xs font-semibold" style={{ color: '#3d4d6a', margin: '2px 0 0' }}>{product.quantity.toLocaleString('th-TH')} หน่วย</p>
                      </div>
                      <p className="shrink-0 text-xs font-black" style={{ color: '#22e5ff' }}>{formatCurrency(product.sales)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="admin-panel overflow-hidden p-0">
              <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <div>
                  <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 900, color: '#eef2ff', margin: 0 }}>บิลล่าสุด</h2>
                  <p style={{ color: '#3d4d6a', fontSize: 12, fontWeight: 600, marginTop: 4 }}>การชำระเงินที่ยืนยันแล้ว</p>
                </div>
                <CreditCard size={18} style={{ color: '#2dd4bf' }} />
              </div>
              {report.recentSales.length === 0 ? <EmptyState label="ยังไม่มีรายการขาย" /> : (
                <div>
                  {report.recentSales.map(sale => {
                    const meta = PAYMENT_META[sale.payment_method]
                    return (
                      <div key={sale.id} className="flex items-center gap-3 border-b px-5 py-3.5 last:border-b-0 hover:bg-[rgba(0,212,255,0.03)] transition-colors" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                        <span className="h-2 w-2 rounded-full" style={{ background: meta.color, boxShadow: `0 0 6px ${meta.color}` }} />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-[#eef2ff] m-0">{meta.label}</p>
                          <p className="text-xs font-semibold" style={{ color: '#3d4d6a', margin: '2px 0 0' }}>
                            {new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(sale.created_at))}
                          </p>
                        </div>
                        <p className="shrink-0 text-xs font-black text-[#eef2ff]">{formatCurrency(numberValue(sale.total_amount))}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-4 mt-7 border-b animate-in" style={{ borderColor: 'rgba(255,255,255,0.07)', paddingBottom: 8 }}>
            <div className="flex gap-2">
              <button
                onClick={() => setBottomTab('staff')}
                className="font-bold text-xs transition-all cursor-pointer"
                style={{
                  background: 'none', border: 'none', color: bottomTab === 'staff' ? '#22e5ff' : '#3d4d6a',
                  borderBottom: bottomTab === 'staff' ? '2px solid #22e5ff' : '2px solid transparent',
                  padding: '8px 16px 12px', marginBottom: -10
                }}
              >
                👥 วิเคราะห์พนักงาน (Staff)
              </button>
              <button
                onClick={() => setBottomTab('arrivals')}
                className="font-bold text-xs transition-all cursor-pointer"
                style={{
                  background: 'none', border: 'none', color: bottomTab === 'arrivals' ? '#22e5ff' : '#3d4d6a',
                  borderBottom: bottomTab === 'arrivals' ? '2px solid #22e5ff' : '2px solid transparent',
                  padding: '8px 16px 12px', marginBottom: -10
                }}
              >
                📦 สินค้าเข้าใหม่ (Arrivals)
              </button>
              <button
                onClick={() => setBottomTab('readiness')}
                className="font-bold text-xs transition-all cursor-pointer"
                style={{
                  background: 'none', border: 'none', color: bottomTab === 'readiness' ? '#22e5ff' : '#3d4d6a',
                  borderBottom: bottomTab === 'readiness' ? '2px solid #22e5ff' : '2px solid transparent',
                  padding: '8px 16px 12px', marginBottom: -10
                }}
              >
                📋 รายงานความเรียบร้อย (Readiness)
              </button>
            </div>
          </div>

          {bottomTab === 'staff' && (
            <section className="mt-5 grid gap-5 xl:grid-cols-2">
            <div className="admin-table-wrap overflow-hidden">
              <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <div>
                  <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 900, color: '#eef2ff', margin: 0 }}>รายงานยอดขายตามแคชเชียร์</h2>
                  <p style={{ color: '#3d4d6a', fontSize: 12, fontWeight: 600, marginTop: 4 }}>ประสิทธิภาพการขายรายบุคคลในช่วง {range === 'custom' ? `${startDate} ถึง ${endDate}` : `${range} วันล่าสุด`}</p>
                </div>
                <Receipt size={18} style={{ color: '#22e5ff' }} />
              </div>
              {report.cashierReports.length === 0 ? <EmptyState label="ยังไม่มีข้อมูลแคชเชียร์" /> : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr className="admin-table-head">
                        <th style={{ padding: '12px 18px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: '#1e2d48', textTransform: 'uppercase', letterSpacing: '0.12em' }}>แคชเชียร์</th>
                        <th style={{ padding: '12px 18px', textAlign: 'right', fontSize: 10, fontWeight: 800, color: '#1e2d48', textTransform: 'uppercase', letterSpacing: '0.12em' }}>จำนวนบิล</th>
                        <th style={{ padding: '12px 18px', textAlign: 'right', fontSize: 10, fontWeight: 800, color: '#1e2d48', textTransform: 'uppercase', letterSpacing: '0.12em' }}>ยอดขายเฉลี่ย/บิล</th>
                        <th style={{ padding: '12px 18px', textAlign: 'right', fontSize: 10, fontWeight: 800, color: '#1e2d48', textTransform: 'uppercase', letterSpacing: '0.12em' }}>ยอดขายรวม</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.cashierReports.map(c => (
                        <tr key={c.name}
                          onClick={() => setSelectedCashierDetail(c.name)}
                          className="admin-table-row cursor-pointer">
                          <td style={{ padding: '12px 18px', fontSize: 13, fontWeight: 700, color: '#eef2ff' }}>{c.name}</td>
                          <td style={{ padding: '12px 18px', fontSize: 13, textAlign: 'right', color: '#5a6e90', fontWeight: 600 }}>{c.orderCount} บิล</td>
                          <td style={{ padding: '12px 18px', fontSize: 13, textAlign: 'right', color: '#5a6e90', fontWeight: 600 }}>{formatCurrency(c.avgBill)}</td>
                          <td style={{ padding: '12px 18px', fontSize: 13, textAlign: 'right', fontWeight: 900, color: '#22e5ff' }}>{formatCurrency(c.totalSales)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="admin-table-wrap overflow-hidden">
              <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <div>
                  <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 900, color: '#eef2ff', margin: 0 }}>รายงานการนำเข้าสต๊อกตามเจ้าหน้าที่</h2>
                  <p style={{ color: '#3d4d6a', fontSize: 12, fontWeight: 600, marginTop: 4 }}>การทำรายการรับสินค้าเข้าในช่วง {range === 'custom' ? `${startDate} ถึง ${endDate}` : `${range} วันล่าสุด`}</p>
                </div>
                <Package size={18} style={{ color: '#c084fc' }} />
              </div>
              {report.stockStaffReports.length === 0 ? <EmptyState label="ยังไม่มีข้อมูลการรับเข้าสต๊อก" /> : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr className="admin-table-head">
                        <th style={{ padding: '12px 18px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: '#1e2d48', textTransform: 'uppercase', letterSpacing: '0.12em' }}>เจ้าหน้าที่สต๊อก</th>
                        <th style={{ padding: '12px 18px', textAlign: 'right', fontSize: 10, fontWeight: 800, color: '#1e2d48', textTransform: 'uppercase', letterSpacing: '0.12em' }}>จำนวนครั้งที่รับเข้า</th>
                        <th style={{ padding: '12px 18px', textAlign: 'right', fontSize: 10, fontWeight: 800, color: '#1e2d48', textTransform: 'uppercase', letterSpacing: '0.12em' }}>มูลค่าสินค้ารวม</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.stockStaffReports.map(s => (
                        <tr key={s.name}
                          onClick={() => setSelectedStockStaffDetail(s.name)}
                          className="admin-table-row cursor-pointer">
                          <td style={{ padding: '12px 18px', fontSize: 13, fontWeight: 700, color: '#eef2ff' }}>{s.name}</td>
                          <td style={{ padding: '12px 18px', fontSize: 13, textAlign: 'right', color: '#5a6e90', fontWeight: 600 }}>{s.receiptCount} ครั้ง</td>
                          <td style={{ padding: '12px 18px', fontSize: 13, textAlign: 'right', fontWeight: 900, color: '#c084fc' }}>{formatCurrency(s.totalCost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
          )}

          {bottomTab === 'arrivals' && (
            <div className="admin-table-wrap overflow-hidden mt-5 animate-in">
              <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <div>
                  <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 900, color: '#eef2ff', margin: 0 }}>รายงานสินค้าเข้าใหม่ (คีย์โดยพนักงานคลังสินค้า)</h2>
                  <p style={{ color: '#3d4d6a', fontSize: 12, fontWeight: 600, marginTop: 4 }}>ข้อมูลสินค้าใหม่ที่คีย์นำเข้าในช่วง {range === 'custom' ? `${startDate} ถึง ${endDate}` : `${range} วันล่าสุด`}</p>
                </div>
                <Package size={18} style={{ color: '#2dd4bf' }} />
              </div>
              {newArrivals.length === 0 ? <EmptyState label="ไม่มีประวัติการนำเข้าสินค้าในช่วงเวลานี้" /> : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr className="admin-table-head">
                        <th style={{ padding: '12px 18px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: '#1e2d48', textTransform: 'uppercase', letterSpacing: '0.12em' }}>สินค้า</th>
                        <th style={{ padding: '12px 18px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: '#1e2d48', textTransform: 'uppercase', letterSpacing: '0.12em' }}>SKU</th>
                        <th style={{ padding: '12px 18px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: '#1e2d48', textTransform: 'uppercase', letterSpacing: '0.12em' }}>เลขใบรับของ / ซัพพลายเออร์</th>
                        <th style={{ padding: '12px 18px', textAlign: 'right', fontSize: 10, fontWeight: 800, color: '#1e2d48', textTransform: 'uppercase', letterSpacing: '0.12em' }}>จำนวนรับเข้า</th>
                        <th style={{ padding: '12px 18px', textAlign: 'right', fontSize: 10, fontWeight: 800, color: '#1e2d48', textTransform: 'uppercase', letterSpacing: '0.12em' }}>ราคาทุนต่อหน่วย</th>
                        <th style={{ padding: '12px 18px', textAlign: 'right', fontSize: 10, fontWeight: 800, color: '#1e2d48', textTransform: 'uppercase', letterSpacing: '0.12em' }}>มูลค่าทุนรวม</th>
                        <th style={{ padding: '12px 18px', textAlign: 'right', fontSize: 10, fontWeight: 800, color: '#1e2d48', textTransform: 'uppercase', letterSpacing: '0.12em' }}>ผู้รับสินค้า / วันที่</th>
                      </tr>
                    </thead>
                    <tbody>
                      {newArrivals.map(item => {
                        const prod = item.products || {}
                        const receipt = item.stock_receipts || {}
                        const staffName = receipt.profiles?.full_name || 'ไม่ระบุพนักงาน'
                        return (
                          <tr key={item.id} className="admin-table-row">
                            <td style={{ padding: '12px 18px', fontSize: 13, fontWeight: 700, color: '#eef2ff' }}>{prod.name || 'ไม่ทราบชื่อ'}</td>
                            <td style={{ padding: '12px 18px', fontSize: 13, color: '#5a6e90' }}>{prod.sku || '—'}</td>
                            <td style={{ padding: '12px 18px', fontSize: 13, color: '#5a6e90' }}>
                              <div>
                                <p style={{ margin: 0, fontWeight: 700, color: '#eef2ff' }}>{receipt.receipt_no || 'ไม่ระบุ'}</p>
                                <p style={{ margin: 0, fontSize: 11, color: '#3d4d6a' }}>{receipt.supplier_name || '—'}</p>
                              </div>
                            </td>
                            <td style={{ padding: '12px 18px', fontSize: 13, textAlign: 'right', fontWeight: 800, color: '#34d399' }}>
                              {item.quantity.toLocaleString('th-TH')} ชิ้น
                            </td>
                            <td style={{ padding: '12px 18px', fontSize: 13, textAlign: 'right', color: '#5a6e90', fontWeight: 600 }}>
                              {formatCurrency(item.cost)}
                            </td>
                            <td style={{ padding: '12px 18px', fontSize: 13, textAlign: 'right', fontWeight: 900, color: '#22e5ff' }}>
                              {formatCurrency(item.quantity * item.cost)}
                            </td>
                            <td style={{ padding: '12px 18px', fontSize: 13, textAlign: 'right', color: '#5a6e90' }}>
                              <div>
                                <p style={{ margin: 0, fontWeight: 700, color: '#eef2ff' }}>{staffName}</p>
                                <p style={{ margin: 0, fontSize: 11, color: '#3d4d6a' }}>
                                  {new Intl.DateTimeFormat('th-TH', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(item.created_at))}
                                </p>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {bottomTab === 'readiness' && (() => {
            const roleCounts = {
              cashier: shopReports.filter((r: any) => r.role === 'cashier').length,
              stock_staff: shopReports.filter((r: any) => r.role === 'stock_staff').length,
              kitchen: shopReports.filter((r: any) => r.role === 'kitchen').length,
              bar: shopReports.filter((r: any) => r.role === 'bar').length,
            }

            const filteredReports = readinessRole === 'all'
              ? shopReports
              : shopReports.filter((r: any) => r.role === readinessRole)

            return (
              <div className="mt-5 space-y-5 animate-in">
                {/* 4 Role Overview Cards: Cashier, Stock Staff, Kitchen, Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
                  {(Object.entries(READINESS_ROLE_CONFIG) as [keyof typeof READINESS_ROLE_CONFIG, typeof READINESS_ROLE_CONFIG['cashier']][]).map(([key, cfg]) => {
                    const count = roleCounts[key] || 0
                    const ackCount = shopReports.filter((r: any) => r.role === key && r.status === 'acknowledged').length
                    const pendCount = shopReports.filter((r: any) => r.role === key && r.status === 'pending').length
                    const isSelected = readinessRole === key
                    const RoleIcon = cfg.icon

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setReadinessRole(isSelected ? 'all' : key)}
                        className="text-left transition-all cursor-pointer rounded-2xl p-4.5"
                        style={{
                          background: isSelected ? cfg.bg : '#161b27',
                          border: `1.5px solid ${isSelected ? cfg.color : 'rgba(255,255,255,0.07)'}`,
                          boxShadow: isSelected ? `0 0 24px ${cfg.bg}, 0 4px 16px rgba(0,0,0,0.3)` : '0 4px 16px rgba(0,0,0,0.25)',
                        }}
                      >
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                            style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                          >
                            <RoleIcon size={13} /> {cfg.shortLabel}
                          </span>
                          <span className="text-[11px] font-semibold text-[#64748b]">
                            {count > 0 ? `${count} รายงาน` : 'ยังไม่มีรายงาน'}
                          </span>
                        </div>

                        <p className="text-2xl font-black tracking-tight text-[#f1f5f9] m-0" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          {count}
                        </p>
                        <p className="text-[11px] text-[#64748b] mt-1 mb-3 line-clamp-1 font-medium">{cfg.desc}</p>

                        <div className="flex items-center gap-2 text-[10px] font-bold pt-2.5 border-t border-white/5">
                          <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                            ✓ รับทราบ {ackCount}
                          </span>
                          <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                            ⏳ รอดำเนินการ {pendCount}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Table Container */}
                <div className="admin-table-wrap overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                    <div>
                      <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 900, color: '#f1f5f9', margin: 0 }}>
                        📋 รายงานความเรียบร้อยประจำแผนก
                      </h2>
                      <p style={{ color: '#64748b', fontSize: 12, fontWeight: 500, marginTop: 4 }}>
                        รายงานสถานะและการจัดเตรียมความพร้อมของ Cashier, Stock Staff, Kitchen, Bar ({filteredReports.length} รายการ)
                      </p>
                    </div>

                    {/* Role Filter Buttons */}
                    <div className="flex rounded-xl p-1 gap-1" style={{ border: '1px solid rgba(255,255,255,0.07)', background: '#111827' }}>
                      <button
                        type="button"
                        onClick={() => setReadinessRole('all')}
                        className="rounded-lg px-3 py-1 text-xs font-semibold transition-all cursor-pointer"
                        style={readinessRole === 'all'
                          ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', boxShadow: '0 2px 8px rgba(99,102,241,0.30)' }
                          : { color: '#64748b', background: 'transparent' }}
                      >
                        🌟 ทั้งหมด ({shopReports.length})
                      </button>
                      {(Object.entries(READINESS_ROLE_CONFIG) as [keyof typeof READINESS_ROLE_CONFIG, typeof READINESS_ROLE_CONFIG['cashier']][]).map(([key, cfg]) => {
                        const RoleIcon = cfg.icon
                        const isSelected = readinessRole === key
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setReadinessRole(key)}
                            className="rounded-lg px-3 py-1 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                            style={isSelected
                              ? { background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, boxShadow: `0 0 10px ${cfg.bg}` }
                              : { color: '#64748b', background: 'transparent' }}
                          >
                            <RoleIcon size={12} /> {cfg.shortLabel} ({roleCounts[key] || 0})
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {filteredReports.length === 0 ? (
                    <EmptyState label={readinessRole === 'all' ? 'ไม่มีข้อมูลการส่งรายงานความเรียบร้อยในช่วงเวลานี้' : `ยังไม่มีรายงานความเรียบร้อยจากแผนก ${READINESS_ROLE_CONFIG[readinessRole]?.label} ในช่วงเวลานี้`} />
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr className="admin-table-head">
                            <th style={{ padding: '12px 18px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>แผนก / บทบาท</th>
                            <th style={{ padding: '12px 18px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>หัวข้อรายงาน</th>
                            <th style={{ padding: '12px 18px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>รายละเอียด / บันทึกเพิ่มเติม</th>
                            <th style={{ padding: '12px 18px', textAlign: 'center', fontSize: 10, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>รูปภาพ</th>
                            <th style={{ padding: '12px 18px', textAlign: 'center', fontSize: 10, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>สถานะ</th>
                            <th style={{ padding: '12px 18px', textAlign: 'right', fontSize: 10, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>ผู้รายงาน / วันเวลา</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredReports.map((reportItem: any) => {
                            const roleKey = (reportItem.role as keyof typeof READINESS_ROLE_CONFIG) || 'cashier'
                            const cfg = READINESS_ROLE_CONFIG[roleKey] || READINESS_ROLE_CONFIG.cashier
                            const RoleIcon = cfg.icon
                            const reporter = reportItem.reporter_name || reportItem.profiles?.full_name || 'ไม่ระบุชื่อ'
                            const imageCount = reportItem.images ? reportItem.images.length : 0

                            return (
                              <tr key={reportItem.id} className="admin-table-row">
                                {/* Role Badge */}
                                <td style={{ padding: '12px 18px' }}>
                                  <span
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                                    style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                                  >
                                    <RoleIcon size={12} /> {cfg.label}
                                  </span>
                                </td>

                                {/* Title */}
                                <td style={{ padding: '12px 18px', fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>
                                  {reportItem.title}
                                </td>

                                {/* Note */}
                                <td style={{ padding: '12px 18px', fontSize: 13, color: '#94a3b8', maxWidth: 280 }}>
                                  {reportItem.note || '—'}
                                </td>

                                {/* Images */}
                                <td style={{ padding: '12px 18px', fontSize: 13, textAlign: 'center' }}>
                                  {imageCount > 0 ? (
                                    <button
                                      type="button"
                                      onClick={() => setSelectedShopReportImage(reportItem.images)}
                                      className="text-xs px-2.5 py-1.5 rounded-lg font-bold hover:brightness-110 cursor-pointer"
                                      style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.28)' }}
                                    >
                                      📷 ดูรูปภาพ ({imageCount})
                                    </button>
                                  ) : (
                                    <span className="text-xs" style={{ color: '#475569' }}>ไม่มีรูป</span>
                                  )}
                                </td>

                                {/* Status */}
                                <td style={{ padding: '12px 18px', fontSize: 13, textAlign: 'center' }}>
                                  <span
                                    className={reportItem.status === 'acknowledged' ? 'badge-delivered' : 'badge-pending'}
                                    style={{ padding: '4px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700 }}
                                  >
                                    {reportItem.status === 'acknowledged' ? '✓ รับทราบแล้ว' : '⏳ รอดำเนินการ'}
                                  </span>
                                </td>

                                {/* Reporter & Time */}
                                <td style={{ padding: '12px 18px', fontSize: 13, textAlign: 'right', color: '#64748b' }}>
                                  <div>
                                    <p style={{ margin: 0, fontWeight: 700, color: '#f1f5f9' }}>{reporter}</p>
                                    <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>
                                      {new Intl.DateTimeFormat('th-TH', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(reportItem.created_at))}
                                    </p>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )
          })()}

          {selectedShopReportImage && (
            <div className="fixed inset-0 flex items-center justify-center z-50"
              style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(16px)', padding: 16 }}>
              <div className="relative w-full max-w-4xl" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                <button
                  onClick={() => setSelectedShopReportImage(null)}
                  className="absolute -top-12 right-0 p-2 text-white hover:text-rose-400 cursor-pointer transition-colors"
                  style={{ border: 'none', background: 'transparent' }}
                >
                  <X size={24} />
                </button>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', justifyContent: 'center' }}>
                  {selectedShopReportImage.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Report image ${idx + 1}`}
                      style={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: 16, objectFit: 'contain', boxShadow: '0 20px 50px rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {selectedCashierDetail && (
        <div className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', padding: 16 }}>
          <div className="admin-panel w-full" style={{ maxWidth: '640px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: 0 }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              <div>
                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 900, color: '#eef2ff', margin: 0 }}>ประวัติบิล: {selectedCashierDetail}</h3>
                <p style={{ color: '#64748b', fontSize: 12, fontWeight: 600, marginTop: 4 }}>
                  รายการขายที่แคชเชียร์คนนี้ทำรายการในช่วง {range === 'all' ? 'ทั้งหมด' : `${range} วันล่าสุด`}
                </p>
              </div>
              <button onClick={() => setSelectedCashierDetail(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3d4d6a' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              {sales.filter(sale => {
                let cashierName = 'ไม่ระบุ'
                if (sale.profiles) {
                   if (Array.isArray(sale.profiles)) {
                     if (sale.profiles.length > 0) cashierName = sale.profiles[0].full_name
                   } else {
                     cashierName = (sale.profiles as any).full_name
                   }
                }
                return cashierName === selectedCashierDetail
              }).length === 0 ? <EmptyState label="ไม่มีบิลประวัติในช่วงเวลานี้" /> : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr className="admin-table-head">
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: '#1e2d48', textTransform: 'uppercase' }}>เลขที่บิล</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: '#1e2d48', textTransform: 'uppercase' }}>วัน/เวลา</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: 10, fontWeight: 800, color: '#1e2d48', textTransform: 'uppercase' }}>ช่องทาง</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 10, fontWeight: 800, color: '#1e2d48', textTransform: 'uppercase' }}>ยอดเงิน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.filter(sale => {
                      let cashierName = 'ไม่ระบุ'
                      if (sale.profiles) {
                        if (Array.isArray(sale.profiles)) {
                          if (sale.profiles.length > 0) cashierName = sale.profiles[0].full_name
                        } else {
                          cashierName = (sale.profiles as any).full_name
                        }
                      }
                      return cashierName === selectedCashierDetail
                    }).map(sale => {
                      const meta = PAYMENT_META[sale.payment_method]
                      return (
                        <tr key={sale.id} className="admin-table-row">
                          <td style={{ padding: '8px 12px', fontSize: 13, fontWeight: 700, color: '#eef2ff' }}>{sale.receipt_no}</td>
                          <td style={{ padding: '8px 12px', fontSize: 12, color: '#5a6e90' }}>
                            {new Intl.DateTimeFormat('th-TH', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(sale.created_at))}
                          </td>
                          <td style={{ padding: '8px 12px', fontSize: 12, textAlign: 'center' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: meta?.color, background: `${meta?.color}15`, border: `1px solid ${meta?.color}35`, padding: '2px 8px', borderRadius: 100 }}>
                              {meta?.label || sale.payment_method}
                            </span>
                          </td>
                          <td style={{ padding: '8px 12px', fontSize: 13, textAlign: 'right', fontWeight: 900, color: '#22e5ff' }}>
                            {formatCurrency(sale.total_amount)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
            <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              <button onClick={() => setSelectedCashierDetail(null)} className="w-full admin-btn-secondary py-2.5 text-xs font-bold cursor-pointer">
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedStockStaffDetail && (
        <div className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', padding: 16 }}>
          <div className="admin-panel w-full" style={{ maxWidth: '640px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: 0 }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              <div>
                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 900, color: '#eef2ff', margin: 0 }}>ประวัติรับของเข้า: {selectedStockStaffDetail}</h3>
                <p style={{ color: '#64748b', fontSize: 12, fontWeight: 600, marginTop: 4 }}>
                  รายการรับสินค้าเข้าสต๊อกที่ทำรายการในช่วง {range === 'all' ? 'ทั้งหมด' : `${range} วันล่าสุด`}
                </p>
              </div>
              <button onClick={() => setSelectedStockStaffDetail(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3d4d6a' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              {receipts.filter(receipt => {
                let staffName = 'ไม่ระบุ'
                if (receipt.profiles) {
                  if (Array.isArray(receipt.profiles)) {
                    if (receipt.profiles.length > 0) staffName = receipt.profiles[0].full_name
                  } else {
                    staffName = (receipt.profiles as any).full_name
                  }
                }
                return staffName === selectedStockStaffDetail
              }).length === 0 ? <EmptyState label="ไม่มีรายการรับสินค้าในช่วงเวลานี้" /> : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr className="admin-table-head">
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: '#1e2d48', textTransform: 'uppercase' }}>เลขใบรับสินค้า</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: '#1e2d48', textTransform: 'uppercase' }}>วัน/เวลา</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: '#1e2d48', textTransform: 'uppercase' }}>ผู้ผลิต/ซัพพลายเออร์</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 10, fontWeight: 800, color: '#1e2d48', textTransform: 'uppercase' }}>ราคาทุนรวม</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipts.filter(receipt => {
                      let staffName = 'ไม่ระบุ'
                      if (receipt.profiles) {
                        if (Array.isArray(receipt.profiles)) {
                          if (receipt.profiles.length > 0) staffName = receipt.profiles[0].full_name
                        } else {
                          staffName = (receipt.profiles as any).full_name
                        }
                      }
                      return staffName === selectedStockStaffDetail
                    }).map(receipt => (
                      <tr key={receipt.id} className="admin-table-row">
                        <td style={{ padding: '8px 12px', fontSize: 13, fontWeight: 700, color: '#eef2ff' }}>{receipt.receipt_no || 'ไม่ระบุ'}</td>
                        <td style={{ padding: '8px 12px', fontSize: 12, color: '#5a6e90' }}>
                          {new Intl.DateTimeFormat('th-TH', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(receipt.created_at))}
                        </td>
                        <td style={{ padding: '8px 12px', fontSize: 12, color: '#5a6e90' }}>
                          {receipt.supplier_name || '—'}
                        </td>
                        <td style={{ padding: '8px 12px', fontSize: 13, textAlign: 'right', fontWeight: 900, color: '#c084fc' }}>
                          {formatCurrency(receipt.total_cost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              <button onClick={() => setSelectedStockStaffDetail(null)} className="w-full admin-btn-secondary py-2.5 text-xs font-bold cursor-pointer">
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof WalletCards
  label: string
  value: string
  tone: string
}) {
  return (
    <article
      className="admin-card transition-all"
      style={{
        padding: '16px 20px',
        borderTop: `1px solid ${tone}44`,
        boxShadow: `0 8px 28px rgba(0,0,0,0.50)`
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#5a6e90', margin: 0 }}>{label}</p>
        <span className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: `${tone}18`, color: tone, border: `1px solid ${tone}33`, boxShadow: `0 0 12px ${tone}22` }}>
          <Icon size={16} />
        </span>
      </div>
      <p className="mt-4 text-2xl font-black tracking-tight text-[#eef2ff]" style={{ fontFamily: "'Outfit', sans-serif", margin: '14px 0 0' }}>{value}</p>
    </article>
  )
}

function EmptyState({ label }: { label: string }) {
  return <div className="flex min-h-40 items-center justify-center px-5 text-xs font-semibold" style={{ color: '#3d4d6a' }}>{label}</div>
}
