'use client'

import { useState, useEffect } from 'react'
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react'
import {
  Printer,
  Download,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Grid,
  Sparkles,
  CheckCircle2,
  Wine,
  Layers,
  Info,
  Smartphone
} from 'lucide-react'

export default function QRCodePage() {
  const [selectedTable, setSelectedTable] = useState(1)
  const [copiedTable, setCopiedTable] = useState<number | null>(null)
  const [printMode, setPrintMode] = useState<'single' | 'all'>('single')
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const getMenuUrl = (tableNo: number) => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/menu?table=${tableNo}`
    }
    return `https://admin-pos-wine.vercel.app/menu?table=${tableNo}`
  }

  const copyUrl = async (tableNo: number) => {
    const url = getMenuUrl(tableNo)
    try {
      await navigator.clipboard.writeText(url)
      setCopiedTable(tableNo)
      setTimeout(() => setCopiedTable(null), 2000)
    } catch {}
  }

  const handlePrintSingle = (tableNo: number) => {
    setSelectedTable(tableNo)
    setPrintMode('single')
    setTimeout(() => {
      window.print()
    }, 120)
  }

  const handlePrintAll = () => {
    setPrintMode('all')
    setTimeout(() => {
      window.print()
    }, 120)
  }

  const handleDownloadQR = (tableNo: number) => {
    if (typeof document === 'undefined') return
    const canvas = document.getElementById(`qr-canvas-${tableNo}`) as HTMLCanvasElement | null
    if (!canvas) return
    const pngUrl = canvas.toDataURL('image/png')
    const downloadLink = document.createElement('a')
    downloadLink.href = pngUrl
    downloadLink.download = `TheBottleClub_Table_${tableNo < 10 ? '0' + tableNo : tableNo}_QR.png`
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
  }

  // Reusable Table Stand Tent Card Component
  const TableStandCard = ({ tableNo, isPrint = false }: { tableNo: number; isPrint?: boolean }) => {
    const formattedTable = tableNo < 10 ? `0${tableNo}` : `${tableNo}`
    const menuUrl = getMenuUrl(tableNo)

    return (
      <div
        className={`qr-stand-card ${isPrint ? 'is-print' : 'is-preview'}`}
        style={{
          width: '100%',
          maxWidth: 390,
          background: '#ffffff',
          color: '#0f172a',
          borderRadius: 22,
          padding: '24px 22px',
          boxSizing: 'border-box',
          textAlign: 'center',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          border: isPrint ? '2px solid #0f172a' : '2px solid rgba(0, 212, 255, 0.40)',
          boxShadow: isPrint
            ? 'none'
            : '0 20px 45px -10px rgba(0, 212, 255, 0.20), 0 0 25px rgba(0, 0, 0, 0.4)',
          position: 'relative',
        }}
      >
        {/* Cut line helper indicator for acrylic stand insertion */}
        {isPrint && (
          <div
            style={{
              position: 'absolute',
              top: -16,
              left: 0,
              right: 0,
              fontSize: 9,
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              fontFamily: 'sans-serif'
            }}
          >
            <span>✂️ ตัดตามขอบเพื่อใส่แท่นวางอะคริลิค (Cut along border for Acrylic Stand)</span>
          </div>
        )}

        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
          <img
            src="/thebottleclub.jpg"
            alt="The Bottle Club"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              objectFit: 'contain',
              border: '1.5px solid #0f172a',
              background: '#0f172a',
              flexShrink: 0
            }}
            onError={(e) => {
              // Fallback if image fails
              (e.target as HTMLElement).style.display = 'none'
            }}
          />
          <div style={{ textAlign: 'left' }}>
            <div
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 16,
                fontWeight: 900,
                letterSpacing: '0.04em',
                color: '#0f172a',
                lineHeight: 1.1,
                textTransform: 'uppercase'
              }}
            >
              The Bottle Club
            </div>
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.12em',
                color: '#64748b',
                textTransform: 'uppercase',
                marginTop: 2
              }}
            >
              Wine Bar & Smart Dining
            </div>
          </div>
        </div>

        {/* Table Number Badge */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff',
            borderRadius: 14,
            padding: '8px 18px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: '1px solid #334155'
          }}
        >
          <div style={{ textAlign: 'left' }}>
            <span
              style={{
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: '0.1em',
                color: '#94a3b8',
                textTransform: 'uppercase',
                display: 'block'
              }}
            >
              TABLE NO.
            </span>
            <span style={{ fontSize: 13, fontWeight: 900, color: '#f8fafc' }}>
              โต๊ะอาหาร
            </span>
          </div>
          <div
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 34,
              fontWeight: 900,
              letterSpacing: '-0.03em',
              color: '#fbbf24',
              lineHeight: 1
            }}
          >
            {formattedTable}
          </div>
        </div>

        {/* High Resolution Vector QR Code */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#ffffff',
            padding: 12,
            borderRadius: 16,
            border: '1.5px solid #cbd5e1',
            boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
            marginBottom: 14
          }}
        >
          <QRCodeSVG
            value={menuUrl}
            size={200}
            level="H"
            includeMargin={false}
          />
        </div>

        {/* Primary Call to Action */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
            สแกนเพื่อสั่งอาหารและเครื่องดื่ม
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginTop: 3 }}>
            Scan QR Code to View Menu & Order
          </div>
        </div>

        {/* 3 Step Ordering Instructions */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: '10px 14px',
            marginBottom: 14,
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: 99,
                background: '#0f172a',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                fontWeight: 800,
                flexShrink: 0
              }}
            >
              1
            </span>
            <span>เปิดกล้องมือถือ หรือ LINE สแกน QR</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: 99,
                background: '#0f172a',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                fontWeight: 800,
                flexShrink: 0
              }}
            >
              2
            </span>
            <span>เลือกอาหาร เครื่องดื่ม และไวน์ที่ชอบ</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 600, color: '#334155' }}>
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: 99,
                background: '#0f172a',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                fontWeight: 800,
                flexShrink: 0
              }}
            >
              3
            </span>
            <span>กดยืนยันออเดอร์ บริการเสิร์ฟตรงถึงโต๊ะนี้</span>
          </div>
        </div>

        {/* Footer info: Wi-Fi & URL */}
        <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: 10, textAlign: 'center' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 10,
              fontWeight: 700,
              color: '#475569',
              marginBottom: 4
            }}
          >
            <span>📶 Wi-Fi: TheBottleClub_Guest</span>
            <span>🔔 มีข้อสงสัยเรียกพนักงานได้เลย</span>
          </div>
          <div
            style={{
              fontSize: 9,
              fontFamily: "'JetBrains Mono', monospace",
              color: '#94a3b8',
              wordBreak: 'break-all',
              textAlign: 'center'
            }}
          >
            {menuUrl}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* ══════════════════════════════════════════════════
          1. ON-SCREEN UI (Hidden when printing via CSS)
          ══════════════════════════════════════════════════ */}
      <div className="qr-screen-ui animate-in" style={{ padding: '10px 0 40px', maxWidth: 1000, margin: '0 auto' }}>
        
        {/* Page Title & Breadcrumb */}
        <div style={{ marginBottom: 24, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{
                background: 'rgba(0, 212, 255, 0.12)',
                color: '#22e5ff',
                padding: '3px 10px',
                borderRadius: 99,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.05em',
                border: '1px solid rgba(0, 212, 255, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5
              }}>
                <Sparkles size={12} /> TABLE STAND PRINT SYSTEM
              </span>
            </div>
            <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.5rem', fontWeight: 900, color: '#eef2ff', letterSpacing: '-0.025em', margin: 0 }}>
              📱 พิมพ์ QR Code แท่นวางบนโต๊ะอาหาร (โต๊ะ 1 - 10)
            </h1>
            <p style={{ color: '#94a3b8', fontSize: 13, fontWeight: 500, marginTop: 4 }}>
              พิมพ์ป้าย QR Code ขนาดมาตรฐานสำหรับใส่แท่นอะคริลิคตั้งโต๊ะ เพื่อให้ลูกค้าสแกนสั่งอาหารและไวน์ได้อย่างแม่นยำ
            </p>
          </div>

          {/* Top Quick Actions */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => handlePrintSingle(selectedTable)}
              className="admin-btn-primary"
              style={{
                padding: '9px 18px',
                fontSize: 13,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                borderRadius: 12,
                boxShadow: '0 4px 15px rgba(0, 212, 255, 0.25)'
              }}
            >
              <Printer size={16} />
              พิมพ์โต๊ะ {selectedTable}
            </button>

            <button
              onClick={handlePrintAll}
              className="admin-btn-secondary"
              style={{
                padding: '9px 18px',
                fontSize: 13,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                borderRadius: 12,
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'rgba(255, 255, 255, 0.05)'
              }}
            >
              <Layers size={16} />
              พิมพ์ครบทุกโต๊ะ (1 - 10)
            </button>
          </div>
        </div>

        {/* Main Grid: Left Controls / Right Stand Mockup */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24, alignItems: 'start' }}>
          
          {/* LEFT: Table Selection & Action Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {/* Table Selection Grid */}
            <div className="admin-panel" style={{ padding: 22, borderRadius: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ color: '#eef2ff', fontWeight: 800, fontSize: 13, margin: 0, display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <Grid size={16} style={{ color: '#22e5ff' }} />
                  เลือกโต๊ะที่ต้องการพิมพ์ (โต๊ะ 1 - 10)
                </h3>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#22e5ff' }}>
                  โต๊ะปัจจุบัน: {selectedTable}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map(num => {
                  const isActive = selectedTable === num
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setSelectedTable(num)}
                      className="cursor-pointer transition-all"
                      style={{
                        padding: '12px 6px',
                        borderRadius: 14,
                        fontSize: 13,
                        fontWeight: 900,
                        border: '1px solid',
                        textAlign: 'center',
                        background: isActive
                          ? 'linear-gradient(135deg, rgba(0, 212, 255, 0.25), rgba(0, 196, 180, 0.20))'
                          : 'rgba(255, 255, 255, 0.03)',
                        borderColor: isActive ? '#00d4ff' : 'rgba(255, 255, 255, 0.08)',
                        color: isActive ? '#22e5ff' : '#94a3b8',
                        boxShadow: isActive ? '0 0 20px rgba(0, 212, 255, 0.35)' : 'none',
                        transform: isActive ? 'scale(1.03)' : 'scale(1)'
                      }}
                    >
                      <div>โต๊ะ</div>
                      <div style={{ fontSize: 18, marginTop: 2, fontFamily: "'Outfit', sans-serif" }}>{num}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* URL & Action Tools */}
            <div className="admin-panel" style={{ padding: 22, borderRadius: 20 }}>
              <h3 style={{ color: '#eef2ff', fontWeight: 800, fontSize: 13, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                🔗 ลิงก์เมนูออนไลน์สำหรับโต๊ะ {selectedTable}
              </h3>

              {/* URL Display Box */}
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 12,
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 16
                }}
              >
                <span
                  style={{
                    flex: 1,
                    fontSize: 12,
                    fontFamily: "'JetBrains Mono', monospace",
                    color: '#94a3b8',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {getMenuUrl(selectedTable)}
                </span>

                <button
                  type="button"
                  onClick={() => copyUrl(selectedTable)}
                  title="คัดลอกลิงก์"
                  style={{
                    background: copiedTable === selectedTable ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid',
                    borderColor: copiedTable === selectedTable ? '#34d399' : 'rgba(255, 255, 255, 0.15)',
                    borderRadius: 8,
                    padding: '6px 10px',
                    color: copiedTable === selectedTable ? '#34d399' : '#e2e8f0',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  {copiedTable === selectedTable ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedTable === selectedTable ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                <button
                  type="button"
                  onClick={() => handlePrintSingle(selectedTable)}
                  className="admin-btn-primary"
                  style={{
                    padding: '12px 14px',
                    fontSize: 12,
                    fontWeight: 800,
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    cursor: 'pointer'
                  }}
                >
                  <Printer size={15} />
                  พิมพ์โต๊ะ {selectedTable}
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadQR(selectedTable)}
                  className="admin-btn-secondary"
                  style={{
                    padding: '12px 14px',
                    fontSize: 12,
                    fontWeight: 800,
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    cursor: 'pointer'
                  }}
                >
                  <Download size={15} />
                  บันทึกรูป PNG
                </button>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <a
                  href={getMenuUrl(selectedTable)}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    flex: 1,
                    textDecoration: 'none',
                    padding: '10px 14px',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#94a3b8',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  <ExternalLink size={14} />
                  ทดสอบเปิดหน้าสั่งอาหารโต๊ะ {selectedTable}
                </a>
              </div>
            </div>

            {/* Acrylic Stand Info / Help card */}
            <div
              style={{
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: 16,
                padding: '16px 18px',
                display: 'flex',
                gap: 12
              }}
            >
              <Info size={20} style={{ color: '#818cf8', flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.6 }}>
                <strong style={{ color: '#ffffff', display: 'block', marginBottom: 2 }}>คำแนะนำการนำไปใส่แท่นวางบนโต๊ะ:</strong>
                รองรับแท่นวางอะคริลิคขนาดมาตรฐาน (A5, 4x6" หรือ 5x7") สามารถกดพิมพ์แล้วนำกระดาษมาตัดตามเส้นขอบเพื่อใส่แท่นวาง หรือเลือก "พิมพ์ครบทุกโต๊ะ" เพื่อพิมพ์รวดเดียว 10 แผ่น
              </div>
            </div>

          </div>

          {/* RIGHT: Live Stand Mockup Preview */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontSize: 12, fontWeight: 700 }}>
              <span>🔍 ตัวอย่างแท่นวางขนาดจริง (Live Stand Preview)</span>
            </div>

            {/* Stand Outer Mockup Frame */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 30,
                padding: '24px 18px',
                width: '100%',
                maxWidth: 430,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5)'
              }}
            >
              <TableStandCard tableNo={selectedTable} isPrint={false} />

              <div style={{ marginTop: 18, display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => handlePrintSingle(selectedTable)}
                  className="admin-btn-primary"
                  style={{
                    padding: '8px 20px',
                    fontSize: 12,
                    fontWeight: 800,
                    borderRadius: 99,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer'
                  }}
                >
                  <Printer size={14} /> พิมพ์ป้ายโต๊ะนี้
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ══════════════════════════════════════════════════
          2. PRINT-ONLY CONTAINER (Rendered only on print)
          ══════════════════════════════════════════════════ */}
      <div className="qr-print-container">
        {printMode === 'single' ? (
          <div className="qr-stand-page">
            <TableStandCard tableNo={selectedTable} isPrint={true} />
          </div>
        ) : (
          Array.from({ length: 10 }, (_, i) => i + 1).map((tableNo, index) => (
            <div
              key={tableNo}
              className={`qr-stand-page ${index < 9 ? 'page-break' : ''}`}
            >
              <TableStandCard tableNo={tableNo} isPrint={true} />
            </div>
          ))
        )}
      </div>

      {/* ══════════════════════════════════════════════════
          3. HIDDEN CANVASES FOR PNG DOWNLOAD
          ══════════════════════════════════════════════════ */}
      {isMounted && (
        <div style={{ display: 'none' }} aria-hidden="true">
          {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
            <QRCodeCanvas
              key={num}
              id={`qr-canvas-${num}`}
              value={getMenuUrl(num)}
              size={800}
              level="H"
              includeMargin={true}
            />
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          4. PRINT STYLES
          ══════════════════════════════════════════════════ */}
      <style>{`
        @media screen {
          .qr-print-container {
            display: none !important;
          }
        }

        @media print {
          @page {
            size: auto;
            margin: 10mm;
          }

          /* Hide on-screen interface completely */
          .qr-screen-ui {
            display: none !important;
          }

          /* Ensure print container is shown cleanly */
          .qr-print-container {
            display: block !important;
            width: 100% !important;
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .qr-stand-page {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            min-height: 94vh !important;
            padding: 20px 0 !important;
            box-sizing: border-box !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .qr-stand-page.page-break {
            page-break-after: always !important;
            break-after: page !important;
          }

          .qr-stand-card.is-print {
            border: 2px solid #0f172a !important;
            box-shadow: none !important;
            margin: auto !important;
          }
        }
      `}</style>
    </>
  )
}
