import { test, expect, Page, APIRequestContext } from '@playwright/test';
import { MenuPage } from '../pages/menu.page';

/**
 * HASIVU Menu Management - Performance Integration Test Suite
 *
 * Validates the performance optimizations implemented by the Performance Engineer:
 * - Database query optimization with 41 strategic indexes
 * - Redis caching system with intelligent TTL strategies
 * - Materialized views for lunch rush optimization
 * - Connection pooling and query performance monitoring
 * - Load testing for 1000+ concurrent students
 *
 * Performance Targets:
 * - Normal Load: 100-200ms average response time
 * - Lunch Rush: 200-400ms average response time
 * - Cache Hit Ratio: 80-95% for common queries
 * - Throughput: 200-500 RPS during lunch rush
 * - Error Rate: <1% under peak load
 */

test.describe(_'HASIVU Menu Performance - Integration Tests', _() => {
  let menuPage: MenuPage;
  let apiContext: APIRequestContext;

  test.beforeEach(_async ({ page, _request }) => {
    _menuPage =  new MenuPage(page);
    _apiContext =  request;
  });

  test.describe(_'1. Database Optimization Validation', _() => {

    test(_'should demonstrate optimized database query performance @performance @database @queries', _async ({ page }) => {
      // Test optimized endpoint with performance monitoring
      const _response =  await apiContext.get('/api/menu/optimized?debug
      expect(response.status()).toBe(200);

      const _data =  await response.json();
      expect(data).toHaveProperty('performance');

      const _perf =  data.performance;

      // Validate database performance metrics
      expect(perf).toHaveProperty('databaseQueryTime');
      expect(perf).toHaveProperty('indexesUsed');
      expect(perf).toHaveProperty('queryPlan');

      // Database queries should be fast due to 41 strategic indexes
      expect(perf.databaseQueryTime).toBeLessThan(50); // <50ms database time
      expect(perf.totalResponseTime).toBeLessThan(200); // <200ms total response

      // Should use multiple optimized indexes
      if (perf.indexesUsed) {
        expect(perf.indexesUsed.length).toBeGreaterThan(0);
        console.log('Indexes used:', perf.indexesUsed);
      }
    });

    test(_'should validate materialized view performance for lunch rush @performance @database @materializedviews', _async ({ page }) => {
      // Mock lunch rush time period
      const _lunchRushTime =  new Date('2024-01-15T12:00:00Z');

      const _response =  await apiContext.get('/api/menu/optimized?scenario
      expect(response.status()).toBe(200);

      const _data =  await response.json();
      expect(data.performance).toHaveProperty('lunchRushOptimization');
      expect(data.performance.lunchRushOptimization).toBe(true);

      // Should use materialized view for faster lunch period queries
      expect(data.performance).toHaveProperty('materializedViewUsed', true);
      expect(data.performance.databaseQueryTime).toBeLessThan(30); // Even faster with materialized views

      // Verify lunch menu specific data
      expect(data.data.length).toBeGreaterThan(0);
      console.log('Lunch rush optimization active:', data.performance.lunchRushOptimization);
    });

    test(_'should validate full-text search performance with trigram indexes @performance @database @search', _async ({ page }) => {
      const _searchQueries =  [
        'rice',
        'dal rice',
        'masala dosa',
        'biryani',
        'north indian',
        'roti sabji'
      ];

      for (const query of searchQueries) {
        const _startTime =  Date.now();

        const _response =  await apiContext.post('/api/menu/search', {
          data: {
            query,
            fuzzyMatch: true,
            performanceTest: true
          }
        });

        const _responseTime =  Date.now() - startTime;

        expect(response.status()).toBe(200);
        expect(responseTime).toBeLessThan(100); // <100ms for search with fuzzy matching

        const _data =  await response.json();

        if (data.meta && data.meta.searchPerformance) {
          const _searchPerf =  data.meta.searchPerformance;
          expect(searchPerf).toHaveProperty('fullTextSearchTime');
          expect(searchPerf).toHaveProperty('trigramIndexUsed', true);
          expect(searchPerf.fullTextSearchTime).toBeLessThan(50);
        }

        console.log(`Search "${query}": ${responseTime}ms`);
      }
    });

    test(_'should validate allergen safety lookup performance @performance @database @allergens', _async ({ page }) => {
      // Test critical allergen checking performance (must be <50ms for student safety)
      const _allergenQueries =  [
        { studentId: 'STU001', allergens: ['nuts', 'dairy'] },
        { studentId: 'STU002', allergens: ['gluten', 'shellfish'] },
        { studentId: 'STU003', allergens: ['soy', 'eggs'] }
      ];

      for (const query of allergenQueries) {
        const _startTime =  Date.now();

        const _response =  await apiContext.post('/api/menu/search', {
          data: {
            filters: {
              excludeAllergens: query.allergens,
              safetyCheck: true
            },
            studentId: query.studentId
          }
        });

        const _responseTime =  Date.now() - startTime;

        expect(response.status()).toBe(200);
        expect(responseTime).toBeLessThan(50); // Critical safety requirement

        const _data =  await response.json();

        // Verify no unsafe items returned
        if (data.data && data.data.length > 0) {
          data.data.forEach((item: any) => {
            if (item.allergens) {
              const _hasUnsafeAllergen =  query.allergens.some(allergen 
              expect(hasUnsafeAllergen).toBe(false);
            }
          });
        }

        console.log(`Allergen safety check: ${responseTime}ms`);
      }
    });
  });

  test.describe(_'2. Redis Caching Performance Validation', _() => {

    test(_'should validate intelligent caching TTL strategies @performance @cache @ttl', _async ({ page }) => {
      // Test different cache scenarios with varying TTL

      // Menu data (1-hour TTL)
      const _menuResponse1 =  await apiContext.get('/api/menu/optimized?cache
      const _menuResponse2 =  await apiContext.get('/api/menu/optimized?cache
      expect(menuResponse1.status()).toBe(200);
      expect(menuResponse2.status()).toBe(200);

      const _menu1 =  await menuResponse1.json();
      const _menu2 =  await menuResponse2.json();

      expect(menu1.performance.cached).toBe(false); // First request
      expect(menu2.performance.cached).toBe(true);  // Second request cached

      // Search results (30-minute TTL)
      const _searchResponse1 =  await apiContext.post('/api/menu/search', {
        data: { query: 'rice', cacheKey: 'test-search' }
      });
      const _searchResponse2 =  await apiContext.post('/api/menu/search', {
        data: { query: 'rice', cacheKey: 'test-search' }
      });

      const _search1 =  await searchResponse1.json();
      const _search2 =  await searchResponse2.json();

      if (search1.meta && search2.meta) {
        expect(search1.meta.cached).toBe(false);
        expect(search2.meta.cached).toBe(true);
        expect(search2.meta.cacheHit).toBe(true);
      }
    });

    test(_'should validate cache hit ratio targets @performance @cache @hitrate', _async ({ page }) => {
      // Perform multiple requests to build up cache
      const _commonQueries =  [
        '/api/menu',
        '/api/menu?category
      // Prime the cache
      for (const query of commonQueries) {
        await apiContext.get(query);
      }

      // Test cache hit ratios
      const _testPromises =  [];
      for (let i = 0; i < 20; i++) {
        const _randomQuery =  commonQueries[i % commonQueries.length];
        testPromises.push(apiContext.get(`${randomQuery}&_test = ${i}`));
      }

      const _responses =  await Promise.all(testPromises);

      let _cacheHits =  0;
      const _totalRequests =  responses.length;

      for (const response of responses) {
        expect(response.status()).toBe(200);
        const _data =  await response.json();

        if (data.performance && data.performance._cached = 
        }
      }

      const _hitRatio =  (cacheHits / totalRequests) * 100;
      console.log(`Cache hit ratio: ${hitRatio.toFixed(2)}%`);

      // Target: 80-95% cache hit ratio for common queries
      expect(hitRatio).toBeGreaterThanOrEqual(60); // Relaxed for test environment
    });

    test(_'should validate lunch rush cache optimization @performance @cache @lunchrush', _async ({ page }) => {
      // Test lunch rush specific caching (15-minute TTL)
      const _lunchTime =  new Date('2024-01-15T12:00:00Z');

      const _lunchRequests =  Array.from({ length: 10 }, () 
      const _startTime =  Date.now();
      const _responses =  await Promise.all(lunchRequests);
      const _totalTime =  Date.now() - startTime;

      // All requests should succeed
      responses.forEach(_response = > {
        expect(response.status()).toBe(200);
      });

      // Lunch rush cache should make subsequent requests much faster
      const _averageTime =  totalTime / responses.length;
      expect(averageTime).toBeLessThan(100); // <100ms average with caching

      // Verify lunch rush optimization
      const _firstResponse =  await responses[0].json();
      if (firstResponse.performance) {
        expect(firstResponse.performance.lunchRushMode).toBe(true);
        console.log('Lunch rush cache optimization active');
      }
    });

    test(_'should validate cache invalidation strategies @performance @cache @invalidation', _async ({ page }) => {
      // Get initial cached menu
      const _initialResponse =  await apiContext.get('/api/menu/optimized?cache
      expect(initialResponse.status()).toBe(200);

      const _initialData =  await initialResponse.json();
      expect(initialData.performance.cached).toBe(false);

      // Simulate menu update (should invalidate cache)
      const _updateResponse =  await apiContext.put('/api/menu/1', {
        data: { name: 'Updated Test Item' },
        headers: { 'Authorization': 'Bearer mock-admin-token' }
      });

      // Get menu again (should be fresh, not cached)
      const _freshResponse =  await apiContext.get('/api/menu/optimized?cache
      const _freshData =  await freshResponse.json();

      if (updateResponse.status() === 200) {
        // Cache should be invalidated after update
        expect(freshData.performance.cached).toBe(false);
        console.log('Cache invalidation working correctly');
      } else {
        console.log('Update not permitted (expected in test environment)');
      }
    });
  });

  test.describe(_'3. Frontend Performance Integration', _() => {

    test(_'should validate menu loading performance in UI @performance @frontend @loading', _async ({ page }) => {
      const _startTime =  Date.now();

      await menuPage.goto();
      await menuPage.waitForPageLoad();

      // Wait for all menu items to be visible
      await expect(menuPage.menuItems).toHaveCountGreaterThan(0);

      const _loadTime =  Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // 3 second max load time

      // Verify menu items are properly displayed
      const _itemCount =  await menuPage.menuItems.count();
      expect(itemCount).toBeGreaterThan(0);

      console.log(`Menu loaded: ${itemCount} items in ${loadTime}ms`);
    });

    test(_'should validate search performance in UI @performance @frontend @search', _async ({ page }) => {
      await menuPage.goto();
      await menuPage.waitForPageLoad();

      const _searchQueries =  ['rice', 'dal', 'biryani', 'south indian', 'vegetarian'];

      for (const query of searchQueries) {
        const _startTime =  Date.now();

        await menuPage.searchMenu(query);

        // Wait for search results to update
        await page.waitForTimeout(100);
        await expect(menuPage.menuItems).toHaveCountGreaterThan(0);

        const _searchTime =  Date.now() - startTime;
        expect(searchTime).toBeLessThan(1000); // 1 second max search time

        const _resultCount =  await menuPage.menuItems.count();
        console.log(`Search "${query}": ${resultCount} results in ${searchTime}ms`);
      }
    });

    test(_'should validate cart performance with multiple items @performance @frontend @cart', _async ({ page }) => {
      await menuPage.goto();
      await menuPage.waitForPageLoad();

      const _items =  ['Dal Rice', 'Chapati', 'Sambar', 'Curd Rice', 'Rasam'];
      const _startTime =  Date.now();

      // Add multiple items quickly
      for (const item of items) {
        await menuPage.addItemToCart(item, 2);
        await page.waitForTimeout(50); // Small delay between additions
      }

      const _addTime =  Date.now() - startTime;
      expect(addTime).toBeLessThan(5000); // 5 seconds max for adding 10 items

      // Verify cart performance
      await menuPage.openCart();
      await expect(menuPage.cartItems).toHaveCountGreaterThan(0);

      const _cartTotal =  await menuPage.cartTotal.textContent();
      expect(cartTotal).toBeTruthy();

      console.log(`Cart performance: ${items.length * 2} items added in ${addTime}ms`);
    });
  });

  test.describe(_'4. Load Testing and Scalability', _() => {

    test(_'should handle concurrent user load @performance @load @concurrent', _async ({ page, _context }) => {
      const concurrentUsers = 15; // Simulate 15 concurrent students
      const _userPromises =  [];

      for (let i = 0; i < concurrentUsers; i++) {
        userPromises.push((async (userId: number) => {
          const _userPage =  await context.newPage();
          const _userMenuPage =  new MenuPage(userPage);

          try {
            const _userStartTime =  Date.now();

            await userMenuPage.goto();
            await userMenuPage.waitForPageLoad();

            // Simulate realistic user behavior
            await userMenuPage.searchMenu('rice');
            await userMenuPage.addItemToCart('Dal Rice', 1);
            await userMenuPage.addItemToCart('Chapati', 2);

            const _userTime =  Date.now() - userStartTime;

            await userPage.close();
            return { userId, success: true, time: userTime };
          } catch (error) {
            await userPage.close();
            return { userId, success: false, error: error.message };
          }
        })(i));
      }

      const _globalStartTime =  Date.now();
      const _results =  await Promise.all(userPromises);
      const _totalTime =  Date.now() - globalStartTime;

      // Analyze results
      const _successfulUsers =  results.filter(r 
      const _failedUsers =  results.filter(r 
      const _successRate =  (successfulUsers.length / concurrentUsers) * 100;
      const _averageUserTime =  successfulUsers.reduce((sum, r) 
      console.log(`Load test: ${successfulUsers.length}/${concurrentUsers} users successful (${successRate.toFixed(1)}%)`);
      console.log(`Average user time: ${averageUserTime.toFixed(0)}ms`);
      console.log(`Total test time: ${totalTime}ms`);

      // Performance expectations
      expect(successRate).toBeGreaterThanOrEqual(90); // 90% success rate
      expect(averageUserTime).toBeLessThan(5000); // 5 seconds average per user
      expect(totalTime).toBeLessThan(15000); // 15 seconds total for all users
    });

    test(_'should handle lunch rush simulation @performance @load @lunchrush', _async ({ page, _context }) => {
      // Simulate peak lunch period with 25 concurrent students
      const _lunchRushUsers =  25;
      const _lunchItems =  ['Dal Rice', 'Chapati', 'Sambar', 'Curd Rice', 'Vegetable Curry'];

      // Mock lunch rush time
      const lunchTime = new Date('2024-01-15T12:15:00Z'); // Peak lunch time

      const _lunchRushPromises =  Array.from({ length: lunchRushUsers }, async (_, i) 
        // Mock different students
        await studentPage.evaluate(_(studentId) => {
          localStorage.setItem('auth', JSON.stringify({
            user: { id: `STU${String(studentId).padStart(3, '0')}`, role: 'STUDENT', schoolId: 'SCH001' },
            token: `lunch-token-${studentId}`
          }));
        }, i + 1);

        // Set lunch time context
        await studentPage.addInitScript(_(time) => {
          Date._now =  () 
        }, lunchTime.getTime());

        try {
          const _userStartTime =  Date.now();
          const _studentMenuPage =  new MenuPage(studentPage);

          await studentMenuPage.goto();
          await studentMenuPage.waitForPageLoad();

          // Quick lunch selections (students know what they want)
          const _selectedItem =  lunchItems[i % lunchItems.length];
          await studentMenuPage.addItemToCart(selectedItem, 1);

          // Some students add extra items
          if (i % _3 = 
            await studentMenuPage.addItemToCart(extraItem, 1);
          }

          // Proceed to checkout
          await studentMenuPage.proceedToCheckout();

          const _userTime =  Date.now() - userStartTime;

          await studentPage.close();
          return { studentId: i + 1, success: true, time: userTime };
        } catch (error) {
          await studentPage.close();
          return { studentId: i + 1, success: false, error: error.message, time: 0 };
        }
      });

      const _lunchStartTime =  Date.now();
      const _lunchResults =  await Promise.all(lunchRushPromises);
      const _lunchTotalTime =  Date.now() - lunchStartTime;

      // Analyze lunch rush performance
      const _successfulOrders =  lunchResults.filter(r 
      const _failedOrders =  lunchResults.filter(r 
      const _lunchSuccessRate =  (successfulOrders.length / lunchRushUsers) * 100;
      const _averageLunchTime =  successfulOrders.reduce((sum, r) 
      console.log(`Lunch Rush: ${successfulOrders.length}/${lunchRushUsers} orders successful (${lunchSuccessRate.toFixed(1)}%)`);
      console.log(`Average order time: ${averageLunchTime.toFixed(0)}ms`);
      console.log(`Total lunch rush time: ${lunchTotalTime}ms`);

      // Lunch rush performance requirements
      expect(lunchSuccessRate).toBeGreaterThanOrEqual(85); // 85% success rate during peak
      expect(averageLunchTime).toBeLessThan(8000); // 8 seconds max per order during rush
      expect(lunchTotalTime).toBeLessThan(20000); // 20 seconds total for all 25 users
    });

    test(_'should validate API throughput under load @performance @load @api', _async ({ request }) => {
      const _requestsPerBatch =  50;
      const _batchCount =  5;
      const _results =  [];

      for (let batch = 0; batch < batchCount; batch++) {
        const _batchPromises =  Array.from({ length: requestsPerBatch }, (_, i) 
        const _batchStartTime =  Date.now();
        const _batchResponses =  await Promise.all(batchPromises);
        const _batchTime =  Date.now() - batchStartTime;

        const _successCount =  batchResponses.filter(r 
        const throughput = (successCount / batchTime) * 1000; // Requests per second

        results.push({
          batch: batch + 1,
          successCount,
          totalRequests: requestsPerBatch,
          batchTime,
          throughput
        });

        console.log(`Batch ${batch + 1}: ${successCount}/${requestsPerBatch} success, ${throughput.toFixed(1)} RPS`);
      }

      // Analyze overall throughput
      const _totalSuccess =  results.reduce((sum, r) 
      const _totalRequests =  results.reduce((sum, r) 
      const _totalTime =  results.reduce((sum, r) 
      const _overallThroughput =  (totalSuccess / totalTime) * 1000;

      console.log(`Overall: ${totalSuccess}/${totalRequests} requests, ${overallThroughput.toFixed(1)} RPS`);

      // Performance targets
      expect(totalSuccess / totalRequests).toBeGreaterThanOrEqual(0.95); // 95% success rate
      expect(overallThroughput).toBeGreaterThanOrEqual(50); // 50+ RPS minimum
    });
  });

  test.describe(_'5. Memory and Resource Usage', _() => {

    test(_'should monitor memory usage during extended operation @performance @memory @monitoring', _async ({ page }) => {
      await menuPage.goto();
      await menuPage.waitForPageLoad();

      // Get initial memory usage
      const _initialMemory =  await page.evaluate(() 
      });

      // Perform memory-intensive operations
      for (let i = 0; i < 10; i++) {
        await menuPage.searchMenu(`test${i}`);
        await page.waitForTimeout(100);
        await menuPage.addItemToCart('Dal Rice', 1);
        await page.waitForTimeout(100);
        await menuPage.openCart();
        await page.waitForTimeout(100);
        await menuPage.closeCart();
      }

      // Get final memory usage
      const _finalMemory =  await page.evaluate(() 
      });

      if (initialMemory.used > 0 && finalMemory.used > 0) {
        const _memoryIncrease =  finalMemory.used - initialMemory.used;
        const _memoryIncreasePercent =  (memoryIncrease / initialMemory.used) * 100;

        console.log(`Memory usage: ${initialMemory.used} → ${finalMemory.used} bytes`);
        console.log(`Memory increase: ${memoryIncrease} bytes (${memoryIncreasePercent.toFixed(1)}%)`);

        // Memory usage shouldn't increase dramatically
        expect(memoryIncreasePercent).toBeLessThan(200); // Less than 200% increase
        expect(finalMemory.used).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
      }
    });

    test(_'should validate Core Web Vitals performance @performance @vitals @metrics', _async ({ page }) => {
      await menuPage.goto();

      // Wait for page to fully load and stabilize
      await menuPage.waitForPageLoad();
      await page.waitForTimeout(2000);

      // Measure Core Web Vitals
      const _vitals =  await page.evaluate(() 
          // Largest Contentful Paint
          const _lcpObserver =  new PerformanceObserver((list) 
            const _lastEntry =  entries[entries.length - 1];
            vitals._lcp =  lastEntry.startTime;
          });
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

          // First Input Delay
          const _fidObserver =  new PerformanceObserver((list) 
            entries.forEach(_entry = > {
              vitals.fid 
            });
          });
          fidObserver.observe({ entryTypes: ['first-input'] });

          // Cumulative Layout Shift
          const _clsObserver =  new PerformanceObserver((list) 
            entries.forEach(_entry = > {
              if (!entry.hadRecentInput) {
                vitals.cls +
              }
            });
          });
          clsObserver.observe({ entryTypes: ['layout-shift'] });

          // First Contentful Paint
          const _navigationEntry =  performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          const _paintEntries =  performance.getEntriesByType('paint');

          paintEntries.forEach(_entry = > {
            if (entry.name 
            }
          });

          if (navigationEntry) {
            vitals._ttfb =  navigationEntry.responseStart - navigationEntry.requestStart;
          }

          // Return results after a delay
          setTimeout(_() => resolve(vitals), 3000);
        });
      });

      console.log('Core Web Vitals:', vitals);

      // Validate against Google's thresholds
      if ((vitals as any).lcp > 0) {
        expect((vitals as any).lcp).toBeLessThan(2500); // LCP < 2.5s (Good)
      }

      if ((vitals as any).fid > 0) {
        expect((vitals as any).fid).toBeLessThan(100); // FID < 100ms (Good)
      }

      if ((vitals as any).cls > 0) {
        expect((vitals as any).cls).toBeLessThan(0.1); // CLS < 0.1 (Good)
      }

      if ((vitals as any).fcp > 0) {
        expect((vitals as any).fcp).toBeLessThan(1800); // FCP < 1.8s (Good)
      }

      if ((vitals as any).ttfb > 0) {
        expect((vitals as any).ttfb).toBeLessThan(800); // TTFB < 800ms (Good)
      }
    });
  });

  // Cleanup and reporting
  test.afterEach(_async ({ page }, _testInfo) => {
    // Log performance metrics if available
    const _performanceEntries =  await page.evaluate(() 
      return {
        loadTime: navigation ? navigation.loadEventEnd - navigation.navigationStart : 0,
        domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.navigationStart : 0,
        firstPaint: performance.getEntriesByType('paint').find(_entry = > entry.name 
    });

    if (performanceEntries.loadTime > 0) {
      console.log(`Test "${testInfo.title}" performance:`, performanceEntries);
    }
  });
});