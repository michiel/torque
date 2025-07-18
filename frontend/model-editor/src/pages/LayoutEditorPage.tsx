import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Alert, LoadingOverlay } from '@mantine/core';
import { useQuery, useMutation } from '@apollo/client';
import { notifications } from '@mantine/notifications';
import { VisualLayoutEditor } from '../components/VisualLayoutEditor';
import { Data } from '@measured/puck';
import { GET_MODEL, GET_ENTITIES, GET_LAYOUT } from '../graphql/queries';
import { CREATE_LAYOUT, UPDATE_LAYOUT } from '../graphql/mutations';

interface RouteParams extends Record<string, string | undefined> {
  modelId: string;
  layoutId?: string;
}

export const LayoutEditorPage: React.FC = () => {
  const { modelId, layoutId } = useParams<RouteParams>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [initialData, setInitialData] = useState<Data | undefined>(undefined);

  // GraphQL queries
  const { data: modelData, loading: modelLoading, error: modelError } = useQuery(GET_MODEL, {
    variables: { id: modelId },
    skip: !modelId
  });

  const { data: entitiesData, loading: entitiesLoading } = useQuery(GET_ENTITIES, {
    variables: { modelId },
    skip: !modelId
  });

  const { data: layoutData, loading: layoutLoading, error: layoutError } = useQuery(GET_LAYOUT, {
    variables: { id: layoutId },
    skip: !layoutId
  });

  // GraphQL mutations
  const [createLayout] = useMutation(CREATE_LAYOUT);
  const [updateLayout] = useMutation(UPDATE_LAYOUT);

  const entities = entitiesData?.entities || [];
  const model = modelData?.model;
  const layout = layoutData?.layout;

  // Transform loaded layout data to Puck format
  useEffect(() => {
    if (layout && layout.components) {
      // Transform existing layout to Puck format
      const puckData: Data = {
        content: layout.components.map((comp: any) => ({
          type: comp.componentType === 'DataGrid' ? 'Text' : comp.componentType, // Map to available components for now
          props: {
            ...comp.properties,
            content: comp.componentType === 'DataGrid' ? 'DataGrid Component (placeholder)' : 
                     comp.componentType === 'TorqueForm' ? 'Form Component (placeholder)' :
                     comp.componentType === 'TorqueButton' ? 'Button Component (placeholder)' :
                     comp.properties?.content || 'Component placeholder'
          }
        })),
        root: {
          title: layout.name || 'Layout'
        }
      };
      setInitialData(puckData);
    } else if (!layoutId) {
      // Set default empty data for new layout
      setInitialData({
        content: [],
        root: {
          title: 'New Layout'
        }
      });
    }
  }, [layout, layoutId]);

  const handleSave = async (data: Data) => {
    if (!modelId) {
      console.error('No modelId provided');
      return;
    }

    console.log('Starting save with Puck data:', data);

    // Convert Puck data to legacy GraphQL format for now
    // TODO: Update backend to support Puck format natively
    const components = data.content.map((item, index) => ({
      componentType: item.type,
      position: {
        row: index, // Simple positioning for now
        column: 0,
        width: 12,
        height: 2
      },
      properties: item.props || {},
      styling: {}
    }));

    const layoutData = {
      name: data.root?.title || (layoutId ? layout?.name || `${model?.name} Layout` : 'New Layout'),
      modelId,
      targetEntities: [], // TODO: Extract from component properties
      components,
      layoutType: layout?.layoutType || 'Dashboard',
      responsive: layout?.responsive || {
        breakpoints: [
          { name: 'mobile', minWidth: 0, columns: 1 },
          { name: 'tablet', minWidth: 768, columns: 2 },
          { name: 'desktop', minWidth: 1024, columns: 3 }
        ]
      }
    };

    console.log('Converted layout data for save:', JSON.stringify(layoutData, null, 2));

    setIsLoading(true);
    try {

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
      // Log the exact payload being sent for debugging
      console.error('Layout save failed with payload:', JSON.stringify(layoutData, null, 2));
      console.error('Failed to save layout:', error);
      
      notifications.show({
        title: 'Save Failed',
        message: `Failed to save layout: ${error instanceof Error ? error.message : String(error)}`,
        color: 'red'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = (data: Data) => {
    // Convert Puck data to TorqueApp format and open preview
    const layoutConfig = {
      id: layoutId || 'preview',
      title: data.root?.title || 'Layout Preview',
      layout: {
        type: 'grid',
        rows: 12,
        columns: 12
      },
      components: data.content.map((item, index) => ({
        type: item.type,
        id: `preview-${index}`,
        position: {
          row: index,
          col: 0,
          rowSpan: 2,
          colSpan: 12
        },
        properties: item.props
      }))
    };

    // Open preview in new window
    const previewUrl = `/torqueapp/${modelId}/preview?layout=${encodeURIComponent(JSON.stringify(layoutConfig))}`;
    window.open(previewUrl, '_blank', 'width=1200,height=800');
  };

  const handleBack = () => {
    navigate(`/models/${modelId}`);
  };

  if (modelLoading || entitiesLoading || (layoutId && layoutLoading)) {
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

  if (layoutError) {
    return (
      <Container size="md" p="md">
        <Alert color="red" title="Error">
          Failed to load layout: {layoutError.message}
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
      <VisualLayoutEditor
        modelId={modelId!}
        layoutId={layoutId}
        entities={entities}
        initialData={initialData}
        onSave={handleSave}
        onPreview={handlePreview}
        onBack={handleBack}
      />
    </div>
  );
};