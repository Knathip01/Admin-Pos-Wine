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
  revenue: [4200, 3800, 5100, 6200, 4900, 7100, 8300],
  orders: [3, 5, 2, 7, 4, 6, 8],
  members: [1, 2, 1, 3, 2, 4, 3],
  stock: [2, 3, 2, 4, 3, 2, 2],
};

const mockEcomData: DashboardData = {
  metrics: {
    todayRevenue: '฿128,500',
    pendingOrders: 4,
    newMembers: 12,
    lowStockAlerts: 3,
  },
  lowStockProducts: [
    { id: 101, name: 'Château Margaux 2018', stock: 1, price: 32500 },
    { id: 102, name: 'Dom Pérignon Champagne 2013', stock: 2, price: 12500 },
    { id: 103, name: 'Opus One Napa Valley 2019', stock: 3, price: 18900 },
  ],
  salesData: [
    { date: '01 ส.ค.', amount: 45000 },
    { date: '02 ส.ค.', amount: 62000 },
    { date: '03 ส.ค.', amount: 89000 },
    { date: '04 ส.ค.', amount: 75000 },
    { date: '05 ส.ค.', amount: 110000 },
    { date: '06 ส.ค.', amount: 145000 },
    { date: '07 ส.ค.', amount: 128500 },
  ],
  recentOrders: [
    { id: 1008, customer: 'คุณสมศักดิ์ ชัยชนะ', total: '฿32,500', status: 'payment_pending', date: 'วันนี้ 14:20', paymentMethod: 'PromptPay', type: 'E-Commerce' },
    { id: 1007, customer: 'คุณพิมพ์ใจ รัตนดี', total: '฿18,900', status: 'confirmed', date: 'วันนี้ 12:45', paymentMethod: 'Credit Card', type: 'E-Commerce' },
    { id: 1006, customer: 'คุณเอกชัย สุขเสริฐ', total: '฿12,500', status: 'shipped', date: 'วันนี้ 10:15', paymentMethod: 'PromptPay', type: 'E-Commerce' },
    { id: 1005, customer: 'คุณวิภาดา อดุลย์', total: '฿21,500', status: 'delivered', date: 'เมื่อวาน', paymentMethod: 'Credit Card', type: 'E-Commerce' },
  ],
};

export default function ProjectbottleClub1AdminPage() {
  const [data, setData] = useState<DashboardData>(mockEcomData);
  const [loading, setLoading] = useState(false);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5 select-none">
      {/* Welcome Banner */}
      <motion.div variants={fadeUp}>
        <div
          className="relative overflow-hidden rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          style={{
            background: 'rgba(19, 25, 41, 0.95)',
            border: '1px solid rgba(196,30,58,0.3)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(to right, transparent, #c41e3a 40%, #f59e0b 60%, transparent)' }} />

          <div className="flex items-center gap-4 z-10">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(196,30,58,0.15)', border: '1px solid rgba(196,30,58,0.3)' }}
            >
              <Wine className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">ProjectbottleClub1 E-Commerce Console</h2>
              <p className="text-xs text-slate-400 mt-0.5">ระบบจัดการร้านค้าออนไลน์สั่งซื้อไวน์พรีเมียม สลิปโอนเงิน และสมาชิก</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap z-10">
            {quickActions.map((qa) => {
              const Icon = qa.icon;
              return (
                <Link
                  key={qa.href}
                  href={qa.href}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
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
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
          <div className="rounded-2xl p-5 h-full flex flex-col bg-slate-900/90 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">สต็อกไวน์ใกล้หมดคลัง</h3>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800">
                {data.lowStockProducts.length} รายการ
              </span>
            </div>

            <div className="flex-1 space-y-3">
              {data.lowStockProducts.map((prod) => (
                <div key={prod.id} className="py-2.5 flex items-center justify-between gap-3 border-b border-slate-800/60">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Wine className="w-4 h-4 text-red-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-200 truncate">{prod.name}</p>
                      <p className="text-[10px] text-slate-400">฿{prod.price.toLocaleString('th-TH')}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-400 px-2 py-0.5 rounded-md bg-amber-950/60 border border-amber-800/40">
                    เหลือ {prod.stock} ขวด
                  </span>
                </div>
              ))}
            </div>

            <Link href="/admin/products" className="mt-4 w-full py-2.5 bg-red-800 hover:bg-red-700 text-white font-bold text-xs rounded-xl text-center block">
              จัดการคาตาล็อกไวน์ →
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Recent Orders */}
      <motion.div variants={fadeUp}>
        <div className="rounded-2xl p-5 bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">คำสั่งซื้อร้านค้าออนไลน์ล่าสุด</h3>
            <Link href="/admin/orders" className="text-xs text-red-400 hover:text-red-300 font-bold">
              ดูทั้งหมด →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
                  <th className="pb-3">#ออเดอร์</th>
                  <th className="pb-3">ลูกค้า</th>
                  <th className="pb-3">ยอดชำระ</th>
                  <th className="pb-3">ช่องทาง</th>
                  <th className="pb-3">สถานะ</th>
                  <th className="pb-3">วันที่</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {data.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-800/40">
                    <td className="py-3 font-mono font-bold text-slate-400">#{order.id}</td>
                    <td className="py-3 font-bold text-slate-200">{order.customer}</td>
                    <td className="py-3 font-bold text-red-400">{order.total}</td>
                    <td className="py-3 text-slate-400">{order.paymentMethod}</td>
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
