import { useState } from 'react'
import {
  Stack,
  Button,
  Text,
  Title,
  Group,
  Paper,
  Alert,
} from '@mantine/core'
import { IconPlus, IconAlertCircle } from '@tabler/icons-react'
import { v4 as uuidv4 } from 'uuid'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { Field, FieldType, Entity } from '../../types/model'
import { FieldEditor } from './FieldEditor'

interface EntityFieldsEditorProps {
  fields: Field[]
  onChange: (fields: Field[]) => void
  entityNames?: string[] // For reference fields
}

export function EntityFieldsEditor({ fields, onChange, entityNames = [] }: EntityFieldsEditorProps) {
  const handleFieldAdd = () => {
    const newField: Field = {
      id: uuidv4(),
      name: '',
      displayName: '',
      fieldType: FieldType.String,
      required: false,
      validation: [],
      uiConfig: {},
    }
    onChange([...fields, newField])
  }

  const handleFieldChange = (index: number, field: Field) => {
    const newFields = [...fields]
    newFields[index] = field
    onChange(newFields)
  }

  const handleFieldRemove = (index: number) => {
    onChange(fields.filter((_, i) => i !== index))
  }

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(fields)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    onChange(items)
  }

  const validateFields = () => {
    const errors: string[] = []
    const fieldNames = new Set<string>()

    fields.forEach((field, index) => {
      if (!field.name) {
        errors.push(`Field ${index + 1} is missing a name`)
      } else if (fieldNames.has(field.name)) {
        errors.push(`Duplicate field name: ${field.name}`)
      } else {
        fieldNames.add(field.name)
      }

      if (!field.displayName) {
        errors.push(`Field ${field.name || index + 1} is missing a display name`)
      }

      // Validate field-specific configuration
      if (field.fieldType === FieldType.Reference && !field.uiConfig?.referenceEntity) {
        errors.push(`Reference field ${field.name || index + 1} must specify a target entity`)
      }

      if (field.fieldType === FieldType.Enum && (!field.uiConfig?.enumValues || field.uiConfig.enumValues.length === 0)) {
        errors.push(`Enum field ${field.name || index + 1} must have at least one value`)
      }
    })

    return errors
  }

  const validationErrors = validateFields()

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={4}>Fields</Title>
        <Button
          size="sm"
          leftSection={<IconPlus size={16} />}
          onClick={handleFieldAdd}
        >
          Add Field
        </Button>
      </Group>

      {validationErrors.length > 0 && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Validation Errors"
          color="red"
          variant="light"
        >
          <Stack gap="xs">
            {validationErrors.map((error, index) => (
              <Text key={index} size="sm">{error}</Text>
            ))}
          </Stack>
        </Alert>
      )}

      {fields.length === 0 ? (
        <Paper p="xl" withBorder ta="center">
          <Stack align="center" gap="md">
            <Text c="dimmed">No fields defined yet</Text>
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={handleFieldAdd}
            >
              Add First Field
            </Button>
          </Stack>
        </Paper>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="fields">
            {(provided) => (
              <Stack
                {...provided.droppableProps}
                ref={provided.innerRef}
                gap="md"
              >
                {fields.map((field, index) => (
                  <Draggable
                    key={field.id}
                    draggableId={field.id}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={{
                          ...provided.draggableProps.style,
                          opacity: snapshot.isDragging ? 0.8 : 1,
                        }}
                      >
                        <FieldEditor
                          field={field}
                          onChange={(field) => handleFieldChange(index, field)}
                          onRemove={() => handleFieldRemove(index)}
                          entityNames={entityNames}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </Stack>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </Stack>
  )
}