import { memo } from 'react'
import type { ComponentConfig } from '../../types/jsonrpc'
import { DataGrid } from './DataGrid'
import { TorqueForm } from './TorqueForm'
import { TorqueButton } from './TorqueButton'
import { Text } from './Text'
import { Container } from './Container'
import { Modal } from './Modal'

interface ComponentRendererProps {
  config: ComponentConfig
  modelId: string
  apiBaseUrl?: string
  onAction?: (action: any) => void
}

export const ComponentRenderer = memo(function ComponentRenderer({ config, modelId, apiBaseUrl, onAction }: ComponentRendererProps) {
  const { type, properties } = config

  // Component props will be spread individually for each component type

  switch (type) {
    case 'DataGrid':
      return (
        <DataGrid 
          id={config.id}
          modelId={modelId}
          apiBaseUrl={apiBaseUrl}
          onAction={onAction}
          entityName={properties.entityType || properties.entity || properties.entityName || 'Unknown'}
          columns={properties.columns || []}
          features={properties.features || []}
          pageSize={properties.pageSize || 20}
        />
      )
    
    case 'TorqueForm':
      return (
        <TorqueForm 
          id={config.id}
          modelId={modelId}
          entityName={properties.entityName || 'Unknown'}
          entityId={properties.entityId}
        />
      )
    
    case 'TorqueButton':
      return (
        <TorqueButton 
          id={config.id}
          text={properties.text || 'Button'}
          variant={properties.variant}
          size={properties.size}
          disabled={properties.disabled}
          action={properties.action}
          onAction={onAction}
        />
      )
    
    case 'Text':
      return (
        <Text 
          id={config.id}
          text={properties.text || 'Text'}
          variant={properties.variant}
          color={properties.color}
          align={properties.align}
          weight={properties.weight}
          size={properties.size}
        />
      )
    
    case 'Container':
      return (
        <Container 
          id={config.id}
          maxWidth={properties.maxWidth}
          padding={properties.padding}
          margin={properties.margin}
          backgroundColor={properties.backgroundColor}
          borderRadius={properties.borderRadius}
          border={properties.border}
          shadow={properties.shadow}
          minHeight={properties.minHeight}
        >
          {properties.children}
        </Container>
      )
    
    case 'Modal':
      return (
        <Modal 
          id={config.id}
          opened={properties.opened || false}
          onClose={properties.onClose || (() => {})}
          title={properties.title}
          size={properties.size}
          centered={properties.centered}
          overlayProps={properties.overlayProps}
        >
          {properties.children}
        </Modal>
      )
    
    default:
      console.warn(`Unknown component type: ${type}`)
      return (
        <div style={{ 
          padding: '1rem', 
          border: '2px dashed #ccc', 
          borderRadius: '4px',
          textAlign: 'center'
        }}>
          Unknown component: {type}
        </div>
      )
  }
})