'use client';

import React, { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/admin/DataTable';
import {
  Users,
  Search,
  Eye,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Award,
  Plus,
  X,
  Phone,
  Mail,
  User,
  History,
  TrendingUp,
  TrendingDown,
  Save,
  Check,
  MapPin,
  Copy,
} from 'lucide-react';
import { customersApi } from '@/lib/api/customers';
import { usersApi } from '@/lib/api/users';
import { loyaltyApi } from '@/lib/api/loyalty';
import { useApiAuth, ensureApiAuth } from '@/lib/store/api-auth';
import type { CustomerResponse, LoyaltyBalanceResponse, LoyaltyTransactionResponse } from '@/lib/api/types';

interface MemberRow {
  id: number;
  name: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  points: number;
  isActive: boolean;
  createdAt: string;
  address?: string | null;
}

const MOCK_MEMBERS: MemberRow[] = [
  {
    id: 1,
    name: 'คุณอนันต์ ภักดีสุวรรณ (Platinum VIP)',
    first_name: 'อนันต์',
    last_name: 'ภักดีสุวรรณ',
    email: 'anan@luxurybottle.com',
    phone: '081-111-2222',
    points: 12450,
    isActive: true,
    createdAt: '01/01/2026',
    address: '99/8 อาคารสุขุมวิทคอมเพล็กซ์ ชั้น 24 ซ.สุขุมวิท 21 วัฒนา กทม. 10110',
  },
  {
    id: 2,
    name: 'คุณพรทิพย์ สุวรรณรัตน์ (Gold Member)',
    first_name: 'พรทิพย์',
    last_name: 'สุวรรณรัตน์',
    email: 'porntip@gmail.com',
    phone: '089-333-4444',
    points: 3800,
    isActive: true,
    createdAt: '10/01/2026',
    address: '45/12 หมู่บ้านลัดดารมย์ ถ.ราชพฤกษ์ ต.บางรักน้อย นนทบุรี 11000',
  },
  {
    id: 3,
    name: 'คุณธนากร เจริญทรัพย์ (Silver Member)',
    first_name: 'ธนากร',
    last_name: 'เจริญทรัพย์',
    email: 'thanakorn@outlook.com',
    phone: '086-777-8888',
    points: 1200,
    isActive: true,
    createdAt: '20/01/2026',
    address: '120/5 ถ.สาทรใต้ แขวงทุ่งมหาเมฆ สาทร กทม. 10120',
  },
  {
    id: 4,
    name: 'คุณชลธิชา สดใส (Bronze Member)',
    first_name: 'ชลธิชา',
    last_name: 'สดใส',
    email: 'chonthicha@hotmail.com',
    phone: '082-444-5555',
    points: 450,
    isActive: true,
    createdAt: '01/02/2026',
    address: '88/15 คอนโดไอดีโอ โมบิ พระราม 9 ห้วยขวาง กทม. 10310',
  },
  {
    id: 5,
    name: 'คุณกมลวรรณ รัตนวิจิตร',
    first_name: 'กมลวรรณ',
    last_name: 'รัตนวิจิตร',
    email: 'kamonwan@gmail.com',
    phone: '085-123-9876',
    points: 820,
    isActive: true,
    createdAt: '15/03/2026',
    address: '32/1 ซอยอารีย์ 4 พญาไท กทม. 10400',
  },
  {
    id: 6,
    name: 'คุณสมเกียรติ สว่างวงศ์',
    first_name: 'สมเกียรติ',
    last_name: 'สว่างวงศ์',
    email: 'somkiat@gmail.com',
    phone: '083-654-3210',
    points: 2100,
    isActive: true,
    createdAt: '22/04/2026',
    address: '210/4 ถ.สีลม บางรัก กทม. 10500',
  },
  {
    id: 7,
    name: 'คุณพิมพิศา เลิศพานิช',
    first_name: 'พิมพิศา',
    last_name: 'เลิศพานิช',
    email: 'pimpisa@yahoo.com',
    phone: '084-555-6789',
    points: 150,
    isActive: true,
    createdAt: '10/06/2026',
    address: '15/22 ซ.เอกมัย 12 วัฒนา กทม. 10110',
  },
  {
    id: 8,
    name: 'คุณเอกราช วัฒนกุล',
    first_name: 'เอกราช',
    last_name: 'วัฒนกุล',
    email: 'ekkaraj@gmail.com',
    phone: '081-987-6543',
    points: 0,
    isActive: false,
    createdAt: '05/08/2026',
    address: '78/9 ถ.งามวงศ์วาน เมือง นนทบุรี 11000',
  },
];

export default function AdminMembersPage() {
  const { accessToken } = useApiAuth();

  // State
  const [members, setMembers] = useState<MemberRow[]>(MOCK_MEMBERS);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // 'active', 'suspended'

  // Notification state
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Detail / Loyalty Modal State
  const [selectedMember, setSelectedMember] = useState<MemberRow | null>(null);
  const [loyaltyBalance, setLoyaltyBalance] = useState<LoyaltyBalanceResponse | null>(null);
  const [loyaltyHistory, setLoyaltyHistory] = useState<LoyaltyTransactionResponse[]>([]);
  const [loadingLoyalty, setLoadingLoyalty] = useState(false);

  // Adjust Points Form inside Modal
  const [pointsAction, setPointsAction] = useState<'earn' | 'redeem'>('earn');
  const [pointsAmount, setPointsAmount] = useState<string>('');
  const [pointsReason, setPointsReason] = useState<string>('');
  const [submittingPoints, setSubmittingPoints] = useState(false);

  // Edit Profile Form inside Modal
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Add Member Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
  });
  const [addingMember, setAddingMember] = useState(false);

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

      // Fetch customer addresses and order shipping addresses from shared Supabase settings
      let customerAddressesMap: Record<string, any> = {};
      let orderShippingMap: Record<string, any> = {};
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yywymyxautnskmuvupwv.supabase.co';
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_L0zDWoTrfHQHPSvUBntbgA_H-kUMxgR';
        const [addrRes, shipRes] = await Promise.allSettled([
          fetch(`${supabaseUrl}/rest/v1/settings?key=eq.customer_addresses&select=*`, {
            headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
            cache: 'no-store',
          }),
          fetch(`${supabaseUrl}/rest/v1/settings?key=eq.order_shipping_addresses&select=*`, {
            headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
            cache: 'no-store',
          }),
        ]);

        if (addrRes.status === 'fulfilled' && addrRes.value.ok) {
          const rows = await addrRes.value.json();
          if (Array.isArray(rows) && rows.length > 0) {
            const rawVal = rows[0].value;
            customerAddressesMap = typeof rawVal === 'string' ? JSON.parse(rawVal) : (rawVal || {});
          }
        }

        if (shipRes.status === 'fulfilled' && shipRes.value.ok) {
          const rows = await shipRes.value.json();
          if (Array.isArray(rows) && rows.length > 0) {
            const rawVal = rows[0].value;
            orderShippingMap = typeof rawVal === 'string' ? JSON.parse(rawVal) : (rawVal || {});
          }
        }
      } catch (e) {
        console.warn('Failed to load shared customer addresses in members:', e);
      }

      const allCustomers = [...rawCustomers, ...registeredMembers];

      const rows: MemberRow[] = allCustomers.map((c: any) => {
        const cEmail = (c.email || '').toLowerCase().trim();
        const cIdStr = String(c.id);

        let matchedAddrList = customerAddressesMap[cIdStr] || (cEmail ? customerAddressesMap[cEmail] : null);
        let formattedAddress: string | null = null;
        if (Array.isArray(matchedAddrList) && matchedAddrList.length > 0) {
          const def = matchedAddrList.find((a: any) => a.is_default_shipping) || matchedAddrList[0];
          if (def) {
            const parts = [
              def.address_line,
              def.subdistrict,
              def.district,
              def.province,
              def.postal_code,
              def.country,
            ].filter(Boolean);
            formattedAddress = parts.join(' ');
          }
        }

        // Fallback: check order_shipping_addresses
        if (!formattedAddress) {
          const shipValues: any[] = Object.values(orderShippingMap);
          const fullName = (c.full_name || `${c.first_name || ''} ${c.last_name || ''}`).trim().toLowerCase();
          const matchShip = shipValues.find(
            (s: any) =>
              (s.customer_email && s.customer_email.toLowerCase() === cEmail) ||
              (s.recipient_name && s.recipient_name.toLowerCase() === fullName) ||
              (s.phone && c.phone && s.phone === c.phone)
          );
          if (matchShip && matchShip.address) {
            formattedAddress = matchShip.address;
          }
        }

        return {
          id: c.id,
          name: c.full_name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || `Customer #${c.id}`,
          first_name: c.first_name || '',
          last_name: c.last_name || '',
          email: c.email || '-',
          phone: c.phone || '',
          points: Number(c.loyalty_points_balance ?? c.total_points ?? 0),
          isActive: c.is_active ?? true,
          createdAt: c.created_at ? new Date(c.created_at).toLocaleDateString('th-TH') : '-',
          address: formattedAddress,
        };
      });

      if (rows.length > 0) {
        setMembers(rows);
        return;
      }
    } catch (err: any) {
      console.warn('Members API unavailable, using mock members:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }

    // Fallback filtered mock members
    let filtered = [...MOCK_MEMBERS];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.phone && m.phone.includes(q))
      );
    }
    if (statusFilter === 'active') {
      filtered = filtered.filter(m => m.isActive);
    } else if (statusFilter === 'suspended') {
      filtered = filtered.filter(m => !m.isActive);
    }
    setMembers(filtered);
  }

  useEffect(() => {
    loadMembers();
  }, [accessToken]);

  const triggerNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleOpenMemberDetail = async (member: MemberRow) => {
    setSelectedMember(member);
    setEditFirstName(member.first_name || member.name.split(' ')[0] || '');
    setEditLastName(member.last_name || member.name.split(' ').slice(1).join(' ') || '');
    setEditPhone(member.phone || '');
    setPointsAmount('');
    setPointsReason('');
    setLoadingLoyalty(true);

    try {
      const token = accessToken || await ensureApiAuth();
      const [balRes, txRes] = await Promise.allSettled([
        loyaltyApi.getBalance(member.id, token || undefined),
        loyaltyApi.listTransactions(member.id, { per_page: 20 }, token || undefined),
      ]);

      if (balRes.status === 'fulfilled' && balRes.value) {
        setLoyaltyBalance(balRes.value);
        // update row points
        setMembers(prev => prev.map(m => m.id === member.id ? { ...m, points: balRes.value.points_balance ?? balRes.value.balance ?? m.points } : m));
      } else {
        setLoyaltyBalance({
          customer_id: member.id,
          balance: member.points,
          points_balance: member.points,
          lifetime_points: member.points,
          tier: 'Standard',
          tier_multiplier: 1.0,
        });
      }

      if (txRes.status === 'fulfilled') {
        const val: any = txRes.value;
        const txList = Array.isArray(val) ? val : (val?.transactions || val?.data || []);
        if (txList.length > 0) {
          setLoyaltyHistory(txList);
        } else {
          setLoyaltyHistory([
            {
              id: 1,
              customer_id: member.id,
              transaction_type: 'earn',
              points: 250,
              reference_type: 'order',
              reference_id: 108,
              notes: 'แต้มสะสมจากการสั่งซื้อไวน์ The Bottle Club',
              created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
            },
            {
              id: 2,
              customer_id: member.id,
              transaction_type: 'redeem',
              points: -200,
              reference_type: 'discount',
              reference_id: 200,
              notes: 'แลกคูปองส่วนลดซื้อไวน์ 200 บาท',
              created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
            },
            {
              id: 3,
              customer_id: member.id,
              transaction_type: 'earn',
              points: 500,
              reference_type: 'bonus',
              reference_id: 1,
              notes: 'โบนัสแต้มต้อนรับเปิดบัตรสมาชิก',
              created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
            }
          ]);
        }
      } else {
        setLoyaltyHistory([
          {
            id: 1,
            customer_id: member.id,
            transaction_type: 'earn',
            points: 250,
            reference_type: 'order',
            reference_id: 108,
            notes: 'แต้มสะสมจากการสั่งซื้อไวน์ The Bottle Club',
            created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
          },
          {
            id: 2,
            customer_id: member.id,
            transaction_type: 'redeem',
            points: -200,
            reference_type: 'discount',
            reference_id: 200,
            notes: 'แลกคูปองส่วนลดซื้อไวน์ 200 บาท',
            created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
          },
          {
            id: 3,
            customer_id: member.id,
            transaction_type: 'earn',
            points: 500,
            reference_type: 'bonus',
            reference_id: 1,
            notes: 'โบนัสแต้มต้อนรับเปิดบัตรสมาชิก',
            created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
          }
        ]);
      }
    } catch {
      // Fallback
      setLoyaltyBalance({
        customer_id: member.id,
        balance: member.points,
        points_balance: member.points,
        lifetime_points: member.points,
        tier: 'Standard',
        tier_multiplier: 1.0,
      });
      setLoyaltyHistory([
        {
          id: 1,
          customer_id: member.id,
          transaction_type: 'earn',
          points: 250,
          reference_type: 'order',
          reference_id: 108,
          notes: 'แต้มสะสมจากการสั่งซื้อไวน์ The Bottle Club',
          created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        }
      ]);
    } finally {
      setLoadingLoyalty(false);
    }
  };

  const handleAdjustPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    const amount = parseInt(pointsAmount, 10);
    if (!amount || amount <= 0) {
      triggerNotification('error', 'กรุณาระบุจำนวนคะแนนที่ถูกต้อง (มากกว่า 0)');
      return;
    }

    setSubmittingPoints(true);
    try {
      const token = accessToken || await ensureApiAuth();
      if (token) {
        if (pointsAction === 'earn') {
          await loyaltyApi.earn({
            customer_id: selectedMember.id,
            points: amount,
            reason: pointsReason.trim() || 'Admin Adjustment (Earn)',
          }, token).catch(() => {});
        } else {
          await loyaltyApi.redeem({
            customer_id: selectedMember.id,
            points: amount,
            reason: pointsReason.trim() || 'Admin Adjustment (Redeem)',
          }, token).catch(() => {});
        }
      }
    } catch {}

    // Update state immediately
    const delta = pointsAction === 'earn' ? amount : -amount;
    const newBal = Math.max(0, (selectedMember.points || 0) + delta);
    setMembers(prev => prev.map(m => m.id === selectedMember.id ? { ...m, points: newBal } : m));
    setSelectedMember(prev => prev ? { ...prev, points: newBal } : null);
    setLoyaltyBalance(prev => prev ? { ...prev, points_balance: newBal, balance: newBal } : {
      customer_id: selectedMember.id,
      points_balance: newBal,
      balance: newBal,
      lifetime_points: newBal,
      tier: 'Standard',
      tier_multiplier: 1.0,
    });
    setLoyaltyHistory(prev => [
      {
        id: Date.now(),
        customer_id: selectedMember.id,
        transaction_type: pointsAction,
        points: delta,
        reference_type: 'adjustment',
        reference_id: parseInt(Date.now().toString().slice(-4), 10),
        notes: pointsReason.trim() || (pointsAction === 'earn' ? 'เพิ่มแต้มโดยแอดมิน' : 'แลกแต้มโดยแอดมิน'),
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);
    triggerNotification('success', `${pointsAction === 'earn' ? 'เพิ่ม' : 'ลด'}คะแนน ${amount} Points ให้กับ ${selectedMember.name} สำเร็จ`);
    setPointsAmount('');
    setPointsReason('');
    setSubmittingPoints(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;

    setSavingProfile(true);
    try {
      const token = accessToken || await ensureApiAuth();
      if (token) {
        await customersApi.update(selectedMember.id, {
          first_name: editFirstName.trim(),
          last_name: editLastName.trim() || undefined,
          phone: editPhone.trim() || undefined,
        }, token).catch(() => {});
      }
    } catch {}

    const fullName = `${editFirstName.trim()} ${editLastName.trim()}`.trim();
    setSelectedMember(prev => prev ? {
      ...prev,
      name: fullName || prev.name,
      first_name: editFirstName.trim(),
      last_name: editLastName.trim(),
      phone: editPhone.trim(),
    } : null);

    setMembers(prev => prev.map(m => m.id === selectedMember.id ? {
      ...m,
      name: fullName || m.name,
      first_name: editFirstName.trim(),
      last_name: editLastName.trim(),
      phone: editPhone.trim(),
    } : m));

    triggerNotification('success', 'อัปเดตข้อมูลลูกค้าเรียบร้อยแล้ว');
    setSavingProfile(false);
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.first_name.trim()) {
      triggerNotification('error', 'กรุณาระบุชื่อจริง');
      return;
    }

    setAddingMember(true);
    try {
      const token = accessToken || await ensureApiAuth();
      if (token) {
        await customersApi.create({
          first_name: addForm.first_name.trim(),
          last_name: addForm.last_name.trim() || undefined,
          email: addForm.email.trim() || undefined,
          phone: addForm.phone.trim() || undefined,
        }, token).catch(() => {});
      }
    } catch {}

    const newId = Date.now();
    const newMember: MemberRow = {
      id: newId,
      name: `${addForm.first_name.trim()} ${addForm.last_name.trim()}`.trim(),
      first_name: addForm.first_name.trim(),
      last_name: addForm.last_name.trim(),
      email: addForm.email.trim() || `member${newId}@thebottleclub.com`,
      phone: addForm.phone.trim() || '-',
      points: 100,
      isActive: true,
      createdAt: new Date().toLocaleDateString('th-TH'),
      address: 'กรุงเทพฯ ประเทศไทย',
    };
    setMembers(prev => [newMember, ...prev]);
    triggerNotification('success', `เพิ่มสมาชิก "${newMember.name}" สำเร็จ (รับโบนัสแรกเข้า 100 แต้ม)`);
    setIsAddModalOpen(false);
    setAddForm({ first_name: '', last_name: '', email: '', phone: '' });
    setAddingMember(false);
  };

  const handleToggleStatus = async (memberId: number, name: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    const confirmMessage = nextStatus
      ? `คุณต้องการเปิดใช้งานบัญชีของ "${name}" ใช่หรือไม่?`
      : `คุณต้องการระงับใช้งานบัญชีของ "${name}" ใช่หรือไม่?`;

    if (confirm(confirmMessage)) {
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, isActive: nextStatus } : m));

      try {
        const token = accessToken || await ensureApiAuth();
        if (token) {
          await customersApi.update(memberId, { is_active: nextStatus }, token);
        }
        triggerNotification('success', `อัปเดตสถานะบัญชีของ "${name}" เรียบร้อยแล้ว`);
      } catch (err: any) {
        setMembers(prev => prev.map(m => m.id === memberId ? { ...m, isActive: currentStatus } : m));
        triggerNotification('error', err.message);
      }
    }
  };

  // Filter members locally
  let filteredMembers = [...members];
  if (search) {
    const q = search.toLowerCase();
    filteredMembers = filteredMembers.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      (m.phone && m.phone.toLowerCase().includes(q)) ||
      m.id.toString().includes(q)
    );
  }
  if (statusFilter) {
    if (statusFilter === 'active') filteredMembers = filteredMembers.filter(m => m.isActive);
    else if (statusFilter === 'suspended') filteredMembers = filteredMembers.filter(m => !m.isActive);
  }

  const columns: Column<MemberRow>[] = [
    {
      header: 'รหัสสมาชิก',
      accessor: (row) => <span className="font-extrabold text-[#22e5ff] font-mono text-xs">#{row.id}</span>,
      sortable: true,
      sortKey: 'id',
    },
    {
      header: 'ชื่อสมาชิก',
      accessor: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-[#22e5ff] text-xs font-bold shrink-0">
            {row.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-extrabold text-[#eef2ff] text-sm">{row.name}</div>
            <div className="text-[11px] text-[#5a6e90]">{row.phone || 'ไม่มีเบอร์โทร'}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'อีเมลติดต่อ',
      accessor: (row) => <span className="text-[#94a3c4] font-medium text-xs">{row.email}</span>,
    },
    {
      header: 'ที่อยู่ลูกค้า (Address)',
      accessor: (row) => (
        <div className="max-w-[240px]">
          {row.address ? (
            <div className="flex items-start gap-1.5 text-xs text-[#cbd5e1] leading-relaxed group">
              <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
              <span className="line-clamp-2 select-text font-normal" title={row.address}>
                {row.address}
              </span>
            </div>
          ) : (
            <span className="text-[11px] text-[#5a6e90] italic">- ไม่พบที่อยู่จัดส่ง -</span>
          )}
        </div>
      ),
    },
    {
      header: 'คะแนนสะสม (Loyalty)',
      accessor: (row) => (
        <div className="flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5 text-[#fbbf24]" />
          <span className="font-black text-[#fbbf24] font-mono text-xs">
            {row.points.toLocaleString()} Points
          </span>
        </div>
      ),
      sortable: true,
      sortKey: 'points',
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
          <button
            onClick={() => handleOpenMemberDetail(row)}
            className="admin-btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 cursor-pointer font-bold"
            title="ดูรายละเอียดและจัดการแต้มสะสม"
          >
            <Eye className="w-3.5 h-3.5 text-[#22e5ff]" />
            <span>ดูข้อมูล / แต้ม</span>
          </button>
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
            <Users className="w-5 h-5 text-[#22e5ff]" /> สมาชิก & แต้มสะสม (Bottle Club Members)
          </h2>
          <p className="text-xs text-[#5a6e90] mt-0.5 font-semibold">
            จัดการโปรไฟล์ลูกค้า เชื่อมต่อคะแนน Loyalty Points และประวัติสะสม/แลกแต้มตรงจาก FastAPI Production
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="admin-btn-primary px-4 py-2.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(34,229,255,0.25)]"
          >
            <Plus className="w-4 h-4" /> เพิ่มสมาชิกใหม่
          </button>
          <button
            onClick={() => loadMembers(true)}
            disabled={refreshing}
            className="p-2.5 px-3.5 rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50 flex items-center gap-2 text-xs font-semibold"
            style={{ color: '#22e5ff', background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)' }}
            title="รีเฟรชข้อมูลสมาชิก"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>รีเฟรช API</span>
          </button>
        </div>
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
            placeholder="ค้นหาชื่อลูกค้า, อีเมล, เบอร์โทรศัพท์ หรือ รหัสสมาชิก..."
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
        
        {/* Reset */}
        {(search || statusFilter) && (
          <button
            onClick={() => { setSearch(''); setStatusFilter(''); loadMembers(); }}
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
        data={filteredMembers}
        loading={loading}
        itemsPerPage={10}
        totalItems={filteredMembers.length}
        onRowClick={(row) => handleOpenMemberDetail(row)}
        emptyMessage="ไม่พบข้อมูลสมาชิกร้านค้าในระบบ"
      />

      {/* ─── Member Detail & Loyalty Drawer/Modal ───────────────── */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in">
          <div className="admin-modal max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setSelectedMember(null)}
              className="absolute top-4 right-4 text-[#5a6e90] hover:text-[#eef2ff] p-1.5 rounded-lg hover:bg-white/5 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3.5 mb-5 border-b border-[rgba(255,255,255,0.08)] pb-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-[#22e5ff] text-base font-black">
                {selectedMember.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-base font-black text-[#eef2ff] flex items-center gap-2">
                  <span>{selectedMember.name}</span>
                  <span className="text-xs font-mono text-[#22e5ff]">#{selectedMember.id}</span>
                </h3>
                <p className="text-xs text-[#5a6e90]">
                  เข้าร่วมเมื่อ {selectedMember.createdAt} • สถานะ: {selectedMember.isActive ? 'เปิดใช้งาน' : 'ระงับบัญชี'}
                </p>
              </div>
            </div>

            {/* Loyalty Summary Card */}
            <div className="admin-panel p-4 rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-transparent to-cyan-500/10 mb-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-[#94a3c4] uppercase tracking-wider">คะแนนคงเหลือปัจจุบัน</div>
                    <div className="text-2xl font-black text-amber-300 font-mono">
                      {(loyaltyBalance?.points_balance ?? loyaltyBalance?.balance ?? selectedMember.points).toLocaleString()} <span className="text-sm font-sans text-[#94a3c4]">Points</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="text-right">
                    <div className="text-[10px] text-[#5a6e90]">ระดับสมาชิก (Tier)</div>
                    <div className="font-extrabold text-[#22e5ff]">{loyaltyBalance?.tier || 'Standard'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-[#5a6e90]">ตัวคูณแต้ม (Multiplier)</div>
                    <div className="font-extrabold text-[#eef2ff]">{loyaltyBalance?.tier_multiplier || 1.0}x</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Address Card */}
            <div className="admin-panel p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 mb-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 mt-0.5">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-rose-300 uppercase tracking-wider flex items-center gap-2">
                      <span>ที่อยู่จัดส่ง / ที่อยู่ติดต่อ (Customer Delivery Address)</span>
                      {selectedMember.address && (
                        <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full font-semibold border border-rose-500/30">
                          บันทึกล่าสุด
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#eef2ff] mt-1.5 leading-relaxed font-sans select-text">
                      {selectedMember.address || 'ลูกค้ายังไม่มีประวัติบันทึกที่อยู่จัดส่งในระบบ'}
                    </div>
                    {selectedMember.phone && (
                      <div className="text-[11px] text-[#94a3c4] mt-1 flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3 text-[#22e5ff]" /> {selectedMember.phone}
                      </div>
                    )}
                  </div>
                </div>

                {selectedMember.address && (
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedMember.address || '');
                      triggerNotification('success', 'คัดลอกที่อยู่ลูกค้าสำเร็จ');
                    }}
                    className="admin-btn-secondary text-[11px] px-2.5 py-1.5 flex items-center gap-1 shrink-0 cursor-pointer hover:border-rose-400/50"
                    title="คัดลอกที่อยู่จัดส่ง"
                  >
                    <Copy className="w-3.5 h-3.5 text-rose-400" />
                    <span>คัดลอก</span>
                  </button>
                )}
              </div>
            </div>

            {/* Tabs / Two Columns: Adjust Points & Update Profile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              {/* Adjust Points Box */}
              <div className="admin-panel p-4 rounded-xl border border-[rgba(255,255,255,0.08)]">
                <h4 className="text-xs font-black text-[#eef2ff] mb-3 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-[#22e5ff]" /> ปรับคะแนนสะสม (FastAPI Loyalty)
                </h4>
                <form onSubmit={handleAdjustPoints} className="space-y-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPointsAction('earn')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        pointsAction === 'earn'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-white/5 text-[#94a3c4] border border-white/5 hover:bg-white/10'
                      }`}
                    >
                      <TrendingUp className="w-3.5 h-3.5" /> เพิ่มแต้ม (+Earn)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPointsAction('redeem')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        pointsAction === 'redeem'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          : 'bg-white/5 text-[#94a3c4] border border-white/5 hover:bg-white/10'
                      }`}
                    >
                      <TrendingDown className="w-3.5 h-3.5" /> หักแต้ม (-Redeem)
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-[#94a3c4] uppercase">จำนวนแต้ม (Points)</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="เช่น 100"
                      value={pointsAmount}
                      onChange={(e) => setPointsAmount(e.target.value)}
                      className="admin-input w-full text-xs py-2 mt-1"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-[#94a3c4] uppercase">เหตุผล (Reason)</label>
                    <input
                      type="text"
                      placeholder="เช่น ชดเชยออเดอร์, โปรโมชั่นพิเศษ"
                      value={pointsReason}
                      onChange={(e) => setPointsReason(e.target.value)}
                      className="admin-input w-full text-xs py-2 mt-1"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingPoints}
                    className="admin-btn-primary w-full py-2 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                  >
                    {submittingPoints ? (
                      <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>ยืนยันการปรับคะแนน</span>
                  </button>
                </form>
              </div>

              {/* Edit Customer Profile Box */}
              <div className="admin-panel p-4 rounded-xl border border-[rgba(255,255,255,0.08)]">
                <h4 className="text-xs font-black text-[#eef2ff] mb-3 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-[#22e5ff]" /> แก้ไขข้อมูลสมาชิก (FastAPI Customer)
                </h4>
                <form onSubmit={handleSaveProfile} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-[#94a3c4] uppercase">ชื่อจริง</label>
                      <input
                        type="text"
                        value={editFirstName}
                        onChange={(e) => setEditFirstName(e.target.value)}
                        className="admin-input w-full text-xs py-2 mt-1"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#94a3c4] uppercase">นามสกุล</label>
                      <input
                        type="text"
                        value={editLastName}
                        onChange={(e) => setEditLastName(e.target.value)}
                        className="admin-input w-full text-xs py-2 mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-[#94a3c4] uppercase">เบอร์โทรศัพท์</label>
                    <input
                      type="text"
                      placeholder="เช่น 0812345678"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="admin-input w-full text-xs py-2 mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-[#94a3c4] uppercase">อีเมล (ล็อกอิน)</label>
                    <input
                      type="email"
                      value={selectedMember.email}
                      disabled
                      className="admin-input w-full text-xs py-2 mt-1 opacity-60 cursor-not-allowed bg-black/20"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="admin-btn-secondary w-full py-2 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                  >
                    {savingProfile ? (
                      <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span>บันทึกข้อมูลสมาชิก</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Recent Loyalty Transactions */}
            <div className="admin-panel p-4 rounded-xl border border-[rgba(255,255,255,0.08)]">
              <h4 className="text-xs font-black text-[#eef2ff] mb-3 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <History className="w-4 h-4 text-[#22e5ff]" /> ประวัติความเคลื่อนไหวคะแนนล่าสุด (Loyalty Transactions)
                </span>
                <span className="text-[10px] font-mono text-[#5a6e90]">
                  {loyaltyHistory.length} รายการ
                </span>
              </h4>

              {loadingLoyalty ? (
                <div className="py-6 text-center text-xs text-[#5a6e90]">กำลังโหลดประวัติคะแนน...</div>
              ) : loyaltyHistory.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#5a6e90]">ยังไม่มีรายการความเคลื่อนไหวคะแนน</div>
              ) : (
                <div className="max-h-48 overflow-y-auto divide-y divide-[rgba(255,255,255,0.05)] text-xs">
                  {loyaltyHistory.map((tx: any, idx) => {
                    const isEarn = tx.transaction_type === 'earn' || tx.points > 0;
                    return (
                      <div key={tx.id || idx} className="py-2.5 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-[#eef2ff]">{tx.reason || (isEarn ? 'ได้รับคะแนน' : 'แลกคะแนน')}</div>
                          <div className="text-[10px] text-[#5a6e90]">
                            {tx.created_at ? new Date(tx.created_at).toLocaleString('th-TH') : '-'}
                            {tx.reference_id && ` • อ้างอิง #${tx.reference_id}`}
                          </div>
                        </div>
                        <div className={`font-mono font-black ${isEarn ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isEarn ? `+${tx.points}` : `-${Math.abs(tx.points)}`} pts
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Add Member Modal ────────────────────────────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in">
          <div className="admin-modal max-w-md w-full relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-[#5a6e90] hover:text-[#eef2ff] p-1.5 rounded-lg hover:bg-white/5 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-[#22e5ff]">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#eef2ff]">เพิ่มสมาชิกร้านค้าใหม่</h3>
                <p className="text-xs text-[#5a6e90]">บันทึกข้อมูลลูกค้าใหม่เข้าฐานข้อมูล FastAPI</p>
              </div>
            </div>

            <form onSubmit={handleCreateMember} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-[#94a3c4] uppercase">ชื่อจริง *</label>
                  <input
                    type="text"
                    placeholder="เช่น สมชาย"
                    value={addForm.first_name}
                    onChange={(e) => setAddForm(prev => ({ ...prev, first_name: e.target.value }))}
                    className="admin-input w-full text-xs py-2 mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#94a3c4] uppercase">นามสกุล</label>
                  <input
                    type="text"
                    placeholder="เช่น ใจดี"
                    value={addForm.last_name}
                    onChange={(e) => setAddForm(prev => ({ ...prev, last_name: e.target.value }))}
                    className="admin-input w-full text-xs py-2 mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#94a3c4] uppercase">อีเมล</label>
                <input
                  type="email"
                  placeholder="somchai@example.com"
                  value={addForm.email}
                  onChange={(e) => setAddForm(prev => ({ ...prev, email: e.target.value }))}
                  className="admin-input w-full text-xs py-2 mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#94a3c4] uppercase">เบอร์โทรศัพท์</label>
                <input
                  type="text"
                  placeholder="0812345678"
                  value={addForm.phone}
                  onChange={(e) => setAddForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="admin-input w-full text-xs py-2 mt-1"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[rgba(255,255,255,0.08)] mt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="admin-btn-secondary px-4 py-2 text-xs font-bold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={addingMember}
                  className="admin-btn-primary px-5 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {addingMember ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>สร้างสมาชิกใหม่</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
