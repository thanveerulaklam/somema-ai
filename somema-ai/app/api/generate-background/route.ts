import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { imageAnalysis, businessContext, platform } = await request.json()

    if (!imageAnalysis || !businessContext || !platform) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // Generate a solid color background based on product colors
    const backgroundUrl = await generateSolidColorBackground(imageAnalysis, platform)

    console.log('Solid color background generated successfully:', backgroundUrl)

    return NextResponse.json({ 
      success: true,
      backgroundUrl 
    })

  } catch (error: any) {
    console.error('Background generation error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to generate background' 
    }, { status: 500 })
  }
}

// Generate a solid color background based on product analysis
async function generateSolidColorBackground(
  imageAnalysis: {
    caption: string
    classification: string
    tags: string[]
    confidence: number
  },
  platform: string
): Promise<string> {
  // Extract colors from the product tags
  const colors = extractColorsFromTags(imageAnalysis.tags)
  
  // Choose the best background color based on product colors
  const backgroundColor = chooseBackgroundColor(colors, platform)
  
  // Create a simple solid color image using Sharp
  const sharp = require('sharp')
  
  // Create a 1024x1024 solid color image
  const backgroundBuffer = await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 }
    }
  })
  .png()
  .toBuffer()
  
  // Convert hex color to RGB
  const hex = backgroundColor.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  
  // Create the colored background
  const coloredBackground = await sharp(backgroundBuffer)
    .flatten({ background: { r, g, b } })
    .png()
    .toBuffer()
  
  // Convert to base64 data URL
  const base64 = coloredBackground.toString('base64')
  return `data:image/png;base64,${base64}`
}

// Extract colors from product tags
function extractColorsFromTags(tags: string[]): string[] {
  const colorKeywords = [
    'black', 'white', 'red', 'blue', 'green', 'yellow', 'purple', 'pink', 'orange', 'brown', 'gray', 'grey',
    'taupe', 'beige', 'cream', 'navy', 'maroon', 'olive', 'teal', 'coral', 'gold', 'silver', 'bronze'
  ]
  
  return tags.filter(tag => colorKeywords.includes(tag.toLowerCase()))
}

// Choose the best background color based on product colors
function chooseBackgroundColor(productColors: string[], platform: string): string {
  // Default neutral colors that work well with most products
  const neutralColors = [
    '#f8f9fa', // Light gray
    '#ffffff', // White
    '#f5f5f5', // Off-white
    '#fafafa', // Very light gray
    '#f0f0f0', // Light gray
    '#e8e8e8', // Medium light gray
  ]
  
  // If we have product colors, choose a complementary neutral
  if (productColors.length > 0) {
    const productColor = productColors[0].toLowerCase()
    
    // Color-specific background choices
    const colorMap: { [key: string]: string } = {
      'black': '#f8f9fa', // Light gray for black products
      'white': '#f0f0f0', // Light gray for white products
      'red': '#fafafa',   // Very light gray for red products
      'blue': '#f8f9fa',  // Light gray for blue products
      'green': '#fafafa', // Very light gray for green products
      'yellow': '#f5f5f5', // Off-white for yellow products
      'purple': '#fafafa', // Very light gray for purple products
      'pink': '#f8f9fa',   // Light gray for pink products
      'orange': '#fafafa', // Very light gray for orange products
      'brown': '#f8f9fa',  // Light gray for brown products
      'gray': '#ffffff',   // White for gray products
      'grey': '#ffffff',   // White for grey products
      'taupe': '#f5f5f5',  // Off-white for taupe products
      'beige': '#f0f0f0',  // Light gray for beige products
      'cream': '#f0f0f0',  // Light gray for cream products
      'navy': '#f8f9fa',   // Light gray for navy products
      'maroon': '#fafafa', // Very light gray for maroon products
      'olive': '#fafafa',  // Very light gray for olive products
      'teal': '#f8f9fa',   // Light gray for teal products
      'coral': '#fafafa',  // Very light gray for coral products
      'gold': '#f5f5f5',   // Off-white for gold products
      'silver': '#f0f0f0', // Light gray for silver products
      'bronze': '#f5f5f5', // Off-white for bronze products
    }
    
    return colorMap[productColor] || neutralColors[0]
  }
  
  // Default to light gray if no colors found
  return neutralColors[0]
}

 