import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  ReactFlow, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState, 
  addEdge,
  Connection,
  Edge,
  Node,
  NodeTypes,
  EdgeTypes,
  MiniMap,
  Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Group, Button, Text, ActionIcon, Badge } from '@mantine/core';
import { IconArrowLeft, IconDeviceFloppy, IconPlus } from '@tabler/icons-react';
import { EntityNode } from './EntityNode';
import { RelationshipEdge } from './RelationshipEdge';
import { EntityEditModal } from './EntityEditModal';
import { RelationshipEditModal } from './RelationshipEditModal';
import { useWebSocket } from '../../hooks/useWebSocket';
import './VisualERDEditor.css';

interface Entity {
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
}

interface Relationship {
  id: string;
  name: string;
  displayName: string;
  fromEntityId: string;
  toEntityId: string;
  relationshipType: string;
  fromFieldId: string;
  toFieldId: string;
}

interface VisualERDEditorProps {
  modelId: string;
  entities: Entity[];
  relationships: Relationship[];
  onEntityUpdate: (entity: Entity) => Promise<void>;
  onRelationshipUpdate: (relationship: Relationship) => Promise<void>;
  onEntityCreate: (entity: Omit<Entity, 'id'>) => Promise<void>;
  onRelationshipCreate: (relationship: Omit<Relationship, 'id'>) => Promise<void>;
  onBack?: () => void;
  onSave?: () => Promise<void>;
}

export const VisualERDEditor: React.FC<VisualERDEditorProps> = ({
  modelId,
  entities,
  relationships,
  onEntityUpdate,
  onRelationshipUpdate,
  onEntityCreate,
  onRelationshipCreate,
  onBack,
  onSave
}) => {
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
  const [editingRelationship, setEditingRelationship] = useState<Relationship | null>(null);
  const [isCreatingEntity, setIsCreatingEntity] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  // WebSocket integration for real-time updates
  const { isConnected, lastEvent } = useWebSocket({
    url: 'ws://localhost:8080/ws',
    modelFilter: modelId
  });

  // Handle real-time model changes
  useEffect(() => {
    if (lastEvent && lastEvent.data.model_id === modelId) {
      // Handle entity or relationship updates
      if (lastEvent.type === 'EntityAdded' || lastEvent.type === 'EntityUpdated' || 
          lastEvent.type === 'RelationshipAdded' || lastEvent.type === 'RelationshipUpdated') {
        // The parent component will handle the refetch through GraphQL
        console.log('ERD: Model change detected:', lastEvent.type);
      }
    }
  }, [lastEvent, modelId]);

  // Transform entities to React Flow nodes
  const initialNodes: Node[] = useMemo(() => {
    console.log('VisualERDEditor: Creating nodes from entities:', entities);
    
    const nodes = entities.map((entity, index) => ({
      id: entity.id,
      type: 'entity',
      position: { 
        x: (index % 3) * 300 + 100, 
        y: Math.floor(index / 3) * 200 + 100 
      },
      data: { 
        entity,
        onEdit: (entity: Entity) => setEditingEntity(entity)
      }
    }));
    
    console.log('VisualERDEditor: Generated nodes:', nodes);
    return nodes;
  }, [entities]);

  // Transform relationships to React Flow edges
  const initialEdges: Edge[] = useMemo(() => {
    console.log('VisualERDEditor: Creating edges from relationships:', relationships);
    
    const edges = relationships.map((relationship) => {
      console.log('VisualERDEditor: Creating edge for relationship:', relationship);
      
      return {
        id: relationship.id,
        source: relationship.fromEntityId,
        target: relationship.toEntityId,
        type: 'default', // Temporarily use default edge type for debugging
        data: { 
          relationship,
          onEdit: (relationship: Relationship) => setEditingRelationship(relationship)
        },
        label: `${relationship.displayName} (${getRelationshipTypeShorthand(relationship.relationshipType)})`
      };
    });
    
    console.log('VisualERDEditor: Generated edges:', edges);
    return edges;
  }, [relationships]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when entities change
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  // Update edges when relationships change
  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  const nodeTypes: NodeTypes = useMemo(() => ({
    entity: EntityNode
  }), []);

  const edgeTypes: EdgeTypes = useMemo(() => ({
    relationship: RelationshipEdge
  }), []);

  const onConnect = useCallback((params: Edge | Connection) => {
    // When user connects nodes, create a new relationship
    if (params.source && params.target) {
      const sourceEntity = entities.find(e => e.id === params.source);
      const targetEntity = entities.find(e => e.id === params.target);
      
      if (sourceEntity && targetEntity) {
        const newRelationship: Relationship = {
          id: `temp-${Date.now()}`,
          name: `${sourceEntity.name}_${targetEntity.name}`,
          displayName: `${sourceEntity.displayName} to ${targetEntity.displayName}`,
          fromEntityId: params.source,
          toEntityId: params.target,
          relationshipType: 'one-to-many',
          fromFieldId: sourceEntity.fields[0]?.id || '',
          toFieldId: targetEntity.fields[0]?.id || ''
        };

        console.log('Creating new relationship:', newRelationship);
        
        setEditingRelationship(newRelationship);
      }
    }
  }, [entities]);

  const handleEntitySave = async (entity: Entity) => {
    setSaveStatus('saving');
    try {
      if (entity.id.startsWith('temp-')) {
        await onEntityCreate({ ...entity, id: undefined } as any);
      } else {
        await onEntityUpdate(entity);
      }
      setSaveStatus('saved');
      setEditingEntity(null);
    } catch (error) {
      setSaveStatus('unsaved');
      console.error('Failed to save entity:', error);
    }
  };

  const handleRelationshipSave = async (relationship: Relationship) => {
    setSaveStatus('saving');
    try {
      if (relationship.id.startsWith('temp-')) {
        await onRelationshipCreate({ ...relationship, id: undefined } as any);
      } else {
        await onRelationshipUpdate(relationship);
      }
      setSaveStatus('saved');
      setEditingRelationship(null);
    } catch (error) {
      setSaveStatus('unsaved');
      console.error('Failed to save relationship:', error);
    }
  };

  const handleCreateEntity = () => {
    const newEntity: Entity = {
      id: `temp-${Date.now()}`,
      name: 'new_entity',
      displayName: 'New Entity',
      fields: []
    };
    setEditingEntity(newEntity);
    setIsCreatingEntity(true);
  };

  const handleSave = async () => {
    if (onSave) {
      setSaveStatus('saving');
      try {
        await onSave();
        setSaveStatus('saved');
      } catch (error) {
        setSaveStatus('unsaved');
        console.error('Failed to save ERD:', error);
      }
    }
  };

  const getSaveStatusBadge = () => {
    switch (saveStatus) {
      case 'saved':
        return <Badge color="green" size="sm">Saved</Badge>;
      case 'saving':
        return <Badge color="blue" size="sm">Saving...</Badge>;
      case 'unsaved':
        return <Badge color="orange" size="sm">Unsaved changes</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="visual-erd-editor">
      {/* Header */}
      <div className="visual-erd-editor-header">
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
        <div>
          <Text size="xl" fw={700}>
            Entity Relationship Diagram
          </Text>
          <Text size="sm" c="dimmed">
            Visual model for {modelId}
          </Text>
        </div>
        
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {getSaveStatusBadge()}
          
          <Badge 
            color={isConnected ? 'green' : 'red'} 
            size="sm"
            variant="dot"
          >
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleCreateEntity}
            leftSection={<IconPlus size={16} />}
          >
            Add Entity
          </Button>
          
          <Button
            variant="subtle"
            size="sm"
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            leftSection={<IconDeviceFloppy size={16} />}
          >
            Save
          </Button>
        </div>
      </div>

      {/* ERD Canvas */}
      <div className="visual-erd-editor-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.1 }}
        >
          <Background />
          <Controls />
          <MiniMap />
          <Panel position="top-right">
            <Group gap="xs">
              <Text size="sm" c="dimmed">
                Drag to connect entities
              </Text>
            </Group>
          </Panel>
          <Panel position="top-left">
            <Group gap="xs">
              <Text size="xs" c="dimmed">
                Nodes: {nodes.length}, Edges: {edges.length}
              </Text>
            </Group>
          </Panel>
        </ReactFlow>
      </div>

      {/* Entity Edit Modal */}
      {editingEntity && (
        <EntityEditModal
          entity={editingEntity}
          isOpen={!!editingEntity}
          onClose={() => {
            setEditingEntity(null);
            setIsCreatingEntity(false);
          }}
          onSave={handleEntitySave}
          isCreating={isCreatingEntity}
        />
      )}

      {/* Relationship Edit Modal */}
      {editingRelationship && (
        <RelationshipEditModal
          relationship={editingRelationship}
          entities={entities}
          isOpen={!!editingRelationship}
          onClose={() => setEditingRelationship(null)}
          onSave={handleRelationshipSave}
        />
      )}
    </div>
  );
};

function getRelationshipTypeShorthand(type: string): string {
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
}