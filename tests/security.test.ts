/**
 * Security Tests - Test-Driven Development for Security Fixes
 * These tests verify that all security vulnerabilities are properly addressed
 */

// Mock DOMPurify for testing
const mockDOMPurify = {
  sanitize: jest.fn((input: string) => input.replace(/<script[^>]*>.*?<\/script>/gi, '')),
  isValidNode: jest.fn(() => true)
};

// Mock validator for testing
const mockValidator = {
  isURL: jest.fn((str: string) => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  }),
  isEmail: jest.fn((str: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)),
  escape: jest.fn((str: string) => str.replace(/[&<>"']/g, (match) => {
    const escapes: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;'
    };
    return escapes[match];
  }))
};

jest.mock('dompurify', () => mockDOMPurify);
jest.mock('validator', () => mockValidator);

import { SecurityService } from '../services/securityService';
import { authService } from '../services/authService';

describe('Security Service - XSS Prevention', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should sanitize XSS attempts in product description', () => {
    const maliciousInput = 'Product <script>alert("XSS")</script> description';
    const sanitized = SecurityService.sanitizeInput(maliciousInput);

    expect(sanitized).not.toContain('<script>');
    expect(sanitized).toBe('Product  description');
    expect(mockDOMPurify.sanitize).toHaveBeenCalledWith(maliciousInput);
  });

  test('should sanitize XSS attempts in company information', () => {
    const maliciousCompanyName = 'Company <img src=x onerror=alert("XSS")>';
    const sanitized = SecurityService.sanitizeInput(maliciousCompanyName);

    expect(sanitized).not.toContain('onerror');
    expect(mockDOMPurify.sanitize).toHaveBeenCalledWith(maliciousCompanyName);
  });

  test('should preserve safe HTML content', () => {
    const safeInput = 'This is <b>bold</b> text';
    const sanitized = SecurityService.sanitizeInput(safeInput);

    expect(sanitized).toContain('<b>bold</b>');
    expect(mockDOMPurify.sanitize).toHaveBeenCalledWith(safeInput);
  });

  test('should handle null and undefined inputs safely', () => {
    expect(SecurityService.sanitizeInput(null)).toBe('');
    expect(SecurityService.sanitizeInput(undefined)).toBe('');
  });
});

describe('Security Service - URL Validation', () => {
  test('should validate legitimate URLs', () => {
    const validUrls = [
      'https://example.com',
      'http://subdomain.example.com',
      'https://example.com/path?query=value'
    ];

    validUrls.forEach(url => {
      expect(SecurityService.validateURL(url)).toBe(true);
    });
  });

  test('should reject malicious URLs', () => {
    const maliciousUrls = [
      'javascript:alert("XSS")',
      'data:text/html,<script>alert("XSS")</script>',
      'vbscript:msgbox("XSS")',
      'file:///etc/passwd'
    ];

    maliciousUrls.forEach(url => {
      expect(SecurityService.validateURL(url)).toBe(false);
    });
  });

  test('should reject invalid URL formats', () => {
    const invalidUrls = [
      'not-a-url',
      'ftp://example.com', // if FTP is not allowed
      '',
      'http://',
      'https://'
    ];

    invalidUrls.forEach(url => {
      expect(SecurityService.validateURL(url)).toBe(false);
    });
  });
});

describe('Security Service - Input Validation', () => {
  test('should validate email addresses', () => {
    expect(SecurityService.validateEmail('user@example.com')).toBe(true);
    expect(SecurityService.validateEmail('invalid-email')).toBe(false);
    expect(SecurityService.validateEmail('')).toBe(false);
  });

  test('should enforce input length limits', () => {
    const longInput = 'a'.repeat(10001);
    expect(SecurityService.validateInputLength(longInput, 10000)).toBe(false);
    expect(SecurityService.validateInputLength('valid input', 100)).toBe(true);
  });

  test('should detect SQL injection attempts', () => {
    const sqlInjectionAttempts = [
      "'; DROP TABLE users; --",
      "1' OR '1'='1",
      "admin'--",
      "' UNION SELECT * FROM users --"
    ];

    sqlInjectionAttempts.forEach(attempt => {
      expect(SecurityService.validateInput(attempt)).toBe(false);
    });
  });
});

describe('Authentication Security', () => {
  test('should hash passwords securely', async () => {
    const password = 'testPassword123';
    const hashedPassword = await authService.hashPassword(password);

    expect(hashedPassword).not.toBe(password);
    expect(hashedPassword).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt format
    expect(hashedPassword.length).toBeGreaterThan(50);
  });

  test('should verify passwords correctly', async () => {
    const password = 'testPassword123';
    const hashedPassword = await authService.hashPassword(password);

    const isValid = await authService.verifyPassword(password, hashedPassword);
    expect(isValid).toBe(true);

    const isInvalid = await authService.verifyPassword('wrongPassword', hashedPassword);
    expect(isInvalid).toBe(false);
  });

  test('should reject weak passwords', () => {
    const weakPasswords = [
      '123',
      'password',
      '12345678',
      'qwerty',
      ''
    ];

    weakPasswords.forEach(password => {
      expect(authService.validatePasswordStrength(password)).toBe(false);
    });
  });

  test('should accept strong passwords', () => {
    const strongPasswords = [
      'SecureP@ssw0rd123',
      'MyStr0ng!Password',
      'Complex#Pass1234'
    ];

    strongPasswords.forEach(password => {
      expect(authService.validatePasswordStrength(password)).toBe(true);
    });
  });

  test('should generate secure JWT tokens', () => {
    const mockUser = { id: 'user-1', email: 'test@example.com' };
    const token = authService.generateSecureToken(mockUser);

    expect(token).toBeDefined();
    expect(token.split('.')).toHaveLength(3); // JWT format: header.payload.signature
    expect(token).not.toContain('btoa'); // Should not use simple base64
  });

  test('should validate JWT token expiration', () => {
    const expiredToken = authService.generateSecureToken({ id: 'user-1' }, -3600); // expired 1 hour ago
    expect(authService.validateToken(expiredToken)).toBe(false);

    const validToken = authService.generateSecureToken({ id: 'user-1' }, 3600); // expires in 1 hour
    expect(authService.validateToken(validToken)).toBe(true);
  });
});

describe('CSRF Protection', () => {
  test('should generate CSRF tokens', () => {
    const token = SecurityService.generateCSRFToken();
    expect(token).toBeDefined();
    expect(token.length).toBeGreaterThan(20);
    expect(typeof token).toBe('string');
  });

  test('should validate CSRF tokens', () => {
    const token = SecurityService.generateCSRFToken();
    expect(SecurityService.validateCSRFToken(token)).toBe(true);
    expect(SecurityService.validateCSRFToken('invalid-token')).toBe(false);
  });
});

describe('Rate Limiting', () => {
  test('should enforce rate limits per IP', () => {
    const ip = '192.168.1.1';

    // Allow first few requests
    for (let i = 0; i < 10; i++) {
      expect(SecurityService.checkRateLimit(ip)).toBe(true);
    }

    // Should start blocking after limit
    expect(SecurityService.checkRateLimit(ip)).toBe(false);
  });

  test('should reset rate limit after time window', async () => {
    const ip = '192.168.1.2';

    // Exhaust rate limit
    for (let i = 0; i < 11; i++) {
      SecurityService.checkRateLimit(ip);
    }

    // Mock time advancement
    jest.advanceTimersByTime(60000); // 1 minute

    expect(SecurityService.checkRateLimit(ip)).toBe(true);
  });
});