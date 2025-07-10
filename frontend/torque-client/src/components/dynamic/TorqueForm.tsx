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
  LoadingOverlay
} from '@mantine/core'
import { DateInput, DateTimePicker, TimeInput } from '@mantine/dates'
import { useFormDefinition, useJsonRpcMutation } from '../../hooks/useJsonRpc'
import type { FormField } from '../../types/jsonrpc'

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

      if (!field.required) {
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
    watch
  } = useForm({
    resolver: zodResolver(schema)
  })

  const onSubmit = async (data: any) => {
    try {
      const result = entityId
        ? await mutate('updateEntity', { entityId, data })
        : await mutate('createEntity', { modelId, entityName, data })
      
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

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <LoadingOverlay visible={mutationLoading} />
      
      <Stack gap="md">
        {form.fields.map((field: FormField) => (
          <FormFieldRenderer
            key={field.id}
            field={field}
            register={register}
            setValue={setValue}
            watch={watch}
            error={errors[field.name]?.message as string}
          />
        ))}
        
        <Group justify="flex-end" mt="md">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              {form.cancelText}
            </Button>
          )}
          <Button type="submit">
            {form.submitText}
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
}

function FormFieldRenderer({ field, register, setValue, watch, error }: FormFieldRendererProps) {
  const value = watch(field.name)

  const commonProps = {
    label: field.label,
    required: field.required,
    error: error,
    defaultValue: field.defaultValue
  }

  switch (field.type) {
    case 'text':
      return (
        <TextInput
          {...commonProps}
          {...register(field.name)}
        />
      )
    
    case 'number':
      return (
        <NumberInput
          {...commonProps}
          value={value}
          onChange={(val) => setValue(field.name, val)}
        />
      )
    
    case 'checkbox':
      return (
        <Checkbox
          {...commonProps}
          checked={value || false}
          onChange={(event) => setValue(field.name, event.currentTarget.checked)}
        />
      )
    
    case 'textarea':
      return (
        <Textarea
          {...commonProps}
          {...register(field.name)}
          rows={4}
        />
      )
    
    case 'date':
      return (
        <DateInput
          {...commonProps}
          value={value}
          onChange={(date) => setValue(field.name, date)}
        />
      )
    
    case 'datetime-local':
      return (
        <DateTimePicker
          {...commonProps}
          value={value}
          onChange={(date) => setValue(field.name, date)}
        />
      )
    
    case 'time':
      return (
        <TimeInput
          {...commonProps}
          value={value}
          onChange={(event) => setValue(field.name, event.currentTarget.value)}
        />
      )
    
    case 'select':
      const selectOptions = field.validation?.options || []
      return (
        <Select
          {...commonProps}
          data={selectOptions}
          value={value}
          onChange={(val) => setValue(field.name, val)}
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
        />
      )
    
    default:
      return (
        <TextInput
          {...commonProps}
          {...register(field.name)}
        />
      )
  }
}