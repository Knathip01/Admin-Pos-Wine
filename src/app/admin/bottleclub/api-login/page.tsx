'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ensureApiAuth } from '@/lib/store/api-auth'
import { Loader2 } from 'lucide-react'

export default function ApiLoginPage() {
  const router = useRouter()

  useEffect(() => {
    ensureApiAuth().then((token) => {
      if (token) {
        router.replace('/admin/bottleclub')
      } else {
        router.replace('/admin/login')
      }
    }).catch(() => {
      router.replace('/admin/login')
    })
  }, [router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#05080f] text-cyan-400 gap-3">
      <Loader2 className="w-8 h-8 animate-spin" />
      <p className="text-sm font-semibold text-[#94a3c4]">กำลังเชื่อมต่อเข้าสู่ระบบ Web Wine...</p>
    </div>
  )
}
