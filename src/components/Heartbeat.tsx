'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function Heartbeat() {
  useEffect(() => {
    const triggerHeartbeat = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }))

        // Read local user profile if available
        let username = user?.user_metadata?.full_name || user?.email?.split('@')[0] || ''
        if (!username) {
          try {
            const raw = localStorage.getItem('bottleclub-api-auth')
            if (raw) {
              const parsed = JSON.parse(raw)
              username = parsed?.state?.profile?.username || parsed?.state?.profile?.display_name || ''
            }
          } catch {}
        }

        await fetch('/api/admin/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user?.id,
            username: username || 'superadmin'
          })
        }).catch(() => {})
      } catch {}
    }

    triggerHeartbeat()
    const interval = setInterval(triggerHeartbeat, 25000)

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        triggerHeartbeat()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  return null
}
