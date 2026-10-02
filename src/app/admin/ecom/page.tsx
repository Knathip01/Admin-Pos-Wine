'use client';

import React, { useEffect, useState } from 'react';
import KPICard from '@/components/admin/KPICard';
import SalesChart from '@/components/admin/SalesChart';
import OrderStatusBadge from '@/components/admin/OrderStatusBadge';
import { motion } from 'framer-motion';
import {
  DollarSign, ShoppingBag, Users, AlertTriangle,
  ArrowRight, Wine, Plus, Eye, BarChart3, RefreshCw, Activity,
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
  { label: 'เพิ่มไวน์ใหม่', icon: Plus, href: '/admin/products/new', color: '#c41e3a' },
  { label: 'ตรวจสลิปโอนเงิน', icon: Eye, href: '/admin/payments', color: '#3b82f6' },
  { label: 'รายงานยอดขาย', icon: BarChart3, href: '/admin/reports', color: '#10b981' },
  { label: 'สมาชิก & แต้ม', icon: Users, href: '/admin/members', color: '#a855f7' },
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

export default function ProjectbottleClub1AdminPage() {
  const { accessToken } = useApiAuth();
  const [data, setData] = useState<DashboardData>(emptyData);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const token = accessToken || await ensureApiAuth();
      if (!token) { setData(emptyData); return; }
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
          type: 'E-Commerce',
        })),
      });
    } catch {
      setData(emptyData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [accessToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 animate-spin text-[#22e5ff]" />
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5 sm:space-y-6 select-none font-sans animate-in" style={{ padding: '20px', maxWidth: 1500 }}>
      {/* Top Banner */}
      <motion.div variants={fadeUp}>
        <div
          className="admin-panel relative overflow-hidden p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          style={{
            background: 'linear-gradient(135deg, rgba(14,20,35,0.95) 0%, rgba(10,14,26,0.92) 100%)',
            border: '1px solid rgba(0,212,255,0.20)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,212,255,0.06)'
          }}
        >
          <div className="flex items-center gap-4 z-10">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[rgba(0,212,255,0.12)] border border-[rgba(0,212,255,0.30)] shrink-0">
              <Wine className="w-6 h-6 text-[#22e5ff]" />
            </div>
            <div>
              <h2 className="font-black text-base sm:text-lg text-[#eef2ff]" style={{ fontFamily: "'Outfit', sans-serif" }}>E-Commerce Console</h2>
              <p className="text-xs text-[#5a6e90] mt-0.5 font-semibold">ระบบจัดการร้านค้าออนไลน์สั่งซื้อไวน์พรีเมียม สลิปโอนเงิน และสมาชิก</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap z-10">
            {quickActions.map((qa) => {
              const Icon = qa.icon;
              return (
                <Link
                  key={qa.href}
                  href={qa.href}
                  className="admin-btn-secondary flex items-center gap-1.5 px-3 py-2 text-xs font-bold cursor-pointer"
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

      {/* KPI Cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KPICard title="ยอดขาย E-Commerce" value={data.metrics.todayRevenue} change="+14.2%" trend="up" icon={DollarSign} sparkline={sparklines.revenue} />
        <KPICard title="ออเดอร์รอยืนยันสลิป" value={data.metrics.pendingOrders.toString()} change="+2 ออเดอร์" trend="up" icon={ShoppingBag} sparkline={sparklines.orders} />
        <KPICard title="สมาชิกใหม่เดือนนี้" value={data.metrics.newMembers.toString()} change="+18%" trend="up" icon={Users} sparkline={sparklines.members} />
        <KPICard title="สินค้าใกล้หมดคลัง" value={data.metrics.lowStockAlerts.toString()} change="เติมไวน์พรีเมียม" trend="down" icon={AlertTriangle} sparkline={sparklines.stock} />
      </motion.div>

      {/* Sales Chart + Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <SalesChart data={data.salesData} />
        </motion.div>

        <motion.div variants={fadeUp}>
          <div className="admin-panel p-5 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-extrabold text-[#eef2ff]" style={{ fontFamily: "'Outfit', sans-serif" }}>สต็อกไวน์ใกล้หมดคลัง</h3>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[rgba(244,63,94,0.12)] text-[#fb7185] border border-[rgba(244,63,94,0.30)]">
                  {data.lowStockProducts.length} รายการ
                </span>
              </div>

              <div className="divide-y divide-white/5">
                {data.lowStockProducts.map((prod) => (
                  <div key={prod.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Wine className="w-4 h-4 text-[#22e5ff] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#eef2ff] truncate m-0">{prod.name}</p>
                        <p className="text-[10px] text-[#5a6e90] m-0">฿{prod.price.toLocaleString('th-TH')}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-extrabold text-[#fbbf24] px-2 py-0.5 rounded-md bg-[rgba(251,191,36,0.12)] border border-[rgba(251,191,36,0.25)]">
                      เหลือ {prod.stock} ขวด
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Link href="/admin/products" className="admin-btn-secondary mt-4 w-full py-2.5 text-xs font-bold text-center block" style={{ textDecoration: 'none' }}>
              จัดการคาตาล็อกไวน์ →
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Recent Orders */}
      <motion.div variants={fadeUp}>
        <div className="admin-panel p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-extrabold text-[#eef2ff]" style={{ fontFamily: "'Outfit', sans-serif" }}>คำสั่งซื้อร้านค้าออนไลน์ล่าสุด</h3>
            <Link href="/admin/orders" className="text-xs text-[#22e5ff] hover:underline font-bold" style={{ textDecoration: 'none' }}>
              ดูทั้งหมด →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <th className="pb-3 pr-4 font-extrabold uppercase tracking-wider text-[10px] text-[#5a6e90]">#ออเดอร์</th>
                  <th className="pb-3 pr-4 font-extrabold uppercase tracking-wider text-[10px] text-[#5a6e90]">ลูกค้า</th>
                  <th className="pb-3 pr-4 font-extrabold uppercase tracking-wider text-[10px] text-[#5a6e90]">ยอดชำระ</th>
                  <th className="pb-3 pr-4 font-extrabold uppercase tracking-wider text-[10px] text-[#5a6e90]">ช่องทาง</th>
                  <th className="pb-3 pr-4 font-extrabold uppercase tracking-wider text-[10px] text-[#5a6e90]">สถานะ</th>
                  <th className="pb-3 text-right font-extrabold uppercase tracking-wider text-[10px] text-[#5a6e90]">วันที่</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 font-mono font-extrabold text-[#22e5ff]">#{order.id}</td>
                    <td className="py-3 font-bold text-[#eef2ff]">{order.customer}</td>
                    <td className="py-3 font-extrabold text-[#22e5ff]">{order.total}</td>
                    <td className="py-3 text-[#94a3c4] font-semibold">{order.paymentMethod}</td>
                    <td className="py-3"><OrderStatusBadge status={order.status} size="sm" /></td>
                    <td className="py-3 text-slate-400 text-[10px]">{order.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
