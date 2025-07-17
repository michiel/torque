import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client'
import {
  Container,
  Paper,
  Title,
  TextInput,
  Textarea,
  Select,
  Button,
  Stack,
  Group,
  Alert,
  Loader,
  Text,
  Divider,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconAlertCircle } from '@tabler/icons-react'

import { GET_MODEL } from '../graphql/queries'
import { UPDATE_MODEL, UPDATE_MODEL_CONFIG } from '../graphql/mutations'
import { Model, Layout } from '../types/model'

export function ModelDetailsPage() {
  const { modelId } = useParams<{ modelId: string }>()
  const navigate = useNavigate()
  
  // Fetch model data
  const { data, loading, error } = useQuery(GET_MODEL, {
    variables: { id: modelId },
    skip: !modelId,
  })

  const model = data?.model as Model

  // Form state
  const form = useForm({
    initialValues: {
      name: '',
      description: '',
      startPageLayoutId: '',
    },
    validate: {
      name: (value) => {
        if (!value) return 'Model name is required'
        if (!/^[a-zA-Z][a-zA-Z0-9_\s]*$/.test(value)) {
          return 'Name must start with a letter and contain only letters, numbers, spaces, and underscores'
        }
        return null
      },
    },
  })

  // Set form values when model is loaded
  useEffect(() => {
    if (model) {
      form.setValues({
        name: model.name,
        description: model.description || '',
        startPageLayoutId: model.config?.custom?.startPageLayoutId || '',
      })
    }
  }, [model])

  // Get layout options for the start page dropdown
  const layoutOptions = model?.layouts?.map(layout => ({
    value: layout.id,
    label: `${layout.name} (${layout.layoutType})`,
  })) || []

  // Add empty option for no start page
  const startPageOptions = [
    { value: '', label: 'No start page (default)' },
    ...layoutOptions,
  ]

  // Mutations
  const [updateModel, { loading: updatingModel }] = useMutation(UPDATE_MODEL, {
    refetchQueries: [{ query: GET_MODEL, variables: { id: modelId } }],
    onError: (error) => {
      notifications.show({
        title: 'Error',
        message: error.message,
        color: 'red',
      })
    },
  })

  const [updateModelConfig, { loading: updatingConfig }] = useMutation(UPDATE_MODEL_CONFIG, {
    refetchQueries: [{ query: GET_MODEL, variables: { id: modelId } }],
    onError: (error) => {
      notifications.show({
        title: 'Error',
        message: error.message,
        color: 'red',
      })
    },
  })

  const handleSave = async (values: typeof form.values) => {
    try {
      // Update basic model details
      await updateModel({
        variables: {
          id: modelId,
          input: {
            name: values.name,
            description: values.description,
          },
        },
      })

      // Update model config if start page layout has changed
      const currentStartPageId = model.config?.custom?.startPageLayoutId || ''
      if (values.startPageLayoutId !== currentStartPageId) {
        await updateModelConfig({
          variables: {
            id: modelId,
            input: {
              startPageLayoutId: values.startPageLayoutId || '',
            },
          },
        })
      }

      notifications.show({
        title: 'Success',
        message: 'Model details updated successfully',
        color: 'green',
      })
      navigate(`/models/${modelId}`)
    } catch (error) {
      // Error notifications are handled by the mutation onError callbacks
    }
  }

  const handleCancel = () => {
    navigate(`/models/${modelId}`)
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
        <Stack gap="md" mb="xl">
          <Title order={2}>
            Edit Model Details
          </Title>
          {model && (
            <Group gap="xs">
              <Text size="sm" c="dimmed">Version:</Text>
              <Text size="sm">{model.version}</Text>
            </Group>
          )}
        </Stack>
        
        <form onSubmit={form.onSubmit(handleSave)}>
          <Stack gap="md">
            <TextInput
              label="Model Name"
              placeholder="e.g., Customer Management System"
              required
              {...form.getInputProps('name')}
            />
            
            <Textarea
              label="Description"
              placeholder="Describe what this model is for..."
              rows={4}
              {...form.getInputProps('description')}
            />

            <Divider label="Application Settings" labelPosition="left" />
            
            <Select
              label="Start Page Layout"
              placeholder="Select a layout as the start page"
              description="The layout that will be shown when the TorqueApp opens"
              searchable
              clearable
              data={startPageOptions}
              {...form.getInputProps('startPageLayoutId')}
            />

            <Group mt="xs">
              <Alert icon={<IconAlertCircle size={16} />} color="blue">
                <Text size="sm">
                  The start page layout will be the first screen users see when opening the TorqueApp.
                  If not set, the application will show a default home page with navigation options.
                </Text>
              </Alert>
            </Group>
            
            <Group justify="flex-end" mt="md">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                loading={updatingModel || updatingConfig}
              >
                Save Changes
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  )
}