import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client'
import {
  Container,
  Paper,
  Title,
  TextInput,
  Select,
  Button,
  Stack,
  Group,
  Alert,
  Loader,
  Text,
  Divider,
  Radio,
  Box,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconAlertCircle } from '@tabler/icons-react'

import { GET_MODEL } from '../graphql/queries'
import { CREATE_RELATIONSHIP, UPDATE_RELATIONSHIP } from '../graphql/mutations'
import { UPDATE_ENTITY } from '../graphql/mutations'
import { Model, RelationshipType, CascadeAction, FieldType } from '../types/model'

type FieldSelectionMode = 'existing' | 'new'

interface FieldSelection {
  mode: FieldSelectionMode
  existingFieldId?: string
  newFieldName?: string
}

export function RelationshipEditorPage() {
  const { id: modelId, relationshipId } = useParams<{ id: string; relationshipId?: string }>()
  const navigate = useNavigate()
  const isEditMode = !!relationshipId
  
  // Fetch model data
  const { data, loading, error } = useQuery(GET_MODEL, {
    variables: { id: modelId },
    skip: !modelId,
  })

  const model = data?.model as Model

  // Find existing relationship if in edit mode
  const existingRelationship = isEditMode && model?.relationships
    ? model.relationships.find(r => r.id === relationshipId)
    : null

  // Field selection state
  const [fromFieldSelection, setFromFieldSelection] = useState<FieldSelection>({
    mode: 'existing',
    existingFieldId: '',
    newFieldName: '',
  })
  
  const [toFieldSelection, setToFieldSelection] = useState<FieldSelection>({
    mode: 'existing',
    existingFieldId: '',
    newFieldName: '',
  })

  // Form state
  const relationshipForm = useForm({
    initialValues: {
      name: '',
      relationshipType: RelationshipType.OneToMany,
      fromEntity: '',
      toEntity: '',
      fromField: '',
      toField: '',
      cascade: CascadeAction.None,
    },
    validate: {
      name: (value) => {
        if (!value) return 'Relationship name is required'
        if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(value)) {
          return 'Name must start with a letter and contain only letters, numbers, and underscores'
        }
        return null
      },
      fromEntity: (value) => (!value ? 'Source entity is required' : null),
      toEntity: (value) => (!value ? 'Target entity is required' : null),
    },
  })

  // Set form values when relationship is loaded
  useEffect(() => {
    if (existingRelationship) {
      relationshipForm.setValues({
        name: existingRelationship.name,
        relationshipType: existingRelationship.relationshipType,
        fromEntity: existingRelationship.fromEntity,
        toEntity: existingRelationship.toEntity,
        fromField: existingRelationship.fromField,
        toField: existingRelationship.toField,
        cascade: existingRelationship.cascade,
      })
      
      // Set field selections to existing mode with the current field IDs
      setFromFieldSelection({
        mode: 'existing',
        existingFieldId: existingRelationship.fromField,
        newFieldName: '',
      })
      
      setToFieldSelection({
        mode: 'existing',
        existingFieldId: existingRelationship.toField,
        newFieldName: '',
      })
    }
  }, [existingRelationship])

  // Get entity options
  const entityOptions = model?.entities?.map(entity => ({
    value: entity.id,
    label: entity.displayName || entity.name,
  })) || []

  // Helper function to determine the appropriate field type for a relationship
  const getRelationshipFieldType = (): FieldType => {
    // For relationships, we use Reference type which points to the ID of the target entity
    return FieldType.Reference
  }

  // Helper function to validate if a field type is valid for a relationship
  const isValidRelationshipField = (fieldType: FieldType): boolean => {
    // For relationships, we accept Reference, String (for ID storage), or Integer types
    return [FieldType.Reference, FieldType.String, FieldType.Integer].includes(fieldType)
  }

  // Get field options for selected entities (only show valid field types)
  const getFieldOptions = (entityId: string) => {
    const entity = model?.entities?.find(e => e.id === entityId)
    return entity?.fields
      ?.filter(field => isValidRelationshipField(field.fieldType))
      .map(field => ({
        value: field.id,
        label: `${field.displayName || field.name} (${field.fieldType})`,
      })) || []
  }

  const fromFieldOptions = getFieldOptions(relationshipForm.values.fromEntity)
  const toFieldOptions = getFieldOptions(relationshipForm.values.toEntity)


  // Mutations
  const [createRelationship, { loading: creatingRelationship }] = useMutation(CREATE_RELATIONSHIP, {
    refetchQueries: [{ query: GET_MODEL, variables: { id: modelId } }],
    onCompleted: () => {
      notifications.show({
        title: 'Success',
        message: 'Relationship created successfully',
        color: 'green',
      })
      navigate(`/models/${modelId}?tab=relationships`)
    },
    onError: (error) => {
      notifications.show({
        title: 'Error',
        message: error.message,
        color: 'red',
      })
    },
  })

  const [updateRelationship, { loading: updatingRelationship }] = useMutation(UPDATE_RELATIONSHIP, {
    refetchQueries: [{ query: GET_MODEL, variables: { id: modelId } }],
    onCompleted: () => {
      notifications.show({
        title: 'Success',
        message: 'Relationship updated successfully',
        color: 'green',
      })
      navigate(`/models/${modelId}?tab=relationships`)
    },
    onError: (error) => {
      notifications.show({
        title: 'Error',
        message: error.message,
        color: 'red',
      })
    },
  })

  const [updateEntity] = useMutation(UPDATE_ENTITY)

  const handleSaveRelationship = async (values: typeof relationshipForm.values) => {
    try {
      // Validate field selections
      if (fromFieldSelection.mode === 'existing' && !fromFieldSelection.existingFieldId) {
        notifications.show({
          title: 'Validation Error',
          message: 'Please select a source field',
          color: 'red',
        })
        return
      }
      
      if (fromFieldSelection.mode === 'new' && !fromFieldSelection.newFieldName) {
        notifications.show({
          title: 'Validation Error',
          message: 'Please enter a name for the new source field',
          color: 'red',
        })
        return
      }
      
      if (toFieldSelection.mode === 'existing' && !toFieldSelection.existingFieldId) {
        notifications.show({
          title: 'Validation Error',
          message: 'Please select a target field',
          color: 'red',
        })
        return
      }
      
      if (toFieldSelection.mode === 'new' && !toFieldSelection.newFieldName) {
        notifications.show({
          title: 'Validation Error',
          message: 'Please enter a name for the new target field',
          color: 'red',
        })
        return
      }

      // First, handle field creation if needed
      let actualFromFieldId = fromFieldSelection.existingFieldId
      let actualToFieldId = toFieldSelection.existingFieldId

      // Create new fields if necessary
      if (fromFieldSelection.mode === 'new' && fromFieldSelection.newFieldName) {
        const fromEntity = model?.entities?.find(e => e.id === values.fromEntity)
        if (fromEntity) {
          const newFieldId = `field_${Date.now()}_from`
          const newField = {
            id: newFieldId,
            name: fromFieldSelection.newFieldName,
            displayName: fromFieldSelection.newFieldName,
            fieldType: getRelationshipFieldType(),
            required: false,
            validation: [],
          }
          
          await updateEntity({
            variables: {
              id: fromEntity.id,
              input: {
                name: fromEntity.name,
                displayName: fromEntity.displayName,
                description: fromEntity.description,
                fields: [...(fromEntity.fields || []), newField].map(f => ({
                  name: f.name,
                  displayName: f.displayName,
                  fieldType: f.fieldType,
                  required: f.required,
                  validation: f.validation || [],
                  defaultValue: 'defaultValue' in f ? f.defaultValue : undefined,
                  description: 'description' in f ? f.description : undefined,
                })),
              },
            },
          })
          actualFromFieldId = newFieldId
        }
      }

      if (toFieldSelection.mode === 'new' && toFieldSelection.newFieldName) {
        const toEntity = model?.entities?.find(e => e.id === values.toEntity)
        if (toEntity) {
          const newFieldId = `field_${Date.now()}_to`
          const newField = {
            id: newFieldId,
            name: toFieldSelection.newFieldName,
            displayName: toFieldSelection.newFieldName,
            fieldType: getRelationshipFieldType(),
            required: false,
            validation: [],
          }
          
          await updateEntity({
            variables: {
              id: toEntity.id,
              input: {
                name: toEntity.name,
                displayName: toEntity.displayName,
                description: toEntity.description,
                fields: [...(toEntity.fields || []), newField].map(f => ({
                  name: f.name,
                  displayName: f.displayName,
                  fieldType: f.fieldType,
                  required: f.required,
                  validation: f.validation || [],
                  defaultValue: 'defaultValue' in f ? f.defaultValue : undefined,
                  description: 'description' in f ? f.description : undefined,
                })),
              },
            },
          })
          actualToFieldId = newFieldId
        }
      }

      // Now create or update the relationship
      if (isEditMode && existingRelationship) {
        updateRelationship({
          variables: {
            id: existingRelationship.id,
            input: {
              name: values.name,
              relationshipType: values.relationshipType,
              fromEntity: values.fromEntity,
              toEntity: values.toEntity,
              fromField: actualFromFieldId,
              toField: actualToFieldId,
              cascade: values.cascade,
            },
          },
        })
      } else {
        createRelationship({
          variables: {
            input: {
              modelId: modelId,
              name: values.name,
              relationshipType: values.relationshipType,
              fromEntity: values.fromEntity,
              toEntity: values.toEntity,
              fromField: actualFromFieldId,
              toField: actualToFieldId,
              cascade: values.cascade,
            },
          },
        })
      }
    } catch (error) {
      console.error('Error saving relationship:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to save relationship',
        color: 'red',
      })
    }
  }

  const handleCancel = () => {
    navigate(`/models/${modelId}?tab=relationships`)
  }

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Group justify="center">
          <Loader size="lg" />
        </Group>
      </Container>
    )
  }

  if (error) {
    return (
      <Container size="xl" py="xl">
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Error loading model"
          color="red"
        >
          {error.message}
        </Alert>
      </Container>
    )
  }

  if (!model) {
    return (
      <Container size="xl" py="xl">
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Model not found"
          color="red"
        >
          The requested model could not be found.
        </Alert>
      </Container>
    )
  }

  return (
    <Container size="xl" py="xl">
      <Paper shadow="sm" p="xl" withBorder>
        <Title order={2} mb="xl">
          {isEditMode ? 'Edit Relationship' : 'Create New Relationship'}
        </Title>
        
        <form onSubmit={relationshipForm.onSubmit(handleSaveRelationship)}>
          <Stack gap="md">
            <TextInput
              label="Relationship Name"
              placeholder="e.g., customer_orders, user_profile"
              required
              disabled={isEditMode}
              {...relationshipForm.getInputProps('name')}
            />
            
            <Select
              label="Relationship Type"
              placeholder="Select relationship type"
              required
              data={[
                { value: RelationshipType.OneToOne, label: 'One to One' },
                { value: RelationshipType.OneToMany, label: 'One to Many' },
                { value: RelationshipType.ManyToOne, label: 'Many to One' },
                { value: RelationshipType.ManyToMany, label: 'Many to Many' },
              ]}
              {...relationshipForm.getInputProps('relationshipType')}
            />

            <Divider label="Source Entity" labelPosition="left" />
            
            <Stack gap="md">
              <Select
                label="From Entity"
                placeholder="Select source entity"
                required
                searchable
                data={entityOptions}
                {...relationshipForm.getInputProps('fromEntity')}
                onChange={(value) => {
                  relationshipForm.setFieldValue('fromEntity', value || '')
                  // Reset field selections when entity changes
                  setFromFieldSelection({
                    mode: 'existing',
                    existingFieldId: '',
                    newFieldName: '',
                  })
                }}
              />
              
              {relationshipForm.values.fromEntity && (
                <Box>
                  <Radio.Group
                    label="From Field"
                    value={fromFieldSelection.mode}
                    onChange={(value) => {
                      setFromFieldSelection({
                        ...fromFieldSelection,
                        mode: value as FieldSelectionMode,
                      })
                    }}
                  >
                    <Group mt="xs">
                      <Radio value="existing" label="Select existing field" />
                      <Radio value="new" label="Create new field" />
                    </Group>
                  </Radio.Group>
                  
                  <Box mt="sm">
                    {fromFieldSelection.mode === 'existing' ? (
                      <Select
                        placeholder="Select source field"
                        required
                        searchable
                        data={fromFieldOptions}
                        value={fromFieldSelection.existingFieldId}
                        onChange={(value) => {
                          setFromFieldSelection({
                            ...fromFieldSelection,
                            existingFieldId: value || '',
                          })
                        }}
                        error={!fromFieldSelection.existingFieldId && 'Field is required'}
                      />
                    ) : (
                      <TextInput
                        placeholder="Enter new field name (e.g., customerId)"
                        required
                        value={fromFieldSelection.newFieldName}
                        onChange={(event) => {
                          const value = event.currentTarget.value
                          // Convert to camelCase and remove spaces
                          const fieldName = value.replace(/\s+/g, '')
                          setFromFieldSelection({
                            ...fromFieldSelection,
                            newFieldName: fieldName,
                          })
                        }}
                        error={fromFieldSelection.newFieldName && !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(fromFieldSelection.newFieldName) && 'Field name must start with a letter and contain only letters, numbers, and underscores'}
                        description={`Will create a ${getRelationshipFieldType()} field`}
                      />
                    )}
                  </Box>
                </Box>
              )}
            </Stack>

            <Divider label="Target Entity" labelPosition="left" />
            
            <Stack gap="md">
              <Select
                label="To Entity"
                placeholder="Select target entity"
                required
                searchable
                data={entityOptions}
                {...relationshipForm.getInputProps('toEntity')}
                onChange={(value) => {
                  relationshipForm.setFieldValue('toEntity', value || '')
                  // Reset field selections when entity changes
                  setToFieldSelection({
                    mode: 'existing',
                    existingFieldId: '',
                    newFieldName: '',
                  })
                }}
              />
              
              {relationshipForm.values.toEntity && (
                <Box>
                  <Radio.Group
                    label="To Field"
                    value={toFieldSelection.mode}
                    onChange={(value) => {
                      setToFieldSelection({
                        ...toFieldSelection,
                        mode: value as FieldSelectionMode,
                      })
                    }}
                  >
                    <Group mt="xs">
                      <Radio value="existing" label="Select existing field" />
                      <Radio value="new" label="Create new field" />
                    </Group>
                  </Radio.Group>
                  
                  <Box mt="sm">
                    {toFieldSelection.mode === 'existing' ? (
                      <Select
                        placeholder="Select target field"
                        required
                        searchable
                        data={toFieldOptions}
                        value={toFieldSelection.existingFieldId}
                        onChange={(value) => {
                          setToFieldSelection({
                            ...toFieldSelection,
                            existingFieldId: value || '',
                          })
                        }}
                        error={!toFieldSelection.existingFieldId && 'Field is required'}
                      />
                    ) : (
                      <TextInput
                        placeholder="Enter new field name (e.g., orderId)"
                        required
                        value={toFieldSelection.newFieldName}
                        onChange={(event) => {
                          const value = event.currentTarget.value
                          // Convert to camelCase and remove spaces
                          const fieldName = value.replace(/\s+/g, '')
                          setToFieldSelection({
                            ...toFieldSelection,
                            newFieldName: fieldName,
                          })
                        }}
                        error={toFieldSelection.newFieldName && !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(toFieldSelection.newFieldName) && 'Field name must start with a letter and contain only letters, numbers, and underscores'}
                        description={`Will create a ${getRelationshipFieldType()} field`}
                      />
                    )}
                  </Box>
                </Box>
              )}
            </Stack>

            <Divider label="Cascade Options" labelPosition="left" />
            
            <Select
              label="Cascade Action"
              placeholder="Select cascade action"
              required
              data={[
                { value: CascadeAction.None, label: 'None - No cascade action' },
                { value: CascadeAction.Delete, label: 'Delete - Delete related records' },
                { value: CascadeAction.SetNull, label: 'Set Null - Set foreign key to null' },
                { value: CascadeAction.Restrict, label: 'Restrict - Prevent deletion if related records exist' },
              ]}
              {...relationshipForm.getInputProps('cascade')}
            />

            <Group mt="xs">
              <Alert icon={<IconAlertCircle size={16} />} color="blue">
                <Text size="sm">
                  Relationships define how entities connect to each other. The relationship type determines
                  the cardinality, while cascade actions control what happens when related records are deleted.
                </Text>
              </Alert>
            </Group>
            
            <Group justify="flex-end" mt="md">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                loading={creatingRelationship || updatingRelationship}
              >
                {isEditMode ? 'Update Relationship' : 'Create Relationship'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  )
}