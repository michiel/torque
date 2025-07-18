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

  test('should test layout name editing functionality', async ({ page }) => {
    console.log('Starting layout name editing test...');
    
    // Navigate to Browse Models
    await page.click('text=Browse Models');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('Navigated to Browse Models page');
    
    // Take a screenshot to see the models page
    await page.screenshot({ path: 'models-page-screenshot.png', fullPage: true });
    
    // Click on the first model in the Recent Models section or model cards
    const modelCards = page.locator('.mantine-Card-root, [data-testid="model-card"]');
    const modelCount = await modelCards.count();
    
    if (modelCount > 0) {
      console.log(`Found ${modelCount} model cards, clicking the first one`);
      await modelCards.first().click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
    } else {
      console.log('No model cards found, looking for recent models links');
      // Try clicking on recent models links
      const recentModelLinks = page.locator('[href*="/models/"]');
      const linkCount = await recentModelLinks.count();
      
      if (linkCount > 0) {
        console.log(`Found ${linkCount} recent model links, clicking the first one`);
        await recentModelLinks.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
      } else {
        console.log('No models found, creating a new one');
        await page.click('text=Create New Model');
        await page.waitForLoadState('networkidle');
        await page.fill('input[placeholder*="name"]', 'Test Model for Layout Editing');
        await page.click('button:has-text("Create")');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
      }
    }
    
    // Take screenshot of model details page
    await page.screenshot({ path: 'model-details-page.png', fullPage: true });
    
    // Look for Layouts tab or navigation
    const layoutsTab = page.locator('text=Layouts, [data-testid="layouts-tab"]');
    
    if (await layoutsTab.isVisible()) {
      console.log('Found Layouts tab, clicking it');
      await layoutsTab.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    } else {
      console.log('Layouts tab not found, looking for layout navigation');
      // Try finding layouts navigation in different ways
      const layoutNav = page.locator('a[href*="layout"], button:has-text("Layout")');
      if (await layoutNav.count() > 0) {
        await layoutNav.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
      }
    }
    
    // Take screenshot of layouts page
    await page.screenshot({ path: 'layouts-page-screenshot.png', fullPage: true });
    
    // Look for existing layouts or create new layout button
    const createLayoutBtn = page.locator('button:has-text("Create"), text=Create New Layout, [data-testid="create-layout"]');
    const layoutItems = page.locator('.mantine-Card-root, [data-testid="layout-item"]');
    
    const existingLayoutCount = await layoutItems.count();
    
    if (existingLayoutCount > 0) {
      console.log(`Found ${existingLayoutCount} existing layouts, clicking the first one`);
      await layoutItems.first().click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
    } else if (await createLayoutBtn.isVisible()) {
      console.log('Creating new layout');
      await createLayoutBtn.click();
      await page.waitForLoadState('networkidle');
      
      // Fill in layout name if prompted
      const nameInput = page.locator('input[placeholder*="name"], input[placeholder*="Layout"]');
      if (await nameInput.isVisible()) {
        await nameInput.fill('Test Layout for Name Editing');
        await page.click('button:has-text("Create")');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
      }
    } else {
      console.log('No way to create or access layouts found');
      return;
    }
    
    // Now we should be in the Visual Layout Editor
    console.log('Should now be in Visual Layout Editor');
    await page.waitForTimeout(3000);
    
    // Take screenshot of the layout editor
    await page.screenshot({ path: 'layout-editor-screenshot.png', fullPage: true });
    
    // Test 1: Check for layout name display
    console.log('Test 1: Looking for layout name in header');
    
    // Look for layout name display in various possible locations
    const possibleNameElements = [
      page.locator('h1, h2, h3').filter({ hasText: 'Layout' }),
      page.locator('[data-testid="layout-name"]'),
      page.locator('.layout-name'),
      page.locator('text=Test Layout for Name Editing'),
      page.locator('header').locator('text=Layout'),
      page.locator('[role="heading"]').filter({ hasText: 'Layout' })
    ];
    
    let layoutNameFound = false;
    let currentLayoutName = '';
    
    for (const element of possibleNameElements) {
      if (await element.isVisible()) {
        currentLayoutName = await element.textContent() || '';
        console.log(`Found layout name element: "${currentLayoutName}"`);
        layoutNameFound = true;
        break;
      }
    }
    
    if (!layoutNameFound) {
      console.log('Layout name not found in header, checking page title');
      const pageTitle = await page.title();
      console.log(`Page title: ${pageTitle}`);
    }
    
    // Test 2: Look for edit functionality
    console.log('Test 2: Looking for edit functionality');
    
    // Look for edit icons or buttons
    const editElements = [
      page.locator('[data-testid="edit-layout-name"]'),
      page.locator('.tabler-icon-pencil'),
      page.locator('.tabler-icon-edit'),
      page.locator('button:has([data-testid="edit-icon"])'),
      page.locator('button').filter({ hasText: 'Edit' }),
      page.locator('[aria-label*="edit"]'),
      page.locator('svg[data-testid="edit"]')
    ];
    
    let editButtonFound = false;
    
    for (const element of editElements) {
      if (await element.isVisible()) {
        console.log('Found edit button, testing click');
        await element.click();
        await page.waitForTimeout(1000);
        
        // Look for input field
        const editInput = page.locator('input[type="text"]').first();
        if (await editInput.isVisible()) {
          console.log('Edit input appeared, testing editing');
          
          // Test editing the name
          await editInput.clear();
          await editInput.fill('Updated Layout Name Via Edit');
          
          // Test saving with Enter
          console.log('Testing save with Enter key');
          await editInput.press('Enter');
          await page.waitForTimeout(2000);
          
          // Check if name was updated
          const updatedNameCheck = page.locator('text=Updated Layout Name Via Edit');
          if (await updatedNameCheck.isVisible()) {
            console.log('✓ Name successfully updated with Enter key');
          } else {
            console.log('✗ Name was not updated with Enter key');
          }
          
          editButtonFound = true;
          break;
        }
      }
    }
    
    if (!editButtonFound) {
      console.log('Edit button not found, trying double-click on layout name');
      
      // Try double-clicking on layout name elements
      for (const element of possibleNameElements) {
        if (await element.isVisible()) {
          console.log('Trying double-click on layout name element');
          await element.dblclick();
          await page.waitForTimeout(1000);
          
          const editInput = page.locator('input[type="text"]').first();
          if (await editInput.isVisible()) {
            console.log('Double-click activated edit mode');
            await editInput.clear();
            await editInput.fill('Double-Click Updated Name');
            
            // Test cancel with Escape
            console.log('Testing cancel with Escape key');
            await editInput.press('Escape');
            await page.waitForTimeout(1000);
            
            // Check that name wasn't changed
            const canceledCheck = page.locator('text=Double-Click Updated Name');
            if (await canceledCheck.isVisible()) {
              console.log('✗ Cancel with Escape did not work');
            } else {
              console.log('✓ Cancel with Escape worked correctly');
            }
            
            break;
          }
        }
      }
    }
    
    // Test 3: Test back button functionality
    console.log('Test 3: Testing back button functionality');
    
    const backButtons = [
      page.locator('[data-testid="back-button"]'),
      page.locator('button:has-text("Back")'),
      page.locator('.tabler-icon-arrow-left'),
      page.locator('button').filter({ hasText: 'Back' }),
      page.locator('[aria-label*="back"]'),
      page.locator('svg[data-testid="back"]')
    ];
    
    let backButtonFound = false;
    const currentUrl = page.url();
    
    for (const element of backButtons) {
      if (await element.isVisible()) {
        console.log('Found back button, testing navigation');
        console.log(`Current URL: ${currentUrl}`);
        
        await element.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        const newUrl = page.url();
        console.log(`New URL: ${newUrl}`);
        
        if (currentUrl !== newUrl) {
          console.log('✓ Back button successfully navigated to previous page');
          
          // Check if we're back to layouts page or model details
          const isBackToLayouts = page.url().includes('layout') || await page.locator('text=Layouts').isVisible();
          if (isBackToLayouts) {
            console.log('✓ Back button used browser history navigation correctly');
          } else {
            console.log('✗ Back button did not use browser history navigation');
          }
        } else {
          console.log('✗ Back button did not navigate');
        }
        
        backButtonFound = true;
        break;
      }
    }
    
    if (!backButtonFound) {
      console.log('Back button not found, testing browser back');
      await page.goBack();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      const newUrl = page.url();
      console.log(`URL after browser back: ${newUrl}`);
    }
    
    // Test 4: Test save integration
    console.log('Test 4: Testing save integration');
    
    // Look for save button or status
    const saveElements = [
      page.locator('button:has-text("Save")'),
      page.locator('[data-testid="save-button"]'),
      page.locator('.save-status'),
      page.locator('[data-testid="save-status"]'),
      page.locator('text=Saved'),
      page.locator('text=Saving')
    ];
    
    for (const element of saveElements) {
      if (await element.isVisible()) {
        const saveText = await element.textContent();
        console.log(`Found save element: "${saveText}"`);
        
        if (await element.isEnabled() && saveText?.includes('Save')) {
          console.log('Testing save button click');
          await element.click();
          await page.waitForTimeout(2000);
          
          // Check for save confirmation
          const saveConfirmation = page.locator('text=Saved, text=Layout saved, .success-message');
          if (await saveConfirmation.isVisible()) {
            console.log('✓ Save operation completed successfully');
          }
        }
        break;
      }
    }
    
    // Test Ctrl+S shortcut
    console.log('Testing Ctrl+S save shortcut');
    await page.keyboard.press('Control+s');
    await page.waitForTimeout(2000);
    
    // Final screenshot for report
    await page.screenshot({ path: 'layout-editor-final-test.png', fullPage: true });
    
    console.log('Layout name editing test completed!');
  });
});