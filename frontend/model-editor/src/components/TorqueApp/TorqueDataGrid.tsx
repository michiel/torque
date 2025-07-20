import React, { memo } from 'react'
import { Table, Box, Text, Badge, ActionIcon, Group, Pagination, LoadingOverlay } from '@mantine/core'
import { IconEye, IconEdit, IconTrash } from '@tabler/icons-react'
import { useLoadEntityData } from '../../hooks/useJsonRpc'

interface TorqueDataGridProps {
  id: string
  modelId: string
  properties: {
    entityName?: string
    title?: string
    pagination?: boolean
    pageSize?: number
  }
  onAction?: (action: any) => void
}

export const TorqueDataGrid = memo(function TorqueDataGrid({
  id,
  modelId,
  properties,
  onAction
}: TorqueDataGridProps) {
  const entityName = properties.entityName || 'DefaultEntity'
  const title = properties.title || `${entityName} Data`
  const pageSize = properties.pageSize || 10
  
  const { data, loading, error } = useLoadEntityData(modelId, entityName, 1, pageSize)

  const handleAction = (actionType: string, entityId?: string) => {
    if (onAction) {
      onAction({
        type: actionType,
        componentId: id,
        entityName,
        entityId
      })
    }
  }

  if (loading) {
    return (
      <Box style={{ position: 'relative', minHeight: '200px' }}>
        <LoadingOverlay visible />
      </Box>
    )
  }

  if (error) {
    return (
      <Box>
        <Text size="lg" fw={500} mb="md">{title}</Text>
        <Text color="red" size="sm">Error loading data: {error}</Text>
      </Box>
    )
  }

  if (!data?.data || data.data.length === 0) {
    return (
      <Box>
        <Text size="lg" fw={500} mb="md">{title}</Text>
        <Text color="dimmed" size="sm">No data available</Text>
      </Box>
    )
  }

  // Extract column information from first row
  const firstRow = data.data[0]
  const columns = Object.keys(firstRow).filter(key => !key.startsWith('_internal'))

  return (
    <Box>
      <Group justify="space-between" mb="md">
        <Text size="lg" fw={500}>{title}</Text>
        <Badge variant="light" color="blue">
          {data.data.length} records
        </Badge>
      </Group>

      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            {columns.map((column) => (
              <Table.Th key={column}>
                {column.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Table.Th>
            ))}
            <Table.Th style={{ width: 120 }}>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data.data.map((row: any, index: number) => (
            <Table.Tr key={row.id || index}>
              {columns.map((column) => (
                <Table.Td key={column}>
                  {formatCellValue(row[column])}
                </Table.Td>
              ))}
              <Table.Td>
                <Group gap="xs">
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    onClick={() => handleAction('view', row.id)}
                  >
                    <IconEye size={14} />
                  </ActionIcon>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    onClick={() => handleAction('edit', row.id)}
                  >
                    <IconEdit size={14} />
                  </ActionIcon>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="red"
                    onClick={() => handleAction('delete', row.id)}
                  >
                    <IconTrash size={14} />
                  </ActionIcon>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      {properties.pagination && data.pagination && data.pagination.total > pageSize && (
        <Group justify="center" mt="md">
          <Pagination
            value={data.pagination.page}
            total={Math.ceil(data.pagination.total / pageSize)}
            onChange={(page) => {
              // In a full implementation, this would trigger a data refetch
              console.log('Page changed:', page)
            }}
          />
        </Group>
      )}
    </Box>
  )
})

function formatCellValue(value: any): React.ReactNode {
  if (value === null || value === undefined) {
    return <Text c="dimmed" fs="italic">null</Text>
  }
  
  if (typeof value === 'boolean') {
    return (
      <Badge color={value ? 'green' : 'red'} variant="light" size="sm">
        {value ? 'true' : 'false'}
      </Badge>
    )
  }
  
  if (typeof value === 'object') {
    return (
      <Badge variant="light" color="blue" size="sm">
        Object
      </Badge>
    )
  }
  
  const stringValue = String(value)
  if (stringValue.length > 50) {
    return (
      <Text size="sm" truncate title={stringValue}>
        {stringValue}
      </Text>
    )
  }
  
  return <Text size="sm">{stringValue}</Text>
}