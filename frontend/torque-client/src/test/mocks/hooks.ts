import { vi } from 'vitest'

// Mock implementations for JSON-RPC hooks
export const mockUseLoadEntityData = vi.fn().mockReturnValue({
  data: {
    data: [
      { id: '1', name: 'John Doe', email: 'john@example.com', age: 30 },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com', age: 25 }
    ],
    pagination: { page: 1, limit: 20, total: 2, hasMore: false },
    columns: [
      { key: 'name', title: 'Name', dataType: 'string', sortable: true, filterable: true, width: 200, editable: true },
      { key: 'email', title: 'Email', dataType: 'string', sortable: true, filterable: true, width: 250, editable: true },
      { key: 'age', title: 'Age', dataType: 'number', sortable: true, filterable: true, width: 100, editable: true }
    ]
  },
  loading: false,
  error: null,
  refetch: vi.fn()
})

export const mockUseJsonRpcMutation = vi.fn().mockReturnValue({
  mutate: vi.fn().mockResolvedValue({ id: 'test-id', success: true })
})

export const mockUseFormDefinition = vi.fn().mockReturnValue({
  data: {
    form: {
      layout: 'vertical',
      submitText: 'Save',
      cancelText: 'Cancel',
      fields: [
        { id: 'field-1', name: 'name', label: 'Name', type: 'text', required: true },
        { id: 'field-2', name: 'email', label: 'Email', type: 'text', required: true }
      ],
      validation: { validateOnBlur: true, validateOnChange: false }
    }
  }
})

// Export mock functions for manual control in tests
export const resetMocks = () => {
  mockUseLoadEntityData.mockClear()
  mockUseJsonRpcMutation.mockClear()
  mockUseFormDefinition.mockClear()
}