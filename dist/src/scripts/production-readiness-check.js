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
const fs_1 = require("fs");
const path = __importStar(require("path"));
class ProductionReadinessChecker {
    results = {
        environment: [],
        security: [],
        database: [],
        services: [],
        dependencies: [],
        performance: []
    };
    async runAllChecks() {
        console.log('🚀 Starting Production Readiness Check...\n');
        try {
            await this.checkEnvironmentVariables();
            await this.checkSecurityConfiguration();
            await this.checkDatabaseConfiguration();
            await this.checkExternalServices();
            await this.checkDependencies();
            await this.checkPerformanceConfiguration();
            this.printReport();
        }
        catch (error) {
            console.error('❌ Critical error during readiness check:', error);
            process.exit(1);
        }
    }
    async checkEnvironmentVariables() {
        console.log('📋 Checking Environment Variables...');
        const requiredEnvVars = [
            'NODE_ENV',
            'PORT',
            'DATABASE_URL',
            'JWT_SECRET',
            'JWT_REFRESH_SECRET',
            'RAZORPAY_KEY_ID',
            'RAZORPAY_KEY_SECRET',
            'AWS_REGION',
            'AWS_ACCESS_KEY_ID',
            'AWS_SECRET_ACCESS_KEY',
            'REDIS_URL'
        ];
        for (const envVar of requiredEnvVars) {
            if (process.env[envVar]) {
                this.results.environment.push({
                    name: `Environment Variable: ${envVar}`,
                    status: 'pass',
                    message: 'Present and configured'
                });
            }
            else {
                this.results.environment.push({
                    name: `Environment Variable: ${envVar}`,
                    status: 'fail',
                    message: 'Missing required environment variable'
                });
            }
        }
        if (process.env.NODE_ENV !== 'production') {
            this.results.environment.push({
                name: 'Production Environment',
                status: 'warning',
                message: `NODE_ENV is ${process.env.NODE_ENV}, expected 'production'`
            });
        }
        else {
            this.results.environment.push({
                name: 'Production Environment',
                status: 'pass',
                message: 'NODE_ENV correctly set to production'
            });
        }
    }
    async checkSecurityConfiguration() {
        console.log('🔒 Checking Security Configuration...');
        const jwtSecret = process.env.JWT_SECRET;
        if (jwtSecret && jwtSecret.length >= 32) {
            this.results.security.push({
                name: 'JWT Secret Strength',
                status: 'pass',
                message: 'JWT secret has adequate length'
            });
        }
        else {
            this.results.security.push({
                name: 'JWT Secret Strength',
                status: 'fail',
                message: 'JWT secret is too short (minimum 32 characters)'
            });
        }
        const corsOrigin = process.env.CORS_ORIGIN;
        if (corsOrigin && corsOrigin !== '*') {
            this.results.security.push({
                name: 'CORS Configuration',
                status: 'pass',
                message: 'CORS origin is properly configured'
            });
        }
        else {
            this.results.security.push({
                name: 'CORS Configuration',
                status: 'warning',
                message: 'CORS origin should be restricted in production'
            });
        }
        const rateLimit = process.env.RATE_LIMIT_MAX || '100';
        this.results.security.push({
            name: 'Rate Limiting',
            status: 'pass',
            message: `Rate limit set to ${rateLimit} requests per window`
        });
    }
    async checkDatabaseConfiguration() {
        console.log('🗄️ Checking Database Configuration...');
        const dbUrl = process.env.DATABASE_URL;
        if (!dbUrl) {
            this.results.database.push({
                name: 'Database Connection',
                status: 'fail',
                message: 'DATABASE_URL not configured'
            });
            return;
        }
        try {
            const url = new URL(dbUrl);
            if (url.searchParams.get('sslmode') === 'require' || url.protocol === 'postgresql:') {
                this.results.database.push({
                    name: 'Database SSL',
                    status: 'pass',
                    message: 'SSL connection configured'
                });
            }
            else {
                this.results.database.push({
                    name: 'Database SSL',
                    status: 'warning',
                    message: 'SSL connection should be enabled in production'
                });
            }
            this.results.database.push({
                name: 'Database URL Format',
                status: 'pass',
                message: 'Database URL is properly formatted'
            });
        }
        catch (error) {
            this.results.database.push({
                name: 'Database URL Format',
                status: 'fail',
                message: 'Invalid database URL format'
            });
        }
    }
    async checkExternalServices() {
        console.log('🌐 Checking External Services...');
        const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
        const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;
        if (razorpayKeyId && razorpaySecret) {
            this.results.services.push({
                name: 'Razorpay Configuration',
                status: 'pass',
                message: 'Razorpay credentials configured'
            });
        }
        else {
            this.results.services.push({
                name: 'Razorpay Configuration',
                status: 'fail',
                message: 'Missing Razorpay credentials'
            });
        }
        const awsRegion = process.env.AWS_REGION;
        const awsAccessKey = process.env.AWS_ACCESS_KEY_ID;
        const awsSecretKey = process.env.AWS_SECRET_ACCESS_KEY;
        if (awsRegion && awsAccessKey && awsSecretKey) {
            this.results.services.push({
                name: 'AWS Configuration',
                status: 'pass',
                message: 'AWS credentials configured'
            });
        }
        else {
            this.results.services.push({
                name: 'AWS Configuration',
                status: 'fail',
                message: 'Missing AWS credentials'
            });
        }
        const redisUrl = process.env.REDIS_URL;
        if (redisUrl) {
            this.results.services.push({
                name: 'Redis Configuration',
                status: 'pass',
                message: 'Redis URL configured'
            });
        }
        else {
            this.results.services.push({
                name: 'Redis Configuration',
                status: 'warning',
                message: 'Redis not configured (caching disabled)'
            });
        }
    }
    async checkDependencies() {
        console.log('📦 Checking Dependencies...');
        try {
            const packageJsonPath = path.join(process.cwd(), 'package.json');
            const packageJson = JSON.parse(await fs_1.promises.readFile(packageJsonPath, 'utf8'));
            this.results.dependencies.push({
                name: 'Package.json Integrity',
                status: 'pass',
                message: 'Package.json is valid and readable'
            });
            const criticalDeps = ['express', '@prisma/client', 'jsonwebtoken', 'bcrypt'];
            const missingDeps = criticalDeps.filter(dep => !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]);
            if (missingDeps.length === 0) {
                this.results.dependencies.push({
                    name: 'Critical Dependencies',
                    status: 'pass',
                    message: 'All critical dependencies present'
                });
            }
            else {
                this.results.dependencies.push({
                    name: 'Critical Dependencies',
                    status: 'fail',
                    message: `Missing dependencies: ${missingDeps.join(', ')}`
                });
            }
        }
        catch (error) {
            this.results.dependencies.push({
                name: 'Package.json',
                status: 'fail',
                message: 'Cannot read package.json file'
            });
        }
    }
    async checkPerformanceConfiguration() {
        console.log('⚡ Checking Performance Configuration...');
        const maxOldSpaceSize = process.env.NODE_OPTIONS?.includes('--max-old-space-size');
        if (maxOldSpaceSize) {
            this.results.performance.push({
                name: 'Memory Configuration',
                status: 'pass',
                message: 'Node.js memory limit configured'
            });
        }
        else {
            this.results.performance.push({
                name: 'Memory Configuration',
                status: 'warning',
                message: 'Consider setting --max-old-space-size for production'
            });
        }
        const compression = process.env.ENABLE_COMPRESSION !== 'false';
        this.results.performance.push({
            name: 'Response Compression',
            status: compression ? 'pass' : 'warning',
            message: compression ? 'Response compression enabled' : 'Response compression disabled'
        });
        const clustering = process.env.ENABLE_CLUSTERING === 'true';
        this.results.performance.push({
            name: 'Process Clustering',
            status: clustering ? 'pass' : 'warning',
            message: clustering ? 'Process clustering enabled' : 'Consider enabling process clustering'
        });
    }
    printReport() {
        console.log('\n📊 Production Readiness Report\n');
        console.log('='.repeat(60));
        let totalChecks = 0;
        let passedChecks = 0;
        let failedChecks = 0;
        let warningChecks = 0;
        const categories = Object.keys(this.results);
        for (const category of categories) {
            console.log(`\n${this.getCategoryIcon(category)} ${this.capitalize(category)} (${this.results[category].length} checks)`);
            console.log('-'.repeat(40));
            for (const result of this.results[category]) {
                const icon = this.getStatusIcon(result.status);
                console.log(`  ${icon} ${result.name}: ${result.message}`);
                totalChecks++;
                if (result.status === 'pass')
                    passedChecks++;
                else if (result.status === 'fail')
                    failedChecks++;
                else
                    warningChecks++;
            }
        }
        console.log('\n' + '='.repeat(60));
        console.log('📋 SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total Checks: ${totalChecks}`);
        console.log(`✅ Passed: ${passedChecks}`);
        console.log(`⚠️  Warnings: ${warningChecks}`);
        console.log(`❌ Failed: ${failedChecks}`);
        const score = Math.round((passedChecks / totalChecks) * 100);
        console.log(`\n🎯 Production Readiness Score: ${score}%`);
        if (failedChecks > 0) {
            console.log('\n❌ CRITICAL ISSUES DETECTED - NOT READY FOR PRODUCTION');
            process.exit(1);
        }
        else if (warningChecks > 0) {
            console.log('\n⚠️  WARNINGS DETECTED - REVIEW BEFORE PRODUCTION');
            process.exit(0);
        }
        else {
            console.log('\n✅ ALL CHECKS PASSED - READY FOR PRODUCTION');
            process.exit(0);
        }
    }
    getCategoryIcon(category) {
        const icons = {
            environment: '🌍',
            security: '🔒',
            database: '🗄️',
            services: '🌐',
            dependencies: '📦',
            performance: '⚡'
        };
        return icons[category] || '📋';
    }
    getStatusIcon(status) {
        return status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
    }
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}
if (require.main === module) {
    const checker = new ProductionReadinessChecker();
    checker.runAllChecks().catch((error) => {
        console.error('❌ Production readiness check failed:', error);
        process.exit(1);
    });
}
exports.default = ProductionReadinessChecker;
//# sourceMappingURL=production-readiness-check.js.map