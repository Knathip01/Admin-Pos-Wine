'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Wine, Lock, User, ShieldCheck, ArrowRight, AlertCircle, Loader2, Eye, EyeOff, Clock, ShieldAlert } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { authApi } from '@/lib/api/auth'
import { useApiAuth, DEFAULT_API_CREDENTIALS } from '@/lib/store/api-auth'

const STORAGE_LOCKOUT_KEY = 'bottleclub_login_lockout'

// Tiered progressive cooldowns (in seconds):
// Tier 1: 1 นาที (60s)
// Tier 2: 5 นาที (300s)
// Tier 3: 15 นาที (900s)
// Tier 4: 1 ชั่วโมง (3,600s)
// Tier 5: 3 ชั่วโมง (10,800s)
// Tier 6: 6 ชั่วโมง (21,600s)
// Tier 7+: 24 ชั่วโมง (86,400s)
const LOCKOUT_TIERS_SECONDS = [60, 300, 900, 3600, 10800, 21600, 86400]

function getCooldownForAttempt(attempt: number): number {
  const index = Math.min(Math.max(attempt - 1, 0), LOCKOUT_TIERS_SECONDS.length - 1)
  return LOCKOUT_TIERS_SECONDS[index]
}

function formatRemainingTime(totalSeconds: number): string {
  if (totalSeconds <= 0) return '0 วินาที'
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const parts: string[] = []
  if (hours > 0) parts.push(`${hours} ชั่วโมง`)
  if (minutes > 0) parts.push(`${minutes} นาที`)
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds} วินาที`)
  return parts.join(' ')
}

export default function AdminLoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const { setTokens, setProfile } = useApiAuth()

  const [email, setEmail] = useState(DEFAULT_API_CREDENTIALS.email)
  const [password, setPassword] = useState(DEFAULT_API_CREDENTIALS.password)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)

  // Progressive Rate Limit & Lockout state
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [lockoutAttempts, setLockoutAttempts] = useState(0)

  // Check lockout on mount and tick countdown
  useEffect(() => {
    const checkLockout = () => {
      try {
        const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_LOCKOUT_KEY) : null
        if (raw) {
          const parsed = JSON.parse(raw)
          const now = Date.now()
          if (parsed.lockoutUntil && parsed.lockoutUntil > now) {
            const diff = Math.ceil((parsed.lockoutUntil - now) / 1000)
            setRemainingSeconds(diff)
            setLockoutAttempts(parsed.attempts || 1)
          } else if (parsed.attempts) {
            setRemainingSeconds(0)
            setLockoutAttempts(parsed.attempts)
          }
        }
      } catch {}
    }

    checkLockout()

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) return 0
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    // If currently locked out, prevent attempt
    if (remainingSeconds > 0) {
      setErrorMsg(`ระบบกำลังระงับการเข้าสู่ระบบชั่วคราว กรุณารออีก ${formatRemainingTime(remainingSeconds)}`)
      return
    }

    setLoading(true)
    setErrorMsg(null)

    try {
      const cleanEmail = email.trim()
      const cleanPass = password.trim()

      // 🔒 Exclusive access check: Only superadmin@thebottleclub.com with postthebottleclub is allowed
      const isAllowedCeo = (cleanEmail.toLowerCase() === 'superadmin@thebottleclub.com' || cleanEmail.toLowerCase() === 'superadmin') && cleanPass === 'postthebottleclub'
      
      if (!isAllowedCeo) {
        // Trigger Progressive Lockout!
        const nextAttempts = lockoutAttempts + 1
        const cooldown = getCooldownForAttempt(nextAttempts)
        const lockoutUntil = Date.now() + cooldown * 1000

        try {
          localStorage.setItem(STORAGE_LOCKOUT_KEY, JSON.stringify({
            attempts: nextAttempts,
            lockoutUntil,
          }))
        } catch {}

        setLockoutAttempts(nextAttempts)
        setRemainingSeconds(cooldown)

        throw new Error(
          `ไม่อนุญาตให้อีเมลนี้เข้าสู่ระบบ! (จำกัดสิทธิ์เฉพาะบัญชี CEO Super Admin: superadmin@thebottleclub.com เท่านั้น) ระบบระงับการเข้าสู่ระบบ ${formatRemainingTime(cooldown)} และจะทวีคูณระยะเวลานานขึ้นเรื่อยๆ ทุกครั้งที่พยายามล็อกอินผิด`
        )
      }

      // CEO Super Admin authenticated successfully! Clear any lockout record
      try {
        localStorage.removeItem(STORAGE_LOCKOUT_KEY)
      } catch {}
      setRemainingSeconds(0)
      setLockoutAttempts(0)

      // 1. Authenticate with Backend API in parallel
      const apiLoginPromise = (async () => {
        const attempts = [
          { username: cleanEmail, password: cleanPass },
          { username: cleanEmail.split('@')[0], password: cleanPass },
        ]
        for (const cred of attempts) {
          try {
            const tokens = await authApi.login(cred)
            if (tokens?.access_token) {
              setTokens(tokens.access_token, tokens.refresh_token)
              try {
                const profile = await authApi.me(tokens.access_token)
                setProfile(profile)
              } catch {}
              return true
            }
          } catch {}
        }
        return false
      })()

      // 2. Authenticate with Supabase Auth
      let supabaseSuccess = false
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPass,
        })
        if (!error && data.user) {
          supabaseSuccess = true
        }
      } catch {}

      const apiSuccess = await apiLoginPromise

      if (!supabaseSuccess && !apiSuccess) {
        // Allow CEO Super Admin bypass even if backend network is temporarily unreachable
        supabaseSuccess = true
      }

      // 3. Mark admin session as active in cookies and localStorage
      if (typeof window !== 'undefined') {
        document.cookie = 'bottleclub_admin_session=active; path=/; max-age=604800; SameSite=Lax'
        localStorage.setItem('bottleclub_logged_in', '1')
      }

      // Redirect target
      const params = new URLSearchParams(window.location.search)
      let redirectTo = params.get('redirectTo') || '/admin/bottleclub'
      if (redirectTo === '/admin' || redirectTo === '/admin/login') {
        redirectTo = '/admin/bottleclub'
      }
      router.push(redirectTo)
      router.refresh()
    } catch (err: any) {
      setErrorMsg(err.message || 'เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบข้อมูลอีกครั้ง')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#05080f',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Outfit', sans-serif",
    }}>
      {/* Background bokeh blobs */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 25% 30%, rgba(0,212,255,0.13) 0%, transparent 55%), radial-gradient(ellipse at 75% 70%, rgba(168,85,247,0.10) 0%, transparent 55%), radial-gradient(ellipse at 60% 15%, rgba(0,196,180,0.07) 0%, transparent 45%)'
      }} />
      <div style={{ position: 'fixed', top: '12%', left: '18%', width: 340, height: 340, background: 'rgba(0,212,255,0.07)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '15%', right: '15%', width: 300, height: 300, background: 'rgba(168,85,247,0.07)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Glass card */}
      <div style={{
        width: '100%',
        maxWidth: 440,
        background: 'rgba(10,14,26,0.85)',
        border: '1px solid rgba(0,212,255,0.20)',
        borderTop: '1px solid rgba(0,212,255,0.30)',
        borderRadius: 24,
        backdropFilter: 'blur(32px) saturate(2.2)',
        WebkitBackdropFilter: 'blur(32px) saturate(2.2)',
        boxShadow: '0 24px 80px rgba(0,0,0,0.70), 0 0 0 1px rgba(0,212,255,0.08)',
        padding: '36px 32px',
        position: 'relative',
        zIndex: 1,
      }}>

        {/* Header Logo */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, rgba(0,212,255,0.55), rgba(0,196,180,0.25), rgba(168,85,247,0.30))',
            padding: 2,
            borderRadius: 20,
            marginBottom: 14,
          }}>
            <div style={{
              width: 76,
              height: 76,
              borderRadius: 18,
              background: '#0a0e1a',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <img
                src="/thebottleclub.jpg"
                alt="The Bottle Club Logo"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
          </div>
          <h1 style={{
            fontSize: 22,
            fontWeight: 900,
            color: '#eef2ff',
            margin: 0,
            fontFamily: "'Outfit', sans-serif",
            letterSpacing: '-0.02em',
          }}>
            The Bottle Club Admin
          </h1>
        </div>

        {/* Security Lockout Banner */}
        {remainingSeconds > 0 && (
          <div style={{
            marginBottom: 18,
            padding: '16px',
            borderRadius: 16,
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.40)',
            boxShadow: '0 0 24px rgba(239, 68, 68, 0.18)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#f87171', fontWeight: 800, fontSize: 13, marginBottom: 6 }}>
              <ShieldAlert style={{ width: 18, height: 18, flexShrink: 0 }} />
              <span>ระบบล็อคความปลอดภัย (Security Lockout)</span>
            </div>
            <div style={{ fontSize: 12, color: '#fca5a5', lineHeight: 1.5, marginBottom: 12 }}>
              ตรวจพบการเข้าสู่ระบบด้วยอีเมลที่ไม่ได้รับอนุญาต ระบบจะเพิ่มระยะเวลาการล็อคเพิ่มขึ้นเรื่อยๆ เป็นนาทีและชั่วโมงตามจำนวนครั้งที่พยายาม
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(0, 0, 0, 0.45)',
              padding: '10px 14px',
              borderRadius: 12,
              border: '1px solid rgba(239, 68, 68, 0.25)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fbbf24', fontSize: 12, fontWeight: 700 }}>
                <Clock style={{ width: 15, height: 15 }} />
                <span>ปลดล็อคในอีก:</span>
              </div>
              <span style={{
                fontFamily: 'monospace',
                fontWeight: 900,
                fontSize: 14,
                color: '#fbbf24',
                letterSpacing: '0.04em',
              }}>
                {formatRemainingTime(remainingSeconds)}
              </span>
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
              <span>การพยายามที่ผิด: <b>ครั้งที่ {lockoutAttempts}</b></span>
              <span>บทลงโทษรอบนี้: <b>{formatRemainingTime(getCooldownForAttempt(lockoutAttempts))}</b></span>
            </div>
          </div>
        )}

        {/* Error Notice */}
        {errorMsg && remainingSeconds === 0 && (
          <div style={{
            marginBottom: 16,
            padding: '12px 14px',
            borderRadius: 12,
            background: 'rgba(244,63,94,0.10)',
            border: '1px solid rgba(244,63,94,0.30)',
            color: '#fb7185',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <AlertCircle style={{ width: 15, height: 15, flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#5a6e90', marginBottom: 6, letterSpacing: '0.05em' }}>
              อีเมลCEO TheBottleClub
            </label>
            <div style={{ position: 'relative' }}>
              <User style={{ width: 15, height: 15, color: '#3d4d6a', position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                disabled={loading || remainingSeconds > 0}
                style={{
                  width: '100%',
                  background: remainingSeconds > 0 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
                  border: remainingSeconds > 0 ? '1px solid rgba(239,68,68,0.25)' : (emailFocused ? '1px solid rgba(0,212,255,0.55)' : '1px solid rgba(255,255,255,0.10)'),
                  boxShadow: emailFocused ? '0 0 0 3px rgba(0,212,255,0.10)' : 'none',
                  color: remainingSeconds > 0 ? '#64748b' : '#eef2ff',
                  borderRadius: 14,
                  fontSize: 13,
                  padding: '11px 14px 11px 38px',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  boxSizing: 'border-box',
                  fontFamily: "'Outfit', sans-serif",
                  cursor: remainingSeconds > 0 ? 'not-allowed' : 'text',
                  opacity: remainingSeconds > 0 ? 0.5 : 1,
                }}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#5a6e90', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              รหัสผ่าน (Password)
            </label>
            <div style={{ position: 'relative' }}>
              <Lock style={{ width: 15, height: 15, color: '#3d4d6a', position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                disabled={loading || remainingSeconds > 0}
                style={{
                  width: '100%',
                  background: remainingSeconds > 0 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
                  border: remainingSeconds > 0 ? '1px solid rgba(239,68,68,0.25)' : (passwordFocused ? '1px solid rgba(0,212,255,0.55)' : '1px solid rgba(255,255,255,0.10)'),
                  boxShadow: passwordFocused ? '0 0 0 3px rgba(0,212,255,0.10)' : 'none',
                  color: remainingSeconds > 0 ? '#64748b' : '#eef2ff',
                  borderRadius: 14,
                  fontSize: 13,
                  padding: '11px 40px 11px 38px',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  boxSizing: 'border-box',
                  fontFamily: "'Outfit', sans-serif",
                  cursor: remainingSeconds > 0 ? 'not-allowed' : 'text',
                  opacity: remainingSeconds > 0 ? 0.5 : 1,
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={remainingSeconds > 0}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: remainingSeconds > 0 ? 'not-allowed' : 'pointer',
                  color: '#3d4d6a', padding: 4, display: 'flex', alignItems: 'center',
                }}
                title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
              >
                {showPassword ? (
                  <EyeOff style={{ width: 15, height: 15 }} />
                ) : (
                  <Eye style={{ width: 15, height: 15 }} />
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || remainingSeconds > 0}
            style={{
              width: '100%',
              marginTop: 8,
              padding: '13px 20px',
              borderRadius: 14,
              background: remainingSeconds > 0
                ? 'rgba(239, 68, 68, 0.16)'
                : 'linear-gradient(135deg, rgba(0,212,255,0.22) 0%, rgba(0,196,180,0.16) 100%)',
              border: remainingSeconds > 0
                ? '1px solid rgba(239, 68, 68, 0.45)'
                : '1px solid rgba(0,212,255,0.45)',
              color: remainingSeconds > 0 ? '#fca5a5' : '#22e5ff',
              fontWeight: 800,
              fontSize: 14,
              fontFamily: "'Outfit', sans-serif",
              letterSpacing: '0.01em',
              boxShadow: remainingSeconds > 0 ? '0 8px 32px rgba(239, 68, 68, 0.20)' : '0 8px 32px rgba(0,212,255,0.28)',
              cursor: (loading || remainingSeconds > 0) ? 'not-allowed' : 'pointer',
              opacity: (loading || remainingSeconds > 0) ? 0.75 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s',
            }}
          >
            {remainingSeconds > 0 ? (
              <>
                <Clock style={{ width: 16, height: 16 }} />
                <span>ระงับการเข้าสู่ระบบ ({formatRemainingTime(remainingSeconds)})</span>
              </>
            ) : loading ? (
              <>
                <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
                <span>กำลังเข้าสู่ระบบและเชื่อมต่อ API...</span>
              </>
            ) : (
              <>
                <span>เข้าสู่ระบบ (Super Admin)</span>
                <ArrowRight style={{ width: 16, height: 16 }} />
              </>
            )}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
