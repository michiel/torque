import { useParams } from 'react-router-dom'
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
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconEdit,
  IconDownload,
  IconShare,
  IconDots,
  IconDatabase,
  IconBolt,
  IconLayout,
  IconShield,
  IconAlertCircle,
  IconPlus,
} from '@tabler/icons-react'

import { GET_MODEL } from '../graphql/queries'
import { CREATE_ENTITY } from '../graphql/mutations'
import { Model } from '../types/model'

export function ModelEditorPage() {
  const { id } = useParams<{ id: string }>()
  const [entityModalOpened, { open: openEntityModal, close: closeEntityModal }] = useDisclosure(false)
  
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
      entityType: 'Table',
    },
    validate: {
      name: (value) => (!value ? 'Name is required' : null),
      displayName: (value) => (!value ? 'Display name is required' : null),
    },
  })

  const handleCreateEntity = async (values: typeof entityForm.values) => {
    await createEntity({
      variables: {
        input: {
          ...values,
          fields: [], // Start with empty fields
          uiConfig: {},
          behavior: {},
        },
      },
    })
    entityForm.reset()
  }

  const handleOpenEntityModal = () => {
    entityForm.reset()
    openEntityModal()
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
          <Button leftSection={<IconEdit size={16} />} variant="light">
            Edit Details
          </Button>
          <Menu>
            <Menu.Target>
              <ActionIcon variant="subtle">
                <IconDots size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconDownload size={14} />}>
                Export Model
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
          <EntitiesPanel model={model} onAddEntity={handleOpenEntityModal} />
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

      {/* Create Entity Modal */}
      <Modal
        opened={entityModalOpened}
        onClose={closeEntityModal}
        title="Create New Entity"
        size="md"
      >
        <form onSubmit={entityForm.onSubmit(handleCreateEntity)}>
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
            
            <Select
              label="Entity Type"
              data={[
                { value: 'Table', label: 'Table' },
                { value: 'View', label: 'View' },
                { value: 'Document', label: 'Document' },
                { value: 'Aggregate', label: 'Aggregate' },
              ]}
              {...entityForm.getInputProps('entityType')}
            />
            
            <Group justify="flex-end" mt="md">
              <Button variant="outline" onClick={closeEntityModal}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                loading={creatingEntity}
                leftSection={<IconPlus size={16} />}
              >
                Create Entity
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  )
}

interface ModelPanelProps {
  model: Model
}

interface EntitiesPanelProps extends ModelPanelProps {
  onAddEntity: () => void
}

function EntitiesPanel({ model, onAddEntity }: EntitiesPanelProps) {
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
                  <Button size="xs" variant="light">
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

function LayoutsPanel({ }: ModelPanelProps) {
  return (
    <Paper p="md" withBorder>
      <Stack>
        <Group justify="space-between">
          <Text fw={500}>Layouts</Text>
          <Button size="sm" leftSection={<IconLayout size={14} />}>
            Add Layout
          </Button>
        </Group>
        
        <Text c="dimmed" ta="center" py="xl">
          Layout editor coming soon. Define visual layouts for your entities.
        </Text>
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