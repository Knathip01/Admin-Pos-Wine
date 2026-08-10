import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session || !session.admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const res = await query(`SELECT * FROM users ORDER BY created_at DESC`);
    return NextResponse.json({
      users: res.rows,
      total: res.rowCount
    });
  } catch (err: any) {
    return NextResponse.json({
      users: [],
      total: 0
    });
  }
}
