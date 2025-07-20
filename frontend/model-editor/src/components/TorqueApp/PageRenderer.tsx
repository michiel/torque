import { useState, useCallback, memo } from 'react'
import { LoadingOverlay, Alert, Box, Text, Center, Stack, ThemeIcon } from '@mantine/core'
import { IconDeviceDesktop } from '@tabler/icons-react'
import { useLoadPage } from '../../hooks/useJsonRpc'
import { GridLayout } from './GridLayout'

interface PageRendererProps {
  modelId: string
  pageName?: string
}

export const PageRenderer = memo(function PageRenderer({ modelId, pageName }: PageRendererProps) {
  const { data, loading, error } = useLoadPage(modelId, pageName)
  const [modalState, setModalState] = useState<{
    opened: boolean
    type?: string
    entityName?: string
    entityId?: string
  }>({
    opened: false
  })

  const handleAction = useCallback((action: any) => {
    console.log('Page action:', action)
    
    switch (action.type) {
      case 'openModal':
        setModalState({
          opened: true,
          type: action.modalType,
          entityName: action.entityName,
          entityId: action.entityId
        })
        break
      
      case 'closeModal':
        setModalState({ opened: false })
        break
      
      case 'edit':
        setModalState({
          opened: true,
          type: 'form',
          entityName: action.entityName,
          entityId: action.entityId
        })
        break
      
      case 'delete':
        // TODO: Implement delete confirmation
        console.log('Delete action:', action)
        break
      
      case 'navigateTo':
        // TODO: Implement navigation
        console.log('Navigate action:', action)
        break
      
      default:
        console.warn('Unknown action type:', action.type)
    }
  }, [])

  if (loading) {
    return (
      <Box style={{ position: 'relative', minHeight: '400px' }}>
        <LoadingOverlay visible />
        <Center h="100%">
          <Stack align="center" gap="md">
            <ThemeIcon size="xl" color="blue" variant="light">
              <IconDeviceDesktop size={32} />
            </ThemeIcon>
            <Text>Loading TorqueApp page...</Text>
          </Stack>
        </Center>
      </Box>
    )
  }

  if (error) {
    return (
      <Alert color="red" title="Error loading page">
        {error}
      </Alert>
    )
  }

  if (!data) {
    return (
      <Alert color="yellow" title="No page data">
        Page data not found for model {modelId}
        {pageName && ` (page: ${pageName})`}
      </Alert>
    )
  }

  const { layout } = data

  return (
    <Box style={{ height: '100%', minHeight: '400px' }}>
      {/* Main page content */}
      {layout.type === 'grid' && (
        <GridLayout
          components={layout.components}
          modelId={modelId}
          onAction={handleAction}
        />
      )}

      {/* TODO: Add modal support for forms and other overlays */}
    </Box>
  )
})