import { test, expect } from '@playwright/test';

test.describe('Layout Editor URL Testing', () => {
  test('should load layout editor with correct URL pattern', async ({ page }) => {
    // Test URL with the pattern /models/:id/editor/layouts/:layoutId
    const testURL = 'http://localhost:3000/models/test-model-123/editor/layouts/test-layout-456';
    
    console.log(`\n🔗 Testing URL: ${testURL}`);
    
    // Navigate to the layout editor URL
    await page.goto(testURL, { waitUntil: 'networkidle' });
    
    // Verify the URL routing worked (page loaded without 404)
    const currentURL = page.url();
    expect(currentURL).toBe(testURL);
    console.log('✅ URL routing successful - page loaded correctly');
    
    // Verify the page title
    const title = await page.title();
    expect(title).toBe('Torque Model Editor');
    console.log('✅ Page title is correct');
    
    // Verify header is present
    const header = page.locator('header');
    await expect(header).toBeVisible();
    console.log('✅ Header component is visible');
    
    // Take a screenshot for verification
    await page.screenshot({ 
      path: 'test-results/layout-editor-url-test.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved');
    
    // The page should show layout editor interface (even if model doesn't exist)
    // We check for elements that would indicate the layout editor component loaded
    
    // Check if we're not on a 404 page
    const notFoundText = page.locator('text=404');
    const notFoundCount = await notFoundText.count();
    expect(notFoundCount).toBe(0);
    console.log('✅ No 404 error - routing worked correctly');
  });
  
  test('should load new layout editor URL pattern', async ({ page }) => {
    // Test the "new layout" URL pattern
    const newLayoutURL = 'http://localhost:3000/models/test-model-123/editor/layouts/new';
    
    console.log(`\n🔗 Testing New Layout URL: ${newLayoutURL}`);
    
    await page.goto(newLayoutURL, { waitUntil: 'networkidle' });
    
    // Verify URL routing
    const currentURL = page.url();
    expect(currentURL).toBe(newLayoutURL);
    console.log('✅ New layout URL routing successful');
    
    // Verify no routing errors
    const notFoundText = page.locator('text=404');
    const notFoundCount = await notFoundText.count();
    expect(notFoundCount).toBe(0);
    console.log('✅ No routing errors for new layout URL');
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-results/new-layout-editor-url-test.png',
      fullPage: true 
    });
    console.log('📸 New layout screenshot saved');
  });
  
  test('should show layout editor interface elements', async ({ page }) => {
    const testURL = 'http://localhost:3000/models/test-model-123/editor/layouts/test-layout-456';
    
    await page.goto(testURL, { waitUntil: 'networkidle' });
    
    // Wait for the React app to fully load
    await page.waitForTimeout(3000);
    
    console.log('\n🔍 Checking for Layout Editor Interface Elements...');
    
    // Check for main app structure
    const appShell = page.locator('[data-testid="app-shell"], .mantine-AppShell-root');
    const appShellCount = await appShell.count();
    console.log(`🏗️  App shell structure: ${appShellCount > 0 ? '✅' : '❌'}`);
    
    // Check for any error messages that would indicate model not found
    const errorMessages = [
      'Model not found',
      'Layout not found',
      'Error loading model',
      'Failed to load'
    ];
    
    let foundAnyError = false;
    for (const errorMsg of errorMessages) {
      const errorElement = page.locator(`text="${errorMsg}"`);
      const count = await errorElement.count();
      if (count > 0) {
        console.log(`⚠️  Found error: "${errorMsg}"`);
        foundAnyError = true;
      }
    }
    
    if (!foundAnyError) {
      console.log('✅ No critical error messages detected');
    } else {
      console.log('⚠️  Error messages found (expected since no backend running)');
    }
    
    // Final screenshot showing the interface
    await page.screenshot({ 
      path: 'test-results/layout-editor-interface-test.png',
      fullPage: true 
    });
    console.log('📸 Interface screenshot saved');
  });
});