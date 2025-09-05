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
  Badge,
  Divider,
} from '@mantine/core'
import {
  IconPlus,
  IconDatabase,
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


  return (
    <Box style={{ minHeight: 'calc(100vh - 100px)' }} bg="gray.0">
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


          {/* Quick Actions */}
          <Box>
            <Title order={2} mb="lg">
              Quick Actions
            </Title>
            <SimpleGrid cols={{ base: 2, sm: 2, md: 4 }} spacing="lg">
              {quickActions.map((action) =>
                action.href ? (
                  <Card
                    key={action.title}
                    component={Link}
                    to={action.href}
                    shadow="sm"
                    padding="md"
                    radius="md"
                    withBorder
                    style={{ 
                      cursor: 'pointer',
                      textDecoration: 'none',
                      transition: 'transform 150ms ease, box-shadow 150ms ease',
                      minHeight: '160px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      textAlign: 'center',
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
                    <ThemeIcon size="lg" radius="md" color={action.color} mb="sm">
                      <action.icon size={24} />
                    </ThemeIcon>
                    <Text fw={500} size="md" mb="xs">
                      {action.title}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {action.description}
                    </Text>
                  </Card>
                ) : (
                  <Card
                    key={action.title}
                    onClick={action.onClick}
                    shadow="sm"
                    padding="md"
                    radius="md"
                    withBorder
                    style={{ 
                      cursor: 'pointer',
                      transition: 'transform 150ms ease, box-shadow 150ms ease',
                      minHeight: '160px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      textAlign: 'center',
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
                    <ThemeIcon size="lg" radius="md" color={action.color} mb="sm">
                      <action.icon size={24} />
                    </ThemeIcon>
                    <Text fw={500} size="md" mb="xs">
                      {action.title}
                    </Text>
                    <Text size="xs" c="dimmed">
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