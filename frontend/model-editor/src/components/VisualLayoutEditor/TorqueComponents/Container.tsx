import { ComponentConfig } from '@measured/puck';
import { Box } from '@mantine/core';
import { DropZone } from '@measured/puck';

export interface ContainerProps {
  padding: string;
  backgroundColor?: string;
  borderRadius?: string;
  border?: string;
  minHeight?: string;
}

export const ContainerComponent: ComponentConfig<ContainerProps> = {
  fields: {
    padding: {
      type: 'select',
      label: 'Padding',
      options: [
        { label: 'None', value: '0' },
        { label: 'Small (8px)', value: '8px' },
        { label: 'Medium (16px)', value: '16px' },
        { label: 'Large (24px)', value: '24px' },
        { label: 'Extra Large (32px)', value: '32px' }
      ]
    },
    backgroundColor: {
      type: 'text',
      label: 'Background Color',
      placeholder: '#ffffff or lightgray'
    },
    borderRadius: {
      type: 'select',
      label: 'Border Radius',
      options: [
        { label: 'None', value: '0' },
        { label: 'Small (4px)', value: '4px' },
        { label: 'Medium (8px)', value: '8px' },
        { label: 'Large (12px)', value: '12px' },
        { label: 'Round (50%)', value: '50%' }
      ]
    },
    border: {
      type: 'text',
      label: 'Border (CSS)',
      placeholder: '1px solid #ccc'
    },
    minHeight: {
      type: 'text',
      label: 'Minimum Height',
      placeholder: '100px or 10rem'
    }
  },
  defaultProps: {
    padding: '16px',
    borderRadius: '8px',
    minHeight: '100px',
    backgroundColor: '#f8f9fa'
  },
  render: ({ padding, backgroundColor, borderRadius, border, minHeight }) => (
    <Box
      style={{
        padding,
        backgroundColor,
        borderRadius,
        border,
        minHeight: minHeight || '100px',
        position: 'relative'
      }}
    >
      <DropZone zone="container" />
    </Box>
  )
};