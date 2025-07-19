import { test, expect } from '@playwright/test';

test.describe('Final Navigation Verification', () => {
  let modelId: string;
  const consoleErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    // Track console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
  });

  test('Complete navigation flow verification', async ({ page }) => {
    console.log('=== Testing New Navigation Structure ===');
    
    // 1. Navigate to models page
    await page.goto('/models');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'final-models-page.png', fullPage: true });
    console.log('✓ Models page loaded successfully');
    
    // 2. Click on a model to go to overview
    const modelCards = page.locator('.mantine-Card-root:has-text("Customer Order Management")');
    if (await modelCards.count() > 0) {
      const openButton = modelCards.first().locator('button:has-text("Open"), a:has-text("Open")');
      await openButton.click();
      await page.waitForLoadState('networkidle');
      
      // Extract model ID
      const url = page.url();
      const match = url.match(/\/models\/([^\/]+)$/);
      if (match) {
        modelId = match[1];
        console.log(`✓ Navigated to model overview: ${modelId}`);
      }
      
      // 3. Verify we're on the overview page
      await expect(page).toHaveURL(new RegExp(`/models/${modelId}$`));
      await page.screenshot({ path: 'final-overview-page.png', fullPage: true });
      
      // 4. Verify overview page contains expected elements
      await expect(page.locator('text=Open Model Editor')).toBeVisible();
      await expect(page.locator('text=Open App Previewer')).toBeVisible();
      await expect(page.locator('text=Entities')).toBeVisible();
      await expect(page.locator('text=Relationships')).toBeVisible();
      console.log('✓ Model overview page displays correctly with navigation buttons');
      
      // 5. Test "Open Model Editor" button
      await page.locator('text=Open Model Editor').click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(new RegExp(`/models/${modelId}/editor`));
      await page.screenshot({ path: 'final-model-editor.png', fullPage: true });
      console.log('✓ Model Editor navigation works correctly');
      
      // 6. Go back to overview
      await page.goto(`/models/${modelId}`);
      await page.waitForLoadState('networkidle');
      
      // 7. Test "Open App Previewer" button
      await page.locator('text=Open App Previewer').click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(new RegExp(`/models/${modelId}/previewer`));
      await page.screenshot({ path: 'final-app-previewer.png', fullPage: true });
      console.log('✓ App Previewer navigation works correctly');
      
      // 8. Test direct URL navigation
      await page.goto(`/models/${modelId}/editor`);
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(`/models/${modelId}/editor`);
      console.log('✓ Direct editor URL access works');
      
      await page.goto(`/models/${modelId}/previewer`);
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(`/models/${modelId}/previewer`);
      console.log('✓ Direct previewer URL access works');
      
      await page.goto(`/models/${modelId}`);
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(`/models/${modelId}`);
      console.log('✓ Direct overview URL access works');
      
      // 9. Final comprehensive screenshot
      await page.screenshot({ path: 'final-verification-complete.png', fullPage: true });
      
      console.log('=== Navigation Testing Complete ===');
      console.log(`Model ID used for testing: ${modelId}`);
      console.log(`Console errors encountered: ${consoleErrors.length}`);
      
      if (consoleErrors.length > 0) {
        console.log('Console errors:', consoleErrors);
      }
      
      // Summary assertions
      expect(modelId).toBeDefined();
      expect(modelId).not.toBe('');
      
    } else {
      throw new Error('No model cards found to test navigation');
    }
  });
  
  test('Navigation from different entry points', async ({ page }) => {
    // Test navigation from home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to models
    const modelsLink = page.locator('a[href="/models"], button:has-text("Models")');
    if (await modelsLink.isVisible()) {
      await modelsLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL('/models');
      console.log('✓ Navigation from home to models works');
    }
    
    // Test header navigation
    const headerModelsLink = page.locator('header a[href="/models"], nav a[href="/models"]');
    if (await headerModelsLink.isVisible()) {
      await headerModelsLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL('/models');
      console.log('✓ Header navigation to models works');
    }
    
    await page.screenshot({ path: 'final-navigation-complete.png', fullPage: true });
  });
});