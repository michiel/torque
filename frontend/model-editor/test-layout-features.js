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
    
    console.log('Taking home page screenshot...');
    await page.screenshot({ path: 'test-home.png', fullPage: true });
    
    console.log('Clicking Browse Models...');
    await page.click('text=Browse Models');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('Taking models page screenshot...');
    await page.screenshot({ path: 'test-models.png', fullPage: true });
    
    console.log('Clicking first model...');
    await page.click('.mantine-Card-root >> nth=0');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('Taking model details screenshot...');
    await page.screenshot({ path: 'test-model-details.png', fullPage: true });
    
    console.log('Clicking Layouts tab...');
    await page.click('text=Layouts');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('Taking layouts page screenshot...');
    await page.screenshot({ path: 'test-layouts.png', fullPage: true });
    
    console.log('Clicking first Edit button...');
    await page.click('button:has-text("Edit") >> nth=0');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('Taking layout editor screenshot...');
    await page.screenshot({ path: 'test-layout-editor.png', fullPage: true });
    
    console.log('Current URL:', page.url());
    console.log('Page title:', await page.title());
    
    // Test layout name editing
    console.log('Testing layout name editing...');
    
    // Look for the layout name text and edit button
    const layoutNameText = await page.locator('text=New Layout').textContent();
    console.log('Layout name text:', layoutNameText);
    
    // Look for edit button near layout name
    const editButton = page.locator('button[title="Edit layout name"]');
    const editButtonVisible = await editButton.isVisible();
    console.log('Edit button visible:', editButtonVisible);
    
    if (editButtonVisible) {
      console.log('Clicking edit button...');
      await editButton.click();
      await page.waitForTimeout(1000);
      
      // Look for input field
      const input = page.locator('input[placeholder="Layout name"]');
      const inputVisible = await input.isVisible();
      console.log('Input field visible:', inputVisible);
      
      if (inputVisible) {
        console.log('Testing name editing...');
        await input.clear();
        await input.fill('Test Layout Name');
        await input.press('Enter');
        await page.waitForTimeout(2000);
        
        console.log('Name editing test complete');
        await page.screenshot({ path: 'test-after-name-edit.png', fullPage: true });
      }
    }
    
    // Test back button
    console.log('Testing back button...');
    const backButton = page.locator('button[aria-label="Go back to model editor"]');
    const backButtonVisible = await backButton.isVisible();
    console.log('Back button visible:', backButtonVisible);
    
    if (backButtonVisible) {
      console.log('Clicking back button...');
      const currentUrl = page.url();
      console.log('Current URL before back:', currentUrl);
      
      await backButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      const newUrl = page.url();
      console.log('New URL after back:', newUrl);
      console.log('Back button worked:', currentUrl !== newUrl);
      
      await page.screenshot({ path: 'test-after-back.png', fullPage: true });
    }
    
    console.log('Test completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'test-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();