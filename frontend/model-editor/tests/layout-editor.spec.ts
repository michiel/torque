import { test, expect, Page } from '@playwright/test';

// Test fixtures for layout data
const mockModel = {
  id: 'test-model-1',
  name: 'Test Model',
  description: 'A test model for layout editor testing',
  version: '1.0.0',
  entities: [
    {
      id: 'entity-1',
      name: 'project',
      displayName: 'Project',
      description: 'Project entity',
      entityType: 'standard',
      fields: [
        {
          id: 'field-1',
          name: 'id',
          displayName: 'ID',
          fieldType: 'string',
          required: true,
          defaultValue: null,
          validation: null,
          uiConfig: null
        },
        {
          id: 'field-2',
          name: 'name',
          displayName: 'Name',
          fieldType: 'string',
          required: true,
          defaultValue: null,
          validation: null,
          uiConfig: null
        },
        {
          id: 'field-3',
          name: 'description',
          displayName: 'Description',
          fieldType: 'text',
          required: false,
          defaultValue: null,
          validation: null,
          uiConfig: null
        }
      ]
    },
    {
      id: 'entity-2',
      name: 'task',
      displayName: 'Task',
      description: 'Task entity',
      entityType: 'standard',
      fields: [
        {
          id: 'field-4',
          name: 'id',
          displayName: 'ID',
          fieldType: 'string',
          required: true,
          defaultValue: null,
          validation: null,
          uiConfig: null
        },
        {
          id: 'field-5',
          name: 'title',
          displayName: 'Title',
          fieldType: 'string',
          required: true,
          defaultValue: null,
          validation: null,
          uiConfig: null
        },
        {
          id: 'field-6',
          name: 'completed',
          displayName: 'Completed',
          fieldType: 'boolean',
          required: false,
          defaultValue: false,
          validation: null,
          uiConfig: null
        }
      ]
    }
  ]
};

const mockEntities = [
  {
    id: 'entity-1',
    name: 'project',
    displayName: 'Project',
    description: 'Project entity',
    entityType: 'standard',
    fields: [
      {
        id: 'field-1',
        name: 'id',
        displayName: 'ID',
        fieldType: 'string',
        required: true,
        defaultValue: null,
        validation: null,
        uiConfig: null
      },
      {
        id: 'field-2',
        name: 'name',
        displayName: 'Name',
        fieldType: 'string',
        required: true,
        defaultValue: null,
        validation: null,
        uiConfig: null
      }
    ]
  }
];

// Legacy layout format (before transformation)
const mockLegacyLayout = {
  id: 'layout-1',
  name: 'Test Dashboard Layout',
  description: 'A test layout for dashboard',
  layoutType: 'Dashboard',
  targetEntities: ['entity-1'],
  components: [
    {
      id: 'comp-1',
      componentType: 'DataGrid',
      position: { row: 0, column: 0, width: 12, height: 6 },
      properties: {
        entityType: 'project',
        columns: [
          { field: 'id', header: 'ID', type: 'text', sortable: true, filterable: true },
          { field: 'name', header: 'Name', type: 'text', sortable: true, filterable: true }
        ],
        showPagination: true,
        pageSize: 10
      },
      styling: {},
      metadata: { createdWith: 'legacy-editor', version: '1.0' }
    },
    {
      id: 'comp-2',
      componentType: 'TorqueForm',
      position: { row: 1, column: 0, width: 6, height: 8 },
      properties: {
        entityType: 'project',
        formTitle: 'Create New Project',
        fields: [
          { name: 'name', label: 'Project Name', type: 'text', required: true },
          { name: 'description', label: 'Description', type: 'textarea', required: false }
        ]
      },
      styling: {},
      metadata: { createdWith: 'legacy-editor', version: '1.0' }
    }
  ],
  responsive: {
    breakpoints: [
      { name: 'mobile', minWidth: 0, columns: 1 },
      { name: 'tablet', minWidth: 768, columns: 2 },
      { name: 'desktop', minWidth: 1024, columns: 3 }
    ]
  },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
};

// Visual editor layout format (after transformation to Puck format)
const mockVisualEditorLayout = {
  id: 'layout-2',
  name: 'Visual Editor Layout',
  description: 'A layout created with visual editor',
  layoutType: 'Dashboard',
  targetEntities: ['entity-1'],
  components: [
    {
      id: 'comp-3',
      componentType: 'DataGrid',
      position: { row: 0, column: 0, width: 12, height: 6 },
      properties: {
        entityType: 'project',
        columns: [
          { field: 'id', header: 'ID', type: 'text', sortable: true, filterable: true },
          { field: 'name', header: 'Name', type: 'text', sortable: true, filterable: true }
        ],
        showPagination: true,
        pageSize: 10,
        _visualEditor: true
      },
      styling: {},
      metadata: { createdWith: 'visual-editor', version: '2.0' }
    }
  ],
  responsive: {
    breakpoints: [
      { name: 'mobile', minWidth: 0, columns: 1 },
      { name: 'tablet', minWidth: 768, columns: 2 },
      { name: 'desktop', minWidth: 1024, columns: 3 }
    ]
  },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
};

// Expected Puck data format (after transformation)
const expectedPuckData = {
  content: [
    {
      type: 'DataGrid',
      props: {
        entityType: 'project',
        columns: [
          { field: 'id', header: 'ID', type: 'text', sortable: true, filterable: true },
          { field: 'name', header: 'Name', type: 'text', sortable: true, filterable: true }
        ],
        showPagination: true,
        pageSize: 10,
        height: '300px',
        id: 'migrated-0'
      }
    },
    {
      type: 'TorqueForm',
      props: {
        entityType: 'project',
        formTitle: 'Create New Project',
        fields: [
          { name: 'name', label: 'Project Name', type: 'text', required: true },
          { name: 'description', label: 'Description', type: 'textarea', required: false }
        ],
        submitButtonText: 'Submit',
        cancelButtonText: 'Cancel',
        showCancelButton: true,
        layout: 'stacked',
        spacing: 'md',
        id: 'migrated-1'
      }
    }
  ],
  root: {
    title: 'Test Dashboard Layout'
  }
};


test.describe('Layout Editor Data Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the layout editor page
    await page.goto('/models/test-model-1/editor/layouts/layout-1');
  });

  test('should load layout data from GraphQL and display console logs', async ({ page }) => {
    // Set up console log capture
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'log' && msg.text().includes('LAYOUT EDITOR:')) {
        consoleLogs.push(msg.text());
      }
    });

    // Wait for the layout editor to load
    await expect(page.locator('[data-testid="visual-layout-editor"]')).toBeVisible();

    // Wait for console logs to appear
    await page.waitForTimeout(2000);

    // Verify that the loaded object console logs are present
    const loadedObjectLogs = consoleLogs.filter(log => 
      log.includes('=== LAYOUT EDITOR: Loaded object before rendering ===')
    );
    expect(loadedObjectLogs.length).toBeGreaterThan(0);

    // Verify that the transformation console logs are present
    const transformationLogs = consoleLogs.filter(log => 
      log.includes('=== LAYOUT EDITOR: Object after transformation ===')
    );
    expect(transformationLogs.length).toBeGreaterThan(0);

    // Verify that the visual editor console logs are present
    const visualEditorLogs = consoleLogs.filter(log => 
      log.includes('=== VISUAL LAYOUT EDITOR: Data being set for rendering ===')
    );
    expect(visualEditorLogs.length).toBeGreaterThan(0);
  });

  test('should transform legacy layout data to Puck editor format', async ({ page }) => {
    // Set up console log capture to verify transformation
    const consoleLogs: any[] = [];
    page.on('console', msg => {
      if (msg.type() === 'log' && msg.text().includes('Transformed Puck data:')) {
        try {
          // Extract JSON from console log
          const jsonMatch = msg.text().match(/Transformed Puck data: (.+)/);
          if (jsonMatch) {
            consoleLogs.push(JSON.parse(jsonMatch[1]));
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }
    });

    // Wait for the layout editor to load and transform data
    await expect(page.locator('[data-testid="visual-layout-editor"]')).toBeVisible();
    await page.waitForTimeout(2000);

    // Verify transformation occurred
    expect(consoleLogs.length).toBeGreaterThan(0);
    
    const transformedData = consoleLogs[0];
    expect(transformedData).toHaveProperty('content');
    expect(transformedData).toHaveProperty('root');
    expect(transformedData.content).toBeInstanceOf(Array);
    expect(transformedData.content.length).toBeGreaterThan(0);

    // Verify component transformation
    const firstComponent = transformedData.content[0];
    expect(firstComponent).toHaveProperty('type');
    expect(firstComponent).toHaveProperty('props');
    expect(firstComponent.type).toBe('DataGrid');
    expect(firstComponent.props).toHaveProperty('entityType', 'project');
  });

  test('should handle layout changes in the editor', async ({ page }) => {
    // Wait for the layout editor to load
    await expect(page.locator('[data-testid="visual-layout-editor"]')).toBeVisible();

    // Wait for Puck editor to be ready
    await expect(page.locator('.Puck')).toBeVisible();

    // Add a new component by dragging from the component list
    const componentList = page.locator('[data-rbd-droppable-id="component-list"]');
    await expect(componentList).toBeVisible();

    // Look for a Text component in the component list
    const textComponent = page.locator('[data-rbd-draggable-id*="Text"]').first();
    if (await textComponent.isVisible()) {
      // Drag the Text component to the canvas
      const canvas = page.locator('[data-rbd-droppable-id="droppable-canvas"]');
      await textComponent.dragTo(canvas);

      // Verify the component was added
      await expect(page.locator('[data-testid="component-Text"]')).toBeVisible();
    }

    // Verify save status changes to "unsaved"
    await expect(page.locator('text=Unsaved changes')).toBeVisible();
  });

  test('should save layout data with transformation back to Torque format', async ({ page }) => {
    // Set up console log capture for save operations
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'log' && (
        msg.text().includes('Starting save with Puck data:') ||
        msg.text().includes('Converted layout data for save:')
      )) {
        consoleLogs.push(msg.text());
      }
    });

    // Wait for the layout editor to load
    await expect(page.locator('[data-testid="visual-layout-editor"]')).toBeVisible();

    // Make a change to trigger unsaved state
    const layoutNameEdit = page.locator('[title="Edit layout name"]');
    await layoutNameEdit.click();
    
    const nameInput = page.locator('input[placeholder="Layout name"]');
    await nameInput.fill('Updated Test Layout');
    await nameInput.press('Enter');

    // Click the save button
    const saveButton = page.locator('button:has-text("Save")');
    await saveButton.click();

    // Wait for save operation to complete
    await expect(page.locator('text=Saved at')).toBeVisible();

    // Verify console logs show the save process
    await page.waitForTimeout(1000);
    const saveStartLogs = consoleLogs.filter(log => log.includes('Starting save with Puck data:'));
    const convertedLogs = consoleLogs.filter(log => log.includes('Converted layout data for save:'));
    
    expect(saveStartLogs.length).toBeGreaterThan(0);
    expect(convertedLogs.length).toBeGreaterThan(0);
  });

  test('should reload layout data and ensure correct rendering', async ({ page }) => {
    // Load the layout initially
    await expect(page.locator('[data-testid="visual-layout-editor"]')).toBeVisible();
    
    // Wait for initial load
    await page.waitForTimeout(2000);

    // Get the initial component count
    const initialComponents = await page.locator('[data-testid^="component-"]').count();

    // Reload the page to test data persistence
    await page.reload();

    // Wait for the layout editor to load again
    await expect(page.locator('[data-testid="visual-layout-editor"]')).toBeVisible();
    await page.waitForTimeout(2000);

    // Verify the same number of components are rendered
    const reloadedComponents = await page.locator('[data-testid^="component-"]').count();
    expect(reloadedComponents).toBe(initialComponents);

    // Verify the layout name is preserved
    const layoutName = await page.locator('[data-testid="layout-name"]').textContent();
    expect(layoutName).toBeTruthy();
  });

  test('should handle new layout creation', async ({ page }) => {
    // Navigate to new layout creation
    await page.goto('/models/test-model-1/editor/layouts/new');

    // Wait for the layout editor to load with default data
    await expect(page.locator('[data-testid="visual-layout-editor"]')).toBeVisible();

    // Verify default layout name
    await expect(page.locator('text=New Layout')).toBeVisible();

    // Add a component
    const componentList = page.locator('[data-rbd-droppable-id="component-list"]');
    if (await componentList.isVisible()) {
      const dataGridComponent = page.locator('[data-rbd-draggable-id*="DataGrid"]').first();
      if (await dataGridComponent.isVisible()) {
        const canvas = page.locator('[data-rbd-droppable-id="droppable-canvas"]');
        await dataGridComponent.dragTo(canvas);
      }
    }

    // Save the new layout
    const saveButton = page.locator('button:has-text("Save")');
    await saveButton.click();

    // Verify navigation to the new layout
    await expect(page).toHaveURL(/\/models\/test-model-1\/editor\/layouts\/new-layout-1/);
  });

  test('should handle migration warnings for legacy layouts', async ({ page }) => {
    // Set up console log capture for migration warnings
    const consoleWarnings: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'warning' && msg.text().includes('Layout migration warnings:')) {
        consoleWarnings.push(msg.text());
      }
    });

    // Load a legacy layout that needs migration
    await page.goto('/models/test-model-1/editor/layouts/layout-1');
    
    // Wait for the layout editor to load
    await expect(page.locator('[data-testid="visual-layout-editor"]')).toBeVisible();
    await page.waitForTimeout(2000);

    // Check if migration warnings were logged (if applicable)
    // Note: This test may not always have warnings depending on the layout data
    if (consoleWarnings.length > 0) {
      expect(consoleWarnings[0]).toContain('Layout migration warnings:');
    }
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Test with invalid model ID
    await page.goto('/models/invalid-model/editor/layouts/layout-1');

    // Should show error message
    await expect(page.locator('text=Failed to load model')).toBeVisible();

    // Test with invalid layout ID
    await page.goto('/models/test-model-1/editor/layouts/invalid-layout');

    // Should show error message
    await expect(page.locator('text=Failed to load layout')).toBeVisible();
  });

  test('should auto-save changes after inactivity', async ({ page }) => {
    // Wait for the layout editor to load
    await expect(page.locator('[data-testid="visual-layout-editor"]')).toBeVisible();

    // Make a change
    const layoutNameEdit = page.locator('[title="Edit layout name"]');
    await layoutNameEdit.click();
    
    const nameInput = page.locator('input[placeholder="Layout name"]');
    await nameInput.fill('Auto-saved Layout');
    await nameInput.press('Enter');

    // Verify unsaved state
    await expect(page.locator('text=Unsaved changes')).toBeVisible();

    // Wait for auto-save (3 seconds + buffer)
    await page.waitForTimeout(4000);

    // Verify auto-save occurred
    await expect(page.locator('text=Saved at')).toBeVisible();
  });

  test('should preserve component properties during save/reload cycle', async ({ page }) => {
    // Load the layout
    await expect(page.locator('[data-testid="visual-layout-editor"]')).toBeVisible();
    await page.waitForTimeout(2000);

    // If there's a DataGrid component, verify its properties
    const dataGridComponent = page.locator('[data-testid="component-DataGrid"]').first();
    if (await dataGridComponent.isVisible()) {
      // Click to select the component
      await dataGridComponent.click();

      // Check if properties panel is visible
      const propertiesPanel = page.locator('[data-testid="properties-panel"]');
      if (await propertiesPanel.isVisible()) {
        // Verify entity type is preserved
        const entityTypeField = page.locator('input[name="entityType"]');
        if (await entityTypeField.isVisible()) {
          const entityType = await entityTypeField.inputValue();
          expect(entityType).toBe('project');
        }
      }
    }

    // Save the layout
    const saveButton = page.locator('button:has-text("Save")');
    await saveButton.click();
    await expect(page.locator('text=Saved at')).toBeVisible();

    // Reload and verify properties are preserved
    await page.reload();
    await expect(page.locator('[data-testid="visual-layout-editor"]')).toBeVisible();
    await page.waitForTimeout(2000);

    // Verify component is still there with same properties
    if (await dataGridComponent.isVisible()) {
      await dataGridComponent.click();
      const propertiesPanel = page.locator('[data-testid="properties-panel"]');
      if (await propertiesPanel.isVisible()) {
        const entityTypeField = page.locator('input[name="entityType"]');
        if (await entityTypeField.isVisible()) {
          const entityType = await entityTypeField.inputValue();
          expect(entityType).toBe('project');
        }
      }
    }
  });
});
