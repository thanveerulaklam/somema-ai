// AI Services Integration
// OpenAI GPT-4, Claude Haiku, and Canva API

import { supabase } from './supabase'

export interface AIGenerationRequest {
  businessContext: string
  platform: 'instagram' | 'facebook' | 'twitter'
  theme: string
  customPrompt?: string
  tone?: string
  targetAudience?: string
  niche?: string
}

export interface GeneratedContent {
  caption: string
  hashtags: string[]
  imagePrompt: string
  imageUrl?: string
  textElements: {
    headline: string
    subtext: string
    cta: string
  }
  canvaTemplate?: string
}

export interface PostIdea {
  id: string
  title: string
  description: string
  angle: string
  targetAudience: string
  expectedEngagement: string
}

export interface CanvaTemplate {
  id: string
  name: string
  thumbnail: string
  category: string
  dimensions: {
    width: number
    height: number
  }
}

// OpenAI GPT-4 Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENAI_BASE_URL = 'https://api.openai.com/v1'

// Anthropic Claude Configuration
const ANTHROPIC_API_KEY = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY
const ANTHROPIC_BASE_URL = 'https://api.anthropic.com/v1'

// Canva API Configuration
const CANVA_API_KEY = process.env.NEXT_PUBLIC_CANVA_API_KEY
const CANVA_BASE_URL = 'https://api.canva.com/v1'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// OpenAI GPT-4 for Caption Generation
export async function generateCaptionWithGPT4(request: AIGenerationRequest): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured')
  }

  const prompt = createCaptionPrompt(request)
  
  try {
    const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
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
      const errorData = await response.text()
      console.error('OpenAI API error response:', errorData)
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`)
    }

    const data = await response.json()
    return data.choices[0].message.content.trim()
  } catch (error) {
    console.error('GPT-4 caption generation error:', error)
    // Return fallback caption instead of throwing
    return `🎉 Amazing content from ${request.businessContext}! Don't miss out on this incredible opportunity!`
  }
}

// OpenAI GPT-4 for Text Elements Generation (Headline, Subtext, CTA)
export async function generateTextElementsWithGPT4(request: AIGenerationRequest): Promise<{
  headline: string
  subtext: string
  cta: string
}> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured')
  }

  const prompt = createTextElementsPrompt(request)
  
  try {
    const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
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
      const errorData = await response.text()
      console.error('OpenAI API error response:', errorData)
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`)
    }

    const data = await response.json()
    const content = data.choices[0].message.content.trim()
    
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(content)
      return {
        headline: parsed.headline || 'Amazing Headline',
        subtext: parsed.subtext || 'Compelling subtext that draws attention',
        cta: parsed.cta || 'Learn More'
      }
    } catch (parseError) {
      console.error('Failed to parse JSON response, cleaning and retrying:', parseError)
      // Clean markdown formatting and try again
      let cleanedContent = content
        .replace(/```json\s*/g, '')  // Remove opening ```json
        .replace(/```\s*$/g, '')     // Remove closing ```
        .replace(/^```\s*/g, '')     // Remove any leading ```
        .replace(/\s*```$/g, '')     // Remove any trailing ```
        .trim()
      
      try {
        const parsed = JSON.parse(cleanedContent)
        return {
          headline: parsed.headline || 'Amazing Headline',
          subtext: parsed.subtext || 'Compelling subtext that draws attention',
          cta: parsed.cta || 'Learn More'
        }
      } catch (secondParseError) {
        console.error('Failed to parse cleaned JSON, using text extraction:', secondParseError)
        console.log('Raw content was:', content)
        console.log('Cleaned content was:', cleanedContent)
        // Fallback: extract text elements from plain text
        const lines = content.split('\n').filter((line: string) => line.trim())
        return {
          headline: lines[0]?.replace(/^headline:?\s*/i, '') || 'Amazing Headline',
          subtext: lines[1]?.replace(/^subtext:?\s*/i, '') || 'Compelling subtext that draws attention',
          cta: lines[2]?.replace(/^cta:?\s*/i, '') || 'Learn More'
        }
      }
    }
  } catch (error) {
    console.error('GPT-4 text elements generation error:', error)
    return {
      headline: 'Amazing Headline',
      subtext: 'Compelling subtext that draws attention',
      cta: 'Learn More'
    }
  }
}

// Anthropic Claude Haiku for Hashtag Suggestions
export async function generateHashtagsWithClaude(request: AIGenerationRequest): Promise<string[]> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('Anthropic API key not configured')
  }

  const prompt = createHashtagPrompt(request)
  
  try {
    const response = await fetch(`${ANTHROPIC_BASE_URL}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANTHROPIC_API_KEY}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    })

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`)
    }

    const data = await response.json()
    const hashtagText = data.content[0].text.trim()
    
    // Parse hashtags from response
    const hashtags = hashtagText
      .split(/[,\n]/)
      .map((tag: string) => tag.trim().replace(/^#/, ''))
      .filter((tag: string) => tag.length > 0 && tag.length <= 30)
      .slice(0, 15) // Limit to 15 hashtags
    
    return hashtags
  } catch (error) {
    console.error('Claude hashtag generation error:', error)
    throw new Error('Failed to generate hashtags with Claude')
  }
}

// OpenAI GPT-4 for Hashtag Generation (alternative to Claude)
export async function generateHashtagsWithGPT4(request: AIGenerationRequest): Promise<string[]> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured')
  }

  const prompt = createHashtagPrompt(request)
  
  try {
    const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a social media expert specializing in hashtag optimization. Generate relevant, trending hashtags that will increase post visibility and engagement.'
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
      const errorData = await response.text()
      console.error('OpenAI API error response:', errorData)
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`)
    }

    const data = await response.json()
    const hashtagText = data.choices[0].message.content.trim()
    
    // Parse hashtags from response
    const hashtags = hashtagText
      .split(/[,\n]/)
      .map((tag: string) => tag.trim().replace(/^#/, ''))
      .filter((tag: string) => tag.length > 0 && tag.length <= 30)
      .slice(0, 15) // Limit to 15 hashtags
    
    return hashtags
  } catch (error) {
    console.error('GPT-4 hashtag generation error:', error)
    // Return fallback hashtags instead of throwing
    return ['business', 'marketing', 'socialmedia', 'innovation', 'success']
  }
}

// GPT-4o-mini for Image Prompt Generation
export async function generateImagePromptWithGPT4(request: AIGenerationRequest): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured')
  }

  const prompt = createImagePromptRequest(request)
  
  try {
    const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at creating detailed, visual image prompts for AI image generation. Create prompts that are specific, descriptive, and optimized for creating engaging social media visuals.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.8
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('OpenAI API error response:', errorData)
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`)
    }

    const data = await response.json()
    return data.choices[0].message.content.trim()
  } catch (error) {
    console.error('GPT-4 image prompt generation error:', error)
    // Return fallback image prompt instead of throwing
    return `Professional ${request.theme} photography with modern lighting and clean composition, suitable for social media`
  }
}



// Canva API for Template Discovery
export async function getCanvaTemplates(category?: string): Promise<CanvaTemplate[]> {
  if (!CANVA_API_KEY) {
    throw new Error('Canva API key not configured')
  }

  try {
    const url = category 
      ? `${CANVA_BASE_URL}/templates?category=${encodeURIComponent(category)}`
      : `${CANVA_BASE_URL}/templates`
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${CANVA_API_KEY}`,
        'Content-Type': 'application/json',
      }
    })

    if (!response.ok) {
      throw new Error(`Canva API error: ${response.status}`)
    }

    const data = await response.json()
    return data.templates || []
  } catch (error) {
    console.error('Canva template fetch error:', error)
    throw new Error('Failed to fetch Canva templates')
  }
}

// Canva API for Template Customization
export async function customizeCanvaTemplate(
  templateId: string, 
  customizations: {
    text?: Record<string, string>
    images?: Record<string, string>
    colors?: Record<string, string>
  }
): Promise<string> {
  if (!CANVA_API_KEY) {
    throw new Error('Canva API key not configured')
  }

  try {
    const response = await fetch(`${CANVA_BASE_URL}/templates/${templateId}/customize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CANVA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customizations
      })
    })

    if (!response.ok) {
      throw new Error(`Canva API error: ${response.status}`)
    }

    const data = await response.json()
    return data.designUrl
  } catch (error) {
    console.error('Canva template customization error:', error)
    throw new Error('Failed to customize Canva template')
  }
}

// OpenAI GPT-4 for Post Ideas Generation
export async function generatePostIdeasWithGPT4(request: AIGenerationRequest): Promise<PostIdea[]> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured')
  }

  const prompt = createPostIdeasPrompt(request)
  
  try {
    const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a creative social media strategist. Generate 3 unique, engaging post ideas that are tailored to the business profile and platform. Each idea should be different in approach and appeal to different aspects of the target audience. Always respond with valid JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.8
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('OpenAI API error response:', errorData)
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`)
    }

    const data = await response.json()
    const content = data.choices[0].message.content.trim()
    
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(content)
      if (Array.isArray(parsed)) {
        return parsed.map((idea, index) => ({
          id: `idea-${index + 1}`,
          title: idea.title || `Post Idea ${index + 1}`,
          description: idea.description || 'Engaging content for your audience',
          angle: idea.angle || 'Professional and engaging',
          targetAudience: idea.targetAudience || request.targetAudience || 'General audience',
          expectedEngagement: idea.expectedEngagement || 'High engagement potential'
        }))
      }
      throw new Error('Response is not an array')
    } catch (parseError) {
      console.error('Failed to parse JSON response, cleaning and retrying:', parseError)
      // Clean markdown formatting and try again
      let cleanedContent = content
        .replace(/```json\s*/g, '')  // Remove opening ```json
        .replace(/```\s*$/g, '')     // Remove closing ```
        .replace(/^```\s*/g, '')     // Remove any leading ```
        .replace(/\s*```$/g, '')     // Remove any trailing ```
        .trim()
      
      try {
        const parsed = JSON.parse(cleanedContent)
        if (Array.isArray(parsed)) {
          return parsed.map((idea, index) => ({
            id: `idea-${index + 1}`,
            title: idea.title || `Post Idea ${index + 1}`,
            description: idea.description || 'Engaging content for your audience',
            angle: idea.angle || 'Professional and engaging',
            targetAudience: idea.targetAudience || request.targetAudience || 'General audience',
            expectedEngagement: idea.expectedEngagement || 'High engagement potential'
          }))
        }
        throw new Error('Response is not an array')
      } catch (secondParseError) {
        console.error('Failed to parse cleaned JSON, using fallback ideas:', secondParseError)
        console.log('Raw content was:', content)
        console.log('Cleaned content was:', cleanedContent)
        // Fallback: return 3 generic post ideas
        return [
          {
            id: 'idea-1',
            title: 'Behind the Scenes',
            description: 'Show your audience what goes on behind the scenes of your business',
            angle: 'Authentic and transparent',
            targetAudience: request.targetAudience || 'General audience',
            expectedEngagement: 'High engagement potential'
          },
          {
            id: 'idea-2',
            title: 'Value-Driven Content',
            description: 'Share valuable insights, tips, or knowledge related to your industry',
            angle: 'Educational and helpful',
            targetAudience: request.targetAudience || 'General audience',
            expectedEngagement: 'High engagement potential'
          },
          {
            id: 'idea-3',
            title: 'Customer Success Story',
            description: 'Highlight a customer success story or testimonial',
            angle: 'Social proof and relatable',
            targetAudience: request.targetAudience || 'General audience',
            expectedEngagement: 'High engagement potential'
          }
        ]
      }
    }
  } catch (error) {
    console.error('GPT-4 post ideas generation error:', error)
    // Return fallback post ideas
    return [
      {
        id: 'idea-1',
        title: 'Behind the Scenes',
        description: 'Show your audience what goes on behind the scenes of your business',
        angle: 'Authentic and transparent',
        targetAudience: request.targetAudience || 'General audience',
        expectedEngagement: 'High engagement potential'
      },
      {
        id: 'idea-2',
        title: 'Value-Driven Content',
        description: 'Share valuable insights, tips, or knowledge related to your industry',
        angle: 'Educational and helpful',
        targetAudience: request.targetAudience || 'General audience',
        expectedEngagement: 'High engagement potential'
      },
      {
        id: 'idea-3',
        title: 'Customer Success Story',
        description: 'Highlight a customer success story or testimonial',
        angle: 'Social proof and relatable',
        targetAudience: request.targetAudience || 'General audience',
        expectedEngagement: 'High engagement potential'
      }
    ]
  }
}

// Prompt Templates
function createCaptionPrompt(request: AIGenerationRequest): string {
  const { businessContext, platform, theme, customPrompt, tone, targetAudience, niche } = request
  
  return `Create an engaging social media caption for ${platform} with the following requirements:

Business Context: ${businessContext}
Industry/Niche: ${niche || 'General business'}
Theme: ${theme}
${customPrompt ? `Custom Requirements: ${customPrompt}` : ''}
${tone ? `Brand Tone: ${tone}` : ''}
${targetAudience ? `Target Audience: ${targetAudience}` : ''}

Platform-specific requirements:
${platform === 'instagram' ? '- Use emojis strategically\n- Include call-to-action\n- Keep under 2200 characters' : ''}
${platform === 'facebook' ? '- More conversational tone\n- Encourage engagement\n- Include questions' : ''}
${platform === 'twitter' ? '- Concise and impactful\n- Use trending hashtags\n- Under 280 characters' : ''}

Create a caption that is authentic, engaging, and drives meaningful interactions. Make it specific to ${businessContext} and relevant to the ${niche || 'business'} industry.`
}

function createHashtagPrompt(request: AIGenerationRequest): string {
  const { businessContext, platform, theme, niche } = request
  
  return `Generate 10-15 relevant hashtags for a social media post with the following details:

Business: ${businessContext}
Industry/Niche: ${niche || 'General business'}
Theme: ${theme}
Platform: ${platform}

Requirements:
- Mix of popular and niche hashtags
- Relevant to the business, industry (${niche || 'general business'}), and theme
- Platform-appropriate
- No spaces, only letters, numbers, and underscores
- Return only the hashtag names separated by commas (no # symbols)

Example format: business, marketing, socialmedia, digitalmarketing, entrepreneur`
}

function createImagePromptRequest(request: AIGenerationRequest): string {
  const { businessContext, platform, theme, niche } = request
  
  return `Create a detailed image prompt for AI image generation based on:

Business: ${businessContext}
Industry/Niche: ${niche || 'General business'}
Theme: ${theme}
Platform: ${platform}

Requirements:
- Specific visual details relevant to ${niche || 'business'} industry
- Professional and modern style
- Optimized for social media
- Include composition, lighting, and mood
- Suitable for the platform's aspect ratio
- Clean background with no text, logos, or watermarks
- High-quality, professional photography style
- Relevant to ${businessContext} and ${niche || 'business'} industry

Create a prompt that will generate an engaging, professional image for social media that represents ${businessContext} in the ${niche || 'business'} industry.`
}

function createTextElementsPrompt(request: AIGenerationRequest): string {
  const { businessContext, platform, theme, niche } = request
  
  return `Generate compelling text elements for a social media post that will be overlaid on an image. Create a headline, subtext, and call-to-action that work together to create an engaging visual post.

Business: ${businessContext}
Industry/Niche: ${niche || 'General business'}
Theme: ${theme}
Platform: ${platform}

Requirements:
- Headline: Short, impactful, attention-grabbing (max 8 words)
- Subtext: Supporting text that explains or expands on the headline (max 15 words)
- CTA: Clear call-to-action that encourages engagement (max 5 words)
- All text should be platform-appropriate and brand-consistent
- Return ONLY a valid JSON object (no markdown formatting, no code blocks)
- Use these exact keys: "headline", "subtext", "cta"

Example format (return exactly like this, no markdown):
{
  "headline": "Amazing Headline",
  "subtext": "Compelling subtext that draws attention",
  "cta": "Learn More"
}

Make the text elements compelling, clear, and appropriate for ${businessContext} in the ${niche || 'business'} industry.`
}

function createPostIdeasPrompt(request: AIGenerationRequest): string {
  const { businessContext, platform, theme, niche } = request
  
  return `Generate 3 unique, engaging post ideas that are tailored to the business profile and platform. Each idea should be different in approach and appeal to different aspects of the target audience.

Business: ${businessContext}
Industry/Niche: ${niche || 'General business'}
Theme: ${theme}
Platform: ${platform}

Requirements:
- Each idea should be different in approach and appeal to different aspects of the target audience
- Ideas should be engaging, relevant to the business, and platform-appropriate
- Return ONLY a valid JSON array (no markdown formatting, no code blocks)
- Each object must have these exact keys: "id", "title", "description", "angle", "targetAudience", "expectedEngagement"

Example format (return exactly like this, no markdown):
[
  {
    "id": "idea-1",
    "title": "Idea Title 1",
    "description": "Description of Idea 1",
    "angle": "Professional and engaging",
    "targetAudience": "General audience",
    "expectedEngagement": "High engagement potential"
  },
  {
    "id": "idea-2",
    "title": "Idea Title 2",
    "description": "Description of Idea 2",
    "angle": "Educational and helpful",
    "targetAudience": "General audience",
    "expectedEngagement": "High engagement potential"
  },
  {
    "id": "idea-3",
    "title": "Idea Title 3",
    "description": "Description of Idea 3",
    "angle": "Social proof and relatable",
    "targetAudience": "General audience",
    "expectedEngagement": "High engagement potential"
  }
]`
}

// Combined AI Content Generation
export async function generateCompleteContent(request: AIGenerationRequest): Promise<GeneratedContent> {
  try {
    let caption: string
    let hashtags: string[]
    let imagePrompt: string
    let textElements: { headline: string; subtext: string; cta: string }
    
    // Generate caption with GPT-4 (required)
    try {
      caption = await generateCaptionWithGPT4(request)
    } catch (error) {
      console.error('GPT-4 caption generation failed, using fallback:', error)
      const fallback = generateFallbackContent(request)
      caption = fallback.caption
    }
    
    // Generate hashtags with GPT-4 (since we don't have Anthropic)
    try {
      hashtags = await generateHashtagsWithGPT4(request)
    } catch (error) {
      console.error('GPT-4 hashtag generation failed, using fallback:', error)
      const fallback = generateFallbackContent(request)
      hashtags = fallback.hashtags
    }
    
    // Generate image prompt with GPT-4 (optional)
    try {
      imagePrompt = await generateImagePromptWithGPT4(request)
    } catch (error) {
      console.error('GPT-4 image prompt generation failed, using fallback:', error)
      const fallback = generateFallbackContent(request)
      imagePrompt = fallback.imagePrompt
    }
    
    // Generate text elements with GPT-4
    try {
      textElements = await generateTextElementsWithGPT4(request)
    } catch (error) {
      console.error('GPT-4 text elements generation failed, using fallback:', error)
      const fallback = generateFallbackContent(request)
      textElements = fallback.textElements
    }
    
    return {
      caption,
      hashtags,
      imagePrompt,
      textElements
    }
  } catch (error) {
    console.error('Complete content generation error:', error)
    // Final fallback if everything fails
    return generateFallbackContent(request)
  }
}

// Generate content based on selected post idea
export async function generateContentFromPostIdea(
  request: AIGenerationRequest, 
  selectedIdea: PostIdea
): Promise<GeneratedContent> {
  try {
    // Create enhanced request with post idea context
    const enhancedRequest: AIGenerationRequest = {
      ...request,
      customPrompt: `${request.customPrompt || ''} Post Idea: ${selectedIdea.title} - ${selectedIdea.description}. Angle: ${selectedIdea.angle}. Target Audience: ${selectedIdea.targetAudience}.`
    }

    let caption: string
    let hashtags: string[]
    let imagePrompt: string
    let textElements: { headline: string; subtext: string; cta: string }
    
    // Generate caption with GPT-4 (required)
    try {
      caption = await generateCaptionWithGPT4(enhancedRequest)
    } catch (error) {
      console.error('GPT-4 caption generation failed, using fallback:', error)
      const fallback = generateFallbackContent(enhancedRequest)
      caption = fallback.caption
    }
    
    // Generate hashtags with GPT-4
    try {
      hashtags = await generateHashtagsWithGPT4(enhancedRequest)
    } catch (error) {
      console.error('GPT-4 hashtag generation failed, using fallback:', error)
      const fallback = generateFallbackContent(enhancedRequest)
      hashtags = fallback.hashtags
    }
    
    // Generate image prompt with GPT-4
    try {
      imagePrompt = await generateImagePromptWithGPT4(enhancedRequest)
    } catch (error) {
      console.error('GPT-4 image prompt generation failed, using fallback:', error)
      const fallback = generateFallbackContent(enhancedRequest)
      imagePrompt = fallback.imagePrompt
    }
    
    // Generate text elements with GPT-4
    try {
      textElements = await generateTextElementsWithGPT4(enhancedRequest)
    } catch (error) {
      console.error('GPT-4 text elements generation failed, using fallback:', error)
      const fallback = generateFallbackContent(enhancedRequest)
      textElements = fallback.textElements
    }
    
    return {
      caption,
      hashtags,
      imagePrompt,
      textElements
    }
  } catch (error) {
    console.error('Content generation from post idea error:', error)
    // Final fallback if everything fails
    return generateFallbackContent(request)
  }
}

// Fallback content generation (when AI services are unavailable)
export function generateFallbackContent(request: AIGenerationRequest): GeneratedContent {
  const { businessContext, platform, theme, tone, targetAudience, niche } = request
  
  const businessName = businessContext || 'Your Business'
  const industry = niche || 'business'
  
  // Generate context-aware fallback content
  const captions = {
    instagram: [
      `🚀 Transform your ${industry} with ${businessName}! Discover how we're revolutionizing the way businesses operate. #${industry.replace(/\s+/g, '')} #innovation`,
      `✨ Ready to elevate your ${industry} game? ${businessName} has got you covered with cutting-edge solutions that drive results. #${industry.replace(/\s+/g, '')} #success`,
      `💡 Innovation meets ${industry} excellence at ${businessName}. Join the revolution and see the difference quality makes. #${industry.replace(/\s+/g, '')} #excellence`
    ],
    facebook: [
      `Exciting news from ${businessName}! We're bringing innovation to the ${industry} industry. What challenges are you facing in your ${industry} journey? Share your thoughts below! 👇`,
      `${businessName} is here to transform your ${industry} experience. We believe every business deserves cutting-edge solutions. What's your biggest ${industry} challenge?`,
      `The future of ${industry} is here, and ${businessName} is leading the charge! We'd love to hear about your ${industry} goals and how we can help you achieve them.`
    ],
    twitter: [
      `🚀 ${businessName} revolutionizing ${industry}. Innovation that works. #${industry.replace(/\s+/g, '')} #innovation`,
      `💡 ${industry} solutions that actually deliver. ${businessName} - where excellence meets results. #${industry.replace(/\s+/g, '')} #excellence`,
      `✨ ${businessName} - your ${industry} partner for success. Quality, innovation, results. #${industry.replace(/\s+/g, '')} #success`
    ]
  }

  const hashtags = [
    industry.replace(/\s+/g, ''),
    'innovation',
    'business',
    'success',
    'excellence',
    'quality',
    'results',
    'transformation',
    'growth',
    'future',
    'technology',
    'solutions'
  ]

  const imagePrompts = [
    `Professional ${industry} workspace with modern technology, clean design, ${tone || 'professional'} atmosphere, high-quality photography, social media optimized`,
    `Innovative ${industry} concept visualization, sleek design, ${tone || 'professional'} styling, perfect for social media, clean background`,
    `Modern ${industry} business environment, professional setup, ${tone || 'professional'} tone, high-resolution, social media ready`
  ]

  const textElements = {
    headline: `${businessName}`,
    subtext: `Revolutionizing ${industry} with innovative solutions`,
    cta: `Learn More`
  }

  return {
    caption: captions[platform][Math.floor(Math.random() * captions[platform].length)],
    hashtags: hashtags.slice(0, 12),
    imagePrompt: imagePrompts[Math.floor(Math.random() * imagePrompts.length)],
    textElements: textElements
  }
}

// Download and store image permanently in Supabase storage
export async function downloadAndStoreImage(imageUrl: string, businessName: string): Promise<string> {
  try {
    // Use server-side API route to avoid CORS issues
    const response = await fetch('/api/download-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUrl,
        businessName
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.success) {
      console.log('Image stored permanently via API:', data.publicUrl)
      return data.publicUrl
    } else {
      throw new Error(data.error || 'Failed to store image')
    }
    
  } catch (error) {
    console.error('Error downloading and storing image:', error)
    
    // If API fails, return the original URL and let the post editor handle it
    console.log('Returning original image URL as fallback:', imageUrl)
    return imageUrl
  }
}

// Background Removal Service (using Remove.bg API via our API route)
export async function removeBackground(imageUrl: string): Promise<string> {
  try {
    const response = await fetch('/api/remove-background', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to remove background')
    }

    const data = await response.json()
    return data.imageData
  } catch (error) {
    console.error('Background removal error:', error)
    throw new Error('Failed to remove background from image')
  }
}

// CLIP-based Image Analysis for Captioning and Classification (via API route)
export async function analyzeImageWithCLIP(imageUrl: string): Promise<{
  caption: string
  classification: string
  tags: string[]
  confidence: number
}> {
  try {
    const response = await fetch(`/api/analyze-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to analyze image')
    }

    const data = await response.json()
    return data.analysis
  } catch (error) {
    console.error('CLIP image analysis error:', error)
    throw new Error('Failed to analyze image')
  }
}

// Enhanced content generation based on analyzed image
export async function generateContentFromAnalyzedImage(
  imageAnalysis: {
    caption: string
    classification: string
    tags: string[]
    confidence: number
  },
  request: AIGenerationRequest
): Promise<GeneratedContent> {
  try {
    // Generate caption based on image analysis
    const enhancedRequest = {
      ...request,
      customPrompt: `
        Create a social media caption for ${request.platform} about this specific product:
        
        IMAGE CONTENT: ${imageAnalysis.caption}
        PRODUCT TYPE: ${imageAnalysis.classification}
        PRODUCT TAGS: ${imageAnalysis.tags.join(', ')}
        
        BUSINESS CONTEXT: ${request.businessContext}
        PLATFORM: ${request.platform}
        THEME: ${request.theme}
        ADDITIONAL CONTEXT: ${request.customPrompt || ''}
        
        Requirements:
        - Focus specifically on the product shown in the image (${imageAnalysis.caption})
        - Use the actual product details from the image analysis
        - Make it engaging and relevant to the specific product
        - Include relevant emojis
        - Optimized for ${request.platform}
        - Keep it authentic and product-focused
      `
    }

    const hashtagRequest = {
      ...request,
      customPrompt: `
        Generate hashtags for a ${request.platform} post about this specific product:
        
        PRODUCT: ${imageAnalysis.caption}
        PRODUCT TYPE: ${imageAnalysis.classification}
        PRODUCT TAGS: ${imageAnalysis.tags.join(', ')}
        
        Requirements:
        - Use hashtags specific to the actual product shown
        - Include product-specific tags (e.g., #sneakers, #nike, #athletic)
        - Mix of popular and niche hashtags
        - Relevant to the product category
        - Optimized for ${request.platform}
      `
    }

    const textElementsRequest = {
      ...request,
      customPrompt: `
        Create text elements for a social media visual about this specific product:
        
        PRODUCT: ${imageAnalysis.caption}
        PRODUCT TYPE: ${imageAnalysis.classification}
        PRODUCT TAGS: ${imageAnalysis.tags.join(', ')}
        
        BUSINESS: ${request.businessContext}
        PLATFORM: ${request.platform}
        
        Generate three text elements in JSON format:
        {
          "headline": "Product-specific headline (e.g., 'Premium Sneakers', 'Stylish Handbag')",
          "subtext": "Brief description highlighting key features of the specific product",
          "cta": "Action-oriented text (e.g., 'Shop Now', 'Get Yours', 'Learn More')"
        }
        
        Requirements:
        - Headline should be specific to the product type
        - Subtext should mention actual product features
        - CTA should be relevant to the product category
        - All text should work together cohesively
      `
    }

    console.log('Starting content generation with analysis:', imageAnalysis)
    
    // Use the new API route for content generation
    const [captionResponse, hashtagsResponse, textElementsResponse] = await Promise.all([
      fetch(`/api/generate-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'caption', request: enhancedRequest })
      }),
      fetch(`/api/generate-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'hashtags', request: hashtagRequest })
      }),
      fetch(`/api/generate-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'textElements', request: textElementsRequest })
      })
    ])
    
    console.log('API Response Status:', {
      caption: captionResponse.status,
      hashtags: hashtagsResponse.status,
      textElements: textElementsResponse.status
    })

    if (!captionResponse.ok || !hashtagsResponse.ok || !textElementsResponse.ok) {
      console.error('API responses not ok:', {
        caption: captionResponse.status,
        hashtags: hashtagsResponse.status,
        textElements: textElementsResponse.status
      })
      throw new Error('Failed to generate content')
    }

    const [captionData, hashtagsData, textElementsData] = await Promise.all([
      captionResponse.json(),
      hashtagsResponse.json(),
      textElementsResponse.json()
    ])

    console.log('Generated content data:', { captionData, hashtagsData, textElementsData })

    return {
      caption: captionData.result,
      hashtags: hashtagsData.result,
      imagePrompt: imageAnalysis.caption,
      textElements: textElementsData.result
    }
  } catch (error) {
    console.error('Error generating content from analyzed image:', error)
    
    // Create content based on image analysis even if API fails
    console.log('Creating fallback content based on image analysis:', imageAnalysis)
    
    const fallbackCaption = `🔥 Check out these amazing ${imageAnalysis.classification}! ${imageAnalysis.caption} 💯`
    const fallbackHashtags = imageAnalysis.tags.map(tag => tag.replace(/\s+/g, '')).slice(0, 8)
    const fallbackTextElements = {
      headline: `${imageAnalysis.classification.charAt(0).toUpperCase() + imageAnalysis.classification.slice(1)}`,
      subtext: `Premium ${imageAnalysis.classification} for the modern lifestyle`,
      cta: 'Shop Now'
    }
    
    return {
      caption: fallbackCaption,
      hashtags: fallbackHashtags,
      imagePrompt: imageAnalysis.caption,
      textElements: fallbackTextElements
    }
  }
}

// New function to generate Instagram caption and hashtags (no headline)
export async function generateInstagramContentFromCLIP(
  imageAnalysis: {
    caption: string
    classification: string
    tags: string[]
    confidence: number
  },
  businessProfile: {
    business_name: string
    niche: string
    tone: string
    audience: string
  }
): Promise<{
  caption: string
  hashtags: string[]
}> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured')
  }

  try {
    const productType = imageAnalysis.classification.toLowerCase()
    const productTags = imageAnalysis.tags.join(', ')
    const productDescription = imageAnalysis.caption

    // Detect carousel by checking for '|' in caption (joined captions)
    const isCarousel = productDescription.includes('|')
    let prompt = ''
    if (isCarousel) {
      // Carousel: build a prompt listing each image
      const captions = productDescription.split('|').map(c => c.trim()).filter(Boolean)
      prompt = `You are a professional social media content creator. Based on the following analysis of a carousel (multi-image) Instagram post and the business profile, create:\n\n1. A single engaging Instagram caption (2-3 sentences max) that describes the entire carousel and connects the images into a cohesive story.\n2. Relevant hashtags (5-8 hashtags) for the whole carousel.\n\nCAROUSEL IMAGES:\n${captions.map((c, i) => `- Image ${i + 1}: ${c}`).join('\n')}\n\nTAGS: ${imageAnalysis.tags.join(', ')}\n\nBUSINESS PROFILE:\n- Business Name: ${businessProfile.business_name}\n- Industry: ${businessProfile.niche}\n- Brand Tone: ${businessProfile.tone}\n- Target Audience: ${businessProfile.audience}\n\nIMPORTANT: Incorporate the business name "${businessProfile.business_name}" naturally into the caption. Make the content feel authentic to this specific business and its ${businessProfile.tone} tone. Target the ${businessProfile.audience} audience and focus on the ${businessProfile.niche} industry. Focus on the specific product details from the image analysis. Don't use generic phrases like "elevate your style" or "check out this amazing product" unless they're specifically relevant to the product shown. Respond in this exact JSON format:\n\n{
  "caption": "Your engaging Instagram caption here",
  "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}`
    } else {
      // Single image: create a more specific prompt based on the product type
      let promptStyle = ''
      if (productType.includes('shirt') || productType.includes('dress')) {
        promptStyle = 'Focus on the specific style, color, and fit of this clothing item. Mention the fabric, pattern, or design details.'
      } else if (productType.includes('jacket') || productType.includes('outerwear')) {
        promptStyle = 'Highlight the jacket\'s style, material, and versatility. Mention how it can be styled for different occasions.'
      } else if (productType.includes('casual') || productType.includes('outfit')) {
        promptStyle = 'Emphasize the casual, comfortable style and how it works for everyday wear. Mention the combination of pieces.'
      } else {
        promptStyle = 'Focus on the specific features and benefits of this product. Mention what makes it unique and desirable.'
      }
      
      prompt = `You are a professional social media content creator. Based on the following image analysis and business profile, create:\n\n1. An engaging Instagram caption (2-3 sentences max)\n2. Relevant hashtags (5-8 hashtags)\n\nIMAGE ANALYSIS:\n- Product: ${imageAnalysis.classification}\n- Description: ${imageAnalysis.caption}\n- Tags: ${imageAnalysis.tags.join(', ')}\n- Confidence: ${(imageAnalysis.confidence * 100).toFixed(1)}%\n\nBUSINESS PROFILE:\n- Business Name: ${businessProfile.business_name}\n- Industry: ${businessProfile.niche}\n- Brand Tone: ${businessProfile.tone}\n- Target Audience: ${businessProfile.audience}\n\nIMPORTANT: Incorporate the business name "${businessProfile.business_name}" naturally into the caption. Make the content feel authentic to this specific business and its ${businessProfile.tone} tone. Target the ${businessProfile.audience} audience and focus on the ${businessProfile.niche} industry. Focus on the specific product details from the image analysis. Don't use generic phrases like "elevate your style" or "check out this amazing product" unless they're specifically relevant to the product shown. Respond in this exact JSON format:\n\n{
  "caption": "Your engaging Instagram caption here",
  "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}`
    }

    const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a professional social media content creator. Always respond with valid JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.9
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('OpenAI API error response:', errorData)
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`)
    }

    const data = await response.json()
    const content = data.choices[0].message.content.trim()
    
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(content)
      return {
        caption: parsed.caption || `Amazing ${imageAnalysis.classification} from ${businessProfile.business_name}!`,
        hashtags: parsed.hashtags || imageAnalysis.tags.slice(0, 5)
      }
    } catch (parseError) {
      console.error('Failed to parse JSON response, using fallback:', parseError)
      console.log('Raw content was:', content)
      
      // Fallback: create content based on analysis
      return {
        caption: `Check out these amazing ${imageAnalysis.classification} from ${businessProfile.business_name}! ${imageAnalysis.caption}`,
        hashtags: [...imageAnalysis.tags.slice(0, 5), businessProfile.niche.toLowerCase().replace(/\s+/g, '')]
      }
    }
  } catch (error) {
    console.error('Error generating Instagram content from CLIP:', error)
    // Return fallback content
    return {
      caption: `Amazing ${imageAnalysis.classification} from ${businessProfile.business_name}! Don't miss out on this incredible product.`,
      hashtags: [...imageAnalysis.tags.slice(0, 5), businessProfile.niche.toLowerCase().replace(/\s+/g, '')]
    }
  }
} 