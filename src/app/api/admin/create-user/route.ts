import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const { email, password, full_name, role = 'cashier', phone } = await req.json()

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน (อีเมล, รหัสผ่าน, ชื่อ-นามสกุล)' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    // If service role key is provided, use Admin API for auto-confirm (Active immediately)
    if (serviceRoleKey) {
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })

      // 1. Create auth user with email_confirm: true (bypass verification)
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email.trim(),
        password: password.trim(),
        email_confirm: true,
        user_metadata: { full_name: full_name.trim() },
      })

      if (authError) {
        return NextResponse.json({ error: authError.message }, { status: 400 })
      }

      if (!authData.user) {
        return NextResponse.json({ error: 'ไม่สามารถสร้างผู้ใช้ได้' }, { status: 400 })
      }

      // 2. Insert or update profile in public.profiles
      const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
        id: authData.user.id,
        full_name: full_name.trim(),
        role,
        phone: phone?.trim() || null,
        is_active: true,
      })

      if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 400 })
      }

      return NextResponse.json({ success: true, user: authData.user, confirmed: true })
    } else {
      // Fallback: If no service role key, use standard client sign up
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      const supabase = createClient(supabaseUrl, anonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        }
      })

      const { data: authData, error: signUpErr } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: {
          data: { full_name: full_name.trim() },
        },
      })

      if (signUpErr) {
        return NextResponse.json({ error: signUpErr.message }, { status: 400 })
      }

      if (!authData.user) {
        return NextResponse.json({ error: 'ไม่สามารถสร้างผู้ใช้ได้' }, { status: 400 })
      }

      const { error: profileErr } = await supabase.from('profiles').upsert({
        id: authData.user.id,
        full_name: full_name.trim(),
        role,
        phone: phone?.trim() || null,
        is_active: true,
      })

      if (profileErr) {
        return NextResponse.json({ error: profileErr.message }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        user: authData.user,
        confirmed: false,
        warning: 'สร้างสำเร็จ แต่กรุณาใส่ SUPABASE_SERVICE_ROLE_KEY ใน .env.local เพื่อให้ระบบ Auto-confirm อัตโนมัติ'
      })
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
