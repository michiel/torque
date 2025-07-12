import type { Meta, StoryObj } from '@storybook/react';
import { MantineProvider } from '@mantine/core';
import { DndContext } from '@dnd-kit/core';
import { ComponentPalette } from '../components/LayoutEditor/ComponentPalette';

const meta: Meta<typeof ComponentPalette> = {
  title: 'Layout Editor/Component Palette',
  component: ComponentPalette,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Component palette showing all available TorqueApp components that can be dragged to the layout canvas.'
      }
    }
  },
  decorators: [
    (Story) => (
      <MantineProvider>
        <DndContext>
          <div style={{ width: '300px', height: '600px' }}>
            <Story />
          </div>
        </DndContext>
      </MantineProvider>
    ),
  ],
  argTypes: {
    searchQuery: {
      control: 'text',
      description: 'Filter components by name or description'
    },
    onComponentSelect: { action: 'component selected' },
    onSearchChange: { action: 'search changed' }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    searchQuery: '',
  }
};

export const WithSearch: Story = {
  args: {
    searchQuery: 'data',
  },
  parameters: {
    docs: {
      description: {
        story: 'Component palette filtered to show only data-related components.'
      }
    }
  }
};

export const FormComponents: Story = {
  args: {
    searchQuery: 'form',
  },
  parameters: {
    docs: {
      description: {
        story: 'Component palette filtered to show form-related components.'
      }
    }
  }
};

export const Interactive: Story = {
  args: {
    searchQuery: '',
  },
  play: async ({ canvasElement }) => {
    // This story demonstrates the interactive nature of the component
    // In a real implementation, you would use @storybook/test for interactions
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive component palette demonstrating drag and drop functionality.'
      }
    }
  }
};