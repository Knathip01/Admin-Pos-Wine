import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { DEFAULT_PROMOTIONS } from '@/lib/mock-promotions'
import { Promotion } from '@/lib/types'

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// GET /api/promotions — Public API สำหรับดึงโปรโมชั่นที่เปิดใช้งาน (is_active = true) ไปแสดงหน้าร้าน
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()

    // 1. ลองดึงจากตาราง promotions ตรงๆ
    const { data: tableData, error: tableError } = await supabase
      .from('promotions')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (!tableError && tableData && tableData.length > 0) {
      return NextResponse.json({
        success: true,
        source: 'database_table',
        promotions: tableData as Promotion[],
      })
    }

    // 2. ถ้าตารางยังไม่ถูกสร้างใน Supabase (PGRST205) ให้ fallback ไปดึงจากตาราง settings (key: 'promotions')
    const { data: settingData } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'promotions')
      .single()

    if (settingData?.value) {
      try {
        const parsed = typeof settingData.value === 'string' ? JSON.parse(settingData.value) : settingData.value
        if (Array.isArray(parsed) && parsed.length > 0) {
          const activeList = parsed
            .filter((p: Promotion) => p.is_active)
            .sort((a: Promotion, b: Promotion) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

          if (activeList.length > 0) {
            return NextResponse.json({
              success: true,
              source: 'settings_fallback',
              promotions: activeList,
            })
          }
        }
      } catch (err) {
        console.error('Error parsing promotions setting:', err)
      }
    }

    // 3. Fallback: ถ้ายังไม่มีข้อมูลใน DB เลย ให้ส่ง DEFAULT_PROMOTIONS เพื่อไม่ให้หน้าร้านว่างเปล่า
    const defaultActive = DEFAULT_PROMOTIONS.filter(p => p.is_active)
    return NextResponse.json({
      success: true,
      source: 'default_preset',
      promotions: defaultActive,
    })
  } catch (err: any) {
    console.error('Failed to get promotions:', err)
    return NextResponse.json({
      success: true,
      source: 'error_fallback',
      promotions: DEFAULT_PROMOTIONS.filter(p => p.is_active),
    })
  }
}
