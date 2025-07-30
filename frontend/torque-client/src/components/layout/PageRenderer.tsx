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
  console.log('[PageRenderer] Initializing with props:', {
    modelId,
    pageName: pageName || 'default (start page)',
    apiBaseUrl: apiBaseUrl || 'default (localhost:8080)',
    hasOnAction: !!externalOnAction
  });

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
    console.log('[PageRenderer] Action received:', action)
    
    // Forward action to external handler if provided
    if (externalOnAction) {
      console.log('[PageRenderer] Forwarding action to external handler');
      externalOnAction(action)
    }
    
    switch (action.type) {
      case 'openModal':
        console.log('[PageRenderer] Opening modal:', { modalType: action.modalType, entityName: action.entityName, entityId: action.entityId });
        setModalState({
          opened: true,
          type: action.modalType,
          entityName: action.entityName,
          entityId: action.entityId
        })
        break
      
      case 'closeModal':
        console.log('[PageRenderer] Closing modal');
        setModalState({ opened: false })
        break
      
      case 'edit':
        console.log('[PageRenderer] Opening edit form:', { entityName: action.entityName, entityId: action.entityId });
        setModalState({
          opened: true,
          type: 'form',
          entityName: action.entityName,
          entityId: action.entityId
        })
        break
      
      case 'delete':
        console.log('[PageRenderer] Delete action received (not implemented):', action)
        break
      
      case 'navigateTo':
        console.log('[PageRenderer] Navigate action received (not implemented):', action)
        break
      
      default:
        console.warn('[PageRenderer] Unknown action type:', action.type, action)
    }
  }, [])

  const handleFormSuccess = useCallback((result: any) => {
    console.log('[PageRenderer] Form success:', result)
    setModalState({ opened: false })
    // TODO: Refresh data
  }, [])

  const handleFormCancel = useCallback(() => {
    console.log('[PageRenderer] Form cancelled');
    setModalState({ opened: false })
  }, [])

  if (loading) {
    console.log('[PageRenderer] Loading page data...');
    return <LoadingOverlay visible />
  }

  if (error) {
    console.error('[PageRenderer] Error loading page:', error);
    return (
      <Alert color="red" title="Error loading page">
        {error}
      </Alert>
    )
  }

  if (!data) {
    console.warn('[PageRenderer] No page data received for model:', modelId);
    return (
      <Alert color="yellow" title="No page data">
        Page data not found for model {modelId}
      </Alert>
    )
  }

  const { layout } = data
  console.log('[PageRenderer] Page data loaded successfully:', {
    layoutType: layout?.type,
    componentCount: layout?.components?.length || 0,
    hasLayout: !!layout
  });

  return (
    <div>
      {/* Main page content */}
      {(layout.type === 'grid' || layout.type === 'dashboard') && (
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