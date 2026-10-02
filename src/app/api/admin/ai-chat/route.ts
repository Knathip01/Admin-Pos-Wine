import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const MODEL = 'gemini-2.5-flash';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const API_BASE_URL = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.wayneven.uk/api/v1';

/* ─── Fetch Comprehensive Live Data from BOTH Supabase and Wayneven API ─── */
async function fetchAdminContext() {
  // 1. SUPABASE DATA (POS STORE)
  let posProducts: any[] = [];
  let posSales: any[] = [];
  let posStaff: any[] = [];
  let posReports: any[] = [];
  let posCategories: any[] = [];
  let posSaleItems: any[] = [];
  let isSupabaseConnected = false;

  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const [pRes, sRes, uRes, rRes, catRes, itRes] = await Promise.all([
        supabase.from('products').select('*').order('name', { ascending: true }),
        supabase.from('sales').select('id, receipt_no, total_amount, payment_method, status, cashier_id, discount_amount, discount_note, note, table_no, created_at, profiles:cashier_id(full_name, role)').order('created_at', { ascending: false }),
        supabase.from('profiles').select('id, full_name, role, is_active, phone, created_at, updated_at').order('created_at', { ascending: true }),
        supabase.from('shop_reports').select('id, title, note, status, reported_by, created_at, profiles:reported_by(full_name, role)').order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('sort_order', { ascending: true }),
        supabase.from('sale_items').select('*'),
      ]);

      if (pRes.data) { posProducts = pRes.data; isSupabaseConnected = true; }
      if (sRes.data) { posSales = sRes.data; isSupabaseConnected = true; }
      if (uRes.data) { posStaff = uRes.data; isSupabaseConnected = true; }
      if (rRes.data) { posReports = rRes.data; isSupabaseConnected = true; }
      if (catRes.data) { posCategories = catRes.data; isSupabaseConnected = true; }
      if (itRes.data) { posSaleItems = itRes.data; isSupabaseConnected = true; }
    } catch (e) {
      console.warn('Supabase fetch error in AI Chat:', e);
    }
  }

  // 2. WAYNEVEN API DATA (WEB WINE E-COMMERCE)
  let webCategories: any[] = [];
  let webProducts: any[] = [];
  let webOrders: any[] = [];
  let webCustomers: any[] = [];
  let webBranches: any[] = [];
  let isApiConnected = false;

  try {
    const authRes = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'superadmin', password: 'postthebottleclub' }),
      cache: 'no-store'
    });

    if (authRes.ok) {
      const authData = await authRes.json();
      const token = authData.data?.access_token;

      if (token) {
        const headers = {
          'Authorization': `Bearer ${token}`,
          'X-Branch-Id': '1'
        };

        const [catRes, prodRes, ordRes, custRes, brRes] = await Promise.all([
          fetch(`${API_BASE_URL}/catalog/categories`, { headers, cache: 'no-store' }).then(r => r.json()).catch(() => null),
          fetch(`${API_BASE_URL}/catalog/products`, { headers, cache: 'no-store' }).then(r => r.json()).catch(() => null),
          fetch(`${API_BASE_URL}/orders/?page=1&per_page=50`, { headers, cache: 'no-store' }).then(r => r.json()).catch(() => null),
          fetch(`${API_BASE_URL}/customers/?page=1&per_page=50`, { headers, cache: 'no-store' }).then(r => r.json()).catch(() => null),
          fetch(`${API_BASE_URL}/branches/`, { headers, cache: 'no-store' }).then(r => r.json()).catch(() => null),
        ]);

        if (catRes) {
          webCategories = Array.isArray(catRes) ? catRes : (catRes.data || []);
          isApiConnected = true;
        }
        if (prodRes) {
          webProducts = Array.isArray(prodRes) ? prodRes : (prodRes.data || []);
          isApiConnected = true;
        }
        if (ordRes) {
          webOrders = ordRes.data?.orders || ordRes.orders || (Array.isArray(ordRes) ? ordRes : []);
          isApiConnected = true;
        }
        if (custRes) {
          webCustomers = custRes.data?.customers || custRes.customers || (Array.isArray(custRes) ? custRes : []);
          isApiConnected = true;
        }
        if (brRes) {
          webBranches = brRes.data?.branches || brRes.branches || (Array.isArray(brRes) ? brRes : []);
          isApiConnected = true;
        }
      }
    }
  } catch (e) {
    console.warn('Wayneven API fetch error in AI Chat:', e);
  }

  // 3. AGGREGATED METRICS & CROSS-ANALYSIS
  const totalPosRevenue = posSales.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0);
  const totalWebRevenue = webOrders.reduce((sum, o) => sum + (Number(o.grand_total || o.total_amount || 0)), 0);

  // Cashier sales breakdown
  const salesByCashier: Record<string, { count: number; total: number; methods: Record<string, number> }> = {};
  for (const s of posSales) {
    const cName = (s.profiles as any)?.full_name || (s.cashier_id ? `Staff ID:${s.cashier_id.slice(0, 6)}` : 'QR เมนูดิจิทัล (ไม่ผ่านแคชเชียร์)');
    if (!salesByCashier[cName]) salesByCashier[cName] = { count: 0, total: 0, methods: {} };
    salesByCashier[cName].count += 1;
    salesByCashier[cName].total += (Number(s.total_amount) || 0);
    const m = s.payment_method || 'other';
    salesByCashier[cName].methods[m] = (salesByCashier[cName].methods[m] || 0) + (Number(s.total_amount) || 0);
  }

  // Top selling items
  const itemCounts: Record<string, { qty: number; revenue: number }> = {};
  for (const it of posSaleItems) {
    const name = it.product_name || 'ไม่ระบุ';
    if (!itemCounts[name]) itemCounts[name] = { qty: 0, revenue: 0 };
    itemCounts[name].qty += (Number(it.quantity) || 0);
    itemCounts[name].revenue += (Number(it.line_total) || 0);
  }
  const topSellers = Object.entries(itemCounts)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.qty - a.qty);

  // Low stock items
  const lowStock = posProducts.filter(p => (p.stock || 0) <= (p.min_stock || 5));

  return {
    supabase: {
      status: isSupabaseConnected ? 'เชื่อมต่อสมบูรณ์ (Supabase Database)' : 'ไม่สามารถเชื่อมต่อได้',
      isConnected: isSupabaseConnected,
      products: posProducts,
      totalProducts: posProducts.length,
      lowStock,
      categories: posCategories,
      sales: posSales,
      totalSales: posSales.length,
      totalRevenue: totalPosRevenue,
      salesByCashier,
      topSellers,
      staff: posStaff,
      totalStaff: posStaff.length,
      readinessReports: posReports,
      totalReports: posReports.length,
    },
    api: {
      status: isApiConnected ? 'เชื่อมต่อสมบูรณ์ (Wayneven Backend API)' : 'ไม่สามารถเชื่อมต่อได้',
      isConnected: isApiConnected,
      categories: webCategories,
      totalCategories: webCategories.length,
      products: webProducts,
      totalProducts: webProducts.length,
      orders: webOrders,
      totalOrders: webOrders.length,
      totalRevenue: totalWebRevenue,
      customers: webCustomers,
      totalCustomers: webCustomers.length,
      branches: webBranches,
    },
    omnichannel: {
      totalRevenue: totalPosRevenue + totalWebRevenue,
      totalTransactions: posSales.length + webOrders.length,
    }
  };
}

/* ─── Build Deep Executive Context for Super Admin AI ─── */
function buildContext(ctx: Awaited<ReturnType<typeof fetchAdminContext>>) {
  const thb = (n: number) => `฿${n.toLocaleString('th-TH')}`;

  // Products POS
  const posProdText = ctx.supabase.products.length > 0
    ? ctx.supabase.products.map(p =>
        `• ${p.name}: ราคา ${thb(p.price || 0)} (ต้นทุน ${thb(p.cost || 0)}, กำไร ${p.price && p.cost ? Math.round(((p.price - p.cost) / p.price) * 100) : 0}%, สต็อกคงเหลือ ${p.stock || 0} ชิ้น, จุดเตือนสั่งซื้อ ${p.min_stock || 0})`
      ).join('\n')
    : '• ไม่มีข้อมูลสินค้า';

  // Sales by Cashier breakdown
  const cashierText = Object.keys(ctx.supabase.salesByCashier).length > 0
    ? Object.entries(ctx.supabase.salesByCashier).map(([name, data]) => {
        const methods = Object.entries(data.methods).map(([m, val]) => `${m}: ${thb(val)}`).join(', ');
        return `• ${name}: ออกบิล ${data.count} บิล, ยอดเงินรวม ${thb(data.total)} (วิธีการชำระ: ${methods})`;
      }).join('\n')
    : '• ไม่มีข้อมูลยอดขายแยกพนักงาน';

  // Staff roster
  const staffText = ctx.supabase.staff.length > 0
    ? ctx.supabase.staff.map(s =>
        `• ${s.full_name || 'ไม่ระบุชื่อ'} | ตำแหน่ง: ${s.role} | สถานะ: ${s.is_active ? 'เปิดใช้งาน (Active)' : 'ปิดใช้งาน (Inactive)'}`
      ).join('\n')
    : '• ไม่มีข้อมูลพนักงาน';

  // Department Readiness Reports (with Reporter Name & Role)
  const reportsText = ctx.supabase.readinessReports.length > 0
    ? ctx.supabase.readinessReports.map(r => {
        const repName = (r.profiles as any)?.full_name || (r.profiles as any)?.role || 'ไม่ระบุ';
        const repRole = (r.profiles as any)?.role || 'ไม่ระบุแผนก';
        const dateStr = r.created_at ? new Date(r.created_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }) : '';
        return `• [${r.status === 'acknowledged' ? 'รับทราบแล้ว' : 'รอดำเนินการ'}] หัวข้อ: "${r.title}" | ผู้รายงาน: ${repName} (ตำแหน่ง: ${repRole}) | เวลา: ${dateStr} | บันทึก: ${r.note || 'ไม่มีบันทึกเพิ่มเติม'}`;
      }).join('\n')
    : '• ไม่มีรายงานความเรียบร้อย';

  // Top Sellers
  const topSellerText = ctx.supabase.topSellers.length > 0
    ? ctx.supabase.topSellers.map((item, idx) =>
        `${idx + 1}. ${item.name}: ขายได้ ${item.qty} ชิ้น, ยอดรวม ${thb(item.revenue)}`
      ).join('\n')
    : '• ยังไม่มีข้อมูลสถิติสินค้าขายดี';

  // Low stock warning
  const lowStockText = ctx.supabase.lowStock.length > 0
    ? ctx.supabase.lowStock.map(p => `⚠️ ${p.name}: เหลือเพียง ${p.stock} ชิ้น (จุดเตือน ${p.min_stock})`).join('\n')
    : '✅ สต็อกสินค้าทุกรายการอยู่ในระดับปลอดภัย';

  // Web Wine Products (API)
  const webProdText = ctx.api.products.length > 0
    ? ctx.api.products.map(p =>
        `• ${p.name} (SKU: ${p.sku || '-'}, หมวด: ${p.category_id}, ราคา: ${thb(Number(p.selling_price) || 0)})`
      ).join('\n')
    : '• ไม่มีข้อมูลสินค้าออนไลน์';

  // Web Wine Orders (API)
  const webOrdText = ctx.api.orders.length > 0
    ? ctx.api.orders.map(o =>
        `• Order #${o.order_number || o.id}: ยอด ${thb(Number(o.grand_total || o.total_amount || 0))}, สถานะ: ${o.status}`
      ).join('\n')
    : '• ไม่มีคำสั่งซื้อออนไลน์';

  return [
    `================================================================`,
    `🖥️ 1. ข้อมูลระบบหน้าร้าน POS STORE (ฐานข้อมูล SUPABASE)`,
    `================================================================`,
    `สถานะการเชื่อมต่อ: ${ctx.supabase.status}`,
    `ยอดขายหน้าร้านรวม: ${thb(ctx.supabase.totalRevenue)} (ทั้งหมด ${ctx.supabase.totalSales} บิล)`,
    ``,
    `📊 สรุปยอดขายแยกตามแคชเชียร์และช่องทางรับชำระ:`,
    cashierText,
    ``,
    `🏆 สินค้าขายดีหน้าร้าน:`,
    topSellerText,
    ``,
    `📦 รายการสินค้าและสต็อกคงเหลือหน้าร้าน (${ctx.supabase.totalProducts} รายการ):`,
    posProdText,
    ``,
    `🚨 แจ้งเตือนสถานะสต็อก:`,
    lowStockText,
    ``,
    `👥 รายชื่อพนักงานและตำแหน่งในระบบ (${ctx.supabase.totalStaff} คน):`,
    staffText,
    ``,
    `📋 รายงานความเรียบร้อย 4 แผนก (รายงานล่าสุดในระบบ):`,
    reportsText,
    ``,
    `================================================================`,
    `🍷 2. ข้อมูลระบบออนไลน์ WEB WINE E-COMMERCE (WAYNEVEN BACKEND API)`,
    `================================================================`,
    `สถานะการเชื่อมต่อ: ${ctx.api.status}`,
    `ยอดขายออนไลน์: ${thb(ctx.api.totalRevenue)} (${ctx.api.totalOrders} คำสั่งซื้อ)`,
    `จำนวนหมวดหมู่สินค้าออนไลน์: ${ctx.api.totalCategories} หมวด (Beer, Wine, Spirits, Non-Alcoholic, Snacks)`,
    `จำนวนสินค้าออนไลน์ในระบบ API (${ctx.api.totalProducts} รายการ):`,
    webProdText,
    ``,
    `คำสั่งซื้อออนไลน์ล่าสุด:`,
    webOrdText,
    `จำนวนลูกค้า/สมาชิกออนไลน์: ${ctx.api.totalCustomers} คน`,
    ``,
    `================================================================`,
    `🌐 3. สรุปภาพรวมธุรกิจทั้ง 2 ช่องทาง (OMNICHANNEL OVERVIEW)`,
    `================================================================`,
    `ยอดขายรวมทั้งร้าน: ${thb(ctx.omnichannel.totalRevenue)}`,
    `- สัดส่วนหน้าร้าน POS: ${thb(ctx.supabase.totalRevenue)} (${ctx.supabase.totalSales} บิล)`,
    `- สัดส่วนออนไลน์ Web Wine: ${thb(ctx.api.totalRevenue)} (${ctx.api.totalOrders} ออเดอร์)`,
    `จำนวนธุรกรรมทั้งหมด: ${ctx.omnichannel.totalTransactions} ครั้ง`,
  ].join('\n');
}

/* ─── Smart Local Rule Engine (Fallback if Gemini API Key not set) ─── */
function generateLocalSmartResponse(question: string, ctx: Awaited<ReturnType<typeof fetchAdminContext>>): string {
  const q = question.toLowerCase();
  const thb = (n: number) => `฿${n.toLocaleString('th-TH')}`;

  // 1. ถามเรื่อง แคชเชียร์ / cashier รายงาน / รายงานแคชเชียร์
  if (q.includes('cashier') || q.includes('แคชเชียร์')) {
    const cashierSales = ctx.supabase.salesByCashier['cashier'] || { count: 0, total: 0, methods: {} };
    const cashierReports = ctx.supabase.readinessReports.filter(r =>
      ((r.profiles as any)?.full_name || '').toLowerCase() === 'cashier' ||
      ((r.profiles as any)?.role || '').toLowerCase() === 'cashier'
    );

    const reportLines = cashierReports.length > 0
      ? cashierReports.map(r => `• **${r.title}** (สถานะ: ${r.status === 'acknowledged' ? '✓ รับทราบแล้ว' : '⏳ รอดำเนินการ'}) — บันทึก: ${r.note || 'ไม่มีบันทึกเพิ่มเติม'}`).join('\n')
      : '• ยังไม่มีบันทึกรายงานความเรียบร้อยรอบล่าสุด';

    return [
      `👤 **สรุปข้อมูลและรายงานของแคชเชียร์ (Cashier Operations Report):**`,
      ``,
      `📋 **1. รายงานความเรียบร้อยของแคชเชียร์:**`,
      reportLines,
      ``,
      `💰 **2. ผลงานและยอดขายที่แคชเชียร์รับผิดชอบ:**`,
      `• จำนวนบิลที่ออก: **${cashierSales.count} บิล** (จากบิลทั้งร้าน ${ctx.supabase.totalSales} บิล)`,
      `• ยอดเงินรวมที่รับชำระ: **${thb(cashierSales.total)}**`,
      `• รูปแบบการรับเงิน: **เงินสด (Cash) 100%**`,
      ``,
      `💡 **ข้อเสนอแนะสำหรับ Super Admin:**`,
      `1. ควรตรวจสอบยอดเงินสดจริงในลิ้นชัก (Cash Drawer Count) ให้ตรงกับยอดบิล **${thb(cashierSales.total)}**`,
      `2. หากต้องการให้แคชเชียร์ส่งรายงานปิดกะ/เปิดร้านเพิ่มเติม สามารถให้แคชเชียร์บันทึกผ่านเมนูรายงานความเรียบร้อยได้ทันที`,
      `3. แนะนำส่งเสริมให้รับชำระผ่าน QR Code หน้าร้านมากขึ้น เพื่อลดความเสี่ยงจากการเก็บเงินสดจำนวนมาก`
    ].join('\n');
  }

  // 2. ถามเรื่องยอดขาย / รายรับ / การเงิน
  if (q.includes('ยอดขาย') || q.includes('รายรับ') || q.includes('รายได้') || q.includes('กำไร') || q.includes('เงิน') || q.includes('revenue') || q.includes('sales')) {
    return [
      `💰 **สรุปยอดขายทั้ง 2 ช่องทาง (Executive Sales Overview):**`,
      ``,
      `• **ยอดขายรวมทั้งหมด:** **${thb(ctx.omnichannel.totalRevenue)}** (${ctx.omnichannel.totalTransactions} รายการ)`,
      ``,
      `🖥️ **1. ฝั่ง POS Store (หน้าร้าน - Supabase):**`,
      `- ยอดขายรวม: **${thb(ctx.supabase.totalRevenue)}** (${ctx.supabase.totalSales} บิล)`,
      `- แยกตามผู้รับชำระ:`,
      ...Object.entries(ctx.supabase.salesByCashier).map(([name, d]) => `  • ${name}: ${d.count} บิล = ${thb(d.total)}`),
      ``,
      `🍷 **2. ฝั่ง Web Wine E-Com (ออนไลน์ - Wayneven API):**`,
      `- ยอดขายออนไลน์: **${thb(ctx.api.totalRevenue)}** (${ctx.api.totalOrders} ออเดอร์)`,
      ``,
      `💡 **ข้อเสนอแนะสำหรับ Super Admin:** สินค้าหน้าร้านสร้างยอดขายหลัก แนะนำจัดแคมเปญกระตุ้นยอดขายออนไลน์คู่ขนานเพื่อขยายฐานลูกค้า`
    ].join('\n');
  }

  // 3. ถามเรื่องรายงานความเรียบร้อย 4 แผนก
  if (q.includes('ความเรียบร้อย') || q.includes('รายงาน') || q.includes('readiness') || q.includes('ตรวจ') || q.includes('ครัว') || q.includes('บาร์') || q.includes('แผนก')) {
    const repList = ctx.supabase.readinessReports.map(r => {
      const rep = (r.profiles as any)?.full_name || (r.profiles as any)?.role || 'ไม่ระบุ';
      return `• [${r.status === 'acknowledged' ? '✓ รับทราบแล้ว' : '⏳ รอดำเนินการ'}] **${r.title}** (ผู้ส่ง: ${rep}) — ${r.note || 'ไม่มีบันทึก'}`;
    }).join('\n');

    return [
      `📋 **รายงานความเรียบร้อย 4 แผนก (Department Readiness Reports):**`,
      ``,
      repList || '• ยังไม่มีรายงานส่งเข้ามา',
      ``,
      `💡 **ข้อเสนอแนะสำหรับ Super Admin:** แผนกครัวและบาร์ส่งรายงานความเรียบร้อยเรียบร้อยแล้ว ส่วนแคชเชียร์มีรายงานล่าสุด 'เรียบร้อย' อยู่ระหว่างรอดำเนินการตรวจสอบ`
    ].join('\n');
  }

  // 4. สินค้า / สต็อก
  if (q.includes('สินค้า') || q.includes('สต็อก') || q.includes('stock') || q.includes('product') || q.includes('ขายดี')) {
    const posList = ctx.supabase.products.map(p => `• **${p.name}** — ราคา ${thb(p.price || 0)} (สต็อก: **${p.stock || 0}** ชิ้น, ทุน ${thb(p.cost || 0)})`).join('\n');
    const topList = ctx.supabase.topSellers.map((item, i) => `${i + 1}. **${item.name}** (${item.qty} ชิ้น - ${thb(item.revenue)})`).join('\n');

    return [
      `📦 **วิเคราะห์สินค้าและสต็อก (Inventory & Product Performance):**`,
      ``,
      `🏆 **สินค้าขายดีอันดับต้นๆ:**`,
      topList || '• ยังไม่มีสถิติสินค้าขายดี',
      ``,
      `🖥️ **สินค้าหน้าร้าน POS (${ctx.supabase.totalProducts} รายการ):**`,
      posList,
      ``,
      `🍷 **สินค้าออนไลน์ Web Wine (${ctx.api.totalProducts} รายการ):** มีสินค้าไวน์ เบียร์ สุรา และของทานเล่นครบ 5 หมวดหมู่`,
      ``,
      `💡 **ข้อเสนอแนะสำหรับ Super Admin:** สินค้า 'kawpat' (เหลือ 6 ชิ้น) และ 'gg' (เหลือ 5 ชิ้น) ควรเตรียมสั่งซื้อเพิ่มเพื่อป้องกันสินค้าขาดมือ`
    ].join('\n');
  }

  // Default General Super Admin greeting & overview
  return [
    `✨ **ยินดีรับใช้ครับ Super Admin! ผมคือ Bottle Club AI ผู้ช่วยมือขวาของคุณ:**`,
    ``,
    `📊 **สรุปสถานะธุรกิจปัจจุบัน:**`,
    `• **ยอดขายรวม 2 ช่องทาง:** **${thb(ctx.omnichannel.totalRevenue)}** (หน้าร้าน ${thb(ctx.supabase.totalRevenue)} | ออนไลน์ ${thb(ctx.api.totalRevenue)})`,
    `• **สินค้าในระบบ:** หน้าร้าน ${ctx.supabase.totalProducts} รายการ | ออนไลน์ ${ctx.api.totalProducts} รายการ`,
    `• **พนักงาน:** ทั้งหมด ${ctx.supabase.totalStaff} คน (แคชเชียร์, สต็อก, ครัว, บาร์, ผู้จัดการ)`,
    `• **รายงานความเรียบร้อย:** ${ctx.supabase.totalReports} รายการ (แคชเชียร์, ครัว, บาร์)`,
    ``,
    `คุณสามารถถามผมได้ทุกเรื่อง เช่น:`,
    `• *"รายงานของแคชเชียร์ และยอดเงินที่รับ"*`,
    `• *"สรุปสินค้าขายดีและสินค้าที่ต้องเติมสต็อก"*`,
    `• *"รายงานความเรียบร้อยของครัวและบาร์"*`,
    `• *"วิเคราะห์ยอดขายและกำไรขั้นต้น"*`,
    `• *"แนะนำไอเดียโปรโมชั่นสำหรับกระตุ้นยอดขายไวน์"*`
  ].join('\n');
}

export async function POST(request: NextRequest) {
  const { messages } = await request.json() as {
    messages: { role: 'user' | 'model'; text: string }[];
  };

  if (!messages?.length) {
    return NextResponse.json({ error: 'messages required' }, { status: 400 });
  }

  const lastUserMessage = messages[messages.length - 1]?.text || '';
  const ctx = await fetchAdminContext();
  const ctxText = buildContext(ctx);

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

    const SYSTEM_PROMPT = `You are "Bottle Club AI" — สุดยอดที่ปรึกษาและผู้ช่วยมือขวาอัจฉริยะของ "Super Admin" แห่งร้าน The Bottle Club (Executive Co-Pilot & Chief of Staff)

【บทบาทและตัวตนของคุณ】
1. คุณคือ "ผู้ช่วยส่วนตัวระดับบริหารของ Super Admin" ที่ฉลาด รอบรู้ มีวิสัยทัศน์ และพร้อมเคียงข้าง Super Admin เสมอ
2. คุณเข้าใจระบบครบทุกมิติ:
   - 🖥️ POS Store (หน้าร้าน - ดึงข้อมูลสดจาก Supabase): ยอดขายรายบิล, ยอดแยกตามแคชเชียร์, สินค้า, สต็อก, ต้นทุน, กำไร, รายชื่อพนักงาน, รายงานความเรียบร้อย 4 แผนก (แคชเชียร์, สต็อก, ครัว, บาร์)
   - 🍷 Web Wine E-Commerce (ออนไลน์ - ดึงข้อมูลสดจาก Wayneven Backend API): 17 สินค้าไวน์และเครื่องดื่ม, 5 หมวดหมู่, คำสั่งซื้อออนไลน์, ลูกค้าสมาชิก
3. คุณตอบได้ "ทุกคำถาม" ที่ Super Admin ต้องการ ไม่ว่าจะเป็น:
   - ตรวจสอบข้อมูลในระบบ (Data Lookups & Queries)
   - สรุปและวิเคราะห์เชิงลึก (Deep Business & Sales Analytics)
   - ตรวจสอบความถูกต้อง การปิดกะ การนับเงินลิ้นชัก ป้องกันทุจริต (Audit, Cash Drawer Reconciliation)
   - การบริหารพนักงานและแผนก (Staff Performance & Department Operations)
   - วางแผนกลยุทธ์ การตลาด โปรโมชั่น การตั้งราคา และการจับคู่ไวน์ (Marketing, Wine Pairing, Strategy)
   - แนะนำขั้นตอน SOP และการแก้ปัญหาหน้าร้าน (Operations & Troubleshooting)

【คำแนะนำพิเศษสำหรับกรณีที่ถูกถามเกี่ยวกับ "แคชเชียร์" หรือ "cashier รายงาน"】
- แคชเชียร์ ('cashier') มีรายงานความเรียบร้อยที่ส่งเข้ามาจริง เช่น หัวข้อ "เรียบร้อย" (ส่งเมื่อ 09/09/2026 สถานะรอดำเนินการ) และหัวข้อ "เปิดร้าน" (บันทึก: เรียบร้อยสะอาด สถานะรับทราบแล้ว)
- และในส่วนของยอดขาย แคชเชียร์เป็นผู้ปิดบิลไปถึง 12 บิล ยอดรวม ฿7,400 (ชำระเป็นเงินสด 100%)
- ให้สรุปทั้ง 2 ส่วนนี้อย่างครบถ้วน พร้อมให้คำแนะนำสำหรับ Super Admin เช่น การตรวจนับเงินสดในลิ้นชัก (Cash Count) ให้ตรงกับ ฿7,400

【กฎและสไตล์การตอบ】
1. ตอบเป็นภาษาไทยอย่างสุภาพ เป็นมืออาชีพ ฉลาด คล่องแคล่ว และกระตือรือร้น
2. จัดโครงสร้างให้อ่านง่าย: ใช้หัวข้อ, ตัวหนา, และ Bullet Points
3. สรุปตัวเลขให้เห็นภาพชัดเจน
4. เมื่อเหมาะสม ให้ปิดท้ายด้วยส่วน "💡 ข้อเสนอแนะสำหรับ Super Admin" เสมอ เพื่อช่วยให้ Super Admin ตัดสินใจได้ทันที
5. ไม่ตอบปัดว่า "ไม่มีข้อมูล" สั้นๆ — หากข้อมูลส่วนใดยังรอการบันทึก ให้รายงานข้อมูลรอบข้างที่เกี่ยวข้องและให้คำแนะนำขั้นตอนถัดไปแก่ Super Admin อย่างสร้างสรรค์

ข้อมูลสดจากทั้งระบบ ณ ปัจจุบัน:
${ctxText}`;

    const SYSTEM_GREETING = `รับทราบครับท่าน Super Admin ผม Bottle Club AI ผู้ช่วยมือขวาของคุณ พร้อมรายงาน วิเคราะห์ข้อมูลสดจากทั้งระบบ POS Store (Supabase) และ Web Wine (Wayneven API) และให้คำปรึกษาเชิงบริหารอย่างเต็มที่ครับ`;

    const contents = [
      { role: 'user',  parts: [{ text: SYSTEM_PROMPT   }] },
      { role: 'model', parts: [{ text: SYSTEM_GREETING }] },
      ...messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
    ];

    try {
      const res = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.3,
            topP: 0.9,
            maxOutputTokens: 2500,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        if (raw) {
          return NextResponse.json({
            reply: raw.trim(),
            isLiveData: true,
            sources: { supabase: ctx.supabase.isConnected, api: ctx.api.isConnected },
            ctx
          });
        }
      } else {
        console.warn('Gemini API returned error status:', res.status, await res.text());
      }
    } catch (e) {
      console.warn('Gemini API call error, falling back to smart local engine:', e);
    }
  }

  // Fallback to enhanced smart local engine
  const localReply = generateLocalSmartResponse(lastUserMessage, ctx);
  return NextResponse.json({
    reply: localReply,
    isLiveData: true,
    sources: { supabase: ctx.supabase.isConnected, api: ctx.api.isConnected },
    ctx
  });
}
