export interface ThreatAnalysis {
  riskScore: number;
  indicators: string[];
  lastEvaluatedAt: Date;
}

interface ThreatAction {
  action: 'allow' | 'challenge' | 'block';
  reason?: string;
}

const blockedIps = new Set<string>();

export const threatProtection = {
  async analyzeLoginAttempt(attempt: {
    ipAddress: string;
    success: boolean;
    [key: string]: unknown;
  }): Promise<{ analysis: ThreatAnalysis; action: ThreatAction }> {
    const riskScore = blockedIps.has(attempt.ipAddress) ? 90 : attempt.success ? 10 : 35;
    const action: ThreatAction =
      riskScore >= 80
        ? { action: 'block', reason: 'IP blocked' }
        : riskScore >= 50
          ? { action: 'challenge' }
          : { action: 'allow' };

    return {
      analysis: {
        riskScore,
        indicators: blockedIps.has(attempt.ipAddress) ? ['blocked_ip'] : [],
        lastEvaluatedAt: new Date(),
      },
      action,
    };
  },

  async checkBruteForce(
    ipAddress: string,
    _userId?: string,
    _success?: boolean
  ): Promise<{ blocked: boolean; retryAfter?: number }> {
    return blockedIps.has(ipAddress) ? { blocked: true, retryAfter: 15 * 60 } : { blocked: false };
  },

  getSecurityDashboard(): {
    activeThreats: number;
    blockedIPs: number;
    lockedAccounts: number;
    riskDistribution: { low: number; medium: number; high: number; critical: number };
  } {
    return {
      activeThreats: blockedIps.size,
      blockedIPs: blockedIps.size,
      lockedAccounts: 0,
      riskDistribution: {
        low: 8,
        medium: 3,
        high: blockedIps.size,
        critical: 0,
      },
    };
  },

  async blockIP(
    ipAddress: string,
    _reason: string,
    _durationMs: number,
    _actorId: string
  ): Promise<void> {
    blockedIps.add(ipAddress);
  },

  async unblockIP(ipAddress: string, _actorId: string): Promise<void> {
    blockedIps.delete(ipAddress);
  },
};
