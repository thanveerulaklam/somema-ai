'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { 
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Calendar,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Instagram,
  Facebook,
  Twitter,
  FileText,
  Image as ImageIcon,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface Post {
  id: string
  caption: string
  hashtags: string[]
  platform: string
  status: 'draft' | 'scheduled' | 'published' | 'failed'
  scheduled_for?: string
  created_at: string
  media_url?: string
  media_urls?: string[]
  text_elements?: {
    headline: string
    subtext: string
    cta: string
  }
  business_context?: string
  theme?: string
}

function PostsContent() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [platformFilter, setPlatformFilter] = useState<string>('all')
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [schedulePostId, setSchedulePostId] = useState<string | null>(null)
  const [scheduledTime, setScheduledTime] = useState('')
  const [schedulingLoading, setSchedulingLoading] = useState(false)
  const [showPostNowModal, setShowPostNowModal] = useState(false)
  const [postNowPost, setPostNowPost] = useState<Post | null>(null)
  const [postNowPlatform, setPostNowPlatform] = useState<'instagram' | 'facebook' | 'both'>('instagram')
  const [postNowLoadingId, setPostNowLoadingId] = useState<string | null>(null)
  const [postNowError, setPostNowError] = useState<string>('')

  // Always get status filter from URL
  const statusParam = searchParams.get('status')
  const statusFilter = statusParam && ['draft', 'scheduled', 'published', 'failed'].includes(statusParam)
    ? statusParam
    : 'all'

  useEffect(() => {
    loadPosts()
  }, [])

  const loadPosts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Only load from Supabase
      const { data: dbPosts, error: dbError } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (dbError) {
        setPosts([])
        throw dbError
      }
      setPosts(dbPosts || [])
    } catch (error) {
      console.error('Error loading posts from Supabase:', error)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.caption.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.hashtags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter
    const matchesPlatform = platformFilter === 'all' || post.platform === platformFilter
    return matchesSearch && matchesStatus && matchesPlatform
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'scheduled':
        return <Clock className="h-4 w-4 text-blue-600" />
      case 'draft':
        return <FileText className="h-4 w-4 text-gray-600" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800'
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return <Instagram className="h-4 w-4 text-pink-600" />
      case 'facebook':
        return <Facebook className="h-4 w-4 text-blue-600" />
      case 'twitter':
        return <Twitter className="h-4 w-4 text-blue-400" />
      default:
        return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleEditPost = (post: Post) => {
    // Navigate to editor with post ID
    router.push(`/posts/editor?postId=${post.id}`)
  }

  const handleDeletePost = async (postId: string) => {
    if (confirm('Are you sure you want to delete this post?')) {
      try {
        // Try to delete from database
        const { error } = await supabase
          .from('posts')
          .delete()
          .eq('id', postId)

        if (error) {
          console.log('Database delete failed, removing from localStorage:', error)
          // Fallback to localStorage
          const savedPosts = JSON.parse(localStorage.getItem('somema_draft_posts') || '[]')
          const updatedPosts = savedPosts.filter((p: Post) => p.id !== postId)
          localStorage.setItem('somema_draft_posts', JSON.stringify(updatedPosts))
        }

        // Update local state
        setPosts(posts.filter(p => p.id !== postId))
      } catch (error) {
        console.error('Error deleting post:', error)
      }
    }
  }

  const handleSchedulePost = async () => {
    if (!schedulePostId || !scheduledTime) return
    setSchedulingLoading(true)
    setPostNowError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')
      // Debug logs for time conversion
      console.log('scheduledTime input:', scheduledTime);
      console.log('Date object:', new Date(scheduledTime));
      console.log('UTC ISO string:', new Date(scheduledTime).toISOString());
      // Correct: convert local time to UTC ISO string
      const utcISOString = new Date(scheduledTime).toISOString();
      if (typeof window === 'undefined') {
        console.info('UTC ISO string to be saved:', utcISOString)
      }
      const { error } = await supabase
        .from('posts')
        .update({ status: 'scheduled', scheduled_for: utcISOString })
        .eq('id', schedulePostId)
        .eq('user_id', user.id)
      if (error) throw error
      setShowScheduleModal(false)
      setSchedulePostId(null)
      setScheduledTime('')
      // Reload posts
      loadPosts()
    } catch (error: any) {
      setPostNowError(error.message || 'Failed to schedule post')
    } finally {
      setSchedulingLoading(false)
    }
  }

  const handlePostNow = (post: Post) => {
    setPostNowPost(post)
    setPostNowPlatform('instagram')
    setShowPostNowModal(true)
    setPostNowError('')
  }

  const handleConfirmPostNow = async () => {
    if (!postNowPost) return
    setPostNowLoadingId(postNowPost.id)
    setPostNowError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')
      // Fetch user profile to get connected Meta page/account
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('meta_credentials')
        .eq('user_id', user.id)
        .single()
      if (profileError || !profileData?.meta_credentials?.connected?.length) {
        throw new Error('No connected Instagram business account found. Please connect your account in Settings.')
      }
      const connected = profileData.meta_credentials.connected
      const selectedPageId = connected[0].pageId
      if (!selectedPageId) {
        throw new Error('No connected Instagram business account found. Please connect your account in Settings.')
      }
      // Call the API to post to Instagram/Facebook/Both
      const response = await fetch('/api/meta/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}`
        },
        body: JSON.stringify({
          caption: postNowPost.caption,
          hashtags: postNowPost.hashtags,
          mediaUrl: postNowPost.media_url,
          platform: postNowPlatform,
          selectedPageId
        })
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to post')
      }

      // Handle the response based on success/failure
      if (data.success) {
        // Update the post status in the database
        await supabase
          .from('posts')
          .update({ status: 'published' })
          .eq('id', postNowPost.id)
          .eq('user_id', user.id)
        setShowPostNowModal(false)
        setPostNowPost(null)
        // Reload posts
        loadPosts()
        // Show success message
        alert(data.message || 'Post published successfully!')
      } else {
        // Show user-friendly error message
        throw new Error(data.message || 'Posting failed. Please try again.')
      }
    } catch (error: any) {
      setPostNowError(error.message || 'Failed to post now')
    } finally {
      setPostNowLoadingId(null)
    }
  }

  const fixMissingTextElements = async () => {
    if (!confirm('This will update all posts that are missing text elements. Continue?')) {
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get all posts that are missing text_elements
      const { data: postsToFix, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .or('text_elements.is.null,text_elements.eq.{}')

      if (error) {
        console.error('Error fetching posts to fix:', error)
        return
      }

      if (!postsToFix || !Array.isArray(postsToFix) || (postsToFix && postsToFix.length === 0)) {
        alert('No posts need fixing!')
        return
      }

      let fixedCount = 0
      for (const post of postsToFix) {
        if (!post.caption) continue

        // Extract text elements from caption
        const lines = post.caption ? post.caption.split('\n').map((line: string) => line.trim()).filter((line: string) => line.length > 0) : [];
        
        const firstLine = lines[0] || ''
        const headline = firstLine
          .replace(/^[🌟🚀💼✨🔧💡🔍💬👇#]+/, '')
          .replace(/#\w+/g, '')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 50) || 'Amazing Headline'
        
        let subtext = 'Compelling subtext that draws attention'
        for (let i = 1; i < (lines && Array.isArray(lines) ? lines.length : 0); i++) {
          const line = lines[i]
          if (line && !line.startsWith('#') && line.length > 15 && line.length < 80) {
            subtext = line.substring(0, 60)
            break
          }
        }
        
        const ctaPatterns = [
          /(?:click|visit|learn|get|start|try|explore|discover)/i,
          /(?:link in bio|visit our|check out|get started|learn more)/i,
          /(?:curious|ready|interested)/i
        ]
        
        let cta = 'Learn More'
        for (const pattern of ctaPatterns) {
          const match = post.caption.match(pattern)
          if (match) {
            const words = match[0].split(' ')
            cta = words.map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
            break
          }
        }

        const textElements = { headline, subtext, cta }

        // Update the post
        const { error: updateError } = await supabase
          .from('posts')
          .update({ text_elements: textElements })
          .eq('id', post.id)

        if (!updateError) {
          fixedCount++
        }
      }

      alert(`Fixed ${fixedCount} out of ${(postsToFix && Array.isArray(postsToFix) ? postsToFix.length : 0)} posts!`)
      
      // Reload posts to show updated data
      loadPosts()
    } catch (error) {
      console.error('Error fixing posts:', error)
      alert('Error fixing posts. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-24 w-24 sm:h-32 sm:w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
            
            <div className="flex items-center">
              <FileText className="h-6 w-6 text-blue-600 mr-2" />
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                Posts
              </h1>
            </div>

            <div className="flex items-center">
              <Link href="/ai/generate">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Post
                </Button>
              </Link>
              <Button
                onClick={fixMissingTextElements}
                variant="outline"
                className="ml-0 sm:ml-2 mt-2 sm:mt-0"
              >
                Fix Missing Data
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-6 sm:py-8">
        {/* Filters */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  router.push(`/posts?status=${e.target.value}`)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">All</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Platform</label>
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">All Platforms</option>
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
                <option value="twitter">Twitter/X</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={() => {
                  setSearchTerm('')
                  setPlatformFilter('all')
                  router.push('/posts')
                }}
                variant="outline"
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Posts List */}
        <div className="bg-white rounded-lg shadow-sm border">
          {Array.isArray(filteredPosts) && filteredPosts.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
              <p className="text-gray-600 mb-4">
                {Array.isArray(posts) && posts.length === 0 
                  ? "You haven't created any posts yet." 
                  : "No posts match your current filters."}
              </p>
              <Link href="/ai/generate">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Post
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredPosts.map((post) => (
                <div key={post.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getPlatformIcon(post.platform)}
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {post.platform}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(post.status)}`}>
                          {getStatusIcon(post.status)}
                          <span className="ml-1 capitalize">{post.status}</span>
                        </span>
                        {post.scheduled_for && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span className="text-xs text-gray-500">
                              {post.scheduled_for ?
                                (() => {
                                  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
                                  if (typeof window === 'undefined') {
                                    console.info('Scheduled_for from DB (UTC):', post.scheduled_for)
                                  }
                                  const localString = new Date(String(post.scheduled_for)).toLocaleString(undefined, { timeZone: tz });
                                  if (typeof window === 'undefined') {
                                    console.info('Local time string for display:', localString, tz)
                                  }
                                  return localString + ` (${tz})`;
                                })()
                                : ''}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-start space-x-4">
                        {post.media_urls && Array.isArray(post.media_urls) && post.media_urls.length > 0 ? (
                          <div className="flex-shrink-0">
                            <div className="relative">
                              <img
                                src={post.media_urls[0]}
                                alt="Post media"
                                className="w-16 h-16 object-cover rounded-lg border"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                }}
                              />
                              {post.media_urls.length > 1 && (
                                <div className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                  {post.media_urls.length}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : post.media_url && post.media_url.trim() !== '' ? (
                          <div className="flex-shrink-0">
                            <img
                              src={post.media_url}
                              alt="Post media"
                              className="w-16 h-16 object-cover rounded-lg border"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                              }}
                            />
                          </div>
                        ) : (
                          <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-lg border flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-white" />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 line-clamp-2 mb-2">
                            {post.caption}
                          </p>
                          
                          {post.text_elements && (
                            <div className="text-xs text-gray-500 mb-2">
                              <span className="font-medium">Headline:</span> {post.text_elements.headline} | 
                              <span className="font-medium ml-1">CTA:</span> {post.text_elements.cta}
                            </div>
                          )}
                          
                          <div className="flex flex-wrap gap-1 mb-2">
                            {post.hashtags.slice(0, 5).map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                              >
                                #{tag}
                              </span>
                            ))}
                            {Array.isArray(post.hashtags) && post.hashtags.length > 5 && (
                              <span className="text-xs text-gray-500">
                                +{post.hashtags.length - 5} more
                              </span>
                            )}
                          </div>
                          
                          <div className="text-xs text-gray-500">
                            Created {formatDate(post.created_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditPost(post)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePost(post.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      {post.status === 'draft' && (
                        <div className="flex flex-col gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSchedulePostId(post.id)
                              setShowScheduleModal(true)
                              setScheduledTime('')
                            }}
                          >
                            Schedule Post
                          </Button>
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => handlePostNow(post)}
                          >
                            Post Now
                          </Button>
                          {postNowError && postNowLoadingId === post.id && (
                            <div className="text-xs text-red-600 mt-1">{postNowError}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Showing {Array.isArray(filteredPosts) ? filteredPosts.length : 0} of {Array.isArray(posts) ? posts.length : 0} posts
        </div>
      </div>

      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Schedule Post</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule Time
                </label>
                <input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowScheduleModal(false)
                    setSchedulePostId(null)
                    setScheduledTime('')
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSchedulePost}
                  loading={schedulingLoading}
                  disabled={!scheduledTime}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Schedule Post
                </Button>
              </div>
              {postNowError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm mb-2">{postNowError}</p>
                  {postNowError.includes('Instagram posting failed') && (
                    <div className="flex gap-2">
                      <Button
                        onClick={handleConfirmPostNow}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={postNowLoadingId !== null}
                      >
                        {postNowLoadingId ? 'Retrying...' : 'Retry Now'}
                      </Button>
                      <p className="text-xs text-red-600 mt-1">
                        Instagram's API can be unreliable. Retrying often works!
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showPostNowModal && postNowPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Where do you want to post?</h3>
            <div className="flex flex-col gap-3 mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="platform"
                  value="instagram"
                  checked={postNowPlatform === 'instagram'}
                  onChange={() => setPostNowPlatform('instagram')}
                />
                Instagram (default)
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="platform"
                  value="facebook"
                  checked={postNowPlatform === 'facebook'}
                  onChange={() => setPostNowPlatform('facebook')}
                />
                Facebook
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="platform"
                  value="both"
                  checked={postNowPlatform === 'both'}
                  onChange={() => setPostNowPlatform('both')}
                />
                Both Instagram & Facebook
              </label>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowPostNowModal(false)
                  setPostNowPost(null)
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmPostNow}
                loading={postNowLoadingId === postNowPost.id}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Post Now
              </Button>
            </div>
            {postNowError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm mb-2">{postNowError}</p>
                {postNowError.includes('Instagram posting failed') && (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleConfirmPostNow}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={postNowLoadingId !== null}
                    >
                      {postNowLoadingId ? 'Retrying...' : 'Retry Now'}
                    </Button>
                    <p className="text-xs text-red-600 mt-1">
                      Instagram's API can be unreliable. Retrying often works!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function PostsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading posts...</p>
        </div>
      </div>
    }>
      <PostsContent />
    </Suspense>
  )
} 