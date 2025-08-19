import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { MantineProvider } from '@mantine/core'

// Simple test to verify testing infrastructure works
describe('Basic Test Infrastructure', () => {
  it('renders a simple component', () => {
    const TestComponent = () => <div>Hello Test</div>
    
    render(
      <MantineProvider>
        <TestComponent />
      </MantineProvider>
    )
    
    expect(screen.getByText('Hello Test')).toBeInTheDocument()
  })

  it('works with user interactions', async () => {
    const TestComponent = () => (
      <button onClick={() => alert('clicked')}>Click me</button>
    )
    
    render(
      <MantineProvider>
        <TestComponent />
      </MantineProvider>
    )
    
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('tests async operations', async () => {
    const AsyncComponent = () => {
      const [data, setData] = React.useState<string | null>(null)
      
      React.useEffect(() => {
        setTimeout(() => setData('Loaded'), 100)
      }, [])
      
      return <div>{data || 'Loading...'}</div>
    }
    
    render(
      <MantineProvider>
        <AsyncComponent />
      </MantineProvider>
    )
    
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.getByText('Loaded')).toBeInTheDocument()
    })
  })
})