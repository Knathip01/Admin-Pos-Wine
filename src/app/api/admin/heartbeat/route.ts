import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// POST /api/admin/heartbeat — อัปเดตเวลาออนไลน์ (updated_at) ของพนักงานใน Supabase profiles
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    let userId: string | undefined
    let username: string | undefined

    try {
      const body = await req.json()
      userId = body.userId
      username = body.username || body.full_name
    } catch {}

    const now = new Date().toISOString()

    // 1. ถ้ามี userId ระบุตรงกับ profile
    if (userId) {
      const { error } = await supabase
        .from('profiles')
        .update({ updated_at: now })
        .eq('id', userId)

      if (!error) {
        return NextResponse.json({ success: true, updated_at: now })
      }
    }

    // 2. ถ้ามีชื่อ username หรือ role ให้ค้นหาและอัปเดต
    if (username) {
      const { data: matched } = await supabase
        .from('profiles')
        .select('id')
        .or(`full_name.ilike.%${username}%,role.ilike.%${username}%`)
        .limit(1)

      if (matched && matched.length > 0) {
        await supabase
          .from('profiles')
          .update({ updated_at: now })
          .eq('id', matched[0].id)
        return NextResponse.json({ success: true, updated_at: now })
      }
    }

    // 3. Fallback: อัปเดต super_admin profile
    await supabase
      .from('profiles')
      .update({ updated_at: now })
      .eq('role', 'super_admin')

    return NextResponse.json({ success: true, updated_at: now })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Heartbeat failed' }, { status: 500 })
  }
}

// GET /api/admin/heartbeat — ตรวจสอบสถานะออนไลน์ของพนักงานทั้งหมดใน Supabase
export async function GET() {
  try {
    const supabase = getSupabaseAdmin()
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, is_active, updated_at')
      .order('role', { ascending: true })

    if (error) throw error

    const now = Date.now()
    const staff = (profiles || []).map(p => ({
      ...p,
      is_online: p.is_active && p.updated_at && (now - new Date(p.updated_at).getTime() < 60000)
    }))

    return NextResponse.json({ staff, server_time: new Date().toISOString() })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
