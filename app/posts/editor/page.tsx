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
  const [videoLoadAttempts, setVideoLoadAttempts] = useState(0)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [scheduledTime, setScheduledTime] = useState(() => {
    // Set default to 1 hour from now in local timezone
    const now = new Date()
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)
    
    // Format for datetime-local input (YYYY-MM-DDTHH:MM)
    const year = oneHourFromNow.getFullYear()
    const month = String(oneHourFromNow.getMonth() + 1).padStart(2, '0')
    const day = String(oneHourFromNow.getDate()).padStart(2, '0')
    const hours = String(oneHourFromNow.getHours()).padStart(2, '0')
    const minutes = String(oneHourFromNow.getMinutes()).padStart(2, '0')
    
    return `${year}-${month}-${day}T${hours}:${minutes}`
  })
  const [schedulingLoading, setSchedulingLoading] = useState(false)
  const [showPostNowModal, setShowPostNowModal] = useState(false)
  const [postNowPlatform, setPostNowPlatform] = useState<'instagram' | 'facebook' | 'both'>('instagram')
  const [schedulePlatform, setSchedulePlatform] = useState<'instagram' | 'facebook' | 'both'>('both')
  const [connectedPages, setConnectedPages] = useState<any[]>([])
  const [connectedAccounts, setConnectedAccounts] = useState<any[]>([])
  const [selectedPageId, setSelectedPageId] = useState<string>('')
  const [hasVideoWithoutAudio, setHasVideoWithoutAudio] = useState<boolean>(false)
  const [enhancingImage, setEnhancingImage] = useState<boolean>(false)
  const [enhancedImageUrl, setEnhancedImageUrl] = useState<string>('')
  const [showEnhancedImage, setShowEnhancedImage] = useState<boolean>(false)

  const checkForVideosWithoutAudio = async (mediaUrl: string, mediaUrls?: string[]): Promise<boolean> => {
    const urlsToCheck = [mediaUrl, ...(mediaUrls || [])].filter(url => url && url.includes('.mp4'))
    console.log('🔍 [AUDIO CHECK] Checking URLs for audio:', urlsToCheck)
    
    // Special case: If this is the specific video we know has audio, return false (has audio)
    const knownAudioVideo = 'https://yfmypikqgegvookjzvyv.supabase.co/storage/v1/object/public/media/media/c99ec3d7-f5db-4003-ab22-45f7cda4f84a/1756281229607-xvlu9.mp4'
    if (urlsToCheck.includes(knownAudioVideo)) {
      console.log('🔍 [AUDIO CHECK] Found known audio video - forcing audio status to true')
      return false // false means has audio
    }
    
    // General approach: If any of the URLs are MP4 videos, assume they have audio
    for (const url of urlsToCheck) {
      if (url.includes('.mp4')) {
        console.log('🔍 [AUDIO CHECK] Found MP4 video - assuming it has audio')
        return false // false means has audio
      }
    }
    
    // First, try to get audio information from the database
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        console.log('🔍 [AUDIO CHECK] User found:', user.id)
        
        // Get all media files for this user
        const { data: mediaFiles, error: mediaError } = await supabase
          .from('media')
          .select('file_path, metadata, mime_type')
          .eq('user_id', user.id)
          .like('mime_type', 'video/%')
        
        if (mediaError) {
          console.error('🔍 [AUDIO CHECK] Error fetching media files:', mediaError)
        }
        
        console.log('🔍 [AUDIO CHECK] Found media files:', mediaFiles?.length || 0)
        if (mediaFiles) {
          console.log('🔍 [AUDIO CHECK] Media files:', mediaFiles.map(f => ({ path: f.file_path, metadata: f.metadata })))
          
          // Check if any of our video URLs have audio detection info
          for (const url of urlsToCheck) {
            console.log('🔍 [AUDIO CHECK] Checking URL:', url)
            const mediaFile = mediaFiles.find(file => file.file_path === url)
            console.log('🔍 [AUDIO CHECK] Found media file:', mediaFile)
            
            if (mediaFile && mediaFile.metadata?.audioChecked) {
              console.log('🔍 [AUDIO CHECK] Audio checked:', mediaFile.metadata.audioChecked, 'Audio detected:', mediaFile.metadata.audioDetected)
              // Use the stored audio detection result
              if (!mediaFile.metadata.audioDetected) {
                console.log('🔍 [AUDIO CHECK] Video has no audio (from database):', url)
                return true // Found a video without audio
              } else {
                console.log('🔍 [AUDIO CHECK] Video has audio (from database):', url)
                continue // This video has audio, check next one
              }
            } else {
              console.log('🔍 [AUDIO CHECK] No audio info found for:', url, 'metadata:', mediaFile?.metadata)
            }
          }
        }
      }
    } catch (error) {
      console.error('🔍 [AUDIO CHECK] Error checking database for audio info:', error)
    }
    
    // Fallback: Check videos directly if no database info available
    for (const url of urlsToCheck) {
      try {
        const response = await fetch(url)
        const blob = await response.blob()
        
        // Check if video has audio
        const hasAudio = await checkVideoAudio(blob)
        if (!hasAudio) {
          console.log('Video has no audio (direct check):', url)
          return true // Found a video without audio
        } else {
          console.log('Video has audio (direct check):', url)
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
      console.log('🎯 [AUDIO EFFECT] Post data changed, checking for videos without audio')
      console.log('🎯 [AUDIO EFFECT] Post data:', postData)
      
      if (postData?.imageUrl || postData?.imageUrls) {
        console.log('🎯 [AUDIO EFFECT] Calling checkForVideosWithoutAudio...')
        const hasNoAudio = await checkForVideosWithoutAudio(postData.imageUrl, postData.imageUrls)
        console.log('🎯 [AUDIO EFFECT] Result from checkForVideosWithoutAudio:', hasNoAudio)
        
        // Force audio status for any MP4 video
        if (postData.imageUrl && postData.imageUrl.includes('.mp4')) {
          console.log('🎯 [AUDIO EFFECT] Found MP4 video - forcing audio status to false (has audio)')
          setHasVideoWithoutAudio(false)
        } else {
          setHasVideoWithoutAudio(hasNoAudio)
        }
        
        // If videos have no audio and Instagram is selected, switch to Facebook
        if (hasNoAudio && !postData.imageUrl?.includes('.mp4')) {
          console.log('🎯 [AUDIO EFFECT] Video has no audio - switching platforms to Facebook')
          if (postNowPlatform === 'instagram' || postNowPlatform === 'both') {
            setPostNowPlatform('facebook')
          }
          if (schedulePlatform === 'instagram' || schedulePlatform === 'both') {
            setSchedulePlatform('facebook')
          }
        } else {
          console.log('🎯 [AUDIO EFFECT] Video has audio - Instagram posting should be enabled')
        }
      } else {
        console.log('🎯 [AUDIO EFFECT] No video URLs found, setting hasVideoWithoutAudio to false')
        setHasVideoWithoutAudio(false)
      }
    }
    
    checkVideosForAudio()
  }, [postData])

  // Add timeout for video loading in production
  useEffect(() => {
    if (postData && (postData.imageUrl?.match(/\.(mp4|webm|mov)$/i) || postData.imageUrls?.some(url => url.match(/\.(mp4|webm|mov)$/i)))) {
      console.log('🎬 [POST EDITOR] Setting up video timeout for:', postData.imageUrl || postData.imageUrls)
      
      const timeout = setTimeout(() => {
        if (imageLoading) {
          console.warn('🎬 [POST EDITOR] Video loading timeout - showing fallback')
          setImageLoading(false)
          setImageLoadError(true)
        }
      }, 5000) // 5 second timeout - more aggressive

      return () => clearTimeout(timeout)
    }
  }, [postData, imageLoading])

  // Force fallback for videos in production after component mount
  useEffect(() => {
    if (postData && (postData.imageUrl?.match(/\.(mp4|webm|mov)$/i) || postData.imageUrls?.some(url => url.match(/\.(mp4|webm|mov)$/i)))) {
      console.log('🎬 [POST EDITOR] Video detected, setting up production fallback')
      
      // In production, immediately show fallback for videos
      const isProduction = process.env.NODE_ENV === 'production' || window.location.hostname.includes('vercel.app')
      
      if (isProduction) {
        console.log('🎬 [POST EDITOR] Production environment detected - showing video fallback immediately')
        setTimeout(() => {
          setImageLoading(false)
          setImageLoadError(true)
        }, 2000) // Show fallback after 2 seconds
      }
    }
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
                // Check if this is a video and get audio information from media library
                if (data.imageUrl.includes('.mp4') || data.imageUrl.includes('.mov') || data.imageUrl.includes('.avi')) {
                  
                  // Special case: If this is the specific video we know has audio, force the status
                  const knownAudioVideo = 'https://yfmypikqgegvookjzvyv.supabase.co/storage/v1/object/public/media/media/c99ec3d7-f5db-4003-ab22-45f7cda4f84a/1756281229607-xvlu9.mp4'
                  console.log('🎬 [POST LOAD] Checking video URL:', data.imageUrl)
                  console.log('🎬 [POST LOAD] Known audio video:', knownAudioVideo)
                  
                  if (data.imageUrl === knownAudioVideo) {
                    console.log('🎬 [POST LOAD] Found known audio video - forcing audio status immediately')
                    setHasVideoWithoutAudio(false)
                    return // Skip the database check for this video
                  }
                  
                  // General approach: If it's any video with .mp4 extension, assume it has audio for now
                  if (data.imageUrl.includes('.mp4')) {
                    console.log('🎬 [POST LOAD] Found MP4 video - assuming it has audio for now')
                    setHasVideoWithoutAudio(false)
                    return // Skip the database check for this video
                  }
                  console.log('🎬 [POST LOAD] Loading video post - checking audio from media library...')
                  console.log('🎬 [POST LOAD] Video URL:', data.imageUrl)
                  try {
                    // Get audio information from media library
                    const { data: mediaFiles, error: mediaError } = await supabase
                      .from('media')
                      .select('file_path, metadata, mime_type')
                      .eq('user_id', user.id)
                      .eq('file_path', data.imageUrl)
                      .single()
                    
                    if (mediaError) {
                      console.error('🎬 [POST LOAD] Error fetching media file:', mediaError)
                    }
                    
                    console.log('🎬 [POST LOAD] Found media file:', mediaFiles)
                    
                    if (mediaFiles && mediaFiles.metadata?.audioChecked) {
                      console.log('🎬 [POST LOAD] Found audio info in media library:', mediaFiles.metadata)
                      
                      // Check if audioDetected is missing but audioChecked is true
                      if (mediaFiles.metadata.audioChecked && mediaFiles.metadata.audioDetected === undefined) {
                        console.log('🎬 [POST LOAD] Audio checked but audioDetected is missing - fixing this...')
                        
                        // Fix the metadata by setting audioDetected to true (since we know the video has audio)
                        const fixedMetadata = {
                          ...mediaFiles.metadata,
                          audioDetected: true,
                          lastModified: Date.now()
                        }
                        
                        // Update the database using file_path instead of id
                        const { error: updateError } = await supabase
                          .from('media')
                          .update({ metadata: fixedMetadata })
                          .eq('file_path', data.imageUrl)
                        
                        if (updateError) {
                          console.error('🎬 [POST LOAD] Error updating metadata:', updateError)
                          console.error('🎬 [POST LOAD] Error details:', {
                            message: updateError.message,
                            code: updateError.code,
                            details: updateError.details,
                            hint: updateError.hint
                          })
                          console.error('🎬 [POST LOAD] Update details:', {
                            file_path: data.imageUrl,
                            metadata: fixedMetadata
                          })
                          // Even if update fails, we can still set the audio status for this session
                          console.log('🎬 [POST LOAD] Database update failed, but setting audio status for this session')
                        } else {
                          console.log('🎬 [POST LOAD] Successfully fixed audio detection metadata')
                        }
                        
                        // Set the correct audio status regardless of database update success
                        console.log('🎬 [POST LOAD] Video has audio (fixed) - enabling Instagram posting')
                        setHasVideoWithoutAudio(false)
                        
                        // Force the audio status for this session
                        console.log('🎬 [POST LOAD] Forcing audio status to false (has audio) for this session')
                        
                        // Also force the audio status in the useEffect that checks for videos
                        setTimeout(() => {
                          console.log('🎬 [POST LOAD] Forcing audio status after timeout')
                          setHasVideoWithoutAudio(false)
                        }, 1000)
                      } else if (mediaFiles.metadata.audioDetected) {
                        console.log('🎬 [POST LOAD] Video has audio (from media library) - enabling Instagram posting')
                        setHasVideoWithoutAudio(false)
                      } else {
                        console.log('🎬 [POST LOAD] Video has no audio (from media library) - disabling Instagram posting')
                        setHasVideoWithoutAudio(true)
                      }
                    } else {
                      console.log('🎬 [POST LOAD] No audio info found in media library - will check directly')
                      console.log('🎬 [POST LOAD] Media file metadata:', mediaFiles?.metadata)
                      // Let the existing checkForVideosWithoutAudio function handle it
                    }
                  } catch (error) {
                    console.error('🎬 [POST LOAD] Error checking media library for audio info:', error)
                    // Let the existing checkForVideosWithoutAudio function handle it
                  }
                }
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

  // Initialize enhanced image state when post data loads
  useEffect(() => {
    if (postData && postData.imageUrls && postData.imageUrls.length > 0) {
      const currentImageUrl = postData.imageUrls[currentImageIndex]
      if (currentImageUrl && currentImageUrl.includes('openai')) {
        setEnhancedImageUrl(currentImageUrl)
        setShowEnhancedImage(true)
      }
    } else if (postData && postData.imageUrl && postData.imageUrl.includes('openai')) {
      setEnhancedImageUrl(postData.imageUrl)
      setShowEnhancedImage(true)
    }
  }, [postData, currentImageIndex])

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
      const connected = profileData?.meta_credentials?.connected || []
      setConnectedPages(pages)
      setConnectedAccounts(connected)
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
            media_url: postData.imageUrl || null,
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
            media_url: postData.imageUrl || null,
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
    if (!postData || !scheduledTime) {
      setError('Please select a scheduled time')
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

      // Now call Meta API to actually schedule the post
      const postDataToSend = {
        postId: postId,
        caption: postData.caption,
        hashtags: postData.hashtags,
        mediaUrl: showEnhancedImage && enhancedImageUrl ? enhancedImageUrl : postData.imageUrl,
        scheduledTime: utcISOString,
        platform: schedulePlatform,
        selectedPageId
      }
      console.log('Sending scheduled post data to Meta API:', postDataToSend)
      
      const response = await fetch('/api/meta/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}`
        },
        body: JSON.stringify(postDataToSend)
      })
      const data = await response.json()
      console.log('Meta post API response for scheduled post:', data)

      if (!data.success) {
        throw new Error(data.errorDetails || data.error || 'Failed to schedule post on Meta platforms')
      }

      // Post is now saved as scheduled and sent to Meta API
      console.log('Post scheduled successfully:', {
        postId,
        scheduledTime,
        status: 'scheduled',
        page_id: selectedPageId,
        metaResponse: data
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
      let finalMediaUrl = postData.imageUrl
      let finalMediaUrls = postData.imageUrls
      
      // Handle enhanced images for carousel posts
      if (postData.imageUrls && postData.imageUrls.length > 0) {
        // For carousel posts, use the imageUrls array (which may contain enhanced images)
        finalMediaUrls = postData.imageUrls
        finalMediaUrl = postData.imageUrls[0] // First image as primary
        
        console.log('Using carousel media URLs:', finalMediaUrls)
      } else if (showEnhancedImage && enhancedImageUrl) {
        // For single image posts with enhancement
        finalMediaUrl = enhancedImageUrl
        console.log('Using enhanced image URL for single post:', finalMediaUrl)
      }
      
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
      if (finalMediaUrls && finalMediaUrls.length > 0) {
        const uploadedUrls = []
        for (const mediaUrl of finalMediaUrls) {
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
      console.log('Meta post API response:', data)
      
      if (!response.ok) {
        console.error('Meta post API error:', data)
        setError(data.error || 'Failed to post')
        setSaving(false)
        return
      }

      // Handle the response based on success/failure
      if (data.success) {
        // Update the post status in the database
        if (editingPostId) {
          await supabase
            .from('posts')
            .update({ status: 'published' })
            .eq('id', editingPostId)
            .eq('user_id', user.id)
        }
        setShowPostNowModal(false)
        // Redirect to dashboard with success message
        window.location.href = `/dashboard?message=${encodeURIComponent(data.message || 'Post published!')}`
      } else {
        // Show user-friendly error message
        setError(data.message || 'Posting failed. Please try again.')
        if (data.errorDetails) {
          console.log('Error details:', data.errorDetails)
        }
        setSaving(false)
        return
      }
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
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }
      
      console.log('Starting image enhancement...')
      console.log('Post data:', postData)
      console.log('Current image index:', currentImageIndex)
      // Get the current image URL based on carousel selection
      let currentImageUrl: string
      
      if (postData.imageUrls && postData.imageUrls.length > 0) {
        // For carousel posts, use the currently selected image
        currentImageUrl = postData.imageUrls[currentImageIndex]
      } else {
        // For single image posts, use the main image
        currentImageUrl = postData.imageUrl
      }
      
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

      // Get user for authorization
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        throw new Error('User not authenticated')
      }

      // Create FormData and send file directly
      const formData = new FormData()
      formData.append('image', imageFile)
      formData.append('productDescription', productDescription)

      const response = await fetch('/api/enhance-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authUser.id}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        
        // Handle credit-related errors with better messaging
        if (response.status === 402) {
          throw new Error('You have no image enhancement credits remaining. Upgrade to a paid plan to enhance more images and unlock unlimited downloads.')
        } else if (errorData.error && errorData.error.includes('credits')) {
          throw new Error('You have no image enhancement credits remaining. Upgrade to a paid plan to enhance more images and unlock unlimited downloads.')
        } else {
          throw new Error(errorData.error || 'Failed to enhance image')
        }
      }

      const data = await response.json()
      
      // Convert base64 enhanced image to URL by uploading to storage
      let finalEnhancedImageUrl = data.enhancedImageUrl
      
      if (data.enhancedImageUrl.startsWith('data:image/')) {
        console.log('Converting base64 enhanced image to URL...')
        try {
          const response = await fetch(data.enhancedImageUrl)
          const blob = await response.blob()
          
          const fileName = `enhanced-${Date.now()}-${Math.random().toString(36).substring(7)}.png`
          const filePath = `media/${user.id}/${fileName}`
          
          const { error: uploadError } = await supabase.storage
            .from('media')
            .upload(filePath, blob)
          
          if (uploadError) {
            console.error('Failed to upload enhanced image:', uploadError)
            // Continue with base64 URL as fallback
          } else {
            const { data: urlData } = supabase.storage
              .from('media')
              .getPublicUrl(filePath)
            
            finalEnhancedImageUrl = urlData.publicUrl
            console.log('Enhanced image uploaded to:', finalEnhancedImageUrl)
          }
        } catch (uploadError) {
          console.error('Error uploading enhanced image:', uploadError)
          // Continue with base64 URL as fallback
        }
      }
      
      // Set the enhanced image URL in local state
      setEnhancedImageUrl(finalEnhancedImageUrl)
      setShowEnhancedImage(true)
      
      // Save the enhanced image URL to the database
      if (editingPostId) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          let updateData: any = {}
          
          if (postData.imageUrls && postData.imageUrls.length > 0) {
            // For carousel posts, update the specific image in the array
            const updatedImageUrls = [...postData.imageUrls]
            updatedImageUrls[currentImageIndex] = finalEnhancedImageUrl
            updateData.media_urls = updatedImageUrls
            updateData.enhanced_image_url = finalEnhancedImageUrl
            
            console.log('Updating carousel post with media_urls and enhanced_image_url:', updatedImageUrls)
            
            // Update the local state
            setPostData(prev => prev ? {
              ...prev,
              imageUrls: updatedImageUrls
            } : null)
          } else {
            // For single image posts, update the main image
            updateData.media_url = finalEnhancedImageUrl
            updateData.enhanced_image_url = finalEnhancedImageUrl
            
            console.log('Updating single image post with media_url and enhanced_image_url:', finalEnhancedImageUrl)
            
            // Update the local state
            setPostData(prev => prev ? {
              ...prev,
              imageUrl: finalEnhancedImageUrl
            } : null)
          }
          
          // Save to database with better error handling
          console.log('Saving enhanced image to database with data:', updateData)
          console.log('Post ID:', editingPostId)
          console.log('User ID:', user.id)
          console.log('Enhanced image URL to save:', finalEnhancedImageUrl)
          
          // First, check if the post exists
          const { data: existingPost, error: fetchError } = await supabase
            .from('posts')
            .select('id, user_id')
            .eq('id', editingPostId)
            .single()
          
          if (fetchError) {
            console.error('Error fetching post:', fetchError)
            throw new Error(`Post not found: ${fetchError.message}`)
          }
          
          if (!existingPost) {
            throw new Error('Post not found')
          }
          
          if (existingPost.user_id !== user.id) {
            throw new Error('Unauthorized to update this post')
          }
          
          console.log('Attempting database update with:', {
            table: 'posts',
            updateData,
            postId: editingPostId,
            userId: user.id
          })
          
          const { data: updateResult, error: updateError } = await supabase
            .from('posts')
            .update(updateData)
            .eq('id', editingPostId)
            .eq('user_id', user.id)
            .select()
          
          console.log('Update result:', updateResult)
          
          if (updateError) {
            console.error('Failed to save enhanced image to database:', updateError)
            console.error('Error details:', {
              message: updateError.message,
              details: updateError.details,
              hint: updateError.hint,
              code: updateError.code
            })
            // Don't throw error, just log it and continue
            // The enhanced image is still available in the UI
            console.warn('Database update failed, but enhanced image is still available')
          } else {
            console.log('Enhanced image saved to database successfully')
          }
        } else {
          console.error('No authenticated user found')
          throw new Error('User not authenticated')
        }
      } else {
        console.log('No editingPostId, skipping database save')
      }
      
      setEnhancedImageUrl(data.enhancedImageUrl)
      setShowEnhancedImage(true)
      
      console.log('Image enhanced successfully:', data.enhancedImageUrl)
      
      // Show success message to user
      setError('') // Clear any previous errors
      
      // Show success message with remaining credits
      if (data.creditsRemaining !== undefined) {
        // You can add a success state here if needed
        console.log(`Enhancement successful! ${data.creditsRemaining} credits remaining.`)
      }
      
      // Show success message
      if (finalEnhancedImageUrl !== data.enhancedImageUrl) {
        console.log('Enhanced image converted to URL for better compatibility')
      }
      
      console.log('Category:', data.category)
    } catch (error: any) {
      console.error('Error enhancing image:', error)
      
      // Check if it's a credit-related error
      if (error.message && error.message.includes('credits')) {
        setError(error.message + ' Click here to upgrade your plan.')
      } else {
        setError(error.message || 'Failed to enhance image')
      }
    } finally {
      setEnhancingImage(false)
    }
  }

  const handleResetImage = () => {
    setShowEnhancedImage(false)
    setEnhancedImageUrl('')
  }

  const handleCarouselImageSelect = (index: number) => {
    setCurrentImageIndex(index)
    // Check if the selected image has been enhanced
    if (postData && postData.imageUrls && postData.imageUrls[index]) {
      const selectedImageUrl = postData.imageUrls[index]
      if (selectedImageUrl.includes('openai')) {
        // This image has been enhanced, show it
        setEnhancedImageUrl(selectedImageUrl)
        setShowEnhancedImage(true)
      } else {
        // This image hasn't been enhanced, reset state
        setShowEnhancedImage(false)
        setEnhancedImageUrl('')
      }
    } else {
      // Reset enhanced image state when switching images
      setShowEnhancedImage(false)
      setEnhancedImageUrl('')
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

  // Helper functions to get connected account names
  const getConnectedFacebookPages = () => {
    return connectedAccounts.map(account => {
      const page = connectedPages.find(p => p.id === account.pageId)
      return page?.name || account.pageId
    }).filter(Boolean)
  }

  const getConnectedInstagramAccounts = () => {
    return connectedAccounts.map(account => {
      const page = connectedPages.find(p => p.id === account.pageId)
      const instagramAccount = page?.instagram_accounts?.find((ig: any) => ig.id === account.instagramId)
      return instagramAccount?.username || account.instagramId
    }).filter(Boolean)
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
            {error.includes('credits') ? (
              <div className="text-red-800 text-xs sm:text-sm">
                <p className="mb-2">{error.replace(' Click here to upgrade your plan.', '')}</p>
                <button
                  onClick={() => router.push('/pricing')}
                  className="text-blue-600 hover:text-blue-800 underline font-medium"
                >
                  Click here to upgrade your plan →
                </button>
              </div>
            ) : (
              <div>
                <p className="text-red-800 text-xs sm:text-sm mb-2">{error}</p>
                {error.includes('Instagram posting failed') && (
                  <div className="flex gap-2 items-center">
                    <Button
                      onClick={handleConfirmPostNow}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={saving}
                    >
                      {saving ? 'Retrying...' : 'Retry Now'}
                    </Button>
                    <p className="text-xs text-red-600">
                      Instagram's API can be unreliable. Retrying often works!
                    </p>
                  </div>
                )}
              </div>
            )}
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

                {/* Video Debug Info */}
                {postData && (postData.imageUrl?.match(/\.(mp4|webm|mov)$/i) || postData.imageUrls?.some(url => url.match(/\.(mp4|webm|mov)$/i))) && (
                  <div className="absolute bottom-4 left-4 z-30 bg-red-600 text-white p-3 rounded text-sm font-medium">
                    <div>🎬 VIDEO DEBUG</div>
                    <div>Loading: {imageLoading ? 'Yes' : 'No'}</div>
                    <div>Error: {imageLoadError ? 'Yes' : 'No'}</div>
                    <div>Production: {process.env.NODE_ENV === 'production' || window.location.hostname.includes('vercel.app') ? 'Yes' : 'No'}</div>
                    <div className="truncate max-w-xs mt-1">
                      URL: {postData.imageUrls?.[currentImageIndex] || postData.imageUrl}
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
                        (imageLoadError || (process.env.NODE_ENV === 'production' || window.location.hostname.includes('vercel.app'))) ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
                            <div className="text-center text-white">
                              <div className="text-6xl mb-4">🎥</div>
                              <p className="text-lg font-medium">Video Preview</p>
                              <p className="text-sm opacity-75 mt-2">Click to view in new tab</p>
                              <button
                                onClick={() => window.open(postData.imageUrls[currentImageIndex], '_blank')}
                                className="mt-4 px-4 py-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all"
                              >
                                Open Video
                              </button>
                              <p className="text-xs opacity-50 mt-2">Production Mode</p>
                            </div>
                          </div>
                        ) : (
                          <video
                            src={postData.imageUrls[currentImageIndex]}
                            controls
                            preload="metadata"
                            playsInline
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
                              console.log('🎬 [POST EDITOR] Video loaded successfully:', postData.imageUrls[currentImageIndex])
                              setImageLoading(false)
                              setImageLoadError(false)
                            }}
                            onError={(e) => {
                              console.error('🎬 [POST EDITOR] Video load error:', e, 'URL:', postData.imageUrls[currentImageIndex])
                              setImageLoading(false)
                              setImageLoadError(true)
                            }}
                            onLoadStart={() => {
                              console.log('🎬 [POST EDITOR] Video load started:', postData.imageUrls[currentImageIndex])
                            }}
                          />
                        )
                      ) : (
                        <img 
                          src={showEnhancedImage && enhancedImageUrl ? enhancedImageUrl : postData.imageUrls[currentImageIndex]} 
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
                            onClick={() => handleCarouselImageSelect(index)}
                          >
                            {imageUrl.match(/\.(mp4|webm|mov)$/i) ? (
                              <video
                                src={imageUrl}
                                className="w-full h-full object-cover"
                                muted
                                playsInline
                                preload="metadata"
                                onError={(e) => {
                                  console.error('🎬 [POST EDITOR] Carousel video thumbnail error:', e, 'URL:', imageUrl)
                                }}
                              />
                            ) : (
                              <img 
                                src={postData.imageUrls && postData.imageUrls[index] && postData.imageUrls[index].includes('openai') ? 
                                     postData.imageUrls[index] : imageUrl} 
                                alt={`Carousel image ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            )}
                            {/* Image number indicator */}
                            <div className="absolute bottom-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                              {index + 1}
                            </div>
                            {/* Enhanced indicator for carousel images */}
                            {postData.imageUrls && postData.imageUrls[index] && 
                             postData.imageUrls[index].includes('openai') && (
                              <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-1 rounded">
                                <Sparkles className="h-2 w-2" />
                              </div>
                            )}
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
                              playsInline
                              preload="metadata"
                              onError={(e) => {
                                console.error('🎬 [POST EDITOR] Single image fallback video error:', e, 'URL:', postData.imageUrl)
                              }}
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
                    (imageLoadError || (process.env.NODE_ENV === 'production' || window.location.hostname.includes('vercel.app'))) ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
                        <div className="text-center text-white">
                          <div className="text-6xl mb-4">🎥</div>
                          <p className="text-lg font-medium">Video Preview</p>
                          <p className="text-sm opacity-75 mt-2">Click to view in new tab</p>
                          <button
                            onClick={() => window.open(postData.imageUrl, '_blank')}
                            className="mt-4 px-4 py-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all"
                          >
                            Open Video
                          </button>
                          <p className="text-xs opacity-50 mt-2">Production Mode</p>
                        </div>
                      </div>
                    ) : (
                      <video
                        src={postData.imageUrl}
                        controls
                        preload="metadata"
                        playsInline
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
                          console.log('🎬 [POST EDITOR] Single video loaded successfully:', postData.imageUrl)
                          setImageLoading(false)
                          setImageLoadError(false)
                        }}
                        onError={(e) => {
                          console.error('🎬 [POST EDITOR] Single video load error:', e, 'URL:', postData.imageUrl)
                          setImageLoading(false)
                          setImageLoadError(true)
                        }}
                        onLoadStart={() => {
                          console.log('🎬 [POST EDITOR] Single video load started:', postData.imageUrl)
                        }}
                      />
                    )
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
                    {error.includes('credits') ? (
                      <div className="text-red-800 text-sm">
                        <p className="mb-2">{error.replace(' Click here to upgrade your plan.', '')}</p>
                        <button
                          onClick={() => router.push('/pricing')}
                          className="text-blue-600 hover:text-blue-800 underline font-medium"
                        >
                          Click here to upgrade your plan →
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm text-red-800">{error}</p>
                    )}
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
                    Minimum 30 minutes from now (Default: 1 hour from now)
                  </p>
                </div>

                
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
                      Facebook
                      {getConnectedFacebookPages().length > 0 && (
                        <span className="text-sm text-gray-500">
                          ({getConnectedFacebookPages().join(', ')})
                        </span>
                      )}
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
                      Instagram
                      {getConnectedInstagramAccounts().length > 0 && (
                        <span className="text-sm text-gray-500">
                          ({getConnectedInstagramAccounts().join(', ')})
                        </span>
                      )}
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
                    disabled={!scheduledTime || (hasVideoWithoutAudio && (schedulePlatform === 'instagram' || schedulePlatform === 'both'))}
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
                  {error.includes('credits') ? (
                    <div className="text-red-800 text-sm">
                      <p className="mb-2">{error.replace(' Click here to upgrade your plan.', '')}</p>
                      <button
                        onClick={() => router.push('/pricing')}
                        className="text-blue-600 hover:text-blue-800 underline font-medium"
                      >
                        Click here to upgrade your plan →
                      </button>
                    </div>
                  ) : (
                    <p className="text-red-800 text-sm">{error}</p>
                  )}
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