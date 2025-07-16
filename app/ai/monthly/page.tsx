'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { 
  CalendarDays,
  Sparkles,
  Instagram,
  Facebook,
  Twitter,
  ArrowLeft,
  Clock,
  CheckCircle,
  FileText,
  Hash,
  Image as ImageIcon,
  TrendingUp
} from 'lucide-react'
import { 
  generateCompleteContent, 
  generateFallbackContent, 
  AIGenerationRequest,
  GeneratedContent as AIGeneratedContent
} from '../../../lib/ai-services'

interface MonthlyPost {
  id: string
  week: number
  day: number
  theme: string
  caption: string
  hashtags: string[]
  imagePrompt: string
  status: 'pending' | 'generated' | 'approved'
}

export default function MonthlyPage() {
  const [posts, setPosts] = useState<MonthlyPost[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [platform, setPlatform] = useState<'instagram' | 'facebook' | 'twitter'>('instagram')
  const [businessContext, setBusinessContext] = useState('')
  const [selectedThemes, setSelectedThemes] = useState<string[]>([])
  const [contentStrategy, setContentStrategy] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const router = useRouter()

  const themes = [
    'Product Showcase',
    'Behind the Scenes',
    'Customer Testimonials',
    'Educational Content',
    'Lifestyle',
    'Promotional',
    'User Generated Content',
    'Industry Insights',
    'Team Spotlight',
    'Company Culture',
    'Tips & Tricks',
    'Success Stories'
  ]

  const strategies = [
    'Brand Awareness',
    'Lead Generation',
    'Community Building',
    'Product Launch',
    'Seasonal Campaign',
    'Thought Leadership'
  ]

  useEffect(() => {
    initializeMonthlyPosts()
  }, [])

  const initializeMonthlyPosts = () => {
    const monthlyPosts: MonthlyPost[] = []
    for (let week = 1; week <= 4; week++) {
      for (let day = 1; day <= 7; day++) {
        monthlyPosts.push({
          id: `week-${week}-day-${day}`,
          week,
          day,
          theme: '',
          caption: '',
          hashtags: [],
          imagePrompt: '',
          status: 'pending'
        })
      }
    }
    setPosts(monthlyPosts)
  }

  const handleThemeSelect = (theme: string) => {
    if (selectedThemes.includes(theme)) {
      setSelectedThemes(selectedThemes.filter(t => t !== theme))
    } else {
      setSelectedThemes([...selectedThemes, theme])
    }
  }

  const generateMonthlyContent = async () => {
    if (!businessContext.trim()) {
      setError('Please provide business context for better content generation')
      return
    }

    if (!contentStrategy) {
      setError('Please select a content strategy')
      return
    }

    setGenerating(true)
    setError('')

    try {
      // Generate content for each day using AI services
      const generatedPosts = await Promise.all(
        posts.map(async (post, index) => {
          const selectedTheme = selectedThemes[index % selectedThemes.length] || themes[index % themes.length]
          
          try {
            // Create AI generation request
            const aiRequest: AIGenerationRequest = {
              businessContext: businessContext,
              platform: platform,
              theme: selectedTheme,
              customPrompt: `Content strategy: ${contentStrategy}`,
              tone: 'Professional and strategic',
              targetAudience: 'Our target audience'
            }

            // Generate content using AI services
            const aiContent: AIGeneratedContent = await generateCompleteContent(aiRequest)
            
            return {
              ...post,
              theme: selectedTheme,
              caption: aiContent.caption,
              hashtags: aiContent.hashtags,
              imagePrompt: aiContent.imagePrompt,
              status: 'generated' as const
            }
          } catch (error) {
            console.error(`AI generation error for week ${post.week}, day ${post.day}:`, error)
            
            // Fallback to mock content if AI services fail
            const fallbackRequest: AIGenerationRequest = {
              businessContext: businessContext,
              platform: platform,
              theme: selectedTheme
            }
            
            const fallbackContent = generateFallbackContent(fallbackRequest)
            
            return {
              ...post,
              theme: selectedTheme,
              caption: fallbackContent.caption,
              hashtags: fallbackContent.hashtags,
              imagePrompt: fallbackContent.imagePrompt,
              status: 'generated' as const
            }
          }
        })
      )

      setPosts(generatedPosts)
      setSuccess('Monthly content generated successfully!')
    } catch (error: any) {
      setError('Failed to generate content. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const generateMockCaption = (theme: string, context: string, strategy: string) => {
    const captions = {
      'Product Showcase': `🚀 Introducing our revolutionary ${context} solution! Designed with cutting-edge technology to deliver exceptional results. Experience the future of ${strategy.toLowerCase()} today!`,
      'Behind the Scenes': `🔍 Ever wondered what drives our ${context} innovation? Here's an exclusive look at our creative process and the passion that fuels our ${strategy.toLowerCase()} success!`,
      'Customer Testimonials': `💬 "This ${context} platform transformed our entire ${strategy.toLowerCase()} approach!" - Real success stories from our amazing community. Your breakthrough could be next!`,
      'Educational Content': `📚 Master the art of ${context} with our expert insights. Discover proven strategies that will elevate your ${strategy.toLowerCase()} game to new heights!`,
      'Lifestyle': `✨ Embrace the ${context} lifestyle and unlock your full potential. Join our community of innovators who are redefining ${strategy.toLowerCase()} excellence!`,
      'Promotional': `🔥 Limited-time opportunity! Upgrade your ${context} experience with our premium ${strategy.toLowerCase()} features. Special access for our valued community!`,
      'User Generated Content': `👥 Our ${context} community never ceases to amaze! Check out this incredible ${strategy.toLowerCase()} creation from one of our talented members.`,
      'Industry Insights': `📊 The ${context} landscape is evolving rapidly. Stay ahead with our latest ${strategy.toLowerCase()} insights and trend analysis!`,
      'Team Spotlight': `🌟 Meet the brilliant minds behind our ${context} innovation! Our team's dedication to ${strategy.toLowerCase()} excellence drives everything we do.`,
      'Company Culture': `🏢 At the heart of our ${context} success is a culture of innovation and ${strategy.toLowerCase()} excellence. Here's what makes us different!`,
      'Tips & Tricks': `💡 Pro tip: Maximize your ${context} potential with these game-changing ${strategy.toLowerCase()} strategies. Small changes, big results!`,
      'Success Stories': `🎯 From startup to success story! See how our ${context} solution helped achieve remarkable ${strategy.toLowerCase()} results.`
    }
    return captions[theme as keyof typeof captions] || captions['Product Showcase']
  }

  const generateMockHashtags = (theme: string) => {
    const hashtagSets = {
      'Product Showcase': ['innovation', 'quality', 'excellence', 'newproduct', 'gamechanger', 'technology'],
      'Behind the Scenes': ['behindthescenes', 'process', 'creativity', 'teamwork', 'passion', 'culture'],
      'Customer Testimonials': ['testimonial', 'customer', 'feedback', 'success', 'trust', 'results'],
      'Educational Content': ['education', 'tips', 'learning', 'knowledge', 'insights', 'strategy'],
      'Lifestyle': ['lifestyle', 'inspiration', 'motivation', 'qualityoflife', 'excellence', 'success'],
      'Promotional': ['offer', 'discount', 'limitedtime', 'special', 'deal', 'opportunity'],
      'User Generated Content': ['community', 'usergenerated', 'creativity', 'inspiration', 'talent', 'collaboration'],
      'Industry Insights': ['industry', 'trends', 'insights', 'future', 'innovation', 'analysis'],
      'Team Spotlight': ['team', 'spotlight', 'culture', 'people', 'talent', 'leadership'],
      'Company Culture': ['culture', 'company', 'values', 'mission', 'teamwork', 'community'],
      'Tips & Tricks': ['tips', 'tricks', 'advice', 'strategy', 'improvement', 'growth'],
      'Success Stories': ['success', 'stories', 'results', 'achievement', 'transformation', 'growth']
    }
    return hashtagSets[theme as keyof typeof hashtagSets] || hashtagSets['Product Showcase']
  }

  const generateMockImagePrompt = (theme: string) => {
    const prompts = {
      'Product Showcase': 'Professional product photography with modern styling, clean background, and premium feel',
      'Behind the Scenes': 'Team collaborating in a modern office environment with creative energy',
      'Customer Testimonials': 'Happy customer using the product with testimonial overlay and success imagery',
      'Educational Content': 'Infographic style image with educational content, icons, and clear typography',
      'Lifestyle': 'Lifestyle photography showing people enjoying the product in real-world scenarios',
      'Promotional': 'Promotional banner with special offer text, product imagery, and call-to-action',
      'User Generated Content': 'Community showcase with user-created content and collaborative spirit',
      'Industry Insights': 'Data visualization and industry trend graphics with professional charts',
      'Team Spotlight': 'Professional team portrait with diverse group in modern office setting',
      'Company Culture': 'Office culture shots showing team collaboration and positive work environment',
      'Tips & Tricks': 'Step-by-step visual guide with clear instructions and helpful icons',
      'Success Stories': 'Before and after comparison with transformation imagery and success metrics'
    }
    return prompts[theme as keyof typeof prompts] || prompts['Product Showcase']
  }

  const saveMonthlyContent = async () => {
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Save each post to the database
      const postsToSave = posts.map(post => ({
        user_id: user.id,
        caption: post.caption,
        hashtags: post.hashtags,
        platform: platform,
        status: 'draft',
        scheduled_for: getNextMonthDate(post.week, post.day),
        metadata: {
          theme: post.theme,
          imagePrompt: post.imagePrompt,
          contentType: 'monthly',
          week: post.week,
          day: post.day,
          strategy: contentStrategy
        }
      }))

      const { error } = await supabase
        .from('posts')
        .insert(postsToSave)

      if (error) throw error

      setSuccess('Monthly content saved successfully!')
      setTimeout(() => {
        router.push('/calendar')
      }, 2000)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const getNextMonthDate = (week: number, day: number) => {
    const today = new Date()
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
    const dayOfMonth = (week - 1) * 7 + day
    nextMonth.setDate(dayOfMonth)
    return nextMonth.toISOString()
  }

  const getWeekPosts = (week: number) => {
    return posts.filter(post => post.week === week)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/ai/generate">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Generator
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center">
              <CalendarDays className="h-6 w-6 text-purple-600 mr-2" />
              <h1 className="text-xl font-semibold text-gray-900">
                Monthly Content Generator
              </h1>
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

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm">{success}</p>
          </div>
        )}

        {/* Setup Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Monthly Content Strategy</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Platform
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'text-pink-600' },
                  { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'text-blue-600' },
                  { id: 'twitter', name: 'Twitter/X', icon: Twitter, color: 'text-blue-400' }
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPlatform(p.id as any)}
                    className={`p-3 border-2 rounded-lg transition-colors ${
                      platform === p.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <p.icon className={`h-5 w-5 mx-auto mb-1 ${p.color}`} />
                    <p className="text-xs font-medium">{p.name}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Strategy
              </label>
              <select
                value={contentStrategy}
                onChange={(e) => setContentStrategy(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg"
              >
                <option value="">Select a strategy</option>
                {strategies.map((strategy) => (
                  <option key={strategy} value={strategy}>{strategy}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Context
            </label>
            <textarea
              value={businessContext}
              onChange={(e) => setBusinessContext(e.target.value)}
              placeholder="Describe your business, products, services, target audience, and goals..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none"
              rows={4}
            />
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Content Themes
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {themes.map((theme) => (
                <button
                  key={theme}
                  onClick={() => handleThemeSelect(theme)}
                  className={`p-3 text-left rounded-lg border transition-colors ${
                    selectedThemes.includes(theme)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {theme}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Button
              onClick={generateMonthlyContent}
              loading={generating}
              disabled={!businessContext.trim() || !contentStrategy || selectedThemes.length === 0}
              className="flex-1"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Monthly Content
            </Button>
          </div>
        </div>

        {/* Monthly Content Preview */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-gray-900">Monthly Content Preview</h2>
            {posts.some(p => p.status === 'generated') && (
              <Button
                onClick={saveMonthlyContent}
                loading={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Save All Posts
              </Button>
            )}
          </div>

          {/* Weekly Breakdown */}
          <div className="space-y-8">
            {[1, 2, 3, 4].map((week) => (
              <div key={week} className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Week {week}</h3>
                <div className="grid grid-cols-7 gap-3">
                  {getWeekPosts(week).map((post) => (
                    <div key={post.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-700">Day {post.day}</span>
                        <div className={`w-2 h-2 rounded-full ${
                          post.status === 'generated' ? 'bg-green-500' : 'bg-gray-300'
                        }`} />
                      </div>
                      
                      {post.status === 'generated' ? (
                        <div className="space-y-2">
                          <p className="text-xs text-gray-900 font-medium truncate">{post.theme}</p>
                          <p className="text-xs text-gray-600 line-clamp-2">{post.caption}</p>
                          <div className="flex flex-wrap gap-1">
                            {post.hashtags.slice(0, 2).map((tag, index) => (
                              <span key={index} className="text-xs bg-blue-100 text-blue-800 px-1 rounded">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <Clock className="h-4 w-4 mx-auto text-gray-400 mb-1" />
                          <p className="text-xs text-gray-500">Pending</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 