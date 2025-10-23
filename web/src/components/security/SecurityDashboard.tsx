/**
 * HASIVU Platform - Security Dashboard Component
 * Real-time security monitoring, threat analysis, and incident response
 * Enterprise security operations center interface
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Shield,
  AlertTriangle,
  Users,
  MapPin,
  Clock,
  Activity,
  Ban,
  Key,
  Eye,
  Zap,
  TrendingUp as TrendingUp,
  BarChart3,
  Globe,
} from 'lucide-react';
import { threatProtection } from '@/lib/security/threat-protection';
import { sessionManager } from '@/lib/security/session-manager';
import { mfaService as _mfaService } from '@/lib/security/mfa-service';
import { useEnhancedAuth } from '@/contexts/enhanced-auth-context';

interface SecurityMetrics {
  activeThreats: number;
  blockedIPs: number;
  lockedAccounts: number;
  activeSessions: number;
  mfaEnabled: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}

interface ThreatAlert {
  id: string;
  type: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  timestamp: Date;
  source: string;
  handled: boolean;
}

interface LoginAttempt {
  id: string;
  email: string;
  ipAddress: string;
  userAgent: string;
  country: string;
  city: string;
  success: boolean;
  riskScore: number;
  timestamp: Date;
  mfaUsed: boolean;
}

const SecurityDashboard: React.FC = () => {
  const { user, hasRole } = useEnhancedAuth();
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    activeThreats: 0,
    blockedIPs: 0,
    lockedAccounts: 0,
    activeSessions: 0,
    mfaEnabled: 0,
    riskDistribution: { low: 0, medium: 0, high: 0, critical: 0 },
  });

  const [alerts, setAlerts] = useState<ThreatAlert[]>([]);
  const [recentAttempts, setRecentAttempts] = useState<LoginAttempt[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Check if user has admin access
  const hasSecurityAccess = hasRole(['admin', 'school_admin']);

  useEffect(() => {
    if (hasSecurityAccess) {
      loadSecurityData();

      if (autoRefresh) {
        const interval = setInterval(loadSecurityData, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
      }
    }
  }, [hasSecurityAccess, selectedTimeframe, autoRefresh]);

  const loadSecurityData = async () => {
    try {
      // Load security metrics
      const dashboardData = threatProtection.getSecurityDashboard();
      const sessionStats = sessionManager.getSessionStats();

      setMetrics({
        activeThreats: dashboardData.activeThreats,
        blockedIPs: dashboardData.blockedIPs,
        lockedAccounts: dashboardData.lockedAccounts,
        activeSessions: sessionStats.totalActiveSessions,
        mfaEnabled: Math.floor(sessionStats.concurrentUsersCount * 0.3), // Demo calculation
        riskDistribution: dashboardData.riskDistribution,
      });

      // Load recent alerts
      setAlerts(generateMockAlerts());

      // Load recent login attempts
      setRecentAttempts(generateMockLoginAttempts());
    } catch (error) {
      // Error handled silently
    }
  };

  const generateMockAlerts = (): ThreatAlert[] => {
    return [
      {
        id: '1',
        type: 'critical',
        title: 'Multiple failed login attempts detected',
        description: 'IP 192.168.1.100 has attempted 15 failed logins in the last 5 minutes',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        source: 'Brute Force Detection',
        handled: false,
      },
      {
        id: '2',
        type: 'high',
        title: 'Suspicious geographic login',
        description: 'User attempted login from Russia while last seen in India',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        source: 'Geographic Anomaly',
        handled: false,
      },
      {
        id: '3',
        type: 'medium',
        title: 'Unusual user agent detected',
        description: 'Automated tool detected attempting to access API endpoints',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        source: 'Behavioral Analysis',
        handled: true,
      },
    ];
  };

  const generateMockLoginAttempts = (): LoginAttempt[] => {
    const attempts = [];
    const now = new Date();

    for (let i = 0; i < 20; i++) {
      attempts.push({
        id: `attempt_${i}`,
        email: `user${i}@hasivu.edu`,
        ipAddress: `192.168.1.${100 + i}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        country: ['IN', 'US', 'GB', 'AU'][Math.floor(Math.random() * 4)],
        city: ['Bangalore', 'Mumbai', 'Delhi', 'Chennai'][Math.floor(Math.random() * 4)],
        success: Math.random() > 0.3,
        riskScore: Math.floor(Math.random() * 100),
        timestamp: new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000),
        mfaUsed: Math.random() > 0.7,
      });
    }

    return attempts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  const handleBlockIP = async (ipAddress: string) => {
    try {
      await threatProtection.blockIP(
        ipAddress,
        'Manual block from security dashboard',
        24 * 60 * 60 * 1000, // 24 hours
        user?.id || 'admin'
      );

      // Refresh data
      await loadSecurityData();
    } catch (error) {
      // Error handled silently
    }
  };

  const _handleUnblockIP = async (ipAddress: string) => {
    try {
      await threatProtection.unblockIP(ipAddress, user?.id || 'admin');
      await loadSecurityData();
    } catch (error) {
      // Error handled silently
    }
  };

  const handleMarkAlertHandled = (alertId: string) => {
    setAlerts(prev =>
      prev.map(alert => (alert.id === alertId ? { ...alert, handled: true } : alert))
    );
  };

  const getRiskBadgeVariant = (
    riskScore: number
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (riskScore >= 80) return 'destructive';
    if (riskScore >= 60) return 'secondary';
    if (riskScore >= 30) return 'outline';
    return 'default';
  };

  const getAlertBadgeVariant = (
    type: string
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (type) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'secondary';
      case 'medium':
        return 'outline';
      default:
        return 'default';
    }
  };

  if (!hasSecurityAccess) {
    return (
      <div className="p-6">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access the security dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Security Dashboard</h1>
          <p className="text-muted-foreground">Real-time security monitoring and threat analysis</p>
        </div>

        <div className="flex items-center gap-4">
          <select
            value={selectedTimeframe}
            onChange={e => setSelectedTimeframe(e.target.value as any)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>

          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="flex items-center gap-2"
          >
            <Activity className="h-4 w-4" />
            Auto Refresh
          </Button>
        </div>
      </div>

      {/* Security Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Threats</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.activeThreats}</div>
            <p className="text-xs text-muted-foreground">Immediate attention required</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked IPs</CardTitle>
            <Ban className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{metrics.blockedIPs}</div>
            <p className="text-xs text-muted-foreground">Auto-blocked addresses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics.activeSessions}</div>
            <p className="text-xs text-muted-foreground">Current user sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MFA Enabled</CardTitle>
            <Key className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.mfaEnabled}</div>
            <p className="text-xs text-muted-foreground">Users with MFA active</p>
          </CardContent>
        </Card>
      </div>

      {/* Security Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Security Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alerts.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No active security alerts</p>
            ) : (
              alerts.map(alert => (
                <div
                  key={alert.id}
                  className={`p-4 border rounded-lg ${alert.handled ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={getAlertBadgeVariant(alert.type)}>
                          {alert.type.toUpperCase()}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{alert.source}</span>
                      </div>

                      <h3 className="font-medium mb-1">{alert.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {alert.timestamp.toLocaleString()}
                      </div>
                    </div>

                    {!alert.handled && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkAlertHandled(alert.id)}
                      >
                        Mark Handled
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Login Attempts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Recent Login Attempts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentAttempts.slice(0, 10).map(attempt => (
              <div
                key={attempt.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      attempt.success ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm truncate">{attempt.email}</span>
                      {attempt.mfaUsed && (
                        <Badge variant="outline" className="text-xs">
                          MFA
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {attempt.ipAddress}
                      </div>

                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {attempt.city}, {attempt.country}
                      </div>

                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {attempt.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={getRiskBadgeVariant(attempt.riskScore)}>
                    Risk: {attempt.riskScore}
                  </Badge>

                  {attempt.riskScore > 70 && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleBlockIP(attempt.ipAddress)}
                    >
                      Block IP
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Risk Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Risk Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {metrics.riskDistribution.low}
              </div>
              <p className="text-sm text-muted-foreground">Low Risk</p>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {metrics.riskDistribution.medium}
              </div>
              <p className="text-sm text-muted-foreground">Medium Risk</p>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {metrics.riskDistribution.high}
              </div>
              <p className="text-sm text-muted-foreground">High Risk</p>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {metrics.riskDistribution.critical}
              </div>
              <p className="text-sm text-muted-foreground">Critical Risk</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityDashboard;
