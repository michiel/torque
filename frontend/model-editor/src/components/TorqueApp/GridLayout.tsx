import React, { memo } from 'react'
import { Box, Alert } from '@mantine/core'
import type { ComponentConfig } from '../../types/jsonrpc'
import { TorqueDataGrid } from './TorqueDataGrid'
import { TorqueText } from './TorqueText'
import { TorqueContainer } from './TorqueContainer'
import { TorqueButton } from './TorqueButton'

interface GridLayoutProps {
  components: ComponentConfig[]
  modelId: string
  onAction?: (action: any) => void
}

export const GridLayout = memo(function GridLayout({ 
  components, 
  modelId, 
  onAction 
}: GridLayoutProps) {
  return (
    <Box
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gridTemplateRows: 'repeat(12, 1fr)',
        gap: '8px',
        height: '100%',
        minHeight: '600px',
        padding: '16px'
      }}
    >
      {components.map((component) => (
        <Box
          key={component.id}
          style={{
            gridColumn: `${component.position.col + 1} / span ${component.position.span}`,
            gridRow: `${component.position.row + 1} / span 1`,
            minHeight: '40px'
          }}
        >
          {renderComponent(component, modelId, onAction)}
        </Box>
      ))}
    </Box>
  )
})

function renderComponent(
  component: ComponentConfig, 
  modelId: string, 
  onAction?: (action: any) => void
): React.ReactNode {
  switch (component.type) {
    case 'DataGrid':
      return (
        <TorqueDataGrid
          id={component.id}
          modelId={modelId}
          properties={component.properties}
          onAction={onAction}
        />
      )
    
    case 'Text':
      return (
        <TorqueText
          id={component.id}
          properties={component.properties}
        />
      )
    
    case 'Container':
      return (
        <TorqueContainer
          id={component.id}
          properties={component.properties}
        />
      )
    
    case 'TorqueButton':
      return (
        <TorqueButton
          id={component.id}
          properties={component.properties}
          onAction={onAction}
        />
      )
    
    default:
      return (
        <Alert color="orange">
          Unknown component: {component.type}
        </Alert>
      )
  }
}