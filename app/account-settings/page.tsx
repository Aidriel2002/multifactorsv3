'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AccountSettingsPage() {
  const router = useRouter()

  useEffect(() => {
    router.push('/multifactors/account-settings')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#055B00] mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to account settings...</p>
      </div>
    </div>
  )
}