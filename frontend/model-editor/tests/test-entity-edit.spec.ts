import { test, expect } from '@playwright/test';

test.describe('Entity Edit Functionality', () => {
  test('Edit button opens modal and allows editing entity', async ({ page }) => {
    console.log('🧪 Testing entity edit functionality');
    
    // Navigate to the frontend
    await page.goto('http://localhost:3000');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Navigate to Models page
    await page.click('a[href*="/models"]');
    await page.waitForLoadState('networkidle');
    
    // Find and click the "Open" button for the Customer Order Management model
    const openButton = page.locator('text=Open').first();
    await expect(openButton).toBeVisible();
    await openButton.click();
    await page.waitForLoadState('networkidle');
    
    // Wait for entities to load
    await page.waitForTimeout(2000);
    
    // Take screenshot of entities tab
    await page.screenshot({ path: 'test-results/entities-before-edit.png', fullPage: true });
    
    // Look for the first Edit button in the entities section
    const editButtons = page.locator('button:has-text("Edit")');
    const entityEditButton = editButtons.first();
    
    console.log('Found edit buttons:', await editButtons.count());
    
    // Ensure edit button is visible and click it
    await expect(entityEditButton).toBeVisible();
    await entityEditButton.click();
    
    // Wait for modal to appear
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    
    // Check if the modal opened with correct title
    const modalTitle = page.locator('[role="dialog"] >> text=Edit Entity');
    await expect(modalTitle).toBeVisible();
    
    console.log('✅ Edit modal opened successfully');
    
    // Check if form fields are populated
    const nameField = page.locator('input[placeholder*="user, product, order"]');
    const displayNameField = page.locator('input[placeholder*="User, Product, Order"]');
    
    // Verify fields have values (they should be pre-populated with entity data)
    const nameValue = await nameField.inputValue();
    const displayNameValue = await displayNameField.inputValue();
    
    console.log('Name field value:', nameValue);
    console.log('Display name field value:', displayNameValue);
    
    // Verify the values are not empty (entity should be pre-populated)
    expect(nameValue).not.toBe('');
    expect(displayNameValue).not.toBe('');
    
    // Modify the display name
    await displayNameField.fill(displayNameValue + ' (Edited)');
    
    // Take screenshot of the edit modal
    await page.screenshot({ path: 'test-results/entity-edit-modal.png', fullPage: true });
    
    // Click update button
    const updateButton = page.locator('button:has-text("Update Entity")');
    await expect(updateButton).toBeVisible();
    await updateButton.click();
    
    // Wait for the modal to close and success notification
    await page.waitForSelector('[role="dialog"]', { state: 'detached', timeout: 5000 });
    
    // Look for success notification
    const successNotification = page.locator('text=Entity updated successfully');
    await expect(successNotification).toBeVisible();
    
    console.log('✅ Entity update completed successfully');
    
    // Take final screenshot
    await page.screenshot({ path: 'test-results/entities-after-edit.png', fullPage: true });
    
    console.log('✅ Entity edit test completed successfully');
  });
});