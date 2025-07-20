import { Data } from '@measured/puck';

export interface LegacyLayoutComponent {
  componentType: string;
  position: {
    row: number;
    column: number;
    width: number;
    height: number;
  };
  properties: Record<string, any>;
  styling: Record<string, any>;
  metadata?: {
    createdWith?: string;
    version?: string;
    [key: string]: any;
  };
}

export interface LegacyLayout {
  id: string;
  name: string;
  modelId: string;
  components: LegacyLayoutComponent[];
  layoutType: string;
  targetEntities?: string[];
  responsive: {
    breakpoints: Array<{
      name: string;
      minWidth: number;
      columns: number;
    }>;
  };
  puckData?: Data;
}

/**
 * Converts legacy layout format to Puck Data format
 */
export const migrateLegacyLayout = (legacyLayout: LegacyLayout): Data => {
  // If already has Puck data, return it
  if (legacyLayout.puckData) {
    return legacyLayout.puckData;
  }

  // Check if this layout has components created with Visual Editor (new clean format)
  const hasCleanVisualEditorComponents = legacyLayout.components?.some(comp => 
    comp.metadata?.createdWith === 'VisualEditor'
  );

  if (hasCleanVisualEditorComponents) {
    // Convert clean Torque format to Puck format
    const content = legacyLayout.components
      .filter(comp => comp.metadata?.createdWith === 'VisualEditor')
      .map((comp, index) => ({
        type: comp.componentType,
        props: {
          ...comp.properties,
          id: `component-${index}`
        }
      }));

    return {
      content,
      root: {
        props: {
          title: legacyLayout.name || 'Layout'
        }
      }
    };
  }

  // Check if this layout has components created with Visual Editor (legacy format with _puckData)
  const hasLegacyVisualEditorComponents = legacyLayout.components?.some(comp => 
    comp.properties?._visualEditor && comp.properties?._puckData
  );

  if (hasLegacyVisualEditorComponents) {
    // Reconstruct from stored Puck data (legacy support)
    const content = legacyLayout.components
      .filter(comp => comp.properties?._puckData)
      .map(comp => {
        try {
          return JSON.parse(comp.properties._puckData);
        } catch (e) {
          console.warn('Failed to parse stored Puck data:', e);
          return null;
        }
      })
      .filter(Boolean);

    return {
      content,
      root: {
        props: {
          title: legacyLayout.name || 'Layout'
        }
      }
    };
  }

  const migratedContent = legacyLayout.components.map((comp, index) => {
    let componentType = comp.componentType;
    let props = { ...comp.properties };

    switch (comp.componentType) {
      case 'DataGrid':
        props = {
          entityType: comp.properties?.entityType || 'customer',
          columns: comp.properties?.columns || [
            { field: 'id', header: 'ID', type: 'text', sortable: true, filterable: true },
            { field: 'name', header: 'Name', type: 'text', sortable: true, filterable: true }
          ],
          showPagination: comp.properties?.showPagination ?? true,
          pageSize: comp.properties?.pageSize || 10,
          showFilters: comp.properties?.showFilters ?? true,
          showSearch: comp.properties?.showSearch ?? true,
          height: `${comp.position.height * 50}px`,
          ...props
        };
        break;

      case 'TorqueForm':
        props = {
          entityType: comp.properties?.entityType || 'customer',
          formTitle: comp.properties?.formTitle || 'Create New Entry',
          fields: comp.properties?.fields || [
            { name: 'name', label: 'Name', type: 'text', required: true }
          ],
          submitButtonText: comp.properties?.submitButtonText || 'Submit',
          cancelButtonText: comp.properties?.cancelButtonText || 'Cancel',
          showCancelButton: comp.properties?.showCancelButton ?? true,
          layout: comp.properties?.layout || 'stacked',
          spacing: comp.properties?.spacing || 'md',
          ...props
        };
        break;

      case 'TorqueButton':
        props = {
          text: comp.properties?.text || 'Button',
          variant: comp.properties?.variant || 'filled',
          size: comp.properties?.size || 'md',
          color: comp.properties?.color || 'blue',
          fullWidth: comp.properties?.fullWidth ?? false,
          disabled: comp.properties?.disabled ?? false,
          loading: comp.properties?.loading ?? false,
          icon: comp.properties?.icon || '',
          iconPosition: comp.properties?.iconPosition || 'left',
          action: comp.properties?.action || 'custom',
          ...props
        };
        break;

      case 'Text':
        props = {
          content: comp.properties?.content || comp.properties?.text || 'Text content',
          variant: comp.properties?.variant || 'body',
          alignment: comp.properties?.alignment || 'left',
          color: comp.properties?.color,
          weight: comp.properties?.weight || 'normal',
          ...props
        };
        break;

      case 'Container':
        props = {
          padding: comp.properties?.padding || '16px',
          backgroundColor: comp.properties?.backgroundColor || '#f8f9fa',
          borderRadius: comp.properties?.borderRadius || '8px',
          border: comp.properties?.border,
          minHeight: comp.properties?.minHeight || '100px',
          ...props
        };
        break;

      default:
        // For unknown component types, create a Text component with explanation
        componentType = 'Text';
        props = {
          content: `Legacy ${comp.componentType} component - please reconfigure`,
          variant: 'body',
          alignment: 'left',
          color: 'orange'
        };
    }

    return {
      type: componentType,
      props: {
        ...props,
        id: `migrated-${index}`
      }
    };
  });

  return {
    content: migratedContent,
    root: {
      title: legacyLayout.name || 'Migrated Layout'
    }
  };
};

/**
 * Converts Puck Data format to legacy layout format for backend compatibility
 * This creates a clean Torque-native format without Puck-specific references
 */
export const convertPuckToLegacyLayout = (
  puckData: Data,
  layoutId?: string,
  modelId?: string,
  existingLayout?: LegacyLayout,
  availableEntities?: Array<{ id: string; name: string; displayName: string }>
): Partial<LegacyLayout> => {
  const components = puckData.content.map((item, index) => {
    // Extract target entities from component properties
    const targetEntities = [];
    if (item.props && 'entityType' in item.props && item.props.entityType) {
      targetEntities.push(item.props.entityType);
    }

    // Create clean component properties without Puck-specific data
    const cleanProps = { ...item.props };
    
    // Remove any internal Puck properties that shouldn't be stored
    delete cleanProps.id;
    delete cleanProps.editableProps;
    delete cleanProps.droppableProps;

    return {
      componentType: item.type,
      position: {
        row: index, // Simple positioning for now
        column: 0,
        width: 12,
        height: item.type === 'DataGrid' ? 6 : item.type === 'TorqueForm' ? 8 : 2
      },
      properties: cleanProps,
      styling: {},
      // Store metadata to indicate this was created with Visual Editor
      metadata: {
        createdWith: 'VisualEditor',
        version: '1.0'
      }
    };
  });

  // Extract all target entities from components and convert to entity IDs
  const targetEntityNames = [...new Set(
    components
      .filter(comp => comp.properties && 'entityType' in comp.properties && comp.properties.entityType)
      .map(comp => comp.properties && 'entityType' in comp.properties ? comp.properties.entityType : null)
      .filter((entity): entity is string => Boolean(entity))
  )];

  // Convert entity names to entity IDs
  const targetEntities = targetEntityNames
    .map(entityName => {
      const entity = availableEntities?.find(e => e.name === entityName);
      if (!entity) {
        console.warn(`Entity with name "${entityName}" not found in available entities`);
        return null;
      }
      return entity.id;
    })
    .filter((entityId): entityId is string => Boolean(entityId));

  return {
    name: puckData.root?.props?.title || existingLayout?.name || 'New Layout',
    modelId,
    targetEntities,
    components,
    layoutType: existingLayout?.layoutType || 'Dashboard',
    responsive: existingLayout?.responsive || {
      breakpoints: [
        { name: 'mobile', minWidth: 0, columns: 1 },
        { name: 'tablet', minWidth: 768, columns: 2 },
        { name: 'desktop', minWidth: 1024, columns: 3 }
      ]
    }
    // Note: Puck-specific data is not stored - transformations happen at runtime
  };
};

/**
 * Checks if a layout needs migration
 */
export const needsMigration = (layout: LegacyLayout): boolean => {
  // No migration needed if already has Puck data
  if (layout.puckData) return false;
  
  // No migration needed if has clean Visual Editor components
  const hasCleanVisualEditorComponents = layout.components?.some(comp => 
    comp.metadata?.createdWith === 'VisualEditor'
  );
  if (hasCleanVisualEditorComponents) return false;
  
  // No migration needed if has legacy Visual Editor components
  const hasLegacyVisualEditorComponents = layout.components?.some(comp => 
    comp.properties?._visualEditor && comp.properties?._puckData
  );
  if (hasLegacyVisualEditorComponents) return false;
  
  // Migration needed if has components but no Visual Editor data
  return layout.components && layout.components.length > 0;
};

/**
 * Migrates legacy layouts with _puckData to the new clean format
 * This removes Puck-specific data and creates a clean Torque-native format
 */
export const migrateLegacyLayoutToCleanFormat = (layout: LegacyLayout): LegacyLayout => {
  const migratedComponents = layout.components?.map(comp => {
    // If component already uses clean format, return as-is
    if (comp.metadata?.createdWith === 'VisualEditor') {
      return comp;
    }

    // If component has legacy _puckData, clean it up
    if (comp.properties?._puckData || comp.properties?._visualEditor) {
      const cleanProperties = { ...comp.properties };
      
      // Remove Puck-specific properties
      delete cleanProperties._puckData;
      delete cleanProperties._visualEditor;
      delete cleanProperties.id;
      delete cleanProperties.editableProps;
      delete cleanProperties.droppableProps;

      return {
        ...comp,
        properties: cleanProperties,
        metadata: {
          createdWith: 'VisualEditor',
          version: '1.0',
          migratedFrom: 'legacy'
        }
      };
    }

    // Return component as-is if no migration needed
    return comp;
  });

  return {
    ...layout,
    components: migratedComponents || []
  };
};

/**
 * Gets migration warnings for components that might lose functionality
 */
export const getMigrationWarnings = (layout: LegacyLayout): string[] => {
  const warnings: string[] = [];

  if (!layout.components) return warnings;

  layout.components.forEach((comp, index) => {
    switch (comp.componentType) {
      case 'DataGrid':
        if (!comp.properties?.entityType) {
          warnings.push(`DataGrid component #${index + 1}: Missing entity type - will default to 'customer'`);
        }
        break;
      case 'TorqueForm':
        if (!comp.properties?.fields || comp.properties.fields.length === 0) {
          warnings.push(`TorqueForm component #${index + 1}: No fields defined - will use default fields`);
        }
        break;
      case 'TorqueButton':
        if (!comp.properties?.text) {
          warnings.push(`TorqueButton component #${index + 1}: Missing button text - will default to 'Button'`);
        }
        break;
      default:
        if (!['Text', 'Container'].includes(comp.componentType)) {
          warnings.push(`Unknown component type '${comp.componentType}' #${index + 1}: Will be converted to text component`);
        }
    }
  });

  return warnings;
};