import React, { useMemo, useEffect, useRef } from 'react';
import { Puck, Data } from '@measured/puck';
import '@measured/puck/puck.css';
import './VisualLayoutEditor.css';
import { Container, Stack, Group, Button, Text, ActionIcon, Badge } from '@mantine/core';
import { IconArrowLeft, IconDeviceFloppy, IconClock } from '@tabler/icons-react';
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
  onSave: (data: Data) => Promise<void>;
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

  const [currentData, setCurrentData] = React.useState<Data>(defaultData);
  const [saveStatus, setSaveStatus] = React.useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved');
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null);
  const autoSaveTimer = useRef<number | null>(null);

  const config = useMemo(() => {
    return createTorqueComponentConfig(entities);
  }, [entities]);

  const handlePublish = async (data: Data) => {
    setCurrentData(data);
    setSaveStatus('saving');
    try {
      await onSave(data);
      setSaveStatus('saved');
      setLastSaved(new Date());
    } catch (error) {
      setSaveStatus('error');
      console.error('Save error:', error);
    }
  };

  const handlePreview = () => {
    if (onPreview) {
      onPreview(currentData);
    }
  };

  const handleDataChange = (data: Data) => {
    setCurrentData(data);
    setSaveStatus('unsaved');
    
    // Auto-save after 3 seconds of inactivity
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }
    
    autoSaveTimer.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        await onSave(data);
        setSaveStatus('saved');
        setLastSaved(new Date());
      } catch (error) {
        setSaveStatus('error');
        console.error('Auto-save error:', error);
      }
    }, 3000);
  };

  const handleManualSave = async () => {
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }
    setSaveStatus('saving');
    try {
      await onSave(currentData);
      setSaveStatus('saved');
      setLastSaved(new Date());
    } catch (error) {
      setSaveStatus('error');
      console.error('Manual save error:', error);
    }
  };

  // Save status is now handled directly in the save functions

  // Cleanup auto-save timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, []);

  const getSaveStatusBadge = () => {
    switch (saveStatus) {
      case 'saved':
        return (
          <Badge color="green" size="sm" leftSection={<IconDeviceFloppy size={12} />}>
            Saved {lastSaved ? `at ${lastSaved.toLocaleTimeString()}` : ''}
          </Badge>
        );
      case 'saving':
        return (
          <Badge color="blue" size="sm" leftSection={<IconClock size={12} />}>
            Saving...
          </Badge>
        );
      case 'unsaved':
        return (
          <Badge color="orange" size="sm" leftSection={<IconClock size={12} />}>
            Unsaved changes
          </Badge>
        );
      case 'error':
        return (
          <Badge color="red" size="sm">
            Save failed
          </Badge>
        );
      default:
        return null;
    }
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
        
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {getSaveStatusBadge()}
          
          <Button
            variant="subtle"
            size="sm"
            onClick={handleManualSave}
            disabled={saveStatus === 'saving'}
            leftSection={<IconDeviceFloppy size={16} />}
          >
            Save
          </Button>
          
          {onPreview && (
            <Button
              variant="outline"
              onClick={handlePreview}
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
          data={currentData}
          onPublish={handlePublish}
          onChange={handleDataChange}
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