import { createTheme } from '@mantine/core'

export const theme = createTheme({
  primaryColor: 'blue',
  fontFamily: 'Inter, sans-serif',
  headings: {
    fontFamily: 'Inter, sans-serif',
  },
  colors: {
    brand: [
      '#e3f2fd',
      '#bbdefb',
      '#90caf9',
      '#64b5f6',
      '#42a5f5',
      '#2196f3',
      '#1e88e5',
      '#1976d2',
      '#1565c0',
      '#0d47a1'
    ],
    // Enhanced dark mode colors
    dark: [
      '#C1C2C5',
      '#A6A7AB',
      '#909296',
      '#5c5f66',
      '#373A40',
      '#2C2E33',
      '#25262b',
      '#1A1B1E',
      '#141517',
      '#101113'
    ]
  },
  components: {
    Button: {
      defaultProps: {
        fw: 500,
      },
    },
    Paper: {
      defaultProps: {
        p: 'md',
        shadow: 'sm',
      },
    },
    AppShell: {
      styles: (theme) => ({
        header: {
          backgroundColor: 'var(--mantine-color-body)',
          borderBottomColor: 'var(--mantine-color-default-border)',
        },
      }),
    },
    Card: {
      styles: (theme) => ({
        root: {
          backgroundColor: 'var(--mantine-color-body)',
          borderColor: 'var(--mantine-color-default-border)',
        },
      }),
    },
    Modal: {
      styles: (theme) => ({
        content: {
          backgroundColor: 'var(--mantine-color-body)',
        },
      }),
    },
    Navbar: {
      styles: (theme) => ({
        root: {
          backgroundColor: 'var(--mantine-color-body)',
          borderRightColor: 'var(--mantine-color-default-border)',
        },
      }),
    },
  },
})