import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Box,
  NavLink,
  Text,
  Group,
  ActionIcon,
  Paper,
  TextInput,
  Stack,
} from '@mantine/core'
import {
  IconHome,
  IconPlus,
  IconSearch,
  IconSettings,
  IconDatabase,
  IconBrandGithub,
} from '@tabler/icons-react'
import { ConnectionStatus } from './ConnectionStatus'

export function Navigation() {
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState('')

  const navItems = [
    { label: 'Models', icon: IconHome, href: '/models' },
    { label: 'Create Model', icon: IconPlus, href: '/models/new' },
  ]

  return (
    <Stack gap="md" p="md" h="100vh">
      {/* Header */}
      <Paper p="sm" bg="dark.7">
        <Group justify="space-between">
          <Group>
            <IconDatabase size={24} color="white" />
            <Text fw={600} c="white" size="lg">
              Torque Model Editor
            </Text>
          </Group>
          <ConnectionStatus />
        </Group>
      </Paper>

      {/* Search */}
      <TextInput
        placeholder="Search models..."
        leftSection={<IconSearch size={16} />}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.currentTarget.value)}
      />

      {/* Navigation Items */}
      <Stack gap="xs" flex={1}>
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            component={Link}
            to={item.href}
            label={item.label}
            leftSection={<item.icon size={20} />}
            active={location.pathname === item.href}
            variant="filled"
          />
        ))}
      </Stack>

      {/* Footer */}
      <Box>
        <Group justify="space-between">
          <ActionIcon
            variant="subtle"
            component="a"
            href="https://github.com/michiel/torque"
            target="_blank"
            rel="noopener noreferrer"
          >
            <IconBrandGithub size={16} />
          </ActionIcon>
          <ActionIcon variant="subtle">
            <IconSettings size={16} />
          </ActionIcon>
        </Group>
        <Text size="xs" c="dimmed" ta="center" mt="xs">
          v1.0.0
        </Text>
      </Box>
    </Stack>
  )
}