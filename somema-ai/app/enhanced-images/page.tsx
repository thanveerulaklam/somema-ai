'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { 
  ArrowLeft,
  Download,
  Eye,
  Search,
  Sparkles,
  Calendar,
  Image as ImageIcon,
  Trash2,
  Filter
} from 'lucide-react'

interface EnhancedImage {
  id: string
  original_image_url: string
  enhanced_image_url: string
  created_at: string
  user_id: string
  file_name?: string
}

export default function EnhancedImagesPage() {
  const [enhancedImages, setEnhancedImages] = useState<EnhancedImage[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterDate, setFilterDate] = useState('')
  const [error, setError] = useState('')
  const [userPlan, setUserPlan] = useState<string>('free')
  const router = useRouter()

  useEffect(() => {
    loadEnhancedImages()
  }, [])

  const loadEnhancedImages = async () => {
    try {
      console.log('🔍 Loading AI enhanced images...')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      console.log('👤 Loading enhanced images for user:', user.id)
      
      // Get user's subscription plan
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('subscription_plan')
        .eq('user_id', user.id)
        .single()

      if (profileError) {
        console.error('Error fetching user profile:', profileError)
        setUserPlan('free')
      } else {
        const plan = userProfile?.subscription_plan || 'free'
        console.log('📋 User plan loaded:', plan)
        setUserPlan(plan)
      }
      
      // Query the posts table for enhanced images
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .not('enhanced_image_url', 'is', null)
        .not('enhanced_image_url', 'eq', '')
        .order('created_at', { ascending: false })

      if (error) throw error

      console.log('📊 Enhanced images loaded:', data?.length || 0, 'items')
      console.log('📋 Raw data:', data)
      
      // Transform the data to match our interface
      const transformedData: EnhancedImage[] = (data || []).map(post => {
        console.log('Processing post:', post.id, 'enhanced_image_url:', post.enhanced_image_url)
        return {
          id: post.id,
          original_image_url: post.media_url || '',
          enhanced_image_url: post.enhanced_image_url,
          created_at: post.created_at,
          user_id: post.user_id,
          file_name: post.caption ? `Enhanced_${post.caption.substring(0, 30)}...` : `Enhanced_${post.id}`
        }
      })

      setEnhancedImages(transformedData)
    } catch (error: any) {
      console.error('❌ Error loading enhanced images:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }


  const filteredImages = enhancedImages.filter(image => {
    const matchesSearch = image.file_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         image.enhanced_image_url.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDate = !filterDate || 
                       new Date(image.created_at).toDateString() === new Date(filterDate).toDateString()
    
    return matchesSearch && matchesDate
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleView = (image: EnhancedImage) => {
    // For paid users, open in new tab
    window.open(image.enhanced_image_url, '_blank')
  }

  const handleDownload = async (imageUrl: string, fileName: string) => {
    if (userPlan === 'free') {
      // Redirect to pricing page for free users
      router.push('/pricing')
      return
    }

    try {
      // For paid users, download the image
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download failed:', error)
      setError('Failed to download image')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">AI Enhanced Images</h1>
                <p className="text-gray-600 text-sm">Your AI-enhanced promotional images</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search enhanced images..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <Input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-auto"
              />
              {filterDate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilterDate('')}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Enhanced Images Grid/List */}
        {filteredImages.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No enhanced images found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterDate 
                ? 'Try adjusting your search or filter criteria.'
                : 'Start by enhancing some images in the post editor to see them here.'
              }
            </p>
            <Button
              variant="primary"
              onClick={() => router.push('/posts/editor')}
            >
              Create Enhanced Image
            </Button>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
          }>
            {filteredImages.map((image) => (
              <div
                key={image.id}
                className={`bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow ${
                  viewMode === 'list' ? 'flex items-center p-4' : ''
                }`}
              >
                {viewMode === 'grid' ? (
                  <>
                    <div className="relative aspect-square">
                      <img
                        src={image.enhanced_image_url}
                        alt="Enhanced image"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = image.original_image_url
                        }}
                      />
                      <div className="absolute top-2 right-2">
                        <div className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          AI Enhanced
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                        {image.file_name}
                      </h3>
                      <p className="text-gray-500 text-sm mb-3">
                        {formatDate(image.created_at)}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(image.enhanced_image_url, image.file_name || 'enhanced-image')}
                          className="flex-1"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          {userPlan === 'free' ? 'Upgrade to Download' : 'Download'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(image)}
                          disabled={userPlan === 'free'}
                          title={userPlan === 'free' ? 'Upgrade to view full image' : 'View full image'}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="relative w-20 h-20 flex-shrink-0">
                      <img
                        src={image.enhanced_image_url}
                        alt="Enhanced image"
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = image.original_image_url
                        }}
                      />
                      <div className="absolute -top-1 -right-1">
                        <div className="bg-purple-600 text-white text-xs px-1 py-0.5 rounded-full">
                          <Sparkles className="h-2 w-2" />
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 ml-4">
                      <h3 className="font-medium text-gray-900 mb-1">
                        {image.file_name}
                      </h3>
                      <p className="text-gray-500 text-sm mb-2">
                        {formatDate(image.created_at)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(image.enhanced_image_url, image.file_name || 'enhanced-image')}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        {userPlan === 'free' ? 'Upgrade to Download' : 'Download'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(image)}
                        disabled={userPlan === 'free'}
                        title={userPlan === 'free' ? 'Upgrade to view full image' : 'View full image'}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        {filteredImages.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                Showing {filteredImages.length} of {enhancedImages.length} enhanced images
              </span>
              <span>
                {searchTerm || filterDate ? 'Filtered results' : 'All enhanced images'}
              </span>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
