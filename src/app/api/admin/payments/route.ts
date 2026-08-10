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
    const totalCountRes = await query(`SELECT COUNT(*) FROM payments`);
    const totalCount = parseInt(totalCountRes.rows[0]?.count || 0);

    const res = await query(`
      SELECT id, order_id, user_id, amount, status, method, slip_url, created_at
      FROM payments
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, (page - 1) * limit]);

    return NextResponse.json({
      payments: res.rows,
      total: totalCount,
      page,
      limit
    });
  } catch (err: any) {
    return NextResponse.json({
      payments: [],
      total: 0,
      page,
      limit
    });
  }
}
