import { useState } from 'react'
import {
  Stack,
  TextInput,
  Select,
  Switch,
  Button,
  Group,
  Paper,
  Text,
  ActionIcon,
  Collapse,
  NumberInput,
  JsonInput,
  Badge,
  Divider,
  Tooltip,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconTrash,
  IconChevronDown,
  IconChevronRight,
  IconPlus,
  IconInfoCircle,
} from '@tabler/icons-react'
import { Field, FieldType, FieldValidationRule, ValidationSeverity } from '../../types/model'

interface FieldEditorProps {
  field: Field
  onChange: (field: Field) => void
  onRemove: () => void
  entityNames?: string[] // For reference field type
}

export function FieldEditor({ field, onChange, onRemove, entityNames = [] }: FieldEditorProps) {
  const [expanded, { toggle }] = useDisclosure(false)
  const [validationExpanded, { toggle: toggleValidation }] = useDisclosure(false)
  
  // Ensure validation is always an array
  const normalizedField = {
    ...field,
    validation: Array.isArray(field.validation) ? field.validation : []
  }

  const handleFieldChange = (key: keyof Field, value: any) => {
    onChange({ ...field, [key]: value })
  }

  const handleValidationRuleAdd = () => {
    const newRule: FieldValidationRule = {
      validationType: { type: 'required' },
      message: 'This field is required',
      severity: ValidationSeverity.Error,
    }
    handleFieldChange('validation', [...normalizedField.validation, newRule])
  }

  const handleValidationRuleChange = (index: number, rule: FieldValidationRule) => {
    const newValidation = [...normalizedField.validation]
    newValidation[index] = rule
    handleFieldChange('validation', newValidation)
  }

  const handleValidationRuleRemove = (index: number) => {
    const newValidation = normalizedField.validation.filter((_, i) => i !== index)
    handleFieldChange('validation', newValidation)
  }

  const getFieldTypeOptions = () => [
    { value: FieldType.String, label: 'String' },
    { value: FieldType.Integer, label: 'Integer' },
    { value: FieldType.Float, label: 'Float' },
    { value: FieldType.Boolean, label: 'Boolean' },
    { value: FieldType.DateTime, label: 'DateTime' },
    { value: FieldType.Date, label: 'Date' },
    { value: FieldType.Time, label: 'Time' },
    { value: FieldType.Json, label: 'JSON' },
    { value: FieldType.Binary, label: 'Binary' },
    { value: FieldType.Enum, label: 'Enum' },
    { value: FieldType.Reference, label: 'Reference' },
    { value: FieldType.Array, label: 'Array' },
  ]

  const renderDefaultValueInput = () => {
    switch (field.fieldType) {
      case FieldType.String:
      case FieldType.Date:
      case FieldType.Time:
      case FieldType.DateTime:
        return (
          <TextInput
            label="Default Value"
            placeholder="Enter default value"
            value={field.defaultValue || ''}
            onChange={(e) => handleFieldChange('defaultValue', e.target.value)}
          />
        )
      case FieldType.Integer:
      case FieldType.Float:
        return (
          <NumberInput
            label="Default Value"
            placeholder="Enter default value"
            value={field.defaultValue || ''}
            onChange={(value) => handleFieldChange('defaultValue', value)}
          />
        )
      case FieldType.Boolean:
        return (
          <Switch
            label="Default Value"
            checked={field.defaultValue || false}
            onChange={(e) => handleFieldChange('defaultValue', e.target.checked)}
          />
        )
      case FieldType.Json:
        return (
          <JsonInput
            label="Default Value"
            placeholder="Enter JSON value"
            value={field.defaultValue ? JSON.stringify(field.defaultValue) : ''}
            onChange={(value) => {
              try {
                handleFieldChange('defaultValue', value ? JSON.parse(value) : null)
              } catch {}
            }}
            formatOnBlur
            autosize
            minRows={2}
          />
        )
      default:
        return null
    }
  }

  return (
    <Paper p="md" withBorder>
      <Stack gap="sm">
        {/* Field Header */}
        <Group justify="space-between">
          <Group>
            <ActionIcon
              variant="subtle"
              size="sm"
              onClick={toggle}
            >
              {expanded ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
            </ActionIcon>
            <Text fw={500}>{field.displayName || field.name || 'New Field'}</Text>
            <Badge size="sm" variant="light">
              {field.fieldType}
            </Badge>
            {field.required && (
              <Badge size="sm" color="red" variant="light">
                Required
              </Badge>
            )}
          </Group>
          <Tooltip label="Remove field">
            <ActionIcon
              color="red"
              variant="subtle"
              size="sm"
              onClick={onRemove}
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>

        {/* Expanded Field Details */}
        <Collapse in={expanded}>
          <Stack gap="sm">
            <Group grow>
              <TextInput
                label="Field Name"
                description="Internal name (no spaces)"
                placeholder="user_name, email_address"
                required
                value={field.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
              />
              <TextInput
                label="Display Name"
                description="User-friendly name"
                placeholder="User Name, Email Address"
                required
                value={field.displayName}
                onChange={(e) => handleFieldChange('displayName', e.target.value)}
              />
            </Group>

            <Group grow>
              <Select
                label="Field Type"
                data={getFieldTypeOptions()}
                value={field.fieldType}
                onChange={(value) => handleFieldChange('fieldType', value as FieldType)}
              />
              <Switch
                label="Required"
                checked={field.required}
                onChange={(e) => handleFieldChange('required', e.target.checked)}
              />
            </Group>

            {renderDefaultValueInput()}

            {/* Field Type Specific Configuration */}
            {field.fieldType === FieldType.String && (
              <NumberInput
                label="Max Length"
                placeholder="255"
                value={field.uiConfig?.maxLength}
                onChange={(value) => 
                  handleFieldChange('uiConfig', { ...field.uiConfig, maxLength: value })
                }
              />
            )}

            {field.fieldType === FieldType.Enum && (
              <TextInput
                label="Enum Values"
                description="Comma-separated values"
                placeholder="active, inactive, pending"
                value={field.uiConfig?.enumValues?.join(', ') || ''}
                onChange={(e) => {
                  const values = e.target.value.split(',').map(v => v.trim()).filter(Boolean)
                  handleFieldChange('uiConfig', { ...field.uiConfig, enumValues: values })
                }}
              />
            )}

            {field.fieldType === FieldType.Reference && (
              <Select
                label="Reference Entity"
                placeholder="Select entity"
                data={entityNames}
                value={field.uiConfig?.referenceEntity}
                onChange={(value) => 
                  handleFieldChange('uiConfig', { ...field.uiConfig, referenceEntity: value })
                }
              />
            )}

            <Divider />

            {/* Validation Rules Section */}
            <Stack gap="xs">
              <Group justify="space-between">
                <Group>
                  <Text size="sm" fw={500}>Validation Rules</Text>
                  <ActionIcon
                    variant="subtle"
                    size="xs"
                    onClick={toggleValidation}
                  >
                    {validationExpanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
                  </ActionIcon>
                </Group>
                <Button
                  size="xs"
                  variant="light"
                  leftSection={<IconPlus size={14} />}
                  onClick={handleValidationRuleAdd}
                >
                  Add Rule
                </Button>
              </Group>

              <Collapse in={validationExpanded}>
                <Stack gap="xs">
                  {normalizedField.validation.map((rule, index) => (
                    <ValidationRuleEditor
                      key={index}
                      rule={rule}
                      fieldType={field.fieldType}
                      onChange={(newRule) => handleValidationRuleChange(index, newRule)}
                      onRemove={() => handleValidationRuleRemove(index)}
                    />
                  ))}
                  {normalizedField.validation.length === 0 && (
                    <Text size="sm" c="dimmed" ta="center" py="sm">
                      No validation rules defined
                    </Text>
                  )}
                </Stack>
              </Collapse>
            </Stack>
          </Stack>
        </Collapse>
      </Stack>
    </Paper>
  )
}

interface ValidationRuleEditorProps {
  rule: FieldValidationRule
  fieldType: FieldType
  onChange: (rule: FieldValidationRule) => void
  onRemove: () => void
}

function ValidationRuleEditor({ rule, fieldType, onChange, onRemove }: ValidationRuleEditorProps) {
  const getValidationTypeOptions = () => {
    const commonOptions = [
      { value: 'required', label: 'Required' },
      { value: 'custom', label: 'Custom Expression' },
    ]

    switch (fieldType) {
      case FieldType.String:
        return [
          ...commonOptions,
          { value: 'minLength', label: 'Min Length' },
          { value: 'maxLength', label: 'Max Length' },
          { value: 'pattern', label: 'Pattern (Regex)' },
          { value: 'email', label: 'Email Format' },
          { value: 'url', label: 'URL Format' },
        ]
      case FieldType.Integer:
      case FieldType.Float:
        return [
          ...commonOptions,
          { value: 'min', label: 'Minimum Value' },
          { value: 'max', label: 'Maximum Value' },
          { value: 'range', label: 'Range' },
        ]
      case FieldType.Date:
      case FieldType.DateTime:
        return [
          ...commonOptions,
          { value: 'minDate', label: 'Min Date' },
          { value: 'maxDate', label: 'Max Date' },
          { value: 'dateRange', label: 'Date Range' },
        ]
      default:
        return commonOptions
    }
  }

  const renderValidationConfig = () => {
    const validationType = rule.validationType?.type

    switch (validationType) {
      case 'minLength':
      case 'maxLength':
        return (
          <NumberInput
            label="Length"
            value={rule.validationType.value}
            onChange={(value) => onChange({
              ...rule,
              validationType: { ...rule.validationType, value }
            })}
            min={0}
          />
        )
      case 'min':
      case 'max':
        return (
          <NumberInput
            label="Value"
            value={rule.validationType.value}
            onChange={(value) => onChange({
              ...rule,
              validationType: { ...rule.validationType, value }
            })}
          />
        )
      case 'pattern':
        return (
          <TextInput
            label="Pattern (Regex)"
            placeholder="^[A-Za-z]+$"
            value={rule.validationType.pattern}
            onChange={(e) => onChange({
              ...rule,
              validationType: { ...rule.validationType, pattern: e.target.value }
            })}
          />
        )
      case 'custom':
        return (
          <TextInput
            label="Expression"
            placeholder="value.length > 0 && value.length < 100"
            value={rule.validationType.expression}
            onChange={(e) => onChange({
              ...rule,
              validationType: { ...rule.validationType, expression: e.target.value }
            })}
          />
        )
      default:
        return null
    }
  }

  return (
    <Paper p="sm" withBorder>
      <Stack gap="xs">
        <Group justify="space-between">
          <Select
            size="sm"
            data={getValidationTypeOptions()}
            value={rule.validationType?.type}
            onChange={(value) => onChange({
              ...rule,
              validationType: { ...rule.validationType, type: value }
            })}
            style={{ flex: 1 }}
          />
          <ActionIcon
            color="red"
            variant="subtle"
            size="sm"
            onClick={onRemove}
          >
            <IconTrash size={14} />
          </ActionIcon>
        </Group>

        {renderValidationConfig()}

        <TextInput
          size="sm"
          label="Error Message"
          value={rule.message}
          onChange={(e) => onChange({ ...rule, message: e.target.value })}
        />

        <Select
          size="sm"
          label="Severity"
          data={[
            { value: ValidationSeverity.Error, label: 'Error' },
            { value: ValidationSeverity.Warning, label: 'Warning' },
            { value: ValidationSeverity.Info, label: 'Info' },
          ]}
          value={rule.severity}
          onChange={(value) => onChange({ ...rule, severity: value as ValidationSeverity })}
        />
      </Stack>
    </Paper>
  )
}