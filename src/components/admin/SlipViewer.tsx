'use client';

import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Check, AlertTriangle, Loader2 } from 'lucide-react';

interface SlipViewerProps {
  slipUrl: string;
  orderId: number;
  onClose: () => void;
  onApprove: (note: string) => Promise<void>;
  onReject: (note: string) => Promise<void>;
}

export default function SlipViewer({ slipUrl, orderId, onClose, onApprove, onReject }: SlipViewerProps) {
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [note, setNote] = useState('');
  const [actionLoading, setActionLoading] = useState<'approve' | 'reject' | null>(null);

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.25, 3));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.25, 0.5));
  const handleRotate = () => setRotate((r) => (r + 90) % 360);

  const handleApproveAction = async () => {
    if (confirm('คุณต้องการอนุมัติการชำระเงินของออเดอร์นี้ใช่หรือไม่?')) {
      setActionLoading('approve');
      try {
        await onApprove(note);
      } catch (err) {
        console.error(err);
      } finally {
        setActionLoading(null);
      }
    }
  };

  const handleRejectAction = async () => {
    if (confirm('คุณต้องการปฏิเสธการชำระเงินของออเดอร์นี้ใช่หรือไม่?')) {
      setActionLoading('reject');
      try {
        await onReject(note);
      } catch (err) {
        console.error(err);
      } finally {
        setActionLoading(null);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col md:flex-row select-none">
      <div className="flex-1 relative flex items-center justify-center p-6 h-[60vh] md:h-screen bg-stone-950 border-b md:border-b-0 md:border-r border-white/5">
        <div className="absolute top-6 left-6 z-20 flex gap-2">
          <button
            onClick={handleZoomIn}
            className="p-2.5 bg-stone-900 border border-white/10 text-stone-300 hover:text-stone-100 rounded-xl cursor-pointer"
            title="ขยาย"
          >
            <ZoomIn className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2.5 bg-stone-900 border border-white/10 text-stone-300 hover:text-stone-100 rounded-xl cursor-pointer"
            title="ย่อ"
          >
            <ZoomOut className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={handleRotate}
            className="p-2.5 bg-stone-900 border border-white/10 text-stone-300 hover:text-stone-100 rounded-xl cursor-pointer"
            title="หมุน"
          >
            <RotateCw className="w-4.5 h-4.5" />
          </button>
        </div>

        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-20 p-2.5 bg-stone-900 border border-white/10 text-stone-300 hover:text-stone-100 rounded-xl cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-auto w-full h-full flex items-center justify-center">
          <div
            className="transition-transform duration-250 ease-out max-h-full max-w-full"
            style={{ transform: `scale(${scale}) rotate(${rotate}deg)` }}
          >
            <img
              src={slipUrl || '/placeholder-slip.jpg'}
              alt={`Slip Payment Order #${orderId}`}
              className="max-h-[50vh] md:max-h-[80vh] object-contain rounded-lg shadow-2xl border border-white/10"
              draggable={false}
            />
          </div>
        </div>
      </div>

      <div className="w-full md:w-[400px] shrink-0 bg-stone-900 p-8 flex flex-col justify-between h-[40vh] md:h-screen overflow-y-auto">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold font-serif text-stone-100">ตรวจสอบสลิปการโอนเงิน</h3>
            <p className="text-xs text-stone-500 uppercase tracking-wider mt-1">ออเดอร์หมายเลข #{orderId}</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block">
              บันทึกข้อความจากผู้ดูแล (Admin Note)
            </label>
            <textarea
              placeholder="ใส่ข้อความแนบ เช่น สลิปถูกต้อง / วันเวลาไม่ตรง / ยอดเงินขาด..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full h-32 p-4 bg-stone-950 border border-white/10 rounded-xl text-stone-200 text-sm focus:outline-none focus:border-red-800 transition duration-200 placeholder:text-stone-600 resize-none"
            />
          </div>
        </div>

        <div className="space-y-3 pt-6 border-t border-white/5">
          <button
            onClick={handleApproveAction}
            disabled={actionLoading !== null}
            className="w-full py-4 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-lg flex items-center justify-center gap-2 cursor-pointer transition"
          >
            {actionLoading === 'approve' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4.5 h-4.5" />
            )}
            อนุมัติสลิปโอนเงิน
          </button>
          <button
            onClick={handleRejectAction}
            disabled={actionLoading !== null}
            className="w-full py-4 bg-red-900 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-lg flex items-center justify-center gap-2 cursor-pointer transition"
          >
            {actionLoading === 'reject' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <AlertTriangle className="w-4.5 h-4.5" />
            )}
            ปฏิเสธสลิป / แจ้งโอนเงินใหม่
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer"
          >
            ย้อนกลับ
          </button>
        </div>
      </div>
    </div>
  );
}
