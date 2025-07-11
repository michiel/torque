import { test, expect } from '@playwright/test';

test('Test Entity Update 500 Error', async ({ page }) => {
  console.log('🧪 Testing entity update 500 error');
  
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
      response.text().then(body => {
        console.log('ERROR BODY:', body);
      });
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
  
  // Click Edit button using JavaScript evaluation
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
  
  // Modify the display name
  const displayNameField = page.locator('input[placeholder*="User, Product, Order"]');
  await displayNameField.fill('Customer Updated Test');
  
  // Take screenshot before update
  await page.screenshot({ path: 'test-results/before-update-test.png', fullPage: true });
  
  // Click Update Entity button
  const updateButton = page.locator('button:has-text("Update Entity")');
  await expect(updateButton).toBeVisible();
  await updateButton.click();
  
  // Wait for response
  await page.waitForTimeout(5000);
  
  // Take screenshot after update attempt
  await page.screenshot({ path: 'test-results/after-update-test.png', fullPage: true });
  
  // Check if modal is still open (would indicate an error)
  const modalStillOpen = await modal.isVisible();
  console.log(`Modal still open after update: ${modalStillOpen}`);
  
  // Check if there's an error notification
  const errorNotification = page.locator('text=Error');
  const hasError = await errorNotification.isVisible();
  console.log(`Error notification visible: ${hasError}`);
  
  // Check if there's a success notification
  const successNotification = page.locator('text=Entity updated successfully');
  const hasSuccess = await successNotification.isVisible();
  console.log(`Success notification visible: ${hasSuccess}`);
  
  console.log('🏁 Test completed');
});