import { useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@apollo/client'
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
} from '@tabler/icons-react'

import { GET_MODEL } from '../graphql/queries'
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



  const handleCreateEntity = () => {
    navigate(`/models/${id}/entities/new`)
  }

  const handleEditEntity = (entity: Entity) => {
    navigate(`/models/${id}/entities/${entity.id}`)
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
          <EntitiesPanel model={model} onAddEntity={handleCreateEntity} onEditEntity={handleEditEntity} />
        </Tabs.Panel>

        <Tabs.Panel value="relationships" pt="md">
          <RelationshipsPanel model={model} navigate={navigate} />
        </Tabs.Panel>

        <Tabs.Panel value="layouts" pt="md">
          <LayoutsPanel model={model} navigate={navigate} />
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

interface RelationshipsPanelProps extends ModelPanelProps {
  navigate: (path: string) => void
}

function RelationshipsPanel({ model, navigate }: RelationshipsPanelProps) {
  const handleCreateRelationship = () => {
    navigate(`/models/${model.id}/relationships/new`)
  }

  const handleEditRelationship = (relationshipId: string) => {
    navigate(`/models/${model.id}/relationships/${relationshipId}`)
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
                  <Button 
                    size="xs" 
                    variant="light"
                    onClick={() => handleEditRelationship(relationship.id)}
                  >
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

interface LayoutsPanelProps extends ModelPanelProps {
  navigate: (path: string) => void
}

function LayoutsPanel({ model, navigate }: LayoutsPanelProps) {
  
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