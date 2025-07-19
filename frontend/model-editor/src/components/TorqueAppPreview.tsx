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

interface TorqueAppPreviewProps {
  modelId: string;
  modelName: string;
}

const TorqueAppPreview: React.FC<TorqueAppPreviewProps> = ({
  modelId,
  modelName
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appUrl, setAppUrl] = useState<string | null>(null);
  
  // In a real implementation, this would check if the TorqueApp is running
  const [isAppRunning, setIsAppRunning] = useState(false);

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

  // When the app is running, show it in an iframe
  return (
    <Box style={{ height: '100%', minHeight: '500px', position: 'relative' }}>
      <Group justify="space-between" mb="md">
        <Group gap="xs">
          <Badge color="green" variant="light">
            Running
          </Badge>
          <Text size="sm" c="dimmed">
            TorqueApp is live and connected
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
      
      {/* This would be the actual TorqueApp iframe in a real implementation */}
      <Box
        style={{
          height: 'calc(100% - 50px)',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          overflow: 'hidden',
          background: 'white',
          position: 'relative'
        }}
      >
        {/* Placeholder for actual TorqueApp iframe */}
        <iframe
          src={`data:text/html,${encodeURIComponent(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>TorqueApp Preview - ${modelName}</title>
              <style>
                body { 
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  margin: 0; 
                  padding: 20px; 
                  background: #f8f9fa;
                  height: 100vh;
                  display: flex;
                  flex-direction: column;
                }
                .header {
                  background: white;
                  padding: 20px;
                  border-radius: 8px;
                  margin-bottom: 20px;
                  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
                .content {
                  background: white;
                  padding: 20px;
                  border-radius: 8px;
                  flex: 1;
                  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
                .title { 
                  margin: 0 0 8px 0; 
                  color: #495057; 
                  font-size: 24px;
                  font-weight: 600;
                }
                .subtitle { 
                  margin: 0; 
                  color: #868e96; 
                  font-size: 14px;
                }
                .status {
                  display: inline-block;
                  background: #d4edda;
                  color: #155724;
                  padding: 4px 12px;
                  border-radius: 16px;
                  font-size: 12px;
                  font-weight: 500;
                  margin-bottom: 16px;
                }
                .grid {
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                  gap: 16px;
                  margin-top: 20px;
                }
                .card {
                  background: #f8f9fa;
                  padding: 16px;
                  border-radius: 8px;
                  border: 1px solid #e9ecef;
                }
                .card h3 {
                  margin: 0 0 8px 0;
                  font-size: 16px;
                  color: #495057;
                }
                .card p {
                  margin: 0;
                  color: #6c757d;
                  font-size: 14px;
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h1 class="title">${modelName}</h1>
                <p class="subtitle">TorqueApp Preview • Model ID: ${modelId}</p>
              </div>
              
              <div class="content">
                <div class="status">● Live Preview</div>
                <h2>App Components</h2>
                <div class="grid">
                  <div class="card">
                    <h3>Dashboard</h3>
                    <p>Main application dashboard with key metrics and navigation</p>
                  </div>
                  <div class="card">
                    <h3>Data Views</h3>
                    <p>Dynamic data grids and forms based on model entities</p>
                  </div>
                  <div class="card">
                    <h3>Navigation</h3>
                    <p>Auto-generated navigation menu from model structure</p>
                  </div>
                  <div class="card">
                    <h3>User Interface</h3>
                    <p>Responsive UI components following the model design</p>
                  </div>
                </div>
                
                <div style="margin-top: 30px; padding: 20px; background: #e3f2fd; border-radius: 8px; border-left: 4px solid #2196f3;">
                  <h3 style="margin: 0 0 8px 0; color: #1976d2;">Dynamic Application</h3>
                  <p style="margin: 0; color: #424242;">
                    This TorqueApp is dynamically generated from your model definition. 
                    Changes to the model will automatically update the application interface and functionality.
                  </p>
                </div>
              </div>
            </body>
            </html>
          `)}`}
          style={{
            width: '100%',
            height: '100%',
            border: 'none'
          }}
          title={`TorqueApp Preview - ${modelName}`}
        />
      </Box>
    </Box>
  );
};

export default TorqueAppPreview;