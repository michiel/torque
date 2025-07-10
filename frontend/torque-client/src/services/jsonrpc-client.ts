import type { JsonRpcRequest, JsonRpcResponse, JsonRpcError } from '../types/jsonrpc'

export class JsonRpcClientError extends Error {
  code: number
  data?: any

  constructor(error: JsonRpcError) {
    super(error.message)
    this.name = 'JsonRpcClientError'
    this.code = error.code
    this.data = error.data
  }
}

export class JsonRpcClient {
  private baseUrl: string
  private requestId: number = 1

  constructor(baseUrl: string = 'http://localhost:8080') {
    this.baseUrl = baseUrl
  }

  private generateId(): number {
    return this.requestId++
  }

  async call<T = any>(method: string, params?: Record<string, any>): Promise<T> {
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      method,
      params,
      id: this.generateId()
    }

    try {
      const response = await fetch(`${this.baseUrl}/rpc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const jsonResponse: JsonRpcResponse<T> = await response.json()

      if (jsonResponse.error) {
        throw new JsonRpcClientError(jsonResponse.error)
      }

      if (jsonResponse.result === undefined) {
        throw new Error('Invalid JSON-RPC response: missing result')
      }

      return jsonResponse.result
    } catch (error) {
      if (error instanceof JsonRpcClientError) {
        throw error
      }
      throw new Error(`JSON-RPC call failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Convenience methods for TorqueApp API calls
  async loadPage(modelId: string, pageName?: string) {
    return this.call('loadPage', { modelId, pageName })
  }

  async loadEntityData(modelId: string, entityName: string, page?: number, limit?: number) {
    return this.call('loadEntityData', { modelId, entityName, page, limit })
  }

  async getFormDefinition(modelId: string, entityName: string) {
    return this.call('getFormDefinition', { modelId, entityName })
  }

  async createEntity(modelId: string, entityName: string, data: Record<string, any>) {
    return this.call('createEntity', { modelId, entityName, data })
  }

  async updateEntity(entityId: string, data: Record<string, any>) {
    return this.call('updateEntity', { entityId, data })
  }

  async deleteEntity(entityId: string) {
    return this.call('deleteEntity', { entityId })
  }

  async getComponentConfig(componentType: string) {
    return this.call('getComponentConfig', { componentType })
  }

  async getLayoutConfig(layoutType: string) {
    return this.call('getLayoutConfig', { layoutType })
  }

  async getModelMetadata(modelId: string) {
    return this.call('getModelMetadata', { modelId })
  }

  async getCapabilities() {
    return this.call('getCapabilities')
  }

  async ping() {
    return this.call('ping')
  }
}

// Global client instance
export const jsonRpcClient = new JsonRpcClient()