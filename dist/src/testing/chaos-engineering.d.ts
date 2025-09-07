/// <reference types="node" />
import { EventEmitter } from 'events';
export declare enum ChaosExperimentType {
    LATENCY_INJECTION = "latency_injection",
    ERROR_INJECTION = "error_injection",
    RESOURCE_EXHAUSTION = "resource_exhaustion",
    NETWORK_PARTITION = "network_partition",
    SERVICE_SHUTDOWN = "service_shutdown",
    DATABASE_FAILURE = "database_failure",
    MEMORY_LEAK = "memory_leak",
    CPU_SPIKE = "cpu_spike",
    DISK_FULL = "disk_full",
    TIMEOUT_INJECTION = "timeout_injection"
}
export declare enum ChaosSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare enum ChaosStatus {
    PENDING = "pending",
    RUNNING = "running",
    COMPLETED = "completed",
    FAILED = "failed",
    CANCELLED = "cancelled",
    PAUSED = "paused"
}
export interface ChaosTarget {
    type: 'service' | 'endpoint' | 'database' | 'network' | 'resource';
    identifier: string;
    tags?: Record<string, string>;
    environment: string;
    percentage?: number;
}
export interface ChaosExperimentConfig {
    id: string;
    name: string;
    description: string;
    type: ChaosExperimentType;
    severity: ChaosSeverity;
    targets: ChaosTarget[];
    parameters: Record<string, any>;
    duration: number;
    schedule?: ChaosSchedule;
    conditions?: ChaosCondition[];
    rollbackTriggers?: ChaosRollbackTrigger[];
    metrics?: ChaosMetric[];
    enabled: boolean;
    createdBy: string;
    createdAt: Date;
    lastRun?: Date;
}
export interface ChaosSchedule {
    type: 'once' | 'recurring' | 'cron';
    pattern?: string;
    startTime?: Date;
    endTime?: Date;
    interval?: number;
}
export interface ChaosCondition {
    type: 'metric' | 'time' | 'environment' | 'custom';
    operator: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'in' | 'not_in';
    value: any;
    metricName?: string;
    customCheck?: () => Promise<boolean>;
}
export interface ChaosRollbackTrigger {
    type: 'metric' | 'error_rate' | 'response_time' | 'custom';
    threshold: number;
    metricName?: string;
    timeWindow: number;
    customCheck?: () => Promise<boolean>;
}
export interface ChaosMetric {
    name: string;
    type: 'counter' | 'gauge' | 'histogram' | 'timer';
    labels?: Record<string, string>;
    collector: () => Promise<number>;
}
export interface ChaosExperimentResult {
    id: string;
    experimentId: string;
    status: ChaosStatus;
    startTime: Date;
    endTime?: Date;
    duration?: number;
    targetsAffected: number;
    metricsCollected: Record<string, any>;
    errors: ChaosError[];
    rollbackTriggered: boolean;
    rollbackReason?: string;
    observations: string[];
    impact: ChaosImpactAssessment;
}
export interface ChaosImpactAssessment {
    errorRate: number;
    responseTimeImpact: number;
    availabilityImpact: number;
    userExperienceImpact: 'none' | 'minimal' | 'moderate' | 'severe';
    recoveryTime: number;
    cascadeFailures: string[];
}
export interface ChaosError {
    type: string;
    message: string;
    timestamp: Date;
    target?: string;
    stack?: string;
}
export interface ChaosSafetyCheck {
    name: string;
    description: string;
    check: () => Promise<boolean>;
    severity: 'warning' | 'error' | 'critical';
    required: boolean;
}
export declare class ChaosEngineeringService extends EventEmitter {
    private static instance;
    private experiments;
    private runningExperiments;
    private safetyChecks;
    private isEnabled;
    private environment;
    private constructor();
    static getInstance(): ChaosEngineeringService;
    private initializeSafetyChecks;
    setEnabled(enabled: boolean, overrideProductionCheck?: boolean): void;
    registerExperiment(config: ChaosExperimentConfig): Promise<void>;
    executeExperiment(experimentId: string): Promise<ChaosExperimentResult>;
    private executeExperimentType;
    private executeLatencyInjection;
    private executeErrorInjection;
    private executeResourceExhaustion;
    private executeMemoryLeak;
    private executeCpuSpike;
    private validateExperimentConfig;
    private runSafetyChecks;
    private checkConditions;
    private evaluateCondition;
    private compareValues;
    private setupRollbackMonitoring;
    private checkRollbackTrigger;
    private cleanupExperiment;
    getExperimentStatus(experimentId: string): ChaosStatus | null;
    listExperiments(): ChaosExperimentConfig[];
    getExperimentResults(): ChaosExperimentResult[];
    stopExperiment(experimentId: string): Promise<void>;
    addSafetyCheck(safetyCheck: ChaosSafetyCheck): void;
}
export declare const chaosService: ChaosEngineeringService;
export declare class ChaosExperimentBuilder {
    static createLatencyExperiment(id: string, name: string, delay: number, percentage?: number, duration?: number): ChaosExperimentConfig;
    static createErrorExperiment(id: string, name: string, errorRate: number, errorType?: string, duration?: number): ChaosExperimentConfig;
    static createResourceExhaustionExperiment(id: string, name: string, resourceType: string, intensity: number, duration?: number): ChaosExperimentConfig;
}
declare const _default: {
    ChaosEngineeringService: typeof ChaosEngineeringService;
    ChaosExperimentBuilder: typeof ChaosExperimentBuilder;
    chaosService: ChaosEngineeringService;
    ChaosExperimentType: typeof ChaosExperimentType;
    ChaosSeverity: typeof ChaosSeverity;
    ChaosStatus: typeof ChaosStatus;
};
export default _default;
//# sourceMappingURL=chaos-engineering.d.ts.map