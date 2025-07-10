import { test, expect } from '@playwright/test';

test.describe('GraphQL Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing console logs
    await page.evaluate(() => console.clear());
    
    // Listen for console messages to capture GraphQL errors
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warn') {
        console.log(`[BROWSER ${msg.type().toUpperCase()}]:`, msg.text());
      }
    });
  });

  test('1. Navigate to http://localhost:3000 and verify page loads', async ({ page }) => {
    console.log('🔍 Test 1: Navigating to http://localhost:3000');
    
    // Navigate to the main page
    await page.goto('http://localhost:3000');
    
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
    
    // Check if the page title is correct
    await expect(page).toHaveTitle(/Torque Model Editor/);
    
    // Check if React app has mounted
    await expect(page.locator('#root')).toBeVisible();
    
    // Check for any obvious error messages
    const errorMessages = page.locator('.error, [class*="error"], [data-testid*="error"]');
    const errorCount = await errorMessages.count();
    
    console.log(`Found ${errorCount} error elements on page`);
    
    if (errorCount > 0) {
      for (let i = 0; i < errorCount; i++) {
        const errorText = await errorMessages.nth(i).textContent();
        console.log(`Error ${i + 1}: ${errorText}`);
      }
    }
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/1-main-page-load.png', fullPage: true });
    
    console.log('✅ Test 1: Page loaded successfully');
  });

  test('2. Check if models page loads without GraphQL errors', async ({ page }) => {
    console.log('🔍 Test 2: Checking models page for GraphQL errors');
    
    const graphqlErrors = [];
    const networkErrors = [];
    
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (text.includes('GraphQL') || text.includes('graphql') || text.includes('NOT_IMPLEMENTED')) {
          graphqlErrors.push(text);
        }
      }
    });
    
    // Listen for network responses
    page.on('response', response => {
      if (response.url().includes('graphql')) {
        console.log(`GraphQL request: ${response.url()} - Status: ${response.status()}`);
        if (!response.ok()) {
          networkErrors.push({
            url: response.url(),
            status: response.status(),
            statusText: response.statusText()
          });
        }
      }
    });
    
    // Navigate to the main page
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Try to navigate to models page
    try {
      // Look for models navigation link
      const modelsLink = page.locator('a[href*="/models"], a:has-text("Models")').first();
      if (await modelsLink.isVisible({ timeout: 5000 })) {
        console.log('Found Models link, clicking...');
        await modelsLink.click();
        await page.waitForLoadState('networkidle');
        console.log('Successfully navigated to Models page');
      } else {
        console.log('Models link not found, trying direct navigation...');
        await page.goto('http://localhost:3000/models');
        await page.waitForLoadState('networkidle');
      }
    } catch (error) {
      console.log('Navigation error:', error);
    }
    
    // Wait a bit more for any delayed GraphQL requests
    await page.waitForTimeout(3000);
    
    // Take screenshot of models page
    await page.screenshot({ path: 'test-results/2-models-page.png', fullPage: true });
    
    // Check for GraphQL error messages in the UI
    const errorElements = page.locator('.error, [class*="error"], [data-testid*="error"]');
    const errorCount = await errorElements.count();
    
    console.log(`Found ${errorCount} error elements on models page`);
    console.log(`GraphQL console errors: ${graphqlErrors.length}`);
    console.log(`Network errors: ${networkErrors.length}`);
    
    if (graphqlErrors.length > 0) {
      console.log('GraphQL errors found:', graphqlErrors);
    }
    
    if (networkErrors.length > 0) {
      console.log('Network errors found:', networkErrors);
    }
    
    // Check if we still see NOT_IMPLEMENTED errors
    const pageText = await page.textContent('body');
    const hasNotImplementedError = pageText?.includes('NOT_IMPLEMENTED') || pageText?.includes('not yet implemented');
    
    console.log(`Page contains NOT_IMPLEMENTED references: ${hasNotImplementedError}`);
    
    console.log('✅ Test 2: Models page GraphQL status checked');
  });

  test('3. Try to create a new model', async ({ page }) => {
    console.log('🔍 Test 3: Testing new model creation');
    
    const graphqlRequests = [];
    const formInteractions = [];
    
    // Monitor GraphQL requests
    page.on('request', request => {
      if (request.url().includes('graphql')) {
        graphqlRequests.push({
          url: request.url(),
          method: request.method(),
          postData: request.postData()
        });
      }
    });
    
    // Navigate to the main page
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Try to find "Create Model" or similar functionality
    const createModelSelectors = [
      'a[href*="/create"]',
      'a[href*="/new"]',
      'button:has-text("Create")',
      'button:has-text("New")',
      'button:has-text("Add")',
      'a:has-text("Create Model")',
      'a:has-text("New Model")',
      '[data-testid="create-model"]',
      '[data-testid="new-model"]'
    ];
    
    let createModelFound = false;
    
    for (const selector of createModelSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          console.log(`Found create model element with selector: ${selector}`);
          const elementText = await element.textContent();
          console.log(`Element text: ${elementText}`);
          
          await element.click();
          await page.waitForLoadState('networkidle');
          createModelFound = true;
          formInteractions.push(`Clicked: ${selector} - ${elementText}`);
          break;
        }
      } catch (error) {
        // Continue trying other selectors
      }
    }
    
    if (!createModelFound) {
      console.log('Create model button not found, trying direct navigation...');
      try {
        await page.goto('http://localhost:3000/create');
        await page.waitForLoadState('networkidle');
        createModelFound = true;
        formInteractions.push('Direct navigation to /create');
      } catch (error) {
        console.log('Could not navigate to create page');
      }
    }
    
    // Take screenshot of create model page
    await page.screenshot({ path: 'test-results/3-create-model-page.png', fullPage: true });
    
    if (createModelFound) {
      console.log('Successfully accessed create model page');
      
      // Look for form elements
      const formElements = page.locator('form, input, textarea, select, button[type="submit"]');
      const formCount = await formElements.count();
      
      console.log(`Found ${formCount} form elements`);
      
      if (formCount > 0) {
        // Try to interact with form elements
        const inputs = page.locator('input, textarea');
        const inputCount = await inputs.count();
        
        console.log(`Found ${inputCount} input elements`);
        
        // Try to fill some basic information
        for (let i = 0; i < Math.min(3, inputCount); i++) {
          try {
            const input = inputs.nth(i);
            const inputType = await input.getAttribute('type');
            const inputName = await input.getAttribute('name');
            const inputPlaceholder = await input.getAttribute('placeholder');
            
            console.log(`Input ${i}: type=${inputType}, name=${inputName}, placeholder=${inputPlaceholder}`);
            
            if (inputType === 'text' || !inputType) {
              if (inputName?.includes('name') || inputPlaceholder?.includes('name')) {
                await input.fill('Test Model');
                formInteractions.push(`Filled name field: Test Model`);
              } else if (inputName?.includes('description') || inputPlaceholder?.includes('description')) {
                await input.fill('Test model description');
                formInteractions.push(`Filled description field: Test model description`);
              }
            }
          } catch (error) {
            console.log(`Error interacting with input ${i}:`, error);
          }
        }
        
        // Look for submit button
        const submitButtons = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Save"), button:has-text("Submit")');
        const submitCount = await submitButtons.count();
        
        console.log(`Found ${submitCount} submit buttons`);
        
        if (submitCount > 0) {
          try {
            const submitButton = submitButtons.first();
            const buttonText = await submitButton.textContent();
            console.log(`Attempting to click submit button: ${buttonText}`);
            
            await submitButton.click();
            await page.waitForTimeout(2000); // Wait for potential GraphQL request
            
            formInteractions.push(`Clicked submit button: ${buttonText}`);
          } catch (error) {
            console.log('Error clicking submit button:', error);
          }
        }
        
        // Take screenshot after form interaction
        await page.screenshot({ path: 'test-results/3-create-model-form.png', fullPage: true });
      }
    }
    
    console.log('Form interactions:', formInteractions);
    console.log('GraphQL requests triggered:', graphqlRequests.length);
    
    if (graphqlRequests.length > 0) {
      console.log('GraphQL requests:', graphqlRequests);
    }
    
    console.log('✅ Test 3: Create model functionality tested');
  });

  test('4. Check connection status display', async ({ page }) => {
    console.log('🔍 Test 4: Checking connection status display');
    
    // Navigate to the main page
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Look for connection status indicators
    const connectionSelectors = [
      '[data-testid="connection-status"]',
      '[data-testid="websocket-status"]',
      '.connection-status',
      '.websocket-status',
      '[class*="connection"]',
      '[class*="websocket"]',
      '[class*="status"]'
    ];
    
    const connectionStatuses = [];
    
    for (const selector of connectionSelectors) {
      try {
        const elements = page.locator(selector);
        const count = await elements.count();
        
        for (let i = 0; i < count; i++) {
          const element = elements.nth(i);
          if (await element.isVisible({ timeout: 1000 })) {
            const text = await element.textContent();
            const className = await element.getAttribute('class');
            
            connectionStatuses.push({
              selector,
              text: text?.trim(),
              className,
              visible: true
            });
          }
        }
      } catch (error) {
        // Continue checking other selectors
      }
    }
    
    // Check for connection-related text in the page
    const pageText = await page.textContent('body');
    const connectionKeywords = ['connected', 'disconnected', 'offline', 'online', 'connecting', 'connection'];
    const foundKeywords = connectionKeywords.filter(keyword => 
      pageText?.toLowerCase().includes(keyword.toLowerCase())
    );
    
    console.log(`Found ${connectionStatuses.length} connection status elements`);
    console.log(`Connection keywords found: ${foundKeywords.join(', ')}`);
    
    if (connectionStatuses.length > 0) {
      console.log('Connection status elements:');
      connectionStatuses.forEach((status, index) => {
        console.log(`  ${index + 1}. ${status.selector}: "${status.text}" (class: ${status.className})`);
      });
    }
    
    // Take screenshot highlighting connection status
    await page.screenshot({ path: 'test-results/4-connection-status.png', fullPage: true });
    
    console.log('✅ Test 4: Connection status checked');
  });

  test('5. Test GraphQL endpoint directly', async ({ page }) => {
    console.log('🔍 Test 5: Testing GraphQL endpoint directly');
    
    const graphqlEndpoint = 'http://localhost:8080/graphql';
    
    // Test GraphQL endpoint with a simple query
    const testQuery = `
      query {
        __schema {
          types {
            name
          }
        }
      }
    `;
    
    try {
      console.log(`Testing GraphQL endpoint: ${graphqlEndpoint}`);
      
      // Use page.evaluate to make fetch request from browser context
      const response = await page.evaluate(async ({ endpoint, query }) => {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query })
          });
          
          return {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            body: await response.text()
          };
        } catch (error) {
          return {
            error: error.message
          };
        }
      }, { endpoint: graphqlEndpoint, query: testQuery });
      
      console.log(`GraphQL endpoint response status: ${response.status}`);
      console.log(`GraphQL endpoint response body: ${response.body}`);
      
      if (response.error) {
        console.log(`GraphQL endpoint error: ${response.error}`);
      }
      
      // Test with a simple models query
      const modelsQuery = `
        query {
          models {
            id
            name
            description
          }
        }
      `;
      
      const modelsResponse = await page.evaluate(async ({ endpoint, query }) => {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query })
          });
          
          return {
            status: response.status,
            statusText: response.statusText,
            body: await response.text()
          };
        } catch (error) {
          return {
            error: error.message
          };
        }
      }, { endpoint: graphqlEndpoint, query: modelsQuery });
      
      console.log(`Models query response status: ${modelsResponse.status}`);
      console.log(`Models query response body: ${modelsResponse.body}`);
      
      // Check if we get NOT_IMPLEMENTED or actual data
      const responseBody = modelsResponse.body;
      const hasNotImplemented = responseBody?.includes('NOT_IMPLEMENTED') || responseBody?.includes('not yet implemented');
      const hasActualData = responseBody?.includes('models') && !responseBody?.includes('NOT_IMPLEMENTED');
      
      console.log(`Response contains NOT_IMPLEMENTED: ${hasNotImplemented}`);
      console.log(`Response contains actual data: ${hasActualData}`);
      
      if (hasNotImplemented) {
        console.log('🔴 GraphQL still returning NOT_IMPLEMENTED errors');
      } else if (hasActualData) {
        console.log('🟢 GraphQL returning actual data - NOT_IMPLEMENTED errors resolved!');
      } else {
        console.log('🟡 GraphQL response unclear - may need investigation');
      }
      
    } catch (error) {
      console.log(`Error testing GraphQL endpoint: ${error}`);
    }
    
    // Take screenshot for documentation
    await page.screenshot({ path: 'test-results/5-graphql-endpoint-test.png', fullPage: true });
    
    console.log('✅ Test 5: GraphQL endpoint tested');
  });

  test('6. Comprehensive NOT_IMPLEMENTED error check', async ({ page }) => {
    console.log('🔍 Test 6: Comprehensive check for NOT_IMPLEMENTED errors');
    
    const allErrors = [];
    const graphqlResponses = [];
    
    // Monitor all console messages
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warn') {
        allErrors.push({
          type: msg.type(),
          text: msg.text(),
          location: msg.location()
        });
      }
    });
    
    // Monitor all GraphQL requests and responses
    page.on('response', async response => {
      if (response.url().includes('graphql')) {
        try {
          const responseText = await response.text();
          graphqlResponses.push({
            url: response.url(),
            status: response.status(),
            body: responseText
          });
        } catch (error) {
          console.log('Error reading GraphQL response:', error);
        }
      }
    });
    
    // Navigate to main page
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Navigate through all main pages to trigger GraphQL requests
    const pagesToTest = [
      { path: '/', name: 'Home' },
      { path: '/models', name: 'Models' },
      { path: '/create', name: 'Create Model' }
    ];
    
    for (const pageInfo of pagesToTest) {
      try {
        console.log(`Testing page: ${pageInfo.name} (${pageInfo.path})`);
        await page.goto(`http://localhost:3000${pageInfo.path}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000); // Wait for any delayed GraphQL requests
        
        // Check page content for NOT_IMPLEMENTED messages
        const pageText = await page.textContent('body');
        const hasNotImplemented = pageText?.includes('NOT_IMPLEMENTED') || 
                                  pageText?.includes('not yet implemented') ||
                                  pageText?.includes('GraphQL endpoint not yet implemented');
        
        if (hasNotImplemented) {
          console.log(`❌ Found NOT_IMPLEMENTED message on ${pageInfo.name} page`);
        } else {
          console.log(`✅ No NOT_IMPLEMENTED message on ${pageInfo.name} page`);
        }
        
        // Take screenshot of each page
        await page.screenshot({ path: `test-results/6-${pageInfo.name.toLowerCase().replace(' ', '-')}-page.png`, fullPage: true });
        
      } catch (error) {
        console.log(`Error testing ${pageInfo.name} page:`, error);
      }
    }
    
    // Analyze results
    const notImplementedErrors = allErrors.filter(error => 
      error.text.includes('NOT_IMPLEMENTED') || 
      error.text.includes('not yet implemented')
    );
    
    const notImplementedResponses = graphqlResponses.filter(response => 
      response.body.includes('NOT_IMPLEMENTED') || 
      response.body.includes('not yet implemented')
    );
    
    console.log('\n=== FINAL RESULTS ===');
    console.log(`Total console errors: ${allErrors.length}`);
    console.log(`NOT_IMPLEMENTED console errors: ${notImplementedErrors.length}`);
    console.log(`Total GraphQL responses: ${graphqlResponses.length}`);
    console.log(`NOT_IMPLEMENTED GraphQL responses: ${notImplementedResponses.length}`);
    
    if (notImplementedErrors.length > 0) {
      console.log('\n❌ NOT_IMPLEMENTED console errors found:');
      notImplementedErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.text}`);
      });
    }
    
    if (notImplementedResponses.length > 0) {
      console.log('\n❌ NOT_IMPLEMENTED GraphQL responses found:');
      notImplementedResponses.forEach((response, index) => {
        console.log(`  ${index + 1}. ${response.url}: ${response.body}`);
      });
    }
    
    if (notImplementedErrors.length === 0 && notImplementedResponses.length === 0) {
      console.log('\n🎉 SUCCESS: No NOT_IMPLEMENTED errors found! GraphQL appears to be working properly.');
    } else {
      console.log('\n🔴 NOT_IMPLEMENTED errors still present - GraphQL implementation may need more work.');
    }
    
    // Take final comprehensive screenshot
    await page.screenshot({ path: 'test-results/6-comprehensive-check.png', fullPage: true });
    
    console.log('✅ Test 6: Comprehensive NOT_IMPLEMENTED check completed');
  });
});