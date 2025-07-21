import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Alert, LoadingOverlay } from '@mantine/core';
import { useQuery, useMutation } from '@apollo/client';
import { notifications } from '@mantine/notifications';
import { VisualLayoutEditor } from '../components/VisualLayoutEditor';
import { Data } from '@measured/puck';
import { GET_MODEL, GET_ENTITIES, GET_LAYOUT } from '../graphql/queries';
import { CREATE_LAYOUT, UPDATE_LAYOUT } from '../graphql/mutations';
import { migrateLegacyLayout, convertPuckToLegacyLayout, needsMigration, getMigrationWarnings } from '../components/VisualLayoutEditor/migration/layoutMigration';
import { withRetry, isNetworkError, isValidationError, isPermissionError } from '../utils/retryUtils';
import { validateLayoutData, sanitizeLayoutData } from '../utils/layoutValidation';

interface RouteParams extends Record<string, string | undefined> {
  id: string;
  layoutId?: string;
}

export const LayoutEditorPage: React.FC = () => {
  const { id: modelId, layoutId } = useParams<RouteParams>();
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
  const [createLayout] = useMutation(CREATE_LAYOUT, {
    refetchQueries: [{ query: GET_MODEL, variables: { id: modelId } }],
    onCompleted: () => {
      console.log('Layout created successfully - cache invalidated');
    },
    onError: (error) => {
      console.error('Failed to create layout:', error);
    }
  });
  const [updateLayout] = useMutation(UPDATE_LAYOUT, {
    refetchQueries: [
      { query: GET_MODEL, variables: { id: modelId } },
      { query: GET_LAYOUT, variables: { id: layoutId } }
    ],
    onCompleted: () => {
      console.log('Layout updated successfully - cache invalidated');
    },
    onError: (error) => {
      console.error('Failed to update layout:', error);
    }
  });

  const entities = entitiesData?.entities || [];
  const model = modelData?.model;
  const layout = layoutData?.layout;

  // Transform loaded layout data to Puck format
  useEffect(() => {
    if (layout && layout.components) {
      // Check if this layout needs migration
      if (needsMigration(layout)) {
        const warnings = getMigrationWarnings(layout);
        if (warnings.length > 0) {
          console.warn('Layout migration warnings:', warnings);
          notifications.show({
            title: 'Layout Migration',
            message: `This layout has been migrated from the legacy format. ${warnings.length} warning(s) - check console for details.`,
            color: 'orange',
            autoClose: 5000
          });
        }
      }
      
      // Use migration utility to convert to Puck format
      const puckData = migrateLegacyLayout(layout);
      setInitialData(puckData);
    } else if (!layoutId) {
      // Set default empty data for new layout
      setInitialData({
        content: [],
        root: {
          props: {
            title: 'New Layout'
          }
        }
      });
    }
  }, [layout, layoutId]);

  const handleSave = async (data: Data, isManualSave: boolean = false) => {
    if (!modelId) {
      console.error('No modelId provided');
      return;
    }

    console.log('Starting save with Puck data:', data);

    // Validate and sanitize layout data before processing
    const validation = validateLayoutData(data, modelId);
    
    if (!validation.isValid) {
      // Show validation errors to user
      notifications.show({
        title: 'Validation Failed',
        message: `Cannot save layout: ${validation.errors.join(', ')}`,
        color: 'red',
        autoClose: 8000
      });
      return;
    }

    // Show warnings if any
    if (validation.warnings.length > 0) {
      console.warn('Layout validation warnings:', validation.warnings);
      notifications.show({
        title: 'Layout Warnings',
        message: `${validation.warnings.length} warning(s) found. Check console for details.`,
        color: 'yellow',
        autoClose: 5000
      });
    }

    // Sanitize the data to remove problematic fields
    const sanitizedData = sanitizeLayoutData(data);

    // Convert Puck data to legacy GraphQL format using migration utility
    const layoutData = convertPuckToLegacyLayout(sanitizedData, layoutId, modelId, layout, entities);

    console.log('Converted layout data for save:', JSON.stringify(layoutData, null, 2));

    setIsLoading(true);
    try {
      // Wrap save operations with retry logic for network failures
      await withRetry(async () => {
        if (layoutId) {
          // Update existing layout
          await updateLayout({
            variables: {
              id: layoutId,
              input: layoutData
            }
          });

          // Only show notification for manual saves
          if (isManualSave) {
            notifications.show({
              title: 'Layout Updated',
              message: 'Your layout has been saved successfully',
              color: 'green'
            });
          }
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
            navigate(`/models/${modelId}/editor/layouts/${newLayoutId}`);
          }
        }
      }, {
        maxRetries: 2,
        delayMs: 1000,
        shouldRetry: (error) => isNetworkError(error) && !isValidationError(error) && !isPermissionError(error)
      });
    } catch (error) {
      // Log the exact payload being sent for debugging
      console.error('Layout save failed with payload:', JSON.stringify(layoutData, null, 2));
      console.error('Failed to save layout:', error);
      
      // Enhanced error handling with specific error types using utility functions
      let errorMessage = 'An unexpected error occurred while saving the layout.';
      let errorTitle = 'Save Failed';
      
      if (error instanceof Error) {
        // Network errors
        if (isNetworkError(error)) {
          errorTitle = 'Connection Error';
          errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
        }
        // Validation errors
        else if (isValidationError(error)) {
          errorTitle = 'Validation Error';
          errorMessage = 'The layout data is invalid. Please check your components and try again.';
        }
        // Permission errors
        else if (isPermissionError(error)) {
          errorTitle = 'Permission Error';
          errorMessage = 'You do not have permission to save this layout.';
        }
        // GraphQL errors
        else if (error.message.includes('GraphQL error')) {
          errorTitle = 'Server Error';
          errorMessage = 'The server encountered an error processing your layout. Please try again.';
        }
        else {
          errorMessage = `Failed to save layout: ${error.message}`;
        }
      }
      
      notifications.show({
        title: errorTitle,
        message: errorMessage,
        color: 'red',
        autoClose: 8000 // Give users more time to read error messages
      });
      
      // Re-throw the error for the Visual Layout Editor to handle
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = (data: Data) => {
    // Convert Puck data to TorqueApp format and open preview
    const layoutConfig = {
      id: layoutId || 'preview',
      title: data.root?.props?.title || 'Layout Preview',
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
    // Use browser history to go back instead of direct navigation
    navigate(-1);
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