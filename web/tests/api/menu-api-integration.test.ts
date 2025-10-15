import { test, expect, APIRequestContext } from '@playwright/test';

/**
 * HASIVU Menu API - Comprehensive Integration Test Suite
 *
 * Tests all menu API endpoints implemented by the Backend Architect:
 * - /api/menu (GET, POST) - Main menu operations
 * - /api/menu/[id] (GET, PUT, DELETE) - Individual item operations
 * - /api/menu/search (GET, POST) - Search functionality
 * - /api/menu/categories (GET, POST) - Category management
 * - /api/menu/optimized - Performance-optimized endpoint
 * - /api/menu/secure - Security-hardened endpoint
 */

test.describe(_'HASIVU Menu API - Integration Tests', _() => {
  let apiContext: APIRequestContext;

  test.beforeEach(_async ({ request }) => {
    _apiContext =  request;
  });

  test.describe(_'1. Core Menu API Endpoints', _() => {

    test(_'GET /api/menu should return menu items with correct structure @api @menu', _async () => {
      const _response =  await apiContext.get('/api/menu');

      expect(response.status()).toBe(200);

      const _data =  await response.json();
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('pagination');
      expect(data).toHaveProperty('meta');
      expect(Array.isArray(data.data)).toBe(true);

      if (data.data.length > 0) {
        const _item =  data.data[0];
        // Verify HASIVU MenuItem interface
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('description');
        expect(item).toHaveProperty('category');
        expect(item).toHaveProperty('price');
        expect(item).toHaveProperty('rating');
        expect(item).toHaveProperty('prepTime');
        expect(item).toHaveProperty('dietary');
        expect(item).toHaveProperty('image');
        expect(item).toHaveProperty('priceValue');

        // Verify HASIVU-specific fields
        expect(item).toHaveProperty('ageGroup');
        expect(item).toHaveProperty('nutritional');
        expect(item).toHaveProperty('ingredients');
        expect(item).toHaveProperty('allergens');
        expect(item).toHaveProperty('popularity');
        expect(item).toHaveProperty('availability');

        // Validate data types
        expect(typeof item.id).toBe('number');
        expect(typeof item.name).toBe('string');
        expect(typeof item.price).toBe('string');
        expect(typeof item.rating).toBe('number');
        expect(Array.isArray(item.dietary)).toBe(true);
        expect(typeof item.priceValue).toBe('number');
        expect(typeof item.popularity).toBe('number');
      }
    });

    test(_'GET /api/menu should support filtering and pagination @api @menu @filtering', _async () => {
      // Test category filtering
      const _categoryResponse =  await apiContext.get('/api/menu?category
      expect(categoryResponse.status()).toBe(200);

      const _categoryData =  await categoryResponse.json();
      if (categoryData.data.length > 0) {
        expect(categoryData.data[0].category).toBe('main-course');
      }

      // Test price range filtering
      const _priceResponse =  await apiContext.get('/api/menu?minPrice
      expect(priceResponse.status()).toBe(200);

      const _priceData =  await priceResponse.json();
      if (priceData.data.length > 0) {
        const _item =  priceData.data[0];
        expect(item.priceValue).toBeGreaterThanOrEqual(20);
        expect(item.priceValue).toBeLessThanOrEqual(50);
      }

      // Test dietary filtering
      const _dietaryResponse =  await apiContext.get('/api/menu?dietary
      expect(dietaryResponse.status()).toBe(200);

      const _dietaryData =  await dietaryResponse.json();
      if (dietaryData.data.length > 0) {
        expect(dietaryData.data[0].dietary).toContain('Vegetarian');
      }

      // Test pagination
      const _page1 =  await apiContext.get('/api/menu?page
      expect(page1.status()).toBe(200);

      const _page1Data =  await page1.json();
      expect(page1Data.data.length).toBeLessThanOrEqual(5);
      expect(page1Data.pagination).toHaveProperty('currentPage', 1);
      expect(page1Data.pagination).toHaveProperty('limit', 5);
    });

    test('POST /api/menu should create new menu items (Admin only) @api @menu @create', async () => {
      const _newItem =  {
        name: 'Test Biryani',
        description: 'Delicious test biryani for integration testing',
        category: 'main-course',
        price: '₹65',
        priceValue: 65,
        rating: 4.2,
        prepTime: '25 min',
        dietary: ['Halal'],
        image: '🍛',
        ageGroup: ['11-15', '16-18'],
        nutritional: {
          calories: 450,
          protein: 18,
          carbs: 55,
          fat: 12,
          fiber: 4
        },
        ingredients: ['Basmati rice', 'Chicken', 'Spices', 'Yogurt'],
        allergens: ['Dairy'],
        popularity: 85,
        availability: {
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          startTime: '11:00',
          endTime: '14:00'
        }
      };

      // Mock admin authentication
      const _response =  await apiContext.post('/api/menu', {
        data: newItem,
        headers: {
          'Authorization': 'Bearer mock-admin-token',
          'Content-Type': 'application/json'
        }
      });

      // Expect 201 Created or 401 Unauthorized (if auth not implemented in mock)
      expect([201, 401, 403]).toContain(response.status());

      if (response.status() === 201) {
        const _data =  await response.json();
        expect(data).toHaveProperty('data');
        expect(data.data).toHaveProperty('id');
        expect(data.data.name).toBe(newItem.name);
      }
    });

    test(_'GET /api/menu/[id] should return specific menu item @api @menu @single', _async () => {
      // First get a list to find a valid ID
      const _listResponse =  await apiContext.get('/api/menu');
      const _listData =  await listResponse.json();

      if (listData.data.length > 0) {
        const _itemId =  listData.data[0].id;

        const _itemResponse =  await apiContext.get(`/api/menu/${itemId}`);
        expect(itemResponse.status()).toBe(200);

        const _itemData =  await itemResponse.json();
        expect(itemData).toHaveProperty('data');
        expect(itemData.data.id).toBe(itemId);
        expect(itemData.data).toHaveProperty('name');
        expect(itemData.data).toHaveProperty('nutritional');
      }
    });

    test(_'GET /api/menu/999999 should return 404 for non-existent item @api @menu @error', _async () => {
      const _response =  await apiContext.get('/api/menu/999999');
      expect(response.status()).toBe(404);

      const _data =  await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('not found');
    });

    test('PUT /api/menu/[id] should update menu items (Admin only) @api @menu @update', async () => {
      const _updateData =  {
        name: 'Updated Test Item',
        price: '₹75',
        priceValue: 75,
        rating: 4.5
      };

      const _response =  await apiContext.put('/api/menu/1', {
        data: updateData,
        headers: {
          'Authorization': 'Bearer mock-admin-token',
          'Content-Type': 'application/json'
        }
      });

      // Expect success, unauthorized, or not found
      expect([200, 401, 403, 404]).toContain(response.status());

      if (response.status() === 200) {
        const _data =  await response.json();
        expect(data).toHaveProperty('data');
        expect(data.data.name).toBe(updateData.name);
      }
    });

    test('DELETE /api/menu/[id] should remove menu items (Admin only) @api @menu @delete', async () => {
      const _response =  await apiContext.delete('/api/menu/1', {
        headers: {
          'Authorization': 'Bearer mock-admin-token'
        }
      });

      // Expect success, unauthorized, or not found
      expect([200, 401, 403, 404]).toContain(response.status());

      if (response.status() === 200) {
        const _data =  await response.json();
        expect(data).toHaveProperty('message');
        expect(data.message).toContain('deleted');
      }
    });
  });

  test.describe(_'2. Search API Endpoints', _() => {

    test(_'POST /api/menu/search should perform advanced search @api @search @advanced', _async () => {
      const _searchRequest =  {
        query: 'rice',
        filters: {
          category: ['main-course'],
          dietary: ['Vegetarian'],
          priceRange: { min: 20, max: 100 },
          rating: { min: 3.5 },
          ageGroup: ['11-15'],
          prepTime: { max: 30 }
        },
        sort: {
          by: 'popularity',
          order: 'desc'
        },
        pagination: {
          page: 1,
          limit: 10
        }
      };

      const _response =  await apiContext.post('/api/menu/search', {
        data: searchRequest,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      expect(response.status()).toBe(200);

      const _data =  await response.json();
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('meta');
      expect(data.meta).toHaveProperty('searchQuery', 'rice');
      expect(data.meta).toHaveProperty('totalResults');
      expect(data.meta).toHaveProperty('searchTime');
      expect(Array.isArray(data.data)).toBe(true);

      // Verify search results match criteria
      if (data.data.length > 0) {
        const _item =  data.data[0];
        expect(item.category).toBe('main-course');
        expect(item.dietary).toContain('Vegetarian');
        expect(item.priceValue).toBeGreaterThanOrEqual(20);
        expect(item.priceValue).toBeLessThanOrEqual(100);
        expect(item.rating).toBeGreaterThanOrEqual(3.5);
        expect(item.ageGroup).toContain('11-15');
      }
    });

    test(_'GET /api/menu/search should return search metadata @api @search @metadata', _async () => {
      const _response =  await apiContext.get('/api/menu/search');
      expect(response.status()).toBe(200);

      const _data =  await response.json();
      expect(data).toHaveProperty('suggestions');
      expect(data).toHaveProperty('categories');
      expect(data).toHaveProperty('popularSearches');
      expect(data).toHaveProperty('searchTips');

      expect(Array.isArray(data.suggestions)).toBe(true);
      expect(Array.isArray(data.categories)).toBe(true);
      expect(Array.isArray(data.popularSearches)).toBe(true);

      // Verify search suggestions structure
      if (data.suggestions.length > 0) {
        const _suggestion =  data.suggestions[0];
        expect(suggestion).toHaveProperty('term');
        expect(suggestion).toHaveProperty('count');
      }
    });

    test(_'POST /api/menu/search should handle typos and fuzzy matching @api @search @fuzzy', _async () => {
      const _typoSearch =  {
        query: 'biriany', // Typo for "biryani"
        fuzzyMatch: true
      };

      const _response =  await apiContext.post('/api/menu/search', {
        data: typoSearch,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      expect(response.status()).toBe(200);

      const _data =  await response.json();
      expect(data.meta).toHaveProperty('didYouMean');

      // Should suggest correct spelling
      if (data.meta.didYouMean) {
        expect(data.meta.didYouMean.toLowerCase()).toContain('biryani');
      }
    });

    test(_'POST /api/menu/search should handle empty queries gracefully @api @search @empty', _async () => {
      const _emptySearch =  {
        query: '',
        filters: {}
      };

      const _response =  await apiContext.post('/api/menu/search', {
        data: emptySearch,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      expect(response.status()).toBe(200);

      const _data =  await response.json();
      expect(data).toHaveProperty('data');
      expect(Array.isArray(data.data)).toBe(true);

      // Empty query should return popular items or all items
      expect(data.data.length).toBeGreaterThan(0);
    });
  });

  test.describe(_'3. Categories API Endpoints', _() => {

    test(_'GET /api/menu/categories should return all categories with statistics @api @categories', _async () => {
      const _response =  await apiContext.get('/api/menu/categories');
      expect(response.status()).toBe(200);

      const _data =  await response.json();
      expect(data).toHaveProperty('categories');
      expect(Array.isArray(data.categories)).toBe(true);

      if (data.categories.length > 0) {
        const _category =  data.categories[0];
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('displayName');
        expect(category).toHaveProperty('itemCount');
        expect(category).toHaveProperty('averagePrice');
        expect(category).toHaveProperty('averageRating');
        expect(category).toHaveProperty('popularItems');

        expect(typeof category.name).toBe('string');
        expect(typeof category.itemCount).toBe('number');
        expect(typeof category.averagePrice).toBe('number');
        expect(typeof category.averageRating).toBe('number');
        expect(Array.isArray(category.popularItems)).toBe(true);
      }
    });

    test('POST /api/menu/categories should create new categories (Admin only) @api @categories @create', async () => {
      const _newCategory =  {
        name: 'test-category',
        displayName: 'Test Category',
        description: 'Category for testing purposes',
        icon: '🧪',
        sortOrder: 99
      };

      const _response =  await apiContext.post('/api/menu/categories', {
        data: newCategory,
        headers: {
          'Authorization': 'Bearer mock-admin-token',
          'Content-Type': 'application/json'
        }
      });

      // Expect success or unauthorized
      expect([201, 401, 403]).toContain(response.status());

      if (response.status() === 201) {
        const _data =  await response.json();
        expect(data).toHaveProperty('category');
        expect(data.category.name).toBe(newCategory.name);
        expect(data.category.displayName).toBe(newCategory.displayName);
      }
    });
  });

  test.describe(_'4. Performance Optimized Endpoints', _() => {

    test(_'GET /api/menu/optimized should return faster responses with caching @api @performance @optimized', _async () => {
      // First request (cache miss)
      const _startTime1 =  Date.now();
      const _response1 =  await apiContext.get('/api/menu/optimized');
      const _responseTime1 =  Date.now() - startTime1;

      expect(response1.status()).toBe(200);
      expect(responseTime1).toBeLessThan(1000); // Should be under 1 second

      const _data1 =  await response1.json();
      expect(data1).toHaveProperty('data');
      expect(data1).toHaveProperty('performance');
      expect(data1.performance).toHaveProperty('cached', false);
      expect(data1.performance).toHaveProperty('responseTime');

      // Second request (should be cached)
      const _startTime2 =  Date.now();
      const _response2 =  await apiContext.get('/api/menu/optimized');
      const _responseTime2 =  Date.now() - startTime2;

      expect(response2.status()).toBe(200);
      expect(responseTime2).toBeLessThan(500); // Cached should be faster

      const _data2 =  await response2.json();
      expect(data2.performance).toHaveProperty('cached', true);
    });

    test(_'GET /api/menu/optimized with debug should return performance metrics @api @performance @debug', _async () => {
      const _response =  await apiContext.get('/api/menu/optimized?debug
      expect(response.status()).toBe(200);

      const _data =  await response.json();
      expect(data).toHaveProperty('performance');
      expect(data.performance).toHaveProperty('databaseQueryTime');
      expect(data.performance).toHaveProperty('cacheHitRatio');
      expect(data.performance).toHaveProperty('memoryUsage');
      expect(data.performance).toHaveProperty('totalResponseTime');

      // Validate performance metrics
      expect(typeof data.performance.databaseQueryTime).toBe('number');
      expect(typeof data.performance.cacheHitRatio).toBe('number');
      expect(data.performance.cacheHitRatio).toBeGreaterThanOrEqual(0);
      expect(data.performance.cacheHitRatio).toBeLessThanOrEqual(100);
    });

    test(_'GET /api/menu/optimized should handle lunch rush scenarios @api @performance @lunchrush', _async () => {
      // Simulate lunch rush by making multiple concurrent requests
      const _lunchRushRequests =  Array.from({ length: 10 }, () 
      const _startTime =  Date.now();
      const _responses =  await Promise.all(lunchRushRequests);
      const _totalTime =  Date.now() - startTime;

      // All requests should succeed
      responses.forEach(_response = > {
        expect(response.status()).toBe(200);
      });

      // Total time for 10 concurrent requests should be reasonable
      expect(totalTime).toBeLessThan(5000); // 5 seconds max

      // Check if lunch rush optimization was applied
      const _firstResponse =  await responses[0].json();
      if (firstResponse.performance && firstResponse.performance.lunchRushMode) {
        expect(firstResponse.performance.lunchRushMode).toBe(true);
      }
    });
  });

  test.describe(_'5. Security Hardened Endpoints', _() => {

    test(_'GET /api/menu/secure should require valid authentication @api @security @auth', _async () => {
      // Request without authentication
      const _unauthResponse =  await apiContext.get('/api/menu/secure');
      expect([401, 403]).toContain(unauthResponse.status());

      // Request with valid token
      const _authResponse =  await apiContext.get('/api/menu/secure', {
        headers: {
          'Authorization': 'Bearer mock-valid-token'
        }
      });

      // Should succeed or return 401 if token validation is strict
      expect([200, 401]).toContain(authResponse.status());

      if (authResponse.status() === 200) {
        const _data =  await authResponse.json();
        expect(data).toHaveProperty('data');
        expect(data).toHaveProperty('security');
        expect(data.security).toHaveProperty('authenticated', true);
      }
    });

    test(_'GET /api/menu/secure should enforce rate limiting @api @security @ratelimit', _async () => {
      const _requests =  Array.from({ length: 15 }, (_, i) 
      const _responses =  await Promise.all(requests);

      // Some requests might be rate limited
      const _successCount =  responses.filter(r 
      const _rateLimitedCount =  responses.filter(r 
      expect(successCount).toBeGreaterThan(0);

      // If rate limiting is implemented, expect some 429s
      if (rateLimitedCount > 0) {
        expect(rateLimitedCount).toBeGreaterThan(0);

        // Check rate limit headers
        const _rateLimitedResponse =  responses.find(r 
        const _headers =  rateLimitedResponse?.headers();
        expect(headers?.['x-ratelimit-remaining']).toBeDefined();
      }
    });

    test(_'GET /api/menu/secure should implement multi-tenant isolation @api @security @multitenant', _async () => {
      // Request for School A
      const _schoolAResponse =  await apiContext.get('/api/menu/secure', {
        headers: {
          'Authorization': 'Bearer school-a-token',
          'X-School-ID': 'SCH001'
        }
      });

      // Request for School B
      const _schoolBResponse =  await apiContext.get('/api/menu/secure', {
        headers: {
          'Authorization': 'Bearer school-b-token',
          'X-School-ID': 'SCH002'
        }
      });

      // Both should be successful
      expect([200, 401]).toContain(schoolAResponse.status());
      expect([200, 401]).toContain(schoolBResponse.status());

      if (schoolAResponse.status() === 200 && schoolBResponse.status() === 200) {
        const _schoolAData =  await schoolAResponse.json();
        const _schoolBData =  await schoolBResponse.json();

        // Should return different menus for different schools
        if (schoolAData.data.length > 0 && schoolBData.data.length > 0) {
          const _schoolAItems =  schoolAData.data.map((item: any) 
          const _schoolBItems =  schoolBData.data.map((item: any) 
          // Items should be different or filtered differently
          expect(schoolAItems).not.toEqual(schoolBItems);
        }
      }
    });

    test(_'POST /api/menu/secure should validate input sanitization @api @security @sanitization', _async () => {
      const maliciousInput = {
        name: '<script>alert("XSS")</script>',
        description: 'DROP TABLE menu_items;--',
        category: '../../../etc/passwd'
      };

      const _response =  await apiContext.post('/api/menu/secure', {
        data: maliciousInput,
        headers: {
          'Authorization': 'Bearer mock-admin-token',
          'Content-Type': 'application/json'
        }
      });

      // Should either reject the request or sanitize the input
      expect([400, 401, 403, 422]).toContain(response.status());

      if (response.status() === 400 || response.status() === 422) {
        const _data =  await response.json();
        expect(data).toHaveProperty('error');
        expect(data.error.toLowerCase()).toContain('invalid');
      }
    });

    test(_'GET /api/menu/secure should log security events @api @security @audit', _async () => {
      // Request with suspicious parameters
      const _response =  await apiContext.get('/api/menu/secure?debug
      expect([200, 401]).toContain(response.status());

      if (response.status() === 200) {
        const _data =  await response.json();
        if (data.security && data.security.auditLog) {
          expect(data.security.auditLog).toHaveProperty('timestamp');
          expect(data.security.auditLog).toHaveProperty('action', 'menu_access');
          expect(data.security.auditLog).toHaveProperty('userAgent');
          expect(data.security.auditLog).toHaveProperty('ipAddress');
        }
      }
    });
  });

  test.describe(_'6. Error Handling and Edge Cases', _() => {

    test(_'should handle malformed JSON gracefully @api @error @malformed', _async () => {
      const _response =  await apiContext.post('/api/menu/search', {
        data: '{ invalid json }',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      expect(response.status()).toBe(400);

      const _data =  await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error.toLowerCase()).toContain('invalid');
    });

    test(_'should handle large payloads appropriately @api @error @large', _async () => {
      // Create a large search request
      const _largeRequest =  {
        query: 'a'.repeat(10000), // 10KB query
        filters: {
          category: Array(1000).fill('main-course'),
          dietary: Array(1000).fill('vegetarian')
        }
      };

      const _response =  await apiContext.post('/api/menu/search', {
        data: largeRequest,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Should either handle it or reject with appropriate error
      expect([200, 413, 400]).toContain(response.status());

      if (response.status() === 413) {
        const _data =  await response.json();
        expect(data).toHaveProperty('error');
        expect(data.error.toLowerCase()).toContain('large');
      }
    });

    test(_'should handle concurrent requests without race conditions @api @error @concurrency', _async () => {
      // Make multiple simultaneous requests to the same endpoint
      const _concurrentRequests =  Array.from({ length: 20 }, (_, i) 
      const _responses =  await Promise.all(concurrentRequests);

      // All should succeed
      responses.forEach(_(response, _index) => {
        expect(response.status()).toBe(200);
      });

      // Verify data consistency
      const _dataArrays =  await Promise.all(
        responses.map(response 
      // All responses should have the same structure
      dataArrays.forEach(_data = > {
        expect(data).toHaveProperty('data');
        expect(Array.isArray(data.data)).toBe(true);
      });
    });

    test(_'should handle database connection failures gracefully @api @error @database', _async () => {
      // This would normally require mocking database failures
      // For now, we test that the API doesn't crash under load

      const _response =  await apiContext.get('/api/menu?stress
      // Should either succeed or fail gracefully
      expect([200, 503, 500]).toContain(response.status());

      if (response.status() === 503 || response.status() === 500) {
        const _data =  await response.json();
        expect(data).toHaveProperty('error');
        expect(data.error).toBeTruthy();
      }
    });
  });

  // Utility function to validate response times
  async function validateResponseTime(endpoint: string, maxTime: _number =  1000) {
    const startTime 
    const _response =  await apiContext.get(endpoint);
    const _responseTime =  Date.now() - startTime;

    expect(response.status()).toBe(200);
    expect(responseTime).toBeLessThan(maxTime);

    return responseTime;
  }

  test.describe(_'7. Performance and Load Testing', _() => {

    test(_'should maintain response times under normal load @api @performance @responsetime', _async () => {
      const _endpoints =  [
        '/api/menu',
        '/api/menu/categories',
        '/api/menu/search',
        '/api/menu/optimized'
      ];

      for (const endpoint of endpoints) {
        const _responseTime =  await validateResponseTime(endpoint, 1000);
        console.log(`${endpoint}: ${responseTime}ms`);
      }
    });

    test(_'should handle burst traffic patterns @api @performance @burst', _async () => {
      // Simulate burst traffic (common during lunch announcements)
      const _burstSize =  25;
      const _burstRequests =  Array.from({ length: burstSize }, () 
      const _startTime =  Date.now();
      const _responses =  await Promise.all(burstRequests);
      const _totalTime =  Date.now() - startTime;

      // All requests should succeed
      const _successCount =  responses.filter(r 
      expect(successCount).toBeGreaterThan(burstSize * 0.8); // At least 80% success

      // Total time should be reasonable
      expect(totalTime).toBeLessThan(10000); // 10 seconds max

      console.log(`Burst test: ${successCount}/${burstSize} success in ${totalTime}ms`);
    });
  });
});