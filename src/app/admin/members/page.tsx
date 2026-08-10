'use client';

import React, { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/admin/DataTable';
import { Users, Search, Eye, AlertCircle, ShieldAlert, CheckCircle2, AlertTriangle, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface MemberRow {
  id: number;
  name: string;
  email: string;
  points: number;
  orderCount: number;
  isActive: boolean;
  createdAt: string;
}

export default function AdminMembersPage() {
  const router = useRouter();

  // State
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // 'active', 'suspended'

  // Notification state
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  async function loadMembers() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/users', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('ไม่สามารถโหลดข้อมูลสมาชิกได้');
      }
      const json = await res.json();
      setMembers(json.members || json.users || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMembers();
  }, []);

  const triggerNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleToggleStatus = async (memberId: number, name: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    const confirmMessage = nextStatus
      ? `คุณต้องการเปิดใช้งานบัญชีของ "${name}" ใช่หรือไม่?`
      : `คุณต้องการระงับใช้งานบัญชีของ "${name}" ใช่หรือไม่?`;

    if (confirm(confirmMessage)) {
      // Optimistic update
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, isActive: nextStatus } : m));

      try {
        const res = await fetch(`/api/admin/users/${memberId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: nextStatus })
        });

        if (!res.ok) {
          throw new Error('ไม่สามารถอัปเดตสถานะบัญชีผู้ใช้ได้');
        }

        triggerNotification('success', `อัปเดตสถานะบัญชีของ "${name}" เรียบร้อยแล้ว`);
      } catch (err: any) {
        // Revert
        setMembers(prev => prev.map(m => m.id === memberId ? { ...m, isActive: currentStatus } : m));
        triggerNotification('error', err.message);
      }
    }
  };

  // Filter members locally
  let filteredMembers = [...members];
  if (search) {
    const q = search.toLowerCase();
    filteredMembers = filteredMembers.filter(m => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.id.toString().includes(q));
  }
  if (statusFilter) {
    if (statusFilter === 'active') filteredMembers = filteredMembers.filter(m => m.isActive);
    else if (statusFilter === 'suspended') filteredMembers = filteredMembers.filter(m => !m.isActive);
  }

  const columns: Column<MemberRow>[] = [
    {
      header: 'รหัสสมาชิก',
      accessor: (row) => <span className="font-bold text-stone-400">#{row.id}</span>,
      sortable: true,
      sortKey: 'id',
    },
    {
      header: 'ชื่อสมาชิก',
      accessor: (row) => <span className="font-bold text-stone-200">{row.name}</span>,
    },
    {
      header: 'อีเมลติดต่อ',
      accessor: (row) => <span className="text-stone-400">{row.email}</span>,
    },
    {
      header: 'คะแนนสะสม',
      accessor: (row) => <span className="font-bold text-amber-500">{row.points.toLocaleString()} Points</span>,
      sortable: true,
      sortKey: 'points',
    },
    {
      header: 'จำนวนคำสั่งซื้อ',
      accessor: (row) => <span className="font-bold text-stone-300">{row.orderCount} ออเดอร์</span>,
      sortable: true,
      sortKey: 'orderCount',
    },
    {
      header: 'สถานะบัญชี',
      accessor: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggleStatus(row.id, row.name, row.isActive);
          }}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer ${
            row.isActive 
              ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20' 
              : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${row.isActive ? 'bg-green-400' : 'bg-red-400'}`} />
          {row.isActive ? 'ปกติ (Active)' : 'ระงับบัญชี (Suspended)'}
        </button>
      )
    },
    {
      header: 'วันที่เข้าร่วม',
      accessor: 'createdAt',
    },
    {
      header: 'การจัดการ',
      accessor: (row) => (
        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <Link
            href={`/admin/members/${row.id}`}
            className="inline-flex items-center gap-1 py-1.5 px-3 bg-white/5 border border-white/5 hover:border-red-800/30 hover:bg-red-850/10 text-stone-300 hover:text-red-400 font-bold rounded-lg transition text-xs cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" /> รายละเอียด
          </Link>
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
            <Users className="w-5 h-5 text-red-500" /> จัดการข้อมูลสมาชิกร้านค้า
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">ดูโปรไฟล์สมาชิก ปรับคะแนนสะสม และสลับสถานะระงับใช้งานบัญชี</p>
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

      {/* Search and Filters */}
      <div className="bg-stone-900 border border-white/5 rounded-2xl p-6 shadow-lg flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="ค้นหาชื่อลูกค้า อีเมล หรือ รหัสสมาชิก..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-stone-950 border border-white/10 rounded-xl text-stone-200 text-xs placeholder:text-stone-700 focus:outline-none focus:border-red-800 transition"
          />
        </div>

        {/* Status filter */}
        <div className="w-full md:w-64">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full p-3.5 bg-stone-950 border border-white/10 rounded-xl text-stone-300 text-xs focus:outline-none focus:border-red-800 transition"
          >
            <option value="">ทั้งหมด (สถานะบัญชี)</option>
            <option value="active">ปกติ (Active)</option>
            <option value="suspended">ระงับการใช้งาน (Suspended)</option>
          </select>
        </div>
        
        {/* Reset */}
        {(search || statusFilter) && (
          <button
            onClick={() => { setSearch(''); setStatusFilter(''); }}
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
        data={filteredMembers}
        loading={loading}
        itemsPerPage={10}
        totalItems={filteredMembers.length}
        onRowClick={(row) => router.push(`/admin/members/${row.id}`)}
        emptyMessage="ไม่พบข้อมูลสมาชิกร้านค้าที่ค้นหา"
      />
    </div>
  );
}
