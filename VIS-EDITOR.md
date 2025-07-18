# Visual Layout Editor Implementation Proposal

## Overview

This document proposes a complete replacement of the current custom layout editor with a new implementation based on Puck Editor (https://github.com/measuredco/puck), following the specifications outlined in DESIGN-MODEL-EDITOR.md. The new Visual Layout Editor will provide a more robust, extensible, and user-friendly interface for designing TorqueApp layouts.

## Rationale for Complete Replacement

### Current Limitations
1. **Custom Implementation Complexity**: The current `@dnd-kit` based editor requires extensive custom logic for drag-and-drop, grid management, and component configuration
2. **Limited Extensibility**: Adding new component types requires significant code changes across multiple files
3. **No Visual Preview**: Users can't see how their layouts will actually look in the TorqueApp
4. **Grid-Only Layout**: Constrains users to a rigid 12-column grid system
5. **Configuration UX**: Component configuration is separated from the visual editor, making it harder to see changes in real-time
6. **Maintenance Overhead**: Custom implementation requires ongoing maintenance and feature development

### Benefits of Puck Editor
1. **Visual WYSIWYG Editing**: Real-time preview of exactly how components will appear
2. **Flexible Layout System**: Not constrained to grids - supports free-form layouts, containers, and nested components
3. **Component Plugin Architecture**: Easy to add new component types through a standardized plugin system
4. **Inline Configuration**: Component properties can be edited directly within the visual editor
5. **Responsive Design**: Built-in support for responsive breakpoints
6. **Production Ready**: Mature, well-tested library with active development
7. **TypeScript Native**: Full TypeScript support with excellent type safety

## Technical Architecture

### Core Integration

#### Puck Integration Layer
```typescript
// src/components/VisualLayoutEditor/PuckIntegration.tsx
import { Puck, Data } from '@measured/puck';
import { TorqueComponentConfig } from './TorqueComponents';

interface VisualLayoutEditorProps {
  modelId: string;
  layoutId?: string;
  entities: Entity[];
  initialData?: Data;
  onSave: (data: Data) => void;
  onPreview: (data: Data) => void;
}

export const VisualLayoutEditor: React.FC<VisualLayoutEditorProps> = ({
  modelId,
  layoutId,
  entities,
  initialData,
  onSave,
  onPreview
}) => {
  return (
    <Puck
      config={TorqueComponentConfig}
      data={initialData || { content: [], root: {} }}
      onPublish={onSave}
    />
  );
};
```

#### Component Configuration System
```typescript
// src/components/VisualLayoutEditor/TorqueComponents/index.ts
import { Config } from '@measured/puck';
import { DataGridComponent } from './DataGrid';
import { TorqueFormComponent } from './TorqueForm';
import { TorqueButtonComponent } from './TorqueButton';
import { TextComponent } from './Text';
import { ContainerComponent } from './Container';

export const TorqueComponentConfig: Config = {
  components: {
    DataGrid: DataGridComponent,
    TorqueForm: TorqueFormComponent,
    TorqueButton: TorqueButtonComponent,
    Text: TextComponent,
    Container: ContainerComponent,
  },
  categories: {
    data: {
      title: 'Data Components',
      components: ['DataGrid']
    },
    forms: {
      title: 'Form Components', 
      components: ['TorqueForm', 'TorqueButton']
    },
    layout: {
      title: 'Layout Components',
      components: ['Container', 'Text']
    }
  }
};
```

### Component Implementation Pattern

#### DataGrid Component Example
```typescript
// src/components/VisualLayoutEditor/TorqueComponents/DataGrid.tsx
import { ComponentConfig } from '@measured/puck';
import { DataGrid as TorqueDataGrid } from '../../TorqueApp/DataGrid';

export interface DataGridProps {
  entityId?: string;
  columns: Array<{
    id: string;
    fieldId: string;
    label: string;
    sortable: boolean;
    filterable: boolean;
  }>;
  pagination: {
    enabled: boolean;
    pageSize: number;
  };
  title?: string;
}

export const DataGridComponent: ComponentConfig<DataGridProps> = {
  fields: {
    title: { type: 'text', label: 'Title' },
    entityId: { 
      type: 'select', 
      label: 'Entity',
      options: (ctx) => ctx.entities?.map(e => ({ 
        label: e.displayName, 
        value: e.id 
      })) || []
    },
    columns: {
      type: 'array',
      label: 'Columns',
      getItemSummary: (item) => item.label || 'Column',
      arrayFields: {
        fieldId: { 
          type: 'select',
          label: 'Field',
          options: (ctx, { entityId }) => 
            ctx.entities?.find(e => e.id === entityId)?.fields
              ?.map(f => ({ label: f.displayName, value: f.id })) || []
        },
        label: { type: 'text', label: 'Display Label' },
        sortable: { type: 'checkbox', label: 'Sortable' },
        filterable: { type: 'checkbox', label: 'Filterable' }
      }
    },
    pagination: {
      type: 'object',
      label: 'Pagination',
      objectFields: {
        enabled: { type: 'checkbox', label: 'Enable Pagination' },
        pageSize: { type: 'number', label: 'Page Size', min: 1, max: 100 }
      }
    }
  },
  defaultProps: {
    entityId: '',
    columns: [],
    pagination: { enabled: true, pageSize: 25 },
    title: 'Data Grid'
  },
  render: ({ entityId, columns, pagination, title }) => (
    <div>
      {title && <h3>{title}</h3>}
      <TorqueDataGrid 
        entityId={entityId}
        columns={columns}
        pagination={pagination}
        preview={true}
      />
    </div>
  )
};
```

## Implementation Plan

### Phase 1: Foundation (Week 1-2)
1. **Setup Puck Editor**
   - Install `@measured/puck` package
   - Create basic integration wrapper
   - Setup TypeScript types and interfaces

2. **Core Infrastructure**
   - Create `VisualLayoutEditor` main component
   - Implement data transformation layer (Puck Data ↔ Torque Layout JSON)
   - Setup basic routing integration

3. **Basic Components**
   - Implement Text component with inline editing
   - Implement Container component with styling options
   - Create component registry system

### Phase 2: Data Components (Week 3-4)
1. **DataGrid Integration**
   - Port existing DataGrid logic to Puck component
   - Implement column configuration UI
   - Add entity selection and field mapping
   - Include pagination and filtering controls

2. **Form Components**
   - Implement TorqueForm component with field builder
   - Add form validation configuration
   - Create form layout options (single/multi-column)
   - Implement field type mapping

3. **Interactive Components**
   - Implement TorqueButton with action configuration
   - Add modal trigger capabilities
   - Implement navigation actions

### Phase 3: Advanced Features (Week 5-6)
1. **Responsive Design**
   - Configure Puck responsive breakpoints
   - Implement mobile/tablet/desktop previews
   - Add responsive property controls

2. **Styling System**
   - Create comprehensive styling controls
   - Implement theme integration with Mantine
   - Add preset style templates

3. **Real-time Preview**
   - Implement live preview mode
   - Add preview in new window/tab capability
   - Connect to TorqueApp runtime for accurate preview

### Phase 4: Integration & Migration (Week 7-8)
1. **Backend Integration**
   - Update GraphQL mutations for new layout format
   - Implement data migration from old to new format
   - Add backward compatibility layer

2. **Testing & Documentation**
   - Create comprehensive test suite
   - Add Storybook stories for all components
   - Write user documentation

3. **Migration Path**
   - Create migration utility for existing layouts
   - Implement feature flag for gradual rollout
   - Remove old layout editor code

## Data Model Changes

### New Layout Storage Format
```json
{
  "id": "layout-uuid",
  "name": "Customer Dashboard",
  "type": "Dashboard",
  "puckData": {
    "content": [
      {
        "type": "Container",
        "props": {
          "padding": "20px",
          "backgroundColor": "#f8f9fa"
        },
        "children": [
          {
            "type": "DataGrid",
            "props": {
              "entityId": "customer-entity-id",
              "title": "Customer List",
              "columns": [
                {
                  "fieldId": "name",
                  "label": "Customer Name",
                  "sortable": true,
                  "filterable": true
                }
              ],
              "pagination": {
                "enabled": true,
                "pageSize": 25
              }
            }
          }
        ]
      }
    ],
    "root": {
      "title": "Customer Dashboard",
      "responsive": {
        "mobile": { "padding": "10px" },
        "desktop": { "padding": "20px" }
      }
    }
  },
  "responsive": {
    "breakpoints": {
      "mobile": 768,
      "tablet": 1024,
      "desktop": 1200
    }
  }
}
```

### GraphQL Schema Updates
```graphql
input CreateLayoutInput {
  modelId: String!
  name: String!
  layoutType: LayoutType!
  puckData: JSON!  # Replaces components array
  responsive: JSON
  targetEntities: [String!]
}

input UpdateLayoutInput {
  name: String
  layoutType: LayoutType
  puckData: JSON!  # New format
  responsive: JSON
  targetEntities: [String!]
}
```

## Component Extension System

### Plugin Architecture
```typescript
// src/components/VisualLayoutEditor/plugins/PluginRegistry.ts
export interface TorqueComponentPlugin {
  name: string;
  category: string;
  icon: string;
  description: string;
  config: ComponentConfig;
}

export class PluginRegistry {
  private plugins: Map<string, TorqueComponentPlugin> = new Map();

  register(plugin: TorqueComponentPlugin): void {
    this.plugins.set(plugin.name, plugin);
  }

  getConfig(): Config {
    const components: Record<string, ComponentConfig> = {};
    const categories: Record<string, any> = {};

    for (const [name, plugin] of this.plugins) {
      components[name] = plugin.config;
      
      if (!categories[plugin.category]) {
        categories[plugin.category] = {
          title: plugin.category,
          components: []
        };
      }
      categories[plugin.category].components.push(name);
    }

    return { components, categories };
  }
}
```

### Custom Component Example
```typescript
// Example: Custom Chart Component Plugin
export const ChartComponentPlugin: TorqueComponentPlugin = {
  name: 'Chart',
  category: 'data',
  icon: 'chart-bar',
  description: 'Display data as charts and graphs',
  config: {
    fields: {
      chartType: {
        type: 'radio',
        label: 'Chart Type',
        options: [
          { label: 'Bar Chart', value: 'bar' },
          { label: 'Line Chart', value: 'line' },
          { label: 'Pie Chart', value: 'pie' }
        ]
      },
      entityId: { type: 'select', label: 'Data Source' },
      xAxis: { type: 'select', label: 'X-Axis Field' },
      yAxis: { type: 'select', label: 'Y-Axis Field' }
    },
    render: ({ chartType, entityId, xAxis, yAxis }) => (
      <ChartComponent 
        type={chartType}
        entityId={entityId}
        xField={xAxis}
        yField={yAxis}
      />
    )
  }
};
```

## Migration Strategy

### Backward Compatibility
1. **Dual Support Period**: Support both old and new editors for 2-3 months
2. **Data Migration Tool**: Automated conversion from old grid-based layouts to Puck format
3. **Feature Flag**: Controlled rollout with ability to revert
4. **User Training**: Documentation and videos for new editor

### Migration Process
```typescript
// Migration utility
export function migrateLegacyLayout(legacyLayout: LegacyLayout): PuckData {
  const content = legacyLayout.components.map(component => ({
    type: component.type,
    props: {
      ...component.configuration,
      // Convert grid position to absolute positioning
      style: {
        position: 'absolute',
        left: `${(component.position.column / 12) * 100}%`,
        top: `${component.position.row * 60}px`,
        width: `${(component.position.colSpan / 12) * 100}%`,
        height: `${component.position.rowSpan * 60}px`
      }
    }
  }));

  return {
    content: [{ type: 'Container', children: content }],
    root: { title: legacyLayout.name }
  };
}
```

## Benefits and Expected Outcomes

### User Experience Improvements
1. **Visual Design**: WYSIWYG editing with immediate visual feedback
2. **Intuitive Interface**: Drag-and-drop with visual component placement
3. **Real-time Configuration**: Edit properties and see changes instantly
4. **Responsive Preview**: See how layouts look on different devices
5. **Professional Results**: More polished, app-like layouts

### Developer Experience Improvements
1. **Reduced Complexity**: Leverage battle-tested library instead of custom implementation
2. **Extensibility**: Easy to add new component types through plugins
3. **TypeScript Support**: Better type safety and development experience
4. **Community**: Benefit from Puck's community and ecosystem
5. **Maintenance**: Focus on business logic instead of editor infrastructure

### Performance Benefits
1. **Optimized Rendering**: Puck is optimized for large numbers of components
2. **Lazy Loading**: Components load only when needed
3. **Virtual Scrolling**: Handle large layouts efficiently
4. **Caching**: Built-in optimization for component configurations

## Risks and Mitigations

### Technical Risks
1. **External Dependency**: Mitigated by Puck's stability and active maintenance
2. **Learning Curve**: Mitigated by comprehensive documentation and gradual rollout
3. **Data Migration**: Mitigated by thorough testing and backup procedures
4. **Performance**: Mitigated by performance testing and optimization

### User Adoption Risks
1. **Change Resistance**: Mitigated by user training and parallel support
2. **Feature Gaps**: Mitigated by feature parity analysis and plugin development
3. **Workflow Disruption**: Mitigated by gradual migration and user feedback

## Success Metrics

1. **User Adoption**: >80% of users switch to new editor within 3 months
2. **Layout Creation Speed**: 50% reduction in time to create basic layouts
3. **Component Usage**: Increased diversity of components used in layouts
4. **User Satisfaction**: >4.5/5 rating in user feedback surveys
5. **Support Tickets**: <10% increase in layout-related support requests
6. **Performance**: Layout editor loads in <2 seconds, smooth 60fps interactions

## Conclusion

The Visual Layout Editor replacement with Puck represents a strategic upgrade that will significantly improve both user and developer experience. By leveraging a mature, well-designed library, we can deliver a more powerful, intuitive, and maintainable layout editing solution while reducing our technical debt and development overhead.

The proposed implementation plan provides a structured approach to migration with minimal risk and maximum benefit to users. The plugin architecture ensures future extensibility, while the migration strategy protects existing user investments in their current layouts.