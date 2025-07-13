// TypeScript types for Torque Model System

export interface Model {
  id: string // UUID as string
  name: string
  description?: string
  version: string
  createdAt: string // ISO 8601 datetime string
  updatedAt: string // ISO 8601 datetime string
  createdBy: string // UUID as string
  config: Record<string, any>
  entities: Entity[]
  relationships: Relationship[]
  flows: Flow[]
  layouts: Layout[]
  validations: Validation[]
}

export interface Entity {
  id: string // UUID as string
  name: string
  displayName: string
  description?: string
  entityType: EntityType
  fields: Field[]
  constraints: Constraint[]
  indexes: Index[]
  uiConfig: Record<string, any>
  behavior: Record<string, any>
}

export interface Field {
  id: string // UUID as string
  name: string
  displayName: string
  fieldType: FieldType
  required: boolean
  defaultValue?: any
  validation: FieldValidationRule[]
  uiConfig: Record<string, any>
}

export interface Relationship {
  id: string // UUID as string
  name: string
  relationshipType: RelationshipType
  fromEntity: string
  toEntity: string
  fromField: string
  toField: string
  cascade: CascadeAction
  uiConfig: Record<string, any>
}

export interface Flow {
  id: string // UUID as string
  name: string
  flowType: FlowType
  trigger: Record<string, any>
  steps: FlowStep[]
  errorHandling: Record<string, any>
}

export interface FlowStep {
  id: string // UUID as string
  name: string
  stepType: FlowStepType
  condition?: string
  configuration: Record<string, any>
}

export interface Layout {
  id: string // UUID as string
  name: string
  layoutType: LayoutType
  targetEntities: string[]
  components: LayoutComponent[]
  responsive: Record<string, any>
}

export interface LayoutComponent {
  id: string // UUID as string
  componentType: string
  position: Record<string, any>
  properties: Record<string, any>
  styling: Record<string, any>
}

export interface Validation {
  id: string // UUID as string
  name: string
  validationType: ValidationType
  scope: Record<string, any>
  rule: string
  message: string
  severity: ValidationSeverity
}

export interface Constraint {
  constraintType: ConstraintType
  name: string
  fields: string[]
  message?: string
}

export interface Index {
  name: string
  fields: string[]
  indexType: IndexType
  unique: boolean
}

export interface FieldValidationRule {
  validationType: Record<string, any>
  message: string
  severity: ValidationSeverity
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationMessage[]
  warnings: ValidationMessage[]
}

export interface ValidationMessage {
  message: string
  field?: string
  code: string
}

// Enums
export enum EntityType {
  Data = 'Data',
  Lookup = 'Lookup',
  Audit = 'Audit',
  Temporary = 'Temporary',
  View = 'View',
}

export enum FieldType {
  String = 'String',
  Integer = 'Integer',
  Float = 'Float',
  Boolean = 'Boolean',
  DateTime = 'DateTime',
  Date = 'Date',
  Time = 'Time',
  Json = 'Json',
  Binary = 'Binary',
  Enum = 'Enum',
  Reference = 'Reference',
  Array = 'Array',
}

export enum RelationshipType {
  OneToOne = 'OneToOne',
  OneToMany = 'OneToMany',
  ManyToOne = 'ManyToOne',
  ManyToMany = 'ManyToMany',
}

export enum CascadeAction {
  None = 'None',
  Delete = 'Delete',
  SetNull = 'SetNull',
  Restrict = 'Restrict',
}

export enum FlowType {
  Validation = 'Validation',
  Automation = 'Automation',
  Approval = 'Approval',
  Notification = 'Notification',
  Custom = 'Custom',
}

export enum FlowStepType {
  Validation = 'Validation',
  Transformation = 'Transformation',
  Notification = 'Notification',
  Integration = 'Integration',
  Approval = 'Approval',
  Custom = 'Custom',
}

export enum LayoutType {
  List = 'List',
  Grid = 'Grid',
  Dashboard = 'Dashboard',
  Form = 'Form',
  Detail = 'Detail',
  Custom = 'Custom',
}

export enum ValidationType {
  EntityValidation = 'EntityValidation',
  RelationshipValidation = 'RelationshipValidation',
  BusinessRule = 'BusinessRule',
  DataIntegrity = 'DataIntegrity',
}

export enum ValidationSeverity {
  Error = 'Error',
  Warning = 'Warning',
  Info = 'Info',
}

export enum ConstraintType {
  PrimaryKey = 'PrimaryKey',
  UniqueKey = 'UniqueKey',
  ForeignKey = 'ForeignKey',
  Check = 'Check',
}

export enum IndexType {
  BTree = 'BTree',
  Hash = 'Hash',
  Gin = 'Gin',
  Gist = 'Gist',
}

// Input types for mutations
export interface CreateModelInput {
  name: string
  description?: string
  config?: Record<string, any>
}

export interface UpdateModelInput {
  name?: string
  description?: string
  config?: Record<string, any>
}

export interface CreateEntityInput {
  modelId: string
  name: string
  displayName: string
  description?: string
  entityType: EntityType
  fields: CreateFieldInput[]
  uiConfig?: Record<string, any>
  behavior?: Record<string, any>
}

export interface CreateFieldInput {
  name: string
  displayName: string
  fieldType: FieldType
  required: boolean
  defaultValue?: any
  validation?: FieldValidationRule[]
  uiConfig?: Record<string, any>
}