import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client'
import {
  Stack,
  Title,
  Group,
  Button,
  Tabs,
  Paper,
  Alert,
  Loader,
  Badge,
  Text,
  ActionIcon,
  Menu,
  Modal,
  TextInput,
  Textarea,
  Select,
  Divider,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconEdit,
  IconDownload,
  IconUpload,
  IconShare,
  IconDots,
  IconDatabase,
  IconBolt,
  IconLayout,
  IconShield,
  IconAlertCircle,
  IconPlus,
  IconFileImport,
  IconFileExport,
  IconExternalLink,
} from '@tabler/icons-react'

import { GET_MODEL } from '../graphql/queries'
import { CREATE_ENTITY, UPDATE_ENTITY } from '../graphql/mutations'
import { Model, Entity, Field } from '../types/model'
import { ModelExportDialog, ModelImportDialog } from '../components/ModelImportExport'
import { EntityFieldsEditor } from '../components/EntityEditor'

export function ModelEditorPage() {
  const { id } = useParams<{ id: string }>()
  const [entityModalOpened, { open: openEntityModal, close: closeEntityModal }] = useDisclosure(false)
  const [exportModalOpened, { open: openExportModal, close: closeExportModal }] = useDisclosure(false)
  const [importModalOpened, { open: openImportModal, close: closeImportModal }] = useDisclosure(false)
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null)
  
  const { data, loading, error, refetch } = useQuery(GET_MODEL, {
    variables: { id },
    skip: !id,
    errorPolicy: 'all',
  })

  const [createEntity, { loading: creatingEntity }] = useMutation(CREATE_ENTITY, {
    refetchQueries: [{ query: GET_MODEL, variables: { id } }],
    onCompleted: () => {
      notifications.show({
        title: 'Success',
        message: 'Entity created successfully',
        color: 'green',
      })
      closeEntityModal()
      setEditingEntity(null)
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
    refetchQueries: [{ query: GET_MODEL, variables: { id } }],
    onCompleted: () => {
      notifications.show({
        title: 'Success',
        message: 'Entity updated successfully',
        color: 'green',
      })
      closeEntityModal()
      setEditingEntity(null)
    },
    onError: (error) => {
      notifications.show({
        title: 'Error',
        message: error.message,
        color: 'red',
      })
    },
  })

  const entityForm = useForm({
    initialValues: {
      name: '',
      displayName: '',
      description: '',
      fields: [] as Field[],
    },
    validate: {
      name: (value) => (!value ? 'Name is required' : null),
      displayName: (value) => (!value ? 'Display name is required' : null),
    },
  })

  const handleSaveEntity = async (values: typeof entityForm.values) => {
    if (!id) {
      notifications.show({
        title: 'Error',
        message: 'Model ID not found',
        color: 'red',
      })
      return
    }

    if (editingEntity) {
      // Update existing entity
      await updateEntity({
        variables: {
          id: editingEntity.id,
          input: {
            name: values.name,
            displayName: values.displayName,
            description: values.description,
          },
        },
      })
    } else {
      // Create new entity
      await createEntity({
        variables: {
          input: {
            modelId: id,
            name: values.name,
            displayName: values.displayName,
            description: values.description,
            fields: values.fields.map(field => ({
              name: field.name,
              displayName: field.displayName,
              fieldType: field.fieldType,
              required: field.required,
              defaultValue: field.defaultValue,
              validation: field.validation,
              uiConfig: field.uiConfig,
            })),
            uiConfig: {},
            behavior: {},
          },
        },
      })
    }
    entityForm.reset()
  }

  const handleOpenEntityModal = () => {
    setEditingEntity(null)
    entityForm.reset()
    openEntityModal()
  }

  const handleEditEntity = (entity: Entity) => {
    setEditingEntity(entity)
    // Normalize fields to ensure validation is always an array
    const normalizedFields = (entity.fields || []).map(field => ({
      ...field,
      validation: Array.isArray(field.validation) ? field.validation : []
    }))
    entityForm.setValues({
      name: entity.name,
      displayName: entity.displayName,
      description: entity.description || '',
      fields: normalizedFields,
    })
    openEntityModal()
  }

  const handleImportModel = (importedModel: any) => {
    notifications.show({
      title: 'Model Imported',
      message: `Successfully imported model: ${importedModel.name}`,
      color: 'green',
    })
    // In a real implementation, you would save this to the backend
    // For now, we just show a success message
    refetch()
  }

  const prepareModelDataForExport = () => {
    if (!model) return null
    
    return {
      name: model.name,
      description: model.description,
      entities: model.entities || [],
      layouts: model.layouts || [],
      customComponents: [] // Would include custom components if available
    }
  }

  const model: Model | null = data?.model || null

  if (loading) {
    return (
      <Stack align="center" justify="center" h="50vh">
        <Loader size="xl" />
        <Text>Loading model...</Text>
      </Stack>
    )
  }

  if (error) {
    return (
      <Stack>
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Error loading model"
          color="red"
          variant="filled"
        >
          {error.message}
        </Alert>
        <Button onClick={() => refetch()}>Retry</Button>
      </Stack>
    )
  }

  if (!model) {
    return (
      <Alert
        icon={<IconAlertCircle size={16} />}
        title="Model not found"
        color="orange"
      >
        The model you're looking for doesn't exist or has been deleted.
      </Alert>
    )
  }

  return (
    <Stack>
      {/* Header */}
      <Group justify="space-between">
        <Stack gap="xs">
          <Group>
            <Title order={1}>{model.name}</Title>
            <Badge variant="light">v{model.version}</Badge>
          </Group>
          {model.description && (
            <Text c="dimmed">{model.description}</Text>
          )}
        </Stack>

        <Group>
          <Button 
            leftSection={<IconExternalLink size={16} />} 
            variant="filled"
            component="a"
            href={`http://localhost:3002/app/${model.id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open in TorqueApp
          </Button>
          <Button leftSection={<IconEdit size={16} />} variant="light">
            Edit Details
          </Button>
          <Button leftSection={<IconUpload size={16} />} variant="light" onClick={openImportModal}>
            Import
          </Button>
          <Menu>
            <Menu.Target>
              <ActionIcon variant="subtle">
                <IconDots size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconFileExport size={14} />} onClick={openExportModal}>
                Export Model
              </Menu.Item>
              <Menu.Item leftSection={<IconFileImport size={14} />} onClick={openImportModal}>
                Import Model
              </Menu.Item>
              <Menu.Item leftSection={<IconShare size={14} />}>
                Share
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item leftSection={<IconShield size={14} />}>
                Validate
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>

      {/* Tabs */}
      <Tabs defaultValue="entities" variant="outline">
        <Tabs.List>
          <Tabs.Tab 
            value="entities" 
            leftSection={<IconDatabase size={16} />}
          >
            Entities ({model.entities?.length || 0})
          </Tabs.Tab>
          <Tabs.Tab 
            value="relationships" 
            leftSection={<IconBolt size={16} />}
          >
            Relationships ({model.relationships?.length || 0})
          </Tabs.Tab>
          <Tabs.Tab 
            value="layouts" 
            leftSection={<IconLayout size={16} />}
          >
            Layouts ({model.layouts?.length || 0})
          </Tabs.Tab>
          <Tabs.Tab 
            value="flows" 
            leftSection={<IconBolt size={16} />}
          >
            Flows ({model.flows?.length || 0})
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="entities" pt="md">
          <EntitiesPanel model={model} onAddEntity={handleOpenEntityModal} onEditEntity={handleEditEntity} />
        </Tabs.Panel>

        <Tabs.Panel value="relationships" pt="md">
          <RelationshipsPanel model={model} />
        </Tabs.Panel>

        <Tabs.Panel value="layouts" pt="md">
          <LayoutsPanel model={model} />
        </Tabs.Panel>

        <Tabs.Panel value="flows" pt="md">
          <FlowsPanel model={model} />
        </Tabs.Panel>
      </Tabs>

      {/* Create/Edit Entity Modal */}
      <Modal
        opened={entityModalOpened}
        onClose={closeEntityModal}
        title={editingEntity ? "Edit Entity" : "Create New Entity"}
        size="xl"
        fullScreen={false}
      >
        <form onSubmit={entityForm.onSubmit(handleSaveEntity)}>
          <Stack>
            <TextInput
              label="Name"
              placeholder="user, product, order"
              required
              {...entityForm.getInputProps('name')}
            />
            
            <TextInput
              label="Display Name"
              placeholder="User, Product, Order"
              required
              {...entityForm.getInputProps('displayName')}
            />
            
            <Textarea
              label="Description"
              placeholder="Describe what this entity represents..."
              {...entityForm.getInputProps('description')}
            />
            
            <Divider my="md" label="Fields" labelPosition="left" />
            
            <EntityFieldsEditor
              fields={entityForm.values.fields}
              onChange={(fields) => entityForm.setFieldValue('fields', fields)}
              entityNames={model?.entities?.map(e => e.name) || []}
            />
            
            <Group justify="flex-end" mt="md">
              <Button variant="outline" onClick={closeEntityModal}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                loading={creatingEntity || updatingEntity}
                leftSection={<IconPlus size={16} />}
              >
                {editingEntity ? 'Update Entity' : 'Create Entity'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Import/Export Modals */}
      <ModelExportDialog
        opened={exportModalOpened}
        onClose={closeExportModal}
        modelData={prepareModelDataForExport() || {
          name: 'Unknown Model',
          entities: [],
          layouts: [],
          customComponents: []
        }}
      />

      <ModelImportDialog
        opened={importModalOpened}
        onClose={closeImportModal}
        onImport={handleImportModel}
      />
    </Stack>
  )
}

interface ModelPanelProps {
  model: Model
}

interface EntitiesPanelProps extends ModelPanelProps {
  onAddEntity: () => void
  onEditEntity: (entity: Entity) => void
}

function EntitiesPanel({ model, onAddEntity, onEditEntity }: EntitiesPanelProps) {
  return (
    <Paper p="md" withBorder>
      <Stack>
        <Group justify="space-between">
          <Text fw={500}>Entities</Text>
          <Button 
            size="sm" 
            leftSection={<IconDatabase size={14} />}
            onClick={onAddEntity}
          >
            Add Entity
          </Button>
        </Group>
        
        {model.entities && model.entities.length > 0 ? (
          <Stack gap="xs">
            {model.entities.map((entity) => (
              <Paper key={entity.id} p="sm" withBorder>
                <Group justify="space-between">
                  <Stack gap={4}>
                    <Text fw={500}>{entity.displayName}</Text>
                    <Text size="sm" c="dimmed">
                      {entity.fields?.length || 0} fields • {entity.entityType}
                    </Text>
                  </Stack>
                  <Button size="xs" variant="light" onClick={() => onEditEntity(entity)}>
                    Edit
                  </Button>
                </Group>
              </Paper>
            ))}
          </Stack>
        ) : (
          <Text c="dimmed" ta="center" py="xl">
            No entities defined yet. Add your first entity to get started.
          </Text>
        )}
      </Stack>
    </Paper>
  )
}

function RelationshipsPanel({ model }: ModelPanelProps) {
  return (
    <Paper p="md" withBorder>
      <Stack>
        <Group justify="space-between">
          <Text fw={500}>Relationships</Text>
          <Button size="sm" leftSection={<IconBolt size={14} />}>
            Add Relationship
          </Button>
        </Group>
        
        {model.relationships && model.relationships.length > 0 ? (
          <Stack gap="xs">
            {model.relationships.map((relationship) => (
              <Paper key={relationship.id} p="sm" withBorder>
                <Group justify="space-between">
                  <Stack gap={4}>
                    <Text fw={500}>{relationship.name}</Text>
                    <Text size="sm" c="dimmed">
                      {relationship.relationshipType} • {relationship.fromEntity} → {relationship.toEntity}
                    </Text>
                  </Stack>
                  <Button size="xs" variant="light">
                    Edit
                  </Button>
                </Group>
              </Paper>
            ))}
          </Stack>
        ) : (
          <Text c="dimmed" ta="center" py="xl">
            No relationships defined yet. Create entities first, then add relationships between them.
          </Text>
        )}
      </Stack>
    </Paper>
  )
}

function LayoutsPanel({ model }: ModelPanelProps) {
  const navigate = useNavigate()
  
  const handleCreateLayout = () => {
    navigate(`/models/${model.id}/layouts/new`)
  }

  return (
    <Paper p="md" withBorder>
      <Stack>
        <Group justify="space-between">
          <Text fw={500}>Layouts</Text>
          <Button 
            size="sm" 
            leftSection={<IconLayout size={14} />}
            onClick={handleCreateLayout}
          >
            Create Layout
          </Button>
        </Group>
        
        {model.layouts && model.layouts.length > 0 ? (
          <Stack gap="xs">
            {model.layouts.map((layout) => (
              <Paper key={layout.id} p="sm" withBorder>
                <Group justify="space-between">
                  <Stack gap={4}>
                    <Text fw={500}>{layout.name}</Text>
                    <Text size="sm" c="dimmed">
                      {layout.layoutType} • {layout.components?.length || 0} components
                    </Text>
                  </Stack>
                  <Group gap="xs">
                    <Button 
                      size="xs" 
                      variant="light"
                      onClick={() => navigate(`/models/${model.id}/layouts/${layout.id}`)}
                    >
                      Edit
                    </Button>
                  </Group>
                </Group>
              </Paper>
            ))}
          </Stack>
        ) : (
          <Stack align="center" py="xl">
            <Text c="dimmed" ta="center">
              No layouts created yet. Use the Layout Editor to design visual interfaces for your entities.
            </Text>
            <Button 
              variant="light" 
              leftSection={<IconLayout size={14} />}
              onClick={handleCreateLayout}
            >
              Create Your First Layout
            </Button>
          </Stack>
        )}
      </Stack>
    </Paper>
  )
}

function FlowsPanel({ }: ModelPanelProps) {
  return (
    <Paper p="md" withBorder>
      <Stack>
        <Group justify="space-between">
          <Text fw={500}>Flows</Text>
          <Button size="sm" leftSection={<IconBolt size={14} />}>
            Add Flow
          </Button>
        </Group>
        
        <Text c="dimmed" ta="center" py="xl">
          Flow editor coming soon. Create business logic workflows for your model.
        </Text>
      </Stack>
    </Paper>
  )
}