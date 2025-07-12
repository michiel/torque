import React, { useState, useCallback, useMemo } from 'react';
import {
  Grid,
  Stack,
  Group,
  Button,
  Text,
  Container,
  Paper,
  Alert,
  ActionIcon,
} from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { v4 as uuidv4 } from 'uuid';
import { ComponentPalette } from './ComponentPalette';
import { LayoutCanvas } from './LayoutCanvas';
import { ConfigurationPanel } from './ConfigurationPanel';
import { 
  LayoutEditorComponent, 
  ComponentType, 
  GridPosition, 
  ComponentConfiguration,
  ValidationResult
} from './types';
import { useComponentRegistry } from '../../hooks/useComponentRegistry';

interface LayoutEditorProps {
  modelId: string;
  layoutId?: string;
  onSave?: (components: LayoutEditorComponent[]) => void;
  onPreview?: (components: LayoutEditorComponent[]) => void;
  onBack?: () => void;
  entities?: Array<{ id: string; name: string; displayName: string; fields: any[] }>;
  initialComponents?: LayoutEditorComponent[];
}

// Helper function to create default configuration using plugin registry
const createDefaultConfigurationFromPlugin = (
  type: ComponentType, 
  getPluginById: (id: string) => any
): ComponentConfiguration => {
  // Find plugin by type
  const plugin = getPluginById(type.toLowerCase()) || 
                 getPluginById('datagrid') || // fallback for DataGrid
                 getPluginById('torqueform') || // fallback for TorqueForm 
                 getPluginById('torquebutton'); // fallback for TorqueButton
  
  if (plugin && plugin.defaultConfiguration) {
    return plugin.defaultConfiguration;
  }

  // Fallback to original implementation if plugin not found
  switch (type) {
    case 'DataGrid':
      return {
        dataGrid: {
          entityId: '',
          columns: [],
          pagination: { enabled: true, pageSize: 25 },
          filtering: { enabled: true },
          sorting: { enabled: true },
          actions: []
        }
      };
    case 'TorqueForm':
      return {
        form: {
          entityId: '',
          fields: [],
          validation: { clientSide: true, serverSide: true, realTime: true },
          layout: 'single-column',
          submission: { action: 'create' }
        }
      };
    case 'TorqueButton':
      return {
        button: {
          label: 'Button',
          variant: 'filled',
          color: 'blue',
          size: 'md',
          action: { type: 'custom' }
        }
      };
    case 'Text':
      return {
        text: {
          content: 'Text Content',
          variant: 'body',
          alignment: 'left'
        }
      };
    case 'Container':
      return {
        container: {
          padding: '16px'
        }
      };
    default:
      return {};
  }
};

const findAvailablePosition = (
  components: LayoutEditorComponent[],
  componentSize: { rowSpan: number; colSpan: number },
  gridColumns: number = 12
): GridPosition => {
  // Create a grid to track occupied cells
  const occupiedCells = new Set<string>();
  components.forEach(component => {
    for (let r = component.position.row; r < component.position.row + component.position.rowSpan; r++) {
      for (let c = component.position.column; c < component.position.column + component.position.colSpan; c++) {
        occupiedCells.add(`${r}-${c}`);
      }
    }
  });

  // Find the first available position
  for (let row = 0; row < 12; row++) {
    for (let col = 0; col <= gridColumns - componentSize.colSpan; col++) {
      let canPlace = true;
      
      // Check if the area is free
      for (let r = row; r < row + componentSize.rowSpan && canPlace; r++) {
        for (let c = col; c < col + componentSize.colSpan && canPlace; c++) {
          if (occupiedCells.has(`${r}-${c}`)) {
            canPlace = false;
          }
        }
      }
      
      if (canPlace) {
        return {
          row,
          column: col,
          rowSpan: componentSize.rowSpan,
          colSpan: componentSize.colSpan
        };
      }
    }
  }

  // If no space found, place at the end
  return {
    row: 0,
    column: 0,
    rowSpan: componentSize.rowSpan,
    colSpan: componentSize.colSpan
  };
};

export const LayoutEditor: React.FC<LayoutEditorProps> = ({
  modelId,
  layoutId,
  onSave,
  onPreview,
  onBack,
  entities = [],
  initialComponents = []
}) => {
  const { getById } = useComponentRegistry();
  const [components, setComponents] = useState<LayoutEditorComponent[]>(initialComponents);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedItem, setDraggedItem] = useState<any>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Update components when initialComponents changes
  React.useEffect(() => {
    setComponents(initialComponents);
    setHasUnsavedChanges(false);
  }, [initialComponents]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const selectedComponentData = useMemo(() => {
    return components.find(c => c.id === selectedComponent);
  }, [components, selectedComponent]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setDraggedItem(event.active.data.current);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setDraggedItem(null);
      return;
    }

    const activeData = active.data.current;
    const overData = over.data.current;

    // Handle dropping component from palette to grid
    if (activeData?.source === 'palette' && overData?.type === 'grid-cell') {
      const componentType = activeData.componentType as ComponentType;
      const targetRow = overData.row;
      const targetColumn = overData.column;

      // Default size based on component type
      const defaultSize = {
        DataGrid: { rowSpan: 4, colSpan: 6 },
        TorqueForm: { rowSpan: 6, colSpan: 4 },
        TorqueButton: { rowSpan: 1, colSpan: 2 },
        Text: { rowSpan: 1, colSpan: 4 },
        Container: { rowSpan: 3, colSpan: 6 },
        Modal: { rowSpan: 4, colSpan: 4 }
      };

      const size = defaultSize[componentType] || { rowSpan: 2, colSpan: 3 };

      const newComponent: LayoutEditorComponent = {
        id: uuidv4(),
        type: componentType,
        position: {
          row: targetRow,
          column: targetColumn,
          ...size
        },
        configuration: createDefaultConfigurationFromPlugin(componentType, getById),
        validation: []
      };

      setComponents(prev => [...prev, newComponent]);
      setSelectedComponent(newComponent.id);
      setHasUnsavedChanges(true);
    }

    // Handle moving component within canvas
    if (activeData?.source === 'canvas' && overData?.type === 'grid-cell') {
      const componentId = activeData.componentId;
      const targetRow = overData.row;
      const targetColumn = overData.column;

      setComponents(prev => prev.map(component => {
        if (component.id === componentId) {
          return {
            ...component,
            position: {
              ...component.position,
              row: targetRow,
              column: targetColumn
            }
          };
        }
        return component;
      }));
      setHasUnsavedChanges(true);
    }

    setDraggedItem(null);
  }, []);

  const handleComponentSelect = useCallback((componentId: string | null) => {
    setSelectedComponent(componentId);
  }, []);

  const handleComponentUpdate = useCallback((componentId: string, configuration: ComponentConfiguration) => {
    setComponents(prev => prev.map(component => {
      if (component.id === componentId) {
        return {
          ...component,
          configuration
        };
      }
      return component;
    }));
    setHasUnsavedChanges(true);
  }, []);

  const handleComponentDelete = useCallback((componentId: string) => {
    setComponents(prev => prev.filter(c => c.id !== componentId));
    if (selectedComponent === componentId) {
      setSelectedComponent(null);
    }
    setHasUnsavedChanges(true);
  }, [selectedComponent]);

  const handleComponentDuplicate = useCallback((componentId: string) => {
    const component = components.find(c => c.id === componentId);
    if (!component) return;

    const newPosition = findAvailablePosition(components, {
      rowSpan: component.position.rowSpan,
      colSpan: component.position.colSpan
    });

    const duplicatedComponent: LayoutEditorComponent = {
      ...component,
      id: uuidv4(),
      position: newPosition
    };

    setComponents(prev => [...prev, duplicatedComponent]);
    setSelectedComponent(duplicatedComponent.id);
    setHasUnsavedChanges(true);
  }, [components]);

  const handleValidateComponent = useCallback(async (component: LayoutEditorComponent): Promise<ValidationResult[]> => {
    const results: ValidationResult[] = [];

    // Basic validation
    if (component.type === 'DataGrid') {
      if (!component.configuration.dataGrid?.entityId) {
        results.push({
          field: 'entity',
          message: 'Entity selection is required for DataGrid',
          severity: 'error'
        });
      }
      if (!component.configuration.dataGrid?.columns?.length) {
        results.push({
          field: 'columns',
          message: 'At least one column is required for DataGrid',
          severity: 'error'
        });
      }
    }

    if (component.type === 'TorqueForm') {
      if (!component.configuration.form?.entityId) {
        results.push({
          field: 'entity',
          message: 'Entity selection is required for Form',
          severity: 'error'
        });
      }
    }

    // Position validation
    if (component.position.row + component.position.rowSpan > 12) {
      results.push({
        field: 'position',
        message: 'Component extends beyond grid boundaries',
        severity: 'error'
      });
    }

    return results;
  }, []);

  const handleSave = useCallback(() => {
    onSave?.(components);
    setHasUnsavedChanges(false);
  }, [components, onSave]);

  const handlePreview = useCallback(() => {
    onPreview?.(components);
  }, [components, onPreview]);

  return (
    <Container size="100%" p="md" data-testid="layout-editor">
      <Stack gap="md">
        {/* Header */}
        <Paper p="md" withBorder>
          <Group justify="space-between">
            <Group align="flex-start">
              {onBack && (
                <ActionIcon
                  variant="subtle"
                  onClick={onBack}
                  size="lg"
                  aria-label="Go back to model editor"
                >
                  <IconArrowLeft size={20} />
                </ActionIcon>
              )}
              <Stack gap={4}>
                <Text size="xl" fw={700}>
                  Layout Editor
                </Text>
                <Text size="sm" color="dimmed">
                  Design your application interface with drag-and-drop components
                </Text>
              </Stack>
            </Group>

            <Group gap="sm">
              <Button
                variant="outline"
                onClick={handlePreview}
                disabled={components.length === 0}
                data-testid="preview-layout"
              >
                Preview
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasUnsavedChanges && !layoutId}
                data-testid="save-layout"
              >
                {layoutId ? 'Update Layout' : 'Save Layout'}
              </Button>
            </Group>
          </Group>

          {hasUnsavedChanges && (
            <Alert color="yellow" mt="md">
              You have unsaved changes. Don't forget to save your layout.
            </Alert>
          )}
        </Paper>

        {/* Main Editor */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <Grid gutter="md" style={{ minHeight: '600px' }}>
            {/* Component Palette */}
            <Grid.Col span={3}>
              <ComponentPalette
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            </Grid.Col>

            {/* Layout Canvas */}
            <Grid.Col span={6}>
              <LayoutCanvas
                components={components}
                selectedComponent={selectedComponent}
                onComponentSelect={handleComponentSelect}
                onComponentDelete={handleComponentDelete}
                onComponentDuplicate={handleComponentDuplicate}
              />
            </Grid.Col>

            {/* Configuration Panel */}
            <Grid.Col span={3}>
              <ConfigurationPanel
                component={selectedComponentData}
                onUpdate={handleComponentUpdate}
                onValidate={handleValidateComponent}
                entities={entities}
              />
            </Grid.Col>
          </Grid>

          {/* Drag Overlay */}
          <DragOverlay>
            {draggedItem && (
              <Paper withBorder p="sm" shadow="md">
                <Text size="sm" fw={500}>
                  {draggedItem.componentType || 'Component'}
                </Text>
              </Paper>
            )}
          </DragOverlay>
        </DndContext>
      </Stack>
    </Container>
  );
};