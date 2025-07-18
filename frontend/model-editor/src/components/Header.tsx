import { Link, useLocation } from 'react-router-dom'
import {
  Group,
  Button,
  ActionIcon,
  Text,
  Breadcrumbs,
  Anchor,
  Box,
  Menu,
  Avatar,
  rem,
} from '@mantine/core'
import {
  IconHome,
  IconSettings,
  IconUser,
  IconLogout,
  IconDatabase,
  IconChevronRight,
} from '@tabler/icons-react'
import { ConnectionStatus } from './ConnectionStatus'

interface BreadcrumbItem {
  title: string
  href?: string
}

function getBreadcrumbs(pathname: string, search: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = [{ title: 'Home', href: '/' }]
  const searchParams = new URLSearchParams(search)
  const tab = searchParams.get('tab')

  if (segments[0] === 'models') {
    breadcrumbs.push({ title: 'Models', href: '/models' })
    
    if (segments[1] === 'new') {
      breadcrumbs.push({ title: 'Create Model' })
    } else if (segments[1]) {
      // Model ID - we could fetch the model name here
      breadcrumbs.push({ title: 'Model Editor', href: `/models/${segments[1]}` })
      
      // Add tab to breadcrumb if present
      if (tab && tab !== 'entities') {
        const tabTitles: Record<string, string> = {
          relationships: 'Relationships',
          layouts: 'Layouts',
          flows: 'Flows'
        }
        if (tabTitles[tab]) {
          breadcrumbs.push({ title: tabTitles[tab] })
        }
      }
      
      if (segments[2] === 'details') {
        breadcrumbs.push({ title: 'Edit Details' })
      } else if (segments[2] === 'entities') {
        breadcrumbs.push({ title: 'Entities' })
        
        if (segments[3] === 'new') {
          breadcrumbs.push({ title: 'Create Entity' })
        } else if (segments[3]) {
          breadcrumbs.push({ title: 'Edit Entity' })
        }
      } else if (segments[2] === 'relationships') {
        breadcrumbs.push({ title: 'Relationships' })
        
        if (segments[3] === 'new') {
          breadcrumbs.push({ title: 'Create Relationship' })
        } else if (segments[3]) {
          breadcrumbs.push({ title: 'Edit Relationship' })
        }
      } else if (segments[2] === 'layouts') {
        breadcrumbs.push({ title: 'Layouts' })
        
        if (segments[3] === 'new') {
          breadcrumbs.push({ title: 'Create Layout' })
        } else if (segments[3]) {
          breadcrumbs.push({ title: 'Edit Layout' })
        }
      } else if (segments[2] === 'erd') {
        breadcrumbs.push({ title: 'ERD Editor' })
      }
    }
  }

  return breadcrumbs
}

export function Header() {
  const location = useLocation()
  const breadcrumbs = getBreadcrumbs(location.pathname, location.search)

  return (
    <Box>
      {/* Main Header */}
      <Group h={60} px="md" justify="space-between" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
        {/* Left side - Logo and Nav */}
        <Group>
          <Group gap={rem(4)}>
            <IconDatabase size={28} />
            <Text size="xl" fw={600}>Torque</Text>
          </Group>
          
          <Group gap="xs" ml="xl">
            <Button
              component={Link}
              to="/"
              variant={location.pathname === '/' ? 'filled' : 'subtle'}
              leftSection={<IconHome size={16} />}
              size="sm"
            >
              Home
            </Button>
          </Group>
        </Group>

        {/* Right side - User menu and settings */}
        <Group>
          <ConnectionStatus />
          
          <ActionIcon variant="subtle" size="lg">
            <IconSettings size={20} />
          </ActionIcon>

          <Menu shadow="md" width={200}>
            <Menu.Target>
              <ActionIcon variant="subtle" size="lg">
                <Avatar size="sm" color="blue">
                  <IconUser size={16} />
                </Avatar>
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Label>Account</Menu.Label>
              <Menu.Item leftSection={<IconUser size={14} />}>
                Profile
              </Menu.Item>
              <Menu.Item leftSection={<IconSettings size={14} />}>
                Settings
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item color="red" leftSection={<IconLogout size={14} />}>
                Logout
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>

      {/* Breadcrumb Trail */}
      <Box px="md" py={rem(8)} bg="gray.0" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
        <Breadcrumbs separator={<IconChevronRight size={14} />}>
          {breadcrumbs.map((item, index) =>
            item.href ? (
              <Anchor
                key={index}
                component={Link}
                to={item.href}
                size="sm"
                c="blue"
                style={{ textDecoration: 'none' }}
              >
                {item.title}
              </Anchor>
            ) : (
              <Text key={index} size="sm" c="dimmed">
                {item.title}
              </Text>
            )
          )}
        </Breadcrumbs>
      </Box>
    </Box>
  )
}