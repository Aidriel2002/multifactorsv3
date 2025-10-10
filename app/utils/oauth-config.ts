/**
 * OAuth Configuration for Google Login
 * Handles localhost, port forwarding, and deployment scenarios
 */

export interface OAuthConfig {
  redirectUrl: string
  allowedOrigins: string[]
  isLocalhost: boolean
  isDevelopment: boolean
}

/**
 * Get OAuth configuration based on current environment
 */
export const getOAuthConfig = (): OAuthConfig => {
  if (typeof window === 'undefined') {
    return {
      redirectUrl: '',
      allowedOrigins: [],
      isLocalhost: false,
      isDevelopment: false
    }
  }

  const origin = window.location.origin
  const hostname = window.location.hostname
  const port = window.location.port
  
  // Check if running on localhost
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0'
  
  // Check if development environment
  const isDevelopment = isLocalhost || hostname.includes('ngrok') || hostname.includes('tunnel')
  
  // Build redirect URL
  let redirectUrl = `${origin}/auth/oauth/callback`
  
  // Handle port forwarding scenarios
  if (isLocalhost && port) {
    // For localhost with port (e.g., localhost:3000)
    redirectUrl = `${origin}/auth/oauth/callback`
  } else if (isLocalhost && !port) {
    // For localhost without explicit port (default port)
    redirectUrl = `${origin}/auth/oauth/callback`
  }
  
  // Handle ngrok and other tunneling services
  if (hostname.includes('ngrok') || hostname.includes('tunnel')) {
    redirectUrl = `${origin}/auth/oauth/callback`
  }
  
  // Allowed origins for CORS
  const allowedOrigins = [
    origin,
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    // Add your production domain here
    // 'https://yourdomain.com'
  ]
  
  return {
    redirectUrl,
    allowedOrigins,
    isLocalhost,
    isDevelopment
  }
}

/**
 * Get Google OAuth configuration for Supabase
 */
export const getGoogleOAuthConfig = () => {
  const config = getOAuthConfig()
  
  return {
    provider: 'google' as const,
    options: {
      redirectTo: config.redirectUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
        // Add additional scopes if needed
        scope: 'openid email profile'
      }
    }
  }
}

/**
 * Debug OAuth configuration
 */
export const debugOAuthConfig = () => {
  if (typeof window === 'undefined') return
  
  const config = getOAuthConfig()
  
  console.log('🔧 OAuth Configuration Debug:')
  console.log('Origin:', window.location.origin)
  console.log('Hostname:', window.location.hostname)
  console.log('Port:', window.location.port)
  console.log('Redirect URL:', config.redirectUrl)
  console.log('Is Localhost:', config.isLocalhost)
  console.log('Is Development:', config.isDevelopment)
  console.log('Allowed Origins:', config.allowedOrigins)
}
