import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body
    
    // Log to terminal
    console.log(`🔍 [MEDIA DEBUG] ${action}:`, data)
    
    return NextResponse.json({ success: true, logged: true })
  } catch (error) {
    console.error('❌ [MEDIA DEBUG] Error:', error)
    return NextResponse.json({ success: false, error: (error as Error).message || 'Unknown error' }, { status: 500 })
  }
}
