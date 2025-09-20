'use client'

import { useState, useEffect, useRef } from 'react'
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
  ArrowLeft,
  Clock,
  CheckCircle,
  FileText,
  Hash,
  Image as ImageIcon,
  RotateCcw
} from 'lucide-react'

const VideoThumbnail = ({
  src,
  fileName,
  className,
}: {
  src: string
  fileName: string
  className: string
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [showControls, setShowControls] = useState(false)

  const handlePlay = () => {
    setIsPlaying(true)
  }

  const handlePause = () => {
    setIsPlaying(false)
  }

  const handleError = () => {
    setHasError(true)
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play().catch(console.error)
      }
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted
      setIsMuted(videoRef.current.muted)
    }
  }

  if (hasError) {
    return (
      <div className={`${className} bg-gray-200 flex items-center justify-center group relative overflow-hidden`}>
        <div className="text-gray-500 text-center">
          <div className="text-lg mb-1">🎥</div>
          <div className="text-xs">Video Error</div>
          <div className="text-xs opacity-75 mt-1 truncate max-w-full px-2">{fileName}</div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`${className} bg-gray-200 flex items-center justify-center group relative overflow-hidden cursor-pointer`}
      onClick={togglePlay}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => {
        setShowControls(false)
        // Only pause if not hovering over controls
        if (videoRef.current && isPlaying) {
          videoRef.current.pause()
        }
      }}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-cover"
        muted={isMuted}
        playsInline
        loop
        onPlay={handlePlay}
        onPause={handlePause}
        onError={handleError}
        onMouseEnter={(e) => {
          e.currentTarget.play().catch(console.error)
        }}
      />

      {/* Play button overlay when not playing */}
      {!isPlaying && (
        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
          <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-full p-2 shadow-2xl hover:bg-opacity-100 hover:scale-110 transition-all duration-200 cursor-pointer">
            <svg className="w-4 h-4 text-gray-800 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      )}

      {/* Volume control when playing and hovering */}
      {isPlaying && showControls && (
        <div 
          className="absolute top-2 right-2"
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(false)}
        >
          <div
            onClick={(e) => {
              e.stopPropagation()
              toggleMute()
            }}
            className="bg-black bg-opacity-70 hover:bg-opacity-90 rounded-full p-1.5 shadow-lg hover:scale-110 transition-all duration-200 backdrop-blur-sm cursor-pointer"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
              </svg>
            ) : (
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Filename */}
      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
        {fileName}
      </div>
    </div>
  )
}

interface WeeklyPost {
  id: string
  day: string
  theme: string
  caption: string
  hashtags: string[]
  imagePrompt: string
  status: 'pending' | 'generated' | 'approved'
  selectedImage?: any | null
  selectedImages?: any[]
  scheduledFor?: string
}

export default function WeeklyPage() {
  const [posts, setPosts] = useState<WeeklyPost[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [platform, setPlatform] = useState<'instagram' | 'facebook'>('instagram')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [media, setMedia] = useState<any[]>([])
  const [mediaLoading, setMediaLoading] = useState(false)
  const [mediaError, setMediaError] = useState('')
  const [imageSelections, setImageSelections] = useState<{ [day: string]: any[] }>({})
  const [mediaModalDay, setMediaModalDay] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [editingPost, setEditingPost] = useState<string | null>(null)
  const [editCaption, setEditCaption] = useState('')
  const [editHashtags, setEditHashtags] = useState('')
  const [editScheduledFor, setEditScheduledFor] = useState<string | null>(null)
  const [enhancingImage, setEnhancingImage] = useState<{ [postId: string]: { [imageIndex: number]: boolean } }>({})
    const [enhancedImages, setEnhancedImages] = useState<{ [postId: string]: { [imageIndex: number]: string } }>({})
    const [showEnhancedImages, setShowEnhancedImages] = useState<{ [postId: string]: { [imageIndex: number]: boolean } }>({})
    const [imageErrors, setImageErrors] = useState<{ [postId: string]: { [imageIndex: number]: string } }>({})
    const [contentGenerated, setContentGenerated] = useState(false)
  const [modalSelectedImages, setModalSelectedImages] = useState<any[]>([])
  const [defaultTime, setDefaultTime] = useState('11:00')
  
  const router = useRouter()

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
    fetchMedia()
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()
        
        if (profile) {
          console.log('Fetched user profile:', profile)
          setUserProfile(profile)
        } else {
          console.log('No user profile found for user:', user.id)
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

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

  const generateWeeklyContent = async () => {
    if (Object.values(imageSelections).flat().length === 0) {
      setError('Please select at least one image to generate content')
      return
    }

    if (!userProfile) {
      setError('Please complete your profile setup first')
      return
    }

    // Check if user has completed their business profile
    if (!userProfile.business_name || userProfile.business_name === '') {
      setError('Please complete your business profile setup first. Go to Settings to add your business details.')
      return
    }

    setGenerating(true)
    setError('')
    setSuccess('')

    // Get user for Authorization header
    const { data: { user } } = await supabase.auth.getUser();

    try {
      console.log('Sending userProfile to API:', userProfile)
      // Call the server-side API to generate content
      const response = await fetch('/api/generate-weekly-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user?.id ? { 'Authorization': `Bearer ${user.id}` } : {})
        },
        body: JSON.stringify({
          imageSelections,
          userProfile,
          platform
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate content')
      }

      const data = await response.json()
      console.log('Generated weekly content:', data.generatedPosts)

      // Update posts with generated content
      const updatedPosts = posts.map((post, index) => {
        const dayKey = upcomingWeekDays[index]?.day + upcomingWeekDays[index]?.date
        const selectedImages = imageSelections[dayKey]
        
        // Only update posts with images
        if (!selectedImages || selectedImages.length === 0) {
            return {
              ...post,
            status: 'pending' as const,
            selectedImage: null
            }
        }

        // Find the generated content for this day
        const generatedPost = data.generatedPosts.find((gp: any) => gp.dayKey === dayKey)
        
        if (generatedPost) {
            // Use the actual date from upcomingWeekDays instead of calculating next week
            const actualDate = upcomingWeekDays[index]?.dateObj
            if (actualDate) {
              // Set the time from defaultTime
              const [hours, minutes] = defaultTime.split(':').map(Number)
              actualDate.setHours(hours, minutes, 0, 0)
            }
            
            return {
              ...post,
            theme: generatedPost.theme,
            caption: generatedPost.caption,
            hashtags: generatedPost.hashtags,
            imagePrompt: generatedPost.imagePrompt,
            status: 'generated' as const,
            selectedImage: generatedPost.selectedImages[0],
            selectedImages: generatedPost.selectedImages, // <-- use backend array
            scheduledFor: actualDate ? actualDate.toISOString() : getNextWeekDate(post.day, defaultTime)
            }
          }

        // Fallback if no generated content found
        return {
          ...post,
          status: 'pending' as const,
          selectedImage: selectedImages[0]
        }
      })

      setPosts(updatedPosts)
      setSuccess('Weekly content generated successfully!')
      
      // Clear the image selections and mark content as generated
      setImageSelections({})
      setContentGenerated(true)
    } catch (error: any) {
      console.error('Error generating weekly content:', error)
      setError(error.message || 'Failed to generate content. Please try again.')
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

      // Save only generated posts with images
      const postsToSave = posts
        .filter(post => post.status === 'generated' && (post.selectedImage || (post.selectedImages && post.selectedImages.length > 0)))
        .map(post => {
          // Determine if this is a carousel post
          const isCarousel = post.selectedImages && post.selectedImages.length > 1
          
          // Use enhanced images if available, otherwise use original images
          const mediaUrls = isCarousel 
            ? post.selectedImages!.map((img, idx) => {
                // Check if there's an enhanced image for this index
                const enhancedImage = enhancedImages[post.id]?.[idx]
                return enhancedImage || img.file_path
              })
            : []
          
          const mediaUrl = isCarousel 
            ? (enhancedImages[post.id]?.[0] || post.selectedImages![0].file_path)
            : (enhancedImages[post.id]?.[0] || post.selectedImage?.file_path)
          
          return {
            user_id: user.id,
            caption: post.caption,
            hashtags: post.hashtags,
            platform: platform,
            status: 'draft',
            scheduled_for: post.scheduledFor || getNextWeekDate(post.day),
            media_url: mediaUrl,
            media_urls: mediaUrls,
            enhanced_image_url: isCarousel ? (enhancedImages[post.id]?.[0] || null) : (enhancedImages[post.id]?.[0] || null),
            theme: post.theme,
            content_type: 'weekly',
            business_context: `Day: ${post.day}, Image Prompt: ${post.imagePrompt}`
          }
        })

      if (postsToSave.length === 0) {
        setError('No posts to save. Please generate content first.')
        return
      }

      const { error } = await supabase
        .from('posts')
        .insert(postsToSave)

      if (error) throw error

      setSuccess('Weekly content saved successfully!')
      router.push('/dashboard')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const scheduleWeeklyContent = async () => {
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Schedule only generated posts with images
      const postsToSchedule = posts
        .filter(post => post.status === 'generated' && (post.selectedImage || (post.selectedImages && post.selectedImages.length > 0)))
        .map(post => {
          // Determine if this is a carousel post
          const isCarousel = post.selectedImages && post.selectedImages.length > 1
          
          // Use enhanced images if available, otherwise use original images
          const mediaUrls = isCarousel 
            ? post.selectedImages!.map((img, idx) => {
                // Check if there's an enhanced image for this index
                const enhancedImage = enhancedImages[post.id]?.[idx]
                return enhancedImage || img.file_path
              })
            : []
          
          const mediaUrl = isCarousel 
            ? (enhancedImages[post.id]?.[0] || post.selectedImages![0].file_path)
            : (enhancedImages[post.id]?.[0] || post.selectedImage?.file_path)
          
          return {
            user_id: user.id,
            caption: post.caption,
            hashtags: post.hashtags,
            platform: platform,
            status: 'scheduled',
            scheduled_for: post.scheduledFor || getNextWeekDate(post.day),
            media_url: mediaUrl,
            media_urls: mediaUrls,
            enhanced_image_url: isCarousel ? (enhancedImages[post.id]?.[0] || null) : (enhancedImages[post.id]?.[0] || null),
            theme: post.theme,
            content_type: 'weekly',
            business_context: `Day: ${post.day}, Image Prompt: ${post.imagePrompt}`
          }
        })

      if (postsToSchedule.length === 0) {
        setError('No posts to schedule. Please generate content first.')
        return
      }

      const { error } = await supabase
        .from('posts')
        .insert(postsToSchedule)

      if (error) throw error

      setSuccess('Weekly content scheduled successfully!')
      setTimeout(() => {
        router.push('/calendar')
      }, 2000)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const getNextWeekDate = (dayName: string, time: string = '11:00') => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const today = new Date()
    const targetDay = days.indexOf(dayName)
    const currentDay = today.getDay()
    const daysToAdd = (targetDay - currentDay + 7) % 7
    const nextWeekDate = new Date(today)
    nextWeekDate.setDate(today.getDate() + daysToAdd + 7) // Next week
    
    // Parse time and set hours/minutes
    const [hours, minutes] = time.split(':').map(Number)
    nextWeekDate.setHours(hours, minutes, 0, 0)
    
    return nextWeekDate.toISOString()
  }

  const fetchMedia = async () => {
    setMediaLoading(true)
    setMediaError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      setMedia(data || [])
    } catch (err: any) {
      setMediaError(err.message)
    } finally {
      setMediaLoading(false)
    }
  }

  const startEditing = (postId: string, caption: string, hashtags: string[], scheduledFor?: string) => {
    setEditingPost(postId)
    setEditCaption(caption)
    setEditHashtags(hashtags.join(' '))
    setEditScheduledFor(scheduledFor ? new Date(scheduledFor).toISOString().slice(0, 16) : null)
  }

  const saveEdit = (postId: string) => {
    const hashtagsArray = editHashtags
      .split(' ')
      .filter(tag => tag.trim() !== '')
      .map(tag => tag.startsWith('#') ? tag : `#${tag}`)

    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { ...post, caption: editCaption, hashtags: hashtagsArray, scheduledFor: editScheduledFor ? new Date(editScheduledFor).toISOString() : post.scheduledFor }
          : post
      )
    )
    setEditingPost(null)
    setEditCaption('')
    setEditHashtags('')
    setEditScheduledFor(null)
  }

  const cancelEdit = () => {
    setEditingPost(null)
    setEditCaption('')
    setEditHashtags('')
    setEditScheduledFor(null)
  }

  // Helper to get the next 7 real calendar days (local time)
  function formatScheduledDate(date: Date): string {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const day = dayNames[date.getDay()];
    const month = monthNames[date.getMonth()];
    const dayNum = date.getDate();
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}, ${month} ${dayNum}, ${year} at ${hours}:${minutes}`;
  }

  // Helper function to format date and time consistently
  const formatDateTime = (date: Date): string => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const day = dayNames[date.getDay()];
    const month = monthNames[date.getMonth()];
    const dayNum = date.getDate();
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}, ${month} ${dayNum}, ${year} at ${hours}:${minutes}`;
  }

  // Update all posts with new default time
  const updateAllPostTimes = (newTime: string) => {
    setPosts(prevPosts => 
      prevPosts.map((post, index) => {
        // Use the actual date from upcomingWeekDays
        const actualDate = upcomingWeekDays[index]?.dateObj
        if (actualDate) {
          const [hours, minutes] = newTime.split(':').map(Number)
          actualDate.setHours(hours, minutes, 0, 0)
          return {
            ...post,
            scheduledFor: actualDate.toISOString()
          }
        }
        // Fallback to old method if no actual date
        return {
          ...post,
          scheduledFor: getNextWeekDate(post.day, newTime)
        }
      })
    )
  }

  // Update individual post time
  const updatePostTime = (postId: string, newTime: string) => {
    setPosts(prevPosts => 
      prevPosts.map((post, index) => {
        if (post.id === postId) {
          // Use the actual date from upcomingWeekDays
          const actualDate = upcomingWeekDays[index]?.dateObj
          if (actualDate) {
            const [hours, minutes] = newTime.split(':').map(Number)
            actualDate.setHours(hours, minutes, 0, 0)
            return {
              ...post,
              scheduledFor: actualDate.toISOString()
            }
          }
          // Fallback to old method if no actual date
          return {
            ...post,
            scheduledFor: getNextWeekDate(post.day, newTime)
          }
        }
        return post
      })
    )
  }

  const handleEnhanceImage = async (postId: string, imageUrl: string, caption: string, imageIndex: number) => {
    setEnhancingImage(prev => ({ 
      ...prev, 
      [postId]: { 
        ...(prev[postId] || {}), 
        [imageIndex]: true 
      } 
      }))
      setError('')
      // Clear any previous error for this specific image
      setImageErrors(prev => {
        const newState = { ...prev }
        if (newState[postId]) {
          delete newState[postId][imageIndex]
          if (Object.keys(newState[postId]).length === 0) {
            delete newState[postId]
          }
        }
        return newState
      })

      try {
      // Convert image URL to file
      let imageFile: File
      
      if (imageUrl.startsWith('blob:')) {
        // For blob URLs, fetch the blob and create a file
        const response = await fetch(imageUrl)
        const blob = await response.blob()
        imageFile = new File([blob], 'image.jpg', { type: blob.type })
      } else if (imageUrl.startsWith('data:')) {
        // For data URLs, convert to blob and create file
        const response = await fetch(imageUrl)
        const blob = await response.blob()
        imageFile = new File([blob], 'image.jpg', { type: blob.type })
      } else {
        // For external URLs, fetch and create file
        const response = await fetch(imageUrl)
        const blob = await response.blob()
        imageFile = new File([blob], 'image.jpg', { type: blob.type })
      }

      // Get user session for authorization
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('User not authenticated')
      }

      // Create FormData and send file directly
      const formData = new FormData()
      formData.append('image', imageFile)
      formData.append('productDescription', caption)

      const response = await fetch('/api/enhance-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        
        // Handle safety violations with user-friendly message
        if (errorData.errorType === 'safety_violation') {
          throw new Error('This image cannot be enhanced due to content policy restrictions. Please try with a different image.')
        }
        
        throw new Error(errorData.error || 'Failed to enhance image')
      }

      const data = await response.json()
      setEnhancedImages(prev => ({ 
        ...prev, 
        [postId]: { 
          ...(prev[postId] || {}), 
          [imageIndex]: data.enhancedImageUrl 
        } 
      }))
      setShowEnhancedImages(prev => ({ 
        ...prev, 
        [postId]: { 
          ...(prev[postId] || {}), 
          [imageIndex]: true 
        } 
      }))
      
      console.log('Image enhanced successfully:', data.enhancedImageUrl)
      
      // Show success message with remaining credits
      if (data.creditsRemaining !== undefined) {
        setSuccess(`Image enhanced successfully! ${data.creditsRemaining} enhancement credits remaining.`)
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000)
      }
      } catch (error: any) {
        console.error('Error enhancing image:', error)
        // Set error for this specific image instead of global error
        setImageErrors(prev => ({ 
          ...prev, 
          [postId]: { 
            ...(prev[postId] || {}), 
            [imageIndex]: error.message || 'Failed to enhance image'
          } 
        }))
      } finally {
      setEnhancingImage(prev => ({ 
        ...prev, 
        [postId]: { 
          ...(prev[postId] || {}), 
          [imageIndex]: false 
        } 
      }))
    }
  }

  const handleResetImage = (postId: string, imageIndex: number) => {
    setShowEnhancedImages(prev => ({ 
      ...prev, 
      [postId]: { 
        ...(prev[postId] || {}), 
        [imageIndex]: false 
      } 
    }))
    setEnhancedImages(prev => {
      const newState = { ...prev }
      if (newState[postId]) {
        delete newState[postId][imageIndex]
        if (Object.keys(newState[postId]).length === 0) {
          delete newState[postId]
        }
      }
      return newState
    })
    // Clear any error for this image
    setImageErrors(prev => {
      const newState = { ...prev }
      if (newState[postId]) {
        delete newState[postId][imageIndex]
        if (Object.keys(newState[postId]).length === 0) {
          delete newState[postId]
        }
      }
      return newState
    })
  }

  function getUpcomingWeekDays() {
    const days: { day: string; date: string; dateObj: Date }[] = [];
    const today = new Date();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    for (let i = 1; i <= 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dayName = dayNames[d.getDay()];
      const dateStr = `${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      days.push({ day: dayName, date: dateStr, dateObj: d });
    }
    return days;
  }
  const upcomingWeekDays = getUpcomingWeekDays();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
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
              <Calendar className="h-6 w-6 text-green-600 mr-2" />
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                Weekly Content Generator
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
        {success && (
          <div className="mb-4 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-xs sm:text-sm">{success}</p>
          </div>
        )}
        {/* Image selection for each day of the week - Only show if content not generated */}
        {!contentGenerated && (
          <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 mb-6 sm:mb-8">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Add Images for Each Day (Optional, up to 10 per day)</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 sm:gap-4">
              {upcomingWeekDays.map(({ day, date }) => (
                <div key={day + date} className="flex flex-col items-center">
                  <span className="font-medium text-gray-700 mb-1">{day}</span>
                  <span className="text-xs text-gray-500 mb-2">{date}</span>
                  {imageSelections[day + date] && imageSelections[day + date].length > 0 ? (
                    <div className="relative group image-selected flex flex-wrap gap-1 justify-center">
                      {imageSelections[day + date].map((img, idx) => (
                        <div key={img.id} className="relative">
                          {img.mime_type && img.mime_type.startsWith('video/') ? (
                            <video
                              src={img.file_path}
                              className="w-12 h-12 object-cover rounded shadow mb-1"
                              muted
                              playsInline
                            />
                          ) : (
                            <img src={img.file_path} alt={day} className="w-12 h-12 object-cover rounded shadow mb-1" />
                          )}
                    <button
                            className="absolute top-0 right-0 bg-white bg-opacity-80 rounded-full p-0.5 text-red-500 hover:text-red-700 text-xs"
                            onClick={() => setImageSelections((prev) => ({
                              ...prev,
                              [day + date]: prev[day + date].filter((_, i) => i !== idx)
                            }))}
                            aria-label="Remove image"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                      {imageSelections[day + date].length < 10 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setMediaModalDay(day + date)}
                          className="w-12 h-12 flex items-center justify-center"
                    >
                          <ImageIcon className="h-4 w-4" />
                          <span className="sr-only">Add Image</span>
                        </Button>
                      )}
                      {imageSelections[day + date].length > 1 && (
                        <span className="absolute bottom-0 left-0 bg-blue-600 text-white text-xs px-1 rounded">Carousel</span>
                      )}
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMediaModalDay(day + date)}
                    >
                      <ImageIcon className="h-4 w-4 mr-1" />Select Image
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6 sm:mt-8 flex gap-2 sm:gap-3 justify-center">
              <Button
                onClick={generateWeeklyContent}
                disabled={Object.values(imageSelections).flat().length === 0}
                loading={generating}
                variant="primary"
                className="btn-generate"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {generating ? 'Generating Content...' : 'Generate Weekly Content'}
              </Button>
            </div>
            <div className="mt-3 text-sm text-gray-600 text-center">
              {Object.values(imageSelections).flat().length === 0 ? (
                <span className="text-orange-600">⚠️ Please select at least one image to enable generation</span>
              ) : (
                <span className="text-green-600">✅ {Object.values(imageSelections).flat().length} image(s) selected</span>
              )}
            </div>
          </div>
        )}
        {/* Media Picker Modal */}
        {mediaModalDay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full p-6 relative animate-fade-in">
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                onClick={() => {
                  setMediaModalDay(null)
                  setModalSelectedImages([])
                }}
                aria-label="Close"
              >
                &times;
              </button>
              <h3 className="text-lg font-bold mb-4">Select Images for {mediaModalDay.slice(0, mediaModalDay.indexOf(','))} {mediaModalDay.slice(mediaModalDay.indexOf(',') + 1)} (Up to 10)</h3>
              
              {/* Selected Images Preview */}
              {modalSelectedImages.length > 0 && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Selected Images ({modalSelectedImages.length}/10)</span>
                    <button
                      onClick={() => setModalSelectedImages([])}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {modalSelectedImages.map((img, idx) => (
                      <div key={img.id} className="relative">
                        {img.mime_type && img.mime_type.startsWith('video/') ? (
                          <video
                            src={img.file_path}
                            className="w-12 h-12 object-cover rounded"
                            muted
                            playsInline
                          />
                        ) : (
                          <img src={img.file_path} alt={img.file_name} className="w-12 h-12 object-cover rounded" />
                        )}
                        <button
                          onClick={() => setModalSelectedImages(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {mediaLoading ? (
                <div className="text-gray-500">Loading media...</div>
              ) : mediaError ? (
                <div className="text-red-500">{mediaError}</div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-96 overflow-y-auto">
                  {Array.isArray(media) && media.filter(m => m && m.mime_type && (m.mime_type.startsWith('image/') || m.mime_type.startsWith('video/'))).map((item) => {
                    const isSelected = modalSelectedImages.some(img => img.id === item.id)
                    return (
                      <button
                        key={item.id}
                        className={`focus:outline-none border-2 rounded overflow-hidden transition-all relative ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-transparent hover:border-blue-300'
                        }`}
                        onClick={() => {
                          if (isSelected) {
                            setModalSelectedImages(prev => prev.filter(img => img.id !== item.id))
                          } else if (modalSelectedImages.length < 10) {
                            setModalSelectedImages(prev => [...prev, item])
                          }
                        }}
                      >
                        {item.mime_type && item.mime_type.startsWith('video/') ? (
                          <VideoThumbnail
                            src={item.file_path}
                            fileName={item.file_name}
                            className="w-full h-20"
                          />
                        ) : (
                          <img src={item.file_path} alt={item.file_name} className="w-full h-20 object-cover" />
                        )}
                        {isSelected && (
                          <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                            ✓
                          </div>
                        )}
                      </button>
                    )
                  })}
                  {(!Array.isArray(media) || (Array.isArray(media) && media.filter(m => m && m.mime_type && (m.mime_type.startsWith('image/') || m.mime_type.startsWith('video/'))).length === 0)) && (
                    <div className="col-span-full text-gray-500">No media found in your media library.</div>
                  )}
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setMediaModalDay(null)
                    setModalSelectedImages([])
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setImageSelections((prev) => ({
                      ...prev,
                      [mediaModalDay]: modalSelectedImages
                    }))
                    setMediaModalDay(null)
                    setModalSelectedImages([])
                  }}
                  disabled={modalSelectedImages.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add {modalSelectedImages.length} Image{modalSelectedImages.length !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Weekly Content Preview */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-gray-900">Weekly Content Preview</h2>
            {posts.some(p => p.status === 'generated') && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Default Time:</label>
                  <input
                    type="time"
                    value={defaultTime}
                    onChange={(e) => {
                      setDefaultTime(e.target.value)
                      updateAllPostTimes(e.target.value)
                    }}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div className="flex gap-3">
                <Button
                  onClick={saveWeeklyContent}
                    loading={loading}
                    variant="outline"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Save as Draft
                  </Button>
                  <Button
                    onClick={scheduleWeeklyContent}
                  loading={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Posts
                  </Button>
                </div>
              </div>
            )}
          </div>
          {generating && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <div>
                  <p className="text-sm font-medium text-blue-900">Generating weekly content...</p>
                  <p className="text-xs text-blue-700">This may take a few moments. Please wait.</p>
                </div>
              </div>
            </div>
          )}
          <div className="space-y-6">
            {posts
              .filter(post => (post.selectedImages && post.selectedImages.length > 0) || post.selectedImage)
              .map((post) => {
                return (
                  <div key={post.id} className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
                    {/* Day and Date - Centered */}
                    <div className="text-center mb-6">
                      <h4 className="font-semibold text-gray-900 text-lg">
                        {post.scheduledFor ? formatDateTime(new Date(post.scheduledFor)) : 'Not scheduled'}
                      </h4>
                    </div>
                    
                                        {/* Images Section - Centered or Left-to-Right */}
                    <div className="mb-6">
                      {post.selectedImages && post.selectedImages.length > 0 ? (
                        // Multiple images - arrange left to right, centered
                        <div className="flex justify-center">
                          <div className="flex gap-4">
                            {post.selectedImages.map((img, idx) => (
                              <div key={img.id || idx} className="relative">
                                {/* Error message above image */}
                                {imageErrors[post.id]?.[idx] && (
                                  <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-red-800 text-xs">
                                    {imageErrors[post.id][idx]}
                                  </div>
                                )}
                                <div className="w-64 h-80 bg-gray-100 border border-gray-200 rounded-lg overflow-hidden relative">
                                  {img.mime_type && img.mime_type.startsWith('video/') ? (
                                    <video
                                      src={img.file_path}
                                      className="w-full h-full object-cover"
                                      controls
                                      muted
                                    />
                                  ) : (
                                    <img
                                      src={showEnhancedImages[post.id]?.[idx] && enhancedImages[post.id]?.[idx] ? enhancedImages[post.id][idx] : img.file_path}
                                      alt={`Preview ${idx + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                  )}
                                  {/* Enhancement Button - Only for images, not videos */}
                                  {!(img.mime_type && img.mime_type.startsWith('video/')) && (
                                    <div className="absolute top-2 left-2">
                                      {!showEnhancedImages[post.id]?.[idx] ? (
                                        <button
                                          onClick={() => handleEnhanceImage(post.id, img.file_path, post.caption, idx)}
                                          disabled={enhancingImage[post.id]?.[idx]}
                                          className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white text-sm px-3 py-1.5 rounded shadow-lg disabled:opacity-50"
                                        >
                                          {enhancingImage[post.id]?.[idx] ? 'Enhancing...' : 'Enhance'}
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => handleResetImage(post.id, idx)}
                                          className="bg-gray-600 hover:bg-gray-700 text-white text-sm px-3 py-1.5 rounded shadow-lg"
                                        >
                                          Reset
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : post.selectedImage ? (
                        // Single image - center it
                        <div className="flex justify-center">
                          <div className="relative">
                            {/* Error message above single image */}
                            {imageErrors[post.id]?.[0] && (
                              <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-red-800 text-xs">
                                {imageErrors[post.id][0]}
                              </div>
                            )}
                            <div className="w-64 h-80 bg-gray-100 border border-gray-200 rounded-lg overflow-hidden relative">
                              {post.selectedImage.mime_type && post.selectedImage.mime_type.startsWith('video/') ? (
                                <video
                                  src={post.selectedImage.file_path}
                                  className="w-full h-full object-cover"
                                  controls
                                  muted
                                />
                              ) : (
                                <img
                                  src={showEnhancedImages[post.id]?.[0] && enhancedImages[post.id]?.[0] ? enhancedImages[post.id][0] : post.selectedImage.file_path}
                                  alt="Selected"
                                  className="w-full h-full object-cover"
                                />
                              )}
                              {/* Enhancement Button - Only for images, not videos */}
                              {!(post.selectedImage.mime_type && post.selectedImage.mime_type.startsWith('video/')) && (
                                <div className="absolute top-2 left-2">
                                  {!showEnhancedImages[post.id]?.[0] ? (
                                    <button
                                      onClick={() => handleEnhanceImage(post.id, post.selectedImage.file_path, post.caption, 0)}
                                      disabled={enhancingImage[post.id]?.[0]}
                                      className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white text-sm px-3 py-1.5 rounded shadow-lg disabled:opacity-50"
                                    >
                                      {enhancingImage[post.id]?.[0] ? 'Enhancing...' : 'Enhance'}
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleResetImage(post.id, 0)}
                                      className="bg-gray-600 hover:bg-gray-700 text-white text-sm px-3 py-1.5 rounded shadow-lg"
                                    >
                                      Reset
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        // No images
                        <div className="flex justify-center">
                          <div className="w-64 h-80 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-gray-400 text-sm">No images selected</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Content Details - Centered and Larger */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Caption</label>
                        {editingPost !== post.id && (
                          <button onClick={() => startEditing(post.id, post.caption, post.hashtags)} className="text-xs text-blue-600 hover:text-blue-800">Edit</button>
                        )}
                        {editingPost === post.id ? (
                          <textarea value={editCaption} onChange={(e) => setEditCaption(e.target.value)} className="w-full p-2 border border-gray-300 rounded mb-2 text-xs" rows={3} />
                        ) : (
                          <p className="text-sm text-gray-900 whitespace-pre-line">{post.caption}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Hashtags</label>
                        {editingPost !== post.id && (
                          <button onClick={() => startEditing(post.id, post.caption, post.hashtags)} className="text-xs text-blue-600 hover:text-blue-800">Edit</button>
                        )}
                        {editingPost === post.id ? (
                          <Input value={editHashtags} onChange={(e) => setEditHashtags(e.target.value)} className="w-full p-2 border border-gray-300 rounded mb-2 text-xs" />
                        ) : (
                          <p className="text-sm text-gray-900 whitespace-pre-line">{post.hashtags && post.hashtags.length > 0 ? post.hashtags.map(tag => `#${tag}`).join(' ') : ''}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled For</label>
                        {editingPost !== post.id && (
                          <div className="flex items-center gap-2 mb-2">
                            <button onClick={() => startEditing(post.id, post.caption, post.hashtags, post.scheduledFor)} className="text-xs text-blue-600 hover:text-blue-800">Edit</button>
                            <button 
                              onClick={() => updatePostTime(post.id, defaultTime)}
                              className="text-xs text-green-600 hover:text-green-800"
                            >
                              Quick Time
                            </button>
                          </div>
                        )}
                        {editingPost === post.id ? (
                          <input
                            type="datetime-local"
                            value={editScheduledFor ? editScheduledFor : (post.scheduledFor ? new Date(post.scheduledFor).toISOString().slice(0, 16) : (() => {
                              // Use actual date from upcomingWeekDays
                              const postIndex = posts.findIndex(p => p.id === post.id)
                              const actualDate = upcomingWeekDays[postIndex]?.dateObj
                              if (actualDate) {
                                const [hours, minutes] = defaultTime.split(':').map(Number)
                                actualDate.setHours(hours, minutes, 0, 0)
                                return actualDate.toISOString().slice(0, 16)
                              }
                              return getNextWeekDate(post.day, defaultTime).slice(0, 16)
                            })())}
                            onChange={e => setEditScheduledFor(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded mb-2 text-xs"
                          />
                        ) : (
                          <p className="text-sm text-gray-900">{post.scheduledFor ? formatDateTime(new Date(post.scheduledFor)) : 'Not scheduled'}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  )
} 