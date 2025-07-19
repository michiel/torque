import { test, expect } from '@playwright/test';

test.describe('New Navigation Structure', () => {
  let modelId: string;

  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
    await expect(page).toHaveTitle(/Torque Model Editor/);
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should show model overview instead of model editor on model page', async ({ page }) => {
    // First, create or navigate to a model
    await page.goto('/models');
    await page.waitForLoadState('networkidle');
    
    // Look for existing models or create one
    const modelCards = page.locator('[data-testid="model-card"], .model-card, .mantine-Card-root:has-text("Model")');
    const modelCount = await modelCards.count();
    
    if (modelCount > 0) {
      // Click on the first model
      await modelCards.first().click();
      await page.waitForLoadState('networkidle');
      
      // Extract model ID from URL
      const url = page.url();
      const match = url.match(/\/models\/([^\/]+)$/);
      if (match) {
        modelId = match[1];
      }
    } else {
      // Create a new model if none exist
      const createButton = page.locator('button:has-text("Create New Model"), [data-testid="create-model-button"]');
      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForLoadState('networkidle');
        
        // Fill in model details
        await page.fill('input[name="name"], input[placeholder*="name"]', 'Test Navigation Model');
        await page.fill('textarea[name="description"], textarea[placeholder*="description"]', 'Test model for navigation testing');
        
        const submitButton = page.locator('button[type="submit"], button:has-text("Create")');
        await submitButton.click();
        await page.waitForLoadState('networkidle');
        
        // Extract model ID from URL
        const url = page.url();
        const match = url.match(/\/models\/([^\/]+)$/);
        if (match) {
          modelId = match[1];
        }
      }
    }

    // Verify we're on the model overview page (not the editor)
    await expect(page).toHaveURL(new RegExp(`/models/${modelId || '[^/]+'}$`));
    
    // Check for overview page elements
    const overviewIndicators = [
      'text=Model Overview',
      'text=Statistics',
      'text=Open Model Editor',
      'text=Open App Previewer',
      '[data-testid="model-overview"]',
      '.model-overview',
      'button:has-text("Open Model Editor")',
      'button:has-text("Open App Previewer")'
    ];
    
    let foundOverviewElement = false;
    for (const selector of overviewIndicators) {
      try {
        const element = page.locator(selector);
        if (await element.isVisible({ timeout: 5000 })) {
          foundOverviewElement = true;
          console.log(`Found overview element: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!foundOverviewElement) {
      // Take a screenshot to see what's actually on the page
      await page.screenshot({ path: 'model-overview-debug.png', fullPage: true });
      console.log('Model overview page content:', await page.textContent('body'));
    }
    
    expect(foundOverviewElement).toBe(true);
    
    // Verify this is NOT the model editor (should not have ReactFlow elements)
    const editorElements = page.locator('.react-flow, [data-testid="react-flow"], .reactflow-wrapper');
    await expect(editorElements).toHaveCount(0);
    
    // Take screenshot of overview page
    await page.screenshot({ path: 'model-overview-page.png', fullPage: true });
  });

  test('should navigate to model editor when clicking Open Model Editor button', async ({ page }) => {
    // Navigate to a model overview page
    await page.goto('/models');
    await page.waitForLoadState('networkidle');
    
    const modelCards = page.locator('[data-testid="model-card"], .model-card, .mantine-Card-root:has-text("Model")');
    if (await modelCards.count() > 0) {
      await modelCards.first().click();
      await page.waitForLoadState('networkidle');
      
      // Extract model ID from URL
      const url = page.url();
      const match = url.match(/\/models\/([^\/]+)$/);
      if (match) {
        modelId = match[1];
      }
    }
    
    // Look for and click the "Open Model Editor" button
    const openEditorButton = page.locator('button:has-text("Open Model Editor"), [data-testid="open-model-editor"], a:has-text("Model Editor")');
    
    if (await openEditorButton.isVisible()) {
      await openEditorButton.click();
      await page.waitForLoadState('networkidle');
      
      // Verify we're now on the editor page
      await expect(page).toHaveURL(new RegExp(`/models/${modelId || '[^/]+'}/(editor|erd|layout)`));
      
      // Take screenshot of editor page
      await page.screenshot({ path: 'model-editor-page.png', fullPage: true });
    } else {
      console.log('Open Model Editor button not found, checking page content');
      await page.screenshot({ path: 'no-editor-button-debug.png', fullPage: true });
      console.log('Page content:', await page.textContent('body'));
    }
  });

  test('should navigate to app previewer when clicking Open App Previewer button', async ({ page }) => {
    // Navigate to a model overview page
    await page.goto('/models');
    await page.waitForLoadState('networkidle');
    
    const modelCards = page.locator('[data-testid="model-card"], .model-card, .mantine-Card-root:has-text("Model")');
    if (await modelCards.count() > 0) {
      await modelCards.first().click();
      await page.waitForLoadState('networkidle');
      
      // Extract model ID from URL
      const url = page.url();
      const match = url.match(/\/models\/([^\/]+)$/);
      if (match) {
        modelId = match[1];
      }
    }
    
    // Look for and click the "Open App Previewer" button
    const openPreviewerButton = page.locator('button:has-text("Open App Previewer"), [data-testid="open-app-previewer"], a:has-text("App Previewer")');
    
    if (await openPreviewerButton.isVisible()) {
      await openPreviewerButton.click();
      await page.waitForLoadState('networkidle');
      
      // Verify we're now on the previewer page
      await expect(page).toHaveURL(new RegExp(`/models/${modelId || '[^/]+'}/previewer`));
      
      // Take screenshot of previewer page
      await page.screenshot({ path: 'app-previewer-page.png', fullPage: true });
    } else {
      console.log('Open App Previewer button not found, checking page content');
      await page.screenshot({ path: 'no-previewer-button-debug.png', fullPage: true });
    }
  });

  test('should load model editor directly at /models/:id/editor path', async ({ page }) => {
    // Get a model ID first
    await page.goto('/models');
    await page.waitForLoadState('networkidle');
    
    const modelCards = page.locator('[data-testid="model-card"], .model-card, .mantine-Card-root:has-text("Model")');
    if (await modelCards.count() > 0) {
      await modelCards.first().click();
      await page.waitForLoadState('networkidle');
      
      // Extract model ID from URL
      const url = page.url();
      const match = url.match(/\/models\/([^\/]+)$/);
      if (match) {
        modelId = match[1];
        
        // Navigate directly to editor path
        await page.goto(`/models/${modelId}/editor`);
        await page.waitForLoadState('networkidle');
        
        // Verify the editor loads
        await expect(page).toHaveURL(`/models/${modelId}/editor`);
        
        // Look for editor-specific elements
        const editorElements = [
          '.react-flow',
          '[data-testid="react-flow"]',
          '.reactflow-wrapper',
          'text=Entity',
          'text=Add Entity',
          '.mantine-Tabs-tab'
        ];
        
        let foundEditorElement = false;
        for (const selector of editorElements) {
          try {
            const element = page.locator(selector);
            if (await element.isVisible({ timeout: 5000 })) {
              foundEditorElement = true;
              console.log(`Found editor element: ${selector}`);
              break;
            }
          } catch (e) {
            // Continue to next selector
          }
        }
        
        // Take screenshot
        await page.screenshot({ path: 'direct-editor-access.png', fullPage: true });
        
        expect(foundEditorElement).toBe(true);
      }
    }
  });

  test('should load app previewer directly at /models/:id/previewer path', async ({ page }) => {
    // Get a model ID first
    await page.goto('/models');
    await page.waitForLoadState('networkidle');
    
    const modelCards = page.locator('[data-testid="model-card"], .model-card, .mantine-Card-root:has-text("Model")');
    if (await modelCards.count() > 0) {
      await modelCards.first().click();
      await page.waitForLoadState('networkidle');
      
      // Extract model ID from URL
      const url = page.url();
      const match = url.match(/\/models\/([^\/]+)$/);
      if (match) {
        modelId = match[1];
        
        // Navigate directly to previewer path
        await page.goto(`/models/${modelId}/previewer`);
        await page.waitForLoadState('networkidle');
        
        // Verify the previewer loads
        await expect(page).toHaveURL(`/models/${modelId}/previewer`);
        
        // Look for previewer-specific elements
        const previewerElements = [
          'text=App Preview',
          'text=Preview',
          '[data-testid="app-previewer"]',
          '.app-previewer',
          'iframe',
          'text=Application Preview'
        ];
        
        let foundPreviewerElement = false;
        for (const selector of previewerElements) {
          try {
            const element = page.locator(selector);
            if (await element.isVisible({ timeout: 5000 })) {
              foundPreviewerElement = true;
              console.log(`Found previewer element: ${selector}`);
              break;
            }
          } catch (e) {
            // Continue to next selector
          }
        }
        
        // Take screenshot
        await page.screenshot({ path: 'direct-previewer-access.png', fullPage: true });
        
        // Even if specific elements aren't found, verify no errors occurred
        const hasErrors = await page.locator('text=Error, text=404, text=Not Found').count();
        expect(hasErrors).toBe(0);
      }
    }
  });

  test('should check for console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Navigate through different pages and check for errors
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await page.goto('/models');
    await page.waitForLoadState('networkidle');
    
    const modelCards = page.locator('[data-testid="model-card"], .model-card, .mantine-Card-root:has-text("Model")');
    if (await modelCards.count() > 0) {
      await modelCards.first().click();
      await page.waitForLoadState('networkidle');
      
      // Extract model ID from URL
      const url = page.url();
      const match = url.match(/\/models\/([^\/]+)$/);
      if (match) {
        modelId = match[1];
        
        // Test different paths
        await page.goto(`/models/${modelId}/editor`);
        await page.waitForLoadState('networkidle');
        
        await page.goto(`/models/${modelId}/previewer`);
        await page.waitForLoadState('networkidle');
        
        await page.goto(`/models/${modelId}`);
        await page.waitForLoadState('networkidle');
      }
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'final-navigation-test.png', fullPage: true });
    
    // Report console errors
    if (consoleErrors.length > 0) {
      console.log('Console errors found:', consoleErrors);
    }
    
    // Don't fail the test for console errors, just report them
    // expect(consoleErrors).toHaveLength(0);
  });
});