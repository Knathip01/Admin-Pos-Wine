import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// GET /api/admin/products — ดึงรายการสินค้าทั้งหมดจาก Supabase
export async function GET() {
  try {
    const supabase = getSupabaseAdmin()
    const { data: products, error } = await supabase
      .from('products')
      .select('*, categories(name, icon, color)')
      .order('name')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ products: products || [], total: products?.length || 0 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch products' }, { status: 500 })
  }
}

// POST /api/admin/products — เพิ่มสินค้าใหม่ลงใน Supabase
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, category_id, price, cost, stock, min_stock, sku, barcode, image_url, is_active, ...rest } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'กรุณาระบุชื่อสินค้า' }, { status: 400 })
    }

    const payload: Record<string, any> = {
      name: name.trim(),
      category_id: category_id || null,
      price: Number(price) || 0,
      cost: Number(cost) || 0,
      stock: Number(stock) || 0,
      min_stock: Number(min_stock) || 5,
      sku: sku?.trim() || `PRD-${Date.now().toString().slice(-6)}`,
      barcode: barcode?.trim() || `885${Date.now().toString().slice(-10)}`,
      image_url: image_url || null,
      is_active: is_active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...rest,
    }

    delete payload.id
    delete payload.categories

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase.from('products').insert(payload).select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, product: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create product' }, { status: 500 })
  }
}

// PUT /api/admin/products — อัปเดตข้อมูลสินค้าใน Supabase
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, name, category_id, price, cost, stock, min_stock, sku, barcode, image_url, is_active, ...rest } = body

    if (!id) {
      return NextResponse.json({ error: 'ไม่พบ ID สินค้า' }, { status: 400 })
    }

    if (!name?.trim()) {
      return NextResponse.json({ error: 'กรุณาระบุชื่อสินค้า' }, { status: 400 })
    }

    const updatePayload: Record<string, any> = {
      name: name.trim(),
      updated_at: new Date().toISOString(),
    }

    if (category_id !== undefined) updatePayload.category_id = category_id || null
    if (price !== undefined) updatePayload.price = Number(price) || 0
    if (cost !== undefined) updatePayload.cost = Number(cost) || 0
    if (stock !== undefined) updatePayload.stock = Number(stock) || 0
    if (min_stock !== undefined) updatePayload.min_stock = Number(min_stock) || 0
    if (sku !== undefined) updatePayload.sku = sku?.trim() || null
    if (barcode !== undefined) updatePayload.barcode = barcode?.trim() || null
    if (image_url !== undefined) updatePayload.image_url = image_url || null
    if (is_active !== undefined) updatePayload.is_active = is_active

    // Copy any remaining valid fields
    for (const [key, val] of Object.entries(rest)) {
      if (key !== 'categories' && key !== 'id' && key !== 'created_at') {
        updatePayload[key] = val
      }
    }

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('products')
      .update(updatePayload)
      .eq('id', id)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'ไม่พบสินค้านี้ในระบบ' }, { status: 404 })
    }

    return NextResponse.json({ success: true, product: data[0] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update product' }, { status: 500 })
  }
}

// DELETE /api/admin/products — ลบสินค้าใน Supabase
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
      return NextResponse.json({ error: 'ไม่พบ ID สินค้าที่ต้องการลบ' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from('products').delete().eq('id', id)

    if (error) {
      // If foreign key constraint violates (e.g. product is referenced in sale_items), soft delete
      const { error: softErr } = await supabase.from('products').update({ is_active: false }).eq('id', id)
      if (softErr) {
        return NextResponse.json({ error: softErr.message }, { status: 500 })
      }
      return NextResponse.json({
        success: true,
        message: 'สินค้านี้มีประวัติการขายในระบบ จึงเปลี่ยนสถานะเป็น "หยุดขาย" เรียบร้อยแล้ว'
      })
    }

    return NextResponse.json({ success: true, message: 'ลบสินค้าสำเร็จ' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete product' }, { status: 500 })
  }
}
