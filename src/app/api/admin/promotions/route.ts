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

// 🌐 Helper: ซิงค์ข้อมูลโปรโมชั่นไปยัง ProjectbottleClub1 โดยตรง
async function syncToProjectbottleClub1(promotions: Promotion[]) {
  try {
    const fs = await import('fs')
    const path = await import('path')
    const targetDir = 'C:\\ProjectbottleClub1\\frontend\\src\\lib'
    if (fs.existsSync(targetDir)) {
      const targetFile = path.join(targetDir, 'promotions_data.json')
      fs.writeFileSync(targetFile, JSON.stringify(promotions, null, 2), 'utf-8')
    }
  } catch (_) {
    // Non-fatal if folder doesn't exist
  }
}

// GET /api/admin/promotions — ดึงรายการโปรโมชั่นทั้งหมดสำหรับหน้า Admin (รวมทั้ง active และ inactive)
export async function GET() {
  try {
    const supabase = getSupabaseAdmin()

    // 1. ดึงจากตาราง promotions
    const { data: tableData, error: tableError } = await supabase
      .from('promotions')
      .select('*')
      .order('sort_order', { ascending: true })

    if (!tableError && tableData && tableData.length > 0) {
      return NextResponse.json({
        success: true,
        source: 'database_table',
        promotions: tableData as Promotion[],
      })
    }

    // 2. Fallback: ดึงจากตาราง settings (key: 'promotions')
    const { data: settingData } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'promotions')
      .single()

    if (settingData?.value) {
      try {
        const parsed = typeof settingData.value === 'string' ? JSON.parse(settingData.value) : settingData.value
        if (Array.isArray(parsed) && parsed.length > 0) {
          const sorted = parsed.sort((a: Promotion, b: Promotion) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
          return NextResponse.json({
            success: true,
            source: 'settings_fallback',
            promotions: sorted,
          })
        }
      } catch (e) {
        console.error('Failed to parse settings promotions:', e)
      }
    }

    // 3. Fallback: ใช้ DEFAULT_PROMOTIONS และบันทึกลง settings เพื่อพร้อมใช้งาน
    await supabase.from('settings').upsert({
      key: 'promotions',
      value: JSON.stringify(DEFAULT_PROMOTIONS),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' })

    return NextResponse.json({
      success: true,
      source: 'default_preset',
      promotions: DEFAULT_PROMOTIONS,
    })
  } catch (err: any) {
    return NextResponse.json({
      error: err.message || 'Failed to fetch promotions',
      promotions: DEFAULT_PROMOTIONS,
    }, { status: 500 })
  }
}

// POST /api/admin/promotions — บันทึกหรืออัปเดตโปรโมชั่น (Create or Update)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const supabase = getSupabaseAdmin()

    // รองรับการส่งทั้งแบบตัวเดียว หรือ ส่งทั้ง array (Bulk update / Reorder)
    if (Array.isArray(body)) {
      // Bulk update (เช่น การสลับลำดับ sort_order)
      const list = body as Promotion[]
      
      // 1. ลองบันทึกลงตาราง promotions
      const { error: tableError } = await supabase
        .from('promotions')
        .upsert(list, { onConflict: 'id' })

      // 2. ซิงค์ลง settings table เสมอเพื่อเป็น Fallback
      await supabase.from('settings').upsert({
        key: 'promotions',
        value: JSON.stringify(list),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' })

      // 3. ซิงค์ไปยัง ProjectbottleClub1 โดยตรง
      await syncToProjectbottleClub1(list)

      return NextResponse.json({ success: true, count: list.length })
    }

    const {
      id,
      title,
      subtitle,
      description,
      image_url,
      images,
      hero_image_url,
      badge,
      discount_tag,
      valid_until,
      link_url,
      cta_text,
      secondary_cta_text,
      secondary_link_url,
      is_featured,
      is_active,
      sort_order,
    } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: 'กรุณาระบุชื่อแคมเปญโปรโมชั่น' }, { status: 400 })
    }

    let imageList: string[] = []
    if (Array.isArray(images) && images.length > 0) {
      imageList = images.map((img: any) => String(img).trim()).filter(Boolean)
    } else if (image_url?.trim()) {
      imageList = [image_url.trim()]
    }

    if (imageList.length === 0) {
      return NextResponse.json({ error: 'กรุณาระบุ URL รูปภาพหรือเลือกรูปภาพพรีเซ็ตอย่างน้อย 1 รูป' }, { status: 400 })
    }

    const promoId = (id?.trim() || `promo-${Date.now()}`)
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-_]/g, '')

    const payload: Promotion = {
      id: promoId || `promo-${Date.now()}`,
      title: title.trim(),
      subtitle: subtitle?.trim() || '',
      description: description?.trim() || '',
      image_url: imageList[0],
      images: imageList,
      hero_image_url: hero_image_url?.trim() || (imageList.length > 1 ? imageList[1] : undefined),
      badge: badge?.trim() || 'PROMOTION',
      discount_tag: discount_tag?.trim() || '',
      valid_until: valid_until?.trim() || '',
      link_url: link_url?.trim() || '/#products',
      cta_text: cta_text?.trim() || 'ดูสินค้าโปรโมชั่น',
      secondary_cta_text: secondary_cta_text?.trim() || '',
      secondary_link_url: secondary_link_url?.trim() || '',
      is_featured: Boolean(is_featured),
      is_active: is_active !== undefined ? Boolean(is_active) : true,
      sort_order: Number(sort_order) || 0,
      updated_at: new Date().toISOString(),
    }

    let savedInTable = false

    // 1. ลองบันทึกลงตาราง promotions
    const { error: tableErr } = await supabase
      .from('promotions')
      .upsert({ ...payload, created_at: payload.created_at || new Date().toISOString() }, { onConflict: 'id' })

    if (!tableErr) {
      savedInTable = true
    }

    // 2. ซิงค์กับตาราง settings เป็น Fallback เสมอ
    const { data: settingData } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'promotions')
      .single()

    let currentList: Promotion[] = []
    if (settingData?.value) {
      try {
        const parsed = typeof settingData.value === 'string' ? JSON.parse(settingData.value) : settingData.value
        if (Array.isArray(parsed)) currentList = parsed
      } catch (_) {}
    } else {
      currentList = [...DEFAULT_PROMOTIONS]
    }

    const existingIndex = currentList.findIndex(p => p.id === payload.id)
    if (existingIndex >= 0) {
      currentList[existingIndex] = { ...currentList[existingIndex], ...payload }
    } else {
      currentList.unshift({ ...payload, created_at: new Date().toISOString() })
    }

    await supabase.from('settings').upsert({
      key: 'promotions',
      value: JSON.stringify(currentList),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' })

    // 3. ซิงค์ไปยัง ProjectbottleClub1 โดยตรง
    await syncToProjectbottleClub1(currentList)

    return NextResponse.json({
      success: true,
      promotion: payload,
      savedInTable,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save promotion' }, { status: 500 })
  }
}

// DELETE /api/admin/promotions — ลบโปรโมชั่น
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    let id = searchParams.get('id')

    if (!id) {
      try {
        const body = await req.json()
        id = body?.id
      } catch (_) {}
    }

    if (!id) {
      return NextResponse.json({ error: 'ไม่พบ ID โปรโมชั่นที่ต้องการลบ' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // 1. ลองลบจากตาราง promotions
    await supabase.from('promotions').delete().eq('id', id)

    // 2. ลบออกจากตาราง settings
    const { data: settingData } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'promotions')
      .single()

    if (settingData?.value) {
      try {
        const parsed = typeof settingData.value === 'string' ? JSON.parse(settingData.value) : settingData.value
        if (Array.isArray(parsed)) {
          const updated = parsed.filter((p: Promotion) => p.id !== id)
          await supabase.from('settings').upsert({
            key: 'promotions',
            value: JSON.stringify(updated),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'key' })

          // 3. ซิงค์ไปยัง ProjectbottleClub1 โดยตรง
          await syncToProjectbottleClub1(updated)
        }
      } catch (_) {}
    }

    return NextResponse.json({ success: true, message: 'ลบโปรโมชั่นสำเร็จ' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete promotion' }, { status: 500 })
  }
}
