import React, { useState, useCallback } from 'react';
import {
  Card,
  Text,
  Box,
  Stack,
  Group,
  Button,
  Badge,
  ActionIcon,
  Tooltip,
  Menu,
} from '@mantine/core';
import {
  IconGripVertical,
  IconEdit,
  IconTrash,
  IconCopy,
  IconArrowUp,
  IconArrowDown,
  IconSettings,
} from '@tabler/icons-react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { LayoutEditorComponent, GridPosition, ComponentType } from './types';

interface LayoutCanvasProps {
  components: LayoutEditorComponent[];
  selectedComponent?: string | null;
  gridRows?: number;
  gridColumns?: number;
  onComponentSelect?: (componentId: string | null) => void;
  onComponentMove?: (componentId: string, newPosition: GridPosition) => void;
  onComponentDelete?: (componentId: string) => void;
  onComponentDuplicate?: (componentId: string) => void;
  onComponentEdit?: (componentId: string) => void;
  showGrid?: boolean;
}

interface GridCellProps {
  row: number;
  column: number;
  isOccupied?: boolean;
  component?: LayoutEditorComponent;
  isSelected?: boolean;
  onCellClick?: () => void;
  onComponentSelect?: (componentId: string) => void;
}

const GridCell: React.FC<GridCellProps> = ({
  row,
  column,
  isOccupied = false,
  component,
  isSelected = false,
  onCellClick,
  onComponentSelect
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `grid-${row}-${column}`,
    data: {
      type: 'grid-cell',
      row,
      column
    }
  });

  const handleClick = useCallback(() => {
    if (component) {
      onComponentSelect?.(component.id);
    } else {
      onCellClick?.();
    }
  }, [component, onComponentSelect, onCellClick]);

  return (
    <Box
      ref={setNodeRef}
      onClick={handleClick}
      style={(theme) => ({
        aspectRatio: '1',
        minHeight: '80px',
        border: `1px dashed ${theme.colors.gray[3]}`,
        borderRadius: theme.radius.sm,
        backgroundColor: isOver 
          ? theme.colors.blue[0] 
          : isOccupied 
            ? theme.colors.gray[0] 
            : 'transparent',
        borderColor: isSelected 
          ? theme.colors.blue[5] 
          : isOver 
            ? theme.colors.blue[4] 
            : theme.colors.gray[3],
        borderStyle: isSelected ? 'solid' : 'dashed',
        borderWidth: isSelected ? '2px' : '1px',
        cursor: isOccupied ? 'pointer' : 'default',
        transition: 'all 150ms ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        '&:hover': {
          backgroundColor: isOccupied 
            ? theme.colors.gray[1] 
            : theme.colors.blue[0],
          borderColor: theme.colors.blue[4]
        }
      })}
      data-testid={`layout-canvas-grid-${row}-${column}`}
    >
      {component && (
        <ComponentPreview 
          component={component}
          isSelected={isSelected}
        />
      )}
      
      {!isOccupied && (
        <Text size="xs" color="dimmed" ta="center">
          {row},{column}
        </Text>
      )}
    </Box>
  );
};

interface ComponentPreviewProps {
  component: LayoutEditorComponent;
  isSelected: boolean;
}

const ComponentPreview: React.FC<ComponentPreviewProps> = ({ component, isSelected }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `component-${component.id}`,
    data: {
      type: 'component',
      componentType: component.type,
      componentId: component.id,
      source: 'canvas'
    }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 1000 : 1,
    opacity: isDragging ? 0.8 : 1,
  } : undefined;

  const getComponentIcon = (type: ComponentType) => {
    switch (type) {
      case 'DataGrid': return '📊';
      case 'TorqueForm': return '📝';
      case 'TorqueButton': return '🔘';
      case 'Text': return '📄';
      case 'Container': return '📦';
      case 'Modal': return '🪟';
      default: return '❓';
    }
  };

  const getComponentColor = (type: ComponentType) => {
    switch (type) {
      case 'DataGrid': return 'blue';
      case 'TorqueForm': return 'green';
      case 'TorqueButton': return 'orange';
      case 'Text': return 'purple';
      case 'Container': return 'gray';
      case 'Modal': return 'pink';
      default: return 'gray';
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      withBorder
      radius="sm"
      p="xs"
      w="100%"
      h="100%"
      style={(theme) => ({
        cursor: 'grab',
        backgroundColor: theme.colors[getComponentColor(component.type)][0],
        borderColor: isSelected 
          ? theme.colors[getComponentColor(component.type)][5]
          : theme.colors[getComponentColor(component.type)][3],
        '&:active': {
          cursor: 'grabbing',
        }
      })}
      data-testid={`component-${component.type.toLowerCase()}-${component.id}`}
    >
      <Stack spacing={4} align="center" justify="center" h="100%">
        <Text size="lg">{getComponentIcon(component.type)}</Text>
        <Text size="xs" fw={500} ta="center" lineClamp={2}>
          {component.type}
        </Text>
        {component.entityBinding?.entityId && (
          <Badge size="xs" variant="light" color={getComponentColor(component.type)}>
            {component.entityBinding.entityId}
          </Badge>
        )}
        {component.validation.length > 0 && (
          <Badge size="xs" color="red" variant="light">
            {component.validation.length} errors
          </Badge>
        )}
      </Stack>
    </Card>
  );
};

export const LayoutCanvas: React.FC<LayoutCanvasProps> = ({
  components = [],
  selectedComponent,
  gridRows = 12,
  gridColumns = 12,
  onComponentSelect,
  onComponentMove,
  onComponentDelete,
  onComponentDuplicate,
  onComponentEdit,
  showGrid = true
}) => {
  const [hoveredCell, setHoveredCell] = useState<{ row: number; column: number } | null>(null);

  // Create a grid to track occupied cells
  const occupiedCells = React.useMemo(() => {
    const grid: Record<string, LayoutEditorComponent> = {};
    components.forEach(component => {
      for (let r = component.position.row; r < component.position.row + component.position.rowSpan; r++) {
        for (let c = component.position.column; c < component.position.column + component.position.colSpan; c++) {
          grid[`${r}-${c}`] = component;
        }
      }
    });
    return grid;
  }, [components]);

  const handleCellClick = useCallback((row: number, column: number) => {
    onComponentSelect?.(null);
    setHoveredCell({ row, column });
  }, [onComponentSelect]);

  const handleComponentSelect = useCallback((componentId: string) => {
    onComponentSelect?.(componentId);
  }, [onComponentSelect]);

  const selectedComponentData = React.useMemo(() => {
    return components.find(c => c.id === selectedComponent);
  }, [components, selectedComponent]);

  return (
    <Card withBorder radius="md" h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
      <Card.Section p="md" withBorder>
        <Group justify="space-between">
          <Stack spacing={4}>
            <Text size="lg" fw={600}>
              Layout Canvas
            </Text>
            <Group gap="xs">
              <Badge variant="light" size="sm">
                {gridRows} × {gridColumns}
              </Badge>
              <Badge variant="light" size="sm">
                {components.length} components
              </Badge>
            </Group>
          </Stack>

          <Group gap="xs">
            <Tooltip label="Toggle Grid">
              <ActionIcon variant="light" size="sm">
                <IconSettings size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      </Card.Section>

      <Box flex={1} p="md" style={{ overflow: 'auto' }}>
        <Box
          style={{
            display: 'grid',
            gridTemplateRows: `repeat(${gridRows}, 1fr)`,
            gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
            gap: '4px',
            minHeight: '600px',
            width: '100%'
          }}
          data-testid="layout-canvas"
        >
          {Array.from({ length: gridRows * gridColumns }, (_, index) => {
            const row = Math.floor(index / gridColumns);
            const column = index % gridColumns;
            const cellKey = `${row}-${column}`;
            const component = occupiedCells[cellKey];
            
            // Only render the cell if it's the top-left of a component or empty
            if (component && (component.position.row !== row || component.position.column !== column)) {
              return null;
            }

            return (
              <GridCell
                key={cellKey}
                row={row}
                column={column}
                isOccupied={!!component}
                component={component}
                isSelected={component?.id === selectedComponent}
                onCellClick={() => handleCellClick(row, column)}
                onComponentSelect={handleComponentSelect}
              />
            );
          })}
        </Box>
      </Box>

      {selectedComponentData && (
        <Card.Section p="md" withBorder>
          <Group justify="space-between">
            <Stack spacing={4}>
              <Text size="sm" fw={500}>
                Selected: {selectedComponentData.type}
              </Text>
              <Text size="xs" color="dimmed">
                Position: ({selectedComponentData.position.row}, {selectedComponentData.position.column})
                Size: {selectedComponentData.position.rowSpan} × {selectedComponentData.position.colSpan}
              </Text>
            </Stack>

            <Group gap="xs">
              <ActionIcon 
                size="sm" 
                variant="light" 
                onClick={() => onComponentEdit?.(selectedComponentData.id)}
              >
                <IconEdit size={14} />
              </ActionIcon>
              <ActionIcon 
                size="sm" 
                variant="light" 
                onClick={() => onComponentDuplicate?.(selectedComponentData.id)}
              >
                <IconCopy size={14} />
              </ActionIcon>
              <ActionIcon 
                size="sm" 
                variant="light" 
                color="red"
                onClick={() => onComponentDelete?.(selectedComponentData.id)}
              >
                <IconTrash size={14} />
              </ActionIcon>
            </Group>
          </Group>
        </Card.Section>
      )}
    </Card>
  );
};