'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { QRCodeSVG } from 'qrcode.react'
// @ts-ignore – promptpay-qr has no TS declarations
import generatePayload from 'promptpay-qr'
import {
  ShoppingBag, CheckCircle2, XCircle, Loader2, RefreshCw,
  CreditCard, Banknote, Smartphone, QrCode, ArrowLeft, AlertCircle,
  Wine, User, ChevronDown, ChevronRight, BadgeCheck, Copy, Check,
  Settings2
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const parseNote = (noteStr?: string | null) => {
  if (!noteStr) return { cleanNote: '', slipUrl: '', isServed: false }
  let isServed = false
  let cleanNote = noteStr
  
  if (cleanNote.includes(' | SERVED')) {
    isServed = true
    cleanNote = cleanNote.replace(' | SERVED', '')
  } else if (cleanNote === 'SERVED') {
    isServed = true
    cleanNote = ''
  }

  const parts = cleanNote.split(' | SLIP:')
  if (parts.length > 1) {
    return { cleanNote: parts[0].trim(), slipUrl: parts[1].trim(), isServed }
  }
  if (cleanNote.startsWith('SLIP:')) {
    return { cleanNote: '', slipUrl: cleanNote.replace('SLIP:', '').trim(), isServed }
  }
  return { cleanNote, slipUrl: '', isServed }
}

interface SaleItem {
  id: string
  product_id: string | null
  product_name: string
  unit_price: number
  quantity: number
  line_total: number
  sku?: string
}

interface PendingSale {
  id: string
  receipt_no: string
  created_at: string
  status: 'pending' | 'paid' | 'completed'
  total_amount: number
  subtotal: number
  discount_amount: number
  note?: string
  table_no?: string | null
  customer_id?: string
  customers?: { full_name: string; phone?: string; member_code?: string } | null
  sale_items?: SaleItem[]
}

type PaymentMethod = 'cash' | 'transfer' | 'qr' | 'card'

export default function BillingPage() {
  const supabase = createClient()
  const router = useRouter()
  const [sales, setSales] = useState<PendingSale[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'pending' | 'paid' | 'completed'>('pending')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Payment modal
  const [selectedSale, setSelectedSale] = useState<PendingSale | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [cashReceived, setCashReceived] = useState('')
  const [referenceNo, setReferenceNo] = useState('')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [successId, setSuccessId] = useState<string | null>(null)
  const [activeSlipUrl, setActiveSlipUrl] = useState<string | null>(null)

  // PromptPay settings
  const [promptPayId, setPromptPayId] = useState('')
  const [bankAccountName, setBankAccountName] = useState('')
  const [promptPayQR, setPromptPayQR] = useState('')
  const [copiedRef, setCopiedRef] = useState(false)

  const loadPending = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true)
    try {
      const statusToQuery = activeTab === 'completed' ? 'paid' : activeTab
      const [{ data: rawSalesData }, { data: settingsData }] = await Promise.all([
        supabase
          .from('sales')
          .select('*, sale_items(*)')
          .eq('status', statusToQuery)
          .order('created_at', { ascending: false }),
        supabase
          .from('settings')
          .select('key, value')
          .in('key', ['promptpay_id', 'bank_account_name'])
      ])

      let salesData: any[] = rawSalesData || []

      if (activeTab === 'paid') {
        salesData = salesData.filter(sale => !parseNote(sale.note).isServed)
      } else if (activeTab === 'completed') {
        salesData = salesData.filter(sale => parseNote(sale.note).isServed)
      }
      
      const customerIds = [...new Set(salesData.map(s => s.customer_id).filter(Boolean))]
      if (customerIds.length > 0) {
        const { data: customersData } = await supabase
          .from('customers')
          .select('id, full_name, phone, member_code')
          .in('id', customerIds)
          
        if (customersData) {
          salesData = salesData.map(sale => ({
            ...sale,
            customers: customersData.find(c => c.id === sale.customer_id) || null
          }))
        }
      }

      setSales(salesData as PendingSale[])

      const ppId = settingsData?.find(s => s.key === 'promptpay_id')?.value || '0922809619'
      const bankName = settingsData?.find(s => s.key === 'bank_account_name')?.value || 'บัญชีร้านค้า'
      setPromptPayId(ppId)
      setBankAccountName(bankName)
    } catch (err) {
      console.error('Error loading billing:', err)
    } finally {
      if (isInitial) setLoading(false)
    }
  }, [supabase, activeTab])

  useEffect(() => {
    loadPending(true)
  }, [loadPending, activeTab])

  useEffect(() => {
    const interval = setInterval(() => {
      loadPending(false)
    }, 5000)

    const channel = supabase
      .channel('sales_realtime_billing')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sales' },
        () => {
          loadPending(false)
        }
      )
      .subscribe()

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [supabase, loadPending])

  useEffect(() => {
    if (selectedSale && paymentMethod === 'qr' && promptPayId) {
      try {
        const payload = generatePayload(promptPayId, { amount: selectedSale.total_amount })
        setPromptPayQR(payload)
      } catch {
        setPromptPayQR('')
      }
    } else {
      setPromptPayQR('')
    }
  }, [selectedSale, paymentMethod, promptPayId])

  const openPayment = (sale: PendingSale) => {
    setSelectedSale(sale)
    const { slipUrl } = parseNote(sale.note)
    setPaymentMethod(slipUrl ? 'qr' : 'cash')
    setCashReceived('')
    setReferenceNo('')
    setError('')
  }

  const cancelOrder = async (saleId: string) => {
    if (!confirm('ยกเลิกออเดอร์นี้?')) return
    await supabase.from('sales').update({ status: 'cancelled' }).eq('id', saleId)
    loadPending()
  }

  const confirmPayment = async () => {
    if (!selectedSale) return
    setProcessing(true)
    setError('')

    const total = selectedSale.total_amount
    const cashAmt = parseFloat(cashReceived) || 0

    if (paymentMethod === 'cash' && cashAmt < total) {
      setError(`รับเงินไม่พอ ขาดอีก ${formatCurrency(total - cashAmt)}`)
      setProcessing(false)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()

      await supabase.from('sales').update({
        status: 'paid',
        cashier_id: user?.id || null,
        payment_method: paymentMethod,
        cash_received: paymentMethod === 'cash' ? cashAmt : null,
        change_amount: paymentMethod === 'cash' ? Math.max(0, cashAmt - total) : 0,
      }).eq('id', selectedSale.id)

      await supabase.from('payments').insert({
        sale_id: selectedSale.id,
        payment_method: paymentMethod,
        amount: total,
        reference_no: referenceNo || null
      })

      if (selectedSale.sale_items?.length) {
        for (const item of selectedSale.sale_items) {
          const productId = item.product_id
          if (!productId) continue
          const { data: prod } = await supabase.from('products').select('id, stock').eq('id', productId).single()
          if (prod) {
            const newStock = Math.max(0, (prod.stock || 0) - item.quantity)
            await supabase.from('products').update({ stock: newStock }).eq('id', prod.id)
            await supabase.from('inventory_movements').insert({
              product_id: prod.id,
              movement_type: 'out',
              quantity: -item.quantity,
              quantity_before: prod.stock,
              quantity_after: newStock,
              reference_type: 'sale',
              reference_id: selectedSale.id,
              note: `ชำระบิล: ${selectedSale.receipt_no}`,
              created_by: user?.id || null
            })
          }
        }
      }

      setSuccessId(selectedSale.id)
      setSelectedSale(null)
      setTimeout(() => { 
        setSuccessId(null)
        loadPending()
      }, 1500)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
    } finally {
      setProcessing(false)
    }
  }

  const cashAmt = parseFloat(cashReceived) || 0
  const changeAmt = selectedSale ? Math.max(0, cashAmt - selectedSale.total_amount) : 0
  const canPay = selectedSale && (paymentMethod !== 'cash' || cashAmt >= selectedSale.total_amount)

  const timeSince = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'เพิ่งสั่ง'
    if (mins < 60) return `${mins} นาทีที่แล้ว`
    return `${Math.floor(mins / 60)} ชั่วโมงที่แล้ว`
  }

  const copyRef = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedRef(true)
    setTimeout(() => setCopiedRef(false), 2000)
  }

  return (
    <div className="animate-in" style={{ padding: '28px', maxWidth: '1500px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 className="font-display text-2xl font-bold text-white mb-1">รับชำระบิล (Admin Project POS)</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            {loading ? 'กำลังโหลด...' : activeTab === 'pending' ? `${sales.length} ออเดอร์รอชำระ` : activeTab === 'paid' ? `${sales.length} ออเดอร์กำลังเตรียม` : `${sales.length} ออเดอร์เสิร์ฟสำเร็จ`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {!promptPayId && (
            <Link href="/admin/settings" style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', cursor: 'pointer' }}>
                <Settings2 size={14} style={{ color: '#fcd34d' }} />
                <span style={{ fontSize: 12, color: '#fcd34d', fontWeight: 500 }}>ตั้งค่า PromptPay</span>
              </div>
            </Link>
          )}
          {promptPayId && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}>
              <QrCode size={14} style={{ color: '#4ade80' }} />
              <span style={{ fontSize: 12, color: '#4ade80', fontWeight: 500 }}>PromptPay: {promptPayId}</span>
            </div>
          )}
          <button onClick={() => loadPending(true)} disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-secondary)' }}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            รีเฟรช
          </button>
        </div>
      </div>

      {/* Workflow Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, borderBottom: '1px solid var(--border-color)', paddingBottom: 12 }}>
        {([
          { key: 'pending', label: '⏳ รอตรวจสอบ/ชำระเงิน' },
          { key: 'paid', label: '🍷 กำลังเตรียมสินค้า (Cashier)' },
          { key: 'completed', label: '✅ เสิร์ฟเสร็จสิ้น' }
        ] as { key: 'pending' | 'paid' | 'completed'; label: string }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              padding: '10px 18px',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid',
              transition: 'all 0.2s',
              background: activeTab === t.key ? 'linear-gradient(135deg, var(--wine-600), var(--wine-400))' : 'var(--bg-card)',
              borderColor: activeTab === t.key ? 'transparent' : 'var(--border-color)',
              color: activeTab === t.key ? 'white' : 'var(--text-secondary)',
              boxShadow: activeTab === t.key ? '0 4px 15px rgba(139,26,44,0.3)' : 'none'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Success Banner */}
      {successId && (
        <div className="flex items-center gap-3 p-4 rounded-2xl mb-6 animate-in"
          style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)' }}>
          <BadgeCheck size={22} style={{ color: '#4ade80' }} />
          <p style={{ color: '#4ade80', fontWeight: 600 }}>✅ รับชำระเงินสำเร็จ! ตัดสต๊อกเรียบร้อย</p>
        </div>
      )}

      {/* Orders Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 size={36} className="animate-spin mb-3" style={{ color: 'var(--wine-400)' }} />
          <p style={{ color: 'var(--text-muted)' }}>กำลังโหลดข้อมูล...</p>
        </div>
      ) : sales.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(139,26,44,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <ShoppingBag size={36} style={{ color: 'var(--wine-500)', opacity: 0.4 }} />
          </div>
          <p className="font-semibold text-white mb-2">
            {activeTab === 'pending' ? 'ไม่มีออเดอร์รอชำระ' : activeTab === 'paid' ? 'ไม่มีออเดอร์กำลังเตรียม' : 'ไม่มีออเดอร์เสิร์ฟสำเร็จ'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {sales.map(sale => {
            const { cleanNote, slipUrl } = parseNote(sale.note)
            return (
              <div key={sale.id} className="glass-card animate-in" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                        {sale.status === 'pending' && (
                          <span className="badge" style={{ background: 'rgba(245,158,11,0.15)', color: '#fcd34d', borderColor: 'rgba(245,158,11,0.3)', fontSize: 11 }}>⏳ รอชำระ</span>
                        )}
                        {sale.status === 'paid' && !parseNote(sale.note).isServed && (
                          <span className="badge" style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', borderColor: 'rgba(34,197,94,0.3)', fontSize: 11 }}>🟢 กำลังเตรียม</span>
                        )}
                        {sale.status === 'paid' && parseNote(sale.note).isServed && (
                          <span className="badge" style={{ background: 'rgba(56,189,248,0.15)', color: '#38bdf8', borderColor: 'rgba(56,189,248,0.3)', fontSize: 11 }}>🔵 เสิร์ฟแล้ว</span>
                        )}
                        
                        {sale.table_no ? (
                          <span className="badge" style={{ background: 'rgba(139,26,44,0.25)', color: 'var(--gold-400)', borderColor: 'rgba(212,175,55,0.4)', fontSize: 11, fontWeight: 700 }}>
                            🍷 โต๊ะ {sale.table_no}
                          </span>
                        ) : (
                          <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)', borderColor: 'var(--border-color)', fontSize: 11 }}>
                            🛍 หน้าร้าน
                          </span>
                        )}

                        {slipUrl && (
                          <span className="badge" style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', borderColor: 'rgba(34,197,94,0.3)', fontSize: 11, fontWeight: 600 }}>
                            📎 แนบสลิปแล้ว
                          </span>
                        )}

                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{timeSince(sale.created_at)}</span>
                      </div>
                      <p className="font-display font-bold text-white" style={{ fontSize: 16 }}>#{sale.receipt_no}</p>
                    </div>
                    <p style={{ color: 'var(--gold-400)', fontWeight: 800, fontSize: 22 }}>{formatCurrency(sale.total_amount)}</p>
                  </div>
                  {sale.customers && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '8px 12px' }}>
                      <User size={13} style={{ color: 'var(--wine-300)', flexShrink: 0 }} />
                      <div>
                        <p style={{ color: 'white', fontSize: 13, fontWeight: 500 }}>{sale.customers.full_name}</p>
                        {sale.customers.phone && <p style={{ color: 'var(--text-muted)', fontSize: 11 }}>{sale.customers.phone}</p>}
                      </div>
                    </div>
                  )}
                  {cleanNote && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, fontStyle: 'italic' }}>📝 {cleanNote}</p>}
                </div>

                <button onClick={() => setExpandedId(expandedId === sale.id ? null : sale.id)}
                  style={{ width: '100%', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>รายการสินค้า ({sale.sale_items?.length || 0} รายการ)</span>
                  {expandedId === sale.id ? <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} /> : <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />}
                </button>

                {expandedId === sale.id && (
                  <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-color)' }}>
                    {(sale.sale_items || []).map(item => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(139,26,44,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Wine size={12} style={{ color: 'var(--wine-400)' }} />
                          </div>
                          <div>
                            <p style={{ fontSize: 13, color: 'white', fontWeight: 500 }}>{item.product_name}</p>
                            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatCurrency(item.unit_price)} × {item.quantity}</p>
                          </div>
                        </div>
                        <p style={{ color: 'var(--gold-400)', fontWeight: 600, fontSize: 13 }}>{formatCurrency(item.line_total)}</p>
                      </div>
                    ))}

                    {slipUrl && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-color)' }}>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 8 }}>📄 สลิปการชำระเงินที่แนบมา (คลิกดูรูปใหญ่):</p>
                        <div style={{ borderRadius: 12, overflow: 'hidden', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', display: 'inline-block', padding: 8 }}>
                          <img
                            src={slipUrl}
                            alt="Customer Slip"
                            style={{ maxHeight: 200, maxWidth: '100%', objectFit: 'contain', cursor: 'pointer', borderRadius: 8 }}
                            onClick={() => setActiveSlipUrl(slipUrl)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {slipUrl && (
                  <div style={{ padding: '0 20px 6px 20px' }}>
                    <button onClick={() => setActiveSlipUrl(slipUrl)}
                      style={{ width: '100%', padding: '10px', borderRadius: 12, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.08)', color: '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      📄 ตรวจสอบรูปภาพสลิป
                    </button>
                  </div>
                )}

                <div style={{ padding: '14px 20px', display: 'flex', gap: 8 }}>
                  {sale.status === 'pending' ? (
                    <>
                      <button onClick={() => cancelOrder(sale.id)}
                        style={{ flex: 1, padding: '10px', borderRadius: 12, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <XCircle size={14} /> ยกเลิก
                      </button>
                      <button onClick={() => openPayment(sale)} className="btn-wine"
                        style={{ flex: 2, padding: '10px', borderRadius: 12, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <CreditCard size={15} /> รับชำระ {formatCurrency(sale.total_amount)}
                      </button>
                    </>
                  ) : (sale.status === 'paid' && !parseNote(sale.note).isServed) ? (
                    <div style={{ width: '100%', padding: '10px 14px', borderRadius: 12, fontSize: 13, fontWeight: 600, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#fcd34d', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      ⏳ กำลังเตรียมสินค้า (รอ Cashier ดำเนินการเสิร์ฟ)
                    </div>
                  ) : (
                    <div style={{ width: '100%', padding: '10px 14px', borderRadius: 12, fontSize: 13, fontWeight: 600, background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      ✅ ส่งโต๊ะและทำรายการเสร็จสิ้นแล้ว
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Payment Modal */}
      {selectedSale && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div className="glass-card w-full" style={{ maxWidth: 460, maxHeight: '92vh', overflow: 'auto' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => setSelectedSale(null)} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <ArrowLeft size={18} />
              </button>
              <div>
                <h2 className="font-display font-bold text-white" style={{ fontSize: 18 }}>รับชำระเงิน (Real Supabase)</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>#{selectedSale.receipt_no}</p>
              </div>
            </div>

            <div style={{ padding: '20px 22px' }}>
              <div style={{ textAlign: 'center', padding: '18px', borderRadius: 16, background: 'linear-gradient(135deg, rgba(139,26,44,0.25), rgba(212,175,55,0.1))', border: '1px solid rgba(139,26,44,0.35)', marginBottom: 20 }}>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>ยอดที่ต้องชำระ</p>
                <p className="font-display" style={{ fontSize: 44, fontWeight: 900, color: 'var(--gold-400)', lineHeight: 1 }}>
                  {formatCurrency(selectedSale.total_amount)}
                </p>
              </div>

              {/* Payment Methods */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {([
                    { key: 'cash', icon: <Banknote size={18} />, label: 'เงินสด' },
                    { key: 'qr', icon: <QrCode size={18} />, label: 'PromptPay' },
                    { key: 'transfer', icon: <Smartphone size={18} />, label: 'โอน' },
                    { key: 'card', icon: <CreditCard size={18} />, label: 'บัตร' },
                  ] as { key: PaymentMethod; icon: React.ReactNode; label: string }[]).map(m => (
                    <button key={m.key} onClick={() => setPaymentMethod(m.key)}
                      style={{
                        padding: '11px 6px', borderRadius: 12, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: '1px solid', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                        background: paymentMethod === m.key ? 'linear-gradient(135deg, var(--wine-600), var(--wine-400))' : 'var(--bg-card)',
                        borderColor: paymentMethod === m.key ? 'transparent' : 'var(--border-color)',
                        color: paymentMethod === m.key ? 'white' : 'var(--text-secondary)',
                      }}>
                      {m.icon} {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === 'cash' && (
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: 8 }}>รับเงินมา (บาท)</label>
                  <input
                    type="number"
                    className="wine-input"
                    style={{ fontSize: 20, fontWeight: 800, textAlign: 'center' }}
                    placeholder="0.00"
                    value={cashReceived}
                    onChange={e => setCashReceived(e.target.value)}
                    autoFocus
                  />
                  {cashAmt >= selectedSale.total_amount && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: 12, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', marginTop: 14 }}>
                      <span style={{ color: '#86efac', fontSize: 14, fontWeight: 500 }}>🪙 เงินทอน</span>
                      <span style={{ color: '#4ade80', fontWeight: 900, fontSize: 24 }}>{formatCurrency(changeAmt)}</span>
                    </div>
                  )}
                </div>
              )}

              {paymentMethod === 'qr' && promptPayQR && (
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div style={{ background: 'white', borderRadius: 20, padding: 20, display: 'inline-block', marginBottom: 12 }}>
                    <QRCodeSVG value={promptPayQR} size={200} level="M" />
                  </div>
                  <p style={{ color: 'var(--gold-400)', fontWeight: 900, fontSize: 24 }}>{formatCurrency(selectedSale.total_amount)}</p>
                </div>
              )}

              {error && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '12px 14px', borderRadius: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', marginBottom: 16 }}>
                  <AlertCircle size={15} style={{ color: '#fca5a5' }} />
                  <p style={{ color: '#fca5a5', fontSize: 13 }}>{error}</p>
                </div>
              )}

              <button
                onClick={confirmPayment}
                disabled={!canPay || processing}
                className="btn-wine"
                style={{ width: '100%', padding: '16px', fontSize: 15, fontWeight: 800, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: !canPay || processing ? 0.45 : 1 }}>
                {processing ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
                {processing ? 'กำลังบันทึก...' : `ยืนยันรับชำระ ${formatCurrency(selectedSale.total_amount)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slip Preview Modal */}
      {activeSlipUrl && (
        <div 
          onClick={() => setActiveSlipUrl(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 16, cursor: 'zoom-out' }}
        >
          <div style={{ maxWidth: '90vw', maxHeight: '80vh' }} onClick={e => e.stopPropagation()}>
            <img src={activeSlipUrl} alt="Slip Full View" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: 12 }} />
          </div>
        </div>
      )}
    </div>
  )
}
