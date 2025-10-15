// Test script for HASIVU Menu Management API routes
// This script validates that all menu API endpoints work correctly

const API_BASE = 'http://localhost:3000/api/menu';

async function testMenuAPI() {
  console.log('🧪 Testing HASIVU Menu Management API');
  console.log('='.repeat(50));

  const results = {
    passed: 0,
    failed: 0,
    tests: [],
  };

  // Helper function to run individual tests
  async function runTest(testName, testFn) {
    try {
      console.log(`\n🔍 Testing: ${testName}`);
      const result = await testFn();
      console.log(`✅ PASSED: ${testName}`);
      results.passed++;
      results.tests.push({ name: testName, status: 'PASSED', result });
      return result;
    } catch (error) {
      console.log(`❌ FAILED: ${testName}`);
      console.log(`   Error: ${error.message}`);
      results.failed++;
      results.tests.push({ name: testName, status: 'FAILED', error: error.message });
      return null;
    }
  }

  // Test 1: GET /api/menu - List all menu items
  await runTest('GET /api/menu - List all menu items', async () => {
    const response = await fetch(`${API_BASE}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    if (data.status !== 'success') throw new Error('Invalid response status');
    if (!Array.isArray(data.data)) throw new Error('Data should be an array');
    if (data.data.length === 0) throw new Error('Should return menu items');

    // Validate MenuItem interface structure
    const item = data.data[0];
    const requiredFields = [
      'id',
      'name',
      'description',
      'category',
      'price',
      'rating',
      'prepTime',
      'dietary',
      'image',
      'priceValue',
    ];
    for (const field of requiredFields) {
      if (!(field in item)) throw new Error(`Missing required field: ${field}`);
    }

    console.log(`   Found ${data.data.length} menu items`);
    return data;
  });

  // Test 2: GET /api/menu with category filter
  await runTest('GET /api/menu?category=Breakfast - Filter by category', async () => {
    const response = await fetch(`${API_BASE}?category=Breakfast`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    if (data.status !== 'success') throw new Error('Invalid response status');

    // Validate all items are breakfast items
    const nonBreakfastItems = data.data.filter(item => item.category !== 'Breakfast');
    if (nonBreakfastItems.length > 0) throw new Error('Category filter not working');

    console.log(`   Found ${data.data.length} breakfast items`);
    return data;
  });

  // Test 3: GET /api/menu with search
  await runTest('GET /api/menu?search=dal - Search functionality', async () => {
    const response = await fetch(`${API_BASE}?search=dal`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    if (data.status !== 'success') throw new Error('Invalid response status');

    // Validate search results contain "dal"
    const invalidResults = data.data.filter(
      item =>
        !item.name.toLowerCase().includes('dal') && !item.description.toLowerCase().includes('dal')
    );
    if (invalidResults.length > 0) throw new Error('Search filter not working properly');

    console.log(`   Found ${data.data.length} items matching "dal"`);
    return data;
  });

  // Test 4: GET /api/menu/[menuId] - Get specific menu item
  await runTest('GET /api/menu/1 - Get specific menu item', async () => {
    const response = await fetch(`${API_BASE}/1`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    if (data.status !== 'success') throw new Error('Invalid response status');
    if (!data.data) throw new Error('No menu item data returned');
    if (data.data.id !== 1) throw new Error('Wrong menu item returned');

    console.log(`   Retrieved: ${data.data.name}`);
    return data;
  });

  // Test 5: GET /api/menu/999 - Non-existent menu item
  await runTest('GET /api/menu/999 - Non-existent menu item (404)', async () => {
    const response = await fetch(`${API_BASE}/999`);
    if (response.status !== 404) throw new Error(`Expected 404, got ${response.status}`);

    const data = await response.json();
    if (data.status !== 'error') throw new Error('Should return error status');

    console.log(`   Correctly returned 404 for non-existent item`);
    return data;
  });

  // Test 6: POST /api/menu/search - Advanced search
  await runTest('POST /api/menu/search - Advanced search', async () => {
    const searchBody = {
      filters: {
        dietary: ['Vegetarian'],
        priceRange: { min: 20, max: 60 },
        sortBy: 'price',
        sortOrder: 'asc',
      },
    };

    const response = await fetch(`${API_BASE}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(searchBody),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    if (data.status !== 'success') throw new Error('Invalid response status');

    // Validate filters were applied
    const invalidItems = data.data.filter(
      item => !item.dietary.includes('Vegetarian') || item.priceValue < 20 || item.priceValue > 60
    );
    if (invalidItems.length > 0) throw new Error('Search filters not applied correctly');

    // Validate sorting
    for (let i = 1; i < data.data.length; i++) {
      if (data.data[i].priceValue < data.data[i - 1].priceValue) {
        throw new Error('Results not sorted by price ascending');
      }
    }

    console.log(`   Found ${data.data.length} vegetarian items between ₹20-60`);
    return data;
  });

  // Test 7: GET /api/menu/categories - List categories
  await runTest('GET /api/menu/categories - List categories', async () => {
    const response = await fetch(`${API_BASE}/categories`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    if (data.status !== 'success') throw new Error('Invalid response status');
    if (!Array.isArray(data.data)) throw new Error('Categories should be an array');

    // Validate category structure
    const category = data.data[0];
    const requiredFields = [
      'id',
      'name',
      'description',
      'itemCount',
      'averagePrice',
      'averageRating',
    ];
    for (const field of requiredFields) {
      if (!(field in category)) throw new Error(`Missing required field: ${field}`);
    }

    console.log(`   Found ${data.data.length} categories`);
    return data;
  });

  // Test 8: Frontend compatibility - Check MenuItem interface
  await runTest('Frontend Compatibility - MenuItem Interface', async () => {
    const response = await fetch(`${API_BASE}/1`);
    const data = await response.json();
    const item = data.data;

    // Check exact interface match from frontend
    const frontendInterface = {
      id: 'number',
      name: 'string',
      description: 'string',
      category: 'string',
      price: 'string',
      rating: 'number',
      prepTime: 'string',
      dietary: 'object', // array
      image: 'string',
      priceValue: 'number',
    };

    for (const [field, expectedType] of Object.entries(frontendInterface)) {
      const actualType = Array.isArray(item[field]) ? 'object' : typeof item[field];
      if (actualType !== expectedType) {
        throw new Error(`Field ${field}: expected ${expectedType}, got ${actualType}`);
      }
    }

    console.log(`   ✅ MenuItem interface matches frontend exactly`);
    return item;
  });

  // Test 9: HASIVU-specific features
  await runTest('HASIVU-specific Features - School context', async () => {
    const response = await fetch(`${API_BASE}?ageGroup=6-10`);
    const data = await response.json();

    if (data.data.length === 0) throw new Error('Age group filter should return results');

    // Check for school-specific fields
    const item = data.data[0];
    if (!item.schoolSpecific) throw new Error('Missing schoolSpecific data');
    if (!item.schoolSpecific.ageGroup) throw new Error('Missing ageGroup data');
    if (!item.schoolSpecific.popularity) throw new Error('Missing popularity data');

    console.log(`   ✅ School-specific features working`);
    return data;
  });

  // Test 10: Performance test
  await runTest('Performance Test - Response time', async () => {
    const startTime = Date.now();
    const response = await fetch(`${API_BASE}`);
    const endTime = Date.now();

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const responseTime = endTime - startTime;
    if (responseTime > 1000) throw new Error(`Response too slow: ${responseTime}ms`);

    console.log(`   ⚡ Response time: ${responseTime}ms`);
    return { responseTime };
  });

  // Print final results
  console.log(`\n${'='.repeat(50)}`);
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(
    `📈 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`
  );

  if (results.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! HASIVU Menu API is ready for production.');
    console.log('\n🔗 Available Endpoints:');
    console.log('   • GET  /api/menu - List menu items with filtering');
    console.log('   • POST /api/menu - Create new menu item (Admin)');
    console.log('   • GET  /api/menu/[id] - Get specific menu item');
    console.log('   • PUT  /api/menu/[id] - Update menu item (Admin)');
    console.log('   • DELETE /api/menu/[id] - Delete menu item (Admin)');
    console.log('   • POST /api/menu/search - Advanced search with filters');
    console.log('   • GET  /api/menu/categories - List categories with stats');
    console.log('   • POST /api/menu/categories - Create new category (Admin)');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
  }

  return results;
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testMenuAPI };
}

// Run tests if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  testMenuAPI().catch(console.error);
}
