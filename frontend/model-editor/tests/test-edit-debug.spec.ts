import { test, expect } from '@playwright/test';

test('Debug Edit Button Click', async ({ page }) => {
  console.log('🧪 Debugging Edit button click event');
  
  // Listen for console messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Error') || text.includes('error') || text.includes('Warning') || text.includes('warning')) {
      console.log('PAGE LOG (ERROR/WARNING):', text);
    } else {
      console.log('PAGE LOG:', text);
    }
  });
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  // Navigate to the frontend
  await page.goto('http://localhost:3000');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Navigate to Models page
  await page.click('a[href*="/models"]');
  await page.waitForLoadState('networkidle');
  
  // Click the Open button to go to model editor
  const openButton = page.locator('text=Open').first();
  await expect(openButton).toBeVisible();
  await openButton.click();
  await page.waitForLoadState('networkidle');
  
  // Wait for entities to load
  await page.waitForTimeout(2000);
  
  // Add a console log to the handleEditEntity function
  await page.evaluate(() => {
    // Hook into the window object to track function calls
    window.editEntityClicked = false;
    window.editEntityData = null;
    
    // Override console.log to track our debug messages
    const originalLog = console.log;
    console.log = function(...args) {
      if (args[0] && args[0].includes('handleEditEntity')) {
        window.editEntityClicked = true;
        window.editEntityData = args[1];
      }
      originalLog.apply(console, args);
    };
  });
  
  // Inject a debug function into the page
  await page.evaluate(() => {
    // Try to find React components and add debugging
    const buttons = document.querySelectorAll('button');
    buttons.forEach((button, index) => {
      if (button.textContent === 'Edit') {
        console.log(`Found Edit button ${index}:`, button);
        console.log(`Button has onclick:`, button.onclick);
        console.log(`Button has listeners:`, button.eventListeners);
        
        button.addEventListener('click', (e) => {
          console.log('Edit button clicked!', index, e);
          console.log('Event target:', e.target);
          console.log('Event current target:', e.currentTarget);
        });
      }
    });
  });
  
  // Find and click the first Edit button
  const editButton = page.locator('button:has-text("Edit")').first();
  await expect(editButton).toBeVisible();
  
  console.log('✅ Edit button is visible, clicking it...');
  await editButton.click();
  
  // Wait a bit for the event to be processed
  await page.waitForTimeout(1000);
  
  // Check if our debug hooks were triggered
  const editEntityClicked = await page.evaluate(() => window.editEntityClicked);
  const editEntityData = await page.evaluate(() => window.editEntityData);
  
  console.log(`Edit entity function called: ${editEntityClicked}`);
  console.log(`Edit entity data:`, editEntityData);
  
  // Check if modal appeared
  const modal = page.locator('[role="dialog"]');
  const modalVisible = await modal.isVisible();
  console.log(`Modal visible: ${modalVisible}`);
  
  console.log('🏁 Test completed');
});