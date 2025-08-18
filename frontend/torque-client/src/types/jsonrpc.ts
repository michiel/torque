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
    loadedAt: string // ISO 8601 datetime string
  }
}

export interface LoadEntityDataParams {
  modelId: string
  entityName: string
  page?: number
  limit?: number
  filters?: Record<string, any>
  sort?: {
    field: string
    direction: 'asc' | 'desc'
  }
  search?: string
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
  columns?: DataGridColumn[]
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
  id: string // UUID as string
  modelId: string // UUID as string
  entityName: string
  data: Record<string, any>
  createdAt: string // ISO 8601 datetime string
}

export interface UpdateEntityParams {
  entityId: string
  data: Record<string, any>
}

export interface UpdateEntityResponse {
  id: string // UUID as string
  data: Record<string, any>
  updatedAt: string // ISO 8601 datetime string
}

export interface DeleteEntityParams {
  entityId: string
}

export interface DeleteEntityResponse {
  id: string // UUID as string
  deleted: boolean
  deletedAt: string // ISO 8601 datetime string
}

// UI Configuration types
export interface PageLayout {
  type: 'grid' | 'flex' | 'absolute'
  responsive?: boolean
  components: ComponentConfig[]
}

export interface ComponentConfig {
  id: string // UUID as string
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
  id: string // UUID as string
  name: string
  label: string
  type: 'text' | 'number' | 'checkbox' | 'date' | 'datetime-local' | 'time' | 'textarea' | 'file' | 'select' | 'multiselect'
  required: boolean | ConditionalRule
  defaultValue?: any
  validation?: Record<string, any>
  uiConfig?: {
    showIf?: ConditionalRule
    requiredIf?: ConditionalRule
    section?: string
    helpText?: string
    placeholder?: string
    acceptedFileTypes?: string[]
    maxFileSize?: number
  }
}

export interface ConditionalRule {
  field: string
  operator: 'equals' | 'notEquals' | 'contains' | 'isEmpty' | 'isNotEmpty' | 'greaterThan' | 'lessThan'
  value?: any
}

export interface DataGridColumn {
  key: string
  title: string
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'json' | 'binary' | 'enum' | 'array' | 'reference'
  sortable: boolean
  filterable: boolean
  width: number
  editable?: boolean
  filterOptions?: string[]
}

export interface DataGridFilter {
  field: string
  operator: 'equals' | 'notEquals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'between' | 'in' | 'isNull' | 'isNotNull'
  value: any
  value2?: any // for 'between' operator
}

export interface DataGridSort {
  field: string
  direction: 'asc' | 'desc'
}

// TorqueApp capabilities
export interface CapabilitiesResponse {
  version: string
  apiVersion: string
  features: string[]
  supportedComponents: string[]
  supportedLayouts: string[]
}