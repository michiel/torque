import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Alert, LoadingOverlay } from '@mantine/core';
import { useQuery, useMutation } from '@apollo/client';
import { notifications } from '@mantine/notifications';
import { VisualERDEditor } from '../components/VisualERDEditor';
import { GET_MODEL, GET_ENTITIES, GET_RELATIONSHIPS } from '../graphql/queries';
import { CREATE_ENTITY, UPDATE_ENTITY, CREATE_RELATIONSHIP, UPDATE_RELATIONSHIP } from '../graphql/mutations';

interface RouteParams extends Record<string, string | undefined> {
  modelId: string;
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
  displayName?: string;
  fromEntityId: string;
  toEntityId: string;
  relationshipType: string;
  fromFieldId: string;
  toFieldId: string;
  fromEntity?: string;
  toEntity?: string;
  fromField?: string;
  toField?: string;
}

export const ERDEditorPage: React.FC = () => {
  const { modelId } = useParams<RouteParams>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // GraphQL queries
  const { data: modelData, loading: modelLoading, error: modelError } = useQuery(GET_MODEL, {
    variables: { id: modelId },
    skip: !modelId
  });

  const { data: entitiesData, loading: entitiesLoading, refetch: refetchEntities } = useQuery(GET_ENTITIES, {
    variables: { modelId },
    skip: !modelId
  });

  const { data: relationshipsData, loading: relationshipsLoading, refetch: refetchRelationships } = useQuery(GET_RELATIONSHIPS, {
    variables: { modelId },
    skip: !modelId
  });

  // GraphQL mutations
  const [createEntity] = useMutation(CREATE_ENTITY);
  const [updateEntity] = useMutation(UPDATE_ENTITY);
  const [createRelationship] = useMutation(CREATE_RELATIONSHIP);
  const [updateRelationship] = useMutation(UPDATE_RELATIONSHIP);

  const entities = entitiesData?.entities || [];
  const rawRelationships = relationshipsData?.relationships || [];
  const model = modelData?.model;

  console.log('ERDEditorPage: Raw relationships from GraphQL:', rawRelationships);
  console.log('ERDEditorPage: Entities:', entities);

  // Transform relationships to match ERD editor format
  const relationships = rawRelationships.map(rel => {
    // Convert field names to field IDs
    const fromEntity = entities.find(e => e.id === rel.fromEntity);
    const toEntity = entities.find(e => e.id === rel.toEntity);
    
    const fromField = fromEntity?.fields.find(f => f.name === rel.fromField);
    const toField = toEntity?.fields.find(f => f.name === rel.toField);

    // Convert relationship type from enum to kebab-case
    const relationshipTypeMap: Record<string, string> = {
      'OneToOne': 'one-to-one',
      'OneToMany': 'one-to-many',
      'ManyToOne': 'many-to-one',
      'ManyToMany': 'many-to-many'
    };

    const transformedRel = {
      id: rel.id,
      name: rel.name,
      displayName: rel.name, // Use name as display name if not provided
      fromEntityId: rel.fromEntity,
      toEntityId: rel.toEntity,
      relationshipType: relationshipTypeMap[rel.relationshipType] || 'one-to-many',
      fromFieldId: fromField?.id || '',
      toFieldId: toField?.id || '',
      fromEntity: rel.fromEntity,
      toEntity: rel.toEntity,
      fromField: rel.fromField,
      toField: rel.toField
    };
    
    console.log('ERDEditorPage: Transformed relationship:', transformedRel);
    return transformedRel;
  });

  console.log('ERDEditorPage: Final relationships passed to ERD editor:', relationships);

  const handleEntityUpdate = async (entity: Entity) => {
    setIsLoading(true);
    try {
      await updateEntity({
        variables: {
          id: entity.id,
          input: {
            name: entity.name,
            displayName: entity.displayName,
            fields: entity.fields.map(field => ({
              id: field.id,
              name: field.name,
              displayName: field.displayName,
              fieldType: field.fieldType,
              required: field.required
            }))
          }
        }
      });

      await refetchEntities();
      
      notifications.show({
        title: 'Entity Updated',
        message: `${entity.displayName} has been updated successfully`,
        color: 'green'
      });
    } catch (error) {
      console.error('Failed to update entity:', error);
      notifications.show({
        title: 'Update Failed',
        message: `Failed to update ${entity.displayName}`,
        color: 'red'
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleEntityCreate = async (entityData: Omit<Entity, 'id'>) => {
    setIsLoading(true);
    try {
      await createEntity({
        variables: {
          input: {
            modelId,
            name: entityData.name,
            displayName: entityData.displayName,
            fields: entityData.fields.map(field => ({
              name: field.name,
              displayName: field.displayName,
              fieldType: field.fieldType,
              required: field.required
            }))
          }
        }
      });

      await refetchEntities();
      
      notifications.show({
        title: 'Entity Created',
        message: `${entityData.displayName} has been created successfully`,
        color: 'green'
      });
    } catch (error) {
      console.error('Failed to create entity:', error);
      notifications.show({
        title: 'Creation Failed',
        message: `Failed to create ${entityData.displayName}`,
        color: 'red'
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleRelationshipUpdate = async (relationship: Relationship) => {
    setIsLoading(true);
    try {
      // Convert field IDs to field names
      const fromEntity = entities.find(e => e.id === relationship.fromEntityId);
      const toEntity = entities.find(e => e.id === relationship.toEntityId);
      
      const fromField = fromEntity?.fields.find(f => f.id === relationship.fromFieldId);
      const toField = toEntity?.fields.find(f => f.id === relationship.toFieldId);

      // Convert relationship type to proper enum format
      const relationshipTypeMap: Record<string, string> = {
        'one-to-one': 'OneToOne',
        'one-to-many': 'OneToMany',
        'many-to-one': 'ManyToOne',
        'many-to-many': 'ManyToMany'
      };

      await updateRelationship({
        variables: {
          id: relationship.id,
          input: {
            name: relationship.name,
            relationshipType: relationshipTypeMap[relationship.relationshipType] || 'OneToMany',
            fromEntity: relationship.fromEntityId,
            toEntity: relationship.toEntityId,
            fromField: fromField?.name || '',
            toField: toField?.name || '',
            cascade: 'None'
          }
        }
      });

      await refetchRelationships();
      
      notifications.show({
        title: 'Relationship Updated',
        message: `${relationship.displayName || relationship.name} has been updated successfully`,
        color: 'green'
      });
    } catch (error) {
      console.error('Failed to update relationship:', error);
      notifications.show({
        title: 'Update Failed',
        message: `Failed to update ${relationship.displayName || relationship.name}`,
        color: 'red'
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleRelationshipCreate = async (relationshipData: Omit<Relationship, 'id'>) => {
    setIsLoading(true);
    try {
      // Convert field IDs to field names
      const fromEntity = entities.find(e => e.id === relationshipData.fromEntityId);
      const toEntity = entities.find(e => e.id === relationshipData.toEntityId);
      
      const fromField = fromEntity?.fields.find(f => f.id === relationshipData.fromFieldId);
      const toField = toEntity?.fields.find(f => f.id === relationshipData.toFieldId);

      // Convert relationship type to proper enum format
      const relationshipTypeMap: Record<string, string> = {
        'one-to-one': 'OneToOne',
        'one-to-many': 'OneToMany',
        'many-to-one': 'ManyToOne',
        'many-to-many': 'ManyToMany'
      };

      const variables = {
        input: {
          modelId,
          name: relationshipData.name,
          relationshipType: relationshipTypeMap[relationshipData.relationshipType] || 'OneToMany',
          fromEntity: relationshipData.fromEntityId,
          toEntity: relationshipData.toEntityId,
          fromField: fromField?.name || '',
          toField: toField?.name || '',
          cascade: 'None'
        }
      };

      console.log('Creating relationship with variables:', variables);
      
      const result = await createRelationship({ variables });
      console.log('Relationship creation result:', result);

      console.log('Refetching relationships...');
      const refetchResult = await refetchRelationships();
      console.log('Refetch result:', refetchResult);
      
      notifications.show({
        title: 'Relationship Created',
        message: `${relationshipData.displayName || relationshipData.name} has been created successfully`,
        color: 'green'
      });
    } catch (error) {
      console.error('Failed to create relationship:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Show more detailed error message
      const errorMessage = error instanceof Error ? error.message : 
                          (error as any)?.message || 
                          (error as any)?.graphQLErrors?.[0]?.message || 
                          'Unknown error occurred';
      
      notifications.show({
        title: 'Creation Failed',
        message: `Failed to create ${relationshipData.displayName || relationshipData.name}: ${errorMessage}`,
        color: 'red'
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    notifications.show({
      title: 'ERD Saved',
      message: 'Entity Relationship Diagram has been saved successfully',
      color: 'green'
    });
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (modelLoading || entitiesLoading || relationshipsLoading) {
    return (
      <Container size="100%" p="md">
        <LoadingOverlay visible />
      </Container>
    );
  }

  if (modelError) {
    return (
      <Container size="md" p="md">
        <Alert color="red" title="Error">
          Failed to load model: {modelError.message}
        </Alert>
      </Container>
    );
  }

  if (!model) {
    return (
      <Container size="md" p="md">
        <Alert color="orange" title="Model Not Found">
          The specified model could not be found.
        </Alert>
      </Container>
    );
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <LoadingOverlay visible={isLoading} />
      <VisualERDEditor
        modelId={modelId!}
        entities={entities}
        relationships={relationships}
        onEntityUpdate={handleEntityUpdate}
        onEntityCreate={handleEntityCreate}
        onRelationshipUpdate={handleRelationshipUpdate}
        onRelationshipCreate={handleRelationshipCreate}
        onSave={handleSave}
        onBack={handleBack}
      />
    </div>
  );
};