'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import MetaPosting from '../../../components/MetaPosting'
import { 
  ArrowLeft, 
  Download, 
  Save, 
  Type, 
  Image as ImageIcon,
  Palette,
  RotateCcw,
  Check
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'

interface PostData {
  imageUrl: string
  caption: string
  hashtags: string[]
  textElements: {
    headline: string
  }
  businessContext: string
  platform: string
  theme: string
}



export default function PostEditorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [postData, setPostData] = useState<PostData | null>(null)
  const [error, setError] = useState('')
  const [imageLoadError, setImageLoadError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  const [editingPostId, setEditingPostId] = useState<string | null>(null)

  // Load post data from URL params or localStorage
  useEffect(() => {
    const loadPostData = async () => {
      try {
        // Check if we're editing an existing post
        const postId = searchParams.get('postId')
        console.log('Checking for postId in URL params:', postId)
        
        if (postId) {
          setEditingPostId(postId)
          
          // Only load the post from database
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const { data: post, error } = await supabase
              .from('posts')
              .select('*')
              .eq('id', postId)
              .eq('user_id', user.id)
              .single()

            if (post && !error) {
              console.log('Loading existing post from database:', post)
              
              const data: PostData = {
                imageUrl: post.media_url || '',
                caption: post.caption || '',
                hashtags: post.hashtags || [],
                textElements: { headline: post.text_elements?.headline || '' },
                businessContext: post.business_context || '',
                platform: post.platform || 'instagram',
                theme: post.theme || 'product'
              }
              console.log('Processed post data:', data)
              setPostData(data)
              

              
              // Note: We'll let the user save the post when they're ready
              // instead of automatically updating the database
              if (!post.text_elements && post.caption) {
                console.log('Post missing text_elements - extracted data will be saved when user saves the post')
              }
              
              // Handle image loading
              if (data.imageUrl && data.imageUrl.trim() !== '') {
                setTimeout(() => {
                  const img = new Image()
                  img.onload = () => {
                    console.log('Image URL is valid:', data.imageUrl)
                    setImageLoading(false)
                  }
                  img.onerror = () => {
                    console.log('Image URL expired or failed to load:', data.imageUrl)
                    setImageLoading(false)
                  }
                  img.src = data.imageUrl
                }, 1000)
              } else {
                setImageLoading(false)
              }
              
              setLoading(false)
              return
            } else {
              setError('No post data found in Supabase for this post ID.')
            }
          } else {
            setError('User not authenticated.')
          }
        } else {
          // Try to load from localStorage first, then fall back to URL params
          const storedData = localStorage.getItem('postEditorData')
          console.log('Checking localStorage for postEditorData:', storedData ? 'Found' : 'Not found')
          
          if (storedData) {
            try {
              const parsedData = JSON.parse(storedData)
              console.log('Loading post data from localStorage:', parsedData)
              
              const data: PostData = {
                imageUrl: parsedData.imageUrl || '',
                caption: parsedData.caption || '',
                hashtags: parsedData.hashtags || [],
                textElements: parsedData.textElements || { headline: '' },
                businessContext: parsedData.businessContext || '',
                platform: parsedData.platform || 'instagram',
                theme: parsedData.theme || 'product'
              }
              setPostData(data)
              setImageLoading(false)
              
              // Clear localStorage after loading
              localStorage.removeItem('postEditorData')
              return
            } catch (parseError) {
              console.error('Failed to parse localStorage data:', parseError)
            }
          }
          
          // Fallback to URL params for new posts
          const imageUrl = searchParams.get('imageUrl')
          const caption = searchParams.get('caption') || ''
          const headline = searchParams.get('headline') || ''
          const businessContext = searchParams.get('businessContext')
          const platform = searchParams.get('platform')
          const theme = searchParams.get('theme')

          if (imageUrl && imageUrl.trim() !== '' && headline) {
            const data: PostData = {
              imageUrl,
              caption,
              hashtags: [],
              textElements: { headline },
              businessContext: businessContext || '',
              platform: platform || 'instagram',
              theme: theme || 'product'
            }
            setPostData(data)
            setImageLoading(false)
          } else {
            setError('No post data found')
          }
        }
      } catch (error) {
        setError('Failed to load post data from Supabase.')
      } finally {
        setLoading(false)
      }
    }

    loadPostData()
  }, [searchParams])

  const handleSave = async () => {
    if (!postData) return

    setSaving(true)
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('Please log in to save your post')
        return
      }

      let dbError = null

      if (editingPostId) {
        // Update existing post
        const { error } = await supabase
          .from('posts')
          .update({
            caption: postData.caption,
            hashtags: postData.hashtags,
            platform: postData.platform,
            text_elements: postData.textElements,
            business_context: postData.businessContext,
            theme: postData.theme,
            media_url: postData.imageUrl || null
          })
          .eq('id', editingPostId)
          .eq('user_id', user.id)
        dbError = error
      } else {
        // Create new post
        const { error } = await supabase
          .from('posts')
          .insert({
            user_id: user.id,
            caption: postData.caption,
            hashtags: postData.hashtags,
            platform: postData.platform,
            status: 'draft',
            text_elements: postData.textElements,
            business_context: postData.businessContext,
            theme: postData.theme,
            media_url: postData.imageUrl || null
          })
        dbError = error
      }

      if (dbError) {
        setError('Failed to save post to Supabase: ' + dbError.message)
        return
      }

      // Redirect to dashboard with success message
      const message = editingPostId ? 'Post updated successfully' : 'Post saved successfully'
      window.location.href = `/dashboard?message=${encodeURIComponent(message)}`

    } catch (error: any) {
      setError(`Failed to save post to Supabase: ${error.message || 'Unknown error occurred'}`)
    } finally {
      setSaving(false)
    }
  }



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Show error if no post data found
  if (!postData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">No Post Data Found</h2>
            <p className="text-gray-600 mb-6">
              {error || 'The post you\'re trying to edit could not be loaded. This might happen if the post was deleted or if you navigated here directly without selecting a post.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/posts')}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                View All Posts
              </button>
              <button
                onClick={() => router.push('/ai/generate')}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-colors"
              >
                Generate New Post
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show image error message
  if (imageLoadError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Image Unavailable</h2>
            <p className="text-gray-600 mb-6">
              The generated image URL has expired or is no longer accessible. This can happen with AI-generated images that have temporary URLs.
            </p>
            <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-gray-800 mb-2">Your Post Content is Still Available:</h3>
              <div className="text-left space-y-2 text-sm text-gray-700">
                <p><strong>Caption:</strong> {postData?.caption || 'No caption available'}</p>

              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => window.history.back()}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Go Back & Regenerate
              </button>
              <button
                onClick={() => setImageLoadError(false)}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-colors"
              >
                Continue with Gradient Background
              </button>
            </div>
          </div>
        </div>
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
              <Type className="h-6 w-6 text-blue-600 mr-2" />
              <h1 className="text-xl font-semibold text-gray-900">
                Post Editor
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

        {postData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Post Preview */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Post Preview</h3>
              
              <div className="relative w-full h-[700px] rounded-lg overflow-hidden bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
                {/* IMAGE FIRST */}
                {postData.imageUrl && postData.imageUrl.trim() !== '' ? (
                  <img 
                    src={postData.imageUrl} 
                    alt="Generated post"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      zIndex: 0
                    }}
                    className={`transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                    onLoad={() => {
                      setImageLoading(false)
                      setImageLoadError(false)
                    }}
                    onError={() => {
                      setImageLoading(false)
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                      <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">No Image Available</p>
                      <p className="text-sm opacity-75">This post will use a beautiful gradient background</p>
                    </div>
                  </div>
                )}
                



              </div>


            </div>

            {/* Content Editor */}
            <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Edit Content</h3>
              




              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Caption
                </label>
                <textarea
                  value={postData.caption}
                  onChange={(e) => setPostData({
                    ...postData,
                    caption: e.target.value
                  })}
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                  rows={4}
                  placeholder="Enter caption"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSave}
                  loading={saving}
                  className="flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save as Draft
                </Button>
              </div>
            </div>

            {/* Meta Posting */}
            <MetaPosting
              caption={postData.caption}
              hashtags={postData.hashtags}
              mediaUrl={postData.imageUrl}
              postId={editingPostId || undefined}
              onPosted={(result) => {
                console.log('Meta posting result:', result)
                // Optionally update the post status in the database
                if (editingPostId) {
                  // The API already updates the post status
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
} 