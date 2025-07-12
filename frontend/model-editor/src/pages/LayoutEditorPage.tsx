import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Stack, Alert, LoadingOverlay } from '@mantine/core';
import { useQuery, useMutation } from '@apollo/client';
import { notifications } from '@mantine/notifications';
import { LayoutEditor } from '../components/LayoutEditor';
import { LayoutEditorComponent } from '../components/LayoutEditor/types';
import { GET_MODEL, GET_ENTITIES } from '../graphql/queries';
import { CREATE_LAYOUT, UPDATE_LAYOUT } from '../graphql/mutations';

interface RouteParams {
  modelId: string;
  layoutId?: string;
}

export const LayoutEditorPage: React.FC = () => {
  const { modelId, layoutId } = useParams<RouteParams>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // GraphQL queries
  const { data: modelData, loading: modelLoading, error: modelError } = useQuery(GET_MODEL, {
    variables: { id: modelId },
    skip: !modelId
  });

  const { data: entitiesData, loading: entitiesLoading } = useQuery(GET_ENTITIES, {
    variables: { modelId },
    skip: !modelId
  });

  // GraphQL mutations
  const [createLayout] = useMutation(CREATE_LAYOUT);
  const [updateLayout] = useMutation(UPDATE_LAYOUT);

  const entities = entitiesData?.entities || [];
  const model = modelData?.model;

  const handleSave = async (components: LayoutEditorComponent[]) => {
    if (!modelId) return;

    setIsLoading(true);
    try {
      // Convert components to layout JSON
      const layoutData = {
        name: layoutId ? `${model?.name} Layout` : 'New Layout',
        modelId,
        components: components.map(component => ({
          id: component.id,
          type: component.type,
          position: component.position,
          configuration: component.configuration,
          entityBinding: component.entityBinding
        })),
        responsive: {
          breakpoints: [
            { name: 'mobile', minWidth: 0, columns: 1 },
            { name: 'tablet', minWidth: 768, columns: 2 },
            { name: 'desktop', minWidth: 1024, columns: 3 }
          ]
        }
      };

      if (layoutId) {
        // Update existing layout
        await updateLayout({
          variables: {
            id: layoutId,
            input: layoutData
          }
        });

        notifications.show({
          title: 'Layout Updated',
          message: 'Your layout has been saved successfully',
          color: 'green'
        });
      } else {
        // Create new layout
        const result = await createLayout({
          variables: {
            input: layoutData
          }
        });

        notifications.show({
          title: 'Layout Created',
          message: 'Your layout has been created successfully',
          color: 'green'
        });

        // Navigate to the new layout
        const newLayoutId = result.data?.createLayout?.id;
        if (newLayoutId) {
          navigate(`/models/${modelId}/layouts/${newLayoutId}`);
        }
      }
    } catch (error) {
      notifications.show({
        title: 'Save Failed',
        message: 'Failed to save layout. Please try again.',
        color: 'red'
      });
      console.error('Failed to save layout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = (components: LayoutEditorComponent[]) => {
    // Convert components to TorqueApp format and open preview
    const layoutConfig = {
      id: layoutId || 'preview',
      title: 'Layout Preview',
      layout: {
        type: 'grid',
        rows: 12,
        columns: 12
      },
      components: components.map(component => ({
        type: component.type,
        id: component.id,
        position: {
          row: component.position.row,
          col: component.position.column,
          rowSpan: component.position.rowSpan,
          colSpan: component.position.colSpan
        },
        properties: component.configuration
      }))
    };

    // Open preview in new window
    const previewUrl = `/torqueapp/${modelId}/preview?layout=${encodeURIComponent(JSON.stringify(layoutConfig))}`;
    window.open(previewUrl, '_blank', 'width=1200,height=800');
  };

  if (modelLoading || entitiesLoading) {
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
      <LayoutEditor
        modelId={modelId!}
        layoutId={layoutId}
        onSave={handleSave}
        onPreview={handlePreview}
        entities={entities}
      />
    </div>
  );
};