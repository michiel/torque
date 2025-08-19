import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import type { 
  JsonRpcRequest, 
  JsonRpcResponse, 
  LoadPageResponse, 
  LoadEntityDataResponse,
  GetFormDefinitionResponse,
  CreateEntityResponse,
  UpdateEntityResponse,
  DeleteEntityResponse,
  ImportResult,
  CapabilitiesResponse
} from '../../types/jsonrpc'

// Mock data
const mockPageLayout = {
  type: 'grid' as const,
  responsive: true,
  components: [
    {
      id: 'datagrid-1',
      type: 'DataGrid' as const,
      position: { row: 0, col: 0, span: 12 },
      properties: {
        entityName: 'users',
        title: 'Users',
        pagination: true,
        pageSize: 20
      }
    }
  ]
}

const mockFormDefinition = {
  layout: 'vertical' as const,
  submitText: 'Save',
  cancelText: 'Cancel',
  fields: [
    {
      id: 'field-1',
      name: 'name',
      label: 'Name',
      type: 'text' as const,
      required: true,
      validation: { minLength: 2 }
    },
    {
      id: 'field-2', 
      name: 'email',
      label: 'Email',
      type: 'text' as const,
      required: true,
      validation: { pattern: '^[^@]+@[^@]+\.[^@]+$' }
    },
    {
      id: 'field-3',
      name: 'age',
      label: 'Age',
      type: 'number' as const,
      required: false,
      uiConfig: {
        showIf: { field: 'type', operator: 'equals', value: 'person' }
      }
    }
  ],
  validation: {
    validateOnBlur: true,
    validateOnChange: false
  }
}

const mockEntityData = [
  { id: '1', name: 'John Doe', email: 'john@example.com', age: 30 },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', age: 25 },
  { id: '3', name: 'Bob Wilson', email: 'bob@example.com', age: 35 }
]

// Helper to create JSON-RPC response
function createJsonRpcResponse<T>(id: string | number, result: T): JsonRpcResponse<T> {
  return {
    jsonrpc: '2.0',
    id,
    result
  }
}

function createJsonRpcError(id: string | number, code: number, message: string, data?: any): JsonRpcResponse {
  return {
    jsonrpc: '2.0',
    id,
    error: { code, message, data }
  }
}

export const handlers = [
  // JSON-RPC endpoint
  http.post('http://localhost:8081/jsonrpc', async ({ request }) => {
    const body = await request.json() as JsonRpcRequest

    switch (body.method) {
      case 'loadPage':
        const loadPageResponse: LoadPageResponse = {
          modelId: body.params?.modelId || 'test-model-1',
          pageName: body.params?.pageName || 'main',
          layout: mockPageLayout,
          metadata: {
            modelName: 'Test Model',
            modelVersion: '1.0.0',
            loadedAt: new Date().toISOString()
          }
        }
        return HttpResponse.json(createJsonRpcResponse(body.id, loadPageResponse))

      case 'loadEntityData':
        const page = body.params?.page || 1
        const limit = body.params?.limit || 20
        const startIndex = (page - 1) * limit
        const endIndex = startIndex + limit
        const paginatedData = mockEntityData.slice(startIndex, endIndex)

        const loadEntityResponse: LoadEntityDataResponse = {
          modelId: body.params?.modelId || 'test-model-1',
          entityName: body.params?.entityName || 'users',
          data: paginatedData,
          pagination: {
            page,
            limit,
            total: mockEntityData.length,
            hasMore: endIndex < mockEntityData.length
          },
          columns: [
            { key: 'name', title: 'Name', dataType: 'string', sortable: true, filterable: true, width: 200 },
            { key: 'email', title: 'Email', dataType: 'string', sortable: true, filterable: true, width: 250 },
            { key: 'age', title: 'Age', dataType: 'number', sortable: true, filterable: true, width: 100 }
          ]
        }
        return HttpResponse.json(createJsonRpcResponse(body.id, loadEntityResponse))

      case 'getFormDefinition':
        const formResponse: GetFormDefinitionResponse = {
          modelId: body.params?.modelId || 'test-model-1',
          entityName: body.params?.entityName || 'users',
          form: mockFormDefinition
        }
        return HttpResponse.json(createJsonRpcResponse(body.id, formResponse))

      case 'createEntity':
        const newEntity = {
          ...body.params?.data,
          id: `new-${Date.now()}`
        }
        const createResponse: CreateEntityResponse = {
          id: newEntity.id,
          modelId: body.params?.modelId || 'test-model-1',
          entityName: body.params?.entityName || 'users',
          data: newEntity,
          createdAt: new Date().toISOString()
        }
        return HttpResponse.json(createJsonRpcResponse(body.id, createResponse))

      case 'updateEntity':
        const updateResponse: UpdateEntityResponse = {
          id: body.params?.entityId || '1',
          data: body.params?.data,
          updatedAt: new Date().toISOString()
        }
        return HttpResponse.json(createJsonRpcResponse(body.id, updateResponse))

      case 'deleteEntity':
        const deleteResponse: DeleteEntityResponse = {
          id: body.params?.entityId || '1',
          deleted: true,
          deletedAt: new Date().toISOString()
        }
        return HttpResponse.json(createJsonRpcResponse(body.id, deleteResponse))

      case 'bulkImport':
        const importResult: ImportResult = {
          success: true,
          totalRows: body.params?.data?.length || 0,
          successCount: body.params?.data?.length || 0,
          errorCount: 0,
          duplicateCount: 0,
          errors: [],
          createdIds: body.params?.data?.map((_: any, index: number) => `import-${index}`) || []
        }
        return HttpResponse.json(createJsonRpcResponse(body.id, importResult))

      case 'getCapabilities':
        const capabilitiesResponse: CapabilitiesResponse = {
          version: '1.0.0',
          apiVersion: '2.0',
          features: ['forms', 'datagrids', 'import', 'export'],
          supportedComponents: ['DataGrid', 'TorqueForm', 'TorqueButton', 'Text', 'Container', 'Modal'],
          supportedLayouts: ['grid', 'flex', 'absolute']
        }
        return HttpResponse.json(createJsonRpcResponse(body.id, capabilitiesResponse))

      default:
        return HttpResponse.json(createJsonRpcError(body.id, -32601, `Method not found: ${body.method}`))
    }
  }),

  // Network error simulation for retry logic tests
  http.post('http://localhost:8081/jsonrpc-error', () => {
    return HttpResponse.error()
  }),

  // Slow response simulation for timeout tests
  http.post('http://localhost:8081/jsonrpc-slow', async () => {
    await new Promise(resolve => setTimeout(resolve, 5000))
    return HttpResponse.json(createJsonRpcResponse(1, { success: true }))
  })
]

export const server = setupServer(...handlers)