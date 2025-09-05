import { useState, useMemo, memo, useCallback } from 'react'
import { 
  Table, 
  Pagination, 
  TextInput, 
  Button, 
  Group, 
  LoadingOverlay,
  Select,
  MultiSelect,
  ActionIcon,
  Menu,
  Checkbox,
  Stack,
  Modal,
  NumberInput,
  Popover,
  Badge,
  Tooltip,
  Alert
} from '@mantine/core'
import { DatePickerInput, DateInput } from '@mantine/dates'
import { 
  IconSearch, 
  IconPlus, 
  IconFilter, 
  IconSortAscending, 
  IconSortDescending,
  IconEdit,
  IconCheck,
  IconX,
  IconDownload,
  IconTrash,
  IconDots,
  IconFileImport
} from '@tabler/icons-react'
import { useLoadEntityData, useJsonRpcMutation, useFormDefinition } from '../../hooks/useJsonRpc'
import type { DataGridColumn, DataGridFilter, DataGridSort } from '../../types/jsonrpc'
import { ImportWizard } from './ImportWizard'

interface DataGridProps {
  id: string
  modelId: string
  entityName: string
  columns: DataGridColumn[]
  features: string[]
  pageSize: number
  apiBaseUrl?: string
  onAction?: (action: any) => void
}

export const DataGrid = memo(function DataGrid({
  modelId,
  entityName,
  columns,
  features = [],
  pageSize = 20,
  apiBaseUrl,
  onAction
}: DataGridProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<DataGridFilter[]>([])
  const [sort, setSort] = useState<DataGridSort | null>(null)
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [editingCell, setEditingCell] = useState<{ rowId: string; field: string } | null>(null)
  const [editValue, setEditValue] = useState<any>(null)
  const [bulkDeleteModalOpened, setBulkDeleteModalOpened] = useState(false)
  const [filterModalOpened, setFilterModalOpened] = useState(false)
  const [importWizardOpened, setImportWizardOpened] = useState(false)
  
  const { mutate } = useJsonRpcMutation()
  const { data: formDef } = useFormDefinition(modelId, entityName)
  
  // Use fallback values to prevent API errors
  const safeModelId = modelId || 'unknown'
  const safeEntityName = entityName || 'unknown'
  
  // Convert filters to API format
  const filtersObject = useMemo(() => {
    const result: Record<string, any> = {}
    filters.forEach(filter => {
      result[filter.field] = {
        operator: filter.operator,
        value: filter.value,
        value2: filter.value2
      }
    })
    return result
  }, [filters])
  
  const { data, loading, error, refetch } = useLoadEntityData(
    safeModelId,
    safeEntityName,
    currentPage,
    pageSize,
    apiBaseUrl
  )

  const entityData = useMemo(() => data?.data || [], [data?.data])
  const pagination = data?.pagination
  
  // Use columns from API if not provided in props
  const displayColumns = useMemo(() => {
    if (columns && columns.length > 0) {
      return columns
    }
    return data?.columns || []
  }, [columns, data?.columns])

  const handleCreate = useCallback(() => {
    if (onAction) {
      onAction({
        type: 'openModal',
        modalType: 'form',
        entityName
      })
    }
  }, [onAction, entityName])

  const handleRowAction = useCallback((action: string, rowData: any) => {
    if (onAction) {
      onAction({
        type: action,
        entityName,
        entityId: rowData.id,
        data: rowData
      })
    }
  }, [onAction, entityName])

  // Advanced filtering
  const handleAddFilter = useCallback((filter: DataGridFilter) => {
    setFilters(prev => [...prev.filter(f => f.field !== filter.field), filter])
    setCurrentPage(1)
  }, [])

  const handleRemoveFilter = useCallback((field: string) => {
    setFilters(prev => prev.filter(f => f.field !== field))
  }, [])

  const handleClearFilters = useCallback(() => {
    setFilters([])
    setCurrentPage(1)
  }, [])

  // Sorting
  const handleSort = useCallback((field: string) => {
    setSort(prev => {
      if (prev?.field === field) {
        return prev.direction === 'asc' 
          ? { field, direction: 'desc' }
          : null
      }
      return { field, direction: 'asc' }
    })
    setCurrentPage(1)
  }, [])

  // Row selection
  const handleRowSelection = useCallback((rowId: string, selected: boolean) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev)
      if (selected) {
        newSet.add(rowId)
      } else {
        newSet.delete(rowId)
      }
      return newSet
    })
  }, [])

  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      setSelectedRows(new Set(entityData.map((row: any) => row.id)))
    } else {
      setSelectedRows(new Set())
    }
  }, [entityData])

  // Inline editing
  const handleStartEdit = useCallback((rowId: string, field: string, currentValue: any) => {
    setEditingCell({ rowId, field })
    setEditValue(currentValue)
  }, [])

  const handleSaveEdit = useCallback(async () => {
    if (!editingCell) return
    
    try {
      await mutate('updateEntity', {
        entityId: editingCell.rowId,
        data: { [editingCell.field]: editValue }
      })
      setEditingCell(null)
      refetch()
    } catch (error) {
      console.error('Error saving edit:', error)
    }
  }, [editingCell, editValue, mutate, refetch])

  const handleCancelEdit = useCallback(() => {
    setEditingCell(null)
    setEditValue(null)
  }, [])

  // Bulk operations
  const handleBulkDelete = useCallback(async () => {
    const selectedIds = Array.from(selectedRows)
    try {
      await Promise.all(
        selectedIds.map(id => mutate('deleteEntity', { entityId: id }))
      )
      setSelectedRows(new Set())
      setBulkDeleteModalOpened(false)
      refetch()
    } catch (error) {
      console.error('Error deleting entities:', error)
    }
  }, [selectedRows, mutate, refetch])

  // Data export
  const handleExport = useCallback((format: 'csv' | 'excel') => {
    const headers = displayColumns.map(col => col.title).join(',')
    const rows = entityData.map((row: any) => 
      displayColumns.map(col => row[col.key] || '').join(',')
    )
    const csvContent = [headers, ...rows].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${entityName}_export.${format === 'excel' ? 'xlsx' : 'csv'}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [displayColumns, entityData, entityName])

  // Handle missing props or entity errors gracefully
  const hasValidProps = modelId && entityName
  
  if (!hasValidProps) {
    return (
      <div style={{ padding: '1rem', color: 'orange', backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '4px' }}>
        <strong>Configuration Error:</strong> DataGrid requires modelId and entityName properties
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '1rem', color: 'red', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '4px' }}>
        <strong>Error loading {entityName} data:</strong><br />
        {error}
        {error.includes('not found') && (
          <div style={{ marginTop: '0.5rem', fontSize: '0.9em', color: '#6c757d' }}>
            This entity may not exist in the current model. Check your layout configuration.
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      <LoadingOverlay visible={loading} />
      
      {/* Header with search and create button */}
      <Group justify="space-between" mb="md">
        {features.includes('filtering') && (
          <TextInput
            placeholder={`Search ${entityName}...`}
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            style={{ flexGrow: 1, maxWidth: '300px' }}
          />
        )}
        
        <Group gap="xs">
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={handleCreate}
          >
            Create {entityName}
          </Button>
          
          <Button
            variant="light"
            leftSection={<IconFileImport size={16} />}
            onClick={() => setImportWizardOpened(true)}
          >
            Import
          </Button>
        </Group>
      </Group>

      {/* Data table */}
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            {displayColumns.map((column: DataGridColumn, index: number) => (
              <Table.Th key={column.key || `col-${index}`} style={{ width: column.width }}>
                {column.title}
              </Table.Th>
            ))}
            <Table.Th key="actions-header">Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {entityData.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={displayColumns.length + 1} style={{ textAlign: 'center', padding: '2rem' }}>
                No {entityName} records found
              </Table.Td>
            </Table.Tr>
          ) : (
            entityData.map((row: any, index: number) => {
              const rowKey = row.id ?? `row-${index}`
              return (
              <Table.Tr key={rowKey}>
                {displayColumns.map((column: DataGridColumn, colIndex: number) => (
                  <Table.Td key={`${rowKey}-${column.key || colIndex}`}>
                    <CellValue value={row[column.key]} dataType={column.dataType} />
                  </Table.Td>
                ))}
                <Table.Td key={`${rowKey}-actions`}>
                  <Group gap="xs">
                    <Button
                      size="xs"
                      variant="light"
                      onClick={() => handleRowAction('edit', row)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="xs"
                      variant="light"
                      color="red"
                      onClick={() => handleRowAction('delete', row)}
                    >
                      Delete
                    </Button>
                  </Group>
                </Table.Td>
              </Table.Tr>
              )
            })
          )}
        </Table.Tbody>
      </Table>

      {/* Pagination */}
      {features.includes('pagination') && pagination && pagination.total > pageSize && (
        <Group justify="center" mt="md">
          <Pagination
            value={currentPage}
            onChange={setCurrentPage}
            total={Math.ceil(pagination.total / pageSize)}
          />
        </Group>
      )}

      {/* Import Wizard */}
      {formDef && (
        <ImportWizard
          opened={importWizardOpened}
          onClose={() => setImportWizardOpened(false)}
          modelId={modelId}
          entityName={entityName}
          entityFields={formDef.form.fields}
          onImportComplete={(result) => {
            setImportWizardOpened(false)
            refetch() // Refresh the data grid
          }}
        />
      )}
    </div>
  )
})

// Memoized cell component to prevent re-renders
const CellValue = memo(({ value, dataType }: { value: any; dataType: string }) => {
  return <>{formatCellValue(value, dataType)}</>
})

function formatCellValue(value: any, dataType: string): React.ReactNode {
  if (value === null || value === undefined) {
    return '-'
  }

  switch (dataType) {
    case 'boolean':
      return value ? 'Yes' : 'No'
    
    case 'date':
      return new Date(value).toLocaleDateString()
    
    case 'number':
      return typeof value === 'number' ? value.toLocaleString() : value
    
    case 'json':
      return <code>{JSON.stringify(value)}</code>
    
    case 'array':
      return Array.isArray(value) ? value.join(', ') : value
    
    default:
      return String(value)
  }
}