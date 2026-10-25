'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie,
} from 'recharts';
import {
  Download, TrendingUp, Award, CreditCard,
  ShieldAlert, RefreshCw, Layers, Wine,
  BarChart3, Crown, Medal, Star, Clock, ShoppingCart,
  FileCheck2, Calendar, Filter,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApiAuth, ensureApiAuth } from '@/lib/store/api-auth';
import { reportsApi } from '@/lib/api/reports';
import type { EcommerceDashboardResponse } from '@/lib/api/types';

/* ─── Types ─── */
interface SalesReportData {
  sales: { date: string; amount: number; count: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
  payments: { method: string; value: number }[];
  totalSales: number;
  totalOrders: number;
}

/* ─── Constants ─── */
const CHART_TABS = ['รายได้', 'จำนวนออเดอร์'] as const;
type ChartTab = typeof CHART_TABS[number];

const PAYMENT_PALETTE = [
  { color: '#22e5ff', glow: 'rgba(34,229,255,0.4)' },
  { color: '#fbbf24', glow: 'rgba(251,191,36,0.4)' },
  { color: '#2dd4bf', glow: 'rgba(45,212,191,0.4)' },
  { color: '#c084fc', glow: 'rgba(192,132,252,0.4)' },
  { color: '#34d399', glow: 'rgba(52,211,153,0.4)' },
  { color: '#fb7185', glow: 'rgba(251,113,133,0.4)' },
];

const RANK_CONFIG = [
  { icon: Crown, color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.30)', label: '#1' },
  { icon: Medal, color: '#22e5ff', bg: 'rgba(34,229,255,0.12)', border: 'rgba(34,229,255,0.30)', label: '#2' },
  { icon: Star,  color: '#c084fc', bg: 'rgba(192,132,252,0.12)', border: 'rgba(192,132,252,0.30)', label: '#3' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 80, damping: 16, delay: i * 0.06 } }),
};

/* ─── Helpers ─── */
const fmt = (n: number) => `฿${(n || 0).toLocaleString('th-TH', { maximumFractionDigits: 0 })}`;
const fmtFull = (n: number) => `฿${(n || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;

/* ─── Custom Tooltips ─── */
const AreaTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(10,14,26,0.95)', border: '1px solid rgba(0,212,255,0.25)', borderRadius: 14, padding: '10px 14px', backdropFilter: 'blur(16px)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
      <p style={{ fontSize: 10, color: '#5a6e90', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>{payload[0]?.payload?.date}</p>
      <p style={{ fontSize: 18, fontWeight: 900, color: '#22e5ff', lineHeight: 1, fontFamily: "'Outfit', sans-serif" }}>{fmt(payload[0]?.value ?? 0)}</p>
      {payload[1] && <p style={{ fontSize: 11, color: '#94a3c4', marginTop: 4 }}>{payload[1].value} ออเดอร์</p>}
    </div>
  );
};

const BarTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(10,14,26,0.95)', border: '1px solid rgba(0,212,255,0.25)', borderRadius: 12, padding: '8px 12px', backdropFilter: 'blur(16px)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
      <p style={{ fontSize: 10, color: '#5a6e90', fontWeight: 700, marginBottom: 3 }}>{payload[0]?.payload?.date}</p>
      <p style={{ fontSize: 14, fontWeight: 900, color: '#22e5ff', fontFamily: "'Outfit', sans-serif" }}>{payload[0]?.value} ออเดอร์</p>
    </div>
  );
};

/* ─── Live E-commerce Strip ─── */
function EcommerceLiveStrip({ ecom }: { ecom: EcommerceDashboardResponse | null }) {
  if (!ecom) return null;

  const cards = [
    {
      label: 'ยอดขายออนไลน์วันนี้',
      value: fmt(ecom.sales_today),
      sub: 'Today e-Commerce',
      color: '#22e5ff',
      icon: TrendingUp,
    },
    {
      label: 'ยอดขายออนไลน์เดือนนี้',
      value: fmt(ecom.sales_this_month),
      sub: 'This Month Revenue',
      color: '#34d399',
      icon: ShoppingCart,
    },
    {
      label: 'ออเดอร์ค้างจัดส่ง',
      value: `${ecom.pending_orders_count || 0}`,
      sub: 'Pending Fulfillment',
      color: '#fbbf24',
      icon: Clock,
    },
    {
      label: 'สลิปรอตรวจสอบ',
      value: `${ecom.pending_slips_count || 0}`,
      sub: 'Pending Slips',
      color: ecom.pending_slips_count > 0 ? '#fb7185' : '#94a3c4',
      icon: FileCheck2,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <motion.div
            key={c.label}
            custom={i}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="admin-panel p-4 group cursor-default relative overflow-hidden"
          >
            <div
              className="absolute top-0 right-0 w-20 h-20 pointer-events-none rounded-full"
              style={{
                background: `radial-gradient(circle, ${c.color}20 0%, transparent 70%)`,
                transform: 'translate(25%, -25%)',
              }}
            />
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-[#94a3c4] uppercase tracking-wider">{c.label}</span>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${c.color}15`, border: `1px solid ${c.color}30` }}
              >
                <Icon className="w-3.5 h-3.5" style={{ color: c.color }} />
              </div>
            </div>
            <div className="text-xl font-black text-[#eef2ff] tracking-tight font-mono">{c.value}</div>
            <div className="text-[10px] text-[#5a6e90] mt-0.5 font-semibold">{c.sub}</div>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ─── Summary KPI Strip ─── */
function SummaryStrip({ data }: { data: SalesReportData }) {
  const totalRevenue = data.totalSales || data.sales.reduce((s, d) => s + d.amount, 0);
  const totalOrders = data.totalOrders || data.sales.reduce((s, d) => s + d.count, 0);
  const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const topPayment = [...data.payments].sort((a, b) => b.value - a.value)[0];

  const kpis = [
    { label: 'ยอดขายรวมตามช่วงเวลา', value: fmt(totalRevenue), sub: 'Total Period Revenue', accent: '#22e5ff', icon: TrendingUp },
    { label: 'จำนวนออเดอร์ทั้งหมด', value: totalOrders.toLocaleString(), sub: 'Period Orders', accent: '#fbbf24', icon: Layers },
    { label: 'มูลค่าเฉลี่ยต่อออเดอร์', value: fmt(avgOrder), sub: 'Avg Order Value (AOV)', accent: '#34d399', icon: BarChart3 },
    { label: 'หมวดหมู่/ชำระเงินเด่น', value: topPayment?.method ?? '–', sub: fmt(topPayment?.value ?? 0), accent: '#c084fc', icon: CreditCard },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {kpis.map((kpi, i) => {
        const Icon = kpi.icon;
        return (
          <motion.div key={kpi.label} custom={i} variants={fadeUp} initial="hidden" animate="show"
            className="admin-panel p-4 group cursor-default relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none rounded-full" style={{ background: `radial-gradient(circle, ${kpi.accent}18 0%, transparent 70%)`, transform: 'translate(30%,-30%)' }} />

            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-[#94a3c4] uppercase tracking-wider">{kpi.label}</span>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110" style={{ background: `${kpi.accent}18`, border: `1px solid ${kpi.accent}35` }}>
                <Icon className="w-4 h-4" style={{ color: kpi.accent }} />
              </div>
            </div>

            <div className="text-xl sm:text-2xl font-black text-[#eef2ff] tracking-tight font-mono">{kpi.value}</div>
            <div className="text-[10px] text-[#5a6e90] mt-1 font-semibold">{kpi.sub}</div>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ─── Revenue Chart ─── */
function RevenueChart({ data }: { data: SalesReportData }) {
  const [tab, setTab] = useState<ChartTab>('รายได้');
  const avg = data.sales.length ? data.sales.reduce((s, d) => s + d.amount, 0) / data.sales.length : 0;

  return (
    <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show"
      className="admin-panel p-6 relative overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="font-extrabold text-[#eef2ff] text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>แนวโน้มยอดขายตามช่วงเวลา</h3>
          <p className="text-[10px] text-[#5a6e90] uppercase tracking-wider font-bold mt-0.5">Sales Trend Analytics</p>
        </div>
        <div className="admin-tab-group shrink-0">
          {CHART_TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`admin-tab ${tab === t ? 'admin-tab-active' : ''}`}
            >{t}</button>
          ))}
        </div>
      </div>

      <div style={{ height: 230 }}>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} style={{ height: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              {tab === 'รายได้' ? (
                <AreaChart data={data.sales} margin={{ top: 5, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rev-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22e5ff" stopOpacity={0.35} />
                      <stop offset="80%" stopColor="#22e5ff" stopOpacity={0.01} />
                    </linearGradient>
                    <linearGradient id="rev-line" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#00d4ff" />
                      <stop offset="100%" stopColor="#22e5ff" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 5" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="date" stroke="transparent" tick={{ fill: '#5a6e90', fontSize: 10, fontWeight: 600 }} tickLine={false} axisLine={false} dy={8} interval="preserveStartEnd" />
                  <YAxis stroke="transparent" tick={{ fill: '#5a6e90', fontSize: 10, fontWeight: 600 }} tickLine={false} axisLine={false} tickFormatter={v => v >= 1000 ? `฿${(v/1000).toFixed(0)}k` : `฿${v}`} />
                  <Tooltip content={<AreaTooltip />} cursor={{ stroke: 'rgba(34,229,255,0.25)', strokeWidth: 1, strokeDasharray: '4 2' }} />
                  <Area type="monotone" dataKey="amount" stroke="url(#rev-line)" strokeWidth={2.5} fill="url(#rev-grad)" dot={false} activeDot={{ r: 5, fill: '#22e5ff', stroke: 'rgba(34,229,255,0.4)', strokeWidth: 5 }} />
                </AreaChart>
              ) : (
                <BarChart data={data.sales} margin={{ top: 5, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="bar-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.85} />
                      <stop offset="100%" stopColor="#d97706" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 5" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="date" stroke="transparent" tick={{ fill: '#5a6e90', fontSize: 10, fontWeight: 600 }} tickLine={false} axisLine={false} dy={8} interval="preserveStartEnd" />
                  <YAxis stroke="transparent" tick={{ fill: '#5a6e90', fontSize: 10, fontWeight: 600 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(34,229,255,0.04)' }} />
                  <Bar dataKey="count" fill="url(#bar-grad)" radius={[5, 5, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </motion.div>
        </AnimatePresence>
      </div>

      {tab === 'รายได้' && avg > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <div className="h-px flex-1" style={{ background: 'rgba(34,229,255,0.2)', borderTop: '1px dashed rgba(34,229,255,0.3)' }} />
          <span className="text-[10px] font-extrabold text-[#22e5ff] uppercase tracking-wider font-mono">เฉลี่ย {fmt(avg)} / วัน</span>
          <div className="h-px flex-1" style={{ background: 'rgba(34,229,255,0.2)', borderTop: '1px dashed rgba(34,229,255,0.3)' }} />
        </div>
      )}
    </motion.div>
  );
}

/* ─── Payment Donut + Legend ─── */
function PaymentPanel({ data }: { data: SalesReportData }) {
  const total = data.payments.reduce((s, p) => s + p.value, 0);
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <motion.div custom={5} variants={fadeUp} initial="hidden" animate="show"
      className="admin-panel p-6 relative overflow-hidden flex flex-col"
    >
      <div className="mb-4">
        <h3 className="font-extrabold text-[#eef2ff] text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>สัดส่วนตามหมวดหมู่ / การชำระ</h3>
        <p className="text-[10px] text-[#5a6e90] uppercase tracking-wider font-bold mt-0.5">Category & Payment Breakdown</p>
      </div>

      <div className="relative flex items-center justify-center" style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data.payments}
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              onMouseEnter={(_, idx) => setHovered(idx)}
              onMouseLeave={() => setHovered(null)}
            >
              {data.payments.map((_, idx) => (
                <Cell
                  key={idx}
                  fill={PAYMENT_PALETTE[idx % PAYMENT_PALETTE.length].color}
                  opacity={hovered === null || hovered === idx ? 1 : 0.35}
                  style={{ cursor: 'pointer', filter: hovered === idx ? `drop-shadow(0 0 8px ${PAYMENT_PALETTE[idx % PAYMENT_PALETTE.length].glow})` : 'none', transition: 'opacity 0.2s, filter 0.2s' }}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: 'rgba(10,14,26,0.95)', border: '1px solid rgba(0,212,255,0.25)', borderRadius: 12, backdropFilter: 'blur(16px)', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}
              itemStyle={{ fontSize: 12, fontWeight: 800, color: '#eef2ff' }}
              formatter={(v: any) => [fmtFull(v), 'ยอดขาย']}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-[9px] text-[#5a6e90] font-bold uppercase tracking-wider">รวม</p>
          <p className="text-sm font-black text-[#22e5ff] mt-0.5 font-mono">{fmt(total)}</p>
        </div>
      </div>

      <div className="mt-4 space-y-2 flex-1 max-h-40 overflow-y-auto">
        {data.payments.map((p, idx) => {
          const pct = total > 0 ? ((p.value / total) * 100).toFixed(1) : '0';
          const pal = PAYMENT_PALETTE[idx % PAYMENT_PALETTE.length];
          return (
            <div
              key={p.method}
              className="flex items-center gap-2.5 p-2 rounded-xl cursor-default transition-all duration-200"
              style={hovered === idx ? { background: `${pal.color}15`, border: `1px solid ${pal.color}35` } : { border: '1px solid transparent' }}
              onMouseEnter={() => setHovered(idx)}
              onMouseLeave={() => setHovered(null)}
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: pal.color, boxShadow: hovered === idx ? `0 0 8px ${pal.glow}` : 'none' }} />
              <span className="text-[10px] font-bold text-[#94a3c4] uppercase tracking-wide flex-1 truncate">{p.method}</span>
              <span className="text-[10px] font-black text-[#eef2ff] font-mono">{pct}%</span>
              <span className="text-[10px] text-[#5a6e90] font-semibold font-mono">{fmt(p.value)}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ─── Top Products ─── */
function TopProductsPanel({ data }: { data: SalesReportData }) {
  const maxRevenue = Math.max(...data.topProducts.map(p => p.revenue), 1);

  return (
    <motion.div custom={6} variants={fadeUp} initial="hidden" animate="show"
      className="admin-panel p-6 relative overflow-hidden"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-extrabold text-[#eef2ff] text-sm flex items-center gap-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
            <Award className="w-4 h-4 text-[#fbbf24]" />
            สินค้าขายดีที่สุด (Top Selling Products)
          </h3>
          <p className="text-[10px] text-[#5a6e90] uppercase tracking-wider font-bold mt-0.5">Top Selling Items by Revenue</p>
        </div>
      </div>

      <div className="space-y-3">
        {data.topProducts.map((p, idx) => {
          const pct = (p.revenue / maxRevenue) * 100;
          const rank = RANK_CONFIG[idx] ?? { icon: Wine, color: '#5a6e90', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', label: `#${idx + 1}` };
          const RankIcon = rank.icon;

          return (
            <motion.div key={p.name}
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 + 0.2, type: 'spring', stiffness: 90 }}
              className="group relative rounded-xl p-3.5 transition-all duration-250 cursor-default"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <div className="relative flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-250 group-hover:scale-110"
                  style={{ background: rank.bg, border: `1px solid ${rank.border}` }}>
                  <RankIcon className="w-4 h-4" style={{ color: rank.color }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <p className="text-xs font-bold text-[#eef2ff] truncate m-0">{p.name}</p>
                    <p className="text-xs font-black text-[#22e5ff] shrink-0 m-0 font-mono">{fmtFull(p.revenue)}</p>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden bg-white/5">
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: idx * 0.07 + 0.3, ease: [0.16, 1, 0.3, 1] }}
                      style={{ background: `linear-gradient(to right, ${rank.color}80, ${rank.color})` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[9px] text-[#5a6e90] font-semibold">{p.quantity} ชิ้น</span>
                    <span className="text-[9px] font-bold font-mono" style={{ color: rank.color }}>{pct.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {data.topProducts.length === 0 && (
          <div className="py-12 flex flex-col items-center gap-2 text-[#3d4d6a]">
            <Wine className="w-8 h-8" />
            <p className="text-xs font-semibold">ยังไม่มีข้อมูลสินค้าขายดีในช่วงนี้</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Loading Skeleton ─── */
function LoadingSkeleton() {
  return (
    <div className="space-y-5 animate-pulse select-none" style={{ padding: '20px', maxWidth: 1500 }}>
      <div className="h-10 w-48 rounded-xl bg-white/5" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1,2,3,4].map(i => <div key={i} className="h-24 rounded-2xl bg-white/5" />)}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1,2,3,4].map(i => <div key={i} className="h-28 rounded-2xl bg-white/5" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 h-80 rounded-2xl bg-white/5" />
        <div className="h-80 rounded-2xl bg-white/5" />
      </div>
      <div className="h-72 rounded-2xl bg-white/5" />
    </div>
  );
}

/* ─── Main Page ─── */
export default function AdminReportsPage() {
  const { accessToken } = useApiAuth();
  const [data, setData] = useState<SalesReportData | null>(null);
  const [ecomDashboard, setEcomDashboard] = useState<EcommerceDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Filters
  const [sourceFilter, setSourceFilter] = useState<'ecommerce' | 'all' | 'pos' | 'qr'>('ecommerce');
  const [rangeFilter, setRangeFilter] = useState<'7d' | '30d' | '90d'>('30d');

  const load = async (force = false) => {
    setError(null);
    if (!data) setLoading(true);
    if (force) {
      setRefreshing(true);
      try {
        const { clearApiCache } = await import('@/lib/api/client');
        clearApiCache('reports');
      } catch {}
    }
    try {
      const token = accessToken || await ensureApiAuth();
      if (!token) throw new Error('ไม่พบสิทธิ์การเข้าถึง API');

      const today = new Date();
      const past = new Date();
      const days = rangeFilter === '7d' ? 7 : rangeFilter === '90d' ? 90 : 30;
      past.setDate(past.getDate() - days);
      const date_from = past.toISOString().split('T')[0];
      const date_to = today.toISOString().split('T')[0];

      // Concurrently fetch Sales Report and Ecommerce Dashboard
      const [salesRes, ecomRes] = await Promise.allSettled([
        reportsApi.getSales({
          date_from,
          date_to,
          order_source: sourceFilter === 'all' ? undefined : sourceFilter,
          group_by: days > 30 ? 'month' : 'day',
        }, token),
        reportsApi.getEcommerceDashboard(token),
      ]);

      if (ecomRes.status === 'fulfilled' && ecomRes.value) {
        setEcomDashboard(ecomRes.value);
      }

      if (salesRes.status === 'fulfilled') {
        const result = salesRes.value;
        const salesByHour = Array.isArray(result.sales_by_hour)
          ? result.sales_by_hour
          : (Array.isArray((result as any).sales_by_day) ? (result as any).sales_by_day : []);
        
        let topProds = Array.isArray(result.top_products) ? result.top_products : [];
        // If top_products is empty but ecom top_selling_wines is available, blend them
        if (topProds.length === 0 && ecomRes.status === 'fulfilled' && ecomRes.value?.top_selling_wines) {
          topProds = ecomRes.value.top_selling_wines.map(w => ({
            name: w.product_name,
            quantity: w.total_quantity,
            revenue: w.total_revenue,
          }));
        }

        const salesByCat = Array.isArray(result.sales_by_category) ? result.sales_by_category : [];

        setData({
          totalSales: Number(result.total_sales ?? 0),
          totalOrders: Number(result.total_orders ?? 0),
          sales: salesByHour.map((s: any) => ({
            date: s.date ?? s.hour ?? s.day ?? '00:00',
            amount: Number(s.amount ?? s.total ?? 0),
            count: Number(s.count ?? s.orders_count ?? 1),
          })),
          topProducts: topProds.map((tp: any) => ({
            name: tp.product_name ?? tp.name ?? 'สินค้าไวน์',
            quantity: Number(tp.quantity ?? tp.total_qty ?? tp.total_quantity ?? 0),
            revenue: Number(tp.revenue ?? tp.total_amount ?? tp.total_revenue ?? 0),
          })),
          payments: salesByCat.length
            ? salesByCat.map((c: any) => ({
                method: c.category_name ?? c.category ?? c.name ?? 'หมวดหมู่',
                value: Number(c.total_amount ?? c.amount ?? c.revenue ?? 0),
              }))
            : [
                { method: 'ยอดขาย e-Commerce รวม', value: Number(result.total_sales ?? 0) },
              ],
        });
      } else {
        throw new Error('ไม่สามารถดึงข้อมูลรายงานยอดขายจาก API ได้');
      }
    } catch (e: any) {
      setError(e.message || 'ไม่สามารถดึงข้อมูลรายงานยอดขายจาก API จริงได้');
      if (!data) setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    load();
  }, [accessToken, sourceFilter, rangeFilter]);

  const handleExportCSV = () => {
    if (!data) return;
    const rows = [
      ['วันที่/ช่วงเวลา', 'ยอดขาย (บาท)', 'จำนวนคำสั่งซื้อ'],
      ...data.sales.map(s => [s.date, s.amount.toString(), s.count.toString()]),
      [],
      ['สินค้าขายดี', 'จำนวนที่ขาย (ขวด/ชิ้น)', 'รายได้รวม (บาท)'],
      ...data.topProducts.map(p => [p.name, p.quantity.toString(), p.revenue.toString()]),
    ];

    const csvContent = '\uFEFF' + rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `bottleclub_sales_report_${sourceFilter}_${rangeFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!mounted || (loading && !data)) return <LoadingSkeleton />;

  if (error || !data) {
    return (
      <div className="admin-panel p-10 flex flex-col items-center gap-4 text-center select-none" style={{ padding: '20px', maxWidth: 1500 }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-rose-500/10 border border-rose-500/20">
          <ShieldAlert className="w-8 h-8 text-[#fb7185]" />
        </div>
        <div>
          <p className="font-bold text-[#eef2ff]">โหลดรายงานไม่สำเร็จ</p>
          <p className="text-sm text-[#5a6e90] mt-1">{error || 'ไม่พบข้อมูลรายงานยอดขาย'}</p>
        </div>
        <button onClick={() => load(true)} className="admin-btn-primary flex items-center gap-2 px-5 py-2.5 text-xs font-bold cursor-pointer">
          <RefreshCw className="w-3.5 h-3.5" /> ลองใหม่
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6 select-none font-sans animate-in" style={{ padding: '20px', maxWidth: 1500 }}>
      {/* ─── Page header ─── */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show"
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h2 className="text-xl sm:text-2xl font-black text-[#eef2ff] tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
              รายงานยอดขาย e-Commerce (Bottle Club)
            </h2>
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-widest text-[#34d399] bg-[rgba(52,211,153,0.12)] border border-[rgba(52,211,153,0.30)] font-mono">
              Live FastAPI
            </span>
          </div>
          <p className="text-xs text-[#5a6e90] font-semibold">
            วิเคราะห์ยอดขายออนไลน์ คำสั่งซื้อ ช่องทางชำระเงิน และสินค้าไวน์ยอดนิยมตรงจาก FastAPI
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Source Filter */}
          <div className="flex items-center rounded-xl bg-black/40 border border-white/10 p-1 text-xs">
            <button
              onClick={() => setSourceFilter('ecommerce')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                sourceFilter === 'ecommerce'
                  ? 'bg-cyan-500/20 text-[#22e5ff] border border-cyan-500/40 shadow-[0_0_10px_rgba(34,229,255,0.2)]'
                  : 'text-[#94a3c4] hover:text-[#eef2ff]'
              }`}
            >
              e-Commerce
            </button>
            <button
              onClick={() => setSourceFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                sourceFilter === 'all'
                  ? 'bg-cyan-500/20 text-[#22e5ff] border border-cyan-500/40 shadow-[0_0_10px_rgba(34,229,255,0.2)]'
                  : 'text-[#94a3c4] hover:text-[#eef2ff]'
              }`}
            >
              ทุกช่องทาง
            </button>
            <button
              onClick={() => setSourceFilter('pos')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                sourceFilter === 'pos'
                  ? 'bg-cyan-500/20 text-[#22e5ff] border border-cyan-500/40 shadow-[0_0_10px_rgba(34,229,255,0.2)]'
                  : 'text-[#94a3c4] hover:text-[#eef2ff]'
              }`}
            >
              POS หน้าร้าน
            </button>
          </div>

          {/* Time Range Filter */}
          <div className="flex items-center rounded-xl bg-black/40 border border-white/10 p-1 text-xs">
            <button
              onClick={() => setRangeFilter('7d')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                rangeFilter === '7d' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-[#94a3c4] hover:text-[#eef2ff]'
              }`}
            >
              7 วัน
            </button>
            <button
              onClick={() => setRangeFilter('30d')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                rangeFilter === '30d' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-[#94a3c4] hover:text-[#eef2ff]'
              }`}
            >
              30 วัน
            </button>
            <button
              onClick={() => setRangeFilter('90d')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                rangeFilter === '90d' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-[#94a3c4] hover:text-[#eef2ff]'
              }`}
            >
              90 วัน
            </button>
          </div>

          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="admin-btn-secondary flex items-center gap-1.5 px-3 py-2 text-xs font-bold cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#22e5ff]' : ''}`} />
            <span>รีเฟรช</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="admin-btn-primary flex items-center gap-1.5 px-4 py-2 text-xs font-bold cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ส่งออก CSV</span>
          </button>
        </div>
      </motion.div>

      {/* ─── Real-time E-Commerce Live Performance ─── */}
      <EcommerceLiveStrip ecom={ecomDashboard} />

      {/* ─── KPI Strip (Period Selected) ─── */}
      <SummaryStrip data={data} />

      {/* ─── Main chart grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <RevenueChart data={data} />
        </div>
        <PaymentPanel data={data} />
      </div>

      {/* ─── Top products ─── */}
      <TopProductsPanel data={data} />
    </div>
  );
}
