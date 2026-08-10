'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  CreditCard, CheckCircle2, XCircle, Clock, AlertCircle,
  Eye, Search, RotateCcw, Loader2, ImageOff, X, ZoomIn,
  ZoomOut, RotateCw, Check, AlertTriangle, Filter,
  Receipt, ChevronDown, ChevronUp,
} from 'lucide-react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import OrderStatusBadge from '@/components/admin/OrderStatusBadge';

// ── Types ──────────────────────────────────────────────────────────────────────
interface PaymentOrder {
  id: number;
  customerName: string | null;
  customerEmail: string;
  total: number;
  subtotal: number;
  shippingFee: number;
  status: string;
  paymentMethod: string;
  paymentSlipUrl: string;
  adminNote: string;
  date: string;
  approvedAt: string | null;
  hasSlip: boolean;
}

// ── Payment Method Label ───────────────────────────────────────────────────────
const METHOD_LABEL: Record<string, string> = {
  transfer:    'โอนธนาคาร',
  promptpay:   'พร้อมเพย์',
  alipay:      'Alipay',
  wechat_pay:  'WeChat Pay',
  line_pay:    'LINE Pay',
  shopee_pay:  'ShopeePay',
  true_wallet: 'TrueMoney Wallet',
};

const METHOD_COLOR: Record<string, string> = {
  transfer:    'bg-blue-50 text-blue-700 border-blue-200',
  promptpay:   'bg-violet-50 text-violet-700 border-violet-200',
  alipay:      'bg-sky-50 text-sky-700 border-sky-200',
  wechat_pay:  'bg-green-50 text-green-700 border-green-200',
  line_pay:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  shopee_pay:  'bg-orange-50 text-orange-700 border-orange-200',
  true_wallet: 'bg-red-50 text-red-700 border-red-200',
};

// ── Slip Viewer Modal ──────────────────────────────────────────────────────────
function SlipModal({
  order,
  onClose,
  onApprove,
  onReject,
}: {
  order: PaymentOrder;
  onClose: () => void;
  onApprove: (id: number, note: string) => Promise<void>;
  onReject: (id: number, note: string) => Promise<void>;
}) {
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [note, setNote] = useState(order.adminNote || '');
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null);
  const [imgError, setImgError] = useState(false);

  const handleApprove = async () => {
    if (!confirm(`ยืนยันอนุมัติการชำระเงินออเดอร์ #${order.id}?`)) return;
    setLoading('approve');
    try { await onApprove(order.id, note); }
    finally { setLoading(null); }
  };

  const handleReject = async () => {
    if (!confirm(`ยืนยันปฏิเสธการชำระเงินออเดอร์ #${order.id}?`)) return;
    setLoading('reject');
    try { await onReject(order.id, note); }
    finally { setLoading(null); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col lg:flex-row select-none">
      {/* Left — Slip image */}
      <div className="flex-1 relative flex items-center justify-center p-6 bg-stone-950 border-b lg:border-b-0 lg:border-r border-white/5 min-h-[55vh] lg:min-h-screen">
        {/* Image controls */}
        <div className="absolute top-5 left-5 z-20 flex gap-2">
          {[
            { icon: ZoomIn,   title: 'ขยาย',   fn: () => setScale(s => Math.min(s + 0.25, 3)) },
            { icon: ZoomOut,  title: 'ย่อ',    fn: () => setScale(s => Math.max(s - 0.25, 0.5)) },
            { icon: RotateCw, title: 'หมุน',   fn: () => setRotate(r => (r + 90) % 360) },
          ].map(({ icon: Icon, title, fn }) => (
            <button key={title} onClick={fn} title={title}
              className="p-2.5 bg-stone-900/90 border border-white/10 text-stone-300 hover:text-white rounded-xl cursor-pointer transition">
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
        <button onClick={onClose}
          className="absolute top-5 right-5 z-20 p-2.5 bg-stone-900/90 border border-white/10 text-stone-300 hover:text-white rounded-xl cursor-pointer">
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-auto w-full h-full flex items-center justify-center">
          {order.hasSlip && !imgError ? (
            <div style={{ transform: `scale(${scale}) rotate(${rotate}deg)`, transition: 'transform 0.2s ease' }}>
              <img
                src={order.paymentSlipUrl}
                alt={`Slip #${order.id}`}
                onError={() => setImgError(true)}
                className="max-h-[45vh] lg:max-h-[80vh] object-contain rounded-xl shadow-2xl border border-white/10"
                draggable={false}
              />
            </div>
          ) : (
            <div className="text-center space-y-3">
              <ImageOff className="w-14 h-14 text-stone-700 mx-auto" />
              <p className="text-stone-500 font-bold text-sm">ยังไม่มีสลิปแนบมา</p>
              <p className="text-stone-600 text-xs">ลูกค้าอาจยังไม่ได้อัปโหลด หรือลิงก์สลิปไม่ถูกต้อง</p>
            </div>
          )}
        </div>
      </div>

      {/* Right — Actions panel */}
      <div className="w-full lg:w-[420px] shrink-0 bg-stone-900 flex flex-col h-[45vh] lg:h-screen overflow-y-auto">
        {/* Order summary header */}
        <div className="p-6 border-b border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold font-serif text-stone-100">ตรวจสอบการชำระเงิน</h3>
              <p className="text-xs text-stone-500 mt-0.5">ออเดอร์ #{order.id} · {order.date}</p>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>

          {/* Order info */}
          <div className="bg-stone-950/60 border border-white/5 rounded-xl p-4 space-y-2 text-xs">
            <div className="flex justify-between text-stone-400">
              <span>ลูกค้า</span>
              <span className="font-semibold text-stone-300 truncate max-w-[200px]">
                {order.customerName || order.customerEmail}
              </span>
            </div>
            <div className="flex justify-between text-stone-400">
              <span>วิธีชำระเงิน</span>
              <span className={`font-bold px-2 py-0.5 rounded-md border text-[10px] ${METHOD_COLOR[order.paymentMethod] || 'bg-stone-800 text-stone-300 border-stone-700'}`}>
                {METHOD_LABEL[order.paymentMethod] || order.paymentMethod}
              </span>
            </div>
            <div className="border-t border-white/5 pt-2 flex justify-between font-bold text-stone-200">
              <span>ยอดที่ต้องชำระ</span>
              <span className="text-lg">฿{order.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Admin note */}
        <div className="p-6 flex-1 space-y-3">
          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
            บันทึกจากแอดมิน (Admin Note)
          </label>
          <textarea
            placeholder="เช่น สลิปถูกต้อง / ยอดไม่ตรง / วันที่ไม่ถูก..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full h-28 p-3.5 bg-stone-950 border border-white/10 rounded-xl text-stone-200 text-xs focus:outline-none focus:border-red-800 transition resize-none placeholder:text-stone-700"
          />
        </div>

        {/* Action buttons */}
        <div className="p-6 pt-0 space-y-3">
          <button
            onClick={handleApprove}
            disabled={loading !== null}
            id={`btn-approve-${order.id}`}
            className="w-full py-4 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition shadow-lg"
          >
            {loading === 'approve' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4.5 h-4.5" />}
            อนุมัติ — ยืนยันรับชำระเงิน
          </button>
          <button
            onClick={handleReject}
            disabled={loading !== null}
            id={`btn-reject-${order.id}`}
            className="w-full py-4 bg-red-900 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition"
          >
            {loading === 'reject' ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4.5 h-4.5" />}
            ปฏิเสธ — แจ้งให้โอนใหม่
          </button>
          <button onClick={onClose}
            className="w-full py-3 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-bold cursor-pointer transition">
            ย้อนกลับ
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Order Card ─────────────────────────────────────────────────────────────────
function OrderCard({
  order,
  onViewSlip,
  onQuickApprove,
  onQuickReject,
}: {
  order: PaymentOrder;
  onViewSlip: (o: PaymentOrder) => void;
  onQuickApprove: (id: number) => void;
  onQuickReject: (id: number) => void;
}) {
  const needsReview = order.status === 'pending' && order.hasSlip;
  const isPending   = order.status === 'pending' && !order.hasSlip;
  const isRejected  = order.status === 'payment_rejected';
  const isConfirmed = order.status === 'confirmed';

  return (
    <div className={`admin-panel rounded-2xl transition-all ${needsReview ? 'ring-2 ring-amber-400/40 shadow-amber-500/5 shadow-lg' : ''}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left info */}
        <div className="flex items-center gap-4 min-w-0">
          {/* Slip indicator icon */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            needsReview ? 'bg-amber-50 border border-amber-200'
            : isPending  ? 'bg-stone-100 border border-stone-200'
            : isRejected ? 'bg-red-50 border border-red-200'
            : 'bg-emerald-50 border border-emerald-200'
          }`}>
            {needsReview ? <Receipt className="w-5 h-5 text-amber-600" /> :
             isPending   ? <Clock    className="w-5 h-5 text-stone-400" /> :
             isRejected  ? <XCircle  className="w-5 h-5 text-red-500"  /> :
             <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-stone-800 text-sm">#{order.id}</span>
              <OrderStatusBadge status={order.status} />
              {needsReview && (
                <span className="text-[10px] font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200 animate-pulse">
                  รอตรวจสอบ
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 mt-0.5 truncate">
              {order.customerName || order.customerEmail} · {order.date}
            </p>
            {order.adminNote && (
              <p className="text-[11px] text-stone-400 mt-1 italic">📝 {order.adminNote}</p>
            )}
          </div>
        </div>

        {/* Right: amount + method + actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 shrink-0">
          <div className="text-right">
            <p className="font-black text-stone-800 text-base">
              ฿{order.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${METHOD_COLOR[order.paymentMethod] || 'bg-stone-100 text-stone-600 border-stone-200'}`}>
              {METHOD_LABEL[order.paymentMethod] || order.paymentMethod}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* View slip */}
            <button
              onClick={() => onViewSlip(order)}
              id={`btn-view-slip-${order.id}`}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                order.hasSlip
                  ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600 shadow-sm'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-600 border-stone-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              {order.hasSlip ? 'ดูสลิป' : 'ดูรายละเอียด'}
            </button>

            {/* Quick approve — only when slip present + pending */}
            {needsReview && (
              <>
                <button
                  onClick={() => onQuickApprove(order.id)}
                  id={`btn-quick-approve-${order.id}`}
                  className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl cursor-pointer transition"
                  title="อนุมัติทันที"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onQuickReject(order.id)}
                  id={`btn-quick-reject-${order.id}`}
                  className="p-2 bg-red-700 hover:bg-red-800 text-white rounded-xl cursor-pointer transition"
                  title="ปฏิเสธทันที"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function AdminPaymentsPage() {
  const [orders, setOrders]   = useState<PaymentOrder[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('pending');
  const [methodFilter, setMethodFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modal
  const [selectedOrder, setSelectedOrder] = useState<PaymentOrder | null>(null);

  // Summary stats
  const safeOrders      = orders || [];
  const pendingWithSlip = safeOrders.filter(o => o.status === 'pending' && o.hasSlip).length;
  const pendingNoSlip   = safeOrders.filter(o => o.status === 'pending' && !o.hasSlip).length;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        method: methodFilter,
        page: page.toString(),
        limit: '20',
      });
      const res = await fetch(`/api/admin/payments?${params}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('โหลดข้อมูลไม่สำเร็จ');
      const json = await res.json();
      setOrders(json.orders || json.payments || []);
      setTotal(json.total || 0);
    } catch (err: any) {
      setError(err.message);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, methodFilter, page]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // ── Approve handler
  const handleApprove = async (orderId: number, note: string) => {
    const res = await fetch(`/api/admin/orders/${orderId}/approve-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note }),
    });
    if (!res.ok) throw new Error('อนุมัติไม่สำเร็จ');
    setSelectedOrder(null);
    await fetchOrders();
  };

  // ── Reject handler
  const handleReject = async (orderId: number, note: string) => {
    const res = await fetch(`/api/admin/orders/${orderId}/reject-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note }),
    });
    if (!res.ok) throw new Error('ปฏิเสธไม่สำเร็จ');
    setSelectedOrder(null);
    await fetchOrders();
  };

  // ── Quick actions (no note)
  const handleQuickApprove = async (id: number) => {
    if (!confirm(`อนุมัติออเดอร์ #${id} ทันทีโดยไม่มีโน้ต?`)) return;
    try { await handleApprove(id, ''); } catch { alert('เกิดข้อผิดพลาด'); }
  };

  const handleQuickReject = async (id: number) => {
    if (!confirm(`ปฏิเสธออเดอร์ #${id}?`)) return;
    try { await handleReject(id, 'ปฏิเสธโดยแอดมิน'); } catch { alert('เกิดข้อผิดพลาด'); }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-5 sm:space-y-6 select-none font-sans">
      <AdminPageHeader
        title="ตรวจสอบการชำระเงิน"
        subtitle="ดูและอนุมัติสลิปการโอนเงิน / PromptPay / วอลเล็ต"
        icon={CreditCard}
      />

      {/* ── KPI Summary Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'รอตรวจสอบ (มีสลิป)',
            value: loading ? '—' : pendingWithSlip,
            icon: Receipt,
            color: 'bg-amber-50 border-amber-200 text-amber-700',
            iconColor: 'text-amber-600 bg-amber-100',
            urgent: pendingWithSlip > 0,
          },
          {
            label: 'รอชำระเงิน (ไม่มีสลิป)',
            value: loading ? '—' : pendingNoSlip,
            icon: Clock,
            color: 'bg-stone-50 border-stone-200 text-stone-600',
            iconColor: 'text-stone-500 bg-stone-100',
            urgent: false,
          },
          {
            label: 'ทั้งหมดในหน้านี้',
            value: loading ? '—' : total,
            icon: Filter,
            color: 'bg-blue-50 border-blue-200 text-blue-700',
            iconColor: 'text-blue-600 bg-blue-100',
            urgent: false,
          },
          {
            label: 'ถูกปฏิเสธ',
            value: loading ? '—' : safeOrders.filter(o => o.status === 'payment_rejected').length,
            icon: XCircle,
            color: 'bg-red-50 border-red-200 text-red-700',
            iconColor: 'text-red-600 bg-red-100',
            urgent: false,
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`border rounded-2xl p-4 ${card.color} ${card.urgent ? 'ring-2 ring-amber-400/50' : ''}`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.iconColor}`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className="text-2xl font-black leading-none">{card.value}</p>
                  <p className="text-[11px] font-semibold mt-0.5 opacity-80">{card.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Filters ────────────────────────────────────────────────── */}
      <div className="admin-panel flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex-1 space-y-1">
          <label className="admin-label">สถานะ</label>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="admin-select"
          >
            <option value="pending">รอดำเนินการ (Pending)</option>
            <option value="payment_rejected">ถูกปฏิเสธ</option>
            <option value="confirmed">ยืนยันแล้ว</option>
            <option value="all">ทั้งหมด</option>
          </select>
        </div>
        <div className="flex-1 space-y-1">
          <label className="admin-label">วิธีชำระเงิน</label>
          <select
            value={methodFilter}
            onChange={(e) => { setMethodFilter(e.target.value); setPage(1); }}
            className="admin-select"
          >
            <option value="">ทั้งหมด</option>
            <option value="transfer">โอนธนาคาร</option>
            <option value="promptpay">พร้อมเพย์</option>
            <option value="alipay">Alipay</option>
            <option value="wechat_pay">WeChat Pay</option>
            <option value="line_pay">LINE Pay</option>
            <option value="shopee_pay">ShopeePay</option>
            <option value="true_wallet">TrueMoney Wallet</option>
          </select>
        </div>
        {(statusFilter !== 'pending' || methodFilter) && (
          <button
            onClick={() => { setStatusFilter('pending'); setMethodFilter(''); setPage(1); }}
            className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-red-700 font-bold transition cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" /> ล้างตัวกรอง
          </button>
        )}
      </div>

      {/* ── Error ──────────────────────────────────────────────────── */}
      {error && (
        <div className="admin-alert-error flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Order List ─────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="admin-panel animate-pulse h-20 rounded-2xl" />
          ))}
        </div>
      ) : safeOrders.length === 0 ? (
        <div className="admin-panel text-center py-16 space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
          <p className="font-bold text-stone-700">ไม่มีออเดอร์ที่รอตรวจสอบ</p>
          <p className="text-stone-400 text-sm">การชำระเงินทั้งหมดได้รับการดำเนินการแล้ว</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* "Needs review" group label */}
          {pendingWithSlip > 0 && statusFilter === 'pending' && (
            <div className="flex items-center gap-2 px-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs font-bold text-amber-700">
                {pendingWithSlip} รายการรอตรวจสอบสลิป — ควรดำเนินการก่อน
              </span>
            </div>
          )}

          {safeOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onViewSlip={setSelectedOrder}
              onQuickApprove={handleQuickApprove}
              onQuickReject={handleQuickReject}
            />
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 pt-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-stone-200 disabled:opacity-40 hover:bg-stone-50 cursor-pointer transition"
              >
                <ChevronDown className="w-4 h-4 rotate-90 inline-block" /> ก่อนหน้า
              </button>
              <span className="text-xs text-stone-500 font-semibold">
                หน้า {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-stone-200 disabled:opacity-40 hover:bg-stone-50 cursor-pointer transition"
              >
                ถัดไป <ChevronUp className="w-4 h-4 rotate-90 inline-block" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Slip Modal ─────────────────────────────────────────────── */}
      {selectedOrder && (
        <SlipModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
}
