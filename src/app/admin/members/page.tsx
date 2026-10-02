'use client';

import React, { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/admin/DataTable';
import { Users, Search, Eye, ShieldAlert, CheckCircle2, AlertTriangle, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { customersApi } from '@/lib/api/customers';
import { useApiAuth, ensureApiAuth } from '@/lib/store/api-auth';

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
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  async function loadMembers() {
    setLoading(true);
    setError(null);
    try {
      const token = accessToken || await ensureApiAuth();
      if (!token) throw new Error('ไม่สามารถเชื่อมต่อ API สมาชิกได้');
      const result = await customersApi.list({ search: search || undefined, page: 1, per_page: 50 }, token);
      const rawCustomers = Array.isArray(result) ? result : (result?.customers || []);
      setMembers(rawCustomers.map((c: any) => ({
        id: c.id,
        name: c.full_name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || `Customer #${c.id}`,
        email: c.email || c.phone || '-',
        points: Number(c.loyalty_points_balance ?? c.total_points ?? 0),
        orderCount: 0,
        isActive: c.is_active ?? true,
        createdAt: c.created_at ? new Date(c.created_at).toLocaleDateString('th-TH') : '-',
      })));
    } catch (err: any) {
      setError(err.message || 'ไม่สามารถดึงข้อมูลสมาชิกจาก API จริงได้');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadMembers(); }, [accessToken]);

  const triggerNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleToggleStatus = async (memberId: number, name: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    if (!confirm(nextStatus ? `เปิดใช้งานบัญชี "${name}"?` : `ระงับบัญชี "${name}"?`)) return;
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, isActive: nextStatus } : m));
    try {
      const token = accessToken || await ensureApiAuth();
      if (!token) throw new Error('ไม่สามารถเชื่อมต่อ API ได้');
      await customersApi.update(memberId, { is_active: nextStatus }, token);
      triggerNotification('success', `อัปเดตสถานะ "${name}" เรียบร้อยแล้ว`);
    } catch (err: any) {
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, isActive: currentStatus } : m));
      triggerNotification('error', err.message);
    }
  };

  let filteredMembers = [...members];
  if (statusFilter === 'active') filteredMembers = filteredMembers.filter(m => m.isActive);
  else if (statusFilter === 'suspended') filteredMembers = filteredMembers.filter(m => !m.isActive);

  const columns: Column<MemberRow>[] = [
    { header: 'รหัสสมาชิก', accessor: (row) => <span className="font-extrabold text-[#22e5ff]">#{row.id}</span>, sortable: true, sortKey: 'id' },
    { header: 'ชื่อสมาชิก', accessor: (row) => <span className="font-extrabold text-[#eef2ff]">{row.name}</span> },
    { header: 'อีเมลติดต่อ', accessor: (row) => <span className="text-[#94a3c4] font-medium">{row.email}</span> },
    { header: 'คะแนนสะสม', accessor: (row) => <span className="font-extrabold text-[#22e5ff]">{row.points.toLocaleString()} Points</span>, sortable: true, sortKey: 'points' },
    { header: 'สถานะ', accessor: (row) => (
      <button onClick={(e) => { e.stopPropagation(); handleToggleStatus(row.id, row.name, row.isActive); }}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold border cursor-pointer ${row.isActive ? 'badge-delivered' : 'badge-rejected'}`}>
        {row.isActive ? 'ปกติ' : 'ระงับ'}
      </button>
    )},
    { header: 'วันที่เข้าร่วม', accessor: (row) => <span className="text-[#5a6e90] text-xs">{row.createdAt}</span> },
    { header: 'การจัดการ', accessor: (row) => (
      <Link href={`/admin/members/${row.id}`} className="admin-btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5" style={{ textDecoration: 'none' }}>
        <Eye className="w-3.5 h-3.5" /> รายละเอียด
      </Link>
    ), className: 'text-right' },
  ];

  return (
    <div className="space-y-5 sm:space-y-6 animate-in" style={{ padding: '20px', maxWidth: 1500 }}>
      <div>
        <h2 className="text-lg font-black text-[#eef2ff] flex items-center gap-2"><Users className="w-5 h-5 text-[#22e5ff]" /> สมาชิก & แต้มสะสม</h2>
        <p className="text-xs text-[#5a6e90] mt-0.5">ข้อมูลจาก API จริง</p>
      </div>
      {notification && (
        <div className={`admin-panel p-4 text-xs flex items-start gap-3 ${notification.type === 'success' ? 'admin-alert-success' : 'admin-alert-error'}`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{notification.message}</span>
        </div>
      )}
      <div className="admin-panel flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3d4d6a]" />
          <input className="admin-input w-full pl-11 py-2.5 text-xs" placeholder="ค้นหาชื่อลูกค้า อีเมล หรือ รหัสสมาชิก..."
            value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') loadMembers(); }} />
        </div>
        <select className="admin-select w-full md:w-64 py-2.5 text-xs" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">ทั้งหมด</option>
          <option value="active">ปกติ</option>
          <option value="suspended">ระงับ</option>
        </select>
        <button onClick={() => { setSearch(''); setStatusFilter(''); loadMembers(); }} className="admin-btn-secondary px-4 py-2.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
          <RotateCcw className="w-3.5 h-3.5" /> รีเฟรช
        </button>
      </div>
      {error && <div className="admin-alert-error flex items-start gap-3"><ShieldAlert className="w-5 h-5" /><span>{error}</span></div>}
      <DataTable columns={columns} data={filteredMembers} loading={loading} itemsPerPage={10} totalItems={filteredMembers.length}
        onRowClick={(row) => router.push(`/admin/members/${row.id}`)} emptyMessage="ไม่พบข้อมูลสมาชิก" />
    </div>
  );
}
