import { useState, useCallback, useMemo } from 'react'
import {
  Modal,
  Stepper,
  Button,
  Group,
  Stack,
  Text,
  FileInput,
  Table,
  Select,
  Alert,
  Progress,
  Badge,
  ActionIcon,
  Tooltip,
  ScrollArea,
  Checkbox,
  NumberInput
} from '@mantine/core'
import {
  IconUpload,
  IconFileSpreadsheet,
  IconCheck,
  IconX,
  IconAlertCircle,
  IconInfoCircle,
  IconSettings,
  IconEye
} from '@tabler/icons-react'
import { useJsonRpcMutation } from '../../hooks/useJsonRpc'
import type {
  ImportFieldMapping,
  ImportPreviewData,
  ImportValidationError,
  ImportResult,
  BulkImportParams,
  FormField
} from '../../types/jsonrpc'

interface ImportWizardProps {
  opened: boolean
  onClose: () => void
  modelId: string
  entityName: string
  entityFields: FormField[]
  onImportComplete?: (result: ImportResult) => void
}

export function ImportWizard({
  opened,
  onClose,
  modelId,
  entityName,
  entityFields,
  onImportComplete
}: ImportWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<ImportPreviewData | null>(null)
  const [fieldMappings, setFieldMappings] = useState<ImportFieldMapping[]>([])
  const [importOptions, setImportOptions] = useState({
    skipDuplicates: true,
    updateExisting: false,
    validateOnly: false
  })
  const [validationErrors, setValidationErrors] = useState<ImportValidationError[]>([])
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [loading, setLoading] = useState(false)

  const { mutate } = useJsonRpcMutation()

  // Parse CSV file
  const parseCSVFile = useCallback(async (file: File): Promise<ImportPreviewData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string
          const lines = text.split('\n').filter(line => line.trim())
          
          if (lines.length === 0) {
            reject(new Error('Empty CSV file'))
            return
          }
          
          // Parse headers (first line)
          const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''))
          
          // Parse data rows (remaining lines)
          const data = lines.slice(1, Math.min(lines.length, 11)).map((line, index) => {
            return line.split(',').map(v => v.trim().replace(/['"]/g, ''))
          })
          
          resolve({
            headers,
            rows: data,
            totalRows: lines.length - 1,
            sampleRows: data.slice(0, 5)
          })
        } catch (error) {
          reject(error)
        }
      }
      
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }, [])
  
  // Parse Excel file
  const parseExcelFile = useCallback(async (file: File): Promise<ImportPreviewData> => {
    // For now, throw an error as Excel parsing requires additional libraries
    throw new Error('Excel file import not yet implemented. Please use CSV files.')
  }, [])

  // Parse CSV or Excel file to preview data
  const parseFile = useCallback(async (file: File): Promise<ImportPreviewData> => {
    const fileExtension = file.name.toLowerCase().split('.').pop()
    
    if (fileExtension === 'csv') {
      return parseCSVFile(file)
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      return parseExcelFile(file)
    } else {
      throw new Error('Unsupported file format. Please use CSV or Excel files.')
    }
  }, [parseCSVFile, parseExcelFile])



  // Handle file selection
  const handleFileSelect = useCallback(async (file: File | null) => {
    if (!file) {
      setSelectedFile(null)
      setPreviewData(null)
      return
    }

    setSelectedFile(file)
    setLoading(true)

    try {
      const preview = await parseFile(file)
      setPreviewData(preview)
      
      // Initialize field mappings
      const initialMappings: ImportFieldMapping[] = preview.headers.map(header => {
        // Try to auto-match fields by name
        const matchingField = entityFields.find(field => 
          field.name.toLowerCase() === header.toLowerCase() ||
          field.label.toLowerCase() === header.toLowerCase()
        )
        
        return {
          sourceColumn: header,
          targetField: matchingField?.name || '',
          transform: 'none',
          required: typeof matchingField?.required === 'boolean' ? matchingField.required : false,
          defaultValue: matchingField?.defaultValue
        }
      })
      
      setFieldMappings(initialMappings)
    } catch (error) {
      console.error('Error parsing file:', error)
      // Could show error notification here
    } finally {
      setLoading(false)
    }
  }, [parseFile, entityFields])

  // Update field mapping
  const updateFieldMapping = useCallback((index: number, updates: Partial<ImportFieldMapping>) => {
    setFieldMappings(prev => prev.map((mapping, i) => 
      i === index ? { ...mapping, ...updates } : mapping
    ))
  }, [])

  // Validate import data
  const validateImport = useCallback(async () => {
    if (!previewData) return

    setLoading(true)
    try {
      // Transform preview data according to field mappings
      const transformedData = previewData.rows.map((row, rowIndex) => {
        const transformedRow: any = {}
        
        fieldMappings.forEach(mapping => {
          if (!mapping.targetField) return
          
          const columnIndex = previewData.headers.indexOf(mapping.sourceColumn)
          let value = columnIndex >= 0 ? row[columnIndex] : mapping.defaultValue

          // Apply transformations
          if (value && mapping.transform) {
            switch (mapping.transform) {
              case 'trim':
                value = String(value).trim()
                break
              case 'lowercase':
                value = String(value).toLowerCase()
                break
              case 'uppercase':
                value = String(value).toUpperCase()
                break
              case 'date':
                value = new Date(value)
                break
              case 'number':
                value = Number(value)
                break
            }
          }
          
          transformedRow[mapping.targetField] = value
        })
        
        return transformedRow
      })

      // Call validation API
      const result = await mutate('bulkImport', {
        modelId,
        entityName,
        data: transformedData,
        fieldMapping: fieldMappings,
        options: { ...importOptions, validateOnly: true }
      } as BulkImportParams)

      setValidationErrors(result.errors || [])
    } catch (error) {
      console.error('Validation error:', error)
    } finally {
      setLoading(false)
    }
  }, [previewData, fieldMappings, importOptions, modelId, entityName, mutate])

  // Execute import
  const executeImport = useCallback(async () => {
    if (!previewData) return

    setLoading(true)
    try {
      // Transform data the same way as validation
      const transformedData = previewData.rows.map(row => {
        const transformedRow: any = {}
        
        fieldMappings.forEach(mapping => {
          if (!mapping.targetField) return
          
          const columnIndex = previewData.headers.indexOf(mapping.sourceColumn)
          let value = columnIndex >= 0 ? row[columnIndex] : mapping.defaultValue

          // Apply transformations
          if (value && mapping.transform) {
            switch (mapping.transform) {
              case 'trim':
                value = String(value).trim()
                break
              case 'lowercase':
                value = String(value).toLowerCase()
                break
              case 'uppercase':
                value = String(value).toUpperCase()
                break
              case 'date':
                value = new Date(value)
                break
              case 'number':
                value = Number(value)
                break
            }
          }
          
          transformedRow[mapping.targetField] = value
        })
        
        return transformedRow
      })

      const result = await mutate('bulkImport', {
        modelId,
        entityName,
        data: transformedData,
        fieldMapping: fieldMappings,
        options: importOptions
      } as BulkImportParams)

      setImportResult(result)
      
      if (onImportComplete) {
        onImportComplete(result)
      }
    } catch (error) {
      console.error('Import error:', error)
    } finally {
      setLoading(false)
    }
  }, [previewData, fieldMappings, importOptions, modelId, entityName, mutate, onImportComplete])

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 3))
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0))

  const canProceedToMapping = selectedFile && previewData
  const canProceedToValidation = fieldMappings.some(m => m.targetField)
  const hasValidationErrors = validationErrors.length > 0

  const handleClose = useCallback(() => {
    // Reset all state
    setCurrentStep(0)
    setSelectedFile(null)
    setPreviewData(null)
    setFieldMappings([])
    setValidationErrors([])
    setImportResult(null)
    setImportOptions({
      skipDuplicates: true,
      updateExisting: false,
      validateOnly: false
    })
    onClose()
  }, [onClose])

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={`Import ${entityName} Data`}
      size="xl"
      centered
      closeOnClickOutside={false}
    >
      <Stack gap="md">
        <Stepper active={currentStep} onStepClick={setCurrentStep} allowNextStepsSelect={false}>
          <Stepper.Step label="Upload File" icon={<IconUpload size={18} />}>
            <Stack gap="md" mt="md">
              <Text size="sm" c="dimmed">
                Upload a CSV file containing {entityName} data. The first row should contain column headers.
              </Text>
              
              <FileInput
                label="Select CSV or Excel File"
                placeholder="Choose a file..."
                accept=".csv,text/csv,.xlsx,.xls"
                leftSection={<IconFileSpreadsheet size={16} />}
                value={selectedFile}
                onChange={handleFileSelect}
                disabled={loading}
              />
              
              {loading && <Progress size="xs" value={100} />}
              
              {previewData && (
                <Alert icon={<IconCheck size={16} />} color="green" title="File Loaded Successfully">
                  <Group gap="md">
                    <Text size="sm">Rows: {previewData.totalRows}</Text>
                    <Text size="sm">Columns: {previewData.headers.length}</Text>
                  </Group>
                </Alert>
              )}
              
              {previewData && (
                <Stack gap="xs">
                  <Text fw={500}>Data Preview (first 5 rows):</Text>
                  <ScrollArea>
                    <Table>
                      <Table.Thead>
                        <Table.Tr>
                          {previewData.headers.map(header => (
                            <Table.Th key={header}>{header}</Table.Th>
                          ))}
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {previewData.sampleRows.map((row, index) => (
                          <Table.Tr key={index}>
                            {row.map((cell, cellIndex) => (
                              <Table.Td key={cellIndex}>{cell}</Table.Td>
                            ))}
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </ScrollArea>
                </Stack>
              )}
            </Stack>
          </Stepper.Step>

          <Stepper.Step label="Map Fields" icon={<IconSettings size={18} />}>
            <Stack gap="md" mt="md">
              <Text size="sm" c="dimmed">
                Map CSV columns to {entityName} fields. Required fields must be mapped.
              </Text>
              
              <ScrollArea h={400}>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>CSV Column</Table.Th>
                      <Table.Th>Target Field</Table.Th>
                      <Table.Th>Transform</Table.Th>
                      <Table.Th>Required</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {fieldMappings.map((mapping, index) => (
                      <Table.Tr key={index}>
                        <Table.Td>
                          <Text fw={500}>{mapping.sourceColumn}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Select
                            placeholder="Select field..."
                            data={[
                              { value: '', label: '(Skip column)' },
                              ...entityFields.map(field => ({
                                value: field.name,
                                label: `${field.label} (${field.type})`
                              }))
                            ]}
                            value={mapping.targetField}
                            onChange={(value) => updateFieldMapping(index, { targetField: value || '' })}
                          />
                        </Table.Td>
                        <Table.Td>
                          <Select
                            data={[
                              { value: 'none', label: 'None' },
                              { value: 'trim', label: 'Trim whitespace' },
                              { value: 'lowercase', label: 'Lowercase' },
                              { value: 'uppercase', label: 'Uppercase' },
                              { value: 'date', label: 'Parse as date' },
                              { value: 'number', label: 'Parse as number' }
                            ]}
                            value={mapping.transform || 'none'}
                            onChange={(value) => updateFieldMapping(index, { transform: value as any })}
                          />
                        </Table.Td>
                        <Table.Td>
                          <Badge color={mapping.required ? 'red' : 'gray'} size="sm">
                            {mapping.required ? 'Required' : 'Optional'}
                          </Badge>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            </Stack>
          </Stepper.Step>

          <Stepper.Step label="Validate" icon={<IconEye size={18} />}>
            <Stack gap="md" mt="md">
              <Group>
                <Checkbox
                  label="Skip duplicate records"
                  checked={importOptions.skipDuplicates}
                  onChange={(e) => setImportOptions(prev => ({
                    ...prev,
                    skipDuplicates: e.currentTarget.checked
                  }))}
                />
                <Checkbox
                  label="Update existing records"
                  checked={importOptions.updateExisting}
                  onChange={(e) => setImportOptions(prev => ({
                    ...prev,
                    updateExisting: e.currentTarget.checked
                  }))}
                />
              </Group>

              <Button
                onClick={validateImport}
                loading={loading}
                leftSection={<IconEye size={16} />}
              >
                Validate Import Data
              </Button>

              {validationErrors.length > 0 && (
                <Alert icon={<IconAlertCircle size={16} />} color="red" title="Validation Errors Found">
                  <ScrollArea h={200}>
                    <Stack gap="xs">
                      {validationErrors.map((error, index) => (
                        <Text key={index} size="sm">
                          Row {error.row + 1}, {error.column}: {error.error}
                        </Text>
                      ))}
                    </Stack>
                  </ScrollArea>
                </Alert>
              )}

              {validationErrors.length === 0 && previewData && (
                <Alert icon={<IconCheck size={16} />} color="green" title="Validation Passed">
                  Ready to import {previewData.totalRows} records.
                </Alert>
              )}
            </Stack>
          </Stepper.Step>

          <Stepper.Step label="Import" icon={<IconCheck size={18} />}>
            <Stack gap="md" mt="md">
              {!importResult ? (
                <Stack gap="md" align="center">
                  <Text>Ready to import data. This action cannot be undone.</Text>
                  <Button
                    size="lg"
                    onClick={executeImport}
                    loading={loading}
                    disabled={hasValidationErrors}
                  >
                    Import {previewData?.totalRows} Records
                  </Button>
                </Stack>
              ) : (
                <Stack gap="md">
                  <Alert
                    icon={importResult.success ? <IconCheck size={16} /> : <IconX size={16} />}
                    color={importResult.success ? 'green' : 'red'}
                    title="Import Complete"
                  >
                    <Group gap="md">
                      <Text size="sm">Total: {importResult.totalRows}</Text>
                      <Text size="sm" c="green">Success: {importResult.successCount}</Text>
                      <Text size="sm" c="red">Errors: {importResult.errorCount}</Text>
                      <Text size="sm" c="orange">Duplicates: {importResult.duplicateCount}</Text>
                    </Group>
                  </Alert>
                </Stack>
              )}
            </Stack>
          </Stepper.Step>
        </Stepper>

        <Group justify="space-between" mt="xl">
          <Button variant="outline" onClick={handleClose}>
            {importResult ? 'Close' : 'Cancel'}
          </Button>
          
          <Group>
            {currentStep > 0 && !importResult && (
              <Button variant="outline" onClick={prevStep}>
                Back
              </Button>
            )}
            
            {currentStep < 3 && (
              <Button
                onClick={nextStep}
                disabled={
                  (currentStep === 0 && !canProceedToMapping) ||
                  (currentStep === 1 && !canProceedToValidation) ||
                  (currentStep === 2 && hasValidationErrors)
                }
              >
                Next
              </Button>
            )}
          </Group>
        </Group>
      </Stack>
    </Modal>
  )
}