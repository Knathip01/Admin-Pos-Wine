import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const SHARED_REVIEWS_FILE = path.resolve('C:\\ProjectbottleClub1\\shared\\reviews.json');

function readSharedReviews(): any[] {
  try {
    if (fs.existsSync(SHARED_REVIEWS_FILE)) {
      const data = fs.readFileSync(SHARED_REVIEWS_FILE, 'utf8');
      return JSON.parse(data) || [];
    }
  } catch (e) {
    console.warn('[admin reviews] Failed to read shared reviews:', e);
  }
  return [];
}

function writeSharedReviews(reviews: any[]) {
  try {
    const dir = path.dirname(SHARED_REVIEWS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SHARED_REVIEWS_FILE, JSON.stringify(reviews, null, 2), 'utf8');
  } catch (e) {
    console.error('[admin reviews] Failed to write shared reviews:', e);
  }
}

export async function GET(request: NextRequest) {
  try {
    const sharedReviews = readSharedReviews();

    // Default preset reviews to merge with real customer reviews
    const presetReviews = [
      {
        id: 101,
        productId: 6,
        product_id: 6,
        productName: 'Mont Clair Red Wine 750ml',
        product_name: 'Mont Clair Red Wine 750ml',
        userId: 'cust_01',
        userName: 'สมชาย รักไวน์',
        rating: 5,
        comment: 'บอดี้แน่น รสสัมผัสนุ่มมาก เหมาะกับทานคู่กับสเต๊กเนื้อ ดื่มง่ายกลิ่นหอมผลไม้ชัดเจน คุ้มราคามากครับ',
        isApproved: true,
        status: 'approved',
        createdAt: '28/09/2026',
      },
      {
        id: 102,
        productId: 7,
        product_id: 7,
        productName: 'Siam Winery White Wine 750ml',
        product_name: 'Siam Winery White Wine 750ml',
        userId: 'cust_02',
        userName: 'วิภาดา พาเพลิน',
        rating: 5,
        comment: 'ไวน์ขาวรสชาติสดชื่น เปรี้ยวกำลังดี เสิร์ฟเย็นๆ คู่กับซีฟู้ดลงตัวสุดๆ สั่งซ้ำรอบที่สองแล้วค่ะ',
        isApproved: true,
        status: 'approved',
        createdAt: '29/09/2026',
      },
    ];

    // Real customer reviews appear first
    const allReviews = [...sharedReviews, ...presetReviews];

    return NextResponse.json({
      reviews: allReviews,
      total: allReviews.length,
    }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (err: any) {
    return NextResponse.json({ reviews: [], total: 0 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, isApproved, status } = body;
    const targetStatus = status || (isApproved ? 'approved' : 'rejected');

    const reviews = readSharedReviews();
    const targetIndex = reviews.findIndex((r) => r.id === id || String(r.id) === String(id));

    if (targetIndex !== -1) {
      reviews[targetIndex].status = targetStatus;
      reviews[targetIndex].isApproved = targetStatus === 'approved';
      reviews[targetIndex].is_approved = targetStatus === 'approved';
      writeSharedReviews(reviews);
    }

    return NextResponse.json({ success: true, status: targetStatus });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    const reviews = readSharedReviews();
    const filtered = reviews.filter((r) => r.id !== Number(id) && String(r.id) !== String(id));
    writeSharedReviews(filtered);

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
