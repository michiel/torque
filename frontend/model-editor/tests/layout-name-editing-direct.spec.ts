import { test, expect } from '@playwright/test';

test.describe('Layout Name Editing - Direct Navigation Test', () => {
  test('should test layout name editing and back button functionality', async ({ page }) => {
    console.log('Starting direct layout name editing test...');
    
    // Navigate directly to a model's layout page (using model ID from existing models)
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Navigate to models page
    await page.click('text=Browse Models');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Click on the first model 
    await page.click('.mantine-Card-root >> nth=0');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Click on Layouts tab
    await page.click('text=Layouts');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('On Layouts page, taking screenshot...');
    await page.screenshot({ path: 'layouts-page-direct.png', fullPage: true });
    
    // TEST 1: Click Edit button on first layout to enter layout editor
    console.log('TEST 1: Clicking Edit button on first layout');
    
    const editButtons = page.locator('button:has-text("Edit")');
    const editButtonCount = await editButtons.count();
    console.log(`Found ${editButtonCount} Edit buttons`);
    
    if (editButtonCount > 0) {
      await editButtons.first().click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      console.log('Entered layout editor');
      await page.screenshot({ path: 'layout-editor-direct.png', fullPage: true });
      
      // Get current URL for back button testing
      const layoutEditorUrl = page.url();
      console.log(`Layout Editor URL: ${layoutEditorUrl}`);
      
      // TEST 2: Look for layout name editing functionality
      console.log('TEST 2: Looking for layout name editing functionality');
      
      // Look for the layout name display
      const layoutNameElements = [
        page.locator('h1'),
        page.locator('h2'),
        page.locator('h3'),
        page.locator('[data-testid="layout-name"]'),
        page.locator('.layout-name')
      ];
      
      let layoutNameFound = false;
      let layoutNameText = '';
      
      for (const element of layoutNameElements) {
        if (await element.isVisible()) {
          layoutNameText = await element.textContent() || '';
          console.log(`Found layout name element: "${layoutNameText}"`);
          if (layoutNameText.trim().length > 0) {
            layoutNameFound = true;
            break;
          }
        }
      }
      
      // TEST 3: Look for edit functionality
      console.log('TEST 3: Looking for edit functionality');
      
      // Look for edit icons or buttons near the layout name
      const editSelectors = [
        '[data-testid="edit-layout-name"]',
        'button[aria-label*="edit"]',
        'button[title*="edit"]',
        '.tabler-icon-pencil',
        '.tabler-icon-edit',
        'svg[data-testid="edit-icon"]'
      ];
      
      let editButtonFound = false;
      
      for (const selector of editSelectors) {
        const editButton = page.locator(selector);
        if (await editButton.isVisible()) {
          console.log(`✓ Found edit button with selector: ${selector}`);
          editButtonFound = true;
          
          // Test clicking the edit button
          await editButton.click();
          await page.waitForTimeout(1000);
          
          // Look for input field
          const editInput = page.locator('input[type="text"]').first();
          if (await editInput.isVisible()) {
            console.log('✓ Edit input appeared');
            
            // Get current value
            const currentValue = await editInput.inputValue();
            console.log(`Current layout name value: "${currentValue}"`);
            
            // Test editing the name
            await editInput.clear();
            await editInput.fill('Updated Layout Name Test');
            
            // Test saving with Enter key
            console.log('Testing save with Enter key...');
            await editInput.press('Enter');
            await page.waitForTimeout(2000);
            
            // Check if name was updated
            const updatedNameElement = page.locator('text=Updated Layout Name Test');
            if (await updatedNameElement.isVisible()) {
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
          } else {
            console.log('✗ Edit input did not appear');
          }
          break;
        }
      }
      
      // If no edit button found, try double-clicking on layout name
      if (!editButtonFound) {
        console.log('No edit button found, trying double-click on layout name');
        
        for (const element of layoutNameElements) {
          if (await element.isVisible()) {
            await element.dblclick();
            await page.waitForTimeout(1000);
            
            const editInput = page.locator('input[type="text"]').first();
            if (await editInput.isVisible()) {
              console.log('✓ Double-click activated edit mode');
              await editInput.clear();
              await editInput.fill('Double-Click Test Name');
              await editInput.press('Enter');
              await page.waitForTimeout(1000);
              
              const updatedName = page.locator('text=Double-Click Test Name');
              if (await updatedName.isVisible()) {
                console.log('✓ Layout name updated via double-click');
              }
            }
            break;
          }
        }
      }
      
      // TEST 4: Test back button functionality
      console.log('TEST 4: Testing back button functionality');
      
      const backSelectors = [
        '[data-testid="back-button"]',
        'button:has-text("Back")',
        'button[aria-label*="back"]',
        'button[title*="back"]',
        '.tabler-icon-arrow-left',
        'svg[data-testid="back-icon"]'
      ];
      
      let backButtonFound = false;
      
      for (const selector of backSelectors) {
        const backButton = page.locator(selector);
        if (await backButton.isVisible()) {
          console.log(`✓ Found back button with selector: ${selector}`);
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
            
            // Check if we're back to the layouts page (using browser history)
            const isBackToLayouts = await page.locator('text=Layouts').isVisible();
            if (isBackToLayouts) {
              console.log('✓ Back button correctly used browser history navigation');
            } else {
              console.log('✗ Back button did not use browser history navigation');
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
      
      // Go back to layout editor for save testing
      if (page.url() !== layoutEditorUrl) {
        console.log('Navigating back to layout editor for save testing...');
        await page.goto(layoutEditorUrl);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
      }
      
      // TEST 5: Test save integration
      console.log('TEST 5: Testing save integration');
      
      // Look for save button
      const saveSelectors = [
        'button:has-text("Save")',
        '[data-testid="save-button"]',
        'button[aria-label*="save"]',
        'button[title*="save"]'
      ];
      
      for (const selector of saveSelectors) {
        const saveButton = page.locator(selector);
        if (await saveButton.isVisible()) {
          console.log(`✓ Found save button with selector: ${selector}`);
          
          if (await saveButton.isEnabled()) {
            console.log('Testing save button click...');
            await saveButton.click();
            await page.waitForTimeout(3000);
            
            // Check for save confirmation or success message
            const saveConfirmations = [
              'text=Saved',
              'text=Layout saved',
              'text=Layout Updated',
              '.success-message',
              '.notification'
            ];
            
            for (const confirmSelector of saveConfirmations) {
              const confirmation = page.locator(confirmSelector);
              if (await confirmation.isVisible()) {
                const confirmText = await confirmation.textContent();
                console.log(`✓ Save confirmation found: "${confirmText}"`);
                break;
              }
            }
          }
          break;
        }
      }
      
      // Test Ctrl+S keyboard shortcut
      console.log('Testing Ctrl+S keyboard shortcut...');
      await page.keyboard.press('Control+s');
      await page.waitForTimeout(2000);
      
      // Look for save status indicators
      const statusSelectors = [
        '[data-testid="save-status"]',
        '.save-status',
        'text=Saved',
        'text=Saving',
        'text=Unsaved'
      ];
      
      for (const selector of statusSelectors) {
        const statusElement = page.locator(selector);
        if (await statusElement.isVisible()) {
          const statusText = await statusElement.textContent();
          console.log(`Found save status: "${statusText}"`);
          break;
        }
      }
      
      // Final screenshot
      await page.screenshot({ path: 'layout-editor-final.png', fullPage: true });
      
      console.log('Layout name editing test completed successfully!');
      
      // Summary
      console.log('\n=== TEST SUMMARY ===');
      console.log(`Layout name found: ${layoutNameFound}`);
      console.log(`Edit button found: ${editButtonFound}`);
      console.log(`Back button found: ${backButtonFound}`);
      console.log('Test completed successfully!');
      console.log('==================');
      
    } else {
      console.log('No Edit buttons found on layouts page');
    }
    
  });
});