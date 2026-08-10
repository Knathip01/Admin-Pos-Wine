import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session || !session.admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  try {
    const totalCountRes = await query(`SELECT COUNT(*) FROM orders`);
    const totalCount = parseInt(totalCountRes.rows[0]?.count || 0);

    const res = await query(`
      SELECT id, user_id, total_amount, status, payment_method, order_type, created_at, is_full_tax_invoice
      FROM orders
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, (page - 1) * limit]);

    return NextResponse.json({
      orders: res.rows.map(r => ({
        id: r.id,
        customer: r.user_id || 'Guest Customer',
        total: parseFloat(r.total_amount),
        status: r.status,
        paymentMethod: r.payment_method,
        type: r.order_type,
        date: new Date(r.created_at).toLocaleDateString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        taxInvoice: r.is_full_tax_invoice
      })),
      total: totalCount,
      page,
      limit
    });
  } catch (err: any) {
    return NextResponse.json({
      orders: [],
      total: 0,
      page,
      limit
    });
  }
}
