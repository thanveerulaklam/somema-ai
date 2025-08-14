'use client'

import { useState, useEffect, Suspense } from 'react'
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
  Check,
  Sparkles
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'

interface PostData {
  imageUrl: string
  imageUrls?: string[]
  caption: string
  hashtags: string[]
  textElements: {
    headline: string
  }
  businessContext: string
  platform: string
  theme: string
}

function PostEditorContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [postData, setPostData] = useState<PostData | null>(null)
  const [error, setError] = useState('')
  const [imageLoadError, setImageLoadError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [scheduledTime, setScheduledTime] = useState('')
  const [schedulingLoading, setSchedulingLoading] = useState(false)
  const [showPostNowModal, setShowPostNowModal] = useState(false)
  const [postNowPlatform, setPostNowPlatform] = useState<'instagram' | 'facebook' | 'both'>('instagram')
  const [schedulePlatform, setSchedulePlatform] = useState<'instagram' | 'facebook' | 'both'>('facebook')
  const [connectedPages, setConnectedPages] = useState<any[]>([])
  const [selectedPageId, setSelectedPageId] = useState<string>('')
  const [hasVideoWithoutAudio, setHasVideoWithoutAudio] = useState<boolean>(false)
  const [enhancingImage, setEnhancingImage] = useState<boolean>(false)
  const [enhancedImageUrl, setEnhancedImageUrl] = useState<string>('')
  const [showEnhancedImage, setShowEnhancedImage] = useState<boolean>(false)

  const checkForVideosWithoutAudio = async (mediaUrl: string, mediaUrls?: string[]): Promise<boolean> => {
    const urlsToCheck = [mediaUrl, ...(mediaUrls || [])].filter(url => url && url.includes('.mp4'))
    
    for (const url of urlsToCheck) {
      try {
        const response = await fetch(url)
        const blob = await response.blob()
        
        // Check if video has audio
        const hasAudio = await checkVideoAudio(blob)
        if (!hasAudio) {
          return true // Found a video without audio
        }
      } catch (error) {
        console.error('Error checking video audio:', error)
        // If we can't check, assume it has audio to be safe
      }
    }
    
    return false // All videos have audio or no videos found
  }

  const checkVideoAudio = (blob: Blob): Promise<boolean> => {
    return new Promise((resolve) => {
      const video = document.createElement('video')
      video.muted = true
      video.preload = 'metadata'
      
      video.onloadedmetadata = () => {
        // Check if video has audio by trying to access audio tracks
        // @ts-expect-error - audioTracks is available in modern browsers
        const hasAudio = video.audioTracks && video.audioTracks.length > 0
        resolve(hasAudio)
      }
      
      video.onerror = () => {
        // If we can't load metadata, assume it has audio to be safe
        resolve(true)
      }
      
      video.src = URL.createObjectURL(blob)
    })
  }

  // Check for videos without audio when post data changes
  useEffect(() => {
    const checkVideosForAudio = async () => {
      if (postData?.imageUrl || postData?.imageUrls) {
        const hasNoAudio = await checkForVideosWithoutAudio(postData.imageUrl, postData.imageUrls)
        setHasVideoWithoutAudio(hasNoAudio)
        
        // If videos have no audio and Instagram is selected, switch to Facebook
        if (hasNoAudio) {
          if (postNowPlatform === 'instagram' || postNowPlatform === 'both') {
            setPostNowPlatform('facebook')
          }
          if (schedulePlatform === 'instagram' || schedulePlatform === 'both') {
            setSchedulePlatform('facebook')
          }
        }
      } else {
        setHasVideoWithoutAudio(false)
      }
    }
    
    checkVideosForAudio()
  }, [postData])

  // Load post data from URL params or localStorage
  useEffect(() => {
    const loadPostData = async () => {
      // Clear any cached data to force fresh load
      localStorage.removeItem('postEditorData')
      try {
        // Check if we're editing an existing post
        const postId = searchParams.get('postId')
        console.log('Checking for postId in URL params:', postId)
        
        if (postId) {
          setEditingPostId(postId)
          
          // Only load the post from database
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            // Add cache busting to ensure fresh data
            const timestamp = Date.now()
            console.log('Loading post with cache busting timestamp:', timestamp)
            
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
                imageUrls: post.media_urls || [],
                caption: post.caption || '',
                hashtags: post.hashtags || [],
                textElements: { headline: post.text_elements?.headline || '' },
                businessContext: post.business_context || '',
                platform: post.platform || 'instagram',
                theme: post.theme || 'product'
              }
              console.log('Processed post data:', data)
              console.log('Carousel images count:', data.imageUrls?.length || 0)
              console.log('Carousel images:', data.imageUrls)
              console.log('=== CAROUSEL PREVIEW DEBUG ===')
              console.log('postData.imageUrls exists:', !!data.imageUrls)
              console.log('postData.imageUrls length:', data.imageUrls?.length)
              console.log('postData.imageUrls > 1:', (data.imageUrls?.length || 0) > 1)
              console.log('=== END DEBUG ===')
              console.log('Setting postData with imageUrls:', data.imageUrls)
              console.log('Setting postData with imageUrl:', data.imageUrl)
              setPostData(data)
              setCurrentImageIndex(0) // Reset to first image when loading new post
              

              
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
                imageUrls: parsedData.imageUrls || [],
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
              imageUrls: [],
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

  // Fetch connected pages/accounts on mount
  useEffect(() => {
    const fetchConnectedPages = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('meta_credentials')
        .eq('user_id', user.id)
        .single()
      // Use meta_credentials.pages for dropdown
      const pages = profileData?.meta_credentials?.pages || []
      setConnectedPages(pages)
      if (pages.length > 0) setSelectedPageId(pages[0].id)
    }
    fetchConnectedPages()
  }, [])

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
            media_url: showEnhancedImage && enhancedImageUrl ? enhancedImageUrl : postData.imageUrl || null,
            media_urls: postData.imageUrls || []
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
            media_url: showEnhancedImage && enhancedImageUrl ? enhancedImageUrl : postData.imageUrl || null,
            media_urls: postData.imageUrls || []
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

  const handleSchedulePost = async () => {
    if (!postData || !scheduledTime || !selectedPageId) {
      setError('Please select a scheduled time and page/account')
      return
    }
    // Debug logs for time conversion
    console.log('scheduledTime input:', scheduledTime);
    console.log('Date object:', new Date(scheduledTime));
    console.log('UTC ISO string:', new Date(scheduledTime).toISOString());
    // Correct: convert local time to UTC ISO string
    const utcISOString = new Date(scheduledTime).toISOString();

    setSchedulingLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Please log in to schedule your post')
        return
      }

      // Fetch user profile to get connected Meta page/account
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('meta_credentials')
        .eq('user_id', user.id)
        .single()
      if (profileError || !profileData?.meta_credentials?.connected?.length) {
        setError('No connected Instagram business account found. Please connect your account in Settings.')
        setSchedulingLoading(false)
        return
      }
      const connected = profileData.meta_credentials.connected
      const selectedPageId = connected[0].pageId
      if (!selectedPageId) {
        setError('No connected Instagram business account found. Please connect your account in Settings.')
        setSchedulingLoading(false)
        return
      }

      let postId = editingPostId
      if (!postId) {
        // Insert as scheduled if new post
        const { data: savedPost, error } = await supabase
          .from('posts')
          .insert({
            user_id: user.id,
            caption: postData.caption,
            hashtags: postData.hashtags,
            platform: schedulePlatform,
            status: 'scheduled',
            text_elements: postData.textElements,
            business_context: postData.businessContext,
            theme: postData.theme,
            media_url: showEnhancedImage && enhancedImageUrl ? enhancedImageUrl : postData.imageUrl || null,
            scheduled_for: utcISOString,
            page_id: selectedPageId
          })
          .select()
          .single()

        if (error) throw error
        postId = savedPost.id
      } else {
        // Update existing post
        const { error } = await supabase
          .from('posts')
          .update({
            caption: postData.caption,
            hashtags: postData.hashtags,
            platform: schedulePlatform,
            status: 'scheduled',
            text_elements: postData.textElements,
            business_context: postData.businessContext,
            theme: postData.theme,
            media_url: showEnhancedImage && enhancedImageUrl ? enhancedImageUrl : postData.imageUrl || null,
            scheduled_for: utcISOString,
            page_id: selectedPageId
          })
          .eq('id', postId)
          .eq('user_id', user.id)

        if (error) throw error
      }

      // Post is now saved as scheduled - the cron job will handle publishing
      console.log('Post scheduled successfully:', {
        postId,
        scheduledTime,
        status: 'scheduled',
        page_id: selectedPageId
      })

      setShowScheduleModal(false)
      setScheduledTime('')
      setEditingPostId(postId)
      // Show success message and redirect
      const scheduledDate = new Date(scheduledTime)
      const message = `Post scheduled for ${scheduledDate.toLocaleString()}`
      alert(`✅ Post scheduled successfully for ${scheduledDate.toLocaleString()}!\n\nThe post will be published automatically at the scheduled time.`)
      window.location.href = `/dashboard?message=${encodeURIComponent(message)}`

    } catch (error: any) {
      setError(`Failed to schedule post: ${error.message || 'Unknown error occurred'}`)
    } finally {
      setSchedulingLoading(false)
    }
  }

  const handlePostNow = () => {
    setShowPostNowModal(true)
    setError('')
  }

  const handleConfirmPostNow = async () => {
    if (!postData) return
    setSaving(true)
    setError('')
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Please log in to post now')
        setSaving(false)
        return
      }
      // Fetch user profile to get connected Meta page/account
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('meta_credentials')
        .eq('user_id', user.id)
        .single()
      if (profileError || !profileData?.meta_credentials?.connected?.length) {
        setError('No connected Instagram business account found. Please connect your account in Settings.')
        setSaving(false)
        return
      }
      const connected = profileData.meta_credentials.connected
      const selectedPageId = connected[0].pageId
      if (!selectedPageId) {
        setError('No connected Instagram business account found. Please connect your account in Settings.')
        setSaving(false)
        return
      }
      // Upload media to Supabase storage if they are blob URLs
      let finalMediaUrl = showEnhancedImage && enhancedImageUrl ? enhancedImageUrl : postData.imageUrl
      let finalMediaUrls = postData.imageUrls
      
      // Check if mediaUrl is a blob URL and upload it
      if (postData.imageUrl && postData.imageUrl.startsWith('blob:')) {
        console.log('Uploading blob URL to Supabase storage...')
        try {
          // Download the blob and upload to Supabase
          const response = await fetch(postData.imageUrl)
          const blob = await response.blob()
          
          // Determine file extension and type
          const fileExt = blob.type.includes('video') ? 'mp4' : 'jpg'
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
          const filePath = `media/${user.id}/${fileName}`
          
          // Upload to Supabase storage
          const { error: uploadError } = await supabase.storage
            .from('media')
            .upload(filePath, blob)
          
          if (uploadError) throw uploadError
          
          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('media')
            .getPublicUrl(filePath)
          
          finalMediaUrl = publicUrl
          console.log('Media uploaded successfully:', publicUrl)
        } catch (uploadError) {
          console.error('Failed to upload media:', uploadError)
          setError('Failed to upload media. Please try again.')
          setSaving(false)
          return
        }
      }
      
      // Upload mediaUrls if they are blob URLs
      if (postData.imageUrls && postData.imageUrls.length > 0) {
        const uploadedUrls = []
        for (const mediaUrl of postData.imageUrls) {
          if (mediaUrl.startsWith('blob:')) {
            console.log('Uploading carousel media to Supabase storage...')
            try {
              const response = await fetch(mediaUrl)
              const blob = await response.blob()
              
              const fileExt = blob.type.includes('video') ? 'mp4' : 'jpg'
              const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
              const filePath = `media/${user.id}/${fileName}`
              
              const { error: uploadError } = await supabase.storage
                .from('media')
                .upload(filePath, blob)
              
              if (uploadError) throw uploadError
              
              const { data: { publicUrl } } = supabase.storage
                .from('media')
                .getPublicUrl(filePath)
              
              uploadedUrls.push(publicUrl)
            } catch (uploadError) {
              console.error('Failed to upload carousel media:', uploadError)
              setError('Failed to upload carousel media. Please try again.')
              setSaving(false)
              return
            }
          } else {
            uploadedUrls.push(mediaUrl)
          }
        }
        finalMediaUrls = uploadedUrls
      }
      
      // Check for videos without audio if posting to Instagram
      if (postNowPlatform === 'instagram' || postNowPlatform === 'both') {
        const hasVideoWithoutAudio = await checkForVideosWithoutAudio(finalMediaUrl, finalMediaUrls)
        if (hasVideoWithoutAudio) {
          setError('⚠️ One or more videos have no audio. Instagram Reels require audio. Please add background music or sound to your videos before posting.')
          setSaving(false)
          return
        }
      }
      
      // Call the API to post to Instagram/Facebook/Both
      const postDataToSend = {
        caption: postData.caption,
        hashtags: postData.hashtags,
        mediaUrl: finalMediaUrl,
        mediaUrls: finalMediaUrls,
        platform: postNowPlatform,
        selectedPageId
      }
      console.log('Sending post data to API:', postDataToSend)
      
      const response = await fetch('/api/meta/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}`
        },
        body: JSON.stringify(postDataToSend)
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Failed to post')
        setSaving(false)
        return
      }
      // Optionally update the post status in the database
      if (editingPostId) {
        await supabase
          .from('posts')
          .update({ status: 'published' })
          .eq('id', editingPostId)
          .eq('user_id', user.id)
      }
      setShowPostNowModal(false)
      // Redirect to dashboard with success message
      window.location.href = `/dashboard?message=${encodeURIComponent('Post published!')}`
    } catch (error: any) {
      setError(`Failed to post now: ${error.message || 'Unknown error occurred'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleEnhanceImage = async () => {
    if (!postData) return

    setEnhancingImage(true)
    setError('')

    try {
      // Get the current image URL (either enhanced or original)
      const currentImageUrl = showEnhancedImage && enhancedImageUrl ? enhancedImageUrl : postData.imageUrl
      
      // Skip if it's a video
      if (currentImageUrl.match(/\.(mp4|webm|mov)$/i)) {
        setError('Image enhancement is not available for videos')
        setEnhancingImage(false)
        return
      }

      // Get product description from caption or business context
      const productDescription = postData.caption || postData.businessContext || ''

      // Convert image URL to file
      let imageFile: File
      
      if (currentImageUrl.startsWith('blob:')) {
        // For blob URLs, fetch the blob and create a file
        const response = await fetch(currentImageUrl)
        const blob = await response.blob()
        imageFile = new File([blob], 'image.jpg', { type: blob.type })
      } else if (currentImageUrl.startsWith('data:')) {
        // For data URLs, convert to blob and create file
        const response = await fetch(currentImageUrl)
        const blob = await response.blob()
        imageFile = new File([blob], 'image.jpg', { type: blob.type })
      } else {
        // For external URLs, fetch and create file
        const response = await fetch(currentImageUrl)
        const blob = await response.blob()
        imageFile = new File([blob], 'image.jpg', { type: blob.type })
      }

      // Create FormData and send file directly
      const formData = new FormData()
      formData.append('image', imageFile)
      formData.append('productDescription', productDescription)

      const response = await fetch('/api/enhance-image', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to enhance image')
      }

      const data = await response.json()
      setEnhancedImageUrl(data.enhancedImageUrl)
      setShowEnhancedImage(true)
      
      console.log('Image enhanced successfully:', data.enhancedImageUrl)
      console.log('Category:', data.category)
    } catch (error: any) {
      console.error('Error enhancing image:', error)
      setError(error.message || 'Failed to enhance image')
    } finally {
      setEnhancingImage(false)
    }
  }

  const handleResetImage = () => {
    setShowEnhancedImage(false)
    setEnhancedImageUrl('')
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
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
            
            <div className="flex items-center">
              <Type className="h-6 w-6 text-blue-600 mr-2" />
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                Post Editor
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-2 sm:px-4 lg:px-8 py-6 sm:py-8">
        {error && (
          <div className="mb-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-xs sm:text-sm">{error}</p>
          </div>
        )}

        {postData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
            {/* Post Preview */}
            <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Post Preview</h3>
              
              <div className="relative w-full h-[350px] sm:h-[500px] md:h-[700px] rounded-lg overflow-hidden bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
                {/* Enhancement Button */}
                {postData.imageUrl && !postData.imageUrl.match(/\.(mp4|webm|mov)$/i) && (
                  <div className="absolute top-4 left-4 z-30 flex flex-col gap-2">
                    {!showEnhancedImage ? (
                      <Button
                        onClick={handleEnhanceImage}
                        loading={enhancingImage}
                        size="sm"
                        className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        {enhancingImage ? 'Enhancing...' : 'Enhance with AI'}
                      </Button>
                    ) : (
                      <>
                        <Button
                          onClick={handleResetImage}
                          size="sm"
                          variant="outline"
                          className="bg-white hover:bg-gray-50 text-gray-700 shadow-lg"
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Reset Image
                        </Button>

                      </>
                    )}
                  </div>
                )}
                
                {/* Enhanced Image Indicator */}
                {showEnhancedImage && enhancedImageUrl && (
                  <div className="absolute top-4 right-4 z-30">
                    <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      AI Enhanced
                    </div>
                  </div>
                )}
                
                {/* CAROUSEL IMAGES */}
                {postData.imageUrls && postData.imageUrls.length > 0 ? (
                  <div className="w-full h-full flex flex-col">
                    {/* Carousel indicator */}
                    {postData.imageUrls && postData.imageUrls.length > 1 && (
                      <div className="absolute top-4 right-4 z-20 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-sm">
                        {postData.imageUrls.length} images
                      </div>
                    )}
                    
                    {/* Main preview image (current selected image) */}
                    <div className="relative flex-1">
                      {postData.imageUrls[currentImageIndex].match(/\.(mp4|webm|mov)$/i) ? (
                        <video
                          src={postData.imageUrls[currentImageIndex]}
                          controls
                          style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            zIndex: 0
                          }}
                          className={`transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                          onLoadedData={() => {
                            setImageLoading(false)
                            setImageLoadError(false)
                          }}
                          onError={() => {
                            setImageLoading(false)
                          }}
                        />
                      ) : (
                        <img 
                          src={currentImageIndex === 0 && showEnhancedImage && enhancedImageUrl ? enhancedImageUrl : postData.imageUrls[currentImageIndex]} 
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
                      )}
                    </div>
                    
                    {/* All carousel images in a row */}
                    {postData.imageUrls && postData.imageUrls.length > 0 && (
                      <div className="flex gap-2 p-4 bg-gray-100 border-t" style={{minHeight: '100px'}}>
                        {postData.imageUrls.map((imageUrl, index) => (
                          <div 
                            key={index}
                            className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                              index === currentImageIndex ? 'border-blue-500' : 'border-gray-300'
                            }`}
                            onClick={() => setCurrentImageIndex(index)}
                          >
                            {imageUrl.match(/\.(mp4|webm|mov)$/i) ? (
                              <video
                                src={imageUrl}
                                className="w-full h-full object-cover"
                                muted
                              />
                            ) : (
                              <img 
                                src={index === 0 && showEnhancedImage && enhancedImageUrl ? enhancedImageUrl : imageUrl} 
                                alt={`Carousel image ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            )}
                            {/* Image number indicator */}
                            <div className="absolute bottom-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                              {index + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Fallback for single image */}
                    {(!postData.imageUrls || postData.imageUrls.length === 0) && postData.imageUrl && (
                      <div className="flex gap-2 p-4 bg-gray-100 border-t" style={{minHeight: '100px'}}>
                        {process.env.NODE_ENV === 'development' && (
                          <div className="absolute top-0 left-0 z-30 bg-blue-500 text-white p-2 text-xs">
                            SINGLE IMAGE FALLBACK
                          </div>
                        )}
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-gray-300">
                          {postData.imageUrl.match(/\.(mp4|webm|mov)$/i) ? (
                            <video
                              src={postData.imageUrl}
                              className="w-full h-full object-cover"
                              muted
                            />
                                                      ) : (
                              <img 
                                src={showEnhancedImage && enhancedImageUrl ? enhancedImageUrl : postData.imageUrl} 
                                alt="Single image"
                                className="w-full h-full object-cover"
                              />
                            )}
                          <div className="absolute bottom-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                            1
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : postData.imageUrl && postData.imageUrl.trim() !== '' ? (
                  postData.imageUrl.match(/\.(mp4|webm|mov)$/i) ? (
                    <video
                      src={postData.imageUrl}
                      controls
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        zIndex: 0
                      }}
                      className={`transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                      onLoadedData={() => {
                        setImageLoading(false)
                        setImageLoadError(false)
                      }}
                      onError={() => {
                        setImageLoading(false)
                      }}
                    />
                  ) : (
                  <img 
                    src={showEnhancedImage && enhancedImageUrl ? enhancedImageUrl : postData.imageUrl} 
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
                  )
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                      <ImageIcon className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 opacity-50" />
                      <p className="text-base sm:text-lg font-medium">No Image Available</p>
                      <p className="text-xs sm:text-sm opacity-75">This post will use a beautiful gradient background</p>
                    </div>
                  </div>
                )}

              </div>
              



            </div>

            {/* Content Editor */}
            <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 space-y-5 sm:space-y-6">
              <h3 className="text-base sm:text-lg font-medium text-gray-900">Edit Content</h3>

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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hashtags
                </label>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {postData.hashtags.map((hashtag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        #{hashtag}
                        <button
                          onClick={() => {
                            const newHashtags = postData.hashtags.filter((_, i) => i !== index)
                            setPostData({ ...postData, hashtags: newHashtags })
                          }}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add hashtag (without #)"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const input = e.target as HTMLInputElement
                          const hashtag = input.value.trim().replace('#', '')
                          if (hashtag && !postData.hashtags.includes(hashtag)) {
                            setPostData({
                              ...postData,
                              hashtags: [...postData.hashtags, hashtag]
                            })
                            input.value = ''
                          }
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const input = document.querySelector('input[placeholder="Add hashtag (without #)"]') as HTMLInputElement
                        const hashtag = input.value.trim().replace('#', '')
                        if (hashtag && !postData.hashtags.includes(hashtag)) {
                          setPostData({
                            ...postData,
                            hashtags: [...postData.hashtags, hashtag]
                          })
                          input.value = ''
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
              <div className="flex gap-3">
                <Button
                  onClick={handleSave}
                  loading={saving}
                  className="flex-1"
                    variant="outline"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save as Draft
                </Button>
                </div>
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Post Actions</h4>
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => setShowScheduleModal(true)}
                      className="w-full"
                      variant="outline"
                    >
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Schedule Post
                    </Button>
                    <Button
                      onClick={handlePostNow}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Post Now
                    </Button>
                  </div>
                  
                  {/* Instagram Audio Requirement Info */}
                  {(postData.imageUrl?.includes('.mp4') || postData.imageUrls?.some(url => url.includes('.mp4'))) && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <svg className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-sm text-blue-800">
                          <p className="font-medium">Instagram Reels Audio Requirement</p>
                          <p className="text-xs mt-1">Videos posted to Instagram must have audio. If your video has no sound, please add background music before posting.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Schedule Modal */}
        {showScheduleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Schedule Post</h3>
              
              <div className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Schedule Time
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    min={new Date(Date.now() + 30 * 60000).toISOString().slice(0, 16)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum 30 minutes from now
                  </p>
                </div>
                {connectedPages.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Facebook Page / Instagram Account
                    </label>
                    <select
                      value={selectedPageId}
                      onChange={e => setSelectedPageId(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {connectedPages.map((page, idx) => (
                        <option key={page.id} value={page.id}>
                          {page.name || page.id}
                          {page.instagram_accounts && page.instagram_accounts.length > 0 ? ` (IG: ${page.instagram_accounts[0].username || page.instagram_accounts[0].id})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Platform
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="schedulePlatform"
                        value="facebook"
                        checked={schedulePlatform === 'facebook'}
                        onChange={() => setSchedulePlatform('facebook')}
                      />
                      Facebook (Recommended - No whitelist required)
                    </label>
                    <label className={`flex items-center gap-2 ${hasVideoWithoutAudio ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <input
                        type="radio"
                        name="schedulePlatform"
                        value="instagram"
                        checked={schedulePlatform === 'instagram'}
                        onChange={() => setSchedulePlatform('instagram')}
                        disabled={hasVideoWithoutAudio}
                      />
                      Instagram (Requires Meta whitelist approval)
                      {hasVideoWithoutAudio && (
                        <span className="text-red-600 text-xs ml-2">⚠️ Disabled - Video has no audio</span>
                      )}
                    </label>
                    <label className={`flex items-center gap-2 ${hasVideoWithoutAudio ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <input
                        type="radio"
                        name="schedulePlatform"
                        value="both"
                        checked={schedulePlatform === 'both'}
                        onChange={() => setSchedulePlatform('both')}
                        disabled={hasVideoWithoutAudio}
                      />
                      Both Facebook & Instagram
                      {hasVideoWithoutAudio && (
                        <span className="text-red-600 text-xs ml-2">⚠️ Disabled - Video has no audio</span>
                      )}
                    </label>
                  </div>
                  {hasVideoWithoutAudio && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <svg className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <div className="text-sm text-red-800">
                          <p className="font-medium">Instagram Posting Disabled</p>
                          <p className="text-xs mt-1">Your video has no audio. Instagram Reels require audio. Please add background music or sound to your video before posting to Instagram.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Post Preview</h4>
                  <p className="text-sm text-gray-700 mb-2">{postData?.caption}</p>
                  <div className="flex flex-wrap gap-1">
                    {postData?.hashtags.map((tag, index) => (
                      <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      setShowScheduleModal(false)
                      setError('')
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSchedulePost}
                    loading={schedulingLoading}
                    disabled={!scheduledTime || !selectedPageId || (hasVideoWithoutAudio && (schedulePlatform === 'instagram' || schedulePlatform === 'both'))}
                    className="flex-1 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Schedule Post
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showPostNowModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Where do you want to post?</h3>
              <div className="flex flex-col gap-3 mb-4">
                <label className={`flex items-center gap-2 ${hasVideoWithoutAudio ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <input
                    type="radio"
                    name="platform"
                    value="instagram"
                    checked={postNowPlatform === 'instagram'}
                    onChange={() => setPostNowPlatform('instagram')}
                    disabled={hasVideoWithoutAudio}
                  />
                  Instagram (default)
                  {hasVideoWithoutAudio && (
                    <span className="text-red-600 text-xs ml-2">⚠️ Disabled - Video has no audio</span>
                  )}
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
                <label className={`flex items-center gap-2 ${hasVideoWithoutAudio ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <input
                    type="radio"
                    name="platform"
                    value="both"
                    checked={postNowPlatform === 'both'}
                    onChange={() => setPostNowPlatform('both')}
                    disabled={hasVideoWithoutAudio}
                  />
                  Both Instagram & Facebook
                  {hasVideoWithoutAudio && (
                    <span className="text-red-600 text-xs ml-2">⚠️ Disabled - Video has no audio</span>
                  )}
                </label>
              </div>
              {hasVideoWithoutAudio && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <svg className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div className="text-sm text-red-800">
                      <p className="font-medium">Instagram Posting Disabled</p>
                      <p className="text-xs mt-1">Your video has no audio. Instagram Reels require audio. Please add background music or sound to your video before posting to Instagram.</p>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowPostNowModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmPostNow}
                  loading={saving}
                  disabled={hasVideoWithoutAudio && (postNowPlatform === 'instagram' || postNowPlatform === 'both')}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Post Now
                </Button>
              </div>
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PostEditorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading editor...</p>
        </div>
      </div>
    }>
      <PostEditorContent />
    </Suspense>
  )
} 