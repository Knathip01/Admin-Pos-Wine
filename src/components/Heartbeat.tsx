'use client'

import React, { useEffect, useState } from 'react'

export default function Heartbeat() {
  const [lastBeat, setLastBeat] = useState<string>('')

  useEffect(() => {
    const triggerHeartbeat = () => {
      setLastBeat(new Date().toLocaleTimeString('th-TH'))
    }

    triggerHeartbeat()
    const interval = setInterval(triggerHeartbeat, 20000)

    return () => clearInterval(interval)
  }, [])

  return null
}
