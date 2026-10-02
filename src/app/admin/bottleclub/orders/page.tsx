'use client';

import React, { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/admin/DataTable';
import OrderStatusBadge from '@/components/admin/OrderStatusBadge';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import {
  Search, RotateCcw, AlertCircle, Eye, FileText, ShoppingCart,
  Package, X, Loader2, ExternalLink, Printer, Wine, DollarSign, Calendar
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ordersApi } from '@/lib/api/orders';
import type { OrderResponse } from '@/lib/api/types';
import { useApiAuth, ensureApiAuth } from '@/lib/store/api-auth';

interface OrderRow {
  id: number;
  customer: string;
  total: number;
  status: string;
  paymentMethod: string;
  type: string;
  date: string;
  taxInvoice: boolean;
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const { accessToken } = useApiAuth();

  // State
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [status, setStatus] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [orderType, setOrderType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Quick Bill Items Modal State
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [billOrder, setBillOrder] = useState<OrderResponse | null>(null);
  const [billLoading, setBillLoading] = useState(false);
  const [billError, setBillError] = useState<string | null>(null);

  async function fetchOrders(force = false) {
    if (orders.length === 0) setLoading(true);
    if (force) {
      setRefreshing(true);
      try {
        const { clearApiCache } = await import('@/lib/api/client');
        clearApiCache('orders');
      } catch {}
    }
    setError(null);
    try {
      const token = accessToken || await ensureApiAuth();
      if (!token) throw new Error('ไม่สามารถเชื่อมต่อ API คำสั่งซื้อได้');
      const result = await ordersApi.list(
        { page, status: status || undefined, date_from: dateFrom || undefined, date_to: dateTo || undefined },
        token
      );
      const rawOrders = Array.isArray(result) ? result : (result?.orders || []);
      setOrders(rawOrders.map((o: any) => ({
        id: o.id,
        customer: o.customer_name ?? o.order_number ?? `Order #${o.id}`,
        total: Number(o.grand_total ?? o.total_amount ?? 0),
        status: o.status,
        paymentMethod: 'โอนเงิน/QR',
        type: 'online',
        date: new Date(o.created_at).toLocaleDateString('th-TH'),
        taxInvoice: false,
      })));
      setTotal(result.total ?? rawOrders.length);
    } catch (err: any) {
      setError(err.message || 'ไม่สามารถดึงข้อมูลคำสั่งซื้อจาก API จริงได้');
      if (orders.length === 0) {
        setOrders([]);
        setTotal(0);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchOrders();
  }, [status, paymentMethod, orderType, dateFrom, dateTo, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const handleResetFilters = () => {
    setStatus('');
    setPaymentMethod('');
    setOrderType('');
    setDateFrom('');
    setDateTo('');
    setSearch('');
    setPage(1);
  };

  // Open Quick Bill Items Modal
  const handleOpenBillModal = async (orderId: number) => {
    setSelectedOrderId(orderId);
    setBillOrder(null);
    setBillLoading(true);
    setBillError(null);

    try {
      const token = accessToken || await ensureApiAuth();
      if (!token) throw new Error('ไม่พบสิทธิ์การเข้าถึง API');
      const data = await ordersApi.get(orderId, token);
      setBillOrder(data);
    } catch (err: any) {
      setBillError(err.message || 'ไม่สามารถดึงข้อมูลรายการสินค้าในบิลได้');
    } finally {
      setBillLoading(false);
    }
  };

  // Define Columns for DataTable
  const columns: Column<OrderRow>[] = [
    {
      header: 'หมายเลขออเดอร์',
      accessor: (row) => <span className="font-extrabold text-[#22e5ff] font-mono text-sm">#{row.id}</span>,
      sortable: true,
      sortKey: 'id',
    },
    {
      header: 'ลูกค้า',
      accessor: (row) => <span className="text-[#94a3c4] truncate max-w-[200px] block font-semibold">{row.customer}</span>,
    },
    {
      header: 'ยอดรวมสุทธิ',
      accessor: (row) => (
        <span className="font-extrabold text-[#22e5ff] text-sm">
          ฿{row.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'ประเภทการสั่ง',
      accessor: (row) => (
        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
          row.type === 'pos'
            ? 'badge-pending'
            : 'badge-confirmed'
        }`}>
          {row.type}
        </span>
      ),
    },
    {
      header: 'ชำระเงินโดย',
      accessor: (row) => <span className="uppercase text-[#5a6e90] font-bold text-xs">{row.paymentMethod}</span>,
    },
    {
      header: 'สถานะออเดอร์',
      accessor: (row) => <OrderStatusBadge status={row.status} />,
    },
    {
      header: 'ใบกำกับภาษี',
      accessor: (row) => row.taxInvoice ? (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold badge-rejected px-2 py-0.5 rounded">
          <FileText className="w-3 h-3" /> TAX
        </span>
      ) : <span className="text-[#3d4d6a] text-xs font-bold">-</span>,
    },
    {
      header: 'วันที่สั่งซื้อ',
      accessor: (row) => <span className="text-[#5a6e90] text-xs font-semibold">{row.date}</span>,
    },
    {
      header: 'การจัดการ',
      accessor: (row) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleOpenBillModal(row.id)}
            className="admin-btn-primary text-xs px-2.5 py-1.5 flex items-center gap-1 cursor-pointer font-bold"
            title="ดูรายการสินค้าในบิลนี้"
          >
            <Package className="w-3.5 h-3.5" />
            <span>ดูสินค้าในบิล</span>
          </button>
          <button
            onClick={() => router.push(`/admin/orders/${row.id}`)}
            className="admin-btn-secondary text-xs px-2.5 py-1.5 flex items-center gap-1 cursor-pointer"
            title="ดูหน้ารายละเอียดเต็มและพิมพ์บิล"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
      className: 'text-right'
    }
  ];

  return (
    <div className="space-y-5 sm:space-y-6 select-none font-sans animate-in" style={{ padding: '20px', maxWidth: 1500 }}>
      <AdminPageHeader
        title="รายการสั่งซื้อสินค้าทั้งหมด (Bottle Club Orders)"
        subtitle="ค้นหา กรอง และตรวจสอบสินค้าในบิลออเดอร์จากลูกค้าออนไลน์ เชื่อมต่อ FastAPI Production"
        icon={ShoppingCart}
        action={
          <button
            onClick={() => fetchOrders(true)}
            disabled={refreshing}
            className="p-2.5 px-3.5 rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50 flex items-center gap-2 text-xs font-semibold"
            style={{ color: '#22e5ff', background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)' }}
            title="รีเฟรชข้อมูลคำสั่งซื้อ"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>รีเฟรชข้อมูล</span>
          </button>
        }
      />

      <div className="admin-panel space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#3d4d6a]">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="ค้นหารหัสออเดอร์ หรือ ชื่อลูกค้า..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-input w-full pl-11 pr-4 py-2.5 text-xs"
            />
          </div>
          <button type="submit" className="admin-btn-primary px-6 py-2.5 text-xs font-bold cursor-pointer shrink-0">
            ค้นหา
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
          <div>
            <label className="admin-label">สถานะออเดอร์</label>
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="admin-select text-xs">
              <option value="">ทั้งหมด</option>
              <option value="pending">รอดำเนินการ (Pending)</option>
              <option value="confirmed">ยืนยันแล้ว (Confirmed)</option>
              <option value="completed">สำเร็จแล้ว (Completed)</option>
              <option value="cancelled">ยกเลิก (Cancelled)</option>
            </select>
          </div>

          <div>
            <label className="admin-label">ช่องทางการจ่ายเงิน</label>
            <select value={paymentMethod} onChange={(e) => { setPaymentMethod(e.target.value); setPage(1); }} className="admin-select text-xs">
              <option value="">ทั้งหมด</option>
              <option value="cash">เงินสด (Cash)</option>
              <option value="transfer">โอนเงินธนาคาร (Bank Transfer)</option>
              <option value="promptpay">พร้อมเพย์ (PromptPay)</option>
            </select>
          </div>

          <div>
            <label className="admin-label">ประเภทช่องทางขาย</label>
            <select value={orderType} onChange={(e) => { setOrderType(e.target.value); setPage(1); }} className="admin-select text-xs">
              <option value="">ทั้งหมด</option>
              <option value="online">Online Store</option>
              <option value="pos">POS Terminal (หน้าร้าน)</option>
            </select>
          </div>

          <div>
            <label className="admin-label">จากวันที่</label>
            <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="admin-input text-xs py-2" />
          </div>

          <div>
            <label className="admin-label">ถึงวันที่</label>
            <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="admin-input text-xs py-2" />
          </div>
        </div>

        {(status || paymentMethod || orderType || dateFrom || dateTo || search) && (
          <div className="flex justify-end pt-1">
            <button onClick={handleResetFilters} className="flex items-center gap-1.5 text-xs text-[#5a6e90] hover:text-[#fb7185] font-bold transition cursor-pointer">
              <RotateCcw className="w-3.5 h-3.5" /> ล้างตัวกรองทั้งหมด
            </button>
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="admin-alert-error flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={orders}
        loading={loading}
        totalItems={total}
        itemsPerPage={20}
        currentPage={page}
        onPageChange={setPage}
        onRowClick={(row) => handleOpenBillModal(row.id)}
        emptyMessage="ไม่พบคำสั่งซื้อที่ค้นหาหรือตรงตามเงื่อนไขที่กำหนด"
      />

      {/* ─── Modal ดูสินค้าในบิล (Bill Items Viewer) ─────────────── */}
      {selectedOrderId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in">
          <div className="admin-modal max-w-2xl w-full relative">
            <button
              onClick={() => setSelectedOrderId(null)}
              className="absolute top-4 right-4 text-[#5a6e90] hover:text-[#eef2ff] p-1.5 rounded-lg hover:bg-white/5 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-[#22e5ff]">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-[#eef2ff]">
                    รายการสินค้าในบิล #{selectedOrderId}
                  </h3>
                  {billOrder && <OrderStatusBadge status={billOrder.status} size="sm" />}
                </div>
                <p className="text-xs text-[#5a6e90]">
                  {billOrder ? `ลูกค้า: ${billOrder.customer_name || 'ลูกค้าทั่วไป'} • สร้างเมื่อ: ${new Date(billOrder.created_at).toLocaleString('th-TH')}` : 'กำลังโหลดข้อมูล...'}
                </p>
              </div>
            </div>

            {billLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-cyan-400">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-xs text-[#94a3c4]">กำลังดึงรายการสินค้าจาก FastAPI...</span>
              </div>
            ) : billError ? (
              <div className="admin-alert-error my-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{billError}</span>
              </div>
            ) : billOrder ? (
              <div className="space-y-4">
                {/* Items Table */}
                <div className="overflow-x-auto rounded-xl border border-[rgba(255,255,255,0.08)] bg-black/20">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[rgba(255,255,255,0.08)] text-[#5a6e90] uppercase font-bold text-[10px] tracking-wider">
                        <th className="py-2.5 px-3">ลำดับ</th>
                        <th className="py-2.5 px-3">รายการสินค้า</th>
                        <th className="py-2.5 px-3 text-right">ราคาต่อหน่วย</th>
                        <th className="py-2.5 px-3 text-center">จำนวน</th>
                        <th className="py-2.5 px-3 text-right">รวมเงิน</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
                      {(billOrder.items && billOrder.items.length > 0) ? (
                        billOrder.items.map((item, idx) => (
                          <tr key={item.id ?? idx} className="hover:bg-white/[0.02]">
                            <td className="py-2.5 px-3 font-mono text-[#5a6e90]">{idx + 1}</td>
                            <td className="py-2.5 px-3">
                              <div className="font-extrabold text-[#eef2ff]">
                                {item.product_name || `สินค้า #${item.product_id}`}
                              </div>
                              <div className="text-[10px] text-[#5a6e90] font-mono">
                                Product ID: #{item.product_id}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-[#94a3c4]">
                              ฿{Number(item.unit_price).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-[#eef2ff]">
                              {item.quantity}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-extrabold text-[#22e5ff]">
                              ฿{Number(item.line_total ?? (item.quantity * item.unit_price)).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-[#5a6e90]">
                            ไม่มีรายการสินค้าในบิลนี้
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Bill Summary */}
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1.5 text-xs">
                  <div className="flex justify-between text-[#94a3c4]">
                    <span>ยอดรวมสินค้า (Subtotal):</span>
                    <span className="font-mono">
                      ฿{Number(billOrder.subtotal ?? billOrder.total_amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {Number(billOrder.discount_amount || 0) > 0 && (
                    <div className="flex justify-between text-rose-400">
                      <span>ส่วนลด (Discount):</span>
                      <span className="font-mono">
                        -฿{Number(billOrder.discount_amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-[#eef2ff] font-extrabold text-sm pt-2 border-t border-white/10">
                    <span>ยอดชำระสุทธิ (Grand Total):</span>
                    <span className="font-mono text-[#22e5ff]">
                      ฿{Number(billOrder.total_amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-[rgba(255,255,255,0.08)]">
                  <button
                    onClick={() => setSelectedOrderId(null)}
                    className="admin-btn-secondary px-4 py-2 text-xs"
                  >
                    ปิด
                  </button>

                  <button
                    onClick={() => router.push(`/admin/orders/${selectedOrderId}`)}
                    className="admin-btn-primary px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>ดูหน้ารายละเอียดเต็ม & พิมพ์ใบเสร็จ</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
