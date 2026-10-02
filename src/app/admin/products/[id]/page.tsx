'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function EditProductPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/admin/products')
  }, [router])

  return (
    <div className="min-h-[50vh] flex items-center justify-center text-xs text-[#5a6e90]">
      กำลังนำคุณไปยังหน้ารายการสินค้า POS...
    </div>
  )
}
