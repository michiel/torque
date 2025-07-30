import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { ModalsProvider } from '@mantine/modals'
import { PageRenderer } from './layout/PageRenderer'

import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import '@mantine/dates/styles.css'

export interface TorqueAppEmbedProps {
  /** Model ID to load and render */
  modelId: string
  /** Specific page/layout to render (optional, defaults to start page) */
  pageName?: string
  /** Custom API base URL (optional, defaults to localhost:8080) */
  apiBaseUrl?: string
  /** Custom theme for Mantine (optional) */
  theme?: any
  /** Container styles (optional) */
  style?: React.CSSProperties
  /** Container class name (optional) */
  className?: string
  /** Callback for component actions (optional) */
  onAction?: (action: any) => void
}

/**
 * Embeddable TorqueApp component that can be used standalone or integrated into other React applications.
 * 
 * This component provides a complete, self-contained TorqueApp runtime that:
 * - Loads page layouts via JSON-RPC from the Torque server
 * - Renders dynamic components (DataGrid, Form, Button, etc.) based on model configuration
 * - Handles all CRUD operations and user interactions
 * - Manages its own state and API connections
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <TorqueAppEmbed 
 *   modelId="f878c0d7-b53c-4783-bafa-9f951fbac633" 
 * />
 * 
 * // With custom page and API endpoint
 * <TorqueAppEmbed 
 *   modelId="f878c0d7-b53c-4783-bafa-9f951fbac633"
 *   pageName="project_dashboard"
 *   apiBaseUrl="https://api.example.com"
 *   onAction={(action) => console.log('TorqueApp action:', action)}
 * />
 * ```
 */
export function TorqueAppEmbed({
  modelId,
  pageName,
  apiBaseUrl,
  theme,
  style,
  className,
  onAction
}: TorqueAppEmbedProps) {
  console.log('[TorqueAppEmbed] Initializing with props:', {
    modelId,
    pageName,
    apiBaseUrl: apiBaseUrl || 'default (localhost:8080)',
    hasTheme: !!theme,
    hasStyle: !!style,
    hasClassName: !!className,
    hasOnAction: !!onAction
  });

  const handleAction = (action: any) => {
    console.log('[TorqueAppEmbed] Action received:', action);
    onAction?.(action);
  };

  return (
    <div style={style} className={className}>
      <MantineProvider theme={theme}>
        <ModalsProvider>
          <Notifications />
          <PageRenderer 
            modelId={modelId}
            pageName={pageName}
            apiBaseUrl={apiBaseUrl}
            onAction={handleAction}
          />
        </ModalsProvider>
      </MantineProvider>
    </div>
  )
}

// Default export for easier importing
export default TorqueAppEmbed