import React from 'react'
import { Alert, Button, Stack, Text, Code, Group, ActionIcon, Tooltip } from '@mantine/core'
import { IconAlertCircle, IconRefresh, IconBug, IconCopy } from '@tabler/icons-react'

interface ErrorInfo {
  componentStack: string
  errorBoundary?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to console and external service
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Store error info in state
    this.setState({ errorInfo })
    
    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // In a real app, you might send error to logging service
    this.logErrorToService(error, errorInfo)
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // TODO: Send to error tracking service like Sentry
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      url: window.location.href
    }
    
    // For now, just store in localStorage for debugging
    const existingErrors = JSON.parse(localStorage.getItem('torque_errors') || '[]')
    existingErrors.push(errorData)
    
    // Keep only last 10 errors
    const recentErrors = existingErrors.slice(-10)
    localStorage.setItem('torque_errors', JSON.stringify(recentErrors))
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  private copyErrorToClipboard = () => {
    if (this.state.error) {
      const errorText = `Error: ${this.state.error.message}\n\nStack Trace:\n${this.state.error.stack}\n\nComponent Stack:\n${this.state.errorInfo?.componentStack}`
      navigator.clipboard.writeText(errorText)
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error} retry={this.handleRetry} />
      }

      // Default error UI
      return (
        <Stack gap="md" p="md">
          <Alert icon={<IconAlertCircle size={16} />} color="red" title="Something went wrong">
            <Stack gap="sm">
              <Text size="sm">
                An unexpected error occurred while rendering this component. 
                Please try refreshing or report this issue.
              </Text>
              
              <Group gap="xs">
                <Button
                  size="xs"
                  leftSection={<IconRefresh size={14} />}
                  onClick={this.handleRetry}
                >
                  Try Again
                </Button>
                
                <Tooltip label="Copy error details to clipboard">
                  <ActionIcon
                    size="sm"
                    variant="outline"
                    onClick={this.copyErrorToClipboard}
                  >
                    <IconCopy size={14} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Stack>
          </Alert>
          
          {/* Error details (expandable) */}
          <details>
            <summary style={{ cursor: 'pointer', fontSize: '0.875rem', color: '#868e96' }}>
              <Group gap="xs" style={{ display: 'inline-flex' }}>
                <IconBug size={14} />
                <span>Technical Details</span>
              </Group>
            </summary>
            
            <Stack gap="xs" mt="sm">
              <div>
                <Text size="xs" fw={500} c="red">Error Message:</Text>
                <Code block>{this.state.error.message}</Code>
              </div>
              
              {this.state.error.stack && (
                <div>
                  <Text size="xs" fw={500} c="red">Stack Trace:</Text>
                  <Code block style={{ fontSize: '0.75rem', maxHeight: '200px', overflow: 'auto' }}>
                    {this.state.error.stack}
                  </Code>
                </div>
              )}
              
              {this.state.errorInfo?.componentStack && (
                <div>
                  <Text size="xs" fw={500} c="red">Component Stack:</Text>
                  <Code block style={{ fontSize: '0.75rem', maxHeight: '200px', overflow: 'auto' }}>
                    {this.state.errorInfo.componentStack}
                  </Code>
                </div>
              )}
            </Stack>
          </details>
        </Stack>
      )
    }

    return this.props.children
  }
}

// Higher-order component for easy wrapping
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  return WrappedComponent
}

// Custom hook for error reporting
export function useErrorHandler() {
  const reportError = React.useCallback((error: Error, context?: string) => {
    console.error('Manual error report:', error, context)
    
    const errorData = {
      message: error.message,
      stack: error.stack,
      context: context || 'Unknown',
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      url: window.location.href
    }
    
    // Store in localStorage for debugging
    const existingErrors = JSON.parse(localStorage.getItem('torque_errors') || '[]')
    existingErrors.push(errorData)
    localStorage.setItem('torque_errors', JSON.stringify(existingErrors.slice(-10)))
    
    // In production, send to error tracking service
    // e.g., Sentry.captureException(error, { extra: { context } })
  }, [])
  
  return { reportError }
}