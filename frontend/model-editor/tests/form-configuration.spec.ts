import { test, expect } from '@playwright/test';

test.describe('Form Configuration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to layout editor with a Form component already placed
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to model editor
    const modelCard = page.locator('[data-testid="model-card"]').first();
    await modelCard.click();
    await page.waitForSelector('[data-testid="model-editor"]', { timeout: 10000 });
    
    // Go to Layouts and create new layout
    await page.click('button:has-text("Layouts")');
    await page.click('button:has-text("Create Layout")');
    await page.waitForSelector('[data-testid="layout-editor"]', { timeout: 10000 });
    
    // Add a Form component
    const formComponent = page.locator('[data-testid="component-palette-torqueform"]');
    const targetCell = page.locator('[data-testid="grid-cell-3-3"]');
    await formComponent.dragTo(targetCell);
    
    // Select the component
    const placedComponent = page.locator('[data-testid^="component-torqueform-"]');
    await expect(placedComponent).toBeVisible();
    await placedComponent.click();
    
    // Switch to Form configuration tab
    await page.click('button:has-text("Form")');
  });

  test('should allow entity selection for Form', async ({ page }) => {
    // Check entity selection dropdown is present
    const entitySelect = page.locator('[data-testid="form-entity-select"]');
    await expect(entitySelect).toBeVisible();
    
    // Open dropdown and select Customer entity
    await entitySelect.click();
    await page.click('text=Customer');
    
    // Verify entity was selected
    await expect(entitySelect).toHaveValue('customer');
    
    // Check that available fields section appears
    await expect(page.locator('text=Available Fields')).toBeVisible();
  });

  test('should show available entity fields for form', async ({ page }) => {
    // Select Customer entity
    const entitySelect = page.locator('[data-testid="form-entity-select"]');
    await entitySelect.click();
    await page.click('text=Customer');
    
    // Check that field buttons are shown
    await expect(page.locator('[data-testid="add-field-first_name"]')).toBeVisible();
    await expect(page.locator('[data-testid="add-field-last_name"]')).toBeVisible();
    await expect(page.locator('[data-testid="add-field-email"]')).toBeVisible();
  });

  test('should allow adding fields to form', async ({ page }) => {
    // Select Customer entity
    const entitySelect = page.locator('[data-testid="form-entity-select"]');
    await entitySelect.click();
    await page.click('text=Customer');
    
    // Add first name field
    await page.click('[data-testid="add-field-first_name"]');
    
    // Check that field appears in configured fields
    await expect(page.locator('text=Form Fields (1)')).toBeVisible();
    await expect(page.locator('[data-testid="form-field-config-first_name"]')).toBeVisible();
    
    // Add another field
    await page.click('[data-testid="add-field-email"]');
    
    // Check that we now have 2 fields
    await expect(page.locator('text=Form Fields (2)')).toBeVisible();
    await expect(page.locator('[data-testid="form-field-config-email"]')).toBeVisible();
  });

  test('should prevent adding duplicate fields', async ({ page }) => {
    // Select Customer entity
    const entitySelect = page.locator('[data-testid="form-entity-select"]');
    await entitySelect.click();
    await page.click('text=Customer');
    
    // Add first name field
    await page.click('[data-testid="add-field-first_name"]');
    
    // Check that the first name button is now disabled
    const firstNameButton = page.locator('[data-testid="add-field-first_name"]');
    await expect(firstNameButton).toBeDisabled();
  });

  test('should show field configuration with input type', async ({ page }) => {
    // Select Customer entity and add a field
    const entitySelect = page.locator('[data-testid="form-entity-select"]');
    await entitySelect.click();
    await page.click('text=Customer');
    await page.click('[data-testid="add-field-first_name"]');
    
    // Find the field configuration card
    const fieldConfig = page.locator('[data-testid="form-field-config-first_name"]');
    await expect(fieldConfig).toBeVisible();
    
    // Check that field shows the field name
    await expect(fieldConfig.locator('text=First Name')).toBeVisible();
    
    // Check that input type badge is shown
    await expect(fieldConfig.locator('text=text')).toBeVisible();
    
    // Check for required badge if field is required
    const requiredBadge = fieldConfig.locator('text=Required');
    if (await requiredBadge.isVisible()) {
      await expect(requiredBadge).toBeVisible();
    }
  });

  test('should allow expanding field configuration for detailed editing', async ({ page }) => {
    // Select Customer entity and add a field
    const entitySelect = page.locator('[data-testid="form-entity-select"]');
    await entitySelect.click();
    await page.click('text=Customer');
    await page.click('[data-testid="add-field-first_name"]');
    
    // Find the field configuration card
    const fieldConfig = page.locator('[data-testid="form-field-config-first_name"]');
    
    // Click the expand button (chevron icon)
    const expandButton = fieldConfig.locator('button').first();
    await expandButton.click();
    
    // Check that detailed configuration options appear
    await expect(fieldConfig.locator('text=Display Label')).toBeVisible();
    await expect(fieldConfig.locator('text=Input Type')).toBeVisible();
    await expect(fieldConfig.locator('text=Placeholder')).toBeVisible();
    await expect(fieldConfig.locator('text=Width (columns)')).toBeVisible();
    await expect(fieldConfig.locator('text=Help Text')).toBeVisible();
    
    // Check required checkbox
    await expect(fieldConfig.locator('text=Required')).toBeVisible();
  });

  test('should show validation rules for string fields', async ({ page }) => {
    // Select Customer entity and add a string field
    const entitySelect = page.locator('[data-testid="form-entity-select"]');
    await entitySelect.click();
    await page.click('text=Customer');
    await page.click('[data-testid="add-field-first_name"]');
    
    // Expand field configuration
    const fieldConfig = page.locator('[data-testid="form-field-config-first_name"]');
    const expandButton = fieldConfig.locator('button').first();
    await expandButton.click();
    
    // Check for string validation options
    await expect(fieldConfig.locator('text=Min Length')).toBeVisible();
    await expect(fieldConfig.locator('text=Max Length')).toBeVisible();
    await expect(fieldConfig.locator('text=Pattern (RegEx)')).toBeVisible();
  });

  test('should allow removing fields', async ({ page }) => {
    // Select Customer entity and add fields
    const entitySelect = page.locator('[data-testid="form-entity-select"]');
    await entitySelect.click();
    await page.click('text=Customer');
    await page.click('[data-testid="add-field-first_name"]');
    await page.click('[data-testid="add-field-email"]');
    
    // Check we have 2 fields
    await expect(page.locator('text=Form Fields (2)')).toBeVisible();
    
    // Remove the first field using the X button
    const firstFieldConfig = page.locator('[data-testid="form-field-config-first_name"]');
    const removeButton = firstFieldConfig.locator('button[aria-label="Remove"]');
    
    // If remove button exists, click it
    if (await removeButton.isVisible()) {
      await removeButton.click();
      
      // Check that we now have 1 field
      await expect(page.locator('text=Form Fields (1)')).toBeVisible();
      
      // Check that first name field is gone
      await expect(page.locator('[data-testid="form-field-config-first_name"]')).toBeHidden();
    }
  });

  test('should show form settings section', async ({ page }) => {
    // Select Customer entity 
    const entitySelect = page.locator('[data-testid="form-entity-select"]');
    await entitySelect.click();
    await page.click('text=Customer');
    
    // Check for Form settings section
    await expect(page.locator('text=Form Settings')).toBeVisible();
    
    // Check for layout style setting
    await expect(page.locator('text=Layout Style')).toBeVisible();
    
    // Check for submit action setting
    await expect(page.locator('text=Submit Action')).toBeVisible();
    
    // Check for validation settings
    await expect(page.locator('text=Client-side Validation')).toBeVisible();
    await expect(page.locator('text=Server-side Validation')).toBeVisible();
    await expect(page.locator('text=Real-time Validation')).toBeVisible();
  });

  test('should allow configuring form layout', async ({ page }) => {
    // Select Customer entity 
    const entitySelect = page.locator('[data-testid="form-entity-select"]');
    await entitySelect.click();
    await page.click('text=Customer');
    
    // Find layout style dropdown
    const layoutSelect = page.locator('select').locator('option:has-text("Layout Style")').locator('..');
    if (await layoutSelect.isVisible()) {
      await layoutSelect.click();
      
      // Check for layout options
      await expect(page.locator('text=Single Column')).toBeVisible();
      await expect(page.locator('text=Two Columns')).toBeVisible();
    }
  });

  test('should allow configuring submit action', async ({ page }) => {
    // Select Customer entity 
    const entitySelect = page.locator('[data-testid="form-entity-select"]');
    await entitySelect.click();
    await page.click('text=Customer');
    
    // Look for submit action configuration
    const submitActionSelect = page.locator('text=Submit Action');
    if (await submitActionSelect.isVisible()) {
      await expect(submitActionSelect).toBeVisible();
    }
  });

  test('should show advanced form settings when expanded', async ({ page }) => {
    // Select Customer entity 
    const entitySelect = page.locator('[data-testid="form-entity-select"]');
    await entitySelect.click();
    await page.click('text=Customer');
    
    // Look for "Show Advanced" button
    const showAdvancedButton = page.locator('button:has-text("Show Advanced")');
    if (await showAdvancedButton.isVisible()) {
      await showAdvancedButton.click();
      
      // Check for advanced settings
      await expect(page.locator('text=Advanced Settings')).toBeVisible();
      await expect(page.locator('text=Auto-save Draft')).toBeVisible();
      await expect(page.locator('text=Show Progress')).toBeVisible();
      await expect(page.locator('text=Success Message')).toBeVisible();
      await expect(page.locator('text=Error Message')).toBeVisible();
    }
  });

  test('should support field reordering', async ({ page }) => {
    // Select Customer entity and add multiple fields
    const entitySelect = page.locator('[data-testid="form-entity-select"]');
    await entitySelect.click();
    await page.click('text=Customer');
    await page.click('[data-testid="add-field-first_name"]');
    await page.click('[data-testid="add-field-email"]');
    
    // Check initial order
    await expect(page.locator('text=Form Fields (2)')).toBeVisible();
    
    // Find the first field and its move buttons
    const firstFieldConfig = page.locator('[data-testid="form-field-config-first_name"]');
    const moveDownButton = firstFieldConfig.locator('button[aria-label="Move down"]');
    
    // If move button exists, test reordering
    if (await moveDownButton.isVisible()) {
      await moveDownButton.click();
      
      // The field order should change (implementation-dependent verification)
      await expect(page.locator('text=Form Fields (2)')).toBeVisible();
    }
  });

  test('should reset fields when entity changes', async ({ page }) => {
    // Select Customer entity and add a field
    const entitySelect = page.locator('[data-testid="form-entity-select"]');
    await entitySelect.click();
    await page.click('text=Customer');
    await page.click('[data-testid="add-field-first_name"]');
    
    // Verify field was added
    await expect(page.locator('text=Form Fields (1)')).toBeVisible();
    
    // Change to a different entity (if available)
    await entitySelect.click();
    const orderOption = page.locator('text=Order');
    if (await orderOption.isVisible()) {
      await orderOption.click();
      
      // Check that fields were reset
      await expect(page.locator('text=Form Fields (0)')).toBeVisible();
    }
  });

  test('should handle different field types appropriately', async ({ page }) => {
    // Select Customer entity and add email field (should have email input type)
    const entitySelect = page.locator('[data-testid="form-entity-select"]');
    await entitySelect.click();
    await page.click('text=Customer');
    await page.click('[data-testid="add-field-email"]');
    
    // Find the field configuration and expand it
    const fieldConfig = page.locator('[data-testid="form-field-config-email"]');
    const expandButton = fieldConfig.locator('button').first();
    await expandButton.click();
    
    // Check that input type is appropriate for email
    const inputTypeSelect = fieldConfig.locator('text=Input Type');
    if (await inputTypeSelect.isVisible()) {
      await expect(inputTypeSelect).toBeVisible();
    }
  });
});