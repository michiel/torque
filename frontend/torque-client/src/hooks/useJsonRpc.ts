import { useState, useEffect, useCallback, useMemo } from 'react'
import { jsonRpcClient } from '../services/jsonrpc-client'

interface UseJsonRpcState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useJsonRpc<T = any>(
  method: string,
  params?: Record<string, any>,
  dependencies: any[] = []
): UseJsonRpcState<T> & { refetch: () => Promise<void> } {
  const [state, setState] = useState<UseJsonRpcState<T>>({
    data: null,
    loading: false,
    error: null
  })

  // Memoize params to prevent infinite re-renders when object references change
  const stableParams = useMemo(() => params, [JSON.stringify(params)])
  
  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const result = await jsonRpcClient.call<T>(method, stableParams)
      setState({ data: result, loading: false, error: null })
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }, [method, stableParams])

  useEffect(() => {
    fetchData()
  }, [fetchData, ...dependencies])

  return {
    ...state,
    refetch: fetchData
  }
}

// Specific hooks for common TorqueApp operations
export function useLoadPage(modelId: string, pageName?: string) {
  const params = useMemo(() => ({ modelId, pageName }), [modelId, pageName])
  return useJsonRpc('loadPage', params, [modelId, pageName])
}

export function useLoadEntityData(
  modelId: string,
  entityName: string,
  page: number = 1,
  limit: number = 20
) {
  const params = useMemo(() => ({ modelId, entityName, page, limit }), [modelId, entityName, page, limit])
  return useJsonRpc(
    'loadEntityData',
    params,
    [modelId, entityName, page, limit]
  )
}

export function useFormDefinition(modelId: string, entityName: string) {
  const params = useMemo(() => ({ modelId, entityName }), [modelId, entityName])
  return useJsonRpc('getFormDefinition', params, [modelId, entityName])
}

export function useModelMetadata(modelId: string) {
  const params = useMemo(() => ({ modelId }), [modelId])
  return useJsonRpc('getModelMetadata', params, [modelId])
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