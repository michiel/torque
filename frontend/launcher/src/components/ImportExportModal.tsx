import { useState, useEffect } from 'react'
import {
  Modal,
  Stack,
  Select,
  Switch,
  Button,
  Group,
  Card,
  Text,
  Progress,
  Alert,
  Tabs,
  Badge
} from '@mantine/core'
import {
  IconUpload,
  IconDownload,
  IconFile,
  IconFolder,
  IconInfoCircle
} from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { invoke } from '@tauri-apps/api/core'
import { 
  EnhancedExportOptions,
  EnhancedImportOptions,
  ExportFormat,
  CompressionLevel,
  MergeMode,
  ImportExportProgress,
  ProjectInfo
} from '../types'

interface ImportExportModalProps {
  opened: boolean
  onClose: () => void
  onComplete: () => void
  selectedProject?: ProjectInfo
  defaultTab?: 'export' | 'import'
}

export function ImportExportModal({ 
  opened, 
  onClose, 
  onComplete,
  selectedProject,
  defaultTab = 'export'
}: ImportExportModalProps) {
  const [activeTab, setActiveTab] = useState<string | null>(defaultTab)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState<ImportExportProgress | null>(null)
  const [operationId, setOperationId] = useState<string | null>(null)

  // Export form state
  const [exportOptions, setExportOptions] = useState<EnhancedExportOptions>({
    format: ExportFormat.SqliteDatabase,
    include_data: true,
    include_models: true,
    include_config: true,
    include_metadata: true,
    compression_level: CompressionLevel.Balanced,
    encryption: undefined,
    split_size_mb: undefined,
    destination_path: undefined,
    use_native_dialog: true
  })

  // Import form state
  const [importOptions, setImportOptions] = useState<EnhancedImportOptions>({
    source_path: undefined,
    destination_name: undefined,
    overwrite_existing: false,
    validate_before_import: true,
    create_backup: true,
    merge_mode: MergeMode.Rename,
    use_native_dialog: true
  })

  useEffect(() => {
    let interval: number | null = null

    if (isProcessing && operationId) {
      interval = setInterval(async () => {
        try {
          const currentProgress = await invoke<ImportExportProgress | null>(
            'get_import_export_progress',
            { operationId }
          )
          
          if (currentProgress) {
            setProgress(currentProgress)
            
            if (currentProgress.is_complete) {
              setIsProcessing(false)
              
              if (currentProgress.error_message) {
                notifications.show({
                  title: 'Operation Failed',
                  message: currentProgress.error_message,
                  color: 'red'
                })
              } else {
                notifications.show({
                  title: 'Operation Complete',
                  message: `${currentProgress.operation_type} completed successfully`,
                  color: 'green'
                })
                onComplete()
              }
            }
          }
        } catch (error) {
          console.error('Failed to get progress:', error)
        }
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isProcessing, operationId, onComplete])

  const handleExport = async () => {
    if (!selectedProject) {
      notifications.show({
        title: 'Error',
        message: 'No project selected for export',
        color: 'red'
      })
      return
    }

    try {
      setIsProcessing(true)
      
      const result = await invoke<{ operation_id: string }>('export_project_enhanced', {
        projectId: selectedProject.name,
        options: exportOptions
      })

      setOperationId(result.operation_id)
      
      notifications.show({
        title: 'Export Started',
        message: `Exporting project "${selectedProject.name}"...`,
        color: 'blue'
      })
    } catch (error) {
      setIsProcessing(false)
      notifications.show({
        title: 'Export Failed',
        message: error instanceof Error ? error.message : 'Failed to start export',
        color: 'red'
      })
    }
  }

  const handleImport = async () => {
    try {
      setIsProcessing(true)
      
      const result = await invoke<{ operation_id: string }>('import_project_enhanced', {
        options: importOptions
      })

      setOperationId(result.operation_id)
      
      notifications.show({
        title: 'Import Started',
        message: 'Import operation started...',
        color: 'blue'
      })
    } catch (error) {
      setIsProcessing(false)
      notifications.show({
        title: 'Import Failed',
        message: error instanceof Error ? error.message : 'Failed to start import',
        color: 'red'
      })
    }
  }

  const handleSelectExportDestination = async () => {
    try {
      const extension = getFileExtension(exportOptions.format)
      const projectName = selectedProject?.name || 'project'
      
      const filePath = await invoke<string | null>('open_export_dialog', {
        projectName,
        defaultExtension: extension
      })
      
      if (filePath) {
        setExportOptions(prev => ({
          ...prev,
          destination_path: filePath
        }))
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to open file dialog',
        color: 'red'
      })
    }
  }

  const handleSelectImportSource = async () => {
    try {
      const filePath = await invoke<string | null>('open_import_dialog', {
        supportedExtensions: ['sqlite', 'torque', 'json', 'csv', 'tar.gz']
      })
      
      if (filePath) {
        setImportOptions(prev => ({
          ...prev,
          source_path: filePath
        }))
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to open file dialog',
        color: 'red'
      })
    }
  }

  const getFileExtension = (format: ExportFormat): string => {
    switch (format) {
      case ExportFormat.TorqueArchive: return 'torque'
      case ExportFormat.SqliteDatabase: return 'sqlite'
      case ExportFormat.JsonExport: return 'json'
      case ExportFormat.CsvExport: return 'csv'
      case ExportFormat.BackupArchive: return 'tar.gz'
      default: return 'sqlite'
    }
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.round(seconds % 60)
    return `${minutes}m ${remainingSeconds}s`
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Import / Export Projects"
      size="lg"
      styles={{
        body: { padding: '2rem' }
      }}
    >
      <Stack gap="lg">
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab 
              value="export" 
              leftSection={<IconDownload size="1rem" />}
            >
              Export
            </Tabs.Tab>
            <Tabs.Tab 
              value="import" 
              leftSection={<IconUpload size="1rem" />}
            >
              Import
            </Tabs.Tab>
          </Tabs.List>

          {/* Export Tab */}
          <Tabs.Panel value="export" pt="md">
            <Stack gap="md">
              {selectedProject && (
                <Alert icon={<IconInfoCircle size="1rem" />} color="blue">
                  Exporting project: <strong>{selectedProject.name}</strong>
                </Alert>
              )}

              <Select
                label="Export Format"
                value={exportOptions.format}
                onChange={(value) => setExportOptions(prev => ({
                  ...prev,
                  format: value as ExportFormat
                }))}
                data={[
                  { value: ExportFormat.SqliteDatabase, label: 'SQLite Database (.sqlite)' },
                  { value: ExportFormat.TorqueArchive, label: 'Torque Archive (.torque)' },
                  { value: ExportFormat.JsonExport, label: 'JSON Export (.json)' },
                  { value: ExportFormat.CsvExport, label: 'CSV Export (.csv)' },
                  { value: ExportFormat.BackupArchive, label: 'Backup Archive (.tar.gz)' }
                ]}
              />

              <Group justify="space-between">
                <Text fw={500}>What to include:</Text>
              </Group>

              <Stack gap="xs">
                <Switch
                  label="Include data"
                  description="Export all entity data"
                  checked={exportOptions.include_data}
                  onChange={(event) => setExportOptions(prev => ({
                    ...prev,
                    include_data: event.currentTarget.checked
                  }))}
                />
                <Switch
                  label="Include models"
                  description="Export model definitions"
                  checked={exportOptions.include_models}
                  onChange={(event) => setExportOptions(prev => ({
                    ...prev,
                    include_models: event.currentTarget.checked
                  }))}
                />
                <Switch
                  label="Include configuration"
                  description="Export project settings"
                  checked={exportOptions.include_config}
                  onChange={(event) => setExportOptions(prev => ({
                    ...prev,
                    include_config: event.currentTarget.checked
                  }))}
                />
                <Switch
                  label="Include metadata"
                  description="Export creation dates, descriptions, etc."
                  checked={exportOptions.include_metadata}
                  onChange={(event) => setExportOptions(prev => ({
                    ...prev,
                    include_metadata: event.currentTarget.checked
                  }))}
                />
              </Stack>

              <Select
                label="Compression Level"
                value={exportOptions.compression_level}
                onChange={(value) => setExportOptions(prev => ({
                  ...prev,
                  compression_level: value as CompressionLevel
                }))}
                data={[
                  { value: CompressionLevel.None, label: 'No compression' },
                  { value: CompressionLevel.Fast, label: 'Fast compression' },
                  { value: CompressionLevel.Balanced, label: 'Balanced' },
                  { value: CompressionLevel.Maximum, label: 'Maximum compression' }
                ]}
              />

              <Group>
                <Button
                  variant="outline"
                  leftSection={<IconFolder size="1rem" />}
                  onClick={handleSelectExportDestination}
                >
                  Choose Destination
                </Button>
                {exportOptions.destination_path && (
                  <Text size="sm" c="dimmed" truncate style={{ maxWidth: '300px' }}>
                    {exportOptions.destination_path}
                  </Text>
                )}
              </Group>
            </Stack>
          </Tabs.Panel>

          {/* Import Tab */}
          <Tabs.Panel value="import" pt="md">
            <Stack gap="md">
              <Group>
                <Button
                  variant="outline"
                  leftSection={<IconFile size="1rem" />}
                  onClick={handleSelectImportSource}
                >
                  Select File
                </Button>
                {importOptions.source_path && (
                  <Text size="sm" c="dimmed" truncate style={{ maxWidth: '300px' }}>
                    {importOptions.source_path}
                  </Text>
                )}
              </Group>

              <Stack gap="xs">
                <Switch
                  label="Validate before import"
                  description="Check file integrity before importing"
                  checked={importOptions.validate_before_import}
                  onChange={(event) => setImportOptions(prev => ({
                    ...prev,
                    validate_before_import: event.currentTarget.checked
                  }))}
                />
                <Switch
                  label="Create backup"
                  description="Backup existing project before overwriting"
                  checked={importOptions.create_backup}
                  onChange={(event) => setImportOptions(prev => ({
                    ...prev,
                    create_backup: event.currentTarget.checked
                  }))}
                />
                <Switch
                  label="Overwrite existing"
                  description="Replace project if it already exists"
                  checked={importOptions.overwrite_existing}
                  onChange={(event) => setImportOptions(prev => ({
                    ...prev,
                    overwrite_existing: event.currentTarget.checked
                  }))}
                />
              </Stack>

              <Select
                label="If project exists"
                value={importOptions.merge_mode}
                onChange={(value) => setImportOptions(prev => ({
                  ...prev,
                  merge_mode: value as MergeMode
                }))}
                data={[
                  { value: MergeMode.Replace, label: 'Replace existing project' },
                  { value: MergeMode.Rename, label: 'Auto-rename to avoid conflicts' },
                  { value: MergeMode.Skip, label: 'Skip if project exists' },
                  { value: MergeMode.Merge, label: 'Merge with existing data' }
                ]}
                disabled={!importOptions.overwrite_existing}
              />
            </Stack>
          </Tabs.Panel>
        </Tabs>

        {/* Progress Display */}
        {isProcessing && progress && (
          <Card withBorder padding="lg">
            <Stack gap="md">
              <Group justify="space-between">
                <Text fw={600}>
                  {progress.operation_type} Progress
                </Text>
                <Badge color={progress.is_complete ? 'green' : 'blue'}>
                  {progress.is_complete ? 'Complete' : 'Processing'}
                </Badge>
              </Group>

              <Progress 
                value={progress.progress_percent} 
                size="lg"
                animated={!progress.is_complete}
              />

              <Group justify="space-between">
                <Text size="sm">
                  {Math.round(progress.progress_percent)}% complete
                </Text>
                <Text size="sm" c="dimmed">
                  {progress.files_processed} / {progress.total_files} files
                </Text>
              </Group>

              <Text size="sm" c="dimmed">
                {progress.current_step}
              </Text>

              {progress.bytes_processed > 0 && (
                <Group justify="space-between">
                  <Text size="sm">
                    Processed: {formatBytes(progress.bytes_processed)}
                  </Text>
                  <Text size="sm">
                    Elapsed: {formatTime(progress.elapsed_seconds)}
                  </Text>
                </Group>
              )}

              {progress.estimated_remaining_seconds && (
                <Text size="sm" c="dimmed">
                  Estimated remaining: {formatTime(progress.estimated_remaining_seconds)}
                </Text>
              )}
            </Stack>
          </Card>
        )}

        {/* Action Buttons */}
        <Group justify="space-between">
          <Button
            variant="subtle"
            onClick={onClose}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Cancel'}
          </Button>

          <Group>
            {activeTab === 'export' && (
              <Button
                leftSection={<IconDownload size="1rem" />}
                onClick={handleExport}
                disabled={!selectedProject || isProcessing}
                loading={isProcessing}
              >
                Export Project
              </Button>
            )}

            {activeTab === 'import' && (
              <Button
                leftSection={<IconUpload size="1rem" />}
                onClick={handleImport}
                disabled={!importOptions.source_path || isProcessing}
                loading={isProcessing}
              >
                Import Project
              </Button>
            )}
          </Group>
        </Group>
      </Stack>
    </Modal>
  )
}

export default ImportExportModal