'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { 
  Sparkles, 
  Calendar, 
  Image, 
  Video, 
  Instagram, 
  Facebook, 
  BarChart3, 
  Zap,
  Clock,
  Users,
  CheckCircle,
  ArrowRight,
  Play,
  Star,
  Upload
} from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showLoginForm, setShowLoginForm] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      if (!isSupabaseConfigured()) {
        return
      }

      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
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

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('business_name')
          .eq('id', data.user.id)
          .single()

        if (profile?.business_name) {
          router.push('/dashboard')
        } else {
          router.push('/onboarding')
        }
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error
    } catch (error: any) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-sm font-bold">Q</span>
              </div>
              <h1 className="ml-3 text-xl font-bold text-gray-900">
                Quely.ai
              </h1>
            </div>
            
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button
                onClick={() => setShowLoginForm(!showLoginForm)}
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm sm:text-base"
              >
                Sign in
              </button>
              <Link href="/signup">
                <Button size="sm" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg text-sm">
                  Start Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
          <div className="text-center max-w-4xl mx-auto">
            <div className="mb-6">
              <span className="inline-flex items-center px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                AI-Powered Social Media Management
              </span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
              Transform Your
              <span className="text-indigo-600"> Social Media</span>
              <br />
              <span className="text-gray-900">with AI</span>
            </h1>
            
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8 leading-relaxed max-w-2xl mx-auto">
              Upload your product images and videos. Our AI analyzes them perfectly, generates engaging captions and hashtags tailored to your business niche, then posts or schedules them on Facebook and Instagram.
            </p>

            {/* Customer Benefits */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 sm:mb-8 max-w-2xl mx-auto">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-1">10x</div>
                <div className="text-xs sm:text-sm text-gray-600">Faster Content Creation</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 mb-1">80%</div>
                <div className="text-xs sm:text-sm text-gray-600">Time Saved Weekly</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 mb-1">3x</div>
                <div className="text-xs sm:text-sm text-gray-600">More Engagement</div>
              </div>
            </div>

            {!isSupabaseConfigured() && (
              <div className="mb-6 sm:mb-8 p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-center max-w-2xl mx-auto">
                <p className="text-yellow-800 text-xs sm:text-sm">
                  ⚠️ Supabase not configured. Please set up your environment variables to enable authentication.
                </p>
              </div>
            )}
            
            {/* Quick Login Form */}
            {showLoginForm && (
              <div className="max-w-md mx-auto mb-6 sm:mb-8 p-4 sm:p-6 bg-white rounded-2xl shadow-xl border border-gray-100">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Quick Sign In</h3>
                
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <Input
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                  <Input
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                  
                  <div className="text-right">
                    <Link 
                      href="/forgot-password" 
                      className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-500 transition-colors"
                    >
                      Forgot your password?
                    </Link>
                  </div>
                  
                  {error && (
                    <div className="text-red-600 text-xs sm:text-sm text-center">{error}</div>
                  )}
                  
                  <Button
                    type="submit"
                    className="w-full h-10 sm:h-12 bg-indigo-600 hover:bg-indigo-700 text-sm sm:text-base"
                    loading={loading}
                    disabled={!email || !password}
                  >
                    Sign in to Quely.ai
                  </Button>
                </form>
                
                <div className="mt-4">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-xs sm:text-sm">
                      <span className="px-2 bg-white text-gray-500">Or</span>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    className="w-full mt-4 h-10 sm:h-12 text-sm sm:text-base"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" viewBox="0 0 24 24">
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
                </div>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-6 sm:mb-8">
              <Link href="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto text-sm sm:text-base lg:text-lg px-6 sm:px-8 py-3 sm:py-4 bg-indigo-600 hover:bg-indigo-700 shadow-lg h-12 sm:h-14">
                  Start Free Trial
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-2" />
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full sm:w-auto text-sm sm:text-base lg:text-lg px-6 sm:px-8 py-3 sm:py-4 h-12 sm:h-14"
                onClick={() => setShowLoginForm(!showLoginForm)}
              >
                {showLoginForm ? 'Hide Login' : 'Quick Sign In'}
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 lg:space-x-6 text-xs sm:text-sm text-gray-500">
              <div className="flex items-center">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-1 sm:mr-2" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-1 sm:mr-2" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-1 sm:mr-2" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Everything you need to dominate social media
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
              From AI-powered content generation to smart scheduling, we've got you covered
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* AI Analysis */}
            <div className="bg-indigo-50 rounded-xl sm:rounded-2xl p-6 sm:p-8 border border-indigo-100 hover:shadow-lg transition-shadow">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center mb-4 sm:mb-6">
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
                AI-Powered Analysis
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Upload your product images and videos. Our AI analyzes them perfectly to understand your content and generate engaging captions and hashtags tailored to your business niche.
              </p>
            </div>

            {/* Multi-Format Support */}
            <div className="bg-green-50 rounded-xl sm:rounded-2xl p-6 sm:p-8 border border-green-100 hover:shadow-lg transition-shadow">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-600 rounded-lg sm:rounded-xl flex items-center justify-center mb-4 sm:mb-6">
                <Image className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
                Multi-Format Support
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Support for images, reels, and carousels. Create stunning visual content that engages your audience across all platforms.
              </p>
            </div>

            {/* Smart Scheduling */}
            <div className="bg-blue-50 rounded-xl sm:rounded-2xl p-6 sm:p-8 border border-blue-100 hover:shadow-lg transition-shadow">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center mb-4 sm:mb-6">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
                Smart Scheduling
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Auto-schedule content up to 3 months in advance. Our AI determines the best posting times for maximum engagement.
              </p>
            </div>

            {/* Platform Integration */}
            <div className="bg-pink-50 rounded-xl sm:rounded-2xl p-6 sm:p-8 border border-pink-100 hover:shadow-lg transition-shadow">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-600 rounded-lg sm:rounded-xl flex items-center justify-center mb-4 sm:mb-6">
                <Instagram className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
                Platform Integration
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Seamlessly post to Facebook and Instagram. Direct integration means your content goes live instantly.
              </p>
            </div>

            {/* Media Library */}
            <div className="bg-orange-50 rounded-xl sm:rounded-2xl p-6 sm:p-8 border border-orange-100 hover:shadow-lg transition-shadow">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-600 rounded-lg sm:rounded-xl flex items-center justify-center mb-4 sm:mb-6">
                <Video className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
                Media Library
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Organize and manage all your visual content in one place. Easy access to your entire media collection.
              </p>
            </div>

            {/* Visual Calendar */}
            <div className="bg-purple-50 rounded-xl sm:rounded-2xl p-6 sm:p-8 border border-purple-100 hover:shadow-lg transition-shadow">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center mb-4 sm:mb-6">
                <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
                Visual Content Calendar
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Plan your content strategy with our intuitive visual calendar. See your entire content pipeline at a glance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              How Quely.ai Works
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
              Three simple steps to transform your social media presence
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Upload Your Content</h3>
              <p className="text-sm sm:text-base text-gray-600 max-w-sm mx-auto">
                Upload your product images or videos to our AI-powered platform. Our system analyzes your content to understand your brand and niche.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">AI Generates Content</h3>
              <p className="text-sm sm:text-base text-gray-600 max-w-sm mx-auto">
                Our AI creates engaging captions and hashtags tailored to your business niche, ensuring maximum reach and engagement.
              </p>
            </div>

            <div className="text-center sm:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Schedule & Publish</h3>
              <p className="text-sm sm:text-base text-gray-600 max-w-sm mx-auto">
                Schedule your content for optimal posting times or publish immediately to Facebook and Instagram with one click.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the plan that fits your business needs. All plans include our core AI features.
            </p>
                </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
            {/* Starter Plan */}
            <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-center mb-6 sm:mb-8">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Starter</h3>
                <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">$29</div>
                <div className="text-sm sm:text-base text-gray-600">per month</div>
              </div>
              
              <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm sm:text-base text-gray-700">50 AI content generations</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm sm:text-base text-gray-700">Instagram & Facebook posting</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm sm:text-base text-gray-700">Media library (5GB)</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm sm:text-base text-gray-700">Basic analytics</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm sm:text-base text-gray-700">Email support</span>
                </li>
              </ul>
              
              <Link href="/signup" className="block">
                <Button className="w-full h-10 sm:h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-sm sm:text-base">
                  Start Free Trial
                </Button>
              </Link>
            </div>

            {/* Professional Plan */}
            <div className="bg-indigo-600 rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-xl relative">
              <div className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-semibold">
                  Most Popular
                </span>
                </div>
              
              <div className="text-center mb-6 sm:mb-8">
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Professional</h3>
                <div className="text-3xl sm:text-4xl font-bold text-white mb-2">$79</div>
                <div className="text-sm sm:text-base text-indigo-100">per month</div>
              </div>
              
              <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm sm:text-base text-white">200 AI content generations</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm sm:text-base text-white">Instagram & Facebook posting</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm sm:text-base text-white">Media library (25GB)</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm sm:text-base text-white">Advanced analytics</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm sm:text-base text-white">Priority support</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm sm:text-base text-white">3-month auto-scheduling</span>
                </li>
              </ul>
              
              <Link href="/signup" className="block">
                <Button className="w-full h-10 sm:h-12 bg-white text-indigo-600 hover:bg-gray-50 text-sm sm:text-base">
                  Start Free Trial
                </Button>
              </Link>
                </div>

            {/* Enterprise Plan */}
            <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow sm:col-span-2 lg:col-span-1">
              <div className="text-center mb-6 sm:mb-8">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Enterprise</h3>
                <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">$199</div>
                <div className="text-sm sm:text-base text-gray-600">per month</div>
              </div>
              
              <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm sm:text-base text-gray-700">Unlimited AI generations</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm sm:text-base text-gray-700">All social platforms</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm sm:text-base text-gray-700">Unlimited media storage</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm sm:text-base text-gray-700">Custom analytics</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm sm:text-base text-gray-700">Dedicated support</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm sm:text-base text-gray-700">Team collaboration</span>
                </li>
              </ul>
              
              <Link href="/signup" className="block">
                <Button className="w-full h-10 sm:h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-sm sm:text-base">
                  Start Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Trusted by businesses worldwide
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of businesses that have transformed their social media presence with Quely.ai
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 fill-current" />
                ))}
              </div>
              <p className="text-sm sm:text-base text-gray-700 mb-6">
                "Quely.ai has completely transformed our social media strategy. The AI-generated content is incredibly engaging and saves us hours every week."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold mr-3 sm:mr-4 text-sm sm:text-base">
                  S
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm sm:text-base">Sarah Johnson</p>
                  <p className="text-gray-600 text-xs sm:text-sm">Marketing Director, TechStart</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 fill-current" />
                ))}
              </div>
              <p className="text-sm sm:text-base text-gray-700 mb-6">
                "The AI analysis is spot-on. It understands our brand voice perfectly and generates hashtags that actually work."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold mr-3 sm:mr-4 text-sm sm:text-base">
                  M
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm sm:text-base">Mike Chen</p>
                  <p className="text-gray-600 text-xs sm:text-sm">Founder, EcoFashion</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow sm:col-span-2 lg:col-span-1">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 fill-current" />
                ))}
              </div>
              <p className="text-sm sm:text-base text-gray-700 mb-6">
                "Scheduling content for 3 months in advance has been a game-changer. Our engagement has increased by 300%."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-600 rounded-full flex items-center justify-center text-white font-bold mr-3 sm:mr-4 text-sm sm:text-base">
                  A
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm sm:text-base">Alex Rodriguez</p>
                  <p className="text-gray-600 text-xs sm:text-sm">CEO, FitnessFlow</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-indigo-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6">
            Ready to transform your social media?
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-indigo-100 mb-6 sm:mb-8 max-w-2xl mx-auto">
            Join thousands of businesses using AI to create engaging content and grow their social media presence.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link href="/signup" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto text-sm sm:text-base lg:text-lg px-6 sm:px-8 py-3 sm:py-4 bg-white text-indigo-600 hover:bg-gray-50 h-12 sm:h-14">
                Start Free Trial
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-2" />
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full sm:w-auto text-sm sm:text-base lg:text-lg px-6 sm:px-8 py-3 sm:py-4 h-12 sm:h-14 border-white text-white hover:bg-white hover:text-indigo-600"
              onClick={() => setShowLoginForm(!showLoginForm)}
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center mb-4">
                <div className="h-8 w-8 bg-indigo-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-sm font-bold">Q</span>
                </div>
                <h3 className="ml-3 text-lg sm:text-xl font-bold">Quely.ai</h3>
              </div>
              <p className="text-gray-400 text-xs sm:text-sm">
                AI-powered social media management platform that helps you create, schedule, and manage your content with intelligent automation.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base">Product</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-400">
                <li><Link href="/features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/integrations" className="hover:text-white transition-colors">Integrations</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base">Support</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-400">
                <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link href="/status" className="hover:text-white transition-colors">Status</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base">Legal</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-400">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-gray-400">
            <p className="text-xs sm:text-sm">&copy; 2024 Quely.ai. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
