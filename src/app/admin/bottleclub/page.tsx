'use client';

import React, { useEffect, useState } from 'react';
import KPICard from '@/components/admin/KPICard';
import SalesChart from '@/components/admin/SalesChart';
import OrderStatusBadge from '@/components/admin/OrderStatusBadge';
import { motion } from 'framer-motion';
import {
  DollarSign, ShoppingBag, Users, AlertTriangle,
  ArrowRight, Settings, Wine, Plus, Eye,
  Package, Star, BarChart3, Clock, Zap, RefreshCw,
  TrendingUp, Activity, Layers,
} from 'lucide-react';
import Link from 'next/link';

interface DashboardData {
  metrics: {
    todayRevenue: string;
    pendingOrders: number;
    newMembers: number;
    lowStockAlerts: number;
  };
  lowStockProducts: {
    id: number;
    name: string;
    stock: number;
    price: number;
  }[];
  salesData: {
    date: string;
    amount: number;
  }[];
  recentOrders: {
    id: number;
    customer: string;
    total: string;
    status: string;
    date: string;
    paymentMethod: string;
    type: string;
  }[];
}

const emptyData: DashboardData = {
  metrics: {
    todayRevenue: '0.00',
    pendingOrders: 0,
    newMembers: 0,
    lowStockAlerts: 0,
  },
  lowStockProducts: [],
  salesData: [],
  recentOrders: [],
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 90, damping: 18 } },
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const quickActions = [
  { label: 'เพิ่มสินค้า', icon: Plus, href: '/admin/products/new', color: '#c41e3a', glow: 'rgba(196,30,58,0.2)' },
  { label: 'ดูออเดอร์', icon: Eye, href: '/admin/orders', color: '#3b82f6', glow: 'rgba(59,130,246,0.2)' },
  { label: 'รายงาน', icon: BarChart3, href: '/admin/reports', color: '#10b981', glow: 'rgba(16,185,129,0.2)' },
  { label: 'จัดการสมาชิก', icon: Users, href: '/admin/members', color: '#a855f7', glow: 'rgba(168,85,247,0.2)' },
];

const sparklines = {
  revenue: [0, 0, 0, 0, 0, 0, 0],
  orders: [0, 0, 0, 0, 0, 0, 0],
  members: [0, 0, 0, 0, 0, 0, 0],
  stock: [0, 0, 0, 0, 0, 0, 0],
};

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse select-none">
      <div className="h-28 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)' }} />
      <div className="flex gap-3 overflow-hidden">
        {[1,2,3,4].map(i => <div key={i} className="h-32 rounded-2xl flex-shrink-0 w-[72%] sm:w-[44%] lg:w-full" style={{ background: 'rgba(255,255,255,0.04)' }} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 h-80 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)' }} />
        <div className="h-80 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)' }} />
      </div>
    </div>
  );
}

function MobileOrderCard({ order, idx }: { order: DashboardData['recentOrders'][0]; idx: number }) {
  return (
    <motion.div variants={fadeUp}>
      <Link
        href={`/admin/orders/${order.id}`}
        className="admin-order-card-mobile block"
      >
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0"
              style={{ background: `hsl(${(idx * 47) % 360}, 50%, 35%)`, boxShadow: `0 0 10px hsl(${(idx * 47) % 360}, 50%, 35%, 0.4)` }}
            >
              {order.customer.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-bold leading-tight" style={{ color: '#e2e8f0' }}>{order.customer}</p>
              <p className="text-[10px] mt-0.5 font-mono" style={{ color: '#475569' }}>#{String(order.id).padStart(4, '0')}</p>
            </div>
          </div>
          <OrderStatusBadge status={order.status} size="sm" />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black" style={{ color: '#f1f5f9' }}>{order.total}</span>
            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(255,255,255,0.06)', color: '#64748b', border: '1px solid rgba(255,255,255,0.08)' }}>
              {order.paymentMethod}
            </span>
          </div>
          <span className="text-[10px] font-medium" style={{ color: '#475569' }}>{order.date}</span>
        </div>
      </Link>
    </motion.div>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadData = async () => {
    try {
      const res = await fetch('/api/admin/dashboard', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json && json.metrics) {
          setData(json);
        } else {
          setData(emptyData);
        }
      } else {
        setData(emptyData);
      }
      setLastUpdated(new Date());
    } catch (err: any) {
      setData(emptyData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  if (loading) return <LoadingSkeleton />;

  const displayData = data || emptyData;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 select-none font-sans"
    >
      {/* ─── Control Center Header Banner ─── */}
      <motion.div variants={fadeUp} className="relative rounded-2xl p-5 sm:p-6 overflow-hidden border"
        style={{
          background: 'linear-gradient(135deg, rgba(19, 25, 41, 0.95) 0%, rgba(26, 34, 53, 0.9) 100%)',
          borderColor: 'rgba(255, 255, 255, 0.08)',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4), 0 1px 0 rgba(255, 255, 255, 0.05) inset'
        }}
      >
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none opacity-20"
          style={{ background: 'radial-gradient(circle, #c41e3a 0%, transparent 70%)', transform: 'translate(30%, -40%)' }} />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <img
                src="/logo.jpg"
                alt="The Bottle Club Logo"
                className="w-12 h-12 rounded-2xl object-contain bg-[#e6d0a7] p-1 border border-white/10"
                style={{ boxShadow: '0 4px 16px rgba(196, 30, 58, 0.35)' }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black font-serif tracking-tight" style={{ color: '#f1f5f9' }}>
                  Dashboard Web Wine
                </h1>
                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ระบบทำงานปกติ
                </span>
              </div>
              <p className="text-xs mt-0.5 font-medium" style={{ color: '#64748b' }}>
                {lastUpdated ? `อัปเดตล่าสุด ${lastUpdated.toLocaleTimeString('th-TH')}` : 'กำลังโหลด...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {quickActions.map((act) => {
              const Icon = act.icon;
              return (
                <Link
                  key={act.label}
                  href={act.href}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 hover:scale-105"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#cbd5e1' }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: act.color }} />
                  <span>{act.label}</span>
                </Link>
              );
            })}
            <button
              onClick={loadData}
              className="p-2 rounded-xl text-slate-400 hover:text-white transition shrink-0"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* ─── KPI Cards Row ─── */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KPICard
          title="ยอดขายวันนี้"
          value={`฿${displayData.metrics.todayRevenue}`}
          change="+0%"
          trend="neutral"
          icon={DollarSign}
          sparkline={sparklines.revenue}
        />
        <KPICard
          title="ออเดอร์รอดำเนินการ"
          value={displayData.metrics.pendingOrders.toString()}
          change="0 ออเดอร์"
          trend="neutral"
          icon={ShoppingBag}
          sparkline={sparklines.orders}
        />
        <KPICard
          title="สมาชิกใหม่เดือนนี้"
          value={displayData.metrics.newMembers.toString()}
          change="+0%"
          trend="neutral"
          icon={Users}
          sparkline={sparklines.members}
        />
        <KPICard
          title="สินค้าใกล้หมดสต็อก"
          value={displayData.metrics.lowStockAlerts.toString()}
          change="ควรเติมสต็อก"
          trend="neutral"
          icon={AlertTriangle}
          sparkline={sparklines.stock}
        />
      </motion.div>

      {/* ─── Charts & Low Stock Row ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <SalesChart data={displayData.salesData} />
        </motion.div>

        <motion.div variants={fadeUp} className="admin-card rounded-2xl p-5 flex flex-col justify-between"
          style={{ background: 'rgba(19, 25, 41, 0.85)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <AlertTriangle className="w-4 h-4" style={{ color: '#f87171' }} />
                </div>
                <div>
                  <h3 className="text-sm font-bold leading-tight" style={{ color: '#f1f5f9' }}>สต็อกใกล้หมด</h3>
                  <p className="text-[10px]" style={{ color: '#64748b' }}>สินค้าที่ต้องรีบสั่งซื้อเติม</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                {displayData.lowStockProducts.length} รายการ
              </span>
            </div>

            <div className="divide-y divide-slate-800/40">
              {displayData.lowStockProducts.length === 0 ? (
                <div className="py-12 text-center select-none">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                  <p className="text-xs font-semibold text-slate-400">สต็อกปกติทุกรายการ</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">ยังไม่มีสินค้ารายการใดต่ำกว่าเกณฑ์</p>
                </div>
              ) : (
                displayData.lowStockProducts.map((prod) => (
                  <div key={prod.id} className="py-3 flex items-center justify-between gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center" style={{ background: 'rgba(196,30,58,0.1)', border: '1px solid rgba(196,30,58,0.2)' }}>
                        <Wine className="w-3.5 h-3.5" style={{ color: '#f87171' }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate" style={{ color: '#cbd5e1' }}>{prod.name}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: '#475569' }}>฿{(prod.price ?? 0).toLocaleString('th-TH')}</p>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                        prod.stock <= 2
                          ? 'badge-rejected'
                          : 'badge-pending'
                      }`}
                    >
                      {prod.stock} ชิ้น
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <Link
            href="/admin/products"
            className="mt-4 w-full py-2.5 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-all hover:brightness-110"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#cbd5e1' }}
          >
            จัดการคลังสินค้าทั้งหมด <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>
      </div>

      {/* ─── Recent Orders Table ─── */}
      <motion.div variants={fadeUp} className="admin-card rounded-2xl p-5 sm:p-6"
        style={{ background: 'rgba(19, 25, 41, 0.85)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm sm:text-base font-bold flex items-center gap-2" style={{ color: '#f1f5f9' }}>
              <ShoppingBag className="w-4 h-4 text-red-500" /> คำสั่งซื้อล่าสุด
            </h3>
            <p className="text-[11px] mt-0.5" style={{ color: '#64748b' }}>รายการสั่งซื้อสินค้าไวน์ล่าสุดจากระบบ Web Wine</p>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs font-bold flex items-center gap-1 text-red-400 hover:text-red-300 transition"
          >
            ดูทั้งหมด <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile View */}
        <div className="sm:hidden space-y-3">
          {displayData.recentOrders.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">ยังไม่มีรายการสั่งซื้อในระบบ</div>
          ) : (
            displayData.recentOrders.map((order, idx) => (
              <MobileOrderCard key={order.id} order={order} idx={idx} />
            ))
          )}
        </div>

        {/* Desktop View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <th className="pb-3 pr-4 font-bold uppercase tracking-wider text-[10px]" style={{ color: '#475569' }}>รหัสออเดอร์</th>
                <th className="pb-3 pr-4 font-bold uppercase tracking-wider text-[10px]" style={{ color: '#475569' }}>ชื่อลูกค้า</th>
                <th className="pb-3 pr-4 font-bold uppercase tracking-wider text-[10px]" style={{ color: '#475569' }}>ยอดรวม</th>
                <th className="pb-3 pr-4 font-bold uppercase tracking-wider text-[10px]" style={{ color: '#475569' }}>ช่องทางชำระ</th>
                <th className="pb-3 pr-4 font-bold uppercase tracking-wider text-[10px]" style={{ color: '#475569' }}>ประเภท</th>
                <th className="pb-3 pr-4 font-bold uppercase tracking-wider text-[10px]" style={{ color: '#475569' }}>สถานะ</th>
                <th className="pb-3 pr-4 font-bold uppercase tracking-wider text-[10px]" style={{ color: '#475569' }}>วันที่/เวลา</th>
                <th className="pb-3 text-right font-bold uppercase tracking-wider text-[10px]" style={{ color: '#475569' }}>การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {displayData.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    ยังไม่มีรายการสั่งซื้อในระบบ
                  </td>
                </tr>
              ) : (
                displayData.recentOrders.map((order, idx) => (
                  <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 pr-4 font-mono font-bold" style={{ color: '#cbd5e1' }}>#{String(order.id).padStart(4, '0')}</td>
                    <td className="py-3.5 pr-4 font-semibold">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0"
                          style={{ background: `hsl(${(idx * 47) % 360}, 50%, 35%)`, boxShadow: `0 0 8px hsl(${(idx * 47) % 360}, 50%, 35%, 0.3)` }}
                        >
                          {order.customer.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="truncate max-w-[120px]" style={{ color: '#94a3b8' }}>{order.customer}</span>
                      </div>
                    </td>
                    <td className="py-3.5 pr-4 font-bold" style={{ color: '#e2e8f0' }}>{order.total}</td>
                    <td className="py-3.5 pr-4">
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(255,255,255,0.05)', color: '#64748b', border: '1px solid rgba(255,255,255,0.07)' }}>
                        {order.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(255,255,255,0.05)', color: '#64748b', border: '1px solid rgba(255,255,255,0.07)' }}>
                        {order.type}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4">
                      <OrderStatusBadge status={order.status} size="sm" />
                    </td>
                    <td className="py-3.5 pr-4 font-medium text-[10px]" style={{ color: '#475569' }}>{order.date}</td>
                    <td className="py-3.5 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="admin-action-btn"
                      >
                        <Eye className="w-3 h-3" /> ดู
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
