import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// GET /api/admin/settings — ดึงการตั้งค่า (รายตัว หรือ ทั้งหมด)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const key = searchParams.get('key')

    const supabase = getSupabaseAdmin()

    if (key) {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', key)
        .single()

      if (error && error.code !== 'PGRST116') {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, setting: data || null })
    }

    const { data, error } = await supabase.from('settings').select('*')
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, settings: data || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to get settings' }, { status: 500 })
  }
}

// POST /api/admin/settings — บันทึกหรืออัปเดตการตั้งค่า (Upsert ด้วย Service Role เพื่อไม่ให้ติด RLS)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const supabase = getSupabaseAdmin()

    // รองรับกรณีส่งมาเป็น array หรือ object เดี่ยว
    if (Array.isArray(body)) {
      const payload = body.map(item => ({
        key: item.key,
        value: typeof item.value === 'string' ? item.value : JSON.stringify(item.value),
        description: item.description ?? null,
        updated_at: new Date().toISOString(),
      }))

      const { data, error } = await supabase
        .from('settings')
        .upsert(payload, { onConflict: 'key' })
        .select()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, settings: data })
    }

    const { key, value, description } = body
    if (!key) {
      return NextResponse.json({ error: 'Missing key parameter' }, { status: 400 })
    }

    const payload = {
      key,
      value: typeof value === 'string' ? value : JSON.stringify(value),
      ...(description !== undefined ? { description } : {}),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('settings')
      .upsert(payload, { onConflict: 'key' })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, setting: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update settings' }, { status: 500 })
  }
}

// PUT /api/admin/settings — เหมือนกับ POST
export async function PUT(req: NextRequest) {
  return POST(req)
}
