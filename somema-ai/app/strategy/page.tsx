'use client'

import { useState, useEffect } from 'react'
import { Instagram, TrendingUp, Target, Calendar, Hash, Users, Clock, Lightbulb, BarChart3 } from 'lucide-react'

interface ContentStrategy {
  bestTimes: BestTime[]
  hashtagStrategy: HashtagCategory[]
  contentThemes: ContentTheme[]
  audienceInsights: AudienceInsight[]
  postingSchedule: PostingSchedule[]
}

interface BestTime {
  day: string
  time: string
  engagement: number
  description: string
}

interface HashtagCategory {
  category: string
  hashtags: string[]
  description: string
  reach: string
}

interface ContentTheme {
  theme: string
  description: string
  frequency: string
  examples: string[]
  engagement: number
}

interface AudienceInsight {
  insight: string
  percentage: number
  description: string
}

interface PostingSchedule {
  day: string
  time: string
  theme: string
  hashtagCategory: string
}

export default function StrategyPage() {
  const [strategy, setStrategy] = useState<ContentStrategy | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStrategy()
  }, [])

  const loadStrategy = async () => {
    try {
      setLoading(true)
      // Mock data for Indian businesses
      const mockStrategy: ContentStrategy = {
        bestTimes: [
          {
            day: 'Monday',
            time: '9:00 AM - 11:00 AM',
            engagement: 85,
            description: 'Start of week, people checking social media'
          },
          {
            day: 'Wednesday',
            time: '7:00 PM - 9:00 PM',
            engagement: 92,
            description: 'Mid-week relaxation, high engagement'
          },
          {
            day: 'Friday',
            time: '6:00 PM - 8:00 PM',
            engagement: 88,
            description: 'Weekend mood, shopping inspiration'
          },
          {
            day: 'Sunday',
            time: '2:00 PM - 4:00 PM',
            engagement: 78,
            description: 'Lazy Sunday browsing'
          }
        ],
        hashtagStrategy: [
          {
            category: 'Trending Indian Hashtags',
            hashtags: ['#InstaIndia', '#IndiaFashion', '#DesiStyle', '#IndianFashion', '#MadeInIndia'],
            description: 'High reach, national audience',
            reach: '1M+'
          },
          {
            category: 'Local City Hashtags',
            hashtags: ['#MumbaiFashion', '#DelhiStyle', '#BangaloreFashion', '#ChennaiStyle'],
            description: 'Target local customers',
            reach: '50K-200K'
          },
          {
            category: 'Niche Fashion Hashtags',
            hashtags: ['#EthnicWear', '#IndoWestern', '#TraditionalFashion', '#FusionFashion'],
            description: 'Specific fashion audience',
            reach: '100K-500K'
          },
          {
            category: 'Engagement Hashtags',
            hashtags: ['#FashionInspo', '#OOTD', '#StyleGoals', '#Fashionista'],
            description: 'Increase engagement and reach',
            reach: '500K-2M'
          }
        ],
        contentThemes: [
          {
            theme: 'Product Showcase',
            description: 'Highlight your products with lifestyle shots',
            frequency: '3-4 times per week',
            examples: ['New arrivals', 'Best sellers', 'Seasonal collections'],
            engagement: 4.2
          },
          {
            theme: 'Behind the Scenes',
            description: 'Show your business process and team',
            frequency: '1-2 times per week',
            examples: ['Design process', 'Team photos', 'Workshop glimpses'],
            engagement: 5.1
          },
          {
            theme: 'Customer Stories',
            description: 'Share customer testimonials and reviews',
            frequency: '2-3 times per week',
            examples: ['Customer photos', 'Reviews', 'Before/after'],
            engagement: 4.8
          },
          {
            theme: 'Trending Topics',
            description: 'Engage with current trends and festivals',
            frequency: '1-2 times per week',
            examples: ['Festival posts', 'Trending challenges', 'Seasonal content'],
            engagement: 3.9
          }
        ],
        audienceInsights: [
          {
            insight: 'Age 18-24',
            percentage: 45,
            description: 'Primary audience - college students and young professionals'
          },
          {
            insight: 'Age 25-34',
            percentage: 35,
            description: 'Secondary audience - working professionals with purchasing power'
          },
          {
            insight: 'Active 7-9 PM',
            percentage: 68,
            description: 'Peak activity time - after work hours'
          },
          {
            insight: 'Mobile Users',
            percentage: 92,
            description: 'Almost all users access via mobile devices'
          }
        ],
        postingSchedule: [
          {
            day: 'Monday',
            time: '9:00 AM',
            theme: 'Product Showcase',
            hashtagCategory: 'Trending Indian Hashtags'
          },
          {
            day: 'Wednesday',
            time: '7:00 PM',
            theme: 'Behind the Scenes',
            hashtagCategory: 'Engagement Hashtags'
          },
          {
            day: 'Friday',
            time: '6:00 PM',
            theme: 'Customer Stories',
            hashtagCategory: 'Local City Hashtags'
          },
          {
            day: 'Sunday',
            time: '2:00 PM',
            theme: 'Trending Topics',
            hashtagCategory: 'Niche Fashion Hashtags'
          }
        ]
      }
      
      setStrategy(mockStrategy)
    } catch (error) {
      console.error('Error loading strategy:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!strategy) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Strategy Data</h3>
            <p className="text-gray-500">Start posting to Instagram to get personalized strategy recommendations.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Content Strategy</h1>
          <p className="text-gray-600 mt-2">Optimized for Indian businesses on Instagram</p>
        </div>

        {/* Best Posting Times */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center mb-6">
            <Clock className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Best Posting Times</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {strategy.bestTimes.map((time, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{time.day}</h3>
                  <span className="text-sm font-medium text-green-600">{time.engagement}%</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{time.time}</p>
                <p className="text-xs text-gray-500">{time.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Hashtag Strategy */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center mb-6">
            <Hash className="h-6 w-6 text-purple-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Hashtag Strategy</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {strategy.hashtagStrategy.map((category, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{category.category}</h3>
                  <span className="text-sm font-medium text-blue-600">{category.reach}</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                <div className="flex flex-wrap gap-2">
                  {category.hashtags.map((hashtag, hashtagIndex) => (
                    <span key={hashtagIndex} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      {hashtag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content Themes */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center mb-6">
            <Lightbulb className="h-6 w-6 text-yellow-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Content Themes</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {strategy.contentThemes.map((theme, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{theme.theme}</h3>
                  <span className="text-sm font-medium text-green-600">{theme.engagement}% engagement</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{theme.description}</p>
                <p className="text-xs text-gray-500 mb-3">Frequency: {theme.frequency}</p>
                <div className="space-y-1">
                  {theme.examples.map((example, exampleIndex) => (
                    <p key={exampleIndex} className="text-xs text-gray-600">• {example}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audience Insights */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center mb-6">
            <Users className="h-6 w-6 text-green-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Audience Insights</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {strategy.audienceInsights.map((insight, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">{insight.percentage}%</div>
                <h3 className="font-semibold text-gray-900 mb-1">{insight.insight}</h3>
                <p className="text-xs text-gray-500">{insight.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Posting Schedule */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center mb-6">
            <Calendar className="h-6 w-6 text-red-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Recommended Posting Schedule</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Day</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Time</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Theme</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Hashtag Category</th>
                </tr>
              </thead>
              <tbody>
                {strategy.postingSchedule.map((schedule, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-3 px-4 font-medium text-gray-900">{schedule.day}</td>
                    <td className="py-3 px-4 text-gray-600">{schedule.time}</td>
                    <td className="py-3 px-4 text-gray-600">{schedule.theme}</td>
                    <td className="py-3 px-4 text-gray-600">{schedule.hashtagCategory}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
} 