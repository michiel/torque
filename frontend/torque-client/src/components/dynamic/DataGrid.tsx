import { useState } from 'react'
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
  onAction?: (action: any) => void
}

export function DataGrid({
  modelId,
  entityName,
  columns,
  features = [],
  pageSize = 20,
  onAction
}: DataGridProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  
  const { data, loading, error } = useLoadEntityData(
    modelId,
    entityName,
    currentPage,
    pageSize
  )

  const handleCreate = () => {
    if (onAction) {
      onAction({
        type: 'openModal',
        modalType: 'form',
        entityName
      })
    }
  }

  const handleRowAction = (action: string, rowData: any) => {
    if (onAction) {
      onAction({
        type: action,
        entityName,
        entityId: rowData.id,
        data: rowData
      })
    }
  }

  if (error) {
    return (
      <div style={{ padding: '1rem', color: 'red' }}>
        Error loading {entityName} data: {error}
      </div>
    )
  }

  const entityData = data?.data || []
  const pagination = data?.pagination

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
            {columns.map((column) => (
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
              <Table.Td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: '2rem' }}>
                No {entityName} records found
              </Table.Td>
            </Table.Tr>
          ) : (
            entityData.map((row: any, index: number) => (
              <Table.Tr key={row.id || index}>
                {columns.map((column) => (
                  <Table.Td key={column.key}>
                    {formatCellValue(row[column.key], column.dataType)}
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
}

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