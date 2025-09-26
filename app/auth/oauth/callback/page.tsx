"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/app/lib/supabase/client"
import { useRouter } from "next/navigation"

// Ensure a profile exists for OAuth users
const ensureProfile = async (user: any) => {
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  if (existingProfile) return existingProfile

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.user_metadata?.name || "",
      avatar_url: user.user_metadata?.avatar_url || "",
      status: "pending", // default when created
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating profile:", error)
    return null
  }

  return data
}

// Check approval
const checkUserApproval = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: "No user found" }

  const profile = await ensureProfile(user)

  if (!profile) {
    return { success: false, message: "Profile could not be created" }
  }

  // Check status as string
  if (profile.status === "pending") {
    return { success: false, message: "Your account is pending admin approval." }
  }

  if (profile.status === "rejected") {
    return { success: false, message: "Your account has been rejected. Please contact admin." }
  }

  if (profile.status !== "approved") {
    return { success: false, message: "Unknown account status. Please contact support." }
  }

  return { success: true }
}

// Update last_active
const updateLastActive = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await supabase.from("profiles")
      .update({ last_active: new Date().toISOString() })
      .eq("id", user.id)
  }
}

export default function OAuthCallback() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError || !session?.user) {
          setError("Authentication failed. Please try again.")
          setTimeout(() => router.push("/auth/login"), 3000)
          return
        }

        const statusCheck = await checkUserApproval()
        if (!statusCheck.success) {
          await supabase.auth.signOut()
          setError(statusCheck.message)
          setTimeout(() => router.push("/"), 5000)
          return
        }

        await updateLastActive()
        router.push("/multifactors")
      } catch (err) {
        console.error("OAuth callback error:", err)
        setError("An unexpected error occurred.")
        setTimeout(() => router.push("/"), 3000)
      } finally {
        setLoading(false)
      }
    }

    handleCallback()
  }, [router])

  if (loading) return <div className="p-6 text-center">Checking your account...</div>
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>
  return null
}
