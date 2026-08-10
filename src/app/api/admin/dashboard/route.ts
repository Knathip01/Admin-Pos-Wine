import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    metrics: {
      todayRevenue: '0.00',
      pendingOrders: 0,
      newMembers: 0,
      lowStockAlerts: 0,
    },
    lowStockProducts: [],
    salesData: [],
    recentOrders: []
  });
}
