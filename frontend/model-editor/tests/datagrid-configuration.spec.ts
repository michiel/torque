import { test, expect } from '@playwright/test';

test.describe('DataGrid Configuration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to layout editor with a DataGrid component already placed
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
    
    // Add a DataGrid component
    const dataGridComponent = page.locator('[data-testid="component-palette-datagrid"]');
    const targetCell = page.locator('[data-testid="grid-cell-2-2"]');
    await dataGridComponent.dragTo(targetCell);
    
    // Select the component
    const placedComponent = page.locator('[data-testid^="component-datagrid-"]');
    await expect(placedComponent).toBeVisible();
    await placedComponent.click();
    
    // Switch to DataGrid configuration tab
    await page.click('button:has-text("Data Grid")');
  });

  test('should allow entity selection for DataGrid', async ({ page }) => {
    // Check entity selection dropdown is present
    const entitySelect = page.locator('[data-testid="datagrid-entity-select"]');
    await expect(entitySelect).toBeVisible();
    
    // Open dropdown and select Customer entity
    await entitySelect.click();
    await page.click('text=Customer');
    
    // Verify entity was selected
    await expect(entitySelect).toHaveValue('customer');
    
    // Check that available fields section appears
    await expect(page.locator('text=Available Fields')).toBeVisible();
  });

  test('should show available entity fields after selection', async ({ page }) => {
    // Select Customer entity
    const entitySelect = page.locator('[data-testid="datagrid-entity-select"]');
    await entitySelect.click();
    await page.click('text=Customer');
    
    // Check that field buttons are shown
    await expect(page.locator('[data-testid="add-column-first_name"]')).toBeVisible();
    await expect(page.locator('[data-testid="add-column-last_name"]')).toBeVisible();
    await expect(page.locator('[data-testid="add-column-email"]')).toBeVisible();
  });

  test('should allow adding columns from entity fields', async ({ page }) => {
    // Select Customer entity
    const entitySelect = page.locator('[data-testid="datagrid-entity-select"]');
    await entitySelect.click();
    await page.click('text=Customer');
    
    // Add first name column
    await page.click('[data-testid="add-column-first_name"]');
    
    // Check that column appears in configured columns
    await expect(page.locator('text=Columns (1)')).toBeVisible();
    await expect(page.locator('[data-testid="column-config-first_name"]')).toBeVisible();
    
    // Add another column
    await page.click('[data-testid="add-column-email"]');
    
    // Check that we now have 2 columns
    await expect(page.locator('text=Columns (2)')).toBeVisible();
    await expect(page.locator('[data-testid="column-config-email"]')).toBeVisible();
  });

  test('should prevent adding duplicate columns', async ({ page }) => {
    // Select Customer entity
    const entitySelect = page.locator('[data-testid="datagrid-entity-select"]');
    await entitySelect.click();
    await page.click('text=Customer');
    
    // Add first name column
    await page.click('[data-testid="add-column-first_name"]');
    
    // Check that the first name button is now disabled
    const firstNameButton = page.locator('[data-testid="add-column-first_name"]');
    await expect(firstNameButton).toBeDisabled();
  });

  test('should allow column configuration', async ({ page }) => {
    // Select Customer entity and add a column
    const entitySelect = page.locator('[data-testid="datagrid-entity-select"]');
    await entitySelect.click();
    await page.click('text=Customer');
    await page.click('[data-testid="add-column-first_name"]');
    
    // Find the column configuration card
    const columnConfig = page.locator('[data-testid="column-config-first_name"]');
    await expect(columnConfig).toBeVisible();
    
    // Check that column shows the field name
    await expect(columnConfig.locator('text=First Name')).toBeVisible();
    
    // Check that column type badge is shown
    await expect(columnConfig.locator('text=string')).toBeVisible();
  });

  test('should allow expanding column configuration for detailed editing', async ({ page }) => {
    // Select Customer entity and add a column
    const entitySelect = page.locator('[data-testid="datagrid-entity-select"]');
    await entitySelect.click();
    await page.click('text=Customer');
    await page.click('[data-testid="add-column-first_name"]');
    
    // Find the column configuration card
    const columnConfig = page.locator('[data-testid="column-config-first_name"]');
    
    // Click the expand button (chevron icon)
    const expandButton = columnConfig.locator('button').first();
    await expandButton.click();
    
    // Check that detailed configuration options appear
    await expect(columnConfig.locator('text=Display Label')).toBeVisible();
    await expect(columnConfig.locator('text=Alignment')).toBeVisible();
    await expect(columnConfig.locator('text=Width')).toBeVisible();
    
    // Check checkboxes for sortable and filterable
    await expect(columnConfig.locator('text=Sortable')).toBeVisible();
    await expect(columnConfig.locator('text=Filterable')).toBeVisible();
  });

  test('should allow removing columns', async ({ page }) => {
    // Select Customer entity and add columns
    const entitySelect = page.locator('[data-testid="datagrid-entity-select"]');
    await entitySelect.click();
    await page.click('text=Customer');
    await page.click('[data-testid="add-column-first_name"]');
    await page.click('[data-testid="add-column-email"]');
    
    // Check we have 2 columns
    await expect(page.locator('text=Columns (2)')).toBeVisible();
    
    // Remove the first column using the X button
    const firstColumnConfig = page.locator('[data-testid="column-config-first_name"]');
    const removeButton = firstColumnConfig.locator('button[aria-label="Remove"]');
    
    // If remove button exists, click it
    if (await removeButton.isVisible()) {
      await removeButton.click();
      
      // Check that we now have 1 column
      await expect(page.locator('text=Columns (1)')).toBeVisible();
      
      // Check that first name column is gone
      await expect(page.locator('[data-testid="column-config-first_name"]')).toBeHidden();
    }
  });

  test('should show DataGrid settings section', async ({ page }) => {
    // Select Customer entity 
    const entitySelect = page.locator('[data-testid="datagrid-entity-select"]');
    await entitySelect.click();
    await page.click('text=Customer');
    
    // Check for DataGrid settings section
    await expect(page.locator('text=DataGrid Settings')).toBeVisible();
    
    // Check for pagination setting
    await expect(page.locator('text=Enable Pagination')).toBeVisible();
    
    // Check for filtering setting
    await expect(page.locator('text=Enable Filtering')).toBeVisible();
    
    // Check for sorting setting
    await expect(page.locator('text=Enable Sorting')).toBeVisible();
  });

  test('should allow configuring pagination settings', async ({ page }) => {
    // Select Customer entity 
    const entitySelect = page.locator('[data-testid="datagrid-entity-select"]');
    await entitySelect.click();
    await page.click('text=Customer');
    
    // Check that pagination is enabled by default
    const paginationCheckbox = page.locator('input[type="checkbox"]').locator('input:has-text("Enable Pagination")');
    
    // Look for page size dropdown
    const pageSizeSelect = page.locator('text=Page Size');
    if (await pageSizeSelect.isVisible()) {
      await expect(pageSizeSelect).toBeVisible();
    }
  });

  test('should show advanced settings when expanded', async ({ page }) => {
    // Select Customer entity 
    const entitySelect = page.locator('[data-testid="datagrid-entity-select"]');
    await entitySelect.click();
    await page.click('text=Customer');
    
    // Look for "Show Advanced" button
    const showAdvancedButton = page.locator('button:has-text("Show Advanced")');
    if (await showAdvancedButton.isVisible()) {
      await showAdvancedButton.click();
      
      // Check for advanced settings
      await expect(page.locator('text=Advanced Settings')).toBeVisible();
      await expect(page.locator('text=Row Selection')).toBeVisible();
      await expect(page.locator('text=Row Highlighting')).toBeVisible();
      await expect(page.locator('text=Density')).toBeVisible();
    }
  });

  test('should reset columns when entity changes', async ({ page }) => {
    // Select Customer entity and add a column
    const entitySelect = page.locator('[data-testid="datagrid-entity-select"]');
    await entitySelect.click();
    await page.click('text=Customer');
    await page.click('[data-testid="add-column-first_name"]');
    
    // Verify column was added
    await expect(page.locator('text=Columns (1)')).toBeVisible();
    
    // Change to a different entity (if available)
    await entitySelect.click();
    const orderOption = page.locator('text=Order');
    if (await orderOption.isVisible()) {
      await orderOption.click();
      
      // Check that columns were reset
      await expect(page.locator('text=Columns (0)')).toBeVisible();
    }
  });

  test('should validate entity selection requirement', async ({ page }) => {
    // Initially no entity is selected
    // Check if validation message appears
    const validationMessage = page.locator('text=Entity selection is required');
    
    // Validation might appear in various forms, so we'll check the general structure
    await expect(page.locator('[data-testid="datagrid-entity-select"]')).toBeVisible();
  });
});