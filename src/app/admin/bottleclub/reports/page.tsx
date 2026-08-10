'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, RadialBarChart, RadialBar,
} from 'recharts';
import {
  Download, TrendingUp, TrendingDown, Award, CreditCard,
  ShieldAlert, RefreshCw, ArrowUpRight, Layers, Wine,
  BarChart3, Zap, Crown, Medal, Star,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Types ─── */
interface SalesReportData {
  sales: { date: string; amount: number; count: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
  payments: { method: string; value: number }[];
}

/* ─── Constants ─── */
const CHART_TABS = ['รายได้', 'จำนวนออเดอร์'] as const;
type ChartTab = typeof CHART_TABS[number];

const PAYMENT_PALETTE = [
  { color: '#c41e3a', glow: 'rgba(196,30,58,0.4)' },
  { color: '#f59e0b', glow: 'rgba(245,158,11,0.4)' },
  { color: '#3b82f6', glow: 'rgba(59,130,246,0.4)' },
  { color: '#10b981', glow: 'rgba(16,185,129,0.4)' },
  { color: '#a855f7', glow: 'rgba(168,85,247,0.4)' },
  { color: '#ec4899', glow: 'rgba(236,72,153,0.4)' },
];

const RANK_CONFIG = [
  { icon: Crown, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', label: '#1' },
  { icon: Medal, color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.15)', label: '#2' },
  { icon: Star,  color: '#cd7c2f', bg: 'rgba(205,124,47,0.08)', border: 'rgba(205,124,47,0.15)', label: '#3' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 80, damping: 16, delay: i * 0.06 } }),
};

/* ─── Helpers ─── */
const fmt = (n: number) => `฿${n.toLocaleString('th-TH', { maximumFractionDigits: 0 })}`;
const fmtFull = (n: number) => `฿${n.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;

/* ─── Custom Tooltips ─── */
const AreaTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(255,255,255,0.96)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 14, padding: '10px 14px', backdropFilter: 'blur(16px)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
      <p style={{ fontSize: 9, color: '#78716c', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>{payload[0]?.payload?.date}</p>
      <p style={{ fontSize: 18, fontWeight: 900, color: '#1c1917', lineHeight: 1 }}>{fmt(payload[0]?.value ?? 0)}</p>
      {payload[1] && <p style={{ fontSize: 11, color: '#78716c', marginTop: 4 }}>{payload[1].value} ออเดอร์</p>}
    </div>
  );
};

const BarTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(255,255,255,0.96)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 12, padding: '8px 12px', backdropFilter: 'blur(16px)', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
      <p style={{ fontSize: 10, color: '#78716c', fontWeight: 700, marginBottom: 3 }}>{payload[0]?.payload?.date}</p>
      <p style={{ fontSize: 13, fontWeight: 900, color: '#1c1917' }}>{payload[0]?.value} ออเดอร์</p>
    </div>
  );
};

/* ─── Summary KPI Strip ─── */
function SummaryStrip({ data }: { data: SalesReportData }) {
  const totalRevenue = data.sales.reduce((s, d) => s + d.amount, 0);
  const totalOrders  = data.sales.reduce((s, d) => s + d.count,  0);
  const avgOrder     = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const topPayment   = [...data.payments].sort((a, b) => b.value - a.value)[0];

  const kpis = [
    { label: 'รายได้รวมทั้งหมด', value: fmt(totalRevenue), sub: 'Total Revenue', accent: '#c41e3a', icon: TrendingUp },
    { label: 'ออเดอร์ทั้งหมด', value: totalOrders.toLocaleString(), sub: 'Total Orders', accent: '#f59e0b', icon: Layers },
    { label: 'มูลค่าเฉลี่ย/ออเดอร์', value: fmt(avgOrder), sub: 'Avg Order Value', accent: '#10b981', icon: BarChart3 },
    { label: 'ช่องทางยอดนิยม', value: topPayment?.method?.toUpperCase() ?? '–', sub: fmt(topPayment?.value ?? 0), accent: '#a855f7', icon: CreditCard },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {kpis.map((kpi, i) => {
        const Icon = kpi.icon;
        return (
          <motion.div key={kpi.label} custom={i} variants={fadeUp} initial="hidden" animate="show"
            className="admin-card rounded-2xl p-4 group cursor-default relative overflow-hidden"
          >
            {/* Corner glow */}
            <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none rounded-full" style={{ background: `radial-gradient(circle, ${kpi.accent}18 0%, transparent 70%)`, transform: 'translate(30%,-30%)' }} />
            {/* Top shimmer line */}
            <div className="absolute top-0 left-4 right-4 h-px" style={{ background: `linear-gradient(to right, transparent, ${kpi.accent}60, transparent)` }} />

            <div className="flex items-center justify-between mb-3">
              <p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-stone-500">{kpi.label}</p>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                style={{ background: `${kpi.accent}15`, border: `1px solid ${kpi.accent}30` }}>
                <Icon className="w-3.5 h-3.5" style={{ color: kpi.accent }} />
              </div>
            </div>
            <p className="text-xl font-black leading-none text-stone-800 tracking-tight">{kpi.value}</p>
            <p className="text-[10px] text-stone-500 font-semibold mt-1.5">{kpi.sub}</p>

            {/* Bottom progress line */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-2xl overflow-hidden">
              <div className="h-full w-3/4 transition-all duration-700" style={{ background: `linear-gradient(to right, ${kpi.accent}40, ${kpi.accent})` }} />
            </div>
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
      className="admin-card rounded-2xl p-6 relative overflow-hidden"
    >
      <div className="absolute top-0 left-8 right-8 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(0,0,0,0.06), transparent)' }} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="font-black font-serif text-stone-800 text-sm">กราฟยอดขายรายวัน</h3>
          <p className="text-[10px] text-stone-500 uppercase tracking-wider font-bold mt-0.5">Daily Revenue Analytics</p>
        </div>
        <div className="admin-tab-group shrink-0">
          {CHART_TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`admin-tab ${tab === t ? 'admin-tab-active' : ''}`}
            >{t}</button>
          ))}
        </div>
      </div>

      <div style={{ height: 220 }}>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} style={{ height: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              {tab === 'รายได้' ? (
                <AreaChart data={data.sales} margin={{ top: 5, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rev-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#c41e3a" stopOpacity={0.4} />
                      <stop offset="80%" stopColor="#c41e3a" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="rev-line" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="100%" stopColor="#c41e3a" />
                    </linearGradient>
                    <filter id="glow-line">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                      <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="2 5" stroke="rgba(0,0,0,0.06)" vertical={false} />
                  <XAxis dataKey="date" stroke="transparent" tick={{ fill: '#57534e', fontSize: 9, fontWeight: 600 }} tickLine={false} axisLine={false} dy={8} interval="preserveStartEnd" />
                  <YAxis stroke="transparent" tick={{ fill: '#57534e', fontSize: 9, fontWeight: 600 }} tickLine={false} axisLine={false} tickFormatter={v => v >= 1000 ? `฿${(v/1000).toFixed(0)}k` : `฿${v}`} />
                  <Tooltip content={<AreaTooltip />} cursor={{ stroke: 'rgba(196,30,58,0.25)', strokeWidth: 1, strokeDasharray: '4 2' }} />
                  <Area type="monotone" dataKey="amount" stroke="url(#rev-line)" strokeWidth={2.5} fill="url(#rev-grad)" dot={false} activeDot={{ r: 5, fill: '#c41e3a', stroke: 'rgba(196,30,58,0.4)', strokeWidth: 5, filter: 'url(#glow-line)' }} />
                </AreaChart>
              ) : (
                <BarChart data={data.sales} margin={{ top: 5, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="bar-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.85} />
                      <stop offset="100%" stopColor="#92400e" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 5" stroke="rgba(0,0,0,0.06)" vertical={false} />
                  <XAxis dataKey="date" stroke="transparent" tick={{ fill: '#57534e', fontSize: 9, fontWeight: 600 }} tickLine={false} axisLine={false} dy={8} interval="preserveStartEnd" />
                  <YAxis stroke="transparent" tick={{ fill: '#57534e', fontSize: 9, fontWeight: 600 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(196,30,58,0.04)' }} />
                  <Bar dataKey="count" fill="url(#bar-grad)" radius={[5, 5, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Average annotation */}
      {tab === 'รายได้' && avg > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <div className="h-px flex-1" style={{ background: 'rgba(245,158,11,0.2)', borderTop: '1px dashed rgba(245,158,11,0.3)' }} />
          <span className="text-[9px] font-bold text-amber-600/80 uppercase tracking-wider">avg {fmt(avg)}/วัน</span>
          <div className="h-px flex-1" style={{ background: 'rgba(245,158,11,0.2)', borderTop: '1px dashed rgba(245,158,11,0.3)' }} />
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
      className="admin-card rounded-2xl p-6 relative overflow-hidden flex flex-col"
    >
      <div className="absolute top-0 left-6 right-6 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(0,0,0,0.06), transparent)' }} />

      <div className="mb-4">
        <h3 className="font-black font-serif text-stone-800 text-sm">ช่องทางการชำระเงิน</h3>
        <p className="text-[10px] text-stone-500 uppercase tracking-wider font-bold mt-0.5">Payment Method Breakdown</p>
      </div>

      {/* Donut chart */}
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
              contentStyle={{ background: 'rgba(255,255,255,0.96)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 12, backdropFilter: 'blur(16px)', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
              itemStyle={{ fontSize: 12, fontWeight: 800, color: '#1c1917' }}
              formatter={(v: any) => [fmtFull(v), 'ยอดขาย']}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-[9px] text-stone-600 font-bold uppercase tracking-wider">รวมทั้งหมด</p>
          <p className="text-sm font-black text-stone-800 mt-0.5">{fmt(total)}</p>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 space-y-2 flex-1">
        {data.payments.map((p, idx) => {
          const pct = total > 0 ? ((p.value / total) * 100).toFixed(1) : '0';
          const pal = PAYMENT_PALETTE[idx % PAYMENT_PALETTE.length];
          return (
            <div
              key={p.method}
              className="flex items-center gap-2.5 p-2 rounded-xl cursor-default transition-all duration-200"
              style={hovered === idx ? { background: `${pal.color}10`, border: `1px solid ${pal.color}25` } : { border: '1px solid transparent' }}
              onMouseEnter={() => setHovered(idx)}
              onMouseLeave={() => setHovered(null)}
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: pal.color, boxShadow: hovered === idx ? `0 0 8px ${pal.glow}` : 'none' }} />
              <span className="text-[10px] font-bold text-stone-600 uppercase tracking-wide flex-1 truncate">{p.method}</span>
              <span className="text-[10px] font-black text-stone-700">{pct}%</span>
              <span className="text-[10px] text-stone-500 font-semibold">{fmt(p.value)}</span>
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
      className="admin-card rounded-2xl p-6 relative overflow-hidden"
    >
      <div className="absolute top-0 left-8 right-8 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(0,0,0,0.06), transparent)' }} />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-black font-serif text-stone-800 text-sm flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-600" />
            สินค้าขายดีที่สุด
          </h3>
          <p className="text-[10px] text-stone-500 uppercase tracking-wider font-bold mt-0.5">Top Selling Products by Revenue</p>
        </div>
      </div>

      <div className="space-y-3">
        {data.topProducts.map((p, idx) => {
          const pct = (p.revenue / maxRevenue) * 100;
          const rank = RANK_CONFIG[idx] ?? { icon: Wine, color: '#57534e', bg: 'rgba(87,83,78,0.08)', border: 'rgba(87,83,78,0.15)', label: `#${idx + 1}` };
          const RankIcon = rank.icon;

          return (
            <motion.div key={p.name}
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 + 0.2, type: 'spring', stiffness: 90 }}
              className="group relative rounded-xl p-3.5 transition-all duration-250 cursor-default"
              style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.06)' }}
            >
              {/* Hover overlay */}
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-250" style={{ background: `linear-gradient(90deg, ${rank.color}06 0%, transparent 100%)` }} />

              <div className="relative flex items-center gap-3">
                {/* Rank badge */}
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-250 group-hover:scale-110"
                  style={{ background: rank.bg, border: `1px solid ${rank.border}` }}>
                  <RankIcon className="w-4 h-4" style={{ color: rank.color }} />
                </div>

                {/* Name + bar */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <p className="text-xs font-bold text-stone-700 truncate">{p.name}</p>
                    <p className="text-xs font-black text-stone-800 shrink-0">{fmtFull(p.revenue)}</p>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: idx * 0.07 + 0.3, ease: [0.16, 1, 0.3, 1] }}
                      style={{ background: `linear-gradient(to right, ${rank.color}80, ${rank.color})` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[9px] text-stone-600 font-semibold">{p.quantity} ชิ้น</span>
                    <span className="text-[9px] font-bold" style={{ color: rank.color }}>{pct.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {data.topProducts.length === 0 && (
          <div className="py-12 flex flex-col items-center gap-2 text-stone-700">
            <Wine className="w-8 h-8" />
            <p className="text-xs font-semibold">ยังไม่มีข้อมูลสินค้าขายดี</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Loading Skeleton ─── */
function LoadingSkeleton() {
  return (
    <div className="space-y-5 animate-pulse select-none">
      <div className="h-10 w-48 rounded-xl bg-white/5" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1,2,3,4].map(i => <div key={i} className="h-28 rounded-2xl" style={{ background: 'rgba(0,0,0,0.05)' }} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 h-80 rounded-2xl" style={{ background: 'rgba(0,0,0,0.05)' }} />
        <div className="h-80 rounded-2xl" style={{ background: 'rgba(0,0,0,0.05)' }} />
      </div>
      <div className="h-96 rounded-2xl" style={{ background: 'rgba(0,0,0,0.05)' }} />
    </div>
  );
}

/* ─── Main Page ─── */
export default function AdminReportsPage() {
  const [data, setData]       = useState<SalesReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const load = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/admin/reports', { cache: 'no-store' });
      if (!res.ok) throw new Error('ไม่สามารถโหลดข้อมูลรายงานได้');
      setData(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setMounted(true); load(); }, []);

  if (!mounted || loading) return <LoadingSkeleton />;

  if (error || !data) {
    return (
      <div className="admin-card rounded-2xl p-10 flex flex-col items-center gap-4 text-center select-none">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <ShieldAlert className="w-8 h-8 text-red-600" />
        </div>
        <div>
          <p className="font-bold text-stone-800">โหลดรายงานไม่สำเร็จ</p>
          <p className="text-sm text-stone-500 mt-1">{error}</p>
        </div>
        <button onClick={load} className="admin-btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer">
          <RefreshCw className="w-3.5 h-3.5" /> ลองใหม่
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 select-none font-sans">

      {/* ─── Page header ─── */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show"
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(to bottom, #c41e3a, #7f1d1d)' }} />
            <h2 className="text-lg font-black font-serif text-stone-800 tracking-tight">รายงานยอดขาย</h2>
            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-widest text-emerald-700"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>Live</span>
          </div>
          <p className="text-xs text-stone-500 font-semibold pl-3">Sales Analytics & Market Intelligence Dashboard</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button onClick={load} className="admin-btn-secondary flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer">
            <RefreshCw className="w-3.5 h-3.5" /> รีเฟรช
          </button>
          <button
            onClick={() => window.open('/api/admin/reports?export=csv', '_blank')}
            className="admin-btn-primary flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer relative overflow-hidden shimmer-btn"
          >
            <Download className="w-3.5 h-3.5" /> ส่งออก CSV
          </button>
        </div>
      </motion.div>

      {/* ─── KPI Strip ─── */}
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
