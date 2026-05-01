export interface DeviceFingerprint {
  combined: string;
  userAgent: string;
  screen: {
    width: number;
    height: number;
    colorDepth: number;
  };
  timezone: string;
  language: string;
  platform: string;
  canvas: string;
  webgl: string;
  audio: string;
}

export interface SessionData {
  sessionId: string;
  userId: string;
  role: string;
  createdAt: Date;
  expiresAt: Date;
  lastActivity: Date;
  isActive: boolean;
  deviceFingerprint?: DeviceFingerprint;
  geolocation?: {
    country: string;
    city: string;
  };
  ipAddress?: string;
  userAgent?: string;
}

const sessions = new Map<string, SessionData>();
const refreshTokenIndex = new Map<string, string>();

function buildToken(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export const sessionManager = {
  generateDeviceFingerprint(input: Omit<DeviceFingerprint, 'combined'>): DeviceFingerprint {
    return {
      ...input,
      combined: [
        input.userAgent,
        input.platform,
        input.language,
        input.timezone,
        `${input.screen.width}x${input.screen.height}`,
      ].join('|'),
    };
  },

  async createSession(
    userId: string,
    role: string,
    context: {
      fingerprint: DeviceFingerprint;
      ipAddress: string;
      userAgent: string;
      geolocation?: { country: string; city: string };
    }
  ): Promise<{ session: SessionData; accessToken: string; refreshToken: string }> {
    const sessionId = buildToken('session');
    const session: SessionData = {
      sessionId,
      userId,
      role,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      lastActivity: new Date(),
      isActive: true,
      deviceFingerprint: context.fingerprint,
      geolocation: context.geolocation,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    };

    const accessToken = buildToken('access');
    const refreshToken = buildToken('refresh');

    sessions.set(sessionId, session);
    refreshTokenIndex.set(refreshToken, sessionId);

    return { session, accessToken, refreshToken };
  },

  async validateSession(
    sessionId: string,
    fingerprint: string,
    _ipAddress: string
  ): Promise<{ valid: boolean; session?: SessionData }> {
    const session = sessions.get(sessionId);
    if (!session || !session.isActive || session.expiresAt < new Date()) {
      return { valid: false };
    }

    if (session.deviceFingerprint?.combined && session.deviceFingerprint.combined !== fingerprint) {
      return { valid: false };
    }

    return { valid: true, session };
  },

  async terminateSession(sessionId: string, _reason: string): Promise<void> {
    const session = sessions.get(sessionId);
    if (session) {
      session.isActive = false;
      sessions.set(sessionId, session);
    }
  },

  async terminateUserSessions(userId: string): Promise<void> {
    for (const session of sessions.values()) {
      if (session.userId === userId) {
        session.isActive = false;
      }
    }
  },

  async getUserSessions(userId: string): Promise<SessionData[]> {
    return Array.from(sessions.values()).filter(session => session.userId === userId);
  },

  async refreshToken(
    refreshToken: string,
    _fingerprint: string,
    _ipAddress: string
  ): Promise<{ session: SessionData; accessToken: string; refreshToken: string } | null> {
    const sessionId = refreshTokenIndex.get(refreshToken);
    if (!sessionId) {
      return null;
    }

    const session = sessions.get(sessionId);
    if (!session || !session.isActive) {
      return null;
    }

    const nextRefreshToken = buildToken('refresh');
    const accessToken = buildToken('access');
    session.lastActivity = new Date();
    sessions.set(sessionId, session);
    refreshTokenIndex.delete(refreshToken);
    refreshTokenIndex.set(nextRefreshToken, sessionId);

    return {
      session,
      accessToken,
      refreshToken: nextRefreshToken,
    };
  },

  getSessionStats(): { totalActiveSessions: number; concurrentUsersCount: number } {
    const activeSessions = Array.from(sessions.values()).filter(session => session.isActive);
    const activeUsers = new Set(activeSessions.map(session => session.userId));

    return {
      totalActiveSessions: activeSessions.length,
      concurrentUsersCount: activeUsers.size,
    };
  },
};
