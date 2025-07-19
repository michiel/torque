import { test, expect } from '@playwright/test';

test.describe('Simple Navigation Test', () => {
  
  test('should navigate through the app and take screenshots', async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-home-page.png', fullPage: true });
    
    // Navigate to models page
    await page.goto('/models');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-models-page.png', fullPage: true });
    
    // Try to click on a model
    const modelCards = page.locator('.mantine-Card-root:has-text("Customer Order Management")');
    const modelCount = await modelCards.count();
    console.log(`Found ${modelCount} model cards`);
    
    if (modelCount > 0) {
      // Click on the "Open" button in the first model card
      const openButton = modelCards.first().locator('button:has-text("Open"), a:has-text("Open")');
      await openButton.click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'test-model-overview.png', fullPage: true });
      
      console.log('Current URL after clicking model:', page.url());
      
      // Check if we're on the overview page
      const overviewElements = await page.locator('text=Open Model Editor').count();
      console.log(`Found ${overviewElements} "Open Model Editor" buttons`);
      
      // Try to click "Open Model Editor" if it exists
      if (overviewElements > 0) {
        await page.locator('text=Open Model Editor').click();
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'test-model-editor.png', fullPage: true });
        console.log('Model editor URL:', page.url());
        
        // Go back to overview
        await page.goBack();
        await page.waitForLoadState('networkidle');
        
        // Try App Previewer
        const previewerElements = await page.locator('text=Open App Previewer').count();
        console.log(`Found ${previewerElements} "Open App Previewer" buttons`);
        
        if (previewerElements > 0) {
          await page.locator('text=Open App Previewer').click();
          await page.waitForLoadState('networkidle');
          await page.screenshot({ path: 'test-app-previewer.png', fullPage: true });
          console.log('App previewer URL:', page.url());
        }
      }
      
      // Extract model ID for direct testing
      const url = page.url();
      const match = url.match(/\/models\/([^\/\?]+)/);
      if (match) {
        const modelId = match[1];
        console.log('Extracted model ID:', modelId);
        
        // Test direct navigation to editor
        await page.goto(`/models/${modelId}/editor`);
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'test-direct-editor.png', fullPage: true });
        console.log('Direct editor URL:', page.url());
        
        // Test direct navigation to previewer
        await page.goto(`/models/${modelId}/previewer`);
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'test-direct-previewer.png', fullPage: true });
        console.log('Direct previewer URL:', page.url());
        
        // Test direct navigation to overview
        await page.goto(`/models/${modelId}`);
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'test-direct-overview.png', fullPage: true });
        console.log('Direct overview URL:', page.url());
      }
    } else {
      console.log('No model cards found');
      console.log('Page content:', await page.textContent('body'));
    }
  });
});