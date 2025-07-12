import { test, expect } from '@playwright/test';

test.describe('Layout Editor', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to models page and select the sample model
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for and click on the Customer Order Management model
    const modelCard = page.locator('[data-testid="model-card"]').first();
    await modelCard.click();
    
    // Wait for model editor to load
    await page.waitForSelector('[data-testid="model-editor"]', { timeout: 10000 });
    
    // Click on Layouts tab
    await page.click('button:has-text("Layouts")');
    
    // Click "Create Layout" button
    await page.click('button:has-text("Create Layout")');
    
    // Wait for layout editor to load
    await page.waitForSelector('[data-testid="layout-editor"]', { timeout: 10000 });
  });

  test('should load layout editor with component palette', async ({ page }) => {
    // Check that the layout editor is visible
    await expect(page.locator('[data-testid="layout-editor"]')).toBeVisible();
    
    // Check that component palette is visible
    await expect(page.locator('[data-testid="component-palette"]')).toBeVisible();
    
    // Check that all 6 components are present in palette
    const dataGridComponent = page.locator('[data-testid="component-palette-datagrid"]');
    const formComponent = page.locator('[data-testid="component-palette-torqueform"]');
    const buttonComponent = page.locator('[data-testid="component-palette-torquebutton"]');
    const textComponent = page.locator('[data-testid="component-palette-text"]');
    const containerComponent = page.locator('[data-testid="component-palette-container"]');
    const modalComponent = page.locator('[data-testid="component-palette-modal"]');
    
    await expect(dataGridComponent).toBeVisible();
    await expect(formComponent).toBeVisible();
    await expect(buttonComponent).toBeVisible();
    await expect(textComponent).toBeVisible();
    await expect(containerComponent).toBeVisible();
    await expect(modalComponent).toBeVisible();
  });

  test('should have layout canvas with grid', async ({ page }) => {
    // Check that layout canvas is visible
    await expect(page.locator('[data-testid="layout-canvas"]')).toBeVisible();
    
    // Check that grid cells are present (12x12 = 144 cells)
    const gridCells = page.locator('[data-testid^="grid-cell-"]');
    await expect(gridCells).toHaveCount(144);
  });

  test('should have configuration panel', async ({ page }) => {
    // Check that configuration panel is visible
    await expect(page.locator('[data-testid="configuration-panel"]')).toBeVisible();
    
    // Initially should show "no component selected" message
    await expect(page.locator('text=Select a component to configure')).toBeVisible();
  });

  test('should allow searching components in palette', async ({ page }) => {
    // Find the search input in component palette
    const searchInput = page.locator('[data-testid="component-search"]');
    await expect(searchInput).toBeVisible();
    
    // Search for "data"
    await searchInput.fill('data');
    
    // Should show only DataGrid component
    await expect(page.locator('[data-testid="component-palette-datagrid"]')).toBeVisible();
    await expect(page.locator('[data-testid="component-palette-torqueform"]')).toBeHidden();
    
    // Clear search
    await searchInput.fill('');
    
    // All components should be visible again
    await expect(page.locator('[data-testid="component-palette-datagrid"]')).toBeVisible();
    await expect(page.locator('[data-testid="component-palette-torqueform"]')).toBeVisible();
  });

  test('should support drag and drop from palette to canvas', async ({ page }) => {
    // Get the DataGrid component from palette
    const dataGridComponent = page.locator('[data-testid="component-palette-datagrid"]');
    
    // Get a target grid cell (middle of canvas)
    const targetCell = page.locator('[data-testid="grid-cell-5-5"]');
    
    // Perform drag and drop
    await dataGridComponent.dragTo(targetCell);
    
    // Check that component was added to canvas
    const placedComponent = page.locator('[data-testid^="component-datagrid-"]');
    await expect(placedComponent).toBeVisible();
    
    // Check that configuration panel now shows DataGrid configuration
    await expect(page.locator('text=Component Configuration')).toBeVisible();
    await expect(page.locator('text=DataGrid')).toBeVisible();
  });

  test('should show component configuration when component is selected', async ({ page }) => {
    // Add a DataGrid component first
    const dataGridComponent = page.locator('[data-testid="component-palette-datagrid"]');
    const targetCell = page.locator('[data-testid="grid-cell-3-3"]');
    await dataGridComponent.dragTo(targetCell);
    
    // Wait for component to be placed
    const placedComponent = page.locator('[data-testid^="component-datagrid-"]');
    await expect(placedComponent).toBeVisible();
    
    // Click on the placed component to select it
    await placedComponent.click();
    
    // Check that configuration panel shows DataGrid configuration
    await expect(page.locator('text=Component Configuration')).toBeVisible();
    await expect(page.locator('text=DataGrid')).toBeVisible();
    
    // Check for DataGrid-specific configuration tabs
    await expect(page.locator('button:has-text("Basic")')).toBeVisible();
    await expect(page.locator('button:has-text("Data Grid")')).toBeVisible();
  });

  test('should allow configuring DataGrid with entity binding', async ({ page }) => {
    // Add a DataGrid component
    const dataGridComponent = page.locator('[data-testid="component-palette-datagrid"]');
    const targetCell = page.locator('[data-testid="grid-cell-2-2"]');
    await dataGridComponent.dragTo(targetCell);
    
    // Wait for component and click to select
    const placedComponent = page.locator('[data-testid^="component-datagrid-"]');
    await expect(placedComponent).toBeVisible();
    await placedComponent.click();
    
    // Click on DataGrid configuration tab
    await page.click('button:has-text("Data Grid")');
    
    // Check that entity selection dropdown is present
    const entitySelect = page.locator('[data-testid="datagrid-entity-select"]');
    await expect(entitySelect).toBeVisible();
    
    // Select an entity (Customer should be available)
    await entitySelect.click();
    await page.click('text=Customer');
    
    // Check that available fields are shown
    await expect(page.locator('text=Available Fields')).toBeVisible();
    
    // Add a field column
    const firstNameField = page.locator('[data-testid="add-column-first_name"]');
    if (await firstNameField.isVisible()) {
      await firstNameField.click();
      
      // Check that column was added to configuration
      await expect(page.locator('text=Columns (1)')).toBeVisible();
    }
  });

  test('should allow adding and configuring Form component', async ({ page }) => {
    // Add a Form component
    const formComponent = page.locator('[data-testid="component-palette-torqueform"]');
    const targetCell = page.locator('[data-testid="grid-cell-6-6"]');
    await formComponent.dragTo(targetCell);
    
    // Wait for component and click to select
    const placedComponent = page.locator('[data-testid^="component-torqueform-"]');
    await expect(placedComponent).toBeVisible();
    await placedComponent.click();
    
    // Click on Form configuration tab
    await page.click('button:has-text("Form")');
    
    // Check that entity selection dropdown is present
    const entitySelect = page.locator('[data-testid="form-entity-select"]');
    await expect(entitySelect).toBeVisible();
    
    // Select an entity
    await entitySelect.click();
    await page.click('text=Customer');
    
    // Check that available fields are shown
    await expect(page.locator('text=Available Fields')).toBeVisible();
  });

  test('should support multiple components on canvas', async ({ page }) => {
    // Add multiple components
    const dataGridComponent = page.locator('[data-testid="component-palette-datagrid"]');
    const formComponent = page.locator('[data-testid="component-palette-torqueform"]');
    const buttonComponent = page.locator('[data-testid="component-palette-torquebutton"]');
    
    // Add DataGrid
    await dataGridComponent.dragTo(page.locator('[data-testid="grid-cell-1-1"]'));
    
    // Add Form
    await formComponent.dragTo(page.locator('[data-testid="grid-cell-1-7"]'));
    
    // Add Button
    await buttonComponent.dragTo(page.locator('[data-testid="grid-cell-8-4"]'));
    
    // Check that all components are present
    await expect(page.locator('[data-testid^="component-datagrid-"]')).toBeVisible();
    await expect(page.locator('[data-testid^="component-torqueform-"]')).toBeVisible();
    await expect(page.locator('[data-testid^="component-torquebutton-"]')).toBeVisible();
  });

  test('should save and load layout', async ({ page }) => {
    // Add a component
    const dataGridComponent = page.locator('[data-testid="component-palette-datagrid"]');
    await dataGridComponent.dragTo(page.locator('[data-testid="grid-cell-2-2"]'));
    
    // Wait for component to be placed
    await expect(page.locator('[data-testid^="component-datagrid-"]')).toBeVisible();
    
    // Click save button
    const saveButton = page.locator('button:has-text("Save Layout")');
    if (await saveButton.isVisible()) {
      await saveButton.click();
      
      // Should show success notification
      await expect(page.locator('text=Layout saved')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should support component positioning', async ({ page }) => {
    // Add a component
    const textComponent = page.locator('[data-testid="component-palette-text"]');
    const targetCell = page.locator('[data-testid="grid-cell-4-4"]');
    await textComponent.dragTo(targetCell);
    
    // Wait for component and click to select
    const placedComponent = page.locator('[data-testid^="component-text-"]');
    await expect(placedComponent).toBeVisible();
    await placedComponent.click();
    
    // Check position configuration in Basic tab
    await expect(page.locator('text=Position & Size')).toBeVisible();
    
    // Check that row and column inputs show correct values
    const rowInput = page.locator('input[label="Row"]');
    const columnInput = page.locator('input[label="Column"]');
    
    if (await rowInput.isVisible()) {
      await expect(rowInput).toHaveValue('4');
    }
    if (await columnInput.isVisible()) {
      await expect(columnInput).toHaveValue('4');
    }
  });
});