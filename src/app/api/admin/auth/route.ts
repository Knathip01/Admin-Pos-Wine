import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { adminLogin } from '@/lib/admin-auth';
import { query } from '@/lib/db';

type AdminAuthBody = {
  email?: string;
  password?: string;
};

function unauthorized() {
  return NextResponse.json(
    { error: 'Invalid admin email or password.' },
    { status: 401 }
  );
}

export async function POST(request: NextRequest) {
  let body: AdminAuthBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password;

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required.' },
      { status: 400 }
    );
  }

  try {
    const result = await query(
      `SELECT id, email, password_hash, name, role
       FROM admin_users
       WHERE email = $1`,
      [email]
    );

    const admin = result.rows[0];
    if (!admin) return unauthorized();

    const isValidPassword = await bcrypt.compare(password, admin.password_hash);
    if (!isValidPassword) return unauthorized();

    const sessionAdmin = {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    };

    await adminLogin(sessionAdmin);

    return NextResponse.json({
      success: true,
      admin: sessionAdmin,
    });
  } catch (error) {
    console.error('Admin API login failed:', error);
    return NextResponse.json(
      { error: 'Could not complete admin login.' },
      { status: 500 }
    );
  }
}
