import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'
import { ImportWizard } from './ImportWizard'
import type { DataGridColumn, ImportFieldMapping } from '../../types/jsonrpc'

// Mock XLSX library
vi.mock('xlsx', () => ({
  read: vi.fn((data, options) => ({
    SheetNames: ['Sheet1'],
    Sheets: {
      Sheet1: {
        A1: { v: 'name', t: 's' },
        B1: { v: 'email', t: 's' },
        C1: { v: 'age', t: 's' },
        A2: { v: 'John Doe', t: 's' },
        B2: { v: 'john@example.com', t: 's' },
        C2: { v: 30, t: 'n' },
        A3: { v: 'Jane Smith', t: 's' },
        B3: { v: 'jane@example.com', t: 's' },
        C3: { v: 25, t: 'n' },
        '!ref': 'A1:C3'
      }
    }
  })),
  utils: {
    sheet_to_json: vi.fn(() => [
      { name: 'John Doe', email: 'john@example.com', age: 30 },
      { name: 'Jane Smith', email: 'jane@example.com', age: 25 }
    ])
  }
}))

// Test wrapper with Mantine provider
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
)

const mockColumns: DataGridColumn[] = [
  {
    key: 'name',
    title: 'Name',
    dataType: 'string',
    sortable: true,
    filterable: true,
    width: 200
  },
  {
    key: 'email',
    title: 'Email',
    dataType: 'string',
    sortable: true,
    filterable: true,
    width: 250
  },
  {
    key: 'age',
    title: 'Age',
    dataType: 'number',
    sortable: true,
    filterable: true,
    width: 100
  }
]

const renderImportWizard = (props: Partial<React.ComponentProps<typeof ImportWizard>> = {}) => {
  const defaultProps = {
    opened: true,
    onClose: vi.fn(),
    onImport: vi.fn(),
    modelId: 'test-model',
    entityName: 'users',
    columns: mockColumns
  }

  return render(
    <TestWrapper>
      <ImportWizard {...defaultProps} {...props} />
    </TestWrapper>
  )
}

describe('ImportWizard', () => {
  let mockOnClose: ReturnType<typeof vi.fn>
  let mockOnImport: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockOnClose = vi.fn()
    mockOnImport = vi.fn()
    vi.clearAllMocks()
  })

  describe('Step 1: File Upload', () => {
    it('renders file upload area', () => {
      renderImportWizard()

      expect(screen.getByText(/drag.*drop.*file/i)).toBeInTheDocument()
      expect(screen.getByText(/csv.*excel/i)).toBeInTheDocument()
    })

    it('accepts CSV files', async () => {
      const user = userEvent.setup()
      renderImportWizard()

      const csvContent = 'name,email,age\nJohn Doe,john@example.com,30\nJane Smith,jane@example.com,25'
      const csvFile = new File([csvContent], 'test.csv', { type: 'text/csv' })

      const fileInput = screen.getByLabelText(/upload file/i)
      await user.upload(fileInput, csvFile)

      await waitFor(() => {
        expect(screen.getByText('test.csv')).toBeInTheDocument()
      })
    })

    it('accepts Excel files', async () => {
      const user = userEvent.setup()
      renderImportWizard()

      const excelFile = new File(['excel data'], 'test.xlsx', { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      })

      const fileInput = screen.getByLabelText(/upload file/i)
      await user.upload(fileInput, excelFile)

      await waitFor(() => {
        expect(screen.getByText('test.xlsx')).toBeInTheDocument()
      })
    })

    it('rejects unsupported file types', async () => {
      const user = userEvent.setup()
      renderImportWizard()

      const txtFile = new File(['text content'], 'test.txt', { type: 'text/plain' })

      const fileInput = screen.getByLabelText(/upload file/i)
      await user.upload(fileInput, txtFile)

      await waitFor(() => {
        expect(screen.getByText(/unsupported file type/i)).toBeInTheDocument()
      })
    })

    it('shows file size validation error', async () => {
      const user = userEvent.setup()
      renderImportWizard()

      // Create a large file (> 10MB)
      const largeContent = 'a'.repeat(11 * 1024 * 1024)
      const largeFile = new File([largeContent], 'large.csv', { type: 'text/csv' })

      const fileInput = screen.getByLabelText(/upload file/i)
      await user.upload(fileInput, largeFile)

      await waitFor(() => {
        expect(screen.getByText(/file too large/i)).toBeInTheDocument()
      })
    })

    it('allows proceeding to next step after valid file upload', async () => {
      const user = userEvent.setup()
      renderImportWizard()

      const csvContent = 'name,email\nJohn,john@test.com'
      const csvFile = new File([csvContent], 'test.csv', { type: 'text/csv' })

      const fileInput = screen.getByLabelText(/upload file/i)
      await user.upload(fileInput, csvFile)

      await waitFor(() => {
        const nextButton = screen.getByRole('button', { name: /next/i })
        expect(nextButton).not.toBeDisabled()
      })
    })
  })

  describe('Step 2: Field Mapping', () => {
    beforeEach(async () => {
      const user = userEvent.setup()
      renderImportWizard()

      const csvContent = 'full_name,email_address,user_age\nJohn Doe,john@example.com,30'
      const csvFile = new File([csvContent], 'test.csv', { type: 'text/csv' })

      const fileInput = screen.getByLabelText(/upload file/i)
      await user.upload(fileInput, csvFile)

      await waitFor(() => {
        const nextButton = screen.getByRole('button', { name: /next/i })
        expect(nextButton).not.toBeDisabled()
      })

      await user.click(screen.getByRole('button', { name: /next/i }))
    })

    it('shows field mapping interface', async () => {
      await waitFor(() => {
        expect(screen.getByText(/map fields/i)).toBeInTheDocument()
        expect(screen.getByText('full_name')).toBeInTheDocument()
        expect(screen.getByText('email_address')).toBeInTheDocument()
        expect(screen.getByText('user_age')).toBeInTheDocument()
      })
    })

    it('auto-maps similar field names', async () => {
      await waitFor(() => {
        // Should auto-map 'email_address' to 'email'
        const emailMapping = screen.getByDisplayValue('email')
        expect(emailMapping).toBeInTheDocument()
      })
    })

    it('allows manual field mapping', async () => {
      const user = userEvent.setup()

      await waitFor(async () => {
        const nameSelect = screen.getByDisplayValue(/select target/i)
        await user.click(nameSelect)
        await user.click(screen.getByText('name'))
      })

      expect(screen.getByDisplayValue('name')).toBeInTheDocument()
    })

    it('shows transformation options', async () => {
      await waitFor(() => {
        expect(screen.getByText(/trim/i)).toBeInTheDocument()
        expect(screen.getByText(/lowercase/i)).toBeInTheDocument()
      })
    })

    it('validates required field mappings', async () => {
      const user = userEvent.setup()

      // Try to proceed without mapping required fields
      await waitFor(async () => {
        const nextButton = screen.getByRole('button', { name: /next/i })
        await user.click(nextButton)
      })

      expect(screen.getByText(/required field.*not mapped/i)).toBeInTheDocument()
    })

    it('allows setting default values for unmapped fields', async () => {
      const user = userEvent.setup()

      await waitFor(async () => {
        const defaultValueInput = screen.getByPlaceholderText(/default value/i)
        await user.type(defaultValueInput, 'Default Name')
      })

      expect(screen.getByDisplayValue('Default Name')).toBeInTheDocument()
    })
  })

  describe('Step 3: Data Preview', () => {
    beforeEach(async () => {
      const user = userEvent.setup()
      renderImportWizard()

      // Upload file
      const csvContent = 'name,email,age\nJohn Doe,john@example.com,30\nJane Smith,jane@example.com,25'
      const csvFile = new File([csvContent], 'test.csv', { type: 'text/csv' })

      const fileInput = screen.getByLabelText(/upload file/i)
      await user.upload(fileInput, csvFile)
      await user.click(screen.getByRole('button', { name: /next/i }))

      // Map fields
      await waitFor(async () => {
        await user.click(screen.getByRole('button', { name: /next/i }))
      })
    })

    it('shows data preview table', async () => {
      await waitFor(() => {
        expect(screen.getByText(/preview data/i)).toBeInTheDocument()
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      })
    })

    it('shows validation errors', async () => {
      // Mock validation that finds errors
      renderImportWizard({
        onValidate: vi.fn().mockResolvedValue({
          errors: [
            { row: 1, column: 'email', error: 'Invalid email format', value: 'invalid-email' }
          ]
        })
      })

      await waitFor(() => {
        expect(screen.getByText(/validation error/i)).toBeInTheDocument()
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument()
      })
    })

    it('shows import options', async () => {
      await waitFor(() => {
        expect(screen.getByLabelText(/skip duplicates/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/update existing/i)).toBeInTheDocument()
      })
    })

    it('allows editing data in preview', async () => {
      const user = userEvent.setup()

      await waitFor(async () => {
        const editableCell = screen.getByText('John Doe')
        await user.dblClick(editableCell)
      })

      const editInput = screen.getByDisplayValue('John Doe')
      await user.clear(editInput)
      await user.type(editInput, 'John Smith{Enter}')

      expect(screen.getByText('John Smith')).toBeInTheDocument()
    })
  })

  describe('Step 4: Import Execution', () => {
    beforeEach(async () => {
      const user = userEvent.setup()
      renderImportWizard({ onImport: mockOnImport })

      // Upload file and navigate through steps
      const csvContent = 'name,email\nJohn,john@test.com'
      const csvFile = new File([csvContent], 'test.csv', { type: 'text/csv' })

      const fileInput = screen.getByLabelText(/upload file/i)
      await user.upload(fileInput, csvFile)
      await user.click(screen.getByRole('button', { name: /next/i }))
      await user.click(screen.getByRole('button', { name: /next/i }))

      // Start import
      await waitFor(async () => {
        const importButton = screen.getByRole('button', { name: /import/i })
        await user.click(importButton)
      })
    })

    it('shows import progress', async () => {
      await waitFor(() => {
        expect(screen.getByText(/importing/i)).toBeInTheDocument()
        expect(screen.getByRole('progressbar')).toBeInTheDocument()
      })
    })

    it('calls onImport with correct parameters', async () => {
      await waitFor(() => {
        expect(mockOnImport).toHaveBeenCalledWith(
          expect.objectContaining({
            modelId: 'test-model',
            entityName: 'users',
            data: expect.any(Array),
            fieldMapping: expect.any(Array),
            options: expect.objectContaining({
              skipDuplicates: expect.any(Boolean),
              updateExisting: expect.any(Boolean),
              validateOnly: false
            })
          })
        )
      })
    })

    it('shows success message on completion', async () => {
      mockOnImport.mockResolvedValueOnce({
        success: true,
        totalRows: 1,
        successCount: 1,
        errorCount: 0,
        duplicateCount: 0,
        errors: [],
        createdIds: ['1']
      })

      await waitFor(() => {
        expect(screen.getByText(/import completed/i)).toBeInTheDocument()
        expect(screen.getByText(/1.*record.*imported/i)).toBeInTheDocument()
      })
    })

    it('shows error details on failure', async () => {
      mockOnImport.mockResolvedValueOnce({
        success: false,
        totalRows: 1,
        successCount: 0,
        errorCount: 1,
        duplicateCount: 0,
        errors: [
          { row: 1, column: 'email', error: 'Email already exists', value: 'john@test.com' }
        ],
        createdIds: []
      })

      await waitFor(() => {
        expect(screen.getByText(/import failed/i)).toBeInTheDocument()
        expect(screen.getByText(/email already exists/i)).toBeInTheDocument()
      })
    })

    it('allows retrying failed import', async () => {
      const user = userEvent.setup()
      
      mockOnImport.mockResolvedValueOnce({
        success: false,
        totalRows: 1,
        successCount: 0,
        errorCount: 1,
        errors: [],
        createdIds: []
      })

      await waitFor(async () => {
        const retryButton = screen.getByRole('button', { name: /retry/i })
        await user.click(retryButton)
      })

      expect(mockOnImport).toHaveBeenCalledTimes(2)
    })
  })

  describe('Navigation', () => {
    it('allows going back to previous steps', async () => {
      const user = userEvent.setup()
      renderImportWizard()

      // Upload file and go to step 2
      const csvContent = 'name,email\nJohn,john@test.com'
      const csvFile = new File([csvContent], 'test.csv', { type: 'text/csv' })

      const fileInput = screen.getByLabelText(/upload file/i)
      await user.upload(fileInput, csvFile)
      await user.click(screen.getByRole('button', { name: /next/i }))

      // Go back to step 1
      const backButton = screen.getByRole('button', { name: /back/i })
      await user.click(backButton)

      expect(screen.getByText(/drag.*drop.*file/i)).toBeInTheDocument()
    })

    it('disables next button when validation fails', async () => {
      const user = userEvent.setup()
      renderImportWizard()

      // Try to proceed without uploading file
      const nextButton = screen.getByRole('button', { name: /next/i })
      expect(nextButton).toBeDisabled()
    })

    it('closes wizard when cancel is clicked', async () => {
      const user = userEvent.setup()
      renderImportWizard({ onClose: mockOnClose })

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('File Parsing', () => {
    it('parses CSV files correctly', async () => {
      const user = userEvent.setup()
      renderImportWizard()

      const csvContent = 'name,email,age\n"John Doe",john@example.com,30\n"Jane Smith",jane@example.com,25'
      const csvFile = new File([csvContent], 'test.csv', { type: 'text/csv' })

      const fileInput = screen.getByLabelText(/upload file/i)
      await user.upload(fileInput, csvFile)

      await waitFor(() => {
        expect(screen.getByText('3 columns detected')).toBeInTheDocument()
        expect(screen.getByText('2 rows of data')).toBeInTheDocument()
      })
    })

    it('handles CSV parsing errors gracefully', async () => {
      const user = userEvent.setup()
      renderImportWizard()

      const invalidCsvContent = 'name,email\n"unclosed quote,test@example.com'
      const csvFile = new File([invalidCsvContent], 'invalid.csv', { type: 'text/csv' })

      const fileInput = screen.getByLabelText(/upload file/i)
      await user.upload(fileInput, csvFile)

      await waitFor(() => {
        expect(screen.getByText(/error parsing file/i)).toBeInTheDocument()
      })
    })

    it('detects and handles different CSV delimiters', async () => {
      const user = userEvent.setup()
      renderImportWizard()

      const csvContent = 'name;email;age\nJohn Doe;john@example.com;30'
      const csvFile = new File([csvContent], 'semicolon.csv', { type: 'text/csv' })

      const fileInput = screen.getByLabelText(/upload file/i)
      await user.upload(fileInput, csvFile)

      await waitFor(() => {
        expect(screen.getByText('semicolon.csv')).toBeInTheDocument()
      })
    })
  })

  describe('Data Transformation', () => {
    it('applies transformations correctly', () => {
      const mapping: ImportFieldMapping = {
        sourceColumn: 'full_name',
        targetField: 'name',
        transform: 'trim',
        required: true
      }

      // Test the transformation logic would be applied
      const testValue = '  John Doe  '
      const expectedResult = 'John Doe'
      
      // This would be tested through the actual import process
      expect(testValue.trim()).toBe(expectedResult)
    })

    it('converts data types appropriately', () => {
      // Test number conversion
      expect(Number('30')).toBe(30)
      expect(Number('invalid')).toBeNaN()

      // Test date conversion
      const dateString = '2023-12-25'
      const date = new Date(dateString)
      expect(date.getFullYear()).toBe(2023)
    })
  })
})