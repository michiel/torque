import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { jsonRpcClient, JsonRpcClient } from '../services/jsonrpc-client'

interface UseJsonRpcState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useJsonRpc<T = any>(
  method: string,
  params?: Record<string, any>,
  dependencies: any[] = [],
  client: JsonRpcClient = jsonRpcClient
): UseJsonRpcState<T> & { refetch: () => Promise<void> } {
  const [state, setState] = useState<UseJsonRpcState<T>>({
    data: null,
    loading: false,
    error: null
  })

  // Create stable params reference to prevent infinite loops
  const paramsStringRef = useRef<string | undefined>(undefined)
  const currentParamsString = params ? JSON.stringify(params) : 'undefined'
  
  const stableParams = useMemo(() => {
    if (paramsStringRef.current !== currentParamsString) {
      paramsStringRef.current = currentParamsString
      return params
    }
    return params
  }, [currentParamsString])
  
  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const result = await client.call<T>(method, stableParams)
      setState({ data: result, loading: false, error: null })
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }, [method, stableParams, client])

  // Only include dependencies if explicitly provided to avoid re-render loops
  useEffect(() => {
    fetchData()
  }, [fetchData, ...dependencies])

  return {
    ...state,
    refetch: fetchData
  }
}

// Specific hooks for common TorqueApp operations
export function useLoadPage(modelId: string, pageName?: string, apiBaseUrl?: string) {
  const params = useMemo(() => ({ modelId, pageName }), [modelId, pageName])
  const client = useMemo(() => apiBaseUrl ? new JsonRpcClient(apiBaseUrl) : jsonRpcClient, [apiBaseUrl])
  return useJsonRpc('loadPage', params, [], client)
}

export function useLoadEntityData(
  modelId: string,
  entityName: string,
  page: number = 1,
  limit: number = 20,
  apiBaseUrl?: string
) {
  const params = useMemo(() => ({ modelId, entityName, page, limit }), [modelId, entityName, page, limit])
  const client = useMemo(() => apiBaseUrl ? new JsonRpcClient(apiBaseUrl) : jsonRpcClient, [apiBaseUrl])
  return useJsonRpc('loadEntityData', params, [], client)
}

export function useFormDefinition(modelId: string, entityName: string) {
  const params = useMemo(() => ({ modelId, entityName }), [modelId, entityName])
  return useJsonRpc('getFormDefinition', params)
}

export function useModelMetadata(modelId: string) {
  const params = useMemo(() => ({ modelId }), [modelId])
  return useJsonRpc('getModelMetadata', params)
}

export function useCapabilities() {
  return useJsonRpc('getCapabilities', undefined, [])
}

// Mutation hook for create/update/delete operations
export function useJsonRpcMutation<T = any>() {
  const [state, setState] = useState<UseJsonRpcState<T>>({
    data: null,
    loading: false,
    error: null
  })

  const mutate = useCallback(async (method: string, params?: Record<string, any>) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const result = await jsonRpcClient.call<T>(method, params)
      setState({ data: result, loading: false, error: null })
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setState({
        data: null,
        loading: false,
        error: errorMessage
      })
      throw error
    }
  }, [])

  return {
    ...state,
    mutate
  }
}