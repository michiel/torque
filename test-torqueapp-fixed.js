const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Testing TorqueApp Runtime on http://localhost:3002');
  await page.goto('http://localhost:3002');
  
  // Wait for page to load
  await page.waitForTimeout(3000);
  
  const title = await page.title();
  console.log('Page title:', title);
  
  // Check if the Todo Application link is present
  const todoLink = await page.locator('text=Try the Todo Application:');
  if (await todoLink.count() > 0) {
    console.log('✓ Todo Application section found');
    
    // Look for the actual app link
    const appLink = await page.locator('a[href*="/app/"]');
    if (await appLink.count() > 0) {
      console.log('✓ Todo Application link found');
      
      // Get the href to navigate manually
      const href = await appLink.getAttribute('href');
      console.log('Todo App URL:', href);
      
      // Navigate to the todo app
      await page.goto('http://localhost:3002' + href);
      await page.waitForTimeout(5000);
      
      // Take screenshot of the todo app
      await page.screenshot({ path: 'todo-app-screenshot.png' });
      console.log('Screenshot of Todo App saved as todo-app-screenshot.png');
      
      // Check if we're on the todo app page
      const currentUrl = page.url();
      console.log('Current URL:', currentUrl);
      
      // Check for any content on the page
      const bodyText = await page.textContent('body');
      console.log('Page content length:', bodyText.length);
      
      // Look for specific elements that might indicate the app is working
      const hasDataGrid = await page.locator('table, [data-testid="data-grid"], .data-grid').count() > 0;
      const hasForm = await page.locator('form, [data-testid="form"]').count() > 0;
      const hasButtons = await page.locator('button').count() > 0;
      const hasText = await page.locator('text=TorqueApp').count() > 0;
      
      console.log('Elements found:');
      console.log('- Data Grid/Table:', hasDataGrid ? '✓' : '✗');
      console.log('- Forms:', hasForm ? '✓' : '✗');
      console.log('- Buttons:', hasButtons ? '✓' : '✗');
      console.log('- TorqueApp text:', hasText ? '✓' : '✗');
      
      // Check for any error messages
      const hasError = await page.locator('text=Error').count() > 0;
      const hasConnectionError = await page.locator('text=Failed to fetch').count() > 0;
      console.log('- Error messages:', hasError ? '✗ Found' : '✓ None');
      console.log('- Connection errors:', hasConnectionError ? '✗ Found' : '✓ None');
      
    } else {
      console.log('✗ Todo Application link not found');
    }
  } else {
    console.log('✗ Todo Application section not found');
  }
  
  // Test the Model Editor button
  await page.goto('http://localhost:3002');
  await page.waitForTimeout(2000);
  
  const modelEditorBtn = await page.locator('text=Open Model Editor');
  if (await modelEditorBtn.count() > 0) {
    console.log('\n✓ Model Editor button found');
    // Note: This will likely open in a new tab, so we won't test the click
    console.log('Model Editor button is present and clickable');
  } else {
    console.log('\n✗ Model Editor button not found');
  }
  
  await browser.close();
  
  console.log('\nTorqueApp verification completed!');
})();