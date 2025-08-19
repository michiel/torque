import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'
import { DataGrid } from './DataGrid'
import type { DataGridColumn, DataGridFilter, DataGridSort } from '../../types/jsonrpc'

// Test wrapper with Mantine provider
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
)

const mockColumns: DataGridColumn[] = [
  {
    key: 'id',
    title: 'ID',
    dataType: 'string',
    sortable: true,
    filterable: false,
    width: 80
  },
  {
    key: 'name',
    title: 'Name',
    dataType: 'string',
    sortable: true,
    filterable: true,
    width: 200,
    editable: true
  },
  {
    key: 'email',
    title: 'Email',
    dataType: 'string',
    sortable: true,
    filterable: true,
    width: 250,
    editable: true
  },
  {
    key: 'age',
    title: 'Age',
    dataType: 'number',
    sortable: true,
    filterable: true,
    width: 100,
    editable: true
  },
  {
    key: 'active',
    title: 'Active',
    dataType: 'boolean',
    sortable: true,
    filterable: true,
    width: 100,
    editable: true
  },
  {
    key: 'created_at',
    title: 'Created At',
    dataType: 'date',
    sortable: true,
    filterable: true,
    width: 150
  }
]

const mockData = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
    active: true,
    created_at: '2023-01-15T10:00:00Z'
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    age: 25,
    active: false,
    created_at: '2023-02-20T14:30:00Z'
  },
  {
    id: '3',
    name: 'Bob Wilson',
    email: 'bob@example.com',
    age: 35,
    active: true,
    created_at: '2023-03-10T09:15:00Z'
  }
]

const renderDataGrid = (props: Partial<React.ComponentProps<typeof DataGrid>> = {}) => {
  const defaultProps = {
    id: 'test-datagrid',
    modelId: 'test-model',
    entityName: 'users',
    columns: mockColumns,
    features: ['edit', 'delete', 'import'],
    pageSize: 20,
    onAction: vi.fn()
  }

  return render(
    <TestWrapper>
      <DataGrid {...defaultProps} {...props} />
    </TestWrapper>
  )
}

describe('DataGrid', () => {
  let mockOnDataChange: ReturnType<typeof vi.fn>
  let mockOnFilterChange: ReturnType<typeof vi.fn>
  let mockOnSortChange: ReturnType<typeof vi.fn>
  let mockOnPageChange: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockOnDataChange = vi.fn()
    mockOnFilterChange = vi.fn()
    mockOnSortChange = vi.fn()
    mockOnPageChange = vi.fn()
  })

  describe('Basic Rendering', () => {
    it('renders table with correct columns', () => {
      renderDataGrid()

      expect(screen.getByText('ID')).toBeInTheDocument()
      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Email')).toBeInTheDocument()
      expect(screen.getByText('Age')).toBeInTheDocument()
      expect(screen.getByText('Active')).toBeInTheDocument()
      expect(screen.getByText('Created At')).toBeInTheDocument()
    })

    it('renders data rows correctly', () => {
      renderDataGrid()

      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('john@example.com')).toBeInTheDocument()
      expect(screen.getByText('30')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument()
    })

    it('renders boolean values as Yes/No', () => {
      renderDataGrid()

      const activeColumns = screen.getAllByText(/Yes|No/)
      expect(activeColumns.length).toBeGreaterThan(0)
    })

    it('formats date values correctly', () => {
      renderDataGrid()

      // Check that dates are formatted (not raw ISO strings)
      expect(screen.queryByText('2023-01-15T10:00:00Z')).not.toBeInTheDocument()
      // Should contain formatted date
      expect(screen.getByText(/Jan|January/)).toBeInTheDocument()
    })
  })

  describe('Sorting', () => {
    it('shows sort indicators on sortable columns', () => {
      renderDataGrid()

      const nameHeader = screen.getByText('Name').closest('th')
      expect(nameHeader).toHaveClass('sortable')
    })

    it('calls onSortChange when column header is clicked', async () => {
      const user = userEvent.setup()
      renderDataGrid({
        onSortChange: mockOnSortChange
      })

      const nameHeader = screen.getByText('Name')
      await user.click(nameHeader)

      expect(mockOnSortChange).toHaveBeenCalledWith({
        field: 'name',
        direction: 'asc'
      })
    })

    it('toggles sort direction on repeated clicks', async () => {
      const user = userEvent.setup()
      renderDataGrid({
        onSortChange: mockOnSortChange,
        sort: { field: 'name', direction: 'asc' }
      })

      const nameHeader = screen.getByText('Name')
      await user.click(nameHeader)

      expect(mockOnSortChange).toHaveBeenCalledWith({
        field: 'name',
        direction: 'desc'
      })
    })

    it('does not allow sorting on non-sortable columns', async () => {
      const user = userEvent.setup()
      const nonSortableColumns = mockColumns.map(col => ({
        ...col,
        sortable: col.key === 'id' ? false : col.sortable
      }))

      renderDataGrid({
        columns: nonSortableColumns,
        onSortChange: mockOnSortChange
      })

      const idHeader = screen.getByText('ID')
      await user.click(idHeader)

      expect(mockOnSortChange).not.toHaveBeenCalled()
    })
  })

  describe('Filtering', () => {
    it('shows filter controls for filterable columns', () => {
      renderDataGrid({ showFilters: true })

      // Should have filter inputs for filterable columns
      const filterInputs = screen.getAllByPlaceholderText(/filter/i)
      expect(filterInputs.length).toBeGreaterThan(0)
    })

    it('calls onFilterChange when filter value changes', async () => {
      const user = userEvent.setup()
      renderDataGrid({
        showFilters: true,
        onFilterChange: mockOnFilterChange
      })

      const nameFilter = screen.getByPlaceholderText(/filter.*name/i)
      await user.type(nameFilter, 'John')

      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'name',
              operator: 'contains',
              value: 'John'
            })
          ])
        )
      })
    })

    it('renders different filter types for different data types', () => {
      renderDataGrid({ showFilters: true })

      // String filters should be text inputs
      const nameFilter = screen.getByPlaceholderText(/filter.*name/i)
      expect(nameFilter).toHaveAttribute('type', 'text')

      // Number filters should be number inputs
      const ageFilter = screen.getByPlaceholderText(/filter.*age/i)
      expect(ageFilter).toHaveAttribute('type', 'number')

      // Boolean filters should be selects
      const activeFilter = screen.getByLabelText(/filter.*active/i)
      expect(activeFilter.tagName).toBe('SELECT')
    })

    it('clears filters when clear button is clicked', async () => {
      const user = userEvent.setup()
      renderDataGrid({
        showFilters: true,
        filters: [{ field: 'name', operator: 'contains', value: 'John' }],
        onFilterChange: mockOnFilterChange
      })

      const clearButton = screen.getByRole('button', { name: /clear filters/i })
      await user.click(clearButton)

      expect(mockOnFilterChange).toHaveBeenCalledWith([])
    })
  })

  describe('Inline Editing', () => {
    it('enters edit mode when editable cell is double-clicked', async () => {
      const user = userEvent.setup()
      renderDataGrid({ enableInlineEdit: true })

      const nameCell = screen.getByText('John Doe')
      await user.dblClick(nameCell)

      // Should show input field for editing
      const editInput = screen.getByDisplayValue('John Doe')
      expect(editInput).toBeInTheDocument()
      expect(editInput.tagName).toBe('INPUT')
    })

    it('saves changes when Enter is pressed', async () => {
      const user = userEvent.setup()
      renderDataGrid({
        enableInlineEdit: true,
        onDataChange: mockOnDataChange
      })

      const nameCell = screen.getByText('John Doe')
      await user.dblClick(nameCell)

      const editInput = screen.getByDisplayValue('John Doe')
      await user.clear(editInput)
      await user.type(editInput, 'John Smith{Enter}')

      expect(mockOnDataChange).toHaveBeenCalledWith(
        '1',
        { name: 'John Smith' }
      )
    })

    it('cancels editing when Escape is pressed', async () => {
      const user = userEvent.setup()
      renderDataGrid({
        enableInlineEdit: true,
        onDataChange: mockOnDataChange
      })

      const nameCell = screen.getByText('John Doe')
      await user.dblClick(nameCell)

      const editInput = screen.getByDisplayValue('John Doe')
      await user.clear(editInput)
      await user.type(editInput, 'John Smith{Escape}')

      // Should revert to original value
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(mockOnDataChange).not.toHaveBeenCalled()
    })

    it('handles different data types in edit mode', async () => {
      const user = userEvent.setup()
      renderDataGrid({ enableInlineEdit: true })

      // Test number editing
      const ageCell = screen.getByText('30')
      await user.dblClick(ageCell)

      const ageInput = screen.getByDisplayValue('30')
      expect(ageInput).toHaveAttribute('type', 'number')

      // Test boolean editing
      const activeCell = screen.getByText('Yes')
      await user.dblClick(activeCell)

      const activeSelect = screen.getByDisplayValue('true')
      expect(activeSelect.tagName).toBe('SELECT')
    })

    it('does not allow editing on non-editable columns', async () => {
      const user = userEvent.setup()
      const nonEditableColumns = mockColumns.map(col => ({
        ...col,
        editable: col.key === 'id' ? false : col.editable
      }))

      renderDataGrid({
        columns: nonEditableColumns,
        enableInlineEdit: true
      })

      const idCell = screen.getByText('1')
      await user.dblClick(idCell)

      // Should not show edit input
      expect(screen.queryByDisplayValue('1')).not.toBeInTheDocument()
    })
  })

  describe('Pagination', () => {
    it('shows pagination controls when needed', () => {
      renderDataGrid({
        pagination: {
          page: 1,
          limit: 2,
          total: 10,
          hasMore: true
        }
      })

      expect(screen.getByText(/page/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
    })

    it('calls onPageChange when page is changed', async () => {
      const user = userEvent.setup()
      renderDataGrid({
        pagination: {
          page: 1,
          limit: 2,
          total: 10,
          hasMore: true
        },
        onPageChange: mockOnPageChange
      })

      const nextButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextButton)

      expect(mockOnPageChange).toHaveBeenCalledWith(2)
    })

    it('disables pagination controls appropriately', () => {
      renderDataGrid({
        pagination: {
          page: 1,
          limit: 10,
          total: 3,
          hasMore: false
        }
      })

      const prevButton = screen.getByRole('button', { name: /previous/i })
      const nextButton = screen.getByRole('button', { name: /next/i })

      expect(prevButton).toBeDisabled()
      expect(nextButton).toBeDisabled()
    })
  })

  describe('Import Button Integration', () => {
    it('shows import button when enabled', () => {
      renderDataGrid({ showImportButton: true })

      expect(screen.getByRole('button', { name: /import/i })).toBeInTheDocument()
    })

    it('opens import wizard when import button is clicked', async () => {
      const user = userEvent.setup()
      renderDataGrid({ showImportButton: true })

      const importButton = screen.getByRole('button', { name: /import/i })
      await user.click(importButton)

      // Should show import wizard modal
      expect(screen.getByText(/import data/i)).toBeInTheDocument()
    })
  })

  describe('Selection', () => {
    it('shows checkboxes when selection is enabled', () => {
      renderDataGrid({ enableSelection: true })

      const checkboxes = screen.getAllByRole('checkbox')
      expect(checkboxes.length).toBe(mockData.length + 1) // +1 for select all
    })

    it('selects all rows when select all checkbox is clicked', async () => {
      const user = userEvent.setup()
      const mockOnSelectionChange = vi.fn()
      renderDataGrid({
        enableSelection: true,
        onSelectionChange: mockOnSelectionChange
      })

      const selectAllCheckbox = screen.getAllByRole('checkbox')[0]
      await user.click(selectAllCheckbox)

      expect(mockOnSelectionChange).toHaveBeenCalledWith(['1', '2', '3'])
    })

    it('selects individual rows when row checkbox is clicked', async () => {
      const user = userEvent.setup()
      const mockOnSelectionChange = vi.fn()
      renderDataGrid({
        enableSelection: true,
        onSelectionChange: mockOnSelectionChange
      })

      const firstRowCheckbox = screen.getAllByRole('checkbox')[1]
      await user.click(firstRowCheckbox)

      expect(mockOnSelectionChange).toHaveBeenCalledWith(['1'])
    })
  })

  describe('Empty State', () => {
    it('shows empty state when no data', () => {
      renderDataGrid({
        data: [],
        pagination: { page: 1, limit: 20, total: 0, hasMore: false }
      })

      expect(screen.getByText(/no data/i)).toBeInTheDocument()
    })

    it('shows loading state when loading', () => {
      renderDataGrid({ loading: true })

      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('shows error state when error occurs', () => {
      renderDataGrid({ error: 'Failed to load data' })

      expect(screen.getByText(/failed to load data/i)).toBeInTheDocument()
    })

    it('shows retry button on error', async () => {
      const user = userEvent.setup()
      const mockOnRetry = vi.fn()
      renderDataGrid({
        error: 'Failed to load data',
        onRetry: mockOnRetry
      })

      const retryButton = screen.getByRole('button', { name: /retry/i })
      await user.click(retryButton)

      expect(mockOnRetry).toHaveBeenCalled()
    })
  })
})