/**
 * Model Export/Import Utilities
 * Handles importing and exporting complete model data as JSON
 */

export interface ExportedModel {
  metadata: {
    name: string;
    version: string;
    exportDate: string;
    exportedBy: string;
    description?: string;
  };
  entities: Array<{
    id: string;
    name: string;
    displayName: string;
    description?: string;
    fields: Array<{
      id: string;
      name: string;
      type: string;
      required: boolean;
      unique?: boolean;
      defaultValue?: any;
      validation?: any;
      displayName?: string;
      description?: string;
    }>;
    relationships?: Array<{
      id: string;
      name: string;
      type: 'one-to-many' | 'many-to-one' | 'many-to-many' | 'one-to-one';
      targetEntity: string;
      foreignKey?: string;
      description?: string;
    }>;
    indexes?: Array<{
      id: string;
      name: string;
      fields: string[];
      unique: boolean;
      type?: 'btree' | 'hash' | 'gin' | 'gist';
    }>;
  }>;
  layouts: Array<{
    id: string;
    name: string;
    description?: string;
    entityId?: string;
    components: Array<{
      id: string;
      type: string;
      position: {
        row: number;
        column: number;
        rowSpan: number;
        colSpan: number;
      };
      configuration: any;
      validation: Array<{
        field: string;
        message: string;
        severity: 'error' | 'warning';
      }>;
    }>;
  }>;
  customComponents?: Array<{
    id: string;
    name: string;
    type: string;
    definition: any;
  }>;
}

/**
 * Export model data to JSON
 */
export function exportModel(modelData: {
  name: string;
  description?: string;
  entities: any[];
  layouts?: any[];
  customComponents?: any[];
}): ExportedModel {
  const exportData: ExportedModel = {
    metadata: {
      name: modelData.name,
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      exportedBy: 'Model Editor',
      description: modelData.description
    },
    entities: modelData.entities.map(entity => ({
      id: entity.id,
      name: entity.name,
      displayName: entity.displayName || entity.name,
      description: entity.description,
      fields: entity.fields?.map((field: any) => ({
        id: field.id,
        name: field.name,
        type: field.fieldType || field.type, // Handle both fieldType (internal) and type (import)
        required: field.required || false,
        unique: field.unique || false,
        defaultValue: field.defaultValue,
        validation: field.validation,
        displayName: field.displayName || field.name,
        description: field.description
      })) || [],
      relationships: entity.relationships?.map((rel: any) => ({
        id: rel.id,
        name: rel.name,
        type: rel.type,
        targetEntity: rel.targetEntity,
        foreignKey: rel.foreignKey,
        description: rel.description
      })) || [],
      indexes: entity.indexes?.map((index: any) => ({
        id: index.id,
        name: index.name,
        fields: index.fields,
        unique: index.unique || false,
        type: index.type
      })) || []
    })),
    layouts: modelData.layouts?.map(layout => ({
      id: layout.id,
      name: layout.name,
      description: layout.description,
      entityId: layout.entityId,
      components: layout.components?.map((comp: any) => ({
        id: comp.id,
        type: comp.type,
        position: comp.position,
        configuration: comp.configuration,
        validation: comp.validation || []
      })) || []
    })) || [],
    customComponents: modelData.customComponents?.map(comp => ({
      id: comp.id,
      name: comp.name,
      type: comp.type,
      definition: comp.definition
    })) || []
  };

  return exportData;
}

/**
 * Download exported model as JSON file
 */
export function downloadModelAsJSON(exportData: ExportedModel, filename?: string): void {
  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `${exportData.metadata.name}-export-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Validate imported model data
 */
export interface ValidationError {
  path: string;
  message: string;
  severity: 'error' | 'warning';
}

export function validateImportedModel(data: any): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check top-level structure
  if (!data || typeof data !== 'object') {
    errors.push({
      path: 'root',
      message: 'Invalid JSON structure',
      severity: 'error'
    });
    return errors;
  }

  // Validate metadata
  if (!data.metadata) {
    errors.push({
      path: 'metadata',
      message: 'Missing metadata section',
      severity: 'error'
    });
  } else {
    if (!data.metadata.name) {
      errors.push({
        path: 'metadata.name',
        message: 'Model name is required',
        severity: 'error'
      });
    }
    if (!data.metadata.version) {
      errors.push({
        path: 'metadata.version',
        message: 'Version is required',
        severity: 'warning'
      });
    }
  }

  // Validate entities
  if (!Array.isArray(data.entities)) {
    errors.push({
      path: 'entities',
      message: 'Entities must be an array',
      severity: 'error'
    });
  } else {
    data.entities.forEach((entity: any, index: number) => {
      const basePath = `entities[${index}]`;
      
      if (!entity.id) {
        errors.push({
          path: `${basePath}.id`,
          message: 'Entity ID is required',
          severity: 'error'
        });
      }
      
      if (!entity.name) {
        errors.push({
          path: `${basePath}.name`,
          message: 'Entity name is required',
          severity: 'error'
        });
      }

      // Validate entity fields
      if (!Array.isArray(entity.fields)) {
        errors.push({
          path: `${basePath}.fields`,
          message: 'Entity fields must be an array',
          severity: 'warning'
        });
      } else {
        entity.fields.forEach((field: any, fieldIndex: number) => {
          const fieldPath = `${basePath}.fields[${fieldIndex}]`;
          
          if (!field.id) {
            errors.push({
              path: `${fieldPath}.id`,
              message: 'Field ID is required',
              severity: 'error'
            });
          }
          
          if (!field.name) {
            errors.push({
              path: `${fieldPath}.name`,
              message: 'Field name is required',
              severity: 'error'
            });
          }
          
          if (!field.type) {
            errors.push({
              path: `${fieldPath}.type`,
              message: 'Field type is required',
              severity: 'error'
            });
          }
        });
      }

      // Validate relationships
      if (entity.relationships && !Array.isArray(entity.relationships)) {
        errors.push({
          path: `${basePath}.relationships`,
          message: 'Relationships must be an array',
          severity: 'warning'
        });
      }
    });
  }

  // Validate layouts
  if (data.layouts && !Array.isArray(data.layouts)) {
    errors.push({
      path: 'layouts',
      message: 'Layouts must be an array',
      severity: 'warning'
    });
  } else if (data.layouts) {
    data.layouts.forEach((layout: any, index: number) => {
      const basePath = `layouts[${index}]`;
      
      if (!layout.id) {
        errors.push({
          path: `${basePath}.id`,
          message: 'Layout ID is required',
          severity: 'error'
        });
      }
      
      if (!layout.name) {
        errors.push({
          path: `${basePath}.name`,
          message: 'Layout name is required',
          severity: 'error'
        });
      }

      // Validate layout components
      if (layout.components && !Array.isArray(layout.components)) {
        errors.push({
          path: `${basePath}.components`,
          message: 'Layout components must be an array',
          severity: 'warning'
        });
      }
    });
  }

  return errors;
}

/**
 * Import model from JSON string
 */
export function importModelFromJSON(jsonString: string): {
  success: boolean;
  data?: ExportedModel;
  errors: ValidationError[];
} {
  try {
    const data = JSON.parse(jsonString);
    const errors = validateImportedModel(data);
    
    // Check if there are any critical errors
    const criticalErrors = errors.filter(err => err.severity === 'error');
    
    if (criticalErrors.length > 0) {
      return {
        success: false,
        errors
      };
    }

    return {
      success: true,
      data: data as ExportedModel,
      errors // May contain warnings
    };
  } catch (error) {
    return {
      success: false,
      errors: [{
        path: 'root',
        message: `Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error'
      }]
    };
  }
}

/**
 * Convert imported model data to internal format
 */
export function convertImportedModelToInternal(importedModel: ExportedModel) {
  return {
    name: importedModel.metadata.name,
    description: importedModel.metadata.description,
    entities: importedModel.entities.map(entity => ({
      id: entity.id,
      name: entity.name,
      displayName: entity.displayName,
      description: entity.description,
      fields: entity.fields.map(field => ({
        id: field.id,
        name: field.name,
        fieldType: field.type, // Map imported 'type' to internal 'fieldType'
        required: field.required,
        unique: field.unique,
        defaultValue: field.defaultValue,
        validation: field.validation,
        displayName: field.displayName,
        description: field.description
      })),
      relationships: entity.relationships || [],
      indexes: entity.indexes || []
    })),
    layouts: importedModel.layouts?.map(layout => ({
      id: layout.id,
      name: layout.name,
      description: layout.description,
      entityId: layout.entityId,
      components: layout.components.map(comp => ({
        id: comp.id,
        type: comp.type,
        position: comp.position,
        configuration: comp.configuration,
        validation: comp.validation
      }))
    })) || [],
    customComponents: importedModel.customComponents || []
  };
}