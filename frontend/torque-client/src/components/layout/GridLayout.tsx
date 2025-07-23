import { Grid } from '@mantine/core'
import type { ComponentConfig } from '../../types/jsonrpc'
import { ComponentRenderer } from '../dynamic/ComponentRenderer'

interface GridLayoutProps {
  components: ComponentConfig[]
  modelId: string
  apiBaseUrl?: string
  onAction?: (action: any) => void
}

export function GridLayout({ components, modelId, apiBaseUrl, onAction }: GridLayoutProps) {
  return (
    <Grid>
      {components.map((component) => (
        <Grid.Col
          key={component.id}
          span={component.position.span}
          offset={component.position.col}
          style={{
            order: component.position.row * 100 + component.position.col
          }}
        >
          <ComponentRenderer
            config={component}
            modelId={modelId}
            apiBaseUrl={apiBaseUrl}
            onAction={onAction}
          />
        </Grid.Col>
      ))}
    </Grid>
  )
}