'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { Button } from '../components/ui/Button'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      // Only check auth if Supabase is properly configured
      if (!isSupabaseConfigured()) {
        return
      }

      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          // Check if user has completed onboarding
          const { data: profile } = await supabase
            .from('users')
            .select('business_name')
            .eq('id', user.id)
            .single()

          if (profile?.business_name) {
            router.push('/dashboard')
          } else {
            router.push('/onboarding')
          }
        }
      } catch (error) {
        console.log('Auth check failed:', error)
      }
    }
    checkAuth()
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">S</span>
              </div>
              <h1 className="ml-3 text-xl font-semibold text-gray-900">
                Somema.ai
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            AI-Powered Social Media
            <span className="text-blue-600"> Manager</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Automate your social media content creation and posting. Generate captions, 
            hashtags, and images for Instagram, Facebook, and Twitter with AI.
          </p>
          
          {!isSupabaseConfigured() && (
            <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                ⚠️ Supabase not configured. Please set up your environment variables to enable authentication.
              </p>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8 py-4">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                Sign In
              </Button>
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
            <div className="bg-white p-8 rounded-xl shadow-sm border">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-blue-600 text-xl">🤖</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                AI Content Generation
              </h3>
              <p className="text-gray-600">
                Generate engaging captions and hashtags tailored to your brand using GPT-4o, Claude, and Gemini.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-green-600 text-xl">📅</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Smart Scheduling
              </h3>
              <p className="text-gray-600">
                Plan and schedule your content with our intuitive calendar. Auto-post to multiple platforms.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-purple-600 text-xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Analytics & Insights
              </h3>
              <p className="text-gray-600">
                Track engagement, reach, and performance with detailed analytics and visual reports.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 Somema.ai. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
