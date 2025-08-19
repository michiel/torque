import '@testing-library/jest-dom'
import { beforeAll, afterEach, afterAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { server } from './mocks/server'
import { mockUseLoadEntityData, mockUseJsonRpcMutation, mockUseFormDefinition } from './mocks/hooks'

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
})

// Mock FileReader for import tests
global.FileReader = class {
  readAsText = (file: File) => {
    this.onload?.({ target: { result: 'name,email\nJohn Doe,john@example.com' } } as any)
  }
  readAsArrayBuffer = (file: File) => {
    this.onload?.({ target: { result: new ArrayBuffer(8) } } as any)
  }
  onload: ((event: any) => void) | null = null
  onerror: ((event: any) => void) | null = null
}

// Mock URL.createObjectURL for export tests
global.URL.createObjectURL = () => 'mock-url'
global.URL.revokeObjectURL = () => {}

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: async (text: string) => Promise.resolve(),
  },
})

// Mock JSON-RPC hooks
vi.mock('../hooks/useJsonRpc', () => ({
  useLoadEntityData: mockUseLoadEntityData,
  useJsonRpcMutation: mockUseJsonRpcMutation,
  useFormDefinition: mockUseFormDefinition
}))

// Setup MSW
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  cleanup()
})
afterAll(() => server.close())