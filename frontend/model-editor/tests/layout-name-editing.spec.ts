import { test, expect } from '@playwright/test';

test.describe('Layout Name Editing and Back Button Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the main page
    await page.goto('http://localhost:3000');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Wait for the UI to be ready
    await page.waitForTimeout(2000);
  });

  test('should navigate to Visual Layout Editor and test layout name editing', async ({ page }) => {
    // Navigate to Models page
    await page.click('text=Models');
    await page.waitForLoadState('networkidle');
    
    // Look for existing models or create a new one
    const modelCards = page.locator('.mantine-Card-root');
    const modelCount = await modelCards.count();
    
    let modelName = 'Test Model';
    
    if (modelCount === 0) {
      // Create a new model if none exist
      await page.click('text=Create New Model');
      await page.waitForLoadState('networkidle');
      
      await page.fill('input[placeholder="Enter model name"]', modelName);
      await page.click('button:has-text("Create Model")');
      await page.waitForLoadState('networkidle');
    } else {
      // Use the first existing model
      const firstModelCard = modelCards.first();
      const modelTitle = await firstModelCard.locator('h3').textContent();
      modelName = modelTitle || 'Test Model';
      
      // Click on the first model card
      await firstModelCard.click();
      await page.waitForLoadState('networkidle');
    }
    
    // Navigate to Layouts tab
    await page.click('text=Layouts');
    await page.waitForLoadState('networkidle');
    
    // Look for existing layouts or create a new one
    const layoutCards = page.locator('.mantine-Card-root');
    const layoutCount = await layoutCards.count();
    
    if (layoutCount === 0) {
      // Create a new layout if none exist
      await page.click('text=Create New Layout');
      await page.waitForLoadState('networkidle');
      
      await page.fill('input[placeholder="Enter layout name"]', 'Test Layout');
      await page.click('button:has-text("Create Layout")');
      await page.waitForLoadState('networkidle');
    } else {
      // Click on the first existing layout
      await layoutCards.first().click();
      await page.waitForLoadState('networkidle');
    }
    
    // Now we should be in the Visual Layout Editor
    await page.waitForTimeout(3000);
    
    // Test 1: Check if layout name is visible in the header
    console.log('Test 1: Checking if layout name is visible in header');
    const headerSection = page.locator('header, .header, [data-testid="header"]').first();
    
    // Look for the layout name display
    const layoutNameDisplay = page.locator('text=Test Layout').first();
    const isLayoutNameVisible = await layoutNameDisplay.isVisible();
    console.log('Layout name visible:', isLayoutNameVisible);
    
    // Test 2: Look for edit icon and test editing functionality
    console.log('Test 2: Testing layout name editing functionality');
    
    // Look for edit icon (common icons are pencil, edit, etc.)
    const editIcon = page.locator('[data-testid="edit-layout-name"], .tabler-icon-pencil, .tabler-icon-edit, button:has([data-testid="edit-icon"])').first();
    
    if (await editIcon.isVisible()) {
      console.log('Edit icon found, clicking it');
      await editIcon.click();
      await page.waitForTimeout(1000);
      
      // Look for input field that appears after clicking edit
      const editInput = page.locator('input[data-testid="layout-name-input"], input[type="text"]').first();
      
      if (await editInput.isVisible()) {
        console.log('Edit input found, testing editing');
        
        // Clear and type new name
        await editInput.clear();
        await editInput.fill('Updated Layout Name');
        
        // Test saving with Enter key
        console.log('Test 3: Testing save with Enter key');
        await editInput.press('Enter');
        await page.waitForTimeout(1000);
        
        // Check if name was updated
        const updatedName = page.locator('text=Updated Layout Name').first();
        const nameUpdated = await updatedName.isVisible();
        console.log('Name updated after Enter:', nameUpdated);
        
        // Test editing again and canceling with Escape
        if (await editIcon.isVisible()) {
          console.log('Test 4: Testing cancel with Escape key');
          await editIcon.click();
          await page.waitForTimeout(500);
          
          const editInput2 = page.locator('input[data-testid="layout-name-input"], input[type="text"]').first();
          if (await editInput2.isVisible()) {
            await editInput2.clear();
            await editInput2.fill('Should Be Canceled');
            
            // Cancel with Escape
            await editInput2.press('Escape');
            await page.waitForTimeout(1000);
            
            // Check that the name wasn't changed
            const canceledName = page.locator('text=Should Be Canceled').first();
            const nameCanceled = await canceledName.isVisible();
            console.log('Name canceled (should be false):', nameCanceled);
            
            // Original name should still be there
            const originalName = page.locator('text=Updated Layout Name').first();
            const originalStillThere = await originalName.isVisible();
            console.log('Original name still there:', originalStillThere);
          }
        }
      } else {
        console.log('Edit input not found after clicking edit icon');
      }
    } else {
      console.log('Edit icon not found, looking for alternative editing methods');
      
      // Try double-clicking on the layout name
      if (await layoutNameDisplay.isVisible()) {
        console.log('Trying double-click on layout name');
        await layoutNameDisplay.dblclick();
        await page.waitForTimeout(1000);
        
        const editInput = page.locator('input[type="text"]').first();
        if (await editInput.isVisible()) {
          console.log('Double-click activated edit mode');
          await editInput.clear();
          await editInput.fill('Double-Click Updated Name');
          await editInput.press('Enter');
          await page.waitForTimeout(1000);
        }
      }
    }
    
    // Test 5: Test back button behavior
    console.log('Test 5: Testing back button behavior');
    
    // Look for back button
    const backButton = page.locator('button:has-text("Back"), [data-testid="back-button"], .tabler-icon-arrow-left').first();
    
    if (await backButton.isVisible()) {
      console.log('Back button found, testing navigation');
      
      // Get current URL before clicking back
      const currentUrl = page.url();
      console.log('Current URL before back:', currentUrl);
      
      // Click back button
      await backButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Check new URL after back
      const newUrl = page.url();
      console.log('New URL after back:', newUrl);
      
      // Verify we navigated back (URL should be different)
      const navigatedBack = currentUrl !== newUrl;
      console.log('Successfully navigated back:', navigatedBack);
      
      // Check if we're now on the layouts page (not necessarily the first tab)
      const layoutsTab = page.locator('text=Layouts').first();
      const isOnLayoutsPage = await layoutsTab.isVisible();
      console.log('Back to layouts page:', isOnLayoutsPage);
      
    } else {
      console.log('Back button not found');
      
      // Try browser back button
      console.log('Testing browser back button');
      await page.goBack();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      const newUrl = page.url();
      console.log('URL after browser back:', newUrl);
    }
    
    // Test 6: Test overall user experience
    console.log('Test 6: Testing overall user experience');
    
    // Take screenshot for visual verification
    await page.screenshot({ path: 'layout-name-editing-test.png', fullPage: true });
    
    // Check for save status indicators
    const saveStatus = page.locator('[data-testid="save-status"], .save-status, text=Saved, text=Saving').first();
    if (await saveStatus.isVisible()) {
      const saveStatusText = await saveStatus.textContent();
      console.log('Save status found:', saveStatusText);
    }
    
    // Check for any error messages
    const errorMessages = page.locator('.error, .mantine-Alert-root, [role="alert"]');
    const errorCount = await errorMessages.count();
    console.log('Error messages found:', errorCount);
    
    if (errorCount > 0) {
      for (let i = 0; i < errorCount; i++) {
        const errorText = await errorMessages.nth(i).textContent();
        console.log(`Error ${i + 1}:`, errorText);
      }
    }
  });

  test('should test layout name editing integration with save operations', async ({ page }) => {
    // Navigate to a layout editor
    await page.click('text=Models');
    await page.waitForLoadState('networkidle');
    
    // Use first model or create one
    const modelCards = page.locator('.mantine-Card-root');
    const modelCount = await modelCards.count();
    
    if (modelCount === 0) {
      await page.click('text=Create New Model');
      await page.waitForLoadState('networkidle');
      await page.fill('input[placeholder="Enter model name"]', 'Save Test Model');
      await page.click('button:has-text("Create Model")');
      await page.waitForLoadState('networkidle');
    } else {
      await modelCards.first().click();
      await page.waitForLoadState('networkidle');
    }
    
    // Go to layouts
    await page.click('text=Layouts');
    await page.waitForLoadState('networkidle');
    
    // Create or use existing layout
    const layoutCards = page.locator('.mantine-Card-root');
    const layoutCount = await layoutCards.count();
    
    if (layoutCount === 0) {
      await page.click('text=Create New Layout');
      await page.waitForLoadState('networkidle');
      await page.fill('input[placeholder="Enter layout name"]', 'Save Test Layout');
      await page.click('button:has-text("Create Layout")');
      await page.waitForLoadState('networkidle');
    } else {
      await layoutCards.first().click();
      await page.waitForLoadState('networkidle');
    }
    
    await page.waitForTimeout(3000);
    
    // Edit layout name
    const editIcon = page.locator('[data-testid="edit-layout-name"], .tabler-icon-pencil, .tabler-icon-edit, button:has([data-testid="edit-icon"])').first();
    
    if (await editIcon.isVisible()) {
      await editIcon.click();
      await page.waitForTimeout(500);
      
      const editInput = page.locator('input[data-testid="layout-name-input"], input[type="text"]').first();
      if (await editInput.isVisible()) {
        await editInput.clear();
        await editInput.fill('Integration Test Layout');
        await editInput.press('Enter');
        await page.waitForTimeout(1000);
      }
    }
    
    // Try to trigger a save operation
    const saveButton = page.locator('button:has-text("Save"), [data-testid="save-button"]').first();
    
    if (await saveButton.isVisible()) {
      console.log('Save button found, testing save operation');
      await saveButton.click();
      await page.waitForTimeout(2000);
      
      // Check for save confirmation
      const saveConfirmation = page.locator('text=Saved, text=Layout saved, .success-message').first();
      if (await saveConfirmation.isVisible()) {
        console.log('Save confirmation found');
      }
    }
    
    // Test keyboard shortcut for save (Ctrl+S)
    console.log('Testing Ctrl+S save shortcut');
    await page.keyboard.press('Control+s');
    await page.waitForTimeout(2000);
    
    // Take final screenshot
    await page.screenshot({ path: 'layout-save-integration-test.png', fullPage: true });
  });
});