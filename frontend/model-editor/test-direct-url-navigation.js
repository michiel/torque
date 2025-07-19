import { chromium } from 'playwright';

async function testDirectURLNavigation() {
  console.log('🚀 Testing direct URL navigation for model editor pages...\n');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Test the problematic URLs directly using a test model ID
    const testModelId = '1';
    
    // Test 1: Navigate directly to model details page (old path should redirect/not work)
    console.log('📍 Test 1: Navigate directly to model details page');
    const detailsUrl = `http://localhost:3000/models/${testModelId}/editor/details`;
    console.log(`Navigating to: ${detailsUrl}`);
    await page.goto(detailsUrl);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-direct-details.png' });
    
    // Check for "Model not found" vs other error messages
    const detailsContent = await page.textContent('body');
    if (detailsContent.includes('Model not found')) {
      console.log('❌ Model details page shows "Model not found" error');
    } else if (detailsContent.includes('Error loading')) {
      console.log('✅ Model details page loads (shows GraphQL error, not "Model not found")');
    } else {
      console.log('✅ Model details page loads successfully');
    }
    
    // Test 2: Navigate directly to ERD editor page  
    console.log('\n📍 Test 2: Navigate directly to ERD editor page');
    const erdUrl = `http://localhost:3000/models/${testModelId}/editor/erd`;
    console.log(`Navigating to: ${erdUrl}`);
    await page.goto(erdUrl);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-direct-erd.png' });
    
    // Check for "Model not found" vs other error messages
    const erdContent = await page.textContent('body');
    if (erdContent.includes('Model not found')) {
      console.log('❌ ERD editor page shows "Model not found" error');
    } else if (erdContent.includes('Error loading')) {
      console.log('✅ ERD editor page loads (shows GraphQL error, not "Model not found")');  
    } else {
      console.log('✅ ERD editor page loads successfully');
    }
    
    // Test 3: Navigate to model overview page (should work)
    console.log('\n📍 Test 3: Navigate to model overview page');
    const overviewUrl = `http://localhost:3000/models/${testModelId}`;
    console.log(`Navigating to: ${overviewUrl}`);
    await page.goto(overviewUrl);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-direct-overview.png' });
    
    const overviewContent = await page.textContent('body');
    if (overviewContent.includes('Model not found')) {
      console.log('❌ Model overview page shows "Model not found" error');
    } else if (overviewContent.includes('Error loading')) {
      console.log('✅ Model overview page loads (shows GraphQL error, not "Model not found")');
    } else {
      console.log('✅ Model overview page loads successfully');
    }
    
    // Test 4: Navigate to model editor page
    console.log('\n📍 Test 4: Navigate to model editor page');
    const editorUrl = `http://localhost:3000/models/${testModelId}/editor`;
    console.log(`Navigating to: ${editorUrl}`);
    await page.goto(editorUrl);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-direct-editor.png' });
    
    const editorContent = await page.textContent('body');
    if (editorContent.includes('Model not found')) {
      console.log('❌ Model editor page shows "Model not found" error');
    } else if (editorContent.includes('Error loading')) {
      console.log('✅ Model editor page loads (shows GraphQL error, not "Model not found")');
    } else {
      console.log('✅ Model editor page loads successfully');
    }
    
    // Test 5: Navigate to app previewer page
    console.log('\n📍 Test 5: Navigate to app previewer page');
    const previewerUrl = `http://localhost:3000/models/${testModelId}/previewer`;
    console.log(`Navigating to: ${previewerUrl}`);
    await page.goto(previewerUrl);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-direct-previewer.png' });
    
    const previewerContent = await page.textContent('body');
    if (previewerContent.includes('Model not found')) {
      console.log('❌ App previewer page shows "Model not found" error');
    } else if (previewerContent.includes('Error loading')) {
      console.log('✅ App previewer page loads (shows GraphQL error, not "Model not found")');
    } else {
      console.log('✅ App previewer page loads successfully');
    }
    
    // Test 6: Test the home page for comparison
    console.log('\n📍 Test 6: Navigate to home page for reference');
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-home-page.png' });
    console.log('✅ Home page loaded for reference');
    
    console.log('\n🔍 Route Testing Summary:');
    console.log('- Model Details: /models/:id/editor/details');  
    console.log('- ERD Editor: /models/:id/editor/erd');
    console.log('- Model Overview: /models/:id');
    console.log('- Model Editor: /models/:id/editor');
    console.log('- App Previewer: /models/:id/previewer');
    
  } catch (error) {
    console.error('❌ Test error:', error);
    await page.screenshot({ path: 'test-direct-error.png' });
  }
  
  console.log('\n🏁 Direct URL navigation test completed. Check screenshots for verification.');
  await browser.close();
}

testDirectURLNavigation();