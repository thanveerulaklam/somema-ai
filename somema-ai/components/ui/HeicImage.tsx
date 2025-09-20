'use client'

import { useState, useEffect } from 'react'
import { getDisplayableImageUrl } from '../../lib/utils'

interface HeicImageProps {
  src: string
  alt: string
  className?: string
  style?: React.CSSProperties
  mimeType?: string
  onLoad?: () => void
  onError?: () => void
}

export function HeicImage({ src, alt, className, style, mimeType, onLoad, onError }: HeicImageProps) {
  const [displayUrl, setDisplayUrl] = useState<string>(src)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const convertImage = async () => {
      try {
        setIsLoading(true)
        setHasError(false)
        
        console.log('🖼️ HeicImage: Processing image:', src)
        console.log('🖼️ HeicImage: MIME type:', mimeType)
        console.log('🖼️ HeicImage: File extension:', src.split('.').pop())
        
        // Check if it's a HEIC file
        const isHeic = mimeType === 'image/heic' || 
                      mimeType === 'image/heif' || 
                      src.toLowerCase().includes('.heic') || 
                      src.toLowerCase().includes('.heif')
        
        console.log('🖼️ HeicImage: Is HEIC file?', isHeic)
        
        if (isHeic) {
          console.log('🖼️ HeicImage: HEIC file detected')
          
          // Check if this is a converted HEIC file (stored as JPEG)
          const isConvertedHeic = src.toLowerCase().includes('.jpg') && 
                                 (mimeType === 'image/jpeg' || mimeType === 'image/jpg')
          
          if (isConvertedHeic) {
            console.log('🖼️ HeicImage: This is a converted HEIC file, displaying as JPEG')
            setDisplayUrl(src)
          } else {
            console.log('🖼️ HeicImage: Original HEIC file, showing placeholder')
            setHasError(true) // Show HEIC placeholder
          }
          setIsLoading(false)
        } else {
          console.log('🖼️ HeicImage: Not HEIC, using original URL')
          setDisplayUrl(src)
        }
      } catch (error) {
        console.error('❌ HeicImage: Failed to process image:', error)
        setHasError(true)
        onError?.()
      } finally {
        setIsLoading(false)
      }
    }

    convertImage()
  }, [src, mimeType, onError])

  if (hasError) {
    return (
      <div 
        className={`bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors ${className}`}
        onClick={() => {
          // Download the HEIC file when clicked
          const link = document.createElement('a')
          link.href = src
          link.download = src.split('/').pop() || 'image.heic'
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
    )
  }

  return (
    <img
      src={displayUrl}
      alt={alt}
      className={className}
      style={{ ...style, opacity: isLoading ? 0.5 : 1 }}
      onLoad={() => {
        setIsLoading(false)
        onLoad?.()
      }}
      onError={() => {
        setHasError(true)
        onError?.()
      }}
    />
  )
} 