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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showLoginForm, setShowLoginForm] = useState(false)
  const [isIndianVisitor, setIsIndianVisitor] = useState(false)
  const [currency, setCurrency] = useState<'USD' | 'INR'>('USD')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0)

  // Carousel images for AI Image Enhancement
  const enhancementImages = [
    '/images/image_enhancement.png',
    '/images/4_image_enhancement.png',
    '/images/5_image_enhancement.png',
    '/images/6_image_enhancement.png',
    '/images/7_image_enhancement.png',
    '/images/8_image_enhancement.png',
    '/images/9_image_enhancement.png',
    '/images/10_image_enhancement.png',
    '/images/11_image_enhancement.png',
    '/images/12_image_enhancement.png',
    '/images/13_image_enhancement.png'
  ]

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % enhancementImages.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + enhancementImages.length) % enhancementImages.length)
  }

  const goToImage = (index: number) => {
    setCurrentImageIndex(index)
  }

  // Customer reviews data
  const customerReviews = [
    {
      name: "Anish Kumar",
      title: "CEO, Uma Traders",
      review: "Quely.ai has completely transformed our social media strategy. The AI-generated content is incredibly engaging and saves us hours every week. Our sales have increased by 40% since we started using it.",
      avatar: "A"
    },
    {
      name: "Sundar Ram",
      title: "MD, Sangam Electronics",
      review: "The AI analysis is spot-on. It understands our brand voice perfectly and generates hashtags that actually work. Our Instagram engagement has tripled in just 2 months.",
      avatar: "S"
    },
    {
      name: "Sathya",
      title: "MD, Amaya Boutique",
      review: "Scheduling content for 3 months in advance has been a game-changer. Our engagement has increased by 300% and we never worry about posting consistently anymore.",
      avatar: "S"
    },
    {
      name: "Pankaj Jain",
      title: "Owner, Mahaveer Fashions",
      review: "The image enhancement feature is incredible. Our product photos look professional now, and customers are more likely to buy when they see high-quality images. ROI has been amazing.",
      avatar: "P"
    },
    {
      name: "Thanveer",
      title: "Owner, M Zone Menswear",
      review: "Quely.ai made social media management so simple. We went from spending 10+ hours weekly to just 2 hours. The AI understands our fashion niche perfectly.",
      avatar: "T"
    },
    {
      name: "Umar Mukthar",
      title: "MD, Buttons Menswear",
      review: "The best investment we've made for our business. Our social media presence is now professional and consistent. The AI-generated captions are always on-brand and engaging.",
      avatar: "U"
    },
    {
      name: "Saranya",
      title: "MD, Zaara Fashions",
      review: "From basic product shots to stunning professional images - Quely.ai transformed our entire visual marketing. Our conversion rate improved by 60% after using the enhancement feature.",
      avatar: "S"
    },
    {
      name: "Sarah Johnson",
      title: "Marketing Director, TechStart",
      review: "Quely.ai has completely transformed our social media strategy. The AI-generated content is incredibly engaging and saves us hours every week.",
      avatar: "S"
    },
    {
      name: "Mike Chen",
      title: "Founder, EcoFashion",
      review: "The AI analysis is spot-on. It understands our brand voice perfectly and generates hashtags that actually work.",
      avatar: "M"
    },
    {
      name: "Alex Rodriguez",
      title: "CEO, FitnessFlow",
      review: "Scheduling content for 3 months in advance has been a game-changer. Our engagement has increased by 300%.",
      avatar: "A"
    }
  ]

  const nextReview = () => {
    setCurrentReviewIndex((prev) => (prev + 1) % customerReviews.length)
  }

  const prevReview = () => {
    setCurrentReviewIndex((prev) => (prev - 1 + customerReviews.length) % customerReviews.length)
  }

  const goToReview = (index: number) => {
    setCurrentReviewIndex(index)
  }

  useEffect(() => {
    const checkAuth = async () => {
      if (!isSupabaseConfigured()) {
        return
      }

      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('business_name')
            .eq('user_id', user.id)
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

    // Detect Indian visitors
    const detectIndianVisitor = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        
        if (data.country_code === 'IN') {
          setIsIndianVisitor(true);
          setCurrency('INR');
        } else {
          setIsIndianVisitor(false);
          setCurrency('USD');
        }
      } catch (error) {
        console.log('Could not detect location, defaulting to USD');
        setIsIndianVisitor(false);
        setCurrency('USD');
      }
    };

    detectIndianVisitor();
  }, [router])


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
              <div className="h-8 w-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-sm font-bold">Q</span>
              </div>
              <h1 className="ml-3 text-xl font-bold text-gray-900">
                Quely.ai
              </h1>
            </div>
            
            <div className="flex items-center space-x-3 sm:space-x-4">
              <Link href="/tutorial">
                <button className="text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm sm:text-base">
                  Tutorial
                </button>
              </Link>
              <Link href="/pricing">
                <button className="text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm sm:text-base">
                  Pricing
                </button>
              </Link>
              <Link href="/login">
                <button className="text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm sm:text-base">
                  Sign in
                </button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 shadow-lg text-sm">
                  Subscribe
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
              <section className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
          <div className="text-center max-w-4xl mx-auto">
            <div className="mb-6">
              <span className="inline-flex items-center px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                AI-Powered Social Media Management
              </span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
              Stop Spending Hours on
              <span className="text-indigo-600"> Social Media</span>
              <br />
              <span className="text-gray-900">Start Growing Your Business</span>
            </h1>
            
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8 leading-relaxed max-w-2xl mx-auto">
              Quely.ai transforms your business by automatically creating engaging social media content from your product images. Get back 10+ hours per week while your AI-powered posts drive more sales and followers. Focus on what matters - growing your business, not managing social media.
            </p>

            {/* Customer Benefits */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 sm:mb-8 max-w-2xl mx-auto">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-1">10+</div>
                <div className="text-xs sm:text-sm text-gray-600">Hours Back Per Week</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 mb-1">3x</div>
                <div className="text-xs sm:text-sm text-gray-600">More Sales & Followers</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 mb-1">0</div>
                <div className="text-xs sm:text-sm text-gray-600">Stress About Social Media</div>
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
                
                {error && (
                  <div className="text-red-600 text-xs sm:text-sm text-center mb-4">{error}</div>
                )}
                
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-4">
                      Choose your preferred sign-in method
                    </p>
                  </div>
                  
                  <Button
                    className="w-full h-10 sm:h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-sm sm:text-base rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
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

                  <div className="text-center">
                    <p className="text-xs text-gray-500">
                      🔒 Secure sign-in with your existing Google account
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-6 sm:mb-8">
              <Link href="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto text-sm sm:text-base lg:text-lg px-6 sm:px-8 py-3 sm:py-4 bg-indigo-600 hover:bg-indigo-700 shadow-lg h-12 sm:h-14">
                  Subscribe
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
                Auto-schedule content up to 1 month in advance. Our AI determines the best posting times for maximum engagement.
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
              Three powerful features that transform your business
            </p>
          </div>

          <div className="space-y-16">
            {/* 1. AI Caption & Hashtag Generation */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                {/* Image on the left */}
                <div className="order-2 lg:order-1">
                  <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200">
                    <img 
                      src="/images/post_generation.png" 
                      alt="AI Caption & Hashtag Generation - Product image analysis and content generation"
                      className="w-full h-auto rounded-lg"
                    />
                  </div>
                </div>
                
                {/* Text on the right */}
                <div className="order-1 lg:order-2">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center mr-4">
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">AI Caption & Hashtag Generation</h3>
                  </div>
                  
                  <p className="text-gray-600 leading-relaxed text-lg mb-6">
                    Upload your product images and our AI instantly analyzes them to understand your brand, products, and target audience. It then generates compelling captions and relevant hashtags that drive engagement and sales.
                  </p>
                  
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="h-5 w-5 mr-3" />
                    <span className="font-medium">Perfect for your business niche</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Smart Scheduling */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                {/* Image on the left */}
                <div className="order-2 lg:order-1">
                  <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200">
                    <img 
                      src="/images/schedule_post.png" 
                      alt="Smart Scheduling - AI-powered content scheduling and optimal posting times"
                      className="w-full h-auto rounded-lg"
                    />
                  </div>
                </div>
                
                {/* Text on the right */}
                <div className="order-1 lg:order-2">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center mr-4">
                      <Calendar className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">Smart Scheduling</h3>
                  </div>
                  
                  <p className="text-gray-600 leading-relaxed text-lg mb-6">
                    Never worry about when to post again. Our AI determines the best posting times for maximum engagement and automatically schedules your content up to 1 month in advance across Facebook and Instagram.
                  </p>
                  
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="h-5 w-5 mr-3" />
                    <span className="font-medium">Maximum engagement guaranteed</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Image Enhancement */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                {/* Image carousel on the left */}
                <div className="order-2 lg:order-1">
                  <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200">
                    <div className="relative">
                      {/* Main Image */}
                      <img 
                        src={enhancementImages[currentImageIndex]} 
                        alt="AI Image Enhancement - Transform ordinary photos into professional-quality images"
                        className="w-full h-auto rounded-lg"
                      />
                      
                      {/* Navigation Arrows */}
                      <button
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-all"
                      >
                        <ArrowRight className="h-4 w-4 rotate-180" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-all"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </button>
                      
                      {/* Dots Indicator */}
                      <div className="flex justify-center mt-4 space-x-2">
                        {enhancementImages.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => goToImage(index)}
                            className={`w-2 h-2 rounded-full transition-all ${
                              index === currentImageIndex 
                                ? 'bg-orange-500' 
                                : 'bg-gray-300 hover:bg-gray-400'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Text on the right */}
                <div className="order-1 lg:order-2">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mr-4">
                      <span className="text-white text-4xl">✨</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">AI Image Enhancement</h3>
                  </div>
                  
                  <p className="text-gray-600 leading-relaxed text-lg mb-6">
                    Transform ordinary product photos into stunning, professional-quality images. Our AI enhances lighting, colors, and composition to make your products irresistible to customers.
                  </p>
                  
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="h-5 w-5 mr-3" />
                    <span className="font-medium">Professional results instantly</span>
                  </div>
                </div>
              </div>
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

          <div className="flex flex-wrap justify-center gap-6 max-w-full mx-auto">
            {/* Free Plan */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-lg hover:shadow-xl transition-shadow w-56 flex-shrink-0">
              <div className="text-center mb-6">
                <h3 className="text-base font-bold text-gray-900 mb-2">🆓 Free</h3>
                <div className="text-2xl font-bold text-gray-900 mb-2">{currency === 'INR' ? '₹0' : '$0'}</div>
                <div className="text-sm text-gray-600">per month</div>
              </div>
              
              <ul className="space-y-2 mb-6">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">15 post generations</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">3 AI enhancements (cannot be downloaded)</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">50 images stored</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Unlimited posting</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Unlimited Meta accounts</span>
                </li>
              </ul>
              
              <Link href="/signup" className="block">
                <Button className="w-full h-9 bg-gray-100 text-gray-900 hover:bg-gray-200 text-sm">
                  Get Started Free
                </Button>
              </Link>
            </div>

            {/* Starter Plan */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-lg hover:shadow-xl transition-shadow w-56 flex-shrink-0">
              <div className="text-center mb-6">
                <h3 className="text-base font-bold text-gray-900 mb-2">Starter</h3>
                <div className="text-2xl font-bold text-gray-900 mb-2">{currency === 'INR' ? '₹999' : '$29'}</div>
                <div className="text-sm text-gray-600">per month</div>
              </div>
              
              <ul className="space-y-2 mb-6">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">100 post generations</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">30 AI enhancements (downloadable)</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Unlimited image/video stored</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Unlimited posting</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Unlimited Meta accounts</span>
                </li>
              </ul>
              
              <Link href="/pricing" className="block">
                <Button className="w-full h-9 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-sm">
                  Subscribe
                </Button>
              </Link>
            </div>

            {/* Growth Plan - Most Popular */}
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg p-6 shadow-xl relative w-56 flex-shrink-0">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                  Most Popular
                </span>
              </div>
              
              <div className="text-center mb-6 pt-2">
                <h3 className="text-base font-bold text-white mb-2">Growth</h3>
                <div className="text-2xl font-bold text-white mb-2">{currency === 'INR' ? '₹2,499' : '$79'}</div>
                <div className="text-sm text-indigo-100">per month</div>
              </div>
              
              <ul className="space-y-2 mb-6">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-white mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-white">300 post generations</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-white mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-white">100 AI enhancements (downloadable)</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-white mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-white">Unlimited image/video stored</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-white mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-white">Unlimited posting</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-white mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-white">Unlimited Meta accounts</span>
                </li>
              </ul>
              
              <Link href="/pricing" className="block">
                <Button className="w-full h-9 bg-white text-indigo-600 hover:bg-gray-50 text-sm">
                  Subscribe
                </Button>
              </Link>
            </div>

            {/* Scale Plan */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-lg hover:shadow-xl transition-shadow w-56 flex-shrink-0">
              <div className="text-center mb-6">
                <h3 className="text-base font-bold text-gray-900 mb-2">Scale</h3>
                <div className="text-2xl font-bold text-gray-900 mb-2">{currency === 'INR' ? '₹8,999' : '$199'}</div>
                <div className="text-sm text-gray-600">per month</div>
              </div>
              
              <ul className="space-y-2 mb-6">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">1000 post generations</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">500 AI enhancements (downloadable)</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Unlimited image/video stored</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Unlimited posting</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Unlimited Meta accounts</span>
                </li>
              </ul>
              
              <Link href="/pricing" className="block">
                <Button className="w-full h-9 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-sm">
                  Subscribe
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

          {/* Slidable Reviews Carousel */}
          <div className="relative max-w-6xl mx-auto">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {/* Review Card 1 */}
              <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 fill-current" />
                  ))}
                </div>
                <p className="text-sm sm:text-base text-gray-700 mb-6">
                  "{customerReviews[currentReviewIndex].review}"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold mr-3 sm:mr-4 text-sm sm:text-base">
                    {customerReviews[currentReviewIndex].avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">{customerReviews[currentReviewIndex].name}</p>
                    <p className="text-gray-600 text-xs sm:text-sm">{customerReviews[currentReviewIndex].title}</p>
                  </div>
                </div>
              </div>

              {/* Review Card 2 */}
              <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 fill-current" />
                  ))}
                </div>
                <p className="text-sm sm:text-base text-gray-700 mb-6">
                  "{customerReviews[(currentReviewIndex + 1) % customerReviews.length].review}"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold mr-3 sm:mr-4 text-sm sm:text-base">
                    {customerReviews[(currentReviewIndex + 1) % customerReviews.length].avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">{customerReviews[(currentReviewIndex + 1) % customerReviews.length].name}</p>
                    <p className="text-gray-600 text-xs sm:text-sm">{customerReviews[(currentReviewIndex + 1) % customerReviews.length].title}</p>
                  </div>
                </div>
              </div>

              {/* Review Card 3 */}
              <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow sm:col-span-2 lg:col-span-1">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 fill-current" />
                  ))}
                </div>
                <p className="text-sm sm:text-base text-gray-700 mb-6">
                  "{customerReviews[(currentReviewIndex + 2) % customerReviews.length].review}"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-600 rounded-full flex items-center justify-center text-white font-bold mr-3 sm:mr-4 text-sm sm:text-base">
                    {customerReviews[(currentReviewIndex + 2) % customerReviews.length].avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">{customerReviews[(currentReviewIndex + 2) % customerReviews.length].name}</p>
                    <p className="text-gray-600 text-xs sm:text-sm">{customerReviews[(currentReviewIndex + 2) % customerReviews.length].title}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Navigation Arrows */}
            <button
              onClick={prevReview}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 rounded-full p-3 shadow-lg transition-all"
            >
              <ArrowRight className="h-5 w-5 rotate-180" />
            </button>
            <button
              onClick={nextReview}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 rounded-full p-3 shadow-lg transition-all"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
            
            {/* Dots Indicator */}
            <div className="flex justify-center mt-8 space-x-2">
              {customerReviews.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToReview(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentReviewIndex 
                      ? 'bg-indigo-500' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
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
                Get Started
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-2" />
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full sm:w-auto text-sm sm:text-base lg:text-lg px-6 sm:px-8 py-3 sm:py-4 h-12 sm:h-14 border-2 border-white text-white hover:bg-white hover:text-indigo-600 bg-transparent"
              >
                Sign In
              </Button>
            </Link>
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
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base">Support</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-400">
                <li><Link href="/tutorial" className="hover:text-white transition-colors">Tutorial</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/status" className="hover:text-white transition-colors">Status</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base">Legal</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-400">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
                <li><Link href="/pricing-policy" className="hover:text-white transition-colors">Pricing Policy</Link></li>
                <li><Link href="/shipping-policy" className="hover:text-white transition-colors">Shipping Policy</Link></li>
                <li><Link href="/refund-policy" className="hover:text-white transition-colors">Cancellation & Refund</Link></li>
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
