import type { Meta, StoryObj } from '@storybook/react';
import { MantineProvider, Card, Text, Badge, Group, Button, Stack } from '@mantine/core';
import { IconEdit, IconTrash, IconDatabase } from '@tabler/icons-react';

// Create a standalone EntityCard component for Storybook
const EntityCard = ({ 
  name, 
  displayName, 
  description, 
  entityType, 
  fieldsCount,
  onEdit,
  onDelete 
}: {
  name: string;
  displayName: string;
  description?: string;
  entityType: 'Data' | 'Lookup' | 'Audit' | 'Temporary' | 'View';
  fieldsCount: number;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const getEntityTypeColor = (type: string) => {
    switch (type) {
      case 'Data': return 'blue';
      case 'Lookup': return 'green';
      case 'Audit': return 'yellow';
      case 'Temporary': return 'orange';
      case 'View': return 'purple';
      default: return 'gray';
    }
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Card.Section withBorder inheritPadding py="xs">
        <Group justify="space-between">
          <Group>
            <IconDatabase size={16} />
            <Text fw={500}>{displayName}</Text>
          </Group>
          <Badge color={getEntityTypeColor(entityType)} size="sm">
            {entityType}
          </Badge>
        </Group>
      </Card.Section>

      <Stack gap="xs" mt="md">
        <Text size="sm" c="dimmed">
          <strong>Name:</strong> {name}
        </Text>
        {description && (
          <Text size="sm" c="dimmed">
            <strong>Description:</strong> {description}
          </Text>
        )}
        <Text size="sm" c="dimmed">
          <strong>Fields:</strong> {fieldsCount}
        </Text>
      </Stack>

      <Group justify="flex-end" mt="md">
        <Button 
          variant="light" 
          color="blue" 
          size="sm"
          leftSection={<IconEdit size={14} />}
          onClick={onEdit}
        >
          Edit
        </Button>
        <Button 
          variant="light" 
          color="red" 
          size="sm"
          leftSection={<IconTrash size={14} />}
          onClick={onDelete}
        >
          Delete
        </Button>
      </Group>
    </Card>
  );
};

const meta: Meta<typeof EntityCard> = {
  title: 'Components/EntityCard',
  component: EntityCard,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <MantineProvider>
        <div style={{ width: '400px' }}>
          <Story />
        </div>
      </MantineProvider>
    ),
  ],
  argTypes: {
    entityType: {
      control: 'select',
      options: ['Data', 'Lookup', 'Audit', 'Temporary', 'View'],
    },
    fieldsCount: {
      control: 'number',
    },
    onEdit: { action: 'edit clicked' },
    onDelete: { action: 'delete clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const CustomerEntity: Story = {
  args: {
    name: 'customer',
    displayName: 'Customer',
    description: 'Customer information and contact details',
    entityType: 'Data',
    fieldsCount: 8,
  },
};

export const OrderEntity: Story = {
  args: {
    name: 'order',
    displayName: 'Order',
    description: 'Customer orders with items and payment information',
    entityType: 'Data',
    fieldsCount: 12,
  },
};

export const LookupEntity: Story = {
  args: {
    name: 'country',
    displayName: 'Country',
    description: 'Country lookup table',
    entityType: 'Lookup',
    fieldsCount: 3,
  },
};

export const AuditEntity: Story = {
  args: {
    name: 'audit_log',
    displayName: 'Audit Log',
    description: 'System audit trail',
    entityType: 'Audit',
    fieldsCount: 6,
  },
};

export const WithoutDescription: Story = {
  args: {
    name: 'temp_data',
    displayName: 'Temporary Data',
    entityType: 'Temporary',
    fieldsCount: 4,
  },
};