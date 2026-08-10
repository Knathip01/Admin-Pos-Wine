'use client'

import React from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge'
import { INITIAL_SALES } from '@/lib/mock-data'
import { ArrowLeft, Printer, Wine, CheckCircle2, User, CreditCard } from 'lucide-react'

export default function OrderDetailPage() {
  const params = useParams()
  const saleId = params.id as string
  const sale = INITIAL_SALES.find((s) => s.id === saleId) || INITIAL_SALES[0]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/orders"
          className="flex items-center space-x-2 text-xs font-semibold text-[#d4af37] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ย้อนกลับไปหน้ารายการออเดอร์</span>
        </Link>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 rounded-xl bg-[#221e33] border border-[#d4af37]/40 text-xs font-bold text-white flex items-center space-x-2 hover:bg-[#2d2842]"
        >
          <Printer className="w-4 h-4 text-[#d4af37]" />
          <span>พิมพ์ใบเสร็จ (Print Receipt)</span>
        </button>
      </div>

      {/* Printable Receipt Container */}
      <div className="glass-panel p-8 rounded-3xl border border-[#d4af37]/40 bg-[#181622] shadow-2xl space-y-6">
        {/* Receipt Header */}
        <div className="text-center pb-6 border-b border-gray-800 space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-[#8b0000] mx-auto flex items-center justify-center mb-2 border border-[#d4af37]/40">
            <Wine className="w-7 h-7 text-[#d4af37]" />
          </div>
          <h2 className="text-xl font-extrabold text-gold-gradient">The Bottle Club</h2>
          <p className="text-xs text-gray-400">ร้านจำหน่ายไวน์และเครื่องดื่มพรีเมียม (Wine & Spirits)</p>
          <p className="text-[11px] text-gray-500 font-mono">เลขประจำตัวผู้เสียภาษี: 0105566778899 (VAT 7%)</p>
        </div>

        {/* Invoice Meta */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-[#100e17] border border-gray-800 text-xs">
          <div>
            <div className="text-gray-500">เลขที่ใบเสร็จ:</div>
            <div className="font-mono font-bold text-white mt-0.5">{sale.receipt_no}</div>
          </div>
          <div>
            <div className="text-gray-500">หมายเลขโต๊ะ / โซน:</div>
            <div className="font-bold text-amber-200 mt-0.5">{sale.table_no || 'หน้าร้านทั่วไป'}</div>
          </div>
          <div>
            <div className="text-gray-500">สถานะชำระเงิน:</div>
            <div className="mt-0.5">
              <OrderStatusBadge status={sale.status} />
            </div>
          </div>
          <div>
            <div className="text-gray-500">วันที่ / เวลา:</div>
            <div className="text-gray-300 mt-0.5">
              {new Date(sale.created_at).toLocaleString('th-TH')}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div>
          <h3 className="text-sm font-bold text-white mb-3">รายการสินค้าในบิล:</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-[#100e17] text-gray-400 font-semibold border-b border-gray-800">
                <tr>
                  <th className="p-3">สินค้า</th>
                  <th className="p-3 text-center">จำนวน</th>
                  <th className="p-3 text-right">ราคา/หน่วย</th>
                  <th className="p-3 text-right">ส่วนลด</th>
                  <th className="p-3 text-right">รวมเป็นเงิน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {sale.sale_items?.map((item) => (
                  <tr key={item.id}>
                    <td className="p-3 font-semibold text-white">{item.product_name}</td>
                    <td className="p-3 text-center font-mono">{item.quantity}</td>
                    <td className="p-3 text-right font-mono">฿{item.unit_price.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono text-red-400">
                      -฿{item.discount_amount.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-[#d4af37]">
                      ฿{item.line_total.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Breakdown */}
        <div className="flex flex-col sm:flex-row justify-between gap-6 pt-4 border-t border-gray-800 text-xs">
          <div className="space-y-2 max-w-xs">
            {sale.discount_note && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
                <span className="font-bold">หมายเหตุส่วนลด:</span> {sale.discount_note}
              </div>
            )}
            <div className="flex items-center space-x-2 text-gray-400">
              <CreditCard className="w-4 h-4 text-[#d4af37]" />
              <span>ชำระผ่าน: <strong className="text-white uppercase">{sale.payment_method}</strong></span>
            </div>
            <div className="flex items-center space-x-2 text-gray-400">
              <User className="w-4 h-4 text-[#d4af37]" />
              <span>แต้มสะสมสมาชิกที่ได้รับ: <strong className="text-emerald-400">+{sale.points_earned} แต้ม</strong></span>
            </div>
          </div>

          <div className="w-full sm:w-64 space-y-2 bg-[#100e17] p-4 rounded-2xl border border-gray-800">
            <div className="flex justify-between text-gray-400">
              <span>ยอดรวมสินค้า:</span>
              <span className="font-mono font-bold text-white">฿{sale.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-red-400">
              <span>ส่วนลดรวม:</span>
              <span className="font-mono font-bold">-฿{sale.discount_amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>ภาษีมูลค่าเพิ่ม (VAT 7%):</span>
              <span className="font-mono text-gray-300">฿{sale.tax_amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-700 text-base font-extrabold">
              <span className="text-white">ยอดสุทธิ:</span>
              <span className="text-gold-gradient font-mono">฿{sale.total_amount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
