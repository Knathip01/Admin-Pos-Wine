'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import OrderStatusBadge from '@/components/admin/OrderStatusBadge'
import { ArrowLeft, Printer, Wine, User, CreditCard, Loader2, AlertCircle } from 'lucide-react'
import { ordersApi } from '@/lib/api/orders'
import { useApiAuth, ensureApiAuth } from '@/lib/store/api-auth'
import type { OrderResponse } from '@/lib/api/types'

export default function OrderDetailPage() {
  const params = useParams()
  const orderId = Number(params.id)
  const { accessToken } = useApiAuth()
  const [order, setOrder] = useState<OrderResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const token = accessToken || await ensureApiAuth()
        if (!token) throw new Error('ไม่สามารถเชื่อมต่อ API ได้')
        const data = await ordersApi.get(orderId, token)
        setOrder(data)
      } catch (err: any) {
        setError(err.message || 'ไม่พบข้อมูลออเดอร์')
      } finally {
        setLoading(false)
      }
    }
    if (orderId) load()
  }, [orderId, accessToken])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#22e5ff]" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto p-10 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-[#fb7185] mx-auto" />
        <p className="text-[#fb7185] font-bold">{error || 'ไม่พบออเดอร์'}</p>
        <Link href="/admin/orders" className="text-[#22e5ff] text-sm font-bold hover:underline">
          ย้อนกลับไปหน้ารายการออเดอร์
        </Link>
      </div>
    )
  }

  const items = order.items ?? []
  const grandTotal = Number(order.total_amount ?? 0)
  const subtotal = Number(order.subtotal ?? grandTotal)
  const discount = Number(order.discount_amount ?? 0)
  const tax = Number(order.tax_amount ?? 0)

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in" style={{ padding: '10px 0' }}>
      <div className="flex items-center justify-between">
        <Link
          href="/admin/orders"
          className="flex items-center space-x-2 text-xs font-bold text-[#22e5ff] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ย้อนกลับไปหน้ารายการออเดอร์</span>
        </Link>
        <button
          onClick={() => window.print()}
          className="admin-btn-secondary text-xs px-4 py-2 flex items-center space-x-2 font-bold cursor-pointer"
        >
          <Printer className="w-4 h-4 text-[#22e5ff]" />
          <span>พิมพ์ใบเสร็จ (Print Receipt)</span>
        </button>
      </div>

      <div className="admin-panel p-8 rounded-3xl space-y-6">
        <div className="text-center pb-6 border-b border-white/10 space-y-1">
          <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-3 border border-[rgba(0,212,255,0.30)] bg-[rgba(0,212,255,0.10)] shadow-[0_0_20px_rgba(0,212,255,0.20)]">
            <Wine className="w-7 h-7 text-[#22e5ff]" />
          </div>
          <h2 className="text-xl font-black text-[#eef2ff]" style={{ fontFamily: "'Outfit', sans-serif" }}>THE BOTTLE CLUB</h2>
          <p className="text-xs text-[#94a3c4] font-medium">ร้านจำหน่ายไวน์และเครื่องดื่มพรีเมียม (Wine & Spirits)</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-[rgba(255,255,255,0.02)] border border-white/5 text-xs">
          <div>
            <div className="text-[#5a6e90] font-semibold">เลขที่ออเดอร์:</div>
            <div className="font-mono font-bold text-[#eef2ff] mt-0.5">{order.order_number ?? `#${order.id}`}</div>
          </div>
          <div>
            <div className="text-[#5a6e90] font-semibold">ลูกค้า:</div>
            <div className="font-bold text-[#fbbf24] mt-0.5">{order.customer_name ?? 'Walk-in Customer'}</div>
          </div>
          <div>
            <div className="text-[#5a6e90] font-semibold">สถานะ:</div>
            <div className="mt-0.5">
              <OrderStatusBadge status={order.status} />
            </div>
          </div>
          <div>
            <div className="text-[#5a6e90] font-semibold">วันที่ / เวลา:</div>
            <div className="text-[#94a3c4] mt-0.5 font-medium">
              {new Date(order.created_at).toLocaleString('th-TH')}
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-[#5a6e90] uppercase tracking-wider mb-3">รายการสินค้าในบิล:</h3>
          <div className="overflow-x-auto rounded-xl border border-white/5">
            <table className="w-full text-left text-xs text-[#94a3c4]">
              <thead className="bg-[rgba(255,255,255,0.03)] text-[#5a6e90] font-bold uppercase tracking-wider border-b border-white/5">
                <tr>
                  <th className="p-3">สินค้า</th>
                  <th className="p-3 text-center">จำนวน</th>
                  <th className="p-3 text-right">ราคา/หน่วย</th>
                  <th className="p-3 text-right">ส่วนลด</th>
                  <th className="p-3 text-right">รวมเป็นเงิน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-[rgba(0,212,255,0.02)] transition-colors">
                    <td className="p-3 font-bold text-[#eef2ff]">{item.product_name ?? `Product #${item.product_id}`}</td>
                    <td className="p-3 text-center font-mono text-[#eef2ff] font-semibold">{item.quantity}</td>
                    <td className="p-3 text-right font-mono font-medium">฿{item.unit_price.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono text-[#fb7185] font-semibold">
                      -฿{(item.discount_amount ?? 0).toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono font-extrabold text-[#22e5ff]">
                      ฿{item.line_total.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-6 pt-4 border-t border-white/10 text-xs">
          <div className="space-y-2 max-w-xs">
            {order.notes && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
                <span className="font-bold">หมายเหตุ:</span> {order.notes}
              </div>
            )}
            {order.cashier_name && (
              <div className="flex items-center space-x-2 text-[#94a3c4]">
                <User className="w-4 h-4 text-[#22e5ff]" />
                <span>แคชเชียร์: <strong className="text-[#eef2ff]">{order.cashier_name}</strong></span>
              </div>
            )}
          </div>

          <div className="w-full sm:w-64 space-y-2 bg-[rgba(255,255,255,0.02)] p-4 rounded-2xl border border-white/5">
            <div className="flex justify-between text-[#94a3c4]">
              <span>ยอดรวมสินค้า:</span>
              <span className="font-mono font-bold text-[#eef2ff]">฿{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[#fb7185]">
              <span>ส่วนลดรวม:</span>
              <span className="font-mono font-bold">-฿{discount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[#94a3c4]">
              <span>ภาษีมูลค่าเพิ่ม (VAT 7%):</span>
              <span className="font-mono text-[#5a6e90]">฿{tax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-white/10 text-base font-extrabold">
              <span className="text-[#eef2ff]">ยอดสุทธิ:</span>
              <span className="font-mono font-black text-[#22e5ff]" style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20 }}>฿{grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
