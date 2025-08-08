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
import { TorqueAppEmbed } from 'torque-client';
import { useTorqueConfig } from '../providers/TorqueConfigProvider';

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
  const config = useTorqueConfig();
  
  console.log('[TorqueAppPreview] Config:', config);
  console.log('[TorqueAppPreview] Passing apiBaseUrl to TorqueAppEmbed:', config.baseUrl);
  
  // Don't render until config is loaded
  if (!config.baseUrl) {
    console.log('[TorqueAppPreview] Waiting for config to load...');
    return (
      <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
        <Text>Loading app preview...</Text>
      </Box>
    );
  }
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
      // Test if the TorqueApp API is running by calling the ping endpoint
      const response = await fetch('http://localhost:8080/rpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'ping',
          id: 1
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message);
      }

      // Test if the specific model exists
      const modelResponse = await fetch('http://localhost:8080/rpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'loadPage',
          params: { modelId },
          id: 2
        })
      });

      const modelData = await modelResponse.json();
      if (modelData.error) {
        throw new Error(`Model not available: ${modelData.error.message}`);
      }

      setIsAppRunning(true);
      setAppUrl(`http://localhost:3004/app/${modelId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to TorqueApp';
      setError(errorMessage);
      setIsAppRunning(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    checkAppStatus();
  };

  const handleLaunchApp = async () => {
    // Instead of launching, open the TorqueApp in a new tab
    const torqueAppUrl = `http://localhost:3004/app/${modelId}`;
    window.open(torqueAppUrl, '_blank');
    
    // Also refresh the status to check if it's working
    await checkAppStatus();
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
        <TorqueAppEmbed 
          modelId={modelId}
          pageName={getStartPageInfo().pageName !== 'Default Dashboard' ? getStartPageInfo().pageName : undefined}
          apiBaseUrl={config.baseUrl}
          style={{ height: '100%', minHeight: '400px' }}
          onAction={(action) => {
            console.log('TorqueApp action in Model Editor:', action);
            // TODO: Handle actions from embedded TorqueApp
          }}
        />
      </Box>
    </Box>
  );
};

export default TorqueAppPreview;