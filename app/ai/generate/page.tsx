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
  const [step, setStep] = useState(0) // 0 = selection, 1 = setup, 2 = image upload/select, 3 = processing, 4 = review
  const [contentType, setContentType] = useState<'single' | 'weekly' | 'monthly'>('single')
  const [loading, setLoading] = useState(false)
  const [processingImage, setProcessingImage] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [processedImageUrl, setProcessedImageUrl] = useState<string>('')
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null)
  const [platform, setPlatform] = useState<'instagram' | 'facebook' | 'twitter'>('instagram')
  const [postType, setPostType] = useState<'product' | 'lifestyle' | 'educational' | 'promotional'>('product')
  const [customPrompt, setCustomPrompt] = useState('')
  const [error, setError] = useState('')
  const [userProfile, setUserProfile] = useState<any>(null)
  const [mediaLibrary, setMediaLibrary] = useState<MediaItem[]>([])
  const [showMediaLibrary, setShowMediaLibrary] = useState(false)
  const [selectedMediaItem, setSelectedMediaItem] = useState<MediaItem | null>(null)
  const [imageAnalysis, setImageAnalysis] = useState<any>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Fetch user profile data on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('users')
            .select('business_name, niche, tone, audience')
            .eq('id', user.id)
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

  const handleContentTypeSelect = (type: 'single' | 'weekly' | 'monthly') => {
    setContentType(type)
    
    if (type === 'weekly') {
      router.push('/ai/weekly')
      return
    }
    
    if (type === 'monthly') {
      router.push('/ai/monthly')
      return
    }
    
    // For single post, continue with the current flow
    setStep(1)
  }

  const handleContinueToImageUpload = () => {
    if (!platform || !postType) return
    setStep(2)
    loadMediaLibrary()
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setSelectedMediaItem(null)
    }
  }

  const handleMediaSelect = (mediaItem: MediaItem) => {
    setSelectedMediaItem(mediaItem)
    setPreviewUrl(mediaItem.file_path)
    setSelectedFile(null)
  }

  const handleProcessImage = async () => {
    if (!previewUrl) {
      setError('Please select an image first')
      return
    }

    setProcessingImage(true)
    setError('')

    try {
      let finalImageUrl: string = previewUrl
      setProcessedImageUrl(previewUrl)

      // Convert blob URL to base64 if it's a blob URL, then upload to public URL
      if (finalImageUrl.startsWith('blob:')) {
        try {
          console.log('Converting blob URL to base64...')
          const response = await fetch(finalImageUrl)
          const blob = await response.blob()
          const reader = new FileReader()
          
          const base64Url: string = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(blob)
          })
          
          console.log('Successfully converted blob URL to base64')
          
          // Upload to public URL for social media posting
          try {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
              console.log('Attempting to upload image to public URL...')
              const uploadResponse = await fetch('/api/download-image', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  imageUrl: base64Url,
                  businessName: userProfile?.business_name || 'somema'
                })
              })

              console.log('Upload response status:', uploadResponse.status)
              
              if (uploadResponse.ok) {
                const uploadData = await uploadResponse.json()
                console.log('Upload response data:', uploadData)
                
                if (uploadData.success) {
                  finalImageUrl = uploadData.publicUrl as string
                  console.log('Image uploaded to public URL:', finalImageUrl)
                } else {
                  console.warn('Failed to upload image to public URL, using base64')
                  finalImageUrl = base64Url
                }
              } else {
                const errorText = await uploadResponse.text()
                console.warn('Failed to upload image to public URL:', errorText)
                finalImageUrl = base64Url
              }
            } else {
              console.warn('No user found, using base64')
              finalImageUrl = base64Url
            }
          } catch (uploadError) {
            console.warn('Failed to upload image to public URL, using base64:', uploadError)
            finalImageUrl = base64Url
          }
        } catch (convertError) {
          console.error('Failed to convert blob URL to base64:', convertError)
          throw new Error('Failed to process uploaded image. Please try again.')
        }
      }

      // Step 1: Analyze image with CLIP
      console.log('Starting CLIP analysis for image:', finalImageUrl.substring(0, 100) + '...')
      const analysis = await analyzeImageWithCLIP(finalImageUrl)
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
              imageUrl: finalImageUrl,
              caption: generatedContent.caption,
              hashtags: generatedContent.hashtags,
              textElements: generatedContent.textElements,
              businessContext: userProfile.business_name || customPrompt || 'our business',
              platform: platform,
              theme: postType
            }
            
            // Save post data to Supabase and redirect to editor
            try {
              const { data: { user } } = await supabase.auth.getUser()
              if (user) {
                const postDataToInsert = {
                  user_id: user.id,
                  caption: generatedContent.caption,
                  hashtags: generatedContent.hashtags,
                  platform: platform,
                  status: 'draft',
                  content_type: postType,
                  custom_prompt: customPrompt,
                  text_elements: generatedContent.textElements,
                  business_context: userProfile.business_name || customPrompt || 'our business',
                  theme: postType,
                  media_url: finalImageUrl
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
              imageUrl: finalImageUrl,
              caption: fallbackContent.caption,
              hashtags: fallbackContent.hashtags,
              textElements: fallbackContent.textElements,
              businessContext: userProfile.business_name || customPrompt || 'our business',
              platform: platform,
              theme: postType
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
                    platform: platform,
                    status: 'draft',
                    content_type: postType,
                    custom_prompt: customPrompt,
                    text_elements: fallbackContent.textElements,
                    business_context: userProfile.business_name || customPrompt || 'our business',
                    theme: postType,
                    media_url: finalImageUrl
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
            imageUrl: finalImageUrl,
            caption: fallbackContent.caption,
            hashtags: fallbackContent.hashtags,
            textElements: fallbackContent.textElements,
            businessContext: userProfile.business_name || customPrompt || 'our business',
            platform: platform,
            theme: postType
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
        setStep(4)
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
        platform: platform,
        status: 'draft',
        scheduled_for: new Date().toISOString(),
        content_type: postType,
        custom_prompt: customPrompt,
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

  const handleOpenPostEditor = () => {
    if (!generatedContent) return

    const postData = {
      imageUrl: processedImageUrl,
      caption: generatedContent.caption,
      hashtags: generatedContent.hashtags,
      textElements: generatedContent.textElements,
      businessContext: userProfile?.business_name || customPrompt || 'our business',
      platform: platform,
      theme: postType
    }
    
    localStorage.setItem('postEditorData', JSON.stringify(postData))
    
    router.push(`/posts/editor`)
  }

  const handleGenerateInstagramContent = async () => {
    if (!imageAnalysis || !userProfile) {
      setError('Missing image analysis or user profile')
      return
    }

    setLoading(true)
    setError('')

    try {
      console.log('Generating Instagram content with:', {
        imageAnalysis,
        userProfile
      })

      const response = await fetch('/api/generate-instagram-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageAnalysis,
          businessProfile: userProfile
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate Instagram content')
      }

      const data = await response.json()
      console.log('Generated Instagram content:', data.result)

      // Update the generated content with Instagram-specific content
      setGeneratedContent({
        caption: data.result.caption,
        hashtags: data.result.hashtags,
        textElements: {
          headline: '', // No headline needed
          subtext: `Generated for ${userProfile.business_name}`,
          cta: 'Shop Now'
        }
      })

    } catch (error: any) {
      console.error('Error generating Instagram content:', error)
      setError(error.message || 'Failed to generate Instagram content')
    } finally {
      setLoading(false)
    }
  }

  const renderSelectionStep = () => {
    return (
      <div className="space-y-8">
                  <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Instagram Posters with AI</h2>
            <p className="text-gray-600">Upload your product photos and get ready-to-use Instagram posters with overlays</p>
          </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <Sparkles className="h-6 w-6 text-blue-600 mt-1" />
            <div>
              <h3 className="text-lg font-medium text-blue-900 mb-2">New AI-Powered Workflow</h3>
              <div className="text-sm text-blue-700 space-y-2">
                <p>• Upload or select product photos from your media library</p>
                <p>• Optionally remove backgrounds for clean product shots</p>
                <p>• AI analyzes your image using CLIP technology</p>
                <p>• Generate captions and content based on image analysis</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Button onClick={() => setStep(1)} className="px-8">
            <Sparkles className="h-4 w-4 mr-2" />
            Start Creating
          </Button>
        </div>

        <div className="text-center">
          <Link href="/dashboard">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const renderStep = () => {
    switch (step) {
      case 0:
        return renderSelectionStep()

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">Post Setup</h3>
              <p className="text-sm text-gray-600">Configure your post settings</p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Choose your platform</h3>
              <p className="text-sm text-gray-600">Select where you want to post</p>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              {[
                { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'text-pink-600' },
                { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'text-blue-600' },
                { id: 'twitter', name: 'Twitter/X', icon: Twitter, color: 'text-blue-400' }
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id as any)}
                  className={`p-4 border-2 rounded-lg transition-colors ${
                    platform === p.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <p.icon className={`h-8 w-8 mx-auto mb-2 ${p.color}`} />
                  <p className="text-sm font-medium">{p.name}</p>
                </button>
              ))}
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Content type</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'product', name: 'Product Showcase' },
                  { id: 'lifestyle', name: 'Lifestyle' },
                  { id: 'educational', name: 'Educational' },
                  { id: 'promotional', name: 'Promotional' }
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setPostType(type.id as any)}
                    className={`p-3 text-left rounded-lg border transition-colors ${
                      postType === type.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {type.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setStep(0)}
                variant="outline"
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleContinueToImageUpload}
                className="flex-1"
                disabled={!platform || !postType}
              >
                Continue
              </Button>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Add Your Product Photo</h3>
              <p className="text-sm text-gray-600">Upload a new image or select from your media library</p>
            </div>

            {/* Media Library Toggle */}
            <div className="flex gap-4">
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
                      <img
                        src={item.file_path}
                        alt={item.file_name}
                        className="w-full h-24 object-cover rounded-lg"
                      />
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
                    <p className="text-sm text-gray-500">PNG, JPG, GIF up to 10MB</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-64 object-cover rounded-lg"
                      />
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



            {/* Additional Context */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional context (optional)
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Describe what you want to highlight in this post..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setStep(1)}
                variant="outline"
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleProcessImage}
                loading={processingImage}
                className="flex-1"
                disabled={!previewUrl}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {processingImage ? 'Creating Poster...' : 'Create Instagram Poster'}
              </Button>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Your Instagram Post is Ready!</h3>
              <p className="text-sm text-gray-600">Review and edit your AI-generated Instagram content</p>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <Sparkles className="h-12 w-12 mx-auto text-blue-600 mb-4 animate-pulse" />
                <p className="text-gray-600">Processing your content...</p>
              </div>
            ) : generatedContent ? (
              <div className="space-y-6">


                {/* Processed Image Display */}
                {processedImageUrl && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Image
                    </label>
                    <div className="relative">
                      <img
                        src={processedImageUrl}
                        alt="Processed Image"
                        className="w-full h-64 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  </div>
                )}

                {/* Product Info */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Product Information</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Product Type
                      </label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        <p className="text-lg font-bold text-gray-900">
                          {imageAnalysis?.classification?.charAt(0).toUpperCase() + imageAnalysis?.classification?.slice(1) || 'Product'}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        AI Confidence
                      </label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        <p className="text-sm text-gray-700">
                          {imageAnalysis ? `${(imageAnalysis.confidence * 100).toFixed(1)}% accurate` : 'Analysis complete'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Caption
                  </label>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hashtags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {generatedContent.hashtags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                      >
                        #{tag}
                        <button
                          onClick={() => {
                            const newTags = generatedContent.hashtags.filter((_, i) => i !== index)
                            setGeneratedContent({
                              ...generatedContent,
                              hashtags: newTags
                            })
                          }}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <Input
                    placeholder="Add new hashtag..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const newTag = (e.target as HTMLInputElement).value.trim()
                        if (newTag && !generatedContent.hashtags.includes(newTag)) {
                          setGeneratedContent({
                            ...generatedContent,
                            hashtags: [...generatedContent.hashtags, newTag]
                          })
                          ;(e.target as HTMLInputElement).value = ''
                        }
                      }
                    }}
                    className="mt-2"
                  />
                </div>

                {/* Instagram Content Preview */}
                {generatedContent.caption && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-gray-900">Instagram Content Preview</h4>

                    {/* Instagram Caption Preview */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Instagram Caption Preview
                      </label>
                      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <p className="text-gray-800 whitespace-pre-wrap">
                          {generatedContent.caption}
                        </p>
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm text-gray-600">
                            {generatedContent.hashtags.map(tag => `#${tag}`).join(' ')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Call to Action */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
                  <div className="text-center">
                    <h4 className="text-lg font-medium text-blue-900 mb-2">
                      Ready to see your poster?
                    </h4>
                    <p className="text-sm text-blue-700 mb-4">
                      Preview how your Instagram post will look with the image overlay and text elements
                    </p>
                    <Button
                      onClick={handleOpenPostEditor}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Preview Instagram Poster
                    </Button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setStep(2)}
                    variant="outline"
                    className="flex-1"
                  >
                    Back
                  </Button>
                  
                  <Button
                    onClick={handleOpenPostEditor}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview Poster
                  </Button>
                  
                  <Button
                    onClick={() => setStep(2)}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Create Another Post
                  </Button>
                  
                  <Button
                    onClick={handleSavePost}
                    loading={loading}
                    className="flex-1"
                  >
                    Save as Draft
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
              <h1 className="text-xl font-semibold text-gray-900">
                Instagram Post Generator
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        {step > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[
                { step: 1, label: 'Setup', icon: Sparkles },
                { step: 2, label: 'Upload & Create', icon: Upload },
                { step: 4, label: 'Poster Editor', icon: Type }
              ].map((item, index) => (
                <div key={item.step} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    step >= item.step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    <item.icon className="h-4 w-4" />
                  </div>
                  <span className={`ml-2 text-sm ${
                    step >= item.step ? 'text-blue-600 font-medium' : 'text-gray-500'
                  }`}>
                    {item.label}
                  </span>
                  {index < 2 && (
                    <div className={`w-16 h-0.5 mx-4 ${
                      step > item.step ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {renderStep()}
        </div>
      </div>
    </div>
  )
} 