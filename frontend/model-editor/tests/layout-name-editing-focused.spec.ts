import { test, expect } from '@playwright/test';

test.describe('Layout Name Editing and Back Button - Focused Test', () => {
  test('should test layout name editing and back button functionality', async ({ page }) => {
    console.log('Starting focused layout name editing test...');
    
    // Navigate to home page
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Take initial screenshot
    await page.screenshot({ path: 'test-start.png', fullPage: true });
    
    // Navigate to Models page by clicking Browse Models
    await page.click('text=Browse Models');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('On Models page');
    await page.screenshot({ path: 'models-page.png', fullPage: true });
    
    // Click on first model card (Customer Order Management)
    const firstModelCard = page.locator('.mantine-Card-root').first();
    await firstModelCard.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('On Model details page');
    await page.screenshot({ path: 'model-details.png', fullPage: true });
    
    // Look for Layouts tab or navigation
    const layoutsTab = page.locator('text=Layouts');
    
    if (await layoutsTab.isVisible()) {
      console.log('Found Layouts tab, clicking it');
      await layoutsTab.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      console.log('On Layouts page');
      await page.screenshot({ path: 'layouts-page.png', fullPage: true });
      
      // Look for existing layout or create new one
      const existingLayouts = page.locator('.mantine-Card-root');
      const layoutCount = await existingLayouts.count();
      
      if (layoutCount > 0) {
        console.log(`Found ${layoutCount} existing layouts, clicking first one`);
        await existingLayouts.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
      } else {
        console.log('No existing layouts, creating new one');
        const createBtn = page.locator('button:has-text("Create Layout"), button:has-text("Create")');
        if (await createBtn.isVisible()) {
          await createBtn.click();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(2000);
          
          // Fill in layout name if prompted
          const nameInput = page.locator('input[placeholder*="name"]');
          if (await nameInput.isVisible()) {
            await nameInput.fill('Test Layout for Name Editing');
            await page.click('button:has-text("Create")');
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(3000);
          }
        }
      }
    } else {
      console.log('Layouts tab not found, looking for alternative navigation');
      
      // Try to find layout links or buttons
      const layoutLink = page.locator('a[href*="layout"], button:has-text("Layout")');
      if (await layoutLink.count() > 0) {
        await layoutLink.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
      } else {
        console.log('No layout navigation found');
        return;
      }
    }
    
    console.log('Should now be in Layout Editor');
    await page.screenshot({ path: 'layout-editor.png', fullPage: true });
    
    // Get the current URL for back button testing
    const layoutEditorUrl = page.url();
    console.log(`Layout Editor URL: ${layoutEditorUrl}`);
    
    // TEST 1: Look for layout name in various places
    console.log('TEST 1: Looking for layout name display');
    
    let layoutNameFound = false;
    let layoutNameElement = null;
    
    // Check page title
    const pageTitle = await page.title();
    console.log(`Page title: ${pageTitle}`);
    
    // Look for headings with layout-related text
    const headings = page.locator('h1, h2, h3, h4');
    const headingCount = await headings.count();
    console.log(`Found ${headingCount} headings`);
    
    for (let i = 0; i < headingCount; i++) {
      const heading = headings.nth(i);
      const text = await heading.textContent();
      console.log(`Heading ${i}: "${text}"`);
      if (text && text.toLowerCase().includes('layout')) {
        layoutNameFound = true;
        layoutNameElement = heading;
        console.log(`✓ Found layout name in heading: "${text}"`);
        break;
      }
    }
    
    // Look for other text elements that might contain layout name
    if (!layoutNameFound) {
      const textElements = page.locator('[data-testid*="layout"], [class*="layout"], [id*="layout"]');
      const textCount = await textElements.count();
      console.log(`Found ${textCount} layout-related elements`);
      
      for (let i = 0; i < textCount; i++) {
        const element = textElements.nth(i);
        if (await element.isVisible()) {
          const text = await element.textContent();
          console.log(`Layout element ${i}: "${text}"`);
          if (text && text.trim().length > 0) {
            layoutNameFound = true;
            layoutNameElement = element;
            break;
          }
        }
      }
    }
    
    // TEST 2: Look for edit functionality
    console.log('TEST 2: Looking for edit functionality');
    
    // Look for edit icons or buttons
    const editSelectors = [
      '[data-testid="edit-layout-name"]',
      '[data-testid="edit-icon"]',
      'button[aria-label*="edit"]',
      'button[title*="edit"]',
      '.tabler-icon-pencil',
      '.tabler-icon-edit',
      'svg[data-testid="edit"]',
      'button:has-text("Edit")'
    ];
    
    let editButtonFound = false;
    
    for (const selector of editSelectors) {
      const editButton = page.locator(selector);
      if (await editButton.isVisible()) {
        console.log(`Found edit button with selector: ${selector}`);
        editButtonFound = true;
        
        // Test clicking the edit button
        await editButton.click();
        await page.waitForTimeout(1000);
        
        // Look for input field that should appear
        const editInput = page.locator('input[type="text"]').first();
        if (await editInput.isVisible()) {
          console.log('✓ Edit input appeared after clicking edit button');
          
          // Test editing the name
          await editInput.clear();
          await editInput.fill('Updated Layout Name');
          
          // Test saving with Enter key
          console.log('Testing save with Enter key...');
          await editInput.press('Enter');
          await page.waitForTimeout(2000);
          
          // Check if the name was updated
          const updatedName = page.locator('text=Updated Layout Name');
          if (await updatedName.isVisible()) {
            console.log('✓ Layout name successfully updated with Enter key');
          } else {
            console.log('✗ Layout name was not updated with Enter key');
          }
          
          // Test editing again and canceling with Escape
          if (await editButton.isVisible()) {
            console.log('Testing cancel with Escape key...');
            await editButton.click();
            await page.waitForTimeout(500);
            
            const editInput2 = page.locator('input[type="text"]').first();
            if (await editInput2.isVisible()) {
              await editInput2.clear();
              await editInput2.fill('Should Be Canceled');
              await editInput2.press('Escape');
              await page.waitForTimeout(1000);
              
              // Check that the name wasn't changed
              const canceledName = page.locator('text=Should Be Canceled');
              if (await canceledName.isVisible()) {
                console.log('✗ Cancel with Escape did not work');
              } else {
                console.log('✓ Cancel with Escape worked correctly');
              }
            }
          }
        }
        break;
      }
    }
    
    // If no edit button found, try double-clicking on layout name
    if (!editButtonFound && layoutNameElement) {
      console.log('No edit button found, trying double-click on layout name');
      await layoutNameElement.dblclick();
      await page.waitForTimeout(1000);
      
      const editInput = page.locator('input[type="text"]').first();
      if (await editInput.isVisible()) {
        console.log('✓ Double-click activated edit mode');
        await editInput.clear();
        await editInput.fill('Double-Click Updated Name');
        await editInput.press('Enter');
        await page.waitForTimeout(1000);
        
        const updatedName = page.locator('text=Double-Click Updated Name');
        if (await updatedName.isVisible()) {
          console.log('✓ Layout name updated via double-click');
        }
      }
    }
    
    // TEST 3: Test back button functionality
    console.log('TEST 3: Testing back button functionality');
    
    const backSelectors = [
      '[data-testid="back-button"]',
      'button:has-text("Back")',
      'button[aria-label*="back"]',
      'button[title*="back"]',
      '.tabler-icon-arrow-left',
      'svg[data-testid="back"]',
      'button:has([data-testid="back"])'
    ];
    
    let backButtonFound = false;
    
    for (const selector of backSelectors) {
      const backButton = page.locator(selector);
      if (await backButton.isVisible()) {
        console.log(`Found back button with selector: ${selector}`);
        backButtonFound = true;
        
        // Test clicking the back button
        console.log(`Current URL before back: ${page.url()}`);
        await backButton.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        const newUrl = page.url();
        console.log(`New URL after back: ${newUrl}`);
        
        if (newUrl !== layoutEditorUrl) {
          console.log('✓ Back button successfully navigated to previous page');
          
          // Check if we're back to the correct page (not forced to first tab)
          if (newUrl.includes('layout') || await page.locator('text=Layouts').isVisible()) {
            console.log('✓ Back button correctly used browser history navigation');
          } else {
            console.log('✗ Back button did not preserve navigation context');
          }
        } else {
          console.log('✗ Back button did not navigate');
        }
        break;
      }
    }
    
    if (!backButtonFound) {
      console.log('No back button found, testing browser back button');
      await page.goBack();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      const newUrl = page.url();
      console.log(`URL after browser back: ${newUrl}`);
      
      if (newUrl !== layoutEditorUrl) {
        console.log('✓ Browser back button worked');
      }
    }
    
    // TEST 4: Test save integration
    console.log('TEST 4: Testing save integration');
    
    // Look for save button or save status
    const saveSelectors = [
      'button:has-text("Save")',
      '[data-testid="save-button"]',
      'button[aria-label*="save"]',
      'button[title*="save"]'
    ];
    
    const statusSelectors = [
      '[data-testid="save-status"]',
      '.save-status',
      'text=Saved',
      'text=Saving',
      'text=Unsaved'
    ];
    
    // Check for save button
    for (const selector of saveSelectors) {
      const saveButton = page.locator(selector);
      if (await saveButton.isVisible()) {
        console.log(`Found save button with selector: ${selector}`);
        
        if (await saveButton.isEnabled()) {
          console.log('Testing save button click...');
          await saveButton.click();
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
    
    // Check for save status
    for (const selector of statusSelectors) {
      const statusElement = page.locator(selector);
      if (await statusElement.isVisible()) {
        const statusText = await statusElement.textContent();
        console.log(`Found save status: "${statusText}"`);
        break;
      }
    }
    
    // Test Ctrl+S keyboard shortcut
    console.log('Testing Ctrl+S keyboard shortcut...');
    await page.keyboard.press('Control+s');
    await page.waitForTimeout(2000);
    
    // Final screenshot
    await page.screenshot({ path: 'test-complete.png', fullPage: true });
    
    console.log('Layout name editing and back button test completed!');
    
    // Summary
    console.log('\n=== TEST SUMMARY ===');
    console.log(`Layout name found: ${layoutNameFound}`);
    console.log(`Edit button found: ${editButtonFound}`);
    console.log(`Back button found: ${backButtonFound}`);
    console.log('==================');
  });
});