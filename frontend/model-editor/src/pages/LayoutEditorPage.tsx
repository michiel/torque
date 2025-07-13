import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Alert, LoadingOverlay } from '@mantine/core';
import { useQuery, useMutation } from '@apollo/client';
import { notifications } from '@mantine/notifications';
import { LayoutEditor } from '../components/LayoutEditor';
import { LayoutEditorComponent } from '../components/LayoutEditor/types';
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
  const [initialComponents, setInitialComponents] = useState<LayoutEditorComponent[]>([]);

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

  // Transform loaded layout data to LayoutEditor format
  useEffect(() => {
    console.log('Layout data effect triggered:', { layout, layoutId });
    
    if (layout && layout.components) {
      console.log('Layout components to transform:', layout.components);
      
      const transformedComponents: LayoutEditorComponent[] = layout.components.map((comp: any) => ({
        id: comp.id,
        type: comp.componentType,
        position: comp.position ? {
          row: comp.position.row || 0,
          column: comp.position.column || 0,
          rowSpan: comp.position.height || 2,
          colSpan: comp.position.width || 4
        } : {
          row: 0,
          column: 0,
          rowSpan: 2,
          colSpan: 4
        },
        configuration: comp.properties || {},
        validation: [],
        entityBinding: comp.properties?.entityId ? {
          entityId: comp.properties.entityId,
          fields: comp.properties.fields || [],
          relationships: comp.properties.relationships || []
        } : undefined
      }));
      
      console.log('Transformed components:', transformedComponents);
      setInitialComponents(transformedComponents);
    } else if (!layoutId) {
      // Clear components for new layout
      console.log('Clearing components for new layout');
      setInitialComponents([]);
    } else {
      console.log('No layout data to transform');
    }
  }, [layout, layoutId]);

  const handleSave = async (components: LayoutEditorComponent[]) => {
    if (!modelId) {
      console.error('No modelId provided');
      return;
    }

    console.log('Starting save with components:', components);
    console.log('ModelId:', modelId, 'LayoutId:', layoutId);
    console.log('Layout:', layout);
    console.log('Model:', model);

    // Get unique entity IDs from components for targetEntities
    const targetEntities = Array.from(
      new Set(
        components
          .map(comp => comp.entityBinding?.entityId)
          .filter(entityId => entityId) // Remove null/undefined
      )
    );

    console.log('Target entities:', targetEntities);

    // Convert components to GraphQL LayoutComponent format
    const baseLayoutData = {
      name: layoutId ? layout?.name || `${model?.name} Layout` : 'New Layout',
      modelId,
      targetEntities,
      components: components.map(component => ({
        id: component.id,
        componentType: component.type,
        position: {
          row: component.position.row,
          column: component.position.column,
          width: component.position.colSpan,
          height: component.position.rowSpan
        },
        properties: component.configuration || {},
        styling: {} // Default empty styling
      })),
      responsive: layout?.responsive || {
        breakpoints: [
          { name: 'mobile', minWidth: 0, columns: 1 },
          { name: 'tablet', minWidth: 768, columns: 2 },
          { name: 'desktop', minWidth: 1024, columns: 3 }
        ]
      }
    };

    // Only add layoutType for new layouts (CREATE), not for updates
    const layoutData = layoutId 
      ? baseLayoutData 
      : { ...baseLayoutData, layoutType: 'List' };

    console.log('Layout data before save:', JSON.stringify(layoutData, null, 2));

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
      <LayoutEditor
        modelId={modelId!}
        layoutId={layoutId}
        onSave={handleSave}
        onPreview={handlePreview}
        onBack={handleBack}
        entities={entities}
        initialComponents={initialComponents}
      />
    </div>
  );
};