"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/app/lib/supabase/client"
import { useRouter } from "next/navigation"
import RegistrationModal from "@/app/auth/registration/page"
import { ensureProfile } from "@/app/lib/supabase/profile";
import { createActivityLog } from '@/app/lib/supabase/activityLogs'

const updateLastActive = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({ last_active: new Date().toISOString() })
        .eq('id', user.id)
      
      if (error) {
        console.error('Error updating last_active:', error)
      }
    }
  } catch (error) {
    console.error('Error in updateLastActive:', error)
  }
}

const checkUserStatus = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return {
        success: false,
        error: 'no_user',
        message: 'No user found'
      }
    }

    // Check email confirmation
    if (!user.email_confirmed_at) {
      return {
        success: false,
        error: 'email_not_confirmed',
        message: 'Please check your email and click the confirmation link before logging in.'
      }
    }

    // Get user profile with admin approval status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return {
        success: false,
        error: 'profile_error',
        message: 'Unable to verify account status. Please contact support.'
      }
    }

    if (!profile) {
      return {
        success: false,
        error: 'no_profile',
        message: 'User profile not found. Please contact support.'
      }
    }

    // Check if status is 'approved' (not just true/false boolean)
    if (profile.status !== 'approved') {
      return {
        success: false,
        error: "account_not_approved",
        message: profile.status === 'rejected' 
          ? "Your account has been rejected. Please contact support."
          : "Your account is pending approval. Please wait for an administrator to approve your account.",
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in checkUserStatus:', error)
    return {
      success: false,
      error: 'unknown_error',
      message: 'An error occurred while checking your account status.'
    }
  }
}

// Resend email confirmation
const resendConfirmationEmail = async (email: string) => {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email
    })

    if (error) throw error

    return { success: true, message: 'Confirmation email sent successfully!' }
  } catch (error: any) {
    console.error('Error resending confirmation:', error)
    return { 
      success: false, 
      message: error.message || 'Failed to resend confirmation email' 
    }
  }
}

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)
  const [showResendConfirmation, setShowResendConfirmation] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState<string | null>(null)
  const router = useRouter()

  // Check for OAuth errors in URL on component mount
  useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const errorDescription = params.get('error_description')
      const errorCode = params.get('error')
      
      if (errorDescription) {
        setError(decodeURIComponent(errorDescription))
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname)
      } else if (errorCode) {
        setError('An error occurred during Google sign-in. Please try again.')
        window.history.replaceState({}, '', window.location.pathname)
      }
    }
  })

  const handleResendConfirmation = async () => {
    if (!email) {
      setError('Please enter your email address first')
      return
    }

    setResendLoading(true)
    setResendMessage(null)
    
    const result = await resendConfirmationEmail(email)
    
    if (result.success) {
      setResendMessage(result.message)
      setError(null)
    } else {
      setError(result.message)
    }
    
    setResendLoading(false)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setShowResendConfirmation(false)
    setResendMessage(null)
    
    try {
      // Sign in with email/password
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        setError(error.message)
        return
      }

      // Check user status (email confirmation and admin approval)
      const statusCheck = await checkUserStatus()
      
      if (!statusCheck.success) {
        // Sign out if not approved
        await supabase.auth.signOut()
        
        setError(statusCheck.message || '')
        
        // Show resend option for unconfirmed emails
        if (statusCheck.error === 'email_not_confirmed') {
          setShowResendConfirmation(true)
        }
        
        return
      }

      // Update last active and log activity, then redirect
      if (data.user) {
        await updateLastActive()
        try {
          await createActivityLog({
            userId: data.user.id,
            action: 'Logged in',
            details: 'User authenticated with email/password',
          })
        } catch (e) {
          console.warn('Failed to record login activity', e)
        }
      }

      router.push("/multifactors")
      
    } catch (error) {
      console.error('Login error:', error)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/oauth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      })
      
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      // OAuth will redirect, so loading state will persist until redirect
    } catch (error: any) {
      console.error('Google login error:', error)
      setError(error.message || 'An unexpected error occurred during Google sign-in')
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
              <p className="text-gray-600">Sign in to your account</p>
            </div>

            {/* Success Message */}
            {resendMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
                {resendMessage}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
                {showResendConfirmation && (
                  <div className="mt-3">
                    <button
                      onClick={handleResendConfirmation}
                      disabled={resendLoading}
                      className="text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded transition duration-200 disabled:opacity-50"
                    >
                      {resendLoading ? 'Sending...' : 'Resend Confirmation Email'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  required
                  disabled={loading}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 text-sm text-gray-600">
                    Remember me
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="px-4 text-sm text-gray-500">or</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            {/* Google Sign In */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 focus:ring-4 focus:ring-gray-100 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
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

            {/* Sign Up Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don&apos;t have an account?{" "}
                <button 
                  onClick={() => setShowRegistrationModal(true)}
                  className="text-blue-600 hover:text-blue-800 font-medium underline"
                  type="button"
                >
                  Sign Up
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>

      <RegistrationModal
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        onSuccess={() => console.log("Registration successful!")}
      />
    </>
  )
}