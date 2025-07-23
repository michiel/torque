import { useState, useCallback, memo } from 'react'
import { LoadingOverlay, Alert } from '@mantine/core'
import { useLoadPage } from '../../hooks/useJsonRpc'
import { GridLayout } from './GridLayout'
import { TorqueForm } from '../dynamic/TorqueForm'
import { Modal } from '../dynamic/Modal'

interface PageRendererProps {
  modelId: string
  pageName?: string
  apiBaseUrl?: string
  onAction?: (action: any) => void
}

export const PageRenderer = memo(function PageRenderer({ modelId, pageName, apiBaseUrl, onAction: externalOnAction }: PageRendererProps) {
  const { data, loading, error } = useLoadPage(modelId, pageName, apiBaseUrl)
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
    
    // Forward action to external handler if provided
    if (externalOnAction) {
      externalOnAction(action)
    }
    
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

  const handleFormSuccess = useCallback((result: any) => {
    console.log('Form success:', result)
    setModalState({ opened: false })
    // TODO: Refresh data
  }, [])

  const handleFormCancel = useCallback(() => {
    setModalState({ opened: false })
  }, [])

  if (loading) {
    return <LoadingOverlay visible />
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
      </Alert>
    )
  }

  const { layout } = data

  return (
    <div>
      {/* Main page content */}
      {layout.type === 'grid' && (
        <GridLayout
          components={layout.components}
          modelId={modelId}
          apiBaseUrl={apiBaseUrl}
          onAction={handleAction}
        />
      )}

      {/* Modal for forms and other overlays */}
      <Modal
        id="page-modal"
        opened={modalState.opened}
        onClose={() => setModalState({ opened: false })}
        title={getModalTitle(modalState)}
        size="lg"
        centered
      >
        {modalState.type === 'form' && modalState.entityName && (
          <TorqueForm
            id="modal-form"
            modelId={modelId}
            entityName={modalState.entityName}
            entityId={modalState.entityId}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        )}
      </Modal>
    </div>
  )
})

function getModalTitle(modalState: { type?: string; entityName?: string; entityId?: string }): string {
  if (modalState.type === 'form') {
    const action = modalState.entityId ? 'Edit' : 'Create'
    return `${action} ${modalState.entityName || 'Entity'}`
  }
  
  return 'Modal'
}