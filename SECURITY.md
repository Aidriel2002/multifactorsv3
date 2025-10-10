# Security Implementation Guide

## Overview
This document outlines the comprehensive security measures implemented in the Multifactors application to ensure that the system is not accessible without a valid user account.

## Security Features Implemented

### 1. Authentication Guard System
- **Location**: `app/components/AuthGuard.tsx`
- **Purpose**: Provides client-side authentication protection for all protected routes
- **Features**:
  - Checks for active user session
  - Validates email confirmation status
  - Verifies account approval status
  - Enforces role-based access control
  - Handles authentication errors gracefully

### 2. Middleware Protection
- **Location**: `middleware.ts`
- **Purpose**: Server-side route protection at the Next.js level
- **Features**:
  - Intercepts all requests to protected routes
  - Validates session tokens
  - Checks user profile and approval status
  - Enforces role-based access
  - Redirects unauthenticated users to login

### 3. Layout-Level Security
All application layouts now include authentication protection:

#### Multifactors Layout (`app/multifactors/layout.tsx`)
- Protected with `AuthGuard` component
- Admin routes require 'admin' role
- All other routes require basic authentication

#### Ruijie Layout (`app/ruijie/layout.tsx`)
- Protected with `AuthGuard` component
- Requires basic authentication for all routes

#### Tuya Layout (`app/tuya/layout.tsx`)
- Protected with `AuthGuard` component
- Requires basic authentication for all routes

### 4. Authentication Utilities
- **Location**: `app/utils/auth-guard.ts`
- **Purpose**: Centralized authentication logic and utilities
- **Features**:
  - `checkAuthentication()` - Comprehensive auth validation
  - `useAuthGuard()` - React hook for auth state
  - `serverAuthCheck()` - Server-side auth validation
  - `redirectIfNotAuthenticated()` - Automatic redirect logic

### 5. Security Configuration
- **Location**: `app/utils/security-config.ts`
- **Purpose**: Centralized security configuration
- **Features**:
  - Public route definitions
  - Protected route definitions
  - Role requirements mapping
  - Error message definitions

## Authentication Flow

### 1. User Access Attempt
1. User navigates to any protected route
2. Middleware intercepts the request
3. Checks for valid session token
4. Validates user profile and status
5. Enforces role-based access

### 2. Authentication Checks
The system performs the following checks in order:

1. **Session Validation**
   - Checks for active Supabase session
   - Validates session token

2. **Email Confirmation**
   - Ensures user email is confirmed
   - Redirects to login with error if not confirmed

3. **Profile Validation**
   - Checks if user profile exists
   - Validates profile data integrity

4. **Account Approval**
   - Verifies account status is 'approved'
   - Handles 'pending' and 'rejected' states

5. **Role Authorization**
   - Checks required role for the route
   - Enforces admin-only access where needed

### 3. Redirect Behavior
The system automatically redirects unauthenticated users to the home page:

- **No Session**: Redirects to home page ("/")
- **Email Not Confirmed**: Redirects to home page ("/")
- **Account Pending**: Redirects to home page ("/")
- **Account Rejected**: Redirects to home page ("/")
- **Access Denied**: Redirects to home page ("/")
- **Authentication Error**: Redirects to home page ("/")

## Protected Routes

### Public Routes (No Authentication Required)
- `/` - Landing page
- `/auth/login` - Login page
- `/auth/registration` - Registration page
- `/auth/oauth/callback` - OAuth callback
- `/api/sendEmail` - Email API endpoint

### Protected Routes (Authentication Required)
- All `/multifactors/*` routes
- All `/ruijie/*` routes  
- All `/tuya/*` routes

### Admin-Only Routes
- `/multifactors/account-approval` - Requires 'admin' role

## Security Best Practices Implemented

### 1. Defense in Depth
- Multiple layers of security (middleware + client-side guards)
- Server-side and client-side validation
- Role-based access control at multiple levels

### 2. Session Management
- Automatic session validation
- Session timeout handling
- Secure token management

### 3. Error Handling
- Graceful error handling for all auth failures
- User-friendly error messages
- Secure error logging

### 4. Route Protection
- All application routes are protected by default
- Public routes explicitly defined
- Admin routes have additional role checks

## Testing Security Implementation

### 1. Test Unauthenticated Access
1. Open browser in incognito mode
2. Navigate to any protected route (e.g., `/multifactors/dashboard`)
3. Verify redirect to home page ("/")

### 2. Test Role-Based Access
1. Login with non-admin user
2. Navigate to `/multifactors/account-approval`
3. Verify redirect to home page ("/")

### 3. Test Session Expiry
1. Login to the application
2. Wait for session to expire or manually clear cookies
3. Navigate to protected route
4. Verify redirect to home page ("/")

### 4. Test Account Status
1. Create account with pending status
2. Try to access protected routes
3. Verify redirect to home page ("/")

## Security Monitoring

### 1. Authentication Logs
- All authentication attempts are logged
- Failed authentication attempts are tracked
- Session management events are recorded

### 2. Access Control Logs
- Role-based access attempts are logged
- Admin route access is monitored
- Unauthorized access attempts are tracked

## Maintenance and Updates

### 1. Adding New Protected Routes
1. Add route to `SECURITY_CONFIG.PROTECTED_ROUTES`
2. Specify required role if needed
3. Test authentication flow

### 2. Modifying Role Requirements
1. Update `SECURITY_CONFIG.PROTECTED_ROUTES`
2. Update middleware and AuthGuard components
3. Test role-based access

### 3. Adding New Public Routes
1. Add route to `SECURITY_CONFIG.PUBLIC_ROUTES`
2. Update middleware configuration
3. Test public access

## Conclusion

The security implementation ensures that:
- No user can access the system without a valid account
- All routes are protected by default
- Role-based access is enforced
- Authentication errors are handled gracefully
- The system is secure against common attack vectors

All pages and files in the application are now protected with comprehensive authentication and authorization measures.
