"use client"

import { usePathname } from "next/navigation"
import MultiSidebar from '@/app/components/sidebars/multi-sidebar'
import AuthGuard from '@/app/components/AuthGuard'

export default function MultifactorsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  
  // Check if this is an admin-only route
  const adminOnlyRoutes = ['/multifactors/account-approval']
  const isAdminRoute = adminOnlyRoutes.some(route => pathname?.startsWith(route))
  const requiredRole = isAdminRoute ? 'admin' : undefined

  return (
    <AuthGuard requiredRole={requiredRole}>
      <div className="flex h-screen bg-gray-50">
        <MultiSidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
