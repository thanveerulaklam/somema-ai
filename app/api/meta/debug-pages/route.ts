import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { accessToken } = await request.json()

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 400 }
      )
    }

    console.log('Debug: Testing pages API with token:', accessToken.substring(0, 20) + '...')

    // Test user info first
    const userResponse = await fetch(
      `https://graph.facebook.com/v18.0/me?access_token=${accessToken}`
    )
    const userData = await userResponse.json()
    console.log('Debug: User info response:', userData)

    if (userData.error) {
      return NextResponse.json(
        { error: 'Invalid access token', details: userData.error },
        { status: 400 }
      )
    }

    // Test pages API
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
    )
    const pagesData = await pagesResponse.json()
    console.log('Debug: Pages API response:', pagesData)

    // Test with different API versions
    const pagesResponseV17 = await fetch(
      `https://graph.facebook.com/v17.0/me/accounts?access_token=${accessToken}`
    )
    const pagesDataV17 = await pagesResponseV17.json()
    console.log('Debug: Pages API v17 response:', pagesDataV17)

    // Test with different endpoint
    const pagesResponseAlt = await fetch(
      `https://graph.facebook.com/v18.0/me?fields=accounts&access_token=${accessToken}`
    )
    const pagesDataAlt = await pagesResponseAlt.json()
    console.log('Debug: Pages API alt endpoint response:', pagesDataAlt)

    return NextResponse.json({
      success: true,
      user: userData,
      pages: pagesData,
      pagesV17: pagesDataV17,
      pagesAlt: pagesDataAlt
    })

  } catch (error: any) {
    console.error('Debug pages error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to debug pages API' },
      { status: 500 }
    )
  }
} 