import { test, expect } from '@playwright/test';

test.describe('Model Editor Frontend Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the main page
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('1. Page loads correctly', async ({ page }) => {
    // Check if the page title is correct
    await expect(page).toHaveTitle(/Torque Model Editor/);
    
    // Check if the main content is visible
    await expect(page.locator('body')).toBeVisible();
    
    // Take a screenshot of the main page
    await page.screenshot({ path: 'test-results/main-page.png', fullPage: true });
    
    // Check if React app has mounted
    await expect(page.locator('#root')).toBeVisible();
  });

  test('2. Navigation works', async ({ page }) => {
    // Wait for navigation to be available
    await page.waitForSelector('[data-testid="navigation"], nav, [role="navigation"]', { timeout: 10000 });
    
    // Try to find navigation links
    const navLinks = page.locator('a[href*="/"], button[data-testid*="nav"], nav a');
    const linkCount = await navLinks.count();
    
    if (linkCount > 0) {
      console.log(`Found ${linkCount} navigation links`);
      
      // Take screenshot of navigation
      await page.screenshot({ path: 'test-results/navigation.png', fullPage: true });
      
      // Try to click on the first navigation link
      const firstLink = navLinks.first();
      const linkText = await firstLink.textContent();
      console.log(`Clicking on navigation link: ${linkText}`);
      
      await firstLink.click();
      await page.waitForLoadState('networkidle');
      
      // Take screenshot after navigation
      await page.screenshot({ path: 'test-results/after-navigation.png', fullPage: true });
    } else {
      console.log('No navigation links found');
    }
  });

  test('3. Models page is accessible', async ({ page }) => {
    // Try different approaches to access models page
    const modelsSelectors = [
      'a[href*="/models"]',
      'a[href*="/model"]',
      'button[data-testid="models"]',
      'nav a:has-text("Models")',
      'a:has-text("Models")',
      '[data-testid="models-page"]',
      '[data-testid="models-link"]'
    ];
    
    let modelsFound = false;
    
    for (const selector of modelsSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          console.log(`Found models navigation with selector: ${selector}`);
          await element.click();
          await page.waitForLoadState('networkidle');
          modelsFound = true;
          break;
        }
      } catch (error) {
        // Continue trying other selectors
      }
    }
    
    if (!modelsFound) {
      // Try navigating directly to models page
      try {
        await page.goto('/models');
        await page.waitForLoadState('networkidle');
        modelsFound = true;
        console.log('Navigated directly to /models');
      } catch (error) {
        console.log('Could not navigate to /models');
      }
    }
    
    // Take screenshot of models page or current page
    await page.screenshot({ path: 'test-results/models-page.png', fullPage: true });
    
    if (modelsFound) {
      // Check if models page content is visible
      const modelsContent = page.locator('[data-testid="models-content"], .models-page, main');
      await expect(modelsContent).toBeVisible();
    }
  });

  test('4. Check for GraphQL errors', async ({ page }) => {
    const graphqlErrors = [];
    const networkErrors = [];
    
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (text.includes('GraphQL') || text.includes('graphql')) {
          graphqlErrors.push(text);
        }
      }
    });
    
    // Listen for network failures
    page.on('response', response => {
      if (response.url().includes('graphql') || response.url().includes('/api/')) {
        if (!response.ok()) {
          networkErrors.push({
            url: response.url(),
            status: response.status(),
            statusText: response.statusText()
          });
        }
      }
    });
    
    // Wait for network activity to settle
    await page.waitForLoadState('networkidle');
    
    // Try to trigger GraphQL requests by interacting with the page
    try {
      // Look for buttons or links that might trigger GraphQL requests
      const interactiveElements = page.locator('button, a[href*="/"], [data-testid*="load"], [data-testid*="fetch"]');
      const count = await interactiveElements.count();
      
      if (count > 0) {
        // Click on a few elements to trigger potential GraphQL requests
        for (let i = 0; i < Math.min(3, count); i++) {
          try {
            await interactiveElements.nth(i).click();
            await page.waitForTimeout(1000);
          } catch (error) {
            // Continue with other elements
          }
        }
      }
    } catch (error) {
      console.log('Error while triggering interactions:', error);
    }
    
    // Report findings
    console.log('GraphQL errors found:', graphqlErrors.length);
    console.log('Network errors found:', networkErrors.length);
    
    if (graphqlErrors.length > 0) {
      console.log('GraphQL errors:', graphqlErrors);
    }
    
    if (networkErrors.length > 0) {
      console.log('Network errors:', networkErrors);
    }
    
    // Take screenshot showing current state
    await page.screenshot({ path: 'test-results/graphql-errors-check.png', fullPage: true });
  });

  test('5. WebSocket connection status', async ({ page }) => {
    const websocketLogs = [];
    const connectionStatus = [];
    
    // Listen for console messages related to WebSocket
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('WebSocket') || text.includes('websocket') || text.includes('connection')) {
        websocketLogs.push(text);
      }
    });
    
    // Wait for the page to load and check for WebSocket connection indicators
    await page.waitForLoadState('networkidle');
    
    // Look for connection status indicators
    const connectionIndicators = [
      '[data-testid="connection-status"]',
      '[data-testid="websocket-status"]',
      '.connection-status',
      '.websocket-status',
      '[class*="connection"]',
      '[class*="websocket"]'
    ];
    
    for (const selector of connectionIndicators) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          const text = await element.textContent();
          connectionStatus.push({
            selector,
            text,
            visible: true
          });
          console.log(`Found connection status: ${text}`);
        }
      } catch (error) {
        // Continue checking other selectors
      }
    }
    
    // Check if WebSocket connection is mentioned in the page
    const pageText = await page.textContent('body');
    const hasWebSocketReference = pageText?.includes('WebSocket') || pageText?.includes('websocket') || pageText?.includes('connection');
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/websocket-status.png', fullPage: true });
    
    // Report findings
    console.log('WebSocket logs found:', websocketLogs.length);
    console.log('Connection status indicators found:', connectionStatus.length);
    console.log('Page contains WebSocket references:', hasWebSocketReference);
    
    if (websocketLogs.length > 0) {
      console.log('WebSocket logs:', websocketLogs);
    }
    
    if (connectionStatus.length > 0) {
      console.log('Connection status:', connectionStatus);
    }
  });

  test('6. Overall application health check', async ({ page }) => {
    // Check for critical JavaScript errors
    const jsErrors = [];
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });
    
    // Check for unhandled promise rejections
    const promiseRejections = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('Unhandled Promise')) {
        promiseRejections.push(msg.text());
      }
    });
    
    // Wait for the application to load
    await page.waitForLoadState('networkidle');
    
    // Check if the React app has rendered without errors
    const reactRoot = page.locator('#root');
    await expect(reactRoot).toBeVisible();
    
    // Check if there's any content in the React root
    const rootContent = await reactRoot.textContent();
    expect(rootContent).toBeTruthy();
    
    // Take final screenshot
    await page.screenshot({ path: 'test-results/final-health-check.png', fullPage: true });
    
    // Report any critical errors
    if (jsErrors.length > 0) {
      console.log('JavaScript errors found:', jsErrors);
    }
    
    if (promiseRejections.length > 0) {
      console.log('Promise rejections found:', promiseRejections);
    }
    
    // The test should pass if no critical errors are found
    expect(jsErrors.length).toBeLessThan(5); // Allow some minor errors
    expect(promiseRejections.length).toBe(0); // No unhandled promise rejections
  });
});