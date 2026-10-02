'use client';

import React, { useEffect, useState } from 'react';
import KPICard from '@/components/admin/KPICard';
import SalesChart from '@/components/admin/SalesChart';
import OrderStatusBadge from '@/components/admin/OrderStatusBadge';
import { motion } from 'framer-motion';
import {
  DollarSign, ShoppingBag, Users, AlertTriangle,
  ArrowRight, Settings, Plus, Eye,
  Package, Star, BarChart3, Clock, Zap, RefreshCw,
  TrendingUp, Activity, Layers, Wine, CreditCard,
} from 'lucide-react';
import Link from 'next/link';
import { useApiAuth, ensureApiAuth } from '@/lib/store/api-auth';
import { ordersApi } from '@/lib/api/orders';
import { reportsApi } from '@/lib/api/reports';
import { inventoryApi } from '@/lib/api/inventory';
import { customersApi } from '@/lib/api/customers';

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
  { label: 'จัดการสินค้า Web Wine', icon: Plus, href: '/admin/bottleclub/products', color: '#22e5ff', glow: 'rgba(0,212,255,0.2)' },
  { label: 'คำสั่งซื้อออนไลน์', icon: Eye, href: '/admin/bottleclub/orders', color: '#2dd4bf', glow: 'rgba(45,212,191,0.2)' },
  { label: 'ตรวจสลิปโอนเงิน', icon: CreditCard, href: '/admin/bottleclub/payments', color: '#34d399', glow: 'rgba(52,211,153,0.2)' },
  { label: 'สมาชิก & แต้มสะสม', icon: Users, href: '/admin/bottleclub/members', color: '#c084fc', glow: 'rgba(192,132,252,0.2)' },
  { label: 'รายงานยอดขาย e-Com', icon: BarChart3, href: '/admin/bottleclub/reports', color: '#fbbf24', glow: 'rgba(251,191,36,0.2)' },
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
        href={`/admin/bottleclub/orders`}
        className="admin-panel block p-4 hover:border-[rgba(0,212,255,0.30)] transition-all"
        style={{ textDecoration: 'none' }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[#eef2ff] text-xs">#{String(order.id).padStart(4, '0')}</span>
            <OrderStatusBadge status={order.status} size="sm" />
          </div>
          <span className="font-extrabold text-[#22e5ff] text-sm">{order.total}</span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-[#5a6e90]">
          <span>{order.customer}</span>
          <span>{order.date}</span>
        </div>
      </Link>
    </motion.div>
  );
}

export default function ProjectbottleClub1Page() {
  const { accessToken } = useApiAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadData = async (force = false) => {
    if (force) {
      setRefreshing(true);
      try {
        const { clearApiCache } = await import('@/lib/api/client');
        clearApiCache();
      } catch {}
    }
    try {
      const token = accessToken || await ensureApiAuth();
      if (token) {
        const todayStr = new Date().toISOString().split('T')[0];
        const [ordersRes, lowStockRes, custRes, reportsRes] = await Promise.allSettled([
          ordersApi.list({ page: 1, per_page: 20 }, token),
          inventoryApi.getLowStock(10, token),
          customersApi.list({ page: 1, per_page: 50 }, token),
          reportsApi.getSales({ date_from: todayStr, date_to: todayStr }, token),
        ]);

        const rawOrders = ordersRes.status === 'fulfilled'
          ? (Array.isArray(ordersRes.value) ? ordersRes.value : (ordersRes.value?.orders || []))
          : [];
        const lowStocks = lowStockRes.status === 'fulfilled'
          ? (Array.isArray(lowStockRes.value) ? lowStockRes.value : [])
          : [];
        const rawCusts = custRes.status === 'fulfilled'
          ? (Array.isArray(custRes.value) ? custRes.value : (custRes.value?.customers || []))
          : [];
        const salesReport = reportsRes.status === 'fulfilled' ? reportsRes.value : null;

        const totalRev = rawOrders.reduce((acc: number, o: any) => acc + Number(o.grand_total ?? o.total_amount ?? 0), 0);
        const pendingCount = rawOrders.filter((o: any) => o.status === 'pending').length;

        setData({
          metrics: {
            todayRevenue: totalRev.toLocaleString('th-TH', { minimumFractionDigits: 2 }),
            pendingOrders: pendingCount,
            newMembers: rawCusts.length,
            lowStockAlerts: lowStocks.length,
          },
          lowStockProducts: lowStocks.map((ls: any, idx: number) => ({
            id: ls.product_id ?? idx,
            name: ls.product_name ?? `สินค้า #${ls.product_id}`,
            stock: ls.quantity ?? 0,
            price: 0,
          })),
          salesData: salesReport?.sales_by_hour?.length
            ? salesReport.sales_by_hour.map((sh: any) => ({ date: sh.hour, amount: sh.amount }))
            : [{ date: 'วันนี้', amount: totalRev }],
          recentOrders: rawOrders.slice(0, 5).map((o: any) => ({
            id: o.id,
            customer: o.customer_name ?? o.order_number ?? `Order #${o.id}`,
            total: `฿${Number(o.grand_total ?? o.total_amount ?? 0).toLocaleString('th-TH')}`,
            status: o.status,
            date: new Date(o.created_at).toLocaleDateString('th-TH'),
            paymentMethod: 'โอนเงิน',
            type: 'online',
          })),
        });
        setLastUpdated(new Date());
      } else {
        setData(emptyData);
      }
    } catch {
      setData(emptyData);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(false), 30000);
    return () => clearInterval(interval);
  }, [accessToken]);

  if (loading && !data) {
    return <LoadingSkeleton />;
  }

  const displayData = data || emptyData;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 select-none font-sans animate-in"
      style={{ padding: '20px', maxWidth: 1500 }}
    >
      {/* ─── Quick Actions Bar ─── */}
      <motion.div
        variants={fadeUp}
        className="admin-panel relative overflow-hidden px-5 py-4"
        style={{
          background: 'linear-gradient(135deg, rgba(14,20,35,0.95) 0%, rgba(10,14,26,0.92) 100%)',
          border: '1px solid rgba(0,212,255,0.15)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.45), 0 0 0 1px rgba(0,212,255,0.05)'
        }}
      >
        <div className="flex items-center gap-3 flex-wrap">
          {quickActions.map((act) => {
            const Icon = act.icon;
            return (
              <Link
                key={act.label}
                href={act.href}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold shrink-0 cursor-pointer transition-all duration-200"
                style={{
                  textDecoration: 'none',
                  background: `rgba(${act.color === '#22e5ff' ? '0,212,255' : act.color === '#2dd4bf' ? '45,212,191' : act.color === '#fbbf24' ? '251,191,36' : '192,132,252'},0.10)`,
                  border: `1px solid rgba(${act.color === '#22e5ff' ? '0,212,255' : act.color === '#2dd4bf' ? '45,212,191' : act.color === '#fbbf24' ? '251,191,36' : '192,132,252'},0.25)`,
                  color: act.color,
                  boxShadow: `0 2px 12px ${act.glow}`,
                }}
              >
                <Icon className="w-4 h-4" style={{ color: act.color }} />
                <span>{act.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="ml-auto p-2.5 rounded-xl transition-all duration-200 cursor-pointer shrink-0 disabled:opacity-50"
            style={{ color: '#3d4d6a', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#22e5ff]' : ''}`} />
          </button>
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

        <motion.div variants={fadeUp} className="admin-panel flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.30)' }}>
                  <AlertTriangle className="w-4 h-4" style={{ color: '#fb7185' }} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold leading-tight text-[#eef2ff]" style={{ fontFamily: "'Outfit', sans-serif" }}>สต็อกใกล้หมด</h3>
                  <p className="text-[10px] text-[#3d4d6a] font-semibold">สินค้าที่ต้องรีบสั่งซื้อเติม</p>
                </div>
              </div>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(244, 63, 94, 0.12)', color: '#fb7185', border: '1px solid rgba(244, 63, 94, 0.30)' }}>
                {displayData.lowStockProducts.length} รายการ
              </span>
            </div>

            <div className="divide-y divide-white/5">
              {displayData.lowStockProducts.length === 0 ? (
                <div className="py-12 text-center select-none">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-30 text-[#3d4d6a]" />
                  <p className="text-xs font-bold text-[#94a3c4]">สต็อกปกติทุกรายการ</p>
                  <p className="text-[10px] text-[#3d4d6a] mt-0.5">ยังไม่มีสินค้ารายการใดต่ำกว่าเกณฑ์</p>
                </div>
              ) : (
                displayData.lowStockProducts.map((prod) => (
                  <div key={prod.id} className="py-3 flex items-center justify-between gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center" style={{ background: 'rgba(0,212,255,0.10)', border: '1px solid rgba(0,212,255,0.20)' }}>
                        <Wine className="w-3.5 h-3.5 text-[#22e5ff]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate text-[#eef2ff] m-0">{prod.name}</p>
                        <p className="text-[10px] mt-0.5 text-[#5a6e90] m-0">฿{(prod.price ?? 0).toLocaleString('th-TH')}</p>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 text-[10px] font-extrabold px-2 py-0.5 rounded-lg ${
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
            className="admin-btn-secondary mt-4 w-full py-2.5 text-xs font-bold text-center flex items-center justify-center gap-1.5 cursor-pointer"
            style={{ textDecoration: 'none' }}
          >
            จัดการคลังสินค้าทั้งหมด <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>
      </div>

      {/* ─── Recent Orders Table ─── */}
      <motion.div variants={fadeUp} className="admin-panel p-5 sm:p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold flex items-center gap-2 text-[#eef2ff]" style={{ fontFamily: "'Outfit', sans-serif" }}>
              <ShoppingBag className="w-4 h-4 text-[#22e5ff]" /> คำสั่งซื้อล่าสุด
            </h3>
            <p className="text-[11px] mt-0.5 text-[#5a6e90] font-semibold">รายการสั่งซื้อสินค้าไวน์ล่าสุดจากระบบ Web Wine</p>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs font-bold flex items-center gap-1 text-[#22e5ff] hover:underline transition"
            style={{ textDecoration: 'none' }}
          >
            ดูทั้งหมด <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile View */}
        <div className="sm:hidden space-y-3">
          {displayData.recentOrders.length === 0 ? (
            <div className="py-12 text-center text-[#3d4d6a] text-xs font-semibold">ยังไม่มีรายการสั่งซื้อในระบบ</div>
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
                <th className="pb-3 pr-4 font-extrabold uppercase tracking-wider text-[10px] text-[#5a6e90]">รหัสออเดอร์</th>
                <th className="pb-3 pr-4 font-extrabold uppercase tracking-wider text-[10px] text-[#5a6e90]">ชื่อลูกค้า</th>
                <th className="pb-3 pr-4 font-extrabold uppercase tracking-wider text-[10px] text-[#5a6e90]">ยอดรวม</th>
                <th className="pb-3 pr-4 font-extrabold uppercase tracking-wider text-[10px] text-[#5a6e90]">ช่องทางชำระ</th>
                <th className="pb-3 pr-4 font-extrabold uppercase tracking-wider text-[10px] text-[#5a6e90]">ประเภท</th>
                <th className="pb-3 pr-4 font-extrabold uppercase tracking-wider text-[10px] text-[#5a6e90]">สถานะ</th>
                <th className="pb-3 pr-4 font-extrabold uppercase tracking-wider text-[10px] text-[#5a6e90]">วันที่/เวลา</th>
                <th className="pb-3 text-right font-extrabold uppercase tracking-wider text-[10px] text-[#5a6e90]">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {displayData.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#3d4d6a] text-xs font-semibold">
                    ยังไม่มีรายการสั่งซื้อในระบบ
                  </td>
                </tr>
              ) : (
                displayData.recentOrders.map((order, idx) => (
                  <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 pr-4 font-mono font-extrabold text-[#22e5ff]">#{String(order.id).padStart(4, '0')}</td>
                    <td className="py-3.5 pr-4 font-semibold">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0"
                          style={{ background: `hsl(${(idx * 47) % 360}, 50%, 35%)`, boxShadow: `0 0 8px hsl(${(idx * 47) % 360}, 50%, 35%, 0.3)` }}
                        >
                          {order.customer.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="truncate max-w-[120px] text-[#94a3c4] font-bold">{order.customer}</span>
                      </div>
                    </td>
                    <td className="py-3.5 pr-4 font-extrabold text-[#eef2ff]">{order.total}</td>
                    <td className="py-3.5 pr-4">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-white/5 text-[#94a3c4] border border-white/10">
                        {order.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-white/5 text-[#94a3c4] border border-white/10">
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
