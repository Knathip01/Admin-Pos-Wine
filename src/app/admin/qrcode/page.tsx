'use client'

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { QrCode, ExternalLink, Download, Printer, Smartphone, Wine, Copy, Check, Grid } from 'lucide-react'

export default function QRCodePage() {
  const [selectedTable, setSelectedTable] = useState(1)
  const [copiedTable, setCopiedTable] = useState<number | null>(null)

  const getMenuUrl = (tableNo: number) => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/menu?table=${tableNo}`
    }
    return `http://localhost:3000/menu?table=${tableNo}`
  }

  const copyUrl = async (tableNo: number) => {
    const url = getMenuUrl(tableNo)
    await navigator.clipboard.writeText(url)
    setCopiedTable(tableNo)
    setTimeout(() => setCopiedTable(null), 2000)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="animate-in" style={{ padding: '20px', maxWidth: 1280, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.4rem', fontWeight: 900, color: '#eef2ff', letterSpacing: '-0.025em', margin: 0 }}>
          📱 QR Code ประจำโต๊ะลูกค้า (โต๊ะ 1 - 10)
        </h1>
        <p style={{ color: '#3d4d6a', fontSize: 13, fontWeight: 600, marginTop: 4 }}>
          สร้างบาร์โค้ดเฉพาะสำหรับแต่ละโต๊ะ เพื่อให้ลูกค้าระบุโต๊ะและสั่งซื้อสินค้าได้อย่างถูกต้อง
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24, maxWidth: 800, margin: '0 auto' }} className="qr-layout-grid">
        
        {/* LEFT COLUMN: Table List & Table Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Table Select Grid */}
          <div className="admin-panel" style={{ padding: 20 }}>
            <h3 style={{ color: '#eef2ff', fontWeight: 800, fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <Grid size={16} style={{ color: '#22e5ff' }} />
              เลือกโต๊ะที่ต้องการจัดการ
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                <button
                  key={num}
                  onClick={() => setSelectedTable(num)}
                  className="cursor-pointer transition-all"
                  style={{
                    padding: '14px 10px',
                    borderRadius: 12,
                    fontSize: 13,
                    fontWeight: 800,
                    border: '1px solid',
                    textAlign: 'center',
                    background: selectedTable === num ? 'linear-gradient(135deg, rgba(0,212,255,0.22), rgba(0,196,180,0.15))' : 'rgba(255,255,255,0.02)',
                    borderColor: selectedTable === num ? 'rgba(0,212,255,0.40)' : 'rgba(255,255,255,0.07)',
                    color: selectedTable === num ? '#22e5ff' : '#5a6e90',
                    boxShadow: selectedTable === num ? '0 0 15px rgba(0,212,255,0.20)' : 'none'
                  }}
                >
                  โต๊ะ {num}
                </button>
              ))}
            </div>
          </div>

          {/* QR Card Preview for Selected Table */}
          <div className="admin-panel" style={{ padding: 32, textAlign: 'center' }}>
            <span style={{ background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.30)', color: '#22e5ff', padding: '4px 14px', borderRadius: 99, fontSize: 11, fontWeight: 800, display: 'inline-block', marginBottom: 16, letterSpacing: '0.05em' }}>
              ACTIVE: โต๊ะ {selectedTable}
            </span>

            {/* QR Print Target Wrapper */}
            <div id="qr-print-area" style={{ display: 'inline-block', background: 'white', borderRadius: 20, padding: 24, marginBottom: 20, boxShadow: '0 0 35px rgba(0,212,255,0.25)' }}>
              <QRCodeSVG
                value={getMenuUrl(selectedTable)}
                size={220}
                level="H"
              />
              <div style={{ marginTop: 12, color: 'black', fontFamily: 'sans-serif' }}>
                <p style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>โต๊ะ {selectedTable}</p>
                <p style={{ fontSize: 11, color: '#666', margin: '4px 0 0', fontWeight: 600 }}>สแกนเพื่อสั่งสินค้า</p>
              </div>
            </div>

            {/* URL Display */}
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, border: '1px solid rgba(255,255,255,0.08)', maxWidth: 440, margin: '0 auto 16px' }}>
              <span style={{ flex: 1, fontSize: 12, color: '#94a3c4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left', fontWeight: 600 }}>
                {getMenuUrl(selectedTable)}
              </span>
              <button onClick={() => copyUrl(selectedTable)} style={{ color: copiedTable === selectedTable ? '#34d399' : '#3d4d6a', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                {copiedTable === selectedTable ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>

            {/* Print and Open buttons */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={handlePrint} className="admin-btn-primary px-5 py-2.5 text-xs font-bold flex items-center gap-2 cursor-pointer">
                <Printer size={15} />
                พิมพ์รหัส QR โต๊ะ {selectedTable}
              </button>
              <a href={getMenuUrl(selectedTable)} target="_blank" rel="noreferrer" className="admin-btn-secondary px-5 py-2.5 text-xs font-bold flex items-center gap-2 cursor-pointer" style={{ textDecoration: 'none' }}>
                <ExternalLink size={15} />
                ทดสอบสั่ง
              </a>
            </div>
          </div>
        </div>

      </div>

      {/* Print-only CSS style override */}
      <style>{`
        @media print {
          body { background: white !important; }
          .qr-layout-grid { display: block !important; }
          .admin-panel, #qr-print-area { background: white !important; border: none !important; box-shadow: none !important; padding: 0 !important; }
          .qr-layout-grid > div:last-child { display: none !important; }
          .admin-panel > button, .admin-panel > div:first-child, .admin-panel > div:last-child, h1, p, span { display: none !important; }
          #qr-print-area { display: block !important; margin: 40px auto !important; text-align: center !important; }
        }
      `}</style>
    </div>
  )
}

