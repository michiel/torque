import React, { useState } from 'react';
import {
  Modal,
  Stack,
  Group,
  Button,
  Text,
  Textarea,
  Checkbox,
  Alert,
  Code,
  Switch,
  Divider,
  Badge,
  Paper,
} from '@mantine/core';
import {
  IconDownload,
  IconFileExport,
  IconCheck,
  IconAlertTriangle,
  IconInfoCircle,
} from '@tabler/icons-react';
import { exportModel, downloadModelAsJSON, ExportedModel } from '../../utils/modelExport';

interface ModelExportDialogProps {
  opened: boolean;
  onClose: () => void;
  modelData: {
    name: string;
    description?: string;
    entities: any[];
    layouts?: any[];
    customComponents?: any[];
  };
}

export const ModelExportDialog: React.FC<ModelExportDialogProps> = ({
  opened,
  onClose,
  modelData
}) => {
  const [includeLayouts, setIncludeLayouts] = useState(true);
  const [includeCustomComponents, setIncludeCustomComponents] = useState(true);
  const [prettyFormat, setPrettyFormat] = useState(true);
  const [exportData, setExportData] = useState<ExportedModel | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleExport = () => {
    const dataToExport = {
      ...modelData,
      layouts: includeLayouts ? modelData.layouts : [],
      customComponents: includeCustomComponents ? modelData.customComponents : []
    };

    const exported = exportModel(dataToExport);
    setExportData(exported);
    
    if (!showPreview) {
      downloadModelAsJSON(exported);
      onClose();
    }
  };

  const handleDownload = () => {
    if (exportData) {
      downloadModelAsJSON(exportData);
      onClose();
    }
  };

  const getExportSummary = () => {
    if (!modelData) return null;

    const entityCount = modelData.entities?.length || 0;
    const layoutCount = includeLayouts ? (modelData.layouts?.length || 0) : 0;
    const componentCount = includeCustomComponents ? (modelData.customComponents?.length || 0) : 0;

    return {
      entityCount,
      layoutCount,
      componentCount,
      totalFields: modelData.entities?.reduce((sum, entity) => sum + (entity.fields?.length || 0), 0) || 0
    };
  };

  const summary = getExportSummary();

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group>
          <IconFileExport size={20} />
          <Text fw={600}>Export Model</Text>
        </Group>
      }
      size="lg"
    >
      <Stack gap="md">
        <Text size="sm" color="dimmed">
          Export your model as a JSON file that can be imported into another Model Editor instance.
        </Text>

        {/* Export Options */}
        <Paper p="md" withBorder>
          <Stack gap="sm">
            <Text fw={500} size="sm">Export Options</Text>
            
            <Switch
              label="Include layouts"
              description="Export all layout configurations and component arrangements"
              checked={includeLayouts}
              onChange={(event) => setIncludeLayouts(event.currentTarget.checked)}
            />
            
            <Switch
              label="Include custom components"
              description="Export any custom component definitions"
              checked={includeCustomComponents}
              onChange={(event) => setIncludeCustomComponents(event.currentTarget.checked)}
            />
            
            <Switch
              label="Pretty format"
              description="Format JSON with indentation for readability"
              checked={prettyFormat}
              onChange={(event) => setPrettyFormat(event.currentTarget.checked)}
            />

            <Switch
              label="Show preview before download"
              description="Review the export data before downloading"
              checked={showPreview}
              onChange={(event) => setShowPreview(event.currentTarget.checked)}
            />
          </Stack>
        </Paper>

        {/* Export Summary */}
        {summary && (
          <Paper p="md" withBorder>
            <Stack gap="xs">
              <Text fw={500} size="sm">Export Summary</Text>
              
              <Group>
                <Badge variant="light" color="blue">
                  {summary.entityCount} entities
                </Badge>
                <Badge variant="light" color="green">
                  {summary.totalFields} fields
                </Badge>
                {includeLayouts && (
                  <Badge variant="light" color="orange">
                    {summary.layoutCount} layouts
                  </Badge>
                )}
                {includeCustomComponents && (
                  <Badge variant="light" color="purple">
                    {summary.componentCount} custom components
                  </Badge>
                )}
              </Group>
            </Stack>
          </Paper>
        )}

        {/* Preview */}
        {showPreview && exportData && (
          <Paper p="md" withBorder>
            <Stack gap="sm">
              <Group>
                <Text fw={500} size="sm">Export Preview</Text>
                <Badge variant="light" color="green">
                  <IconCheck size={12} />
                  Ready
                </Badge>
              </Group>
              
              <Textarea
                value={JSON.stringify(exportData, null, prettyFormat ? 2 : 0)}
                readOnly
                rows={10}
                style={{ fontFamily: 'monospace', fontSize: '12px' }}
              />
              
              <Text size="xs" color="dimmed">
                File size: ~{new Blob([JSON.stringify(exportData)]).size} bytes
              </Text>
            </Stack>
          </Paper>
        )}

        {/* Info Alert */}
        <Alert
          icon={<IconInfoCircle size={16} />}
          color="blue"
          variant="light"
        >
          <Text size="sm">
            The exported file contains all model structure, relationships, and configurations. 
            Sensitive data like actual records is not included.
          </Text>
        </Alert>

        {/* Actions */}
        <Group justify="flex-end" gap="sm">
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          
          {showPreview && exportData ? (
            <Button
              leftSection={<IconDownload size={16} />}
              onClick={handleDownload}
              color="green"
            >
              Download File
            </Button>
          ) : (
            <Button
              leftSection={<IconFileExport size={16} />}
              onClick={handleExport}
            >
              {showPreview ? 'Generate Preview' : 'Export & Download'}
            </Button>
          )}
        </Group>
      </Stack>
    </Modal>
  );
};