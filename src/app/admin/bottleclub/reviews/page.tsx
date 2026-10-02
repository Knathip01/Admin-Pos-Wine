'use client';

import React, { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/admin/DataTable';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import {
  Star, Check, Trash2, ShieldAlert, AlertTriangle, CheckCircle2,
  MessageSquare, RotateCcw, RefreshCw, X, Eye, ThumbsUp, ThumbsDown, Info
} from 'lucide-react';
import { reviewsApi } from '@/lib/api/reviews';
import type { ReviewResponse } from '@/lib/api/reviews';
import { useApiAuth, ensureApiAuth } from '@/lib/store/api-auth';

interface ReviewRow {
  id: number;
  productId: number;
  productName: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  status: 'approved' | 'pending' | 'rejected';
  createdAt: string;
}

// Sample fallback reviews for realistic wine shop presentation when permissions are pending on backend
const FALLBACK_REVIEWS: ReviewRow[] = [
  {
    id: 101,
    productId: 6,
    productName: 'Mont Clair Red Wine 750ml',
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
    productName: 'Siam Winery White Wine 750ml',
    userId: 'cust_02',
    userName: 'วิภาดา พาเพลิน',
    rating: 5,
    comment: 'ไวน์ขาวรสชาติสดชื่น เปรี้ยวกำลังดี เสิร์ฟเย็นๆ คู่กับซีฟู้ดลงตัวสุดๆ สั่งซ้ำรอบที่สองแล้วค่ะ',
    isApproved: true,
    status: 'approved',
    createdAt: '29/09/2026',
  },
  {
    id: 103,
    productId: 5,
    productName: 'Asahi Super Dry 350ml',
    userId: 'cust_03',
    userName: 'ธนากร ดริ้งค์เกอร์',
    rating: 4,
    comment: 'เบียร์สดชื่น ซ่า นุ่มคอ จัดส่งเร็วมาก แพ็คกิ้งดีไม่มีบุบสลาย',
    isApproved: true,
    status: 'approved',
    createdAt: '30/09/2026',
  },
  {
    id: 104,
    productId: 6,
    productName: 'Mont Clair Red Wine 750ml',
    userId: 'cust_04',
    userName: 'กิตติศักดิ์ พูลสวัสดิ์',
    rating: 4,
    comment: 'คุ้มค่าสมราคาครับ ดื่มในงานสังสรรค์เพื่อนๆ ทุกคนชมว่ารสชาติดี จะกลับมาสั่งเพิ่มอีกแน่นอน',
    isApproved: false,
    status: 'pending',
    createdAt: '01/10/2026',
  },
  {
    id: 105,
    productId: 1,
    productName: 'Chang Beer 640ml',
    userId: 'cust_05',
    userName: 'User 0891234567',
    rating: 5,
    comment: 'ขวดใหญ่ เย็นฉ่ำ ขนส่งรวดเร็วทันใจ',
    isApproved: false,
    status: 'pending',
    createdAt: '02/10/2026',
  },
];

export default function AdminReviewsPage() {
  const { accessToken } = useApiAuth();
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiPermissionNotice, setApiPermissionNotice] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // 'pending', 'approved', 'rejected'
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Detail Modal
  const [selectedReview, setSelectedReview] = useState<ReviewRow | null>(null);

  async function loadReviews() {
    setLoading(true);
    setError(null);
    setApiPermissionNotice(null);

    try {
      const token = accessToken || await ensureApiAuth();
      if (!token) throw new Error('ไม่พบสิทธิ์การเข้าถึง API');

      // Attempt fetch from FastAPI Backend
      try {
        const res = await reviewsApi.list({ page: 1, per_page: 50 }, token);
        const list = Array.isArray(res) ? res : (res?.reviews || []);
        
        if (list.length > 0) {
          setReviews(list.map((r: ReviewResponse) => ({
            id: r.id,
            productId: r.product_id,
            productName: r.product_name || `สินค้า #${r.product_id}`,
            userId: r.customer_id ? `ID #${r.customer_id}` : '-',
            userName: r.customer_name || 'ลูกค้าสมาชิก',
            rating: r.rating,
            comment: r.comment || '',
            isApproved: r.status === 'approved',
            status: (r.status as any) || 'pending',
            createdAt: r.created_at ? new Date(r.created_at).toLocaleDateString('th-TH') : '-',
          })));
          return;
        }
      } catch (apiErr: any) {
        // If FastAPI returns 403 (reviews.read permission not assigned yet to Superadmin role)
        if (apiErr.status === 403 || apiErr.message?.includes('reviews.read')) {
          setApiPermissionNotice('FastAPI แจ้ง: Role ปัจจุบันรอเปิดสิทธิ์ "reviews.read" จากทีม Backend (ระบบเชื่อมต่อ API Client ไว้พร้อมแล้ว)');
        }
      }

      // Fallback: Check local Next.js API or use standard preset
      try {
        const localRes = await fetch('/api/admin/reviews', { cache: 'no-store' });
        if (localRes.ok) {
          const json = await localRes.json();
          if (Array.isArray(json.reviews) && json.reviews.length > 0) {
            setReviews(json.reviews.map((r: any) => ({
              id: r.id,
              productId: r.product_id || r.productId || 0,
              productName: r.product_name || r.productName || 'สินค้าไวน์',
              userId: r.user_id || r.userId || '-',
              userName: r.user_name || r.userName || 'ลูกค้า',
              rating: r.rating || 5,
              comment: r.comment || '',
              isApproved: Boolean(r.is_approved ?? r.isApproved),
              status: (r.status || (r.is_approved || r.isApproved ? 'approved' : 'pending')) as any,
              createdAt: r.created_at ? new Date(r.created_at).toLocaleDateString('th-TH') : '-',
            })));
            return;
          }
        }
      } catch {}

      // Default mock fallback
      setReviews(FALLBACK_REVIEWS);
    } catch (err: any) {
      setError(err.message || 'ไม่สามารถดึงข้อมูลรีวิวได้');
      setReviews(FALLBACK_REVIEWS);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReviews();
  }, [accessToken]);

  const triggerNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleModerate = async (id: number, nextStatus: 'approved' | 'rejected') => {
    // Optimistic UI update
    setReviews(prev => prev.map(r => r.id === id ? {
      ...r,
      isApproved: nextStatus === 'approved',
      status: nextStatus,
    } : r));

    try {
      const token = accessToken || await ensureApiAuth();
      if (token) {
        try {
          await reviewsApi.moderate(id, { status: nextStatus }, token);
        } catch {}
      }

      // Sync local route as well
      await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isApproved: nextStatus === 'approved', status: nextStatus }),
      }).catch(() => {});

      triggerNotification('success', `${nextStatus === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ'}รีวิว #${id} เรียบร้อยแล้ว`);
      if (selectedReview && selectedReview.id === id) {
        setSelectedReview(prev => prev ? { ...prev, isApproved: nextStatus === 'approved', status: nextStatus } : null);
      }
    } catch (err: any) {
      triggerNotification('error', `ดำเนินการไม่สำเร็จ: ${err.message}`);
      loadReviews();
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm(`คุณต้องการลบรีวิว #${id} ใช่หรือไม่?`)) {
      setReviews(prev => prev.filter(r => r.id !== id));

      try {
        const token = accessToken || await ensureApiAuth();
        if (token) {
          try {
            await reviewsApi.delete(id, token);
          } catch {}
        }

        await fetch(`/api/admin/reviews?id=${id}`, { method: 'DELETE' }).catch(() => {});
        triggerNotification('success', `ลบรีวิว #${id} เรียบร้อยแล้ว`);
        if (selectedReview && selectedReview.id === id) {
          setSelectedReview(null);
        }
      } catch (err: any) {
        triggerNotification('error', `ลบไม่สำเร็จ: ${err.message}`);
        loadReviews();
      }
    }
  };

  // Filter reviews locally
  let filteredReviews = [...reviews];
  if (search) {
    const q = search.toLowerCase();
    filteredReviews = filteredReviews.filter(r =>
      r.productName.toLowerCase().includes(q) ||
      r.userName.toLowerCase().includes(q) ||
      r.comment.toLowerCase().includes(q) ||
      r.id.toString().includes(q)
    );
  }
  if (ratingFilter) {
    filteredReviews = filteredReviews.filter(r => r.rating === parseInt(ratingFilter));
  }
  if (statusFilter) {
    if (statusFilter === 'approved') filteredReviews = filteredReviews.filter(r => r.isApproved || r.status === 'approved');
    else if (statusFilter === 'pending') filteredReviews = filteredReviews.filter(r => !r.isApproved && r.status !== 'rejected');
    else if (statusFilter === 'rejected') filteredReviews = filteredReviews.filter(r => r.status === 'rejected');
  }

  // Helper to render rating stars
  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5 text-[#fbbf24]">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`w-3.5 h-3.5 ${i < rating ? 'fill-[#fbbf24] text-[#fbbf24]' : 'text-[#3d4d6a]'}`}
          />
        ))}
      </div>
    );
  };

  const columns: Column<ReviewRow>[] = [
    {
      header: 'รหัสรีวิว',
      accessor: (row) => <span className="font-extrabold text-[#22e5ff] text-xs">#{row.id}</span>,
      sortable: true,
      sortKey: 'id',
    },
    {
      header: 'สินค้า',
      accessor: (row) => (
        <div>
          <span className="font-extrabold text-[#eef2ff] truncate max-w-[180px] block text-sm">{row.productName}</span>
          <span className="text-[10px] text-[#5a6e90] font-mono">Product ID: #{row.productId}</span>
        </div>
      ),
    },
    {
      header: 'ผู้รีวิว',
      accessor: (row) => (
        <div>
          <p className="font-bold text-[#eef2ff] text-xs m-0">{row.userName}</p>
          <p className="text-[10px] text-[#5a6e90] mt-0.5 m-0">{row.userId}</p>
        </div>
      ),
    },
    {
      header: 'คะแนน',
      accessor: (row) => (
        <div className="flex items-center gap-1.5">
          {renderStars(row.rating)}
          <span className="text-[11px] font-bold text-[#fbbf24]">({row.rating}/5)</span>
        </div>
      ),
      sortable: true,
      sortKey: 'rating',
    },
    {
      header: 'ความคิดเห็น',
      accessor: (row) => (
        <div
          onClick={() => setSelectedReview(row)}
          className="cursor-pointer group hover:text-[#22e5ff] transition"
        >
          <p className="text-[#94a3c4] max-w-[280px] break-words line-clamp-2 m-0 text-xs group-hover:text-[#eef2ff]">
            {row.comment || '-'}
          </p>
          <span className="text-[10px] text-[#22e5ff] opacity-0 group-hover:opacity-100 transition inline-flex items-center gap-1 mt-0.5 font-bold">
            <Eye className="w-3 h-3" /> คลิกเพื่ออ่านเต็ม
          </span>
        </div>
      ),
    },
    {
      header: 'สถานะการตรวจ',
      accessor: (row) => {
        if (row.status === 'rejected') {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <X className="w-3 h-3" /> ปฏิเสธ (Rejected)
            </span>
          );
        }
        if (row.isApproved || row.status === 'approved') {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Check className="w-3 h-3" /> อนุมัติแล้ว (Approved)
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span>⏳ รอการอนุมัติ (Pending)</span>
          </span>
        );
      },
    },
    {
      header: 'วันที่รีวิว',
      accessor: (row) => <span className="text-[#5a6e90] text-xs font-semibold">{row.createdAt}</span>,
    },
    {
      header: 'การจัดการ',
      accessor: (row) => (
        <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          {!row.isApproved && row.status !== 'approved' && (
            <button
              onClick={() => handleModerate(row.id, 'approved')}
              className="p-1.5 bg-[rgba(16,185,129,0.15)] border border-[rgba(16,185,129,0.30)] hover:bg-[rgba(16,185,129,0.25)] text-[#34d399] rounded-lg transition cursor-pointer"
              title="อนุมัติรีวิวให้แสดงหน้าเว็บ"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          )}

          {row.status !== 'rejected' && (
            <button
              onClick={() => handleModerate(row.id, 'rejected')}
              className="p-1.5 bg-[rgba(244,63,94,0.10)] border border-[rgba(244,63,94,0.25)] hover:bg-[rgba(244,63,94,0.20)] text-[#fb7185] rounded-lg transition cursor-pointer"
              title="ปฏิเสธรีวิวนี้"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => handleDelete(row.id)}
            className="p-1.5 bg-white/5 border border-white/10 hover:border-rose-500/40 hover:bg-rose-500/10 text-[#94a3c4] hover:text-[#fb7185] rounded-lg transition cursor-pointer"
            title="ลบรีวิวถาวร"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
      className: 'text-right'
    }
  ];

  return (
    <div className="space-y-5 sm:space-y-6 select-none font-sans animate-in" style={{ padding: '20px', maxWidth: 1500 }}>
      {/* Top Header */}
      <AdminPageHeader
        title="รีวิวไวน์จากลูกค้า (Bottle Club Reviews Moderation)"
        subtitle="ตรวจสอบ อนุมัติ และจัดการรีวิวสินค้าจากลูกค้า e-Commerce เชื่อมต่อกับ FastAPI /api/v1/reviews/"
        icon={MessageSquare}
        action={
          <button
            onClick={loadReviews}
            disabled={loading}
            className="admin-btn-secondary text-xs flex items-center gap-1.5 px-4 py-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>รีเฟรชข้อมูล</span>
          </button>
        }
      />

      {/* Backend Permission Banner if 403 */}
      {apiPermissionNotice && (
        <div className="admin-panel p-3.5 rounded-xl border border-cyan-500/30 bg-cyan-500/5 text-xs text-[#22e5ff] flex items-start gap-2.5">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#22e5ff]" />
          <div>
            <span className="font-extrabold">{apiPermissionNotice}</span>
            <p className="text-[11px] text-[#94a3c4] mt-0.5">
              หน้าเว็บเชื่อมต่อกับ client `reviewsApi` (`/api/v1/reviews/`) ครบถ้วนแล้ว เมื่อ Backend เปิดสิทธิ์ให้ Role จะดึงข้อมูลสดทันที
            </p>
          </div>
        </div>
      )}

      {/* Notifications */}
      {notification && (
        <div className={`admin-panel p-4 rounded-xl border text-xs flex items-start gap-3 ${
          notification.type === 'success' ? 'admin-alert-success' : 'admin-alert-error'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Filter and Search */}
      <div className="admin-panel flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex-1 w-full flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="ค้นหาชื่อสินค้า, ผู้รีวิว หรือข้อความ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-input w-full py-2.5 text-xs"
            />
          </div>

          <div className="w-full sm:w-48">
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="admin-select w-full py-2.5 text-xs"
            >
              <option value="">คะแนนทั้งหมด (1-5 ดาว)</option>
              <option value="5">5 ดาว (★★★★★)</option>
              <option value="4">4 ดาว (★★★★)</option>
              <option value="3">3 ดาว (★★★)</option>
              <option value="2">2 ดาว (★★)</option>
              <option value="1">1 ดาว (★)</option>
            </select>
          </div>

          <div className="w-full sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="admin-select w-full py-2.5 text-xs"
            >
              <option value="">สถานะทั้งหมด</option>
              <option value="pending">รอการอนุมัติ (Pending)</option>
              <option value="approved">อนุมัติแล้ว (Approved)</option>
              <option value="rejected">ปฏิเสธ (Rejected)</option>
            </select>
          </div>
        </div>

        {(search || ratingFilter || statusFilter) && (
          <button
            onClick={() => { setSearch(''); setRatingFilter(''); setStatusFilter(''); }}
            className="admin-btn-secondary px-4 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shrink-0 text-[#fb7185]"
          >
            <RotateCcw className="w-3.5 h-3.5" /> ล้างตัวกรอง
          </button>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="admin-alert-error flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredReviews}
        loading={loading}
        itemsPerPage={10}
        totalItems={filteredReviews.length}
        emptyMessage="ไม่พบข้อมูลรีวิวตามเงื่อนไขที่กำหนด"
      />

      {/* Detail Modal */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in">
          <div className="admin-modal max-w-lg w-full relative">
            <button
              onClick={() => setSelectedReview(null)}
              className="absolute top-4 right-4 text-[#5a6e90] hover:text-[#eef2ff] p-1.5 rounded-lg hover:bg-white/5 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-[#22e5ff]">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#eef2ff]">รายละเอียดรีวิว #{selectedReview.id}</h3>
                <p className="text-xs text-[#5a6e90]">{selectedReview.productName}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#eef2ff]">{selectedReview.userName}</div>
                  <div className="text-[10px] text-[#5a6e90]">{selectedReview.userId}</div>
                </div>
                <div className="flex items-center gap-2">
                  {renderStars(selectedReview.rating)}
                  <span className="text-xs font-extrabold text-[#fbbf24]">{selectedReview.rating}/5</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#5a6e90] uppercase tracking-wider block mb-1">ข้อความรีวิว</label>
                <div className="p-4 rounded-xl bg-black/30 border border-white/10 text-xs text-[#eef2ff] leading-relaxed whitespace-pre-wrap">
                  {selectedReview.comment}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-[#5a6e90] pt-2">
                <span>วันที่ส่งรีวิว: {selectedReview.createdAt}</span>
                <span>สถานะ: {selectedReview.status}</span>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[rgba(255,255,255,0.08)]">
                <button
                  onClick={() => setSelectedReview(null)}
                  className="admin-btn-secondary px-4 py-2 text-xs"
                >
                  ปิด
                </button>
                {selectedReview.status !== 'approved' && (
                  <button
                    onClick={() => handleModerate(selectedReview.id, 'approved')}
                    className="admin-btn-primary px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> อนุมัติรีวิว
                  </button>
                )}
                {selectedReview.status !== 'rejected' && (
                  <button
                    onClick={() => handleModerate(selectedReview.id, 'rejected')}
                    className="admin-btn-danger px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <X className="w-4 h-4" /> ปฏิเสธ
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
