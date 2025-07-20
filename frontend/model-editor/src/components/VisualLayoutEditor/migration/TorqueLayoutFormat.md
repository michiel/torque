# Torque Layout Format Specification

This document defines the clean, editor-agnostic layout format used by Torque to store application layouts.

## Design Principles

1. **Editor Independence**: The format should not contain references to specific visual editors (like Puck, Figma, etc.)
2. **Transformation Layer**: Visual editors work with the format through runtime transformations
3. **Future Compatibility**: Other components and editors should be able to work with this format
4. **Clean Storage**: Only essential component data is stored, no editor-specific metadata

## Layout Structure

### LegacyLayout Interface

```typescript
interface LegacyLayout {
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
  puckData?: Data; // Deprecated - only for backwards compatibility
}
```

### LegacyLayoutComponent Interface

```typescript
interface LegacyLayoutComponent {
  componentType: string;
  position: {
    row: number;
    column: number;
    width: number;
    height: number;
  };
  properties: Record<string, any>; // Clean component properties only
  styling: Record<string, any>;
  metadata?: {
    createdWith?: string;    // e.g., "VisualEditor", "CodeEditor"
    version?: string;        // Format version for future migrations
    [key: string]: any;      // Extensible metadata
  };
}
```

## Component Types

### DataGrid
```typescript
{
  componentType: "DataGrid",
  properties: {
    entityType: string;
    columns: Array<{
      field: string;
      header: string;
      type: string;
      sortable: boolean;
      filterable: boolean;
    }>;
    showPagination: boolean;
    pageSize: number;
    showFilters: boolean;
    showSearch: boolean;
    height: string;
  }
}
```

### TorqueForm
```typescript
{
  componentType: "TorqueForm",
  properties: {
    entityType: string;
    formTitle: string;
    fields: Array<{
      name: string;
      label: string;
      type: string;
      required: boolean;
    }>;
    submitButtonText: string;
    cancelButtonText: string;
    showCancelButton: boolean;
    layout: "stacked" | "inline";
    spacing: string;
  }
}
```

### TorqueButton
```typescript
{
  componentType: "TorqueButton",
  properties: {
    text: string;
    variant: "filled" | "outline" | "light";
    size: "xs" | "sm" | "md" | "lg" | "xl";
    color: string;
    fullWidth: boolean;
    disabled: boolean;
    loading: boolean;
    icon: string;
    iconPosition: "left" | "right";
    action: "custom" | "submit" | "navigate";
  }
}
```

### Text
```typescript
{
  componentType: "Text",
  properties: {
    content: string;
    variant: "body" | "h1" | "h2" | "h3" | "caption";
    alignment: "left" | "center" | "right";
    color?: string;
    weight: "normal" | "bold";
  }
}
```

### Container
```typescript
{
  componentType: "Container",
  properties: {
    padding: string;
    backgroundColor: string;
    borderRadius: string;
    border?: string;
    minHeight: string;
  }
}
```

## Migration Strategy

### From Legacy Puck Format
1. Extract component data from Puck's `content` array
2. Convert Puck component types to Torque component types
3. Clean properties by removing Puck-specific fields (`id`, `editableProps`, `droppableProps`, `_puckData`, `_visualEditor`)
4. Add metadata indicating the component was created with VisualEditor
5. Store clean format without any Puck references

### To Visual Editor Format (Runtime)
1. Convert Torque components to editor-specific format during loading
2. Apply editor-specific IDs and metadata as needed
3. Handle transformations in the visual editor component layer
4. Convert back to clean format when saving

## Backwards Compatibility

### Legacy Support
- Layouts with `puckData` field are still supported
- Components with `_puckData` properties are migrated automatically
- Migration warnings are provided for potential data loss

### Migration Functions
- `migrateLegacyLayout()`: Converts old formats to Puck format for editing
- `convertPuckToLegacyLayout()`: Converts Puck format to clean Torque format for storage
- `migrateLegacyLayoutToCleanFormat()`: Cleans up legacy layouts with `_puckData`
- `needsMigration()`: Determines if a layout requires migration
- `getMigrationWarnings()`: Provides warnings about potential migration issues

## Best Practices

1. **Store Only Essential Data**: Component properties should only contain data necessary for rendering
2. **Use Metadata for Context**: Editor information and versioning should go in metadata
3. **Validate on Save**: Ensure saved layouts conform to the clean format specification
4. **Handle Migration Gracefully**: Support multiple format versions during transitions
5. **Document Changes**: Keep this specification updated as the format evolves

## Future Considerations

- Support for nested components and layouts
- Enhanced positioning system beyond simple grid
- Theme and styling abstraction
- Component composition and reusability
- Version-specific migration strategies