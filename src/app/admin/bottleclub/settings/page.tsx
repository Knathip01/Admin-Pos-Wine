'use client';

import React, { useState } from 'react';
import { Settings, Save, CheckCircle2, Loader2, DollarSign, Percent, Award, AlertTriangle } from 'lucide-react';

export default function AdminSettingsPage() {
  // Config states
  const [shippingFee, setShippingFee] = useState('150');
  const [vatRate, setVatRate] = useState('7');
  const [pointsRate, setPointsRate] = useState('100'); // 100 THB = 1 point
  const [lowStockThreshold, setLowStockThreshold] = useState('10');

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    // Simulate saving settings
    setTimeout(() => {
      setSaving(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 1000);
  };

  return (
    <div className="space-y-6 max-w-3xl select-none font-sans mx-auto">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold font-serif text-stone-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-red-500" /> ตั้งค่าข้อมูลร้านค้า
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">กำหนดค่าธรรมเนียมจัดส่ง อัตราภาษีมูลค่าเพิ่ม และการแลกเปลี่ยนคะแนนสมาชิก</p>
        </div>
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-2 rounded-xl flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4.5 h-4.5" /> บันทึกการเปลี่ยนแปลงสำเร็จ!
          </div>
        )}
      </div>

      {/* Main Settings Form */}
      <div className="bg-stone-900 border border-white/5 rounded-2xl p-8 shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Shipping Config */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-purple-400" /> ค่าบริการจัดส่งสินค้า (Shipping Fee)
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="0"
                  value={shippingFee}
                  onChange={(e) => setShippingFee(e.target.value)}
                  className="w-full p-3.5 pl-4 pr-12 bg-stone-950 border border-white/10 rounded-xl text-stone-100 text-sm focus:outline-none focus:border-red-800 transition"
                />
                <span className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-xs text-stone-500 font-bold">บาท</span>
              </div>
            </div>

            {/* VAT Config */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-amber-500" /> อัตราภาษีมูลค่าเพิ่ม (VAT Rate)
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  value={vatRate}
                  onChange={(e) => setVatRate(e.target.value)}
                  className="w-full p-3.5 pl-4 pr-12 bg-stone-950 border border-white/10 rounded-xl text-stone-100 text-sm focus:outline-none focus:border-red-800 transition"
                />
                <span className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-xs text-stone-500 font-bold">%</span>
              </div>
            </div>

            {/* Reward Points Config */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-400" /> อัตราคะแนนสะสม (Points Conversion Rate)
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="1"
                  value={pointsRate}
                  onChange={(e) => setPointsRate(e.target.value)}
                  className="w-full p-3.5 pl-4 pr-18 bg-stone-950 border border-white/10 rounded-xl text-stone-100 text-sm focus:outline-none focus:border-red-800 transition"
                />
                <span className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-[10px] text-stone-500 font-bold">บาท / 1 แต้ม</span>
              </div>
              <p className="text-[10px] text-stone-600">เช่น ซื้อสินค้าครบ 100 บาท จะได้รับคะแนนสะสม 1 คะแนน</p>
            </div>

            {/* Low Stock Warning Config */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-400" /> เกณฑ์สินค้าใกล้หมด (Low Stock Threshold)
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="1"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  className="w-full p-3.5 pl-4 pr-12 bg-stone-950 border border-white/10 rounded-xl text-stone-100 text-sm focus:outline-none focus:border-red-800 transition"
                />
                <span className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-xs text-stone-500 font-bold">ชิ้น</span>
              </div>
              <p className="text-[10px] text-stone-600">แสดงการแจ้งเตือนสต็อกต่ำในการบริหารหากสินค้าเหลือน้อยกว่าค่าที่ระบุ</p>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 bg-red-800 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-950/20 flex items-center justify-center gap-2 cursor-pointer transition mt-4"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                กำลังบันทึกข้อมูล...
              </>
            ) : (
              <>
                <Save className="w-4.5 h-4.5" />
                บันทึกการตั้งค่า
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
