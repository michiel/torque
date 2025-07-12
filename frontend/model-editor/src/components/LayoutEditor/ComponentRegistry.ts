import { ComponentType } from './types';

/**
 * Component Plugin Interface
 * Defines the structure for registering new components at runtime
 */
export interface ComponentPlugin {
  /** Unique identifier for the component */
  id: string;
  /** Component type that will be used in layouts */
  type: ComponentType;
  /** Display name in the component palette */
  label: string;
  /** Description shown in component palette */
  description: string;
  /** Icon identifier for the component */
  icon: string;
  /** Category for organizing components in palette */
  category: 'data' | 'forms' | 'actions' | 'layout' | 'media' | 'custom';
  /** Configuration schema for the component */
  configurationSchema: ComponentConfigurationSchema;
  /** Default configuration when component is first added */
  defaultConfiguration: any;
  /** Validation function for component configuration */
  validateConfiguration: (config: any) => ValidationError[];
  /** React component factory for rendering in TorqueApp */
  componentFactory?: (props: any) => React.ReactElement;
  /** Preview component for layout editor */
  previewComponent?: (props: any) => React.ReactElement;
}

/**
 * Configuration Schema Definition
 * Describes the structure and validation rules for component configuration
 */
export interface ComponentConfigurationSchema {
  /** Schema version for backward compatibility */
  version: string;
  /** Configuration sections (tabs in configuration panel) */
  sections: ConfigurationSection[];
}

export interface ConfigurationSection {
  /** Section identifier */
  id: string;
  /** Display name for the tab */
  label: string;
  /** Icon for the tab */
  icon?: string;
  /** Configuration fields in this section */
  fields: ConfigurationField[];
}

export interface ConfigurationField {
  /** Field identifier */
  id: string;
  /** Display label */
  label: string;
  /** Field type determines the input component */
  type: 'text' | 'number' | 'boolean' | 'select' | 'multiselect' | 'entity' | 'field' | 'color' | 'range';
  /** Help text or description */
  description?: string;
  /** Whether this field is required */
  required?: boolean;
  /** Default value */
  defaultValue?: any;
  /** Options for select/multiselect fields */
  options?: Array<{ value: string; label: string }>;
  /** Validation rules */
  validation?: FieldValidation;
  /** Conditional display based on other fields */
  condition?: FieldCondition;
}

export interface FieldValidation {
  /** Minimum value for numbers */
  min?: number;
  /** Maximum value for numbers */
  max?: number;
  /** Minimum length for strings */
  minLength?: number;
  /** Maximum length for strings */
  maxLength?: number;
  /** Regular expression pattern */
  pattern?: string;
  /** Custom validation function */
  custom?: (value: any, config: any) => string | null;
}

export interface FieldCondition {
  /** Field to check */
  field: string;
  /** Operator for comparison */
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains';
  /** Value to compare against */
  value: any;
}

export interface ValidationError {
  /** Field that has the error */
  field: string;
  /** Error message */
  message: string;
  /** Error severity */
  severity: 'error' | 'warning';
}

/**
 * Component Registry
 * Manages registration and retrieval of component plugins
 */
export class ComponentRegistry {
  private static instance: ComponentRegistry;
  private plugins: Map<string, ComponentPlugin> = new Map();
  private listeners: Array<(plugins: ComponentPlugin[]) => void> = [];

  private constructor() {
    // Initialize with built-in components
    this.registerBuiltInComponents();
  }

  static getInstance(): ComponentRegistry {
    if (!ComponentRegistry.instance) {
      ComponentRegistry.instance = new ComponentRegistry();
    }
    return ComponentRegistry.instance;
  }

  /**
   * Register a new component plugin
   */
  register(plugin: ComponentPlugin): void {
    // Validate plugin
    this.validatePlugin(plugin);
    
    // Register the plugin
    this.plugins.set(plugin.id, plugin);
    
    // Notify listeners
    this.notifyListeners();
  }

  /**
   * Unregister a component plugin
   */
  unregister(pluginId: string): boolean {
    const success = this.plugins.delete(pluginId);
    if (success) {
      this.notifyListeners();
    }
    return success;
  }

  /**
   * Get all registered plugins
   */
  getAll(): ComponentPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get plugin by ID
   */
  getById(id: string): ComponentPlugin | null {
    return this.plugins.get(id) || null;
  }

  /**
   * Get plugins by category
   */
  getByCategory(category: string): ComponentPlugin[] {
    return this.getAll().filter(plugin => plugin.category === category);
  }

  /**
   * Search plugins by name or description
   */
  search(query: string): ComponentPlugin[] {
    const lowercaseQuery = query.toLowerCase();
    return this.getAll().filter(plugin => 
      plugin.label.toLowerCase().includes(lowercaseQuery) ||
      plugin.description.toLowerCase().includes(lowercaseQuery) ||
      plugin.type.toLowerCase().includes(lowercaseQuery)
    );
  }

  /**
   * Subscribe to plugin registry changes
   */
  subscribe(listener: (plugins: ComponentPlugin[]) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Validate component configuration against its schema
   */
  validateConfiguration(pluginId: string, configuration: any): ValidationError[] {
    const plugin = this.getById(pluginId);
    if (!plugin) {
      return [{ field: 'plugin', message: `Plugin ${pluginId} not found`, severity: 'error' }];
    }

    return plugin.validateConfiguration(configuration);
  }

  private validatePlugin(plugin: ComponentPlugin): void {
    if (!plugin.id) {
      throw new Error('Plugin must have an id');
    }
    if (!plugin.type) {
      throw new Error('Plugin must have a type');
    }
    if (!plugin.label) {
      throw new Error('Plugin must have a label');
    }
    if (!plugin.configurationSchema) {
      throw new Error('Plugin must have a configuration schema');
    }
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin with id ${plugin.id} is already registered`);
    }
  }

  private notifyListeners(): void {
    const plugins = this.getAll();
    this.listeners.forEach(listener => listener(plugins));
  }

  private registerBuiltInComponents(): void {
    // Register the 6 core TorqueApp components
    this.register({
      id: 'datagrid',
      type: 'DataGrid',
      label: 'Data Grid',
      description: 'Display and manage entity data in a table format',
      icon: 'table',
      category: 'data',
      configurationSchema: {
        version: '1.0',
        sections: [
          {
            id: 'basic',
            label: 'Basic',
            icon: 'settings',
            fields: [
              {
                id: 'entityId',
                label: 'Entity',
                type: 'entity',
                required: true,
                description: 'Select the entity to display in the grid'
              }
            ]
          },
          {
            id: 'columns',
            label: 'Columns',
            icon: 'table',
            fields: [
              {
                id: 'columns',
                label: 'Columns',
                type: 'field',
                description: 'Configure the columns to display'
              }
            ]
          },
          {
            id: 'settings',
            label: 'Settings',
            icon: 'gear',
            fields: [
              {
                id: 'pagination',
                label: 'Enable Pagination',
                type: 'boolean',
                defaultValue: true
              },
              {
                id: 'filtering',
                label: 'Enable Filtering',
                type: 'boolean',
                defaultValue: true
              },
              {
                id: 'sorting',
                label: 'Enable Sorting',
                type: 'boolean',
                defaultValue: true
              }
            ]
          }
        ]
      },
      defaultConfiguration: {
        dataGrid: {
          entityId: '',
          columns: [],
          pagination: { enabled: true, pageSize: 25 },
          filtering: { enabled: true },
          sorting: { enabled: true },
          actions: []
        }
      },
      validateConfiguration: (config) => {
        const errors: ValidationError[] = [];
        if (!config.dataGrid?.entityId) {
          errors.push({
            field: 'entityId',
            message: 'Entity selection is required',
            severity: 'error'
          });
        }
        if (!config.dataGrid?.columns || config.dataGrid.columns.length === 0) {
          errors.push({
            field: 'columns',
            message: 'At least one column is required',
            severity: 'warning'
          });
        }
        return errors;
      }
    });

    this.register({
      id: 'torqueform',
      type: 'TorqueForm',
      label: 'Form',
      description: 'Create and edit entity instances with validation',
      icon: 'forms',
      category: 'forms',
      configurationSchema: {
        version: '1.0',
        sections: [
          {
            id: 'basic',
            label: 'Basic',
            icon: 'settings',
            fields: [
              {
                id: 'entityId',
                label: 'Entity',
                type: 'entity',
                required: true,
                description: 'Select the entity for this form'
              }
            ]
          },
          {
            id: 'fields',
            label: 'Fields',
            icon: 'form',
            fields: [
              {
                id: 'fields',
                label: 'Form Fields',
                type: 'field',
                description: 'Configure the form fields'
              }
            ]
          },
          {
            id: 'settings',
            label: 'Settings',
            icon: 'gear',
            fields: [
              {
                id: 'layout',
                label: 'Layout Style',
                type: 'select',
                options: [
                  { value: 'single-column', label: 'Single Column' },
                  { value: 'two-column', label: 'Two Columns' },
                  { value: 'three-column', label: 'Three Columns' },
                  { value: 'flexible', label: 'Flexible Grid' }
                ],
                defaultValue: 'single-column'
              },
              {
                id: 'submitAction',
                label: 'Submit Action',
                type: 'select',
                options: [
                  { value: 'create', label: 'Create New Record' },
                  { value: 'update', label: 'Update Record' },
                  { value: 'upsert', label: 'Create or Update' },
                  { value: 'custom', label: 'Custom Action' }
                ],
                defaultValue: 'create'
              }
            ]
          }
        ]
      },
      defaultConfiguration: {
        form: {
          entityId: '',
          fields: [],
          validation: { clientSide: true, serverSide: true, realTime: true },
          layout: 'single-column',
          submission: { action: 'create' }
        }
      },
      validateConfiguration: (config) => {
        const errors: ValidationError[] = [];
        if (!config.form?.entityId) {
          errors.push({
            field: 'entityId',
            message: 'Entity selection is required',
            severity: 'error'
          });
        }
        if (!config.form?.fields || config.form.fields.length === 0) {
          errors.push({
            field: 'fields',
            message: 'At least one field is required for the form',
            severity: 'error'
          });
        }
        return errors;
      }
    });

    // Register other built-in components (Button, Text, Container, Modal)
    this.registerSimpleComponent('torquebutton', 'TorqueButton', 'Button', 'Interactive button with configurable actions', 'click', 'actions');
    this.registerSimpleComponent('text', 'Text', 'Text', 'Display formatted text content', 'typography', 'layout');
    this.registerSimpleComponent('container', 'Container', 'Container', 'Layout container for organizing components', 'box', 'layout');
    this.registerSimpleComponent('modal', 'Modal', 'Modal', 'Overlay dialog for forms and detailed views', 'modal', 'actions');
  }

  private registerSimpleComponent(id: string, type: ComponentType, label: string, description: string, icon: string, category: ComponentPlugin['category']): void {
    this.register({
      id,
      type,
      label,
      description,
      icon,
      category,
      configurationSchema: {
        version: '1.0',
        sections: [
          {
            id: 'basic',
            label: 'Basic',
            icon: 'settings',
            fields: [
              {
                id: 'label',
                label: 'Label',
                type: 'text',
                description: `Label for the ${label.toLowerCase()}`
              }
            ]
          }
        ]
      },
      defaultConfiguration: {
        [id]: {
          label: label
        }
      },
      validateConfiguration: () => [] // No specific validation for simple components
    });
  }
}

// Export singleton instance
export const componentRegistry = ComponentRegistry.getInstance();