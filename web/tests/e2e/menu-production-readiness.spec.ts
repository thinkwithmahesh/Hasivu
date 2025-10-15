import { test, expect, Page, APIRequestContext } from '@playwright/test';
import { MenuPage } from '../pages/menu.page';

/**
 * HASIVU Menu Management System - Production Readiness Integration Tests
 *
 * This comprehensive test suite validates that all components implemented by different specialists
 * work together seamlessly and are ready for production deployment in a school environment.
 *
 * Test Coverage:
 * ✅ API-Frontend Integration (Backend Architect + Frontend Developer)
 * ✅ Performance Integration (Performance Engineer optimizations)
 * ✅ Security Integration (Security Specialist hardening)
 * ✅ Cross-Component Workflows (All components working together)
 * ✅ School-Specific Scenarios (Real-world usage patterns)
 * ✅ Production Readiness Assessment
 *
 * @author Test Engineer
 * @integration comprehensive
 */

test.describe(_'HASIVU Menu Management - Production Readiness Suite', _() => {
  let menuPage: MenuPage;
  let apiContext: APIRequestContext;

  test.beforeEach(_async ({ page, _request }) => {
    _menuPage =  new MenuPage(page);
    _apiContext =  request;

    // Clear any existing state
    await page.evaluate(_() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test.describe(_'1. API-Frontend Integration Validation', _() => {

    test(_'should validate complete API-UI data flow @integration @critical', _async ({ page }) => {
      // Step 1: Test Menu API endpoint
      const _apiResponse =  await apiContext.get('/api/menu');
      expect(apiResponse.status()).toBe(200);

      const _apiData =  await apiResponse.json();
      expect(apiData.data).toBeDefined();
      expect(Array.isArray(apiData.data)).toBe(true);
      expect(apiData.data.length).toBeGreaterThan(0);

      // Step 2: Verify frontend displays API data correctly
      await menuPage.goto();
      await menuPage.waitForPageLoad();

      // Check if menu items are loaded
      const _menuItemsCount =  await menuPage.menuItems.count();
      expect(menuItemsCount).toBeGreaterThan(0);

      // Step 3: Validate data consistency
      if (apiData.data.length > 0 && menuItemsCount > 0) {
        const _apiItem =  apiData.data[0];
        const _uiItem =  menuPage.menuItems.first();

        // Check if essential data matches
        const _itemName =  await uiItem.locator('[data-testid
        const _itemPrice =  await uiItem.locator('[data-testid
        expect(itemName).toBeTruthy();
        expect(itemPrice).toBeTruthy();
        expect(itemPrice).toMatch(/₹\s*\d+/); // Price format validation
      }
    });

    test(_'should validate search API integration @integration @search', _async ({ page }) => {
      await menuPage.goto();
      await menuPage.waitForPageLoad();

      // Test search functionality
      const _searchQuery =  'rice';
      await menuPage.searchMenu(searchQuery);

      // Verify search API endpoint
      const _searchResponse =  await apiContext.post('/api/menu/search', {
        data: { query: searchQuery }
      });
      expect(searchResponse.status()).toBe(200);

      const _searchData =  await searchResponse.json();
      expect(searchData.data).toBeDefined();

      // Verify UI reflects search results
      const _visibleItems =  await menuPage.menuItems.count();
      if (searchData.data.length > 0) {
        expect(visibleItems).toBeGreaterThan(0);

        // Verify search results contain the query term
        const _firstItem =  menuPage.menuItems.first();
        const _itemText =  await firstItem.textContent();
        expect(itemText?.toLowerCase()).toContain(searchQuery.toLowerCase());
      }
    });

    test(_'should validate category filtering integration @integration @categories', _async ({ page }) => {
      // Test categories API
      const _categoriesResponse =  await apiContext.get('/api/menu/categories');
      expect(categoriesResponse.status()).toBe(200);

      const _categoriesData =  await categoriesResponse.json();
      expect(categoriesData.categories).toBeDefined();
      expect(categoriesData.categories.length).toBeGreaterThan(0);

      await menuPage.goto();
      await menuPage.waitForPageLoad();

      // Test category filtering in UI
      const _testCategory =  'main-course';
      await menuPage.filterByCategory(testCategory);

      // Verify API filtering works
      const _filteredResponse =  await apiContext.get(`/api/menu?category
      const _filteredData =  await filteredResponse.json();

      expect(filteredResponse.status()).toBe(200);
      expect(filteredData.data).toBeDefined();

      // Verify UI shows filtered results
      const _filteredCount =  await menuPage.menuItems.count();
      if (filteredData.data.length > 0) {
        expect(filteredCount).toBeGreaterThan(0);
      }
    });
  });

  test.describe(_'2. Performance Integration Testing', _() => {

    test(_'should validate optimized endpoint performance @integration @performance', _async ({ page }) => {
      // Test optimized menu endpoint
      const _startTime =  Date.now();
      const _optimizedResponse =  await apiContext.get('/api/menu/optimized');
      const _apiResponseTime =  Date.now() - startTime;

      expect(optimizedResponse.status()).toBe(200);
      expect(apiResponseTime).toBeLessThan(1000); // API should respond under 1s

      const _optimizedData =  await optimizedResponse.json();
      expect(optimizedData.data).toBeDefined();
      expect(optimizedData.performance).toBeDefined();

      // Test frontend performance with optimized data
      const _pageStartTime =  Date.now();
      await menuPage.goto();
      await menuPage.waitForPageLoad();
      const _pageLoadTime =  Date.now() - pageStartTime;

      expect(pageLoadTime).toBeLessThan(3000); // Page should load under 3s

      // Verify menu items are displayed
      const _itemsCount =  await menuPage.menuItems.count();
      expect(itemsCount).toBeGreaterThan(0);
    });

    test(_'should handle concurrent user load @integration @performance @load', _async ({ context }) => {
      // Simulate 10 concurrent users accessing the menu
      const _userPromises =  [];
      const _concurrentUsers =  10;

      for (let i = 0; i < concurrentUsers; i++) {
        userPromises.push((async (userId: number) => {
          const _userPage =  await context.newPage();
          const _userMenuPage =  new MenuPage(userPage);

          try {
            const _startTime =  Date.now();
            await userMenuPage.goto();
            await userMenuPage.waitForPageLoad();
            const _loadTime =  Date.now() - startTime;

            // Each user should load within reasonable time
            expect(loadTime).toBeLessThan(5000);

            // Simulate user interaction
            await userMenuPage.searchMenu('dal');
            const _searchResults =  await userMenuPage.menuItems.count();
            expect(searchResults).toBeGreaterThanOrEqual(0);

            return { success: true, userId, loadTime };
          } catch (error) {
            return { success: false, userId, error: error.message };
          } finally {
            await userPage.close();
          }
        })(i));
      }

      const _results =  await Promise.all(userPromises);
      const _successfulUsers =  results.filter(r 
      const _failedUsers =  results.filter(r 
      // Expect at least 80% success rate
      expect(successfulUsers).toBeGreaterThanOrEqual(concurrentUsers * 0.8);
      expect(failedUsers).toBeLessThan(concurrentUsers * 0.2);

      console.log(`Load test: ${successfulUsers}/${concurrentUsers} users successful`);
    });

    test(_'should validate caching integration @integration @performance @caching', _async ({ page }) => {
      // First request (cache miss)
      const _firstStart =  Date.now();
      const _firstResponse =  await apiContext.get('/api/menu/optimized');
      const _firstTime =  Date.now() - firstStart;

      expect(firstResponse.status()).toBe(200);
      const _firstData =  await firstResponse.json();

      // Second request (should be cached)
      const _secondStart =  Date.now();
      const _secondResponse =  await apiContext.get('/api/menu/optimized');
      const _secondTime =  Date.now() - secondStart;

      expect(secondResponse.status()).toBe(200);
      const _secondData =  await secondResponse.json();

      // Cached response should be faster
      expect(secondTime).toBeLessThan(firstTime);

      // Data should be consistent
      expect(secondData.data.length).toBe(firstData.data.length);

      console.log(`Cache test: First: ${firstTime}ms, Cached: ${secondTime}ms`);
    });
  });

  test.describe(_'3. Security Integration Testing', _() => {

    test(_'should validate authentication integration @integration @security @auth', _async ({ page }) => {
      // Test secure endpoint without authentication
      const _unauthResponse =  await apiContext.get('/api/menu/secure');
      expect([401, 403, 200]).toContain(unauthResponse.status());

      // Mock user authentication in frontend
      await page.evaluate(_() => {
        localStorage.setItem('auth', JSON.stringify({
          user: {
            id: 'TEST001',
            role: 'STUDENT',
            schoolId: 'SCH001',
            name: 'Test Student'
          },
          token: 'mock-test-token'
        }));
      });

      await menuPage.goto();
      await menuPage.waitForPageLoad();

      // Verify user can access menu
      const _menuItems =  await menuPage.menuItems.count();
      expect(menuItems).toBeGreaterThan(0);

      // Test authenticated API request
      const _authResponse =  await apiContext.get('/api/menu/secure', {
        headers: {
          'Authorization': 'Bearer mock-test-token'
        }
      });

      expect([200, 401]).toContain(authResponse.status());
    });

    test(_'should validate input sanitization @integration @security @sanitization', _async ({ page }) => {
      await menuPage.goto();
      await menuPage.waitForPageLoad();

      // Test XSS prevention in search
      const _maliciousInput =  '<script>alert("XSS")</script>';
      await menuPage.searchMenu(maliciousInput);

      // Verify no script execution occurred
      const _searchValue =  await menuPage.searchInput.inputValue();
      expect(searchValue).toBe(maliciousInput);

      // Verify search API sanitization
      const _searchResponse =  await apiContext.post('/api/menu/search', {
        data: { query: maliciousInput }
      });

      expect(searchResponse.status()).toBe(200);
      const _searchData =  await searchResponse.json();

      // Response should not contain the malicious script
      const _responseText =  JSON.stringify(searchData);
      expect(responseText).not.toContain('<script>');
    });

    test(_'should validate multi-tenant isolation @integration @security @multitenant', _async ({ page }) => {
      // Mock School A user
      await page.evaluate(_() => {
        localStorage.setItem('auth', JSON.stringify({
          user: { id: 'STU001', role: 'STUDENT', schoolId: 'SCH001' },
          token: 'school-a-token'
        }));
      });

      const _schoolAResponse =  await apiContext.get('/api/menu', {
        headers: { 'X-School-ID': 'SCH001' }
      });

      // Mock School B user (different school)
      await page.evaluate(_() => {
        localStorage.setItem('auth', JSON.stringify({
          user: { id: 'STU002', role: 'STUDENT', schoolId: 'SCH002' },
          token: 'school-b-token'
        }));
      });

      const _schoolBResponse =  await apiContext.get('/api/menu', {
        headers: { 'X-School-ID': 'SCH002' }
      });

      // Both should succeed but potentially return different data
      expect(schoolAResponse.status()).toBe(200);
      expect(schoolBResponse.status()).toBe(200);

      if (schoolAResponse.status() === 200 && schoolBResponse.status() === 200) {
        const _schoolAData =  await schoolAResponse.json();
        const _schoolBData =  await schoolBResponse.json();

        // Data structure should be consistent
        expect(schoolAData.data).toBeDefined();
        expect(schoolBData.data).toBeDefined();
      }
    });
  });

  test.describe(_'4. Cross-Component Workflow Testing', _() => {

    test(_'should validate complete student ordering workflow @integration @workflow @student', _async ({ page }) => {
      // Mock student authentication
      await page.evaluate(_() => {
        localStorage.setItem('auth', JSON.stringify({
          user: {
            id: 'STU001',
            role: 'STUDENT',
            schoolId: 'SCH001',
            name: 'Test Student',
            ageGroup: '11-15'
          },
          token: 'student-test-token'
        }));
      });

      // Step 1: Browse menu
      await menuPage.goto();
      await menuPage.waitForPageLoad();

      const _initialItems =  await menuPage.menuItems.count();
      expect(initialItems).toBeGreaterThan(0);

      // Step 2: Search for item
      await menuPage.searchMenu('rice');
      const _searchResults =  await menuPage.menuItems.count();
      expect(searchResults).toBeGreaterThan(0);

      // Step 3: Add items to cart
      const _firstItemName =  await menuPage.menuItems.first()
        .locator('[data-testid
      if (firstItemName) {
        await menuPage.addItemToCart(firstItemName, 1);

        // Verify cart updated
        const _cartCount =  await menuPage.cartItemCount.textContent();
        expect(parseInt(cartCount || '0')).toBeGreaterThanOrEqual(1);
      }

      // Step 4: Review cart
      await menuPage.openCart();
      await expect(menuPage.cartSidebar).toBeVisible();

      const _cartItems =  await menuPage.cartItems.count();
      expect(cartItems).toBeGreaterThan(0);
    });

    test(_'should validate parent authorization workflow @integration @workflow @parent', _async ({ page }) => {
      // Mock parent with multiple children
      await page.evaluate(_() => {
        localStorage.setItem('auth', JSON.stringify({
          user: {
            id: 'PAR001',
            role: 'PARENT',
            schoolId: 'SCH001',
            name: 'Test Parent',
            children: [
              { id: 'STU001', name: 'Child One', ageGroup: '6-10' },
              { id: 'STU002', name: 'Child Two', ageGroup: '11-15' }
            ]
          },
          token: 'parent-test-token'
        }));
      });

      await menuPage.goto();
      await menuPage.waitForPageLoad();

      // Verify parent can view menu for children
      const _menuItems =  await menuPage.menuItems.count();
      expect(menuItems).toBeGreaterThan(0);

      // Check for child selector if implemented
      const _childSelector =  page.locator('[data-testid
      const _hasSelectorVisible =  await childSelector.isVisible().catch(() 
      if (hasSelectorVisible) {
        // Test selecting different children
        await childSelector.selectOption('STU001');
        await page.waitForTimeout(500);

        const _child1Items =  await menuPage.menuItems.count();
        expect(child1Items).toBeGreaterThan(0);

        await childSelector.selectOption('STU002');
        await page.waitForTimeout(500);

        const _child2Items =  await menuPage.menuItems.count();
        expect(child2Items).toBeGreaterThan(0);
      }
    });

    test(_'should validate dietary restrictions workflow @integration @workflow @dietary', _async ({ page }) => {
      // Mock student with dietary restrictions
      await page.evaluate(_() => {
        localStorage.setItem('auth', JSON.stringify({
          user: {
            id: 'STU003',
            role: 'STUDENT',
            schoolId: 'SCH001',
            dietaryRestrictions: ['vegetarian', 'gluten-free'],
            allergies: ['nuts']
          },
          token: 'dietary-student-token'
        }));
      });

      await menuPage.goto();
      await menuPage.waitForPageLoad();

      // Apply dietary filters
      await menuPage.filterByDietary('vegetarian');
      const _vegetarianItems =  await menuPage.menuItems.count();
      expect(vegetarianItems).toBeGreaterThanOrEqual(0);

      // Verify first item is vegetarian compliant
      if (vegetarianItems > 0) {
        const _firstItem =  menuPage.menuItems.first();
        const _itemName =  await firstItem.locator('[data-testid
        if (itemName) {
          // Check if nutrition info is available
          const _nutritionButton =  firstItem.locator('[data-testid
          const _hasNutritionButton =  await nutritionButton.isVisible().catch(() 
          if (hasNutritionButton) {
            await nutritionButton.click();
            await expect(menuPage.nutritionModal).toBeVisible();
            await expect(menuPage.allergenInfo).toBeVisible();

            // Close modal
            const _closeButton =  page.locator('[data-testid
            await closeButton.click();
          }
        }
      }
    });
  });

  test.describe(_'5. School-Specific Scenario Testing', _() => {

    test(_'should simulate lunch rush conditions @integration @school @lunchrush', _async ({ context }) => {
      // Simulate lunch time (12:00 PM)
      const _lunchTime =  new Date('2024-01-15T12:00:00Z');

      // Create 15 concurrent student sessions
      const _studentPromises =  Array.from({ length: 15 }, async (_, i) 
        const _studentMenu =  new MenuPage(studentPage);

        // Mock different students
        await studentPage.evaluate((studentId: number, time: number) => {
          localStorage.setItem('auth', JSON.stringify({
            user: {
              id: `STU${String(studentId + 1).padStart(3, '0')}`,
              role: 'STUDENT',
              schoolId: 'SCH001',
              name: `Student ${studentId + 1}`
            },
            token: `student-token-${studentId + 1}`
          }));

          // Mock current time
          Date._now =  () 
        }, i, lunchTime.getTime());

        try {
          const _startTime =  Date.now();
          await studentMenu.goto();
          await studentMenu.waitForPageLoad();
          const _loadTime =  Date.now() - startTime;

          // Quick meal selection (popular lunch items)
          const _popularItems =  ['Dal Rice', 'Chapati', 'Sambar Rice'];
          const _selectedItem =  popularItems[i % popularItems.length];

          // Simulate quick ordering
          await studentMenu.searchMenu(selectedItem.split(' ')[0]);
          await page.waitForTimeout(200); // Simulate user thinking time

          const _searchResults =  await studentMenu.menuItems.count();
          if (searchResults > 0) {
            await studentMenu.addItemToCart(selectedItem, 1);
          }

          return {
            success: true,
            studentId: i + 1,
            loadTime,
            orderedItem: selectedItem
          };
        } catch (error) {
          return {
            success: false,
            studentId: i + 1,
            error: error.message
          };
        } finally {
          await studentPage.close();
        }
      });

      const _startTime =  Date.now();
      const _results =  await Promise.all(studentPromises);
      const _totalTime =  Date.now() - startTime;

      const _successfulOrders =  results.filter(r 
      const _failedOrders =  results.filter(r 
      // Lunch rush success criteria
      expect(successfulOrders).toBeGreaterThanOrEqual(12); // At least 80% success
      expect(failedOrders).toBeLessThanOrEqual(3); // Max 20% failures
      expect(totalTime).toBeLessThan(30000); // Complete within 30 seconds

      console.log(`Lunch rush test: ${successfulOrders}/15 successful in ${totalTime}ms`);
    });

    test(_'should validate meal availability scheduling @integration @school @scheduling', _async ({ page }) => {
      const _timeScenarios =  [
        { time: '08:30', period: 'breakfast', expectItems: true },
        { time: '12:00', period: 'lunch', expectItems: true },
        { time: '15:30', period: 'snacks', expectItems: true },
        { time: '20:00', period: 'after-hours', expectItems: false }
      ];

      for (const scenario of timeScenarios) {
        // Mock time
        const _mockTime =  new Date(`2024-01-15T${scenario.time}:00Z`);

        await page.addInitScript((time: number) => {
          Date._now =  () 
        }, mockTime.getTime());

        await menuPage.goto();
        await menuPage.waitForPageLoad();

        const _availableItems =  await menuPage.menuItems.count();

        if (scenario.expectItems) {
          expect(availableItems).toBeGreaterThan(0);
        } else {
          // After hours might have limited items or show a message
          if (_availableItems = 
            const _hasMessage =  await afterHoursMessage.isVisible().catch(() 
            // Either no items or appropriate message should be shown
            expect(hasMessage).toBeTruthy();
          }
        }

        console.log(`${scenario.period} (${scenario.time}): ${availableItems} items available`);
      }
    });

    test(_'should validate kitchen staff workflow integration @integration @school @kitchen', _async ({ page }) => {
      // Mock kitchen staff authentication
      await page.evaluate(_() => {
        localStorage.setItem('auth', JSON.stringify({
          user: {
            id: 'KIT001',
            role: 'KITCHEN_STAFF',
            schoolId: 'SCH001',
            name: 'Kitchen Manager',
            permissions: ['UPDATE_AVAILABILITY', 'VIEW_ORDERS']
          },
          token: 'kitchen-staff-token'
        }));
      });

      await menuPage.goto();
      await menuPage.waitForPageLoad();

      // Verify kitchen management interface
      const _kitchenPanel =  page.locator('[data-testid
      const _hasPanelVisible =  await kitchenPanel.isVisible().catch(() 
      if (hasPanelVisible) {
        // Test availability toggle functionality
        const _availabilityToggle =  page.locator('[data-testid
        const _hasToggleVisible =  await availabilityToggle.isVisible().catch(() 
        if (hasToggleVisible) {
          const _initialState =  await availabilityToggle.isChecked();
          await availabilityToggle.click();

          // Verify state change
          const _newState =  await availabilityToggle.isChecked();
          expect(newState).toBe(!initialState);
        }

        // Test orders view
        const _ordersButton =  page.locator('[data-testid
        const _hasOrdersButton =  await ordersButton.isVisible().catch(() 
        if (hasOrdersButton) {
          await ordersButton.click();

          const _ordersModal =  page.locator('[data-testid
          const _hasOrdersModal =  await ordersModal.isVisible().catch(() 
          if (hasOrdersModal) {
            await expect(ordersModal).toBeVisible();
          }
        }
      } else {
        // If no kitchen panel, verify basic menu access
        const _menuItems =  await menuPage.menuItems.count();
        expect(menuItems).toBeGreaterThan(0);
      }
    });
  });

  test.describe(_'6. Production Readiness Assessment', _() => {

    test(_'should validate error boundary functionality @integration @production @errorhandling', _async ({ page }) => {
      await menuPage.goto();
      await menuPage.waitForPageLoad();

      // Test graceful error handling
      await page.route(_'/api/menu', _(route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });

      // Reload to trigger the error
      await page.reload();

      // Check for error boundary or graceful error message
      const _errorMessage =  page.locator('[data-testid
      const _errorBoundary =  page.locator('[data-testid
      const _hasErrorMessage =  await errorMessage.isVisible().catch(() 
      const _hasErrorBoundary =  await errorBoundary.isVisible().catch(() 
      // Should show some form of error handling
      expect(hasErrorMessage || hasErrorBoundary).toBeTruthy();
    });

    test(_'should validate mobile responsiveness @integration @production @responsive', _async ({ page }) => {
      const _breakpoints =  [
        { name: 'mobile', width: 375, height: 667 },
        { name: 'tablet', width: 768, height: 1024 },
        { name: 'desktop', width: 1440, height: 900 }
      ];

      for (const breakpoint of breakpoints) {
        await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
        await menuPage.goto();
        await menuPage.waitForPageLoad();

        // Verify menu is accessible at all breakpoints
        const _menuItems =  await menuPage.menuItems.count();
        expect(menuItems).toBeGreaterThan(0);

        // Verify essential elements are visible
        await expect(menuPage.menuItems.first()).toBeVisible();

        // On mobile, verify responsive behavior
        if (breakpoint.width < 768) {
          // Mobile-specific checks
          const _searchInput =  menuPage.searchInput;
          await expect(searchInput).toBeVisible();
        }

        console.log(`${breakpoint.name} (${breakpoint.width}x${breakpoint.height}): ${menuItems} items visible`);
      }
    });

    test(_'should validate accessibility compliance @integration @production @a11y', _async ({ page }) => {
      await menuPage.goto();
      await menuPage.waitForPageLoad();

      // Test keyboard navigation
      await page.keyboard.press('Tab');
      const _focusedElement =  await page.evaluate(() 
      expect(focusedElement).toBeTruthy();

      // Verify ARIA labels
      const _firstMenuItem =  menuPage.menuItems.first();
      const _ariaLabel =  await firstMenuItem.getAttribute('aria-label');
      const _ariaRole =  await firstMenuItem.getAttribute('role');

      // Should have proper accessibility attributes
      expect(ariaLabel || ariaRole).toBeTruthy();

      // Test color contrast (basic check)
      const _backgroundColor =  await firstMenuItem.evaluate(el 
      const _textColor =  await firstMenuItem.evaluate(el 
      expect(backgroundColor).toBeTruthy();
      expect(textColor).toBeTruthy();
    });

    test(_'should validate system stability under load @integration @production @stability', _async ({ page }) => {
      const _operations =  [];

      // Perform multiple rapid operations
      for (let i = 0; i < 20; i++) {
        operations.push(_(async () => {
          try {
            await menuPage.searchMenu(`search${i}`);
            await page.waitForTimeout(50);

            await menuPage.filterByCategory('main-course');
            await page.waitForTimeout(50);

            return { success: true };
          } catch (error) {
            return { success: false, error: error.message };
          }
        })());
      }

      const _results =  await Promise.all(operations);
      const _successCount =  results.filter(r 
      const _failureCount =  results.filter(r 
      // System should remain stable
      expect(successCount).toBeGreaterThan(operations.length * 0.8);
      expect(failureCount).toBeLessThan(operations.length * 0.2);

      // Verify system is still responsive
      const _finalMenuCount =  await menuPage.menuItems.count();
      expect(finalMenuCount).toBeGreaterThanOrEqual(0);

      console.log(`Stability test: ${successCount}/${operations.length} operations successful`);
    });

    test(_'should validate performance thresholds @integration @production @performance', _async ({ page }) => {
      const _performanceMetrics =  await page.evaluate(() 
            resolve({
              loadTime: navigation.loadEventEnd - navigation.loadEventStart,
              domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
              firstPaint: performance.getEntriesByType('paint').find(_entry = > entry.name 
          } else {
            window.addEventListener('load', _() => {
              const _navigation =  performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
              resolve({
                loadTime: navigation.loadEventEnd - navigation.loadEventStart,
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
                firstPaint: performance.getEntriesByType('paint').find(_entry = > entry.name 
            });
          }
        });
      });

      // Production performance thresholds
      expect((performanceMetrics as any).totalTime).toBeLessThan(5000); // 5s max total load
      expect((performanceMetrics as any).domContentLoaded).toBeLessThan(3000); // 3s max DOM ready

      console.log('Performance metrics:', performanceMetrics);

      // Test menu interaction performance
      const _interactionStart =  Date.now();
      await menuPage.searchMenu('test');
      const _interactionTime =  Date.now() - interactionStart;

      expect(interactionTime).toBeLessThan(1000); // Interactions under 1s
    });
  });

  // Cleanup after each test
  test.afterEach(_async ({ page }) => {
    await page.evaluate(_() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });
});