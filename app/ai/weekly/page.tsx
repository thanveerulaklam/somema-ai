'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { 
  Calendar,
  Sparkles,
  Instagram,
  Facebook,
  Twitter,
  ArrowLeft,
  Clock,
  CheckCircle,
  FileText,
  Hash,
  Image as ImageIcon
} from 'lucide-react'
import { 
  generateCompleteContent, 
  generateFallbackContent, 
  AIGenerationRequest,
  GeneratedContent as AIGeneratedContent
} from '../../../lib/ai-services'

interface WeeklyPost {
  id: string
  day: string
  theme: string
  caption: string
  hashtags: string[]
  imagePrompt: string
  status: 'pending' | 'generated' | 'approved'
}

export default function WeeklyPage() {
  const [posts, setPosts] = useState<WeeklyPost[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [platform, setPlatform] = useState<'instagram' | 'facebook' | 'twitter'>('instagram')
  const [businessContext, setBusinessContext] = useState('')
  const [selectedThemes, setSelectedThemes] = useState<string[]>([])
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
    'Industry Insights'
  ]

  const daysOfWeek = [
    'Monday',
    'Tuesday', 
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday'
  ]

  useEffect(() => {
    initializeWeeklyPosts()
  }, [])

  const initializeWeeklyPosts = () => {
    const weeklyPosts: WeeklyPost[] = daysOfWeek.map((day, index) => ({
      id: `day-${index}`,
      day,
      theme: '',
      caption: '',
      hashtags: [],
      imagePrompt: '',
      status: 'pending'
    }))
    setPosts(weeklyPosts)
  }

  const handleThemeSelect = (theme: string) => {
    if (selectedThemes.includes(theme)) {
      setSelectedThemes(selectedThemes.filter(t => t !== theme))
    } else {
      setSelectedThemes([...selectedThemes, theme])
    }
  }

  const generateWeeklyContent = async () => {
    if (!businessContext.trim()) {
      setError('Please provide business context for better content generation')
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
              tone: 'Professional and engaging',
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
            console.error(`AI generation error for day ${post.day}:`, error)
            
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
      setSuccess('Weekly content generated successfully!')
    } catch (error: any) {
      setError('Failed to generate content. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const generateMockCaption = (theme: string, context: string) => {
    const captions = {
      'Product Showcase': `🎉 Introducing our latest ${context} innovation! This game-changing product is designed to transform your experience and deliver exceptional results. Don't miss out on this incredible opportunity!`,
      'Behind the Scenes': `🔍 Ever wondered what goes into creating amazing ${context}? Here's a peek behind the curtain at our creative process and the passion that drives everything we do!`,
      'Customer Testimonials': `💬 "This ${context} solution completely transformed our workflow!" - Real feedback from our amazing customers. Your success story could be next!`,
      'Educational Content': `📚 Pro tip: When it comes to ${context}, the key is consistency and quality. Here's what we've learned and how it can benefit you!`,
      'Lifestyle': `✨ Living the ${context} lifestyle means embracing innovation, quality, and excellence in everything we do. Join us on this amazing journey!`,
      'Promotional': `🔥 Limited time offer! Upgrade your ${context} experience with our premium features. Special discount for our community!`,
      'User Generated Content': `👥 Our community never fails to amaze us! Check out this incredible ${context} creation from one of our talented users.`,
      'Industry Insights': `📊 The ${context} industry is evolving rapidly. Here are the latest trends and insights that will shape the future!`
    }
    return captions[theme as keyof typeof captions] || captions['Product Showcase']
  }

  const generateMockHashtags = (theme: string) => {
    const hashtagSets = {
      'Product Showcase': ['innovation', 'quality', 'excellence', 'newproduct', 'gamechanger'],
      'Behind the Scenes': ['behindthescenes', 'process', 'creativity', 'teamwork', 'passion'],
      'Customer Testimonials': ['testimonial', 'customer', 'feedback', 'success', 'trust'],
      'Educational Content': ['education', 'tips', 'learning', 'knowledge', 'insights'],
      'Lifestyle': ['lifestyle', 'inspiration', 'motivation', 'qualityoflife', 'excellence'],
      'Promotional': ['offer', 'discount', 'limitedtime', 'special', 'deal'],
      'User Generated Content': ['community', 'usergenerated', 'creativity', 'inspiration', 'talent'],
      'Industry Insights': ['industry', 'trends', 'insights', 'future', 'innovation']
    }
    return hashtagSets[theme as keyof typeof hashtagSets] || hashtagSets['Product Showcase']
  }

  const generateMockImagePrompt = (theme: string) => {
    const prompts = {
      'Product Showcase': 'Professional product photography with modern styling and clean background',
      'Behind the Scenes': 'Team working together in a creative office environment',
      'Customer Testimonials': 'Happy customer using the product with testimonial overlay',
      'Educational Content': 'Infographic style image with educational content and icons',
      'Lifestyle': 'Lifestyle photography showing people enjoying the product',
      'Promotional': 'Promotional banner with special offer text and product imagery',
      'User Generated Content': 'Community showcase with user-created content',
      'Industry Insights': 'Data visualization and industry trend graphics'
    }
    return prompts[theme as keyof typeof prompts] || prompts['Product Showcase']
  }

  const saveWeeklyContent = async () => {
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
        scheduled_for: getNextWeekDate(post.day),
        metadata: {
          theme: post.theme,
          imagePrompt: post.imagePrompt,
          contentType: 'weekly'
        }
      }))

      const { error } = await supabase
        .from('posts')
        .insert(postsToSave)

      if (error) throw error

      setSuccess('Weekly content saved successfully!')
      setTimeout(() => {
        router.push('/calendar')
      }, 2000)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const getNextWeekDate = (dayName: string) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const today = new Date()
    const targetDay = days.indexOf(dayName)
    const currentDay = today.getDay()
    const daysToAdd = (targetDay - currentDay + 7) % 7
    const nextWeekDate = new Date(today)
    nextWeekDate.setDate(today.getDate() + daysToAdd + 7) // Next week
    return nextWeekDate.toISOString()
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
              <Calendar className="h-6 w-6 text-green-600 mr-2" />
              <h1 className="text-xl font-semibold text-gray-900">
                Weekly Content Generator
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <h2 className="text-lg font-medium text-gray-900 mb-4">Weekly Content Setup</h2>
          
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
                Business Context
              </label>
              <textarea
                value={businessContext}
                onChange={(e) => setBusinessContext(e.target.value)}
                placeholder="Describe your business, products, services, and target audience..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                rows={4}
              />
            </div>
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
              onClick={generateWeeklyContent}
              loading={generating}
              disabled={!businessContext.trim() || selectedThemes.length === 0}
              className="flex-1"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Weekly Content
            </Button>
          </div>
        </div>

        {/* Weekly Content Preview */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-gray-900">Weekly Content Preview</h2>
            {posts.some(p => p.status === 'generated') && (
              <Button
                onClick={saveWeeklyContent}
                loading={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Save All Posts
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <div key={post.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">{post.day}</h3>
                  <div className={`px-2 py-1 rounded-full text-xs ${
                    post.status === 'generated' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {post.status === 'generated' ? 'Generated' : 'Pending'}
                  </div>
                </div>

                {post.status === 'generated' ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Theme</label>
                      <p className="text-sm text-gray-900">{post.theme}</p>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Caption</label>
                      <p className="text-sm text-gray-900 line-clamp-3">{post.caption}</p>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Hashtags</label>
                      <div className="flex flex-wrap gap-1">
                        {post.hashtags.slice(0, 3).map((tag, index) => (
                          <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            #{tag}
                          </span>
                        ))}
                        {post.hashtags.length > 3 && (
                          <span className="text-xs text-gray-500">+{post.hashtags.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Content will be generated here</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 