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

  // When the app is running, show it in an iframe
  return (
    <Box style={{ height: '100%', minHeight: '500px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <Group justify="space-between" mb="md" style={{ flexShrink: 0 }}>
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
          flex: 1,
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          overflow: 'hidden',
          background: 'white',
          position: 'relative'
        }}
      >
        {/* Placeholder for actual TorqueApp iframe */}
        <iframe
          src={`data:text/html,${encodeURIComponent((() => {
            const startPageInfo = getStartPageInfo();
            const layoutsInfo = model?.layouts || [];
            
            return `
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
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                }
                .header-left h1 {
                  margin: 0 0 8px 0; 
                  color: #495057; 
                  font-size: 24px;
                  font-weight: 600;
                }
                .header-left p {
                  margin: 0; 
                  color: #868e96; 
                  font-size: 14px;
                }
                .start-page-badge {
                  background: #e3f2fd;
                  color: #1976d2;
                  padding: 8px 16px;
                  border-radius: 20px;
                  font-size: 13px;
                  font-weight: 500;
                  border: 1px solid #bbdefb;
                }
                .content {
                  background: white;
                  padding: 20px;
                  border-radius: 8px;
                  flex: 1;
                  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
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
                .current-page {
                  background: #f3e5f5;
                  padding: 16px;
                  border-radius: 8px;
                  margin-bottom: 20px;
                  border-left: 4px solid #9c27b0;
                }
                .current-page h3 {
                  margin: 0 0 8px 0;
                  color: #6a1b9a;
                  font-size: 18px;
                }
                .current-page p {
                  margin: 0;
                  color: #424242;
                  font-size: 14px;
                }
                .current-page .page-type {
                  display: inline-block;
                  background: rgba(156, 39, 176, 0.1);
                  color: #6a1b9a;
                  padding: 2px 8px;
                  border-radius: 12px;
                  font-size: 12px;
                  font-weight: 500;
                  margin-top: 8px;
                }
                .layouts-grid {
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                  gap: 12px;
                  margin-top: 20px;
                }
                .layout-card {
                  background: #f8f9fa;
                  padding: 12px;
                  border-radius: 6px;
                  border: 1px solid #e9ecef;
                  transition: all 0.2s;
                }
                .layout-card.active {
                  background: #e8f5e8;
                  border-color: #4caf50;
                }
                .layout-card h4 {
                  margin: 0 0 6px 0;
                  font-size: 14px;
                  color: #495057;
                }
                .layout-card .type {
                  font-size: 12px;
                  color: #6c757d;
                  font-weight: 500;
                }
                .nav-simulation {
                  margin-top: 20px;
                  padding: 16px;
                  background: #fff3e0;
                  border-radius: 8px;
                  border-left: 4px solid #ff9800;
                }
              </style>
            </head>
            <body>
              <div class="header">
                <div class="header-left">
                  <h1>${modelName}</h1>
                  <p>TorqueApp Preview • Model ID: ${modelId.slice(0, 8)}...</p>
                </div>
                <div class="start-page-badge">
                  Start Page: ${startPageInfo.pageName}
                </div>
              </div>
              
              <div class="content">
                <div class="status">● Live Preview</div>
                
                <div class="current-page">
                  <h3>Current Page: ${startPageInfo.pageName}</h3>
                  <p>This is the configured start page that users see when they open the TorqueApp.</p>
                  <div class="page-type">${startPageInfo.pageType}</div>
                  ${startPageInfo.targetEntities && startPageInfo.targetEntities.length > 0 ? 
                    \`<div style="margin-top: 8px; font-size: 12px; color: #666;">
                      Target Entities: \${startPageInfo.targetEntities.join(', ')}
                    </div>\` : ''}
                </div>

                <h3>Available Layouts (\${layoutsInfo.length})</h3>
                <div class="layouts-grid">
                  \${layoutsInfo.map(layout => \`
                    <div class="layout-card \${layout.id === model?.config?.custom?.startPageLayoutId ? 'active' : ''}">
                      <h4>\${layout.name} \${layout.id === model?.config?.custom?.startPageLayoutId ? '★' : ''}</h4>
                      <div class="type">\${layout.layoutType}</div>
                      \${layout.targetEntities.length > 0 ? 
                        \`<div style="font-size: 11px; color: #888; margin-top: 4px;">
                          \${layout.targetEntities.join(', ')}
                        </div>\` : ''}
                    </div>
                  \`).join('')}
                </div>
                
                <div class="nav-simulation">
                  <h3 style="margin: 0 0 8px 0; color: #e65100; font-size: 16px;">Dynamic Navigation</h3>
                  <p style="margin: 0; color: #424242; font-size: 14px;">
                    The TorqueApp automatically generates navigation based on your model's layouts and entities. 
                    Users can switch between different views and data management interfaces seamlessly.
                  </p>
                </div>
              </div>
            </body>
            </html>
            `;
          })())}`}
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