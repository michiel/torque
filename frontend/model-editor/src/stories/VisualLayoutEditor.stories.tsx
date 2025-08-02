import type { Meta, StoryObj } from '@storybook/react';
import { MantineProvider } from '@mantine/core';
import { VisualLayoutEditor } from '../components/VisualLayoutEditor';
import { Data } from '@measured/puck';

// Mock entities for the stories
const mockEntities = [
  {
    id: 'project',
    name: 'project',
    displayName: 'Project',
    fields: [
      {
        id: 'id',
        name: 'id',
        displayName: 'ID',
        fieldType: 'text',
        required: true
      },
      {
        id: 'name',
        name: 'name',
        displayName: 'Name',
        fieldType: 'text',
        required: true
      },
      {
        id: 'description',
        name: 'description',
        displayName: 'Description',
        fieldType: 'text',
        required: false
      },
      {
        id: 'priority',
        name: 'priority',
        displayName: 'Priority',
        fieldType: 'text',
        required: true
      },
      {
        id: 'status',
        name: 'status',
        displayName: 'Status',
        fieldType: 'status',
        required: true
      },
      {
        id: 'start_date',
        name: 'start_date',
        displayName: 'Start Date',
        fieldType: 'date',
        required: false
      },
      {
        id: 'due_date',
        name: 'due_date',
        displayName: 'Due Date',
        fieldType: 'date',
        required: false
      }
    ]
  },
  {
    id: 'task',
    name: 'task',
    displayName: 'Task',
    fields: [
      {
        id: 'id',
        name: 'id',
        displayName: 'ID',
        fieldType: 'text',
        required: true
      },
      {
        id: 'title',
        name: 'title',
        displayName: 'Title',
        fieldType: 'text',
        required: true
      },
      {
        id: 'completed',
        name: 'completed',
        displayName: 'Completed',
        fieldType: 'boolean',
        required: false
      }
    ]
  }
];

// Sample layout data with components
const sampleLayoutData: Data = {
  content: [
    {
      type: "Text",
      props: {
        alignment: "center",
        color: "#1f2937",
        content: "Project Management Dashboard",
        variant: "h1",
        weight: "bold",
        id: "component-0"
      }
    },
    {
      type: "DataGrid",
      props: {
        columns: [
          { field: "id", filterable: true, header: "ID", sortable: true, type: "text" },
          { field: "name", filterable: true, header: "Name", sortable: true, type: "text" },
          { field: "priority", filterable: true, header: "Priority", sortable: true, type: "text" },
          { field: "status", filterable: true, header: "Status", sortable: true, type: "status" },
          { field: "due_date", filterable: true, header: "Due Date", sortable: true, type: "date" }
        ],
        entityType: "project",
        height: "400px",
        pageSize: 10,
        showFilters: true,
        showPagination: true,
        showSearch: true,
        title: "Project Data",
        id: "component-1"
      }
    }
  ],
  root: {
    props: {
      title: "Sample Dashboard Layout"
    }
  }
};

const meta: Meta<typeof VisualLayoutEditor> = {
  title: 'Layout Editor/Visual Layout Editor',
  component: VisualLayoutEditor,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'The Visual Layout Editor component powered by Puck for drag-and-drop interface design with visual components.'
      }
    }
  },
  decorators: [
    (Story) => (
      <MantineProvider>
        <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
          <Story />
        </div>
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
    },
    initialData: {
      control: 'object',
      description: 'Initial Puck data for the layout'
    },
    entities: {
      control: 'object',
      description: 'Available entities for the layout'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const EmptyEditor: Story = {
  args: {
    modelId: 'sample-model-id',
    layoutId: undefined,
    entities: mockEntities,
    initialData: {
      content: [],
      root: {
        props: {
          title: 'New Layout'
        }
      }
    },
    onSave: async (data, isManualSave) => {
      console.log('Save layout:', { data, isManualSave });
      // Simulate async save
      await new Promise(resolve => setTimeout(resolve, 1000));
    },
    onPreview: (data) => {
      console.log('Preview layout:', data);
    },
    onBack: () => {
      console.log('Navigate back');
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'An empty Visual Layout Editor ready for component placement. Shows the Puck interface with component palette and empty canvas.'
      }
    }
  }
};

export const WithSampleLayout: Story = {
  args: {
    modelId: 'sample-model-id',
    layoutId: 'sample-layout-id',
    entities: mockEntities,
    initialData: sampleLayoutData,
    onSave: async (data, isManualSave) => {
      console.log('Save layout:', { data, isManualSave });
      // Simulate async save with delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    },
    onPreview: (data) => {
      console.log('Preview layout:', data);
    },
    onBack: () => {
      console.log('Navigate back');
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Visual Layout Editor with a pre-configured dashboard layout including a heading and data grid. Demonstrates the editing interface with components already placed.'
      }
    }
  }
};

export const NewLayoutCreation: Story = {
  args: {
    modelId: 'new-project-model',
    layoutId: undefined, // No layoutId indicates new layout creation
    entities: mockEntities,
    initialData: undefined, // Will trigger default empty state
    onSave: async (data, isManualSave) => {
      console.log('Creating new layout:', { data, isManualSave });
      // Simulate creating new layout
      await new Promise(resolve => setTimeout(resolve, 1500));
      // In real app, this would return the new layout ID
      console.log('Layout created with ID: new-layout-123');
    },
    onPreview: (data) => {
      console.log('Preview new layout:', data);
    },
    onBack: () => {
      console.log('Cancel new layout creation');
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Creating a new layout from scratch. Shows the editor in "create mode" with empty canvas and demonstrates the layout creation workflow.'
      }
    }
  }
};

export const TaskManagementLayout: Story = {
  args: {
    modelId: 'task-management-model',
    layoutId: 'task-board-layout',
    entities: mockEntities,
    initialData: {
      content: [
        {
          type: "Text",
          props: {
            alignment: "left",
            color: "#374151",
            content: "Task Management Board",
            variant: "h2",
            weight: "bold",
            id: "task-header"
          }
        },
        {
          type: "DataGrid",
          props: {
            columns: [
              { field: "id", filterable: true, header: "Task ID", sortable: true, type: "text" },
              { field: "title", filterable: true, header: "Title", sortable: true, type: "text" },
              { field: "completed", filterable: true, header: "Status", sortable: true, type: "boolean" }
            ],
            entityType: "task",
            height: "350px",
            pageSize: 15,
            showFilters: true,
            showPagination: true,
            showSearch: true,
            title: "Task List",
            id: "task-grid"
          }
        }
      ],
      root: {
        props: {
          title: "Task Management Layout"
        }
      }
    },
    onSave: async (data, isManualSave) => {
      console.log('Save task layout:', { data, isManualSave });
      await new Promise(resolve => setTimeout(resolve, 800));
    },
    onPreview: (data) => {
      console.log('Preview task layout:', data);
    },
    onBack: () => {
      console.log('Back to task model');
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'A task management layout example showing how the Visual Layout Editor can be used to create different types of dashboards with various entity types.'
      }
    }
  }
};

export const WithLimitedEntities: Story = {
  args: {
    modelId: 'simple-model',
    layoutId: 'simple-layout',
    entities: [mockEntities[0]], // Only project entity
    initialData: {
      content: [
        {
          type: "Text",
          props: {
            alignment: "center",
            color: "#059669",
            content: "Simple Project View",
            variant: "h3",
            weight: "normal",
            id: "simple-header"
          }
        }
      ],
      root: {
        props: {
          title: "Simple Layout"
        }
      }
    },
    onSave: async (data, isManualSave) => {
      console.log('Save simple layout:', { data, isManualSave });
      await new Promise(resolve => setTimeout(resolve, 500));
    },
    onPreview: (data) => {
      console.log('Preview simple layout:', data);
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Layout editor with limited entities available. Useful for testing component behavior with constrained options.'
      }
    }
  }
};