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

interface MediaItem {
  id: string
  file_name: string
  file_path: string
  mime_type: string
  created_at: string
  metadata?: any
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
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    loadMedia()
  }, [])

  const loadMedia = async () => {
    try {
      console.log('📂 Loading media library...')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      console.log('👤 Loading media for user:', user.id)
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      console.log('📊 Media loaded:', data?.length || 0, 'items')
      if (data) {
        data.forEach((item, index) => {
          console.log(`📄 Item ${index + 1}:`)
          console.log(`   - Name: ${item.file_name}`)
          console.log(`   - MIME: ${item.mime_type}`)
          console.log(`   - URL: ${item.file_path}`)
          console.log(`   - Size: ${item.file_size} bytes`)
        })
      }

      setMedia(data || [])
    } catch (error: any) {
      console.error('❌ Error loading media:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    console.log('📁 Files selected:', files.length)
    
    const filesWithPreviews: FileWithPreview[] = []
    
    for (const file of files) {
      const fileWithPreview: FileWithPreview = file
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        fileWithPreview.preview = URL.createObjectURL(file)
      }
      
      // Check video audio
      if (file.type.startsWith('video/')) {
        try {
          const hasAudio = await checkVideoAudio(file)
          fileWithPreview.hasAudio = hasAudio
          fileWithPreview.audioChecked = true
          
          if (!hasAudio) {
            setError('⚠️ Some videos have no audio. Instagram Reels require audio. Please add background music or sound to your videos before uploading.')
          }
        } catch (error) {
          console.error('Error checking video audio:', error)
          fileWithPreview.hasAudio = true // Assume it has audio to be safe
          fileWithPreview.audioChecked = true
        }
      } else {
        fileWithPreview.hasAudio = true
        fileWithPreview.audioChecked = true
      }
      
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

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return
    
    console.log('🚀 Starting multiple file upload...')
    console.log('📋 Files to upload:', selectedFiles.length)
    
    setUploading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      console.log('👤 User authenticated:', user.id)

      const uploadPromises = selectedFiles.map(async (selectedFile, index) => {
        console.log(`📤 Uploading file ${index + 1}/${selectedFiles.length}: ${selectedFile.name}`)
        
        let fileToUpload = selectedFile

        // Check if it's a HEIC file and convert it
        const isHeic = selectedFile.type === 'image/heic' || 
                      selectedFile.type === 'image/heif' || 
                      selectedFile.name.toLowerCase().includes('.heic') || 
                      selectedFile.name.toLowerCase().includes('.heif')

        if (isHeic) {
          console.log('🔄 Converting HEIC to JPEG using heic2any...')
          try {
            // Import heic2any dynamically
            const heic2any = (await import('heic2any')).default
            
            // Convert HEIC to JPEG
            const jpegBlob = await heic2any({
              blob: selectedFile,
              toType: 'image/jpeg',
              quality: 0.8,
            }) as Blob

            // Create new file with JPEG content
            const jpegFileName = selectedFile.name.replace(/\.(heic|heif)$/i, '.jpg')
            fileToUpload = new Blob([jpegBlob], { type: 'image/jpeg' }) as File
            // Set the name property manually
            Object.defineProperty(fileToUpload, 'name', {
              value: jpegFileName,
              writable: false
            })

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
              originalFormat: isHeic ? 'heic' : undefined
            }
          })

        if (dbError) throw dbError
        
        return { success: true, fileName: fileToUpload.name || selectedFile.name }
      })

      // Wait for all uploads to complete
      const results = await Promise.all(uploadPromises)
      console.log('🎉 All files uploaded successfully:', results.length)

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
          <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Upload New Media</h2>
          
          {selectedFiles.length === 0 ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-5 sm:p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
            >
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Click to upload images or videos</p>
              <p className="text-xs sm:text-sm text-gray-500">Accepted formats: JPG, JPEG, PNG, GIF, WEBP, HEIC, MP4, WEBM, MOV. Max size 100MB per file.</p>
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
                multiple
                accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif,video/mp4,video/webm,video/quicktime"
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
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <Video className="h-8 w-8 text-gray-400" />
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
                  accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif,video/mp4,video/webm,video/quicktime"
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
            <p className="text-red-800 text-xs sm:text-sm">{error}</p>
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
                          <video
                            src={item.file_path}
                            controls
                            className="w-full h-full object-cover"
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
                          <video
                            src={item.file_path}
                            controls
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