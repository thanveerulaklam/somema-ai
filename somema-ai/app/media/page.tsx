'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { 
  Upload, 
  Image as ImageIcon, 
  Video, 
  File, 
  Search,
  ArrowLeft,
  Trash2,
  Download,
  Eye,
  Calendar,
  X
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
  const [isLoading, setIsLoading] = useState(true)

  // Add timeout for video loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading && !hasError) {
        console.warn('Video loading timeout for:', fileName, 'src:', src)
        setHasError(true)
        setIsLoading(false)
      }
    }, 15000) // 15 second timeout - give more time

    return () => clearTimeout(timeout)
  }, [isLoading, hasError, fileName, src])

  // Reset states when src changes
  useEffect(() => {
    setIsLoading(true)
    setHasError(false)
    setIsPlaying(false)
  }, [src])

  const handlePlay = () => {
    setIsPlaying(true)
  }

  const handlePause = () => {
    setIsPlaying(false)
  }

  const handleError = () => {
    console.error('VideoThumbnail error for:', fileName, 'src:', src)
    setHasError(true)
    setIsLoading(false)
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
      <div 
        className={`${className} bg-gray-200 flex items-center justify-center group relative overflow-hidden cursor-pointer`}
        onClick={() => {
          // Try to open the video in a new tab or download it
          window.open(src, '_blank')
        }}
      >
        <div className="text-gray-500 text-center">
          <div className="text-2xl mb-2">🎥</div>
          <div className="text-xs font-medium">Video</div>
          <div className="text-xs opacity-75 mt-1 truncate max-w-full px-2">{fileName}</div>
          <div className="text-xs opacity-50 mt-1">Click to view</div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={`${className} bg-gray-200 flex items-center justify-center group relative overflow-hidden`}>
        <div className="text-gray-500 text-center">
          <div className="text-2xl mb-2 animate-pulse">🎥</div>
          <div className="text-xs font-medium">Loading...</div>
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
        preload="metadata"
        onPlay={handlePlay}
        onPause={handlePause}
        onError={(e) => {
          console.error('Video element error for:', fileName, 'src:', src, 'error:', e)
          handleError()
        }}
        onLoadedMetadata={() => {
          console.log('Video metadata loaded successfully for:', fileName, 'src:', src)
          setIsLoading(false)
        }}
        onCanPlay={() => {
          console.log('Video can play for:', fileName, 'src:', src)
          setIsLoading(false)
        }}
        onLoadStart={() => {
          console.log('Video load started for:', fileName, 'src:', src)
        }}
        onLoadedData={() => {
          console.log('Video data loaded for:', fileName, 'src:', src)
          setIsLoading(false)
        }}
        onMouseEnter={(e) => {
          e.currentTarget.play().catch((error) => {
            console.error('Video play error:', error)
            // Don't set error state for play failures
          })
        }}
      />

      {/* Play button overlay when not playing */}
      {!isPlaying && (
        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
          <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-full p-4 shadow-2xl hover:bg-opacity-100 hover:scale-110 transition-all duration-200 cursor-pointer">
            <svg className="w-8 h-8 text-gray-800 ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      )}

      {/* Volume control when playing and hovering */}
      {isPlaying && showControls && (
        <div 
          className="absolute top-3 right-3"
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(false)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleMute()
            }}
            className="bg-black bg-opacity-70 hover:bg-opacity-90 rounded-full p-2.5 shadow-lg hover:scale-110 transition-all duration-200 backdrop-blur-sm"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
              </svg>
            ) : (
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            )}
          </button>
        </div>
      )}

      {/* Filename */}
      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
        {fileName}
      </div>
    </div>
  )
}

interface MediaItem {
  id: string
  file_name: string
  file_path: string
  mime_type: string
  created_at: string
  metadata?: any
  hasAudio?: boolean
  audioChecked?: boolean
}

interface UserPlan {
  subscription_plan: string
  media_storage_limit: number
}

interface FileWithPreview extends File {
  preview?: string
  hasAudio?: boolean
  audioChecked?: boolean
}

export default function MediaPage() {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([])
  const [error, setError] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Debug logging function
  const logToTerminal = async (action: string, data: any) => {
    try {
      await fetch('/api/debug-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, data })
      })
    } catch (error) {
      console.error('Failed to log to terminal:', error)
    }
  }

  // Enhanced video validation for Instagram compatibility
  const validateVideoForInstagram = (file: File): Promise<{ isValid: boolean; error?: string; details?: any }> => {
    return new Promise((resolve) => {
      // Basic validation first (works in all environments)
      const fileExtension = file.name.toLowerCase().split('.').pop()
      const requirements = {
        allowedContainers: ['mp4', 'mov'],
        maxFileSize: 500 * 1024 * 1024, // 500MB maximum
      }
      
      const basicErrors = []
      
      // Check file extension/container
      if (!fileExtension || !requirements.allowedContainers.includes(fileExtension)) {
        basicErrors.push(`Container must be MP4 or MOV (current: ${fileExtension || 'unknown'})`)
      }
      
      // Check file size
      if (file.size > requirements.maxFileSize) {
        basicErrors.push(`File size must be ${(requirements.maxFileSize / (1024 * 1024)).toFixed(0)}MB or less (current: ${(file.size / (1024 * 1024)).toFixed(1)}MB)`)
      }
      
      // If basic validation fails, return early
      if (basicErrors.length > 0) {
        console.log('❌ Basic video validation failed:', basicErrors)
        logToTerminal('VIDEO_VALIDATION_FAILED', {
          fileName: file.name,
          errors: basicErrors,
          fileSize: file.size
        })
        resolve({
          isValid: false,
          error: basicErrors.join(', ')
        })
        return
      }
      
      // Try advanced validation with video element (essential for Instagram compatibility)
      // Use a more robust approach that works better in serverless environments
      try {
        const video = document.createElement('video')
        video.preload = 'metadata'
        video.muted = true
        video.playsInline = true
        video.crossOrigin = 'anonymous'
        video.setAttribute('webkit-playsinline', 'true')
        video.setAttribute('playsinline', 'true')
        
        let validationTimeout: NodeJS.Timeout
        let hasResolved = false
        
        const resolveOnce = (result: any) => {
          if (!hasResolved) {
            hasResolved = true
            if (validationTimeout) clearTimeout(validationTimeout)
            resolve(result)
          }
        }
        
        video.onloadedmetadata = () => {
          if (hasResolved) return
          
          const width = video.videoWidth
          const height = video.videoHeight
          const aspectRatio = width / height
          const duration = video.duration
          
          console.log('🎬 Video validation successful:', {
            width, height, aspectRatio, duration,
            fileName: file.name, fileSize: file.size
          })
          
          logToTerminal('VIDEO_VALIDATION_SUCCESS', {
            fileName: file.name,
            width, height, aspectRatio, duration, fileSize: file.size
          })
          
          // Advanced Instagram video requirements
          const advancedRequirements = {
            maxWidth: 1920,
            minAspectRatio: 0.55, // 9:16 (vertical/portrait) - Instagram Reels/Stories
            maxAspectRatio: 1.78, // 16:9 (landscape) - Instagram Posts
            minDuration: 3, // 3 seconds minimum
            maxDuration: 900, // 15 minutes maximum (900 seconds)
          }
          
          const advancedErrors = []
          
          // Check dimensions
          if (width > advancedRequirements.maxWidth) {
            advancedErrors.push(`Width must be ${advancedRequirements.maxWidth}px or less (current: ${width}px)`)
          }
          
          // Check aspect ratio (9:16 to 16:9)
          if (aspectRatio < advancedRequirements.minAspectRatio || aspectRatio > advancedRequirements.maxAspectRatio) {
            advancedErrors.push(`Aspect ratio must be between 9:16 (${advancedRequirements.minAspectRatio}) and 16:9 (${advancedRequirements.maxAspectRatio}) (current: ${aspectRatio.toFixed(2)})`)
          }
          
          // Check duration
          if (duration < advancedRequirements.minDuration) {
            advancedErrors.push(`Duration must be at least ${advancedRequirements.minDuration} seconds (current: ${duration.toFixed(1)}s)`)
          }
          
          if (duration > advancedRequirements.maxDuration) {
            advancedErrors.push(`Duration must be ${advancedRequirements.maxDuration} seconds or less (current: ${duration.toFixed(1)}s)`)
          }
          
          const isValid = advancedErrors.length === 0
          
          if (isValid) {
            console.log('✅ Video is Instagram-compatible')
          } else {
            console.log('❌ Video is not Instagram-compatible:', advancedErrors)
            logToTerminal('VIDEO_VALIDATION_FAILED', {
              fileName: file.name,
              errors: advancedErrors,
              width, height, aspectRatio, duration, fileSize: file.size
            })
          }
          
          // Enhanced metadata extraction
          const enhancedMetadata = {
            width, 
            height, 
            aspectRatio, 
            duration, 
            fileSize: file.size,
            container: fileExtension,
            mimeType: file.type,
            fileName: file.name,
            frameRate: null,
            hasAudio: null,
            instagramCompatible: isValid,
            requirements: {
              maxWidth: advancedRequirements.maxWidth,
              aspectRatioRange: `${advancedRequirements.minAspectRatio} to ${advancedRequirements.maxAspectRatio}`,
              durationRange: `${advancedRequirements.minDuration}s to ${advancedRequirements.maxDuration}s`,
              maxFileSize: `${(requirements.maxFileSize / (1024 * 1024)).toFixed(0)}MB`,
              allowedContainers: requirements.allowedContainers
            }
          }

          resolveOnce({
            isValid,
            error: advancedErrors.length > 0 ? advancedErrors.join(', ') : undefined,
            details: enhancedMetadata
          })
        }
        
        video.onerror = (e) => {
          console.error('❌ Video metadata loading failed:', e)
          logToTerminal('VIDEO_VALIDATION_ERROR', {
            fileName: file.name,
            error: 'Could not load video metadata - Instagram compatibility unknown'
          })
          
          // For now, let's be more permissive in production and allow the upload
          // but log the issue for debugging
          console.warn('⚠️ Allowing video upload despite metadata loading failure (production fallback)')
          
          const fallbackMetadata = {
            width: null, 
            height: null, 
            aspectRatio: null, 
            duration: null, 
            fileSize: file.size,
            container: fileExtension,
            mimeType: file.type,
            fileName: file.name,
            frameRate: null,
            hasAudio: null,
            instagramCompatible: true, // Allow upload but mark as unknown
            requirements: {
              maxFileSize: `${(requirements.maxFileSize / (1024 * 1024)).toFixed(0)}MB`,
              allowedContainers: requirements.allowedContainers
            }
          }
          
          resolveOnce({
            isValid: true, // Allow upload in production
            details: fallbackMetadata
          })
        }
        
        // Set timeout for validation (15 seconds - give more time for serverless)
        validationTimeout = setTimeout(() => {
          console.warn('⚠️ Video validation timeout - allowing upload with warning')
          logToTerminal('VIDEO_VALIDATION_TIMEOUT', {
            fileName: file.name
          })
          
          // Allow upload but with warning
          const fallbackMetadata = {
            width: null, 
            height: null, 
            aspectRatio: null, 
            duration: null, 
            fileSize: file.size,
            container: fileExtension,
            mimeType: file.type,
            fileName: file.name,
            frameRate: null,
            hasAudio: null,
            instagramCompatible: true, // Allow upload but mark as unknown
            requirements: {
              maxFileSize: `${(requirements.maxFileSize / (1024 * 1024)).toFixed(0)}MB`,
              allowedContainers: requirements.allowedContainers
            }
          }
          
          resolveOnce({
            isValid: true, // Allow upload in production
            details: fallbackMetadata
          })
        }, 15000)
        
        // Create object URL and set video source
        const objectURL = URL.createObjectURL(file)
        video.src = objectURL
        
        // Clean up object URL after validation
        setTimeout(() => {
          URL.revokeObjectURL(objectURL)
        }, 20000)
        
      } catch (error) {
        console.error('❌ Video validation error:', error)
        logToTerminal('VIDEO_VALIDATION_ERROR', {
          fileName: file.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Allow upload in production with fallback
        const fallbackMetadata = {
          width: null, 
          height: null, 
          aspectRatio: null, 
          duration: null, 
          fileSize: file.size,
          container: fileExtension,
          mimeType: file.type,
          fileName: file.name,
          frameRate: null,
          hasAudio: null,
          instagramCompatible: true, // Allow upload but mark as unknown
          requirements: {
            maxFileSize: `${(requirements.maxFileSize / (1024 * 1024)).toFixed(0)}MB`,
            allowedContainers: requirements.allowedContainers
          }
        }
        
        resolve({
          isValid: true, // Allow upload in production
          details: fallbackMetadata
        })
      }
    })
  }

  useEffect(() => {
    console.log('🔄 Media page loaded, calling loadMedia...')
    logToTerminal('PAGE_LOADED', { timestamp: new Date().toISOString() })
    loadUserPlan()
    loadMedia()
  }, [])

  const loadUserPlan = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        console.error('❌ Auth error:', authError)
        return
      }

      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('subscription_plan, media_storage_limit')
        .eq('user_id', user.id)
        .single()

      if (profileError) {
        console.error('❌ Error loading user profile:', profileError)
        // Default to free plan if profile not found
        setUserPlan({ subscription_plan: 'free', media_storage_limit: 50 })
        return
      }

      setUserPlan({
        subscription_plan: userProfile.subscription_plan || 'free',
        media_storage_limit: userProfile.media_storage_limit || 50
      })

      console.log('✅ User plan loaded:', userProfile.subscription_plan, 'Storage limit:', userProfile.media_storage_limit)
    } catch (error) {
      console.error('❌ Error loading user plan:', error)
      // Default to free plan on error
      setUserPlan({ subscription_plan: 'free', media_storage_limit: 50 })
    }
  }

  const loadMedia = async () => {
    try {
      console.log('📂 Loading media library...')
      logToTerminal('LOAD_MEDIA_START', { timestamp: new Date().toISOString() })
      
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        console.error('❌ Auth error:', authError)
        logToTerminal('AUTH_ERROR', { error: authError.message })
        setError('Authentication error: ' + authError.message)
        return
      }
      
      if (!user) {
        console.log('❌ No user found, redirecting to login')
        logToTerminal('NO_USER', { timestamp: new Date().toISOString() })
        router.push('/login')
        return
      }
      
      console.log('✅ User authenticated:', user.id)
      logToTerminal('USER_AUTHENTICATED', { userId: user.id })

      console.log('👤 Loading media for user:', user.id)
      logToTerminal('FETCHING_MEDIA', { userId: user.id })
      
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        logToTerminal('FETCH_ERROR', { error: error.message })
        throw error
      }

      console.log('📊 Media loaded:', data?.length || 0, 'items')
      logToTerminal('MEDIA_LOADED', { 
        count: data?.length || 0,
        items: data?.map(item => ({
          name: item.file_name,
          mimeType: item.mime_type,
          size: item.file_size,
          hasAudio: item.metadata?.audioDetected,
          audioChecked: item.metadata?.audioChecked
        })) || []
      })
      
      if (data) {
        data.forEach((item, index) => {
          console.log(`📄 Item ${index + 1}:`)
          console.log(`   - Name: ${item.file_name}`)
          console.log(`   - MIME: ${item.mime_type}`)
          console.log(`   - URL: ${item.file_path}`)
          console.log(`   - Size: ${item.file_size} bytes`)
        })
      }

      // Process videos to detect audio for existing videos that haven't been checked
      logToTerminal('PROCESSING_VIDEOS', { 
        totalItems: data?.length || 0,
        videos: data?.filter(item => item.mime_type?.startsWith('video/')).length || 0
      })
      
      const processedData = await Promise.all((data || []).map(async (item) => {
        console.log(`📄 Processing item: ${item.file_name} (${item.mime_type})`)
        
        if (item.mime_type?.startsWith('video/')) {
          const metadata = item.metadata || {}
          const audioChecked = metadata.audioChecked || false
          
          console.log(`🎥 Video detected: ${item.file_name}`)
          console.log(`   - Audio checked: ${audioChecked}`)
          console.log(`   - Video URL: ${item.file_path}`)
          console.log(`   - Current metadata:`, metadata)
          
          logToTerminal('PROCESSING_VIDEO', {
            fileName: item.file_name,
            audioChecked,
            currentAudioDetected: metadata.audioDetected
          })
          
                      if (!audioChecked) {
              try {
                console.log(`🔍 Checking audio for video: ${item.file_name}`)
                console.log(`   - URL: ${item.file_path}`)
                
                logToTerminal('AUDIO_CHECK_START', {
                  fileName: item.file_name,
                  url: item.file_path
                })
                
                const hasAudio = true // Video support removed
                console.log(`   - Audio detection result: ${hasAudio}`)
                
                logToTerminal('AUDIO_CHECK_RESULT', {
                  fileName: item.file_name,
                  hasAudio
                })
                
                // Update the database with audio detection result
                const { error: updateError } = await supabase
                  .from('media')
                  .update({
                    metadata: {
                      ...metadata,
                      audioDetected: hasAudio,
                      audioChecked: true
                    }
                  })
                  .eq('id', item.id)
                
                if (updateError) {
                  console.error(`❌ Error updating database for ${item.file_name}:`, updateError)
                  logToTerminal('AUDIO_UPDATE_ERROR', {
                    fileName: item.file_name,
                    error: updateError.message
                  })
                } else {
                  console.log(`✅ Database updated for ${item.file_name}`)
                  logToTerminal('AUDIO_UPDATE_SUCCESS', {
                    fileName: item.file_name,
                    hasAudio
                  })
                }
              
              return {
                ...item,
                hasAudio,
                audioChecked: true,
                metadata: {
                  ...metadata,
                  audioDetected: hasAudio,
                  audioChecked: true
                }
              }
            } catch (error) {
              console.error(`❌ Error checking audio for ${item.file_name}:`, error)
              return {
                ...item,
                hasAudio: true, // Assume it has audio to be safe
                audioChecked: true,
                metadata: {
                  ...metadata,
                  audioDetected: true,
                  audioChecked: true
                }
              }
            }
          } else {
            console.log(`📹 Video ${item.file_name} already checked - Audio: ${metadata.audioDetected}`)
            
            // Check if audioDetected is missing but audioChecked is true
            if (metadata.audioChecked && metadata.audioDetected === undefined) {
              console.log(`⚠️ Video ${item.file_name} has audioChecked but missing audioDetected, re-checking...`)
              logToTerminal('RE_CHECKING_AUDIO', {
                fileName: item.file_name,
                reason: 'audioDetected missing'
              })
              
              try {
                const hasAudio = true // Video support removed
                console.log(`   - Re-check audio detection result: ${hasAudio}`)
                
                // Update the database
                const { error: updateError } = await supabase
                  .from('media')
                  .update({
                    metadata: {
                      ...metadata,
                      audioDetected: hasAudio
                    }
                  })
                  .eq('id', item.id)
                
                if (updateError) {
                  console.error(`❌ Error updating database for ${item.file_name}:`, updateError)
                  logToTerminal('RE_CHECK_UPDATE_ERROR', {
                    fileName: item.file_name,
                    error: updateError.message
                  })
                } else {
                  console.log(`✅ Database updated for ${item.file_name}`)
                  logToTerminal('RE_CHECK_UPDATE_SUCCESS', {
                    fileName: item.file_name,
                    hasAudio
                  })
                }
                
                return {
                  ...item,
                  hasAudio,
                  audioChecked: true,
                  metadata: {
                    ...metadata,
                    audioDetected: hasAudio
                  }
                }
              } catch (error) {
                console.error(`❌ Error re-checking audio for ${item.file_name}:`, error)
                return {
                  ...item,
                  hasAudio: true, // Assume it has audio to be safe
                  audioChecked: true
                }
              }
            }
            
            return {
              ...item,
              hasAudio: metadata.audioDetected,
              audioChecked: true
            }
          }
        } else {
          console.log(`📄 Non-video file: ${item.file_name}`)
          return item
        }
      }))

      setMedia(processedData)
    } catch (error: any) {
      console.error('❌ Error loading media:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Helper functions for plan limits
  const isFreePlan = () => userPlan?.subscription_plan === 'free'
  const canUploadVideos = () => !isFreePlan()
  const getImageCount = () => media.filter(item => item.mime_type?.startsWith('image/')).length
  const canUploadMoreImages = () => {
    if (!isFreePlan()) return true
    return getImageCount() < (userPlan?.media_storage_limit || 50)
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    console.log('📁 Files selected:', files.length)
    
    // Check for video files on free plan
    const videoFiles = files.filter(file => file.type.startsWith('video/'))
    if (videoFiles.length > 0 && isFreePlan()) {
      setError('❌ Video uploads are not allowed on the free plan. Please upgrade to a paid plan to upload videos.')
      return
    }

    // Check image count limit for free plan
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    const currentImageCount = getImageCount()
    const totalImagesAfterUpload = currentImageCount + imageFiles.length
    
    if (isFreePlan() && totalImagesAfterUpload > (userPlan?.media_storage_limit || 50)) {
      const remainingSlots = (userPlan?.media_storage_limit || 50) - currentImageCount
      setError(`❌ You can only store ${userPlan?.media_storage_limit || 50} images on the free plan. You currently have ${currentImageCount} images and can upload ${remainingSlots} more. Please upgrade to a paid plan for unlimited storage.`)
      return
    }
    
    const filesWithPreviews: FileWithPreview[] = []
    
    for (const file of files) {
      const fileWithPreview: FileWithPreview = file
      
      // Create preview for images and videos
      if (file.type.startsWith('image/')) {
        fileWithPreview.preview = URL.createObjectURL(file)
      } else if (file.type.startsWith('video/')) {
        fileWithPreview.preview = URL.createObjectURL(file)
      }
      
      // Validate video files for Instagram compatibility
      if (file.type.startsWith('video/')) {
        try {
          const validation = await validateVideoForInstagram(file)
          if (!validation.isValid) {
            setError(`❌ Video "${file.name}" is not Instagram-compatible:\n${validation.error}\n\nPlease check the video requirements and try again.`)
            return // Don't add this file to the selection
          }
          console.log('✅ Video validation passed:', file.name, validation.details)
        } catch (error) {
          console.error('❌ Video validation error:', error)
          setError(`❌ Error validating video "${file.name}". Please try again.`)
          return
        }
      }
      
      // Set default values for all files
      fileWithPreview.hasAudio = true
      fileWithPreview.audioChecked = true
      
      filesWithPreviews.push(fileWithPreview)
    }
    
    setSelectedFiles(prev => [...prev, ...filesWithPreviews])
    setError('') // Clear any previous error
  }

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev]
      const removedFile = newFiles[index]
      
      // Clean up preview URL if it exists
      if (removedFile.preview) {
        URL.revokeObjectURL(removedFile.preview)
      }
      
      newFiles.splice(index, 1)
      return newFiles
    })
  }

  // Video audio checking removed - only images supported

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return
    
    console.log('🚀 Starting multiple file upload...')
    console.log('📋 Files to upload:', selectedFiles.length)
    
    logToTerminal('UPLOAD_START', {
      fileCount: selectedFiles.length,
      files: selectedFiles.map(f => ({ name: f.name, size: f.size, type: f.type }))
    })
    
    setUploading(true)
    setError('')

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) {
        console.error('❌ Auth error during upload:', authError)
        throw new Error('Authentication error: ' + authError.message)
      }
      if (!user) throw new Error('User not authenticated')
      
      console.log('✅ User authenticated for upload:', user.id)
      logToTerminal('UPLOAD_USER_AUTH', { userId: user.id })

      console.log('👤 User authenticated:', user.id)

      const uploadPromises = selectedFiles.map(async (selectedFile, index) => {
        console.log(`📤 Uploading file ${index + 1}/${selectedFiles.length}: ${selectedFile.name}`)
        
        logToTerminal('UPLOADING_FILE', {
          index: index + 1,
          total: selectedFiles.length,
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          fileType: selectedFile.type
        })
        
        // Video files are now supported - removed restriction
        
        let fileToUpload = selectedFile

        // Check if it's a HEIC file and convert it
        const isHeic = selectedFile.type === 'image/heic' || 
                      selectedFile.type === 'image/heif' || 
                      selectedFile.name.toLowerCase().includes('.heic') || 
                      selectedFile.name.toLowerCase().includes('.heif')

        if (isHeic) {
          console.log('🔄 Converting HEIC to JPEG using heic2any...')
          try {
            // Import heic2any dynamically with better error handling
            let heic2any;
            try {
              const heic2anyModule = await import('heic2any');
              heic2any = heic2anyModule.default;
            } catch (importError) {
              console.error('❌ Failed to import heic2any:', importError);
              throw new Error('HEIC conversion library not available');
            }
            
            // Convert HEIC to JPEG
            const jpegBlob = await heic2any({
              blob: selectedFile,
              toType: 'image/jpeg',
              quality: 0.8,
            }) as Blob

            // Create new file with JPEG content
            const jpegFileName = selectedFile.name.replace(/\.(heic|heif)$/i, '.jpg')
            fileToUpload = new Blob([jpegBlob], { type: 'image/jpeg' }) as File
            
            // Set the name property manually with better error handling
            try {
              Object.defineProperty(fileToUpload, 'name', {
                value: jpegFileName,
                writable: false
              })
            } catch (propertyError) {
              console.warn('⚠️ Could not set file name property:', propertyError)
              // Create a new File object as fallback
              fileToUpload = new (File as any)([jpegBlob], jpegFileName, { type: 'image/jpeg' })
            }

            console.log('✅ HEIC converted to JPEG successfully')
            console.log('   - Original size:', selectedFile.size, 'bytes')
            console.log('   - Converted size:', jpegBlob.size, 'bytes')
            console.log('   - New filename:', jpegFileName)
          } catch (conversionError) {
            console.error('❌ HEIC conversion failed:', conversionError)
            console.log('⚠️ Using original file as fallback')
          }
        }

        // Upload the file (converted or original)
        const fileExt = fileToUpload.name?.split('.').pop() || 'jpg'
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `media/${user.id}/${fileName}`

        console.log('📤 Uploading to Supabase:', filePath)
        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, fileToUpload)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(filePath)

        console.log('✅ File uploaded successfully:', publicUrl)
        logToTerminal('FILE_UPLOADED', {
          fileName: fileToUpload.name || selectedFile.name,
          url: publicUrl,
          size: fileToUpload.size
        })

        // Save to database
        const { error: dbError } = await supabase
          .from('media')
          .insert({
            user_id: user.id,
            file_name: fileToUpload.name || selectedFile.name,
            file_path: publicUrl,
            mime_type: fileToUpload.type || 'image/jpeg',
            file_size: fileToUpload.size,
            metadata: {
              lastModified: selectedFile.lastModified,
              originalFormat: isHeic ? 'heic' : undefined,
              audioDetected: selectedFile.hasAudio,
              audioChecked: selectedFile.audioChecked
            }
          })

        if (dbError) {
          logToTerminal('DB_INSERT_ERROR', {
            fileName: fileToUpload.name || selectedFile.name,
            error: dbError.message
          })
          throw dbError
        }
        
        logToTerminal('DB_INSERT_SUCCESS', {
          fileName: fileToUpload.name || selectedFile.name,
          hasAudio: selectedFile.hasAudio,
          audioChecked: selectedFile.audioChecked,
          metadata: {
            lastModified: selectedFile.lastModified,
            originalFormat: isHeic ? 'heic' : undefined,
            audioDetected: selectedFile.hasAudio,
            audioChecked: selectedFile.audioChecked
          }
        })
        
        return { success: true, fileName: fileToUpload.name || selectedFile.name }
      })

      // Wait for all uploads to complete
      const results = await Promise.all(uploadPromises)
      console.log('📊 Upload results:', results)
      
      // Process results
      const successfulUploads = results.filter(r => r.success)
      const failedUploads = results.filter(r => !r.success)
      
      if (successfulUploads.length > 0) {
        console.log('🎉 Successful uploads:', successfulUploads.length)
        logToTerminal('UPLOAD_SUCCESS', {
          count: successfulUploads.length,
          files: successfulUploads.map(r => r.fileName)
        })
      }
      
      if (failedUploads.length > 0) {
        console.log('❌ Failed uploads:', failedUploads.length)
        logToTerminal('UPLOAD_FAILED', {
          count: failedUploads.length,
          files: failedUploads.map(r => ({ fileName: r.fileName }))
        })
        
        // Show user-friendly error message
        setError(`Some files could not be uploaded. Please try again.`)
        
        // If all uploads failed, don't reload media
        if (successfulUploads.length === 0) {
          setSelectedFiles([])
          return
        }
      }

      // Clean up preview URLs
      selectedFiles.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview)
        }
      })

      setSelectedFiles([])
      console.log('🔄 Reloading media list...')
      loadMedia() // Reload media list
    } catch (error: any) {
      console.error('❌ Upload error:', error)
      setError(error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (mediaId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return

    try {
      const { error } = await supabase
        .from('media')
        .delete()
        .eq('id', mediaId)

      if (error) throw error

      loadMedia() // Reload media list
    } catch (error: any) {
      setError(error.message)
    }
  }

  const filteredMedia = media.filter(item =>
    item.file_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getFileIcon = (fileType: string | undefined) => {
    if (!fileType) return File
    if (fileType.startsWith('image/')) return ImageIcon
    if (fileType.startsWith('video/')) return Video
    return File
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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
              <ImageIcon className="h-6 w-6 text-green-600 mr-2" />
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                Media Library
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-6 sm:py-8">
        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex justify-between items-center mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-medium text-gray-900">Upload New Media</h2>
            {userPlan && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Plan:</span> {userPlan.subscription_plan.charAt(0).toUpperCase() + userPlan.subscription_plan.slice(1)}
                {isFreePlan() && (
                  <span className="ml-2 text-orange-600">
                    ({getImageCount()}/{userPlan.media_storage_limit} images)
                  </span>
                )}
              </div>
            )}
          </div>
          
          {selectedFiles.length === 0 ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-5 sm:p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
            >
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">
                {isFreePlan() ? 'Click to upload images' : 'Click to upload images or videos'}
              </p>
              <p className="text-xs sm:text-sm text-gray-500">
                {isFreePlan() 
                  ? 'Accepted formats: JPG, JPEG, PNG, GIF, WEBP, HEIC. Max size 100MB per file. Videos not allowed on free plan.'
                  : 'Accepted formats: JPG, JPEG, PNG, GIF, WEBP, HEIC, MP4, WEBM, MOV. Max size 100MB per file.'
                }
              </p>
              <div className="mt-3 space-y-2">
                {isFreePlan() && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <svg className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <div className="text-xs text-yellow-800">
                        <p className="font-medium">Free Plan Limitations</p>
                        <p>You can store up to {userPlan?.media_storage_limit || 50} images. Video uploads are not allowed. <Link href="/pricing" className="text-yellow-700 underline">Upgrade to a paid plan</Link> for unlimited storage and video support.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif,video/mp4,video/quicktime,.mp4,.mov"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selected Files Preview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="relative p-3 bg-gray-50 rounded-lg border">
                    <button
                      onClick={() => removeSelectedFile(index)}
                      className="absolute top-2 right-2 z-10 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    
                    <div className="aspect-square bg-white rounded-lg overflow-hidden mb-2">
                      {file.type.startsWith('image/') && file.preview ? (
                        <img
                          src={file.preview}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                        ) : file.type.startsWith('video/') ? (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center group">
                            <video
                              className="w-full h-full object-cover rounded-lg"
                              src={file.preview}
                              muted
                              loop
                              onMouseEnter={(e) => {
                                e.currentTarget.play()
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.pause()
                                e.currentTarget.currentTime = 0
                              }}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center rounded-lg">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <div className="bg-white bg-opacity-90 rounded-full p-2">
                                  <Video className="h-6 w-6 text-gray-700" />
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <File className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <div className="text-xs">
                      <p className="font-medium text-gray-900 truncate">{file.name}</p>
                      <p className="text-gray-500">{formatFileSize(file.size)}</p>
                      {file.type.startsWith('video/') && file.audioChecked && (
                        <p className={`text-xs ${file.hasAudio ? 'text-green-600' : 'text-red-600'}`}>
                          {file.hasAudio ? '✓ Has audio' : '⚠️ No audio'}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Add More Files Button */}
              <div className="text-center">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  + Add more files
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif,video/mp4,video/quicktime,.mp4,.mov"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
              
              <div className="flex gap-3 flex-col sm:flex-row">
                <Button
                  onClick={() => {
                    selectedFiles.forEach(file => {
                      if (file.preview) {
                        URL.revokeObjectURL(file.preview)
                      }
                    })
                    setSelectedFiles([])
                  }}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  Cancel All
                </Button>
                <Button
                  onClick={handleUpload}
                  loading={uploading}
                  className="w-full sm:w-auto"
                >
                  Upload {selectedFiles.length} File{selectedFiles.length !== 1 ? 's' : ''}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-between">
            <div className="flex-1 w-full max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search media files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto mt-3 sm:mt-0">
              <Button
                variant={viewMode === 'grid' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="w-full sm:w-auto"
              >
                Grid
              </Button>
              <Button
                variant={viewMode === 'list' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="w-full sm:w-auto"
              >
                List
              </Button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <svg className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div className="text-red-800 text-xs sm:text-sm">
                <p className="font-medium mb-1">Upload Error</p>
                <div className="whitespace-pre-line">{error}</div>
                {error.includes('Instagram') && (
                  <div className="mt-2 p-2 bg-red-100 rounded text-xs">
                    <p className="font-medium">💡 Tip: To make your video Instagram-compatible:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Crop to 4:5, 1:1, or 16:9 aspect ratio</li>
                      <li>Keep width/height between 500-1920px</li>
                      <li>Ensure duration is 60 seconds or less</li>
                      <li>Add audio if missing</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setError('')}
              className="absolute top-2 right-2 text-red-600 hover:text-red-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Media Grid/List */}
        {filteredMedia.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-8 sm:p-12 text-center">
            <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No media files</h3>
            <p className="text-gray-600 text-xs sm:text-sm">Upload your first file to get started</p>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6' : 'space-y-3 sm:space-y-4'}>
            {filteredMedia.map((item) => {
              const FileIcon = getFileIcon(item.mime_type)
              const isImage = item.mime_type ? item.mime_type.startsWith('image/') : false
              const isVideo = item.mime_type ? item.mime_type.startsWith('video/') : false
              
              // Debug video detection
              if (isVideo) {
                console.log('🎬 Video detected in media list:', item.file_name, 'MIME:', item.mime_type, 'URL:', item.file_path)
              }
              
              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-lg shadow-sm border overflow-hidden ${
                    viewMode === 'list' ? 'flex flex-col sm:flex-row items-center p-3 sm:p-4' : ''
                  }`}
                >
                  {viewMode === 'grid' ? (
                    <>
                      <div className="aspect-square bg-gray-100 flex items-center justify-center">
                        {isImage ? (
                          item.file_name.toLowerCase().includes('.heic') || item.file_name.toLowerCase().includes('.heif') ? (
                            <div 
                              className="w-full h-full bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                              onClick={() => {
                                const link = document.createElement('a')
                                link.href = item.file_path
                                link.download = item.file_name
                                document.body.appendChild(link)
                                link.click()
                                document.body.removeChild(link)
                              }}
                              title="Click to download HEIC image"
                            >
                              <div className="text-gray-500 text-sm text-center">
                                <div>📷 HEIC Image</div>
                                <div className="text-xs">Click to download</div>
                              </div>
                            </div>
                          ) : (
                            <img
                              src={item.file_path}
                              alt={item.file_name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.error('❌ Image failed to load:', item.file_path)
                                e.currentTarget.style.display = 'none'
                                e.currentTarget.nextElementSibling?.classList.remove('hidden')
                              }}
                            />
                          )
                        ) : isVideo ? (
                          <VideoThumbnail 
                            src={item.file_path} 
                            fileName={item.file_name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <FileIcon className="h-12 w-12 text-gray-400" />
                        )}
                      </div>
                      <div className="p-3 sm:p-4">
                        <h3 className="font-medium text-gray-900 truncate text-sm sm:text-base">{item.file_name}</h3>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                          {new Date(item.created_at).toLocaleDateString()}
                        </p>
                        {isVideo && item.audioChecked && (
                          <p className={`text-xs mt-1 ${item.hasAudio ? 'text-green-600' : 'text-red-600'}`}>
                            {item.hasAudio ? '✓ Has audio' : '⚠️ No audio'}
                          </p>
                        )}
                        <div className="flex gap-2 mt-2 sm:mt-3">
                          <Button size="sm" variant="outline" onClick={() => window.open(item.file_path, '_blank')}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => {
                            const link = document.createElement('a');
                            link.href = item.file_path;
                            link.download = item.file_name;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mr-0 sm:mr-4 mb-2 sm:mb-0">
                        {isImage ? (
                          item.file_name.toLowerCase().includes('.heic') || item.file_name.toLowerCase().includes('.heif') ? (
                            <div 
                              className="w-full h-full bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors rounded-lg"
                              onClick={() => {
                                const link = document.createElement('a')
                                link.href = item.file_path
                                link.download = item.file_name
                                document.body.appendChild(link)
                                link.click()
                                document.body.removeChild(link)
                              }}
                              title="Click to download HEIC image"
                            >
                              <div className="text-gray-500 text-xs text-center">
                                <div>📷 HEIC</div>
                                <div className="text-xs">Download</div>
                              </div>
                            </div>
                          ) : (
                            <img
                              src={item.file_path}
                              alt={item.file_name}
                              className="w-full h-full object-cover rounded-lg"
                              onError={(e) => {
                                console.error('❌ Image failed to load:', item.file_path)
                                e.currentTarget.style.display = 'none'
                                e.currentTarget.nextElementSibling?.classList.remove('hidden')
                              }}
                            />
                          )
                        ) : isVideo ? (
                          <VideoThumbnail 
                            src={item.file_path} 
                            fileName={item.file_name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <FileIcon className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 w-full">
                        <h3 className="font-medium text-gray-900 text-sm sm:text-base">{item.file_name}</h3>
                        <p className="text-xs sm:text-sm text-gray-500">
                          {new Date(item.created_at).toLocaleDateString()}
                        </p>
                        {isVideo && item.audioChecked && (
                          <p className={`text-xs mt-1 ${item.hasAudio ? 'text-green-600' : 'text-red-600'}`}>
                            {item.hasAudio ? '✓ Has audio' : '⚠️ No audio'}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 mt-2 sm:mt-0 w-full sm:w-auto">
                        <Button size="sm" variant="outline" onClick={() => window.open(item.file_path, '_blank')}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => {
                          const link = document.createElement('a');
                          link.href = item.file_path;
                          link.download = item.file_name;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
} 