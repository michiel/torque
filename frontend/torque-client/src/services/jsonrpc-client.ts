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
  private pendingRequests: Map<string, Promise<any>> = new Map()

  constructor(baseUrl: string = 'http://localhost:8081') {
    this.baseUrl = baseUrl
  }

  private generateId(): number {
    return this.requestId++
  }

  async call<T = any>(method: string, params?: Record<string, any>): Promise<T> {
    console.log('[JsonRpcClient] Starting call:', { method, params, baseUrl: this.baseUrl });
    
    // Create a cache key for request deduplication
    const cacheKey = `${method}:${JSON.stringify(params || {})}`
    
    // Check if an identical request is already pending
    const pendingRequest = this.pendingRequests.get(cacheKey)
    if (pendingRequest) {
      console.log('[JsonRpcClient] Using cached pending request for:', method);
      return pendingRequest as Promise<T>
    }

    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      method,
      params,
      id: this.generateId()
    }

    console.log('[JsonRpcClient] Created request:', request);

    // Create the request promise and store it for deduplication
    const requestPromise = this.makeRequest<T>(request)
    this.pendingRequests.set(cacheKey, requestPromise)
    
    try {
      const result = await requestPromise
      console.log('[JsonRpcClient] Call completed successfully:', { method, resultType: typeof result });
      return result
    } catch (error) {
      console.error('[JsonRpcClient] Call failed:', { method, error });
      throw error;
    } finally {
      // Clean up pending request after completion
      this.pendingRequests.delete(cacheKey)
    }
  }

  private async makeRequest<T>(request: JsonRpcRequest): Promise<T> {
    const url = `${this.baseUrl}/rpc`;
    console.log('[JsonRpcClient] Making HTTP request to:', url);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      })

      console.log('[JsonRpcClient] HTTP response received:', { 
        status: response.status, 
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const jsonResponse: JsonRpcResponse<T> = await response.json()
      console.log('[JsonRpcClient] JSON-RPC response parsed:', {
        hasResult: jsonResponse.result !== undefined,
        hasError: !!jsonResponse.error,
        id: jsonResponse.id
      });

      if (jsonResponse.error) {
        console.error('[JsonRpcClient] JSON-RPC error in response:', jsonResponse.error);
        throw new JsonRpcClientError(jsonResponse.error)
      }

      if (jsonResponse.result === undefined) {
        console.error('[JsonRpcClient] Invalid JSON-RPC response: missing result');
        throw new Error('Invalid JSON-RPC response: missing result')
      }

      return jsonResponse.result
    } catch (error) {
      console.error('[JsonRpcClient] Request failed:', error);
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