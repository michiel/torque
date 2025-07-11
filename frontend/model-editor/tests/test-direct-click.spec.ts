import { test, expect } from '@playwright/test';

test('Direct Edit Button Click Test', async ({ page }) => {
  console.log('🧪 Testing direct Edit button click');
  
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
  
  // Use JavaScript to trigger the click handler directly
  await page.evaluate(() => {
    // Find the Edit button and try to trigger it manually
    const editButtons = document.querySelectorAll('button');
    let targetButton = null;
    
    for (let button of editButtons) {
      if (button.textContent === 'Edit') {
        targetButton = button;
        break;
      }
    }
    
    if (targetButton) {
      console.log('Found Edit button, attempting to click...');
      
      // Try to trigger the React event handler directly
      const reactProps = Object.keys(targetButton).find(key => key.startsWith('__reactProps'));
      if (reactProps) {
        const props = targetButton[reactProps];
        console.log('React props:', props);
        
        if (props && props.onClick) {
          console.log('Calling onClick handler directly...');
          props.onClick();
        }
      }
      
      // Also try a regular click
      targetButton.click();
      
      // Try dispatching a click event
      const clickEvent = new Event('click', { bubbles: true });
      targetButton.dispatchEvent(clickEvent);
    }
  });
  
  // Wait for modal to appear
  await page.waitForTimeout(1000);
  
  // Check if modal appeared
  const modal = page.locator('[role="dialog"]');
  const modalVisible = await modal.isVisible();
  console.log(`Modal visible: ${modalVisible}`);
  
  // Take screenshot
  await page.screenshot({ path: 'test-results/direct-click-test.png', fullPage: true });
  
  console.log('🏁 Test completed');
});