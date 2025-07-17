import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client'
import {
  Container,
  Paper,
  Title,
  TextInput,
  Textarea,
  Button,
  Stack,
  Group,
  Alert,
  Loader,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconAlertCircle } from '@tabler/icons-react'

import { GET_MODEL } from '../graphql/queries'
import { CREATE_ENTITY, UPDATE_ENTITY } from '../graphql/mutations'
import { EntityFieldsEditor } from '../components/EntityEditor'
import { Model, Field } from '../types/model'

export function EntityEditorPage() {
  const { modelId, entityId } = useParams<{ modelId: string; entityId?: string }>()
  const navigate = useNavigate()
  const isEditMode = !!entityId
  
  // Fetch model data
  const { data, loading, error } = useQuery(GET_MODEL, {
    variables: { id: modelId },
    skip: !modelId,
  })

  const model = data?.model as Model

  // Find existing entity if in edit mode
  const existingEntity = isEditMode && model?.entities
    ? model.entities.find(e => e.id === entityId)
    : null

  // Form state
  const entityForm = useForm({
    initialValues: {
      name: '',
      displayName: '',
      description: '',
      fields: [] as Field[],
    },
    validate: {
      name: (value) => {
        if (!value) return 'Entity name is required'
        if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(value)) {
          return 'Entity name must start with a letter and contain only letters, numbers, and underscores'
        }
        return null
      },
      displayName: (value) => (!value ? 'Display name is required' : null),
    },
  })

  // Set form values when entity is loaded
  useEffect(() => {
    if (existingEntity) {
      // Normalize fields to ensure validation is always an array
      const normalizedFields = (existingEntity.fields || []).map(field => ({
        ...field,
        validation: Array.isArray(field.validation) ? field.validation : []
      }))
      
      entityForm.setValues({
        name: existingEntity.name,
        displayName: existingEntity.displayName || existingEntity.name,
        description: existingEntity.description || '',
        fields: normalizedFields,
      })
    }
  }, [existingEntity])

  // Mutations
  const [createEntity, { loading: creatingEntity }] = useMutation(CREATE_ENTITY, {
    refetchQueries: [{ query: GET_MODEL, variables: { id: modelId } }],
    onCompleted: () => {
      notifications.show({
        title: 'Success',
        message: 'Entity created successfully',
        color: 'green',
      })
      navigate(`/models/${modelId}?tab=entities`)
    },
    onError: (error) => {
      notifications.show({
        title: 'Error',
        message: error.message,
        color: 'red',
      })
    },
  })

  const [updateEntity, { loading: updatingEntity }] = useMutation(UPDATE_ENTITY, {
    refetchQueries: [{ query: GET_MODEL, variables: { id: modelId } }],
    onCompleted: () => {
      notifications.show({
        title: 'Success',
        message: 'Entity updated successfully',
        color: 'green',
      })
      navigate(`/models/${modelId}?tab=entities`)
    },
    onError: (error) => {
      notifications.show({
        title: 'Error',
        message: error.message,
        color: 'red',
      })
    },
  })

  const handleSaveEntity = (values: typeof entityForm.values) => {
    if (isEditMode && existingEntity) {
      updateEntity({
        variables: {
          id: existingEntity.id,
          input: {
            name: values.name,
            displayName: values.displayName,
            description: values.description,
            fields: values.fields.map(field => ({
              name: field.name,
              displayName: field.displayName,
              fieldType: field.fieldType,
              required: field.required,
              validation: field.validation || [],
              defaultValue: field.defaultValue,
            })),
          },
        },
      })
    } else {
      createEntity({
        variables: {
          input: {
            modelId: modelId,
            name: values.name,
            displayName: values.displayName,
            description: values.description,
            fields: values.fields.map(field => ({
              name: field.name,
              displayName: field.displayName,
              fieldType: field.fieldType,
              required: field.required,
              validation: field.validation || [],
              defaultValue: field.defaultValue,
            })),
          },
        },
      })
    }
  }

  const handleCancel = () => {
    navigate(`/models/${modelId}?tab=entities`)
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
          {isEditMode ? 'Edit Entity' : 'Create New Entity'}
        </Title>
        
        <form onSubmit={entityForm.onSubmit(handleSaveEntity)}>
          <Stack gap="md">
            <TextInput
              label="Entity Name"
              placeholder="e.g., Customer, Order, Product"
              required
              disabled={isEditMode}
              {...entityForm.getInputProps('name')}
            />
            
            <TextInput
              label="Display Name"
              placeholder="e.g., Customer, Order, Product"
              required
              {...entityForm.getInputProps('displayName')}
            />
            
            <Textarea
              label="Description"
              placeholder="Describe what this entity represents"
              rows={3}
              {...entityForm.getInputProps('description')}
            />
            
            <EntityFieldsEditor
              fields={entityForm.values.fields}
              onChange={(fields) => entityForm.setFieldValue('fields', fields)}
            />
            
            <Group justify="flex-end" mt="md">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                loading={creatingEntity || updatingEntity}
              >
                {isEditMode ? 'Update Entity' : 'Create Entity'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  )
}