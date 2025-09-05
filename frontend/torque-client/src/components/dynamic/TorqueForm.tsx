import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  TextInput,
  NumberInput,
  Checkbox,
  Textarea,
  Select,
  MultiSelect,
  Button,
  Group,
  Stack,
  LoadingOverlay,
  FileInput,
  Text,
  Alert,
  Divider
} from '@mantine/core'
import { DateInput, DateTimePicker, TimeInput } from '@mantine/dates'
import { IconUpload, IconInfoCircle } from '@tabler/icons-react'
import { useFormDefinition, useJsonRpcMutation } from '../../hooks/useJsonRpc'
import type { FormField, ConditionalRule } from '../../types/jsonrpc'
import { useState, useEffect } from 'react'

interface TorqueFormProps {
  id: string
  modelId: string
  entityName: string
  entityId?: string // For editing existing entities
  onSuccess?: (data: any) => void
  onCancel?: () => void
}

export function TorqueForm({
  modelId,
  entityName,
  entityId,
  onSuccess,
  onCancel
}: TorqueFormProps) {
  const { data: formDef, loading: formLoading } = useFormDefinition(modelId, entityName)
  const { mutate, loading: mutationLoading } = useJsonRpcMutation()
  const [fileUploads, setFileUploads] = useState<Record<string, File | null>>({})
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Utility function to evaluate conditional rules
  const evaluateCondition = (rule: ConditionalRule, formValues: Record<string, any>): boolean => {
    const fieldValue = formValues[rule.field]
    const { operator, value } = rule

    switch (operator) {
      case 'equals':
        return fieldValue === value
      case 'notEquals':
        return fieldValue !== value
      case 'contains':
        return Array.isArray(fieldValue) ? fieldValue.includes(value) : String(fieldValue || '').includes(String(value || ''))
      case 'isEmpty':
        return !fieldValue || fieldValue === '' || (Array.isArray(fieldValue) && fieldValue.length === 0)
      case 'isNotEmpty':
        return fieldValue && fieldValue !== '' && (!Array.isArray(fieldValue) || fieldValue.length > 0)
      case 'greaterThan':
        return typeof fieldValue === 'number' && typeof value === 'number' && fieldValue > value
      case 'lessThan':
        return typeof fieldValue === 'number' && typeof value === 'number' && fieldValue < value
      default:
        return false
    }
  }

  // Check if field should be shown based on conditional rules
  const shouldShowField = (field: FormField, formValues: Record<string, any>): boolean => {
    if (!field.uiConfig?.showIf) return true
    return evaluateCondition(field.uiConfig.showIf, formValues)
  }

  // Check if field should be required based on conditional rules
  const isFieldRequired = (field: FormField, formValues: Record<string, any>): boolean => {
    if (typeof field.required === 'boolean') {
      return field.required
    }
    if (field.uiConfig?.requiredIf) {
      return evaluateCondition(field.uiConfig.requiredIf, formValues)
    }
    return false
  }

  // Create Zod schema from form definition
  const createSchema = (fields: FormField[]): any => {
    const schemaFields: Record<string, z.ZodTypeAny> = {}
    
    fields.forEach(field => {
      let fieldSchema: z.ZodTypeAny

      switch (field.type) {
        case 'text':
        case 'textarea':
          fieldSchema = z.string()
          if (field.validation?.maxLength) {
            fieldSchema = (fieldSchema as any).max(field.validation.maxLength)
          }
          break
        
        case 'number':
          fieldSchema = z.number()
          if (field.validation?.minimum !== undefined) {
            fieldSchema = (fieldSchema as any).min(field.validation.minimum)
          }
          if (field.validation?.maximum !== undefined) {
            fieldSchema = (fieldSchema as any).max(field.validation.maximum)
          }
          break
        
        case 'checkbox':
          fieldSchema = z.boolean()
          break
        
        case 'date':
        case 'datetime-local':
        case 'time':
          fieldSchema = z.date()
          break
        
        case 'file':
          // File validation will be handled separately
          fieldSchema = z.any().optional()
          break
        
        case 'select':
        case 'multiselect':
          if (field.validation?.options) {
            fieldSchema = field.type === 'multiselect' 
              ? z.array(z.string())
              : z.string()
          } else {
            fieldSchema = z.string()
          }
          break
        
        default:
          fieldSchema = z.string()
      }

      if (typeof field.required === 'boolean' && !field.required) {
        fieldSchema = fieldSchema.optional()
      }

      schemaFields[field.name] = fieldSchema
    })

    return z.object(schemaFields)
  }

  const schema = formDef?.form?.fields ? createSchema(formDef.form.fields) : z.object({})
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange' // Enable real-time validation
  })

  // Watch all form values for conditional logic
  const watchedValues = watch()

  // Real-time validation with conditional requirements
  useEffect(() => {
    if (formDef?.form?.fields) {
      const validateFields = async () => {
        const newErrors: Record<string, string> = {}
        
        for (const field of formDef.form.fields) {
          if (shouldShowField(field, watchedValues)) {
            const isRequired = isFieldRequired(field, watchedValues)
            const fieldValue = watchedValues[field.name]
            
            // Check conditional required fields
            if (isRequired && (!fieldValue || fieldValue === '')) {
              newErrors[field.name] = `${field.label} is required`
            }
            
            // Validate file uploads
            if (field.type === 'file' && fileUploads[field.name]) {
              const file = fileUploads[field.name]
              if (file) {
                // Check file type
                if (field.uiConfig?.acceptedFileTypes && field.uiConfig.acceptedFileTypes.length > 0) {
                  const isValidType = field.uiConfig.acceptedFileTypes.some(type => 
                    file.name.toLowerCase().endsWith(type.toLowerCase())
                  )
                  if (!isValidType) {
                    newErrors[field.name] = `File type not allowed. Accepted types: ${field.uiConfig.acceptedFileTypes.join(', ')}`
                  }
                }
                
                // Check file size
                if (field.uiConfig?.maxFileSize && file.size > field.uiConfig.maxFileSize) {
                  const maxSizeMB = (field.uiConfig.maxFileSize / 1024 / 1024).toFixed(1)
                  newErrors[field.name] = `File too large. Maximum size: ${maxSizeMB}MB`
                }
              }
            }
          }
        }
        
        setValidationErrors(newErrors)
      }
      
      validateFields()
    }
  }, [watchedValues, fileUploads, formDef])

  const handleFileChange = (fieldName: string, file: File | null) => {
    setFileUploads(prev => ({ ...prev, [fieldName]: file }))
    setValue(fieldName, file)
  }

  const onSubmit = async (data: any) => {
    // Check for validation errors before submitting
    if (Object.keys(validationErrors).length > 0) {
      console.error('Cannot submit form with validation errors:', validationErrors)
      return
    }

    try {
      // Include file uploads in the data
      const submitData = { ...data }
      Object.keys(fileUploads).forEach(fieldName => {
        if (fileUploads[fieldName]) {
          submitData[fieldName] = fileUploads[fieldName]
        }
      })
      
      const result = entityId
        ? await mutate('updateEntity', { entityId, data: submitData })
        : await mutate('createEntity', { modelId, entityName, data: submitData })
      
      if (onSuccess) {
        onSuccess(result)
      }
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  if (formLoading) {
    return <LoadingOverlay visible />
  }

  if (!formDef?.form) {
    return <div>Form definition not found</div>
  }

  const { form } = formDef

  // Group fields by section
  const fieldsBySection = form.fields.reduce((acc: Record<string, FormField[]>, field) => {
    const section = field.uiConfig?.section || 'default'
    if (!acc[section]) acc[section] = []
    acc[section].push(field)
    return acc
  }, {})

  const sections = Object.keys(fieldsBySection)
  const hasMultipleSections = sections.length > 1

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <LoadingOverlay visible={mutationLoading} />
      
      <Stack gap="md">
        {sections.map((sectionName, index) => {
          const sectionFields = fieldsBySection[sectionName]
          const visibleFields = sectionFields.filter(field => shouldShowField(field, watchedValues))
          
          if (visibleFields.length === 0) return null
          
          return (
            <div key={sectionName}>
              {hasMultipleSections && sectionName !== 'default' && (
                <Divider 
                  label={sectionName} 
                  labelPosition="left" 
                  mb="md" 
                  mt={index > 0 ? "xl" : undefined}
                />
              )}
              
              <Stack gap="md">
                {visibleFields.map((field: FormField) => {
                  const fieldError = errors[field.name]?.message as string || validationErrors[field.name]
                  const isRequired = isFieldRequired(field, watchedValues)
                  
                  return (
                    <FormFieldRenderer
                      key={field.id}
                      field={{ ...field, required: isRequired }}
                      register={register}
                      setValue={setValue}
                      watch={watch}
                      error={fieldError}
                      onFileChange={handleFileChange}
                      trigger={trigger}
                    />
                  )
                })}
              </Stack>
            </div>
          )
        })}
        
        {/* Show validation errors summary if any */}
        {Object.keys(validationErrors).length > 0 && (
          <Alert icon={<IconInfoCircle size={16} />} color="red" title="Please fix the following errors:">
            <Stack gap="xs">
              {Object.entries(validationErrors).map(([field, error]) => (
                <Text key={field} size="sm">• {error}</Text>
              ))}
            </Stack>
          </Alert>
        )}
        
        <Group justify="flex-end" mt="md">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              {form.cancelText || 'Cancel'}
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={Object.keys(validationErrors).length > 0}
          >
            {form.submitText || 'Submit'}
          </Button>
        </Group>
      </Stack>
    </form>
  )
}

interface FormFieldRendererProps {
  field: FormField
  register: any
  setValue: any
  watch: any
  error?: string
  onFileChange?: (fieldName: string, file: File | null) => void
  trigger?: any
}

function FormFieldRenderer({ field, register, setValue, watch, error, onFileChange, trigger }: FormFieldRendererProps) {
  const value = watch(field.name)

  const commonProps = {
    label: field.label,
    required: field.required,
    error: error,
    defaultValue: field.defaultValue,
    description: field.uiConfig?.helpText,
    placeholder: field.uiConfig?.placeholder
  }

  // Real-time validation trigger
  const handleBlur = async () => {
    if (trigger) {
      await trigger(field.name)
    }
  }

  switch (field.type) {
    case 'text':
      return (
        <TextInput
          {...commonProps}
          {...register(field.name)}
          onBlur={handleBlur}
        />
      )
    
    case 'number':
      return (
        <NumberInput
          {...commonProps}
          value={value}
          onChange={(val) => setValue(field.name, val)}
          onBlur={handleBlur}
        />
      )
    
    case 'checkbox':
      return (
        <Checkbox
          {...commonProps}
          checked={value || false}
          onChange={(event) => {
            setValue(field.name, event.currentTarget.checked)
            handleBlur()
          }}
        />
      )
    
    case 'textarea':
      return (
        <Textarea
          {...commonProps}
          {...register(field.name)}
          rows={4}
          onBlur={handleBlur}
        />
      )
    
    case 'date':
      return (
        <DateInput
          {...commonProps}
          value={value}
          onChange={(date) => {
            setValue(field.name, date)
            handleBlur()
          }}
        />
      )
    
    case 'datetime-local':
      return (
        <DateTimePicker
          {...commonProps}
          value={value}
          onChange={(date) => {
            setValue(field.name, date)
            handleBlur()
          }}
        />
      )
    
    case 'time':
      return (
        <TimeInput
          {...commonProps}
          value={value}
          onChange={(event) => {
            setValue(field.name, event.currentTarget.value)
            handleBlur()
          }}
        />
      )
    
    case 'select':
      const selectOptions = field.validation?.options || []
      return (
        <Select
          {...commonProps}
          data={selectOptions}
          value={value}
          onChange={(val) => {
            setValue(field.name, val)
            handleBlur()
          }}
        />
      )
    
    case 'multiselect':
      const multiSelectOptions = field.validation?.options || []
      return (
        <MultiSelect
          {...commonProps}
          data={multiSelectOptions}
          value={value || []}
          onChange={(val) => setValue(field.name, val)}
          onBlur={handleBlur}
        />
      )
    
    case 'file':
      return (
        <FileInput
          {...commonProps}
          leftSection={<IconUpload size={16} />}
          accept={field.uiConfig?.acceptedFileTypes?.join(',')}  
          onChange={(file) => {
            if (onFileChange) {
              onFileChange(field.name, file)
            }
            setValue(field.name, file)
          }}
          onBlur={handleBlur}
        />
      )
    
    default:
      return (
        <TextInput
          {...commonProps}
          {...register(field.name)}
          onBlur={handleBlur}
        />
      )
  }
}