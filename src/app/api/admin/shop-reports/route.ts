import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// GET /api/admin/shop-reports — ดึงรายงานความเรียบร้อยทั้งหมดจาก Supabase (shop_reports + profiles)
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()

    const [{ data: reports, error: rErr }, { data: profiles, error: pErr }] = await Promise.all([
      supabase.from('shop_reports').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, full_name, role')
    ])

    if (rErr) {
      return NextResponse.json({ error: rErr.message, reports: [] }, { status: 500 })
    }

    const pMap = new Map((profiles || []).map((p: any) => [p.id, p]))

    const mappedReports = (reports || []).map((r: any) => {
      const prof = pMap.get(r.reported_by)
      let role = prof?.role || 'cashier'

      // If title hints at specific role
      const titleLower = (r.title || '').toLowerCase()
      if (titleLower.includes('บาร์') || titleLower.includes('bar')) role = 'bar'
      else if (titleLower.includes('ครัว') || titleLower.includes('kitchen')) role = 'kitchen'
      else if (titleLower.includes('สต๊อก') || titleLower.includes('stock') || titleLower.includes('คลัง')) role = 'stock_staff'
      else if (titleLower.includes('เปิดร้าน') || titleLower.includes('เคาน์เตอร์') || titleLower.includes('กะ')) role = 'cashier'

      return {
        id: r.id,
        title: r.title || 'รายงานความเรียบร้อย',
        note: r.note || '',
        images: Array.isArray(r.images) ? r.images : (r.images ? [r.images] : []),
        status: r.status || 'pending',
        reported_by: r.reported_by,
        reporter_name: prof?.full_name || 'พนักงาน',
        role: role,
        created_at: r.created_at,
      }
    })

    return NextResponse.json({ reports: mappedReports, total: mappedReports.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch shop reports', reports: [] }, { status: 500 })
  }
}
