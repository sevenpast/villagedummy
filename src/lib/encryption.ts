// ============================================================================
// CLIENT-SIDE ENCRYPTION FOR DOCUMENT VAULT
// Zero-Knowledge Architecture - Server can NEVER decrypt documents
// ============================================================================

export interface EncryptionResult {
  encryptedBlob: Blob;
  encryptionMetadata: {
    iv: string;
    salt: string;
    algorithm: string;
  };
}

export interface DecryptionResult {
  decryptedBlob: Blob;
}

/**
 * Encrypt a file using AES-256-GCM with user-provided password
 * This happens entirely in the browser - server never sees the key
 */
export async function encryptFile(
  file: File,
  userPassword: string
): Promise<EncryptionResult> {
  try {
    // 1. Derive encryption key from user password using PBKDF2
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(userPassword),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000, // OWASP recommended minimum
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );
    
    // 2. Encrypt file with AES-256-GCM
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
    const fileData = await file.arrayBuffer();
    
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      fileData
    );
    
    // 3. Return encrypted blob and metadata
    return {
      encryptedBlob: new Blob([encryptedData]),
      encryptionMetadata: {
        iv: Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join(''),
        salt: Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join(''),
        algorithm: 'AES-256-GCM'
      }
    };
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt file. Please try again.');
  }
}

/**
 * Decrypt a file using the user's password
 * This happens entirely in the browser
 */
export async function decryptFile(
  encryptedBlob: Blob,
  userPassword: string,
  encryptionMetadata: {
    iv: string;
    salt: string;
    algorithm: string;
  }
): Promise<DecryptionResult> {
  try {
    // 1. Reconstruct IV and salt from hex strings
    const iv = new Uint8Array(
      encryptionMetadata.iv.match(/.{2}/g)!.map(byte => parseInt(byte, 16))
    );
    const salt = new Uint8Array(
      encryptionMetadata.salt.match(/.{2}/g)!.map(byte => parseInt(byte, 16))
    );
    
    // 2. Derive the same key using the same parameters
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(userPassword),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
    
    // 3. Decrypt the file
    const encryptedData = await encryptedBlob.arrayBuffer();
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      encryptedData
    );
    
    return {
      decryptedBlob: new Blob([decryptedData])
    };
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt file. Please check your password.');
  }
}

/**
 * Generate a secure random password for the user
 * This is a fallback if they don't want to set their own
 */
export function generateSecurePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  // Ensure at least one character from each category
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Uppercase
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Lowercase
  password += '0123456789'[Math.floor(Math.random() * 10)]; // Number
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Special char
  
  // Fill the rest randomly
  for (let i = 4; i < 16; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Hash a password for storage (if needed for additional security)
 * Note: This is NOT the encryption key - just for verification
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Security warning for users
 */
export const ENCRYPTION_WARNING = `
🔒 SECURITY NOTICE:

Your document will be encrypted with a password that ONLY YOU know.
- Village cannot decrypt your documents
- If you forget your password, your document cannot be recovered
- Choose a strong password and store it safely
- This provides maximum privacy and security
`;

/**
 * File validation before encryption
 */
export function validateFileForEncryption(file: File): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check file size (50MB limit)
  if (file.size > 52428800) {
    errors.push('File size must be less than 50MB');
  }
  
  // Check file type
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    errors.push('Only PDF and image files (JPG, PNG, WebP) are allowed');
  }
  
  // Check file extension
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
  const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
  
  if (!extension || !allowedExtensions.includes(extension)) {
    errors.push('Invalid file extension');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
