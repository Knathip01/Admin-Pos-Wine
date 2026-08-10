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
      <div className="flex gap-0.5 text-amber-500">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`w-3.5 h-3.5 ${i < rating ? 'fill-amber-500' : 'text-stone-700'}`}
          />
        ))}
      </div>
    );
  };

  const columns: Column<ReviewRow>[] = [
    {
      header: 'รหัสรีวิว',
      accessor: (row) => <span className="font-bold text-stone-400">#{row.id}</span>,
      sortable: true,
      sortKey: 'id',
    },
    {
      header: 'สินค้า',
      accessor: (row) => <span className="font-bold text-stone-200 truncate max-w-[150px] block">{row.productName}</span>,
    },
    {
      header: 'ผู้รีวิว',
      accessor: (row) => (
        <div>
          <p className="font-bold text-stone-200">{row.userName}</p>
          <p className="text-[10px] text-stone-500 mt-0.5">{row.userId}</p>
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
      accessor: (row) => <p className="text-stone-300 max-w-[280px] break-words line-clamp-2">{row.comment || '-'}</p>,
    },
    {
      header: 'สถานะการตรวจ',
      accessor: (row) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
          row.isApproved 
            ? 'bg-green-500/10 text-green-400 border-green-500/20' 
            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
        }`}>
          {row.isApproved ? 'อนุมัติแล้ว (Approved)' : 'รอการอนุมัติ (Pending)'}
        </span>
      )
    },
    {
      header: 'วันที่รีวิว',
      accessor: 'createdAt',
    },
    {
      header: 'การจัดการ',
      accessor: (row) => (
        <div className="flex justify-end gap-2">
          {!row.isApproved && (
            <button
              onClick={() => handleApprove(row.id)}
              className="p-2 bg-emerald-700/10 border border-emerald-500/10 hover:border-emerald-500/30 hover:bg-emerald-700/20 text-emerald-400 rounded-xl transition cursor-pointer"
              title="อนุมัติรีวิว"
            >
              <Check className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => handleDelete(row.id)}
            className="p-2 bg-red-950/10 border border-red-800/10 hover:border-red-800/30 hover:bg-red-950/20 text-red-400 rounded-xl transition cursor-pointer"
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
    <div className="space-y-6 select-none font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold font-serif text-stone-100 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-red-500" /> ตรวจสอบรีวิวสินค้า (Moderation)
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">อนุมัติและลบรีวิวสินค้าที่ไม่พึงประสงค์ เพื่อความโปร่งใสของร้านค้า</p>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div className={`p-4 rounded-xl border text-sm flex items-start gap-3 animate-fade-in ${
          notification.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-red-900/10 border-red-800/20 text-red-400'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Filter and Search */}
      <div className="bg-stone-900 border border-white/5 rounded-2xl p-6 shadow-lg flex flex-col sm:flex-row gap-4">
        {/* Rating filter */}
        <div className="flex-1">
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="w-full p-3.5 bg-stone-950 border border-white/10 rounded-xl text-stone-300 text-xs focus:outline-none focus:border-red-800 transition"
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
            className="w-full p-3.5 bg-stone-950 border border-white/10 rounded-xl text-stone-300 text-xs focus:outline-none focus:border-red-800 transition"
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
            className="px-4.5 py-3.5 bg-white/5 border border-white/5 hover:border-white/10 text-stone-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> ล้าง
          </button>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-800/30 text-red-200 text-sm flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
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
