import type { Meta, StoryObj } from '@storybook/react';
import { MantineProvider } from '@mantine/core';
import { TextComponent } from '../components/VisualLayoutEditor/TorqueComponents/Text';
import { DataGridComponent } from '../components/VisualLayoutEditor/TorqueComponents/DataGrid';

// Mock render function to display components in isolation
const MockRender = ({ component: Component, props }: any) => (
  <MantineProvider>
    <div style={{ padding: '20px', backgroundColor: '#f8f9fa', minHeight: '200px' }}>
      <Component.render {...props} />
    </div>
  </MantineProvider>
);

const meta: Meta = {
  title: 'Layout Editor/Torque Components',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Individual Torque Components that can be used within the Visual Layout Editor. These components are configured for use with the Puck editor.'
      }
    }
  },
  decorators: [
    (Story) => (
      <MantineProvider>
        <div style={{ padding: '16px' }}>
          <Story />
        </div>
      </MantineProvider>
    ),
  ]
};

export default meta;

// Text Component Stories
export const TextHeading: StoryObj = {
  render: () => (
    <MockRender
      component={TextComponent}
      props={{
        content: "Welcome to Torque",
        variant: "h1",
        alignment: "center",
        color: "#1f2937",
        weight: "bold"
      }}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Text component configured as a large heading with centered alignment and bold weight.'
      }
    }
  }
};

export const TextParagraph: StoryObj = {
  render: () => (
    <MockRender
      component={TextComponent}
      props={{
        content: "This is a paragraph of body text that demonstrates how the Text component renders regular content with default styling.",
        variant: "body",
        alignment: "left",
        weight: "normal"
      }}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Text component configured as body text with left alignment and normal weight.'
      }
    }
  }
};

export const TextCaption: StoryObj = {
  render: () => (
    <MockRender
      component={TextComponent}
      props={{
        content: "Last updated: January 15, 2024",
        variant: "caption",
        alignment: "right",
        color: "#6b7280",
        weight: "normal"
      }}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Text component configured as a caption with smaller text, right alignment, and gray color.'
      }
    }
  }
};

// DataGrid Component Stories
export const DataGridBasic: StoryObj = {
  render: () => (
    <MockRender
      component={DataGridComponent}
      props={{
        entityType: "project",
        columns: [
          { field: "id", header: "ID", type: "text", sortable: true, filterable: true },
          { field: "name", header: "Name", type: "text", sortable: true, filterable: true },
          { field: "status", header: "Status", type: "status", sortable: true, filterable: true }
        ],
        showPagination: true,
        pageSize: 10,
        showFilters: false,
        showSearch: true,
        height: "300px"
      }}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Basic DataGrid component with project data, search functionality, and pagination.'
      }
    }
  }
};

export const DataGridWithFilters: StoryObj = {
  render: () => (
    <MockRender
      component={DataGridComponent}
      props={{
        entityType: "project",
        columns: [
          { field: "id", header: "ID", type: "text", sortable: true, filterable: true },
          { field: "name", header: "Project Name", type: "text", sortable: true, filterable: true },
          { field: "priority", header: "Priority", type: "text", sortable: true, filterable: true },
          { field: "status", header: "Status", type: "status", sortable: true, filterable: true },
          { field: "due_date", header: "Due Date", type: "date", sortable: true, filterable: true }
        ],
        showPagination: true,
        pageSize: 5,
        showFilters: true,
        showSearch: true,
        height: "400px"
      }}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'DataGrid component with full feature set including column filters, search, sorting, and pagination.'
      }
    }
  }
};

export const DataGridCompact: StoryObj = {
  render: () => (
    <MockRender
      component={DataGridComponent}
      props={{
        entityType: "task",
        columns: [
          { field: "id", header: "ID", type: "text", sortable: false, filterable: false, width: 60 },
          { field: "title", header: "Task", type: "text", sortable: true, filterable: false },
          { field: "completed", header: "Done", type: "boolean", sortable: true, filterable: false, width: 80 }
        ],
        showPagination: false,
        pageSize: 20,
        showFilters: false,
        showSearch: false,
        height: "250px"
      }}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Compact DataGrid configuration with minimal features and fixed column widths.'
      }
    }
  }
};

// Container Component Note
export const ContainerNote: StoryObj = {
  render: () => (
    <div style={{ padding: '20px', backgroundColor: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '8px' }}>
      <h3 style={{ margin: '0 0 10px 0', color: '#92400e' }}>Container Component</h3>
      <p style={{ margin: 0, color: '#92400e' }}>
        The Container component uses Puck's DropZone and needs to be rendered within the Visual Layout Editor context. 
        It can be seen in action in the main Visual Layout Editor stories.
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Container component requires Puck context to function properly - see Visual Layout Editor stories for usage examples.'
      }
    }
  }
};

// Component Configuration Display
export const ComponentConfigurations: StoryObj = {
  render: () => (
    <div style={{ padding: '20px' }}>
      <h2>Torque Component Configurations</h2>
      <p>These are the component configurations available in the Visual Layout Editor:</p>
      
      <div style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
          <h3>Text Component</h3>
          <p><strong>Default Props:</strong></p>
          <pre style={{ fontSize: '12px', backgroundColor: '#f3f4f6', padding: '8px', borderRadius: '4px' }}>
            {JSON.stringify(TextComponent.defaultProps, null, 2)}
          </pre>
        </div>
        
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
          <h3>DataGrid Component</h3>
          <p><strong>Default Props:</strong></p>
          <pre style={{ fontSize: '12px', backgroundColor: '#f3f4f6', padding: '8px', borderRadius: '4px' }}>
            {JSON.stringify(DataGridComponent.defaultProps, null, 2)}
          </pre>
        </div>
        
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
          <h3>Container Component</h3>
          <p><strong>Note:</strong> Container component is available in the Visual Layout Editor but requires Puck context to render properly.</p>
          <p><strong>Default Props:</strong></p>
          <ul style={{ fontSize: '12px', marginTop: '8px' }}>
            <li>padding: "16px"</li>
            <li>borderRadius: "8px"</li>
            <li>minHeight: "100px"</li>
            <li>backgroundColor: "#f8f9fa"</li>
          </ul>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Overview of all Torque Component configurations showing their default properties and available options.'
      }
    }
  }
};