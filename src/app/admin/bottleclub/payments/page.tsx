'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  CreditCard, CheckCircle2, XCircle, Clock, AlertCircle,
  Eye, Search, RotateCcw, Loader2, ImageOff, X, ZoomIn,
  ZoomOut, RotateCw, Check, AlertTriangle, Filter,
  Receipt, ChevronDown, ChevronUp, Sparkles, ShieldCheck, ShieldAlert, ExternalLink
} from 'lucide-react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import OrderStatusBadge from '@/components/admin/OrderStatusBadge';
import { useApiAuth, ensureApiAuth } from '@/lib/store/api-auth';
import { slipVerifyApi } from '@/lib/api/slip-verify';
import { paymentsApi } from '@/lib/api/payments';
import { ordersApi } from '@/lib/api/orders';
import type { SlipVerificationResult } from '@/lib/api/types';

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

// ── Payment Method Label ─────────────────────────────────────────────────────
const METHOD_LABEL: Record<string, string> = {
  transfer:    'โอนธนาคาร',
  promptpay:   'พร้อมเพย์',
  alipay:      'Alipay',
  wechat_pay:  'WeChat Pay',
  line_pay:    'LINE Pay',
  shopee_pay:  'ShopeePay',
  true_wallet: 'TrueMoney Wallet',
  credit_card: 'บัตรเครดิต',
};

const METHOD_COLOR: Record<string, string> = {
  transfer:    'bg-[rgba(34,229,255,0.12)] text-[#22e5ff] border-[rgba(34,229,255,0.30)]',
  promptpay:   'bg-[rgba(192,132,252,0.12)] text-[#c084fc] border-[rgba(192,132,252,0.30)]',
  alipay:      'bg-[rgba(45,212,191,0.12)] text-[#2dd4bf] border-[rgba(45,212,191,0.30)]',
  wechat_pay:  'bg-[rgba(52,211,153,0.12)] text-[#34d399] border-[rgba(52,211,153,0.30)]',
  line_pay:    'bg-[rgba(52,211,153,0.12)] text-[#34d399] border-[rgba(52,211,153,0.30)]',
  shopee_pay:  'bg-[rgba(251,146,60,0.12)] text-[#fb923c] border-[rgba(251,146,60,0.30)]',
  true_wallet: 'bg-[rgba(244,63,94,0.12)] text-[#fb7185] border-[rgba(244,63,94,0.30)]',
  credit_card: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
};

// ── Slip Viewer Modal ──────────────────────────────────────────────────────────
function SlipModal({
  order,
  onClose,
  onApprove,
  onReject,
  token,
}: {
  order: PaymentOrder;
  onClose: () => void;
  onApprove: (id: number, note: string) => Promise<void>;
  onReject: (id: number, note: string) => Promise<void>;
  token: string | null;
}) {
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [note, setNote] = useState(order.adminNote || '');
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null);
  const [imgError, setImgError] = useState(false);

  // OCR Verification state
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<SlipVerificationResult | null>(null);

  useEffect(() => {
    async function loadVerification() {
      if (!token || !order.hasSlip) return;
      setOcrLoading(true);
      try {
        const results = await slipVerifyApi.listByOrder(order.id, token);
        if (Array.isArray(results) && results.length > 0) {
          setOcrResult(results[0]);
        }
      } catch (e) {
        console.warn('Could not load slip verification detail', e);
      } finally {
        setOcrLoading(false);
      }
    }
    loadVerification();
  }, [order.id, token, order.hasSlip]);

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
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex flex-col lg:flex-row select-none">
      {/* Left — Slip image */}
      <div className="flex-1 relative flex items-center justify-center p-6 bg-[#05080f] border-b lg:border-b-0 lg:border-r border-white/5 min-h-[55vh] lg:min-h-screen">
        {/* Image controls */}
        <div className="absolute top-5 left-5 z-20 flex gap-2">
          {[
            { icon: ZoomIn,   title: 'ขยาย',   fn: () => setScale(s => Math.min(s + 0.25, 3)) },
            { icon: ZoomOut,  title: 'ย่อ',    fn: () => setScale(s => Math.max(s - 0.25, 0.5)) },
            { icon: RotateCw, title: 'หมุน',   fn: () => setRotate(r => (r + 90) % 360) },
          ].map(({ icon: Icon, title, fn }) => (
            <button key={title} onClick={fn} title={title}
              className="p-2.5 admin-btn-secondary rounded-xl cursor-pointer">
              <Icon className="w-4 h-4 text-[#22e5ff]" />
            </button>
          ))}
          {order.hasSlip && order.paymentSlipUrl && (
            <a
              href={order.paymentSlipUrl}
              target="_blank"
              rel="noreferrer"
              title="เปิดภาพขนาดเต็มในแท็บใหม่"
              className="p-2.5 admin-btn-secondary rounded-xl flex items-center gap-1.5 text-xs text-[#22e5ff] font-bold"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">ดูภาพเต็ม</span>
            </a>
          )}
        </div>
        <button onClick={onClose}
          className="absolute top-5 right-5 z-20 p-2.5 admin-btn-secondary text-[#3d4d6a] hover:text-white rounded-xl cursor-pointer">
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-auto w-full h-full flex items-center justify-center p-4">
          {order.hasSlip && order.paymentSlipUrl && !imgError ? (
            <div style={{ transform: `scale(${scale}) rotate(${rotate}deg)`, transition: 'transform 0.2s ease' }}>
              <img
                src={order.paymentSlipUrl}
                alt={`Slip #${order.id}`}
                onError={() => setImgError(true)}
                className="max-h-[50vh] lg:max-h-[82vh] max-w-full object-contain rounded-2xl shadow-2xl border border-white/10"
                draggable={false}
              />
            </div>
          ) : (
            <div className="text-center space-y-3">
              <ImageOff className="w-14 h-14 text-[#3d4d6a] mx-auto" />
              <p className="text-[#94a3c4] font-bold text-sm">ยังไม่มีสลิปแนบมา</p>
              <p className="text-[#3d4d6a] text-xs">ลูกค้าอาจยังไม่ได้อัปโหลด หรือกำลังรอการส่งรูปภาพจาก Backend API</p>
            </div>
          )}
        </div>
      </div>

      {/* Right — Actions & OCR panel */}
      <div className="w-full lg:w-[460px] shrink-0 bg-[#0a0e1a] flex flex-col h-[45vh] lg:h-screen overflow-y-auto border-l border-white/5">
        {/* Order summary header */}
        <div className="p-6 border-b border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-[#eef2ff]" style={{ fontFamily: "'Outfit', sans-serif" }}>ตรวจสอบการชำระเงิน</h3>
              <p className="text-xs text-[#5a6e90] mt-0.5 font-semibold">ออเดอร์ #{order.id} · {order.date}</p>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>

          {/* Order info */}
          <div className="bg-[rgba(255,255,255,0.02)] border border-white/5 rounded-2xl p-4 space-y-2 text-xs">
            <div className="flex justify-between text-[#94a3c4]">
              <span>ลูกค้า</span>
              <span className="font-bold text-[#eef2ff] truncate max-w-[200px]">
                {order.customerName || order.customerEmail}
              </span>
            </div>
            <div className="flex justify-between text-[#94a3c4] items-center">
              <span>วิธีชำระเงิน</span>
              <span className={`font-extrabold px-2.5 py-0.5 rounded-full border text-[10px] ${METHOD_COLOR[order.paymentMethod] || 'bg-white/5 text-[#94a3c4] border-white/10'}`}>
                {METHOD_LABEL[order.paymentMethod] || order.paymentMethod}
              </span>
            </div>
            <div className="border-t border-white/5 pt-2 flex justify-between font-bold text-[#eef2ff] items-center">
              <span className="text-[#94a3c4]">ยอดที่ต้องชำระ</span>
              <span className="text-xl font-black text-[#22e5ff]" style={{ fontFamily: "'Outfit', sans-serif" }}>฿{order.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* AI OCR & Fraud Check Result */}
          <div className="rounded-2xl p-3.5 border text-xs space-y-2 bg-[rgba(34,229,255,0.03)] border-[rgba(34,229,255,0.15)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-[#22e5ff]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Slip Verification</span>
              </div>
              {ocrLoading ? (
                <span className="text-[10px] text-[#5a6e90] flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> กำลังสแกน...
                </span>
              ) : ocrResult ? (
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                  ocrResult.is_valid !== false && !ocrResult.is_duplicate
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}>
                  {ocrResult.is_duplicate ? '⚠️ สลิปซ้ำ' : ocrResult.is_valid !== false ? '✓ สลิปถูกต้อง' : '✕ ไม่ถูกต้อง'}
                </span>
              ) : order.hasSlip ? (
                <span className="text-[10px] text-amber-400 font-semibold bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">รอตรวจเช็ค</span>
              ) : (
                <span className="text-[10px] text-[#5a6e90]">ไม่มีสลิป</span>
              )}
            </div>

            {ocrResult && (
              <div className="space-y-1.5 pt-1 text-[11px] border-t border-white/5">
                {ocrResult.amount_detected && (
                  <div className="flex justify-between">
                    <span className="text-[#5a6e90]">ยอดเงินที่ตรวจพบ:</span>
                    <span className="font-bold text-[#eef2ff]">฿{Number(ocrResult.amount_detected).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {ocrResult.reference_number && (
                  <div className="flex justify-between">
                    <span className="text-[#5a6e90]">เลขอ้างอิง:</span>
                    <span className="font-mono text-[#94a3c4]">{ocrResult.reference_number}</span>
                  </div>
                )}
                {ocrResult.transfer_date && (
                  <div className="flex justify-between">
                    <span className="text-[#5a6e90]">เวลาโอน:</span>
                    <span className="text-[#94a3c4]">{ocrResult.transfer_date}</span>
                  </div>
                )}
                {ocrResult.fraud_flags && ocrResult.fraud_flags.length > 0 && (
                  <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[10px]">
                    <p className="font-bold flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3 text-rose-400" /> ตรวจพบความผิดปกติ:
                    </p>
                    <ul className="list-disc pl-4 mt-0.5">
                      {ocrResult.fraud_flags.map((flag, i) => (
                        <li key={i}>{flag}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Admin note */}
        <div className="p-6 flex-1 space-y-3">
          <label className="text-[10px] font-bold text-[#5a6e90] uppercase tracking-wider block">
            บันทึกจากแอดมิน (Admin Note)
          </label>
          <textarea
            placeholder="เช่น สลิปถูกต้อง / ยอดไม่ตรง / วันที่ไม่ถูก..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="admin-input w-full h-24 p-3.5 text-xs resize-none"
          />
        </div>

        {/* Action buttons */}
        <div className="p-6 pt-0 space-y-3">
          <button
            onClick={handleApprove}
            disabled={loading !== null}
            id={`btn-approve-${order.id}`}
            className="admin-btn-primary w-full py-3.5 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading === 'approve' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            อนุมัติการชำระเงิน
          </button>
          <button
            onClick={handleReject}
            disabled={loading !== null}
            id={`btn-reject-${order.id}`}
            className="admin-btn-danger w-full py-3 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading === 'reject' ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
            ปฏิเสธการชำระเงิน
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
  const needsReview = (order.status === 'pending' || order.status === 'unfulfilled') && order.hasSlip;
  const isPending   = (order.status === 'pending' || order.status === 'unfulfilled') && !order.hasSlip;
  const isRejected  = order.status === 'payment_rejected' || order.status === 'cancelled';
  const isConfirmed = order.status === 'confirmed' || order.status === 'paid' || order.status === 'completed';

  return (
    <div className={`admin-panel rounded-2xl transition-all ${needsReview ? 'border-[rgba(251,191,36,0.40)] shadow-[0_0_20px_rgba(251,191,36,0.10)]' : ''}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left info */}
        <div className="flex items-center gap-4 min-w-0">
          {order.hasSlip && order.paymentSlipUrl ? (
            <div
              onClick={() => onViewSlip(order)}
              className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/20 cursor-pointer hover:border-[#22e5ff] transition group relative bg-black/40"
              title="คลิกดูสลิป"
            >
              <img
                src={order.paymentSlipUrl}
                alt={`Slip #${order.id}`}
                className="w-full h-full object-cover group-hover:scale-110 transition duration-200"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition" />
            </div>
          ) : (
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              needsReview ? 'bg-[rgba(251,191,36,0.12)] border border-[rgba(251,191,36,0.30)]'
              : isPending  ? 'bg-white/5 border border-white/10'
              : isRejected ? 'bg-[rgba(244,63,94,0.12)] border border-[rgba(244,63,94,0.30)]'
              : 'bg-[rgba(16,185,129,0.12)] border border-[rgba(16,185,129,0.30)]'
            }`}>
              {needsReview ? <Receipt className="w-5 h-5 text-[#fbbf24]" /> :
               isPending   ? <Clock    className="w-5 h-5 text-[#5a6e90]" /> :
               isRejected  ? <XCircle  className="w-5 h-5 text-[#fb7185]"  /> :
               <CheckCircle2 className="w-5 h-5 text-[#34d399]" />}
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-[#eef2ff] text-sm">#{order.id}</span>
              <OrderStatusBadge status={order.status} />
              {needsReview && (
                <span className="text-[10px] font-extrabold bg-[rgba(251,191,36,0.15)] text-[#fbbf24] px-2.5 py-0.5 rounded-full border border-[rgba(251,191,36,0.35)] animate-pulse">
                  รอตรวจสอบ (มีสลิป)
                </span>
              )}
              {isPending && (
                <span className="text-[10px] font-semibold text-[#5a6e90] bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                  รอสลิป
                </span>
              )}
            </div>
            <p className="text-xs text-[#5a6e90] mt-0.5 truncate font-medium">
              {order.customerName || order.customerEmail} · {order.date}
            </p>
            {order.adminNote && (
              <p className="text-[11px] text-[#94a3c4] mt-1 italic font-medium">📝 {order.adminNote}</p>
            )}
          </div>
        </div>

        {/* Right: amount + method + actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 shrink-0">
          <div className="text-right">
            <p className="font-black text-[#22e5ff] text-base" style={{ fontFamily: "'Outfit', sans-serif" }}>
              ฿{order.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${METHOD_COLOR[order.paymentMethod] || 'bg-white/5 text-[#94a3c4] border-white/10'}`}>
              {METHOD_LABEL[order.paymentMethod] || order.paymentMethod}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onViewSlip(order)}
              id={`btn-view-slip-${order.id}`}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                order.hasSlip
                  ? 'admin-btn-primary'
                  : 'admin-btn-secondary'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              {order.hasSlip ? 'ดูสลิป & AI Check' : 'ดูรายละเอียด'}
            </button>

            {needsReview && (
              <>
                <button
                  onClick={() => onQuickApprove(order.id)}
                  id={`btn-quick-approve-${order.id}`}
                  className="p-2 bg-[rgba(16,185,129,0.15)] border border-[rgba(16,185,129,0.35)] text-[#34d399] hover:bg-[rgba(16,185,129,0.30)] rounded-xl cursor-pointer transition"
                  title="อนุมัติทันที"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onQuickReject(order.id)}
                  id={`btn-quick-reject-${order.id}`}
                  className="p-2 bg-[rgba(244,63,94,0.15)] border border-[rgba(244,63,94,0.35)] text-[#fb7185] hover:bg-[rgba(244,63,94,0.30)] rounded-xl cursor-pointer transition"
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
  const { accessToken } = useApiAuth();
  const [orders, setOrders]   = useState<PaymentOrder[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('pending');
  const [methodFilter, setMethodFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modal
  const [selectedOrder, setSelectedOrder] = useState<PaymentOrder | null>(null);

  // Summary stats
  const safeOrders      = orders || [];
  const pendingWithSlip = safeOrders.filter(o => (o.status === 'pending' || o.status === 'unfulfilled') && o.hasSlip).length;
  const pendingNoSlip   = safeOrders.filter(o => (o.status === 'pending' || o.status === 'unfulfilled') && !o.hasSlip).length;

  const fetchOrders = useCallback(async (force = false) => {
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
      if (!token) throw new Error('ไม่สามารถเชื่อมต่อ API ได้');

      // Fetch remote orders from Wayneven API
      const res = await ordersApi.list({ page, per_page: 50 }, token);
      const list = Array.isArray(res) ? res : (res?.orders || []);

      // Fetch order slips from shared Supabase settings
      let slipsMap: Record<string, any> = {};
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yywymyxautnskmuvupwv.supabase.co';
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_L0zDWoTrfHQHPSvUBntbgA_H-kUMxgR';
        const slipRes = await fetch(`${supabaseUrl}/rest/v1/settings?key=eq.order_slips&select=*`, {
          headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
          cache: 'no-store',
        });
        if (slipRes.ok) {
          const rows = await slipRes.json();
          if (Array.isArray(rows) && rows.length > 0) {
            const rawVal = rows[0].value;
            slipsMap = typeof rawVal === 'string' ? JSON.parse(rawVal) : (rawVal || {});
          }
        }
      } catch (e) {
        console.warn('Failed to load shared order slips:', e);
      }

      // Map orders with their pure Backend API properties and real slips
      const mappedOrders: PaymentOrder[] = list.map((o: any) => {
        const orderIdStr = String(o.id);
        const slipRecord = slipsMap[orderIdStr];
        let realSlipUrl = '';

        if (slipRecord?.slip_url) {
          realSlipUrl = slipRecord.slip_url;
        } else if (slipRecord?.public_url) {
          realSlipUrl = slipRecord.public_url;
        } else if (o.notes && o.notes.includes('SLIP:')) {
          realSlipUrl = o.notes.split('SLIP:')[1].trim().split(' ')[0];
        } else if (o.slip_url || o.slip_image_url || o.payment_slip_url) {
          realSlipUrl = o.slip_url || o.slip_image_url || o.payment_slip_url;
        }

        const hasSlip = Boolean(realSlipUrl);

        return {
          id: o.id,
          customerName: slipRecord?.customer_name ?? o.customer_name ?? o.order_number ?? `Order #${o.id}`,
          customerEmail: slipRecord?.customer_email ?? '-',
          total: Number(o.grand_total ?? o.total_amount ?? 0),
          subtotal: Number(o.subtotal ?? o.total_amount ?? 0),
          shippingFee: Number(o.shipping_fee ?? 0),
          paymentMethod: o.notes?.includes('Payment:')
            ? o.notes.split('Payment:')[1].split(',')[0].trim()
            : 'promptpay',
          status: o.status,
          hasSlip,
          paymentSlipUrl: realSlipUrl,
          adminNote: slipRecord?.notes || o.notes || '',
          date: new Date(o.created_at).toLocaleDateString('th-TH'),
          approvedAt: o.completed_at ? new Date(o.completed_at).toLocaleDateString('th-TH') : null,
        };
      });

      setOrders(mappedOrders);
      setTotal(res.total ?? list.length);
    } catch (err: any) {
      setError(err.message || 'ไม่สามารถดึงข้อมูลการชำระเงินจาก API จริงได้');
      if (orders.length === 0) {
        setOrders([]);
        setTotal(0);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, accessToken, orders.length]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // ── Approve handler
  const handleApprove = async (orderId: number, note: string) => {
    const token = await ensureApiAuth();

    // Update order_slips in Supabase
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yywymyxautnskmuvupwv.supabase.co';
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_L0zDWoTrfHQHPSvUBntbgA_H-kUMxgR';
      const slipRes = await fetch(`${supabaseUrl}/rest/v1/settings?key=eq.order_slips&select=*`, {
        headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
        cache: 'no-store',
      });
      if (slipRes.ok) {
        const rows = await slipRes.json();
        if (Array.isArray(rows) && rows.length > 0) {
          const rowId = rows[0].id;
          const currentSlips = typeof rows[0].value === 'string' ? JSON.parse(rows[0].value) : (rows[0].value || {});
          if (currentSlips[String(orderId)]) {
            currentSlips[String(orderId)].status = 'approved';
            currentSlips[String(orderId)].admin_note = note || 'อนุมัติเรียบร้อยแล้ว';
            currentSlips[String(orderId)].approved_at = new Date().toISOString();
            await fetch(`${supabaseUrl}/rest/v1/settings?id=eq.${rowId}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                apikey: anonKey,
                Authorization: `Bearer ${anonKey}`,
                Prefer: 'return=minimal',
              },
              body: JSON.stringify({
                value: JSON.stringify(currentSlips),
                updated_at: new Date().toISOString(),
              }),
            });
          }
        }
      }
    } catch (e) {
      console.warn('Failed to sync approval to Supabase:', e);
    }

    if (token) {
      // 1. Always execute checkout on the order so backend marks order as paid & awards points
      try {
        const currentOrder = orders.find(o => o.id === orderId);
        await ordersApi.checkout(orderId, {
          payments: [{
            payment_method: currentOrder?.paymentMethod || 'bank_transfer',
            amount: currentOrder?.total || 1,
            notes: note || 'ยืนยันการชำระเงินโดยแอดมิน',
          }]
        }, token);
      } catch (chkErr) {
        console.warn('Orders checkout error on backend:', chkErr);
      }

      // 2. Also try approving slip verification record if pending
      try {
        const slips = await slipVerifyApi.listByOrder(orderId, token).catch(() => []);
        const targetSlip = Array.isArray(slips) ? slips.find((s: any) => s.status === 'pending') : null;
        if (targetSlip && typeof targetSlip.id === 'number') {
          await slipVerifyApi.approve(targetSlip.id, note, token).catch(() => {});
        }
      } catch (err) {
        console.warn('Approve slip verification error (non-fatal):', err);
      }
    }

    setSelectedOrder(null);
    await fetchOrders(true);
  };

  // ── Reject handler
  const handleReject = async (orderId: number, note: string) => {
    const token = await ensureApiAuth();

    // Update order_slips in Supabase
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yywymyxautnskmuvupwv.supabase.co';
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_L0zDWoTrfHQHPSvUBntbgA_H-kUMxgR';
      const slipRes = await fetch(`${supabaseUrl}/rest/v1/settings?key=eq.order_slips&select=*`, {
        headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
        cache: 'no-store',
      });
      if (slipRes.ok) {
        const rows = await slipRes.json();
        if (Array.isArray(rows) && rows.length > 0) {
          const rowId = rows[0].id;
          const currentSlips = typeof rows[0].value === 'string' ? JSON.parse(rows[0].value) : (rows[0].value || {});
          if (currentSlips[String(orderId)]) {
            currentSlips[String(orderId)].status = 'rejected';
            currentSlips[String(orderId)].admin_note = note || 'ปฏิเสธการชำระเงิน';
            currentSlips[String(orderId)].rejected_at = new Date().toISOString();
            await fetch(`${supabaseUrl}/rest/v1/settings?id=eq.${rowId}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                apikey: anonKey,
                Authorization: `Bearer ${anonKey}`,
                Prefer: 'return=minimal',
              },
              body: JSON.stringify({
                value: JSON.stringify(currentSlips),
                updated_at: new Date().toISOString(),
              }),
            });
          }
        }
      }
    } catch (e) {
      console.warn('Failed to sync rejection to Supabase:', e);
    }

    if (token) {
      try {
        await ordersApi.cancel(orderId, note || 'ปฏิเสธสลิปการชำระเงิน', token).catch(() => {});
        const slips = await slipVerifyApi.listByOrder(orderId, token).catch(() => []);
        const targetSlip = Array.isArray(slips) ? slips.find((s: any) => s.status === 'pending') : null;
        if (targetSlip && typeof targetSlip.id === 'number') {
          await slipVerifyApi.reject(targetSlip.id, note, token).catch(() => {});
        }
      } catch (err) {
        console.warn('Reject error / fallback:', err);
      }
    }

    setSelectedOrder(null);
    await fetchOrders(true);
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

  // Filter orders according to tab
  const displayOrders = orders.filter((o) => {
    if (!statusFilter || statusFilter === 'all') return true;
    if (statusFilter === 'pending') return o.status === 'pending' || o.status === 'unfulfilled';
    if (statusFilter === 'confirmed') return o.status === 'confirmed' || o.status === 'paid' || o.status === 'completed';
    if (statusFilter === 'payment_rejected') return o.status === 'payment_rejected' || o.status === 'cancelled';
    return o.status === statusFilter;
  });

  return (
    <div className="space-y-5 sm:space-y-6 select-none font-sans animate-in" style={{ padding: '20px', maxWidth: 1500 }}>
      <AdminPageHeader
        title="ตรวจสอบการชำระเงิน & AI สลิป (Bottle Club)"
        subtitle="ตรวจเช็คสลิปด้วย AI OCR + Fraud Detection + ตรวจจับสลิปซ้ำ"
        icon={CreditCard}
        action={
          <button
            onClick={() => fetchOrders(true)}
            disabled={refreshing}
            className="p-2.5 px-3.5 rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50 flex items-center gap-2 text-xs font-semibold"
            style={{ color: '#22e5ff', background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)' }}
            title="รีเฟรชข้อมูลการชำระเงิน"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>รีเฟรชข้อมูล</span>
          </button>
        }
      />

      {/* ── KPI Summary Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'รอตรวจสอบ (มีสลิป)',
            value: loading ? '—' : pendingWithSlip,
            icon: Receipt,
            color: 'bg-[rgba(251,191,36,0.08)] border-[rgba(251,191,36,0.25)] text-[#fbbf24]',
            iconColor: 'text-[#fbbf24] bg-[rgba(251,191,36,0.15)]',
            urgent: pendingWithSlip > 0,
          },
          {
            label: 'รอชำระเงิน (ไม่มีสลิป)',
            value: loading ? '—' : pendingNoSlip,
            icon: Clock,
            color: 'bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.07)] text-[#94a3c4]',
            iconColor: 'text-[#5a6e90] bg-white/5',
            urgent: false,
          },
          {
            label: 'ทั้งหมดในหน้านี้',
            value: loading ? '—' : total,
            icon: Filter,
            color: 'bg-[rgba(34,229,255,0.08)] border-[rgba(34,229,255,0.25)] text-[#22e5ff]',
            iconColor: 'text-[#22e5ff] bg-[rgba(34,229,255,0.15)]',
            urgent: false,
          },
          {
            label: 'ถูกปฏิเสธ / ยกเลิก',
            value: loading ? '—' : orders.filter(o => o.status === 'payment_rejected' || o.status === 'cancelled').length,
            icon: XCircle,
            color: 'bg-[rgba(244,63,94,0.08)] border-[rgba(244,63,94,0.25)] text-[#fb7185]',
            iconColor: 'text-[#fb7185] bg-[rgba(244,63,94,0.15)]',
            urgent: false,
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`border rounded-2xl p-4 ${card.color} ${card.urgent ? 'shadow-[0_0_20px_rgba(251,191,36,0.15)]' : ''}`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.iconColor}`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className="text-2xl font-black leading-none" style={{ fontFamily: "'Outfit', sans-serif" }}>{card.value}</p>
                  <p className="text-[11px] font-semibold mt-1 opacity-80">{card.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Filters Bar ────────────────────────────────────────────── */}
      <div className="admin-panel p-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          {[
            { id: 'all', label: 'ทั้งหมด' },
            { id: 'pending', label: 'รอตรวจสอบ' },
            { id: 'confirmed', label: 'อนุมัติแล้ว' },
            { id: 'payment_rejected', label: 'ปฏิเสธ / ยกเลิก' }
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => { setStatusFilter(st.id === 'all' ? '' : st.id); setPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition ${
                (st.id === 'all' && !statusFilter) || statusFilter === st.id
                  ? 'admin-btn-primary'
                  : 'admin-btn-secondary'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => fetchOrders(true)}
          disabled={loading || refreshing}
          className="admin-btn-secondary p-2 text-xs flex items-center gap-1.5 cursor-pointer ml-auto"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${refreshing || loading ? 'animate-spin' : ''}`} />
          <span>รีเฟรช</span>
        </button>
      </div>

      {/* ── Orders List ────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-24 rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : displayOrders.length === 0 ? (
        <div className="admin-panel p-12 text-center space-y-3">
          <Receipt className="w-10 h-10 text-[#3d4d6a] mx-auto" />
          <p className="text-sm font-bold text-[#94a3c4]">ไม่พบรายการชำระเงินตามเงื่อนไขที่เลือก</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayOrders.map((ord) => (
            <OrderCard
              key={ord.id}
              order={ord}
              onViewSlip={setSelectedOrder}
              onQuickApprove={handleQuickApprove}
              onQuickReject={handleQuickReject}
            />
          ))}
        </div>
      )}

      {/* ── Slip Modal ────────────────────────────────────────────── */}
      {selectedOrder && (
        <SlipModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          token={accessToken}
        />
      )}
    </div>
  );
}
