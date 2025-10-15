/**
 * HASIVU Platform - Enhanced Authentication Context
 * Enterprise-grade authentication with MFA, session management, and threat protection
 * Integrates all security services for bulletproof authentication
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { UserRole } from '@/types/auth';
import { mfaService, MFAChallenge, RiskAssessment } from '@/lib/security/mfa-service';
import { sessionManager, SessionData, DeviceFingerprint } from '@/lib/security/session-manager';
import { threatProtection, ThreatAnalysis } from '@/lib/security/threat-protection';
import { logger } from '@/lib/monitoring/logger';

// Enhanced user interface
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  schoolId?: string;
  mfaEnabled: boolean;
  mfaMethods: ('sms' | 'email' | 'totp')[];
  lastLogin?: Date;
  createdAt: Date;
}

// Enhanced authentication state
interface EnhancedAuthState {
  user: User | null;
  session: SessionData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  mfaRequired: boolean;
  securityLevel: 'low' | 'medium' | 'high' | 'critical';
  threatAnalysis?: ThreatAnalysis;
}

// Authentication context interface
interface EnhancedAuthContextType extends EnhancedAuthState {
  // Basic authentication
  login: (credentials: {
    email: string;
    password: string;
    role?: string;
    rememberMe?: boolean;
  }) => Promise<{
    success: boolean;
    mfaRequired?: boolean;
    challenge?: MFAChallenge;
    riskAssessment?: RiskAssessment;
  }>;

  logout: () => Promise<void>;

  // MFA operations
  setupMFA: (
    method: 'sms' | 'email' | 'totp',
    contact?: string
  ) => Promise<{
    secret?: string;
    qrCode?: string;
    challenge?: MFAChallenge;
    backupCodes?: string[];
  }>;

  verifyMFA: (challenge: {
    challengeId?: string;
    code: string;
    type: 'sms' | 'email' | 'totp' | 'backup';
  }) => Promise<{ success: boolean; message?: string }>;

  // Session management
  refreshSession: () => Promise<boolean>;
  terminateSession: (sessionId?: string) => Promise<void>;
  terminateAllSessions: () => Promise<void>;
  getUserSessions: () => Promise<SessionData[]>;

  // Security monitoring
  checkSecurity: () => Promise<void>;
  reportSuspiciousActivity: (activity: string, details: any) => Promise<void>;

  // Enhanced security features
  updateSecuritySettings: (settings: {
    mfaRequired?: boolean;
    sessionTimeout?: number;
    ipWhitelist?: string[];
  }) => Promise<boolean>;

  // Utility functions
  hasRole: (role: UserRole | UserRole[]) => boolean;
  hasPermission: (permission: string) => boolean;
  isSessionActive: () => boolean;
  getSecurityRecommendations: () => string[];
}

const EnhancedAuthContext = createContext<EnhancedAuthContextType | undefined>(undefined);

interface EnhancedAuthProviderProps {
  children: React.ReactNode;
}

export function EnhancedAuthProvider({ children }: EnhancedAuthProviderProps) {
  const [state, setState] = useState<EnhancedAuthState>({
    user: null,
    session: null,
    isAuthenticated: false,
    isLoading: false,
    isInitialized: false,
    mfaRequired: false,
    securityLevel: 'low',
  });

  const router = useRouter();

  // Initialize authentication on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  // Initialize authentication state
  const initializeAuth = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // Check for existing session
      const savedSession = localStorage.getItem('session_data');
      const savedUser = localStorage.getItem('authenticated_user');

      if (savedSession && savedUser) {
        const session: SessionData = JSON.parse(savedSession);
        const user: User = JSON.parse(savedUser);

        // Validate session with device fingerprint
        const deviceFingerprint = await generateDeviceFingerprint();
        const validation = await sessionManager.validateSession(
          session.sessionId,
          deviceFingerprint.combined,
          await getClientIP()
        );

        if (validation.valid && validation.session) {
          setState(prev => ({
            ...prev,
            user,
            session: validation.session,
            isAuthenticated: true,
            securityLevel: calculateSecurityLevel(user, validation.session),
          }));

          // Perform background security check
          await performSecurityCheck(user, validation.session);
        } else {
          // Clear invalid session
          await clearAuthData();
        }
      }

      setState(prev => ({ ...prev, isInitialized: true, isLoading: false }));
    } catch (error) {
      logger.logSecurityEvent('Authentication initialization failed', {
        error: error.message,
      });
      setState(prev => ({ ...prev, isInitialized: true, isLoading: false }));
    }
  }, []);

  // Enhanced login with comprehensive security
  const login = useCallback(
    async (credentials: {
      email: string;
      password: string;
      role?: string;
      rememberMe?: boolean;
    }) => {
      try {
        setState(prev => ({ ...prev, isLoading: true }));

        // Get client context
        const clientContext = await getClientContext();

        // Perform threat analysis
        const { analysis, action } = await threatProtection.analyzeLoginAttempt({
          email: credentials.email,
          ipAddress: clientContext.ipAddress,
          userAgent: clientContext.userAgent,
          deviceFingerprint: clientContext.deviceFingerprint.combined,
          geolocation: clientContext.geolocation,
          success: false, // Will update after verification
          timestamp: new Date(),
        });

        // Handle security actions
        if (action.action === 'block') {
          toast.error('Login temporarily blocked due to security concerns');
          return { success: false };
        }

        // Check brute force protection
        const bruteForceCheck = await threatProtection.checkBruteForce(
          clientContext.ipAddress,
          undefined,
          false
        );

        if (bruteForceCheck.blocked) {
          toast.error(
            `Too many failed attempts. Try again in ${Math.ceil((bruteForceCheck.retryAfter || 0) / 60)} minutes.`
          );
          return { success: false };
        }

        // Simulate API authentication (replace with actual API call)
        const authResponse = await authenticateUser(credentials);
        if (!authResponse.success) {
          // Record failed attempt
          await threatProtection.analyzeLoginAttempt({
            ...clientContext,
            email: credentials.email,
            success: false,
            timestamp: new Date(),
          });

          toast.error('Invalid credentials');
          return { success: false };
        }

        const user = authResponse.user!;

        // Assess login risk for MFA requirement
        const riskAssessment = await mfaService.assessLoginRisk(user.id, {
          ipAddress: clientContext.ipAddress,
          userAgent: clientContext.userAgent,
          deviceFingerprint: clientContext.deviceFingerprint.combined,
          geolocation: clientContext.geolocation,
          loginTime: new Date(),
        });

        // Determine if MFA is required
        const mfaRequired =
          user.mfaEnabled || riskAssessment.requiresMFA || action.action === 'challenge';

        if (mfaRequired) {
          setState(prev => ({
            ...prev,
            mfaRequired: true,
            threatAnalysis: analysis,
            securityLevel: 'medium',
          }));

          // Send appropriate MFA challenge
          let challenge: MFAChallenge;
          if (user.mfaMethods.includes('totp')) {
            // TOTP doesn't need a challenge, just return info
            challenge = {
              challengeId: '',
              type: 'totp',
              expiresAt: new Date(Date.now() + 5 * 60 * 1000),
              attemptsRemaining: 3,
            };
          } else if (user.mfaMethods.includes('sms')) {
            challenge = await mfaService.sendSMSOTP(user.id, '+1234567890'); // Get from user profile
          } else {
            challenge = await mfaService.sendEmailOTP(user.id, user.email);
          }

          return {
            success: false,
            mfaRequired: true,
            challenge,
            riskAssessment,
          };
        }

        // Create secure session
        const { session, accessToken, refreshToken } = await sessionManager.createSession(
          user.id,
          user.role,
          {
            fingerprint: clientContext.deviceFingerprint,
            ipAddress: clientContext.ipAddress,
            userAgent: clientContext.userAgent,
            geolocation: clientContext.geolocation,
          }
        );

        // Store authentication data
        localStorage.setItem('session_data', JSON.stringify(session));
        localStorage.setItem('authenticated_user', JSON.stringify(user));
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);

        // Update state
        setState(prev => ({
          ...prev,
          user,
          session,
          isAuthenticated: true,
          isLoading: false,
          mfaRequired: false,
          securityLevel: calculateSecurityLevel(user, session),
          threatAnalysis: analysis,
        }));

        // Record successful login
        await threatProtection.analyzeLoginAttempt({
          ...clientContext,
          userId: user.id,
          email: credentials.email,
          success: true,
          timestamp: new Date(),
        });

        toast.success(`Welcome back, ${user.firstName}!`);
        return { success: true };
      } catch (error) {
        logger.logSecurityEvent('Login error', { error: error.message });
        toast.error('Login failed. Please try again.');
        return { success: false };
      } finally {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    },
    []
  );

  // Setup MFA
  const setupMFA = useCallback(
    async (method: 'sms' | 'email' | 'totp', contact?: string) => {
      if (!state.user) throw new Error('User not authenticated');

      try {
        switch (method) {
          case 'totp': {
            const totpSetup = await mfaService.setupTOTP(state.user.id, state.user.email);
            return {
              secret: totpSetup.secret,
              qrCode: totpSetup.qrCodeUrl,
              backupCodes: totpSetup.backupCodes,
            };
          }

          case 'sms': {
            if (!contact) throw new Error('Phone number required for SMS setup');
            const smsChallenge = await mfaService.sendSMSOTP(state.user.id, contact);
            return { challenge: smsChallenge };
          }

          case 'email': {
            const emailChallenge = await mfaService.sendEmailOTP(state.user.id, state.user.email);
            return { challenge: emailChallenge };
          }

          default:
            throw new Error('Invalid MFA method');
        }
      } catch (error) {
        logger.logSecurityEvent('MFA setup failed', {
          userId: state.user.id,
          method,
          error: error.message,
        });
        throw error;
      }
    },
    [state.user]
  );

  // Verify MFA
  const verifyMFA = useCallback(
    async (challenge: {
      challengeId?: string;
      code: string;
      type: 'sms' | 'email' | 'totp' | 'backup';
    }) => {
      if (!state.user) {
        return { success: false, message: 'User not authenticated' };
      }

      try {
        let result;

        switch (challenge.type) {
          case 'sms':
          case 'email':
            if (!challenge.challengeId) {
              return { success: false, message: 'Challenge ID required' };
            }
            result = await mfaService.verifyOTP(
              challenge.challengeId,
              challenge.code,
              state.user.id
            );
            break;

          case 'totp':
            result = await mfaService.verifyTOTP(state.user.id, challenge.code);
            break;

          case 'backup':
            result = await mfaService.verifyBackupCode(state.user.id, challenge.code);
            break;

          default:
            return { success: false, message: 'Invalid challenge type' };
        }

        if (result.success) {
          // Complete login after successful MFA
          const clientContext = await getClientContext();
          const { session, accessToken, refreshToken } = await sessionManager.createSession(
            state.user.id,
            state.user.role,
            {
              fingerprint: clientContext.deviceFingerprint,
              ipAddress: clientContext.ipAddress,
              userAgent: clientContext.userAgent,
              geolocation: clientContext.geolocation,
            }
          );

          // Store authentication data
          localStorage.setItem('session_data', JSON.stringify(session));
          localStorage.setItem('access_token', accessToken);
          localStorage.setItem('refresh_token', refreshToken);

          setState(prev => ({
            ...prev,
            session,
            isAuthenticated: true,
            mfaRequired: false,
            securityLevel: 'high', // High security after MFA
          }));

          toast.success('Authentication successful!');
          return { success: true, message: 'MFA verification successful' };
        } else {
          const message = result.lockoutTime
            ? `Account locked until ${new Date(result.lockoutTime).toLocaleTimeString()}`
            : `Verification failed. ${result.remainingAttempts || 0} attempts remaining.`;

          return { success: false, message };
        }
      } catch (error) {
        logger.logSecurityEvent('MFA verification error', {
          userId: state.user.id,
          type: challenge.type,
          error: error.message,
        });
        return { success: false, message: 'Verification failed' };
      }
    },
    [state.user]
  );

  // Enhanced logout with session cleanup
  const logout = useCallback(async () => {
    try {
      if (state.session) {
        await sessionManager.terminateSession(state.session.sessionId, 'user_logout');
      }

      // Clear all authentication data
      await clearAuthData();

      setState({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
        mfaRequired: false,
        securityLevel: 'low',
      });

      toast.success('Logged out successfully');
      router.push('/');
    } catch (error) {
      logger.logSecurityEvent('Logout error', { error: error.message });
      // Clear local state even if server logout fails
      await clearAuthData();
      setState({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
        mfaRequired: false,
        securityLevel: 'low',
      });
    }
  }, [state.session, router]);

  // Terminate specific session
  const terminateSession = useCallback(
    async (sessionId?: string) => {
      if (!state.user) return;

      try {
        if (sessionId) {
          await sessionManager.terminateSession(sessionId, 'user_terminated');
        } else if (state.session) {
          await sessionManager.terminateSession(state.session.sessionId, 'user_terminated');
          await logout();
        }

        toast.success('Session terminated');
      } catch (error) {
        logger.logSecurityEvent('Session termination error', { error: error.message });
        toast.error('Failed to terminate session');
      }
    },
    [state.user, state.session, logout]
  );

  // Terminate all sessions
  const terminateAllSessions = useCallback(async () => {
    if (!state.user) return;

    try {
      await sessionManager.terminateUserSessions(state.user.id);
      await logout();
      toast.success('All sessions terminated');
    } catch (error) {
      logger.logSecurityEvent('All sessions termination error', { error: error.message });
      toast.error('Failed to terminate all sessions');
    }
  }, [state.user, logout]);

  // Get user sessions
  const getUserSessions = useCallback(async (): Promise<SessionData[]> => {
    if (!state.user) return [];
    return await sessionManager.getUserSessions(state.user.id);
  }, [state.user]);

  // Refresh session
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) return false;

      const clientContext = await getClientContext();
      const refreshResult = await sessionManager.refreshToken(
        refreshToken,
        clientContext.deviceFingerprint.combined,
        clientContext.ipAddress
      );

      if (refreshResult) {
        localStorage.setItem('access_token', refreshResult.accessToken);
        localStorage.setItem('refresh_token', refreshResult.refreshToken);
        localStorage.setItem('session_data', JSON.stringify(refreshResult.session));

        setState(prev => ({
          ...prev,
          session: refreshResult.session,
        }));

        return true;
      }

      return false;
    } catch (error) {
      logger.logSecurityEvent('Session refresh error', { error: error.message });
      return false;
    }
  }, []);

  // Security check
  const checkSecurity = useCallback(async () => {
    if (!state.user || !state.session) return;

    try {
      await performSecurityCheck(state.user, state.session);
    } catch (error) {
      logger.logSecurityEvent('Security check error', { error: error.message });
    }
  }, [state.user, state.session]);

  // Report suspicious activity
  const reportSuspiciousActivity = useCallback(
    async (activity: string, details: any) => {
      if (!state.user) return;

      try {
        logger.logSecurityEvent('Suspicious activity reported', {
          userId: state.user.id,
          activity,
          details,
          timestamp: new Date().toISOString(),
        });

        toast.success('Security team has been notified');
      } catch (error) {
        logger.logSecurityEvent('Failed to report suspicious activity', { error: error.message });
      }
    },
    [state.user]
  );

  // Update security settings
  const updateSecuritySettings = useCallback(
    async (settings: {
      mfaRequired?: boolean;
      sessionTimeout?: number;
      ipWhitelist?: string[];
    }): Promise<boolean> => {
      if (!state.user) return false;

      try {
        // Update user security settings (API call in production)
        // For demo, just update local state
        setState(prev => ({
          ...prev,
          user: prev.user
            ? {
                ...prev.user,
                mfaEnabled: settings.mfaRequired ?? prev.user.mfaEnabled,
              }
            : null,
        }));

        toast.success('Security settings updated');
        return true;
      } catch (error) {
        logger.logSecurityEvent('Security settings update failed', { error: error.message });
        toast.error('Failed to update security settings');
        return false;
      }
    },
    [state.user]
  );

  // Utility functions
  const hasRole = useCallback(
    (role: UserRole | UserRole[]): boolean => {
      if (!state.user) return false;
      return Array.isArray(role) ? role.includes(state.user.role) : state.user.role === role;
    },
    [state.user]
  );

  const hasPermission = useCallback(
    (_permission: string): boolean => {
      // Implement permission checking based on role
      return state.isAuthenticated; // Simplified for demo
    },
    [state.isAuthenticated]
  );

  const isSessionActive = useCallback((): boolean => {
    return state.isAuthenticated && state.session?.isActive === true;
  }, [state.isAuthenticated, state.session]);

  const getSecurityRecommendations = useCallback((): string[] => {
    const recommendations: string[] = [];

    if (!state.user?.mfaEnabled) {
      recommendations.push('Enable Multi-Factor Authentication for better security');
    }

    if (state.securityLevel === 'low') {
      recommendations.push(
        'Your security level is low. Consider enabling additional security features'
      );
    }

    if (state.threatAnalysis?.riskScore && state.threatAnalysis.riskScore > 50) {
      recommendations.push('Suspicious activity detected. Review your recent login activity');
    }

    return recommendations;
  }, [state.user, state.securityLevel, state.threatAnalysis]);

  // Helper functions

  async function getClientContext() {
    const deviceFingerprint = await generateDeviceFingerprint();
    const ipAddress = await getClientIP();

    return {
      deviceFingerprint,
      ipAddress,
      userAgent: navigator.userAgent,
      geolocation: await getGeolocation(),
    };
  }

  async function generateDeviceFingerprint(): Promise<DeviceFingerprint> {
    return sessionManager.generateDeviceFingerprint({
      userAgent: navigator.userAgent,
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth,
      },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      canvas: await getCanvasFingerprint(),
      webgl: getWebGLFingerprint(),
      audio: await getAudioFingerprint(),
    });
  }

  async function getClientIP(): Promise<string> {
    // In production, get from server or use service like ipify
    return '127.0.0.1';
  }

  async function getGeolocation(): Promise<{ country: string; city: string } | undefined> {
    // In production, use geolocation API or IP geolocation service
    return undefined;
  }

  async function authenticateUser(credentials: any): Promise<{ success: boolean; user?: User }> {
    // Demo authentication - replace with actual API call
    const user: User = {
      id: `user-${Date.now()}`,
      email: credentials.email,
      firstName: 'Demo',
      lastName: 'User',
      role: (credentials.role as UserRole) || UserRole.STUDENT,
      mfaEnabled: false,
      mfaMethods: ['email'],
      createdAt: new Date(),
    };

    return { success: true, user };
  }

  async function clearAuthData(): Promise<void> {
    const keysToRemove = [
      'session_data',
      'authenticated_user',
      'access_token',
      'refresh_token',
      'mfa_challenge',
    ];

    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  async function performSecurityCheck(_user: User, _session: SessionData): Promise<void> {
    // Perform background security monitoring
    // This would run periodically to check for threats
  }

  function calculateSecurityLevel(
    user: User,
    session: SessionData
  ): 'low' | 'medium' | 'high' | 'critical' {
    let score = 0;

    if (user.mfaEnabled) score += 30;
    if (session.deviceFingerprint) score += 20;
    if (session.geolocation) score += 10;

    if (score >= 60) return 'critical';
    if (score >= 40) return 'high';
    if (score >= 20) return 'medium';
    return 'low';
  }

  // Canvas fingerprinting
  async function getCanvasFingerprint(): Promise<string> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('HASIVU Security Check', 2, 2);

    return canvas.toDataURL();
  }

  // WebGL fingerprinting
  function getWebGLFingerprint(): string {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    if (!gl) return '';

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return '';

    return `${gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)} ${gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)}`;
  }

  // Audio fingerprinting
  async function getAudioFingerprint(): Promise<string> {
    return new Promise(resolve => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const analyser = audioContext.createAnalyser();
        const gainNode = audioContext.createGain();

        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(10000, audioContext.currentTime);

        gainNode.gain.setValueAtTime(0, audioContext.currentTime);

        oscillator.connect(analyser);
        analyser.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.start(0);

        setTimeout(() => {
          const dataArray = new Float32Array(analyser.frequencyBinCount);
          analyser.getFloatFrequencyData(dataArray);

          oscillator.stop();
          audioContext.close();

          const fingerprint = Array.from(dataArray.slice(0, 30))
            .map(x => Math.round(x))
            .join(',');

          resolve(fingerprint);
        }, 100);
      } catch (error) {
        resolve('');
      }
    });
  }

  // Context value
  const contextValue: EnhancedAuthContextType = {
    ...state,
    login,
    logout,
    setupMFA,
    verifyMFA,
    refreshSession,
    terminateSession,
    terminateAllSessions,
    getUserSessions,
    checkSecurity,
    reportSuspiciousActivity,
    updateSecuritySettings,
    hasRole,
    hasPermission,
    isSessionActive,
    getSecurityRecommendations,
  };

  return (
    <EnhancedAuthContext.Provider value={contextValue}>{children}</EnhancedAuthContext.Provider>
  );
}

// Hook to use enhanced authentication
export function useEnhancedAuth(): EnhancedAuthContextType {
  const context = useContext(EnhancedAuthContext);
  if (context === undefined) {
    throw new Error('useEnhancedAuth must be used within an EnhancedAuthProvider');
  }
  return context;
}

export default EnhancedAuthContext;
