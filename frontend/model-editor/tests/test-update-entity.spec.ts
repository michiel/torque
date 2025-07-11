import { test, expect } from '@playwright/test';

test('Test Entity Update Error', async ({ page }) => {
  console.log('🧪 Testing entity update to reproduce 500 error');
  
  // Listen for console messages and network errors
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('error') || text.includes('Error') || text.includes('500')) {
      console.log('PAGE LOG (ERROR):', text);
    }
  });
  
  page.on('response', response => {
    if (response.status() >= 400) {
      console.log(`HTTP ERROR: ${response.status()} ${response.url()}`);
    }
  });
  
  // Navigate to the frontend
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  
  // Navigate to Models page
  await page.click('a[href*="/models"]');
  await page.waitForLoadState('networkidle');
  
  // Click the Open button to go to model editor
  const openButton = page.locator('text=Open').first();
  await openButton.click();
  await page.waitForLoadState('networkidle');
  
  // Wait for entities to load
  await page.waitForTimeout(2000);
  
  // Click Edit button using JavaScript evaluation (since we know this works)
  await page.evaluate(() => {
    const editButtons = document.querySelectorAll('button');
    for (let button of editButtons) {
      if (button.textContent === 'Edit') {
        button.click();
        break;
      }
    }
  });
  
  // Wait for modal to appear
  await page.waitForTimeout(1000);
  
  // Verify modal is open
  const modal = page.locator('[role="dialog"]');
  await expect(modal).toBeVisible();
  
  // Check modal title
  const modalTitle = page.locator('text=Edit Entity');
  await expect(modalTitle).toBeVisible();
  
  // Modify the display name
  const displayNameField = page.locator('input[placeholder*="User, Product, Order"]');
  await displayNameField.fill('Customer Updated');
  
  // Take screenshot before update
  await page.screenshot({ path: 'test-results/before-update.png', fullPage: true });
  
  // Click Update Entity button
  const updateButton = page.locator('button:has-text("Update Entity")');
  await expect(updateButton).toBeVisible();
  await updateButton.click();
  
  // Wait for response
  await page.waitForTimeout(3000);
  
  // Take screenshot after update attempt
  await page.screenshot({ path: 'test-results/after-update.png', fullPage: true });
  
  console.log('🏁 Test completed - check logs for 500 error details');
});