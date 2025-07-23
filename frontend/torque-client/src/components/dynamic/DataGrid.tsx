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
  
  const { data, loading, error } = useLoadEntityData(
    modelId,
    entityName,
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

  if (error) {
    return (
      <div style={{ padding: '1rem', color: 'red' }}>
        Error loading {entityName} data: {error}
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
            {displayColumns.map((column: DataGridColumn) => (
              <Table.Th key={column.key} style={{ width: column.width }}>
                {column.title}
              </Table.Th>
            ))}
            <Table.Th>Actions</Table.Th>
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
            entityData.map((row: any, index: number) => (
              <Table.Tr key={row.id || index}>
                {displayColumns.map((column: DataGridColumn) => (
                  <Table.Td key={column.key}>
                    <CellValue value={row[column.key]} dataType={column.dataType} />
                  </Table.Td>
                ))}
                <Table.Td>
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
            ))
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