import type { Meta, StoryObj } from '@storybook/react';
import { MantineProvider } from '@mantine/core';
import { DndContext } from '@dnd-kit/core';
import { LayoutEditor } from '../components/LayoutEditor';

const mockEntities = [
  {
    id: 'customer',
    name: 'customer',
    displayName: 'Customer',
    fields: [
      {
        id: 'first_name',
        name: 'first_name',
        displayName: 'First Name',
        fieldType: { type: 'String' },
        required: true
      },
      {
        id: 'last_name',
        name: 'last_name',
        displayName: 'Last Name',
        fieldType: { type: 'String' },
        required: true
      },
      {
        id: 'email',
        name: 'email',
        displayName: 'Email',
        fieldType: { type: 'String' },
        required: true
      },
      {
        id: 'phone',
        name: 'phone',
        displayName: 'Phone',
        fieldType: { type: 'String' },
        required: false
      }
    ]
  },
  {
    id: 'order',
    name: 'order',
    displayName: 'Order',
    fields: [
      {
        id: 'order_date',
        name: 'order_date',
        displayName: 'Order Date',
        fieldType: { type: 'DateTime' },
        required: true
      },
      {
        id: 'total_amount',
        name: 'total_amount',
        displayName: 'Total Amount',
        fieldType: { type: 'Float' },
        required: true
      },
      {
        id: 'status',
        name: 'status',
        displayName: 'Status',
        fieldType: { type: 'Enum', values: ['Draft', 'Pending', 'Confirmed', 'Shipped', 'Delivered'] },
        required: true
      }
    ]
  }
];

const meta: Meta<typeof LayoutEditor> = {
  title: 'Layout Editor/Main Editor',
  component: LayoutEditor,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'The main layout editor component that allows drag-and-drop design of TorqueApp interfaces.'
      }
    }
  },
  decorators: [
    (Story) => (
      <MantineProvider>
        <DndContext>
          <div style={{ padding: '16px', minHeight: '100vh' }}>
            <Story />
          </div>
        </DndContext>
      </MantineProvider>
    ),
  ],
  argTypes: {
    modelId: {
      control: 'text',
      description: 'The ID of the model being edited'
    },
    layoutId: {
      control: 'text',
      description: 'The ID of the layout being edited (optional for new layouts)'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const EmptyCanvas: Story = {
  args: {
    modelId: 'customer-order-model',
    layoutId: undefined,
    entities: mockEntities,
    onSave: (components) => {
      console.log('Save layout:', components);
    },
    onPreview: (components) => {
      console.log('Preview layout:', components);
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'An empty layout editor canvas ready for component placement.'
      }
    }
  }
};

export const WithSampleComponents: Story = {
  args: {
    modelId: 'customer-order-model',
    layoutId: 'customer-dashboard',
    entities: mockEntities,
    onSave: (components) => {
      console.log('Save layout:', components);
    },
    onPreview: (components) => {
      console.log('Preview layout:', components);
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Layout editor with pre-configured components showing the editing interface.'
      }
    }
  }
};

export const EntitySelectionFocus: Story = {
  args: {
    modelId: 'customer-order-model',
    layoutId: 'customer-dashboard',
    entities: mockEntities,
    onSave: (components) => {
      console.log('Save layout:', components);
    },
    onPreview: (components) => {
      console.log('Preview layout:', components);
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Layout editor demonstrating entity selection and binding workflow.'
      }
    }
  }
};