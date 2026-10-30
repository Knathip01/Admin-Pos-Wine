'use client';

import React, { useEffect, useState, useMemo } from 'react';
import DataTable, { Column } from '@/components/admin/DataTable';
import OrderStatusBadge from '@/components/admin/OrderStatusBadge';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import {
  Search, RotateCcw, AlertCircle, Eye, FileText, ShoppingCart,
  Package, X, Loader2, ExternalLink, Printer, Wine, DollarSign, Calendar,
  Truck, CheckCircle, Ban, Send, MapPin, Copy, Check, Phone
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ordersApi } from '@/lib/api/orders';
import { customersApi } from '@/lib/api/customers';
import type { OrderResponse } from '@/lib/api/types';
import { useApiAuth, ensureApiAuth } from '@/lib/store/api-auth';

interface OrderRow {
  id: number;
  orderNumber: string;
  customer: string;
  total: number;
  status: string;
  fulfillmentStatus: string;
  trackingNumber: string | null;
  paymentMethod: string;
  type: string;
  date: string;
  taxInvoice: boolean;
  notes?: string | null;
  shippingAddress?: string | null;
  recipientName?: string | null;
  recipientPhone?: string | null;
}

// ── Realistic Mock Orders for Wine E-Commerce presentation ──
const MOCK_ORDERS: OrderRow[] = [
  {
    id: 108,
    orderNumber: 'WC2026102801',
    customer: 'คุณอนันต์ ภักดีสุวรรณ (VIP)',
    total: 15800,
    status: 'paid',
    fulfillmentStatus: 'shipped',
    trackingNumber: 'TH9901827412TH',
    paymentMethod: 'ชำระแล้ว (พร้อมเพย์)',
    type: 'ecommerce',
    date: '28/10/2026',
    taxInvoice: true,
    notes: 'ลูกค้า VIP จัดส่งพัสดุควบคุมอุณหภูมิ',
    recipientName: 'คุณอนันต์ ภักดีสุวรรณ',
    recipientPhone: '081-111-2222',
    shippingAddress: '99/8 อาคารสุขุมวิทคอมเพล็กซ์ ชั้น 24 ซ.สุขุมวิท 21 แขวงคลองเตยเหนือ เขตวัฒนา กทม. 10110',
  },
  {
    id: 107,
    orderNumber: 'WC2026102702',
    customer: 'คุณพรทิพย์ สุวรรณรัตน์',
    total: 6450,
    status: 'paid',
    fulfillmentStatus: 'processing',
    trackingNumber: null,
    paymentMethod: 'ชำระแล้ว (โอนธนาคาร)',
    type: 'ecommerce',
    date: '27/10/2026',
    taxInvoice: false,
    notes: 'กล่องของขวัญวันเกิด ผูกโบว์สีทอง',
    recipientName: 'คุณพรทิพย์ สุวรรณรัตน์',
    recipientPhone: '089-333-4444',
    shippingAddress: '45/12 หมู่บ้านลัดดารมย์ ถ.ราชพฤกษ์ ต.บางรักน้อย อ.เมือง จ.นนทบุรี 11000',
  },
  {
    id: 106,
    orderNumber: 'WC2026102603',
    customer: 'คุณธนากร เจริญทรัพย์',
    total: 2890,
    status: 'confirmed',
    fulfillmentStatus: 'unfulfilled',
    trackingNumber: null,
    paymentMethod: 'ชำระแล้ว (บัตรเครดิต)',
    type: 'ecommerce',
    date: '26/10/2026',
    taxInvoice: true,
    notes: 'ขอเปิดบิลในนามบริษัท เจริญทรัพย์ โฮลดิ้ง จำกัด',
    recipientName: 'คุณธนากร เจริญทรัพย์',
    recipientPhone: '086-777-8888',
    shippingAddress: '120/5 ถ.สาทรใต้ แขวงทุ่งมหาเมฆ เขตสาทร กทม. 10120',
  },
  {
    id: 105,
    orderNumber: 'WC2026102504',
    customer: 'คุณชลธิชา สดใส',
    total: 1950,
    status: 'preparing',
    fulfillmentStatus: 'processing',
    trackingNumber: null,
    paymentMethod: 'ชำระแล้ว (QR Code)',
    type: 'ecommerce',
    date: '25/10/2026',
    taxInvoice: false,
    notes: 'จัดส่งช่วงบ่ายเท่านั้น',
    recipientName: 'คุณชลธิชา สดใส',
    recipientPhone: '082-444-5555',
    shippingAddress: '88/15 คอนโดไอดีโอ โมบิ พระราม 9 ถ.พระราม 9 แขวงห้วยขวาง เขตห้วยขวาง กทม. 10310',
  },
  {
    id: 104,
    orderNumber: 'WC2026102405',
    customer: 'คุณกมลวรรณ รัตนวิจิตร',
    total: 4200,
    status: 'completed',
    fulfillmentStatus: 'delivered',
    trackingNumber: 'TH8821903421TH',
    paymentMethod: 'ชำระแล้ว (พร้อมเพย์)',
    type: 'ecommerce',
    date: '24/10/2026',
    taxInvoice: false,
    notes: 'ส่งมอบเรียบร้อย เซ็นรับโดยนิติบุคคล',
    recipientName: 'คุณกมลวรรณ รัตนวิจิตร',
    recipientPhone: '085-123-9876',
    shippingAddress: '32/1 ซอยอารีย์ 4 ฝั่งเหนือ ถ.พหลโยธิน แขวงสามเสนใน เขตพญาไท กทม. 10400',
  },
  {
    id: 103,
    orderNumber: 'WC2026102306',
    customer: 'คุณสมเกียรติ สว่างวงศ์',
    total: 1800,
    status: 'completed',
    fulfillmentStatus: 'delivered',
    trackingNumber: 'TH7721839210TH',
    paymentMethod: 'ชำระแล้ว (โอนธนาคาร)',
    type: 'ecommerce',
    date: '23/10/2026',
    taxInvoice: false,
    notes: 'ลูกค้ารับสินค้าเองที่เคาน์เตอร์ หรือจัดส่งด่วน Grab',
    recipientName: 'คุณสมเกียรติ สว่างวงศ์',
    recipientPhone: '083-654-3210',
    shippingAddress: '210/4 ถ.สีลม แขวงสุริยวงศ์ เขตบางรัก กทม. 10500',
  },
  {
    id: 102,
    orderNumber: 'WC2026102207',
    customer: 'คุณพิมพิศา เลิศพานิช',
    total: 3500,
    status: 'pending',
    fulfillmentStatus: 'unfulfilled',
    trackingNumber: null,
    paymentMethod: 'รอชำระเงิน',
    type: 'ecommerce',
    date: '22/10/2026',
    taxInvoice: false,
    notes: 'รอแนบสลิปการโอนเงิน',
    recipientName: 'คุณพิมพิศา เลิศพานิช',
    recipientPhone: '084-555-6789',
    shippingAddress: '15/22 ซ.เอกมัย 12 ถ.สุขุมวิท 63 แขวงคลองตันเหนือ เขตวัฒนา กทม. 10110',
  },
  {
    id: 101,
    orderNumber: 'WC2026102108',
    customer: 'คุณเอกราช วัฒนกุล',
    total: 990,
    status: 'cancelled',
    fulfillmentStatus: 'cancelled',
    trackingNumber: null,
    paymentMethod: 'ยกเลิก',
    type: 'ecommerce',
    date: '21/10/2026',
    taxInvoice: false,
    notes: 'ลูกค้ายกเลิกคำสั่งซื้อ สต็อกคืนเข้าระบบเรียบร้อย',
    recipientName: 'คุณเอกราช วัฒนกุล',
    recipientPhone: '081-987-6543',
    shippingAddress: '78/9 ถ.งามวงศ์วาน ต.บางเขน อ.เมือง จ.นนทบุรี 11000',
  },
];

const MOCK_ORDER_ITEMS: Record<number, any[]> = {
  108: [
    { id: 1, product_id: 5, product_name: 'Sassicaia Tenuta San Guido 2019 (Bolgheri, Italy)', unit_price: 15800, quantity: 1, line_total: 15800 },
  ],
  107: [
    { id: 2, product_id: 3, product_name: 'Dom Pérignon Vintage Champagne 2013', unit_price: 4000, quantity: 1, line_total: 4000 },
    { id: 3, product_id: 6, product_name: 'Cloudy Bay Sauvignon Blanc 2022 New Zealand', unit_price: 2450, quantity: 1, line_total: 2450 },
  ],
  106: [
    { id: 4, product_id: 1, product_name: 'Château Margaux Premier Grand Cru Classé 2018', unit_price: 2890, quantity: 1, line_total: 2890 },
  ],
  105: [
    { id: 5, product_id: 2, product_name: 'ไวน์เวนโรเซ่ (Wen Rose Wine)', unit_price: 1000, quantity: 1, line_total: 1000 },
    { id: 6, product_id: 4, product_name: 'ของทานเล่น ไก่ทอดเสิร์ฟคู่ไวน์', unit_price: 950, quantity: 1, line_total: 950 },
  ],
  104: [
    { id: 7, product_id: 7, product_name: 'The Macallan 18 Years Sherry Oak Single Malt Whisky', unit_price: 4200, quantity: 1, line_total: 4200 },
  ],
  103: [
    { id: 8, product_id: 8, product_name: 'ไวน์การ์เด้นโกลด์พรีเมียม (Garden Gold)', unit_price: 1800, quantity: 1, line_total: 1800 },
  ],
  102: [
    { id: 9, product_id: 9, product_name: 'ไวน์ขาวข้าวพัด (Kawpat Special White)', unit_price: 1750, quantity: 2, line_total: 3500 },
  ],
  101: [
    { id: 10, product_id: 10, product_name: 'ไวน์คิวแดงพรีเมียม (Kew Red Wine)', unit_price: 990, quantity: 1, line_total: 990 },
  ],
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const { accessToken } = useApiAuth();

  // State
  const [orders, setOrders] = useState<OrderRow[]>(MOCK_ORDERS);
  const [total, setTotal] = useState(MOCK_ORDERS.length);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [status, setStatus] = useState('');
  const [orderSource, setOrderSource] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Quick Bill Items Modal State
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [billOrder, setBillOrder] = useState<OrderResponse | null>(null);
  const [billLoading, setBillLoading] = useState(false);
  const [billError, setBillError] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Tracking Modal State
  const [trackingModalOrder, setTrackingModalOrder] = useState<OrderRow | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [fulfillmentStatus, setFulfillmentStatus] = useState('shipped');
  const [updatingTracking, setUpdatingTracking] = useState(false);

  // Cancel Modal State
  const [cancelModalOrder, setCancelModalOrder] = useState<OrderRow | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancellingOrder, setCancellingOrder] = useState(false);

  async function fetchOrders(force = false) {
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
      if (token) {
        const result = await ordersApi.list(
          { page, per_page: 20, status: status || undefined, date_from: dateFrom || undefined, date_to: dateTo || undefined },
          token
        );
        const rawOrders = Array.isArray(result) ? result : (result?.orders || []);

        if (rawOrders && rawOrders.length > 0) {
          // If live API has real orders, map them
          setOrders(rawOrders.map((o: any) => ({
            id: o.id,
            orderNumber: o.order_number || `#${o.id}`,
            customer: o.customer_name || `Order #${o.id}`,
            total: Number(o.grand_total ?? o.total_amount ?? 0),
            status: o.status,
            fulfillmentStatus: o.fulfillment_status || 'unfulfilled',
            trackingNumber: o.tracking_number || null,
            paymentMethod: Number(o.amount_paid ?? 0) > 0 ? 'ชำระแล้ว' : 'รอชำระเงิน',
            type: o.order_source || 'ecommerce',
            date: o.created_at ? new Date(o.created_at).toLocaleDateString('th-TH') : '-',
            taxInvoice: false,
            notes: o.notes || null,
            shippingAddress: o.notes || null,
            recipientName: o.customer_name || null,
            recipientPhone: null,
          })));
          setTotal(result.total ?? rawOrders.length);
          return;
        }
      }
    } catch (err: any) {
      console.warn('Orders API unreachable or empty, falling back to mock orders:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }

    // Default to filtered mock orders
    let filtered = [...MOCK_ORDERS];
    if (status) {
      filtered = filtered.filter(o => o.status.toLowerCase() === status.toLowerCase());
    }
    if (orderSource) {
      filtered = filtered.filter(o => o.type.toLowerCase() === orderSource.toLowerCase());
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(o =>
        String(o.id).includes(q) ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.customer.toLowerCase().includes(q) ||
        (o.trackingNumber && o.trackingNumber.toLowerCase().includes(q)) ||
        (o.recipientName && o.recipientName.toLowerCase().includes(q)) ||
        (o.shippingAddress && o.shippingAddress.toLowerCase().includes(q)) ||
        (o.recipientPhone && o.recipientPhone.includes(q))
      );
    }

    setOrders(filtered);
    setTotal(filtered.length);
  }

  useEffect(() => {
    fetchOrders();
  }, [status, orderSource, dateFrom, dateTo, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const handleResetFilters = () => {
    setStatus('');
    setOrderSource('');
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

    const orderRow = orders.find(o => o.id === orderId);

    try {
      const token = accessToken || await ensureApiAuth();
      if (token) {
        const data = await ordersApi.get(orderId, token);
        if (data && data.items && data.items.length > 0) {
          setBillOrder(data);
          return;
        }
      }
    } catch {}

    // Fallback mock items
    const items = MOCK_ORDER_ITEMS[orderId] || [
      {
        id: 1,
        product_id: 101,
        product_name: 'ไวน์แดงพรีเมียม The Bottle Club Exclusive',
        unit_price: orderRow ? orderRow.total : 1500,
        quantity: 1,
        line_total: orderRow ? orderRow.total : 1500,
      }
    ];

    const fallbackBill: any = {
      id: orderId,
      order_number: orderRow?.orderNumber || `WC${orderId}`,
      customer_name: orderRow?.customer || 'ลูกค้าไวน์ออนไลน์',
      created_at: new Date().toISOString(),
      status: orderRow?.status || 'paid',
      subtotal: orderRow?.total || 1500,
      discount_amount: 0,
      grand_total: orderRow?.total || 1500,
      total_amount: orderRow?.total || 1500,
      items,
    };

    setBillOrder(fallbackBill);
    setBillLoading(false);
  };

  // Tracking submit handler
  const handleUpdateTrackingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingModalOrder || !trackingNumber.trim()) return;
    setUpdatingTracking(true);

    try {
      const token = accessToken || await ensureApiAuth();
      if (token) {
        try {
          await ordersApi.updateTracking(
            trackingModalOrder.id,
            { tracking_number: trackingNumber.trim(), fulfillment_status: fulfillmentStatus },
            token
          );
        } catch {}
      }
    } finally {
      // Update local state immediately for instant feedback
      setOrders(prev => prev.map(o => o.id === trackingModalOrder.id ? {
        ...o,
        trackingNumber: trackingNumber.trim(),
        fulfillmentStatus,
      } : o));

      setUpdatingTracking(false);
      setTrackingModalOrder(null);
    }
  };

  // Cancel order submit handler
  const handleCancelOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModalOrder) return;
    setCancellingOrder(true);

    try {
      const token = accessToken || await ensureApiAuth();
      if (token) {
        try {
          await ordersApi.cancel(cancelModalOrder.id, cancelReason.trim() || undefined, token);
        } catch {}
      }
    } finally {
      // Update local state immediately
      setOrders(prev => prev.map(o => o.id === cancelModalOrder.id ? {
        ...o,
        status: 'cancelled',
        fulfillmentStatus: 'cancelled',
      } : o));

      setCancellingOrder(false);
      setCancelModalOrder(null);
    }
  };

  // Complete order handler
  const handleCompleteOrder = async (orderId: number) => {
    if (!confirm(`ยืนยันการเสร็จสิ้นคำสั่งซื้อ #${orderId}?`)) return;

    try {
      const token = accessToken || await ensureApiAuth();
      if (token) {
        try {
          await ordersApi.complete(orderId, token);
        } catch {}
      }
    } finally {
      setOrders(prev => prev.map(o => o.id === orderId ? {
        ...o,
        status: 'completed',
        fulfillmentStatus: 'delivered',
      } : o));
    }
  };

  // Define Columns for DataTable
  const columns: Column<OrderRow>[] = [
    {
      header: 'เลขออเดอร์',
      accessor: (row) => (
        <span className="font-extrabold text-[#22e5ff] font-mono text-sm">
          #{row.id}
          {row.orderNumber && row.orderNumber !== `#${row.id}` && (
            <span className="block text-[10px] text-[#5a6e90]">{row.orderNumber}</span>
          )}
        </span>
      ),
      sortable: true,
      sortKey: 'id',
    },
    {
      header: 'ลูกค้า',
      accessor: (row) => <span className="text-[#94a3c4] truncate max-w-[180px] block font-semibold">{row.customer}</span>,
    },
    {
      header: 'ที่อยู่จัดส่ง',
      accessor: (row) => {
        if (!row.shippingAddress && !row.recipientPhone) {
          return <span className="text-[#5a6e90] text-xs italic">- ไม่ระบุที่อยู่ -</span>;
        }
        return (
          <div className="max-w-[260px] text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[#eef2ff]">
              <MapPin className="w-3.5 h-3.5 text-[#22e5ff] shrink-0" />
              <span className="truncate">{row.recipientName || row.customer}</span>
              {row.recipientPhone && (
                <span className="text-[10px] text-[#fbbf24] font-mono shrink-0">({row.recipientPhone})</span>
              )}
            </div>
            <p className="text-[11px] text-[#94a3c4] line-clamp-2 leading-relaxed" title={row.shippingAddress || ''}>
              {row.shippingAddress}
            </p>
          </div>
        );
      },
    },
    {
      header: 'ยอดรวมสุทธิ',
      accessor: (row) => (
        <span className="font-extrabold text-[#22e5ff] text-sm font-mono">
          ฿{row.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'ช่องทาง',
      accessor: (row) => (
        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
          row.type === 'ecommerce'
            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
            : row.type === 'pos'
            ? 'badge-pending'
            : 'badge-confirmed'
        }`}>
          {row.type === 'ecommerce' ? 'Web Wine' : row.type}
        </span>
      ),
    },
    {
      header: 'สถานะออเดอร์',
      accessor: (row) => <OrderStatusBadge status={row.status} />,
    },
    {
      header: 'สถานะจัดส่ง (Fulfillment)',
      accessor: (row) => (
        <div className="space-y-1">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
            row.fulfillmentStatus === 'delivered'
              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
              : row.fulfillmentStatus === 'shipped'
              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
              : row.fulfillmentStatus === 'processing'
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
              : 'bg-white/5 text-[#94a3c4] border border-white/10'
          }`}>
            {row.fulfillmentStatus}
          </span>
          {row.trackingNumber && (
            <div className="text-[10px] font-mono text-[#22e5ff] flex items-center gap-1">
              <Truck className="w-3 h-3 shrink-0" />
              <span>{row.trackingNumber}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'วันที่สั่งซื้อ',
      accessor: (row) => <span className="text-[#5a6e90] text-xs font-semibold">{row.date}</span>,
    },
    {
      header: 'การจัดการ',
      accessor: (row) => {
        const canCancel = ['pending', 'confirmed', 'preparing'].includes(row.status.toLowerCase());
        const canComplete = ['pending', 'ready', 'paid', 'confirmed'].includes(row.status.toLowerCase());

        return (
          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => handleOpenBillModal(row.id)}
              className="admin-btn-primary text-xs px-2.5 py-1.5 flex items-center gap-1 cursor-pointer font-bold"
              title="ดูรายการสินค้าในบิลนี้"
            >
              <Package className="w-3.5 h-3.5" />
              <span>สินค้า</span>
            </button>

            <button
              onClick={() => {
                setTrackingModalOrder(row);
                setTrackingNumber(row.trackingNumber || '');
                setFulfillmentStatus(row.fulfillmentStatus || 'shipped');
              }}
              className="admin-btn-secondary text-xs px-2.5 py-1.5 flex items-center gap-1 cursor-pointer text-[#22e5ff]"
              title="อัปเดตเลขพัสดุและสถานะจัดส่ง"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>พัสดุ</span>
            </button>

            {canComplete && (
              <button
                onClick={() => handleCompleteOrder(row.id)}
                className="p-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 rounded-xl cursor-pointer transition"
                title="เสร็จสิ้นคำสั่งซื้อ (Complete)"
              >
                <CheckCircle className="w-3.5 h-3.5" />
              </button>
            )}

            {canCancel && (
              <button
                onClick={() => {
                  setCancelModalOrder(row);
                  setCancelReason('');
                }}
                className="p-1.5 bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500/25 rounded-xl cursor-pointer transition"
                title="ยกเลิกคำสั่งซื้อ & คืนสต็อก (Cancel)"
              >
                <Ban className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={() => router.push(`/admin/orders/${row.id}`)}
              className="admin-btn-secondary text-xs p-1.5 flex items-center gap-1 cursor-pointer"
              title="ดูหน้ารายละเอียดเต็มและพิมพ์บิล"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      },
      className: 'text-right'
    }
  ];

  return (
    <div className="space-y-5 sm:space-y-6 select-none font-sans animate-in" style={{ padding: '20px', maxWidth: 1500 }}>
      <AdminPageHeader
        title="คำสั่งซื้อออนไลน์ (The Bottle Club E-Com)"
        subtitle="ตรวจสอบ จัดการสถานะคำสั่งซื้อ อัปเดตเลขพัสดุ ติดตามการจัดส่ง ระบบข้อมูลจำลองพร้อมใช้งาน"
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
              placeholder="ค้นหารหัสออเดอร์, เลขแทร็กกิ้ง, หรือ ชื่อลูกค้า..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-input w-full pl-11 pr-4 py-2.5 text-xs"
            />
          </div>
          <button type="submit" className="admin-btn-primary px-6 py-2.5 text-xs font-bold cursor-pointer shrink-0">
            ค้นหา
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <div>
            <label className="admin-label">สถานะออเดอร์ (Order Status)</label>
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="admin-select text-xs">
              <option value="">ทั้งหมด</option>
              <option value="pending">รอดำเนินการ (Pending)</option>
              <option value="confirmed">ยืนยันแล้ว (Confirmed)</option>
              <option value="preparing">กำลังจัดเตรียม (Preparing)</option>
              <option value="ready">พร้อมส่ง (Ready)</option>
              <option value="paid">ชำระเงินแล้ว (Paid)</option>
              <option value="completed">สำเร็จแล้ว (Completed)</option>
              <option value="cancelled">ยกเลิกแล้ว (Cancelled)</option>
            </select>
          </div>

          <div>
            <label className="admin-label">ช่องทางการสั่ง (Order Source)</label>
            <select value={orderSource} onChange={(e) => { setOrderSource(e.target.value); setPage(1); }} className="admin-select text-xs">
              <option value="">ทุกช่องทาง</option>
              <option value="ecommerce">Web Wine Online (e-Com)</option>
              <option value="pos">หน้าร้าน POS</option>
              <option value="qr">QR Code สั่ง</option>
            </select>
          </div>

          <div>
            <label className="admin-label">ตั้งแต่วันที่</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="admin-input text-xs"
            />
          </div>

          <div>
            <label className="admin-label">ถึงวันที่</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="admin-input text-xs"
            />
          </div>
        </div>

        {(status || orderSource || dateFrom || dateTo || search) && (
          <div className="flex justify-end">
            <button
              onClick={handleResetFilters}
              className="text-xs text-[#5a6e90] hover:text-[#22e5ff] transition font-bold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> ล้างตัวกรองทั้งหมด
            </button>
          </div>
        )}
      </div>

      {/* Error alert */}
      {error && (
        <div className="admin-alert-error flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div className="text-xs">{error}</div>
        </div>
      )}

      {/* Table */}
      <DataTable
        columns={columns}
        data={orders}
        loading={loading}
        currentPage={page}
        itemsPerPage={20}
        totalItems={total}
        onPageChange={(p: number) => setPage(p)}
        onRowClick={(row) => handleOpenBillModal(row.id)}
      />

      {/* Quick Bill Items Modal */}
      {selectedOrderId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
          <div className="admin-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5 animate-in">
            <div className="flex items-center justify-between pb-4 border-b border-[rgba(255,255,255,0.08)]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-[#eef2ff]" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    รายการสินค้าในบิล #{selectedOrderId}
                  </h3>
                  {billOrder && <OrderStatusBadge status={billOrder.status} size="sm" />}
                </div>
                <p className="text-xs text-[#5a6e90]">
                  {billOrder ? `ลูกค้า: ${billOrder.customer_name || 'ลูกค้าทั่วไป'} • สร้างเมื่อ: ${new Date(billOrder.created_at).toLocaleString('th-TH')}` : 'กำลังโหลดข้อมูล...'}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrderId(null)}
                className="p-2 text-[#5a6e90] hover:text-white rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {billLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-cyan-400">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-xs text-[#94a3c4]">กำลังดึงรายการสินค้า...</span>
              </div>
            ) : billError ? (
              <div className="admin-alert-error my-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{billError}</span>
              </div>
            ) : billOrder ? (
              <div className="space-y-4">
                {/* Shipping Address Card */}
                {(() => {
                  const selectedOrderRow = orders.find(o => o.id === selectedOrderId);
                  if (!selectedOrderRow || (!selectedOrderRow.shippingAddress && !selectedOrderRow.recipientPhone)) return null;
                  return (
                    <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs uppercase tracking-wide">
                          <MapPin className="w-4 h-4 text-[#22e5ff]" />
                          <span>ข้อมูลที่อยู่จัดส่งสินค้า (Shipping Address)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const textToCopy = [
                              selectedOrderRow.recipientName ? `ชื่อผู้รับ: ${selectedOrderRow.recipientName}` : '',
                              selectedOrderRow.recipientPhone ? `เบอร์โทร: ${selectedOrderRow.recipientPhone}` : '',
                              selectedOrderRow.shippingAddress ? `ที่อยู่: ${selectedOrderRow.shippingAddress}` : '',
                            ].filter(Boolean).join('\n');
                            navigator.clipboard.writeText(textToCopy);
                            setCopiedAddress(true);
                            setTimeout(() => setCopiedAddress(false), 2000);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-[#22e5ff] text-[11px] font-bold border border-cyan-500/30 flex items-center gap-1.5 cursor-pointer transition"
                        >
                          {copiedAddress ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-300">คัดลอกแล้ว!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>คัดลอกที่อยู่จัดส่ง</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                        <div>
                          <span className="text-[#5a6e90] text-[10px] uppercase font-bold block">ผู้รับพัสดุ:</span>
                          <span className="font-bold text-[#eef2ff]">{selectedOrderRow.recipientName || selectedOrderRow.customer}</span>
                        </div>
                        <div>
                          <span className="text-[#5a6e90] text-[10px] uppercase font-bold block">เบอร์ติดต่อ:</span>
                          {selectedOrderRow.recipientPhone ? (
                            <a href={`tel:${selectedOrderRow.recipientPhone}`} className="font-mono font-bold text-[#fbbf24] hover:underline flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {selectedOrderRow.recipientPhone}
                            </a>
                          ) : (
                            <span className="text-[#5a6e90]">-</span>
                          )}
                        </div>
                      </div>

                      <div className="pt-1 border-t border-white/5 text-xs">
                        <span className="text-[#5a6e90] text-[10px] uppercase font-bold block mb-1">สถานที่จัดส่ง:</span>
                        <p className="text-[#eef2ff] font-medium leading-relaxed bg-black/30 p-2.5 rounded-xl border border-white/5">
                          {selectedOrderRow.shippingAddress || '- ไม่ระบุรายละเอียดที่อยู่ -'}
                        </p>
                      </div>
                    </div>
                  );
                })()}

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
                      ฿{Number(billOrder.grand_total ?? billOrder.total_amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

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

      {/* Tracking Modal */}
      {trackingModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
          <form onSubmit={handleUpdateTrackingSubmit} className="admin-panel w-full max-w-md p-6 space-y-4 animate-in">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-black text-[#eef2ff] flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#22e5ff]" /> อัปเดตข้อมูลการจัดส่ง #{trackingModalOrder.id}
              </h3>
              <button
                type="button"
                onClick={() => setTrackingModalOrder(null)}
                className="p-1 text-[#5a6e90] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Recipient & Address Box */}
            {trackingModalOrder && (trackingModalOrder.shippingAddress || trackingModalOrder.recipientPhone) && (
              <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/25 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-[11px]">
                  <MapPin className="w-3.5 h-3.5 text-[#22e5ff] shrink-0" />
                  <span>ข้อมูลที่อยู่จัดส่งพัสดุ:</span>
                </div>
                <div className="text-[#eef2ff] font-bold">
                  {trackingModalOrder.recipientName || trackingModalOrder.customer}
                  {trackingModalOrder.recipientPhone && (
                    <span className="text-[#fbbf24] ml-2 font-mono">({trackingModalOrder.recipientPhone})</span>
                  )}
                </div>
                <p className="text-[11px] text-[#94a3c4] leading-relaxed bg-black/25 p-2 rounded-lg border border-white/5">
                  {trackingModalOrder.shippingAddress || '- ไม่ระบุ -'}
                </p>
              </div>
            )}

            <div>
              <label className="admin-label">หมายเลขพัสดุ (Tracking Number)</label>
              <input
                type="text"
                required
                placeholder="เช่น TH123456789, KERRY9988..."
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="admin-input text-xs"
              />
            </div>

            <div>
              <label className="admin-label">สถานะการจัดส่ง (Fulfillment Status)</label>
              <select
                value={fulfillmentStatus}
                onChange={(e) => setFulfillmentStatus(e.target.value)}
                className="admin-select text-xs"
              >
                <option value="processing">กำลังจัดเตรียมพัสดุ (Processing)</option>
                <option value="shipped">จัดส่งแล้ว (Shipped)</option>
                <option value="delivered">ส่งมอบเรียบร้อย (Delivered)</option>
                <option value="picked_up">ลูกค้ารับสินค้าเอง (Picked Up)</option>
                <option value="cancelled">ยกเลิกการส่ง (Cancelled)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setTrackingModalOrder(null)}
                className="admin-btn-secondary px-4 py-2 text-xs"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={updatingTracking}
                className="admin-btn-primary px-5 py-2 text-xs font-bold flex items-center gap-1.5"
              >
                {updatingTracking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                บันทึกเลขพัสดุ
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Cancel Order Modal */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
          <form onSubmit={handleCancelOrderSubmit} className="admin-panel w-full max-w-md p-6 space-y-4 animate-in">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-black text-rose-400 flex items-center gap-2">
                <Ban className="w-5 h-5 text-rose-400" /> ยกเลิกคำสั่งซื้อ #{cancelModalOrder.id}
              </h3>
              <button
                type="button"
                onClick={() => setCancelModalOrder(null)}
                className="p-1 text-[#5a6e90] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#94a3c4]">
              เมื่อยกเลิก ระบบจะคืนสต็อกสินค้าอัตโนมัติ (Stock Restored) และเปลี่ยนสถานะคำสั่งซื้อเป็น Cancelled
            </p>

            <div>
              <label className="admin-label">เหตุผลในการยกเลิก (ระบุหรือไม่ก็ได้)</label>
              <textarea
                placeholder="เช่น ลูกค้าขอยกเลิก / สินค้าหมดชั่วคราว..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="admin-input text-xs h-20 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setCancelModalOrder(null)}
                className="admin-btn-secondary px-4 py-2 text-xs"
              >
                ย้อนกลับ
              </button>
              <button
                type="submit"
                disabled={cancellingOrder}
                className="admin-btn-danger px-5 py-2 text-xs font-bold flex items-center gap-1.5"
              >
                {cancellingOrder ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                ยืนยันการยกเลิก & คืนสต็อก
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
