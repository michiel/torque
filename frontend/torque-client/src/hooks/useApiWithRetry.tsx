import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Alert, Group, Text } from '@mantine/core'
import { useJsonRpcMutation } from './useJsonRpc'

interface RetryOptions {
  maxAttempts: number
  initialDelay: number
  maxDelay: number
  backoffFactor: number
  retryOn: (error: any) => boolean
}

interface ApiCallState<T> {
  data: T | null
  loading: boolean
  error: any
  attempt: number
  isRetrying: boolean
}

const defaultRetryOptions: RetryOptions = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryOn: (error) => {
    // Retry on network errors, server errors (5xx), and timeouts
    if (!error) return false
    
    const shouldRetry = 
      error.code === 'NETWORK_ERROR' ||
      error.code === 'TIMEOUT_ERROR' ||
      (error.code >= 500 && error.code < 600) ||
      error.message?.includes('fetch')
    
    return shouldRetry
  }
}

export function useApiWithRetry<T = any>(options: Partial<RetryOptions> = {}) {
  const config = { ...defaultRetryOptions, ...options }
  const { mutate } = useJsonRpcMutation<T>()
  const [state, setState] = useState<ApiCallState<T>>({
    data: null,
    loading: false,
    error: null,
    attempt: 0,
    isRetrying: false
  })
  
  const timeoutRef = useRef<NodeJS.Timeout>()
  const abortControllerRef = useRef<AbortController>()

  const calculateDelay = useCallback((attempt: number) => {
    const delay = Math.min(
      config.initialDelay * Math.pow(config.backoffFactor, attempt),
      config.maxDelay
    )
    // Add jitter to prevent thundering herd
    return delay + Math.random() * 1000
  }, [config.initialDelay, config.maxDelay, config.backoffFactor])

  const executeWithRetry = useCallback(async (
    method: string,
    params?: any,
    customOptions?: Partial<RetryOptions>
  ): Promise<T> => {
    const effectiveConfig = { ...config, ...customOptions }
    let lastError: any
    
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    abortControllerRef.current = new AbortController()
    
    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      attempt: 0,
      isRetrying: false
    }))

    for (let attempt = 0; attempt < effectiveConfig.maxAttempts; attempt++) {
      try {
        setState(prev => ({
          ...prev,
          attempt: attempt + 1,
          isRetrying: attempt > 0
        }))

        // Check if operation was aborted
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error('Operation was cancelled')
        }

        const result = await mutate(method, params)
        
        // Success!
        setState(prev => ({
          ...prev,
          data: result,
          loading: false,
          error: null,
          isRetrying: false
        }))
        
        return result
        
      } catch (error) {
        lastError = error
        
        console.warn(`API call attempt ${attempt + 1} failed:`, error)
        
        // Check if we should retry this error
        const shouldRetry = effectiveConfig.retryOn(error)
        const isLastAttempt = attempt === effectiveConfig.maxAttempts - 1
        
        if (!shouldRetry || isLastAttempt) {
          // Don't retry or this was the last attempt
          setState(prev => ({
            ...prev,
            loading: false,
            error,
            isRetrying: false
          }))
          throw error
        }
        
        // Wait before retry
        const delay = calculateDelay(attempt)
        console.log(`Retrying in ${delay}ms...`)
        
        await new Promise<void>((resolve, reject) => {
          timeoutRef.current = setTimeout(() => {
            if (abortControllerRef.current?.signal.aborted) {
              reject(new Error('Operation was cancelled'))
            } else {
              resolve()
            }
          }, delay)
        })
      }
    }
    
    throw lastError
  }, [config, mutate, calculateDelay])

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setState(prev => ({
      ...prev,
      loading: false,
      isRetrying: false
    }))
  }, [])

  const retry = useCallback(() => {
    // This would re-run the last operation
    // You'd need to store the last method and params to implement this
    console.log('Manual retry requested')
  }, [])

  const reset = useCallback(() => {
    cancel()
    setState({
      data: null,
      loading: false,
      error: null,
      attempt: 0,
      isRetrying: false
    })
  }, [cancel])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancel()
    }
  }, [cancel])

  return {
    ...state,
    executeWithRetry,
    cancel,
    retry,
    reset,
    isRetryable: state.error ? config.retryOn(state.error) : false
  }
}

// Hook for connection status monitoring
export function useConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [lastOnlineTime, setLastOnlineTime] = useState<Date | null>(null)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setLastOnlineTime(new Date())
    }
    
    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return {
    isOnline,
    isOffline: !isOnline,
    lastOnlineTime
  }
}

// Connection status component
export function ConnectionStatus() {
  const { isOnline, lastOnlineTime } = useConnectionStatus()
  
  if (isOnline) {
    return null // Don't show anything when online
  }
  
  return (
    <Alert color="red" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
      <Group gap="sm">
        <Text size="sm">
          You are currently offline. Some features may not work properly.
        </Text>
        {lastOnlineTime && (
          <Text size="xs" c="dimmed">
            Last online: {lastOnlineTime.toLocaleTimeString()}
          </Text>
        )}
      </Group>
    </Alert>
  )
}