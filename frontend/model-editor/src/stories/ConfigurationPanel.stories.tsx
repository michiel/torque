import type { Meta, StoryObj } from '@storybook/react';
import { MantineProvider } from '@mantine/core';
import { ConfigurationPanel } from '../components/LayoutEditor/ConfigurationPanel';
import { LayoutEditorComponent, ValidationResult } from '../components/LayoutEditor/types';

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
      }
    ]
  }
];

const mockDataGridComponent: LayoutEditorComponent = {
  id: 'datagrid-1',
  type: 'DataGrid',
  position: {
    row: 0,
    column: 0,
    rowSpan: 4,
    colSpan: 6
  },
  configuration: {
    dataGrid: {
      entityId: 'customer',
      columns: [
        {
          id: 'col-1',
          fieldId: 'first_name',
          label: 'First Name',
          type: 'string',
          sortable: true,
          filterable: true,
          width: '150px',
          alignment: 'left'
        },
        {
          id: 'col-2',
          fieldId: 'last_name',
          label: 'Last Name',
          type: 'string',
          sortable: true,
          filterable: true,
          width: '150px',
          alignment: 'left'
        }
      ],
      pagination: { enabled: true, pageSize: 25 },
      filtering: { enabled: true },
      sorting: { enabled: true },
      actions: []
    }
  },
  validation: []
};

const mockFormComponent: LayoutEditorComponent = {
  id: 'form-1',
  type: 'TorqueForm',
  position: {
    row: 0,
    column: 6,
    rowSpan: 6,
    colSpan: 4
  },
  configuration: {
    form: {
      entityId: 'customer',
      fields: [],
      validation: { clientSide: true, serverSide: true, realTime: true },
      layout: 'single-column',
      submission: { action: 'create' }
    }
  },
  validation: [
    {
      field: 'fields',
      message: 'At least one field is required for the form',
      severity: 'error'
    }
  ]
};

const meta: Meta<typeof ConfigurationPanel> = {
  title: 'Layout Editor/Configuration Panel',
  component: ConfigurationPanel,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Configuration panel for editing component properties and validation.'
      }
    }
  },
  decorators: [
    (Story) => (
      <MantineProvider>
        <div style={{ width: '400px', height: '600px' }}>
          <Story />
        </div>
      </MantineProvider>
    ),
  ],
  argTypes: {
    onUpdate: { action: 'configuration updated' },
    onValidate: { action: 'validation requested' }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const NoSelection: Story = {
  args: {
    component: null,
    entities: mockEntities
  },
  parameters: {
    docs: {
      description: {
        story: 'Configuration panel when no component is selected.'
      }
    }
  }
};

export const DataGridConfiguration: Story = {
  args: {
    component: mockDataGridComponent,
    entities: mockEntities,
    onValidate: async (component) => {
      // Mock validation that always succeeds for configured DataGrid
      return [];
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Configuration panel for a DataGrid component with entity binding.'
      }
    }
  }
};

export const DataGridAdvancedConfiguration: Story = {
  args: {
    component: {
      ...mockDataGridComponent,
      configuration: {
        dataGrid: {
          entityId: 'customer',
          columns: [
            {
              id: 'col-1',
              fieldId: 'first_name',
              label: 'First Name',
              type: 'string',
              sortable: true,
              filterable: true,
              width: '150px',
              alignment: 'left'
            },
            {
              id: 'col-2',
              fieldId: 'last_name',
              label: 'Last Name',
              type: 'string',
              sortable: true,
              filterable: true,
              width: '150px',
              alignment: 'left'
            },
            {
              id: 'col-3',
              fieldId: 'email',
              label: 'Email Address',
              type: 'string',
              sortable: true,
              filterable: true,
              width: '200px',
              alignment: 'left'
            }
          ],
          pagination: { enabled: true, pageSize: 50 },
          filtering: { enabled: true },
          sorting: { enabled: true },
          selection: { enabled: true },
          highlighting: { enabled: true },
          density: 'compact',
          actions: []
        }
      }
    },
    entities: mockEntities,
    onValidate: async () => []
  },
  parameters: {
    docs: {
      description: {
        story: 'Configuration panel for a DataGrid component with advanced settings and multiple columns.'
      }
    }
  }
};

export const DataGridNoEntity: Story = {
  args: {
    component: {
      ...mockDataGridComponent,
      configuration: {
        dataGrid: {
          entityId: '',
          columns: [],
          pagination: { enabled: true, pageSize: 25 },
          filtering: { enabled: true },
          sorting: { enabled: true },
          actions: []
        }
      }
    },
    entities: mockEntities,
    onValidate: async (component) => {
      return [
        {
          field: 'entity',
          message: 'Entity selection is required for DataGrid',
          severity: 'error'
        }
      ];
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Configuration panel for a DataGrid component without entity selection, showing validation errors.'
      }
    }
  }
};

export const FormConfiguration: Story = {
  args: {
    component: {
      ...mockFormComponent,
      configuration: {
        form: {
          entityId: 'customer',
          fields: [
            {
              id: 'field-1',
              fieldId: 'first_name',
              label: 'First Name',
              inputType: 'text',
              required: true,
              placeholder: 'Enter first name',
              helpText: '',
              validation: { required: true, minLength: 2, maxLength: 50 },
              layoutProps: { span: 6, order: 1 }
            },
            {
              id: 'field-2',
              fieldId: 'last_name',
              label: 'Last Name',
              inputType: 'text',
              required: true,
              placeholder: 'Enter last name',
              helpText: '',
              validation: { required: true, minLength: 2, maxLength: 50 },
              layoutProps: { span: 6, order: 2 }
            },
            {
              id: 'field-3',
              fieldId: 'email',
              label: 'Email Address',
              inputType: 'email',
              required: true,
              placeholder: 'Enter email address',
              helpText: 'We will never share your email',
              validation: { required: true },
              layoutProps: { span: 12, order: 3 }
            }
          ],
          validation: { clientSide: true, serverSide: true, realTime: true },
          layout: 'two-column',
          submission: { action: 'create' }
        }
      }
    },
    entities: mockEntities,
    onValidate: async () => []
  },
  parameters: {
    docs: {
      description: {
        story: 'Configuration panel for a Form component with configured fields and validation.'
      }
    }
  }
};

export const ButtonConfiguration: Story = {
  args: {
    component: {
      id: 'button-1',
      type: 'TorqueButton',
      position: { row: 0, column: 0, rowSpan: 1, colSpan: 2 },
      configuration: {
        button: {
          label: 'Save Customer',
          variant: 'filled',
          color: 'blue',
          size: 'md',
          action: { type: 'submitForm' }
        }
      },
      validation: []
    },
    entities: mockEntities,
    onValidate: async () => []
  },
  parameters: {
    docs: {
      description: {
        story: 'Configuration panel for a Button component.'
      }
    }
  }
};