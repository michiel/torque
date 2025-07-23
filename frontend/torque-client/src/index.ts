// Export the embeddable TorqueApp component for use in other React applications
export { default as TorqueAppEmbed } from './components/TorqueAppEmbed'
export type { TorqueAppEmbedProps } from './components/TorqueAppEmbed'

// Export core types for TypeScript users
export type { 
  JsonRpcRequest, 
  JsonRpcResponse, 
  JsonRpcError,
  ComponentConfig,
  DataGridColumn 
} from './types/jsonrpc'

// Export JSON-RPC client for advanced use cases
export { JsonRpcClient, JsonRpcClientError } from './services/jsonrpc-client'

// Export hooks for custom implementations
export { 
  useJsonRpc,
  useLoadPage,
  useLoadEntityData,
  useFormDefinition,
  useModelMetadata,
  useCapabilities,
  useJsonRpcMutation
} from './hooks/useJsonRpc'