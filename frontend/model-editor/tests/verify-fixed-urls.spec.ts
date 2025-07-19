import { test, expect } from '@playwright/test'

test.describe('Verify Fixed URLs for Model Editor Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Start from home page
    await page.goto('http://localhost:3005/')
    await page.waitForLoadState('networkidle')
  })

  test('Navigate to model details page using new nested path', async ({ page }) => {
    console.log('Step 1: Navigate to Models page')
    await page.click('text=Models')
    await page.waitForLoadState('networkidle')
    
    // Take screenshot of Models page
    await page.screenshot({ path: 'models-page-verification.png', fullPage: true })
    
    console.log('Step 2: Click on first model to go to overview')
    const modelCards = page.locator('[data-testid="model-card"]')
    await expect(modelCards.first()).toBeVisible()
    await modelCards.first().click()
    await page.waitForLoadState('networkidle')
    
    // Take screenshot of Model Overview
    await page.screenshot({ path: 'model-overview-verification.png', fullPage: true })
    
    console.log('Step 3: Click Editor button to go to Model Editor')
    const editorButton = page.locator('text=Editor')
    await expect(editorButton).toBeVisible()
    await editorButton.click()
    await page.waitForLoadState('networkidle')
    
    // Take screenshot of Model Editor
    await page.screenshot({ path: 'model-editor-verification.png', fullPage: true })
    
    console.log('Step 4: Click Details tab to test new nested path')
    const detailsTab = page.locator('text=Details')
    await expect(detailsTab).toBeVisible()
    await detailsTab.click()
    await page.waitForLoadState('networkidle')
    
    // Verify we're on the correct URL
    expect(page.url()).toMatch(/\/models\/\d+\/editor\/details/)
    
    // Verify the page loads correctly and doesn't show "Model not found"
    await expect(page.locator('text=Model not found')).not.toBeVisible()
    
    // Take screenshot of Model Details page
    await page.screenshot({ path: 'model-details-fixed.png', fullPage: true })
    
    console.log('✅ Model Details page loads correctly at new nested path')
  })

  test('Navigate to ERD editor page using new nested path', async ({ page }) => {
    console.log('Step 1: Navigate to Models page')
    await page.click('text=Models')
    await page.waitForLoadState('networkidle')
    
    console.log('Step 2: Click on first model to go to overview')
    const modelCards = page.locator('[data-testid="model-card"]')
    await expect(modelCards.first()).toBeVisible()
    await modelCards.first().click()
    await page.waitForLoadState('networkidle')
    
    console.log('Step 3: Click Editor button to go to Model Editor')
    const editorButton = page.locator('text=Editor')
    await expect(editorButton).toBeVisible()
    await editorButton.click()
    await page.waitForLoadState('networkidle')
    
    console.log('Step 4: Click ERD tab to test new nested path')
    const erdTab = page.locator('text=ERD')
    await expect(erdTab).toBeVisible()
    await erdTab.click()
    await page.waitForLoadState('networkidle')
    
    // Verify we're on the correct URL
    expect(page.url()).toMatch(/\/models\/\d+\/editor\/erd/)
    
    // Verify the page loads correctly and doesn't show "Model not found"
    await expect(page.locator('text=Model not found')).not.toBeVisible()
    
    // Take screenshot of ERD Editor page
    await page.screenshot({ path: 'erd-editor-fixed.png', fullPage: true })
    
    console.log('✅ ERD Editor page loads correctly at new nested path')
  })

  test('Test direct URL navigation to previously broken paths', async ({ page }) => {
    console.log('Step 1: Get first model ID by visiting models page')
    await page.goto('http://localhost:3005/models')
    await page.waitForLoadState('networkidle')
    
    const modelCards = page.locator('[data-testid="model-card"]')
    await expect(modelCards.first()).toBeVisible()
    
    // Extract model ID from the first model card's click handler
    const firstCard = modelCards.first()
    await firstCard.click()
    await page.waitForLoadState('networkidle')
    
    // Get the current URL to extract model ID
    const currentUrl = page.url()
    const modelId = currentUrl.match(/\/models\/(\d+)/)?.[1]
    
    console.log(`Found model ID: ${modelId}`)
    
    if (modelId) {
      console.log('Step 2: Test direct navigation to model details (new nested path)')
      const detailsUrl = `http://localhost:3005/models/${modelId}/editor/details`
      await page.goto(detailsUrl)
      await page.waitForLoadState('networkidle')
      
      // Verify the page loads correctly
      await expect(page.locator('text=Model not found')).not.toBeVisible()
      expect(page.url()).toBe(detailsUrl)
      
      // Take screenshot
      await page.screenshot({ path: 'direct-details-navigation.png', fullPage: true })
      console.log('✅ Direct navigation to details page works')
      
      console.log('Step 3: Test direct navigation to ERD editor (new nested path)')
      const erdUrl = `http://localhost:3005/models/${modelId}/editor/erd`
      await page.goto(erdUrl)
      await page.waitForLoadState('networkidle')
      
      // Verify the page loads correctly
      await expect(page.locator('text=Model not found')).not.toBeVisible()
      expect(page.url()).toBe(erdUrl)
      
      // Take screenshot
      await page.screenshot({ path: 'direct-erd-navigation.png', fullPage: true })
      console.log('✅ Direct navigation to ERD editor works')
    }
  })

  test('Test complete navigation flow: Overview → Model Editor → ERD → Details', async ({ page }) => {
    console.log('Testing complete navigation flow')
    
    console.log('Step 1: Start from Models page')
    await page.click('text=Models')
    await page.waitForLoadState('networkidle')
    
    console.log('Step 2: Go to Model Overview')
    const modelCards = page.locator('[data-testid="model-card"]')
    await expect(modelCards.first()).toBeVisible()
    await modelCards.first().click()
    await page.waitForLoadState('networkidle')
    
    // Verify we're on overview page
    expect(page.url()).toMatch(/\/models\/\d+$/)
    await page.screenshot({ path: 'flow-overview.png', fullPage: true })
    
    console.log('Step 3: Navigate to Model Editor')
    const editorButton = page.locator('text=Editor')
    await expect(editorButton).toBeVisible()
    await editorButton.click()
    await page.waitForLoadState('networkidle')
    
    // Verify we're on editor page
    expect(page.url()).toMatch(/\/models\/\d+\/editor$/)
    await page.screenshot({ path: 'flow-editor.png', fullPage: true })
    
    console.log('Step 4: Navigate to ERD Editor')
    const erdTab = page.locator('text=ERD')
    await expect(erdTab).toBeVisible()
    await erdTab.click()
    await page.waitForLoadState('networkidle')
    
    // Verify we're on ERD editor page
    expect(page.url()).toMatch(/\/models\/\d+\/editor\/erd/)
    await expect(page.locator('text=Model not found')).not.toBeVisible()
    await page.screenshot({ path: 'flow-erd.png', fullPage: true })
    
    console.log('Step 5: Navigate to Details')
    const detailsTab = page.locator('text=Details')
    await expect(detailsTab).toBeVisible()
    await detailsTab.click()
    await page.waitForLoadState('networkidle')
    
    // Verify we're on details page
    expect(page.url()).toMatch(/\/models\/\d+\/editor\/details/)
    await expect(page.locator('text=Model not found')).not.toBeVisible()
    await page.screenshot({ path: 'flow-details.png', fullPage: true })
    
    console.log('✅ Complete navigation flow works correctly')
  })
})