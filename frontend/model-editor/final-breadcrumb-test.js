import { chromium } from 'playwright';

async function testBreadcrumbNavigation() {
  console.log('🍞 Testing breadcrumb navigation for routing verification...\n');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    const testModelId = '1';
    
    // Test 1: Model Details breadcrumb
    console.log('📍 Test 1: Model Details page breadcrumb');
    const detailsUrl = `http://localhost:3000/models/${testModelId}/editor/details`;
    await page.goto(detailsUrl);
    await page.waitForLoadState('networkidle');
    
    // Focus on the breadcrumb area and take screenshot
    await page.screenshot({ 
      path: 'final-details-breadcrumb.png',
      fullPage: false,
      clip: { x: 0, y: 0, width: 1280, height: 100 }
    });
    console.log('✅ Details page breadcrumb captured');
    
    // Test 2: ERD Editor breadcrumb  
    console.log('\n📍 Test 2: ERD Editor page breadcrumb');
    const erdUrl = `http://localhost:3000/models/${testModelId}/editor/erd`;
    await page.goto(erdUrl);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ 
      path: 'final-erd-breadcrumb.png',
      fullPage: false,
      clip: { x: 0, y: 0, width: 1280, height: 100 }
    });
    console.log('✅ ERD Editor breadcrumb captured');
    
    // Test 3: Compare with Model Editor breadcrumb
    console.log('\n📍 Test 3: Model Editor page breadcrumb for comparison');
    const editorUrl = `http://localhost:3000/models/${testModelId}/editor`;
    await page.goto(editorUrl);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ 
      path: 'final-editor-breadcrumb.png',
      fullPage: false,
      clip: { x: 0, y: 0, width: 1280, height: 100 }
    });
    console.log('✅ Model Editor breadcrumb captured');
    
    // Test 4: Full page screenshots for documentation
    console.log('\n📍 Test 4: Full page documentation screenshots');
    
    await page.goto(detailsUrl);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'final-details-full.png' });
    
    await page.goto(erdUrl);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'final-erd-full.png' });
    
    console.log('✅ Full page screenshots captured');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
  
  console.log('\n🏁 Breadcrumb navigation test completed.');
  console.log('Check the breadcrumb screenshots to verify the routing hierarchy is correct.');
  await browser.close();
}

testBreadcrumbNavigation();