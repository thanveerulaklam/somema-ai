import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { shouldBypassCredits } from '../../../lib/admin-utils'
import { ensureUserProfile } from '../../../lib/credit-utils'
import { validateBusinessContext } from '../../../lib/validation-utils'

export async function POST(request: NextRequest) {
  try {
    // Get user ID from authorization header (support both JWT and user ID patterns)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    let userId: string;
    
    // Check if it's a JWT token or user ID
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Try to validate as JWT token first
      try {
        const { data: { user }, error } = await createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        ).auth.getUser(token);
        
        if (error || !user) {
          // If JWT validation fails, treat as user ID
          userId = token;
        } else {
          userId = user.id;
        }
      } catch (error) {
        // If JWT validation fails, treat as user ID
        userId = token;
      }
    } else {
      return NextResponse.json({ error: 'Invalid authorization format' }, { status: 401 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const { request: aiRequest } = await request.json()

    // Validate business context
    const contextValidation = validateBusinessContext(aiRequest);
    if (!contextValidation.isValid) {
      console.error('Business context validation failed:', contextValidation.errors);
      console.error('Request data:', aiRequest);
      return NextResponse.json({ 
        error: 'Invalid request data', 
        details: contextValidation.errors 
      }, { status: 400 })
    }

    // Check if user is admin (bypass credits)
    const bypassCredits = await shouldBypassCredits(userId)

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

      // Simple credit deduction without atomic function
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Get current credits
      const { data: userData, error: fetchError } = await supabase
        .from('user_profiles')
        .select('post_generation_credits')
        .eq('user_id', userId)
        .single();

      if (fetchError || !userData) {
        return NextResponse.json({ 
          error: 'Failed to fetch user credits',
          creditsRemaining: 0
        }, { status: 500 })
      }

      const currentCredits = userData.post_generation_credits || 0;
      
      if (currentCredits < 1) {
        return NextResponse.json({ 
          error: 'No post generation credits remaining. Please upgrade your plan or purchase more credits.',
          creditsRemaining: currentCredits
        }, { status: 402 })
      }

      // Deduct 1 credit for both caption and hashtags
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ 
          post_generation_credits: currentCredits - 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Credit deduction error:', updateError);
        return NextResponse.json({ 
          error: 'Failed to deduct credits',
          creditsRemaining: currentCredits
        }, { status: 500 })
      }

      creditsResult = { success: true, newBalance: currentCredits - 1 };
      console.log('✅ Credit deduction successful. New balance:', creditsResult.newBalance)
    } else {
      console.log('👑 Admin user - bypassing credit check for content generation')
      creditsResult = { success: true, newBalance: 999999 } // Admin gets unlimited credits
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY
    
    if (!OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    // Generate both caption and hashtags in one call
    const [caption, hashtags] = await Promise.all([
      generateCaption(aiRequest, OPENAI_API_KEY),
      generateHashtags(aiRequest, OPENAI_API_KEY)
    ]);

    return NextResponse.json({ 
      success: true, 
      result: {
        caption,
        hashtags
      },
      creditsRemaining: creditsResult.newBalance
    })

  } catch (error) {
    console.error('Video content generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function generateCaption(request: any, apiKey: string): Promise<string> {
  const prompt = createCaptionPrompt(request)
  
  if (!prompt) {
    throw new Error('Failed to create caption prompt')
  }
  
  console.log('🚀 Starting CAPTION generation...')
  
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
  console.log('✅ CAPTION generation complete!')
  
  return data.choices[0].message.content.trim()
}

async function generateHashtags(request: any, apiKey: string): Promise<string[]> {
  const prompt = createHashtagPrompt(request)
  
  if (!prompt) {
    throw new Error('Failed to create hashtag prompt')
  }
  
  console.log('🚀 Starting HASHTAGS generation...')
  
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
  console.log('✅ HASHTAGS generation complete!')
  
  const content = data.choices[0].message.content.trim()
  
  // Extract hashtags from response
  const hashtags = content.match(/#\w+/g) || []
  return hashtags.map((tag: string) => tag.substring(1)).slice(0, 12)
}

// Helper functions for creating prompts
function createCaptionPrompt(request: any): string {
  if (!request) {
    return 'Create an engaging social media caption for Instagram that drives engagement and encourages interaction.'
  }
  
  const { businessContext, platform, theme, customPrompt, tone, targetAudience, niche } = request
  
  // If there's a custom prompt (from image analysis), use it directly
  if (customPrompt && customPrompt.includes('IMAGE CONTENT:')) {
    return customPrompt
  }
  
  return `Create an engaging social media caption for ${platform || 'Instagram'} that:
  
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
  if (!request) {
    return 'Generate relevant hashtags for Instagram social media post that will increase visibility and engagement.'
  }
  
  const { businessContext, platform, theme, customPrompt, niche } = request
  
  // If there's a custom prompt (from image analysis), use it directly
  if (customPrompt && customPrompt.includes('PRODUCT:')) {
    return customPrompt
  }
  
  return `Generate relevant hashtags for a ${platform || 'Instagram'} post about:
  
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
