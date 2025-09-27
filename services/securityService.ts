/**
 * Security Service
 * Comprehensive security utilities for input validation, XSS prevention, and attack mitigation
 */

// Types for security configuration
export interface SecurityConfig {
  maxInputLength: number;
  allowedProtocols: string[];
  allowedDomains?: string[];
  rateLimitWindow: number;
  rateLimitMax: number;
}

export interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Default security configuration
const DEFAULT_CONFIG: SecurityConfig = {
  maxInputLength: 10000,
  allowedProtocols: ['http:', 'https:'],
  rateLimitWindow: 60000, // 1 minute
  rateLimitMax: 10
};

class SecurityService {
  private config: SecurityConfig;
  private rateLimitStore: Map<string, RateLimitEntry> = new Map();
  private csrfTokens: Set<string> = new Set();

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Sanitize user input to prevent XSS attacks
   * Uses DOMPurify when available, falls back to basic sanitization
   */
  sanitizeInput(input: string | null | undefined): string {
    if (!input) return '';

    // Try to use DOMPurify if available
    if (typeof window !== 'undefined' && (window as any).DOMPurify) {
      return (window as any).DOMPurify.sanitize(input, {
        ALLOWED_TAGS: ['b', 'i', 'u', 'em', 'strong', 'p', 'br'],
        ALLOWED_ATTR: []
      });
    }

    // Fallback sanitization for server-side or when DOMPurify not available
    return this.basicSanitize(input);
  }

  /**
   * Basic sanitization fallback
   */
  private basicSanitize(input: string): string {
    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '') // Remove iframe tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/vbscript:/gi, '') // Remove vbscript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/<object[^>]*>.*?<\/object>/gi, '') // Remove object tags
      .replace(/<embed[^>]*>/gi, '') // Remove embed tags
      .replace(/<link[^>]*>/gi, '') // Remove link tags
      .replace(/<meta[^>]*>/gi, ''); // Remove meta tags
  }

  /**
   * Validate URL for security issues
   */
  validateURL(url: string): boolean {
    if (!url || typeof url !== 'string') return false;

    try {
      const parsed = new URL(url);

      // Check protocol
      if (!this.config.allowedProtocols.includes(parsed.protocol)) {
        return false;
      }

      // Check for dangerous protocols
      const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
      if (dangerousProtocols.some(protocol => url.toLowerCase().startsWith(protocol))) {
        return false;
      }

      // Check domain whitelist if configured
      if (this.config.allowedDomains && this.config.allowedDomains.length > 0) {
        const domain = parsed.hostname.toLowerCase();
        return this.config.allowedDomains.some(allowed =>
          domain === allowed || domain.endsWith('.' + allowed)
        );
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate email address format
   */
  validateEmail(email: string): boolean {
    if (!email || typeof email !== 'string') return false;

    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  }

  /**
   * Validate input length
   */
  validateInputLength(input: string, maxLength?: number): boolean {
    const limit = maxLength || this.config.maxInputLength;
    return input.length <= limit;
  }

  /**
   * Comprehensive input validation
   */
  validateInput(input: string): boolean {
    if (!input || typeof input !== 'string') return false;

    // Check length
    if (!this.validateInputLength(input)) return false;

    // Check for SQL injection patterns
    const sqlInjectionPatterns = [
      /(\%27)|(\')|(\-\-)|(\%23)|(#)/i, // SQL meta-characters
      /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i, // Typical SQL injection
      /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i, // OR keyword
      /((\%27)|(\'))union/i, // UNION keyword
      /exec(\s|\+)+(s|x)p\w+/i, // Stored procedures
      /UNION(?:\s+ALL)?\s+SELECT/i // UNION SELECT
    ];

    return !sqlInjectionPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Generate CSRF token
   */
  generateCSRFToken(): string {
    const token = this.generateRandomString(32);
    this.csrfTokens.add(token);

    // Clean up old tokens after 1 hour
    setTimeout(() => {
      this.csrfTokens.delete(token);
    }, 3600000);

    return token;
  }

  /**
   * Validate CSRF token
   */
  validateCSRFToken(token: string): boolean {
    return this.csrfTokens.has(token);
  }

  /**
   * Rate limiting check
   */
  checkRateLimit(identifier: string): boolean {
    const now = Date.now();
    const entry = this.rateLimitStore.get(identifier);

    if (!entry) {
      // First request from this identifier
      this.rateLimitStore.set(identifier, {
        count: 1,
        resetTime: now + this.config.rateLimitWindow
      });
      return true;
    }

    if (now > entry.resetTime) {
      // Reset window has passed
      entry.count = 1;
      entry.resetTime = now + this.config.rateLimitWindow;
      return true;
    }

    if (entry.count >= this.config.rateLimitMax) {
      // Rate limit exceeded
      return false;
    }

    // Increment counter
    entry.count++;
    return true;
  }

  /**
   * Generate cryptographically secure random string
   */
  private generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    // Use crypto.getRandomValues if available (browser)
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const array = new Uint8Array(length);
      window.crypto.getRandomValues(array);

      for (let i = 0; i < length; i++) {
        result += chars[array[i] % chars.length];
      }
      return result;
    }

    // Fallback for environments without crypto API
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }

  /**
   * Escape HTML characters to prevent XSS
   */
  escapeHTML(str: string): string {
    const escapeMap: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };

    return str.replace(/[&<>"'/]/g, (char) => escapeMap[char]);
  }

  /**
   * Content Security Policy header generation
   */
  generateCSPHeader(): string {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://api.google.com",
      "style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com",
      "img-src 'self' data: https:",
      "font-src 'self' https:",
      "connect-src 'self' https://api.google.com https://api.airtable.com https://api.semrush.com",
      "media-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ].join('; ');
  }

  /**
   * Validate file upload security
   */
  validateFileUpload(file: File): { valid: boolean; error?: string } {
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { valid: false, error: 'File size exceeds 5MB limit' };
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed' };
    }

    // Check file extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!allowedExtensions.includes(extension)) {
      return { valid: false, error: 'Invalid file extension' };
    }

    return { valid: true };
  }

  /**
   * Clean up expired entries from rate limit store
   */
  cleanupRateLimitStore(): void {
    const now = Date.now();
    for (const [key, entry] of this.rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        this.rateLimitStore.delete(key);
      }
    }
  }
}

// Export singleton instance
export const securityService = new SecurityService();

// Named exports for specific functions
export const SecurityServiceAPI = {
  sanitizeInput: (input: string | null | undefined) => securityService.sanitizeInput(input),
  validateURL: (url: string) => securityService.validateURL(url),
  validateEmail: (email: string) => securityService.validateEmail(email),
  validateInputLength: (input: string, maxLength?: number) => securityService.validateInputLength(input, maxLength),
  validateInput: (input: string) => securityService.validateInput(input),
  generateCSRFToken: () => securityService.generateCSRFToken(),
  validateCSRFToken: (token: string) => securityService.validateCSRFToken(token),
  checkRateLimit: (identifier: string) => securityService.checkRateLimit(identifier),
  escapeHTML: (str: string) => securityService.escapeHTML(str),
  generateCSPHeader: () => securityService.generateCSPHeader(),
  validateFileUpload: (file: File) => securityService.validateFileUpload(file)
};

export default securityService;