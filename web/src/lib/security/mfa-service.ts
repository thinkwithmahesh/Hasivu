export type MFAMethod = 'sms' | 'email' | 'totp' | 'backup';

export interface MFAChallenge {
  challengeId: string;
  type: Exclude<MFAMethod, 'backup'>;
  expiresAt: Date;
  attemptsRemaining: number;
  destination?: string;
}

export interface RiskAssessment {
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  requiresMFA: boolean;
  reasons: string[];
}

interface MFAResult {
  success: boolean;
  remainingAttempts?: number;
  lockoutTime?: number;
}

const activeChallenges = new Map<string, { userId: string; code: string; type: MFAMethod }>();

function generateNumericCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function generateSecret(length = 32): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const values = new Uint32Array(length);

  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(values);
  } else {
    for (let index = 0; index < values.length; index += 1) {
      values[index] = Math.floor(Math.random() * alphabet.length);
    }
  }

  return Array.from(values, value => alphabet[value % alphabet.length]).join('');
}

function createChallenge(
  userId: string,
  type: Exclude<MFAMethod, 'backup'>,
  destination?: string
): MFAChallenge {
  const challengeId = `${type}-${Date.now()}`;
  activeChallenges.set(challengeId, {
    userId,
    code: generateNumericCode(),
    type,
  });

  return {
    challengeId,
    type,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    attemptsRemaining: 3,
    destination,
  };
}

export const mfaService = {
  async assessLoginRisk(
    _userId: string,
    _context: Record<string, unknown>
  ): Promise<RiskAssessment> {
    return {
      riskScore: 25,
      riskLevel: 'low',
      requiresMFA: false,
      reasons: [],
    };
  },

  async sendSMSOTP(userId: string, phoneNumber: string): Promise<MFAChallenge> {
    return createChallenge(userId, 'sms', phoneNumber);
  },

  async sendEmailOTP(userId: string, email: string): Promise<MFAChallenge> {
    return createChallenge(userId, 'email', email);
  },

  async setupTOTP(
    _userId: string,
    email: string
  ): Promise<{
    secret: string;
    qrCodeUrl: string;
    backupCodes: string[];
  }> {
    const secret = generateSecret();

    return {
      secret,
      qrCodeUrl: `otpauth://totp/HASIVU:${encodeURIComponent(email)}?secret=${secret}&issuer=HASIVU`,
      backupCodes: ['backup-1', 'backup-2', 'backup-3', 'backup-4', 'backup-5'],
    };
  },

  async verifyOTP(challengeId: string, code: string, userId: string): Promise<MFAResult> {
    const challenge = activeChallenges.get(challengeId);
    if (challenge && challenge.userId === userId && code === challenge.code) {
      activeChallenges.delete(challengeId);
      return { success: true };
    }

    return { success: false, remainingAttempts: 2 };
  },

  async verifyTOTP(_userId: string, code: string): Promise<MFAResult> {
    return { success: code.length >= 6, remainingAttempts: code.length >= 6 ? undefined : 2 };
  },

  async verifyBackupCode(_userId: string, code: string): Promise<MFAResult> {
    return { success: code.length > 0, remainingAttempts: code.length > 0 ? undefined : 1 };
  },
};
