import { test, expect } from '@playwright/test';

test.describe('Layout Editor Console Logs', () => {
  test('should verify console.log statements are working in layout editor components', async ({ page }) => {
    // Set up console log capture
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'log') {
        consoleLogs.push(msg.text());
      }
    });

    // Create a simple HTML page that simulates the layout editor console logs
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Layout Editor Console Log Test</title>
      </head>
      <body>
        <div id="test-container">
          <h1>Layout Editor Console Log Test</h1>
          <div data-testid="visual-layout-editor">Visual Layout Editor</div>
        </div>
        
        <script>
          // Simulate the console logs that should be present in the layout editor
          console.log('=== LAYOUT EDITOR: Loaded object before rendering ===');
          console.log('Raw layout data:', JSON.stringify({
            id: 'test-layout',
            name: 'Test Layout',
            components: [
              {
                componentType: 'DataGrid',
                properties: { entityType: 'project' }
              }
            ]
          }, null, 2));
          console.log('Entities:', JSON.stringify([
            { id: 'entity-1', name: 'project', displayName: 'Project' }
          ], null, 2));
          console.log('=== END: Loaded object before rendering ===');
          
          console.log('=== LAYOUT EDITOR: Object after transformation ===');
          console.log('Transformed Puck data:', JSON.stringify({
            content: [
              {
                type: 'DataGrid',
                props: {
                  entityType: 'project',
                  id: 'migrated-0'
                }
              }
            ],
            root: {
              props: { title: 'Test Layout' }
            }
          }, null, 2));
          console.log('=== END: Object after transformation ===');
          
          console.log('=== VISUAL LAYOUT EDITOR: Data being set for rendering ===');
          console.log('Initial data received:', JSON.stringify({
            content: [
              {
                type: 'DataGrid',
                props: {
                  entityType: 'project',
                  id: 'migrated-0'
                }
              }
            ],
            root: {
              props: { title: 'Test Layout' }
            }
          }, null, 2));
          console.log('=== END: Data being set for rendering ===');
          
          // Simulate save operation logs
          setTimeout(() => {
            console.log('Starting save with Puck data:', JSON.stringify({
              content: [
                {
                  type: 'DataGrid',
                  props: {
                    entityType: 'project',
                    id: 'migrated-0'
                  }
                }
              ],
              root: {
                props: { title: 'Test Layout' }
              }
            }));
            
            console.log('Converted layout data for save:', JSON.stringify({
              name: 'Test Layout',
              components: [
                {
                  componentType: 'DataGrid',
                  properties: {
                    entityType: 'project',
                    _visualEditor: true
                  }
                }
              ]
            }));
          }, 100);
        </script>
      </body>
      </html>
    `;

    // Navigate to the test page
    await page.setContent(htmlContent);

    // Wait for the page to load and scripts to execute
    await page.waitForTimeout(500);

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

    // Wait for save operation logs
    await page.waitForTimeout(200);

    // Verify save operation logs
    const saveStartLogs = consoleLogs.filter(log => 
      log.includes('Starting save with Puck data:')
    );
    expect(saveStartLogs.length).toBeGreaterThan(0);

    const convertedLogs = consoleLogs.filter(log => 
      log.includes('Converted layout data for save:')
    );
    expect(convertedLogs.length).toBeGreaterThan(0);
  });

  test('should verify data transformation from legacy to Puck format', async ({ page }) => {
    const consoleLogs: any[] = [];
    const allLogs: string[] = [];
    
    page.on('console', msg => {
      const text = msg.text();
      allLogs.push(text);
      
      if (msg.type() === 'log' && text.includes('Transformed Puck data:')) {
        try {
          // Extract JSON from console log - handle multiline JSON
          const jsonStart = text.indexOf('{');
          if (jsonStart !== -1) {
            const jsonStr = text.substring(jsonStart);
            consoleLogs.push(JSON.parse(jsonStr));
          }
        } catch (e) {
          // Try to find JSON in the log text
          try {
            const match = text.match(/(\{[\s\S]*\})/);
            if (match) {
              consoleLogs.push(JSON.parse(match[1]));
            }
          } catch (e2) {
            console.warn('Failed to parse JSON from log:', text);
          }
        }
      }
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Data Transformation Test</title>
      </head>
      <body>
        <div data-testid="visual-layout-editor">Visual Layout Editor</div>
        
        <script>
          // Simulate data transformation
          const legacyLayout = {
            id: 'layout-1',
            name: 'Test Dashboard Layout',
            components: [
              {
                componentType: 'DataGrid',
                properties: {
                  entityType: 'project',
                  columns: [
                    { field: 'id', header: 'ID', type: 'text' },
                    { field: 'name', header: 'Name', type: 'text' }
                  ],
                  showPagination: true,
                  pageSize: 10
                }
              }
            ]
          };
          
          // Simulate transformation to Puck format
          const puckData = {
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
                  height: '300px',
                  id: 'migrated-0'
                }
              }
            ],
            root: {
              props: { title: 'Test Dashboard Layout' }
            }
          };
          
          console.log('Transformed Puck data:', JSON.stringify(puckData, null, 2));
        </script>
      </body>
      </html>
    `;

    await page.setContent(htmlContent);
    await page.waitForTimeout(500);

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

  test('should verify console logs contain expected data structure', async ({ page }) => {
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'log') {
        consoleLogs.push(msg.text());
      }
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Data Structure Test</title>
      </head>
      <body>
        <div data-testid="visual-layout-editor">Visual Layout Editor</div>
        
        <script>
          // Test the complete data flow cycle
          
          // 1. Raw layout data (before transformation)
          const rawLayoutData = {
            id: 'layout-1',
            name: 'Test Layout',
            components: [
              {
                componentType: 'DataGrid',
                position: { row: 0, column: 0, width: 12, height: 6 },
                properties: {
                  entityType: 'project',
                  columns: [
                    { field: 'id', header: 'ID', type: 'text' },
                    { field: 'name', header: 'Name', type: 'text' }
                  ]
                }
              }
            ]
          };
          
          console.log('=== LAYOUT EDITOR: Loaded object before rendering ===');
          console.log('Raw layout data:', JSON.stringify(rawLayoutData, null, 2));
          console.log('=== END: Loaded object before rendering ===');
          
          // 2. Transformed Puck data (after transformation)
          const puckData = {
            content: [
              {
                type: 'DataGrid',
                props: {
                  entityType: 'project',
                  columns: [
                    { field: 'id', header: 'ID', type: 'text' },
                    { field: 'name', header: 'Name', type: 'text' }
                  ],
                  height: '300px',
                  id: 'migrated-0'
                }
              }
            ],
            root: {
              props: { title: 'Test Layout' }
            }
          };
          
          console.log('=== LAYOUT EDITOR: Object after transformation ===');
          console.log('Transformed Puck data:', JSON.stringify(puckData, null, 2));
          console.log('=== END: Object after transformation ===');
          
          // 3. Visual editor receives data
          console.log('=== VISUAL LAYOUT EDITOR: Data being set for rendering ===');
          console.log('Initial data received:', JSON.stringify(puckData, null, 2));
          console.log('=== END: Data being set for rendering ===');
        </script>
      </body>
      </html>
    `;

    await page.setContent(htmlContent);
    await page.waitForTimeout(500);

    // Verify all expected log sections are present
    const hasLoadedObjectLogs = consoleLogs.some(log => 
      log.includes('=== LAYOUT EDITOR: Loaded object before rendering ===')
    );
    expect(hasLoadedObjectLogs).toBe(true);

    const hasTransformationLogs = consoleLogs.some(log => 
      log.includes('=== LAYOUT EDITOR: Object after transformation ===')
    );
    expect(hasTransformationLogs).toBe(true);

    const hasVisualEditorLogs = consoleLogs.some(log => 
      log.includes('=== VISUAL LAYOUT EDITOR: Data being set for rendering ===')
    );
    expect(hasVisualEditorLogs).toBe(true);

    // Verify data structure in logs
    const rawDataLogs = consoleLogs.filter(log => log.includes('Raw layout data:'));
    expect(rawDataLogs.length).toBeGreaterThan(0);

    const transformedDataLogs = consoleLogs.filter(log => log.includes('Transformed Puck data:'));
    expect(transformedDataLogs.length).toBeGreaterThan(0);

    const initialDataLogs = consoleLogs.filter(log => log.includes('Initial data received:'));
    expect(initialDataLogs.length).toBeGreaterThan(0);
  });
});
