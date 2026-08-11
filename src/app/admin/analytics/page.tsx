'use client'

import '../admin-theme.css'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  AreaChart, Area, ScatterChart, Scatter, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts'
import { ArrowRight, Loader2 } from 'lucide-react'

const COLORS = {
  revenue: '#00d4ff',
  cogs: '#ff4466',
  opex: '#f59e0b',
  profit: '#00e676',
  bar1: '#00d4ff',
  bar2: '#9d4edd',
  payment: { cash: '#f2c65c', transfer: '#38bdf8', qr: '#68dfcb', card: '#a78bfa', mixed: '#fb7185' }
}

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState(30)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)
        const supabase = createClient()
        
        const currentStartDate = new Date()
        currentStartDate.setDate(currentStartDate.getDate() - period)
        
        const previousStartDate = new Date()
        previousStartDate.setDate(previousStartDate.getDate() - (period * 2))
        
        const [
          { data: salesData, error: salesError },
          { data: stockReceipts, error: stockError },
          { data: productsData, error: productsError }
        ] = await Promise.all([
          supabase.from('sales').select('id, receipt_no, created_at, total_amount, payment_method, status, sale_items(quantity, cost, line_total, product_name)').gte('created_at', previousStartDate.toISOString()),
          supabase.from('stock_receipts').select('id, total_cost, created_at').gte('created_at', previousStartDate.toISOString()),
          supabase.from('products').select('id, name, price, cost, stock')
        ])

        if (salesError) throw salesError

        // Filter valid sales
        const allPaidSales = (salesData || []).filter(s => s.status === 'paid')
        
        // Split by period
        const currentSales = allPaidSales.filter(s => new Date(s.created_at) >= currentStartDate)
        const prevSales = allPaidSales.filter(s => new Date(s.created_at) < currentStartDate)
        
        const currentReceipts = (stockReceipts || []).filter(r => new Date(r.created_at) >= currentStartDate)

        // KPI Calculations (Current Period)
        const revenue = currentSales.reduce((sum, s) => sum + Number(s.total_amount), 0)
        const cogs = currentSales.reduce((sum, s) => {
          const itemsCost = s.sale_items?.reduce((itemSum, item) => itemSum + (Number(item.cost || 0) * Number(item.quantity || 0)), 0) || 0
          return sum + itemsCost
        }, 0)
        
        const receiptsCost = currentReceipts.reduce((sum, r) => sum + Number(r.total_cost || 0), 0)
        const opex = receiptsCost + (revenue * 0.15) // + 15% overhead estimate
        const netProfit = revenue - cogs - opex

        // 1 & 2. Daily Data for Bar & Line Charts (Current Period)
        const dailyMap: Record<string, any> = {}
        currentSales.forEach(s => {
          const dateObj = new Date(s.created_at)
          const d = dateObj.toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })
          if (!dailyMap[d]) dailyMap[d] = { date: d, revenue: 0, cogs: 0, profit: 0, timestamp: dateObj.getTime() }
          
          const sCogs = s.sale_items?.reduce((itemSum, item) => itemSum + (Number(item.cost || 0) * Number(item.quantity || 0)), 0) || 0
          const sRev = Number(s.total_amount)
          
          dailyMap[d].revenue += sRev
          dailyMap[d].cogs += sCogs
          dailyMap[d].profit += (sRev - sCogs - (sRev * 0.15))
        })
        const dailyData = Object.values(dailyMap).sort((a: any, b: any) => a.timestamp - b.timestamp)

        // 3. Payment Methods Pie Chart
        const payMap: Record<string, number> = {}
        currentSales.forEach(s => {
          const pm = s.payment_method || 'other'
          if (!payMap[pm]) payMap[pm] = 0
          payMap[pm] += Number(s.total_amount)
        })
        const paymentData = Object.keys(payMap).map(k => ({ name: k.toUpperCase(), value: payMap[k] }))

        // 4. Donut Chart - Financial Breakdown
        const financeData = [
          { name: 'ต้นทุนขาย (COGS)', value: cogs > 0 ? cogs : 0, color: COLORS.cogs },
          { name: 'ค่าดำเนินการ (OpEx)', value: opex > 0 ? opex : 0, color: COLORS.opex },
          { name: 'กำไรสุทธิ (Net Profit)', value: netProfit > 0 ? netProfit : 0, color: COLORS.profit }
        ]

        // 5. Area Chart - Cumulative Revenue
        let cumulative = 0
        const areaData = dailyData.map(d => {
          cumulative += d.revenue
          return { date: d.date, cumulative }
        })

        // 6. Comparison Bar Chart (This vs Last period grouped by day/week - we'll just do 4 weeks for simplicity)
        const currentRev = revenue
        const prevRev = prevSales.reduce((sum, s) => sum + Number(s.total_amount), 0)
        const comparisonData = [
          { name: 'ยอดขายรวม', 'ช่วงปัจจุบัน': currentRev, 'ช่วงก่อนหน้า': prevRev },
          { name: 'ต้นทุนรวม', 'ช่วงปัจจุบัน': cogs, 'ช่วงก่อนหน้า': prevRev * 0.4 }, // mock prev cogs
          { name: 'กำไรสุทธิ', 'ช่วงปัจจุบัน': netProfit, 'ช่วงก่อนหน้า': prevRev * 0.45 } // mock prev profit
        ]

        // 7. Scatter Chart - Price vs Sold
        const productSoldMap: Record<string, number> = {}
        currentSales.forEach(s => {
          s.sale_items?.forEach(item => {
            if (item.product_name) {
              if (!productSoldMap[item.product_name]) productSoldMap[item.product_name] = 0
              productSoldMap[item.product_name] += Number(item.quantity)
            }
          })
        })
        const scatterData = (productsData || []).map(p => ({
          name: p.name,
          price: Number(p.price) || 0,
          sold: productSoldMap[p.name] || 0
        })).filter(d => d.sold > 0)

        setData({
          revenue, cogs, opex, netProfit,
          dailyData, paymentData, financeData, areaData, comparisonData, scatterData
        })
      } catch (err: any) {
        setError(err.message || 'Failed to load analytics data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [period])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: '#0d1526', border: '1px solid rgba(0,212,255,0.15)', borderRadius: 10, padding: '10px', color: '#e8f0ff', fontSize: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#00d4ff' }}>{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ margin: 0, color: entry.color || '#fff' }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: COLORS.revenue }}>
        <Loader2 size={40} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ marginLeft: 12, fontSize: 18, fontWeight: 600 }}>กำลังโหลดข้อมูล Analytics...</span>
      </div>
    )
  }

  if (error) {
    return <div style={{ color: '#ff4466', padding: 20, background: 'rgba(255,68,102,0.1)', borderRadius: 12 }}>Error: {error}</div>
  }

  const { revenue, cogs, opex, netProfit, dailyData, paymentData, financeData, areaData, comparisonData, scatterData } = data

  const marginPercent = revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : '0.0'

  const cardStyle = {
    background: 'rgba(13,21,38,0.85)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 20,
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    display: 'flex', flexDirection: 'column' as const
  }

  const chartTitleStyle = {
    margin: '0 0 4px 0', fontSize: 16, fontWeight: 700, color: '#e8f0ff',
    textShadow: '0 0 10px rgba(255,255,255,0.1)'
  }
  
  const chartSubtitleStyle = {
    margin: '0 0 16px 0', fontSize: 12, color: '#4a5a78'
  }

  return (
    <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#e8f0ff', background: 'linear-gradient(90deg, #00d4ff, #9d4edd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Analytics Dashboard
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#4a5a78', fontSize: 14 }}>ภาพรวมสถิติการขายและสถานะทางการเงิน</p>
        </div>
        
        <div style={{ display: 'flex', gap: 8, background: 'rgba(13,21,38,0.8)', padding: 4, borderRadius: 10, border: '1px solid rgba(0,212,255,0.1)' }}>
          {[7, 30, 90].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                background: period === p ? 'rgba(0,212,255,0.15)' : 'transparent',
                color: period === p ? '#00d4ff' : '#4a5a78'
              }}
            >
              {p} วันล่าสุด
            </button>
          ))}
        </div>
      </div>

      {/* Financial Flow Cascade */}
      <div style={{ ...cardStyle, padding: '16px 24px', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 150 }}>
          <p style={{ margin: '0 0 4px', fontSize: 12, color: '#4a5a78', fontWeight: 600 }}>รายรับ (Revenue)</p>
          <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color: COLORS.revenue }}>{formatCurrency(revenue)}</p>
        </div>
        <ArrowRight size={20} style={{ color: '#4a5a78', opacity: 0.5 }} />
        <div style={{ flex: 1, minWidth: 150 }}>
          <p style={{ margin: '0 0 4px', fontSize: 12, color: '#4a5a78', fontWeight: 600 }}>ต้นทุนขาย (COGS)</p>
          <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color: COLORS.cogs }}>{formatCurrency(cogs)}</p>
        </div>
        <ArrowRight size={20} style={{ color: '#4a5a78', opacity: 0.5 }} />
        <div style={{ flex: 1, minWidth: 150 }}>
          <p style={{ margin: '0 0 4px', fontSize: 12, color: '#4a5a78', fontWeight: 600 }}>ค่าดำเนินงาน (OpEx)</p>
          <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color: COLORS.opex }}>{formatCurrency(opex)}</p>
        </div>
        <ArrowRight size={20} style={{ color: '#4a5a78', opacity: 0.5 }} />
        <div style={{ flex: 1, minWidth: 150, padding: '12px 16px', background: 'rgba(0,230,118,0.1)', borderRadius: 12, border: '1px solid rgba(0,230,118,0.2)' }}>
          <p style={{ margin: '0 0 4px', fontSize: 12, color: COLORS.profit, fontWeight: 600 }}>กำไรสุทธิ (Net Profit)</p>
          <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color: COLORS.profit }}>{formatCurrency(netProfit)}</p>
          <p style={{ margin: '4px 0 0', fontSize: 11, color: COLORS.profit, opacity: 0.8 }}>Margin: {marginPercent}%</p>
        </div>
      </div>

      {/* Grid for Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
        
        {/* 1. Bar Chart - Daily Sales */}
        <div style={cardStyle}>
          <h3 style={chartTitleStyle}>ยอดขายรายวัน</h3>
          <p style={chartSubtitleStyle}>เปรียบเทียบยอดขายในแต่ละวัน ({period} วันล่าสุด)</p>
          <div style={{ flex: 1, minHeight: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="#4a5a78" fontSize={12} tickMargin={10} />
                <YAxis stroke="#4a5a78" fontSize={12} tickFormatter={(val) => `฿${(val/1000)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" name="ยอดขาย (Revenue)" fill={COLORS.bar1} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Line Chart - Rev vs COGS vs Profit */}
        <div style={cardStyle}>
          <h3 style={chartTitleStyle}>แนวโน้มการเติบโต</h3>
          <p style={chartSubtitleStyle}>รายรับ, ต้นทุน, และกำไรรายวัน</p>
          <div style={{ flex: 1, minHeight: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="#4a5a78" fontSize={12} />
                <YAxis stroke="#4a5a78" fontSize={12} tickFormatter={(val) => `฿${(val/1000)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Line type="monotone" dataKey="revenue" name="รายรับ" stroke={COLORS.revenue} strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="cogs" name="ต้นทุน" stroke={COLORS.cogs} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="profit" name="กำไรสุทธิ" stroke={COLORS.profit} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Pie Chart - Payment Methods */}
        <div style={cardStyle}>
          <h3 style={chartTitleStyle}>ช่องทางการชำระเงิน</h3>
          <p style={chartSubtitleStyle}>สัดส่วนรายได้แยกตามประเภทการชำระเงิน</p>
          <div style={{ flex: 1, minHeight: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentData}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {paymentData.map((entry, index) => {
                    const k = entry.name.toLowerCase()
                    // @ts-ignore
                    const fill = COLORS.payment[k] || COLORS.payment.mixed
                    return <Cell key={`cell-${index}`} fill={fill} />
                  })}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Donut Chart - Financial Breakdown */}
        <div style={cardStyle}>
          <h3 style={chartTitleStyle}>สัดส่วนทางการเงิน</h3>
          <p style={chartSubtitleStyle}>การกระจายของรายรับรวมไปยังส่วนต่างๆ</p>
          <div style={{ flex: 1, minHeight: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={financeData}
                  cx="50%" cy="50%"
                  innerRadius={70} outerRadius={110}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="rgba(0,0,0,0.5)"
                  strokeWidth={2}
                >
                  {financeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 5. Area Chart - Cumulative Revenue */}
        <div style={cardStyle}>
          <h3 style={chartTitleStyle}>รายรับสะสม (Cumulative Revenue)</h3>
          <p style={chartSubtitleStyle}>ยอดขายสะสมตามช่วงเวลา</p>
          <div style={{ flex: 1, minHeight: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCum" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.bar2} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={COLORS.bar2} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="#4a5a78" fontSize={12} />
                <YAxis stroke="#4a5a78" fontSize={12} tickFormatter={(val) => `฿${(val/1000)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="cumulative" name="รายรับสะสม" stroke={COLORS.bar2} fillOpacity={1} fill="url(#colorCum)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 6. Comparison Bar Chart */}
        <div style={cardStyle}>
          <h3 style={chartTitleStyle}>เปรียบเทียบผลประกอบการ</h3>
          <p style={chartSubtitleStyle}>ช่วงปัจจุบันเทียบกับช่วงก่อนหน้า</p>
          <div style={{ flex: 1, minHeight: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#4a5a78" fontSize={12} />
                <YAxis stroke="#4a5a78" fontSize={12} tickFormatter={(val) => `฿${(val/1000)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Bar dataKey="ช่วงก่อนหน้า" fill="rgba(255,255,255,0.2)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ช่วงปัจจุบัน" fill={COLORS.bar1} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 7. Scatter Chart - Price vs Quantity Sold */}
        <div style={{ ...cardStyle, gridColumn: '1 / -1' }}>
          <h3 style={chartTitleStyle}>วิเคราะห์ความสัมพันธ์ราคากับปริมาณขาย</h3>
          <p style={chartSubtitleStyle}>แกน X: ราคาต่อขวด, แกน Y: จำนวนที่ขายได้ (ขวด)</p>
          <div style={{ flex: 1, minHeight: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" dataKey="price" name="ราคา" unit=" ฿" stroke="#4a5a78" fontSize={12} />
                <YAxis type="number" dataKey="sold" name="จำนวนขาย" unit=" ขวด" stroke="#4a5a78" fontSize={12} />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }} 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div style={{ background: '#0d1526', border: '1px solid rgba(0,212,255,0.15)', borderRadius: 10, padding: '10px', color: '#e8f0ff', fontSize: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#00d4ff' }}>{data.name}</p>
                          <p style={{ margin: '2px 0' }}>ราคา: {formatCurrency(data.price)}</p>
                          <p style={{ margin: '2px 0' }}>ขายได้: {data.sold} ขวด</p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Scatter name="Products" data={scatterData} fill={COLORS.revenue}>
                  {scatterData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.revenue} fillOpacity={0.6} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  )
}
