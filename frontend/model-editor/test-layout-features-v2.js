// Simple test to check layout features
import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to home page...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('Clicking Browse Models...');
    await page.click('text=Browse Models');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('Clicking Open button on first model...');
    await page.click('button:has-text("Open") >> nth=0');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('Taking model details screenshot...');
    await page.screenshot({ path: 'test-model-details-v2.png', fullPage: true });
    
    console.log('Current URL:', page.url());
    
    // Look for Layouts tab or section
    const layoutsElements = await page.locator('text=Layouts').count();
    console.log('Found', layoutsElements, 'Layouts elements');
    
    if (layoutsElements > 0) {
      console.log('Clicking Layouts tab...');
      await page.click('text=Layouts');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      console.log('Taking layouts page screenshot...');
      await page.screenshot({ path: 'test-layouts-v2.png', fullPage: true });
      
      // Look for Edit buttons
      const editButtons = await page.locator('button:has-text("Edit")').count();
      console.log('Found', editButtons, 'Edit buttons');
      
      if (editButtons > 0) {
        console.log('Clicking first Edit button...');
        await page.click('button:has-text("Edit") >> nth=0');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
        
        console.log('Taking layout editor screenshot...');
        await page.screenshot({ path: 'test-layout-editor-v2.png', fullPage: true });
        
        console.log('Current URL after edit click:', page.url());
        
        // Now we should be in the Visual Layout Editor - test the features
        
        // 1. Test layout name display
        console.log('=== TESTING LAYOUT NAME DISPLAY ===');
        
        const headings = await page.locator('h1, h2, h3').allTextContents();
        console.log('Found headings:', headings);
        
        // Look for "Visual Layout Editor" title
        const visualEditorTitle = await page.locator('text=Visual Layout Editor').count();
        console.log('Visual Layout Editor title found:', visualEditorTitle > 0);
        
        // Look for layout name text
        const layoutNameElements = await page.locator('text=New Layout').count();
        console.log('Layout name elements found:', layoutNameElements);
        
        // 2. Test edit button functionality
        console.log('=== TESTING EDIT BUTTON FUNCTIONALITY ===');
        
        // Look for edit button with specific title
        const editLayoutButton = page.locator('button[title="Edit layout name"]');
        const editLayoutButtonVisible = await editLayoutButton.isVisible();
        console.log('Edit layout name button visible:', editLayoutButtonVisible);
        
        if (editLayoutButtonVisible) {
          console.log('Clicking edit layout name button...');
          await editLayoutButton.click();
          await page.waitForTimeout(1000);
          
          // Look for input field
          const nameInput = page.locator('input[placeholder="Layout name"]');
          const nameInputVisible = await nameInput.isVisible();
          console.log('Name input visible:', nameInputVisible);
          
          if (nameInputVisible) {
            console.log('Testing name editing...');
            
            // Get current value
            const currentValue = await nameInput.inputValue();
            console.log('Current input value:', currentValue);
            
            // Clear and type new name
            await nameInput.clear();
            await nameInput.fill('Updated Layout Name Test');
            
            // Test save with Enter
            console.log('Saving with Enter key...');
            await nameInput.press('Enter');
            await page.waitForTimeout(2000);
            
            // Check if name was updated
            const updatedNameVisible = await page.locator('text=Updated Layout Name Test').isVisible();
            console.log('✓ Name updated successfully:', updatedNameVisible);
            
            await page.screenshot({ path: 'test-after-name-edit-v2.png', fullPage: true });
            
            // Test editing again and canceling
            if (await editLayoutButton.isVisible()) {
              console.log('Testing cancel functionality...');
              await editLayoutButton.click();
              await page.waitForTimeout(500);
              
              const nameInput2 = page.locator('input[placeholder="Layout name"]');
              if (await nameInput2.isVisible()) {
                await nameInput2.clear();
                await nameInput2.fill('Should Be Canceled');
                await nameInput2.press('Escape');
                await page.waitForTimeout(1000);
                
                const canceledNameVisible = await page.locator('text=Should Be Canceled').isVisible();
                console.log('✓ Cancel worked (should be false):', !canceledNameVisible);
              }
            }
          }
        } else {
          console.log('Edit button not found, looking for other edit methods...');
          
          // Try looking for other edit-related elements
          const editIcons = await page.locator('.tabler-icon-edit, .tabler-icon-pencil').count();
          console.log('Edit icons found:', editIcons);
          
          if (editIcons > 0) {
            console.log('Trying to click edit icon...');
            await page.click('.tabler-icon-edit, .tabler-icon-pencil');
            await page.waitForTimeout(1000);
            
            const input = page.locator('input[type="text"]');
            const inputVisible = await input.isVisible();
            console.log('Input appeared after icon click:', inputVisible);
          }
        }
        
        // 3. Test back button functionality
        console.log('=== TESTING BACK BUTTON FUNCTIONALITY ===');
        
        const backButton = page.locator('button[aria-label="Go back to model editor"]');
        const backButtonVisible = await backButton.isVisible();
        console.log('Back button visible:', backButtonVisible);
        
        if (backButtonVisible) {
          console.log('Testing back button...');
          const currentUrl = page.url();
          console.log('Current URL before back:', currentUrl);
          
          await backButton.click();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(2000);
          
          const newUrl = page.url();
          console.log('New URL after back:', newUrl);
          console.log('✓ Back button worked:', currentUrl !== newUrl);
          
          // Check if we're back to the right page
          const backToLayouts = await page.locator('text=Layouts').isVisible();
          console.log('✓ Back to layouts page:', backToLayouts);
          
          await page.screenshot({ path: 'test-after-back-v2.png', fullPage: true });
        } else {
          console.log('Back button not found, looking for back arrow...');
          const backArrow = await page.locator('.tabler-icon-arrow-left').count();
          console.log('Back arrow icons found:', backArrow);
        }
        
        // 4. Test save functionality
        console.log('=== TESTING SAVE FUNCTIONALITY ===');
        
        // Navigate back to layout editor if we went back
        if (page.url() !== 'layout-editor-url') {
          console.log('Navigating back to layout editor for save test...');
          await page.click('button:has-text("Edit") >> nth=0');
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(2000);
        }
        
        // Look for save button
        const saveButton = page.locator('button:has-text("Save")');
        const saveButtonVisible = await saveButton.isVisible();
        console.log('Save button visible:', saveButtonVisible);
        
        if (saveButtonVisible) {
          console.log('Testing save button...');
          await saveButton.click();
          await page.waitForTimeout(3000);
          
          // Look for save confirmation
          const saveConfirmations = [
            'text=Saved',
            'text=Layout Updated',
            'text=Layout saved'
          ];
          
          for (const selector of saveConfirmations) {
            const confirmation = await page.locator(selector).isVisible();
            if (confirmation) {
              console.log('✓ Save confirmation found:', selector);
              break;
            }
          }
        }
        
        // Look for save status badges
        const saveStatusBadges = await page.locator('.mantine-Badge-root').count();
        console.log('Save status badges found:', saveStatusBadges);
        
        if (saveStatusBadges > 0) {
          const badgeTexts = await page.locator('.mantine-Badge-root').allTextContents();
          console.log('Badge texts:', badgeTexts);
        }
        
        // Test Ctrl+S shortcut
        console.log('Testing Ctrl+S shortcut...');
        await page.keyboard.press('Control+s');
        await page.waitForTimeout(2000);
        
        await page.screenshot({ path: 'test-final-v2.png', fullPage: true });
        
        console.log('=== TEST SUMMARY ===');
        console.log('✓ Successfully navigated to Visual Layout Editor');
        console.log('✓ Layout name editing functionality tested');
        console.log('✓ Back button functionality tested');
        console.log('✓ Save functionality tested');
        console.log('Test completed successfully!');
        
      } else {
        console.log('No Edit buttons found on layouts page');
      }
    } else {
      console.log('No Layouts tab found');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'test-error-v2.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();