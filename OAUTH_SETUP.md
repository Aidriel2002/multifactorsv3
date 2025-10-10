# Google OAuth Setup Guide

## Overview
This guide will help you set up Google OAuth for localhost, port forwarding, and production deployment.

## 1. Google Cloud Console Setup

### Step 1: Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API and Google OAuth2 API

### Step 2: Configure OAuth Consent Screen
1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in the required information:
   - App name: "Multifactors Sales"
   - User support email: your email
   - Developer contact: your email
4. Add scopes: `email`, `profile`, `openid`
5. Add test users (for development)

### Step 3: Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Add authorized redirect URIs:

#### For Localhost Development:
```
http://localhost:3000/auth/oauth/callback
http://127.0.0.1:3000/auth/oauth/callback
```

#### For Port Forwarding (ngrok, etc.):
```
https://your-ngrok-url.ngrok.io/auth/oauth/callback
```

#### For Production:
```
https://yourdomain.com/auth/oauth/callback
```

## 2. Supabase Configuration

### Step 1: Configure OAuth Provider
1. Go to your Supabase dashboard
2. Navigate to "Authentication" > "Providers"
3. Enable Google provider
4. Add your Google OAuth credentials:
   - Client ID: from Google Cloud Console
   - Client Secret: from Google Cloud Console

### Step 2: Configure Site URL
In Supabase dashboard > Authentication > URL Configuration:
- Site URL: `http://localhost:3000` (for development)
- Redirect URLs: Add all your callback URLs

## 3. Environment Variables

Create a `.env.local` file in your project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google OAuth (if needed for server-side)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## 4. Testing OAuth Flow

### Localhost Testing
1. Start your development server: `npm run dev`
2. Navigate to `http://localhost:3000`
3. Click "Login with Google"
4. Complete the OAuth flow
5. Verify you're redirected to the dashboard

### Port Forwarding Testing
1. Use ngrok or similar service:
   ```bash
   ngrok http 3000
   ```
2. Update Google OAuth redirect URIs with the ngrok URL
3. Update Supabase redirect URLs
4. Test the OAuth flow

## 5. Common Issues and Solutions

### Issue: "redirect_uri_mismatch"
**Solution**: Ensure the redirect URI in Google Console exactly matches your callback URL

### Issue: "access_denied"
**Solution**: Check OAuth consent screen configuration and test users

### Issue: "invalid_client"
**Solution**: Verify Google OAuth credentials in Supabase

### Issue: Authentication succeeds but can't access dashboard
**Solution**: Check the AuthGuard component and ensure profile creation

## 6. Debugging OAuth

### Enable Debug Logging
The OAuth configuration includes debug logging. Check browser console for:
- OAuth configuration details
- Redirect URL information
- Authentication flow status

### Common Debug Steps
1. Check browser console for OAuth errors
2. Verify redirect URLs match exactly
3. Check Supabase logs for authentication errors
4. Ensure profile is created successfully

## 7. Production Deployment

### Update OAuth Settings
1. Update Google OAuth redirect URIs with production domain
2. Update Supabase site URL and redirect URLs
3. Update environment variables
4. Test OAuth flow in production

### Security Considerations
1. Use HTTPS in production
2. Set up proper CORS policies
3. Monitor OAuth usage and errors
4. Implement rate limiting if needed

## 8. Troubleshooting Checklist

- [ ] Google OAuth credentials are correct
- [ ] Redirect URIs match exactly
- [ ] Supabase OAuth provider is enabled
- [ ] Site URL is configured correctly
- [ ] Test users are added (for development)
- [ ] OAuth consent screen is configured
- [ ] Profile creation is working
- [ ] AuthGuard is not blocking OAuth users

## 9. Support

If you encounter issues:
1. Check browser console for errors
2. Check Supabase logs
3. Verify OAuth configuration
4. Test with a fresh browser session
5. Clear browser cache and cookies
