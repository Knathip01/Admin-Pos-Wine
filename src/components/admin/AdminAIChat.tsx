'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X, Send, User, ChevronDown, Sparkles,
  TrendingUp, Package, AlertTriangle, BarChart3,
  Loader2, RefreshCw, Wifi, WifiOff, Database, ShoppingCart,
} from 'lucide-react';
import CartoonBottleIcon from '@/components/icons/CartoonBottleIcon';

/* ─── Types ─── */
interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  ts: Date;
  isError?: boolean;
}

/* ─── Error messages in Thai ─── */
const ERROR_MESSAGES: Record<string, string> = {
  quota_exceeded: '⚠️ AI ใช้งานเกิน quota วันนี้แล้วครับ\nจะรีเซ็ตใหม่พรุ่งนี้ กรุณาลองใหม่พรุ่งนี้',
  unavailable:    '⚠️ เซิร์ฟเวอร์ AI ยุ่งอยู่ครับ กรุณารอสักครู่แล้วลองใหม่',
  api_error:      '⚠️ เกิดข้อผิดพลาดจาก AI service กรุณาลองใหม่อีกครั้ง',
  internal_error: '⚠️ เกิดข้อผิดพลาดภายในระบบ กรุณา refresh หน้าแล้วลองใหม่',
};

/* ─── Quick actions (Super Admin Executive Suite) ─── */
const QUICK = [
  { icon: BarChart3,     label: '💰 สรุปยอดขาย & การเงิน',     text: 'สรุปภาพรวมยอดขายทั้ง 2 ช่องทาง ทั้ง POS (Supabase) และ Web Wine (API) ให้หน่อยครับ' },
  { icon: User,          label: '👤 รายงาน & ยอดแคชเชียร์',    text: 'ขอรายงานการปฏิบัติงานและผลงานยอดขายของแคชเชียร์ทั้งหมดครับ' },
  { icon: TrendingUp,    label: '📋 ตรวจสอบ 4 แผนก',           text: 'ขอดูรายงานความเรียบร้อยของทั้ง 4 แผนก (Cashier, Stock, Kitchen, Bar) ครับ' },
  { icon: Package,       label: '📦 สต็อก & สินค้าขายดี',        text: 'ขอวิเคราะห์สต็อกสินค้าหน้าร้าน สินค้าขายดี และสินค้าที่ต้องเติมสต็อกครับ' },
  { icon: ShoppingCart,  label: '🍷 สินค้า & ออเดอร์ออนไลน์',    text: 'ขอทราบข้อมูลสินค้าออนไลน์และคำสั่งซื้อในระบบ Web Wine API ครับ' },
  { icon: Sparkles,      label: '💡 คำแนะนำกลยุทธ์ร้าน',        text: 'ในฐานะผู้ช่วย Super Admin มีคำแนะนำกลยุทธ์เพิ่มยอดขายหรือปรับปรุงการดำเนินงานอย่างไรบ้างครับ' },
];

/* ─── Simple markdown-lite renderer ─── */
function MsgText({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (!line.trim()) return <br key={i} />;
        // Bold **text**
        const parts = line.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
          p.startsWith('**') && p.endsWith('**')
            ? <strong key={j} className="font-semibold">{p.slice(2, -2)}</strong>
            : p
        );
        const isBullet = /^[-•]/.test(line.trim());
        return (
          <p key={i} className={`leading-relaxed ${isBullet ? 'pl-2' : ''}`}>
            {isBullet && <span className="mr-1.5 opacity-60">•</span>}
            {isBullet ? parts.map((p, j) => typeof p === 'string' ? p.replace(/^[-•]\s*/, '') : p) : parts}
          </p>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════ */
export default function AdminAIChat() {
  const [open, setOpen]         = useState(false);
  const [msgs, setMsgs]         = useState<Message[]>([]);
  const [input, setInput]       = useState('');
  const [busy, setBusy]         = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'live' | 'sample'>('connecting');
  const [dot, setDot]           = useState(true);        // pulse dot on button
  const endRef   = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Simulate connection check when chat is opened
  useEffect(() => {
    if (open) {
      if (connectionStatus === 'connecting') {
        const timer = setTimeout(() => {
          setConnectionStatus('connected');
        }, 1000);
        return () => clearTimeout(timer);
      }
    } else {
      setConnectionStatus('connecting');
    }
  }, [open, connectionStatus]);

  /* hide pulse after 6s */
  useEffect(() => { const t = setTimeout(() => setDot(false), 6000); return () => clearTimeout(t); }, []);

  /* scroll to bottom */
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, busy]);

  /* focus on open */
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 200); }, [open]);

  /* ── Dragging logic ── */
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!open) {
      setPosition({ x: 0, y: 0 });
    }
  }, [open]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('input')) {
      return;
    }
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const x = e.clientX - dragStart.current.x;
    const y = e.clientY - dragStart.current.y;
    setPosition({ x, y });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  /* greeting */
  useEffect(() => {
    if (open && msgs.length === 0) {
      setMsgs([{
        id: 'g0',
        role: 'model',
        text: 'สวัสดีครับ! ผม **Bottle Club AI** 🍷✨\n\nระบบเชื่อมต่อดึงข้อมูลสดพร้อมกันจาก 2 แหล่ง:\n• 🖥️ **POS Store:** ข้อมูลสินค้า, ยอดขาย 16 บิล, พนักงาน, รายงานความเรียบร้อย (จาก **Supabase**)\n• 🍷 **Web Wine:** หมวดหมู่สินค้า 5 หมวด, คำสั่งซื้อออนไลน์, สมาชิก (จาก **Wayneven API**)\n\nกดปุ่มคำถามด่วนด้านล่าง หรือพิมพ์คำถามที่ต้องการได้เลยครับ!',
        ts: new Date(),
      }]);
    }
  }, [open]);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || busy) return;
    const userMsg: Message = { id: `u${Date.now()}`, role: 'user', text: text.trim(), ts: new Date() };
    setMsgs(prev => [...prev, userMsg]);
    setInput('');
    setBusy(true);

    try {
      // Build history (exclude greeting)
      const history = [...msgs, userMsg]
        .filter(m => m.id !== 'g0' && !m.isError)
        .map(m => ({ role: m.role, text: m.text }));

      const res  = await fetch('/api/admin/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json();

      if (!res.ok) {
        const errKey = data.error as string;
        setMsgs(prev => [...prev, {
          id: `e${Date.now()}`, role: 'model', isError: true,
          text: ERROR_MESSAGES[errKey] ?? ERROR_MESSAGES.api_error,
          ts: new Date(),
        }]);
        return;
      }

      if (data.isLiveData !== undefined) {
        setConnectionStatus(data.isLiveData ? 'live' : 'sample');
      }
      setMsgs(prev => [...prev, {
        id: `m${Date.now()}`, role: 'model',
        text: data.reply, ts: new Date(),
      }]);
    } catch {
      setMsgs(prev => [...prev, {
        id: `e${Date.now()}`, role: 'model', isError: true,
        text: ERROR_MESSAGES.internal_error, ts: new Date(),
      }]);
    } finally {
      setBusy(false);
    }
  }, [msgs, busy]);

  const hSubmit = (e?: React.FormEvent) => { e?.preventDefault(); send(input); };
  const fmt = (d: Date) => d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false });

  /* ── Floating Button ── */
  return (
    <>
      <button
        id="admin-ai-chat-btn"
        onClick={() => { setOpen(o => !o); setDot(false); }}
        title="Bottle AI — ผู้ช่วยวิเคราะห์ธุรกิจ"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl flex items-center justify-center select-none transition-all duration-300 hover:scale-110 active:scale-95"
        style={{
          background: open
            ? 'linear-gradient(135deg,#374151,#111827)'
            : 'linear-gradient(135deg,#ffffff 0%,#f5f5f5 100%)',
          border: open ? '1px solid rgba(255,255,255,0.1)' : '2px solid #c41e3a',
          boxShadow: open
            ? '0 8px 32px rgba(0,0,0,0.4)'
            : '0 8px 32px rgba(196,30,58,0.4), 0 2px 8px rgba(0,0,0,0.2)',
        }}
      >
        {open
          ? <X size={22} className="text-white" />
          : <>
              <CartoonBottleIcon size={44} />
              {dot && <span className="absolute top-1 right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />}
            </>
        }
      </button>

      {/* ── Chat Window ── */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 pointer-events-none"
          style={{
            animation: 'aiChatIn .28s cubic-bezier(.175,.885,.32,1.275)',
          }}
        >
          <div
            id="admin-ai-chat-window"
            className="pointer-events-auto flex flex-col rounded-2xl overflow-hidden"
            style={{
              width: 'min(420px, calc(100vw - 32px))', height: 'min(580px, calc(100dvh - 120px))',
              background: '#ffffff',
              boxShadow: '0 32px 80px rgba(0,0,0,0.2), 0 8px 24px rgba(196,30,58,0.1)',
              border: '1px solid rgba(0,0,0,0.08)',
              transform: `translate(${position.x}px, ${position.y}px)`,
            }}
          >
          {/* ── Header (จัดเรียงข้อความให้เป็นระเบียบ ไม่ตัดบรรทัด) ── */}
          <div
            style={{
              background: 'linear-gradient(135deg, #b91c1c 0%, #881337 100%)',
              touchAction: 'none',
            }}
            className="px-4 py-3 shrink-0 cursor-grab active:cursor-grabbing select-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {/* Row 1: Logo + Title + Super Admin Badge + Close Button */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden bg-white/95 border border-white/20 shrink-0 shadow-sm">
                  <CartoonBottleIcon size={26} />
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <p className="text-white font-extrabold text-sm leading-none whitespace-nowrap tracking-tight">Bottle Club AI</p>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap bg-amber-400/20 text-amber-200 border border-amber-300/40 shadow-sm">
                    <Sparkles size={10} className="text-amber-300 shrink-0" />
                    ผู้ช่วย Super Admin
                  </span>
                </div>
              </div>

              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-full hover:bg-white/15 transition-colors text-white shrink-0 cursor-pointer ml-1"
                title="ย่อหน้าต่างแชท"
              >
                <ChevronDown size={18} />
              </button>
            </div>

            {/* Row 2: Status Badges (Gemini 2.5 Flash • Supabase POS • Wayneven API) */}
            <div className="flex items-center gap-2 mt-2 ml-10.5 text-[10px]">
              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider bg-white/12 text-amber-200 border border-amber-300/30 whitespace-nowrap shadow-sm">
                Gemini 2.5 Flash
              </span>
              <span className="text-white/30 text-[9px]">•</span>
              <span className="inline-flex items-center gap-1.5 text-emerald-200 font-semibold whitespace-nowrap">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shrink-0" />
                Supabase POS
              </span>
              <span className="text-white/30 text-[9px]">•</span>
              <span className="inline-flex items-center gap-1.5 text-indigo-200 font-semibold whitespace-nowrap">
                <span className="w-1.5 h-1.5 bg-indigo-300 rounded-full animate-pulse shrink-0" />
                Wayneven API
              </span>
            </div>
          </div>

          {/* ── Quick Actions ── */}
          <div className="shrink-0 px-3 py-2 border-b overflow-x-auto"
               style={{ background: '#faf9f7', borderColor: 'rgba(0,0,0,0.06)' }}>
            <div className="flex gap-1.5">
              {QUICK.map(({ icon: Icon, label, text }) => (
                <button key={label} onClick={() => send(text)} disabled={busy}
                  className="flex items-center gap-1.5 whitespace-nowrap px-2.5 py-1.5 rounded-lg text-[10px] font-semibold shrink-0 transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
                  style={{ background: 'rgba(196,30,58,0.07)', color: '#9b1c2c', border: '1px solid rgba(196,30,58,0.15)' }}>
                  <Icon size={11} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Messages ── */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
               style={{ background: '#f7f5f3' }}>
            {msgs.map(msg => (
              <div key={msg.id}
                   className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                     style={msg.role === 'user'
                       ? { background: 'linear-gradient(135deg,#c41e3a,#7f1d1d)' }
                       : msg.isError
                         ? { background: '#fef2f2', border: '1px solid #fecaca' }
                         : { background: 'white', border: '1px solid rgba(196,30,58,0.15)', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }
                     }>
                  {msg.role === 'user'
                    ? <User size={13} className="text-white" />
                    : <CartoonBottleIcon size={13} style={{ color: msg.isError ? '#ef4444' : '#c41e3a' }} />
                  }
                </div>

                {/* Bubble */}
                <div className="max-w-[82%]">
                  <div className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                    msg.role === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'
                  }`}
                       style={msg.role === 'user'
                         ? { background: 'linear-gradient(135deg,#c41e3a,#9b1c2c)', color: 'white', boxShadow: '0 4px 12px rgba(196,30,58,0.3)' }
                         : msg.isError
                           ? { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }
                           : { background: 'white', color: '#1c1917', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }
                       }>
                    <MsgText text={msg.text} />
                  </div>
                  <p className={`text-[9px] mt-1 opacity-40 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {fmt(msg.ts)}
                  </p>
                </div>
              </div>
            ))}

            {/* Typing */}
            {busy && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                     style={{ background: 'white', border: '1px solid rgba(196,30,58,0.15)', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
                  <Loader2 size={13} className="animate-spin" style={{ color: '#c41e3a' }} />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white border flex items-center gap-1.5"
                     style={{ border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  {[0, 0.18, 0.36].map((d, i) => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                          style={{ background: '#c41e3a', animationDelay: `${d}s` }} />
                  ))}
                  <span className="text-[10px] text-stone-400 ml-1">AI กำลังคิด...</span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* ── Input ── */}
          <form onSubmit={hSubmit}
                className="flex items-center gap-2 px-3 py-3 shrink-0 border-t"
                style={{ background: 'white', borderColor: 'rgba(0,0,0,0.07)' }}>
            {/* Retry button if last msg is error */}
            {msgs.at(-1)?.isError && !busy && (
              <button type="button"
                      onClick={() => { const last = msgs.findLast(m => m.role === 'user'); if (last) send(last.text); }}
                      className="p-2 rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50 transition-all shrink-0"
                      title="ลองใหม่">
                <RefreshCw size={15} />
              </button>
            )}
            <input
              ref={inputRef}
              id="admin-ai-chat-input"
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={busy}
              placeholder={busy ? 'AI กำลังประมวลผลข้อมูล...' : 'ถามได้ทุกเรื่อง: ยอดขาย, แคชเชียร์, สต็อก, กลยุทธ์บริหาร...'}
              className="flex-1 text-xs px-4 py-2.5 rounded-full outline-none transition-all disabled:opacity-50"
              style={{ background: '#f5f3f0', border: '1.5px solid transparent', color: '#1c1917' }}
              onFocus={e  => (e.target.style.borderColor = 'rgba(196,30,58,0.4)')}
              onBlur={e   => (e.target.style.borderColor = 'transparent')}
            />
            <button type="submit" disabled={!input.trim() || busy}
                    className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 disabled:opacity-30 shrink-0"
                    style={{ background: 'linear-gradient(135deg,#c41e3a,#9b1c2c)', boxShadow: '0 4px 12px rgba(196,30,58,0.35)' }}>
              <Send size={15} className="text-white" style={{ transform: 'translateX(1px)' }} />
            </button>
          </form>
        </div>
      </div>
    )}

      <style>{`
        @keyframes aiChatIn {
          from { opacity:0; transform:translateY(20px) scale(.95); }
          to   { opacity:1; transform:translateY(0)    scale(1);   }
        }
        #admin-ai-chat-window { --scroll-color: rgba(196,30,58,0.15); }
        #admin-ai-chat-window ::-webkit-scrollbar { width:4px; }
        #admin-ai-chat-window ::-webkit-scrollbar-track { background:transparent; }
        #admin-ai-chat-window ::-webkit-scrollbar-thumb { background:var(--scroll-color); border-radius:4px; }
      `}</style>
    </>
  );
}
