import { Container, Title, Text, Button, Stack, Group } from '@mantine/core'
import { useCapabilities } from '../hooks/useJsonRpc'

export function Home() {
  const { data: capabilities, loading, error } = useCapabilities()

  const handleOpenSampleApp = () => {
    // TODO: Create a sample model and navigate to it
    // For now, just show a placeholder message
    alert('Sample app functionality coming soon!')
  }

  return (
    <Container size="md" p="xl">
      <Stack gap="xl" align="center">
        <div style={{ textAlign: 'center' }}>
          <Title order={1} mb="md">
            TorqueApp Runtime
          </Title>
          <Text size="lg" c="dimmed">
            Dynamic application runtime powered by model definitions
          </Text>
        </div>

        {error && (
          <div style={{ color: 'red', textAlign: 'center' }}>
            Error connecting to TorqueApp API: {error}
          </div>
        )}

        {loading && (
          <Text>Loading capabilities...</Text>
        )}

        {capabilities && (
          <Stack gap="md" align="center">
            <div style={{ textAlign: 'center' }}>
              <Text fw={500}>TorqueApp Runtime v{capabilities.version}</Text>
              <Text size="sm" c="dimmed">API Version {capabilities.apiVersion}</Text>
            </div>

            <div>
              <Text fw={500} mb="xs">Supported Features:</Text>
              <Text size="sm" c="dimmed">
                {capabilities.features.join(', ')}
              </Text>
            </div>

            <div>
              <Text fw={500} mb="xs">Supported Components:</Text>
              <Text size="sm" c="dimmed">
                {capabilities.supportedComponents.join(', ')}
              </Text>
            </div>
          </Stack>
        )}

        <Group>
          <Button onClick={handleOpenSampleApp}>
            Open Sample App
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.open('http://localhost:3000', '_blank')}
          >
            Open Model Editor
          </Button>
        </Group>

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Text size="sm" c="dimmed">
            To run a TorqueApp, provide a model ID in the URL:<br />
            <code>/app/[modelId]</code> or <code>/app/[modelId]/[pageName]</code>
          </Text>
        </div>
      </Stack>
    </Container>
  )
}