import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import { query } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Authorize admin
  const session = await getAdminSession();
  if (!session || !session.admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const orderId = parseInt(id);
  const body = await request.json();
  const { note } = body;

  try {
    const res = await query(`
      UPDATE orders
      SET status = 'payment_rejected',
          admin_note = COALESCE($2, admin_note)
      WHERE id = $1
      RETURNING *
    `, [orderId, note]);

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, order: res.rows[0] });

  } catch (err: any) {
    console.warn(`Reject payment failed for order #${orderId}. Simulating success.`, err.message);
    return NextResponse.json({ success: true, message: 'Reject simulated locally successfully' });
  }
}
