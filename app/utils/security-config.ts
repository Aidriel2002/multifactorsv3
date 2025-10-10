/**
 * Security Configuration for Multifactors Application
 * 
 * This file defines all security-related configurations and route protections
 */

export const SECURITY_CONFIG = {
  // Public routes that don't require authentication
  PUBLIC_ROUTES: [
    '/',
    '/auth/login',
    '/auth/registration', 
    '/auth/oauth/callback',
    '/api/sendEmail'
  ],

  // Protected routes that require authentication
  PROTECTED_ROUTES: {
    // Multifactors routes
    '/multifactors': { requiredRole: undefined },
    '/multifactors/dashboard': { requiredRole: undefined },
    '/multifactors/projects': { requiredRole: undefined },
    '/multifactors/saved-projects': { requiredRole: undefined },
    '/multifactors/quotation-list': { requiredRole: undefined },
    '/multifactors/suppliers-customers': { requiredRole: undefined },
    '/multifactors/activity-logs': { requiredRole: undefined },
    '/multifactors/account-settings': { requiredRole: undefined },
    '/multifactors/account-approval': { requiredRole: 'admin' },
    
    // Ruijie routes
    '/ruijie': { requiredRole: undefined },
    '/ruijie/dashboard': { requiredRole: undefined },
    '/ruijie/devices': { requiredRole: undefined },
    '/ruijie/network': { requiredRole: undefined },
    '/ruijie/settings': { requiredRole: undefined },
    '/ruijie/account-settings': { requiredRole: undefined },
    
    // Tuya routes
    '/tuya': { requiredRole: undefined },
    '/tuya/dashboard': { requiredRole: undefined },
    '/tuya/devices': { requiredRole: undefined },
    '/tuya/automation': { requiredRole: undefined },
    '/tuya/scenes': { requiredRole: undefined },
    '/tuya/account-settings': { requiredRole: undefined },
  },

  // Admin-only routes
  ADMIN_ROUTES: [
    '/multifactors/account-approval'
  ],

  // Authentication requirements
  AUTH_REQUIREMENTS: {
    EMAIL_CONFIRMATION_REQUIRED: true,
    ACCOUNT_APPROVAL_REQUIRED: true,
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  },

  // Redirect behavior for authentication failures
  REDIRECT_BEHAVIOR: {
    UNAUTHENTICATED_REDIRECT: '/',
    NO_SESSION_REDIRECT: '/',
    EMAIL_NOT_CONFIRMED_REDIRECT: '/',
    PROFILE_NOT_FOUND_REDIRECT: '/',
    ACCOUNT_REJECTED_REDIRECT: '/',
    ACCOUNT_PENDING_REDIRECT: '/',
    ACCESS_DENIED_REDIRECT: '/',
    AUTH_ERROR_REDIRECT: '/',
    SESSION_EXPIRED_REDIRECT: '/',
  }
}

/**
 * Check if a route is public
 */
export const isPublicRoute = (pathname: string): boolean => {
  return SECURITY_CONFIG.PUBLIC_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route)
  )
}

/**
 * Check if a route is protected
 */
export const isProtectedRoute = (pathname: string): boolean => {
  return Object.keys(SECURITY_CONFIG.PROTECTED_ROUTES).some(route => 
    pathname.startsWith(route)
  )
}

/**
 * Get required role for a route
 */
export const getRequiredRole = (pathname: string): string | undefined => {
  for (const [route, config] of Object.entries(SECURITY_CONFIG.PROTECTED_ROUTES)) {
    if (pathname.startsWith(route)) {
      return config.requiredRole
    }
  }
  return undefined
}

/**
 * Check if a route is admin-only
 */
export const isAdminRoute = (pathname: string): boolean => {
  return SECURITY_CONFIG.ADMIN_ROUTES.some(route => 
    pathname.startsWith(route)
  )
}
