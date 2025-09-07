export interface E2ETestConfig {
    baseUrl: string;
    timeout: number;
    retries: number;
    apiKey?: string;
    authToken?: string;
    testDatabase: {
        host: string;
        port: number;
        database: string;
        username: string;
        password: string;
    };
    testUser: {
        email: string;
        password: string;
    };
    enableScreenshots: boolean;
    headless: boolean;
    browserViewport: {
        width: number;
        height: number;
    };
}
export interface E2ETestStep {
    name: string;
    action: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'NAVIGATE' | 'CLICK' | 'INPUT' | 'WAIT' | 'VERIFY';
    target?: string;
    data?: any;
    expectedStatus?: number;
    expectedResponse?: any;
    timeout?: number;
    retries?: number;
    selector?: string;
    value?: string;
    waitFor?: string;
    assertion?: (response: any) => boolean;
    setup?: () => Promise<void>;
    cleanup?: () => Promise<void>;
}
export interface E2ETestScenario {
    name: string;
    description: string;
    category: 'authentication' | 'menu-management' | 'payment-processing' | 'user-journey' | 'admin-workflow' | 'integration' | 'performance';
    priority: 'high' | 'medium' | 'low';
    tags: string[];
    prerequisites?: string[];
    steps: E2ETestStep[];
    expectedDuration: number;
    setup?: () => Promise<void>;
    cleanup?: () => Promise<void>;
    retryOnFailure: boolean;
    skipOnEnvironment?: string[];
}
export interface E2ETestResult {
    scenarioName: string;
    category: string;
    status: 'passed' | 'failed' | 'skipped' | 'error';
    duration: number;
    steps: E2EStepResult[];
    error?: string;
    timestamp: number;
    environment: string;
    retryCount: number;
    screenshots?: string[];
    performanceMetrics?: {
        loadTime: number;
        responseTime: number;
        memoryUsage: number;
        cpuUsage: number;
    };
}
export interface E2EStepResult {
    stepName: string;
    status: 'passed' | 'failed' | 'skipped' | 'error';
    duration: number;
    response?: any;
    error?: string;
    screenshot?: string;
    timestamp: number;
    retryCount: number;
}
export interface E2ETestStatistics {
    totalScenarios: number;
    passedScenarios: number;
    failedScenarios: number;
    skippedScenarios: number;
    totalSteps: number;
    passedSteps: number;
    failedSteps: number;
    totalDuration: number;
    averageDuration: number;
    successRate: number;
    coverage: {
        endpoints: number;
        userFlows: number;
        features: number;
    };
}
export declare class E2ETestSuite {
    private static instance;
    private httpClient;
    private testConfig;
    private testResults;
    private currentAuthToken?;
    private testStartTime;
    private constructor();
    static getInstance(config?: E2ETestConfig): E2ETestSuite;
    private initializeHttpClient;
    runTestScenario(scenario: E2ETestScenario): Promise<E2ETestResult>;
    private executeTestStep;
    runTestSuite(scenarios: E2ETestScenario[]): Promise<E2ETestResult[]>;
    runTestSuiteParallel(scenarios: E2ETestScenario[], concurrency?: number): Promise<E2ETestResult[]>;
    generateStatistics(): E2ETestStatistics;
    private calculateEndpointCoverage;
    private calculateUserFlowCoverage;
    private calculateFeatureCoverage;
    exportResults(format?: 'json' | 'html' | 'junit'): string;
    private generateHtmlReport;
    private generateJunitReport;
    setAuthToken(token: string): void;
    clearAuthToken(): void;
    getResults(): E2ETestResult[];
    clearResults(): void;
    healthCheck(): Promise<{
        status: 'healthy' | 'unhealthy';
        timestamp: number;
        checks: {
            apiConnectivity: boolean;
            databaseConnectivity: boolean;
            authService: boolean;
            testConfiguration: boolean;
        };
        error?: string;
    }>;
}
export declare class E2EScenarioBuilder {
    private scenario;
    name(name: string): E2EScenarioBuilder;
    description(description: string): E2EScenarioBuilder;
    category(category: E2ETestScenario['category']): E2EScenarioBuilder;
    priority(priority: E2ETestScenario['priority']): E2EScenarioBuilder;
    tags(tags: string[]): E2EScenarioBuilder;
    expectedDuration(duration: number): E2EScenarioBuilder;
    addStep(step: E2ETestStep): E2EScenarioBuilder;
    addApiCall(name: string, method: E2ETestStep['action'], endpoint: string, data?: any, expectedStatus?: number): E2EScenarioBuilder;
    addNavigation(name: string, url: string): E2EScenarioBuilder;
    addClick(name: string, selector: string): E2EScenarioBuilder;
    addInput(name: string, selector: string, value: string): E2EScenarioBuilder;
    addWait(name: string, duration: number): E2EScenarioBuilder;
    setup(setupFn: () => Promise<void>): E2EScenarioBuilder;
    cleanup(cleanupFn: () => Promise<void>): E2EScenarioBuilder;
    retryOnFailure(retry?: boolean): E2EScenarioBuilder;
    skipOnEnvironment(environments: string[]): E2EScenarioBuilder;
    build(): E2ETestScenario;
}
export declare const defaultE2EConfig: E2ETestConfig;
export declare const e2eTestSuite: E2ETestSuite;
//# sourceMappingURL=e2e-test-suite.d.ts.map