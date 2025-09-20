'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { 
  ArrowLeft,
  Upload,
  Sparkles,
  Calendar,
  Instagram,
  Facebook,
  Image,
  Video,
  Play,
  CheckCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Users,
  Zap,
  BarChart3,
  Clock,
  Star,
  Settings,
  CreditCard,
  Shield,
  MessageCircle,
  FileText,
  Camera,
  Hash,
  Share2,
  Eye,
  Heart,
  MessageSquare
} from 'lucide-react'

export default function TutorialPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setIsLoggedIn(!!user)
    } catch (error) {
      console.log('Auth check failed:', error)
      setIsLoggedIn(false)
    } finally {
      setLoading(false)
    }
  }

  const handleBackClick = () => {
    if (isLoggedIn) {
      router.push('/settings')
    } else {
      router.push('/')
    }
  }

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const faqData = [
    {
      question: "How does Quely.ai work?",
      answer: "Quely.ai uses advanced AI to analyze your product images and videos, then generates engaging captions and hashtags tailored to your business niche. You can then post immediately or schedule content for optimal engagement times."
    },
    {
      question: "What file formats are supported?",
      answer: "We support all major image formats (JPG, PNG, HEIC, WebP) and video formats (MP4, MOV, AVI). For videos, we recommend MP4 format for best compatibility with social media platforms."
    },
    {
      question: "How many posts can I generate?",
      answer: "The number depends on your plan: Free (15 posts), Starter (100 posts), Growth (300 posts), and Scale (1000 posts) per month. Unused credits don't roll over to the next month."
    },
    {
      question: "Can I edit the AI-generated content?",
      answer: "Yes! All AI-generated captions and hashtags can be edited before posting. You have full control over your content and can customize it to match your brand voice."
    },
    {
      question: "How do I connect my social media accounts?",
      answer: "Go to Settings > Social Media Connections and click 'Connect Facebook'. This will discover your Facebook pages and connected Instagram accounts. You can then choose which accounts to connect for posting. Note: Your Instagram account must be a Business or Professional account and linked to your Facebook Page."
    },
    {
      question: "Why does my Instagram account need to be Business/Professional?",
      answer: "Instagram's API only allows third-party tools like Quely.ai to post to Business or Professional accounts. Personal accounts cannot be used for automated posting. To convert: Go to Instagram Settings > Account type and tools > Switch to professional account > Choose Business. Then link it to your Facebook Page in the same settings menu."
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely! We use enterprise-grade security with encrypted data storage and secure API connections. Your images and business information are protected and never shared with third parties."
    },
    {
      question: "Can I schedule posts in advance?",
      answer: "Yes! You can schedule posts up to 1 month in advance. Our AI analyzes the best posting times for maximum engagement based on your audience and industry."
    },
    {
      question: "What if I run out of credits?",
      answer: "You can purchase additional credits or upgrade your plan anytime. Credits are used for AI content generation and image enhancements. Regular posting doesn't consume credits."
    },
    {
      question: "Do you support carousel posts?",
      answer: "Yes! You can create carousel posts with multiple images. Upload multiple images and our AI will generate content that works perfectly for carousel format."
    },
    {
      question: "How accurate is the AI content generation?",
      answer: "Our AI is trained on millions of successful social media posts and continuously improves. It analyzes your specific images, business niche, and target audience to generate highly relevant and engaging content."
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer: "Yes, you can cancel your subscription at any time from your Settings page. You'll continue to have access to your plan features until the end of your billing period."
    },
    {
      question: "Do you offer customer support?",
      answer: "Yes! We provide email support for all users and priority support for paid plan subscribers. You can reach us through the contact form or email us directly."
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button variant="ghost" size="sm" onClick={handleBackClick}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to {isLoggedIn ? 'Settings' : 'Home'}
              </Button>
            </div>
            
            <div className="flex items-center">
              <div className="h-8 w-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-sm font-bold">Q</span>
              </div>
              <h1 className="ml-3 text-xl font-bold text-gray-900">
                Quely.ai Tutorial
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Introduction */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Welcome to Quely.ai
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Learn how to transform your social media presence with AI-powered content creation. 
            Follow our step-by-step guide to get started.
          </p>
        </div>

        {/* Quick Start Guide */}
        <div className="bg-white rounded-xl shadow-sm border mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Zap className="h-6 w-6 text-yellow-500 mr-3" />
              Quick Start Guide
            </h2>
            <p className="text-gray-600 mt-2">
              Get up and running in just 5 minutes
            </p>
          </div>
          
          <div className="p-6">
            <div className="grid gap-6">
              {/* Step 1 */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    1
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Create Your Account
                  </h3>
                  <p className="text-gray-600 mb-3">
                    Sign up for a free account or log in if you already have one.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {!isLoggedIn ? (
                      <>
                        <Link href="/signup">
                          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                            Sign Up Free
                          </Button>
                        </Link>
                        <Link href="/login">
                          <Button size="sm" variant="outline">
                            Sign In
                          </Button>
                        </Link>
                      </>
                    ) : (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        <span className="text-sm font-medium">Account Ready!</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    2
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Complete Your Profile
                  </h3>
                  <p className="text-gray-600 mb-3">
                    Fill in your business information to help AI generate better content.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <Settings className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-blue-900 mb-1">Required Information:</h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                          <li>• Business Name</li>
                          <li>• Industry/Niche</li>
                          <li>• City & Country</li>
                          <li>• Brand Tone (optional)</li>
                          <li>• Target Audience (optional)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  {isLoggedIn && (
                    <div className="mt-3">
                      <Link href="/settings">
                        <Button size="sm" variant="outline">
                          Complete Profile
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    3
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Connect Social Media
                  </h3>
                  <p className="text-gray-600 mb-3">
                    Connect your Facebook and Instagram accounts for seamless posting.
                  </p>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <Facebook className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-green-900 mb-1">What happens when you connect:</h4>
                        <ul className="text-sm text-green-800 space-y-1">
                          <li>• We discover your Facebook pages</li>
                          <li>• Find connected Instagram accounts</li>
                          <li>• You choose which accounts to use</li>
                          <li>• Secure, read-only access for posting</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                    <div className="flex items-start">
                      <Instagram className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-yellow-900 mb-1">Important Instagram Requirements:</h4>
                        <ul className="text-sm text-yellow-800 space-y-1">
                          <li>• Instagram account must be Business or Professional</li>
                          <li>• Must be linked to a Facebook Page</li>
                          <li>• Personal accounts cannot be used for posting</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  {isLoggedIn && (
                    <div className="mt-3">
                      <Link href="/settings">
                        <Button size="sm" variant="outline">
                          Connect Accounts
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    4
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Upload & Generate Content
                  </h3>
                  <p className="text-gray-600 mb-3">
                    Upload your product images or videos and let AI create engaging content.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <Upload className="h-4 w-4 text-purple-600 mr-2" />
                        <h4 className="text-sm font-medium text-purple-900">Upload Media</h4>
                      </div>
                      <p className="text-sm text-purple-800">
                        Drag & drop images or videos, or click to browse
                      </p>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <Sparkles className="h-4 w-4 text-purple-600 mr-2" />
                        <h4 className="text-sm font-medium text-purple-900">AI Analysis</h4>
                      </div>
                      <p className="text-sm text-purple-800">
                        AI analyzes your content and generates captions & hashtags
                      </p>
                    </div>
                  </div>
                  {isLoggedIn && (
                    <div className="mt-3">
                      <Link href="/dashboard">
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                          Start Creating
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    5
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Post or Schedule
                  </h3>
                  <p className="text-gray-600 mb-3">
                    Review the generated content, make any edits, then post immediately or schedule for later.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <Share2 className="h-4 w-4 text-orange-600 mr-2" />
                        <h4 className="text-sm font-medium text-orange-900">Post Now</h4>
                      </div>
                      <p className="text-sm text-orange-800">
                        Publish immediately to your connected accounts
                      </p>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <Calendar className="h-4 w-4 text-orange-600 mr-2" />
                        <h4 className="text-sm font-medium text-orange-900">Schedule</h4>
                      </div>
                      <p className="text-sm text-orange-800">
                        Schedule posts for optimal engagement times
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Account Setup Guide */}
        <div className="bg-white rounded-xl shadow-sm border mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Settings className="h-6 w-6 text-blue-500 mr-3" />
              Account Setup Guide
            </h2>
            <p className="text-gray-600 mt-2">
              Learn how to set up your Facebook and Instagram accounts for Quely.ai
            </p>
          </div>
          
          <div className="p-6">
            <div className="space-y-8">
              {/* Facebook Page Setup */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                    <Facebook className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Facebook Page Setup
                  </h3>
                  <p className="text-gray-600 mb-4">
                    You need a Facebook Page (not a personal profile) to use Quely.ai. 
                    If you don't have one, here's how to create it:
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-3">How to Create a Facebook Page:</h4>
                    <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                      <li>Go to <a href="https://facebook.com/pages/create" target="_blank" rel="noopener noreferrer" className="underline">facebook.com/pages/create</a></li>
                      <li>Choose "Business or Brand"</li>
                      <li>Enter your business name and category</li>
                      <li>Add your business information and profile picture</li>
                      <li>Click "Create Page"</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Instagram Business Account Setup */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <Instagram className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Instagram Business Account Setup
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Your Instagram account must be a Business or Professional account 
                    and linked to your Facebook Page. Here's how to set it up:
                  </p>
                  
                  <div className="space-y-4">
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <h4 className="font-medium text-purple-900 mb-3">Convert to Business Account:</h4>
                      <ol className="text-sm text-purple-800 space-y-2 list-decimal list-inside">
                        <li>Open Instagram app and go to your profile</li>
                        <li>Tap the menu (three lines) in the top right</li>
                        <li>Go to "Settings and privacy"</li>
                        <li>Tap "Account type and tools"</li>
                        <li>Select "Switch to professional account"</li>
                        <li>Choose "Business" and follow the prompts</li>
                      </ol>
                    </div>
                    
                    <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                      <h4 className="font-medium text-pink-900 mb-3">Link to Facebook Page:</h4>
                      <ol className="text-sm text-pink-800 space-y-2 list-decimal list-inside">
                        <li>In Instagram, go to "Settings and privacy"</li>
                        <li>Tap "Account type and tools"</li>
                        <li>Select "Page" under "Business settings"</li>
                        <li>Tap "Connect to Facebook Page"</li>
                        <li>Choose your Facebook Page from the list</li>
                        <li>Confirm the connection</li>
                      </ol>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                    <div className="flex items-start">
                      <Shield className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-yellow-900 mb-1">Why Business Account?</h4>
                        <ul className="text-sm text-yellow-800 space-y-1">
                          <li>• Required for third-party posting tools like Quely.ai</li>
                          <li>• Access to Instagram Insights and analytics</li>
                          <li>• Ability to run Instagram ads</li>
                          <li>• Contact information and business features</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Troubleshooting */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center">
                    <HelpCircle className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Troubleshooting Connection Issues
                  </h3>
                  <p className="text-gray-600 mb-4">
                    If you're having trouble connecting your accounts, try these solutions:
                  </p>
                  
                  <div className="space-y-3">
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <h4 className="font-medium text-orange-900 mb-2">Common Issues & Solutions:</h4>
                      <ul className="text-sm text-orange-800 space-y-2">
                        <li><strong>Instagram not showing up:</strong> Make sure it's a Business account linked to your Facebook Page</li>
                        <li><strong>Permission denied:</strong> Check that you're an admin of the Facebook Page</li>
                        <li><strong>Connection fails:</strong> Try disconnecting and reconnecting your accounts</li>
                        <li><strong>Page not found:</strong> Ensure your Facebook Page is published and not in draft mode</li>
                      </ul>
                    </div>
                    
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Need Help?</h4>
                      <p className="text-sm text-gray-700">
                        If you're still having issues, contact our support team. We're here to help you get connected!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Features */}
        <div className="bg-white rounded-xl shadow-sm border mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Star className="h-6 w-6 text-yellow-500 mr-3" />
              Key Features Explained
            </h2>
            <p className="text-gray-600 mt-2">
              Discover all the powerful features that make Quely.ai special
            </p>
          </div>
          
          <div className="p-6">
            <div className="grid gap-8">
              {/* AI Content Generation */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    AI-Powered Content Generation
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Our advanced AI analyzes your images and videos to understand your products, 
                    then generates engaging captions and relevant hashtags tailored to your business niche.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Smart Analysis</h4>
                      <p className="text-sm text-gray-600">
                        AI identifies products, colors, style, and context from your media
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Brand Voice</h4>
                      <p className="text-sm text-gray-600">
                        Content matches your specified tone and target audience
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Hashtag Research</h4>
                      <p className="text-sm text-gray-600">
                        Generates trending and niche-specific hashtags for maximum reach
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Multi-Format Support */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
                    <Image className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Multi-Format Support
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Create stunning content for all types of social media posts with support for 
                    images, videos, reels, and carousel posts.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <Image className="h-6 w-6 text-blue-600" />
                      </div>
                      <h4 className="font-medium text-gray-900 text-sm">Single Images</h4>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <Video className="h-6 w-6 text-purple-600" />
                      </div>
                      <h4 className="font-medium text-gray-900 text-sm">Videos & Reels</h4>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <Camera className="h-6 w-6 text-green-600" />
                      </div>
                      <h4 className="font-medium text-gray-900 text-sm">Carousel Posts</h4>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <Hash className="h-6 w-6 text-orange-600" />
                      </div>
                      <h4 className="font-medium text-gray-900 text-sm">Story Content</h4>
                    </div>
                  </div>
                </div>
              </div>

              {/* Smart Scheduling */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Smart Scheduling
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Schedule your content for optimal posting times. Our AI analyzes your audience 
                    and industry to determine the best times for maximum engagement.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <Clock className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-blue-900 mb-1">Optimal Timing Features:</h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                          <li>• AI-powered best time recommendations</li>
                          <li>• Schedule up to 1 month in advance</li>
                          <li>• Time zone aware scheduling</li>
                          <li>• Bulk scheduling for content batches</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Platform Integration */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center">
                    <Instagram className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Seamless Platform Integration
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Direct integration with Facebook and Instagram means your content goes live 
                    instantly without manual copying and pasting.
                  </p>
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center">
                      <Facebook className="h-8 w-8 text-blue-600 mr-2" />
                      <span className="font-medium text-gray-900">Facebook</span>
                    </div>
                    <div className="flex items-center">
                      <Instagram className="h-8 w-8 text-pink-600 mr-2" />
                      <span className="font-medium text-gray-900">Instagram</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <HelpCircle className="h-6 w-6 text-blue-500 mr-3" />
              Frequently Asked Questions
            </h2>
            <p className="text-gray-600 mt-2">
              Find answers to common questions about using Quely.ai
            </p>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {faqData.map((faq, index) => (
                <div key={index} className="border border-gray-200 rounded-lg">
                  <button
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                    onClick={() => toggleFAQ(index)}
                  >
                    <span className="font-medium text-gray-900">{faq.question}</span>
                    {expandedFAQ === index ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                  {expandedFAQ === index && (
                    <div className="px-6 pb-4">
                      <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-indigo-100 mb-6 max-w-2xl mx-auto">
              Join thousands of businesses using AI to create engaging content and grow their social media presence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!isLoggedIn ? (
                <>
                  <Link href="/signup">
                    <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-50">
                      Start Free Trial
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-indigo-600">
                      Sign In
                    </Button>
                  </Link>
                </>
              ) : (
                <Link href="/dashboard">
                  <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-50">
                    Go to Dashboard
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
