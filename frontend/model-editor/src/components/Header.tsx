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
  useMantineColorScheme,
} from '@mantine/core'
import {
  IconHome,
  IconSettings,
  IconUser,
  IconLogout,
  IconDatabase,
  IconChevronRight,
} from '@tabler/icons-react'
import { useQuery } from '@apollo/client'
import { ConnectionStatus } from './ConnectionStatus'
import { ModelVerificationStatus } from './ModelVerificationStatus'
import { DarkModeToggle } from './DarkModeToggle'
import { GET_MODEL } from '../graphql/queries'

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
      breadcrumbs.push({ title: 'Model Overview', href: `/models/${segments[1]}` })
      
      if (segments[2] === 'editor') {
        breadcrumbs.push({ title: 'Model Editor', href: `/models/${segments[1]}/editor` })
        
        // Handle nested editor routes
        if (segments[3] === 'details') {
          breadcrumbs.push({ title: 'Edit Details' })
        } else if (segments[3] === 'entities') {
          breadcrumbs.push({ title: 'Entities' })
          
          if (segments[4] === 'new') {
            breadcrumbs.push({ title: 'Create Entity' })
          } else if (segments[4]) {
            breadcrumbs.push({ title: 'Edit Entity' })
          }
        } else if (segments[3] === 'relationships') {
          breadcrumbs.push({ title: 'Relationships' })
          
          if (segments[4] === 'new') {
            breadcrumbs.push({ title: 'Create Relationship' })
          } else if (segments[4]) {
            breadcrumbs.push({ title: 'Edit Relationship' })
          }
        } else if (segments[3] === 'layouts') {
          breadcrumbs.push({ title: 'Layouts' })
          
          if (segments[4] === 'new') {
            breadcrumbs.push({ title: 'Create Layout' })
          } else if (segments[4]) {
            breadcrumbs.push({ title: 'Edit Layout' })
          }
        } else if (segments[3] === 'erd') {
          breadcrumbs.push({ title: 'ERD Editor' })
        } else {
          // Add tab to breadcrumb if present on main editor page
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
        }
      } else if (segments[2] === 'verification') {
        breadcrumbs.push({ title: 'Model Verification' })
      } else if (segments[2] === 'previewer') {
        breadcrumbs.push({ title: 'App Previewer' })
      }
    }
  }

  return breadcrumbs
}

export function Header() {
  const location = useLocation()
  const { colorScheme } = useMantineColorScheme()
  const breadcrumbs = getBreadcrumbs(location.pathname, location.search)
  
  // Extract model ID from URL if we're on a model page
  const pathSegments = location.pathname.split('/').filter(Boolean)
  const isModelPage = pathSegments[0] === 'models' && pathSegments[1] && pathSegments[1] !== 'new'
  const modelId = isModelPage ? pathSegments[1] : null
  
  // Fetch model data when on a model page
  const { data: modelData } = useQuery(GET_MODEL, {
    variables: { id: modelId },
    skip: !modelId,
    errorPolicy: 'all',
  })
  
  const model = modelData?.model

  return (
    <Box>
      {/* Main Header */}
      <Group h={32} px="sm" justify="space-between" style={{ 
        borderBottom: colorScheme === 'dark' 
          ? '1px solid var(--mantine-color-dark-5)' 
          : '1px solid var(--mantine-color-gray-3)' 
      }}>
        {/* Left side - Logo and Nav */}
        <Group>
          <Link 
            to="/" 
            style={{ 
              textDecoration: 'none', 
              color: 'inherit'
            }}
          >
            <Group 
              gap={rem(4)} 
              style={{ 
                cursor: 'pointer'
              }}
            >
              <IconDatabase size={20} />
              <Text size="lg" fw={600}>Torque</Text>
            </Group>
          </Link>
          
          {/* Model verification status when on a model page */}
          {model && modelId && (
            <ModelVerificationStatus 
              modelId={modelId} 
              modelName={model.name}
            />
          )}
        </Group>

        {/* Right side - User menu and settings */}
        <Group>
          <ConnectionStatus />
          
          <DarkModeToggle />
          
          <ActionIcon variant="subtle" size="md">
            <IconSettings size={16} />
          </ActionIcon>

          <Menu shadow="md" width={200}>
            <Menu.Target>
              <ActionIcon variant="subtle" size="md">
                <Avatar size="xs" color="blue">
                  <IconUser size={12} />
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
      <Box 
        px="sm" 
        py={rem(4)} 
        bg={colorScheme === 'dark' ? 'dark.8' : 'gray.0'} 
        style={{ 
          borderBottom: colorScheme === 'dark' 
            ? '1px solid var(--mantine-color-dark-5)' 
            : '1px solid var(--mantine-color-gray-3)' 
        }}
      >
        <Breadcrumbs separator={<IconChevronRight size={12} />}>
          {breadcrumbs.map((item, index) =>
            item.href ? (
              <Anchor
                key={index}
                component={Link}
                to={item.href}
                size="xs"
                c="blue"
                style={{ textDecoration: 'none' }}
              >
                {item.title}
              </Anchor>
            ) : (
              <Text key={index} size="xs" c="dimmed">
                {item.title}
              </Text>
            )
          )}
        </Breadcrumbs>
      </Box>
    </Box>
  )
}