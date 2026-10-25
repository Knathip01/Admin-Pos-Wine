'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  CheckCircle2,
  Loader2,
  DollarSign,
  Percent,
  Award,
  AlertTriangle,
  RefreshCw,
  Truck,
  QrCode,
  ShieldCheck,
} from 'lucide-react';
import { settingsApi } from '@/lib/api/settings';
import { useApiAuth, ensureApiAuth } from '@/lib/store/api-auth';

export default function AdminSettingsPage() {
  const { accessToken } = useApiAuth();

  // Config states
  const [shippingFee, setShippingFee] = useState('150');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState('2000');
  const [vatRate, setVatRate] = useState('7');
  const [pointsRate, setPointsRate] = useState('100'); // 100 THB = 1 point
  const [lowStockThreshold, setLowStockThreshold] = useState('10');
  const [promptpayNumber, setPromptpayNumber] = useState('0812345678');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = accessToken || await ensureApiAuth();
      if (!token) return;

      const res = await settingsApi.list(token);
      const list = Array.isArray(res) ? res : ((res as any)?.settings || (res as any)?.data || []);
      list.forEach((item: any) => {
        if (item.key === 'shipping_fee') setShippingFee(item.value);
        if (item.key === 'free_shipping_threshold') setFreeShippingThreshold(item.value);
        if (item.key === 'vat_rate' || item.key === 'tax_rate') setVatRate(item.value);
        if (item.key === 'points_rate' || item.key === 'loyalty_points_per_baht') setPointsRate(item.value);
        if (item.key === 'low_stock_threshold') setLowStockThreshold(item.value);
        if (item.key === 'promptpay_number' || item.key === 'promptpay_id') setPromptpayNumber(item.value);
      });
    } catch (err: any) {
      console.warn('Using default settings fallback:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, [accessToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
      const token = accessToken || await ensureApiAuth();
      if (!token) throw new Error('ไม่พบสิทธิ์การเข้าถึง API');

      await Promise.allSettled([
        settingsApi.update('shipping_fee', { value: shippingFee, value_type: 'number' }, token),
        settingsApi.update('free_shipping_threshold', { value: freeShippingThreshold, value_type: 'number' }, token),
        settingsApi.update('vat_rate', { value: vatRate, value_type: 'number' }, token),
        settingsApi.update('points_rate', { value: pointsRate, value_type: 'number' }, token),
        settingsApi.update('low_stock_threshold', { value: lowStockThreshold, value_type: 'number' }, token),
        settingsApi.update('promptpay_number', { value: promptpayNumber, value_type: 'string' }, token),
      ]);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3500);
    } catch (err: any) {
      setError(err.message || 'บันทึกการตั้งค่าไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl select-none font-sans mx-auto animate-in" style={{ padding: '20px', maxWidth: 1100 }}>
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-[#eef2ff] flex items-center gap-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
            <Settings className="w-5 h-5 text-[#22e5ff]" /> ตั้งค่าร้านค้าออนไลน์ (Bottle Club Settings)
          </h2>
          <p className="text-xs text-[#5a6e90] mt-0.5 font-semibold">
            กำหนดค่าบริการจัดส่ง อัตราภาษี การคำนวณแต้มสะสม และบัญชีรับโอนเงิน PromptPay ในระบบ FastAPI
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadSettings}
            disabled={loading}
            className="admin-btn-secondary p-2.5 px-3.5 text-xs flex items-center gap-1.5 cursor-pointer font-bold"
            title="โหลดการตั้งค่าจาก API"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#22e5ff]' : ''}`} />
            <span>รีเฟรช API</span>
          </button>
          {success && (
            <div className="admin-alert-success text-xs px-4 py-2 flex items-center gap-2 font-bold animate-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> บันทึกการเปลี่ยนแปลงสำเร็จ!
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="admin-alert-error text-xs px-4 py-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <div className="admin-panel p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Shipping Config */}
            <div className="space-y-2">
              <label className="admin-label flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-[#22e5ff]" /> ค่าบริการจัดส่งสินค้า (Standard Shipping Fee)
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="0"
                  value={shippingFee}
                  onChange={(e) => setShippingFee(e.target.value)}
                  className="admin-input w-full py-3 pl-4 pr-12 text-sm font-mono"
                />
                <span className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-xs text-[#5a6e90] font-bold">บาท</span>
              </div>
              <p className="text-[10px] text-[#5a6e90] font-semibold">ค่าจัดส่งมาตรฐานสำหรับคำสั่งซื้อออนไลน์</p>
            </div>

            {/* Free Shipping Threshold */}
            <div className="space-y-2">
              <label className="admin-label flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-[#34d399]" /> ยอดสั่งซื้อขั้นต่ำสำหรับส่งฟรี (Free Shipping Threshold)
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="0"
                  value={freeShippingThreshold}
                  onChange={(e) => setFreeShippingThreshold(e.target.value)}
                  className="admin-input w-full py-3 pl-4 pr-12 text-sm font-mono"
                />
                <span className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-xs text-[#5a6e90] font-bold">บาท</span>
              </div>
              <p className="text-[10px] text-[#5a6e90] font-semibold">เมื่อยอดสั่งซื้อถึงเกณฑ์นี้ ค่าจัดส่งจะปรับเป็น 0 บาท</p>
            </div>

            {/* VAT Config */}
            <div className="space-y-2">
              <label className="admin-label flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-[#fbbf24]" /> อัตราภาษีมูลค่าเพิ่ม (VAT Rate)
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  value={vatRate}
                  onChange={(e) => setVatRate(e.target.value)}
                  className="admin-input w-full py-3 pl-4 pr-12 text-sm font-mono"
                />
                <span className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-xs text-[#5a6e90] font-bold">%</span>
              </div>
              <p className="text-[10px] text-[#5a6e90] font-semibold">อัตราภาษี 7% รวมอยู่ในราคาสินค้าหรือคำนวณในใบเสร็จ</p>
            </div>

            {/* Reward Points Config */}
            <div className="space-y-2">
              <label className="admin-label flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#fbbf24]" /> อัตราคะแนนสะสม (Points Conversion Rate)
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="1"
                  value={pointsRate}
                  onChange={(e) => setPointsRate(e.target.value)}
                  className="admin-input w-full py-3 pl-4 pr-24 text-sm font-mono"
                />
                <span className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-[10px] text-[#5a6e90] font-bold">บาท / 1 แต้ม</span>
              </div>
              <p className="text-[10px] text-[#5a6e90] font-semibold">เช่น ซื้อสินค้าครบ 100 บาท จะได้รับคะแนนสะสม 1 คะแนน</p>
            </div>

            {/* PromptPay Number */}
            <div className="space-y-2">
              <label className="admin-label flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-[#22e5ff]" /> เบอร์ PromptPay รับชำระเงินของร้านค้า
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="เช่น 0812345678 หรือ เลขผู้เสียภาษี 13 หลัก"
                  value={promptpayNumber}
                  onChange={(e) => setPromptpayNumber(e.target.value)}
                  className="admin-input w-full py-3 pl-4 pr-12 text-sm font-mono"
                />
                <span className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-xs text-[#5a6e90] font-bold">PromptPay</span>
              </div>
              <p className="text-[10px] text-[#5a6e90] font-semibold">ใช้สำหรับสร้าง QR Code ชำระเงินในขั้นตอน Checkout และตรวจสอบสลิป</p>
            </div>

            {/* Low Stock Warning Config */}
            <div className="space-y-2">
              <label className="admin-label flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-[#fb7185]" /> เกณฑ์สินค้าใกล้หมด (Low Stock Threshold)
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="1"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  className="admin-input w-full py-3 pl-4 pr-12 text-sm font-mono"
                />
                <span className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-xs text-[#5a6e90] font-bold">ขวด/ชิ้น</span>
              </div>
              <p className="text-[10px] text-[#5a6e90] font-semibold">แจ้งเตือนสินค้าสต็อกต่ำหากจำนวนคงเหลือในคลังน้อยกว่าเกณฑ์นี้</p>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-[rgba(255,255,255,0.08)] flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="admin-btn-primary px-8 py-3.5 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(34,229,255,0.3)]"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  กำลังบันทึกข้อมูลเข้า FastAPI...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  บันทึกการตั้งค่าร้านค้า
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
