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

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 90, damping: 18 } },
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const quickActions = [
  { label: 'เพิ่มสินค้า', icon: Plus, href: '/admin/products/new', color: '#22e5ff', glow: 'rgba(0,212,255,0.2)' },
  { label: 'ดูออเดอร์', icon: Eye, href: '/admin/orders', color: '#2dd4bf', glow: 'rgba(45,212,191,0.2)' },
  { label: 'รายงาน', icon: BarChart3, href: '/admin/reports', color: '#fbbf24', glow: 'rgba(251,191,36,0.2)' },
  { label: 'จัดการสมาชิก', icon: Users, href: '/admin/members', color: '#c084fc', glow: 'rgba(192,132,252,0.2)' },
];


const sparklines = {
  revenue: [0, 0, 0, 0, 0, 0, 0],
  orders: [0, 0, 0, 0, 0, 0, 0],
  members: [0, 0, 0, 0, 0, 0, 0],
  stock: [0, 0, 0, 0, 0, 0, 0],
};

const emptyData: DashboardData = {
  metrics: { todayRevenue: '฿0', pendingOrders: 0, newMembers: 0, lowStockAlerts: 0 },
  lowStockProducts: [],
  salesData: [],
  recentOrders: [],
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
  const { accessToken } = useApiAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadData = async () => {
    try {
      const token = accessToken || await ensureApiAuth();
      if (!token) throw new Error('ไม่สามารถเชื่อมต่อ API ได้');
      const todayStr = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
      const [ordersRes, lowStockRes, custRes, reportsRes] = await Promise.allSettled([
        ordersApi.list({ page: 1, per_page: 20, date_from: todayStr, date_to: todayStr }, token),
        inventoryApi.getLowStock(10, token),
        customersApi.list({ page: 1, per_page: 50 }, token),
        reportsApi.getSales({ date_from: weekAgo, date_to: todayStr }, token),
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
          todayRevenue: `฿${totalRev.toLocaleString('th-TH', { minimumFractionDigits: 0 })}`,
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
          type: 'pos',
        })),
      });
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message);
      setData(emptyData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [accessToken]);

  if (loading) return <LoadingSkeleton />;

  if (error || !data) {
    return (
      <div className="rounded-2xl p-10 flex flex-col items-center gap-4 text-center select-none" style={{ background: 'rgba(19,25,41,0.92)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertTriangle className="w-8 h-8" style={{ color: '#f87171' }} />
        </div>
        <div>
          <p className="font-bold text-base" style={{ color: '#f1f5f9' }}>โหลดข้อมูลไม่สำเร็จ</p>
          <p className="text-sm mt-1" style={{ color: '#475569' }}>{error || 'ข้อมูลไม่สมบูรณ์'}</p>
        </div>
        <button
          onClick={() => { setError(null); setLoading(true); loadData(); }}
          className="admin-btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> ลองใหม่อีกครั้ง
        </button>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5 sm:space-y-6 select-none font-sans animate-in" style={{ padding: '20px', maxWidth: 1500 }}>
      <motion.div variants={fadeUp}>
        <div
          className="admin-panel relative overflow-hidden p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
          style={{
            background: 'linear-gradient(135deg, rgba(14,20,35,0.95) 0%, rgba(10,14,26,0.92) 100%)',
            border: '1px solid rgba(0,212,255,0.20)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,212,255,0.06)'
          }}
        >
          <div className="flex items-center gap-3 sm:gap-4 relative z-10">
            <div
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 border border-[rgba(0,212,255,0.35)] bg-[rgba(0,212,255,0.12)] shadow-[0_0_16px_rgba(0,212,255,0.20)]"
            >
              <Activity className="w-5 h-5 text-[#22e5ff]" />
            </div>
            <div>
              <h2 className="font-black text-sm sm:text-base leading-tight text-[#eef2ff]" style={{ fontFamily: "'Outfit', sans-serif" }}>Control Center</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34d399] animate-pulse" />
                <span className="text-[10px] sm:text-[11px] font-extrabold text-[#34d399]">ระบบทำงานปกติ</span>
                {lastUpdated && (
                  <span className="text-[9px] sm:text-[10px] hidden sm:inline text-[#5a6e90] font-semibold">· อัพเดต {lastUpdated.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 relative z-10 flex-wrap">
            {quickActions.map((qa) => {
              const Icon = qa.icon;
              return (
                <Link
                  key={qa.href}
                  href={qa.href}
                  className="admin-btn-secondary flex items-center gap-1.5 px-3 py-2 text-xs font-bold shrink-0 cursor-pointer"
                  style={{ textDecoration: 'none' }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: qa.color }} />
                  {qa.label}
                </Link>
              );
            })}
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <KPICard
            title="ยอดขายวันนี้"
            value={data.metrics.todayRevenue}
            change="+12.5%"
            trend="up"
            icon={DollarSign}
            sparkline={sparklines.revenue}
          />
          <KPICard
            title="ออเดอร์รอดำเนินการ"
            value={data.metrics.pendingOrders.toString()}
            change="+3 ออเดอร์"
            trend="up"
            icon={ShoppingBag}
            sparkline={sparklines.orders}
          />
          <KPICard
            title="สมาชิกใหม่เดือนนี้"
            value={data.metrics.newMembers.toString()}
            change="+18%"
            trend="up"
            icon={Users}
            sparkline={sparklines.members}
          />
          <KPICard
            title="สินค้าใกล้หมดคลัง"
            value={data.metrics.lowStockAlerts.toString()}
            change={data.metrics.lowStockAlerts > 0 ? 'ควรเติมสต็อก' : 'สต็อกเพียงพอ'}
            trend={data.metrics.lowStockAlerts > 0 ? 'down' : 'neutral'}
            icon={AlertTriangle}
            sparkline={sparklines.stock}
          />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <SalesChart data={data.salesData} />
        </motion.div>

        <motion.div variants={fadeUp}>
          <div className="admin-panel p-5 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-extrabold text-[#eef2ff]" style={{ fontFamily: "'Outfit', sans-serif" }}>สต็อกใกล้หมด</h3>
                  <p className="text-[10px] uppercase tracking-wider font-bold mt-0.5 text-[#5a6e90]">Low Stock Alert</p>
                </div>
                <span
                  className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(244,63,94,0.12)', color: '#fb7185', border: '1px solid rgba(244,63,94,0.30)' }}
                >
                  {data.lowStockProducts.length} รายการ
                </span>
              </div>

              <div className="divide-y divide-white/5">
                {data.lowStockProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center gap-2 text-[#3d4d6a]">
                    <Package className="w-8 h-8 opacity-40" />
                    <p className="text-xs font-bold text-[#94a3c4]">สินค้าทั้งหมดมีสต็อกเพียงพอ</p>
                  </div>
                ) : (
                  data.lowStockProducts.map((prod) => (
                    <div key={prod.id} className="py-3 flex items-center justify-between gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center" style={{ background: 'rgba(0,212,255,0.10)', border: '1px solid rgba(0,212,255,0.20)' }}>
                          <Wine className="w-3.5 h-3.5 text-[#22e5ff]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate text-[#eef2ff] m-0">{prod.name}</p>
                          <p className="text-[10px] mt-0.5 text-[#5a6e90] m-0">฿{prod.price.toLocaleString('th-TH')}</p>
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
              className="admin-btn-secondary mt-4 w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
              style={{ textDecoration: 'none' }}
            >
              จัดการสินค้า <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>
      </div>

      <motion.div variants={fadeUp}>
        <div className="admin-panel p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <div>
              <h3 className="text-sm font-extrabold text-[#eef2ff]" style={{ fontFamily: "'Outfit', sans-serif" }}>คำสั่งซื้อล่าสุด</h3>
              <p className="text-[10px] uppercase tracking-wider font-bold mt-0.5 text-[#5a6e90]">10 ออเดอร์ล่าสุด</p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-bold flex items-center gap-1 text-[#22e5ff] hover:underline transition"
              style={{ textDecoration: 'none' }}
            >
              ดูทั้งหมด <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="sm:hidden">
            {data.recentOrders.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-[#3d4d6a]">
                <ShoppingBag className="w-8 h-8" />
                <p className="text-xs font-semibold">ยังไม่มีคำสั่งซื้อ</p>
              </div>
            ) : (
              <motion.div
                className="space-y-3"
                variants={container}
                initial="hidden"
                animate="show"
              >
                {data.recentOrders.slice(0, 5).map((order, idx) => (
                  <MobileOrderCard key={order.id} order={order} idx={idx} />
                ))}
              </motion.div>
            )}
          </div>

          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <th className="pb-3 pr-4 font-extrabold uppercase tracking-wider text-[10px] text-[#5a6e90]">#ออเดอร์</th>
                  <th className="pb-3 pr-4 font-extrabold uppercase tracking-wider text-[10px] text-[#5a6e90]">ลูกค้า</th>
                  <th className="pb-3 pr-4 font-extrabold uppercase tracking-wider text-[10px] text-[#5a6e90]">ยอดชำระ</th>
                  <th className="pb-3 pr-4 font-extrabold uppercase tracking-wider text-[10px] text-[#5a6e90]">ช่องทาง</th>
                  <th className="pb-3 pr-4 font-extrabold uppercase tracking-wider text-[10px] text-[#5a6e90]">ประเภท</th>
                  <th className="pb-3 pr-4 font-extrabold uppercase tracking-wider text-[10px] text-[#5a6e90]">สถานะ</th>
                  <th className="pb-3 pr-4 font-extrabold uppercase tracking-wider text-[10px] text-[#5a6e90]">วันที่</th>
                  <th className="pb-3 text-right font-extrabold uppercase tracking-wider text-[10px] text-[#5a6e90]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#3d4d6a] text-xs font-semibold">
                      ยังไม่มีคำสั่งซื้อ
                    </td>
                  </tr>
                ) : (
                  data.recentOrders.map((order, idx) => (
                    <tr
                      key={order.id}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3.5 pr-4 font-mono font-extrabold text-[#22e5ff]">
                        #{String(order.id).padStart(4, '0')}
                      </td>
                      <td className="py-3.5 pr-4">
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
                      <td className="py-3.5 pr-4 font-medium text-[10px] text-[#5a6e90]">{order.date}</td>
                      <td className="py-3.5 text-right">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="admin-btn-secondary text-xs px-3 py-1 inline-flex items-center gap-1 cursor-pointer"
                          style={{ textDecoration: 'none' }}
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
        </div>
      </motion.div>
    </motion.div>
  );
}

