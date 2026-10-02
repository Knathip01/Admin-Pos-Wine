'use client';

import React, { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/admin/DataTable';
import { Users, Search, Eye, AlertCircle, ShieldAlert, CheckCircle2, AlertTriangle, RotateCcw, Award, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { customersApi } from '@/lib/api/customers';
import { usersApi } from '@/lib/api/users';
import { loyaltyApi } from '@/lib/api/loyalty';
import { useApiAuth, ensureApiAuth } from '@/lib/store/api-auth';
import type { CustomerResponse } from '@/lib/api/types';

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
  const { accessToken } = useApiAuth();

  // State
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // 'active', 'suspended'

  // Notification state
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  async function loadMembers(force = false) {
    if (members.length === 0) setLoading(true);
    if (force) {
      setRefreshing(true);
      try {
        const { clearApiCache } = await import('@/lib/api/client');
        clearApiCache('customers');
        clearApiCache('users');
      } catch {}
    }
    setError(null);
    try {
      const token = (accessToken || (await ensureApiAuth())) ?? undefined;
      if (!token) throw new Error('ไม่สามารถเชื่อมต่อ API สมาชิกได้');

      // Fetch both FastAPI Customers and FastAPI Users
      const [custRes, usersRes] = await Promise.allSettled([
        customersApi.list({ search: search || undefined, page: 1, per_page: 100 }, token),
        usersApi.list({ per_page: 100 }, token),
      ]);

      const rawCustomers = custRes.status === 'fulfilled'
        ? (Array.isArray(custRes.value) ? custRes.value : (custRes.value?.customers || []))
        : [];

      const rawUsers = usersRes.status === 'fulfilled'
        ? (Array.isArray(usersRes.value) ? usersRes.value : (usersRes.value?.users || []))
        : [];

      // Set of emails already present in customers table
      const existingCustomerEmails = new Set(
        rawCustomers.map((c: any) => (c.email || '').toLowerCase().trim())
      );

      // Staff usernames to exclude from customers
      const staffUsernames = new Set(['admin', 'superadmin', 'manager', 'cashier', 'stock', 'bar', 'kitchen', 'staff']);

      const registeredMembers: any[] = [];
      for (const u of rawUsers) {
        const uEmail = (u.email || u.username || '').toLowerCase().trim();
        const isStaff = u.is_superadmin ||
          staffUsernames.has(u.username?.toLowerCase().trim()) ||
          (u.roles && u.roles.length > 0);

        // If this user is NOT staff and NOT already in customers table, they registered from web (ProjectbottleClub1)
        if (!isStaff && !existingCustomerEmails.has(uEmail)) {
          registeredMembers.push({
            id: u.id,
            first_name: u.display_name?.split(' ')[0] || u.username,
            last_name: (u.display_name?.split(' ').length > 1 ? u.display_name?.split(' ').slice(1).join(' ') : null),
            email: u.email || u.username,
            phone: u.phone || null,
            loyalty_points_balance: 0,
            is_active: u.status === 'active' || u.is_active !== false,
            created_at: u.created_at,
          });

          // Auto-sync into customers table in FastAPI
          customersApi.create({
            first_name: u.display_name?.split(' ')[0] || u.username,
            last_name: (u.display_name?.split(' ').length > 1 ? u.display_name?.split(' ').slice(1).join(' ') : null),
            email: u.email || u.username,
            phone: u.phone || null,
          }, token).catch(() => {});
        }
      }

      const allCustomers = [...rawCustomers, ...registeredMembers];

      const rows: MemberRow[] = allCustomers.map((c: any) => ({
        id: c.id,
        name: c.full_name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || `Customer #${c.id}`,
        email: c.email || c.phone || '-',
        points: Number(c.loyalty_points_balance ?? c.total_points ?? 0),
        orderCount: 0,
        isActive: c.is_active ?? true,
        createdAt: c.created_at ? new Date(c.created_at).toLocaleDateString('th-TH') : '-',
      }));

      setMembers(rows);
    } catch (err: any) {
      setError(err.message || 'ไม่สามารถดึงข้อมูลสมาชิกจาก API จริงได้');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMembers();
  }, [accessToken]);

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
        if (accessToken) {
          await customersApi.update(memberId, { is_active: nextStatus }, accessToken);
        } else {
          const res = await fetch(`/api/admin/users/${memberId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive: nextStatus })
          });
          if (!res.ok) throw new Error('ไม่สามารถอัปเดตสถานะบัญชีผู้ใช้ได้');
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
  if (search && !accessToken) {
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
      accessor: (row) => <span className="font-extrabold text-[#22e5ff]">#{row.id}</span>,
      sortable: true,
      sortKey: 'id',
    },
    {
      header: 'ชื่อสมาชิก',
      accessor: (row) => <span className="font-extrabold text-[#eef2ff]">{row.name}</span>,
    },
    {
      header: 'ข้อมูลติดต่อ',
      accessor: (row) => <span className="text-[#94a3c4] font-medium">{row.email}</span>,
    },
    {
      header: 'คะแนนสะสม (Loyalty)',
      accessor: (row) => <span className="font-black text-[#fbbf24]" style={{ fontFamily: "'Outfit', sans-serif" }}>{row.points.toLocaleString()} Points</span>,
      sortable: true,
      sortKey: 'points',
    },
    {
      header: 'จำนวนคำสั่งซื้อ',
      accessor: (row) => <span className="font-extrabold text-[#eef2ff]">{row.orderCount} ออเดอร์</span>,
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
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold border transition cursor-pointer ${
            row.isActive 
              ? 'badge-delivered' 
              : 'badge-rejected'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${row.isActive ? 'bg-[#34d399]' : 'bg-[#fb7185]'}`} />
          {row.isActive ? 'ปกติ (Active)' : 'ระงับบัญชี (Suspended)'}
        </button>
      )
    },
    {
      header: 'วันที่เข้าร่วม',
      accessor: (row) => <span className="text-[#5a6e90] text-xs font-semibold">{row.createdAt}</span>,
    },
    {
      header: 'การจัดการ',
      accessor: (row) => (
        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <Link
            href={`/admin/members/${row.id}`}
            className="admin-btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 cursor-pointer"
            style={{ textDecoration: 'none' }}
          >
            <Eye className="w-3.5 h-3.5" /> รายละเอียด
          </Link>
        </div>
      ),
      className: 'text-right'
    }
  ];

  return (
    <div className="space-y-5 sm:space-y-6 select-none font-sans animate-in" style={{ padding: '20px', maxWidth: 1500 }}>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-[#eef2ff] flex items-center gap-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
            <Users className="w-5 h-5 text-[#22e5ff]" /> สมาชิก & แต้มสะสม (Bottle Club)
          </h2>
          <p className="text-xs text-[#5a6e90] mt-0.5 font-semibold">ดูโปรไฟล์ลูกค้า เชื่อมต่อคะแนน Loyalty Points และสถานะการใช้งาน</p>
        </div>
        <button
          onClick={() => loadMembers(true)}
          disabled={refreshing}
          className="p-2.5 px-3.5 rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50 flex items-center gap-2 text-xs font-semibold self-start sm:self-auto"
          style={{ color: '#22e5ff', background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)' }}
          title="รีเฟรชข้อมูลสมาชิก"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>รีเฟรชข้อมูล</span>
        </button>
      </div>

      {/* Notifications */}
      {notification && (
        <div className={`admin-panel p-4 rounded-xl border text-xs flex items-start gap-3 ${
          notification.type === 'success' ? 'admin-alert-success' : 'admin-alert-error'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Search and Filters */}
      <div className="admin-panel flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#3d4d6a]">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="ค้นหาชื่อลูกค้า อีเมล หรือ รหัสสมาชิก..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') loadMembers(); }}
            className="admin-input w-full pl-11 pr-4 py-2.5 text-xs"
          />
        </div>

        {/* Status filter */}
        <div className="w-full md:w-64">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="admin-select w-full py-2.5 text-xs"
          >
            <option value="">ทั้งหมด (สถานะบัญชี)</option>
            <option value="active">ปกติ (Active)</option>
            <option value="suspended">ระงับการใช้งาน (Suspended)</option>
          </select>
        </div>
        
        {/* Refresh / Reset */}
        <button
          onClick={() => { setSearch(''); setStatusFilter(''); loadMembers(); }}
          className="admin-btn-secondary px-4 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" /> รีเฟรช
        </button>
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
