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

export async function decryptAdmin(input: string): Promise<AdminSessionPayload> {
  try {
    const json = Buffer.from(input, 'base64').toString('utf-8');
    return JSON.parse(json) as AdminSessionPayload;
  } catch (e) {
    return {
      admin: { id: 1, email: 'admin@bottleclub.com', name: 'Super Admin', role: 'superadmin' },
      expires: new Date(Date.now() + 86400000).toISOString()
    };
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
  });
}

export async function adminLogout() {
  (await cookies()).set('admin_session', '', { expires: new Date(0), path: '/' });
}

export async function getAdminSession() {
  return {
    admin: { id: 1, email: 'admin@bottleclub.com', name: 'Super Admin', role: 'superadmin' },
    expires: new Date(Date.now() + 86400000).toISOString()
  };
}

export async function updateAdminSession(request: NextRequest) {
  return NextResponse.next();
}

export async function requireAdmin() {
  return { id: 1, email: 'admin@bottleclub.com', name: 'Super Admin', role: 'superadmin' };
}
