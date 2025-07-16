'use client'

import { useState, useEffect } from 'react'
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
  text_elements?: {
    headline: string
    subtext: string
    cta: string
  }
  business_context?: string
  theme?: string
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [platformFilter, setPlatformFilter] = useState<string>('all')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    loadPosts()
  }, [])

  useEffect(() => {
    const statusParam = searchParams.get('status')
    if (statusParam && ['draft', 'scheduled', 'published', 'failed'].includes(statusParam)) {
      setStatusFilter(statusParam)
    }
  }, [searchParams])

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

      if (!postsToFix || postsToFix.length === 0) {
        alert('No posts need fixing!')
        return
      }

      let fixedCount = 0
      for (const post of postsToFix) {
        if (!post.caption) continue

        // Extract text elements from caption
        const lines = post.caption.split('\n').map((line: string) => line.trim()).filter((line: string) => line.length > 0)
        
        const firstLine = lines[0] || ''
        const headline = firstLine
          .replace(/^[🌟🚀💼✨🔧💡🔍💬👇#]+/, '')
          .replace(/#\w+/g, '')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 50) || 'Amazing Headline'
        
        let subtext = 'Compelling subtext that draws attention'
        for (let i = 1; i < lines.length; i++) {
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

      alert(`Fixed ${fixedCount} out of ${postsToFix.length} posts!`)
      
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
              <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
            
            <div className="flex items-center">
              <FileText className="h-6 w-6 text-blue-600 mr-2" />
              <h1 className="text-xl font-semibold text-gray-900">
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
                className="ml-2"
              >
                Fix Missing Data
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  setStatusFilter('all')
                  setPlatformFilter('all')
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
          {filteredPosts.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
              <p className="text-gray-600 mb-4">
                {posts.length === 0 
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
                            {formatDate(post.scheduled_for)}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-start space-x-4">
                        {post.media_url && post.media_url.trim() !== '' ? (
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
                            {post.hashtags.length > 5 && (
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
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Showing {filteredPosts.length} of {posts.length} posts
        </div>
      </div>
    </div>
  )
} 