import { ComponentConfig } from '@measured/puck';
import { Box, Table, Text, Badge, Group, Select, NumberInput, Switch, ScrollArea } from '@mantine/core';
import { IconTable, IconFilter, IconSortAscending } from '@tabler/icons-react';

export interface DataGridProps {
  entityType: string;
  columns: Array<{
    field: string;
    header: string;
    type: string;
    sortable: boolean;
    filterable: boolean;
    width?: number;
  }>;
  showPagination: boolean;
  pageSize: number;
  showFilters: boolean;
  showSearch: boolean;
  height?: string;
  maxHeight?: string;
}

export const DataGridComponent: ComponentConfig<DataGridProps> = {
  fields: {
    entityType: {
      type: 'select',
      label: 'Entity Type',
      options: [
        { label: 'Customer', value: 'customer' },
        { label: 'Order', value: 'order' },
        { label: 'Product', value: 'product' },
        { label: 'Invoice', value: 'invoice' }
      ]
    },
    columns: {
      type: 'array',
      label: 'Columns',
      defaultItemProps: {
        field: 'id',
        header: 'ID',
        type: 'text',
        sortable: true,
        filterable: true
      },
      getItemSummary: (item) => item.header || item.field,
      arrayFields: {
        field: {
          type: 'select',
          label: 'Field',
          options: [
            { label: 'ID', value: 'id' },
            { label: 'Name', value: 'name' },
            { label: 'Email', value: 'email' },
            { label: 'Created Date', value: 'created_at' },
            { label: 'Updated Date', value: 'updated_at' },
            { label: 'Status', value: 'status' }
          ]
        },
        header: {
          type: 'text',
          label: 'Column Header',
          placeholder: 'Display name for column'
        },
        type: {
          type: 'select',
          label: 'Data Type',
          options: [
            { label: 'Text', value: 'text' },
            { label: 'Number', value: 'number' },
            { label: 'Date', value: 'date' },
            { label: 'Boolean', value: 'boolean' },
            { label: 'Status', value: 'status' }
          ]
        },
        sortable: {
          type: 'radio',
          label: 'Sortable',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false }
          ]
        },
        filterable: {
          type: 'radio',
          label: 'Filterable',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false }
          ]
        },
        width: {
          type: 'number',
          label: 'Width (px)',
          placeholder: '150'
        }
      }
    },
    showPagination: {
      type: 'radio',
      label: 'Show Pagination',
      options: [
        { label: 'Yes', value: true },
        { label: 'No', value: false }
      ]
    },
    pageSize: {
      type: 'number',
      label: 'Page Size',
      placeholder: '10'
    },
    showFilters: {
      type: 'radio',
      label: 'Show Column Filters',
      options: [
        { label: 'Yes', value: true },
        { label: 'No', value: false }
      ]
    },
    showSearch: {
      type: 'radio',
      label: 'Show Search',
      options: [
        { label: 'Yes', value: true },
        { label: 'No', value: false }
      ]
    },
    height: {
      type: 'text',
      label: 'Fixed Height',
      placeholder: '400px or 50vh'
    },
    maxHeight: {
      type: 'text',
      label: 'Max Height',
      placeholder: '600px or 80vh'
    }
  },
  defaultProps: {
    entityType: 'customer',
    columns: [
      { field: 'id', header: 'ID', type: 'text', sortable: true, filterable: true },
      { field: 'name', header: 'Name', type: 'text', sortable: true, filterable: true },
      { field: 'email', header: 'Email', type: 'text', sortable: true, filterable: true },
      { field: 'status', header: 'Status', type: 'status', sortable: true, filterable: true }
    ],
    showPagination: true,
    pageSize: 10,
    showFilters: true,
    showSearch: true,
    height: '400px'
  },
  render: ({ entityType, columns, showPagination, pageSize, showFilters, showSearch, height, maxHeight }) => {
    // Sample data for preview
    const sampleData = [
      { id: '1', name: 'John Doe', email: 'john@example.com', status: 'active', created_at: '2024-01-15' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com', status: 'active', created_at: '2024-01-16' },
      { id: '3', name: 'Bob Johnson', email: 'bob@example.com', status: 'inactive', created_at: '2024-01-17' }
    ];

    const renderCellValue = (value: any, type: string) => {
      switch (type) {
        case 'status':
          return (
            <Badge color={value === 'active' ? 'green' : 'red'} size="sm">
              {value}
            </Badge>
          );
        case 'date':
          return new Date(value).toLocaleDateString();
        case 'boolean':
          return value ? 'Yes' : 'No';
        default:
          return value?.toString() || '';
      }
    };

    return (
      <Box
        style={{
          height: height || 'auto',
          maxHeight: maxHeight || 'none',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          padding: '16px',
          backgroundColor: '#ffffff'
        }}
      >
        {/* Header */}
        <Group mb="md" justify="space-between">
          <Group>
            <IconTable size={20} />
            <Text size="lg" fw={600}>
              {entityType.charAt(0).toUpperCase() + entityType.slice(1)} Data
            </Text>
            <Badge variant="outline" size="sm">
              {sampleData.length} records
            </Badge>
          </Group>
          
          {showSearch && (
            <Group>
              <Select
                placeholder="Search..."
                data={[]}
                searchable
                size="sm"
                style={{ width: 200 }}
              />
            </Group>
          )}
        </Group>

        {/* Filters */}
        {showFilters && (
          <Group mb="md">
            <IconFilter size={16} />
            <Text size="sm" c="dimmed">Filters:</Text>
            {columns.filter(col => col.filterable).map((col) => (
              <Select
                key={col.field}
                placeholder={`Filter ${col.header}`}
                data={[]}
                size="xs"
                style={{ width: 120 }}
              />
            ))}
          </Group>
        )}

        {/* Table */}
        <ScrollArea style={{ height: 'calc(100% - 80px)' }}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                {columns.map((col) => (
                  <Table.Th 
                    key={col.field}
                    style={{ width: col.width || 'auto' }}
                  >
                    <Group gap="xs">
                      {col.header}
                      {col.sortable && <IconSortAscending size={14} />}
                    </Group>
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {sampleData.map((row) => (
                <Table.Tr key={row.id}>
                  {columns.map((col) => (
                    <Table.Td key={col.field}>
                      {renderCellValue(row[col.field as keyof typeof row], col.type)}
                    </Table.Td>
                  ))}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>

        {/* Pagination */}
        {showPagination && (
          <Group mt="md" justify="space-between">
            <Text size="sm" c="dimmed">
              Showing 1-{Math.min(pageSize, sampleData.length)} of {sampleData.length} records
            </Text>
            <Group>
              <NumberInput
                size="xs"
                value={pageSize}
                min={1}
                max={100}
                style={{ width: 80 }}
                label="Per page"
              />
            </Group>
          </Group>
        )}
      </Box>
    );
  }
};