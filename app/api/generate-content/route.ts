import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { type, request: aiRequest } = await request.json()

    if (!type || !aiRequest) {
      return NextResponse.json({ error: 'Type and request are required' }, { status: 400 })
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY
    
    if (!OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    let result: any

    switch (type) {
      case 'caption':
        result = await generateCaption(aiRequest, OPENAI_API_KEY)
        break
      case 'hashtags':
        result = await generateHashtags(aiRequest, OPENAI_API_KEY)
        break
      case 'textElements':
        result = await generateTextElements(aiRequest, OPENAI_API_KEY)
        break
      case 'imagePrompt':
        result = await generateImagePrompt(aiRequest, OPENAI_API_KEY)
        break
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    return NextResponse.json({ success: true, result })

  } catch (error) {
    console.error('Content generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function generateCaption(request: any, apiKey: string): Promise<string> {
  const prompt = createCaptionPrompt(request)
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional social media content creator specializing in engaging, platform-optimized captions. Create captions that are authentic, engaging, and drive meaningful interactions.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 300,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    })
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  return data.choices[0].message.content.trim()
}

async function generateHashtags(request: any, apiKey: string): Promise<string[]> {
  const prompt = createHashtagPrompt(request)
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a social media hashtag expert. Generate relevant, trending hashtags that will increase post visibility and engagement.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 200,
      temperature: 0.7
    })
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices[0].message.content.trim()
  
  // Extract hashtags from response
  const hashtags = content.match(/#\w+/g) || []
  return hashtags.map((tag: string) => tag.substring(1)).slice(0, 12)
}

async function generateTextElements(request: any, apiKey: string): Promise<{
  headline: string
  subtext: string
  cta: string
}> {
  const prompt = createTextElementsPrompt(request)
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional graphic designer specializing in social media visuals. Generate compelling text elements for social media posts that are clear, impactful, and visually appealing. Always respond with valid JSON format.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 400,
      temperature: 0.7
    })
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices[0].message.content.trim()
  
  try {
    const parsed = JSON.parse(content)
    return {
      headline: parsed.headline || 'Amazing Headline',
      subtext: parsed.subtext || 'Compelling subtext that draws attention',
      cta: parsed.cta || 'Learn More'
    }
  } catch (parseError) {
    console.error('Failed to parse text elements response:', parseError)
    return {
      headline: 'Amazing Headline',
      subtext: 'Compelling subtext that draws attention',
      cta: 'Learn More'
    }
  }
}

async function generateImagePrompt(request: any, apiKey: string): Promise<string> {
  const prompt = createImagePromptRequest(request)
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional image prompt engineer. Create detailed, specific prompts for AI image generation that will produce high-quality, relevant visuals for social media content.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 300,
      temperature: 0.7
    })
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  return data.choices[0].message.content.trim()
}

// Helper functions for creating prompts
function createCaptionPrompt(request: any): string {
  const { businessContext, platform, theme, customPrompt, tone, targetAudience, niche } = request
  
  // If there's a custom prompt (from image analysis), use it directly
  if (customPrompt && customPrompt.includes('IMAGE CONTENT:')) {
    return customPrompt
  }
  
  return `Create an engaging social media caption for ${platform} that:
  
Business Context: ${businessContext}
Content Theme: ${theme}
Tone: ${tone || 'Professional and friendly'}
Target Audience: ${targetAudience || 'General audience'}
Industry/Niche: ${niche || 'Business'}

The caption must mention the business name: ${businessContext} and niche: ${niche}.

${customPrompt ? `Additional Context: ${customPrompt}` : ''}

Requirements:
- Optimized for ${platform} platform
- Engaging and authentic tone
- Include relevant emojis
- Encourage interaction
- Keep it concise but impactful
- Match the ${theme} theme

Generate a compelling caption that will drive engagement and align with the business context.`
}

function createHashtagPrompt(request: any): string {
  const { businessContext, platform, theme, customPrompt, niche } = request
  
  // If there's a custom prompt (from image analysis), use it directly
  if (customPrompt && customPrompt.includes('PRODUCT:')) {
    return customPrompt
  }
  
  return `Generate relevant hashtags for a ${platform} post about:
  
Business Context: ${businessContext}
Content Theme: ${theme}
Industry/Niche: ${niche || 'Business'}

${customPrompt ? `Additional Context: ${customPrompt}` : ''}

Requirements:
- 8-12 relevant hashtags
- Mix of popular and niche hashtags
- Include industry-specific tags
- Optimized for ${platform}
- Trending when possible
- No spaces in hashtags

Return only the hashtags separated by spaces, starting with #.`
}

function createTextElementsPrompt(request: any): string {
  const { businessContext, platform, theme, customPrompt, tone } = request
  
  // If there's a custom prompt (from image analysis), use it directly
  if (customPrompt && customPrompt.includes('PRODUCT:')) {
    return customPrompt
  }
  
  return `Create text elements for a social media visual post about:
  
Business Context: ${businessContext}
Platform: ${platform}
Theme: ${theme}
Tone: ${tone || 'Professional and friendly'}

${customPrompt ? `Additional Context: ${customPrompt}` : ''}

Generate three text elements in JSON format:
{
  "headline": "Main attention-grabbing headline (short and impactful)",
  "subtext": "Supporting text that provides context or details",
  "cta": "Call-to-action text (e.g., 'Learn More', 'Shop Now', 'Get Started')"
}

Requirements:
- Headline: 3-6 words, bold and impactful
- Subtext: 1-2 sentences, informative
- CTA: 2-3 words, action-oriented
- All text should work together cohesively
- Optimized for ${platform} visual content`
}

function createImagePromptRequest(request: any): string {
  const { businessContext, platform, theme, customPrompt, tone } = request
  
  return `Create a detailed image generation prompt for:
  
Business Context: ${businessContext}
Platform: ${platform}
Theme: ${theme}
Tone: ${tone || 'Professional and friendly'}

${customPrompt ? `Additional Context: ${customPrompt}` : ''}

Requirements:
- Detailed visual description
- Professional quality
- Optimized for ${platform}
- Matches the ${theme} theme
- High-resolution, social media ready
- Clean, modern aesthetic

Generate a comprehensive prompt that will create a perfect visual for this social media content.`
} 