'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'

import { 
  Upload, 
  Sparkles, 
  Instagram, 
  Facebook, 
  Twitter,
  ArrowLeft,
  Image as ImageIcon,
  Wand2,
  Type,
  Check,
  X,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react'
import { 
  analyzeImageWithCLIP
} from '../../../lib/ai-services'

interface GeneratedContent {
  caption: string
  hashtags: string[]
  textElements?: {
    headline: string
    subtext: string
    cta: string
  }
}

interface MediaItem {
  id: string
  file_name: string
  file_path: string
  mime_type: string
  created_at: string
}

export default function GeneratePage() {
  const [loading, setLoading] = useState(false)
  const [processingImage, setProcessingImage] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [processedImageUrl, setProcessedImageUrl] = useState<string>('')
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null)
  const [error, setError] = useState('')
  const [userProfile, setUserProfile] = useState<any>(null)
  const [mediaLibrary, setMediaLibrary] = useState<MediaItem[]>([])
  const [showMediaLibrary, setShowMediaLibrary] = useState(false)
  const [selectedMediaItem, setSelectedMediaItem] = useState<MediaItem | null>(null)
  const [imageAnalysis, setImageAnalysis] = useState<any>(null)
  const [scheduledFor, setScheduledFor] = useState<string>(new Date().toISOString().slice(0, 16))
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Fetch user profile data from user_profiles table on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single()
          
          setUserProfile(profile)
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
      }
    }
    
    fetchUserProfile()
  }, [])

  // Load media library
  const loadMediaLibrary = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('media')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setMediaLibrary(data || [])
    } catch (error) {
      console.error('Error loading media library:', error)
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      console.log('🚀 File selected:', file.name, file.type, file.size)
      
      let fileToProcess = file
      
      // Check if it's a HEIC file and convert it
      const isHeic = file.type === 'image/heic' || 
                    file.type === 'image/heif' || 
                    file.name.toLowerCase().includes('.heic') || 
                    file.name.toLowerCase().includes('.heif')
      
      if (isHeic) {
        console.log('🔄 Converting HEIC to JPEG using heic2any...')
        try {
          // Import heic2any dynamically
          const heic2any = (await import('heic2any')).default
          
          // Convert HEIC to JPEG
          const jpegBlob = await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.8,
          }) as Blob
          
          // Create new file with JPEG content
          const jpegFileName = file.name.replace(/\.(heic|heif)$/i, '.jpg')
          fileToProcess = new Blob([jpegBlob], { type: 'image/jpeg' }) as File
          // Set the name property manually
          Object.defineProperty(fileToProcess, 'name', {
            value: jpegFileName,
            writable: false
          })
          
          console.log('✅ HEIC converted to JPEG successfully')
          console.log('   - Original size:', file.size, 'bytes')
          console.log('   - Converted size:', jpegBlob.size, 'bytes')
          console.log('   - New filename:', jpegFileName)
        } catch (conversionError) {
          console.error('❌ HEIC conversion failed:', conversionError)
          console.log('⚠️ Using original file as fallback')
        }
      }
      
      setSelectedFile(fileToProcess)
      const url = URL.createObjectURL(fileToProcess)
      setPreviewUrl(url)
      setSelectedMediaItem(null)
      
      // Check if it's a video file and detect audio
      if (fileToProcess.type.startsWith('video/')) {
        try {
          const hasAudio = await checkVideoAudio(fileToProcess)
          if (!hasAudio) {
            setError('⚠️ This video has no audio. Instagram Reels require audio. Please add background music or sound to your video before using it.')
          } else {
            setError('') // Clear any previous error
          }
        } catch (error) {
          console.error('Error checking video audio:', error)
        }
      } else {
        setError('') // Clear any previous error for non-video files
      }
    }
  }

  const checkVideoAudio = (file: File): Promise<boolean> => {
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
      
      video.src = URL.createObjectURL(file)
    })
  }

  // Helper to check if a file or media is a video
  const isVideoFile = (file: File | null, mediaItem: MediaItem | null) => {
    if (file) return file.type.startsWith('video/')
    if (mediaItem) return mediaItem.mime_type.startsWith('video/')
    return false
  }

  const handleMediaSelect = (mediaItem: MediaItem) => {
    setSelectedMediaItem(mediaItem)
    setPreviewUrl(mediaItem.file_path)
    setSelectedFile(null)
  }

  const handleProcessImage = async () => {
    if (!previewUrl) {
      setError('Please select an image or video first')
      return
    }

    setProcessingImage(true)
    setError('')

    // Get user for Authorization header
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('User not authenticated. Please log in again.');
      setProcessingImage(false);
      return;
    }

    try {
      let finalMediaUrl: string = previewUrl
      setProcessedImageUrl(previewUrl)
      let isVideo = false
      let mimeType = ''
      if (selectedFile) {
        mimeType = selectedFile.type
        isVideo = selectedFile.type.startsWith('video/')
      } else if (selectedMediaItem) {
        mimeType = selectedMediaItem.mime_type
        isVideo = selectedMediaItem.mime_type.startsWith('video/')
      }

      // If video or image from file upload, upload to storage if not already public
      if (selectedFile) {
        // Upload file to storage
        const fileExt = selectedFile.name?.split('.').pop() || 'jpg'
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `media/${user.id}/${fileName}`
        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, selectedFile)
        if (uploadError) throw uploadError
        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(filePath)
        finalMediaUrl = publicUrl
      }

      // Analyze media
      let analysis: any = null
      if (isVideo) {
        // Call /api/analyze-video
        const formData = new FormData()
        if (selectedFile) {
          formData.append('file', selectedFile)
        } else if (selectedMediaItem) {
          // Download the video and append as Blob
          const res = await fetch(selectedMediaItem.file_path)
          const blob = await res.blob()
          formData.append('file', new File([blob], selectedMediaItem.file_name, { type: selectedMediaItem.mime_type }))
        }
        const response = await fetch('/api/analyze-video', {
          method: 'POST',
          body: formData
        })
        if (!response.ok) throw new Error('Failed to analyze video')
        const data = await response.json()
        analysis = data.aggregated_analysis
        // Use generated caption/hashtags if available
        if (data.generated) {
          setGeneratedContent({
            caption: data.generated.caption,
            hashtags: data.generated.hashtags,
            textElements: {
              headline: '',
              subtext: 'Generated for your video',
              cta: 'Watch Now'
            }
          })
        }
      } else {
        // Existing image analysis logic
        console.log('Starting CLIP analysis for image:', finalMediaUrl.substring(0, 100) + '...')
        analysis = await analyzeImageWithCLIP(finalMediaUrl)
        console.log('CLIP Analysis Results:', analysis)
        setImageAnalysis(analysis)

        // Step 3: Automatically generate Instagram content if user profile is available
        if (userProfile) {
          console.log('Generating Instagram content automatically...')
          try {
            const response = await fetch('/api/generate-instagram-content', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(user?.id ? { 'Authorization': `Bearer ${user.id}` } : {})
              },
              body: JSON.stringify({
                imageAnalysis: analysis,
                businessProfile: userProfile
              })
            })

            if (response.ok) {
              const data = await response.json()
              console.log('Generated Instagram content:', data.result)

              // Set the generated content
              const generatedContent: GeneratedContent = {
                caption: data.result.caption,
                hashtags: data.result.hashtags,
                textElements: {
                  headline: '', // No headline needed
                  subtext: `Generated for ${userProfile.business_name}`,
                  cta: 'Shop Now'
                }
              }
              setGeneratedContent(generatedContent)

              // Automatically open the poster editor
              const postData = {
                imageUrl: finalMediaUrl,
                caption: generatedContent.caption,
                hashtags: generatedContent.hashtags,
                textElements: generatedContent.textElements,
                businessContext: userProfile.business_name || 'our business',
                platform: 'instagram',
                theme: 'product'
              }
              
              // Save post data to Supabase and redirect to editor
              try {
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                  const postDataToInsert = {
                    user_id: user.id,
                    caption: generatedContent.caption,
                    hashtags: generatedContent.hashtags,
                    platform: 'instagram',
                    status: 'draft',
                    content_type: 'product',
                    text_elements: generatedContent.textElements,
                    business_context: userProfile.business_name || 'our business',
                    theme: 'product',
                    media_url: finalMediaUrl
                  }
                  
                  console.log('Attempting to insert post data:', postDataToInsert)
                  
                  const { data: savedPost, error } = await supabase
                    .from('posts')
                    .insert(postDataToInsert)
                    .select()
                    .single()

                  if (error) {
                    console.error('Error saving post to Supabase:', error)
                    throw error
                  }

                  console.log('Post saved to Supabase:', savedPost)
                  router.push(`/posts/editor?postId=${(savedPost as any).id}`)
                  return
                }
              } catch (error) {
                console.error('Failed to save post to Supabase:', error)
                // Fallback to localStorage if Supabase fails
                localStorage.setItem('postEditorData', JSON.stringify(postData))
                router.push(`/posts/editor`)
                return
              }
              return
            } else {
              // Fallback if Instagram content generation fails
              const fallbackContent: GeneratedContent = {
                caption: `Check out these amazing ${analysis.classification}! ${analysis.caption}`,
                hashtags: analysis.tags,
                textElements: {
                  headline: '', // No headline needed
                  subtext: `Confidence: ${(analysis.confidence * 100).toFixed(1)}%`,
                  cta: 'Shop Now'
                }
              }
              setGeneratedContent(fallbackContent)
              
              // Open poster editor with fallback content
              const postData = {
                imageUrl: finalMediaUrl,
                caption: fallbackContent.caption,
                hashtags: fallbackContent.hashtags,
                textElements: fallbackContent.textElements,
                businessContext: userProfile.business_name || 'our business',
                platform: 'instagram',
                theme: 'product'
              }
              
              // Save fallback post data to Supabase and redirect to editor
              try {
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                  const { data: savedPost, error } = await supabase
                    .from('posts')
                    .insert({
                      user_id: user.id,
                      caption: fallbackContent.caption,
                      hashtags: fallbackContent.hashtags,
                      platform: 'instagram',
                      status: 'draft',
                      content_type: 'product',
                      text_elements: fallbackContent.textElements,
                      business_context: userProfile.business_name || 'our business',
                      theme: 'product',
                      media_url: finalMediaUrl
                    })
                    .select()
                    .single()

                  if (error) {
                    console.error('Error saving fallback post to Supabase:', error)
                    throw error
                  }

                  console.log('Fallback post saved to Supabase:', savedPost)
                  router.push(`/posts/editor?postId=${(savedPost as any).id}`)
                  return
                }
              } catch (error) {
                console.error('Failed to save fallback post to Supabase:', error)
                // Fallback to localStorage if Supabase fails
                localStorage.setItem('postEditorData', JSON.stringify(postData))
                router.push(`/posts/editor`)
                return
              }
              return
            }
          } catch (contentError) {
            console.error('Error generating Instagram content:', contentError)
            // Fallback content
            const fallbackContent: GeneratedContent = {
              caption: `Amazing ${analysis.classification} from ${userProfile.business_name}! ${analysis.caption}`,
              hashtags: analysis.tags,
              textElements: {
                headline: '', // No headline needed
                subtext: `Confidence: ${(analysis.confidence * 100).toFixed(1)}%`,
                cta: 'Shop Now'
              }
            }
            setGeneratedContent(fallbackContent)
            
            // Open poster editor with fallback content
            const postData = {
              imageUrl: finalMediaUrl,
              caption: fallbackContent.caption,
              hashtags: fallbackContent.hashtags,
              textElements: fallbackContent.textElements,
              businessContext: userProfile.business_name || 'our business',
              platform: 'instagram',
              theme: 'product'
            }
            
            localStorage.setItem('postEditorData', JSON.stringify(postData))
            
            router.push(`/posts/editor`)
            return
          }
        } else {
          // If no user profile, create basic content and show review step
          const basicContent: GeneratedContent = {
            caption: `Image Analysis: ${analysis.caption}`,
            hashtags: analysis.tags,
            textElements: {
              headline: '', // No headline needed
              subtext: `Confidence: ${(analysis.confidence * 100).toFixed(1)}%`,
              cta: 'Analysis Complete'
            }
          }
          setGeneratedContent(basicContent)
        }
      }
    } catch (error: any) {
      console.error('Image processing error:', error)
      setError(error.message || 'Failed to process image')
    } finally {
      setProcessingImage(false)
    }
  }

  const handleSavePost = async () => {
    if (!generatedContent) return
    
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Please log in to save your post')
        return
      }

      const postData: any = {
        user_id: user.id,
        caption: generatedContent.caption,
        hashtags: generatedContent.hashtags,
        platform: 'instagram',
        status: 'draft',
        scheduled_for: scheduledFor ? new Date(scheduledFor).toISOString() : new Date().toISOString(),
        content_type: 'product',
        text_elements: generatedContent.textElements || {
          headline: 'Amazing Headline',
          subtext: 'Compelling subtext that draws attention',
          cta: 'Learn More'
        }
      }

      // Add image URL if available
      if (processedImageUrl) {
        postData.media_url = processedImageUrl
      }

      const { data, error } = await supabase
        .from('posts')
        .insert(postData)
        .select()

      if (error) throw error

      setError('Post saved successfully!')
      setTimeout(() => {
        router.push('/posts')
      }, 2000)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
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
              <Sparkles className="h-6 w-6 text-blue-600 mr-2" />
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                Instagram Post Generator
              </h1>
            </div>
            </div>
            </div>
      </header>

      <div className="max-w-2xl mx-auto px-2 sm:px-4 lg:px-8 py-6 sm:py-8">
        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
          {error && (
            <div className="mb-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-xs sm:text-sm">{error}</p>
              </div>
          )}

          {/* Image Upload/Select Section */}
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900">Add Your Product Photo</h3>
              <p className="text-xs sm:text-sm text-gray-600">Upload a new image or select from your media library</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={() => setShowMediaLibrary(false)}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  !showMediaLibrary
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Upload className="h-4 w-4 mr-2 inline" />
                Upload New
              </button>
              <button
                onClick={() => {
                  setShowMediaLibrary(true)
                  loadMediaLibrary()
                }}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  showMediaLibrary
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <ImageIcon className="h-4 w-4 mr-2 inline" />
                Media Library
              </button>
            </div>
            {showMediaLibrary ? (
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900">Select from Media Library</h4>
                <div className="grid grid-cols-3 gap-4 max-h-64 overflow-y-auto">
                  {mediaLibrary.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleMediaSelect(item)}
                      className={`relative cursor-pointer rounded-lg border-2 transition-colors ${
                        selectedMediaItem?.id === item.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {item.mime_type && item.mime_type.startsWith('video/') ? (
                        <video
                          src={item.file_path}
                          className="w-full h-24 object-cover rounded-lg"
                          controls
                        />
                      ) : item.file_path.match(/\.(mp4|webm|mov)$/i) ? (
                        <video
                          src={item.file_path}
                          className="w-full h-24 object-cover rounded-lg"
                          controls
                        />
                      ) : (
                        <img
                          src={item.file_path}
                          alt={item.file_name}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                      )}
                      {selectedMediaItem?.id === item.id && (
                        <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full p-1">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900">Upload New Image</h4>
                {!selectedFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
                  >
                    <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">Click to upload or drag and drop</p>
                    <p className="text-sm text-gray-500">PNG, JPG, GIF, HEIC, MP4 up to 10MB</p>
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <svg className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-xs text-blue-800">
                          <p className="font-medium">Instagram Reels Audio Requirement</p>
                          <p>Videos posted to Instagram must have audio. Videos without sound will be rejected.</p>
                        </div>
                      </div>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,image/heic,image/heif,video/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      {isVideoFile(selectedFile, selectedMediaItem) ? (
                        <video
                          src={previewUrl}
                          controls
                          autoPlay
                          className="w-full h-64 object-cover rounded-lg"
                        />
                      ) : (
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-full h-64 object-cover rounded-lg"
                        />
                      )}
                      <button
                        onClick={() => {
                          setSelectedFile(null)
                          setPreviewUrl('')
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Generate Post Button */}
            <div className="mt-8 flex gap-3 justify-center">
              <Button
                onClick={handleProcessImage}
                loading={processingImage}
                className="btn-generate"
                disabled={!previewUrl}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {processingImage ? 'Generating Post...' : 'Generate Post'}
              </Button>
            </div>
          </div>
          {/* Post Preview Section */}
          {generatedContent && (
            <div className="mt-10">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Post Preview</h3>
              {processedImageUrl && (
                <div className="mb-4 flex justify-center">
                  <div style={{ width: '270px', aspectRatio: '9/16', background: '#000', borderRadius: '1rem', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isVideoFile(selectedFile, selectedMediaItem) ? (
                      <video src={previewUrl} controls className="w-full h-full object-cover" style={{ aspectRatio: '9/16' }} />
                    ) : (
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" style={{ aspectRatio: '9/16' }} />
                    )}
                  </div>
                </div>
              )}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Caption</label>
                <textarea
                  value={generatedContent.caption}
                  onChange={(e) => setGeneratedContent({
                    ...generatedContent,
                    caption: e.target.value
                  })}
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                  rows={4}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Hashtags</label>
                <Input
                  value={generatedContent.hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ')}
                  onChange={(e) => setGeneratedContent({
                    ...generatedContent,
                    hashtags: e.target.value.split(/\s+/).filter(Boolean).map(tag => tag.startsWith('#') ? tag : `#${tag}`)
                  })}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled For</label>
                <input
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={e => setScheduledFor(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleSavePost}
                  loading={loading}
                  className="flex-1"
                >
                  Save as Draft
                </Button>
                <Button
                  onClick={handleSavePost}
                  loading={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  Post Now
                </Button>
                <Button
                  onClick={() => {
                    setGeneratedContent(null)
                    setProcessedImageUrl('')
                    setSelectedFile(null)
                    setPreviewUrl('')
                    setSelectedMediaItem(null)
                  }}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Create Another Post
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 