'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Wine, Lock, User, ShieldCheck, ArrowRight, AlertCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function AdminLoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      })

      if (error) {
        throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
      }

      if (data.user) {
        // Get redirect target from URL params or default to /admin
        const params = new URLSearchParams(window.location.search)
        const redirectTo = params.get('redirectTo') || '/admin'
        router.push(redirectTo)
        router.refresh()
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบข้อมูลอีกครั้ง')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0e13] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Wine Decorative Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#8b0000]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#d4af37]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md glass-panel-gold rounded-3xl p-8 shadow-2xl relative z-10 border border-[#d4af37]/40">
        {/* Header Logo */}
        <div className="text-center space-y-3 mb-8">
          <div className="w-20 h-20 rounded-2xl mx-auto shadow-2xl flex items-center justify-center border border-[#d4af37]/40 overflow-hidden bg-[#e6d0a7] p-1">
            <img
              src="/logo.jpg"
              alt="The Bottle Club Logo"
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gold-gradient tracking-tight">
              The Bottle Club Admin
            </h1>
          </div>
        </div>

        {/* Error Notice */}
        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">อีเมลผู้ใช้งาน (Email)</label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#100e17] text-white text-xs pl-10 pr-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:border-[#d4af37]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">รหัสผ่าน (Password)</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#100e17] text-white text-xs pl-10 pr-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:border-[#d4af37]"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#8b0000] via-[#5c0000] to-[#8b0000] text-white font-bold text-sm border border-[#d4af37]/60 shadow-xl flex items-center justify-center space-x-2 hover:brightness-110 transition-all mt-6 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#d4af37]" />
                <span>กำลังเข้าสู่ระบบ Supabase...</span>
              </>
            ) : (
              <>
                <span>เข้าสู่ระบบ Super Admin</span>
                <ArrowRight className="w-4 h-4 text-[#d4af37]" />
              </>
            )}
          </button>
        </form>


      </div>
    </div>
  )
}
