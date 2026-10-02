import { NextRequest, NextResponse } from 'next/server';

export async function proxy(request: NextRequest) {
  // Allow direct access without login redirect for Web Wine and Admin development
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
