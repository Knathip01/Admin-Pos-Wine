import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export type AdminSessionUser = {
  id: number;
  email: string;
  name: string | null;
  role: 'superadmin' | 'staff' | string;
};

export type AdminSessionPayload = {
  admin: AdminSessionUser;
  expires: string;
};

export async function encryptAdmin(payload: AdminSessionPayload) {
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

export async function decryptAdmin(input: string): Promise<AdminSessionPayload | null> {
  try {
    const json = Buffer.from(input, 'base64').toString('utf-8');
    const payload = JSON.parse(json) as AdminSessionPayload;
    // Check expiry
    if (new Date(payload.expires) < new Date()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function adminLogin(admin: AdminSessionUser) {
  const expires = new Date(Date.now() + 86400000);
  const session = await encryptAdmin({ admin, expires: expires.toISOString() });

  (await cookies()).set('admin_session', session, {
    expires,
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
}

export async function adminLogout() {
  (await cookies()).set('admin_session', '', { expires: new Date(0), path: '/' });
}

export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const sessionCookie = (await cookies()).get('admin_session')?.value;
  if (!sessionCookie) return null;
  return decryptAdmin(sessionCookie);
}

export async function updateAdminSession(request: NextRequest) {
  return NextResponse.next();
}

export async function requireAdmin(): Promise<AdminSessionUser | null> {
  const session = await getAdminSession();
  return session?.admin ?? null;
}
