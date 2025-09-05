import { test, expect } from '@playwright/test'

// Base URL for tests
const BASE_URL = 'http://localhost:3002'
const API_URL = 'http://localhost:8081'

test.describe('Data Entry Workflows E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Navigate to the TorqueApp
    await page.goto(BASE_URL)
    
    // Wait for initial page load
    await page.waitForLoadState('networkidle')
    
    // Mock successful API responses
    await page.route(`${API_URL}/jsonrpc`, async (route) => {
      const request = await route.request().postDataJSON()
      
      if (request.method === 'loadPage') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: request.id,
            result: {
              modelId: 'test-model',
              pageName: 'main',
              layout: {
                type: 'grid',
                responsive: true,
                components: [
                  {
                    id: 'datagrid-1',
                    type: 'DataGrid',
                    position: { row: 0, col: 0, span: 12 },
                    properties: {
                      entityName: 'users',
                      title: 'Users',
                      pagination: true,
                      showImportButton: true
                    }
                  },
                  {
                    id: 'form-1',
                    type: 'TorqueForm',
                    position: { row: 1, col: 0, span: 6 },
                    properties: {
                      entityName: 'users',
                      title: 'Add User'
                    }
                  }
                ]
              },
              metadata: {
                modelName: 'User Management',
                modelVersion: '1.0.0',
                loadedAt: new Date().toISOString()
              }
            }
          })
        })
      } else if (request.method === 'loadEntityData') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: request.id,
            result: {
              modelId: 'test-model',
              entityName: 'users',
              data: [
                { id: '1', name: 'John Doe', email: 'john@example.com', age: 30, active: true },
                { id: '2', name: 'Jane Smith', email: 'jane@example.com', age: 25, active: false },
                { id: '3', name: 'Bob Wilson', email: 'bob@example.com', age: 35, active: true }
              ],
              pagination: { page: 1, limit: 20, total: 3, hasMore: false },
              columns: [
                { key: 'name', title: 'Name', dataType: 'string', sortable: true, filterable: true, width: 200, editable: true },
                { key: 'email', title: 'Email', dataType: 'string', sortable: true, filterable: true, width: 250, editable: true },
                { key: 'age', title: 'Age', dataType: 'number', sortable: true, filterable: true, width: 100, editable: true },
                { key: 'active', title: 'Active', dataType: 'boolean', sortable: true, filterable: true, width: 100, editable: true }
              ]
            }
          })
        })
      } else if (request.method === 'getFormDefinition') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: request.id,
            result: {
              modelId: 'test-model',
              entityName: 'users',
              form: {
                layout: 'vertical',
                submitText: 'Save User',
                cancelText: 'Cancel',
                fields: [
                  {
                    id: 'field-1',
                    name: 'name',
                    label: 'Full Name',
                    type: 'text',
                    required: true,
                    validation: { minLength: 2 }
                  },
                  {
                    id: 'field-2',
                    name: 'email',
                    label: 'Email Address',
                    type: 'text',
                    required: true,
                    validation: { pattern: '^[^@]+@[^@]+\\.[^@]+$' }
                  },
                  {
                    id: 'field-3',
                    name: 'age',
                    label: 'Age',
                    type: 'number',
                    required: false,
                    validation: { min: 18, max: 100 }
                  },
                  {
                    id: 'field-4',
                    name: 'active',
                    label: 'Active',
                    type: 'checkbox',
                    required: false,
                    defaultValue: true
                  }
                ],
                validation: {
                  validateOnBlur: true,
                  validateOnChange: false
                }
              }
            }
          })
        })
      }
    })
  })

  test('Complete data entry workflow: View, Add, Edit, Delete', async ({ page }) => {
    // Step 1: Verify initial data grid is loaded
    await expect(page.locator('[data-testid="datagrid"]')).toBeVisible()
    await expect(page.locator('table')).toBeVisible()
    
    // Verify data is displayed
    await expect(page.locator('text=John Doe')).toBeVisible()
    await expect(page.locator('text=jane@example.com')).toBeVisible()
    await expect(page.locator('text=Bob Wilson')).toBeVisible()

    // Step 2: Add new user via form
    await expect(page.locator('[data-testid="user-form"]')).toBeVisible()
    
    // Fill out the form
    await page.fill('[data-testid="field-name"]', 'Alice Johnson')
    await page.fill('[data-testid="field-email"]', 'alice@example.com')
    await page.fill('[data-testid="field-age"]', '28')
    await page.check('[data-testid="field-active"]')

    // Mock successful create response
    await page.route(`${API_URL}/jsonrpc`, async (route) => {
      const request = await route.request().postDataJSON()
      if (request.method === 'createEntity') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: request.id,
            result: {
              id: 'new-user-4',
              modelId: 'test-model',
              entityName: 'users',
              data: {
                id: 'new-user-4',
                name: 'Alice Johnson',
                email: 'alice@example.com',
                age: 28,
                active: true
              },
              createdAt: new Date().toISOString()
            }
          })
        })
      }
    })

    // Submit the form
    await page.click('[data-testid="submit-button"]')
    
    // Verify success message
    await expect(page.locator('text=User created successfully')).toBeVisible()

    // Step 3: Test inline editing in data grid
    // Double-click on a cell to edit
    await page.dblclick('[data-testid="cell-name-1"]')
    
    // Verify edit mode is active
    await expect(page.locator('[data-testid="edit-input-name"]')).toBeVisible()
    
    // Change the name
    await page.fill('[data-testid="edit-input-name"]', 'John Smith')
    
    // Mock successful update response
    await page.route(`${API_URL}/jsonrpc`, async (route) => {
      const request = await route.request().postDataJSON()
      if (request.method === 'updateEntity') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: request.id,
            result: {
              id: '1',
              data: { name: 'John Smith' },
              updatedAt: new Date().toISOString()
            }
          })
        })
      }
    })

    // Save the edit by pressing Enter
    await page.press('[data-testid="edit-input-name"]', 'Enter')
    
    // Verify the change is reflected
    await expect(page.locator('text=John Smith')).toBeVisible()

    // Step 4: Test data filtering
    await page.fill('[data-testid="filter-name"]', 'Smith')
    
    // Verify filtered results
    await expect(page.locator('text=John Smith')).toBeVisible()
    await expect(page.locator('text=Jane Smith')).toBeVisible()
    await expect(page.locator('text=Bob Wilson')).not.toBeVisible()

    // Clear filter
    await page.fill('[data-testid="filter-name"]', '')
    await page.click('[data-testid="clear-filters"]')

    // Step 5: Test sorting
    await page.click('[data-testid="sort-age"]')
    
    // Verify age column is sorted ascending
    await expect(page.locator('[data-testid="sort-indicator-age"]')).toHaveAttribute('data-direction', 'asc')

    // Click again to sort descending
    await page.click('[data-testid="sort-age"]')
    await expect(page.locator('[data-testid="sort-indicator-age"]')).toHaveAttribute('data-direction', 'desc')

    // Step 6: Test row selection and bulk operations
    await page.check('[data-testid="select-row-1"]')
    await page.check('[data-testid="select-row-2"]')
    
    // Verify bulk action toolbar appears
    await expect(page.locator('[data-testid="bulk-actions"]')).toBeVisible()
    await expect(page.locator('text=2 items selected')).toBeVisible()

    // Step 7: Test pagination (if applicable)
    if (await page.locator('[data-testid="pagination"]').isVisible()) {
      await page.click('[data-testid="next-page"]')
      await expect(page.locator('[data-testid="page-indicator"]')).toContainText('Page 2')
    }
  })

  test('Data import workflow: CSV upload and processing', async ({ page }) => {
    // Wait for data grid to load
    await expect(page.locator('[data-testid="datagrid"]')).toBeVisible()

    // Step 1: Open import wizard
    await page.click('[data-testid="import-button"]')
    
    // Verify import wizard is open
    await expect(page.locator('[data-testid="import-wizard"]')).toBeVisible()
    await expect(page.locator('text=Import Data')).toBeVisible()

    // Step 2: Upload CSV file
    const csvContent = 'name,email,age\nCharlie Brown,charlie@example.com,32\nDiana Prince,diana@example.com,29'
    
    // Create a file and upload it
    await page.setInputFiles('[data-testid="file-input"]', {
      name: 'users.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    })

    // Verify file is uploaded
    await expect(page.locator('text=users.csv')).toBeVisible()
    await expect(page.locator('text=3 columns detected')).toBeVisible()
    await expect(page.locator('text=2 rows of data')).toBeVisible()

    // Step 3: Proceed to field mapping
    await page.click('[data-testid="next-step"]')
    
    // Verify mapping interface
    await expect(page.locator('text=Map Fields')).toBeVisible()
    await expect(page.locator('[data-testid="mapping-name"]')).toBeVisible()
    
    // Verify auto-mapping worked
    await expect(page.locator('[data-testid="mapping-name"] select')).toHaveValue('name')
    await expect(page.locator('[data-testid="mapping-email"] select')).toHaveValue('email')
    await expect(page.locator('[data-testid="mapping-age"] select')).toHaveValue('age')

    // Step 4: Configure transformations
    await page.selectOption('[data-testid="transform-name"]', 'trim')
    await page.selectOption('[data-testid="transform-email"]', 'lowercase')
    await page.selectOption('[data-testid="transform-age"]', 'number')

    // Step 5: Proceed to preview
    await page.click('[data-testid="next-step"]')
    
    // Verify data preview
    await expect(page.locator('text=Preview Data')).toBeVisible()
    await expect(page.locator('text=Charlie Brown')).toBeVisible()
    await expect(page.locator('text=Diana Prince')).toBeVisible()

    // Configure import options
    await page.check('[data-testid="skip-duplicates"]')
    await page.uncheck('[data-testid="update-existing"]')

    // Step 6: Execute import
    // Mock successful import response
    await page.route(`${API_URL}/jsonrpc`, async (route) => {
      const request = await route.request().postDataJSON()
      if (request.method === 'bulkImport') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: request.id,
            result: {
              success: true,
              totalRows: 2,
              successCount: 2,
              errorCount: 0,
              duplicateCount: 0,
              errors: [],
              createdIds: ['import-1', 'import-2']
            }
          })
        })
      }
    })

    await page.click('[data-testid="start-import"]')
    
    // Verify import progress
    await expect(page.locator('[data-testid="import-progress"]')).toBeVisible()
    
    // Wait for import completion
    await expect(page.locator('text=Import Completed')).toBeVisible()
    await expect(page.locator('text=2 records imported successfully')).toBeVisible()

    // Step 7: Close wizard and verify data is updated
    await page.click('[data-testid="close-wizard"]')
    
    // Verify import wizard is closed
    await expect(page.locator('[data-testid="import-wizard"]')).not.toBeVisible()
    
    // Verify new data appears in grid (would require re-loading data)
    await expect(page.locator('[data-testid="datagrid"]')).toBeVisible()
  })

  test('Form validation and conditional logic workflow', async ({ page }) => {
    // Wait for form to load
    await expect(page.locator('[data-testid="user-form"]')).toBeVisible()

    // Step 1: Test required field validation
    await page.click('[data-testid="submit-button"]')
    
    // Verify validation errors appear
    await expect(page.locator('text=Full Name is required')).toBeVisible()
    await expect(page.locator('text=Email Address is required')).toBeVisible()

    // Step 2: Test pattern validation
    await page.fill('[data-testid="field-name"]', 'Test User')
    await page.fill('[data-testid="field-email"]', 'invalid-email')
    
    // Trigger validation (blur event)
    await page.blur('[data-testid="field-email"]')
    
    // Verify pattern validation error
    await expect(page.locator('text=Please enter a valid email address')).toBeVisible()

    // Step 3: Test conditional logic (if implemented)
    // Mock form with conditional fields
    await page.route(`${API_URL}/jsonrpc`, async (route) => {
      const request = await route.request().postDataJSON()
      if (request.method === 'getFormDefinition') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: request.id,
            result: {
              modelId: 'test-model',
              entityName: 'users',
              form: {
                layout: 'vertical',
                submitText: 'Save',
                cancelText: 'Cancel',
                fields: [
                  {
                    id: 'field-1',
                    name: 'userType',
                    label: 'User Type',
                    type: 'select',
                    required: true,
                    options: [
                      { value: 'basic', label: 'Basic User' },
                      { value: 'premium', label: 'Premium User' }
                    ]
                  },
                  {
                    id: 'field-2',
                    name: 'premiumFeatures',
                    label: 'Premium Features',
                    type: 'textarea',
                    required: false,
                    uiConfig: {
                      showIf: { field: 'userType', operator: 'equals', value: 'premium' }
                    }
                  }
                ],
                validation: { validateOnBlur: true, validateOnChange: true }
              }
            }
          })
        })
      }
    })

    // Reload to get conditional form
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Initially, premium features field should be hidden
    await expect(page.locator('[data-testid="field-premiumFeatures"]')).not.toBeVisible()

    // Select premium user type
    await page.selectOption('[data-testid="field-userType"]', 'premium')

    // Verify conditional field appears
    await expect(page.locator('[data-testid="field-premiumFeatures"]')).toBeVisible()

    // Switch back to basic
    await page.selectOption('[data-testid="field-userType"]', 'basic')

    // Verify conditional field is hidden again
    await expect(page.locator('[data-testid="field-premiumFeatures"]')).not.toBeVisible()
  })

  test('Error handling and recovery workflow', async ({ page }) => {
    // Step 1: Test network error handling
    // Mock network failure
    await page.route(`${API_URL}/jsonrpc`, async (route) => {
      await route.abort('failed')
    })

    await page.goto(BASE_URL)

    // Verify error boundary is triggered
    await expect(page.locator('text=Something went wrong')).toBeVisible()
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible()

    // Step 2: Test retry functionality
    // Remove network error mock
    await page.unroute(`${API_URL}/jsonrpc`)
    
    // Mock successful response after retry
    await page.route(`${API_URL}/jsonrpc`, async (route) => {
      const request = await route.request().postDataJSON()
      if (request.method === 'loadPage') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: request.id,
            result: {
              modelId: 'test-model',
              pageName: 'main',
              layout: { type: 'grid', components: [] },
              metadata: {
                modelName: 'Test',
                modelVersion: '1.0.0',
                loadedAt: new Date().toISOString()
              }
            }
          })
        })
      }
    })

    // Click retry
    await page.click('[data-testid="retry-button"]')

    // Verify recovery
    await expect(page.locator('text=Something went wrong')).not.toBeVisible()

    // Step 3: Test API error handling in forms
    await page.route(`${API_URL}/jsonrpc`, async (route) => {
      const request = await route.request().postDataJSON()
      if (request.method === 'createEntity') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: -32602,
              message: 'Invalid params: Email already exists',
              data: { field: 'email' }
            }
          })
        })
      }
    })

    // Try to submit form with duplicate email
    await page.fill('[data-testid="field-name"]', 'Test User')
    await page.fill('[data-testid="field-email"]', 'existing@example.com')
    await page.click('[data-testid="submit-button"]')

    // Verify error is displayed
    await expect(page.locator('text=Email already exists')).toBeVisible()
  })

  test('Accessibility and keyboard navigation', async ({ page }) => {
    // Test keyboard navigation in data grid
    await page.focus('[data-testid="datagrid"] table')
    
    // Navigate with arrow keys
    await page.keyboard.press('ArrowDown') // Move to first data row
    await page.keyboard.press('ArrowRight') // Move to next column
    
    // Test Enter key for editing
    await page.keyboard.press('Enter')
    await expect(page.locator('[data-testid="edit-input"]')).toBeVisible()
    
    // Test Escape to cancel editing
    await page.keyboard.press('Escape')
    await expect(page.locator('[data-testid="edit-input"]')).not.toBeVisible()

    // Test form keyboard navigation
    await page.focus('[data-testid="field-name"]')
    await page.keyboard.press('Tab') // Move to next field
    await expect(page.locator('[data-testid="field-email"]')).toBeFocused()
    
    // Test Enter to submit form
    await page.fill('[data-testid="field-name"]', 'Keyboard User')
    await page.fill('[data-testid="field-email"]', 'keyboard@example.com')
    await page.keyboard.press('Enter')
    
    // Verify form submission
    await expect(page.locator('text=User created successfully')).toBeVisible()
  })
})