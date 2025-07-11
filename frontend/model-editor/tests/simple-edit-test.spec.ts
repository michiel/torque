import { test, expect } from '@playwright/test';

test('Simple Edit Button Test', async ({ page }) => {
  console.log('🧪 Testing simple edit button functionality');
  
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
  
  // Take screenshot before clicking Edit
  await page.screenshot({ path: 'test-results/before-edit-click.png', fullPage: true });
  
  // Find and click the first Edit button
  const editButton = page.locator('button:has-text("Edit")').first();
  await expect(editButton).toBeVisible();
  
  console.log('✅ Edit button is visible, clicking it...');
  
  // Check if the button has an onclick handler
  const hasOnClick = await editButton.evaluate(el => el.onclick !== null);
  console.log(`Button has onclick handler: ${hasOnClick}`);
  
  // Try to get the event listeners on the button
  const eventListeners = await editButton.evaluate(el => {
    const listeners = [];
    if (el._eventListeners) {
      listeners.push('Has _eventListeners');
    }
    if (el.onclick) {
      listeners.push('Has onclick');
    }
    return listeners;
  });
  console.log(`Event listeners: ${eventListeners.join(', ')}`);
  
  await editButton.click();
  
  // Also try JavaScript evaluation approach
  await page.evaluate(() => {
    const editButtons = document.querySelectorAll('button');
    for (let button of editButtons) {
      if (button.textContent === 'Edit') {
        console.log('Clicking Edit button via JavaScript...');
        button.click();
        break;
      }
    }
  });
  
  // Wait a bit for modal to potentially appear
  await page.waitForTimeout(1000);
  
  // Take screenshot after clicking Edit
  await page.screenshot({ path: 'test-results/after-edit-click.png', fullPage: true });
  
  // Check if modal appeared
  const modal = page.locator('[role="dialog"]');
  const modalVisible = await modal.isVisible();
  console.log(`Modal visible: ${modalVisible}`);
  
  if (modalVisible) {
    console.log('✅ Modal opened successfully');
    
    // Check modal content
    const modalTitle = await modal.locator('text=Edit Entity').first();
    const titleVisible = await modalTitle.isVisible();
    console.log(`Modal title visible: ${titleVisible}`);
    
    // Check for form fields
    const nameField = modal.locator('input[placeholder*="user, product, order"]');
    const nameFieldVisible = await nameField.isVisible();
    console.log(`Name field visible: ${nameFieldVisible}`);
    
    if (nameFieldVisible) {
      const nameValue = await nameField.inputValue();
      console.log(`Name field value: "${nameValue}"`);
    }
  } else {
    console.log('❌ Modal did not open');
  }
  
  console.log('🏁 Test completed');
});