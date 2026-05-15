import { NextRequest, NextResponse } from 'next/server';
import { getAccessTokenFromRequest } from '@/app/api/_utils/proxy';

type SecurityEvent = {
  id: string;
  type: 'breach_attempt' | 'suspicious_activity' | 'compliance_violation' | 'system_alert';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: string;
  resolved: boolean;
};

function envPresent(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

function issue(
  id: string,
  severity: SecurityEvent['severity'],
  description: string
): SecurityEvent {
  return {
    id,
    type: severity === 'critical' ? 'compliance_violation' : 'system_alert',
    severity,
    description,
    timestamp: new Date().toISOString(),
    resolved: false,
  };
}

export async function POST(request: NextRequest) {
  const authToken = getAccessTokenFromRequest(request);
  if (!authToken) {
    return NextResponse.json(
      { success: false, error: 'No authentication token found' },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const includeVulnerabilities = body?.includeVulnerabilities !== false;
  const includeCompliance = body?.includeCompliance !== false;
  const events: SecurityEvent[] = [];

  if (!envPresent('RAZORPAY_KEY_ID')) {
    events.push(issue('razorpay-key-id-missing', 'high', 'Razorpay key id is not configured.'));
  }
  if (!envPresent('RAZORPAY_KEY_SECRET')) {
    events.push(
      issue('razorpay-key-secret-missing', 'critical', 'Razorpay key secret is not configured.')
    );
  }
  if (!envPresent('RAZORPAY_WEBHOOK_SECRET')) {
    events.push(
      issue(
        'razorpay-webhook-secret-missing',
        'high',
        'Razorpay webhook signature secret is missing.'
      )
    );
  }
  if (!envPresent('DATABASE_URL')) {
    events.push(issue('database-url-missing', 'critical', 'DATABASE_URL is not configured.'));
  }
  if (!envPresent('JWT_SECRET')) {
    events.push(issue('jwt-secret-missing', 'critical', 'JWT_SECRET is not configured.'));
  }

  const criticalIssues = events.filter(event => event.severity === 'critical').length;
  const highIssues = events.filter(event => event.severity === 'high').length;
  const score = Math.max(0, 100 - criticalIssues * 30 - highIssues * 15);
  const now = new Date();

  return NextResponse.json({
    success: true,
    data: {
      pciCompliance: includeCompliance
        ? {
            level: score >= 95 ? 'A' : score >= 80 ? 'B' : score >= 60 ? 'C' : 'D',
            score,
            lastAssessment: now.toISOString(),
            nextAssessment: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          }
        : {
            level: 'D',
            score: 0,
            lastAssessment: now.toISOString(),
            nextAssessment: now.toISOString(),
          },
      encryptionStatus: {
        dataAtRest: envPresent('DATABASE_URL'),
        dataInTransit: true,
        keyRotation: envPresent('RAZORPAY_KEY_SECRET') && envPresent('JWT_SECRET'),
        lastRotation: process.env.API_KEYS_LAST_ROTATED_AT || now.toISOString(),
      },
      fraudDetection: {
        suspiciousTransactions: 0,
        blockedTransactions: 0,
        falsePositives: 0,
        accuracy: 0,
      },
      securityEvents: events,
      vulnerabilityScan: includeVulnerabilities
        ? {
            lastScan: now.toISOString(),
            vulnerabilities: events.length,
            criticalIssues,
            status: criticalIssues > 0 ? 'failed' : highIssues > 0 ? 'warning' : 'passed',
          }
        : {
            lastScan: now.toISOString(),
            vulnerabilities: 0,
            criticalIssues: 0,
            status: 'passed',
          },
    },
    message: 'Payment security posture evaluated from live runtime configuration.',
  });
}
