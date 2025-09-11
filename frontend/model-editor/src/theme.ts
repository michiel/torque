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
    ],
    // Gray colors with dark mode override
    gray: [
      '#f8f9fa', // gray.0 - will be overridden in dark mode
      '#f1f3f4',
      '#e9ecef',
      '#dee2e6',
      '#ced4da',
      '#adb5bd',
      '#868e96',
      '#495057',
      '#343a40',
      '#212529'
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
      styles: (theme: any) => ({
        header: {
          backgroundColor: 'var(--mantine-color-body)',
          borderBottomColor: 'var(--mantine-color-default-border)',
        },
      }),
    },
    Card: {
      styles: (theme: any) => ({
        root: {
          backgroundColor: 'var(--mantine-color-body)',
          borderColor: 'var(--mantine-color-default-border)',
        },
      }),
    },
    Modal: {
      styles: (theme: any) => ({
        content: {
          backgroundColor: 'var(--mantine-color-body)',
        },
      }),
    },
    Navbar: {
      styles: (theme: any) => ({
        root: {
          backgroundColor: 'var(--mantine-color-body)',
          borderRightColor: 'var(--mantine-color-default-border)',
        },
      }),
    },
  },
})