import type { Meta, StoryObj } from '@storybook/react';
import { MantineProvider, Button } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <MantineProvider>
        <Story />
      </MantineProvider>
    ),
  ],
  argTypes: {
    variant: {
      control: 'select',
      options: ['filled', 'outline', 'light', 'subtle', 'default'],
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    color: {
      control: 'select',
      options: ['blue', 'green', 'red', 'yellow', 'orange', 'purple', 'gray'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    children: 'Primary Button',
    variant: 'filled',
    color: 'blue',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Secondary Button',
    variant: 'outline',
    color: 'blue',
  },
};

export const WithIcon: Story = {
  args: {
    children: 'Add Model',
    variant: 'filled',
    color: 'blue',
    leftSection: <IconPlus size={16} />,
  },
};

export const Large: Story = {
  args: {
    children: 'Large Button',
    size: 'lg',
    variant: 'filled',
    color: 'blue',
  },
};

export const Small: Story = {
  args: {
    children: 'Small Button',
    size: 'sm',
    variant: 'filled',
    color: 'blue',
  },
};