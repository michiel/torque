// JSON-RPC 2.0 types for TorqueApp API communication

export interface JsonRpcRequest {
  jsonrpc: '2.0'
  method: string
  params?: Record<string, any>
  id: string | number
}

export interface JsonRpcResponse<T = any> {
  jsonrpc: '2.0'
  id: string | number
  result?: T
  error?: JsonRpcError
}

export interface JsonRpcError {
  code: number
  message: string
  data?: any
}

// TorqueApp specific method parameters and responses
export interface LoadPageParams {
  modelId: string
  pageName?: string
}

export interface LoadPageResponse {
  modelId: string
  pageName: string
  layout: PageLayout
  metadata: {
    modelName: string
    modelVersion: string
    loadedAt: string
  }
}

export interface LoadEntityDataParams {
  modelId: string
  entityName: string
  page?: number
  limit?: number
  filters?: Record<string, any>
}

export interface LoadEntityDataResponse {
  modelId: string
  entityName: string
  data: any[]
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
}

export interface GetFormDefinitionParams {
  modelId: string
  entityName: string
}

export interface GetFormDefinitionResponse {
  modelId: string
  entityName: string
  form: FormDefinition
}

export interface CreateEntityParams {
  modelId: string
  entityName: string
  data: Record<string, any>
}

export interface CreateEntityResponse {
  id: string
  modelId: string
  entityName: string
  data: Record<string, any>
  createdAt: string
}

export interface UpdateEntityParams {
  entityId: string
  data: Record<string, any>
}

export interface UpdateEntityResponse {
  id: string
  data: Record<string, any>
  updatedAt: string
}

export interface DeleteEntityParams {
  entityId: string
}

export interface DeleteEntityResponse {
  id: string
  deleted: boolean
  deletedAt: string
}

// UI Configuration types
export interface PageLayout {
  type: 'grid' | 'flex' | 'absolute'
  responsive?: boolean
  components: ComponentConfig[]
}

export interface ComponentConfig {
  id: string
  type: 'DataGrid' | 'TorqueForm' | 'TorqueButton' | 'Text' | 'Container' | 'Modal'
  position: {
    row: number
    col: number
    span: number
  }
  properties: Record<string, any>
}

export interface FormDefinition {
  layout: 'vertical' | 'horizontal'
  submitText: string
  cancelText: string
  fields: FormField[]
  validation: {
    validateOnBlur: boolean
    validateOnChange: boolean
  }
}

export interface FormField {
  id: string
  name: string
  label: string
  type: 'text' | 'number' | 'checkbox' | 'date' | 'datetime-local' | 'time' | 'textarea' | 'file' | 'select' | 'multiselect'
  required: boolean
  defaultValue?: any
  validation?: Record<string, any>
  uiConfig?: Record<string, any>
}

export interface DataGridColumn {
  key: string
  title: string
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'json' | 'binary' | 'enum' | 'array' | 'reference'
  sortable: boolean
  filterable: boolean
  width: number
}

// TorqueApp capabilities
export interface CapabilitiesResponse {
  version: string
  apiVersion: string
  features: string[]
  supportedComponents: string[]
  supportedLayouts: string[]
}