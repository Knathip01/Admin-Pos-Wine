'use client'

import React, { useEffect, useState } from 'react'
import { useApiAuth, ensureApiAuth, isTokenExpired, DEFAULT_API_CREDENTIALS } from '@/lib/store/api-auth'
import { checkHealth } from '@/lib/api/client'
import { authApi } from '@/lib/api/auth'
import { Wifi, WifiOff, RefreshCw, Activity, ShieldCheck } from 'lucide-react'

/**
 * ApiStatusBanner — แสดงสถานะการเชื่อมต่อ API แบบไม่ต้องล็อกอิน
 */
export function ApiStatusBanner() {
  const { accessToken, profile, setProfile, refreshToken, setTokens, clear } = useApiAuth()
  const [health, setHealth] = useState<'checking' | 'online' | 'offline'>('checking')
  const [refreshing, setRefreshing] = useState(false)

  // 1. Check health
  useEffect(() => {
    checkHealth()
      .then(() => setHealth('online'))
      .catch(() => setHealth('offline'))
  }, [])

  // 2. Auto-authenticate seamlessly in background
  useEffect(() => {
    if (!accessToken || isTokenExpired(accessToken)) {
      ensureApiAuth().then((token) => {
        if (token) setHealth('online')
      })
    }
  }, [accessToken])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      if (refreshToken) {
        const tokens = await authApi.refresh({ refresh_token: refreshToken })
        setTokens(tokens.access_token, tokens.refresh_token)
        const newProfile = await authApi.me(tokens.access_token)
        setProfile(newProfile)
      } else {
        await ensureApiAuth()
      }
      const h = await checkHealth().catch(() => null)
      if (h) setHealth('online')
    } catch {
      // Keep session intact
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div
      className="flex items-center justify-between gap-3 px-4 py-2 rounded-xl mb-4 text-xs select-none"
      style={{
        background: 'linear-gradient(135deg, rgba(14,20,35,0.7) 0%, rgba(10,14,26,0.6) 100%)',
        border: '1px solid rgba(0,212,255,0.12)',
      }}
    >
      {/* Health indicator */}
      <div className="flex items-center gap-2">
        {health === 'online' ? (
          <>
            <Wifi className="w-3.5 h-3.5" style={{ color: '#34d399' }} />
            <span className="text-[11px] font-bold" style={{ color: '#34d399' }}>Live API: Online</span>
          </>
        ) : health === 'offline' ? (
          <>
            <WifiOff className="w-3.5 h-3.5" style={{ color: '#fbbf24' }} />
            <span className="text-[11px] font-bold" style={{ color: '#fbbf24' }}>API Mode: Direct Data Display</span>
          </>
        ) : (
          <>
            <Activity className="w-3.5 h-3.5 animate-pulse" style={{ color: '#22e5ff' }} />
            <span className="text-[11px] font-bold" style={{ color: '#22e5ff' }}>กำลังเชื่อมต่อ API...</span>
          </>
        )}

        <div className="h-3 w-px bg-white/10 mx-1" />

        <div className="flex items-center gap-1 text-[11px] text-[#94a3c4]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#22e5ff]" />
          <span>สิทธิ์:</span>
          <span className="font-bold text-[#eef2ff]">
            {profile?.full_name ?? profile?.username ?? DEFAULT_API_CREDENTIALS.username}
          </span>
        </div>
      </div>

      {/* Action */}
      <button
        onClick={handleRefresh}
        disabled={refreshing}
        className="flex items-center gap-1 text-[11px] font-bold text-[#5a6e90] hover:text-[#22e5ff] transition cursor-pointer disabled:opacity-50"
        title="รีเฟรชข้อมูล API"
      >
        <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
        <span>รีเฟรชข้อมูล</span>
      </button>
    </div>
  )
}
