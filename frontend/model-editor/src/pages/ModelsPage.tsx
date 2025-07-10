import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import {
  Stack,
  Title,
  Group,
  Button,
  Card,
  Text,
  Badge,
  Grid,
  TextInput,
  ActionIcon,
  Menu,
  Loader,
  Alert,
  Paper,
} from '@mantine/core'
import {
  IconPlus,
  IconSearch,
  IconDots,
  IconEdit,
  IconTrash,
  IconDownload,
  IconAlertCircle,
} from '@tabler/icons-react'

import { GET_MODELS } from '../graphql/queries'
import { Model } from '../types/model'

export function ModelsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  
  const { data, loading, error, refetch } = useQuery(GET_MODELS, {
    errorPolicy: 'all',
  })

  const models: Model[] = data?.models || []

  const filteredModels = models.filter(model =>
    model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    model.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <Stack align="center" justify="center" h="50vh">
        <Loader size="xl" />
        <Text>Loading models...</Text>
      </Stack>
    )
  }

  if (error) {
    return (
      <Stack>
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Error loading models"
          color="red"
          variant="filled"
        >
          {error.message}
        </Alert>
        <Button onClick={() => refetch()}>Retry</Button>
      </Stack>
    )
  }

  return (
    <Stack>
      {/* Header */}
      <Group justify="space-between">
        <Title order={1}>Models</Title>
        <Button
          component={Link}
          to="/models/new"
          leftSection={<IconPlus size={16} />}
        >
          Create Model
        </Button>
      </Group>

      {/* Search */}
      <TextInput
        placeholder="Search models..."
        leftSection={<IconSearch size={16} />}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.currentTarget.value)}
        style={{ maxWidth: 400 }}
      />

      {/* Models Grid */}
      {filteredModels.length === 0 ? (
        <Paper p="xl" ta="center" bg="gray.0">
          <Stack align="center" gap="md">
            <IconAlertCircle size={48} color="gray" />
            <Text size="lg" fw={500}>
              {models.length === 0 ? 'No models found' : 'No models match your search'}
            </Text>
            <Text c="dimmed">
              {models.length === 0 
                ? 'Get started by creating your first model'
                : 'Try adjusting your search terms'
              }
            </Text>
            {models.length === 0 && (
              <Button
                component={Link}
                to="/models/new"
                leftSection={<IconPlus size={16} />}
              >
                Create Your First Model
              </Button>
            )}
          </Stack>
        </Paper>
      ) : (
        <Grid>
          {filteredModels.map((model) => (
            <Grid.Col key={model.id} span={{ base: 12, md: 6, lg: 4 }}>
              <ModelCard model={model} />
            </Grid.Col>
          ))}
        </Grid>
      )}
    </Stack>
  )
}

interface ModelCardProps {
  model: Model
}

function ModelCard({ model }: ModelCardProps) {
  const entityCount = model.entities?.length || 0
  const relationshipCount = model.relationships?.length || 0

  return (
    <Card shadow="sm" padding="md" radius="md" withBorder h={200}>
      <Stack h="100%" justify="space-between">
        <Stack gap="xs">
          <Group justify="space-between">
            <Text fw={600} size="lg" truncate>
              {model.name}
            </Text>
            <Menu>
              <Menu.Target>
                <ActionIcon variant="subtle" size="sm">
                  <IconDots size={16} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  component={Link}
                  to={`/models/${model.id}`}
                  leftSection={<IconEdit size={14} />}
                >
                  Edit
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconDownload size={14} />}
                >
                  Export
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  color="red"
                  leftSection={<IconTrash size={14} />}
                >
                  Delete
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>

          {model.description && (
            <Text size="sm" c="dimmed" truncate="end" mah={40}>
              {model.description}
            </Text>
          )}

          <Group gap="xs">
            <Badge size="sm" variant="light">
              v{model.version}
            </Badge>
            <Badge size="sm" variant="outline">
              {entityCount} entities
            </Badge>
            {relationshipCount > 0 && (
              <Badge size="sm" variant="outline">
                {relationshipCount} relations
              </Badge>
            )}
          </Group>
        </Stack>

        <Group justify="space-between">
          <Text size="xs" c="dimmed">
            {new Date(model.updatedAt).toLocaleDateString()}
          </Text>
          <Button
            component={Link}
            to={`/models/${model.id}`}
            size="xs"
            variant="light"
          >
            Open
          </Button>
        </Group>
      </Stack>
    </Card>
  )
}