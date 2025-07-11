import { test, expect } from '@playwright/test';

test('Debug buttons on page', async ({ page }) => {
  // Navigate to the frontend
  await page.goto('http://localhost:3000');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Navigate to Models page
  await page.click('a[href*="/models"]');
  await page.waitForLoadState('networkidle');
  
  // Find all buttons on the page
  const buttons = page.locator('button');
  const buttonCount = await buttons.count();
  
  console.log(`Found ${buttonCount} buttons on the page`);
  
  for (let i = 0; i < buttonCount; i++) {
    const button = buttons.nth(i);
    const text = await button.textContent();
    console.log(`Button ${i}: "${text}"`);
  }
  
  // Also check for clickable elements with text "Open"
  const openElements = page.locator('text=Open');
  const openCount = await openElements.count();
  console.log(`Found ${openCount} elements with text "Open"`);
  
  for (let i = 0; i < openCount; i++) {
    const element = openElements.nth(i);
    const tagName = await element.evaluate(el => el.tagName);
    const text = await element.textContent();
    console.log(`Open element ${i}: <${tagName}> "${text}"`);
  }
  
  // Take a screenshot
  await page.screenshot({ path: 'test-results/debug-buttons.png', fullPage: true });
});