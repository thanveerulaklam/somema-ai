import { NextRequest } from 'next/server';
import sharp from 'sharp';
import crypto from 'crypto';

/**
 * Enhanced file upload security utilities
 */

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedFile?: File;
  metadata?: FileMetadata;
}

export interface FileMetadata {
  size: number;
  type: string;
  extension: string;
  dimensions?: { width: number; height: number };
  hash: string;
  isImage: boolean;
  isVideo: boolean;
  mimeType: string;
}

export interface SecurityScanResult {
  isSafe: boolean;
  threats: string[];
  scanDetails: any;
}

/**
 * Allowed file types and their MIME types
 */
export const ALLOWED_FILE_TYPES = {
  images: {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
    'image/gif': ['.gif']
  },
  videos: {
    'video/mp4': ['.mp4'],
    'video/webm': ['.webm'],
    'video/quicktime': ['.mov']
  }
} as const;

/**
 * Maximum file sizes (in bytes)
 */
export const MAX_FILE_SIZES = {
  image: 10 * 1024 * 1024, // 10MB
  video: 100 * 1024 * 1024, // 100MB
  document: 5 * 1024 * 1024 // 5MB
} as const;

/**
 * Dangerous file extensions to block
 */
export const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
  '.php', '.asp', '.aspx', '.jsp', '.py', '.rb', '.pl', '.sh', '.ps1',
  '.dll', '.so', '.dylib', '.app', '.deb', '.rpm', '.msi', '.dmg'
];

/**
 * Validate file type and extension
 */
export function validateFileType(file: File, allowedTypes: string[]): {
  isValid: boolean;
  error?: string;
} {
  // Check MIME type
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
    };
  }
  
  // Check file extension
  const fileName = file.name.toLowerCase();
  const extension = fileName.substring(fileName.lastIndexOf('.'));
  
  // Check against dangerous extensions
  if (DANGEROUS_EXTENSIONS.includes(extension)) {
    return {
      isValid: false,
      error: `File extension ${extension} is not allowed for security reasons`
    };
  }
  
  // Validate extension matches MIME type
  const expectedExtensions = [
    ...Object.values(ALLOWED_FILE_TYPES.images).flat(),
    ...Object.values(ALLOWED_FILE_TYPES.videos).flat()
  ];
  
  if (!expectedExtensions.includes(extension as any)) {
    return {
      isValid: false,
      error: `File extension ${extension} does not match the file type`
    };
  }
  
  return { isValid: true };
}

/**
 * Validate file size
 */
export function validateFileSize(file: File, maxSize: number): {
  isValid: boolean;
  error?: string;
} {
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return {
      isValid: false,
      error: `File size ${Math.round(file.size / (1024 * 1024))}MB exceeds maximum allowed size of ${maxSizeMB}MB`
    };
  }
  
  return { isValid: true };
}

/**
 * Generate file hash for integrity checking
 */
export async function generateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hash = crypto.createHash('sha256');
  hash.update(Buffer.from(buffer));
  return hash.digest('hex');
}

/**
 * Extract file metadata
 */
export async function extractFileMetadata(file: File): Promise<FileMetadata> {
  const hash = await generateFileHash(file);
  const fileName = file.name.toLowerCase();
  const extension = fileName.substring(fileName.lastIndexOf('.'));
  
  const metadata: FileMetadata = {
    size: file.size,
    type: file.type,
    extension,
    hash,
    isImage: file.type.startsWith('image/'),
    isVideo: file.type.startsWith('video/'),
    mimeType: file.type
  };
  
  // Extract image dimensions if it's an image
  if (metadata.isImage) {
    try {
      const buffer = await file.arrayBuffer();
      const imageInfo = await sharp(Buffer.from(buffer)).metadata();
      metadata.dimensions = {
        width: imageInfo.width || 0,
        height: imageInfo.height || 0
      };
    } catch (error) {
      console.warn('Could not extract image dimensions:', error);
    }
  }
  
  return metadata;
}

/**
 * Scan file for security threats
 */
export async function scanFileForThreats(file: File): Promise<SecurityScanResult> {
  const threats: string[] = [];
  const scanDetails: any = {};
  
  try {
    // Check file signature (magic bytes)
    const buffer = await file.arrayBuffer();
    const fileHeader = Buffer.from(buffer.slice(0, 16));
    
    // Check for executable signatures
    const executableSignatures = [
      Buffer.from([0x4D, 0x5A]), // PE executable
      Buffer.from([0x7F, 0x45, 0x4C, 0x46]), // ELF executable
      Buffer.from([0xFE, 0xED, 0xFA, 0xCE]), // Mach-O executable
    ];
    
    for (const signature of executableSignatures) {
      if (fileHeader.subarray(0, signature.length).equals(signature)) {
        threats.push('Executable file detected');
        scanDetails.executableSignature = true;
      }
    }
    
    // Check for script signatures
    const scriptSignatures = [
      Buffer.from([0x23, 0x21]), // Shebang
      Buffer.from([0x3C, 0x3F, 0x70, 0x68, 0x70]), // PHP
      Buffer.from([0x3C, 0x25]), // ASP
    ];
    
    for (const signature of scriptSignatures) {
      if (fileHeader.subarray(0, signature.length).equals(signature)) {
        threats.push('Script file detected');
        scanDetails.scriptSignature = true;
      }
    }
    
    // Check file content for suspicious patterns
    const content = Buffer.from(buffer).toString('utf8', 0, Math.min(1024, buffer.byteLength));
    
    // Check for embedded scripts
    const scriptPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /onload=/i,
      /onerror=/i,
      /eval\(/i,
      /document\.write/i
    ];
    
    for (const pattern of scriptPatterns) {
      if (pattern.test(content)) {
        threats.push('Suspicious content detected');
        scanDetails.suspiciousContent = true;
        break;
      }
    }
    
    // Check for embedded URLs
    const urlPattern = /https?:\/\/[^\s]+/i;
    if (urlPattern.test(content)) {
      threats.push('Embedded URLs detected');
      scanDetails.embeddedUrls = true;
    }
    
  } catch (error) {
    console.error('File security scan error:', error);
    threats.push('Security scan failed');
    scanDetails.scanError = error;
  }
  
  return {
    isSafe: threats.length === 0,
    threats,
    scanDetails
  };
}

/**
 * Sanitize file name
 */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special characters with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, '') // Remove leading/trailing underscores
    .toLowerCase();
}

/**
 * Validate image file specifically
 */
export async function validateImageFile(file: File): Promise<FileValidationResult> {
  const errors: string[] = [];
  
  // Basic file validation
  const typeValidation = validateFileType(file, Object.keys(ALLOWED_FILE_TYPES.images));
  if (!typeValidation.isValid) {
    errors.push(typeValidation.error!);
  }
  
  const sizeValidation = validateFileSize(file, MAX_FILE_SIZES.image);
  if (!sizeValidation.isValid) {
    errors.push(sizeValidation.error!);
  }
  
  // Extract metadata
  let metadata: FileMetadata;
  try {
    metadata = await extractFileMetadata(file);
  } catch (error) {
    errors.push('Could not extract file metadata');
    return { isValid: false, errors };
  }
  
  // Validate image dimensions
  if (metadata.dimensions) {
    const { width, height } = metadata.dimensions;
    
    if (width > 4096 || height > 4096) {
      errors.push('Image dimensions too large. Maximum allowed: 4096x4096 pixels');
    }
    
    if (width < 10 || height < 10) {
      errors.push('Image dimensions too small. Minimum allowed: 10x10 pixels');
    }
  }
  
  // Security scan
  const securityScan = await scanFileForThreats(file);
  if (!securityScan.isSafe) {
    errors.push(...securityScan.threats);
  }
  
  // Create sanitized file if validation passes
  let sanitizedFile: File | undefined;
  if (errors.length === 0) {
    const sanitizedName = sanitizeFileName(file.name);
    sanitizedFile = new File([file], sanitizedName, { type: file.type });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedFile,
    metadata
  };
}

/**
 * Validate video file specifically
 */
export async function validateVideoFile(file: File): Promise<FileValidationResult> {
  const errors: string[] = [];
  
  // Basic file validation
  const typeValidation = validateFileType(file, Object.keys(ALLOWED_FILE_TYPES.videos));
  if (!typeValidation.isValid) {
    errors.push(typeValidation.error!);
  }
  
  const sizeValidation = validateFileSize(file, MAX_FILE_SIZES.video);
  if (!sizeValidation.isValid) {
    errors.push(sizeValidation.error!);
  }
  
  // Extract metadata
  let metadata: FileMetadata;
  try {
    metadata = await extractFileMetadata(file);
  } catch (error) {
    errors.push('Could not extract file metadata');
    return { isValid: false, errors };
  }
  
  // Security scan
  const securityScan = await scanFileForThreats(file);
  if (!securityScan.isSafe) {
    errors.push(...securityScan.threats);
  }
  
  // Create sanitized file if validation passes
  let sanitizedFile: File | undefined;
  if (errors.length === 0) {
    const sanitizedName = sanitizeFileName(file.name);
    sanitizedFile = new File([file], sanitizedName, { type: file.type });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedFile,
    metadata
  };
}

/**
 * Process and optimize image file
 */
export async function processImageFile(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp';
  } = {}
): Promise<Buffer> {
  const {
    maxWidth = 2048,
    maxHeight = 2048,
    quality = 85,
    format = 'jpeg'
  } = options;
  
  const buffer = await file.arrayBuffer();
  
  let sharpInstance = sharp(Buffer.from(buffer));
  
  // Resize if needed
  const metadata = await sharpInstance.metadata();
  if (metadata.width && metadata.height) {
    if (metadata.width > maxWidth || metadata.height > maxHeight) {
      sharpInstance = sharpInstance.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }
  }
  
  // Convert format and optimize
  switch (format) {
    case 'jpeg':
      sharpInstance = sharpInstance.jpeg({ quality });
      break;
    case 'png':
      sharpInstance = sharpInstance.png({ quality });
      break;
    case 'webp':
      sharpInstance = sharpInstance.webp({ quality });
      break;
  }
  
  return await sharpInstance.toBuffer();
}

/**
 * Generate secure file path
 */
export function generateSecureFilePath(
  userId: string,
  fileType: 'image' | 'video' | 'document',
  originalName: string
): string {
  const timestamp = Date.now();
  const randomId = crypto.randomBytes(8).toString('hex');
  const sanitizedName = sanitizeFileName(originalName);
  const extension = sanitizedName.substring(sanitizedName.lastIndexOf('.'));
  
  return `${fileType}s/${userId}/${timestamp}_${randomId}${extension}`;
}

/**
 * Check if file is suspicious based on content analysis
 */
export async function isFileSuspicious(file: File): Promise<{
  isSuspicious: boolean;
  reasons: string[];
}> {
  const reasons: string[] = [];
  
  try {
    // Check file size vs content ratio
    const buffer = await file.arrayBuffer();
    const content = Buffer.from(buffer).toString('utf8', 0, Math.min(1024, buffer.byteLength));
    
    // Check for unusually high entropy (might indicate encrypted/compressed content)
    const entropy = calculateEntropy(content);
    if (entropy > 7.5) {
      reasons.push('High entropy content detected');
    }
    
    // Check for embedded null bytes (common in executables)
    if (content.includes('\x00')) {
      reasons.push('Null bytes detected in file content');
    }
    
    // Check for suspicious file headers
    const header = Buffer.from(buffer.slice(0, 16));
    if (header.includes(Buffer.from([0x00, 0x00, 0x00, 0x00]))) {
      reasons.push('Suspicious file header detected');
    }
    
  } catch (error) {
    console.error('File suspicion check error:', error);
    reasons.push('Could not analyze file content');
  }
  
  return {
    isSuspicious: reasons.length > 0,
    reasons
  };
}

/**
 * Calculate entropy of a string (measure of randomness)
 */
function calculateEntropy(str: string): number {
  const freq: { [key: string]: number } = {};
  
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    freq[char] = (freq[char] || 0) + 1;
  }
  
  let entropy = 0;
  for (const count of Object.values(freq)) {
    const p = count / str.length;
    entropy -= p * Math.log2(p);
  }
  
  return entropy;
}

/**
 * Validate file upload request
 */
export async function validateFileUpload(
  request: NextRequest,
  expectedFieldName: string = 'file'
): Promise<{
  isValid: boolean;
  file?: File;
  errors: string[];
  metadata?: FileMetadata;
}> {
  const errors: string[] = [];
  
  try {
    const formData = await request.formData();
    const file = formData.get(expectedFieldName) as File;
    
    if (!file) {
      errors.push(`No file provided in field '${expectedFieldName}'`);
      return { isValid: false, errors };
    }
    
    if (file.size === 0) {
      errors.push('File is empty');
      return { isValid: false, errors };
    }
    
    // Determine file type and validate accordingly
    if (file.type.startsWith('image/')) {
      const validation = await validateImageFile(file);
      return {
        isValid: validation.isValid,
        file: validation.sanitizedFile,
        errors: validation.errors,
        metadata: validation.metadata
      };
    } else if (file.type.startsWith('video/')) {
      const validation = await validateVideoFile(file);
      return {
        isValid: validation.isValid,
        file: validation.sanitizedFile,
        errors: validation.errors,
        metadata: validation.metadata
      };
    } else {
      errors.push(`Unsupported file type: ${file.type}`);
      return { isValid: false, errors };
    }
    
  } catch (error) {
    console.error('File upload validation error:', error);
    errors.push('File upload validation failed');
    return { isValid: false, errors };
  }
}
