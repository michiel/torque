// Layout Editor Type Definitions
export interface GridPosition {
  row: number;
  column: number;
  rowSpan: number;
  colSpan: number;
}

export interface ComponentConfiguration {
  styling?: ComponentStyling;
  responsive?: ResponsiveConfig;
  dataGrid?: DataGridConfig;
  form?: FormConfig;
  button?: ButtonConfig;
  text?: TextConfig;
  container?: ContainerConfig;
}

export interface ComponentStyling {
  backgroundColor?: string;
  borderRadius?: string;
  padding?: string;
  margin?: string;
  boxShadow?: string;
}

export interface ResponsiveConfig {
  mobile?: Partial<GridPosition>;
  tablet?: Partial<GridPosition>;
  desktop?: Partial<GridPosition>;
}

export interface DataGridConfig {
  entityId: string;
  columns: ColumnConfiguration[];
  pagination: PaginationConfig;
  filtering: FilterConfig;
  sorting: SortConfig;
  actions: GridAction[];
}

export interface ColumnConfiguration {
  id: string;
  fieldId: string;
  label: string;
  type: string;
  sortable: boolean;
  filterable: boolean;
  width: string | number;
  alignment: 'left' | 'center' | 'right';
}

export interface PaginationConfig {
  enabled: boolean;
  pageSize: number;
  showSizeSelector?: boolean;
}

export interface FilterConfig {
  enabled: boolean;
  defaultFilters?: FilterRule[];
}

export interface SortConfig {
  enabled: boolean;
  defaultSort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
}

export interface GridAction {
  id: string;
  label: string;
  type: 'edit' | 'delete' | 'view' | 'custom';
  icon?: string;
  confirmation?: boolean;
}

export interface FormConfig {
  entityId: string;
  fields: FormFieldConfiguration[];
  validation: ValidationRuleSet;
  layout: FormLayout;
  submission: SubmissionConfig;
}

export interface FormFieldConfiguration {
  id: string;
  fieldId: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  validation: ValidationRule[];
  placeholder?: string;
  helpText?: string;
  colSpan: number;
}

export type FormFieldType = 'input' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'datetime' | 'file';

export interface ValidationRule {
  type: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationRuleSet {
  clientSide: boolean;
  serverSide: boolean;
  realTime: boolean;
}

export type FormLayout = 'single-column' | 'two-columns' | 'custom-grid';

export interface SubmissionConfig {
  action: 'create' | 'update' | 'custom';
  successMessage?: string;
  redirectTo?: string;
}

export interface ButtonConfig {
  label: string;
  variant: 'filled' | 'outline' | 'light' | 'subtle';
  color: string;
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  action: ButtonAction;
}

export interface ButtonAction {
  type: 'openModal' | 'navigateTo' | 'submitForm' | 'custom';
  target?: string;
  entityId?: string;
  modalConfig?: ModalConfig;
}

export interface ModalConfig {
  title: string;
  entity?: string;
  mode: 'create' | 'edit' | 'view';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface TextConfig {
  content: string;
  variant: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'caption';
  alignment: 'left' | 'center' | 'right';
  color?: string;
}

export interface ContainerConfig {
  padding: string;
  backgroundColor?: string;
  borderRadius?: string;
  border?: string;
}

export interface FilterRule {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'lt' | 'gte' | 'lte';
  value: any;
}

export interface LayoutEditorComponent {
  id: string;
  type: ComponentType;
  position: GridPosition;
  configuration: ComponentConfiguration;
  entityBinding?: EntityBinding;
  validation: ValidationResult[];
}

export type ComponentType = 'DataGrid' | 'TorqueForm' | 'TorqueButton' | 'Text' | 'Container' | 'Modal';

export interface EntityBinding {
  entityId: string;
  fields?: string[];
  relationships?: string[];
}

export interface ValidationResult {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ComponentPaletteItem {
  type: ComponentType;
  icon: string;
  label: string;
  description: string;
  category: 'data' | 'forms' | 'layout' | 'actions';
}

export interface LayoutCanvas {
  id: string;
  name: string;
  gridRows: number;
  gridColumns: number;
  components: LayoutEditorComponent[];
  responsive: ResponsiveConfig;
}

export interface DraggedComponent {
  type: ComponentType;
  sourceIndex?: number;
}