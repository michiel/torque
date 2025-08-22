import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
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
import { Group, Button, Text, Badge, ActionIcon } from '@mantine/core';
import { IconArrowLeft, IconDeviceFloppy, IconPlus, IconTrash, IconRefresh } from '@tabler/icons-react';
import { EntityNode } from './EntityNode';
import { RelationshipEdge } from './RelationshipEdge';
import { EntityEditModal } from './EntityEditModal';
import { RelationshipEditModal } from './RelationshipEditModal';
import { useWebSocketContext } from '../../providers/WebSocketProvider';
import { generateTempId, generateUniqueName } from '../../utils/idGenerator';
import './VisualERDEditor.css';

// Auto-layout algorithm using force-directed simulation
interface Position {
  x: number;
  y: number;
}

interface LayoutNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fx?: number; // fixed x position
  fy?: number; // fixed y position
}

interface LayoutEdge {
  source: string;
  target: string;
}

function calculateAutoLayout(nodes: Node[], edges: Edge[]): { [key: string]: Position } {
  const layoutNodes: LayoutNode[] = nodes.map(node => ({
    id: node.id,
    x: node.position.x,
    y: node.position.y,
    width: 320, // Actual node width with padding
    height: 220, // Actual node height with padding
  }));

  const layoutEdges: LayoutEdge[] = edges.map(edge => ({
    source: edge.source!,
    target: edge.target!,
  }));

  // Force-directed layout parameters
  const width = 2400;
  const height = 1800;
  const iterations = 500;
  const coolingFactor = 0.98;
  const nodeRepulsion = 80000;
  const edgeAttraction = 0.08;
  const centeringForce = 0.005;
  const collisionPadding = 50; // Extra space between nodes

  let temperature = 150;

  // Check if two nodes overlap (rectangular collision detection)
  const nodesOverlap = (nodeA: LayoutNode, nodeB: LayoutNode): boolean => {
    const halfWidthA = nodeA.width / 2 + collisionPadding;
    const halfHeightA = nodeA.height / 2 + collisionPadding;
    const halfWidthB = nodeB.width / 2 + collisionPadding;
    const halfHeightB = nodeB.height / 2 + collisionPadding;
    
    return !(nodeA.x + halfWidthA < nodeB.x - halfWidthB ||
             nodeA.x - halfWidthA > nodeB.x + halfWidthB ||
             nodeA.y + halfHeightA < nodeB.y - halfHeightB ||
             nodeA.y - halfHeightA > nodeB.y + halfHeightB);
  };

  // Initialize positions to avoid initial overlaps
  layoutNodes.forEach((node, i) => {
    if (node.x === 0 && node.y === 0) {
      // Place nodes in a grid pattern initially to avoid overlaps
      const cols = Math.ceil(Math.sqrt(layoutNodes.length));
      const spacing = Math.max(node.width + collisionPadding * 2, 400);
      node.x = (i % cols) * spacing + spacing / 2;
      node.y = Math.floor(i / cols) * spacing + spacing / 2;
    }
  });

  // Force-directed simulation
  for (let iteration = 0; iteration < iterations; iteration++) {
    const forces: { [key: string]: { x: number; y: number } } = {};
    
    // Initialize forces
    layoutNodes.forEach(node => {
      forces[node.id] = { x: 0, y: 0 };
    });

    // Strong repulsive forces between all nodes (prevent overlaps)
    for (let i = 0; i < layoutNodes.length; i++) {
      for (let j = i + 1; j < layoutNodes.length; j++) {
        const nodeA = layoutNodes[i];
        const nodeB = layoutNodes[j];
        
        const dx = nodeA.x - nodeB.x;
        const dy = nodeA.y - nodeB.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        
        // Calculate minimum safe distance (sum of half-widths + half-heights + padding)
        const minSafeDistance = (nodeA.width + nodeB.width) / 2 + 
                                (nodeA.height + nodeB.height) / 2 + 
                                collisionPadding * 2;
        
        // Apply strong repulsion if nodes are too close
        if (distance < minSafeDistance) {
          // Exponentially stronger force when nodes are very close
          const overlapRatio = minSafeDistance / distance;
          const force = nodeRepulsion * overlapRatio * overlapRatio;
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;
          
          forces[nodeA.id].x += fx;
          forces[nodeA.id].y += fy;
          forces[nodeB.id].x -= fx;
          forces[nodeB.id].y -= fy;
        }
      }
    }

    // Attractive forces for connected nodes (but not too strong to avoid overlaps)
    layoutEdges.forEach(edge => {
      const sourceNode = layoutNodes.find(n => n.id === edge.source);
      const targetNode = layoutNodes.find(n => n.id === edge.target);
      
      if (sourceNode && targetNode) {
        const dx = targetNode.x - sourceNode.x;
        const dy = targetNode.y - sourceNode.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const idealDistance = 450; // Ideal distance between connected nodes
        
        // Only apply attractive force if nodes are farther than minimum safe distance
        const minSafeDistance = (sourceNode.width + targetNode.width) / 2 + 
                                (sourceNode.height + targetNode.height) / 2 + 
                                collisionPadding * 2;
        
        if (distance > minSafeDistance && distance > idealDistance) {
          const force = edgeAttraction * (distance - idealDistance);
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;
          
          forces[sourceNode.id].x += fx;
          forces[sourceNode.id].y += fy;
          forces[targetNode.id].x -= fx;
          forces[targetNode.id].y -= fy;
        }
      }
    });

    // Centering force to keep nodes in the viewport
    const centerX = width / 2;
    const centerY = height / 2;
    layoutNodes.forEach(node => {
      const dx = centerX - node.x;
      const dy = centerY - node.y;
      forces[node.id].x += dx * centeringForce;
      forces[node.id].y += dy * centeringForce;
    });

    // Apply forces with temperature cooling
    layoutNodes.forEach(node => {
      if (!node.fx && !node.fy) { // Don't move fixed nodes
        const force = forces[node.id];
        const forceLength = Math.sqrt(force.x * force.x + force.y * force.y);
        
        if (forceLength > 0) {
          const displacement = Math.min(forceLength, temperature);
          const newX = node.x + (force.x / forceLength) * displacement;
          const newY = node.y + (force.y / forceLength) * displacement;
          
          // Temporarily set new position to test for collisions
          const originalX = node.x;
          const originalY = node.y;
          node.x = newX;
          node.y = newY;
          
          // Check for collisions with other nodes
          let hasCollision = false;
          for (const otherNode of layoutNodes) {
            if (otherNode.id !== node.id && nodesOverlap(node, otherNode)) {
              hasCollision = true;
              break;
            }
          }
          
          // If collision detected, try smaller movements or revert
          if (hasCollision) {
            // Try moving with reduced displacement
            const reducedDisplacement = displacement * 0.1;
            node.x = originalX + (force.x / forceLength) * reducedDisplacement;
            node.y = originalY + (force.y / forceLength) * reducedDisplacement;
            
            // Final collision check - if still colliding, revert to original position
            for (const otherNode of layoutNodes) {
              if (otherNode.id !== node.id && nodesOverlap(node, otherNode)) {
                node.x = originalX;
                node.y = originalY;
                break;
              }
            }
          }
          
          // Keep nodes within bounds
          node.x = Math.max(node.width / 2 + 50, Math.min(width - node.width / 2 - 50, node.x));
          node.y = Math.max(node.height / 2 + 50, Math.min(height - node.height / 2 - 50, node.y));
        }
      }
    });

    // Cool down the system more gradually
    temperature *= coolingFactor;
  }

  // Final overlap resolution pass - if any overlaps remain, separate them
  let maxSeparationAttempts = 50;
  while (maxSeparationAttempts > 0) {
    let foundOverlap = false;
    
    for (let i = 0; i < layoutNodes.length && !foundOverlap; i++) {
      for (let j = i + 1; j < layoutNodes.length; j++) {
        const nodeA = layoutNodes[i];
        const nodeB = layoutNodes[j];
        
        if (nodesOverlap(nodeA, nodeB)) {
          foundOverlap = true;
          
          // Calculate separation vector
          const dx = nodeA.x - nodeB.x;
          const dy = nodeA.y - nodeB.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          
          // Calculate minimum separation needed
          const minSafeDistance = (nodeA.width + nodeB.width) / 2 + 
                                  (nodeA.height + nodeB.height) / 2 + 
                                  collisionPadding * 2;
          
          const separationNeeded = minSafeDistance - distance + 10; // Extra 10px buffer
          
          // Move nodes apart equally
          const moveDistance = separationNeeded / 2;
          const moveX = (dx / distance) * moveDistance;
          const moveY = (dy / distance) * moveDistance;
          
          nodeA.x += moveX;
          nodeA.y += moveY;
          nodeB.x -= moveX;
          nodeB.y -= moveY;
          
          // Keep within bounds
          nodeA.x = Math.max(nodeA.width / 2 + 50, Math.min(width - nodeA.width / 2 - 50, nodeA.x));
          nodeA.y = Math.max(nodeA.height / 2 + 50, Math.min(height - nodeA.height / 2 - 50, nodeA.y));
          nodeB.x = Math.max(nodeB.width / 2 + 50, Math.min(width - nodeB.width / 2 - 50, nodeB.x));
          nodeB.y = Math.max(nodeB.height / 2 + 50, Math.min(height - nodeB.height / 2 - 50, nodeB.y));
          
          break;
        }
      }
    }
    
    if (!foundOverlap) break;
    maxSeparationAttempts--;
  }

  // Convert back to position format
  const result: { [key: string]: Position } = {};
  layoutNodes.forEach(node => {
    result[node.id] = { x: node.x, y: node.y };
  });

  return result;
}

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
  const [isAutoLayouting, setIsAutoLayouting] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

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

  // Handle window resize for ReactFlow
  useEffect(() => {
    const handleWindowResize = () => {
      // Force ReactFlow to recalculate dimensions on window resize
      if (canvasRef.current) {
        // ReactFlow will handle its own resize automatically on window events
        // We just need to ensure the container is properly sized
      }
    };

    const resizeObserver = new ResizeObserver((entries) => {
      // Handle container size changes
      for (const entry of entries) {
        if (entry.target === canvasRef.current) {
          // ReactFlow will automatically detect container size changes
          // No need to dispatch additional events
        }
      }
    });

    if (canvasRef.current) {
      resizeObserver.observe(canvasRef.current);
    }

    window.addEventListener('resize', handleWindowResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleWindowResize);
    };
  }, []);

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

  const handleAutoLayout = useCallback(async () => {
    console.log('Applying auto-layout to nodes and edges');
    setIsAutoLayouting(true);
    
    try {
      // Use setTimeout to allow UI to update before heavy computation
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Calculate new positions using the force-directed algorithm
      const newPositions = calculateAutoLayout(nodes, edges);
      
      // Update node positions
      setNodes((nds) =>
        nds.map((node) => ({
          ...node,
          position: newPositions[node.id] || node.position,
        }))
      );
      
      console.log('Auto-layout applied successfully');
    } catch (error) {
      console.error('Auto-layout failed:', error);
    } finally {
      setIsAutoLayouting(false);
    }
  }, [nodes, edges, setNodes]);

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
      <div className="visual-erd-editor-canvas" ref={canvasRef}>
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
          <Controls>
            {/* Custom action buttons integrated into zoom controls */}
            <button
              onClick={handleCreateEntity}
              title="Add Entity"
              className="react-flow__controls-button"
              style={{
                background: 'white',
                border: '1px solid var(--mantine-color-gray-3)',
                color: 'var(--mantine-color-gray-7)',
                width: '26px',
                height: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                cursor: 'pointer',
                margin: '2px 0',
              }}
            >
              <IconPlus size={16} />
            </button>
            
            <button
              onClick={handleAutoLayout}
              disabled={nodes.length === 0 || isAutoLayouting}
              title="Auto Layout - Automatically arrange nodes to minimize overlaps and edge crossings"
              className="react-flow__controls-button"
              style={{
                background: 'white',
                border: '1px solid var(--mantine-color-gray-3)',
                color: 'var(--mantine-color-gray-7)',
                width: '26px',
                height: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                cursor: nodes.length === 0 || isAutoLayouting ? 'not-allowed' : 'pointer',
                opacity: nodes.length === 0 || isAutoLayouting ? 0.5 : 1,
                margin: '2px 0',
              }}
            >
              <IconRefresh size={16} />
            </button>
            
            {/* Selection delete button - only show if items are selected */}
            {(selectedNodes.length > 0 || selectedEdges.length > 0) && (
              <button
                onClick={handleDeleteSelection}
                title={`Delete Selection (${selectedNodes.length} entities, ${selectedEdges.length} relationships)`}
                className="react-flow__controls-button"
                style={{
                  background: 'white',
                  border: '1px solid var(--mantine-color-red-3)',
                  color: 'var(--mantine-color-red-6)',
                  width: '26px',
                  height: '26px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  margin: '2px 0',
                }}
              >
                <IconTrash size={16} />
              </button>
            )}
          </Controls>
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