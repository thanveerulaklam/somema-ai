import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json()

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY
    
    if (!OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    // Handle different types of image URLs
    let processedImageUrl = imageUrl
    
    if (imageUrl.startsWith('data:image/')) {
      // Already a data URL, use as is
      processedImageUrl = imageUrl
      console.log('Using data URL directly')
    } else if (imageUrl.startsWith('blob:')) {
      // Blob URLs should not reach here anymore since we convert them on client side
      console.error('Blob URL received on server side - this should not happen')
      return NextResponse.json({ 
        error: 'Invalid image URL format. Please try uploading the image again.' 
      }, { status: 400 })
    } else {
      // Download the image and convert to base64 (for media library URLs)
      try {
        console.log('Downloading image from URL:', imageUrl)
        const imageResponse = await fetch(imageUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; SomemaAI/1.0)'
          },
          signal: AbortSignal.timeout(30000) // 30 second timeout
        })
        
        if (!imageResponse.ok) {
          throw new Error(`Failed to download image: ${imageResponse.status}`)
        }
        
        const imageBuffer = await imageResponse.arrayBuffer()
        const base64 = Buffer.from(imageBuffer).toString('base64')
        const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg'
        processedImageUrl = `data:${mimeType};base64,${base64}`
        
        console.log('Successfully converted image to base64')
      } catch (downloadError) {
        console.error('Failed to download image:', downloadError)
        return NextResponse.json({ 
          error: 'Failed to download image from URL. Please try uploading the image again.' 
        }, { status: 400 })
      }
    }

    // Call OpenAI API for image analysis
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert product photographer and image analyst. Your job is to analyze product images with extreme detail and specificity.

IMPORTANT: You must be extremely specific about what you see. Do NOT use generic terms like "product" or "item". 

If you see sneakers, you MUST say "sneakers" and include details like:
- Brand (Nike, Adidas, etc.)
- Color (white, black, red, etc.)
- Style (running, casual, athletic, etc.)
- Material (leather, mesh, canvas, etc.)

If you see a handbag, you MUST say "handbag" and include:
- Type (tote, crossbody, clutch, etc.)
- Color and material
- Hardware details (gold, silver, etc.)

Examples of GOOD responses:
- "White Nike Air Max 270 sneakers with black swoosh on clean white background"
- "Red leather crossbody handbag with gold hardware and chain strap"
- "Black iPhone 14 Pro smartphone on white surface"

Examples of BAD responses:
- "Product on background" (too generic)
- "Item for sale" (not specific)
- "Professional product photo" (no details)

Return ONLY a JSON object with:
{
  "caption": "Detailed description of exactly what you see",
  "classification": "Specific product type (sneakers, handbag, phone, etc.)",
  "tags": ["specific", "relevant", "tags", "based", "on", "what", "you", "see"],
  "confidence": 0.9
}

Be as specific as possible. If you're not sure about a detail, still be specific about what you can see.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please analyze this image and provide a detailed caption, classification, and relevant tags.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: processedImageUrl
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API error response:', errorText)
      
      // Try to parse the error response for more details
      try {
        const errorData = JSON.parse(errorText)
        if (errorData.error?.message) {
          return NextResponse.json({ 
            error: `OpenAI API error: ${errorData.error.message}` 
          }, { status: 500 })
        }
      } catch (parseError) {
        // If we can't parse the error, use the raw text
      }
      
      return NextResponse.json({ 
        error: `OpenAI API error: ${response.status} - ${errorText.substring(0, 200)}` 
      }, { status: 500 })
    }

    const data = await response.json()
    const content = data.choices[0].message.content.trim()
    
    try {
      // Clean the content - remove markdown code blocks if present
      let cleanedContent = content.trim()
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.replace(/^```json\n/, '').replace(/\n```$/, '')
      } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.replace(/^```\n/, '').replace(/\n```$/, '')
      }
      
      // Parse JSON response
      const parsed = JSON.parse(cleanedContent)
      console.log('Parsed CLIP analysis:', parsed)
      
      // Validate the response has the required fields
      if (!parsed.caption || !parsed.classification) {
        throw new Error('Missing required fields in CLIP response')
      }
      
      return NextResponse.json({
        success: true,
        analysis: {
          caption: parsed.caption,
          classification: parsed.classification,
          tags: parsed.tags || [],
          confidence: parsed.confidence || 0.8
        }
      })
    } catch (parseError) {
      console.error('Failed to parse CLIP analysis response:', parseError)
      console.error('Raw content was:', content)
      
      // Try to extract information from the raw text if JSON parsing fails
      const extractedInfo = extractInfoFromText(content)
      
      return NextResponse.json({
        success: true,
        analysis: extractedInfo
      })
    }

  } catch (error) {
    console.error('Image analysis error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to extract information from text when JSON parsing fails
function extractInfoFromText(text: string): {
  caption: string
  classification: string
  tags: string[]
  confidence: number
} {
  console.log('Extracting info from text:', text)
  
  // Try to find specific product mentions
  const productKeywords = [
    'sneaker', 'sneakers', 'shoe', 'shoes', 'boot', 'boots', 'sandals', 'flip flops',
    'handbag', 'bag', 'purse', 'backpack', 'wallet',
    'phone', 'smartphone', 'laptop', 'computer', 'tablet',
    'watch', 'jewelry', 'ring', 'necklace', 'earrings',
    'shirt', 't-shirt', 'pants', 'jeans', 'dress', 'skirt',
    'hat', 'cap', 'sunglasses', 'glasses'
  ]
  
  const lowerText = text.toLowerCase()
  let foundProduct = 'product'
  let foundTags: string[] = ['product']
  
  // Look for specific product types
  for (const keyword of productKeywords) {
    if (lowerText.includes(keyword)) {
      foundProduct = keyword
      foundTags.push(keyword)
      break
    }
  }
  
  // Look for colors
  const colors = ['white', 'black', 'red', 'blue', 'green', 'yellow', 'pink', 'purple', 'orange', 'brown', 'gray', 'grey']
  for (const color of colors) {
    if (lowerText.includes(color)) {
      foundTags.push(color)
    }
  }
  
  // Look for brands
  const brands = ['nike', 'adidas', 'puma', 'reebok', 'converse', 'vans', 'jordan', 'apple', 'samsung', 'sony']
  for (const brand of brands) {
    if (lowerText.includes(brand)) {
      foundTags.push(brand)
    }
  }
  
  // Create a caption based on what we found
  let caption = `A ${foundProduct}`
  if (foundTags.includes('white') || foundTags.includes('black')) {
    caption += ` in ${foundTags.find(tag => colors.includes(tag))} color`
  }
  caption += ' on a clean background'
  
  return {
    caption,
    classification: foundProduct,
    tags: foundTags.slice(0, 10), // Limit to 10 tags
    confidence: 0.6 // Lower confidence since we're extracting from text
  }
} 