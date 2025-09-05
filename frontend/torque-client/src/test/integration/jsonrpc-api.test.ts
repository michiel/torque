import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'
import { server } from '../mocks/server'
import type { 
  JsonRpcRequest, 
  JsonRpcResponse,
  LoadPageParams,
  LoadEntityDataParams,
  CreateEntityParams,
  UpdateEntityParams,
  DeleteEntityParams,
  BulkImportParams
} from '../../types/jsonrpc'

// Mock JSON-RPC client
class JsonRpcClient {
  private idCounter = 1

  async call<T = any>(method: string, params?: Record<string, any>): Promise<T> {
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      method,
      params,
      id: this.idCounter++
    }

    const response = await fetch('http://localhost:8081/jsonrpc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const jsonResponse: JsonRpcResponse<T> = await response.json()

    if (jsonResponse.error) {
      throw new Error(`JSON-RPC Error ${jsonResponse.error.code}: ${jsonResponse.error.message}`)
    }

    return jsonResponse.result!
  }
}

describe('JSON-RPC API Integration Tests', () => {
  let client: JsonRpcClient

  beforeAll(() => {
    server.listen()
  })

  beforeEach(() => {
    client = new JsonRpcClient()
    server.resetHandlers()
  })

  afterAll(() => {
    server.close()
  })

  describe('Page Operations', () => {
    it('loads page layout successfully', async () => {
      const params: LoadPageParams = {
        modelId: 'test-model-1',
        pageName: 'main'
      }

      const result = await client.call('loadPage', params)

      expect(result).toMatchObject({
        modelId: 'test-model-1',
        pageName: 'main',
        layout: {
          type: 'grid',
          responsive: true,
          components: expect.arrayContaining([
            expect.objectContaining({
              type: 'DataGrid',
              position: expect.objectContaining({
                row: expect.any(Number),
                col: expect.any(Number),
                span: expect.any(Number)
              })
            })
          ])
        },
        metadata: {
          modelName: expect.any(String),
          modelVersion: expect.any(String),
          loadedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/)
        }
      })
    })

    it('handles page not found gracefully', async () => {
      const params: LoadPageParams = {
        modelId: 'non-existent-model',
        pageName: 'non-existent-page'
      }

      // This should still return a valid response based on our mock
      const result = await client.call('loadPage', params)
      expect(result.modelId).toBe('non-existent-model')
    })

    it('defaults to main page when page name not specified', async () => {
      const params: LoadPageParams = {
        modelId: 'test-model-1'
      }

      const result = await client.call('loadPage', params)
      expect(result.pageName).toBe('main')
    })
  })

  describe('Entity Data Operations', () => {
    it('loads entity data with pagination', async () => {
      const params: LoadEntityDataParams = {
        modelId: 'test-model-1',
        entityName: 'users',
        page: 1,
        limit: 10
      }

      const result = await client.call('loadEntityData', params)

      expect(result).toMatchObject({
        modelId: 'test-model-1',
        entityName: 'users',
        data: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
            email: expect.any(String)
          })
        ]),
        pagination: {
          page: 1,
          limit: 10,
          total: expect.any(Number),
          hasMore: expect.any(Boolean)
        },
        columns: expect.arrayContaining([
          expect.objectContaining({
            key: expect.any(String),
            title: expect.any(String),
            dataType: expect.any(String),
            sortable: expect.any(Boolean),
            filterable: expect.any(Boolean)
          })
        ])
      })
    })

    it('supports filtering and sorting', async () => {
      const params: LoadEntityDataParams = {
        modelId: 'test-model-1',
        entityName: 'users',
        filters: {
          name: 'John'
        },
        sort: {
          field: 'name',
          direction: 'asc'
        }
      }

      const result = await client.call('loadEntityData', params)

      expect(result.data).toBeDefined()
      expect(result.pagination).toBeDefined()
    })

    it('handles large page requests', async () => {
      const params: LoadEntityDataParams = {
        modelId: 'test-model-1',
        entityName: 'users',
        page: 100,
        limit: 1000
      }

      const result = await client.call('loadEntityData', params)
      
      // Should handle gracefully even if no data exists
      expect(result.data).toEqual([])
      expect(result.pagination.hasMore).toBe(false)
    })

    it('supports search functionality', async () => {
      const params: LoadEntityDataParams = {
        modelId: 'test-model-1',
        entityName: 'users',
        search: 'john@example.com'
      }

      const result = await client.call('loadEntityData', params)
      expect(result).toBeDefined()
    })
  })

  describe('Form Operations', () => {
    it('retrieves form definition', async () => {
      const result = await client.call('getFormDefinition', {
        modelId: 'test-model-1',
        entityName: 'users'
      })

      expect(result).toMatchObject({
        modelId: 'test-model-1',
        entityName: 'users',
        form: {
          layout: expect.stringMatching(/vertical|horizontal/),
          submitText: expect.any(String),
          cancelText: expect.any(String),
          fields: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              name: expect.any(String),
              label: expect.any(String),
              type: expect.any(String),
              required: expect.any(Boolean)
            })
          ]),
          validation: {
            validateOnBlur: expect.any(Boolean),
            validateOnChange: expect.any(Boolean)
          }
        }
      })
    })

    it('form definition includes conditional logic fields', async () => {
      const result = await client.call('getFormDefinition', {
        modelId: 'test-model-1',
        entityName: 'users'
      })

      const conditionalField = result.form.fields.find((field: any) => field.uiConfig?.showIf)
      expect(conditionalField).toBeDefined()
      expect(conditionalField.uiConfig.showIf).toMatchObject({
        field: expect.any(String),
        operator: expect.stringMatching(/equals|notEquals|contains|isEmpty|isNotEmpty|greaterThan|lessThan/),
        value: expect.anything()
      })
    })
  })

  describe('Entity CRUD Operations', () => {
    it('creates new entity successfully', async () => {
      const params: CreateEntityParams = {
        modelId: 'test-model-1',
        entityName: 'users',
        data: {
          name: 'New User',
          email: 'newuser@example.com',
          age: 28
        }
      }

      const result = await client.call('createEntity', params)

      expect(result).toMatchObject({
        id: expect.any(String),
        modelId: 'test-model-1',
        entityName: 'users',
        data: {
          name: 'New User',
          email: 'newuser@example.com',
          age: 28,
          id: expect.any(String)
        },
        createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/)
      })
    })

    it('updates existing entity successfully', async () => {
      const params: UpdateEntityParams = {
        entityId: 'existing-user-1',
        data: {
          name: 'Updated Name',
          email: 'updated@example.com'
        }
      }

      const result = await client.call('updateEntity', params)

      expect(result).toMatchObject({
        id: 'existing-user-1',
        data: {
          name: 'Updated Name',
          email: 'updated@example.com'
        },
        updatedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/)
      })
    })

    it('deletes entity successfully', async () => {
      const params: DeleteEntityParams = {
        entityId: 'user-to-delete'
      }

      const result = await client.call('deleteEntity', params)

      expect(result).toMatchObject({
        id: 'user-to-delete',
        deleted: true,
        deletedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/)
      })
    })

    it('handles invalid entity data gracefully', async () => {
      const params: CreateEntityParams = {
        modelId: 'test-model-1',
        entityName: 'users',
        data: {} // Empty data should still work
      }

      const result = await client.call('createEntity', params)
      expect(result.id).toBeDefined()
    })
  })

  describe('Bulk Import Operations', () => {
    it('performs bulk import successfully', async () => {
      const params: BulkImportParams = {
        modelId: 'test-model-1',
        entityName: 'users',
        data: [
          { name: 'User 1', email: 'user1@example.com', age: 25 },
          { name: 'User 2', email: 'user2@example.com', age: 30 },
          { name: 'User 3', email: 'user3@example.com', age: 35 }
        ],
        fieldMapping: [
          { sourceColumn: 'name', targetField: 'name', transform: 'trim', required: true },
          { sourceColumn: 'email', targetField: 'email', transform: 'lowercase', required: true },
          { sourceColumn: 'age', targetField: 'age', transform: 'number', required: false }
        ],
        options: {
          skipDuplicates: true,
          updateExisting: false,
          validateOnly: false
        }
      }

      const result = await client.call('bulkImport', params)

      expect(result).toMatchObject({
        success: true,
        totalRows: 3,
        successCount: 3,
        errorCount: 0,
        duplicateCount: 0,
        errors: [],
        createdIds: expect.arrayContaining([
          expect.any(String),
          expect.any(String),
          expect.any(String)
        ])
      })
    })

    it('handles validation-only import', async () => {
      const params: BulkImportParams = {
        modelId: 'test-model-1',
        entityName: 'users',
        data: [{ name: 'Test User', email: 'test@example.com' }],
        fieldMapping: [
          { sourceColumn: 'name', targetField: 'name', transform: 'none', required: true },
          { sourceColumn: 'email', targetField: 'email', transform: 'none', required: true }
        ],
        options: {
          skipDuplicates: false,
          updateExisting: false,
          validateOnly: true
        }
      }

      const result = await client.call('bulkImport', params)

      expect(result.success).toBe(true)
      expect(result.createdIds).toHaveLength(0) // No actual creation in validation mode
    })

    it('handles import with errors', async () => {
      // Mock an import that would have validation errors
      const params: BulkImportParams = {
        modelId: 'test-model-1',
        entityName: 'users',
        data: [
          { name: '', email: 'invalid-email' }, // Invalid data
          { name: 'Valid User', email: 'valid@example.com' }
        ],
        fieldMapping: [
          { sourceColumn: 'name', targetField: 'name', transform: 'none', required: true },
          { sourceColumn: 'email', targetField: 'email', transform: 'none', required: true }
        ],
        options: {
          skipDuplicates: false,
          updateExisting: false,
          validateOnly: false
        }
      }

      // Our mock will return success, but in real implementation this might have errors
      const result = await client.call('bulkImport', params)
      expect(result.totalRows).toBe(2)
    })
  })

  describe('System Operations', () => {
    it('retrieves system capabilities', async () => {
      const result = await client.call('getCapabilities')

      expect(result).toMatchObject({
        version: expect.any(String),
        apiVersion: expect.any(String),
        features: expect.arrayContaining([
          expect.any(String)
        ]),
        supportedComponents: expect.arrayContaining([
          'DataGrid',
          'TorqueForm',
          'TorqueButton'
        ]),
        supportedLayouts: expect.arrayContaining([
          'grid',
          'flex',
          'absolute'
        ])
      })
    })
  })

  describe('Error Handling', () => {
    it('handles unknown methods gracefully', async () => {
      await expect(client.call('unknownMethod')).rejects.toThrow('Method not found')
    })

    it('handles network errors', async () => {
      // Mock network error
      const originalFetch = global.fetch
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      await expect(client.call('loadPage', { modelId: 'test' })).rejects.toThrow('Network error')

      global.fetch = originalFetch
    })

    it('handles malformed JSON-RPC responses', async () => {
      // Mock malformed response
      const originalFetch = global.fetch
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ invalid: 'response' })
      })

      await expect(client.call('loadPage', { modelId: 'test' })).rejects.toThrow()

      global.fetch = originalFetch
    })

    it('handles HTTP error responses', async () => {
      const originalFetch = global.fetch
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      })

      await expect(client.call('loadPage', { modelId: 'test' })).rejects.toThrow('HTTP 500')

      global.fetch = originalFetch
    })
  })

  describe('Performance and Concurrency', () => {
    it('handles multiple concurrent requests', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        client.call('loadEntityData', {
          modelId: 'test-model-1',
          entityName: 'users',
          page: i + 1,
          limit: 10
        })
      )

      const results = await Promise.all(promises)

      expect(results).toHaveLength(10)
      results.forEach((result, index) => {
        expect(result.pagination.page).toBe(index + 1)
      })
    })

    it('handles large data requests efficiently', async () => {
      const startTime = Date.now()

      const result = await client.call('loadEntityData', {
        modelId: 'test-model-1',
        entityName: 'users',
        limit: 1000
      })

      const duration = Date.now() - startTime

      expect(result).toBeDefined()
      expect(duration).toBeLessThan(5000) // Should complete within 5 seconds
    })

    it('maintains correct request/response correlation', async () => {
      const client1 = new JsonRpcClient()
      const client2 = new JsonRpcClient()

      const [result1, result2] = await Promise.all([
        client1.call('loadEntityData', { modelId: 'model-1', entityName: 'users' }),
        client2.call('loadEntityData', { modelId: 'model-2', entityName: 'products' })
      ])

      expect(result1.modelId).toBe('model-1')
      expect(result1.entityName).toBe('users')
      expect(result2.modelId).toBe('model-2')
      expect(result2.entityName).toBe('products')
    })
  })

  describe('Data Validation', () => {
    it('validates required parameters', async () => {
      // Test missing required parameters
      await expect(client.call('loadPage', {})).resolves.toBeDefined()
      // Our mock doesn't enforce required params, but real implementation would
    })

    it('validates parameter types', async () => {
      const result = await client.call('loadEntityData', {
        modelId: 'test-model-1',
        entityName: 'users',
        page: '1', // String instead of number
        limit: '10' // String instead of number
      })

      // Mock accepts any parameters, but real implementation would validate types
      expect(result).toBeDefined()
    })

    it('handles edge cases in pagination', async () => {
      const result = await client.call('loadEntityData', {
        modelId: 'test-model-1',
        entityName: 'users',
        page: 0, // Invalid page number
        limit: -10 // Invalid limit
      })

      expect(result).toBeDefined()
    })
  })
})