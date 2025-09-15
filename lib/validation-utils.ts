/**
 * Comprehensive input validation utilities
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData?: any;
}

/**
 * Sanitize and validate string input
 */
export function validateString(
  input: any,
  options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    allowedValues?: string[];
    sanitize?: boolean;
  } = {}
): ValidationResult {
  const errors: string[] = [];
  let sanitizedValue = input;

  // Check if required
  if (options.required && (input === null || input === undefined || input === '')) {
    errors.push('This field is required');
    return { isValid: false, errors };
  }

  // If not required and empty, return valid
  if (!options.required && (input === null || input === undefined || input === '')) {
    return { isValid: true, errors: [], sanitizedData: '' };
  }

  // Convert to string
  sanitizedValue = String(input).trim();

  // Sanitize if requested
  if (options.sanitize) {
    sanitizedValue = sanitizedValue
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, ''); // Remove event handlers
  }

  // Check length constraints
  if (options.minLength && sanitizedValue.length < options.minLength) {
    errors.push(`Minimum length is ${options.minLength} characters`);
  }

  if (options.maxLength && sanitizedValue.length > options.maxLength) {
    errors.push(`Maximum length is ${options.maxLength} characters`);
  }

  // Check pattern
  if (options.pattern && !options.pattern.test(sanitizedValue)) {
    errors.push('Invalid format');
  }

  // Check allowed values
  if (options.allowedValues && !options.allowedValues.includes(sanitizedValue)) {
    errors.push(`Must be one of: ${options.allowedValues.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: sanitizedValue
  };
}

/**
 * Validate email address
 */
export function validateEmail(email: any): ValidationResult {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return validateString(email, {
    required: true,
    maxLength: 254,
    pattern: emailPattern,
    sanitize: true
  });
}

/**
 * Validate UUID
 */
export function validateUUID(uuid: any): ValidationResult {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return validateString(uuid, {
    required: true,
    pattern: uuidPattern
  });
}

/**
 * Validate URL
 */
export function validateURL(url: any): ValidationResult {
  try {
    if (typeof url !== 'string') {
      return { isValid: false, errors: ['URL must be a string'] };
    }

    const urlObj = new URL(url);
    
    // Only allow HTTPS in production
    if (process.env.NODE_ENV === 'production' && urlObj.protocol !== 'https:') {
      return { isValid: false, errors: ['Only HTTPS URLs are allowed'] };
    }

    return { isValid: true, errors: [], sanitizedData: url };
  } catch {
    return { isValid: false, errors: ['Invalid URL format'] };
  }
}

/**
 * Validate file upload
 */
export function validateFile(
  file: any,
  options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
    required?: boolean;
  } = {}
): ValidationResult {
  const errors: string[] = [];

  if (options.required && !file) {
    errors.push('File is required');
    return { isValid: false, errors };
  }

  if (!file) {
    return { isValid: true, errors: [], sanitizedData: null };
  }

  // Check if it's a File object
  if (!(file instanceof File)) {
    errors.push('Invalid file object');
    return { isValid: false, errors };
  }

  // Check file size
  if (options.maxSize && file.size > options.maxSize) {
    const maxSizeMB = Math.round(options.maxSize / (1024 * 1024));
    errors.push(`File size must be less than ${maxSizeMB}MB`);
  }

  // Check file type
  if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
    errors.push(`File type must be one of: ${options.allowedTypes.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: file
  };
}

/**
 * Validate JSON object
 */
export function validateJSON(
  input: any,
  schema: Record<string, (value: any) => ValidationResult>
): ValidationResult {
  const errors: string[] = [];
  const sanitizedData: any = {};

  // Check if input is an object
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { isValid: false, errors: ['Input must be a valid object'] };
  }

  // Validate each field
  for (const [field, validator] of Object.entries(schema)) {
    const result = validator(input[field]);
    if (!result.isValid) {
      errors.push(...result.errors.map((error: string) => `${field}: ${error}`));
    } else {
      sanitizedData[field] = result.sanitizedData;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData
  };
}

/**
 * Validate pagination parameters
 */
export function validatePagination(params: any): ValidationResult {
  const errors: string[] = [];
  const sanitizedData: any = {};

  // Page validation
  const page = parseInt(params.page) || 1;
  if (page < 1 || page > 10000) {
    errors.push('Page must be between 1 and 10000');
  } else {
    sanitizedData.page = page;
  }

  // Limit validation
  const limit = parseInt(params.limit) || 50;
  if (limit < 1 || limit > 100) {
    errors.push('Limit must be between 1 and 100');
  } else {
    sanitizedData.limit = limit;
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData
  };
}

/**
 * Validate search parameters
 */
export function validateSearch(search: any): ValidationResult {
  return validateString(search, {
    maxLength: 100,
    sanitize: true
  });
}

/**
 * Validate business context for AI generation
 */
export function validateBusinessContext(context: any): ValidationResult {
  const schema = {
    businessContext: (value: any) => validateString(value, {
      required: true,
      minLength: 3,
      maxLength: 500,
      sanitize: true
    }),
    platform: (value: any) => validateString(value, {
      allowedValues: ['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok']
    }),
    theme: (value: any) => validateString(value, {
      maxLength: 100,
      sanitize: true
    }),
    tone: (value: any) => validateString(value, {
      allowedValues: ['professional', 'casual', 'friendly', 'authoritative', 'playful', 'inspiring']
    }),
    targetAudience: (value: any) => validateString(value, {
      maxLength: 200,
      sanitize: true
    }),
    niche: (value: any) => validateString(value, {
      maxLength: 100,
      sanitize: true
    })
  };

  return validateJSON(context, schema);
}

/**
 * Validate payment parameters
 */
export function validatePaymentParams(params: any): ValidationResult {
  const errors: string[] = [];
  const sanitizedData: any = {};

  // Validate required fields
  const requiredFields = ['razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature'];
  for (const field of requiredFields) {
    if (!params[field]) {
      errors.push(`${field} is required`);
    } else {
      sanitizedData[field] = String(params[field]).trim();
    }
  }

  // Validate order ID format (should be alphanumeric)
  if (params.razorpay_order_id && !/^[a-zA-Z0-9_]+$/.test(params.razorpay_order_id)) {
    errors.push('Invalid order ID format');
  }

  // Validate payment ID format (should be alphanumeric)
  if (params.razorpay_payment_id && !/^pay_[a-zA-Z0-9]+$/.test(params.razorpay_payment_id)) {
    errors.push('Invalid payment ID format');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData
  };
}

/**
 * Sanitize HTML content
 */
export function sanitizeHTML(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
}

/**
 * Validate and sanitize form data
 */
export function validateFormData(formData: FormData, schema: Record<string, any>): ValidationResult {
  const errors: string[] = [];
  const sanitizedData: any = {};

  for (const [field, validation] of Object.entries(schema)) {
    const value = formData.get(field);
    const result = validation(value);
    
    if (!result.isValid) {
      errors.push(...result.errors.map((error: string) => `${field}: ${error}`));
    } else {
      sanitizedData[field] = result.sanitizedData;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData
  };
}
