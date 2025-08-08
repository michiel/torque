import { useState, useMemo, memo, useCallback } from 'react'
import { Table, Pagination, TextInput, Button, Group, LoadingOverlay } from '@mantine/core'
import { IconSearch, IconPlus } from '@tabler/icons-react'
import { useLoadEntityData } from '../../hooks/useJsonRpc'
import type { DataGridColumn } from '../../types/jsonrpc'

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
  
  // Use fallback values to prevent API errors
  const safeModelId = modelId || 'unknown'
  const safeEntityName = entityName || 'unknown'
  
  const { data, loading, error } = useLoadEntityData(
    safeModelId,
    safeEntityName,
    currentPage,
    pageSize,
    apiBaseUrl
  )

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

  const entityData = useMemo(() => data?.data || [], [data?.data])
  const pagination = data?.pagination
  
  // Use columns from API if not provided in props
  const displayColumns = useMemo(() => {
    if (columns && columns.length > 0) {
      return columns
    }
    return data?.columns || []
  }, [columns, data?.columns])

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
        
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={handleCreate}
        >
          Create {entityName}
        </Button>
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