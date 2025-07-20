import React, { useState, useEffect } from 'react';
import {
  Box,
  Center,
  Stack,
  Text,
  Button,
  ThemeIcon,
  Alert,
  LoadingOverlay,
  Group,
  Badge
} from '@mantine/core';
import {
  IconDeviceDesktop,
  IconRefresh,
  IconAlertCircle,
  IconWorldWww
} from '@tabler/icons-react';
import { PageRenderer } from './TorqueApp/PageRenderer';

interface Layout {
  id: string;
  name: string;
  layoutType: string;
  targetEntities: string[];
}

interface Model {
  id: string;
  name: string;
  config?: {
    custom?: {
      startPageLayoutId?: string;
    };
  };
  layouts: Layout[];
}

interface TorqueAppPreviewProps {
  modelId: string;
  modelName: string;
  model?: Model;
}

const TorqueAppPreview: React.FC<TorqueAppPreviewProps> = ({
  modelId,
  modelName,
  model
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appUrl, setAppUrl] = useState<string | null>(null);
  
  // In a real implementation, this would check if the TorqueApp is running
  const [isAppRunning, setIsAppRunning] = useState(false);

  // Determine the start page based on model configuration
  const getStartPageInfo = () => {
    if (!model) return { pageName: 'Default Dashboard', pageType: 'Dashboard' };
    
    const startPageLayoutId = model.config?.custom?.startPageLayoutId;
    
    if (startPageLayoutId && startPageLayoutId.trim()) {
      // Find the configured start page layout
      const startLayout = model.layouts.find(layout => layout.id === startPageLayoutId);
      if (startLayout) {
        return {
          pageName: startLayout.name,
          pageType: startLayout.layoutType,
          targetEntities: startLayout.targetEntities
        };
      }
    }
    
    // Fallback to first layout if no start page configured or start page not found
    if (model.layouts.length > 0) {
      const firstLayout = model.layouts[0];
      return {
        pageName: `${firstLayout.name} (Default)`,
        pageType: firstLayout.layoutType,
        targetEntities: firstLayout.targetEntities
      };
    }
    
    // No layouts available
    return { pageName: 'Default Dashboard', pageType: 'Dashboard' };
  };

  useEffect(() => {
    checkAppStatus();
  }, [modelId]);

  const checkAppStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would make an API call to check if the TorqueApp is running
      // For now, we'll simulate checking the app status
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate that the app is available
      setIsAppRunning(true);
      setAppUrl(`/torque-app/${modelId}`);
    } catch (err) {
      setError('Failed to connect to TorqueApp');
      setIsAppRunning(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    checkAppStatus();
  };

  const handleLaunchApp = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would launch the TorqueApp
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsAppRunning(true);
      setAppUrl(`/torque-app/${modelId}`);
    } catch (err) {
      setError('Failed to launch TorqueApp');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box style={{ position: 'relative', minHeight: '500px' }}>
        <LoadingOverlay visible={loading} />
        <Center h="100%">
          <Stack align="center" gap="md">
            <ThemeIcon size="xl" color="blue" variant="light">
              <IconDeviceDesktop size={32} />
            </ThemeIcon>
            <Text>Connecting to TorqueApp...</Text>
          </Stack>
        </Center>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert icon={<IconAlertCircle size={16} />} color="red" title="TorqueApp Error">
        <Stack gap="md">
          <Text size="sm">{error}</Text>
          <Button size="sm" variant="light" onClick={handleRefresh}>
            Try Again
          </Button>
        </Stack>
      </Alert>
    );
  }

  if (!isAppRunning || !appUrl) {
    return (
      <Center h="100%" style={{ minHeight: '500px' }}>
        <Stack align="center" gap="md">
          <ThemeIcon size="xl" color="orange" variant="light">
            <IconDeviceDesktop size={32} />
          </ThemeIcon>
          <div style={{ textAlign: 'center' }}>
            <Text fw={500} size="lg">TorqueApp Not Running</Text>
            <Text c="dimmed" size="sm">
              Launch the TorqueApp to preview {modelName}
            </Text>
          </div>
          <Group gap="sm">
            <Button 
              onClick={handleLaunchApp}
              leftSection={<IconWorldWww size={16} />}
            >
              Launch TorqueApp
            </Button>
            <Button 
              variant="light" 
              onClick={handleRefresh}
              leftSection={<IconRefresh size={16} />}
            >
              Refresh Status
            </Button>
          </Group>
        </Stack>
      </Center>
    );
  }

  // When the app is running, show the live TorqueApp
  return (
    <Box style={{ height: '100%', minHeight: '500px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <Group justify="space-between" mb="md" style={{ flexShrink: 0 }}>
        <Group gap="xs">
          <Badge color="green" variant="light">
            Live
          </Badge>
          <Text size="sm" c="dimmed">
            {getStartPageInfo().pageName}
          </Text>
        </Group>
        <Button 
          size="xs" 
          variant="subtle"
          leftSection={<IconRefresh size={14} />}
          onClick={handleRefresh}
        >
          Refresh
        </Button>
      </Group>
      
      {/* Live TorqueApp using embedded components */}
      <Box
        style={{
          flex: 1,
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          overflow: 'hidden',
          background: 'white',
          position: 'relative'
        }}
      >
        <PageRenderer 
          modelId={modelId} 
          pageName={getStartPageInfo().pageName !== 'Default Dashboard' ? getStartPageInfo().pageName : undefined}
        />
      </Box>
    </Box>
  );
};

export default TorqueAppPreview;