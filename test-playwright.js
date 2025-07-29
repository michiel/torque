const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Testing Model Editor on http://localhost:3000');
  await page.goto('http://localhost:3000');
  
  // Wait for page to load
  await page.waitForTimeout(3000);
  
  const title = await page.title();
  console.log('Page title:', title);
  
  // Take a screenshot
  await page.screenshot({ path: 'model-editor-screenshot.png' });
  console.log('Screenshot saved as model-editor-screenshot.png');
  
  // Check for basic elements
  const bodyText = await page.textContent('body');
  console.log('Page loaded successfully, content length:', bodyText.length);
  
  console.log('\nTesting Torque Client on http://localhost:3002');
  await page.goto('http://localhost:3002');
  
  // Wait for page to load
  await page.waitForTimeout(3000);
  
  const clientTitle = await page.title();
  console.log('Page title:', clientTitle);
  
  // Take a screenshot
  await page.screenshot({ path: 'torque-client-screenshot.png' });
  console.log('Screenshot saved as torque-client-screenshot.png');
  
  await browser.close();
  
  console.log('\nPlaywright verification completed successfully!');
})();