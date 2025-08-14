import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// HEIC to JPEG conversion utility using server-side API
export async function convertHeicToJpeg(heicUrl: string): Promise<string> {
  try {
    console.log('🔄 Starting HEIC conversion for:', heicUrl)
    
    // Check if the URL is a HEIC file
    if (!heicUrl.toLowerCase().includes('.heic') && !heicUrl.toLowerCase().includes('.heif')) {
      console.log('📝 Not a HEIC file, returning original URL')
      return heicUrl // Not a HEIC file, return as is
    }

    // Use server-side conversion API
    console.log('🔄 Using server-side HEIC conversion...')
    const response = await fetch('/api/convert-heic', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl: heicUrl })
    })
    
    if (!response.ok) {
      throw new Error(`Server conversion failed: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.success && data.dataUrl) {
      console.log('✅ Server-side HEIC conversion successful')
      return data.dataUrl
    } else {
      throw new Error(data.error || 'Server conversion failed')
    }
  } catch (error) {
    console.error('❌ HEIC conversion failed:', error)
    return heicUrl // Return original URL if conversion fails
  }
}

// Enhanced image display component that handles HEIC files
export async function getDisplayableImageUrl(imageUrl: string, mimeType?: string): Promise<string> {
  // Check if it's a HEIC file
  const isHeic = mimeType === 'image/heic' || 
                 mimeType === 'image/heif' || 
                 imageUrl.toLowerCase().includes('.heic') || 
                 imageUrl.toLowerCase().includes('.heif')
  
  if (isHeic) {
    try {
      // Try client-side conversion first
      return await convertHeicToJpeg(imageUrl)
    } catch (error) {
      console.error('❌ Client-side HEIC conversion failed, trying server-side:', error)
      // Fallback: try server-side conversion
      return await serverSideHeicConversion(imageUrl)
    }
  }
  
  return imageUrl
}

// Server-side HEIC conversion using API endpoint
async function serverSideHeicConversion(heicUrl: string): Promise<string> {
  try {
    console.log('🔄 Trying server-side HEIC conversion...')
    
    const response = await fetch('/api/convert-heic', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl: heicUrl })
    })
    
    if (!response.ok) {
      throw new Error(`Server conversion failed: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.success && data.dataUrl) {
      console.log('✅ Server-side HEIC conversion successful')
      return data.dataUrl
    } else {
      throw new Error(data.error || 'Server conversion failed')
    }
  } catch (error) {
    console.error('❌ Server-side HEIC conversion failed:', error)
    // Final fallback: try canvas conversion
    return await fallbackHeicConversion(heicUrl)
  }
}

// Fallback HEIC conversion using canvas
async function fallbackHeicConversion(heicUrl: string): Promise<string> {
  try {
    console.log('🔄 Trying fallback HEIC conversion...')
    
    const response = await fetch(heicUrl)
    const blob = await response.blob()
    
    // Create a canvas to convert the image
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      throw new Error('Canvas context not available')
    }

    // Create an image element
    const img = new Image()
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        try {
          // Set canvas dimensions
          canvas.width = img.width
          canvas.height = img.height
          
          // Draw the image on canvas
          ctx.drawImage(img, 0, 0)
          
          // Convert to JPEG data URL
          const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.9)
          console.log('✅ Fallback HEIC conversion successful')
          resolve(jpegDataUrl)
        } catch (error) {
          console.error('❌ Fallback conversion failed:', error)
          reject(error)
        }
      }
      
      img.onerror = () => {
        console.error('❌ Failed to load image for fallback conversion')
        reject(new Error('Failed to load image'))
      }
      
      // Create object URL for the blob
      const objectUrl = URL.createObjectURL(blob)
      img.src = objectUrl
    })
  } catch (error) {
    console.error('❌ Fallback HEIC conversion failed:', error)
    throw error
  }
} 