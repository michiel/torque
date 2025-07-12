import React from 'react';
import {
  Card,
  Text,
  Stack,
  Group,
  Badge,
  Tooltip,
  TextInput,
  Divider,
  ScrollArea,
} from '@mantine/core';
import {
  IconTable,
  IconForms,
  IconClick,
  IconTypography,
  IconBox,
  IconModal,
  IconSearch,
} from '@tabler/icons-react';
import { useDraggable } from '@dnd-kit/core';
import { ComponentPaletteItem, ComponentType } from './types';

interface ComponentPaletteProps {
  onComponentSelect?: (type: ComponentType) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

const COMPONENT_PALETTE_ITEMS: ComponentPaletteItem[] = [
  {
    type: 'DataGrid',
    icon: 'table',
    label: 'Data Grid',
    description: 'Display and manage entity data in a table format',
    category: 'data'
  },
  {
    type: 'TorqueForm',
    icon: 'forms',
    label: 'Form',
    description: 'Create and edit entity instances with validation',
    category: 'forms'
  },
  {
    type: 'TorqueButton',
    icon: 'click',
    label: 'Button',
    description: 'Interactive button with configurable actions',
    category: 'actions'
  },
  {
    type: 'Text',
    icon: 'typography',
    label: 'Text',
    description: 'Display formatted text content',
    category: 'layout'
  },
  {
    type: 'Container',
    icon: 'box',
    label: 'Container',
    description: 'Layout container for organizing components',
    category: 'layout'
  },
  {
    type: 'Modal',
    icon: 'modal',
    label: 'Modal',
    description: 'Overlay dialog for forms and detailed views',
    category: 'actions'
  }
];

const CATEGORY_LABELS = {
  data: 'Data Components',
  forms: 'Form Components',
  layout: 'Layout Components',
  actions: 'Action Components'
};

const getComponentIcon = (iconName: string) => {
  switch (iconName) {
    case 'table': return IconTable;
    case 'forms': return IconForms;
    case 'click': return IconClick;
    case 'typography': return IconTypography;
    case 'box': return IconBox;
    case 'modal': return IconModal;
    default: return IconBox;
  }
};

interface DraggableComponentItemProps {
  item: ComponentPaletteItem;
  onClick?: () => void;
}

const DraggableComponentItem: React.FC<DraggableComponentItemProps> = ({ item, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `palette-${item.type}`,
    data: {
      type: 'component',
      componentType: item.type,
      source: 'palette'
    }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
  } : undefined;

  const IconComponent = getComponentIcon(item.icon);

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      withBorder
      radius="md"
      p="sm"
      style={(theme) => ({
        cursor: 'grab',
        transition: 'all 150ms ease',
        '&:hover': {
          boxShadow: theme.shadows.sm,
          transform: 'translateY(-2px)',
        },
        '&:active': {
          cursor: 'grabbing',
        }
      })}
      onClick={onClick}
      data-testid={`component-palette-${item.type.toLowerCase()}`}
    >
      <Group align="flex-start" gap="sm" noWrap>
        <IconComponent size={20} color="var(--mantine-color-blue-6)" />
        <Stack spacing={4} style={{ flex: 1, minWidth: 0 }}>
          <Text size="sm" fw={500} lineClamp={1}>
            {item.label}
          </Text>
          <Text size="xs" color="dimmed" lineClamp={2}>
            {item.description}
          </Text>
        </Stack>
      </Group>
    </Card>
  );
};

export const ComponentPalette: React.FC<ComponentPaletteProps> = ({
  onComponentSelect,
  searchQuery = '',
  onSearchChange
}) => {
  const filteredItems = React.useMemo(() => {
    if (!searchQuery) return COMPONENT_PALETTE_ITEMS;
    
    const query = searchQuery.toLowerCase();
    return COMPONENT_PALETTE_ITEMS.filter(item =>
      item.label.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const itemsByCategory = React.useMemo(() => {
    const categories: Record<string, ComponentPaletteItem[]> = {};
    filteredItems.forEach(item => {
      if (!categories[item.category]) {
        categories[item.category] = [];
      }
      categories[item.category].push(item);
    });
    return categories;
  }, [filteredItems]);

  return (
    <Card withBorder radius="md" h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
      <Card.Section p="md" withBorder>
        <Stack gap="sm">
          <Text size="lg" fw={600}>
            Components
          </Text>
          
          {onSearchChange && (
            <TextInput
              placeholder="Search components..."
              leftSection={<IconSearch size={16} />}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.currentTarget.value)}
              size="sm"
            />
          )}
        </Stack>
      </Card.Section>

      <ScrollArea flex={1} p="md">
        <Stack gap="lg">
          {Object.entries(itemsByCategory).map(([category, items]) => (
            <Stack key={category} gap="xs">
              <Group>
                <Text size="sm" fw={500} color="dimmed">
                  {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
                </Text>
                <Badge size="xs" variant="light">
                  {items.length}
                </Badge>
              </Group>
              
              <Stack gap="xs">
                {items.map((item) => (
                  <DraggableComponentItem
                    key={item.type}
                    item={item}
                    onClick={() => onComponentSelect?.(item.type)}
                  />
                ))}
              </Stack>
              
              <Divider />
            </Stack>
          ))}
        </Stack>
      </ScrollArea>
    </Card>
  );
};