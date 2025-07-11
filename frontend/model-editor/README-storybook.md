# Storybook Setup for Torque Model Editor

This document describes the Storybook setup for the Torque Model Editor frontend project.

## Overview

Storybook is a tool for developing UI components in isolation. It allows developers to:
- Build components independently
- Test different states and variations
- Document component APIs
- Share components with stakeholders

## Installation

Storybook has been configured with the following packages:

```json
{
  "@storybook/addon-essentials": "^8.6.14",
  "@storybook/addon-interactions": "^8.6.14", 
  "@storybook/addon-links": "^8.6.14",
  "@storybook/addon-onboarding": "^8.6.14",
  "@storybook/blocks": "^8.6.14",
  "@storybook/react": "^8.6.14",
  "@storybook/react-vite": "^8.6.14",
  "@storybook/test": "^8.6.14",
  "storybook": "^8.6.14"
}
```

## Configuration

### Main Configuration (`.storybook/main.ts`)

```typescript
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-links',
    '@storybook/addon-onboarding',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  core: {
    builder: '@storybook/builder-vite',
  },
};
```

### Preview Configuration (`.storybook/preview.ts`)

```typescript
import type { Preview } from '@storybook/react';
import '@mantine/core/styles.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};
```

## Available Stories

### 1. Introduction
- **Path**: `src/stories/Introduction.stories.mdx`
- **Purpose**: Welcome page with project overview and documentation

### 2. Button Components
- **Path**: `src/stories/Button.stories.tsx`
- **Purpose**: Standard Mantine button variations
- **Variants**: Primary, Secondary, WithIcon, Large, Small

### 3. Connection Status
- **Path**: `src/stories/ConnectionStatus.stories.tsx`
- **Purpose**: WebSocket connection status indicator
- **Variants**: Connected, Disconnected

### 4. Navigation
- **Path**: `src/stories/Navigation.stories.tsx`
- **Purpose**: Main sidebar navigation component
- **Variants**: Default, WithActiveModels, WithActiveCreateModel

### 5. Entity Card
- **Path**: `src/stories/EntityCard.stories.tsx`
- **Purpose**: Entity display card with actions
- **Variants**: Customer, Order, Lookup, Audit, WithoutDescription

## Running Storybook

### Development Server
```bash
npm run storybook
```
This starts Storybook on `http://localhost:6006`

### Build Static Version
```bash
npm run build-storybook
```
This creates a static build in `storybook-static/`

## Writing New Stories

### Basic Pattern
```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { MantineProvider } from '@mantine/core';
import { YourComponent } from '../components/YourComponent';

const meta: Meta<typeof YourComponent> = {
  title: 'Components/YourComponent',
  component: YourComponent,
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
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // Component props
  },
};
```

### Best Practices

1. **Use MantineProvider**: Always wrap stories with MantineProvider for consistent styling
2. **Add Decorators**: Use decorators for context providers (Router, WebSocket, etc.)
3. **Create Variants**: Show different states and use cases
4. **Add Controls**: Use `argTypes` for interactive controls
5. **Standalone Components**: Create simplified versions for components that depend on complex contexts

## Integration with Development

### Context Dependencies
Some components depend on React contexts (WebSocket, Apollo Client, Router). For these components:

1. Create mock context providers in stories
2. Use simplified standalone versions
3. Provide example data and handlers

### Testing
Storybook stories can be used for:
- Visual regression testing
- Component API documentation
- Integration testing with `@storybook/test`

## Deployment

The Storybook can be deployed as a static site to document the component library:

```bash
npm run build-storybook
# Deploy storybook-static/ to your hosting platform
```

This provides a shareable URL for stakeholders to view and interact with components.