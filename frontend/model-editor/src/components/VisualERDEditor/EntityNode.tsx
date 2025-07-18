import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Paper, Text, Group, Badge, Stack, Box } from '@mantine/core';
import { IconDatabase, IconKey, IconLink } from '@tabler/icons-react';

interface EntityNodeData {
  entity: {
    id: string;
    name: string;
    displayName: string;
    fields: Array<{
      id: string;
      name: string;
      displayName: string;
      fieldType: string;
      required: boolean;
    }>;
  };
  onEdit: (entity: any) => void;
}

export const EntityNode: React.FC<NodeProps<EntityNodeData>> = ({ data, selected }) => {
  const { entity, onEdit } = data;

  const handleClick = () => {
    onEdit(entity);
  };

  const getFieldIcon = (fieldType: string, required: boolean) => {
    if (fieldType === 'Reference') {
      return <IconLink size={12} />;
    }
    if (required) {
      return <IconKey size={12} />;
    }
    return null;
  };

  const getFieldTypeColor = (fieldType: string) => {
    switch (fieldType) {
      case 'String':
        return 'blue';
      case 'Integer':
        return 'green';
      case 'Float':
        return 'orange';
      case 'Boolean':
        return 'purple';
      case 'DateTime':
        return 'teal';
      case 'Reference':
        return 'red';
      case 'Array':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  return (
    <>
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ 
          background: '#555',
          width: 8,
          height: 8,
          border: '2px solid #fff'
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ 
          background: '#555',
          width: 8,
          height: 8,
          border: '2px solid #fff'
        }}
      />

      <Paper
        shadow="md"
        radius="md"
        p="md"
        style={{ 
          minWidth: 250,
          maxWidth: 350,
          cursor: 'pointer',
          border: selected ? '2px solid #228be6' : '1px solid #e9ecef',
          backgroundColor: '#fff'
        }}
        onClick={handleClick}
      >
        <Stack gap="sm">
          {/* Entity Header */}
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <IconDatabase size={16} color="#228be6" />
              <Text fw={700} size="sm">
                {entity.displayName}
              </Text>
            </Group>
            <Badge size="xs" color="blue" variant="light">
              {entity.fields.length} fields
            </Badge>
          </Group>

          {/* Entity Fields */}
          <Stack gap="xs">
            {entity.fields.slice(0, 6).map((field) => (
              <Box key={field.id}>
                <Group gap="xs" justify="space-between">
                  <Group gap="xs">
                    {getFieldIcon(field.fieldType, field.required)}
                    <Text size="xs" fw={field.required ? 600 : 400}>
                      {field.displayName}
                    </Text>
                  </Group>
                  <Badge 
                    size="xs" 
                    color={getFieldTypeColor(field.fieldType)}
                    variant="light"
                  >
                    {field.fieldType}
                  </Badge>
                </Group>
              </Box>
            ))}
            
            {entity.fields.length > 6 && (
              <Text size="xs" c="dimmed" style={{ textAlign: 'center' }}>
                ... and {entity.fields.length - 6} more fields
              </Text>
            )}
          </Stack>

          {/* Entity Name (Technical) */}
          <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace' }}>
            {entity.name}
          </Text>
        </Stack>
      </Paper>
    </>
  );
};