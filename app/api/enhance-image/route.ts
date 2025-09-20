import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { createClient } from '@supabase/supabase-js'
import { getServerSupabase } from '../../../lib/supabase'
import { shouldBypassCredits, getAdminInfo } from '../../../lib/admin-utils'
import { apiMiddleware } from '../../../lib/auth-middleware'
import { atomicEnhancementCreditDeduction, ensureUserProfile } from '../../../lib/credit-utils'
import { validateFile, validateString } from '../../../lib/validation-utils'

export async function POST(request: NextRequest) {
  try {
    // Check authentication and rate limiting
    const authResult = await apiMiddleware(request, {
      requireAuth: true,
      rateLimit: {
        maxRequests: 10,
        windowMs: 15 * 60 * 1000 // 15 minutes
      }
    });

    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    const { user } = authResult;
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }
    const userId = user.id;

    const formData = await request.formData()
    const imageFile = formData.get('image') as File
    const productDescription = formData.get('productDescription') as string

    // Validate file input
    const fileValidation = validateFile(imageFile, {
      required: true,
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    });

    if (!fileValidation.isValid) {
      return NextResponse.json({ 
        error: 'Invalid file', 
        details: fileValidation.errors 
      }, { status: 400 })
    }

    // Validate product description
    const descriptionValidation = validateString(productDescription, {
      maxLength: 500,
      sanitize: true
    });

    if (!descriptionValidation.isValid) {
      return NextResponse.json({ 
        error: 'Invalid product description', 
        details: descriptionValidation.errors 
      }, { status: 400 })
    }

    // Initialize Supabase client with service role for API access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if user is admin (bypass credits)
    const bypassCredits = await shouldBypassCredits(userId)
    const adminInfo = await getAdminInfo(userId)
    
    console.log('🔐 Admin check result for image enhancement:', {
      userId,
      bypassCredits,
      adminInfo
    })

    let creditsResult;
    
    if (!bypassCredits) {
      // Ensure user profile exists
      const profileResult = await ensureUserProfile(userId);
      if (!profileResult.success) {
        return NextResponse.json({ 
          error: 'Failed to initialize user profile',
          details: profileResult.error
        }, { status: 500 })
      }

      // Atomically deduct enhancement credits
      creditsResult = await atomicEnhancementCreditDeduction(userId, 1);
      
      if (!creditsResult.success) {
        return NextResponse.json({ 
          error: creditsResult.error || 'No enhancement credits remaining. Please upgrade your plan or purchase more credits.',
          creditsRemaining: creditsResult.newBalance
        }, { status: 402 })
      }

      console.log('✅ Enhancement credit deduction successful. New balance:', creditsResult.newBalance)
    } else {
      console.log('👑 Admin user - bypassing credit check for image enhancement')
      creditsResult = { success: true, newBalance: 999999 } // Admin gets unlimited credits
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY
    if (!OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    // Step 1: Optimize image - resize to 1024x1024 for DALL-E compatibility
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer())
    
    const optimizedBuffer = await sharp(imageBuffer)
      .resize({ width: 1024, height: 1024, fit: 'inside' })
      .toFormat('jpeg', { quality: 90 })
      .toBuffer()
    
    console.log(`Image optimized: ${imageBuffer.length} bytes → ${optimizedBuffer.length} bytes (1024x1024 for DALL-E compatibility)`)

    // Step 2: Single enhancement prompt (no classification needed)
    const enhancementPrompt = `Enhance the provided product photo into a high-quality professional e-commerce style promotional image. Keep the product's exact colors, textures, proportions, text, and logos 100% unchanged and perfectly preserved. If the product is shown folded, on a mannequin, stand, or prop, replace it with a realistic, attractive model wearing or using the product in the same pose when contextually appropriate. Apply refined background enhancement with realistic detailing, professional lighting, natural shadows, crisp sharpness, reflections, and color correction to achieve commercial-grade aesthetics. Use category-appropriate backgrounds: neutral gradient or light studio for general items, elegant minimal settings for fashion, modern sleek environments for tech, cozy lifestyle interiors for home goods, playful colorful scenes for kids' products, fresh kitchen/dining setups for food, and premium luxurious settings for high-end goods. Ensure the result looks natural, realistic, eye-catching, and ready for Instagram or e-commerce promotion.`

    // Step 3: Image-to-image editing using /v1/images/edits with multipart/form-data
    const openaiFormData = new FormData()  
    openaiFormData.append('model', 'gpt-image-1')
    openaiFormData.append('image', new Blob([optimizedBuffer], { type: 'image/jpeg' }), 'input.jpg')
    openaiFormData.append('prompt', enhancementPrompt)
    openaiFormData.append('size', '1024x1024')

    console.log('🚀 Starting OpenAI image enhancement request...')
    console.log('📊 Request details:')
    console.log('  - Model: gpt-image-1')
    console.log('  - Size: 1024x1024')
    console.log('  - Input image size:', optimizedBuffer.length, 'bytes')
    console.log('  - Prompt length:', enhancementPrompt.length, 'characters')

    const imageResponse = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        // Don't set Content-Type - let browser set it with boundary for FormData
      },
      body: openaiFormData
    })

    // Log response headers for cost tracking
    console.log('📈 OpenAI API Response Headers:')
    console.log('  - Status:', imageResponse.status)
    console.log('  - Content-Type:', imageResponse.headers.get('content-type'))
    console.log('  - X-Request-ID:', imageResponse.headers.get('x-request-id'))
    console.log('  - X-RateLimit-Limit:', imageResponse.headers.get('x-ratelimit-limit'))
    console.log('  - X-RateLimit-Remaining:', imageResponse.headers.get('x-ratelimit-remaining'))
    console.log('  - X-RateLimit-Reset:', imageResponse.headers.get('x-ratelimit-reset'))
    
    // Check for usage headers (if available)
    const usageHeaders = [
      'openai-processing-ms',
      'openai-version',
      'x-usage-tokens',
      'x-usage-cost'
    ]
    
    usageHeaders.forEach(header => {
      const value = imageResponse.headers.get(header)
      if (value) {
        console.log(`  - ${header}:`, value)
      }
    })

    if (!imageResponse.ok) {
      const err = await imageResponse.json()
      console.error('❌ OpenAI API Error:', err)
      return NextResponse.json({ error: err.error?.message || 'OpenAI image generation failed' }, { status: 500 })
    }

    const imageData = await imageResponse.json()
    console.log('✅ OpenAI API Response Data:')
    console.log('  - Response structure:', Object.keys(imageData))
    console.log('  - Data array length:', imageData.data?.length || 0)
    console.log('  - Has b64_json:', !!imageData.data?.[0]?.b64_json)
    console.log('  - Has url:', !!imageData.data?.[0]?.url)
    
    // Log any usage information in the response
    if (imageData.usage) {
      console.log('💰 Usage Information:')
      console.log('  - Usage object:', JSON.stringify(imageData.usage, null, 2))
    }
    
    const enhancedImageBase64 = imageData.data?.[0]?.b64_json
    
    if (!enhancedImageBase64) {
      return NextResponse.json({ 
        error: 'No image data received from OpenAI API' 
      }, { status: 500 })
    }
    
    // Convert base64 to buffer
    const enhancedImageBuffer = Buffer.from(enhancedImageBase64, 'base64')
    
    console.log('📊 Image Processing Results:')
    console.log('  - Input image size:', optimizedBuffer.length, 'bytes')
    console.log('  - Output image size:', enhancedImageBuffer.length, 'bytes')
    console.log('  - Size change:', ((enhancedImageBuffer.length - optimizedBuffer.length) / optimizedBuffer.length * 100).toFixed(2) + '%')
    
    // Calculate estimated cost based on current OpenAI pricing
    const estimatedCost = 0.04 // $0.04 for 1024x1024 standard quality
    console.log('💰 Cost Analysis:')
    console.log('  - Model: gpt-image-1 (DALL-E 3)')
    console.log('  - Size: 1024x1024')
    console.log('  - Quality: Standard')
    console.log('  - Estimated cost: $' + estimatedCost.toFixed(4))
    console.log('  - Cost per enhancement: $0.04')
    
    // Upload to Supabase Storage to get a public URL
    const fileName = `enhanced-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`
    const filePath = `media/enhanced/${fileName}`
    
    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, enhancedImageBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      })
    
    if (uploadError) {
      console.error('Failed to upload enhanced image:', uploadError)
      return NextResponse.json({ 
        error: 'Failed to upload enhanced image to storage' 
      }, { status: 500 })
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(filePath)
    
    console.log('Enhanced image uploaded successfully:', publicUrl)
    
    console.log('🎉 Image Enhancement Complete!')
    console.log('📋 Final Summary:')
    console.log('  - User ID:', userId)
    console.log('  - Credits remaining:', creditsResult.newBalance)
    console.log('  - Cost per enhancement: $0.04')
    console.log('  - Enhanced image URL:', publicUrl)

    return NextResponse.json({
      success: true,
      enhancedImageUrl: publicUrl,
      creditsRemaining: creditsResult.newBalance
    })
  } catch (error) {
    console.error('Enhance image API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 