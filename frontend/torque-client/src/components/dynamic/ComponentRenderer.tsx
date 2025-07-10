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
  onAction?: (action: any) => void
}

export function ComponentRenderer({ config, modelId, onAction }: ComponentRendererProps) {
  const { type, properties } = config

  const baseProps = {
    id: config.id,
    modelId,
    onAction
  }

  switch (type) {
    case 'DataGrid':
      return (
        <DataGrid 
          {...baseProps}
          entityName={properties.entityName || 'Unknown'}
          columns={properties.columns || []}
          features={properties.features || []}
          pageSize={properties.pageSize || 20}
        />
      )
    
    case 'TorqueForm':
      return (
        <TorqueForm 
          {...baseProps}
          entityName={properties.entityName || 'Unknown'}
          entityId={properties.entityId}
        />
      )
    
    case 'TorqueButton':
      return (
        <TorqueButton 
          {...baseProps}
          text={properties.text || 'Button'}
          variant={properties.variant}
          size={properties.size}
          disabled={properties.disabled}
          action={properties.action}
        />
      )
    
    case 'Text':
      return (
        <Text 
          {...baseProps}
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
          {...baseProps}
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
          {...baseProps}
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
}