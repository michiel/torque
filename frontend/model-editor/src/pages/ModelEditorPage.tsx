import { useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
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
  Container,
  Box,
} from '@mantine/core'
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
  IconTrash,
  IconBug,
} from '@tabler/icons-react'

import { GET_MODEL } from '../graphql/queries'
import { IMPORT_MODEL, REPLACE_MODEL, DELETE_ENTITY, DELETE_RELATIONSHIP, DELETE_LAYOUT, VALIDATE_MODEL } from '../graphql/mutations'
import { Model, Entity } from '../types/model'
import { ModelExportDialog, ModelImportDialog } from '../components/ModelImportExport'

export function ModelEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'entities'
  
  const [exportModalOpened, { open: openExportModal, close: closeExportModal }] = useDisclosure(false)
  const [importModalOpened, { open: openImportModal, close: closeImportModal }] = useDisclosure(false)
  
  const { data, loading, error, refetch } = useQuery(GET_MODEL, {
    variables: { id },
    skip: !id,
    errorPolicy: 'all',
  })

  const [replaceModel, { loading: replaceLoading }] = useMutation(REPLACE_MODEL, {
    onCompleted: (data) => {
      notifications.show({
        title: 'Model Replaced',
        message: `Successfully replaced model: ${data.replaceModel.name}`,
        color: 'green',
      })
      refetch() // Refresh the current model data
    },
    onError: (error) => {
      notifications.show({
        title: 'Replace Failed',
        message: error.message,
        color: 'red',
      })
    }
  })

  const [deleteEntity] = useMutation(DELETE_ENTITY, {
    onCompleted: () => {
      notifications.show({
        title: 'Entity Deleted',
        message: 'Entity has been successfully deleted',
        color: 'green',
      })
      refetch()
    },
    onError: (error) => {
      notifications.show({
        title: 'Delete Failed',
        message: error.message,
        color: 'red',
      })
    }
  })

  const [deleteRelationship] = useMutation(DELETE_RELATIONSHIP, {
    onCompleted: () => {
      notifications.show({
        title: 'Relationship Deleted',
        message: 'Relationship has been successfully deleted',
        color: 'green',
      })
      refetch()
    },
    onError: (error) => {
      notifications.show({
        title: 'Delete Failed',
        message: error.message,
        color: 'red',
      })
    }
  })

  const [deleteLayout] = useMutation(DELETE_LAYOUT, {
    onCompleted: () => {
      notifications.show({
        title: 'Layout Deleted',
        message: 'Layout has been successfully deleted',
        color: 'green',
      })
      refetch()
    },
    onError: (error) => {
      notifications.show({
        title: 'Delete Failed',
        message: error.message,
        color: 'red',
      })
    }
  })

  const [validateModel] = useMutation(VALIDATE_MODEL, {
    onCompleted: (data) => {
      const result = data.validateModel
      if (result.valid) {
        notifications.show({
          title: 'Model Valid',
          message: 'Model validation passed successfully',
          color: 'green',
        })
      } else {
        const errorMessages = result.errors.map((error: any) => error.message).join(', ')
        notifications.show({
          title: 'Model Validation Failed',
          message: `Errors: ${errorMessages}`,
          color: 'red',
        })
      }
    },
    onError: (error) => {
      notifications.show({
        title: 'Validation Failed',
        message: error.message,
        color: 'red',
      })
    }
  })



  const handleCreateEntity = () => {
    navigate(`/models/${id}/editor/entities/new`)
  }

  const handleEditEntity = (entity: Entity) => {
    navigate(`/models/${id}/editor/entities/${entity.id}`)
  }

  const handleDeleteEntity = async (entityId: string) => {
    if (window.confirm('Are you sure you want to delete this entity? This action cannot be undone.')) {
      await deleteEntity({ variables: { id: entityId } })
    }
  }

  const handleDeleteRelationship = async (relationshipId: string) => {
    if (window.confirm('Are you sure you want to delete this relationship? This action cannot be undone.')) {
      await deleteRelationship({ variables: { id: relationshipId } })
    }
  }

  const handleDeleteLayout = async (layoutId: string) => {
    if (window.confirm('Are you sure you want to delete this layout? This action cannot be undone.')) {
      await deleteLayout({ variables: { id: layoutId } })
    }
  }

  const handleValidateModel = async () => {
    if (id) {
      await validateModel({ variables: { id } })
    }
  }

  const handleImportModel = async (importedModel: any, originalJsonString: string) => {
    try {
      // Use replaceModel instead of importModel since we're replacing an existing model
      await replaceModel({
        variables: { 
          id: id!,
          data: originalJsonString 
        }
      })
      closeImportModal()
    } catch (error) {
      console.error('Replace error:', error)
      // Error handling is done in the mutation's onError callback
    }
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
    <Box style={{ minHeight: 'calc(100vh - 100px)', background: 'var(--mantine-color-gray-0)' }}>
      <Container size="xl" py="xl">
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
          <Button 
            leftSection={<IconDatabase size={16} />} 
            variant="light"
            onClick={() => navigate(`/models/${id}/editor/erd`)}
          >
            Edit ERD
          </Button>
          <Button 
            leftSection={<IconEdit size={16} />} 
            variant="light"
            onClick={() => navigate(`/models/${id}/editor/details`)}
          >
            Edit Details
          </Button>
          <Button 
            leftSection={<IconBug size={16} />} 
            variant="light"
            onClick={() => navigate(`/models/${id}/verification`)}
          >
            Verify model
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
              <Menu.Item leftSection={<IconShield size={14} />} onClick={handleValidateModel}>
                Validate
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>

      {/* Tabs */}
      <Tabs 
        value={activeTab} 
        onChange={(value) => setSearchParams({ tab: value || 'entities' })}
        variant="outline"
      >
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
          <EntitiesPanel model={model} onAddEntity={handleCreateEntity} onEditEntity={handleEditEntity} onDeleteEntity={handleDeleteEntity} />
        </Tabs.Panel>

        <Tabs.Panel value="relationships" pt="md">
          <RelationshipsPanel model={model} navigate={navigate} onDeleteRelationship={handleDeleteRelationship} />
        </Tabs.Panel>

        <Tabs.Panel value="layouts" pt="md">
          <LayoutsPanel model={model} navigate={navigate} onDeleteLayout={handleDeleteLayout} />
        </Tabs.Panel>

        <Tabs.Panel value="flows" pt="md">
          <FlowsPanel model={model} />
        </Tabs.Panel>
      </Tabs>


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
        isReplacing={true}
        existingModelName={model.name}
      />
        </Stack>
      </Container>
    </Box>
  )
}

interface ModelPanelProps {
  model: Model
}

interface EntitiesPanelProps extends ModelPanelProps {
  onAddEntity: () => void
  onEditEntity: (entity: Entity) => void
  onDeleteEntity: (entityId: string) => void
}

function EntitiesPanel({ model, onAddEntity, onEditEntity, onDeleteEntity }: EntitiesPanelProps) {
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
                  <Group gap="xs">
                    <Button size="xs" variant="light" onClick={() => onEditEntity(entity)}>
                      Edit
                    </Button>
                    <ActionIcon 
                      size="sm" 
                      color="red" 
                      variant="subtle"
                      onClick={() => onDeleteEntity(entity.id)}
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Group>
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

interface RelationshipsPanelProps extends ModelPanelProps {
  navigate: (path: string) => void
  onDeleteRelationship: (relationshipId: string) => void
}

function RelationshipsPanel({ model, navigate, onDeleteRelationship }: RelationshipsPanelProps) {
  const handleCreateRelationship = () => {
    navigate(`/models/${model.id}/editor/relationships/new`)
  }

  const handleEditRelationship = (relationshipId: string) => {
    navigate(`/models/${model.id}/editor/relationships/${relationshipId}`)
  }

  // Helper function to get entity name by ID
  const getEntityName = (entityId: string) => {
    const entity = model.entities?.find(e => e.id === entityId)
    return entity?.displayName || entity?.name || entityId
  }

  return (
    <Paper p="md" withBorder>
      <Stack>
        <Group justify="space-between">
          <Text fw={500}>Relationships</Text>
          <Button 
            size="sm" 
            leftSection={<IconBolt size={14} />}
            onClick={handleCreateRelationship}
          >
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
                      {relationship.relationshipType} • {getEntityName(relationship.fromEntity)} → {getEntityName(relationship.toEntity)}
                    </Text>
                  </Stack>
                  <Group gap="xs">
                    <Button 
                      size="xs" 
                      variant="light"
                      onClick={() => handleEditRelationship(relationship.id)}
                    >
                      Edit
                    </Button>
                    <ActionIcon 
                      size="sm" 
                      color="red" 
                      variant="subtle"
                      onClick={() => onDeleteRelationship(relationship.id)}
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Group>
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

interface LayoutsPanelProps extends ModelPanelProps {
  navigate: (path: string) => void
  onDeleteLayout: (layoutId: string) => void
}

function LayoutsPanel({ model, navigate, onDeleteLayout }: LayoutsPanelProps) {
  
  const handleCreateLayout = () => {
    navigate(`/models/${model.id}/editor/layouts/new`)
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
                      onClick={() => navigate(`/models/${model.id}/editor/layouts/${layout.id}`)}
                    >
                      Edit
                    </Button>
                    <ActionIcon 
                      size="sm" 
                      color="red" 
                      variant="subtle"
                      onClick={() => onDeleteLayout(layout.id)}
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
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