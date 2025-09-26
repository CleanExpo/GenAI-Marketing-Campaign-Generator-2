/**
 * Authentication Service
 * Handles user authentication, session management, and role-based permissions
 */

import React from 'react';

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
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  token: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresAt: Date;
}

// Permission definitions for role-based access control
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

// Role-based permission mapping
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

class AuthService {
  private static instance: AuthService;
  private authState: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    token: null
  };
  private listeners: ((state: AuthState) => void)[] = [];
  private tokenKey = 'zenith_auth_token';
  private userKey = 'zenith_user_data';

  private constructor() {
    this.initializeAuth();
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Initialize authentication from localStorage
   */
  private initializeAuth(): void {
    try {
      const token = localStorage.getItem(this.tokenKey);
      const userData = localStorage.getItem(this.userKey);

      if (token && userData) {
        const user = JSON.parse(userData) as User;
        // Check if token is still valid (simple check - in production use JWT verification)
        const tokenData = this.parseToken(token);

        if (tokenData && new Date(tokenData.expiresAt) > new Date()) {
          this.updateAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            token
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
   * Subscribe to authentication state changes
   */
  subscribe(callback: (state: AuthState) => void): () => void {
    this.listeners.push(callback);

    // Return unsubscribe function
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
   * Login user with credentials
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    this.updateAuthState({ ...this.authState, isLoading: true, error: null });

    try {
      // In a real implementation, this would make an API call to your auth server
      // For now, we'll simulate authentication with hardcoded users
      const response = await this.authenticateUser(credentials);

      // Store auth data
      localStorage.setItem(this.tokenKey, response.token);
      localStorage.setItem(this.userKey, JSON.stringify(response.user));

      this.updateAuthState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        token: response.token
      });

      return response;
    } catch (error) {
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
   * Logout current user
   */
  logout(): void {
    this.clearAuth();
    // In production, also make API call to invalidate token server-side
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

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<User>): Promise<User> {
    if (!this.authState.user) {
      throw new Error('No authenticated user');
    }

    try {
      // In production, make API call to update user
      const updatedUser = { ...this.authState.user, ...updates };

      localStorage.setItem(this.userKey, JSON.stringify(updatedUser));

      this.updateAuthState({
        ...this.authState,
        user: updatedUser
      });

      return updatedUser;
    } catch (error) {
      throw new Error('Failed to update profile');
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<string> {
    if (!this.authState.token) {
      throw new Error('No token to refresh');
    }

    try {
      // In production, make API call to refresh token
      const newToken = await this.requestTokenRefresh(this.authState.token);

      localStorage.setItem(this.tokenKey, newToken);

      this.updateAuthState({
        ...this.authState,
        token: newToken
      });

      return newToken;
    } catch (error) {
      // If refresh fails, logout user
      this.logout();
      throw error;
    }
  }

  // Private helper methods

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
      token: null
    });
  }

  private async authenticateUser(credentials: LoginCredentials): Promise<AuthResponse> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Hardcoded users for development (replace with real API in production)
    const mockUsers = [
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
        isActive: true
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
        isActive: true
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
        isActive: true
      }
    ];

    const user = mockUsers.find(u => u.email === credentials.email);

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // In production, verify password hash
    // For development, accept any password for demo users

    const token = this.generateToken(user.id);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    return {
      user,
      token,
      expiresAt
    };
  }

  private generateToken(userId: string): string {
    // In production, use proper JWT signing
    const payload = {
      userId,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000
    };
    return btoa(JSON.stringify(payload));
  }

  private parseToken(token: string): { userId: string; expiresAt: number } | null {
    try {
      return JSON.parse(atob(token));
    } catch {
      return null;
    }
  }

  private async requestTokenRefresh(token: string): Promise<string> {
    // In production, make API call to refresh endpoint
    await new Promise(resolve => setTimeout(resolve, 500));

    const tokenData = this.parseToken(token);
    if (!tokenData) {
      throw new Error('Invalid token');
    }

    return this.generateToken(tokenData.userId);
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();

// React hook for using auth state
export const useAuth = () => {
  const [authState, setAuthState] = React.useState<AuthState>(authService.getAuthState());

  React.useEffect(() => {
    const unsubscribe = authService.subscribe(setAuthState);
    return unsubscribe;
  }, []);

  return {
    ...authState,
    login: authService.login.bind(authService),
    logout: authService.logout.bind(authService),
    hasPermission: authService.hasPermission.bind(authService),
    hasAnyPermission: authService.hasAnyPermission.bind(authService),
    hasAllPermissions: authService.hasAllPermissions.bind(authService),
    updateProfile: authService.updateProfile.bind(authService),
    refreshToken: authService.refreshToken.bind(authService)
  };
};

// For environments where React is not available
declare global {
  var React: any;
}

export default authService;