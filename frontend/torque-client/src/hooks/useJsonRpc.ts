import { useState, useEffect, useCallback } from 'react'
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

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const result = await jsonRpcClient.call<T>(method, params)
      setState({ data: result, loading: false, error: null })
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }, [method, JSON.stringify(params)])

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
  return useJsonRpc('loadPage', { modelId, pageName }, [modelId, pageName])
}

export function useLoadEntityData(
  modelId: string,
  entityName: string,
  page: number = 1,
  limit: number = 20
) {
  return useJsonRpc(
    'loadEntityData',
    { modelId, entityName, page, limit },
    [modelId, entityName, page, limit]
  )
}

export function useFormDefinition(modelId: string, entityName: string) {
  return useJsonRpc('getFormDefinition', { modelId, entityName }, [modelId, entityName])
}

export function useModelMetadata(modelId: string) {
  return useJsonRpc('getModelMetadata', { modelId }, [modelId])
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