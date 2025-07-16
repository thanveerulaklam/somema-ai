'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { 
  BarChart3,
  TrendingUp,
  Users,
  Eye,
  Heart,
  MessageCircle,
  Share,
  ArrowLeft,
  Calendar,
  Instagram,
  Facebook,
  Twitter,
  Download
} from 'lucide-react'

interface AnalyticsData {
  totalPosts: number
  totalEngagement: number
  totalReach: number
  totalLikes: number
  totalComments: number
  totalShares: number
  platformBreakdown: {
    instagram: number
    facebook: number
    twitter: number
  }
  weeklyData: {
    date: string
    posts: number
    engagement: number
    reach: number
  }[]
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [error, setError] = useState('')
  
  const router = useRouter()

  useEffect(() => {
    loadAnalytics()
  }, [timeRange])

  const loadAnalytics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // For now, we'll use mock data
      // In a real app, you'd fetch this from your analytics service
      const mockData: AnalyticsData = {
        totalPosts: 24,
        totalEngagement: 15420,
        totalReach: 89200,
        totalLikes: 12340,
        totalComments: 2340,
        totalShares: 740,
        platformBreakdown: {
          instagram: 12,
          facebook: 8,
          twitter: 4
        },
        weeklyData: [
          { date: '2024-01-01', posts: 3, engagement: 1200, reach: 8000 },
          { date: '2024-01-08', posts: 4, engagement: 1800, reach: 12000 },
          { date: '2024-01-15', posts: 2, engagement: 900, reach: 6000 },
          { date: '2024-01-22', posts: 5, engagement: 2200, reach: 15000 },
          { date: '2024-01-29', posts: 3, engagement: 1400, reach: 9000 },
          { date: '2024-02-05', posts: 4, engagement: 1900, reach: 13000 },
          { date: '2024-02-12', posts: 3, engagement: 1600, reach: 11000 }
        ]
      }

      setAnalytics(mockData)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  const getEngagementRate = () => {
    if (!analytics) return 0
    return ((analytics.totalEngagement / analytics.totalReach) * 100).toFixed(2)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center">
              <BarChart3 className="h-6 w-6 text-indigo-600 mr-2" />
              <h1 className="text-xl font-semibold text-gray-900">
                Analytics
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={timeRange === '7d' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('7d')}
              >
                7D
              </Button>
              <Button
                variant={timeRange === '30d' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('30d')}
              >
                30D
              </Button>
              <Button
                variant={timeRange === '90d' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('90d')}
              >
                90D
              </Button>
              <Button size="sm" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {analytics && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Posts</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.totalPosts}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-600">+12% from last period</span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Reach</p>
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(analytics.totalReach)}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-600">+8% from last period</span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Engagement</p>
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(analytics.totalEngagement)}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Heart className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-600">+15% from last period</span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Engagement Rate</p>
                    <p className="text-2xl font-bold text-gray-900">{getEngagementRate()}%</p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-600">+3% from last period</span>
                </div>
              </div>
            </div>

            {/* Engagement Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Engagement Types</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Heart className="h-5 w-5 text-red-500 mr-3" />
                      <span className="text-gray-700">Likes</span>
                    </div>
                    <span className="font-medium">{formatNumber(analytics.totalLikes)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <MessageCircle className="h-5 w-5 text-blue-500 mr-3" />
                      <span className="text-gray-700">Comments</span>
                    </div>
                    <span className="font-medium">{formatNumber(analytics.totalComments)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Share className="h-5 w-5 text-green-500 mr-3" />
                      <span className="text-gray-700">Shares</span>
                    </div>
                    <span className="font-medium">{formatNumber(analytics.totalShares)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Platform Breakdown</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Instagram className="h-5 w-5 text-pink-500 mr-3" />
                      <span className="text-gray-700">Instagram</span>
                    </div>
                    <span className="font-medium">{analytics.platformBreakdown.instagram} posts</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Facebook className="h-5 w-5 text-blue-600 mr-3" />
                      <span className="text-gray-700">Facebook</span>
                    </div>
                    <span className="font-medium">{analytics.platformBreakdown.facebook} posts</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Twitter className="h-5 w-5 text-blue-400 mr-3" />
                      <span className="text-gray-700">Twitter</span>
                    </div>
                    <span className="font-medium">{analytics.platformBreakdown.twitter} posts</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performing Posts</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">Product showcase post</p>
                    <p className="text-xs text-gray-500">2.4K engagement • 15.2K reach</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">Behind the scenes</p>
                    <p className="text-xs text-gray-500">1.8K engagement • 12.1K reach</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">Customer testimonial</p>
                    <p className="text-xs text-gray-500">1.5K engagement • 10.8K reach</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly Chart */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Weekly Performance</h3>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Posts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Engagement</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Reach</span>
                  </div>
                </div>
              </div>
              
              <div className="h-64 flex items-end justify-between gap-2">
                {analytics.weeklyData.map((week, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-gray-200 rounded-t-lg relative" style={{ height: '200px' }}>
                      {/* Reach bar */}
                      <div 
                        className="absolute bottom-0 w-full bg-purple-500 rounded-t-lg"
                        style={{ 
                          height: `${(week.reach / 15000) * 100}%`,
                          minHeight: '4px'
                        }}
                      ></div>
                      {/* Engagement bar */}
                      <div 
                        className="absolute bottom-0 w-full bg-green-500 rounded-t-lg"
                        style={{ 
                          height: `${(week.engagement / 2500) * 100}%`,
                          minHeight: '4px'
                        }}
                      ></div>
                      {/* Posts bar */}
                      <div 
                        className="absolute bottom-0 w-full bg-blue-500 rounded-t-lg"
                        style={{ 
                          height: `${(week.posts / 5) * 100}%`,
                          minHeight: '4px'
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(week.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
} 