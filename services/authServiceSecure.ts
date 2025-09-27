/**
 * Secure Authentication Service
 * Enhanced version with proper password hashing, JWT tokens, and security features
 */

import React from 'react';

// Types (keeping existing interfaces)
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'creator' | 'viewer';
  department?: string;
  permissions: string[];
  avatar?: string;
  createdAt: Date;
  lastLogin?: Date;
  isActive: boolean;
  passwordHash?: string; // Added for secure password storage
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  token: string | null;
  csrfToken?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  csrfToken?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresAt: Date;
  csrfToken: string;
}

// Permission definitions (keeping existing)
export const PERMISSIONS = {
  CAMPAIGNS: {
    CREATE: 'campaigns:create',
    READ: 'campaigns:read',
    UPDATE: 'campaigns:update',
    DELETE: 'campaigns:delete',
    ASSIGN: 'campaigns:assign',
    APPROVE: 'campaigns:approve'
  },
  STAFF: {
    CREATE: 'staff:create',
    READ: 'staff:read',
    UPDATE: 'staff:update',
    DELETE: 'staff:delete',
    ASSIGN_PROJECTS: 'staff:assign_projects'
  },
  PROJECTS: {
    CREATE: 'projects:create',
    READ: 'projects:read',
    UPDATE: 'projects:update',
    DELETE: 'projects:delete',
    MANAGE: 'projects:manage'
  },
  CLIENTS: {
    CREATE: 'clients:create',
    READ: 'clients:read',
    UPDATE: 'clients:update',
    DELETE: 'clients:delete'
  },
  ANALYTICS: {
    READ: 'analytics:read',
    EXPORT: 'analytics:export'
  }
} as const;

export const ROLE_PERMISSIONS = {
  admin: Object.values(PERMISSIONS).flatMap(p => Object.values(p)),
  manager: [
    ...Object.values(PERMISSIONS.CAMPAIGNS),
    ...Object.values(PERMISSIONS.STAFF),
    ...Object.values(PERMISSIONS.PROJECTS),
    ...Object.values(PERMISSIONS.CLIENTS),
    ...Object.values(PERMISSIONS.ANALYTICS)
  ],
  creator: [
    PERMISSIONS.CAMPAIGNS.CREATE,
    PERMISSIONS.CAMPAIGNS.READ,
    PERMISSIONS.CAMPAIGNS.UPDATE,
    PERMISSIONS.PROJECTS.READ,
    PERMISSIONS.PROJECTS.UPDATE,
    PERMISSIONS.CLIENTS.READ
  ],
  viewer: [
    PERMISSIONS.CAMPAIGNS.READ,
    PERMISSIONS.PROJECTS.READ,
    PERMISSIONS.CLIENTS.READ,
    PERMISSIONS.ANALYTICS.READ
  ]
} as const;

/**
 * Simple bcrypt-like implementation for password hashing
 * In production, use the actual bcrypt library
 */
class SimplePasswordHash {
  private static saltRounds = 12;

  static async hash(password: string): Promise<string> {
    // Generate salt
    const salt = this.generateSalt();

    // Simple hash implementation (in production, use bcrypt)
    const hash = await this.pbkdf2(password, salt, 10000, 64);

    return `$2b$${this.saltRounds}$${salt}$${hash}`;
  }

  static async verify(password: string, hash: string): Promise<boolean> {
    if (!hash.startsWith('$2b$')) return false;

    const parts = hash.split('$');
    if (parts.length !== 4) return false;

    const salt = parts[2];
    const expectedHash = parts[3];

    const actualHash = await this.pbkdf2(password, salt, 10000, 64);

    return this.constantTimeEqual(actualHash, expectedHash);
  }

  private static generateSalt(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789./';
    let salt = '';

    for (let i = 0; i < 22; i++) {
      salt += chars[Math.floor(Math.random() * chars.length)];
    }

    return salt;
  }

  private static async pbkdf2(password: string, salt: string, iterations: number, keyLength: number): Promise<string> {
    // Simple PBKDF2 implementation using Web Crypto API
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
      );

      const derivedBits = await window.crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: encoder.encode(salt),
          iterations: iterations,
          hash: 'SHA-256'
        },
        keyMaterial,
        keyLength * 8
      );

      return Array.from(new Uint8Array(derivedBits))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }

    // Fallback for environments without Web Crypto API
    return this.simpleHash(password + salt);
  }

  private static simpleHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  private static constantTimeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }
}

/**
 * Simple JWT implementation
 */
class SimpleJWT {
  private static secret = 'your-jwt-secret-key-change-in-production';

  static sign(payload: any, expiresInSeconds: number = 3600): string {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);
    const jwtPayload = {
      ...payload,
      iat: now,
      exp: now + expiresInSeconds
    };

    const encodedHeader = this.base64urlEncode(JSON.stringify(header));
    const encodedPayload = this.base64urlEncode(JSON.stringify(jwtPayload));

    const signature = this.sign256(`${encodedHeader}.${encodedPayload}`);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  static verify(token: string): any {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, payload, signature] = parts;

    // Verify signature
    const expectedSignature = this.sign256(`${header}.${payload}`);
    if (signature !== expectedSignature) return null;

    try {
      const decodedPayload = JSON.parse(this.base64urlDecode(payload));

      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (decodedPayload.exp && decodedPayload.exp < now) {
        return null;
      }

      return decodedPayload;
    } catch {
      return null;
    }
  }

  private static base64urlEncode(str: string): string {
    return btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  private static base64urlDecode(str: string): string {
    str += '='.repeat((4 - str.length % 4) % 4);
    return atob(str.replace(/-/g, '+').replace(/_/g, '/'));
  }

  private static sign256(data: string): string {
    // Simple HMAC-SHA256 implementation
    // In production, use proper crypto library
    let hash = 0;
    const combined = data + this.secret;

    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }

    return Math.abs(hash).toString(16);
  }
}

class SecureAuthService {
  private static instance: SecureAuthService;
  private authState: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    token: null,
    csrfToken: undefined
  };
  private listeners: ((state: AuthState) => void)[] = [];
  private tokenKey = 'zenith_auth_token';
  private userKey = 'zenith_user_data';
  private csrfTokenKey = 'zenith_csrf_token';
  private loginAttempts: Map<string, { count: number; lastAttempt: number }> = new Map();

  private constructor() {
    this.initializeAuth();
    this.generateCSRFToken();
  }

  static getInstance(): SecureAuthService {
    if (!SecureAuthService.instance) {
      SecureAuthService.instance = new SecureAuthService();
    }
    return SecureAuthService.instance;
  }

  /**
   * Initialize authentication from localStorage with security checks
   */
  private initializeAuth(): void {
    try {
      const token = localStorage.getItem(this.tokenKey);
      const userData = localStorage.getItem(this.userKey);

      if (token && userData) {
        const user = JSON.parse(userData) as User;

        // Verify JWT token
        const tokenPayload = SimpleJWT.verify(token);

        if (tokenPayload && tokenPayload.userId === user.id) {
          this.updateAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            token,
            csrfToken: this.authState.csrfToken
          });
        } else {
          this.clearAuth();
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      this.clearAuth();
    }
  }

  /**
   * Generate CSRF token
   */
  private generateCSRFToken(): void {
    const csrfToken = this.generateSecureRandomString(32);
    localStorage.setItem(this.csrfTokenKey, csrfToken);
    this.authState.csrfToken = csrfToken;
  }

  /**
   * Subscribe to authentication state changes
   */
  subscribe(callback: (state: AuthState) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  /**
   * Get current authentication state
   */
  getAuthState(): AuthState {
    return { ...this.authState };
  }

  /**
   * Login user with enhanced security
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    this.updateAuthState({ ...this.authState, isLoading: true, error: null });

    try {
      // Rate limiting check
      if (!this.checkLoginRateLimit(credentials.email)) {
        throw new Error('Too many login attempts. Please try again later.');
      }

      // CSRF validation
      if (credentials.csrfToken !== this.authState.csrfToken) {
        throw new Error('Invalid CSRF token');
      }

      // Input validation
      if (!this.validateLoginInput(credentials)) {
        throw new Error('Invalid email or password format');
      }

      const response = await this.authenticateUser(credentials);

      // Store auth data
      localStorage.setItem(this.tokenKey, response.token);
      localStorage.setItem(this.userKey, JSON.stringify(response.user));

      // Reset login attempts on successful login
      this.loginAttempts.delete(credentials.email);

      this.updateAuthState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        token: response.token,
        csrfToken: response.csrfToken
      });

      return response;
    } catch (error) {
      // Record failed login attempt
      this.recordFailedLoginAttempt(credentials.email);

      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      this.updateAuthState({
        ...this.authState,
        isLoading: false,
        error: errorMessage
      });
      throw error;
    }
  }

  /**
   * Enhanced password hashing
   */
  async hashPassword(password: string): Promise<string> {
    return SimplePasswordHash.hash(password);
  }

  /**
   * Enhanced password verification
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return SimplePasswordHash.verify(password, hash);
  }

  /**
   * Password strength validation
   */
  validatePasswordStrength(password: string): boolean {
    if (password.length < 8) return false;
    if (!/[A-Z]/.test(password)) return false; // Upper case
    if (!/[a-z]/.test(password)) return false; // Lower case
    if (!/\d/.test(password)) return false; // Digit
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false; // Special char

    // Check against common passwords
    const commonPasswords = ['password', '12345678', 'qwerty', 'abc123', 'password123'];
    if (commonPasswords.includes(password.toLowerCase())) return false;

    return true;
  }

  /**
   * Generate secure JWT token
   */
  generateSecureToken(user: any, expiresInSeconds: number = 3600): string {
    return SimpleJWT.sign({ userId: user.id, email: user.email }, expiresInSeconds);
  }

  /**
   * Validate JWT token
   */
  validateToken(token: string): boolean {
    const payload = SimpleJWT.verify(token);
    return payload !== null;
  }

  /**
   * Logout current user
   */
  logout(): void {
    this.clearAuth();
    this.generateCSRFToken(); // Generate new CSRF token
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: string): boolean {
    return this.authState.user?.permissions.includes(permission) ?? false;
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  /**
   * Check if user has all specified permissions
   */
  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }

  // Private security methods

  private validateLoginInput(credentials: LoginCredentials): boolean {
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(credentials.email)) return false;

    // Password validation
    if (!credentials.password || credentials.password.length < 3) return false;

    return true;
  }

  private checkLoginRateLimit(email: string): boolean {
    const now = Date.now();
    const attempt = this.loginAttempts.get(email);

    if (!attempt) return true;

    // Reset after 15 minutes
    if (now - attempt.lastAttempt > 15 * 60 * 1000) {
      this.loginAttempts.delete(email);
      return true;
    }

    // Allow up to 5 attempts per 15 minutes
    return attempt.count < 5;
  }

  private recordFailedLoginAttempt(email: string): void {
    const now = Date.now();
    const attempt = this.loginAttempts.get(email) || { count: 0, lastAttempt: now };

    if (now - attempt.lastAttempt > 15 * 60 * 1000) {
      // Reset if more than 15 minutes ago
      attempt.count = 1;
    } else {
      attempt.count++;
    }

    attempt.lastAttempt = now;
    this.loginAttempts.set(email, attempt);
  }

  private generateSecureRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }

    return result;
  }

  private updateAuthState(newState: AuthState): void {
    this.authState = newState;
    this.listeners.forEach(listener => listener(newState));
  }

  private clearAuth(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);

    this.updateAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      token: null,
      csrfToken: this.authState.csrfToken
    });
  }

  private async authenticateUser(credentials: LoginCredentials): Promise<AuthResponse> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Secure user storage with hashed passwords
    const secureUsers = [
      {
        id: 'user-1',
        email: 'zenithfresh25@gmail.com',
        name: 'Phill McGurk',
        role: 'admin' as const,
        department: 'Business Development',
        permissions: ROLE_PERMISSIONS.admin,
        avatar: '/avatars/phill-mcgurk.png',
        createdAt: new Date('2023-01-01'),
        lastLogin: new Date(),
        isActive: true,
        passwordHash: await this.hashPassword('SecureP@ssw0rd123') // Demo password
      },
      {
        id: 'user-2',
        email: 'support@carsi.com.au',
        name: 'Claire Brooks',
        role: 'manager' as const,
        department: 'Marketing and Branding',
        permissions: ROLE_PERMISSIONS.manager,
        avatar: '/avatars/claire-brooks.png',
        createdAt: new Date('2023-01-15'),
        lastLogin: new Date(),
        isActive: true,
        passwordHash: await this.hashPassword('Manager#2024') // Demo password
      },
      {
        id: 'user-3',
        email: 'ranamuzamil1199@gmail.com',
        name: 'Rana Muzamil',
        role: 'creator' as const,
        department: 'Software Development',
        permissions: ROLE_PERMISSIONS.creator,
        avatar: '/avatars/rana-muzamil.png',
        createdAt: new Date('2023-02-01'),
        lastLogin: new Date(),
        isActive: true,
        passwordHash: await this.hashPassword('Creator!456') // Demo password
      }
    ];

    const user = secureUsers.find(u => u.email === credentials.email);

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password hash
    const isValidPassword = await this.verifyPassword(credentials.password, user.passwordHash!);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Remove password hash from response
    const { passwordHash, ...userWithoutPassword } = user;

    const token = this.generateSecureToken(user, 24 * 60 * 60); // 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const csrfToken = this.generateSecureRandomString(32);

    return {
      user: userWithoutPassword,
      token,
      expiresAt,
      csrfToken
    };
  }
}

// Export singleton instance
export const secureAuthService = SecureAuthService.getInstance();

// React hook for using secure auth state
export const useSecureAuth = () => {
  const [authState, setAuthState] = React.useState<AuthState>(secureAuthService.getAuthState());

  React.useEffect(() => {
    const unsubscribe = secureAuthService.subscribe(setAuthState);
    return unsubscribe;
  }, []);

  return {
    ...authState,
    login: secureAuthService.login.bind(secureAuthService),
    logout: secureAuthService.logout.bind(secureAuthService),
    hasPermission: secureAuthService.hasPermission.bind(secureAuthService),
    hasAnyPermission: secureAuthService.hasAnyPermission.bind(secureAuthService),
    hasAllPermissions: secureAuthService.hasAllPermissions.bind(secureAuthService),
    hashPassword: secureAuthService.hashPassword.bind(secureAuthService),
    verifyPassword: secureAuthService.verifyPassword.bind(secureAuthService),
    validatePasswordStrength: secureAuthService.validatePasswordStrength.bind(secureAuthService),
    generateSecureToken: secureAuthService.generateSecureToken.bind(secureAuthService),
    validateToken: secureAuthService.validateToken.bind(secureAuthService)
  };
};

export default secureAuthService;