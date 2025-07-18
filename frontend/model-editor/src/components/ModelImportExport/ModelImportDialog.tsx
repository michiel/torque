import React, { useState, useCallback } from 'react';
import {
  Modal,
  Stack,
  Group,
  Button,
  Text,
  Textarea,
  Alert,
  Paper,
  Badge,
  Divider,
  FileInput,
  Tabs,
  List,
  Progress,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconUpload,
  IconFileImport,
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconInfoCircle,
  IconFile,
  IconTrash,
} from '@tabler/icons-react';
import { 
  importModelFromJSON, 
  ValidationError, 
  convertImportedModelToInternal,
  ExportedModel 
} from '../../utils/modelExport';

interface ModelImportDialogProps {
  opened: boolean;
  onClose: () => void;
  onImport: (modelData: any, originalJsonString: string) => void;
  isReplacing?: boolean; // Whether this is replacing an existing model
  existingModelName?: string; // Name of the model being replaced
}

export const ModelImportDialog: React.FC<ModelImportDialogProps> = ({
  opened,
  onClose,
  onImport,
  isReplacing = false,
  existingModelName
}) => {
  const [activeTab, setActiveTab] = useState<string | null>('file');
  const [jsonText, setJsonText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<{
    success: boolean;
    data?: ExportedModel;
    errors: ValidationError[];
  } | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const validateJson = useCallback((jsonString: string) => {
    if (!jsonString.trim()) {
      setValidationResult(null);
      return;
    }

    setIsValidating(true);
    
    // Simulate async validation with a small delay
    setTimeout(() => {
      const result = importModelFromJSON(jsonString);
      setValidationResult(result);
      setIsValidating(false);
    }, 300);
  }, []);

  const handleFileUpload = useCallback((uploadedFile: File | null) => {
    setFile(uploadedFile);
    
    if (uploadedFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setJsonText(content);
        validateJson(content);
      };
      reader.readAsText(uploadedFile);
    } else {
      setJsonText('');
      setValidationResult(null);
    }
  }, [validateJson]);

  const handleJsonTextChange = useCallback((value: string) => {
    setJsonText(value);
    setFile(null); // Clear file when typing manually
    validateJson(value);
  }, [validateJson]);

  const handleImport = () => {
    if (!validationResult?.success || !validationResult.data) {
      return;
    }

    const internalModel = convertImportedModelToInternal(validationResult.data);
    onImport(internalModel, jsonText);
    onClose();
  };

  const getValidationSummary = () => {
    if (!validationResult) return null;

    const errors = validationResult.errors.filter(err => err.severity === 'error');
    const warnings = validationResult.errors.filter(err => err.severity === 'warning');

    return {
      hasErrors: errors.length > 0,
      hasWarnings: warnings.length > 0,
      errorCount: errors.length,
      warningCount: warnings.length,
      canImport: validationResult.success && errors.length === 0
    };
  };

  const getModelSummary = () => {
    if (!validationResult?.data) return null;

    const data = validationResult.data;
    return {
      name: data.metadata.name,
      entityCount: data.entities.length,
      layoutCount: data.layouts?.length || 0,
      componentCount: data.customComponents?.length || 0,
      totalFields: data.entities.reduce((sum, entity) => sum + entity.fields.length, 0)
    };
  };

  const summary = getValidationSummary();
  const modelSummary = getModelSummary();

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group>
          <IconFileImport size={20} />
          <Text fw={600}>Import Model</Text>
        </Group>
      }
      size="xl"
    >
      <Stack gap="md">
        <Text size="sm" color="dimmed">
          {isReplacing 
            ? `Import a model from a JSON file. This will replace the existing model "${existingModelName}".`
            : "Import a model from a JSON file exported from Model Editor."
          }
        </Text>

        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="file" leftSection={<IconFile size={16} />}>
              Upload File
            </Tabs.Tab>
            <Tabs.Tab value="text" leftSection={<IconFileImport size={16} />}>
              Paste JSON
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="file" pt="md">
            <Stack gap="sm">
              <FileInput
                label="Select JSON file"
                placeholder="Choose a model export file..."
                accept=".json"
                value={file}
                onChange={handleFileUpload}
                leftSection={<IconUpload size={16} />}
                rightSection={
                  file && (
                    <Tooltip label="Clear file">
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() => handleFileUpload(null)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Tooltip>
                  )
                }
              />
              
              {file && (
                <Text size="xs" color="dimmed">
                  File: {file.name} ({file.size} bytes)
                </Text>
              )}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="text" pt="md">
            <Stack gap="sm">
              <Textarea
                label="JSON Content"
                placeholder="Paste your exported model JSON here..."
                value={jsonText}
                onChange={(e) => handleJsonTextChange(e.currentTarget.value)}
                rows={8}
                style={{ fontFamily: 'monospace' }}
              />
            </Stack>
          </Tabs.Panel>
        </Tabs>

        {/* Validation Progress */}
        {isValidating && (
          <Paper p="md" withBorder>
            <Stack gap="xs">
              <Text size="sm">Validating model data...</Text>
              <Progress value={100} animated />
            </Stack>
          </Paper>
        )}

        {/* Validation Results */}
        {summary && (
          <Paper p="md" withBorder>
            <Stack gap="sm">
              <Group>
                <Text fw={500} size="sm">Validation Results</Text>
                {summary.canImport ? (
                  <Badge color="green" leftSection={<IconCheck size={12} />}>
                    Valid
                  </Badge>
                ) : (
                  <Badge color="red" leftSection={<IconX size={12} />}>
                    Invalid
                  </Badge>
                )}
              </Group>

              {summary.hasErrors && (
                <Alert color="red" icon={<IconX size={16} />}>
                  <Text size="sm" fw={500}>
                    {summary.errorCount} error(s) found
                  </Text>
                  <List size="sm" mt="xs">
                    {validationResult?.errors
                      .filter(err => err.severity === 'error')
                      .map((error, index) => (
                        <List.Item key={index}>
                          <Text size="sm">
                            <Text span fw={500}>{error.path}:</Text> {error.message}
                          </Text>
                        </List.Item>
                      ))}
                  </List>
                </Alert>
              )}

              {summary.hasWarnings && (
                <Alert color="yellow" icon={<IconAlertTriangle size={16} />}>
                  <Text size="sm" fw={500}>
                    {summary.warningCount} warning(s)
                  </Text>
                  <List size="sm" mt="xs">
                    {validationResult?.errors
                      .filter(err => err.severity === 'warning')
                      .map((error, index) => (
                        <List.Item key={index}>
                          <Text size="sm">
                            <Text span fw={500}>{error.path}:</Text> {error.message}
                          </Text>
                        </List.Item>
                      ))}
                  </List>
                </Alert>
              )}
            </Stack>
          </Paper>
        )}

        {/* Model Summary */}
        {modelSummary && summary?.canImport && (
          <Paper p="md" withBorder>
            <Stack gap="sm">
              <Text fw={500} size="sm">Model Summary</Text>
              
              <Group>
                <Text size="sm" fw={500}>Name:</Text>
                <Text size="sm">{modelSummary.name}</Text>
              </Group>
              
              <Group>
                <Badge variant="light" color="blue">
                  {modelSummary.entityCount} entities
                </Badge>
                <Badge variant="light" color="green">
                  {modelSummary.totalFields} fields
                </Badge>
                {modelSummary.layoutCount > 0 && (
                  <Badge variant="light" color="orange">
                    {modelSummary.layoutCount} layouts
                  </Badge>
                )}
                {modelSummary.componentCount > 0 && (
                  <Badge variant="light" color="purple">
                    {modelSummary.componentCount} custom components
                  </Badge>
                )}
              </Group>
            </Stack>
          </Paper>
        )}

        {/* Warning about import */}
        {summary?.canImport && (
          <Alert
            icon={<IconAlertTriangle size={16} />}
            color={isReplacing ? "red" : "orange"}
            variant="light"
          >
            <Text size="sm">
              <Text span fw={500}>Warning:</Text> {isReplacing 
                ? `This will completely replace the existing model "${existingModelName}" and all its data. This action cannot be undone.`
                : "Importing will replace the current model data. Make sure to export your current work if you want to keep it."
              }
            </Text>
          </Alert>
        )}

        {/* Actions */}
        <Group justify="flex-end" gap="sm">
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          
          <Button
            leftSection={<IconFileImport size={16} />}
            onClick={handleImport}
            disabled={!summary?.canImport}
            color={isReplacing ? "red" : "blue"}
          >
            {isReplacing ? "Replace Model" : "Import Model"}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};