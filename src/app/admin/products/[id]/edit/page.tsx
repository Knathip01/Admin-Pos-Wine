'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function ProductEditRedirectPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id

  useEffect(() => {
    if (id) {
      router.replace(`/admin/products/${id}`)
    } else {
      router.replace('/admin/bottleclub/products')
    }
  }, [id, router])

  return (
    <div className="min-h-[50vh] flex items-center justify-center text-xs text-[#5a6e90]">
      กำลังนำคุณไปยังหน้าแก้ไขสินค้า...
    </div>
  )
}
