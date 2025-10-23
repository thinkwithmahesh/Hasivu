#!/usr/bin/env ts-node
declare class ProductionReadinessChecker {
    private results;
    runAllChecks(): Promise<void>;
    private checkEnvironmentVariables;
    private checkSecurityConfiguration;
    private checkDatabaseConfiguration;
    private checkExternalServices;
    private checkDependencies;
    private checkPerformanceConfiguration;
    private printReport;
    private getCategoryIcon;
    private getStatusIcon;
    private capitalize;
}
export default ProductionReadinessChecker;
//# sourceMappingURL=production-readiness-check.d.ts.map