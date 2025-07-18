import { ComponentConfig } from '@measured/puck';
import { Text as MantineText } from '@mantine/core';

export interface TextProps {
  content: string;
  variant: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'caption';
  alignment: 'left' | 'center' | 'right';
  color?: string;
  weight?: 'normal' | 'bold';
}

export const TextComponent: ComponentConfig<TextProps> = {
  fields: {
    content: { 
      type: 'textarea', 
      label: 'Text Content',
      placeholder: 'Enter your text content...'
    },
    variant: {
      type: 'select',
      label: 'Text Style',
      options: [
        { label: 'Heading 1', value: 'h1' },
        { label: 'Heading 2', value: 'h2' },
        { label: 'Heading 3', value: 'h3' },
        { label: 'Heading 4', value: 'h4' },
        { label: 'Heading 5', value: 'h5' },
        { label: 'Heading 6', value: 'h6' },
        { label: 'Body Text', value: 'body' },
        { label: 'Caption', value: 'caption' }
      ]
    },
    alignment: {
      type: 'radio',
      label: 'Alignment',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
        { label: 'Right', value: 'right' }
      ]
    },
    weight: {
      type: 'radio',
      label: 'Font Weight',
      options: [
        { label: 'Normal', value: 'normal' },
        { label: 'Bold', value: 'bold' }
      ]
    },
    color: { 
      type: 'text', 
      label: 'Text Color (CSS)',
      placeholder: '#000000 or blue'
    }
  },
  defaultProps: {
    content: 'Click to edit text content',
    variant: 'body',
    alignment: 'left',
    weight: 'normal'
  },
  render: ({ content, variant, alignment, color, weight }) => {
    const getSize = () => {
      switch (variant) {
        case 'h1': return 'xl';
        case 'h2': return 'lg';
        case 'h3': return 'md';
        case 'h4': return 'sm';
        case 'h5': return 'xs';
        case 'h6': return 'xs';
        case 'caption': return 'xs';
        default: return 'sm';
      }
    };

    const getWeight = () => {
      if (weight === 'bold') return 700;
      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(variant)) return 600;
      return 400;
    };

    return (
      <MantineText
        size={getSize()}
        fw={getWeight()}
        ta={alignment}
        c={color || undefined}
        style={{
          margin: 0,
          lineHeight: variant.startsWith('h') ? 1.2 : 1.5
        }}
      >
        {content}
      </MantineText>
    );
  }
};