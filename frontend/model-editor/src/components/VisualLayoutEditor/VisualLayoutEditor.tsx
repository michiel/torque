import React, { useMemo, useEffect, useRef, useState } from 'react';
import { Puck, Data } from '@measured/puck';
import '@measured/puck/puck.css';
import './VisualLayoutEditor.css';
import { Container, Stack, Group, Button, Text, ActionIcon, Badge, TextInput } from '@mantine/core';
import { IconArrowLeft, IconDeviceFloppy, IconClock, IconEdit, IconCheck, IconX } from '@tabler/icons-react';
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
  isLoading?: boolean;
  onSave: (data: Data, isManualSave?: boolean) => Promise<void>;
  onPreview?: (data: Data) => void;
  onBack?: () => void;
}

export const VisualLayoutEditor: React.FC<VisualLayoutEditorProps> = ({
  modelId,
  layoutId,
  entities,
  initialData,
  isLoading = false,
  onSave,
  onPreview,
  onBack
}) => {

  const defaultData: Data = {
    content: [],
    root: {
      props: {
        title: 'New Layout'
      }
    }
  };

  const [currentData, setCurrentData] = React.useState<Data>(initialData || defaultData);
  const [saveStatus, setSaveStatus] = React.useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved');
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [layoutName, setLayoutName] = useState(defaultData.root?.props?.title || 'New Layout');
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const config = useMemo(() => {
    return createTorqueComponentConfig(entities);
  }, [entities]);


  // Update current data and layout name when initial data changes
  useEffect(() => {
    console.log('VisualLayoutEditor: initialData changed', { 
      hasInitialData: !!initialData, 
      layoutId, 
      isLoading,
      dataContent: initialData?.content?.length || 0 
    });
    
    if (initialData) {
      // Console.log: Dump data being set for rendering
      console.log('=== VISUAL LAYOUT EDITOR: Data being set for rendering ===');
      console.log('Initial data received:', JSON.stringify(initialData, null, 2));
      console.log('Current data before update:', JSON.stringify(currentData, null, 2));
      console.log('=== END: Data being set for rendering ===');
      
      setCurrentData(initialData);
      if (initialData.root?.props?.title) {
        setLayoutName(initialData.root.props.title);
      }
      
      // Force a re-render by logging the state change
      console.log('VisualLayoutEditor: currentData state updated');
    }
  }, [initialData, layoutId, isLoading]);

  // Add effect to monitor currentData changes
  useEffect(() => {
    console.log('VisualLayoutEditor: currentData state changed', {
      contentLength: currentData?.content?.length || 0,
      rootTitle: currentData?.root?.props?.title,
      timestamp: new Date().toISOString()
    });
  }, [currentData]);


  const handleNameEdit = () => {
    setIsEditingName(true);
  };

  const handleNameSave = () => {
    setIsEditingName(false);
    // Update current data with new name
    const updatedData = {
      ...currentData,
      root: {
        ...currentData.root,
        props: {
          ...currentData.root?.props,
          title: layoutName
        }
      }
    };
    setCurrentData(updatedData);
    setSaveStatus('unsaved');
  };

  const handleNameCancel = () => {
    setIsEditingName(false);
    // Reset to current data title
    setLayoutName(currentData.root?.props?.title || 'New Layout');
  };

  const handleNameKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleNameSave();
    } else if (event.key === 'Escape') {
      handleNameCancel();
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
        // Update data with current layout name before saving
        const updatedData = {
          ...data,
          root: {
            ...data.root,
            props: {
              ...data.root?.props,
              title: layoutName
            }
          }
        };
        await onSave(updatedData, false); // Auto-save
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
      // Update data with current layout name before saving
      const updatedData = {
        ...currentData,
        root: {
          ...currentData.root,
          props: {
            ...currentData.root?.props,
            title: layoutName
          }
        }
      };
      await onSave(updatedData, true); // Manual save
      setSaveStatus('saved');
      setLastSaved(new Date());
    } catch (error) {
      setSaveStatus('error');
      console.error('Manual save error:', error);
    }
  };

  // Save status is now handled directly in the save functions

  // Handle resize events for Puck editor
  useEffect(() => {
    const handleWindowResize = () => {
      // Only handle actual window resize events
      if (editorRef.current) {
        // Force Puck to recalculate its layout without triggering more events
        const event = new CustomEvent('puck-resize');
        editorRef.current.dispatchEvent(event);
      }
    };

    const resizeObserver = new ResizeObserver((entries) => {
      // Handle container size changes without triggering window events
      for (const entry of entries) {
        if (entry.target === editorRef.current) {
          // Force Puck internal layout update
          const event = new CustomEvent('puck-container-resize');
          editorRef.current?.dispatchEvent(event);
        }
      }
    });

    if (editorRef.current) {
      resizeObserver.observe(editorRef.current);
    }

    window.addEventListener('resize', handleWindowResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleWindowResize);
    };
  }, []);

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
        <Text size="xl" fw={700}>
          Visual Layout Editor
        </Text>
        
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

      {/* Layout Title */}
      <div className="visual-layout-editor-title">
        {isEditingName ? (
          <Group gap="xs" align="center">
            <TextInput
              value={layoutName}
              onChange={(e) => setLayoutName(e.target.value)}
              onKeyDown={handleNameKeyPress}
              size="md"
              placeholder="Layout name"
              style={{ minWidth: 300, fontSize: '18px', fontWeight: 600 }}
              autoFocus
            />
            <ActionIcon
              variant="subtle"
              color="green"
              size="md"
              onClick={handleNameSave}
            >
              <IconCheck size={18} />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              color="red"
              size="md"
              onClick={handleNameCancel}
            >
              <IconX size={18} />
            </ActionIcon>
          </Group>
        ) : (
          <Group gap="xs" align="center">
            <Text size="lg" fw={600}>
              {layoutName}
            </Text>
            <ActionIcon
              variant="subtle"
              size="md"
              onClick={handleNameEdit}
              title="Edit layout name"
            >
              <IconEdit size={16} />
            </ActionIcon>
          </Group>
        )}
      </div>

      {/* Puck Editor */}
      <div className="visual-layout-editor-canvas" ref={editorRef}>
        {isLoading ? (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '400px',
            color: '#666',
            fontSize: '18px'
          }}>
            Loading layout data...
          </div>
        ) : (
          <Puck
            key={`puck-${layoutId}-${currentData?.content?.length || 0}-${Date.now()}`}
            config={config}
            data={currentData}
            onChange={handleDataChange}
            viewports={[
              { width: 360, height: 'auto', label: 'Mobile' },
              { width: 768, height: 'auto', label: 'Tablet' },
              { width: 1024, height: 'auto', label: 'Desktop' }
            ]}
          />
        )}
      </div>
    </div>
  );
};
