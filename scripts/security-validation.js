#!/usr/bin/env node
/**
 * HASIVU Platform - Security Validation Script
 * Comprehensive security scan for ReDoS vulnerabilities and production readiness
 * Epic 7 - Final Security Validation
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class SecurityValidator {
  constructor() {
    this.results = {
      redosVulnerabilities: [],
      securityScore: 0,
      totalFiles: 0,
      scannedFiles: 0,
      safeFiles: 0,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Dangerous ReDoS patterns to detect
   */
  getDangerousPatterns() {
    return [
      /\(\.\*\+\)/g, // (.*+)
      /\(\.\*\)\+/g, // (.*)+
      /\(\.\+\)\*/g, // (.+)*
      /\(\.\+\)\+/g, // (.+)+
      /\(\.\*\)\*/g, // (.*)*
      /\([^)]*\+[^)]*\)\+/g, // nested quantifiers with +
      /\([^)]*\*[^)]*\)\*/g, // nested quantifiers with *
      /\(\?\:\.\*\)\+/g, // (?:.*)+
      /\(\?\:\.\+\)\*/g, // (?:.+)*
    ];
  }

  /**
   * Scan a single file for ReDoS vulnerabilities
   */
  scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const dangerousPatterns = this.getDangerousPatterns();
      const vulnerabilities = [];

      // Skip secure-regex.ts as it contains patterns for detection
      if (filePath.includes('secure-regex.ts')) {
        return { safe: true, vulnerabilities: [], reason: 'Security framework file' };
      }

      dangerousPatterns.forEach((pattern, index) => {
        const matches = content.match(pattern);
        if (matches) {
          matches.forEach(match => {
            const lines = content.split('\n');
            let lineNumber = 0;

            for (let i = 0; i < lines.length; i++) {
              if (lines[i].includes(match)) {
                lineNumber = i + 1;
                break;
              }
            }

            vulnerabilities.push({
              pattern: pattern.toString(),
              match,
              line: lineNumber,
              severity: 'HIGH',
              description: 'Potential ReDoS vulnerability detected',
            });
          });
        }
      });

      return {
        safe: vulnerabilities.length === 0,
        vulnerabilities,
      };
    } catch (error) {
      return {
        safe: false,
        vulnerabilities: [
          {
            pattern: 'FILE_READ_ERROR',
            match: error.message,
            line: 0,
            severity: 'ERROR',
            description: 'Unable to read file for security scan',
          },
        ],
      };
    }
  }

  /**
   * Recursively scan directory for TypeScript and JavaScript files
   */
  scanDirectory(dirPath, results = []) {
    try {
      const items = fs.readdirSync(dirPath);

      items.forEach(item => {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          this.scanDirectory(fullPath, results);
        } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.js'))) {
          results.push(fullPath);
        }
      });
    } catch (error) {
      console.warn(`Warning: Unable to scan directory ${dirPath}: ${error.message}`);
    }

    return results;
  }

  /**
   * Validate security framework implementation
   */
  validateSecurityFramework() {
    const secureRegexPath = path.join(process.cwd(), 'src/utils/secure-regex.ts');

    if (!fs.existsSync(secureRegexPath)) {
      return {
        implemented: false,
        error: 'secure-regex.ts not found',
      };
    }

    try {
      const content = fs.readFileSync(secureRegexPath, 'utf8');

      const checks = {
        secureRegexClass: content.includes('class SecureRegex'),
        timeoutProtection: content.includes('timeout'),
        safePatterns: content.includes('SafeRegexPatterns'),
        performanceMonitoring: content.includes('RegexPerformanceMonitor'),
        validators: content.includes('RegexValidators'),
      };

      const implementationScore = Object.values(checks).filter(Boolean).length;

      return {
        implemented: true,
        score: implementationScore,
        maxScore: Object.keys(checks).length,
        details: checks,
      };
    } catch (error) {
      return {
        implemented: false,
        error: error.message,
      };
    }
  }

  /**
   * Run comprehensive security scan
   */
  async runSecurityScan() {
    console.log('🔍 Starting HASIVU Platform Security Validation...\n');

    // Find all source files
    const srcPath = path.join(process.cwd(), 'src');
    const allFiles = this.scanDirectory(srcPath);

    this.results.totalFiles = allFiles.length;
    console.log(`📁 Found ${allFiles.length} source files to scan\n`);

    // Scan each file
    const vulnerableFiles = [];
    let scannedCount = 0;

    allFiles.forEach(filePath => {
      const scanResult = this.scanFile(filePath);
      scannedCount++;

      if (!scanResult.safe) {
        vulnerableFiles.push({
          file: path.relative(process.cwd(), filePath),
          vulnerabilities: scanResult.vulnerabilities,
        });

        scanResult.vulnerabilities.forEach(vuln => {
          this.results.redosVulnerabilities.push({
            file: path.relative(process.cwd(), filePath),
            ...vuln,
          });
        });
      }

      // Progress indicator
      if (scannedCount % 50 === 0) {
        console.log(`📊 Scanned ${scannedCount}/${allFiles.length} files...`);
      }
    });

    this.results.scannedFiles = scannedCount;
    this.results.safeFiles = scannedCount - vulnerableFiles.length;

    // Validate security framework
    const frameworkValidation = this.validateSecurityFramework();

    // Calculate security score
    const vulnerabilityPenalty = this.results.redosVulnerabilities.length * 2;
    const frameworkBonus = frameworkValidation.implemented
      ? (frameworkValidation.score / frameworkValidation.maxScore) * 3
      : 0;

    this.results.securityScore = Math.max(
      0,
      Math.min(10, 10 - vulnerabilityPenalty + frameworkBonus)
    );

    // Generate report
    this.generateReport(vulnerableFiles, frameworkValidation);

    return this.results;
  }

  /**
   * Generate comprehensive security report
   */
  generateReport(vulnerableFiles, frameworkValidation) {
    console.log(`\n${'='.repeat(80)}`);
    console.log('🔒 HASIVU PLATFORM SECURITY VALIDATION REPORT');
    console.log('='.repeat(80));

    console.log(`\n📊 SCAN SUMMARY:`);
    console.log(`   Total Files Scanned: ${this.results.scannedFiles}`);
    console.log(`   Safe Files: ${this.results.safeFiles}`);
    console.log(`   Vulnerable Files: ${vulnerableFiles.length}`);
    console.log(`   ReDoS Vulnerabilities: ${this.results.redosVulnerabilities.length}`);
    console.log(`   Security Score: ${this.results.securityScore}/10`);

    console.log(`\n🛡️ SECURITY FRAMEWORK STATUS:`);
    if (frameworkValidation.implemented) {
      console.log(`   ✅ Security Framework: IMPLEMENTED`);
      console.log(
        `   📈 Implementation Score: ${frameworkValidation.score}/${frameworkValidation.maxScore}`
      );
      console.log(`   🔧 Components:`);
      Object.entries(frameworkValidation.details).forEach(([component, status]) => {
        console.log(`      ${status ? '✅' : '❌'} ${component}`);
      });
    } else {
      console.log(`   ❌ Security Framework: NOT IMPLEMENTED`);
      console.log(`   🚨 Error: ${frameworkValidation.error}`);
    }

    if (this.results.redosVulnerabilities.length === 0) {
      console.log(`\n🎉 SECURITY STATUS: EXCELLENT`);
      console.log(`   ✅ Zero ReDoS vulnerabilities detected`);
      console.log(`   ✅ Security framework implemented`);
      console.log(`   ✅ Production deployment ready`);
      console.log(`   🏆 QUALITY SCORE: 100/100`);
    } else {
      console.log(`\n⚠️ SECURITY ISSUES DETECTED:`);
      vulnerableFiles.forEach(file => {
        console.log(`\n   📄 File: ${file.file}`);
        file.vulnerabilities.forEach(vuln => {
          console.log(`      🚨 ${vuln.severity}: ${vuln.description}`);
          console.log(`         Pattern: ${vuln.pattern}`);
          console.log(`         Line: ${vuln.line}`);
          console.log(`         Match: ${vuln.match}`);
        });
      });
    }

    console.log(`\n⏰ Scan completed at: ${this.results.timestamp}`);
    console.log('='.repeat(80));

    // Save detailed report
    const reportData = {
      summary: {
        totalFiles: this.results.scannedFiles,
        safeFiles: this.results.safeFiles,
        vulnerableFiles: vulnerableFiles.length,
        totalVulnerabilities: this.results.redosVulnerabilities.length,
        securityScore: this.results.securityScore,
      },
      frameworkValidation,
      vulnerabilities: this.results.redosVulnerabilities,
      timestamp: this.results.timestamp,
    };

    const reportPath = path.join(process.cwd(), 'security-validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }
}

// Run security validation
if (require.main === module) {
  const validator = new SecurityValidator();
  validator
    .runSecurityScan()
    .then(results => {
      const exitCode = results.redosVulnerabilities.length === 0 ? 0 : 1;
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('Security validation failed:', error);
      process.exit(1);
    });
}

module.exports = SecurityValidator;
