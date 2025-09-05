import React from 'react';
import { Modal, Button, Group, Box, Text } from '@mantine/core';
import { IconExternalLink, IconX } from '@tabler/icons-react';
import TorqueAppPreview from './TorqueAppPreview';

interface TorqueAppPreviewModalProps {
  opened: boolean;
  onClose: () => void;
  modelId: string;
  modelName: string;
  model?: any; // TODO: Replace with proper Model type
}

/**
 * Modal component for previewing TorqueApp models within the Model Editor.
 * 
 * Features:
 * - Full-screen modal with embedded TorqueApp
 * - Real-time preview of model changes
 * - Option to open TorqueApp in new tab
 * - Responsive design that adapts to modal size
 */
const TorqueAppPreviewModal: React.FC<TorqueAppPreviewModalProps> = ({
  opened,
  onClose,
  modelId,
  modelName,
  model
}) => {
  const handleOpenInNewTab = () => {
    const torqueAppUrl = `http://localhost:3002/app/${modelId}`;
    window.open(torqueAppUrl, '_blank');
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <Text fw={500}>TorqueApp Preview</Text>
          <Text size="sm" c="dimmed">
            {modelName}
          </Text>
        </Group>
      }
      size="90%"
      centered
      styles={{
        content: {
          height: '90vh',
          display: 'flex',
          flexDirection: 'column'
        },
        body: {
          flex: 1,
          padding: 0,
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      {/* Modal toolbar */}
      <Box p="md" style={{ borderBottom: '1px solid #e9ecef', flexShrink: 0 }}>
        <Group justify="space-between" align="center">
          <Text size="sm" c="dimmed">
            Live preview of your TorqueApp model
          </Text>
          <Group gap="xs">
            <Button
              size="xs"
              variant="light"
              leftSection={<IconExternalLink size={14} />}
              onClick={handleOpenInNewTab}
            >
              Open in New Tab
            </Button>
            <Button
              size="xs"
              variant="subtle"
              leftSection={<IconX size={14} />}
              onClick={onClose}
            >
              Close
            </Button>
          </Group>
        </Group>
      </Box>

      {/* TorqueApp preview content */}
      <Box style={{ flex: 1, overflow: 'hidden' }}>
        <TorqueAppPreview
          modelId={modelId}
          modelName={modelName}
          model={model}
        />
      </Box>
    </Modal>
  );
};

export default TorqueAppPreviewModal;