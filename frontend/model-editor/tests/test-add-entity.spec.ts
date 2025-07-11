import { test, expect } from '@playwright/test';

test('Test Add Entity Button', async ({ page }) => {
  console.log('🧪 Testing Add Entity button functionality');
  
  // Listen for console messages
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
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
  
  // Take screenshot before clicking Add Entity
  await page.screenshot({ path: 'test-results/before-add-entity.png', fullPage: true });
  
  // Find and click the Add Entity button
  const addButton = page.locator('button:has-text("Add Entity")');
  await expect(addButton).toBeVisible();
  
  console.log('✅ Add Entity button is visible, clicking it...');
  await addButton.click();
  
  // Wait a bit for modal to potentially appear
  await page.waitForTimeout(1000);
  
  // Take screenshot after clicking Add Entity
  await page.screenshot({ path: 'test-results/after-add-entity.png', fullPage: true });
  
  // Check if modal appeared
  const modal = page.locator('[role="dialog"]');
  const modalVisible = await modal.isVisible();
  console.log(`Modal visible: ${modalVisible}`);
  
  if (modalVisible) {
    console.log('✅ Add Entity modal opened successfully');
  } else {
    console.log('❌ Add Entity modal did not open');
  }
  
  console.log('🏁 Test completed');
});