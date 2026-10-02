'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  UserCog, Plus, Search, Edit2, Trash2, Loader2,
  X, Save, Shield, ShieldCheck, ShieldOff, Eye, EyeOff,
  CheckCircle2, AlertCircle, Key, User, Mail, Phone,
  Crown, Coffee, Package, Lock, RefreshCw, UtensilsCrossed, Wine
} from 'lucide-react'

export type RoleKey = 'super_admin' | 'manager' | 'cashier' | 'stock_staff' | 'kitchen' | 'bar'

interface Profile {
  id: string
  full_name: string
  role: RoleKey
  phone?: string
  is_active: boolean
  created_at: string
  updated_at?: string
  email?: string
}

const ROLE_CONFIG: Record<RoleKey, {
  label: string; color: string; bg: string; border: string; icon: React.ReactNode; desc: string
}> = {
  super_admin: {
    label: 'Super Admin',
    color: '#fbbf24',
    bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.30)',
    icon: <Crown size={13} />,
    desc: 'เข้าถึงได้ทุกส่วนของระบบ'
  },
  manager: {
    label: 'Manager',
    color: '#22d3ee',
    bg: 'rgba(6,182,212,0.12)',
    border: 'rgba(6,182,212,0.25)',
    icon: <ShieldCheck size={13} />,
    desc: 'จัดการสินค้า รายงาน และทีม'
  },
  cashier: {
    label: 'Cashier',
    color: '#34d399',
    bg: 'rgba(16,185,129,0.12)',
    border: 'rgba(16,185,129,0.25)',
    icon: <Coffee size={13} />,
    desc: 'ขายสินค้าและรับชำระเงิน POS'
  },
  stock_staff: {
    label: 'Stock Staff',
    color: '#c084fc',
    bg: 'rgba(168,85,247,0.12)',
    border: 'rgba(168,85,247,0.25)',
    icon: <Package size={13} />,
    desc: 'จัดการสต๊อกและคลังสินค้า'
  },
  bar: {
    label: 'Bar',
    color: '#818cf8',
    bg: 'rgba(99,102,241,0.12)',
    border: 'rgba(99,102,241,0.25)',
    icon: <Wine size={13} />,
    desc: 'เตรียมเครื่องดื่มและค็อกเทล'
  },
  kitchen: {
    label: 'Kitchen',
    color: '#fb7185',
    bg: 'rgba(244,63,94,0.12)',
    border: 'rgba(244,63,94,0.25)',
    icon: <UtensilsCrossed size={13} />,
    desc: 'เตรียมอาหารและครัว'
  }
}

export default function UsersPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [dbError, setDbError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | RoleKey>('all')

  // Modal state
  const [modal, setModal] = useState<'add' | 'edit' | 'password' | null>(null)
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form fields
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formRole, setFormRole] = useState<RoleKey>('cashier')
  const [formPassword, setFormPassword] = useState('')
  const [formPasswordConfirm, setFormPasswordConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)

  // Load staff profiles directly from Supabase DB via /api/admin/users
  const loadUsers = useCallback(async () => {
    setLoading(true)
    setDbError(null)

    try {
      const res = await fetch('/api/admin/users', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || 'ไม่สามารถดึงข้อมูลผู้ใช้จาก Supabase ได้')
      }
      setUsers(data.users || [])
    } catch (e: any) {
      setDbError(e.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลจาก Supabase')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers()
    const interval = setInterval(loadUsers, 15000)
    return () => clearInterval(interval)
  }, [loadUsers])

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    const matchQ = !q || u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    return matchRole && matchQ
  })

  const openAdd = () => {
    setFormName(''); setFormEmail(''); setFormPhone('')
    setFormRole('cashier'); setFormPassword(''); setFormPasswordConfirm('')
    setError(''); setSuccess('')
    setModal('add')
  }

  const openEdit = (user: Profile) => {
    setSelectedUser(user)
    setFormName(user.full_name || '')
    setFormPhone(user.phone || '')
    setFormRole(user.role)
    setError(''); setSuccess('')
    setModal('edit')
  }

  const openPassword = (user: Profile) => {
    setSelectedUser(user)
    setFormPassword(''); setFormPasswordConfirm('')
    setError(''); setSuccess('')
    setModal('password')
  }

  const closeModal = () => {
    setModal(null); setSelectedUser(null); setError(''); setSuccess('')
  }

  // ── Create new user via Supabase Auth & profiles ──
  const handleCreate = async () => {
    if (!formName.trim() || !formEmail.trim() || !formPassword) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน')
      return
    }
    if (formPassword.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
      return
    }
    if (formPassword !== formPasswordConfirm) {
      setError('รหัสผ่านไม่ตรงกัน')
      return
    }
    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formEmail.trim(),
          password: formPassword,
          full_name: formName.trim(),
          role: formRole,
          phone: formPhone.trim() || null,
        }),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการสร้างผู้ใช้')
      }

      setSuccess(`สร้างผู้ใช้ ${formName} ใน Supabase สำเร็จแล้ว!`)
      await loadUsers()
      setTimeout(closeModal, 1200)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
    } finally {
      setSaving(false)
    }
  }

  // ── Update profile in Supabase ──
  const handleUpdate = async () => {
    if (!selectedUser || !formName.trim()) { setError('กรุณากรอกชื่อ'); return }
    setSaving(true); setError('')

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedUser.id,
          full_name: formName.trim(),
          role: formRole,
          phone: formPhone.trim() || null,
        }),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการอัพเดตข้อมูล')
      }

      setSuccess('อัพเดตข้อมูลใน Supabase สำเร็จ!')
      await loadUsers()
      setTimeout(closeModal, 1000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
    } finally {
      setSaving(false)
    }
  }

  // ── Change password in Supabase Auth ──
  const handlePassword = async () => {
    if (!selectedUser || !formPassword) { setError('กรุณากรอกรหัสผ่านใหม่'); return }
    if (formPassword.length < 6) { setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'); return }
    if (formPassword !== formPasswordConfirm) { setError('รหัสผ่านไม่ตรงกัน'); return }
    setSaving(true); setError('')

    try {
      const res = await fetch('/api/admin/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedUser.id,
          password: formPassword,
        }),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || 'เปลี่ยนรหัสผ่านไม่สำเร็จ')
      }

      setSuccess('เปลี่ยนรหัสผ่านใน Supabase สำเร็จ!')
      setTimeout(closeModal, 1200)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
    } finally {
      setSaving(false)
    }
  }

  // ── Toggle active status in Supabase ──
  const toggleActive = async (user: Profile) => {
    try {
      await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          is_active: !user.is_active,
        }),
      })
      loadUsers()
    } catch {}
  }

  // ── Delete / Deactivate in Supabase ──
  const handleDelete = async (user: Profile) => {
    if (!confirm(`ยืนยันการปิดการใช้งานพนักงาน "${user.full_name}" ใน Supabase?`)) return

    try {
      const res = await fetch(`/api/admin/users?id=${encodeURIComponent(user.id)}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        loadUsers()
      }
    } catch {}
  }

  const roleCounts = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="animate-in" style={{ padding: '20px', maxWidth: '1500px' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
            <h1 style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", fontSize: '1.4rem', fontWeight: 900, color: 'var(--admin-text, #f1f5f9)', letterSpacing: '-0.025em', margin: 0 }}>
              👥 ผู้ใช้งานพนักงาน (POS Store)
            </h1>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px',
              borderRadius: 8, fontSize: 11, fontWeight: 700,
              background: 'rgba(16, 185, 129, 0.15)', color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              🟢 ฐานข้อมูล Supabase
            </span>
          </div>
          <p style={{ color: 'var(--admin-text-muted, #94a3b8)', fontSize: 13, fontWeight: 500, margin: 0 }}>
            จัดการบัญชีพนักงานหน้าร้าน POS เชื่อมต่อระบบสิทธิ์และการเปิด-ปิดกะ • {users.filter(u => u.is_active).length} คนที่เปิดใช้งานอยู่
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={loadUsers}
            className="admin-btn-secondary flex items-center gap-2 px-3 py-2 text-xs font-semibold cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> รีเฟรช
          </button>
          <button
            onClick={openAdd}
            className="admin-btn-primary flex items-center gap-2 px-4 py-2 text-xs font-semibold cursor-pointer"
          >
            <Plus size={15} /> เพิ่มผู้ใช้ใหม่
          </button>
        </div>
      </div>

      {/* DB Error Alert */}
      {dbError && (
        <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(244,63,94,0.10)', border: '1px solid rgba(244,63,94,0.30)', color: '#fb7185', marginBottom: 20, fontSize: 13 }}>
          ⚠️ Supabase Notice: {dbError}
        </div>
      )}

      {/* Role Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        {(Object.entries(ROLE_CONFIG) as [RoleKey, typeof ROLE_CONFIG[RoleKey]][]).map(([key, cfg]) => (
          <button key={key} onClick={() => setRoleFilter(roleFilter === key ? 'all' : key)}
            className="text-left transition-all cursor-pointer"
            style={{
              padding: '14px 16px',
              borderRadius: 14,
              border: `1px solid ${roleFilter === key ? cfg.border : 'rgba(255,255,255,0.07)'}`,
              background: roleFilter === key ? cfg.bg : 'var(--admin-surface, #161b27)',
              boxShadow: roleFilter === key ? `0 0 20px ${cfg.bg}` : '0 4px 16px rgba(0,0,0,0.25)'
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ color: cfg.color }}>{cfg.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
            </div>
            <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--admin-text, #f1f5f9)', fontFamily: "'Plus Jakarta Sans', sans-serif", margin: '4px 0 0', lineHeight: 1 }}>{roleCounts[key] || 0}</p>
            <p style={{ fontSize: 10, color: 'var(--admin-text-muted, #94a3b8)', marginTop: 4, fontWeight: 500 }}>{cfg.desc}</p>
          </button>
        ))}
      </div>

      {/* Search & Filter */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#64748b' }} />
          <input
            className="admin-input pl-10 text-xs w-full py-2.5"
            placeholder="ค้นหาชื่อ / อีเมลใน Supabase..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {roleFilter !== 'all' && (
          <button
            onClick={() => setRoleFilter('all')}
            className="admin-btn-secondary text-xs px-3 py-2 flex items-center gap-1.5 cursor-pointer"
          >
            <X size={13} /> ล้างตัวกรอง ({ROLE_CONFIG[roleFilter]?.label})
          </button>
        )}
      </div>

      {/* Users Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <Loader2 size={32} className="animate-spin" style={{ color: '#818cf8' }} />
        </div>
      ) : (
        <div className="admin-table-wrap overflow-hidden">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr className="admin-table-head">
                  {['ผู้ใช้งาน', 'บทบาท (Role)', 'เบอร์โทร', 'สถานะ', 'สร้างเมื่อ', 'จัดการ'].map(h => (
                    <th key={h} style={{ padding: '12px 18px', textAlign: 'left', fontSize: '10px', fontWeight: 800, color: '#475569', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(user => {
                  const role = ROLE_CONFIG[user.role] || ROLE_CONFIG.cashier
                  const isOnline = user.is_active && user.updated_at && (new Date().getTime() - new Date(user.updated_at).getTime() < 60000)

                  return (
                    <tr key={user.id} className="admin-table-row">

                      {/* User info */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 38, height: 38, borderRadius: 10,
                            background: `linear-gradient(135deg, ${role.color}25, ${role.color}08)`,
                            border: `1px solid ${role.border}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, fontSize: 14, fontWeight: 800, color: role.color,
                          }}>
                            {user.full_name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p style={{ color: 'var(--admin-text, #f1f5f9)', fontWeight: 700, fontSize: 13, margin: 0 }}>{user.full_name || '—'}</p>
                            <p style={{ color: 'var(--admin-text-muted, #94a3b8)', fontSize: 11, margin: '2px 0 0' }}>{user.email || 'ไม่มีอีเมล'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role badge */}
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: role.bg, color: role.color, border: `1px solid ${role.border}` }}>
                          {role.icon} {role.label}
                        </span>
                      </td>

                      {/* Phone */}
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ color: 'var(--admin-text-sec, #94a3b8)', fontSize: 13 }}>{user.phone || '—'}</span>
                      </td>

                      {/* Status & Online/Offline */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <button onClick={() => toggleActive(user)}
                            className={`cursor-pointer ${user.is_active ? 'badge-delivered' : 'badge-rejected'}`}
                            style={{ padding: '4px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            {user.is_active ? <><Shield size={11} /> ใช้งาน</> : <><ShieldOff size={11} /> ปิดใช้งาน</>}
                          </button>
                          {isOnline ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#34d399' }}>
                              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399' }} />
                              ออนไลน์
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: 'var(--admin-text-muted, #94a3b8)' }}>
                              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#64748b' }} />
                              ออฟไลน์
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Created date */}
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ color: 'var(--admin-text-muted, #94a3b8)', fontSize: 12, fontWeight: 500 }}>
                          {user.created_at ? new Date(user.created_at).toLocaleDateString('th-TH', { year: '2-digit', month: 'short', day: 'numeric' }) : '—'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <ActionBtn icon={<Edit2 size={13} />} tooltip="แก้ไขข้อมูล" color="#a78bfa" onClick={() => openEdit(user)} />
                          <ActionBtn icon={<Key size={13} />} tooltip="เปลี่ยนรหัสผ่าน" color="#60a5fa" onClick={() => openPassword(user)} />
                          <ActionBtn icon={<Trash2 size={13} />} tooltip="ปิดการใช้งาน" color="#f87171" onClick={() => handleDelete(user)} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--admin-text-muted, #94a3b8)' }}>
                <UserCog size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <p style={{ fontSize: 13, fontWeight: 600 }}>ไม่พบผู้ใช้งานในระบบ Supabase</p>
                <button onClick={openAdd} style={{ marginTop: 12 }} className="admin-btn-primary text-xs px-3 py-1.5 font-bold cursor-pointer">
                  + เพิ่มผู้ใช้งานใหม่
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal: Add / Edit / Password ── */}
      {modal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div className="admin-panel animate-in" style={{
            width: '100%', maxWidth: 460, borderRadius: 20, overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
          }}>
            {/* Modal header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '18px 24px', borderBottom: '1px solid var(--admin-border, rgba(255,255,255,0.07))',
              background: 'rgba(255,255,255,0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
                  {modal === 'add' ? <Plus size={18} /> : modal === 'edit' ? <Edit2 size={16} /> : <Key size={16} />}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--admin-text, #f1f5f9)' }}>
                    {modal === 'add' ? 'เพิ่มผู้ใช้งานใหม่' : modal === 'edit' ? 'แก้ไขข้อมูลผู้ใช้' : 'เปลี่ยนรหัสผ่าน'}
                  </h3>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--admin-text-muted, #94a3b8)' }}>
                    {modal === 'add' ? 'สร้างบัญชีพนักงานใน Supabase' : selectedUser?.full_name}
                  </p>
                </div>
              </div>
              <button onClick={closeModal} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            {/* Modal body */}
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.3)', color: '#fb7185', fontSize: 12 }}>
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', fontSize: 12 }}>
                  <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
                  <span>{success}</span>
                </div>
              )}

              {modal === 'password' ? (
                <>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-sec, #94a3b8)', display: 'block', marginBottom: 6 }}>รหัสผ่านใหม่ * (อย่างน้อย 6 ตัว)</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPass ? 'text' : 'password'}
                        className="admin-input w-full pr-10 text-xs py-2.5"
                        placeholder="••••••••"
                        value={formPassword}
                        onChange={e => setFormPassword(e.target.value)}
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                        {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-sec, #94a3b8)', display: 'block', marginBottom: 6 }}>ยืนยันรหัสผ่านใหม่ *</label>
                    <input
                      type="password"
                      className="admin-input w-full text-xs py-2.5"
                      placeholder="••••••••"
                      value={formPasswordConfirm}
                      onChange={e => setFormPasswordConfirm(e.target.value)}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-sec, #94a3b8)', display: 'block', marginBottom: 6 }}>ชื่อ-นามสกุล *</label>
                    <div style={{ position: 'relative' }}>
                      <User size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                      <input
                        className="admin-input w-full pl-9 text-xs py-2.5"
                        placeholder="สมชาย ใจดี"
                        value={formName}
                        onChange={e => setFormName(e.target.value)}
                      />
                    </div>
                  </div>

                  {modal === 'add' && (
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-sec, #94a3b8)', display: 'block', marginBottom: 6 }}>อีเมล * (ใช้เข้าสู่ระบบ Supabase)</label>
                      <div style={{ position: 'relative' }}>
                        <Mail size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                        <input
                          type="email"
                          className="admin-input w-full pl-9 text-xs py-2.5"
                          placeholder="staff@thebottleclub.com"
                          value={formEmail}
                          onChange={e => setFormEmail(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-sec, #94a3b8)', display: 'block', marginBottom: 6 }}>เบอร์โทรศัพท์</label>
                    <div style={{ position: 'relative' }}>
                      <Phone size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                      <input
                        className="admin-input w-full pl-9 text-xs py-2.5"
                        placeholder="081-234-5678"
                        value={formPhone}
                        onChange={e => setFormPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-sec, #94a3b8)', display: 'block', marginBottom: 6 }}>บทบาท (Role) *</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                      {(Object.entries(ROLE_CONFIG) as [RoleKey, typeof ROLE_CONFIG[RoleKey]][]).map(([key, cfg]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setFormRole(key)}
                          className="cursor-pointer text-center transition-all"
                          style={{
                            padding: '8px 6px', borderRadius: 10,
                            border: `1.5px solid ${formRole === key ? cfg.color : 'rgba(255,255,255,0.08)'}`,
                            background: formRole === key ? cfg.bg : 'rgba(255,255,255,0.02)',
                            color: formRole === key ? cfg.color : 'var(--admin-text-muted, #94a3b8)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 3 }}>{cfg.icon}</div>
                          <span style={{ fontSize: 10, fontWeight: 700, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cfg.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {modal === 'add' && (
                    <>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-sec, #94a3b8)', display: 'block', marginBottom: 6 }}>รหัสผ่านเริ่มต้น * (อย่างน้อย 6 ตัว)</label>
                        <div style={{ position: 'relative' }}>
                          <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                          <input
                            type={showPass ? 'text' : 'password'}
                            className="admin-input w-full pl-9 pr-10 text-xs py-2.5"
                            placeholder="••••••••"
                            value={formPassword}
                            onChange={e => setFormPassword(e.target.value)}
                          />
                          <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                            {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-sec, #94a3b8)', display: 'block', marginBottom: 6 }}>ยืนยันรหัสผ่าน *</label>
                        <input
                          type="password"
                          className="admin-input w-full text-xs py-2.5"
                          placeholder="••••••••"
                          value={formPasswordConfirm}
                          onChange={e => setFormPasswordConfirm(e.target.value)}
                        />
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Modal footer */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10,
              padding: '16px 24px', borderTop: '1px solid var(--admin-border, rgba(255,255,255,0.07))',
              background: 'rgba(255,255,255,0.01)'
            }}>
              <button
                type="button"
                onClick={closeModal}
                className="admin-btn-secondary text-xs px-4 py-2 cursor-pointer font-semibold"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={modal === 'add' ? handleCreate : modal === 'edit' ? handleUpdate : handlePassword}
                className="admin-btn-primary text-xs px-5 py-2 flex items-center gap-2 cursor-pointer font-bold disabled:opacity-50"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {modal === 'add' ? 'สร้างผู้ใช้ Supabase' : modal === 'edit' ? 'บันทึกการแก้ไข' : 'เปลี่ยนรหัสผ่าน'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ActionBtn({ icon, tooltip, color, onClick }: { icon: React.ReactNode; tooltip: string; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={tooltip}
      className="cursor-pointer transition-all"
      style={{
        width: 30, height: 30, borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
        color,
      }}
    >
      {icon}
    </button>
  )
}
