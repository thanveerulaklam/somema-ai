import { getServerSupabase } from '../../../lib/supabase'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// Auth callback route using new @supabase/ssr helpers
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription)
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent(errorDescription || 'Authentication failed')}`
    )
  }

  if (!code) {
    // If no code is present, redirect to home
    return NextResponse.redirect(`${requestUrl.origin}/login?error=${encodeURIComponent('No authorization code received')}`)
  }

  try {
    const supabase = await getServerSupabase(cookies)
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('Code exchange error:', exchangeError)
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=${encodeURIComponent('Failed to complete authentication')}`
      )
    }

    if (data.user) {
      // Check if user has completed onboarding
      try {
        const { data: profile } = await supabase
          .from('users')
          .select('business_name')
          .eq('id', data.user.id)
          .single()

        if (profile?.business_name) {
          // User has completed onboarding, redirect to dashboard
          return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
        } else {
          // User needs to complete onboarding
          return NextResponse.redirect(`${requestUrl.origin}/onboarding`)
        }
      } catch (profileError) {
        console.error('Profile check error:', profileError)
        // If profile check fails, redirect to onboarding
        return NextResponse.redirect(`${requestUrl.origin}/onboarding`)
      }
    } else {
      // No user data, redirect to login
      return NextResponse.redirect(`${requestUrl.origin}/login?error=${encodeURIComponent('Authentication failed')}`)
    }
  } catch (error) {
    console.error('Auth callback error:', error)
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent('Authentication failed. Please try again.')}`
    )
  }
} 