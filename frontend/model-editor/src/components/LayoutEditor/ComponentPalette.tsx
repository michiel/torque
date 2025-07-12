import React from 'react';
import {
  Card,
  Text,
  Stack,
  Group,
  Badge,
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
  IconWindow,
  IconSearch,
} from '@tabler/icons-react';
import { useDraggable } from '@dnd-kit/core';
import { ComponentType } from './types';
import { useComponentRegistry } from '../../hooks/useComponentRegistry';
import { ComponentPlugin } from './ComponentRegistry';

interface ComponentPaletteProps {
  onComponentSelect?: (type: ComponentType) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

const CATEGORY_LABELS = {
  data: 'Data Components',
  forms: 'Form Components',
  layout: 'Layout Components',
  actions: 'Action Components',
  media: 'Media Components',
  custom: 'Custom Components'
};

const getComponentIcon = (iconName: string) => {
  switch (iconName) {
    case 'table': return IconTable;
    case 'forms': return IconForms;
    case 'click': return IconClick;
    case 'typography': return IconTypography;
    case 'box': return IconBox;
    case 'modal': return IconWindow;
    default: return IconBox;
  }
};

interface DraggableComponentItemProps {
  item: ComponentPlugin;
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
      {...listeners}
      {...attributes}
      withBorder
      radius="md"
      p="sm"
      style={{
        cursor: 'grab',
        transition: 'all 150ms ease',
        transform: isDragging ? 'rotate(5deg)' : undefined,
        opacity: isDragging ? 0.5 : 1,
        ...style
      }}
      onClick={onClick}
      data-testid={`component-palette-${item.type.toLowerCase()}`}
    >
      <Group align="flex-start" gap="sm" wrap="nowrap">
        <IconComponent size={20} color="var(--mantine-color-blue-6)" />
        <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
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
  const { plugins } = useComponentRegistry();

  const filteredItems = React.useMemo(() => {
    if (!searchQuery) return plugins;
    
    const query = searchQuery.toLowerCase();
    return plugins.filter(item =>
      item.label.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
    );
  }, [searchQuery, plugins]);

  const itemsByCategory = React.useMemo(() => {
    const categories: Record<string, ComponentPlugin[]> = {};
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