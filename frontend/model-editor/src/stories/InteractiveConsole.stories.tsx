import type { Meta, StoryObj } from '@storybook/react';
import React, { useState, useEffect } from 'react';
import { Button, Box } from '@mantine/core';
import { InteractiveConsole, ConsoleProvider } from '../components/Console';

const meta = {
  title: 'Components/InteractiveConsole',
  component: InteractiveConsole,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Interactive console component with terminal emulation, command parsing, and project context.'
      }
    }
  },
  argTypes: {
    visible: {
      control: 'boolean',
      description: 'Whether the console is visible'
    },
    theme: {
      control: 'select',
      options: ['dark', 'light'],
      description: 'Console theme'
    },
    height: {
      control: 'text',
      description: 'Console height (CSS value)'
    },
    animationSpeed: {
      control: 'number',
      description: 'Animation speed in milliseconds'
    }
  }
} satisfies Meta<typeof InteractiveConsole>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock server for Storybook
const mockServer = async (request: any) => {
  const { method, params } = request;
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  switch (method) {
    case 'createConsoleSession':
      return {
        sessionId: 'mock-session-123',
        capabilities: ['project', 'server', 'help'],
        context: {
          projectId: null,
          projectName: null
        }
      };
      
    case 'executeConsoleCommand':
      const command = params.command?.trim();
      
      if (command === 'help') {
        return {
          success: true,
          output: `Torque Interactive Console

Available commands:

Global Commands (available without project context):
  project list                    - List all projects
  project new <name> [desc]       - Create new project
  project use <id>                - Select project context
  project info <id>               - Show project details
  server status                   - Show server status
  help [command]                  - Show help
  clear                           - Clear console
  history                         - Show command history
  exit                            - Close console

Use Ctrl+~ to toggle console visibility
Use Tab for auto-completion`
        };
      } else if (command === 'project list') {
        return {
          success: true,
          output: `Found 2 projects:

  abc123 - Todo App (Simple task management application)
    Entities: 3, Layouts: 2

  def456 - Blog System (Content management system)  
    Entities: 5, Layouts: 4`
        };
      } else if (command === 'server status') {
        return {
          success: true,
          output: 'Server is running'
        };
      } else if (command === 'clear') {
        return {
          success: true,
          output: '',
          action: 'clear'
        };
      } else if (command === 'history') {
        return {
          success: true,
          output: `Command History:

  3: server status
  2: project list
  1: help`
        };
      } else if (command.startsWith('project use ')) {
        const projectId = command.split(' ')[2];
        if (projectId === 'abc123') {
          return {
            success: true,
            output: 'Project context set to: Todo App (abc123)',
            data: {
              projectId: 'abc123',
              projectName: 'Todo App'
            }
          };
        } else {
          return {
            success: false,
            output: 'Project not found'
          };
        }
      } else if (command === 'entity list') {
        return {
          success: true,
          output: `Found 15 entities:

  ID: todo-1, Type: todo, Title: "Complete project documentation"
  ID: todo-2, Type: todo, Title: "Review pull requests"  
  ID: todo-3, Type: todo, Title: "Update dependencies"

Total: 15 entities`
        };
      } else if (command === 'unknown') {
        return {
          success: false,
          output: 'Unknown command: unknown'
        };
      } else {
        return {
          success: false,
          output: `Command parsing error: Unknown command: ${command}`
        };
      }
      
    default:
      return {
        success: false,
        output: `Method '${method}' not found`
      };
  }
};

// Create a mock fetch function
const createMockFetch = () => {
  return async (url: string, options: any) => {
    if (!options?.body) {
      throw new Error('No request body');
    }
    
    const request = JSON.parse(options.body);
    const result = await mockServer(request);
    
    const response = {
      jsonrpc: '2.0',
      id: request.id,
      result: result
    };
    
    return {
      ok: true,
      json: async () => response
    };
  };
};

// Story wrapper that provides mock server
const StoryWrapper = ({ children, ...props }: any) => {
  // Override fetch for this story
  const originalFetch = window.fetch;
  window.fetch = createMockFetch() as any;
  
  // Restore original fetch when component unmounts
  useEffect(() => {
    return () => {
      window.fetch = originalFetch;
    };
  }, []);
  
  return children;
};

const ConsoleDemo = (args: any) => {
  const [visible, setVisible] = useState(args.visible ?? false);
  
  return (
    <StoryWrapper>
      <Box style={{ padding: '20px', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        <h1>Interactive Console Demo</h1>
        <p>Press Ctrl+~ or use the button below to toggle the console.</p>
        <p>Try these commands:</p>
        <ul>
          <li><code>help</code> - Show help information</li>
          <li><code>project list</code> - List available projects</li>
          <li><code>project use abc123</code> - Select a project context</li>
          <li><code>entity list</code> - List entities (after selecting project)</li>
          <li><code>server status</code> - Check server status</li>
          <li><code>clear</code> - Clear the console</li>
          <li><code>history</code> - Show command history</li>
        </ul>
        
        <Button onClick={() => setVisible(!visible)} style={{ marginTop: '20px' }}>
          {visible ? 'Hide Console' : 'Show Console'}
        </Button>
        
        <InteractiveConsole
          {...args}
          visible={visible}
          onToggle={setVisible}
          serverUrl="/mock-rpc"
        />
      </Box>
    </StoryWrapper>
  );
};

export const Default: Story = {
  render: ConsoleDemo,
  args: {
    visible: false,
    theme: 'dark',
    height: '40vh',
    animationSpeed: 300
  }
};

export const LightTheme: Story = {
  render: ConsoleDemo,
  args: {
    visible: false,
    theme: 'light',
    height: '40vh',
    animationSpeed: 300
  }
};

export const Tall: Story = {
  render: ConsoleDemo,
  args: {
    visible: false,
    theme: 'dark',
    height: '60vh',
    animationSpeed: 300
  }
};

export const FastAnimation: Story = {
  render: ConsoleDemo,
  args: {
    visible: false,
    theme: 'dark',
    height: '40vh',
    animationSpeed: 150
  }
};

export const WithProvider: Story = {
  render: () => {
    const [enabled, setEnabled] = useState(true);
    
    return (
      <StoryWrapper>
        <ConsoleProvider enabled={enabled} theme="dark" height="50vh">
          <Box style={{ padding: '20px', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
            <h1>Console Provider Demo</h1>
            <p>The console is integrated globally using ConsoleProvider.</p>
            <p>Press Ctrl+~ to toggle the console from anywhere in the app.</p>
            
            <Button onClick={() => setEnabled(!enabled)} style={{ marginTop: '20px' }}>
              {enabled ? 'Disable Console' : 'Enable Console'}
            </Button>
          </Box>
        </ConsoleProvider>
      </StoryWrapper>
    );
  }
};