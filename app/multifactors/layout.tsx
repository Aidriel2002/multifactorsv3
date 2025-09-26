"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { supabase } from "@/app/lib/supabase/client"
import MultiSidebar from '@/app/components/sidebars/multi-sidebar'
import { AlertTriangle, ArrowLeft } from 'lucide-react'

interface UserProfile {
  status: string
  role: string
}

export default function MultifactorsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [accessDenied, setAccessDenied] = useState(false)

  // Define admin-only routes
  const adminOnlyRoutes = ['/multifactors/account-approval']
  const isAdminRoute = adminOnlyRoutes.some(route => pathname?.startsWith(route))

  useEffect(() => {
  const checkUserStatus = async () => {
    setLoading(true)
    
    const { data: { session, user }, error: sessionError } = await supabase.auth.getSession()

    // If no session, allow login pages to show
    if (!session || !user) {
      setLoading(false)
      return
    }

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("status, role")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.warn("Profile fetch error:", profileError)
      setUserProfile(null)
      setLoading(false)
      return
    }

    if (!profile) {
      // profile doesn't exist yet, maybe allow registration/login to complete
      setUserProfile(null)
      setLoading(false)
      return
    }

    setUserProfile(profile)

    // Admin route enforcement
    if (isAdminRoute && profile.role !== "admin") {
      setAccessDenied(true)
    }

    setLoading(false)
  }

  checkUserStatus()
}, [pathname])


  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking Access...</p>
        </div>
      </div>
    )
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You don&apos;t have permission to access this page. This area is restricted to administrators only.
          </p>
          <div className="space-y-2 text-sm text-gray-500 mb-6">
            <p><strong>Current Role:</strong> {userProfile?.role || 'Unknown'}</p>
            <p><strong>Account Status:</strong> {userProfile?.status || 'Unknown'}</p>
            <p><strong>Required:</strong> Admin role with approved status</p>
          </div>
          <button
            onClick={() => router.push('/multifactors')}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <MultiSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {/* inject userProfile into children */}
          {children && 
            typeof children === "object" &&
            "props" in (children as any)
              ? { ...children, props: { ...(children as any).props, userProfile } }
              : children
          }
        </div>
      </main>
    </div>
  )
}
