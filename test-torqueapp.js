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
  const todoLink = await page.locator('text=/app/492a9e29-c546-469b-b565-b0a69988a5d3');
  if (await todoLink.count() > 0) {
    console.log('✓ Todo Application link found');
    
    // Click the Todo Application link
    await todoLink.click();
    await page.waitForTimeout(3000);
    
    // Take screenshot of the todo app
    await page.screenshot({ path: 'todo-app-screenshot.png' });
    console.log('Screenshot of Todo App saved as todo-app-screenshot.png');
    
    // Check if we're on the todo app page
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    if (currentUrl.includes('492a9e29-c546-469b-b565-b0a69988a5d3')) {
      console.log('✓ Successfully navigated to Todo Application');
      
      // Check for any content on the page
      const bodyText = await page.textContent('body');
      console.log('Page content length:', bodyText.length);
      
      // Look for specific elements that might indicate the app is working
      const hasDataGrid = await page.locator('[data-testid="data-grid"], .data-grid, table').count() > 0;
      const hasForm = await page.locator('form, [data-testid="form"]').count() > 0;
      const hasButtons = await page.locator('button').count() > 0;
      
      console.log('Elements found:');
      console.log('- Data Grid:', hasDataGrid ? '✓' : '✗');
      console.log('- Forms:', hasForm ? '✓' : '✗');
      console.log('- Buttons:', hasButtons ? '✓' : '✗');
      
    }
  } else {
    console.log('✗ Todo Application link not found');
  }
  
  // Test the Model Editor button
  await page.goto('http://localhost:3002');
  await page.waitForTimeout(2000);
  
  const modelEditorBtn = await page.locator('text=Open Model Editor');
  if (await modelEditorBtn.count() > 0) {
    console.log('\n✓ Model Editor button found');
    await modelEditorBtn.click();
    await page.waitForTimeout(3000);
    
    // Should navigate to model editor
    const currentUrl = page.url();
    console.log('After clicking Model Editor button, URL:', currentUrl);
    
    if (currentUrl.includes('localhost:3000')) {
      console.log('✓ Successfully navigated to Model Editor');
      await page.screenshot({ path: 'model-editor-from-torqueapp-screenshot.png' });
    }
  }
  
  await browser.close();
  
  console.log('\nTorqueApp verification completed!');
})();