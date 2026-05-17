#!/usr/bin/env node

/**
 * HASIVU Platform - Test Data Setup Script
 * Creates authentication states and test data for enterprise Playwright testing
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 HASIVU Enterprise Test Setup - Initializing test data...');

// Create auth directory structure
const authDir = path.join(__dirname, '..', 'tests', 'auth', '.auth');
if (!fs.existsSync(authDir)) {
  fs.mkdirSync(authDir, { recursive: true });
  console.log('✅ Created authentication directory structure');
}

// Create test results directory
const testResultsDir = path.join(__dirname, '..', 'test-results');
if (!fs.existsSync(testResultsDir)) {
  fs.mkdirSync(testResultsDir, { recursive: true });
  console.log('✅ Created test results directory');
}

// Create screenshots directory
const screenshotsDir = path.join(testResultsDir, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
  console.log('✅ Created screenshots directory');
}

// Create visual regression directory
const visualDir = path.join(testResultsDir, 'visual');
if (!fs.existsSync(visualDir)) {
  fs.mkdirSync(visualDir, { recursive: true });
  console.log('✅ Created visual regression directory');
}

// Create performance reports directory
const performanceDir = path.join(testResultsDir, 'performance');
if (!fs.existsSync(performanceDir)) {
  fs.mkdirSync(performanceDir, { recursive: true });
  console.log('✅ Created performance reports directory');
}

// Create mock test data
const testData = {
  users: {
    student: {
      email: 'student@hasivu.test',
      password: 'Student123!',
      profile: {
        id: 'STU-001',
        name: 'Test Student',
        student_id: 'STU-12345',
        class: '10th Grade',
        school: 'HASIVU Test School',
        meal_balance: 150.0,
        dietary_preferences: ['vegetarian'],
        allergies: ['nuts'],
      },
    },
    parent: {
      email: 'parent@hasivu.test',
      password: 'Parent123!',
      profile: {
        id: 'PAR-001',
        name: 'Test Parent',
        children: [
          { id: 'STU-001', name: 'Child One', class: '8th Grade' },
          { id: 'STU-002', name: 'Child Two', class: '6th Grade' },
        ],
      },
    },
    admin: {
      email: 'admin@hasivu.test',
      password: 'Admin123!',
      profile: {
        id: 'ADM-001',
        name: 'Test Admin',
        permissions: ['user_management', 'system_config', 'reports', 'analytics'],
        school_id: 'SCH-001',
      },
    },
    kitchen: {
      email: 'kitchen@hasivu.test',
      password: 'Kitchen123!',
      profile: {
        id: 'KIT-001',
        name: 'Test Kitchen Staff',
        kitchen_id: 'KIT-MAIN',
        shift: 'morning',
        permissions: ['order_management', 'inventory_update'],
      },
    },
    vendor: {
      email: 'vendor@hasivu.test',
      password: 'Vendor123!',
      profile: {
        id: 'VEN-001',
        name: 'Test Vendor',
        company: 'HASIVU Food Supplies',
        vendor_id: 'VEN-FOOD-001',
        categories: ['vegetables', 'grains', 'dairy'],
      },
    },
  },
  menu: {
    items: [
      {
        id: 'item-1',
        name: 'Dal Rice',
        price: 25.0,
        category: 'main',
        image: '/images/dal-rice.jpg',
        description: 'Traditional dal with steamed rice',
        nutritional_info: {
          calories: 320,
          protein: 12,
          carbs: 58,
          fat: 4,
        },
        allergens: ['gluten'],
        dietary: ['vegetarian', 'vegan'],
      },
      {
        id: 'item-2',
        name: 'Sambar',
        price: 15.0,
        category: 'curry',
        image: '/images/sambar.jpg',
        description: 'South Indian lentil curry with vegetables',
        nutritional_info: {
          calories: 120,
          protein: 6,
          carbs: 18,
          fat: 3,
        },
        allergens: [],
        dietary: ['vegetarian', 'vegan', 'gluten-free'],
      },
      {
        id: 'item-3',
        name: 'Curd Rice',
        price: 20.0,
        category: 'main',
        image: '/images/curd-rice.jpg',
        description: 'Comfort food with rice and fresh curd',
        nutritional_info: {
          calories: 280,
          protein: 8,
          carbs: 45,
          fat: 7,
        },
        allergens: ['dairy'],
        dietary: ['vegetarian', 'gluten-free'],
      },
      {
        id: 'item-4',
        name: 'Idli',
        price: 18.0,
        category: 'snack',
        image: '/images/idli.jpg',
        description: 'Steamed rice cakes - healthy breakfast option',
        nutritional_info: {
          calories: 150,
          protein: 4,
          carbs: 30,
          fat: 1,
        },
        allergens: [],
        dietary: ['vegetarian', 'vegan', 'gluten-free'],
      },
    ],
  },
  rfid: {
    readers: [
      {
        id: 'READER-001',
        location: 'Cafeteria Entry',
        status: 'active',
        signal_strength: 'strong',
      },
      {
        id: 'READER-002',
        location: 'Kitchen Counter',
        status: 'active',
        signal_strength: 'strong',
      },
    ],
    student_cards: [
      {
        student_id: 'STU-12345',
        rfid_id: 'RFID-STU-12345',
        preset_orders: [
          {
            id: 'preset-1',
            name: 'Daily Lunch',
            items: [
              { name: 'Dal Rice', quantity: 1, price: 25.0 },
              { name: 'Sambar', quantity: 1, price: 15.0 },
              { name: 'Curd', quantity: 1, price: 10.0 },
            ],
            total: 50.0,
            is_default: true,
          },
        ],
      },
    ],
  },
};

// Write test data to file
const testDataPath = path.join(__dirname, '..', 'tests', 'test-data.json');
fs.writeFileSync(testDataPath, JSON.stringify(testData, null, 2));
console.log('✅ Created test data file');

// Create empty auth state files (will be populated during test setup)
const authFiles = ['student.json', 'parent.json', 'admin.json', 'kitchen.json', 'vendor.json'];
authFiles.forEach(file => {
  const filePath = path.join(authDir, file);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({ cookies: [], origins: [] }, null, 2));
    console.log(`✅ Created auth state file: ${file}`);
  }
});

// Create test environment configuration
const testEnvConfig = {
  test_server: {
    port: 3000,
    host: 'localhost',
    protocol: 'http',
  },
  rfid_simulation: {
    enabled: process.env.RFID_SIMULATION_MODE === 'true',
    scan_delay: 500,
    success_rate: 0.95,
  },
  performance_thresholds: {
    lcp: 2500,
    fid: 100,
    cls: 0.1,
    ttfb: 800,
    load_time: 3000,
  },
  accessibility: {
    level: 'AA',
    tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
  },
};

const testEnvPath = path.join(__dirname, '..', 'tests', 'test-env.json');
fs.writeFileSync(testEnvPath, JSON.stringify(testEnvConfig, null, 2));
console.log('✅ Created test environment configuration');

// Create Percy configuration
const percyConfig = {
  version: 2,
  discovery: {
    allowedHostnames: ['localhost'],
  },
  snapshot: {
    widths: [375, 768, 1440],
    minHeight: 1024,
    percyCSS: `
      .loading-spinner { display: none !important; }
      .animation { animation-duration: 0ms !important; }
    `,
  },
};

const percyConfigPath = path.join(__dirname, '..', '.percy.yml');
fs.writeFileSync(
  percyConfigPath,
  `# Percy Visual Testing Configuration
version: 2
discovery:
  allowed-hostnames:
    - localhost
snapshot:
  widths:
    - 375
    - 768 
    - 1440
  min-height: 1024
  percy-css: |
    .loading-spinner { display: none !important; }
    .animation { animation-duration: 0ms !important; }
    * { transition: none !important; }
`
);
console.log('✅ Created Percy configuration');

// Create .gitignore entries for test files
const gitignorePath = path.join(__dirname, '..', '.gitignore');
let gitignoreContent = '';

if (fs.existsSync(gitignorePath)) {
  gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
}

const testIgnores = [
  '',
  '# Playwright Test Results',
  'test-results/',
  'playwright-report/',
  'tests/auth/.auth/',
  '.percy/',
  '',
  '# Performance Reports',
  '.lighthouseci/',
  'lighthouse-report.html',
  '',
  '# Coverage Reports',
  '.nyc_output/',
  'coverage/',
].join('\n');

if (!gitignoreContent.includes('# Playwright Test Results')) {
  fs.writeFileSync(gitignorePath, gitignoreContent + testIgnores);
  console.log('✅ Updated .gitignore with test exclusions');
}

console.log('\n🎭 Enterprise Playwright Framework Setup Complete!');
console.log('\nNext steps:');
console.log('1. Run: npm run test:install');
console.log('2. Run: npm run test:playwright');
console.log('3. For visual tests: npm run test:visual');
console.log('4. For RFID tests: npm run test:rfid');
console.log('5. For performance: npm run test:performance');
console.log('\n📊 Test reports will be available at:');
console.log('- HTML Report: playwright-report/index.html');
console.log('- Visual Diffs: test-results/visual/');
console.log('- Performance: test-results/performance/');
console.log('\n🚀 Ready for enterprise-grade testing!');

process.exit(0);
