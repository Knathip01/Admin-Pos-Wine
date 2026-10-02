import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// GET /api/admin/users — ดึงรายชื่อผู้ใช้ทั้งหมดจาก Supabase (profiles + auth.users)
export async function GET() {
  try {
    const supabase = getSupabaseAdmin()

    const [{ data: profiles, error: pErr }, authRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.auth.admin.listUsers().catch(() => ({ data: { users: [] } }))
    ])

    if (pErr) {
      return NextResponse.json({ error: pErr.message, users: [] }, { status: 500 })
    }

    const authUsers = (authRes as any)?.data?.users || []
    const emailMap = new Map(authUsers.map((u: any) => [u.id, u.email]))

    const users = (profiles || []).map((p: any) => ({
      id: p.id,
      full_name: p.full_name || '',
      role: p.role || 'cashier',
      phone: p.phone || '',
      avatar_url: p.avatar_url || null,
      email: emailMap.get(p.id) || p.email || '',
      is_active: p.is_active ?? true,
      created_at: p.created_at,
      updated_at: p.updated_at,
    }))

    return NextResponse.json({ users, total: users.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch users', users: [] }, { status: 500 })
  }
}

// PUT /api/admin/users — แก้ไขข้อมูลผู้ใช้ใน Supabase (profiles)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, full_name, role, phone, is_active } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing user id' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    }

    if (full_name !== undefined) updateData.full_name = full_name.trim()
    if (role !== undefined) updateData.role = role
    if (phone !== undefined) updateData.phone = phone ? phone.trim() : null
    if (is_active !== undefined) updateData.is_active = is_active

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, user: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update user' }, { status: 500 })
  }
}

// DELETE /api/admin/users — ปิดการใช้งานผู้ใช้ใน Supabase
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing user id' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to deactivate user' }, { status: 500 })
  }
}
