import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { ModelExportDialog, ModelImportDialog } from '../components/ModelImportExport';

const meta = {
  title: 'Model Editor/Import Export',
  component: ModelExportDialog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ModelExportDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample model data for stories
const sampleModelData = {
  name: 'Customer Order Management',
  description: 'A comprehensive model for managing customer orders and inventory',
  entities: [
    {
      id: 'customer',
      name: 'Customer',
      displayName: 'Customer',
      description: 'Customer information',
      fields: [
        {
          id: 'id',
          name: 'id',
          type: 'uuid',
          required: true,
          unique: true,
          displayName: 'ID'
        },
        {
          id: 'firstName',
          name: 'firstName',
          type: 'string',
          required: true,
          displayName: 'First Name'
        },
        {
          id: 'lastName',
          name: 'lastName',
          type: 'string',
          required: true,
          displayName: 'Last Name'
        },
        {
          id: 'email',
          name: 'email',
          type: 'email',
          required: true,
          unique: true,
          displayName: 'Email'
        }
      ],
      relationships: [
        {
          id: 'customer-orders',
          name: 'orders',
          type: 'one-to-many',
          targetEntity: 'order'
        }
      ]
    },
    {
      id: 'order',
      name: 'Order',
      displayName: 'Order',
      description: 'Customer order information',
      fields: [
        {
          id: 'id',
          name: 'id',
          type: 'uuid',
          required: true,
          unique: true,
          displayName: 'ID'
        },
        {
          id: 'customerId',
          name: 'customerId',
          type: 'uuid',
          required: true,
          displayName: 'Customer ID'
        },
        {
          id: 'orderDate',
          name: 'orderDate',
          type: 'datetime',
          required: true,
          displayName: 'Order Date'
        },
        {
          id: 'total',
          name: 'total',
          type: 'decimal',
          required: true,
          displayName: 'Total Amount'
        }
      ]
    }
  ],
  layouts: [
    {
      id: 'customer-list',
      name: 'Customer List',
      description: 'Grid view of customers',
      entityId: 'customer',
      components: [
        {
          id: 'customer-grid',
          type: 'DataGrid',
          position: { row: 0, column: 0, rowSpan: 6, colSpan: 12 },
          configuration: {
            dataGrid: {
              entityId: 'customer',
              columns: [
                { fieldId: 'firstName', label: 'First Name', width: 150 },
                { fieldId: 'lastName', label: 'Last Name', width: 150 },
                { fieldId: 'email', label: 'Email', width: 200 }
              ],
              pagination: { enabled: true, pageSize: 25 },
              filtering: { enabled: true },
              sorting: { enabled: true }
            }
          },
          validation: []
        }
      ]
    }
  ],
  customComponents: []
};

export const ExportDialog: Story = {
  args: {
    opened: true,
    onClose: action('close'),
    modelData: sampleModelData
  },
};

export const ExportDialogEmpty: Story = {
  args: {
    opened: true,
    onClose: action('close'),
    modelData: {
      name: 'Empty Model',
      description: 'A model with no entities',
      entities: [],
      layouts: [],
      customComponents: []
    }
  },
};

// Import Dialog Stories
const ImportDialogMeta = {
  title: 'Model Editor/Import Export',
  component: ModelImportDialog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ModelImportDialog>;

type ImportStory = StoryObj<typeof ImportDialogMeta>;

export const ImportDialog: ImportStory = {
  args: {
    opened: true,
    onClose: action('close'),
    onImport: action('import')
  },
  render: (args) => <ModelImportDialog {...args} />
};

// Combined story showing the workflow
export const ImportExportWorkflow = {
  render: () => {
    const [exportOpen, setExportOpen] = React.useState(false);
    const [importOpen, setImportOpen] = React.useState(false);
    
    return (
      <div style={{ padding: '20px' }}>
        <h3>Model Import/Export Workflow</h3>
        <p>This demonstrates the complete import/export functionality:</p>
        
        <div style={{ marginBottom: '20px' }}>
          <button 
            onClick={() => setExportOpen(true)}
            style={{ 
              marginRight: '10px', 
              padding: '10px 20px',
              backgroundColor: '#4dabf7',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Open Export Dialog
          </button>
          
          <button 
            onClick={() => setImportOpen(true)}
            style={{ 
              padding: '10px 20px',
              backgroundColor: '#51cf66',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Open Import Dialog
          </button>
        </div>

        <ModelExportDialog
          opened={exportOpen}
          onClose={() => setExportOpen(false)}
          modelData={sampleModelData}
        />

        <ModelImportDialog
          opened={importOpen}
          onClose={() => setImportOpen(false)}
          onImport={(data) => {
            action('import')(data);
            setImportOpen(false);
          }}
        />

        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '4px',
          marginTop: '20px'
        }}>
          <h4>Features Demonstrated:</h4>
          <ul>
            <li>Export model with configurable options</li>
            <li>JSON validation and preview</li>
            <li>Import from file or paste JSON</li>
            <li>Comprehensive validation with error reporting</li>
            <li>Model summary and statistics</li>
            <li>Warning alerts for destructive operations</li>
          </ul>
        </div>
      </div>
    );
  }
};