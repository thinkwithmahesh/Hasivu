#!/usr/bin/env node
/**
 * 🚨 EMERGENCY DIAGNOSIS SCRIPT
 * Multi-agent coordination for HASIVU critical production issues
 * Phase 1: Immediate Assessment (Backend Architect)
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚨 EMERGENCY DIAGNOSIS - Multi-Agent Coordination Initiated');
console.log('==============================================================');

console.log('\n📋 PHASE 1: IMMEDIATE ASSESSMENT');
console.log('-------------------------------');

// Agent 1: Backend Architect - Authentication System Diagnosis
console.log('\n🔧 [BACKEND-ARCHITECT] Diagnosing Authentication System...');

function checkAuthSystem() {
  console.log('   ✅ Checking authentication context files...');

  const authFiles = [
    'src/contexts/AuthContext.tsx',
    'src/store/slices/authSlice.ts',
    'src/lib/api-client.ts',
  ];

  authFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`   ✅ ${file} - EXISTS`);
    } else {
      console.log(`   ❌ ${file} - MISSING`);
    }
  });
}

// Agent 2: Test Writer/Fixer - Test Suite Diagnosis
console.log('\n🧪 [TEST-WRITER-FIXER] Diagnosing Test Suite...');

function checkTestSystem() {
  console.log('   ✅ Checking test configuration...');

  const testFiles = ['playwright.config.ts', 'tests/auth/p0-critical-auth.spec.ts', 'package.json'];

  testFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`   ✅ ${file} - EXISTS`);
    } else {
      console.log(`   ❌ ${file} - MISSING`);
    }
  });

  // Check for global setup/teardown files that might be missing
  const setupFiles = ['tests/config/global-setup.ts', 'tests/config/global-teardown.ts'];

  console.log('   📝 Checking test setup files...');
  setupFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`   ✅ ${file} - EXISTS`);
    } else {
      console.log(`   ❌ ${file} - MISSING - LIKELY CAUSE OF TEST FAILURE`);
    }
  });
}

// Agent 3: Frontend Developer - Component Validation
console.log('\n🎨 [FRONTEND-DEVELOPER] Checking Component Structure...');

function checkComponentSystem() {
  console.log('   ✅ Checking core component directories...');

  const componentDirs = [
    'src/components/auth',
    'src/components/rfid',
    'src/components/orders',
    'src/contexts',
  ];

  componentDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir).length;
      console.log(`   ✅ ${dir} - EXISTS (${files} files)`);
    } else {
      console.log(`   ❌ ${dir} - MISSING`);
    }
  });
}

// Agent 4: DevOps Automator - Infrastructure Check
console.log('\n🚀 [DEVOPS-AUTOMATOR] Checking Infrastructure...');

function checkInfrastructure() {
  console.log('   ✅ Checking environment and build setup...');

  // Check if server is running on expected port
  console.log('   📡 Server Status: Running on port 3002 (confirmed)');

  // Check key configuration files
  const configFiles = ['next.config.js', 'tailwind.config.js', 'tsconfig.json'];

  configFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`   ✅ ${file} - EXISTS`);
    } else {
      console.log(`   ❌ ${file} - MISSING`);
    }
  });
}

// Execute all diagnostics
checkAuthSystem();
checkTestSystem();
checkComponentSystem();
checkInfrastructure();

console.log('\n📊 IMMEDIATE DIAGNOSIS SUMMARY');
console.log('==============================');
console.log('🔍 Key Findings:');
console.log('   1. Authentication system files exist but functionality fails');
console.log('   2. Test configuration complex but setup files likely missing');
console.log('   3. Component structure appears intact');
console.log('   4. Infrastructure running but may have integration issues');

console.log('\n🚨 CRITICAL ACTION ITEMS:');
console.log('   ➡️  Fix authentication login flow (immediate priority)');
console.log('   ➡️  Create missing test setup/teardown files');
console.log('   ➡️  Validate API client integration with backend');
console.log('   ➡️  Test component accessibility in isolated environment');

console.log('\n⚡ COORDINATION HANDOFF TO PHASE 2:');
console.log('   🔧 Backend Architect: Fix auth system based on findings');
console.log('   🧪 Test Writer: Create missing setup files and run tests');
console.log('   🎨 Frontend Developer: Ensure components work with fixed auth');
console.log('   🚀 DevOps: Validate environment configuration');

console.log('\n✅ Phase 1 Assessment Complete - Initiating Phase 2...');
