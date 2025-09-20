import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import { promises as fsp } from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import os from 'os';
import Busboy from 'busboy';
import { Readable } from 'stream';
import { createClient } from '@supabase/supabase-js';
import { shouldBypassCredits } from '../../../lib/admin-utils';

// If you see a type error for 'busboy', run: npm install --save-dev @types/busboy
// or add a declaration file: declare module 'busboy';

export const runtime = 'nodejs';

export const config = {
  api: {
    bodyParser: false, // We'll handle parsing manually for multipart
  },
};

function webStreamToNodeStream(webStream: ReadableStream<Uint8Array>) {
  const reader = webStream.getReader();
  return new Readable({
    async read() {
      const { done, value } = await reader.read();
      if (done) {
        this.push(null);
      } else {
        this.push(Buffer.from(value));
      }
    }
  });
}

// Helper to parse multipart form data (video upload)
async function parseMultipartFormData(req: Request): Promise<{ videoPath: string }> {
  return new Promise((resolve, reject) => {
    let headersObj: Record<string, string> = {};
    const headers = (req as any).headers;
    // If it's a Headers object, convert to plain object
    if (headers && typeof headers.get === 'function') {
      for (const [key, value] of headers.entries()) {
        headersObj[key.toLowerCase()] = value;
      }
    } else if (headers && typeof headers === 'object') {
      // Already a plain object (Node.js)
      for (const key in headers) {
        headersObj[key.toLowerCase()] = headers[key];
      }
    }
    console.log('[analyze-video] Normalized headers:', headersObj);
    if (!headersObj['content-type']) {
      return reject(new Error('Missing Content-Type header for multipart form data.'));
    }
    const busboy = Busboy({ headers: headersObj });
    let tempFilePath = '';
    let fileWritePromise: Promise<void> | null = null;

    busboy.on('file', (fieldname: string, file: NodeJS.ReadableStream, filename: any) => {
      let safeFilename = typeof filename === 'string' && filename ? filename : `upload-${Date.now()}.mp4`;
      const tempDir = os.tmpdir();
      tempFilePath = path.join(tempDir, `${Date.now()}-${safeFilename}`);
      const writeStream = fs.createWriteStream(tempFilePath);
      fileWritePromise = new Promise((res, rej) => {
        file.pipe(writeStream);
        writeStream.on('finish', res);
        writeStream.on('error', rej);
      });
    });

    busboy.on('finish', async () => {
      try {
        if (fileWritePromise) await fileWritePromise;
        if (!tempFilePath) return reject(new Error('No file uploaded'));
        resolve({ videoPath: tempFilePath });
      } catch (err) {
        reject(err);
      }
    });

    busboy.on('error', reject);

    // Convert web stream to Node.js stream and pipe to busboy
    const nodeStream = webStreamToNodeStream((req as any).body);
    nodeStream.pipe(busboy);
  });
}

async function analyzeFrame(frameBase64: string, userId: string) {
  // Send the frame as a data URL to /api/analyze-image
  const dataUrl = `data:image/png;base64,${frameBase64}`;
  const response = await fetch(`${process.env.BASE_URL || 'http://localhost:3000'}/api/analyze-image`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userId}`
    },
    body: JSON.stringify({ 
      imageUrl: dataUrl,
      skipCredits: true // Skip credit deduction for individual frames
    })
  });
  if (!response.ok) {
    const errorData = await response.json();
    // Pass through credit-related errors with their original message
    if (response.status === 402) {
      throw new Error(errorData.error || 'No post generation credits remaining. Please upgrade your plan or purchase more credits.');
    }
    throw new Error('Failed to analyze frame');
  }
  const data = await response.json();
  return data.analysis;
}

function aggregateAnalyses(analyses: any[]) {
  // Aggregate captions
  const allCaptions = analyses.map(a => a.caption).join(' | ');
  // Merge tags (unique)
  const allTags = Array.from(new Set(analyses.flatMap(a => a.tags)));
  // Most common classification
  const classificationCounts = analyses.reduce((acc: Record<string, number>, a) => {
    acc[a.classification] = (acc[a.classification] || 0) + 1;
    return acc;
  }, {});
  const classificationEntries = Object.entries(classificationCounts);
  const mostCommonClassification = classificationEntries.length > 0 ? classificationEntries.sort((a, b) => b[1] - a[1])[0][0] : 'Scene';
  // Average confidence
  const avgConfidence = analyses.reduce((sum, a) => sum + (a.confidence || 0), 0) / analyses.length;
  return {
    caption: allCaptions,
    classification: mostCommonClassification,
    tags: allTags,
    confidence: avgConfidence
  };
}

export async function POST(req: NextRequest) {
  try {
    console.log('[analyze-video] Starting video analysis');
    
    // Get user ID from authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const userId = authHeader.replace('Bearer ', '');
    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 401 }
      );
    }

    // Check if user is admin (bypass credits)
    const bypassCredits = await shouldBypassCredits(userId);

    // Check user's post generation credits
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    
    if (!bypassCredits) {
      // First, try to get user data without credit restrictions
      let { data: userData, error: userDataError } = await supabase
        .from('user_profiles')
        .select('post_generation_credits, subscription_plan')
        .eq('user_id', userId)
        .single();

      // If user doesn't exist in user_profiles table, create them with default credits
      if (userDataError && userDataError.code === 'PGRST116') {
        console.log('User not found in user_profiles table, creating with default credits...');
        
        const { data: newUserData, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: userId,
            post_generation_credits: 3, // Default for free plan
            subscription_plan: 'free'
          })
          .select('post_generation_credits, subscription_plan')
          .single();

        if (createError) {
          console.error('❌ Error creating user profile:', createError);
          return NextResponse.json({ 
            error: 'No post generation credits remaining. Please upgrade your plan or purchase more credits.',
            creditsRemaining: 0
          }, { status: 402 });
        }

        userData = newUserData;
        userDataError = null;
      } else if (userDataError) {
        console.error('Error fetching user credits:', userDataError);
        return NextResponse.json({ 
          error: 'No post generation credits remaining. Please upgrade your plan or purchase more credits.',
          creditsRemaining: 0
        }, { status: 402 });
      }

      const currentCredits = userData?.post_generation_credits || 0;
      
      if (currentCredits <= 0) {
        return NextResponse.json({ 
          error: 'No post generation credits remaining. Please upgrade your plan or purchase more credits.',
          creditsRemaining: 0
        }, { status: 402 });
      }

      console.log('✅ Credit check passed for video analysis. Credits available:', currentCredits);
    } else {
      console.log('👑 Admin user - bypassing credit check for video analysis');
    }
    
    // Parse the uploaded video file
    const { videoPath } = await parseMultipartFormData(req as any);
    console.log('[analyze-video] Video file saved at:', videoPath);

    // Call the Python script to extract frames
    const pythonPath = 'python3'; // or 'python' depending on your environment
    const scriptPath = path.resolve(process.cwd(), 'extract_frames.py');
    const everyNFrames = 30; // ~1 frame per second for 30fps video
    console.log('[analyze-video] Spawning Python script:', pythonPath, scriptPath, videoPath, everyNFrames);
    const py = spawn(pythonPath, [scriptPath, videoPath, everyNFrames.toString()]);

    let output = '';
    let errorOutput = '';
    py.stdout.on('data', (data) => {
      output += data.toString();
    });
    py.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    const exitCode: number = await new Promise((resolve) => {
      py.on('close', resolve);
    });

    // Clean up temp video file
    await fsp.unlink(videoPath);
    console.log('[analyze-video] Python script exited with code:', exitCode);
    if (exitCode !== 0) {
      console.error('[analyze-video] Python script error:', errorOutput);
      return NextResponse.json({ success: false, error: errorOutput || 'Python script failed' }, { status: 500 });
    }

    let frames: string[] = [];
    try {
      frames = JSON.parse(output);
      console.log('[analyze-video] Extracted frames:', frames.length);
    } catch (e) {
      console.error('[analyze-video] Failed to parse Python output:', output);
      return NextResponse.json({ success: false, error: 'Failed to parse Python output', raw: output }, { status: 500 });
    }

    // Analyze each frame (limit to 3 for performance)
    const frameSubset = frames.slice(0, 3);
    const analyses = [];
    for (const frame of frameSubset) {
      try {
        const analysis = await analyzeFrame(frame, userId);
        analyses.push(analysis);
      } catch (e) {
        console.error('[analyze-video] Failed to analyze frame:', e);
        // Skip failed frames
      }
    }
    if (analyses.length === 0) {
      console.error('[analyze-video] No frames could be analyzed');
      return NextResponse.json({ success: false, error: 'No frames could be analyzed' }, { status: 500 });
    }
    const aggregated = aggregateAnalyses(analyses);

    // Generate content (caption, hashtags) using the existing content generation API
    // Construct a basic AIGenerationRequest (customize as needed)
    const aiRequest = {
      businessContext: 'Video/Reel for social media content creation and posting', // You can pass real business info from the user
      platform: 'instagram', // or 'facebook', 'twitter', etc.
      theme: 'reel',
      customPrompt: `This is a video/reel. The main visual content is: ${aggregated.caption}`,
      tone: 'friendly',
      targetAudience: 'General audience',
      niche: 'General'
    };

    // Call the combined video content generation API (deducts only 1 credit)
    console.log('[analyze-video] Calling generate-video-content API with request:', aiRequest);
    
    const contentRes = await fetch(`${process.env.BASE_URL || 'http://localhost:3000'}/api/generate-video-content`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userId}`
      },
      body: JSON.stringify({ request: { ...aiRequest, customPrompt: aiRequest.customPrompt } })
    });
    
    console.log('[analyze-video] Video content generation response:', contentRes.status);
    
    let caption = '';
    let hashtags = [];
    
    if (contentRes.ok) {
      const data = await contentRes.json();
      caption = data.result.caption;
      hashtags = data.result.hashtags;
      console.log('[analyze-video] Generated caption:', caption);
      console.log('[analyze-video] Generated hashtags:', hashtags);
    } else {
      const errorData = await contentRes.json();
      console.error('[analyze-video] Content generation failed:', errorData);
    }

    return NextResponse.json({
      success: true,
      aggregated_analysis: aggregated,
      frame_analyses: analyses,
      generated: {
        caption,
        hashtags
      }
    });
  } catch (error: any) {
    console.error('[analyze-video] Handler error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to process video', stack: error.stack }, { status: 500 });
  }
} 