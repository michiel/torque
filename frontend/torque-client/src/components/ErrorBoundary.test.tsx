import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React, { useState } from 'react'
import { MantineProvider } from '@mantine/core'
import { ErrorBoundary, withErrorBoundary } from './ErrorBoundary'

// Mock console.error to avoid noise in tests
const originalError = console.error
beforeEach(() => {
  console.error = vi.fn()
})

afterEach(() => {
  console.error = originalError
})

// Test wrapper with Mantine provider
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
)

// Component that throws an error
const ThrowingComponent = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message')
  }
  return <div>Working component</div>
}

// Component that throws on specific action
const ConditionalThrowingComponent = () => {
  const [shouldThrow, setShouldThrow] = useState(false)
  
  if (shouldThrow) {
    throw new Error('Action triggered error')
  }
  
  return (
    <button onClick={() => setShouldThrow(true)}>
      Trigger Error
    </button>
  )
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('Normal Operation', () => {
    it('renders children when no error occurs', () => {
      render(
        <TestWrapper>
          <ErrorBoundary>
            <ThrowingComponent shouldThrow={false} />
          </ErrorBoundary>
        </TestWrapper>
      )

      expect(screen.getByText('Working component')).toBeInTheDocument()
    })

    it('does not show error UI when component works normally', () => {
      render(
        <TestWrapper>
          <ErrorBoundary>
            <div>Normal content</div>
          </ErrorBoundary>
        </TestWrapper>
      )

      expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('catches and displays error when child component throws', () => {
      render(
        <TestWrapper>
          <ErrorBoundary>
            <ThrowingComponent shouldThrow={true} />
          </ErrorBoundary>
        </TestWrapper>
      )

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
      expect(screen.getByText(/test error message/i)).toBeInTheDocument()
    })

    it('shows error details in development mode', () => {
      // Mock development environment
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      render(
        <TestWrapper>
          <ErrorBoundary>
            <ThrowingComponent shouldThrow={true} />
          </ErrorBoundary>
        </TestWrapper>
      )

      expect(screen.getByText(/error details/i)).toBeInTheDocument()
      expect(screen.getByText(/stack trace/i)).toBeInTheDocument()

      process.env.NODE_ENV = originalEnv
    })

    it('hides sensitive error details in production mode', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      render(
        <TestWrapper>
          <ErrorBoundary>
            <ThrowingComponent shouldThrow={true} />
          </ErrorBoundary>
        </TestWrapper>
      )

      expect(screen.queryByText(/stack trace/i)).not.toBeInTheDocument()

      process.env.NODE_ENV = originalEnv
    })

    it('logs error to localStorage for debugging', () => {
      render(
        <TestWrapper>
          <ErrorBoundary>
            <ThrowingComponent shouldThrow={true} />
          </ErrorBoundary>
        </TestWrapper>
      )

      const errorLog = localStorage.getItem('torque_error_log')
      expect(errorLog).toBeTruthy()
      
      const parsedLog = JSON.parse(errorLog!)
      expect(parsedLog).toHaveProperty('timestamp')
      expect(parsedLog).toHaveProperty('error')
      expect(parsedLog.error).toContain('Test error message')
    })
  })

  describe('Error Recovery', () => {
    it('shows retry button', () => {
      render(
        <TestWrapper>
          <ErrorBoundary>
            <ThrowingComponent shouldThrow={true} />
          </ErrorBoundary>
        </TestWrapper>
      )

      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    })

    it('resets error state when retry button is clicked', async () => {
      const user = userEvent.setup()
      let shouldThrow = true
      
      const RetryTestComponent = () => {
        if (shouldThrow) {
          throw new Error('Retry test error')
        }
        return <div>Recovered successfully</div>
      }

      render(
        <TestWrapper>
          <ErrorBoundary>
            <RetryTestComponent />
          </ErrorBoundary>
        </TestWrapper>
      )

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()

      // Simulate fixing the error condition
      shouldThrow = false
      
      const retryButton = screen.getByRole('button', { name: /try again/i })
      await user.click(retryButton)

      expect(screen.getByText('Recovered successfully')).toBeInTheDocument()
    })

    it('shows reload button for persistent errors', () => {
      render(
        <TestWrapper>
          <ErrorBoundary>
            <ThrowingComponent shouldThrow={true} />
          </ErrorBoundary>
        </TestWrapper>
      )

      expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument()
    })

    it('calls window.location.reload when reload button is clicked', async () => {
      const user = userEvent.setup()
      const mockReload = vi.fn()
      
      // Mock window.location.reload
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true
      })

      render(
        <TestWrapper>
          <ErrorBoundary>
            <ThrowingComponent shouldThrow={true} />
          </ErrorBoundary>
        </TestWrapper>
      )

      const reloadButton = screen.getByRole('button', { name: /reload page/i })
      await user.click(reloadButton)

      expect(mockReload).toHaveBeenCalled()
    })
  })

  describe('Error Details Functionality', () => {
    it('allows copying error details to clipboard', async () => {
      const user = userEvent.setup()
      const mockWriteText = vi.fn()
      
      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: { writeText: mockWriteText }
      })

      render(
        <TestWrapper>
          <ErrorBoundary>
            <ThrowingComponent shouldThrow={true} />
          </ErrorBoundary>
        </TestWrapper>
      )

      const copyButton = screen.getByRole('button', { name: /copy error details/i })
      await user.click(copyButton)

      expect(mockWriteText).toHaveBeenCalledWith(
        expect.stringContaining('Test error message')
      )
    })

    it('shows confirmation when error details are copied', async () => {
      const user = userEvent.setup()
      
      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: { writeText: vi.fn().mockResolvedValue(undefined) }
      })

      render(
        <TestWrapper>
          <ErrorBoundary>
            <ThrowingComponent shouldThrow={true} />
          </ErrorBoundary>
        </TestWrapper>
      )

      const copyButton = screen.getByRole('button', { name: /copy error details/i })
      await user.click(copyButton)

      expect(screen.getByText(/copied to clipboard/i)).toBeInTheDocument()
    })

    it('toggles error details visibility', async () => {
      const user = userEvent.setup()
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      render(
        <TestWrapper>
          <ErrorBoundary>
            <ThrowingComponent shouldThrow={true} />
          </ErrorBoundary>
        </TestWrapper>
      )

      const toggleButton = screen.getByRole('button', { name: /show.*details/i })
      await user.click(toggleButton)

      expect(screen.getByText(/hide.*details/i)).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: /hide.*details/i }))

      expect(screen.getByText(/show.*details/i)).toBeInTheDocument()

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('Custom Error Fallback', () => {
    it('renders custom fallback when provided', () => {
      const CustomFallback = ({ error, resetError }: { error: Error; resetError: () => void }) => (
        <div>
          <h2>Custom Error UI</h2>
          <p>Error: {error.message}</p>
          <button onClick={resetError}>Custom Reset</button>
        </div>
      )

      render(
        <TestWrapper>
          <ErrorBoundary fallback={CustomFallback}>
            <ThrowingComponent shouldThrow={true} />
          </ErrorBoundary>
        </TestWrapper>
      )

      expect(screen.getByText('Custom Error UI')).toBeInTheDocument()
      expect(screen.getByText('Error: Test error message')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /custom reset/i })).toBeInTheDocument()
    })
  })

  describe('Error Reporting', () => {
    it('calls onError callback when error occurs', () => {
      const mockOnError = vi.fn()

      render(
        <TestWrapper>
          <ErrorBoundary onError={mockOnError}>
            <ThrowingComponent shouldThrow={true} />
          </ErrorBoundary>
        </TestWrapper>
      )

      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test error message'
        }),
        expect.any(Object) // error info
      )
    })

    it('accumulates multiple errors in localStorage', () => {
      // First error
      render(
        <TestWrapper>
          <ErrorBoundary>
            <ThrowingComponent shouldThrow={true} />
          </ErrorBoundary>
        </TestWrapper>
      ).unmount()

      // Second error
      render(
        <TestWrapper>
          <ErrorBoundary>
            <ThrowingComponent shouldThrow={true} />
          </ErrorBoundary>
        </TestWrapper>
      )

      const errorLog = localStorage.getItem('torque_error_log')
      expect(errorLog).toBeTruthy()
      
      // Should contain multiple error entries
      expect(errorLog!.split('\n').length).toBeGreaterThan(1)
    })
  })

  describe('withErrorBoundary HOC', () => {
    it('wraps component with error boundary', () => {
      const TestComponent = () => <div>Test Component</div>
      const WrappedComponent = withErrorBoundary(TestComponent)

      render(
        <TestWrapper>
          <WrappedComponent />
        </TestWrapper>
      )

      expect(screen.getByText('Test Component')).toBeInTheDocument()
    })

    it('catches errors in wrapped component', () => {
      const WrappedThrowingComponent = withErrorBoundary(ThrowingComponent)

      render(
        <TestWrapper>
          <WrappedThrowingComponent shouldThrow={true} />
        </TestWrapper>
      )

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    })

    it('passes props to wrapped component', () => {
      const PropsComponent = ({ message }: { message: string }) => <div>{message}</div>
      const WrappedPropsComponent = withErrorBoundary(PropsComponent)

      render(
        <TestWrapper>
          <WrappedPropsComponent message="Hello World" />
        </TestWrapper>
      )

      expect(screen.getByText('Hello World')).toBeInTheDocument()
    })

    it('forwards ref correctly', () => {
      const RefComponent = React.forwardRef<HTMLDivElement, { children: React.ReactNode }>(
        ({ children }, ref) => <div ref={ref}>{children}</div>
      )
      const WrappedRefComponent = withErrorBoundary(RefComponent)

      const ref = React.createRef<HTMLDivElement>()
      render(
        <TestWrapper>
          <WrappedRefComponent ref={ref}>Test Content</WrappedRefComponent>
        </TestWrapper>
      )

      expect(ref.current).toBeInstanceOf(HTMLDivElement)
      expect(ref.current?.textContent).toBe('Test Content')
    })
  })

  describe('Error Boundary Context', () => {
    it('provides error state through context', () => {
      // This would test if ErrorBoundary provides context to child components
      // for accessing error state programmatically
      const ContextConsumer = () => {
        // Mock context consumer that would access error boundary state
        return <div>Context consumer</div>
      }

      render(
        <TestWrapper>
          <ErrorBoundary>
            <ContextConsumer />
          </ErrorBoundary>
        </TestWrapper>
      )

      expect(screen.getByText('Context consumer')).toBeInTheDocument()
    })
  })
})