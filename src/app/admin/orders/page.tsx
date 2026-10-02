'use client';

import React, { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/admin/DataTable';
import OrderStatusBadge from '@/components/admin/OrderStatusBadge';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { Search, RotateCcw, AlertCircle, Eye, FileText, ShoppingCart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ordersApi } from '@/lib/api/orders';
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
  
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      const token = accessToken || await ensureApiAuth();
      if (!token) throw new Error('ไม่สามารถเชื่อมต่อ API คำสั่งซื้อได้');
      const result = await ordersApi.list(
        { page, per_page: 20, status: status || undefined, date_from: dateFrom || undefined, date_to: dateTo || undefined },
        token
      );
      const rawOrders = Array.isArray(result) ? result : (result?.orders || []);
      let mapped = rawOrders.map((o: any) => ({
        id: o.id,
        customer: o.customer_name ?? o.order_number ?? `Order #${o.id}`,
        total: Number(o.grand_total ?? o.total_amount ?? 0),
        status: o.status,
        paymentMethod: o.payment_method ?? 'โอนเงิน/QR',
        type: o.branch_id ? 'pos' : 'online',
        date: new Date(o.created_at).toLocaleDateString('th-TH'),
        taxInvoice: false,
      }));
      if (search) {
        const q = search.toLowerCase();
        mapped = mapped.filter((o) =>
          o.customer.toLowerCase().includes(q) || String(o.id).includes(q)
        );
      }
      setOrders(mapped);
      setTotal(result.total ?? mapped.length);
    } catch (err: any) {
      setError(err.message || 'ไม่สามารถดึงข้อมูลคำสั่งซื้อจาก API จริงได้');
      setOrders([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders();
  }, [status, paymentMethod, orderType, dateFrom, dateTo, page, accessToken]);

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

  const columns: Column<OrderRow>[] = [
    {
      header: 'หมายเลขออเดอร์',
      accessor: (row) => <span className="font-extrabold text-[#eef2ff]">#{row.id}</span>,
      sortable: true,
      sortKey: 'id',
    },
    {
      header: 'ลูกค้า',
      accessor: (row) => <span className="text-[#94a3c4] truncate max-w-[200px] block font-semibold">{row.customer}</span>,
    },
    {
      header: 'ยอดรวมสุทธิ',
      accessor: (row) => <span className="font-extrabold text-[#22e5ff]">฿{row.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>,
    },
    {
      header: 'ประเภทการสั่ง',
      accessor: (row) => (
        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
          row.type === 'pos' ? 'badge-pending' : 'badge-confirmed'
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
      header: 'สถานะ',
      accessor: (row) => <OrderStatusBadge status={row.status} />,
    },
    {
      header: 'วันที่',
      accessor: (row) => <span className="text-[#5a6e90] font-medium text-xs">{row.date}</span>,
    },
    {
      header: 'จัดการ',
      accessor: (row) => (
        <button
          onClick={() => router.push(`/admin/orders/${row.id}`)}
          className="admin-btn-secondary text-[10px] px-3 py-1.5 flex items-center gap-1.5 font-bold cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" /> ดูรายละเอียด
        </button>
      ),
    },
  ];

  return (
    <div className="animate-in" style={{ padding: '20px', maxWidth: '1500px' }}>
      <AdminPageHeader
        title="คำสั่งซื้อทั้งหมด"
        subtitle="รายการออเดอร์จาก API จริง"
        icon={ShoppingCart}
      />

      {error && (
        <div className="admin-panel p-4 mb-4 flex items-center gap-3 text-[#fb7185] text-sm font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      <div className="admin-panel p-4 mb-6">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-[10px] font-bold text-[#5a6e90] uppercase tracking-wider mb-1 block">ค้นหา</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a6e90]" />
              <input
                className="admin-input pl-9 text-xs w-full py-2.5"
                placeholder="ค้นหารหัสออเดอร์ หรือ อีเมลลูกค้า..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-[#5a6e90] uppercase tracking-wider mb-1 block">สถานะ</label>
            <select className="admin-input text-xs py-2.5 px-3" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">ทั้งหมด</option>
              <option value="pending">รอชำระ</option>
              <option value="confirmed">ยืนยันแล้ว</option>
              <option value="preparing">กำลังเตรียม</option>
              <option value="ready">พร้อมส่ง</option>
              <option value="completed">เสร็จสิ้น</option>
              <option value="cancelled">ยกเลิก</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-[#5a6e90] uppercase tracking-wider mb-1 block">จากวันที่</label>
            <input type="date" className="admin-input text-xs py-2.5 px-3" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-[#5a6e90] uppercase tracking-wider mb-1 block">ถึงวันที่</label>
            <input type="date" className="admin-input text-xs py-2.5 px-3" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <button type="submit" className="admin-btn-primary text-xs px-4 py-2.5 font-bold cursor-pointer">ค้นหา</button>
          <button type="button" onClick={handleResetFilters} className="admin-btn-secondary text-xs px-4 py-2.5 font-bold flex items-center gap-1.5 cursor-pointer">
            <RotateCcw className="w-3.5 h-3.5" /> รีเซ็ต
          </button>
        </form>
      </div>

      <DataTable
        columns={columns}
        data={orders}
        loading={loading}
        emptyMessage="ไม่พบรายการออเดอร์"
        currentPage={page}
        totalItems={total}
        itemsPerPage={20}
        onPageChange={setPage}
      />
    </div>
  );
}
