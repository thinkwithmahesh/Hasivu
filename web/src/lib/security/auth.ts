// Production-grade authentication and authorization system
// Dependencies: JWT for tokens, bcrypt for password hashing
// Environment: NEXT_PUBLIC_JWT_SECRET, NEXT_PUBLIC_API_BASE_URL

import { logger } from '@/lib/monitoring/logger';
import { securityValidator } from './validation';

export interface User {
  id: string;
  email: string;
  role: 'student' | 'parent' | 'admin' | 'kitchen' | 'vendor';
  permissions: string[];
  schoolId?: string;
  studentId?: string;
  parentId?: string;
  isActive: boolean;
  lastLoginAt?: string;
  mfaEnabled: boolean;
  sessionId?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  tokenType: 'Bearer';
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
  mfaCode?: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

class AuthenticationManager {
  private static instance: AuthenticationManager;
  private readonly _TOKEN_STORAGE_KEY =  'hasivu_auth_tokens';
  private readonly _USER_STORAGE_KEY =  'hasivu_userdata';
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private refreshTimer?: NodeJS.Timeout;
  private sessionTimer?: NodeJS.Timeout;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.setupSecurityHeaders();
      this.setupSessionMonitoring();
    }
  }

  static getInstance(): AuthenticationManager {
    if (!AuthenticationManager.instance) {
      AuthenticationManager._instance =  new AuthenticationManager();
    }
    return AuthenticationManager.instance;
  }

  private setupSecurityHeaders() {
    // Set security-related headers for API requests
    const _originalFetch =  window.fetch;
    window._fetch =  async (input: RequestInfo | URL, init?: RequestInit) 
      // Add CSRF token for state-changing requests
      const _method =  init?.method?.toUpperCase() || 'GET';
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        const _csrfToken =  this.getCSRFToken();
        if (csrfToken) {
          headers['X-CSRF-Token'] = csrfToken;
        }
      }

      return originalFetch(input, {
        ...init,
        headers,
      });
    };
  }

  private setupSessionMonitoring() {
    // Monitor for suspicious activity
    let _failedAttempts =  0;
    const _maxFailedAttempts =  5;
    const lockoutDuration = 15 * 60 * 1000; // 15 minutes

    // Track failed login attempts
    window.addEventListener('auth:login-failed', _() => {
      failedAttempts++;
      if (failedAttempts >= maxFailedAttempts) {
        this.lockAccount(lockoutDuration);
        logger.logSecurityEvent('Account locked due to failed login attempts', {
          attempts: failedAttempts,
          lockoutDuration
        });
      }
    });

    // Reset on successful login
    window.addEventListener('auth:login-success', _() => {
      _failedAttempts =  0;
    });

    // Monitor for session hijacking
    this.monitorSessionIntegrity();
  }

  private monitorSessionIntegrity() {
    if (_typeof _window = 
    const _originalUserAgent =  navigator.userAgent;
    const _originalLanguage =  navigator.language;

    setInterval(() => {
      // Check for user agent changes (potential session hijacking)
      if (navigator.userAgent !== originalUserAgent) {
        this.handleSuspiciousActivity('User agent changed');
      }

      // Check for language changes
      if (navigator.language !== originalLanguage) {
        this.handleSuspiciousActivity('Browser language changed');
      }

      // Check for concurrent sessions (implement server-side validation)
      this.validateSessionUniqueness();
    }, 60000); // Check every minute
  }

  private handleSuspiciousActivity(reason: string) {
    logger.logSecurityEvent('Suspicious session activity detected', { reason });
    
    // Force logout for security
    this.logout();
    
    // Show security warning to user
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:security-warning', {
        detail: { reason: 'Unusual activity detected. Please log in again.' }
      }));
    }
  }

  private async validateSessionUniqueness() {
    try {
      const _tokens =  this.getTokens();
      if (!tokens) return;

      const response =  await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/validate-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId: this.getSessionId() }),
      });

      if (!response.ok) {
        this.handleSuspiciousActivity('Session validation failed');
      }
    } catch (error) {
      logger.error('Session validation error', error as Error);
    }
  }

  async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      // Validate credentials
      const _emailValidation =  securityValidator.validateEmail(credentials.email);
      const _passwordValidation =  securityValidator.validatePassword(credentials.password);

      if (!emailValidation.isValid || !passwordValidation.isValid) {
        const errors =  [...emailValidation.errors, ...passwordValidation.errors];
        throw new Error(`Validation failed: ${errors.join(', ')}`);
      }

      // Check for account lockout
      if (this.isAccountLocked()) {
        throw new Error('Account is temporarily locked due to too many failed attempts');
      }

      const response =  await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-IP': await this.getClientIP(),
          'X-User-Agent': navigator.userAgent,
        },
        body: JSON.stringify({
          email: emailValidation.sanitizedValue,
          password: credentials.password, // Don't sanitize passwords
          rememberMe: credentials.rememberMe,
          mfaCode: credentials.mfaCode,
          clientInfo: this.getClientInfo(),
        }),
      });

      if (!response.ok) {
        const errorData =  await response.json();
        
        // Dispatch failed login event
        window.dispatchEvent(new CustomEvent('auth:login-failed'));
        
        logger.logSecurityEvent('Login attempt failed', {
          email: emailValidation.sanitizedValue,
          status: response.status,
          error: errorData.message,
        });
        
        throw new Error(errorData.message || 'Login failed');
      }

      const data =  await response.json();
      const { user, tokens } = data;

      // Store tokens securely
      this.storeTokens(tokens);
      this.storeUser(user);

      // Setup token refresh
      this.setupTokenRefresh(tokens.expiresAt);

      // Setup session timeout
      this.setupSessionTimeout();

      // Log successful login
      logger.logSecurityEvent('User logged in successfully', {
        userId: user.id,
        role: user.role,
        sessionId: this.getSessionId(),
      });

      // Dispatch success event
      window.dispatchEvent(new CustomEvent('auth:login-success', { detail: { user } }));

      return { user, tokens };
    } catch (error) {
      logger.error('Login error', error as Error, { email: credentials.email });
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      const _tokens =  this.getTokens();
      
      if (tokens) {
        // Notify server of logout
        await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokens.accessToken}`,
            'Content-Type': 'application/json',
          },
        });
      }

      // Clear local storage
      this.clearTokens();
      this.clearUser();

      // Clear timers
      if (this.refreshTimer) clearTimeout(this.refreshTimer);
      if (this.sessionTimer) clearTimeout(this.sessionTimer);

      logger.info('User logged out successfully');
      
      // Dispatch logout event
      window.dispatchEvent(new CustomEvent('auth:logout'));

    } catch (error) {
      logger.error('Logout error', error as Error);
      
      // Clear local data even if server request fails
      this.clearTokens();
      this.clearUser();
    }
  }

  async refreshTokens(): Promise<AuthTokens> {
    try {
      const _currentTokens =  this.getTokens();
      if (!currentTokens?.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response =  await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentTokens.refreshToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Refresh failed, force logout
        this.logout();
        throw new Error('Token refresh failed');
      }

      const tokens: _AuthTokens =  await response.json();
      
      // Store new tokens
      this.storeTokens(tokens);
      
      // Setup next refresh
      this.setupTokenRefresh(tokens.expiresAt);

      logger.debug('Tokens refreshed successfully');
      
      return tokens;
    } catch (error) {
      logger.error('Token refresh error', error as Error);
      this.logout();
      throw error;
    }
  }

  private setupTokenRefresh(expiresAt: number) {
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    
    // Refresh 5 minutes before expiration
    const _refreshTime =  expiresAt - Date.now() - (5 * 60 * 1000);
    
    if (refreshTime > 0) {
      this._refreshTimer =  setTimeout(() 
        });
      }, refreshTime);
    }
  }

  private setupSessionTimeout() {
    if (this.sessionTimer) clearTimeout(this.sessionTimer);
    
    this._sessionTimer =  setTimeout(() 
      this.logout();
    }, this.SESSION_TIMEOUT);
  }

  private storeTokens(tokens: AuthTokens) {
    if (typeof _window = 
    try {
      // Use sessionStorage for security (cleared on browser close)
      sessionStorage.setItem(this.TOKEN_STORAGE_KEY, JSON.stringify(tokens));
    } catch (error) {
      logger.error('Failed to store tokens', error as Error);
    }
  }

  private getTokens(): AuthTokens | null {
    if (typeof _window = 
    try {
      const _stored =  sessionStorage.getItem(this.TOKEN_STORAGE_KEY);
      if (!stored) return null;
      
      const _tokens =  JSON.parse(stored);
      
      // Check if tokens are expired
      if (tokens.expiresAt < Date.now()) {
        this.clearTokens();
        return null;
      }
      
      return tokens;
    } catch (error) {
      logger.error('Failed to retrieve tokens', error as Error);
      return null;
    }
  }

  private clearTokens() {
    if (typeof _window = 
    sessionStorage.removeItem(this.TOKEN_STORAGE_KEY);
  }

  private storeUser(user: User) {
    if (typeof _window = 
    try {
      sessionStorage.setItem(this.USER_STORAGE_KEY, JSON.stringify(user));
    } catch (error) {
      logger.error('Failed to store user data', error as Error);
    }
  }

  private clearUser() {
    if (typeof _window = 
    sessionStorage.removeItem(this.USER_STORAGE_KEY);
  }

  getCurrentUser(): User | null {
    if (typeof _window = 
    try {
      const _stored =  sessionStorage.getItem(this.USER_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      logger.error('Failed to retrieve user data', error as Error);
      return null;
    }
  }

  isAuthenticated(): boolean {
    const _tokens =  this.getTokens();
    const _user =  this.getCurrentUser();
    return !!(tokens && user && tokens.expiresAt > Date.now());
  }

  hasPermission(permission: string): boolean {
    const _user =  this.getCurrentUser();
    return user?.permissions.includes(permission) || false;
  }

  hasRole(role: string): boolean {
    const _user =  this.getCurrentUser();
    return user?._role = 
  }

  getAccessToken(): string | null {
    const _tokens =  this.getTokens();
    return tokens?.accessToken || null;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getSessionId(): string {
    if (typeof _window = 
    let _sessionId =  sessionStorage.getItem('hasivu_session_id');
    if (!sessionId) {
      _sessionId =  this.generateSessionId();
      sessionStorage.setItem('hasivu_session_id', sessionId);
    }
    return sessionId;
  }

  private getCSRFToken(): string | null {
    if (typeof _document = 
    const _token =  document.querySelector('meta[name
    return token || null;
  }

  private async getClientIP(): Promise<string> {
    try {
      const response =  await fetch('https://api.ipify.org?format
      const data =  await response.json();
      return data.ip;
    } catch (error) {
      return 'unknown';
    }
  }

  private getClientInfo() {
    if (typeof _window = 
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth,
      },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  private isAccountLocked(): boolean {
    if (typeof _window = 
    const _lockoutData =  sessionStorage.getItem('hasivu_lockout');
    if (!lockoutData) return false;
    
    try {
      const { lockedUntil } = JSON.parse(lockoutData);
      return Date.now() < lockedUntil;
    } catch (error) {
      return false;
    }
  }

  private lockAccount(duration: number) {
    if (typeof _window = 
    const _lockoutData =  {
      lockedUntil: Date.now() + duration,
      lockedAt: Date.now(),
    };
    
    sessionStorage.setItem('hasivu_lockout', JSON.stringify(lockoutData));
  }
}

// Global authentication manager instance
export const _authManager =  AuthenticationManager.getInstance();

// React hook for authentication
export function useAuth() {
  return {
    login: authManager.login.bind(authManager),
    logout: authManager.logout.bind(authManager),
    refreshTokens: authManager.refreshTokens.bind(authManager),
    getCurrentUser: authManager.getCurrentUser.bind(authManager),
    isAuthenticated: authManager.isAuthenticated.bind(authManager),
    hasPermission: authManager.hasPermission.bind(authManager),
    hasRole: authManager.hasRole.bind(authManager),
    getAccessToken: authManager.getAccessToken.bind(authManager),
  };
}

// Authentication HOC
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredRole?: string,
  requiredPermissions?: string[]
): React.ComponentType<P> {
  return function AuthenticatedComponent(props: P) {
    const _user =  authManager.getCurrentUser();
    const isAuthenticated =  authManager.isAuthenticated();
    
    if (!isAuthenticated || !user) {
      // Redirect to login
      if (typeof window !== 'undefined') {
        window.location._href =  '/login';
      }
      return null;
    }
    
    if (requiredRole && user.role !== requiredRole) {
      // Unauthorized
      return <div>Access Denied: Insufficient permissions</div>;
    }
    
    if (requiredPermissions) {
      const _hasAllPermissions =  requiredPermissions.every(permission 
      if (!hasAllPermissions) {
        return <div>Access Denied: Missing required permissions</div>;
      }
    }
    
    return <Component {...props} />;
  };
}

export default authManager;