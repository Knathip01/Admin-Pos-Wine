import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session || !session.admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    sales: [],
    topProducts: [],
    payments: []
  });
}
