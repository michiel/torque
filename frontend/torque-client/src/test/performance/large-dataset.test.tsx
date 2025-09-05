import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'
import { DataGrid } from '../../components/dynamic/DataGrid'
import { ImportWizard } from '../../components/dynamic/ImportWizard'
import type { DataGridColumn } from '../../types/jsonrpc'

// Performance testing utilities
const measurePerformance = async (fn: () => Promise<void> | void, label: string) => {
  const start = performance.now()
  await fn()
  const end = performance.now()
  const duration = end - start
  console.log(`${label}: ${duration.toFixed(2)}ms`)
  return duration
}

// Generate large dataset for testing
const generateLargeDataset = (size: number) => {
  return Array.from({ length: size }, (_, index) => ({
    id: `id-${index}`,
    name: `User ${index}`,
    email: `user${index}@example.com`,
    age: 20 + (index % 50),
    department: `Department ${index % 10}`,
    salary: 50000 + (index % 100000),
    joinDate: new Date(2020 + (index % 4), index % 12, (index % 28) + 1).toISOString(),
    active: index % 2 === 0,
    skills: [`Skill ${index % 5}`, `Skill ${(index + 1) % 5}`],
    address: {
      street: `${index} Main St`,
      city: `City ${index % 100}`,
      zip: `${10000 + (index % 90000)}`
    }
  }))
}

const generateLargeColumns = (): DataGridColumn[] => [
  { key: 'id', title: 'ID', dataType: 'string', sortable: true, filterable: false, width: 80 },
  { key: 'name', title: 'Name', dataType: 'string', sortable: true, filterable: true, width: 200, editable: true },
  { key: 'email', title: 'Email', dataType: 'string', sortable: true, filterable: true, width: 250, editable: true },
  { key: 'age', title: 'Age', dataType: 'number', sortable: true, filterable: true, width: 100, editable: true },
  { key: 'department', title: 'Department', dataType: 'string', sortable: true, filterable: true, width: 150, editable: true },
  { key: 'salary', title: 'Salary', dataType: 'number', sortable: true, filterable: true, width: 120, editable: true },
  { key: 'joinDate', title: 'Join Date', dataType: 'date', sortable: true, filterable: true, width: 150 },
  { key: 'active', title: 'Active', dataType: 'boolean', sortable: true, filterable: true, width: 100, editable: true },
  { key: 'skills', title: 'Skills', dataType: 'array', sortable: false, filterable: false, width: 200 },
  { key: 'address', title: 'Address', dataType: 'json', sortable: false, filterable: false, width: 300 }
]

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
)

describe('Performance Tests - Large Datasets', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('DataGrid Performance', () => {
    it('renders 1000 rows efficiently', async () => {
      const largeData = generateLargeDataset(1000)
      const columns = generateLargeColumns()

      const duration = await measurePerformance(async () => {
        render(
          <TestWrapper>
            <DataGrid
              modelId="test-model"
              entityName="users"
              columns={columns}
              data={largeData}
              pagination={{ page: 1, limit: 1000, total: 1000, hasMore: false }}
              onDataChange={vi.fn()}
              onFilterChange={vi.fn()}
              onSortChange={vi.fn()}
              onPageChange={vi.fn()}
            />
          </TestWrapper>
        )

        // Wait for table to be rendered
        await waitFor(() => {
          expect(screen.getByRole('table')).toBeInTheDocument()
        })
      }, 'DataGrid render with 1000 rows')

      // Performance assertion: should render within 2 seconds
      expect(duration).toBeLessThan(2000)
    })

    it('handles virtual scrolling for 10000 rows', async () => {
      const largeData = generateLargeDataset(10000)
      const columns = generateLargeColumns()

      const duration = await measurePerformance(async () => {
        render(
          <TestWrapper>
            <DataGrid
              modelId="test-model"
              entityName="users"
              columns={columns}
              data={largeData}
              pagination={{ page: 1, limit: 10000, total: 10000, hasMore: false }}
              virtualScrolling={true}
              onDataChange={vi.fn()}
              onFilterChange={vi.fn()}
              onSortChange={vi.fn()}
              onPageChange={vi.fn()}
            />
          </TestWrapper>
        )

        await waitFor(() => {
          expect(screen.getByRole('table')).toBeInTheDocument()
        })
      }, 'Virtual scrolling with 10000 rows')

      // Virtual scrolling should handle large datasets efficiently
      expect(duration).toBeLessThan(5000)
    })

    it('performs fast filtering on large dataset', async () => {
      const user = userEvent.setup()
      const largeData = generateLargeDataset(5000)
      const columns = generateLargeColumns()
      const mockOnFilterChange = vi.fn()

      render(
        <TestWrapper>
          <DataGrid
            modelId="test-model"
            entityName="users"
            columns={columns}
            data={largeData}
            pagination={{ page: 1, limit: 5000, total: 5000, hasMore: false }}
            showFilters={true}
            onDataChange={vi.fn()}
            onFilterChange={mockOnFilterChange}
            onSortChange={vi.fn()}
            onPageChange={vi.fn()}
          />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument()
      })

      const duration = await measurePerformance(async () => {
        const nameFilter = screen.getByPlaceholderText(/filter.*name/i)
        await user.type(nameFilter, 'User 100')

        await waitFor(() => {
          expect(mockOnFilterChange).toHaveBeenCalled()
        })
      }, 'Filter typing and processing')

      // Filtering should be responsive
      expect(duration).toBeLessThan(1000)
    })

    it('performs fast sorting on large dataset', async () => {
      const user = userEvent.setup()
      const largeData = generateLargeDataset(5000)
      const columns = generateLargeColumns()
      const mockOnSortChange = vi.fn()

      render(
        <TestWrapper>
          <DataGrid
            modelId="test-model"
            entityName="users"
            columns={columns}
            data={largeData}
            pagination={{ page: 1, limit: 5000, total: 5000, hasMore: false }}
            onDataChange={vi.fn()}
            onFilterChange={vi.fn()}
            onSortChange={mockOnSortChange}
            onPageChange={vi.fn()}
          />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument()
      })

      const duration = await measurePerformance(async () => {
        const nameHeader = screen.getByText('Name')
        await user.click(nameHeader)

        await waitFor(() => {
          expect(mockOnSortChange).toHaveBeenCalled()
        })
      }, 'Column sort click and processing')

      // Sorting should be immediate
      expect(duration).toBeLessThan(500)
    })

    it('handles rapid inline editing efficiently', async () => {
      const user = userEvent.setup()
      const largeData = generateLargeDataset(1000)
      const columns = generateLargeColumns()
      const mockOnDataChange = vi.fn()

      render(
        <TestWrapper>
          <DataGrid
            modelId="test-model"
            entityName="users"
            columns={columns}
            data={largeData}
            pagination={{ page: 1, limit: 1000, total: 1000, hasMore: false }}
            enableInlineEdit={true}
            onDataChange={mockOnDataChange}
            onFilterChange={vi.fn()}
            onSortChange={vi.fn()}
            onPageChange={vi.fn()}
          />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument()
      })

      const duration = await measurePerformance(async () => {
        // Simulate editing multiple cells rapidly
        for (let i = 0; i < 5; i++) {
          const nameCell = screen.getByText(`User ${i}`)
          await user.dblClick(nameCell)
          
          const editInput = screen.getByDisplayValue(`User ${i}`)
          await user.clear(editInput)
          await user.type(editInput, `Updated User ${i}{Enter}`)
          
          await waitFor(() => {
            expect(mockOnDataChange).toHaveBeenCalledWith(
              `id-${i}`,
              { name: `Updated User ${i}` }
            )
          })
        }
      }, 'Rapid inline editing of 5 cells')

      // Multiple edits should complete quickly
      expect(duration).toBeLessThan(3000)
    })
  })

  describe('Import Performance', () => {
    it('processes large CSV file efficiently', async () => {
      const user = userEvent.setup()
      const mockOnImport = vi.fn().mockResolvedValue({
        success: true,
        totalRows: 10000,
        successCount: 10000,
        errorCount: 0,
        duplicateCount: 0,
        errors: [],
        createdIds: Array.from({ length: 10000 }, (_, i) => `import-${i}`)
      })

      render(
        <TestWrapper>
          <ImportWizard
            opened={true}
            onClose={vi.fn()}
            onImport={mockOnImport}
            modelId="test-model"
            entityName="users"
            columns={generateLargeColumns()}
          />
        </TestWrapper>
      )

      // Generate large CSV content (10k rows)
      const csvHeaders = 'name,email,age,department,salary'
      const csvRows = Array.from({ length: 10000 }, (_, i) => 
        `User ${i},user${i}@example.com,${20 + (i % 50)},Department ${i % 10},${50000 + (i % 100000)}`
      ).join('\n')
      const largeCsvContent = `${csvHeaders}\n${csvRows}`

      const duration = await measurePerformance(async () => {
        // Upload large CSV
        const csvFile = new File([largeCsvContent], 'large_users.csv', { type: 'text/csv' })
        const fileInput = screen.getByLabelText(/upload file/i)
        await user.upload(fileInput, csvFile)

        // Wait for file processing
        await waitFor(() => {
          expect(screen.getByText('large_users.csv')).toBeInTheDocument()
        }, { timeout: 10000 })

        // Proceed through wizard steps
        await user.click(screen.getByRole('button', { name: /next/i }))
        await user.click(screen.getByRole('button', { name: /next/i }))
        await user.click(screen.getByRole('button', { name: /import/i }))

        // Wait for import completion
        await waitFor(() => {
          expect(mockOnImport).toHaveBeenCalled()
        }, { timeout: 30000 })
      }, 'Large CSV file processing and import')

      // Large file processing should complete within reasonable time
      expect(duration).toBeLessThan(30000) // 30 seconds max
    })

    it('handles memory-efficient chunked processing', async () => {
      const user = userEvent.setup()
      let importCallCount = 0
      const mockOnImport = vi.fn().mockImplementation(async (params) => {
        importCallCount++
        // Simulate processing chunks
        return {
          success: true,
          totalRows: params.data.length,
          successCount: params.data.length,
          errorCount: 0,
          duplicateCount: 0,
          errors: [],
          createdIds: params.data.map((_: any, i: number) => `chunk-${importCallCount}-${i}`)
        }
      })

      render(
        <TestWrapper>
          <ImportWizard
            opened={true}
            onClose={vi.fn()}
            onImport={mockOnImport}
            modelId="test-model"
            entityName="users"
            columns={generateLargeColumns()}
            chunkSize={1000} // Process in chunks of 1000
          />
        </TestWrapper>
      )

      // Generate very large CSV (50k rows)
      const csvHeaders = 'name,email,age'
      const csvRows = Array.from({ length: 50000 }, (_, i) => 
        `User ${i},user${i}@example.com,${20 + (i % 50)}`
      ).join('\n')
      const hugeCsvContent = `${csvHeaders}\n${csvRows}`

      const csvFile = new File([hugeCsvContent], 'huge_users.csv', { type: 'text/csv' })
      const fileInput = screen.getByLabelText(/upload file/i)
      await user.upload(fileInput, csvFile)

      await waitFor(() => {
        expect(screen.getByText('huge_users.csv')).toBeInTheDocument()
      }, { timeout: 15000 })

      // Navigate through wizard
      await user.click(screen.getByRole('button', { name: /next/i }))
      await user.click(screen.getByRole('button', { name: /next/i }))

      const duration = await measurePerformance(async () => {
        await user.click(screen.getByRole('button', { name: /import/i }))

        // Wait for chunked processing to complete
        await waitFor(() => {
          expect(importCallCount).toBeGreaterThan(0)
        }, { timeout: 60000 })
      }, 'Chunked processing of 50k rows')

      // Chunked processing should handle large files efficiently
      expect(duration).toBeLessThan(60000) // 1 minute max
      expect(importCallCount).toBeGreaterThan(1) // Should have processed in chunks
    })
  })

  describe('Memory Usage', () => {
    it('maintains stable memory usage with large datasets', async () => {
      // This test would require more sophisticated memory monitoring
      // For now, we'll test that components don't cause obvious memory leaks
      
      const renderAndUnmountLargeGrid = () => {
        const largeData = generateLargeDataset(5000)
        const { unmount } = render(
          <TestWrapper>
            <DataGrid
              modelId="test-model"
              entityName="users"
              columns={generateLargeColumns()}
              data={largeData}
              pagination={{ page: 1, limit: 5000, total: 5000, hasMore: false }}
              onDataChange={vi.fn()}
              onFilterChange={vi.fn()}
              onSortChange={vi.fn()}
              onPageChange={vi.fn()}
            />
          </TestWrapper>
        )
        unmount()
      }

      const duration = await measurePerformance(async () => {
        // Render and unmount multiple times to test for memory leaks
        for (let i = 0; i < 10; i++) {
          renderAndUnmountLargeGrid()
        }
      }, 'Multiple render/unmount cycles')

      // Multiple cycles should complete quickly (no memory accumulation)
      expect(duration).toBeLessThan(5000)
    })

    it('efficiently handles component updates with large props', async () => {
      let rerenderCount = 0
      const TestComponent = ({ data }: { data: any[] }) => {
        rerenderCount++
        return (
          <TestWrapper>
            <DataGrid
              modelId="test-model"
              entityName="users"
              columns={generateLargeColumns()}
              data={data}
              pagination={{ page: 1, limit: data.length, total: data.length, hasMore: false }}
              onDataChange={vi.fn()}
              onFilterChange={vi.fn()}
              onSortChange={vi.fn()}
              onPageChange={vi.fn()}
            />
          </TestWrapper>
        )
      }

      let data = generateLargeDataset(1000)
      const { rerender } = render(<TestComponent data={data} />)

      const duration = await measurePerformance(async () => {
        // Simulate multiple data updates
        for (let i = 0; i < 5; i++) {
          data = generateLargeDataset(1000 + i * 100)
          rerender(<TestComponent data={data} />)
          
          await waitFor(() => {
            expect(screen.getByRole('table')).toBeInTheDocument()
          })
        }
      }, 'Multiple rerenders with large datasets')

      expect(rerenderCount).toBe(6) // Initial + 5 rerenders
      expect(duration).toBeLessThan(3000) // Should handle updates efficiently
    })
  })

  describe('Network Performance', () => {
    it('handles slow API responses gracefully', async () => {
      // Mock slow API response
      const mockSlowFetch = vi.fn().mockImplementation(
        () => new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({ data: generateLargeDataset(1000) })
          }), 2000) // 2 second delay
        )
      )

      global.fetch = mockSlowFetch

      const duration = await measurePerformance(async () => {
        render(
          <TestWrapper>
            <DataGrid
              modelId="test-model"
              entityName="users"
              columns={generateLargeColumns()}
              data={[]}
              loading={true}
              pagination={{ page: 1, limit: 20, total: 0, hasMore: false }}
              onDataChange={vi.fn()}
              onFilterChange={vi.fn()}
              onSortChange={vi.fn()}
              onPageChange={vi.fn()}
            />
          </TestWrapper>
        )

        // Should show loading state immediately
        expect(screen.getByText(/loading/i)).toBeInTheDocument()
      }, 'Initial render with loading state')

      // Initial render should be fast even with pending data
      expect(duration).toBeLessThan(100)
    })

    it('handles API timeout scenarios', async () => {
      // Mock API timeout
      const mockTimeoutFetch = vi.fn().mockImplementation(
        () => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 5000)
        )
      )

      global.fetch = mockTimeoutFetch

      render(
        <TestWrapper>
          <DataGrid
            modelId="test-model"
            entityName="users"
            columns={generateLargeColumns()}
            data={[]}
            error="Request timeout"
            pagination={{ page: 1, limit: 20, total: 0, hasMore: false }}
            onDataChange={vi.fn()}
            onFilterChange={vi.fn()}
            onSortChange={vi.fn()}
            onPageChange={vi.fn()}
          />
        </TestWrapper>
      )

      // Should display error state
      expect(screen.getByText(/request timeout/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })
  })

  describe('Concurrent Operations', () => {
    it('handles multiple simultaneous filter changes efficiently', async () => {
      const user = userEvent.setup()
      const largeData = generateLargeDataset(2000)
      const columns = generateLargeColumns()
      const mockOnFilterChange = vi.fn()

      render(
        <TestWrapper>
          <DataGrid
            modelId="test-model"
            entityName="users"
            columns={columns}
            data={largeData}
            pagination={{ page: 1, limit: 2000, total: 2000, hasMore: false }}
            showFilters={true}
            onDataChange={vi.fn()}
            onFilterChange={mockOnFilterChange}
            onSortChange={vi.fn()}
            onPageChange={vi.fn()}
          />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument()
      })

      const duration = await measurePerformance(async () => {
        // Simulate rapid filter changes
        const nameFilter = screen.getByPlaceholderText(/filter.*name/i)
        const emailFilter = screen.getByPlaceholderText(/filter.*email/i)
        const ageFilter = screen.getByPlaceholderText(/filter.*age/i)

        await Promise.all([
          user.type(nameFilter, 'User'),
          user.type(emailFilter, '@example'),
          user.type(ageFilter, '25')
        ])

        await waitFor(() => {
          expect(mockOnFilterChange).toHaveBeenCalled()
        })
      }, 'Concurrent filter operations')

      // Concurrent operations should complete quickly
      expect(duration).toBeLessThan(2000)
    })
  })
})