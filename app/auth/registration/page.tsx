"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/app/lib/supabase/client"
import { ensureProfile } from "@/app/lib/supabase/profile"

interface RegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function RegistrationModal({ isOpen, onClose, onSuccess }: RegistrationModalProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const user = session.user

        if (user.app_metadata.provider === "google") {
          try {
            const userMetadata = user.user_metadata
            const fullName = userMetadata.full_name || userMetadata.name || ""
            const firstName = userMetadata.given_name || fullName.split(" ")[0] || ""
            const lastName = userMetadata.family_name || fullName.split(" ").slice(1).join(" ") || ""

            const { data: existingProfile, error: fetchError } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", user.id)
              .single()

            if (fetchError && fetchError.code !== "PGRST116") {
            }

            if (!existingProfile) {
              const { error: insertError } = await supabase
                .from("profiles")
                .insert({
                  id: user.id,
                  email: user.email,
                  first_name: firstName,
                  last_name: lastName,
                  full_name: fullName,
                  avatar_url: userMetadata.avatar_url || userMetadata.picture || null,
                  updated_at: new Date().toISOString(),
                })

              if (insertError) throw insertError
            } else if (!existingProfile.first_name || !existingProfile.last_name) {
              const { error: updateError } = await supabase
                .from("profiles")
                .update({
                  first_name: firstName,
                  last_name: lastName,
                  full_name: fullName,
                  avatar_url: userMetadata.avatar_url || userMetadata.picture || existingProfile.avatar_url,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", user.id)

              if (updateError) {/* Profile update failed */}
            }

            setSuccess("Successfully signed in with Google!")

            if (onSuccess) {
              setTimeout(() => {
                onSuccess()
                handleClose()
              }, 1500)
            } else {
              setTimeout(() => handleClose(), 2000)
            }
          } catch (err) {
            setError("Signed in but profile setup failed. Please contact support.")
          }
        }
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [onSuccess])

  const resetForm = () => {
    setEmail("")
    setPassword("")
    setConfirmPassword("")
    setFirstName("")
    setLastName("")
    setError(null)
    setSuccess(null)
    setLoading(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (!email.trim() || !password.trim() || !firstName.trim() || !lastName.trim()) {
        setError("All fields are required")
        return
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        setError("Please enter a valid email address")
        return
      }

      if (password !== confirmPassword) {
        setError("Passwords don't match")
        return
      }

      if (password.length < 6) {
        setError("Password must be at least 6 characters long")
        return
      }

      const cleanEmail = email.trim().toLowerCase()
      const cleanFirstName = firstName.trim()
      const cleanLastName = lastName.trim()

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            first_name: cleanFirstName,
            last_name: cleanLastName,
            full_name: `${cleanFirstName} ${cleanLastName}`,
          },
        },
      })

      if (signUpError) {
        if (signUpError.message.includes("User already registered")) {
          setError("An account with this email already exists")
        } else if (signUpError.message.includes("Invalid email")) {
          setError("Please enter a valid email address")
        } else if (signUpError.message.includes("Password should be at least")) {
          setError("Password must be at least 6 characters long")
        } else {
          setError("There was a problem creating your account. Please try again later.")
        }
        return
      }

      if (data.user) {
        try {
          await ensureProfile(data.user)
        } catch (profileError: any) {
          const msg = profileError.message?.toLowerCase?.() || ""
          if (
            msg.includes("policy") ||
            msg.includes("permission") ||
            msg.includes("rls") ||
            msg.includes("row-level security") ||
            msg.includes("insufficient_privilege")
          ) {
            setError("Account created but profile setup failed due to permissions. Please contact support.")
          } else {
            setError("Account created but profile setup failed. Please try again.")
          }
          return
        }
      }

      if (data.user && !data.session) {
        setSuccess("Account created! Please check your email to verify your account.")
      } else {
        setSuccess("Account created successfully! You are now logged in.")
      }

      setTimeout(() => {
        if (onSuccess) onSuccess()
        handleClose()
      }, 2000)
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/pages/multifactors/dashboard`,
          queryParams: { access_type: "offline", prompt: "consent" },
          scopes: "email profile",
        },
      })
      if (error) setError(error.message)
    } catch (err) {
      setError("Failed to sign up with Google. Please try again.")
    } finally {
      // keep loading while redirecting is not needed; clear for safety
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={handleClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
            disabled={loading}
            aria-label="Close modal"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Account</h2>
              <p className="text-gray-600 text-sm">Join us and get started today</p>
            </div>

            {success && <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg mb-4 text-sm">{success}</div>}
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-4 text-sm">{error}</div>}

            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="modal-firstName" className="block text-xs font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    id="modal-firstName"
                    type="text"
                    placeholder="Enter your First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                    disabled={loading}
                    maxLength={50}
                  />
                </div>
                <div>
                  <label htmlFor="modal-lastName" className="block text-xs font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    id="modal-lastName"
                    type="text"
                    placeholder="Enter your Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                    disabled={loading}
                    maxLength={50}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="modal-email" className="block text-xs font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  id="modal-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                  disabled={loading}
                  maxLength={100}
                />
              </div>

              <div>
                <label htmlFor="modal-password" className="block text-xs font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="modal-password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                  minLength={8}
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="modal-confirmPassword" className="block text-xs font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  id="modal-confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                  disabled={loading}
                />
              </div>

              <div className="flex items-start">
                <input id="modal-terms" type="checkbox" className="h-4 w-4 text-purple-600 border-gray-300 rounded" required disabled={loading} />
                <label htmlFor="modal-terms" className="ml-2 text-xs text-gray-600">
                  I agree to the{" "}
                  <a href="/terms" target="_blank" className="text-purple-600 hover:text-purple-800">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="/privacy" target="_blank" className="text-purple-600 hover:text-purple-800">
                    Privacy Policy
                  </a>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-purple-700 focus:ring-4 focus:ring-purple-200 disabled:opacity-50"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            <div className="my-4 flex items-center">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="px-3 text-xs text-gray-500">or</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            <button
              onClick={handleGoogleSignUp}
              disabled={loading}
              className="w-full border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
