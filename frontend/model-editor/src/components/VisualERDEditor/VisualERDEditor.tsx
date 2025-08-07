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
import { Group, Button, Text, ActionIcon, Badge, Paper, Stack, Collapse } from '@mantine/core';
import { IconArrowLeft, IconDeviceFloppy, IconPlus, IconTrash, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { EntityNode } from './EntityNode';
import { RelationshipEdge } from './RelationshipEdge';
import { EntityEditModal } from './EntityEditModal';
import { RelationshipEditModal } from './RelationshipEditModal';
import { useWebSocketContext } from '../../providers/WebSocketProvider';
import { generateTempId, generateUniqueName } from '../../utils/idGenerator';
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
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [selectedEdges, setSelectedEdges] = useState<string[]>([]);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(true);

  // Use app-wide WebSocket connection for real-time updates
  const { isConnected, lastEvent } = useWebSocketContext();

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
        x: (index % 3) * 675 + 225, 
        y: Math.floor(index / 3) * 525 + 225 
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
        type: 'relationship',
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
          id: generateTempId(),
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

  const onSelectionChange = useCallback(({ nodes, edges }: { nodes: Node[], edges: Edge[] }) => {
    const nodeIds = nodes.map(node => node.id);
    const edgeIds = edges.map(edge => edge.id);
    
    setSelectedNodes(nodeIds);
    setSelectedEdges(edgeIds);
  }, []);

  const handleDeleteSelection = useCallback(async () => {
    console.log('Deleting selected items:', { nodes: selectedNodes, edges: selectedEdges });
    
    // Remove selected nodes and edges from the ReactFlow state
    setNodes((nds) => nds.filter((node) => !selectedNodes.includes(node.id)));
    setEdges((eds) => eds.filter((edge) => !selectedEdges.includes(edge.id)));
    
    // Clear selection state
    setSelectedNodes([]);
    setSelectedEdges([]);
    setIsActionsMenuOpen(false);
    
    // TODO: In a real implementation, you would call delete mutations here
    // await deleteEntities(selectedNodes);
    // await deleteRelationships(selectedEdges);
  }, [selectedNodes, selectedEdges, setNodes, setEdges]);

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
    const existingNames = entities.map(e => e.name);
    const uniqueName = generateUniqueName('new_entity', existingNames);
    const newEntity: Entity = {
      id: generateTempId(),
      name: uniqueName,
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
          onSelectionChange={onSelectionChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          multiSelectionKeyCode="Shift"
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
          
          {/* Actions Menu - Always visible */}
          <Panel position="bottom-left" className="erd-actions-menu">
              <Paper 
                shadow="md" 
                radius="md" 
                p="sm"
                style={{ 
                  minWidth: 200,
                  background: 'white',
                  border: '1px solid #e9ecef'
                }}
              >
                <Stack gap="sm">
                  {/* Header */}
                  <Group justify="space-between" align="center">
                    <Text size="sm" fw={600}>
                      Actions Menu
                    </Text>
                    <ActionIcon 
                      size="xs" 
                      variant="subtle"
                      onClick={() => setIsActionsMenuOpen(!isActionsMenuOpen)}
                    >
                      {isActionsMenuOpen ? <IconChevronDown size={12} /> : <IconChevronUp size={12} />}
                    </ActionIcon>
                  </Group>
                  
                  <Collapse in={isActionsMenuOpen}>
                    <Stack gap="sm">
                      {/* General Actions Section */}
                      <Stack gap="xs">
                        <Text size="xs" fw={600} c="dimmed">
                          ACTIONS
                        </Text>
                        <Button
                          size="xs"
                          variant="light"
                          leftSection={<IconPlus size={12} />}
                          onClick={handleCreateEntity}
                          fullWidth
                        >
                          Add Entity
                        </Button>
                      </Stack>
                      
                      {/* Selection Actions Section - only show if items are selected */}
                      {(selectedNodes.length > 0 || selectedEdges.length > 0) && (
                        <Stack gap="xs">
                          <Text size="xs" fw={600} c="dimmed">
                            SELECTION
                          </Text>
                          <Text size="xs" c="dimmed">
                            {selectedNodes.length} entities, {selectedEdges.length} relationships selected
                          </Text>
                          <Button
                            size="xs"
                            color="red"
                            variant="light"
                            leftSection={<IconTrash size={12} />}
                            onClick={handleDeleteSelection}
                            fullWidth
                          >
                            Delete Selection
                          </Button>
                        </Stack>
                      )}
                    </Stack>
                  </Collapse>
                </Stack>
              </Paper>
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