'use client';

import React, { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/admin/DataTable';
import OrderStatusBadge from '@/components/admin/OrderStatusBadge';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { Search, RotateCcw, AlertCircle, Eye, FileText, ShoppingCart } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
  
  // State
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [status, setStatus] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [orderType, setOrderType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  async function fetchOrders() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        status,
        payment_method: paymentMethod,
        order_type: orderType,
        date_from: dateFrom,
        date_to: dateTo,
        search,
        page: page.toString(),
        limit: '20'
      });
      
      const res = await fetch(`/api/admin/orders?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('ไม่สามารถโหลดรายการออเดอร์ได้');
      }
      const json = await res.json();
      setOrders(json.orders);
      setTotal(json.total);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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

  // Define Columns for DataTable
  const columns: Column<OrderRow>[] = [
    {
      header: 'หมายเลขออเดอร์',
      accessor: (row) => <span className="font-bold text-stone-800">#{row.id}</span>,
      sortable: true,
      sortKey: 'id',
    },
    {
      header: 'ลูกค้า',
      accessor: (row) => <span className="text-stone-600 truncate max-w-[200px] block">{row.customer}</span>,
    },
    {
      header: 'ยอดรวมสุทธิ',
      accessor: (row) => <span className="font-bold text-stone-800">฿{row.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>,
    },
    {
      header: 'ประเภทการสั่ง',
      accessor: (row) => (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
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
      accessor: (row) => <span className="uppercase text-stone-500 font-semibold text-xs">{row.paymentMethod}</span>,
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
      ) : <span className="text-stone-400 text-xs">-</span>,
    },
    {
      header: 'วันที่สั่งซื้อ',
      accessor: 'date',
    },
    {
      header: 'การจัดการ',
      accessor: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/admin/orders/${row.id}`);
          }}
          className="admin-action-btn"
        >
          <Eye className="w-3.5 h-3.5" /> รายละเอียด
        </button>
      ),
      className: 'text-right'
    }
  ];

  return (
    <div className="space-y-5 sm:space-y-6 select-none font-sans">
      <AdminPageHeader
        title="รายการสั่งซื้อสินค้าทั้งหมด"
        subtitle="ค้นหา กรอง และตรวจสอบสลิปการชำระเงินของลูกค้า"
        icon={ShoppingCart}
      />

      <div className="admin-panel space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="ค้นหารหัสออเดอร์ หรือ อีเมลลูกค้า..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-input w-full pl-11 pr-4 py-3 rounded-xl text-xs"
            />
          </div>
          <button type="submit" className="admin-btn-primary px-6 py-3 rounded-xl text-xs font-bold cursor-pointer shrink-0">
            ค้นหา
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
          <div>
            <label className="admin-label">สถานะออเดอร์</label>
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="admin-select">
              <option value="">ทั้งหมด</option>
              <option value="pending">รอดำเนินการ</option>
              <option value="confirmed">ยืนยันแล้ว</option>
              <option value="shipped">จัดส่งแล้ว</option>
              <option value="delivered">ส่งถึงแล้ว</option>
              <option value="payment_rejected">ชำระเงินไม่ผ่าน</option>
            </select>
          </div>

          <div>
            <label className="admin-label">ช่องทางการจ่ายเงิน</label>
            <select value={paymentMethod} onChange={(e) => { setPaymentMethod(e.target.value); setPage(1); }} className="admin-select">
              <option value="">ทั้งหมด</option>
              <option value="cash">เงินสด (Cash)</option>
              <option value="transfer">โอนเงินธนาคาร (Bank Transfer)</option>
              <option value="promptpay">พร้อมเพย์ (PromptPay)</option>
              <option value="stripe">บัตรเครดิต (Stripe)</option>
            </select>
          </div>

          <div>
            <label className="admin-label">ประเภทช่องทางขาย</label>
            <select value={orderType} onChange={(e) => { setOrderType(e.target.value); setPage(1); }} className="admin-select">
              <option value="">ทั้งหมด</option>
              <option value="online">Online Store</option>
              <option value="pos">POS Terminal (หน้าร้าน)</option>
            </select>
          </div>

          <div>
            <label className="admin-label">จากวันที่</label>
            <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="admin-input admin-select" />
          </div>

          <div>
            <label className="admin-label">ถึงวันที่</label>
            <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="admin-input admin-select" />
          </div>
        </div>

        {(status || paymentMethod || orderType || dateFrom || dateTo || search) && (
          <div className="flex justify-end pt-1">
            <button onClick={handleResetFilters} className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-red-700 font-bold transition cursor-pointer">
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
        onRowClick={(row) => router.push(`/admin/orders/${row.id}`)}
        emptyMessage="ไม่พบคำสั่งซื้อที่ค้นหาหรือตรงตามเงื่อนไขที่กำหนด"
      />
    </div>
  );
}
