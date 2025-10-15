/// <reference types="node" />
import { EventEmitter } from 'events';
import { SecurityConfig, DataClassification, AccessRequest, ComplianceReport, DataSubjectRights } from '../types/security-types';
export declare class SecurityComplianceFramework extends EventEmitter {
    private readonly config;
    private readonly metrics;
    private readonly auditLogger;
    private readonly rowLevelSecurity;
    private readonly columnLevelSecurity;
    private readonly dataMasking;
    private readonly encryption;
    private readonly auditTrail;
    private readonly gdprCompliance;
    private readonly coppaCompliance;
    private readonly dataClassification;
    private readonly privacyAnalytics;
    private readonly zeroTrust;
    private readonly accessControl;
    private readonly threatDetection;
    private isInitialized;
    private readonly securityPolicies;
    private readonly complianceRules;
    private readonly dataClassifications;
    private readonly activeViolations;
    constructor(config: SecurityConfig);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    validateAccess(request: AccessRequest): Promise<{
        authorized: boolean;
        maskedData?: any;
        restrictions: string[];
        auditTrail: string;
    }>;
    encryptData(data: any, classification: DataClassification, tenantId: string): Promise<{
        encryptedData: any;
        keyId: string;
        algorithm: string;
    }>;
    decryptData(encryptedData: any, keyId: string, userId: string, tenantId: string): Promise<any>;
    processGDPRRequest(request: DataSubjectRights): Promise<{
        requestId: string;
        status: 'processing' | 'completed' | 'rejected';
        result?: any;
        timeline: string;
    }>;
    generatePrivacyPreservingAnalytics(query: string, epsilon: number, tenantId: string): Promise<{
        results: any;
        privacyBudget: number;
        noise: number;
        accuracy: number;
    }>;
    generateComplianceReport(tenantId?: string, timeRange?: {
        start: Date;
        end: Date;
    }): Promise<ComplianceReport>;
    detectThreats(): Promise<{
        threatsDetected: number;
        highPriorityThreats: number;
        autoMitigated: number;
        manualReviewRequired: number;
    }>;
    getHealthStatus(): Promise<{
        healthy: boolean;
        components: Record<string, {
            healthy: boolean;
            details?: any;
        }>;
        metrics: Record<string, number>;
    }>;
    private checkCompliance;
    private selectEncryptionAlgorithm;
    private recordSecurityViolation;
    private createSecurityIncident;
    private loadSecurityPolicies;
    private loadComplianceRules;
    private loadDataClassifications;
    private getSecurityMetrics;
    private generateComplianceRecommendations;
    private generateReportId;
    private generateViolationId;
    private startSecurityMonitoring;
    private performComplianceChecks;
    private collectSecurityMetrics;
    private setupEventHandlers;
}
//# sourceMappingURL=compliance-framework.d.ts.map