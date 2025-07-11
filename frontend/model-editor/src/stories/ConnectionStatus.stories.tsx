import type { Meta, StoryObj } from '@storybook/react';
import { MantineProvider } from '@mantine/core';
import { Badge, Tooltip } from '@mantine/core';
import { IconWifi, IconWifiOff } from '@tabler/icons-react';

// Create a standalone component for Storybook that doesn't rely on context
const StandaloneConnectionStatus = ({ isConnected }: { isConnected: boolean }) => {
  return (
    <Tooltip
      label={isConnected ? 'Connected to real-time updates' : 'Disconnected from real-time updates'}
      position="bottom"
    >
      <Badge
        variant="light"
        color={isConnected ? 'green' : 'red'}
        size="sm"
        leftSection={
          isConnected ? (
            <IconWifi size={12} />
          ) : (
            <IconWifiOff size={12} />
          )
        }
      >
        {isConnected ? 'Live' : 'Offline'}
      </Badge>
    </Tooltip>
  );
};

const meta: Meta<typeof StandaloneConnectionStatus> = {
  title: 'Components/ConnectionStatus',
  component: StandaloneConnectionStatus,
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
    isConnected: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Connected: Story = {
  args: {
    isConnected: true,
  },
};

export const Disconnected: Story = {
  args: {
    isConnected: false,
  },
};