import { Link } from 'react-router-dom'
import {
  Container,
  Title,
  Text,
  SimpleGrid,
  Card,
  Group,
  ThemeIcon,
  Stack,
  Button,
  Box,
  Paper,
  Badge,
  Divider,
} from '@mantine/core'
import {
  IconPlus,
  IconDatabase,
  IconLayoutGrid,
  IconBolt,
  IconSettings,
  IconBook,
  IconArrowRight,
} from '@tabler/icons-react'
import { useQuery } from '@apollo/client'
import { GET_MODELS } from '../graphql/queries'

interface QuickAction {
  title: string
  description: string
  icon: typeof IconPlus
  color: string
  href?: string
  onClick?: () => void
}

export function HomePage() {
  const { data, loading } = useQuery(GET_MODELS)
  const models = data?.models || []

  const quickActions: QuickAction[] = [
    {
      title: 'Create New Model',
      description: 'Start building a new application model',
      icon: IconPlus,
      color: 'blue',
      href: '/models/new',
    },
    {
      title: 'Browse Models',
      description: 'View and manage existing models',
      icon: IconDatabase,
      color: 'green',
      href: '/models',
    },
    {
      title: 'Documentation',
      description: 'Learn how to use Torque Model Editor',
      icon: IconBook,
      color: 'grape',
    },
    {
      title: 'Settings',
      description: 'Configure your workspace',
      icon: IconSettings,
      color: 'gray',
    },
  ]

  const stats = [
    { label: 'Total Models', value: models.length, icon: IconDatabase },
    { label: 'Entities', value: models.reduce((acc: number, m: any) => acc + (m.entities?.length || 0), 0), icon: IconLayoutGrid },
    { label: 'Workflows', value: models.reduce((acc: number, m: any) => acc + (m.flows?.length || 0), 0), icon: IconBolt },
  ]

  return (
    <Box style={{ minHeight: 'calc(100vh - 100px)', background: 'var(--mantine-color-gray-0)' }}>
      <Container size="xl" py="xl">
        {/* Welcome Section */}
        <Stack gap="xl">
          <Box>
            <Title order={1} mb="sm">
              Welcome to Torque Model Editor
            </Title>
            <Text size="lg" c="dimmed">
              Design, build, and manage your application models visually
            </Text>
          </Box>

          {/* Stats */}
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
            {stats.map((stat) => (
              <Paper key={stat.label} p="md" radius="md" shadow="sm">
                <Group justify="space-between">
                  <Box>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
                      {stat.label}
                    </Text>
                    <Text size="xl" fw={700}>
                      {loading ? '...' : stat.value}
                    </Text>
                  </Box>
                  <ThemeIcon color="gray" variant="light" size="xl" radius="md">
                    <stat.icon size={24} />
                  </ThemeIcon>
                </Group>
              </Paper>
            ))}
          </SimpleGrid>

          <Divider />

          {/* Quick Actions */}
          <Box>
            <Title order={2} mb="md">
              Quick Actions
            </Title>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
              {quickActions.map((action) =>
                action.href ? (
                  <Card
                    key={action.title}
                    component={Link}
                    to={action.href}
                    shadow="sm"
                    padding="lg"
                    radius="md"
                    withBorder
                    style={{ 
                      cursor: 'pointer',
                      textDecoration: 'none',
                      transition: 'transform 150ms ease, box-shadow 150ms ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.12)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '';
                    }}
                  >
                    <ThemeIcon size="xl" radius="md" color={action.color} mb="md">
                      <action.icon size={28} />
                    </ThemeIcon>
                    <Text fw={500} size="lg" mb="xs">
                      {action.title}
                    </Text>
                    <Text size="sm" c="dimmed">
                      {action.description}
                    </Text>
                  </Card>
                ) : (
                  <Card
                    key={action.title}
                    onClick={action.onClick}
                    shadow="sm"
                    padding="lg"
                    radius="md"
                    withBorder
                    style={{ 
                      cursor: 'pointer',
                      transition: 'transform 150ms ease, box-shadow 150ms ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.12)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '';
                    }}
                  >
                    <ThemeIcon size="xl" radius="md" color={action.color} mb="md">
                      <action.icon size={28} />
                    </ThemeIcon>
                    <Text fw={500} size="lg" mb="xs">
                      {action.title}
                    </Text>
                    <Text size="sm" c="dimmed">
                      {action.description}
                    </Text>
                  </Card>
                )
              )}
            </SimpleGrid>
          </Box>

          {/* Recent Models */}
          {!loading && models.length > 0 && (
            <>
              <Divider />
              <Box>
                <Group justify="space-between" mb="md">
                  <Title order={2}>Recent Models</Title>
                  <Button
                    component={Link}
                    to="/models"
                    variant="subtle"
                    rightSection={<IconArrowRight size={16} />}
                  >
                    View All
                  </Button>
                </Group>
                <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
                  {models.slice(0, 3).map((model: any) => (
                    <Card
                      key={model.id}
                      component={Link}
                      to={`/models/${model.id}`}
                      shadow="sm"
                      padding="lg"
                      radius="md"
                      withBorder
                      style={{ textDecoration: 'none' }}
                    >
                      <Group justify="space-between" mb="xs">
                        <Text fw={500} size="lg">
                          {model.name}
                        </Text>
                        <Badge variant="light">v{model.version}</Badge>
                      </Group>
                      {model.description && (
                        <Text size="sm" c="dimmed" mb="md">
                          {model.description}
                        </Text>
                      )}
                      <Group gap="xs">
                        <Badge variant="dot" color="blue">
                          {model.entities?.length || 0} entities
                        </Badge>
                        <Badge variant="dot" color="green">
                          {model.layouts?.length || 0} layouts
                        </Badge>
                      </Group>
                    </Card>
                  ))}
                </SimpleGrid>
              </Box>
            </>
          )}
        </Stack>
      </Container>
    </Box>
  )
}