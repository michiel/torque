import React from 'react';
import { BaseEdge, EdgeLabelRenderer, EdgeProps, getBezierPath } from '@xyflow/react';
import { Badge, Group, Text, ActionIcon } from '@mantine/core';
import { IconEdit } from '@tabler/icons-react';

interface RelationshipEdgeData {
  relationship: {
    id: string;
    name: string;
    displayName: string;
    relationshipType: string;
    fromEntityId: string;
    toEntityId: string;
  };
  onEdit: (relationship: any) => void;
}

export const RelationshipEdge: React.FC<EdgeProps<RelationshipEdgeData>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  selected
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const handleEditClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (data?.onEdit && data?.relationship) {
      data.onEdit(data.relationship);
    }
  };

  const getRelationshipTypeShorthand = (type: string): string => {
    switch (type) {
      case 'one-to-one':
        return '1:1';
      case 'one-to-many':
        return '1:n';
      case 'many-to-one':
        return 'n:1';
      case 'many-to-many':
        return 'n:n';
      default:
        return '1:n';
    }
  };

  const getRelationshipColor = (type: string): string => {
    switch (type) {
      case 'one-to-one':
        return 'blue';
      case 'one-to-many':
        return 'green';
      case 'many-to-one':
        return 'orange';
      case 'many-to-many':
        return 'red';
      default:
        return 'gray';
    }
  };

  return (
    <>
      <BaseEdge
        path={edgePath}
        style={{
          ...style,
          strokeWidth: selected ? 3 : 2,
          stroke: selected ? '#228be6' : '#868e96',
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 12,
            pointerEvents: 'all',
          }}
        >
          <Group
            gap="xs"
            style={{
              background: 'white',
              padding: '4px 8px',
              borderRadius: '12px',
              border: selected ? '2px solid #228be6' : '1px solid #e9ecef',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            <Text size="xs" fw={600}>
              {data?.relationship?.displayName || 'Relationship'}
            </Text>
            <Badge 
              size="xs" 
              color={getRelationshipColor(data?.relationship?.relationshipType || 'one-to-many')}
              variant="light"
            >
              {getRelationshipTypeShorthand(data?.relationship?.relationshipType || 'one-to-many')}
            </Badge>
            <ActionIcon 
              size="xs" 
              variant="subtle" 
              onClick={handleEditClick}
              aria-label="Edit relationship"
            >
              <IconEdit size={10} />
            </ActionIcon>
          </Group>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};