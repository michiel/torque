import type { Preview } from '@storybook/react';
import '@mantine/core/styles.css';
import '@measured/puck/puck.css';

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

export default preview;