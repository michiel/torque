import { test, expect, Page } from '@playwright/test';

test.describe('Check Customer Order Management Model Entities', () => {
  test('Check if entities are displayed in the Customer Order Management model', async ({ page }) => {
    console.log('🔍 Checking Customer Order Management model entities');
    
    // Navigate to the frontend
    await page.goto('http://localhost:3000');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Navigate to Models page
    await page.click('a[href*="/models"]');
    await page.waitForLoadState('networkidle');
    
    // Look for the Customer Order Management model
    const customerOrderModel = page.locator('text=Customer Order Management');
    await expect(customerOrderModel).toBeVisible();
    
    console.log('Found Customer Order Management model');
    
    // Click on the Customer Order Management model to view details
    await customerOrderModel.click();
    await page.waitForLoadState('networkidle');
    
    // Wait for the model page to load
    await page.waitForSelector('[data-testid="model-details"], .model-details, .model-editor', { timeout: 5000 }).catch(() => {
      console.log('Model details container not found, trying to navigate to model editor');
    });
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/customer-order-model-details.png', fullPage: true });
    
    // Check if we're on the model editor page
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // Check for the Entities tab/panel
    const entitiesTab = page.locator('text=Entities').first();
    if (await entitiesTab.isVisible()) {
      console.log('Found Entities tab');
      await entitiesTab.click();
      await page.waitForTimeout(1000);
    }
    
    // Look for entity information
    const entityCount = await page.locator('text=/\\d+ entities/').first().textContent().catch(() => '0 entities');
    console.log('Entity count shown:', entityCount);
    
    // Check if there are any entities listed
    const entityElements = page.locator('[data-testid="entity"], .entity-card, [class*="entity"]');
    const entityCount2 = await entityElements.count();
    console.log('Number of entity elements found:', entityCount2);
    
    // Look for specific entities that should be in the Customer Order Management model
    const customerEntity = page.locator('text=Customer');
    const orderEntity = page.locator('text=Order');
    
    console.log('Looking for Customer entity:', await customerEntity.count());
    console.log('Looking for Order entity:', await orderEntity.count());
    
    // Check for the "No entities defined yet" message
    const noEntitiesMessage = page.locator('text=No entities defined yet');
    const hasNoEntitiesMessage = await noEntitiesMessage.isVisible();
    console.log('Has "No entities defined yet" message:', hasNoEntitiesMessage);
    
    // Make a direct GraphQL query to check all models
    const response = await page.request.post('http://localhost:8080/graphql', {
      data: {
        query: `
          query GetAllModels {
            models {
              id
              name
              description
              entities {
                id
                name
                displayName
                entityType
                fields {
                  id
                  name
                  displayName
                  fieldType
                }
              }
              relationships {
                id
                name
                relationshipType
              }
              flows {
                id
                name
                flowType
              }
              layouts {
                id
                name
                layoutType
              }
            }
          }
        `
      }
    });
    
    const responseData = await response.json();
    console.log('GraphQL all models response:', JSON.stringify(responseData, null, 2));
    
    if (responseData.data?.models) {
      const models = responseData.data.models;
      console.log('Number of models returned:', models.length);
      
      const customerOrderModel = models.find((m: any) => m.name === 'Customer Order Management');
      if (customerOrderModel) {
        console.log('Customer Order Management model found!');
        console.log('Number of entities in model:', customerOrderModel.entities?.length || 0);
        console.log('Number of relationships in model:', customerOrderModel.relationships?.length || 0);
        console.log('Number of flows in model:', customerOrderModel.flows?.length || 0);
        console.log('Number of layouts in model:', customerOrderModel.layouts?.length || 0);
        
        if (customerOrderModel.entities && customerOrderModel.entities.length > 0) {
          console.log('Entities found:');
          customerOrderModel.entities.forEach((entity: any, index: number) => {
            console.log(`  ${index + 1}. ${entity.name} (${entity.displayName}) - Type: ${entity.entityType} - Fields: ${entity.fields?.length || 0}`);
          });
        } else {
          console.log('❌ No entities found in the Customer Order Management model');
        }
      } else {
        console.log('❌ Customer Order Management model not found in the response');
      }
    } else {
      console.log('❌ No models data returned from GraphQL');
    }
    
    // Take a final screenshot
    await page.screenshot({ path: 'test-results/final-entities-check.png', fullPage: true });
    
    // Log page content for debugging
    const pageContent = await page.content();
    console.log('Page title:', await page.title());
    console.log('Page contains "Customer Order Management":', pageContent.includes('Customer Order Management'));
    console.log('Page contains "entities":', pageContent.includes('entities'));
    console.log('Page contains "No entities":', pageContent.includes('No entities'));
  });
});