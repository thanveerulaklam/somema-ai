import { NextRequest, NextResponse } from 'next/server';
import { generateOpenAPISpec, generateAPIDocumentationMarkdown } from '../../../lib/api-documentation';

/**
 * API documentation endpoint
 */
export async function GET(request: NextRequest) {
  try {
    const format = request.nextUrl.searchParams.get('format') || 'json';
    
    if (format === 'markdown') {
      const markdown = generateAPIDocumentationMarkdown();
      return new NextResponse(markdown, {
        headers: {
          'Content-Type': 'text/markdown',
        },
      });
    }
    
    if (format === 'openapi') {
      const spec = generateOpenAPISpec();
      return NextResponse.json(spec);
    }
    
    // Default to JSON format
    const spec = generateOpenAPISpec();
    return NextResponse.json(spec);
    
  } catch (error) {
    console.error('API documentation error:', error);
    
    return NextResponse.json({
      error: 'Failed to generate API documentation'
    }, { status: 500 });
  }
}
