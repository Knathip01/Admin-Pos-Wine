'use client';

import React, { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/admin/DataTable';
import { Star, Check, Trash2, ShieldAlert, AlertTriangle, CheckCircle2, MessageSquare, RotateCcw } from 'lucide-react';

interface ReviewRow {
  id: number;
  productId: number;
  productName: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state
  const [ratingFilter, setRatingFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // 'pending', 'approved'
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  async function loadReviews() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/reviews', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('ไม่สามารถดึงข้อมูลรีวิวได้');
      }
      const json = await res.json();
      setReviews(json.reviews);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReviews();
  }, []);

  const triggerNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleApprove = async (id: number) => {
    // Optimistic UI update
    setReviews(prev => prev.map(r => r.id === id ? { ...r, isApproved: true } : r));

    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isApproved: true })
      });

      if (!res.ok) {
        throw new Error('ไม่สามารถอนุมัติรีวิวได้');
      }
      triggerNotification('success', 'อนุมัติรีวิวสินค้าเรียบร้อยแล้ว');
    } catch (err: any) {
      // Revert
      setReviews(prev => prev.map(r => r.id === id ? { ...r, isApproved: false } : r));
      triggerNotification('error', err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('คุณต้องการลบรีวิวนี้ใช่หรือไม่?')) {
      const prevReviews = [...reviews];
      // Optimistic UI update
      setReviews(prev => prev.filter(r => r.id !== id));

      try {
        const res = await fetch(`/api/admin/reviews?id=${id}`, {
          method: 'DELETE'
        });

        if (!res.ok) {
          throw new Error('ไม่สามารถลบรีวิวได้');
        }
        triggerNotification('success', 'ลบรีวิวสินค้าเรียบร้อยแล้ว');
      } catch (err: any) {
        // Revert
        setReviews(prevReviews);
        triggerNotification('error', err.message);
      }
    }
  };

  // Filter reviews locally
  let filteredReviews = [...reviews];
  if (ratingFilter) {
    filteredReviews = filteredReviews.filter(r => r.rating === parseInt(ratingFilter));
  }
  if (statusFilter) {
    if (statusFilter === 'approved') filteredReviews = filteredReviews.filter(r => r.isApproved);
    else if (statusFilter === 'pending') filteredReviews = filteredReviews.filter(r => !r.isApproved);
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
      accessor: (row) => <span className="font-extrabold text-[#5a6e90]">#{row.id}</span>,
      sortable: true,
      sortKey: 'id',
    },
    {
      header: 'สินค้า',
      accessor: (row) => <span className="font-extrabold text-[#eef2ff] truncate max-w-[150px] block">{row.productName}</span>,
    },
    {
      header: 'ผู้รีวิว',
      accessor: (row) => (
        <div>
          <p className="font-bold text-[#eef2ff] m-0">{row.userName}</p>
          <p className="text-[10px] text-[#3d4d6a] mt-0.5 font-mono">{row.userId}</p>
        </div>
      )
    },
    {
      header: 'คะแนน',
      accessor: (row) => renderStars(row.rating),
      sortable: true,
      sortKey: 'rating',
    },
    {
      header: 'ความคิดเห็น',
      accessor: (row) => <p className="text-[#94a3c4] max-w-[280px] break-words line-clamp-2 m-0 text-xs font-medium">{row.comment || '-'}</p>,
    },
    {
      header: 'สถานะการตรวจ',
      accessor: (row) => (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold border ${
          row.isApproved 
            ? 'badge-delivered' 
            : 'badge-pending'
        }`}>
          {row.isApproved ? 'อนุมัติแล้ว (Approved)' : 'รอการอนุมัติ (Pending)'}
        </span>
      )
    },
    {
      header: 'วันที่รีวิว',
      accessor: (row) => <span className="text-[#5a6e90] text-xs font-semibold">{row.createdAt}</span>,
    },
    {
      header: 'การจัดการ',
      accessor: (row) => (
        <div className="flex justify-end gap-2">
          {!row.isApproved && (
            <button
              onClick={() => handleApprove(row.id)}
              className="p-2 bg-[rgba(16,185,129,0.12)] border border-[rgba(16,185,129,0.30)] hover:bg-[rgba(16,185,129,0.25)] text-[#34d399] rounded-xl transition cursor-pointer"
              title="อนุมัติรีวิว"
            >
              <Check className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => handleDelete(row.id)}
            className="p-2 bg-[rgba(244,63,94,0.12)] border border-[rgba(244,63,94,0.30)] hover:bg-[rgba(244,63,94,0.25)] text-[#fb7185] rounded-xl transition cursor-pointer"
            title="ลบรีวิว"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
      className: 'text-right'
    }
  ];

  return (
    <div className="space-y-6 select-none font-sans animate-in" style={{ padding: '20px', maxWidth: 1500 }}>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.4rem', fontWeight: 900, color: '#eef2ff', letterSpacing: '-0.025em', margin: 0 }}>
            💬 ตรวจสอบรีวิวสินค้า (Moderation)
          </h1>
          <p style={{ color: '#3d4d6a', fontSize: 13, fontWeight: 600, marginTop: 4 }}>
            อนุมัติและลบรีวิวสินค้าที่ไม่พึงประสงค์ เพื่อความโปร่งใสของร้านค้า
          </p>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-start gap-3 animate-fade-in ${
          notification.type === 'success' 
            ? 'bg-[rgba(16,185,129,0.10)] border-[rgba(16,185,129,0.30)] text-[#34d399]' 
            : 'bg-[rgba(244,63,94,0.10)] border-[rgba(244,63,94,0.30)] text-[#fb7185]'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Filter and Search */}
      <div className="admin-panel flex flex-col sm:flex-row gap-3">
        {/* Rating filter */}
        <div className="flex-1">
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="admin-select w-full py-2.5 text-xs"
          >
            <option value="">ทั้งหมด (จำนวนดาว)</option>
            <option value="5">5 ดาว (★★★★★)</option>
            <option value="4">4 ดาว (★★★★)</option>
            <option value="3">3 ดาว (★★★)</option>
            <option value="2">2 ดาว (★★)</option>
            <option value="1">1 ดาว (★)</option>
          </select>
        </div>

        {/* Status filter */}
        <div className="flex-1">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="admin-select w-full py-2.5 text-xs"
          >
            <option value="">ทั้งหมด (สถานะการตรวจ)</option>
            <option value="pending">รอการอนุมัติ (Pending)</option>
            <option value="approved">อนุมัติแล้ว (Approved)</option>
          </select>
        </div>

        {/* Reset */}
        {(ratingFilter || statusFilter) && (
          <button
            onClick={() => { setRatingFilter(''); setStatusFilter(''); }}
            className="admin-btn-secondary px-4 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> ล้าง
          </button>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="admin-alert-error flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-[#fb7185]" />
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
    </div>
  );
}

