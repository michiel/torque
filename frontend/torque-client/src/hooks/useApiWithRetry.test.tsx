import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useApiWithRetry, ConnectionStatus } from './useApiWithRetry'
import { render, screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock timers
vi.useFakeTimers()

describe('useApiWithRetry', () => {
  beforeEach(() => {
    mockFetch.mockClear()
    vi.clearAllTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  describe('Successful API Calls', () => {
    it('makes successful API call without retries', async () => {
      const mockResponse = { success: true, data: 'test' }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const { result } = renderHook(() => useApiWithRetry())

      let response: any
      act(() => {
        response = result.current.executeWithRetry(
          () => fetch('/api/test').then(r => r.json())
        )
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const data = await response
      expect(data).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('returns data immediately on successful first attempt', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })

      const { result } = renderHook(() => useApiWithRetry())

      let response: any
      await act(async () => {
        response = await result.current.executeWithRetry(
          () => fetch('/api/test').then(r => r.json())
        )
      })

      expect(response).toEqual({ success: true })
      expect(result.current.retryCount).toBe(0)
      expect(result.current.error).toBe(null)
    })
  })

  describe('Retry Logic', () => {
    it('retries failed requests with exponential backoff', async () => {
      // First 2 calls fail, 3rd succeeds
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true })
        })

      const { result } = renderHook(() => useApiWithRetry({
        maxRetries: 3,
        baseDelay: 100
      }))

      let response: any
      const promise = act(async () => {
        response = result.current.executeWithRetry(
          () => fetch('/api/test').then(r => r.json())
        )
      })

      // Fast-forward through retry delays
      await act(async () => {
        vi.advanceTimersByTime(100) // First retry after 100ms
      })

      await act(async () => {
        vi.advanceTimersByTime(200) // Second retry after 200ms (exponential backoff)
      })

      await promise
      const data = await response

      expect(data).toEqual({ success: true })
      expect(mockFetch).toHaveBeenCalledTimes(3)
      expect(result.current.retryCount).toBe(2) // 2 retries before success
    })

    it('uses exponential backoff for retry delays', async () => {
      const delays: number[] = []
      const startTime = Date.now()

      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })

      const { result } = renderHook(() => useApiWithRetry({
        maxRetries: 3,
        baseDelay: 100
      }))

      // Mock setTimeout to capture delays
      const originalSetTimeout = setTimeout
      vi.spyOn(global, 'setTimeout').mockImplementation((callback, delay) => {
        delays.push(delay as number)
        return originalSetTimeout(callback, 0) // Execute immediately for test
      })

      await act(async () => {
        await result.current.executeWithRetry(
          () => fetch('/api/test').then(r => r.json())
        )
      })

      // Check exponential backoff: 100ms, 200ms
      expect(delays).toEqual([100, 200])
    })

    it('stops retrying after max retries reached', async () => {
      mockFetch.mockRejectedValue(new Error('Persistent error'))

      const { result } = renderHook(() => useApiWithRetry({
        maxRetries: 2,
        baseDelay: 10
      }))

      let error: any
      await act(async () => {
        try {
          await result.current.executeWithRetry(
            () => fetch('/api/test')
          )
        } catch (e) {
          error = e
        }
      })

      expect(mockFetch).toHaveBeenCalledTimes(3) // Initial + 2 retries
      expect(result.current.retryCount).toBe(2)
      expect(error.message).toBe('Persistent error')
    })

    it('respects custom retry condition', async () => {
      // Mock 404 error (should not retry) and network error (should retry)
      mockFetch
        .mockResolvedValueOnce({ ok: false, status: 404 })
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })

      const { result } = renderHook(() => useApiWithRetry({
        shouldRetry: (error, response) => {
          if (response && response.status === 404) return false
          return true
        }
      }))

      // First call with 404 - should not retry
      await act(async () => {
        try {
          await result.current.executeWithRetry(
            () => fetch('/api/not-found')
          )
        } catch (e) {
          // Expected to fail without retries
        }
      })

      expect(result.current.retryCount).toBe(0)
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('Abort Functionality', () => {
    it('allows aborting ongoing requests', async () => {
      const abortError = new Error('Request aborted')
      abortError.name = 'AbortError'
      mockFetch.mockRejectedValue(abortError)

      const { result } = renderHook(() => useApiWithRetry())

      const abortController = new AbortController()
      
      act(() => {
        result.current.executeWithRetry(
          () => fetch('/api/test', { signal: abortController.signal })
        )
      })

      act(() => {
        abortController.abort()
      })

      await waitFor(() => {
        expect(result.current.error?.name).toBe('AbortError')
      })
    })

    it('stops retrying when request is aborted', async () => {
      let callCount = 0
      mockFetch.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return Promise.reject(new Error('Network error'))
        }
        const abortError = new Error('Request aborted')
        abortError.name = 'AbortError'
        return Promise.reject(abortError)
      })

      const { result } = renderHook(() => useApiWithRetry({
        maxRetries: 3,
        baseDelay: 100
      }))

      const abortController = new AbortController()
      
      let promise: Promise<any>
      act(() => {
        promise = result.current.executeWithRetry(
          () => fetch('/api/test', { signal: abortController.signal })
        )
      })

      // Let first call fail and retry start
      await act(async () => {
        vi.advanceTimersByTime(50)
      })

      // Abort during retry delay
      act(() => {
        abortController.abort()
      })

      await act(async () => {
        vi.advanceTimersByTime(100)
      })

      try {
        await promise
      } catch (e) {
        expect(e.name).toBe('AbortError')
      }

      // Should not have made additional retry attempts after abort
      expect(callCount).toBeLessThan(3)
    })
  })

  describe('Loading State', () => {
    it('tracks loading state correctly', async () => {
      let resolvePromise: (value: any) => void
      const pendingPromise = new Promise(resolve => {
        resolvePromise = resolve
      })

      mockFetch.mockReturnValue(pendingPromise)

      const { result } = renderHook(() => useApiWithRetry())

      expect(result.current.isLoading).toBe(false)

      act(() => {
        result.current.executeWithRetry(
          () => fetch('/api/test')
        )
      })

      expect(result.current.isLoading).toBe(true)

      await act(async () => {
        resolvePromise({ ok: true, json: () => Promise.resolve({}) })
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('resets loading state on error', async () => {
      mockFetch.mockRejectedValue(new Error('Test error'))

      const { result } = renderHook(() => useApiWithRetry({
        maxRetries: 0
      }))

      await act(async () => {
        try {
          await result.current.executeWithRetry(
            () => fetch('/api/test')
          )
        } catch (e) {
          // Expected error
        }
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeTruthy()
    })
  })

  describe('Error Handling', () => {
    it('tracks error state correctly', async () => {
      const testError = new Error('Test error')
      mockFetch.mockRejectedValue(testError)

      const { result } = renderHook(() => useApiWithRetry({
        maxRetries: 0
      }))

      await act(async () => {
        try {
          await result.current.executeWithRetry(
            () => fetch('/api/test')
          )
        } catch (e) {
          // Expected error
        }
      })

      expect(result.current.error).toBe(testError)
    })

    it('clears error state on successful retry', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })

      const { result } = renderHook(() => useApiWithRetry({
        maxRetries: 1,
        baseDelay: 10
      }))

      await act(async () => {
        await result.current.executeWithRetry(
          () => fetch('/api/test').then(r => r.json())
        )
      })

      expect(result.current.error).toBe(null)
    })
  })

  describe('Network Detection', () => {
    it('detects online/offline status', () => {
      // Mock navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      })

      const { result } = renderHook(() => useApiWithRetry())

      expect(result.current.isOnline).toBe(true)

      act(() => {
        Object.defineProperty(navigator, 'onLine', {
          value: false
        })
        // Simulate offline event
        window.dispatchEvent(new Event('offline'))
      })

      expect(result.current.isOnline).toBe(false)
    })

    it('pauses retries when offline', async () => {
      // Start online
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      })

      mockFetch.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useApiWithRetry({
        maxRetries: 3,
        baseDelay: 100
      }))

      let promise: Promise<any>
      act(() => {
        promise = result.current.executeWithRetry(
          () => fetch('/api/test')
        )
      })

      // Go offline after first failure
      act(() => {
        Object.defineProperty(navigator, 'onLine', { value: false })
        window.dispatchEvent(new Event('offline'))
      })

      await act(async () => {
        vi.advanceTimersByTime(200)
      })

      // Should pause retries while offline
      expect(mockFetch).toHaveBeenCalledTimes(1)

      // Come back online
      act(() => {
        Object.defineProperty(navigator, 'onLine', { value: true })
        window.dispatchEvent(new Event('online'))
      })

      // Mock success on next attempt
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })

      await act(async () => {
        vi.advanceTimersByTime(100)
      })

      const data = await promise
      expect(data).toBeDefined()
    })
  })

  describe('Configuration Options', () => {
    it('respects custom maxRetries', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useApiWithRetry({
        maxRetries: 1
      }))

      await act(async () => {
        try {
          await result.current.executeWithRetry(
            () => fetch('/api/test')
          )
        } catch (e) {
          // Expected error
        }
      })

      expect(mockFetch).toHaveBeenCalledTimes(2) // Initial + 1 retry
    })

    it('respects custom baseDelay', async () => {
      const delays: number[] = []
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })

      vi.spyOn(global, 'setTimeout').mockImplementation((callback, delay) => {
        delays.push(delay as number)
        return setTimeout(callback, 0)
      })

      const { result } = renderHook(() => useApiWithRetry({
        baseDelay: 500
      }))

      await act(async () => {
        await result.current.executeWithRetry(
          () => fetch('/api/test').then(r => r.json())
        )
      })

      expect(delays[0]).toBe(500)
    })
  })
})

describe('ConnectionStatus Component', () => {
  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <MantineProvider>{children}</MantineProvider>
  )

  beforeEach(() => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    })
  })

  it('shows online status when connected', () => {
    render(
      <TestWrapper>
        <ConnectionStatus />
      </TestWrapper>
    )

    expect(screen.getByText(/online/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/connected/i)).toBeInTheDocument()
  })

  it('shows offline status when disconnected', () => {
    Object.defineProperty(navigator, 'onLine', {
      value: false
    })

    render(
      <TestWrapper>
        <ConnectionStatus />
      </TestWrapper>
    )

    expect(screen.getByText(/offline/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/disconnected/i)).toBeInTheDocument()
  })

  it('updates status when connection changes', () => {
    const { rerender } = render(
      <TestWrapper>
        <ConnectionStatus />
      </TestWrapper>
    )

    expect(screen.getByText(/online/i)).toBeInTheDocument()

    // Simulate going offline
    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: false })
      window.dispatchEvent(new Event('offline'))
    })

    rerender(
      <TestWrapper>
        <ConnectionStatus />
      </TestWrapper>
    )

    expect(screen.getByText(/offline/i)).toBeInTheDocument()
  })

  it('can be hidden when always online', () => {
    render(
      <TestWrapper>
        <ConnectionStatus hideWhenOnline />
      </TestWrapper>
    )

    expect(screen.queryByText(/online/i)).not.toBeInTheDocument()
  })

  it('shows custom messages when provided', () => {
    render(
      <TestWrapper>
        <ConnectionStatus 
          onlineText="Connected to server"
          offlineText="No internet connection"
        />
      </TestWrapper>
    )

    expect(screen.getByText('Connected to server')).toBeInTheDocument()
  })
})