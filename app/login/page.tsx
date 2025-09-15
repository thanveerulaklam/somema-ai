'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { useAnalyticsContext } from '../../components/analytics/AnalyticsProvider'

function LoginForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const analytics = useAnalyticsContext()

  // Check for error messages from OAuth callback
  useEffect(() => {
    const errorMessage = searchParams.get('error')
    const successMessage = searchParams.get('message')
    
    if (errorMessage) {
      if (errorMessage === 'session_expired') {
        setError('Your session has expired. Please sign in again.')
      } else {
        setError(decodeURIComponent(errorMessage))
      }
    }
    
    if (successMessage) {
      setMessage(decodeURIComponent(successMessage))
    }
  }, [searchParams])

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError('')
    setMessage('')
    
    // Track Google login attempt
    analytics.trackUserEngagement('Google Login Attempted')

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) throw error
    } catch (error: any) {
      setError(error.message)
      analytics.trackErrorOccurred('Google Login Error')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Hero section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-500 via-purple-600 to-blue-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 py-12">
          <div className="max-w-md">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-4">
                <span className="text-white text-2xl font-bold">Q</span>
              </div>
              <h1 className="text-white text-3xl font-bold">Quely.ai</h1>
            </div>
            
            <h2 className="text-white text-4xl font-bold mb-6 leading-tight">
              Transform your social media presence with AI-powered content creation
            </h2>
            
            <p className="text-white/90 text-lg mb-8 leading-relaxed">
              Create, schedule, and optimize your social media content with intelligent automation. 
              Save time and grow your audience with data-driven insights.
            </p>
            
            <div className="flex items-center space-x-6 text-white/80">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-white/60 rounded-full mr-3"></div>
                <span className="text-sm">AI Content Generation</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-white/60 rounded-full mr-3"></div>
                <span className="text-sm">Smart Scheduling</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-white/60 rounded-full mr-3"></div>
                <span className="text-sm">Analytics & Insights</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
        <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-white/10 rounded-full blur-lg"></div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center mr-3">
                <span className="text-white text-2xl font-bold">Q</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Quely.ai</h1>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome back
              </h2>
              <p className="text-gray-600">
                Sign in to your Quely.ai account to continue
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {message && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-800">{message}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-6">
                  Choose your preferred sign-in method
                </p>
              </div>

              <Button
                className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-base rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>

              <div className="text-center">
                <p className="text-xs text-gray-500">
                  🔒 Secure sign-in with your existing Google account
                </p>
              </div>
            </div>


            <div className="mt-8 text-center space-y-3">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link
                  href="/signup"
                  className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors"
                >
                  Create your free account
                </Link>
              </p>
              <p className="text-sm">
                <Link 
                  href="/forgot-password" 
                  className="text-gray-500 hover:text-gray-700 transition-colors font-medium"
                >
                  Forgot your password?
                </Link>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-400">
              By signing in, you agree to our{' '}
              <Link href="/terms" className="hover:text-gray-600 transition-colors">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="hover:text-gray-600 transition-colors">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-xl font-bold">Q</span>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading Quely.ai...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
} 