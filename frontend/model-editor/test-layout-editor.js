import { chromium } from 'playwright';

(async () => {
  console.log('Starting browser...');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Navigate to the home page
    console.log('Navigating to home page...');
    await page.goto('http://localhost:3005/');
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot of the home page
    console.log('Taking screenshot of home page...');
    await page.screenshot({ path: 'home-page.png' });
    
    // Try to click "Browse Models"
    console.log('Looking for Browse Models button...');
    const browseModelsButton = page.locator('text=Browse Models');
    if (await browseModelsButton.isVisible()) {
      await browseModelsButton.click();
      await page.waitForLoadState('networkidle');
      
      // Take a screenshot of the models page
      console.log('Taking screenshot of models page...');
      await page.screenshot({ path: 'models-page.png' });
      
      // Look for the Open button and click it
      console.log('Looking for Open button...');
      // Wait for the models to load
      await page.waitForTimeout(2000);
      
      // Debug: print all button texts and look for text "Open"
      const allButtons = await page.locator('button').all();
      console.log('Found buttons:', allButtons.length);
      for (const button of allButtons) {
        const text = await button.textContent();
        console.log('Button text:', JSON.stringify(text));
      }
      
      // Look for any element with "Open" text
      const openElements = await page.locator('text=Open').all();
      console.log('Found elements with "Open" text:', openElements.length);
      for (const element of openElements) {
        const text = await element.textContent();
        const tagName = await element.evaluate(el => el.tagName);
        console.log('Open element:', tagName, JSON.stringify(text));
      }
      
      // Try to find and click the Open span
      const openSpan = page.locator('span').filter({ hasText: 'Open' }).first();
      if (await openSpan.isVisible()) {
        console.log('Found Open span, clicking...');
        await openSpan.click();
      } else {
        console.log('Open span not found');
        return;
      }
      await page.waitForLoadState('networkidle');
      
      // Take a screenshot of the model editor
      console.log('Taking screenshot of model editor...');
      await page.screenshot({ path: 'model-editor.png' });
      
      // Look for "Layouts" tab
      const layoutsTab = page.locator('span').filter({ hasText: 'Layouts' }).first();
      if (await layoutsTab.isVisible()) {
        console.log('Found Layouts tab, clicking...');
        await layoutsTab.click();
        await page.waitForLoadState('networkidle');
        
        // Take a screenshot of the layouts page
        console.log('Taking screenshot of layouts page...');
        await page.screenshot({ path: 'layouts-page.png' });
        
        // Look for create layout button or existing layout
        const createLayoutButton = page.locator('text=Create Layout');
        if (await createLayoutButton.isVisible()) {
          console.log('Found Create Layout button, clicking...');
          await createLayoutButton.click();
          await page.waitForLoadState('networkidle');
          
          // Take a screenshot of the layout editor
          console.log('Taking screenshot of layout editor...');
          await page.screenshot({ path: 'layout-editor.png' });
          
          // Look for component palette
          const componentPalette = page.locator('[data-testid="component-palette"]');
          if (await componentPalette.isVisible()) {
            console.log('✅ Component palette is visible!');
          } else {
            console.log('❌ Component palette is not visible');
          }
          
          // Look for layout canvas
          const layoutCanvas = page.locator('[data-testid="layout-canvas"]');
          if (await layoutCanvas.isVisible()) {
            console.log('✅ Layout canvas is visible!');
          } else {
            console.log('❌ Layout canvas is not visible');
          }
          
          // Look for the Puck editor
          const puckEditor = page.locator('[data-rbd-droppable-id="puck-droppable"]');
          if (await puckEditor.isVisible()) {
            console.log('✅ Puck editor droppable area is visible!');
          } else {
            console.log('❌ Puck editor droppable area is not visible');
          }
          
          // Check for component palette items
          const containerComponent = page.locator('text=Container');
          if (await containerComponent.isVisible()) {
            console.log('✅ Container component in palette is visible!');
          } else {
            console.log('❌ Container component in palette is not visible');
          }
          
          const textComponent = page.locator('text=Text');
          if (await textComponent.isVisible()) {
            console.log('✅ Text component in palette is visible!');
          } else {
            console.log('❌ Text component in palette is not visible');
          }
          
        } else {
          console.log('❌ Create Layout button not found');
        }
      } else {
        console.log('❌ Layouts tab not found');
      }
    } else {
      console.log('❌ Browse Models button not found');
    }
    
  } catch (error) {
    console.error('Error occurred:', error);
    await page.screenshot({ path: 'error-screenshot.png' });
  } finally {
    await browser.close();
    console.log('Browser closed');
  }
})();