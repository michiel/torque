import { useParams } from 'react-router-dom'
import { Container, Alert } from '@mantine/core'
import { PageRenderer } from '../components/layout/PageRenderer'

export function TorqueApp() {
  const { modelId, pageName } = useParams<{
    modelId: string
    pageName?: string
  }>()

  if (!modelId) {
    return (
      <Container>
        <Alert color="red" title="Missing Model ID">
          No model ID provided in the URL
        </Alert>
      </Container>
    )
  }

  return (
    <Container size="xl" p="md">
      <PageRenderer 
        modelId={modelId} 
        pageName={pageName || 'main'} 
      />
    </Container>
  )
}