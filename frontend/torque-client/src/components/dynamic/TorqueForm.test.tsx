import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'
import { TorqueForm } from './TorqueForm'
import type { FormDefinition, ConditionalRule } from '../../types/jsonrpc'

// Test wrapper with Mantine provider
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
)

const renderTorqueForm = (definition: FormDefinition, onSubmit = vi.fn(), onCancel = vi.fn()) => {
  return render(
    <TestWrapper>
      <TorqueForm definition={definition} onSubmit={onSubmit} onCancel={onCancel} />
    </TestWrapper>
  )
}

describe('TorqueForm', () => {
  let mockOnSubmit: ReturnType<typeof vi.fn>
  let mockOnCancel: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockOnSubmit = vi.fn()
    mockOnCancel = vi.fn()
  })

  describe('Basic Form Rendering', () => {
    it('renders form fields correctly', () => {
      const definition: FormDefinition = {
        layout: 'vertical',
        submitText: 'Save',
        cancelText: 'Cancel',
        fields: [
          {
            id: 'field-1',
            name: 'name',
            label: 'Name',
            type: 'text',
            required: true
          },
          {
            id: 'field-2',
            name: 'email',
            label: 'Email',
            type: 'text',
            required: false
          }
        ],
        validation: {
          validateOnBlur: true,
          validateOnChange: false
        }
      }

      renderTorqueForm(definition, mockOnSubmit, mockOnCancel)

      expect(screen.getByLabelText('Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    })

    it('renders different field types correctly', () => {
      const definition: FormDefinition = {
        layout: 'vertical',
        submitText: 'Save',
        cancelText: 'Cancel',
        fields: [
          { id: '1', name: 'text', label: 'Text Field', type: 'text', required: false },
          { id: '2', name: 'number', label: 'Number Field', type: 'number', required: false },
          { id: '3', name: 'checkbox', label: 'Checkbox Field', type: 'checkbox', required: false },
          { id: '4', name: 'textarea', label: 'Textarea Field', type: 'textarea', required: false },
          { id: '5', name: 'date', label: 'Date Field', type: 'date', required: false }
        ],
        validation: { validateOnBlur: false, validateOnChange: false }
      }

      renderTorqueForm(definition, mockOnSubmit, mockOnCancel)

      expect(screen.getByLabelText('Text Field')).toBeInTheDocument()
      expect(screen.getByLabelText('Number Field')).toBeInTheDocument()
      expect(screen.getByLabelText('Checkbox Field')).toBeInTheDocument()
      expect(screen.getByLabelText('Textarea Field')).toBeInTheDocument()
      expect(screen.getByLabelText('Date Field')).toBeInTheDocument()
    })

    it('displays help text when provided', () => {
      const definition: FormDefinition = {
        layout: 'vertical',
        submitText: 'Save',
        cancelText: 'Cancel',
        fields: [
          {
            id: 'field-1',
            name: 'name',
            label: 'Name',
            type: 'text',
            required: false,
            uiConfig: {
              helpText: 'Enter your full name'
            }
          }
        ],
        validation: { validateOnBlur: false, validateOnChange: false }
      }

      renderTorqueForm(definition, mockOnSubmit, mockOnCancel)

      expect(screen.getByText('Enter your full name')).toBeInTheDocument()
    })
  })

  describe('Conditional Logic - showIf', () => {
    it('shows field when condition is met', async () => {
      const user = userEvent.setup()
      const definition: FormDefinition = {
        layout: 'vertical',
        submitText: 'Save',
        cancelText: 'Cancel',
        fields: [
          {
            id: 'field-1',
            name: 'type',
            label: 'Type',
            type: 'text',
            required: false
          },
          {
            id: 'field-2',
            name: 'details',
            label: 'Details',
            type: 'text',
            required: false,
            uiConfig: {
              showIf: { field: 'type', operator: 'equals', value: 'advanced' }
            }
          }
        ],
        validation: { validateOnBlur: false, validateOnChange: false }
      }

      renderTorqueForm(definition, mockOnSubmit, mockOnCancel)

      // Initially details field should be hidden
      expect(screen.queryByLabelText('Details')).not.toBeInTheDocument()

      // Type 'advanced' to trigger showIf condition
      const typeField = screen.getByLabelText('Type')
      await user.type(typeField, 'advanced')

      // Details field should now be visible
      await waitFor(() => {
        expect(screen.getByLabelText('Details')).toBeInTheDocument()
      })
    })

    it('hides field when condition is not met', async () => {
      const user = userEvent.setup()
      const definition: FormDefinition = {
        layout: 'vertical',
        submitText: 'Save',
        cancelText: 'Cancel',
        fields: [
          {
            id: 'field-1',
            name: 'type',
            label: 'Type',
            type: 'text',
            required: false
          },
          {
            id: 'field-2',
            name: 'details',
            label: 'Details',
            type: 'text',
            required: false,
            uiConfig: {
              showIf: { field: 'type', operator: 'equals', value: 'advanced' }
            }
          }
        ],
        validation: { validateOnBlur: false, validateOnChange: false }
      }

      renderTorqueForm(definition, mockOnSubmit, mockOnCancel)

      const typeField = screen.getByLabelText('Type')
      await user.type(typeField, 'basic')

      // Details field should remain hidden
      expect(screen.queryByLabelText('Details')).not.toBeInTheDocument()
    })

    it('evaluates different conditional operators correctly', async () => {
      const user = userEvent.setup()
      
      const testCases = [
        { operator: 'notEquals', triggerValue: 'other', expectVisible: true },
        { operator: 'contains', triggerValue: 'test value', expectVisible: true },
        { operator: 'isEmpty', triggerValue: '', expectVisible: true },
        { operator: 'isNotEmpty', triggerValue: 'something', expectVisible: true }
      ] as const

      for (const testCase of testCases) {
        const definition: FormDefinition = {
          layout: 'vertical',
          submitText: 'Save',
          cancelText: 'Cancel',
          fields: [
            { id: 'field-1', name: 'trigger', label: 'Trigger', type: 'text', required: false },
            {
              id: 'field-2',
              name: 'conditional',
              label: 'Conditional',
              type: 'text',
              required: false,
              uiConfig: {
                showIf: { field: 'trigger', operator: testCase.operator, value: 'test' }
              }
            }
          ],
          validation: { validateOnBlur: false, validateOnChange: false }
        }

        const { unmount } = renderTorqueForm(definition, mockOnSubmit, mockOnCancel)

        const triggerField = screen.getByLabelText('Trigger')
        await user.clear(triggerField)
        await user.type(triggerField, testCase.triggerValue)

        if (testCase.expectVisible) {
          await waitFor(() => {
            expect(screen.getByLabelText('Conditional')).toBeInTheDocument()
          })
        } else {
          expect(screen.queryByLabelText('Conditional')).not.toBeInTheDocument()
        }

        unmount()
      }
    })
  })

  describe('Conditional Logic - requiredIf', () => {
    it('makes field required when condition is met', async () => {
      const user = userEvent.setup()
      const definition: FormDefinition = {
        layout: 'vertical',
        submitText: 'Save',
        cancelText: 'Cancel',
        fields: [
          {
            id: 'field-1',
            name: 'hasDetails',
            label: 'Has Details',
            type: 'checkbox',
            required: false
          },
          {
            id: 'field-2',
            name: 'details',
            label: 'Details',
            type: 'text',
            required: false,
            uiConfig: {
              requiredIf: { field: 'hasDetails', operator: 'equals', value: true }
            }
          }
        ],
        validation: { validateOnBlur: true, validateOnChange: false }
      }

      renderTorqueForm(definition, mockOnSubmit, mockOnCancel)

      // Check the checkbox to trigger requiredIf condition
      const checkbox = screen.getByLabelText('Has Details')
      await user.click(checkbox)

      // Try to submit without filling required conditional field
      const submitButton = screen.getByRole('button', { name: 'Save' })
      await user.click(submitButton)

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/required/i)).toBeInTheDocument()
      })
    })
  })

  describe('Form Validation', () => {
    it('validates required fields on submit', async () => {
      const user = userEvent.setup()
      const definition: FormDefinition = {
        layout: 'vertical',
        submitText: 'Save',
        cancelText: 'Cancel',
        fields: [
          {
            id: 'field-1',
            name: 'name',
            label: 'Name',
            type: 'text',
            required: true
          }
        ],
        validation: { validateOnBlur: false, validateOnChange: false }
      }

      renderTorqueForm(definition, mockOnSubmit, mockOnCancel)

      const submitButton = screen.getByRole('button', { name: 'Save' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/required/i)).toBeInTheDocument()
      })

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('validates on blur when validateOnBlur is true', async () => {
      const user = userEvent.setup()
      const definition: FormDefinition = {
        layout: 'vertical',
        submitText: 'Save',
        cancelText: 'Cancel',
        fields: [
          {
            id: 'field-1',
            name: 'email',
            label: 'Email',
            type: 'text',
            required: true,
            validation: { pattern: '^[^@]+@[^@]+\\.[^@]+$' }
          }
        ],
        validation: { validateOnBlur: true, validateOnChange: false }
      }

      renderTorqueForm(definition, mockOnSubmit, mockOnCancel)

      const emailField = screen.getByLabelText('Email')
      await user.type(emailField, 'invalid-email')
      await user.tab() // Trigger blur

      await waitFor(() => {
        expect(screen.getByText(/pattern/i)).toBeInTheDocument()
      })
    })

    it('validates on change when validateOnChange is true', async () => {
      const user = userEvent.setup()
      const definition: FormDefinition = {
        layout: 'vertical',
        submitText: 'Save',
        cancelText: 'Cancel',
        fields: [
          {
            id: 'field-1',
            name: 'name',
            label: 'Name',
            type: 'text',
            required: true,
            validation: { minLength: 5 }
          }
        ],
        validation: { validateOnBlur: false, validateOnChange: true }
      }

      renderTorqueForm(definition, mockOnSubmit, mockOnCancel)

      const nameField = screen.getByLabelText('Name')
      await user.type(nameField, 'ab')

      await waitFor(() => {
        expect(screen.getByText(/minLength/i)).toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('calls onSubmit with form data when validation passes', async () => {
      const user = userEvent.setup()
      const definition: FormDefinition = {
        layout: 'vertical',
        submitText: 'Save',
        cancelText: 'Cancel',
        fields: [
          {
            id: 'field-1',
            name: 'name',
            label: 'Name',
            type: 'text',
            required: true
          },
          {
            id: 'field-2',
            name: 'email',
            label: 'Email',
            type: 'text',
            required: false
          }
        ],
        validation: { validateOnBlur: false, validateOnChange: false }
      }

      renderTorqueForm(definition, mockOnSubmit, mockOnCancel)

      await user.type(screen.getByLabelText('Name'), 'John Doe')
      await user.type(screen.getByLabelText('Email'), 'john@example.com')

      const submitButton = screen.getByRole('button', { name: 'Save' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'John Doe',
          email: 'john@example.com'
        })
      })
    })

    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup()
      const definition: FormDefinition = {
        layout: 'vertical',
        submitText: 'Save',
        cancelText: 'Cancel',
        fields: [
          { id: 'field-1', name: 'name', label: 'Name', type: 'text', required: false }
        ],
        validation: { validateOnBlur: false, validateOnChange: false }
      }

      renderTorqueForm(definition, mockOnSubmit, mockOnCancel)

      const cancelButton = screen.getByRole('button', { name: 'Cancel' })
      await user.click(cancelButton)

      expect(mockOnCancel).toHaveBeenCalled()
    })
  })

  describe('File Upload Fields', () => {
    it('handles file upload with validation', async () => {
      const user = userEvent.setup()
      const definition: FormDefinition = {
        layout: 'vertical',
        submitText: 'Save',
        cancelText: 'Cancel',
        fields: [
          {
            id: 'field-1',
            name: 'document',
            label: 'Document',
            type: 'file',
            required: true,
            uiConfig: {
              acceptedFileTypes: ['.pdf', '.doc'],
              maxFileSize: 1048576 // 1MB
            }
          }
        ],
        validation: { validateOnBlur: false, validateOnChange: false }
      }

      renderTorqueForm(definition, mockOnSubmit, mockOnCancel)

      const fileInput = screen.getByLabelText('Document')
      expect(fileInput).toHaveAttribute('accept', '.pdf,.doc')

      // Test file size validation
      const largeFile = new File(['large content'.repeat(100000)], 'large.pdf', { type: 'application/pdf' })
      await user.upload(fileInput, largeFile)

      const submitButton = screen.getByRole('button', { name: 'Save' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/file size/i)).toBeInTheDocument()
      })
    })
  })

  describe('Form Sections', () => {
    it('groups fields into sections with dividers', () => {
      const definition: FormDefinition = {
        layout: 'vertical',
        submitText: 'Save',
        cancelText: 'Cancel',
        fields: [
          {
            id: 'field-1',
            name: 'name',
            label: 'Name',
            type: 'text',
            required: false,
            uiConfig: { section: 'Personal Information' }
          },
          {
            id: 'field-2',
            name: 'email',
            label: 'Email',
            type: 'text',
            required: false,
            uiConfig: { section: 'Personal Information' }
          },
          {
            id: 'field-3',
            name: 'company',
            label: 'Company',
            type: 'text',
            required: false,
            uiConfig: { section: 'Professional Information' }
          }
        ],
        validation: { validateOnBlur: false, validateOnChange: false }
      }

      renderTorqueForm(definition, mockOnSubmit, mockOnCancel)

      expect(screen.getByText('Personal Information')).toBeInTheDocument()
      expect(screen.getByText('Professional Information')).toBeInTheDocument()
    })
  })

  describe('Default Values', () => {
    it('sets default values correctly', () => {
      const definition: FormDefinition = {
        layout: 'vertical',
        submitText: 'Save',
        cancelText: 'Cancel',
        fields: [
          {
            id: 'field-1',
            name: 'name',
            label: 'Name',
            type: 'text',
            required: false,
            defaultValue: 'Default Name'
          },
          {
            id: 'field-2',
            name: 'active',
            label: 'Active',
            type: 'checkbox',
            required: false,
            defaultValue: true
          }
        ],
        validation: { validateOnBlur: false, validateOnChange: false }
      }

      renderTorqueForm(definition, mockOnSubmit, mockOnCancel)

      const nameField = screen.getByLabelText('Name') as HTMLInputElement
      const activeField = screen.getByLabelText('Active') as HTMLInputElement

      expect(nameField.value).toBe('Default Name')
      expect(activeField.checked).toBe(true)
    })
  })
})