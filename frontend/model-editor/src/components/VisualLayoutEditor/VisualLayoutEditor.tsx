import React, { useMemo } from 'react';
import { Puck, Data } from '@measured/puck';
import '@measured/puck/puck.css';
import './VisualLayoutEditor.css';
import { Container, Stack, Group, Button, Text, ActionIcon } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { TorqueComponentConfig, createTorqueComponentConfig } from './TorqueComponents';

interface VisualLayoutEditorProps {
  modelId: string;
  layoutId?: string;
  entities: Array<{ 
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
  }>;
  initialData?: Data;
  onSave: (data: Data) => void;
  onPreview?: (data: Data) => void;
  onBack?: () => void;
}

export const VisualLayoutEditor: React.FC<VisualLayoutEditorProps> = ({
  modelId,
  layoutId,
  entities,
  initialData,
  onSave,
  onPreview,
  onBack
}) => {
  const defaultData: Data = initialData || {
    content: [],
    root: {
      title: 'New Layout'
    }
  };

  const config = useMemo(() => {
    return createTorqueComponentConfig(entities);
  }, [entities]);

  const handlePublish = (data: Data) => {
    onSave(data);
  };

  return (
    <div className="visual-layout-editor">
      {/* Header */}
      <div className="visual-layout-editor-header">
        {onBack && (
          <ActionIcon
            variant="subtle"
            onClick={onBack}
            size="lg"
            aria-label="Go back to model editor"
          >
            <IconArrowLeft size={20} />
          </ActionIcon>
        )}
        <div>
          <Text size="xl" fw={700}>
            Visual Layout Editor
          </Text>
          <Text size="sm" c="dimmed">
            Design your application interface with visual components
          </Text>
        </div>
        
        <div style={{ marginLeft: 'auto' }}>
          {onPreview && (
            <Button
              variant="outline"
              onClick={() => onPreview(defaultData)}
            >
              Preview
            </Button>
          )}
        </div>
      </div>

      {/* Puck Editor */}
      <div className="visual-layout-editor-canvas">
        <Puck
          config={config}
          data={defaultData}
          onPublish={handlePublish}
          viewports={[
            { width: 360, height: 'auto', label: 'Mobile' },
            { width: 768, height: 'auto', label: 'Tablet' },
            { width: 1024, height: 'auto', label: 'Desktop' }
          ]}
        />
      </div>
    </div>
  );
};