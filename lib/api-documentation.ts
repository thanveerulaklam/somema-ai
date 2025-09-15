/**
 * Comprehensive API documentation and versioning utilities
 */

export interface APIEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  version: string;
  description: string;
  parameters?: APIParameter[];
  requestBody?: APIRequestBody;
  responses: APIResponse[];
  authentication: AuthenticationInfo;
  rateLimit?: RateLimitInfo;
  examples?: APIExample[];
}

export interface APIParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description: string;
  example?: any;
  validation?: ValidationRule[];
}

export interface APIRequestBody {
  contentType: string;
  schema: any;
  description: string;
  required: boolean;
  examples?: any[];
}

export interface APIResponse {
  statusCode: number;
  description: string;
  schema: any;
  examples?: any[];
}

export interface AuthenticationInfo {
  required: boolean;
  type: 'Bearer' | 'API-Key' | 'None';
  description: string;
  scopes?: string[];
}

export interface RateLimitInfo {
  requests: number;
  window: string;
  description: string;
}

export interface APIExample {
  name: string;
  description: string;
  request: any;
  response: any;
}

export interface ValidationRule {
  type: 'min' | 'max' | 'pattern' | 'enum' | 'required';
  value: any;
  message: string;
}

/**
 * API versioning configuration
 */
export const API_VERSIONS = {
  v1: {
    version: '1.0.0',
    status: 'stable' as 'stable' | 'beta' | 'deprecated',
    deprecationDate: null,
    sunsetDate: null
  },
  v2: {
    version: '2.0.0',
    status: 'beta' as 'stable' | 'beta' | 'deprecated',
    deprecationDate: null,
    sunsetDate: null
  }
} as const;

/**
 * Comprehensive API documentation
 */
export const API_DOCUMENTATION: Record<string, APIEndpoint> = {
  // Authentication endpoints
  'auth-user': {
    path: '/api/auth/user',
    method: 'GET',
    version: 'v1',
    description: 'Get current user information',
    authentication: {
      required: true,
      type: 'Bearer',
      description: 'JWT token required'
    },
    responses: [
      {
        statusCode: 200,
        description: 'User information retrieved successfully',
        schema: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            created_at: { type: 'string', format: 'date-time' }
          }
        }
      },
      {
        statusCode: 401,
        description: 'Authentication required',
        schema: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            code: { type: 'string' }
          }
        }
      }
    ],
    rateLimit: {
      requests: 100,
      window: '15 minutes',
      description: '100 requests per 15 minutes per user'
    }
  },

  // Content generation endpoints
  'generate-content': {
    path: '/api/generate-content',
    method: 'POST',
    version: 'v1',
    description: 'Generate AI content (captions, hashtags, text elements, image prompts)',
    authentication: {
      required: true,
      type: 'Bearer',
      description: 'JWT token required'
    },
    requestBody: {
      contentType: 'application/json',
      required: true,
      description: 'Content generation request',
      schema: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['caption', 'hashtags', 'textElements', 'imagePrompt'],
            description: 'Type of content to generate'
          },
          request: {
            type: 'object',
            properties: {
              businessContext: { type: 'string', maxLength: 500 },
              platform: { type: 'string', enum: ['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok'] },
              theme: { type: 'string', maxLength: 100 },
              tone: { type: 'string', enum: ['professional', 'casual', 'friendly', 'authoritative', 'playful', 'inspiring'] },
              targetAudience: { type: 'string', maxLength: 200 },
              niche: { type: 'string', maxLength: 100 }
            },
            required: ['businessContext']
          }
        },
        required: ['type', 'request']
      }
    },
    responses: [
      {
        statusCode: 200,
        description: 'Content generated successfully',
        schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            result: { type: 'string' },
            creditsRemaining: { type: 'number' }
          }
        }
      },
      {
        statusCode: 400,
        description: 'Invalid request data',
        schema: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: { type: 'array', items: { type: 'string' } }
          }
        }
      },
      {
        statusCode: 402,
        description: 'Insufficient credits',
        schema: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            creditsRemaining: { type: 'number' }
          }
        }
      }
    ],
    rateLimit: {
      requests: 20,
      window: '15 minutes',
      description: '20 requests per 15 minutes per user'
    },
    examples: [
      {
        name: 'Generate Instagram Caption',
        description: 'Generate a caption for an Instagram post',
        request: {
          type: 'caption',
          request: {
            businessContext: 'Fitness brand promoting new protein powder',
            platform: 'instagram',
            tone: 'motivational',
            targetAudience: 'fitness enthusiasts aged 18-35'
          }
        },
        response: {
          success: true,
          result: 'Fuel your fitness journey with our premium protein powder! 💪✨',
          creditsRemaining: 14
        }
      }
    ]
  },

  // Image enhancement endpoints
  'enhance-image': {
    path: '/api/enhance-image',
    method: 'POST',
    version: 'v1',
    description: 'Enhance image using AI',
    authentication: {
      required: true,
      type: 'Bearer',
      description: 'JWT token required'
    },
    requestBody: {
      contentType: 'multipart/form-data',
      required: true,
      description: 'Image file and enhancement parameters',
      schema: {
        type: 'object',
        properties: {
          image: {
            type: 'string',
            format: 'binary',
            description: 'Image file (JPEG, PNG, WebP)'
          },
          productDescription: {
            type: 'string',
            maxLength: 500,
            description: 'Description of the product in the image'
          }
        },
        required: ['image']
      }
    },
    responses: [
      {
        statusCode: 200,
        description: 'Image enhanced successfully',
        schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            enhancedImageUrl: { type: 'string', format: 'uri' },
            creditsRemaining: { type: 'number' }
          }
        }
      },
      {
        statusCode: 400,
        description: 'Invalid file or request',
        schema: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    ],
    rateLimit: {
      requests: 10,
      window: '15 minutes',
      description: '10 requests per 15 minutes per user'
    }
  },

  // Payment endpoints
  'verify-payment': {
    path: '/api/payments/verify-payment',
    method: 'POST',
    version: 'v1',
    description: 'Verify Razorpay payment',
    authentication: {
      required: true,
      type: 'Bearer',
      description: 'JWT token required'
    },
    requestBody: {
      contentType: 'application/json',
      required: true,
      description: 'Payment verification data',
      schema: {
        type: 'object',
        properties: {
          razorpay_order_id: { type: 'string' },
          razorpay_payment_id: { type: 'string' },
          razorpay_signature: { type: 'string' }
        },
        required: ['razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature']
      }
    },
    responses: [
      {
        statusCode: 200,
        description: 'Payment verified successfully',
        schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      },
      {
        statusCode: 400,
        description: 'Payment verification failed',
        schema: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    ],
    rateLimit: {
      requests: 5,
      window: '15 minutes',
      description: '5 requests per 15 minutes per user'
    }
  },

  // Admin endpoints
  'admin-users': {
    path: '/api/admin/users',
    method: 'GET',
    version: 'v1',
    description: 'Get all users (admin only)',
    authentication: {
      required: true,
      type: 'Bearer',
      description: 'JWT token with admin privileges required',
      scopes: ['admin:users:read']
    },
    parameters: [
      {
        name: 'page',
        type: 'number',
        required: false,
        description: 'Page number for pagination',
        example: 1,
        validation: [
          { type: 'min', value: 1, message: 'Page must be at least 1' },
          { type: 'max', value: 10000, message: 'Page must be at most 10000' }
        ]
      },
      {
        name: 'limit',
        type: 'number',
        required: false,
        description: 'Number of users per page',
        example: 50,
        validation: [
          { type: 'min', value: 1, message: 'Limit must be at least 1' },
          { type: 'max', value: 100, message: 'Limit must be at most 100' }
        ]
      }
    ],
    responses: [
      {
        statusCode: 200,
        description: 'Users retrieved successfully',
        schema: {
          type: 'object',
          properties: {
            users: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  email: { type: 'string', format: 'email' },
                  created_at: { type: 'string', format: 'date-time' },
                  subscription_plan: { type: 'string' }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'number' },
                limit: { type: 'number' },
                total: { type: 'number' },
                totalPages: { type: 'number' }
              }
            }
          }
        }
      },
      {
        statusCode: 403,
        description: 'Admin access required',
        schema: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            code: { type: 'string' }
          }
        }
      }
    ],
    rateLimit: {
      requests: 50,
      window: '15 minutes',
      description: '50 requests per 15 minutes per admin user'
    }
  }
};

/**
 * Generate OpenAPI/Swagger specification
 */
export function generateOpenAPISpec(): any {
  return {
    openapi: '3.0.0',
    info: {
      title: 'Somema.ai API',
      description: 'AI-powered social media content generation API',
      version: '1.0.0',
      contact: {
        name: 'Somema.ai Support',
        email: 'support@somema.ai'
      }
    },
    servers: [
      {
        url: 'https://your-app.vercel.app',
        description: 'Production server'
      },
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    security: [
      {
        BearerAuth: []
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            code: { type: 'string' },
            requestId: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            created_at: { type: 'string', format: 'date-time' }
          }
        }
      }
    },
    paths: generatePathsFromDocumentation()
  };
}

/**
 * Generate API paths from documentation
 */
function generatePathsFromDocumentation(): any {
  const paths: any = {};
  
  for (const [key, endpoint] of Object.entries(API_DOCUMENTATION)) {
    if (!paths[endpoint.path]) {
      paths[endpoint.path] = {};
    }
    
    paths[endpoint.path][endpoint.method.toLowerCase()] = {
      summary: endpoint.description,
      tags: [getTagFromPath(endpoint.path)],
      security: endpoint.authentication.required ? [{ BearerAuth: [] }] : [],
      parameters: endpoint.parameters?.map(param => ({
        name: param.name,
        in: 'query',
        required: param.required,
        schema: { type: param.type },
        description: param.description,
        example: param.example
      })),
      requestBody: endpoint.requestBody ? {
        required: endpoint.requestBody.required,
        content: {
          [endpoint.requestBody.contentType]: {
            schema: endpoint.requestBody.schema
          }
        }
      } : undefined,
      responses: endpoint.responses.reduce((acc, response) => {
        acc[response.statusCode] = {
          description: response.description,
          content: {
            'application/json': {
              schema: response.schema
            }
          }
        };
        return acc;
      }, {} as any)
    };
  }
  
  return paths;
}

/**
 * Get tag from API path
 */
function getTagFromPath(path: string): string {
  if (path.includes('/auth/')) return 'Authentication';
  if (path.includes('/admin/')) return 'Admin';
  if (path.includes('/payments/')) return 'Payments';
  if (path.includes('/generate-')) return 'Content Generation';
  if (path.includes('/enhance-')) return 'Image Enhancement';
  return 'General';
}

/**
 * Validate API request against documentation
 */
export function validateAPIRequest(
  path: string,
  method: string,
  body?: any,
  query?: any
): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Find matching endpoint
  const endpoint = Object.values(API_DOCUMENTATION).find(
    ep => ep.path === path && ep.method === method
  );
  
  if (!endpoint) {
    errors.push(`Endpoint ${method} ${path} not found`);
    return { isValid: false, errors };
  }
  
  // Validate request body
  if (endpoint.requestBody && endpoint.requestBody.required && !body) {
    errors.push('Request body is required');
  }
  
  // Validate parameters
  if (endpoint.parameters) {
    for (const param of endpoint.parameters) {
      if (param.required && !query?.[param.name]) {
        errors.push(`Parameter '${param.name}' is required`);
      }
    }
  }
  
  return { isValid: errors.length === 0, errors };
}

/**
 * Generate API documentation markdown
 */
export function generateAPIDocumentationMarkdown(): string {
  let markdown = '# Somema.ai API Documentation\n\n';
  
  markdown += '## Overview\n\n';
  markdown += 'The Somema.ai API provides AI-powered social media content generation capabilities.\n\n';
  
  markdown += '## Authentication\n\n';
  markdown += 'Most endpoints require authentication using JWT tokens.\n\n';
  markdown += '```\n';
  markdown += 'Authorization: Bearer <your-jwt-token>\n';
  markdown += '```\n\n';
  
  markdown += '## Rate Limiting\n\n';
  markdown += 'API endpoints are rate limited to prevent abuse. Rate limits vary by endpoint.\n\n';
  
  markdown += '## Endpoints\n\n';
  
  // Group endpoints by category
  const categories: Record<string, APIEndpoint[]> = {};
  
  for (const endpoint of Object.values(API_DOCUMENTATION)) {
    const category = getTagFromPath(endpoint.path);
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(endpoint);
  }
  
  for (const [category, endpoints] of Object.entries(categories)) {
    markdown += `### ${category}\n\n`;
    
    for (const endpoint of endpoints) {
      markdown += `#### ${endpoint.method} ${endpoint.path}\n\n`;
      markdown += `${endpoint.description}\n\n`;
      
      if (endpoint.parameters) {
        markdown += '**Parameters:**\n\n';
        for (const param of endpoint.parameters) {
          markdown += `- \`${param.name}\` (${param.type}${param.required ? ', required' : ''}): ${param.description}\n`;
        }
        markdown += '\n';
      }
      
      if (endpoint.requestBody) {
        markdown += '**Request Body:**\n\n';
        markdown += `Content-Type: ${endpoint.requestBody.contentType}\n\n`;
        markdown += `${endpoint.requestBody.description}\n\n`;
      }
      
      markdown += '**Responses:**\n\n';
      for (const response of endpoint.responses) {
        markdown += `- \`${response.statusCode}\`: ${response.description}\n`;
      }
      markdown += '\n';
      
      if (endpoint.rateLimit) {
        markdown += `**Rate Limit:** ${endpoint.rateLimit.requests} requests per ${endpoint.rateLimit.window}\n\n`;
      }
    }
  }
  
  return markdown;
}

/**
 * API versioning utilities
 */
export class APIVersionManager {
  private static instance: APIVersionManager;
  
  static getInstance(): APIVersionManager {
    if (!APIVersionManager.instance) {
      APIVersionManager.instance = new APIVersionManager();
    }
    return APIVersionManager.instance;
  }
  
  getVersionInfo(version: string): any {
    return API_VERSIONS[version as keyof typeof API_VERSIONS];
  }
  
  isVersionSupported(version: string): boolean {
    return version in API_VERSIONS;
  }
  
  getLatestVersion(): string {
    return 'v1';
  }
  
  getDeprecatedVersions(): string[] {
    return Object.entries(API_VERSIONS)
      .filter(([_, info]) => info.status === 'deprecated')
      .map(([version, _]) => version);
  }
  
  getSunsetVersions(): string[] {
    return Object.entries(API_VERSIONS)
      .filter(([_, info]) => info.sunsetDate && new Date(info.sunsetDate) <= new Date())
      .map(([version, _]) => version);
  }
}
