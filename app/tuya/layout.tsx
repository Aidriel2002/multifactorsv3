'use client'

import TuyaSidebar from '@/app/components/sidebars/tuya-sidebar'
import AuthGuard from '@/app/components/AuthGuard'

export default function TuyaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <div className="flex h-screen bg-gray-50">
        <TuyaSidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}