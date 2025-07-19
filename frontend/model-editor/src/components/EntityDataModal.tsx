import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  Table,
  ScrollArea,
  Group,
  Text,
  Button,
  TextInput,
  Pagination,
  LoadingOverlay,
  Alert,
  Badge,
  ActionIcon,
  Tooltip,
  Box,
  Stack,
  Card,
  Center,
  ThemeIcon,
  Code,
  Popover
} from '@mantine/core';
import {
  IconSearch,
  IconRefresh,
  IconExternalLink,
  IconDatabase,
  IconAlertCircle
} from '@tabler/icons-react';
import { appDatabaseService, EntityDataResponse } from '../services/appDatabaseService';
import { notifications } from '@mantine/notifications';

interface EntityDataModalProps {
  opened: boolean;
  onClose: () => void;
  modelId: string;
  entityType: string;
  displayName: string;
  recordCount: number;
}

interface ColumnDefinition {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array' | 'null';
}

// Helper functions moved to the top
const formatColumnLabel = (key: string): string => {
  if (key.startsWith('_')) {
    // Format metadata fields
    return key.slice(1).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  
  // Format regular fields
  return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const determineColumnType = (value: any): ColumnDefinition['type'] => {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  
  // Check if string is a date
  if (typeof value === 'string') {
    const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    if (dateRegex.test(value)) return 'date';
  }
  
  return 'string';
};

const EntityDataModal: React.FC<EntityDataModalProps> = ({
  opened,
  onClose,
  modelId,
  entityType,
  displayName,
  recordCount
}) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(recordCount);
  const pageSize = 50;

  // Generate column definitions from data
  const columns = useMemo(() => {
    if (data.length === 0) return [];

    const columnMap = new Map<string, ColumnDefinition>();
    
    // Analyze all rows to determine column structure
    data.forEach(row => {
      Object.entries(row).forEach(([key, value]) => {
        if (!columnMap.has(key)) {
          columnMap.set(key, {
            key,
            label: formatColumnLabel(key),
            type: determineColumnType(value)
          });
        }
      });
    });

    // Sort columns: metadata fields first, then alphabetically
    const sortedColumns = Array.from(columnMap.values()).sort((a, b) => {
      const aIsMetadata = a.key.startsWith('_');
      const bIsMetadata = b.key.startsWith('_');
      
      if (aIsMetadata && !bIsMetadata) return -1;
      if (!aIsMetadata && bIsMetadata) return 1;
      
      return a.label.localeCompare(b.label);
    });

    return sortedColumns;
  }, [data]);

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter(row =>
      Object.values(row).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  const loadData = async (pageNum: number = 1) => {
    if (!opened || !modelId || !entityType) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response: EntityDataResponse = await appDatabaseService.getEntityData(
        modelId,
        entityType,
        pageNum,
        pageSize
      );
      
      setData(response.entities);
      setTotalRecords(response.total_count);
      setPage(response.page);
      
      if (response.entities.length === 0) {
        setError('No data found for this entity type.');
      }
    } catch (err) {
      console.error('Failed to load entity data:', err);
      setError('Failed to load entity data. Please try again.');
      notifications.show({
        title: 'Error',
        message: 'Failed to load entity data',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  // Load data when modal opens or page changes
  useEffect(() => {
    if (opened) {
      loadData(page);
    }
  }, [opened, page, modelId, entityType]);

  // Reset page when search term changes
  useEffect(() => {
    if (searchTerm && page !== 1) {
      setPage(1);
    }
  }, [searchTerm]);

  const handleRefresh = () => {
    loadData(page);
  };

  const formatCellValue = (value: any, type: ColumnDefinition['type']): React.ReactNode => {
    if (value === null || value === undefined) {
      return <Text c="dimmed" fs="italic">null</Text>;
    }

    switch (type) {
      case 'boolean':
        return (
          <Badge color={value ? 'green' : 'red'} variant="light" size="sm">
            {value ? 'true' : 'false'}
          </Badge>
        );
      
      case 'date':
        try {
          const date = new Date(value);
          return (
            <Tooltip label={date.toISOString()}>
              <Text size="sm">{date.toLocaleDateString()} {date.toLocaleTimeString()}</Text>
            </Tooltip>
          );
        } catch {
          return <Text size="sm">{String(value)}</Text>;
        }
      
      case 'object':
        return (
          <Popover width={400} position="bottom" withArrow shadow="md">
            <Popover.Target>
              <Badge variant="light" color="blue" style={{ cursor: 'pointer' }}>
                {Object.keys(value).length} fields
              </Badge>
            </Popover.Target>
            <Popover.Dropdown>
              <Stack gap="xs">
                <Text size="sm" fw={500}>Object Data</Text>
                <Code block style={{ maxHeight: 200, overflow: 'auto' }}>
                  {JSON.stringify(value, null, 2)}
                </Code>
              </Stack>
            </Popover.Dropdown>
          </Popover>
        );
      
      case 'array':
        return (
          <Popover width={400} position="bottom" withArrow shadow="md">
            <Popover.Target>
              <Badge variant="light" color="purple" style={{ cursor: 'pointer' }}>
                [{value.length}]
              </Badge>
            </Popover.Target>
            <Popover.Dropdown>
              <Stack gap="xs">
                <Text size="sm" fw={500}>Array Data ({value.length} items)</Text>
                <Code block style={{ maxHeight: 200, overflow: 'auto' }}>
                  {JSON.stringify(value, null, 2)}
                </Code>
              </Stack>
            </Popover.Dropdown>
          </Popover>
        );
      
      case 'number':
        return <Text size="sm">{typeof value === 'number' ? value.toLocaleString() : value}</Text>;
      
      default:
        const stringValue = String(value);
        const maxLength = 100;
        
        if (stringValue.length > maxLength) {
          return (
            <Tooltip label={stringValue}>
              <Text size="sm" style={{ cursor: 'help' }}>
                {stringValue.slice(0, maxLength)}...
              </Text>
            </Tooltip>
          );
        }
        
        return <Text size="sm">{stringValue}</Text>;
    }
  };

  const totalPages = Math.ceil(totalRecords / pageSize);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group>
          <ThemeIcon variant="light" color="blue">
            <IconDatabase size={18} />
          </ThemeIcon>
          <div>
            <Text size="lg" fw={500}>{displayName} Data</Text>
            <Text size="sm" c="dimmed">
              {totalRecords} record{totalRecords !== 1 ? 's' : ''} • {entityType}
            </Text>
          </div>
        </Group>
      }
      size="95%"
      styles={{
        body: { height: 'calc(90vh - 60px)', display: 'flex', flexDirection: 'column' }
      }}
      style={{ height: '90vh' }}
    >
      <Stack h="100%">
        {/* Controls */}
        <Group justify="space-between">
          <TextInput
            placeholder="Search in data..."
            leftSection={<IconSearch size={16} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.currentTarget.value)}
            style={{ flex: 1, maxWidth: 300 }}
          />
          
          <Group>
            <Tooltip label="Refresh data">
              <ActionIcon variant="light" onClick={handleRefresh} loading={loading}>
                <IconRefresh size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>

        {/* Data Table */}
        <Card withBorder style={{ flex: 1, position: 'relative' }}>
          <LoadingOverlay visible={loading} />
          
          {error ? (
            <Alert icon={<IconAlertCircle size={16} />} color="red">
              {error}
            </Alert>
          ) : data.length === 0 && !loading ? (
            <Center h={200}>
              <Stack align="center" gap="sm">
                <ThemeIcon size="xl" variant="light" color="gray">
                  <IconDatabase size={24} />
                </ThemeIcon>
                <Text c="dimmed">No data available</Text>
                <Button variant="light" onClick={handleRefresh}>
                  Refresh
                </Button>
              </Stack>
            </Center>
          ) : (
            <ScrollArea style={{ height: '100%' }}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    {columns.map((column) => (
                      <Table.Th key={column.key} style={{ minWidth: 120 }}>
                        <Group gap="xs">
                          <Text size="sm" fw={500}>{column.label}</Text>
                          <Badge size="xs" variant="light" color="gray">
                            {column.type}
                          </Badge>
                        </Group>
                      </Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredData.map((row, index) => (
                    <Table.Tr key={row._id || index}>
                      {columns.map((column) => (
                        <Table.Td key={column.key} style={{ maxWidth: 300 }}>
                          {formatCellValue(row[column.key], column.type)}
                        </Table.Td>
                      ))}
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          )}
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <Group justify="center">
            <Pagination
              value={page}
              onChange={setPage}
              total={totalPages}
              siblings={1}
              boundaries={1}
            />
            <Text size="sm" c="dimmed">
              Showing {Math.min((page - 1) * pageSize + 1, totalRecords)}-{Math.min(page * pageSize, totalRecords)} of {totalRecords}
            </Text>
          </Group>
        )}
      </Stack>
    </Modal>
  );
};

export default EntityDataModal;