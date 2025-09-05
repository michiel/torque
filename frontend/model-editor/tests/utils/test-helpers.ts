import { Page } from '@playwright/test';
import { Data } from '@measured/puck';

/**
 * Test utilities for layout editor testing
 */

export interface TestLayoutData {
  id: string;
  name: string;
  components: Array<{
    componentType: string;
    properties: Record<string, any>;
  }>;
}

/**
 * Wait for layout editor to be fully loaded
 */
export async function waitForLayoutEditorReady(page: Page): Promise<void> {
  // Wait for the main editor container
  await page.waitForSelector('[data-testid="visual-layout-editor"]', { state: 'visible' });
  
  // Wait for Puck editor to be initialized
  await page.waitForSelector('.Puck', { state: 'visible' });
  
  // Wait for any loading states to complete
  await page.waitForSelector('[data-testid="loading-overlay"]', { state: 'hidden' });
  
  // Give additional time for React components to stabilize
  await page.waitForTimeout(1000);
}

/**
 * Capture console logs with specific filters
 */
export function setupConsoleCapture(page: Page, filters: string[]): string[] {
  const consoleLogs: string[] = [];
  
  page.on('console', msg => {
    const text = msg.text();
    if (filters.some(filter => text.includes(filter))) {
      consoleLogs.push(text);
    }
  });
  
  return consoleLogs;
}

/**
 * Extract JSON data from console logs
 */
export function extractJSONFromConsoleLog(log: string, pattern: string): any | null {
  try {
    const match = log.match(new RegExp(`${pattern}\\s*(.+)`));
    if (match && match[1]) {
      return JSON.parse(match[1]);
    }
  } catch (e) {
    console.warn('Failed to parse JSON from console log:', e);
  }
  return null;
}

/**
 * Simulate adding a component to the layout
 */
export async function addComponentToLayout(
  page: Page, 
  componentType: string
): Promise<boolean> {
  try {
    // Look for the component in the component list
    const componentSelector = `[data-rbd-draggable-id*="${componentType}"]`;
    const component = page.locator(componentSelector).first();
    
    if (await component.isVisible()) {
      // Find the canvas drop zone
      const canvas = page.locator('[data-rbd-droppable-id="droppable-canvas"]');
      if (await canvas.isVisible()) {
        await component.dragTo(canvas);
        
        // Wait for the component to be added
        await page.waitForSelector(`[data-testid="component-${componentType}"]`, { 
          state: 'visible',
          timeout: 5000 
        });
        
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.warn(`Failed to add ${componentType} component:`, error);
    return false;
  }
}

/**
 * Simulate editing layout name
 */
export async function editLayoutName(page: Page, newName: string): Promise<void> {
  // Click the edit button
  const editButton = page.locator('[title="Edit layout name"]');
  await editButton.click();
  
  // Fill in the new name
  const nameInput = page.locator('input[placeholder="Layout name"]');
  await nameInput.fill(newName);
  
  // Press Enter to save
  await nameInput.press('Enter');
}

/**
 * Wait for save operation to complete
 */
export async function waitForSaveComplete(page: Page): Promise<void> {
  // Wait for save status to show "Saved at"
  await page.waitForSelector('text=Saved at', { state: 'visible', timeout: 10000 });
}

/**
 * Verify component properties
 */
export async function verifyComponentProperties(
  page: Page,
  componentType: string,
  expectedProperties: Record<string, any>
): Promise<boolean> {
  try {
    // Click on the component to select it
    const component = page.locator(`[data-testid="component-${componentType}"]`).first();
    await component.click();
    
    // Wait for properties panel
    const propertiesPanel = page.locator('[data-testid="properties-panel"]');
    if (await propertiesPanel.isVisible()) {
      // Check each expected property
      for (const [key, expectedValue] of Object.entries(expectedProperties)) {
        const field = page.locator(`input[name="${key}"], select[name="${key}"], textarea[name="${key}"]`);
        if (await field.isVisible()) {
          const actualValue = await field.inputValue();
          if (actualValue !== expectedValue.toString()) {
            console.warn(`Property ${key} mismatch: expected ${expectedValue}, got ${actualValue}`);
            return false;
          }
        }
      }
      return true;
    }
    
    return false;
  } catch (error) {
    console.warn('Failed to verify component properties:', error);
    return false;
  }
}

/**
 * Mock GraphQL responses for testing
 */
export function createMockGraphQLResponse(
  query: string,
  variables: Record<string, any>,
  data: any
) {
  return {
    request: { query, variables },
    result: { data }
  };
}

/**
 * Create test layout data in legacy format
 */
export function createLegacyLayoutData(overrides: Partial<TestLayoutData> = {}): any {
  return {
    id: 'test-layout-1',
    name: 'Test Layout',
    description: 'A test layout',
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
            { field: 'id', header: 'ID', type: 'text' },
            { field: 'name', header: 'Name', type: 'text' }
          ],
          showPagination: true,
          pageSize: 10
        },
        styling: {},
        metadata: {}
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
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides
  };
}

/**
 * Create test layout data in Puck format
 */
export function createPuckLayoutData(overrides: Partial<Data> = {}): Data {
  return {
    content: [
      {
        type: 'DataGrid',
        props: {
          entityType: 'project',
          columns: [
            { field: 'id', header: 'ID', type: 'text' },
            { field: 'name', header: 'Name', type: 'text' }
          ],
          showPagination: true,
          pageSize: 10,
          id: 'test-component-1'
        }
      }
    ],
    root: {
      props: {
        title: 'Test Layout'
      }
    },
    ...overrides
  };
}

/**
 * Verify console logs contain expected data transformation logs
 */
export function verifyDataTransformationLogs(consoleLogs: string[]): {
  hasLoadedObjectLogs: boolean;
  hasTransformationLogs: boolean;
  hasVisualEditorLogs: boolean;
} {
  return {
    hasLoadedObjectLogs: consoleLogs.some(log => 
      log.includes('=== LAYOUT EDITOR: Loaded object before rendering ===')
    ),
    hasTransformationLogs: consoleLogs.some(log => 
      log.includes('=== LAYOUT EDITOR: Object after transformation ===')
    ),
    hasVisualEditorLogs: consoleLogs.some(log => 
      log.includes('=== VISUAL LAYOUT EDITOR: Data being set for rendering ===')
    )
  };
}

/**
 * Verify save operation logs
 */
export function verifySaveOperationLogs(consoleLogs: string[]): {
  hasSaveStartLogs: boolean;
  hasConversionLogs: boolean;
} {
  return {
    hasSaveStartLogs: consoleLogs.some(log => 
      log.includes('Starting save with Puck data:')
    ),
    hasConversionLogs: consoleLogs.some(log => 
      log.includes('Converted layout data for save:')
    )
  };
}

/**
 * Navigate to layout editor with error handling
 */
export async function navigateToLayoutEditor(
  page: Page,
  modelId: string,
  layoutId?: string
): Promise<void> {
  const url = layoutId 
    ? `/models/${modelId}/editor/layouts/${layoutId}`
    : `/models/${modelId}/editor/layouts/new`;
    
  await page.goto(url);
  
  // Wait for navigation to complete
  await page.waitForLoadState('networkidle');
}

/**
 * Check for error states in the layout editor
 */
export async function checkForErrorStates(page: Page): Promise<{
  hasModelError: boolean;
  hasLayoutError: boolean;
  errorMessage?: string;
}> {
  const modelError = await page.locator('text=Failed to load model').isVisible();
  const layoutError = await page.locator('text=Failed to load layout').isVisible();
  
  let errorMessage: string | undefined;
  if (modelError || layoutError) {
    const errorElement = page.locator('[role="alert"], .error-message').first();
    if (await errorElement.isVisible()) {
      errorMessage = await errorElement.textContent() || undefined;
    }
  }
  
  return {
    hasModelError: modelError,
    hasLayoutError: layoutError,
    errorMessage
  };
}
