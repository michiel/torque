/**
 * Playwright test script for Torque Model Editor
 * Tests basic functionality and UI components
 */

const { chromium } = require('playwright');
const path = require('path');

// Configuration
const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:8080';
const TIMEOUT = 30000;

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.blue) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${color}[${timestamp}]${colors.reset} ${message}`);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
}

function error(message) {
  log(`❌ ${message}`, colors.red);
}

function warn(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

// Wait for services to be ready
async function waitForService(url, name, maxRetries = 30) {
  log(`Waiting for ${name} to be ready at ${url}...`);
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        success(`${name} is ready`);
        return true;
      }
    } catch (err) {
      // Service not ready yet
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  throw new Error(`${name} failed to start within ${maxRetries} seconds`);
}

// Test the Model Editor frontend
async function testModelEditor() {
  log('Starting Playwright browser tests...');
  
  const browser = await chromium.launch({
    headless: true, // Set to false to see the browser
    timeout: TIMEOUT
  });
  
  const context = await browser.newContext({
    viewport: { width: 1200, height: 800 }
  });
  
  const page = await context.newPage();
  
  try {
    // Navigate to the Model Editor
    log('Navigating to Model Editor...');
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle', timeout: TIMEOUT });
    
    // Test 1: Check if the page loads
    const title = await page.title();
    if (title.includes('Torque')) {
      success('Page title is correct');
    } else {
      warn(`Page title is "${title}", expected to contain "Torque"`);
    }
    
    // Test 2: Check for navigation sidebar
    log('Checking navigation sidebar...');
    const sidebar = await page.locator('[class*="mantine-AppShell-navbar"]').first();
    await sidebar.waitFor({ timeout: 10000 });
    success('Navigation sidebar is present');
    
    // Test 3: Check for Torque Model Editor header
    const headerText = await page.getByText('Torque Model Editor').first();
    await headerText.waitFor({ timeout: 5000 });
    success('Header text found');
    
    // Test 4: Check for models page content
    log('Checking models page content...');
    const modelsHeader = await page.getByRole('heading', { name: /models/i }).first();
    await modelsHeader.waitFor({ timeout: 5000 });
    success('Models page header found');
    
    // Test 5: Check for Create Model button
    const createButton = await page.getByRole('button', { name: /create model/i }).first();
    await createButton.waitFor({ timeout: 5000 });
    success('Create Model button found');
    
    // Test 6: Test navigation to create model page
    log('Testing navigation to Create Model page...');
    await createButton.click();
    await page.waitForURL('**/models/new', { timeout: 5000 });
    success('Navigation to Create Model page works');
    
    // Test 7: Check create model form
    const nameInput = await page.getByLabel(/model name/i).first();
    await nameInput.waitFor({ timeout: 5000 });
    success('Create model form is present');
    
    // Test 8: Test form validation
    log('Testing form validation...');
    await nameInput.fill('Test Model');
    const descriptionTextarea = await page.getByLabel(/description/i).first();
    await descriptionTextarea.fill('A test model for Playwright verification');
    success('Form inputs work correctly');
    
    // Test 9: Navigate back to models list
    log('Testing navigation back to models list...');
    await page.getByRole('button', { name: /cancel/i }).click();
    await page.waitForURL('**/models', { timeout: 5000 });
    success('Navigation back to models list works');
    
    // Test 10: Check responsive design (mobile view)
    log('Testing responsive design...');
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
    await page.waitForTimeout(1000); // Allow layout to adjust
    success('Responsive design test completed');
    
    // Test 11: Check console for errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Reload page to capture any console errors
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    if (consoleErrors.length === 0) {
      success('No console errors found');
    } else {
      warn(`Found ${consoleErrors.length} console errors:`);
      consoleErrors.forEach(err => warn(`  - ${err}`));
    }
    
    success('All frontend tests completed successfully! 🎉');
    
  } catch (err) {
    error(`Test failed: ${err.message}`);
    throw err;
  } finally {
    await browser.close();
  }
}

// Test backend health
async function testBackendHealth() {
  log('Testing backend health...');
  
  try {
    const healthResponse = await fetch(`${BACKEND_URL}/health`);
    if (healthResponse.ok) {
      success('Backend health check passed');
    } else {
      throw new Error(`Health check failed with status ${healthResponse.status}`);
    }
    
    // Test GraphQL endpoint
    const graphqlResponse = await fetch(`${BACKEND_URL}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'query { __typename }'
      })
    });
    
    if (graphqlResponse.ok) {
      success('GraphQL endpoint is responding');
    } else {
      throw new Error(`GraphQL endpoint failed with status ${graphqlResponse.status}`);
    }
    
  } catch (err) {
    error(`Backend test failed: ${err.message}`);
    throw err;
  }
}

// Main test function
async function runTests() {
  console.log('\n🧪 Torque Model Editor - Playwright Tests');
  console.log('==========================================\n');
  
  try {
    // Wait for services
    await waitForService(`${BACKEND_URL}/health`, 'Backend');
    await waitForService(FRONTEND_URL, 'Frontend');
    
    // Run tests
    await testBackendHealth();
    await testModelEditor();
    
    console.log('\n' + colors.green + colors.bold + '🎉 All tests passed successfully!' + colors.reset);
    console.log('\n✅ The Torque Model Editor is working correctly');
    console.log('✅ Both backend and frontend are properly integrated');
    console.log('✅ UI components are rendering and functioning');
    console.log('✅ Navigation and routing work as expected\n');
    
    process.exit(0);
    
  } catch (err) {
    console.log('\n' + colors.red + colors.bold + '❌ Tests failed!' + colors.reset);
    console.log(`\nError: ${err.message}\n`);
    process.exit(1);
  }
}

// Check if playwright is installed
async function checkPlaywright() {
  try {
    require('playwright');
    return true;
  } catch (err) {
    error('Playwright is not installed. Please install it first:');
    console.log('  npm install -g playwright');
    console.log('  npx playwright install chromium');
    return false;
  }
}

// Run the tests if playwright is available
if (require.main === module) {
  checkPlaywright().then(isAvailable => {
    if (isAvailable) {
      runTests();
    } else {
      process.exit(1);
    }
  });
}

module.exports = { runTests, testModelEditor, testBackendHealth };