import { test, expect } from '@playwright/test';

// E2E tests for Inventory actions: reorder and mark delivered

test.describe('Inventory Actions', () => {
  test('should reorder low-stock item and mark PO delivered', async ({ page }) => {
    const corsHeaders = {
      'access-control-allow-origin': '*',
      'access-control-allow-headers': '*',
      'access-control-allow-methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
      'content-type': 'application/json',
    } as const;

    // Mock GET inventory items with a low_stock item
    await page.route('**/inventory/items**', async route => {
      const method = route.request().method();
      if (method === 'OPTIONS') {
        await route.fulfill({ status: 200, headers: corsHeaders, body: '' });
        return;
      }
      await route.fulfill({
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          data: [
            { id: 'INV-LOW', name: 'Tomatoes', category: 'vegetables', sku: 'VEG-TOM-001', currentStock: 2, minStock: 10, maxStock: 30, unit: 'kg', costPerUnit: 30, totalValue: 60, supplier: { id: 'SUP-1', name: 'Veg Supplier' }, status: 'low_stock', usageRate: 5, daysUntilEmpty: 1, reorderPoint: 10 },
          ],
          success: true,
          message: 'ok',
          timestamp: new Date().toISOString(),
        })
      });
    });

    // Mock GET purchase orders initially empty
    await page.route('**/inventory/purchase-orders**', async route => {
      const method = route.request().method();
      if (method === 'OPTIONS') {
        await route.fulfill({ status: 200, headers: corsHeaders, body: '' });
        return;
      }
      await route.fulfill({
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify({ data: [], success: true, message: 'ok', timestamp: new Date().toISOString() })
      });
    });

    // Mock POST create purchase order
    await page.route('**/inventory/purchase-orders', async route => {
      const method = route.request().method();
      if (method === 'OPTIONS') {
        await route.fulfill({ status: 200, headers: corsHeaders, body: '' });
        return;
      }
      const body = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify({ data: { id: 'PO-NEW', orderNumber: 'PO-NEW-001', ...body }, success: true, message: 'created' })
      });
    });

    // After reorder, mock POs to include the new one with status 'sent'
    let poDelivered = false;
    await page.route('**/inventory/purchase-orders**', async route => {
      const method = route.request().method();
      if (method === 'OPTIONS') {
        await route.fulfill({ status: 200, headers: corsHeaders, body: '' });
        return;
      }
      const poData = poDelivered
        ? [{ id: 'PO-NEW', orderNumber: 'PO-NEW-001', status: 'delivered', supplier: { id: 'SUP-1', name: 'Veg Supplier' }, items: [{ itemId: 'INV-LOW', itemName: 'Tomatoes', quantity: 10, unitPrice: 30, totalPrice: 300 }], orderDate: new Date().toISOString(), expectedDelivery: new Date().toISOString(), totalAmount: 300, createdBy: 'Test' }]
        : [{ id: 'PO-NEW', orderNumber: 'PO-NEW-001', status: 'sent', supplier: { id: 'SUP-1', name: 'Veg Supplier' }, items: [{ itemId: 'INV-LOW', itemName: 'Tomatoes', quantity: 10, unitPrice: 30, totalPrice: 300 }], orderDate: new Date().toISOString(), expectedDelivery: new Date().toISOString(), totalAmount: 300, createdBy: 'Test' }];
      await route.fulfill({
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify({ data: poData, success: true, message: 'ok', timestamp: new Date().toISOString() })
      });
    });

    // Mock PATCH mark delivered
    await page.route('**/inventory/purchase-orders/PO-NEW/status', async route => {
      const method = route.request().method();
      if (method === 'OPTIONS') {
        await route.fulfill({ status: 200, headers: corsHeaders, body: '' });
        return;
      }
      poDelivered = true;
      await route.fulfill({ status: 200, headers: corsHeaders, body: JSON.stringify({ data: { id: 'PO-NEW', status: 'delivered' }, success: true }) });
    });

    // Mock PATCH stock add
    await page.route('**/inventory/items/INV-LOW/stock', async route => {
      const method = route.request().method();
      if (method === 'OPTIONS') {
        await route.fulfill({ status: 200, headers: corsHeaders, body: '' });
        return;
      }
      await route.fulfill({ status: 200, headers: corsHeaders, body: JSON.stringify({ data: { id: 'INV-LOW', quantity: 10 }, success: true }) });
    });

    // Go to page
    await page.goto('/inventory-management');

    // Reorder flow: wait for items to render then click reorder on low stock item
    await expect(page.getByTestId('inventory-item').first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Tomatoes')).toBeVisible();
    const reorderBtn = page.getByTestId('reorder-button-INV-LOW');
    await expect(reorderBtn).toBeVisible({ timeout: 10000 });
    await reorderBtn.click();

    // Submit dialog
    await expect(page.getByRole('heading', { name: 'Create Purchase Order' })).toBeVisible();
    await page.getByTestId('reorder-qty-input').fill('10');
    await page.getByTestId('reorder-submit').click();

    // Switch to orders tab implicitly happens after success; wait for mark delivered button
    const markBtn = page.getByTestId('mark-delivered-button-PO-NEW');
    await expect(markBtn).toBeVisible({ timeout: 10000 });
    await markBtn.click();

    // Verify delivered state reflected on re-fetch
    await expect(markBtn).toBeHidden({ timeout: 10000 });
  });
});
