#!/usr/bin/env ts-node

/**
 * HASIVU Platform - Database Performance Analyzer Script
 * Standalone script to analyze database performance and generate recommendations
 */

import { databasePerformanceService } from '../src/services/database-performance.service';
import * as fs from 'fs/promises';

async function main() {
  console.log('🗄️ HASIVU Database Performance Analyzer');
  console.log('=======================================');

  try {
    console.log('📊 Collecting database performance metrics...');
    const metrics = await databasePerformanceService.getPerformanceMetrics();
    
    console.log('💡 Generating optimization recommendations...');
    const recommendations = await databasePerformanceService.getOptimizationRecommendations();
    
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
    
    // Save results
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
    
    // Exit code based on status
    if (metrics.status === 'unhealthy') {
      process.exit(2);
    } else if (metrics.status === 'degraded') {
      process.exit(1);
    } else {
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ Database performance analysis failed:', error);
    process.exit(3);
  }
}

if (require.main === module) {
  main();
}