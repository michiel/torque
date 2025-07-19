import { chromium } from 'playwright';

async function testModelNotFoundFix() {
  console.log('🚀 Testing "Model not found" error fixes...\n');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Step 1: Navigate to home page
    console.log('📍 Step 1: Navigate to home page');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-1-home-page.png' });
    console.log('✅ Home page loaded successfully');
    
    // Step 2: Navigate to models page
    console.log('\n📍 Step 2: Navigate to models page');
    await page.click('a[href="/models"]');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-2-models-page.png' });
    console.log('✅ Models page loaded successfully');
    
    // Step 3: Navigate to a model overview page
    console.log('\n📍 Step 3: Navigate to model overview page');
    // Look for any model card and click it
    const modelCard = await page.locator('.mantine-Card-root').first();
    if (await modelCard.count() > 0) {
      await modelCard.click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'test-3-model-overview.png' });
      console.log('✅ Model overview page loaded successfully');
      
      // Get the current model ID from URL
      const currentUrl = page.url();
      const modelId = currentUrl.match(/\/models\/(\d+)/)?.[1];
      console.log(`Current model ID: ${modelId}`);
      
      if (modelId) {
        // Step 4: Test model details page (new path: /models/:id/editor/details)
        console.log('\n📍 Step 4: Test model details page at new path');
        const detailsUrl = `http://localhost:3000/models/${modelId}/editor/details`;
        console.log(`Navigating to: ${detailsUrl}`);
        await page.goto(detailsUrl);
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'test-4-model-details.png' });
        
        // Check for "Model not found" error
        const errorText = await page.textContent('body');
        if (errorText.includes('Model not found')) {
          console.log('❌ ERROR: Model details page still shows "Model not found"');
        } else {
          console.log('✅ Model details page loaded successfully (no "Model not found" error)');
        }
        
        // Step 5: Test ERD editor page (new path: /models/:id/editor/erd)
        console.log('\n📍 Step 5: Test ERD editor page at new path');
        const erdUrl = `http://localhost:3000/models/${modelId}/editor/erd`;
        console.log(`Navigating to: ${erdUrl}`);
        await page.goto(erdUrl);
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'test-5-erd-editor.png' });
        
        // Check for "Model not found" error
        const erdErrorText = await page.textContent('body');
        if (erdErrorText.includes('Model not found')) {
          console.log('❌ ERROR: ERD editor page still shows "Model not found"');
        } else {
          console.log('✅ ERD editor page loaded successfully (no "Model not found" error)');
        }
        
        // Step 6: Test navigation flow: Overview → Model Editor → ERD Editor
        console.log('\n📍 Step 6: Test navigation flow');
        
        // Go back to overview
        const overviewUrl = `http://localhost:3000/models/${modelId}`;
        await page.goto(overviewUrl);
        await page.waitForLoadState('networkidle');
        console.log('Back to model overview');
        
        // Click Model Editor button
        const editorButton = await page.locator('button:has-text("Model Editor"), a:has-text("Model Editor")');
        if (await editorButton.count() > 0) {
          await editorButton.click();
          await page.waitForLoadState('networkidle');
          await page.screenshot({ path: 'test-6-model-editor.png' });
          console.log('✅ Navigated to Model Editor successfully');
          
          // Try to navigate to ERD from the editor
          const erdButton = await page.locator('button:has-text("ERD"), a:has-text("ERD"), [href*="/erd"]');
          if (await erdButton.count() > 0) {
            await erdButton.click();
            await page.waitForLoadState('networkidle');
            await page.screenshot({ path: 'test-7-erd-from-editor.png' });
            console.log('✅ Navigated to ERD from editor successfully');
          } else {
            console.log('⚠️  ERD navigation button not found in editor');
          }
        } else {
          console.log('⚠️  Model Editor button not found on overview page');
        }
        
        // Step 7: Test breadcrumb navigation or header links
        console.log('\n📍 Step 7: Test header navigation links');
        await page.screenshot({ path: 'test-8-final-state.png' });
        
      } else {
        console.log('❌ Could not extract model ID from URL');
      }
      
    } else {
      console.log('❌ No model cards found on models page');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
    await page.screenshot({ path: 'test-error.png' });
  }
  
  console.log('\n🏁 Test completed. Check the screenshots for visual verification.');
  await browser.close();
}

testModelNotFoundFix();