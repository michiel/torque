import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { Navigation } from '../components/Navigation';
import { WebSocketProvider } from '../providers/WebSocketProvider';

const WebSocketWrapper = ({ children }: { children: React.ReactNode }) => (
  <WebSocketProvider>
    {children}
  </WebSocketProvider>
);

const meta: Meta<typeof Navigation> = {
  title: 'Components/Navigation',
  component: Navigation,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <MantineProvider>
        <MemoryRouter>
          <WebSocketWrapper>
            <div style={{ height: '100vh', width: '300px' }}>
              <Story />
            </div>
          </WebSocketWrapper>
        </MemoryRouter>
      </MantineProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithActiveModels: Story = {
  decorators: [
    (Story) => (
      <MantineProvider>
        <MemoryRouter initialEntries={['/models']}>
          <WebSocketWrapper>
            <div style={{ height: '100vh', width: '300px' }}>
              <Story />
            </div>
          </WebSocketWrapper>
        </MemoryRouter>
      </MantineProvider>
    ),
  ],
};

export const WithActiveCreateModel: Story = {
  decorators: [
    (Story) => (
      <MantineProvider>
        <MemoryRouter initialEntries={['/models/new']}>
          <WebSocketWrapper>
            <div style={{ height: '100vh', width: '300px' }}>
              <Story />
            </div>
          </WebSocketWrapper>
        </MemoryRouter>
      </MantineProvider>
    ),
  ],
};