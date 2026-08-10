import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const MODEL = 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

interface RealProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  cost?: number;
  country?: string;
  vintage?: string;
}

interface RealSale {
  id: string;
  receipt_no: string;
  total_amount: number;
  status: string;
  created_at: string;
}

/* ─── Fetch REAL Live Data from Supabase — NO fake fallback ─── */
async function fetchAdminContext() {
  let posProducts: RealProduct[] = [];
  let totalPosRevenue = 0;
  let totalPosOrders = 0;
  let isConnected = false;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return {
      pos: {
        status: 'ไม่ได้เชื่อมต่อฐานข้อมูล (ไม่มี Supabase credentials)',
        products: [] as RealProduct[],
        totalProducts: 0,
        totalRevenue: 0,
        totalOrders: 0,
        isConnected: false,
      },
      webWine: {
        status: 'ไม่ได้เชื่อมต่อฐานข้อมูล',
        products: [] as RealProduct[],
        totalProducts: 0,
        totalRevenue: 0,
      }
    };
  }

  try {
    const prodRes = await fetch(
      `${SUPABASE_URL}/rest/v1/products?select=id,name,price,stock,cost,country,vintage&order=name.asc`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        cache: 'no-store'
      }
    );

    if (prodRes.ok) {
      const data = await prodRes.json();
      if (Array.isArray(data)) {
        posProducts = data.map((p: any) => ({
          id: p.id,
          name: p.name,
          price: parseFloat(p.price || 0),
          stock: parseInt(p.stock || 0),
          cost: parseFloat(p.cost || 0),
          country: p.country || '',
          vintage: p.vintage || ''
        }));
        isConnected = true;
      }
    }

    const salesRes = await fetch(
      `${SUPABASE_URL}/rest/v1/sales?select=id,receipt_no,total_amount,status,created_at&status=eq.paid`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        cache: 'no-store'
      }
    );

    if (salesRes.ok) {
      const salesData: RealSale[] = await salesRes.json();
      if (Array.isArray(salesData)) {
        totalPosRevenue = salesData.reduce(
          (sum, s) => sum + (parseFloat(s.total_amount as any) || 0), 0
        );
        totalPosOrders = salesData.length;
        isConnected = true;
      }
    }
  } catch (err) {
    console.warn('Supabase fetch error:', err);
  }

  return {
    pos: {
      status: isConnected
        ? 'เชื่อมต่อฐานข้อมูลจริง (Supabase)'
        : 'เชื่อมต่อไม่สำเร็จ ไม่มีข้อมูล',
      products: posProducts,
      totalProducts: posProducts.length,
      totalRevenue: totalPosRevenue,
      totalOrders: totalPosOrders,
      isConnected,
    },
    webWine: {
      status: 'ยังไม่ได้เชื่อมต่อฐานข้อมูล Web Wine E-Com',
      products: [] as RealProduct[],
      totalProducts: 0,
      totalRevenue: 0,
    }
  };
}

function buildContext(ctx: Awaited<ReturnType<typeof fetchAdminContext>>) {
  const thb = (n: number) => `฿${n.toLocaleString('th-TH')}`;
  const rev = ctx.pos.totalRevenue;
  const cogs = Math.round(rev * 0.55);
  const opex = Math.round(rev * 0.15);
  const totalExp = cogs + opex;
  const netProfit = rev - totalExp;

  const posProdText = ctx.pos.products.length > 0
    ? ctx.pos.products.map(p =>
        `• ${p.name} (ราคา ${thb(p.price)}, สต็อก ${p.stock} ชิ้น${p.country ? `, ${p.country} ${p.vintage}` : ''})`
      ).join('\n')
    : '• ไม่มีข้อมูลสินค้าในระบบ';

  return [
    `=== 🖥️ 1. ข้อมูล POS หน้าร้าน ===`,
    `สถานะ: ${ctx.pos.status}`,
    `จำนวนสินค้า: ${ctx.pos.totalProducts} รายการ`,
    `ยอดขาย POS: ${thb(rev)} (${ctx.pos.totalOrders} ออเดอร์สำเร็จ)`,
    `รายการสินค้า:\n${posProdText}`,
    ``,
    `=== 🍷 2. Web Wine E-Commerce ===`,
    `สถานะ: ${ctx.webWine.status}`,
    `จำนวนสินค้า: 0 รายการ`,
    ``,
    `=== 📊 3. สรุปการเงิน ===`,
    `รายรับรวม: ${thb(rev)}`,
    `ต้นทุนสินค้าประมาณการ (55%): ${thb(cogs)}`,
    `ค่าดำเนินงานประมาณการ (15%): ${thb(opex)}`,
    `รวมค่าใช้จ่าย: ${thb(totalExp)}`,
    `กำไรสุทธิประมาณการ: ${thb(netProfit)}`,
  ].join('\n');
}

function cleanReply(raw: string): string {
  let text = raw
    .replace(/\*\s*Input:[\s\S]*?(?=\n[A-Z*]|\n\n|$)/g, '')
    .replace(/\*\s*Context:[\s\S]*?(?=\n[A-Z*]|\n\n|$)/g, '')
    .replace(/\*\s*Goal:[\s\S]*?(?=\n[A-Z*]|\n\n|$)/g, '')
    .replace(/\*\s*Draft \d+[\s\S]*?(?=\n[A-Z*]|\n\n|$)/g, '')
    .replace(/\*\s*Self-Correction[\s\S]*?(?=\n[A-Z*]|\n\n|$)/g, '')
    .replace(/\(Internal Monologue\)[\s\S]*?(?=\n\n|$)/g, '')
    .trim();

  const lines = text.split('\n').filter(l => l.trim().length > 0);
  if (lines.length === 0) return raw.trim();

  const firstGoodIdx = lines.findIndex(l =>
    /[ก-๙]/.test(l) || l.startsWith('•') || l.startsWith('-') || l.match(/^\d\./)
  );

  return firstGoodIdx >= 0 ? lines.slice(firstGoodIdx).join('\n').trim() : text;
}

export async function POST(request: NextRequest) {
  const { messages } = await request.json() as {
    messages: { role: 'user' | 'model'; text: string }[];
  };

  if (!messages?.length) {
    return NextResponse.json({ error: 'messages required' }, { status: 400 });
  }

  // Require Gemini API key — no silent fallback
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY ยังไม่ได้ตั้งค่า กรุณาเพิ่ม Environment Variable ใน Vercel' },
      { status: 503 }
    );
  }

  const ctx = await fetchAdminContext();
  const ctxText = buildContext(ctx);

  const SYSTEM_USER = `You are "Bottle AI" — AI assistant for The Bottle Club admin system.

STRICT RULES:
1. ตอบเป็นภาษาไทยเท่านั้น
2. ใช้เฉพาะข้อมูลจริงที่ได้รับด้านล่าง ห้ามแต่งข้อมูลขึ้นมาเอง
3. ถ้าไม่มีข้อมูลให้บอกตรงๆ ว่า "ไม่มีข้อมูล" หรือ "ยังไม่มีข้อมูลในระบบ"
4. ห้ามเดาหรือสร้างตัวเลข ราคา หรือสินค้าที่ไม่มีในข้อมูลที่ให้มา

ข้อมูลระบบจริง ณ ขณะนี้:
${ctxText}`;

  const SYSTEM_MODEL = `รับทราบครับ ผม Bottle AI จะตอบโดยใช้ข้อมูลจริงจากระบบเท่านั้น ถ้าไม่มีข้อมูลจะแจ้งให้ทราบครับ`;

  const contents = [
    { role: 'user',  parts: [{ text: SYSTEM_USER  }] },
    { role: 'model', parts: [{ text: SYSTEM_MODEL }] },
    ...messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
  ];

  try {
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.2,
          topP: 0.85,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Gemini API error:', res.status, errText);
      return NextResponse.json(
        { error: `Gemini API error ${res.status} — กรุณาตรวจสอบ GEMINI_API_KEY` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const reply = cleanReply(raw) || 'ไม่สามารถสร้างคำตอบได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง';

    return NextResponse.json({ reply, isLiveData: ctx.pos.isConnected, ctx });
  } catch (e: any) {
    console.error('AI chat error:', e);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการเชื่อมต่อ Gemini API' },
      { status: 500 }
    );
  }
}
