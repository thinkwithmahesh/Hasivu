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
