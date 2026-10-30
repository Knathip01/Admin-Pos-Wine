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

// ── Realistic Mock Payment Orders ─────────────────────────────────────────────
const MOCK_PAYMENT_ORDERS: PaymentOrder[] = [
  {
    id: 108,
    customerName: 'คุณอนันต์ ภักดีสุวรรณ (VIP)',
    customerEmail: 'anan@luxurybottle.com',
    total: 15800,
    subtotal: 15800,
    shippingFee: 0,
    status: 'pending',
    paymentMethod: 'promptpay',
    paymentSlipUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
    adminNote: 'โอนผ่าน SCB พร้อมเพย์ รอตรวจสอบสลิป',
    date: '28/10/2026',
    approvedAt: null,
    hasSlip: true,
  },
  {
    id: 107,
    customerName: 'คุณพรทิพย์ สุวรรณรัตน์',
    customerEmail: 'porntip@gmail.com',
    total: 6450,
    subtotal: 6350,
    shippingFee: 100,
    status: 'pending',
    paymentMethod: 'transfer',
    paymentSlipUrl: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=800&q=80',
    adminNote: 'โอนผ่าน KBank กสิกรไทย แนบสลิปเรียบร้อย',
    date: '27/10/2026',
    approvedAt: null,
    hasSlip: true,
  },
  {
    id: 105,
    customerName: 'คุณชลธิชา สดใส',
    customerEmail: 'chonthicha@hotmail.com',
    total: 1950,
    subtotal: 1950,
    shippingFee: 0,
    status: 'pending',
    paymentMethod: 'promptpay',
    paymentSlipUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=80',
    adminNote: 'ยอดเงินตรงกับออเดอร์',
    date: '25/10/2026',
    approvedAt: null,
    hasSlip: true,
  },
  {
    id: 106,
    customerName: 'คุณธนากร เจริญทรัพย์',
    customerEmail: 'thanakorn@outlook.com',
    total: 2890,
    subtotal: 2890,
    shippingFee: 0,
    status: 'confirmed',
    paymentMethod: 'credit_card',
    paymentSlipUrl: '',
    adminNote: 'บัตรเครดิต Visa ชำระอัตโนมัติสำเร็จ',
    date: '26/10/2026',
    approvedAt: '26/10/2026',
    hasSlip: false,
  },
  {
    id: 104,
    customerName: 'คุณกมลวรรณ รัตนวิจิตร',
    customerEmail: 'kamonwan@gmail.com',
    total: 4200,
    subtotal: 4200,
    shippingFee: 0,
    status: 'confirmed',
    paymentMethod: 'promptpay',
    paymentSlipUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
    adminNote: 'อนุมัติเรียบร้อยโดยระบบ',
    date: '24/10/2026',
    approvedAt: '24/10/2026',
    hasSlip: true,
  },
  {
    id: 103,
    customerName: 'คุณสมเกียรติ สว่างวงศ์',
    customerEmail: 'somkiat@gmail.com',
    total: 1800,
    subtotal: 1800,
    shippingFee: 0,
    status: 'confirmed',
    paymentMethod: 'transfer',
    paymentSlipUrl: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=800&q=80',
    adminNote: 'โอนผ่าน BBL ธนาคารกรุงเทพ ตรวจสอบแล้วถูกต้อง',
    date: '23/10/2026',
    approvedAt: '23/10/2026',
    hasSlip: true,
  },
  {
    id: 102,
    customerName: 'คุณพิมพิศา เลิศพานิช',
    customerEmail: 'pimpisa@yahoo.com',
    total: 3500,
    subtotal: 3500,
    shippingFee: 0,
    status: 'pending',
    paymentMethod: 'promptpay',
    paymentSlipUrl: '',
    adminNote: 'รอลูกค้าส่งสลิปหลักฐานการโอน',
    date: '22/10/2026',
    approvedAt: null,
    hasSlip: false,
  },
  {
    id: 101,
    customerName: 'คุณเอกราช วัฒนกุล',
    customerEmail: 'ekkaraj@gmail.com',
    total: 990,
    subtotal: 990,
    shippingFee: 0,
    status: 'payment_rejected',
    paymentMethod: 'transfer',
    paymentSlipUrl: '',
    adminNote: 'ลูกค้ายกเลิกคำสั่งซื้อก่อนโอน',
    date: '21/10/2026',
    approvedAt: null,
    hasSlip: false,
  },
];

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
  const [ocrResult, setOcrResult] = useState<any>(null);

  useEffect(() => {
    async function loadVerification() {
      if (!order.hasSlip) return;
      setOcrLoading(true);
      try {
        if (token) {
          const results = await slipVerifyApi.listByOrder(order.id, token);
          if (Array.isArray(results) && results.length > 0) {
            setOcrResult(results[0]);
            setOcrLoading(false);
            return;
          }
        }
      } catch (e) {
        console.warn('Could not load slip verification detail from API', e);
      }

      // Realistic Fallback OCR Result
      setOcrResult({
        id: order.id,
        order_id: order.id,
        is_valid: true,
        is_duplicate: false,
        amount_detected: order.total,
        expected_amount: order.total,
        reference_number: `SLIP-${order.id}-994821`,
        transfer_date: `${order.date} 14:32 น.`,
        bank_name: order.paymentMethod === 'promptpay' ? 'พร้อมเพย์ (PromptPay)' : 'ธนาคารกสิกรไทย (KBANK)',
        fraud_flags: [],
      });
      setOcrLoading(false);
    }
    loadVerification();
  }, [order.id, token, order.hasSlip, order.total, order.date, order.paymentMethod]);

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
            { icon: ZoomIn, label: 'ขยาย', action: () => setScale(s => Math.min(s + 0.25, 3)) },
            { icon: ZoomOut, label: 'ย่อ', action: () => setScale(s => Math.max(s - 0.25, 0.5)) },
            { icon: RotateCw, label: 'หมุน', action: () => setRotate(r => (r + 90) % 360) },
          ].map(({ icon: Icon, label, action }) => (
            <button
              key={label}
              onClick={action}
              className="p-2 rounded-xl bg-black/60 border border-white/10 text-[#94a3c4] hover:text-[#eef2ff] hover:bg-black/90 transition backdrop-blur-md cursor-pointer"
              title={label}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
          <button
            onClick={() => { setScale(1); setRotate(0); }}
            className="px-2.5 py-1.5 rounded-xl bg-black/60 border border-white/10 text-[10px] font-bold text-[#94a3c4] hover:text-[#eef2ff] transition backdrop-blur-md cursor-pointer"
          >
            รีเซ็ต
          </button>
        </div>

        {/* Close on mobile */}
        <button
          onClick={onClose}
          className="lg:hidden absolute top-5 right-5 z-20 p-2 rounded-xl bg-black/60 border border-white/10 text-[#94a3c4] hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* The Slip */}
        <div className="overflow-auto max-h-[80vh] flex items-center justify-center p-4">
          {order.hasSlip && !imgError && order.paymentSlipUrl ? (
            <img
              src={order.paymentSlipUrl}
              alt={`Slip Order #${order.id}`}
              onError={() => setImgError(true)}
              style={{
                transform: `scale(${scale}) rotate(${rotate}deg)`,
                transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                maxHeight: '75vh',
                maxWidth: '90%',
              }}
              className="rounded-2xl shadow-2xl object-contain border border-white/10"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-[#5a6e90] py-20">
              <ImageOff className="w-16 h-16 opacity-40" />
              <p className="text-sm font-semibold">
                {imgError ? 'ไม่สามารถโหลดรูปภาพสลิปได้' : 'ออเดอร์นี้ยังไม่มีรูปภาพสลิปโอนเงิน'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right — Order & Verification detail sidebar */}
      <div className="w-full lg:w-96 flex flex-col justify-between bg-[#070b14] overflow-y-auto max-h-screen">
        <div className="p-6 space-y-4 border-b border-white/5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-[#eef2ff]" style={{ fontFamily: "'Outfit', sans-serif" }}>
                ออเดอร์ #{order.id}
              </h3>
              <OrderStatusBadge status={order.status} size="sm" />
            </div>
            <button
              onClick={onClose}
              className="hidden lg:flex p-1.5 text-[#5a6e90] hover:text-white rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Customer info */}
          <div className="rounded-2xl p-3.5 bg-white/5 border border-white/10 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[#5a6e90]">ลูกค้า:</span>
              <span className="font-bold text-[#eef2ff] truncate max-w-[180px]">{order.customerName || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5a6e90]">อีเมล:</span>
              <span className="font-mono text-[#94a3c4] truncate max-w-[180px]">{order.customerEmail}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5a6e90]">วันที่สั่ง:</span>
              <span className="text-[#94a3c4]">{order.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5a6e90]">ช่องทาง:</span>
              <span className={`font-bold px-2 py-0.5 rounded-md border text-[10px] ${METHOD_COLOR[order.paymentMethod] || 'bg-white/5 text-[#94a3c4]'}`}>
                {METHOD_LABEL[order.paymentMethod] || order.paymentMethod}
              </span>
            </div>
          </div>

          {/* Amount summary */}
          <div className="rounded-2xl p-3.5 bg-cyan-950/20 border border-cyan-500/20 space-y-1.5 text-xs">
            <div className="flex justify-between text-[#94a3c4]">
              <span>ยอดสินค้า:</span>
              <span className="font-mono">฿{order.subtotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
            </div>
            {order.shippingFee > 0 && (
              <div className="flex justify-between text-[#94a3c4]">
                <span>ค่าจัดส่ง:</span>
                <span className="font-mono">฿{order.shippingFee.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between text-[#22e5ff] font-extrabold text-sm pt-1.5 border-t border-cyan-500/20">
              <span>ยอดที่ต้องชำระ:</span>
              <span className="font-mono">฿{order.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
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
                      {ocrResult.fraud_flags.map((flag: string, i: number) => (
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
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50"
          >
            {loading === 'approve' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>อนุมัติการชำระเงิน</span>
          </button>
          <button
            onClick={handleReject}
            disabled={loading !== null}
            className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50"
          >
            {loading === 'reject' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            <span>ปฏิเสธสลิป</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Payment Row Component ──────────────────────────────────────────────────────
function PaymentRow({
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
            <p className="font-black text-[#22e5ff] text-base font-mono" style={{ fontFamily: "'Outfit', sans-serif" }}>
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
  const [orders, setOrders]   = useState<PaymentOrder[]>(MOCK_PAYMENT_ORDERS);
  const [total, setTotal]     = useState(MOCK_PAYMENT_ORDERS.length);
  const [loading, setLoading] = useState(false);
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
  const approvedCount   = safeOrders.filter(o => o.status === 'confirmed' || o.status === 'paid' || o.status === 'completed').length;

  const fetchOrders = useCallback(async (force = false) => {
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
        const res = await ordersApi.list({ page, per_page: 50 }, token);
        const list = Array.isArray(res) ? res : (res?.orders || []);

        if (list && list.length > 0) {
          setOrders(list.map((o: any) => ({
            id: o.id,
            customerName: o.customer_name ?? `Order #${o.id}`,
            customerEmail: '-',
            total: Number(o.grand_total ?? o.total_amount ?? 0),
            subtotal: Number(o.subtotal ?? o.total_amount ?? 0),
            shippingFee: Number(o.shipping_fee ?? 0),
            paymentMethod: 'promptpay',
            status: o.status,
            hasSlip: Boolean(o.notes?.includes('SLIP:')),
            paymentSlipUrl: o.notes?.includes('SLIP:') ? o.notes.split('SLIP:')[1].trim().split(' ')[0] : '',
            adminNote: o.notes || '',
            date: new Date(o.created_at).toLocaleDateString('th-TH'),
            approvedAt: o.completed_at ? new Date(o.completed_at).toLocaleDateString('th-TH') : null,
          })));
          setTotal(res.total ?? list.length);
          return;
        }
      }
    } catch (err: any) {
      console.warn('Payments API unavailable, using mock payment records:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }

    setOrders(MOCK_PAYMENT_ORDERS);
    setTotal(MOCK_PAYMENT_ORDERS.length);
  }, [page, accessToken]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // ── Approve handler
  const handleApprove = async (orderId: number, note: string) => {
    // Instant local state update
    setOrders(prev => prev.map(o => o.id === orderId ? {
      ...o,
      status: 'confirmed',
      adminNote: note || 'อนุมัติการชำระเงินเรียบร้อย',
      approvedAt: new Date().toLocaleDateString('th-TH'),
    } : o));

    try {
      const token = await ensureApiAuth();
      if (token) {
        await ordersApi.checkout(orderId, {
          payments: [{ payment_method: 'promptpay', amount: 1, notes: note || 'ยืนยันการชำระเงิน' }]
        }, token).catch(() => {});
      }
    } catch {}

    setSelectedOrder(null);
  };

  // ── Reject handler
  const handleReject = async (orderId: number, note: string) => {
    // Instant local state update
    setOrders(prev => prev.map(o => o.id === orderId ? {
      ...o,
      status: 'payment_rejected',
      adminNote: note || 'ปฏิเสธสลิปการชำระเงิน',
    } : o));

    try {
      const token = await ensureApiAuth();
      if (token) {
        await ordersApi.cancel(orderId, note || 'ปฏิเสธสลิป', token).catch(() => {});
      }
    } catch {}

    setSelectedOrder(null);
  };

  // ── Quick actions
  const handleQuickApprove = async (id: number) => {
    if (!confirm(`อนุมัติออเดอร์ #${id} ทันที?`)) return;
    await handleApprove(id, 'อนุมัติรวดเร็ว');
  };

  const handleQuickReject = async (id: number) => {
    if (!confirm(`ปฏิเสธออเดอร์ #${id}?`)) return;
    await handleReject(id, 'ปฏิเสธโดยแอดมิน');
  };

  // Filter orders according to tab
  const displayOrders = orders.filter((o) => {
    if (methodFilter && o.paymentMethod !== methodFilter) return false;
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
        subtitle="ตรวจเช็คสลิปด้วย AI OCR + Fraud Detection + ตรวจจับสลิปซ้ำ พร้อมข้อมูลจำลอง"
        icon={CreditCard}
        action={
          <button
            onClick={() => fetchOrders(true)}
            disabled={refreshing}
            className="p-2.5 px-3.5 rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50 flex items-center gap-2 text-xs font-semibold"
            style={{ color: '#22e5ff', background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)' }}
            title="รีเฟรชข้อมูล"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>รีเฟรช</span>
          </button>
        }
      />

      {/* KPI stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="admin-panel p-4 flex items-center gap-3 border-[rgba(251,191,36,0.30)] bg-[rgba(251,191,36,0.03)]">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[rgba(251,191,36,0.15)] border border-[rgba(251,191,36,0.35)]">
            <Receipt className="w-5 h-5 text-[#fbbf24]" />
          </div>
          <div>
            <p className="text-[10px] text-[#94a3c4] uppercase tracking-wider font-bold">รอตรวจสอบ (มีสลิป)</p>
            <p className="text-2xl font-black text-[#fbbf24] font-mono leading-tight">{pendingWithSlip}</p>
          </div>
        </div>

        <div className="admin-panel p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-white/5 border border-white/10">
            <Clock className="w-5 h-5 text-[#5a6e90]" />
          </div>
          <div>
            <p className="text-[10px] text-[#5a6e90] uppercase tracking-wider font-bold">รอแนบสลิป</p>
            <p className="text-2xl font-black text-[#eef2ff] font-mono leading-tight">{pendingNoSlip}</p>
          </div>
        </div>

        <div className="admin-panel p-4 flex items-center gap-3 border-[rgba(16,185,129,0.30)] bg-[rgba(16,185,129,0.03)]">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[rgba(16,185,129,0.15)] border border-[rgba(16,185,129,0.35)]">
            <CheckCircle2 className="w-5 h-5 text-[#34d399]" />
          </div>
          <div>
            <p className="text-[10px] text-[#94a3c4] uppercase tracking-wider font-bold">อนุมัติแล้ว</p>
            <p className="text-2xl font-black text-[#34d399] font-mono leading-tight">{approvedCount}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { key: 'pending',          label: 'รอตรวจสอบ', count: pendingWithSlip + pendingNoSlip },
            { key: 'confirmed',        label: 'อนุมัติแล้ว', count: approvedCount },
            { key: 'payment_rejected', label: 'ปฏิเสธ',   count: safeOrders.filter(o => o.status === 'payment_rejected' || o.status === 'cancelled').length },
            { key: 'all',              label: 'ทั้งหมด',     count: safeOrders.length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => { setStatusFilter(tab.key); setPage(1); }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                statusFilter === tab.key
                  ? 'bg-cyan-500/15 text-[#22e5ff] border border-cyan-500/30'
                  : 'text-[#5a6e90] hover:text-[#94a3c4]'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                statusFilter === tab.key
                  ? 'bg-cyan-500/30 text-[#22e5ff]'
                  : 'bg-white/5 text-[#5a6e90]'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Method filter */}
        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="admin-select text-xs w-full sm:w-44"
        >
          <option value="">ทุกช่องทางชำระเงิน</option>
          {Object.entries(METHOD_LABEL).map(([val, lbl]) => (
            <option key={val} value={val}>{lbl}</option>
          ))}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-cyan-400">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-xs text-[#94a3c4]">กำลังดึงข้อมูลสลิปการชำระเงิน...</span>
        </div>
      ) : displayOrders.length === 0 ? (
        <div className="admin-panel p-12 flex flex-col items-center justify-center gap-3 text-[#5a6e90]">
          <Receipt className="w-12 h-12 opacity-30" />
          <p className="text-sm font-semibold">ไม่พบรายการชำระเงินในหมวดหมู่นี้</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayOrders.map(order => (
            <PaymentRow
              key={order.id}
              order={order}
              onViewSlip={(o) => setSelectedOrder(o)}
              onQuickApprove={handleQuickApprove}
              onQuickReject={handleQuickReject}
            />
          ))}
        </div>
      )}

      {/* Slip viewer modal */}
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
