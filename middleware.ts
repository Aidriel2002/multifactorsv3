import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isPublicRoute, getRequiredRole } from './app/utils/security-config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the current route is public
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // For protected routes, check authentication
  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get the session from the request
    const token = request.cookies.get('sb-access-token')?.value || 
                  request.cookies.get('sb-refresh-token')?.value

    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // Verify the session
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error || !session?.user) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Check if email is confirmed
    if (!session.user.email_confirmed_at) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Get user profile to check approval status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('status, role')
      .eq('id', session.user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Check if account is approved
    if (profile.status !== 'approved') {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Check role requirements
    const requiredRole = getRequiredRole(pathname)
    
    if (requiredRole && profile.role !== requiredRole) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Allow the request to proceed
    return NextResponse.next()

  } catch (error) {
    console.error('Middleware authentication error:', error)
    return NextResponse.redirect(new URL('/', request.url))
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
