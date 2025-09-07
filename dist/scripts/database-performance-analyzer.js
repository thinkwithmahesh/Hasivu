#!/usr/bin/env ts-node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_performance_service_1 = require("../src/services/database-performance.service");
const fs = __importStar(require("fs/promises"));
async function main() {
    console.log('🗄️ HASIVU Database Performance Analyzer');
    console.log('=======================================');
    try {
        console.log('📊 Collecting database performance metrics...');
        const metrics = await database_performance_service_1.databasePerformanceService.getPerformanceMetrics();
        console.log('💡 Generating optimization recommendations...');
        const recommendations = await database_performance_service_1.databasePerformanceService.getOptimizationRecommendations();
        console.log('\n📈 PERFORMANCE METRICS:');
        console.log(`   Status: ${metrics.status}`);
        console.log(`   Average Query Time: ${metrics.performance.avgQueryTime.toFixed(2)}ms`);
        console.log(`   Connection Pool Usage: ${metrics.performance.connectionPoolUsage.toFixed(1)}%`);
        console.log(`   Index Efficiency: ${metrics.performance.indexEfficiency.toFixed(1)}%`);
        console.log(`   Queries per Second: ${metrics.performance.queriesPerSecond.toFixed(0)}`);
        if (metrics.slowQueries.length > 0) {
            console.log(`\n🐌 SLOW QUERIES (${metrics.slowQueries.length}):`);
            metrics.slowQueries.slice(0, 3).forEach((query, i) => {
                console.log(`   ${i + 1}. ${query.duration.toFixed(0)}ms - ${query.query.substring(0, 60)}...`);
            });
        }
        if (recommendations.length > 0) {
            console.log(`\n💡 OPTIMIZATION RECOMMENDATIONS (${recommendations.length}):`);
            recommendations.slice(0, 5).forEach((rec, i) => {
                console.log(`   ${i + 1}. [${rec.priority.toUpperCase()}] ${rec.issue}`);
                console.log(`      → ${rec.recommendation}`);
            });
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const resultsDir = './performance-analysis-results';
        await fs.mkdir(resultsDir, { recursive: true });
        const results = {
            timestamp: new Date().toISOString(),
            metrics,
            recommendations
        };
        const resultsPath = `${resultsDir}/database-performance-${timestamp}.json`;
        await fs.writeFile(resultsPath, JSON.stringify(results, null, 2));
        console.log(`\n📄 Results saved: ${resultsPath}`);
        console.log('✅ Database performance analysis completed!');
        if (metrics.status === 'unhealthy') {
            process.exit(2);
        }
        else if (metrics.status === 'degraded') {
            process.exit(1);
        }
        else {
            process.exit(0);
        }
    }
    catch (error) {
        console.error('❌ Database performance analysis failed:', error);
        process.exit(3);
    }
}
if (require.main === module) {
    main();
}
//# sourceMappingURL=database-performance-analyzer.js.map