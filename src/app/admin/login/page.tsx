'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Wine, Lock, User, ShieldCheck, ArrowRight, AlertCircle, Loader2, Eye, EyeOff, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { authApi } from '@/lib/api/auth'
import { useApiAuth, DEFAULT_API_CREDENTIALS } from '@/lib/store/api-auth'

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)

    try {
      const cleanEmail = email.trim()
      const cleanPass = password.trim()

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
        // If both failed with custom credentials, check if it's default admin
        if (cleanEmail === DEFAULT_API_CREDENTIALS.email && cleanPass === DEFAULT_API_CREDENTIALS.password) {
          // Allow default local session bypass for development
          supabaseSuccess = true
        } else {
          throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
        }
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
          <p style={{ color: '#5a6e90', fontSize: 12, margin: '4px 0 0', fontWeight: 600 }}>
            Unified POS & Web Wine Control Center
          </p>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 8,
            padding: '3px 10px',
            borderRadius: 20,
            background: 'rgba(34,229,255,0.08)',
            border: '1px solid rgba(34,229,255,0.20)',
            fontSize: 10,
            color: '#22e5ff',
            fontWeight: 700
          }}>
            <Sparkles style={{ width: 11, height: 11 }} />
            <span>เชื่อมต่อ API Backend อัตโนมัติ</span>
          </div>
        </div>

        {/* Error Notice */}
        {errorMsg && (
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
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#5a6e90', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              อีเมลผู้ใช้งาน (Email / Username)
            </label>
            <div style={{ position: 'relative' }}>
              <User style={{ width: 15, height: 15, color: '#3d4d6a', position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.04)',
                  border: emailFocused ? '1px solid rgba(0,212,255,0.55)' : '1px solid rgba(255,255,255,0.10)',
                  boxShadow: emailFocused ? '0 0 0 3px rgba(0,212,255,0.10)' : 'none',
                  color: '#eef2ff',
                  borderRadius: 14,
                  fontSize: 13,
                  padding: '11px 14px 11px 38px',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  boxSizing: 'border-box',
                  fontFamily: "'Outfit', sans-serif",
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
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.04)',
                  border: passwordFocused ? '1px solid rgba(0,212,255,0.55)' : '1px solid rgba(255,255,255,0.10)',
                  boxShadow: passwordFocused ? '0 0 0 3px rgba(0,212,255,0.10)' : 'none',
                  color: '#eef2ff',
                  borderRadius: 14,
                  fontSize: 13,
                  padding: '11px 40px 11px 38px',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  boxSizing: 'border-box',
                  fontFamily: "'Outfit', sans-serif",
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
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
            disabled={loading}
            style={{
              width: '100%',
              marginTop: 8,
              padding: '13px 20px',
              borderRadius: 14,
              background: 'linear-gradient(135deg, rgba(0,212,255,0.22) 0%, rgba(0,196,180,0.16) 100%)',
              border: '1px solid rgba(0,212,255,0.45)',
              color: '#22e5ff',
              fontWeight: 800,
              fontSize: 14,
              fontFamily: "'Outfit', sans-serif",
              letterSpacing: '0.01em',
              boxShadow: '0 8px 32px rgba(0,212,255,0.28)',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.65 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s',
            }}
          >
            {loading ? (
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

        {/* Footer note */}
        <p style={{ textAlign: 'center', fontSize: 11, color: '#3d4d6a', marginTop: 20, marginBottom: 0 }}>
          ระบบจะเชื่อมต่อ API Token และฐานข้อมูลให้อัตโนมัติ
        </p>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
