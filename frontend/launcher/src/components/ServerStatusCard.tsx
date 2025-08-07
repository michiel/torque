import { useState, useEffect } from 'react'
import {
  Card,
  Group,
  Text,
  Badge,
  ActionIcon,
  Stack,
  Tooltip,
  Button,
  Alert,
  Collapse,
  SimpleGrid,
  RingProgress,
  Center
} from '@mantine/core'
import {
  IconServer,
  IconRefresh,
  IconPlayerPlay,
  IconPlayerStop,
  IconChevronDown,
  IconChevronUp,
  IconCpu,
  IconActivity,
  IconAlertTriangle
} from '@tabler/icons-react'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { invoke } from '@tauri-apps/api/core'
import { ServerStatus, ServerHealth, ServerMetrics } from '../types'

export function ServerStatusCard() {
  const [status, setStatus] = useState<ServerStatus | null>(null)
  const [health, setHealth] = useState<ServerHealth | null>(null)
  const [metrics, setMetrics] = useState<ServerMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [stopping, setStopping] = useState(false)
  const [showDetails, { toggle: toggleDetails }] = useDisclosure(false)

  useEffect(() => {
    loadServerStatus()
    
    // Set up periodic status checks
    const interval = setInterval(loadServerStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  const loadServerStatus = async () => {
    try {
      setLoading(true)
      
      const [serverStatus, serverHealth, serverMetrics] = await Promise.all([
        invoke<ServerStatus>('get_server_status').catch(() => null),
        invoke<ServerHealth>('get_server_health').catch(() => null),
        invoke<ServerMetrics>('get_server_metrics').catch(() => null)
      ])

      setStatus(serverStatus)
      setHealth(serverHealth)
      setMetrics(serverMetrics)
    } catch (error) {
      console.error('Failed to load server status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartServer = async () => {
    try {
      setStarting(true)
      await invoke('start_torque_server')
      
      notifications.show({
        title: 'Server Starting',
        message: 'Torque server is starting up...',
        color: 'blue'
      })

      // Wait a moment then refresh status
      setTimeout(loadServerStatus, 2000)
    } catch (error) {
      notifications.show({
        title: 'Failed to Start Server',
        message: error instanceof Error ? error.message : 'Unknown error',
        color: 'red'
      })
    } finally {
      setStarting(false)
    }
  }

  const handleStopServer = async () => {
    try {
      setStopping(true)
      await invoke('stop_torque_server')
      
      notifications.show({
        title: 'Server Stopping',
        message: 'Torque server is shutting down...',
        color: 'orange'
      })

      setTimeout(loadServerStatus, 2000)
    } catch (error) {
      notifications.show({
        title: 'Failed to Stop Server',
        message: error instanceof Error ? error.message : 'Unknown error',
        color: 'red'
      })
    } finally {
      setStopping(false)
    }
  }

  const getStatusColor = (running: boolean, health?: ServerHealth) => {
    if (!running) return 'gray'
    if (!health) return 'blue'
    
    switch (health.status) {
      case 'healthy': return 'green'
      case 'degraded': return 'yellow'
      case 'down': return 'red'
      default: return 'gray'
    }
  }

  const getStatusText = (running: boolean, health?: ServerHealth) => {
    if (!running) return 'Stopped'
    if (!health) return 'Running'
    
    switch (health.status) {
      case 'healthy': return 'Healthy'
      case 'degraded': return 'Degraded'
      case 'down': return 'Down'
      default: return 'Unknown'
    }
  }

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  const formatMemory = (bytes: number) => {
    const mb = bytes / (1024 * 1024)
    return `${Math.round(mb)} MB`
  }

  return (
    <Card withBorder shadow="sm" padding="lg">
      <Stack gap="md">
        <Group justify="space-between">
          <Group gap="sm">
            <IconServer size="1.5rem" />
            <div>
              <Text fw={600}>Torque Server</Text>
              <Text size="sm" c="dimmed">Backend Status</Text>
            </div>
          </Group>

          <Group gap="xs">
            <Badge 
              color={getStatusColor(status?.running || false, health || undefined)}
              variant="filled"
            >
              {getStatusText(status?.running || false, health || undefined)}
            </Badge>
            
            <Tooltip label="Refresh Status">
              <ActionIcon 
                variant="subtle" 
                onClick={loadServerStatus}
                loading={loading}
              >
                <IconRefresh size="1rem" />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>

        {status?.running && status.port && (
          <Group justify="space-between">
            <Text size="sm" c="dimmed">Port:</Text>
            <Text size="sm" fw={500}>{status.port}</Text>
          </Group>
        )}

        {health && status?.running && (
          <>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Uptime:</Text>
              <Text size="sm" fw={500}>{formatUptime(health.uptime)}</Text>
            </Group>

            <Group justify="space-between">
              <Text size="sm" c="dimmed">Database:</Text>
              <Badge 
                size="sm"
                color={health.database_status === 'connected' ? 'green' : 'red'}
                variant="outline"
              >
                {health.database_status}
              </Badge>
            </Group>

            {health.last_error && (
              <Alert 
                icon={<IconAlertTriangle size="1rem" />} 
                color="red"
              >
                <Text size="sm">{health.last_error}</Text>
              </Alert>
            )}
          </>
        )}

        {/* Action Buttons */}
        <Group>
          {status?.running ? (
            <Button
              size="sm"
              color="red"
              variant="outline"
              leftSection={<IconPlayerStop size="1rem" />}
              onClick={handleStopServer}
              loading={stopping}
            >
              Stop Server
            </Button>
          ) : (
            <Button
              size="sm"
              color="green"
              leftSection={<IconPlayerPlay size="1rem" />}
              onClick={handleStartServer}
              loading={starting}
            >
              Start Server
            </Button>
          )}

          {status?.running && health && (
            <Button
              size="sm"
              variant="subtle"
              rightSection={showDetails ? <IconChevronUp size="1rem" /> : <IconChevronDown size="1rem" />}
              onClick={toggleDetails}
            >
              {showDetails ? 'Less' : 'More'} Details
            </Button>
          )}
        </Group>

        {/* Detailed Metrics */}
        <Collapse in={showDetails && !!health && !!metrics}>
          <Stack gap="md" pt="md">
            <Text fw={600} size="sm">Performance Metrics</Text>
            
            <SimpleGrid cols={2} spacing="md">
              <Card withBorder padding="sm">
                <Stack gap="xs" align="center">
                  <Group gap="xs">
                    <IconCpu size="1rem" />
                    <Text size="sm" fw={500}>CPU Usage</Text>
                  </Group>
                  <RingProgress
                    size={60}
                    thickness={6}
                    sections={[{ value: health?.cpu_usage || 0, color: 'blue' }]}
                    label={
                      <Center>
                        <Text size="xs" fw={700}>
                          {Math.round(health?.cpu_usage || 0)}%
                        </Text>
                      </Center>
                    }
                  />
                </Stack>
              </Card>

              <Card withBorder padding="sm">
                <Stack gap="xs" align="center">
                  <Group gap="xs">
                    <IconActivity size="1rem" />
                    <Text size="sm" fw={500}>Memory</Text>
                  </Group>
                  <RingProgress
                    size={60}
                    thickness={6}
                    sections={[{ value: (health?.memory_usage || 0) / 10, color: 'green' }]}
                    label={
                      <Center>
                        <Text size="xs" fw={700}>
                          {formatMemory(health?.memory_usage || 0)}
                        </Text>
                      </Center>
                    }
                  />
                </Stack>
              </Card>
            </SimpleGrid>

            {metrics && (
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Requests/sec:</Text>
                  <Text size="sm" fw={500}>{metrics.requests_per_second.toFixed(1)}</Text>
                </Group>
                
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Avg Response:</Text>
                  <Text size="sm" fw={500}>{metrics.average_response_time.toFixed(0)}ms</Text>
                </Group>
                
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Active Sessions:</Text>
                  <Text size="sm" fw={500}>{metrics.active_sessions}</Text>
                </Group>
                
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Error Rate:</Text>
                  <Text size="sm" fw={500} c={metrics.error_rate > 5 ? 'red' : 'green'}>
                    {(metrics.error_rate * 100).toFixed(1)}%
                  </Text>
                </Group>

                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Active Connections:</Text>
                  <Text size="sm" fw={500}>{health?.active_connections || 0}</Text>
                </Group>
              </Stack>
            )}
          </Stack>
        </Collapse>
      </Stack>
    </Card>
  )
}

export default ServerStatusCard