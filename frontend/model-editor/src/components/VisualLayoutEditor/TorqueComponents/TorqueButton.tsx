import { ComponentConfig } from '@measured/puck';
import { Button } from '@mantine/core';
import { 
  IconPlus, IconEdit, IconTrash, IconDeviceFloppy, IconDownload, IconUpload, 
  IconRefresh, IconSearch, IconFilter, IconPrinter, IconMail, IconShare,
  IconSettings, IconUser, IconHome, IconChevronLeft, IconChevronRight
} from '@tabler/icons-react';

export interface TorqueButtonProps {
  text: string;
  variant: 'filled' | 'outline' | 'subtle' | 'light' | 'gradient';
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color: string;
  fullWidth: boolean;
  disabled: boolean;
  loading: boolean;
  icon?: string;
  iconPosition: 'left' | 'right';
  action: 'navigate' | 'submit' | 'custom';
  navigationUrl?: string;
  customAction?: string;
  tooltip?: string;
}

const iconMap = {
  'plus': IconPlus,
  'edit': IconEdit,
  'trash': IconTrash,
  'save': IconDeviceFloppy,
  'download': IconDownload,
  'upload': IconUpload,
  'refresh': IconRefresh,
  'search': IconSearch,
  'filter': IconFilter,
  'print': IconPrinter,
  'mail': IconMail,
  'share': IconShare,
  'settings': IconSettings,
  'user': IconUser,
  'home': IconHome,
  'chevron-left': IconChevronLeft,
  'chevron-right': IconChevronRight
};

export const TorqueButtonComponent: ComponentConfig<TorqueButtonProps> = {
  fields: {
    text: {
      type: 'text',
      label: 'Button Text',
      placeholder: 'Click me'
    },
    variant: {
      type: 'select',
      label: 'Button Style',
      options: [
        { label: 'Filled', value: 'filled' },
        { label: 'Outline', value: 'outline' },
        { label: 'Subtle', value: 'subtle' },
        { label: 'Light', value: 'light' },
        { label: 'Gradient', value: 'gradient' }
      ]
    },
    size: {
      type: 'select',
      label: 'Button Size',
      options: [
        { label: 'Extra Small', value: 'xs' },
        { label: 'Small', value: 'sm' },
        { label: 'Medium', value: 'md' },
        { label: 'Large', value: 'lg' },
        { label: 'Extra Large', value: 'xl' }
      ]
    },
    color: {
      type: 'select',
      label: 'Button Color',
      options: [
        { label: 'Blue', value: 'blue' },
        { label: 'Green', value: 'green' },
        { label: 'Red', value: 'red' },
        { label: 'Orange', value: 'orange' },
        { label: 'Yellow', value: 'yellow' },
        { label: 'Purple', value: 'purple' },
        { label: 'Pink', value: 'pink' },
        { label: 'Gray', value: 'gray' },
        { label: 'Dark', value: 'dark' }
      ]
    },
    fullWidth: {
      type: 'radio',
      label: 'Full Width',
      options: [
        { label: 'Yes', value: true },
        { label: 'No', value: false }
      ]
    },
    disabled: {
      type: 'radio',
      label: 'Disabled',
      options: [
        { label: 'Yes', value: true },
        { label: 'No', value: false }
      ]
    },
    loading: {
      type: 'radio',
      label: 'Loading State',
      options: [
        { label: 'Yes', value: true },
        { label: 'No', value: false }
      ]
    },
    icon: {
      type: 'select',
      label: 'Icon',
      options: [
        { label: 'None', value: '' },
        { label: 'Plus', value: 'plus' },
        { label: 'Edit', value: 'edit' },
        { label: 'Delete', value: 'trash' },
        { label: 'Save', value: 'save' },
        { label: 'Download', value: 'download' },
        { label: 'Upload', value: 'upload' },
        { label: 'Refresh', value: 'refresh' },
        { label: 'Search', value: 'search' },
        { label: 'Filter', value: 'filter' },
        { label: 'Print', value: 'print' },
        { label: 'Mail', value: 'mail' },
        { label: 'Share', value: 'share' },
        { label: 'Settings', value: 'settings' },
        { label: 'User', value: 'user' },
        { label: 'Home', value: 'home' },
        { label: 'Previous', value: 'chevron-left' },
        { label: 'Next', value: 'chevron-right' }
      ]
    },
    iconPosition: {
      type: 'radio',
      label: 'Icon Position',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Right', value: 'right' }
      ]
    },
    action: {
      type: 'select',
      label: 'Button Action',
      options: [
        { label: 'Navigate to URL', value: 'navigate' },
        { label: 'Submit Form', value: 'submit' },
        { label: 'Custom Action', value: 'custom' }
      ]
    },
    navigationUrl: {
      type: 'text',
      label: 'Navigation URL',
      placeholder: '/dashboard or https://example.com'
    },
    customAction: {
      type: 'text',
      label: 'Custom Action (JavaScript)',
      placeholder: 'alert("Hello World")'
    },
    tooltip: {
      type: 'text',
      label: 'Tooltip Text',
      placeholder: 'Helpful information about this button'
    }
  },
  defaultProps: {
    text: 'Button',
    variant: 'filled',
    size: 'md',
    color: 'blue',
    fullWidth: false,
    disabled: false,
    loading: false,
    icon: '',
    iconPosition: 'left',
    action: 'custom',
    tooltip: ''
  },
  render: ({ 
    text, 
    variant, 
    size, 
    color, 
    fullWidth, 
    disabled, 
    loading, 
    icon, 
    iconPosition, 
    action, 
    navigationUrl, 
    customAction, 
    tooltip 
  }) => {
    const IconComponent = icon ? iconMap[icon as keyof typeof iconMap] : null;
    
    const handleClick = () => {
      switch (action) {
        case 'navigate':
          if (navigationUrl) {
            if (navigationUrl.startsWith('http')) {
              window.open(navigationUrl, '_blank');
            } else {
              window.location.href = navigationUrl;
            }
          }
          break;
        case 'submit':
          // In a real application, this would submit the nearest form
          console.log('Submit form action triggered');
          break;
        case 'custom':
          if (customAction) {
            try {
              // In a real application, this would be handled more securely
              eval(customAction);
            } catch (error) {
              console.error('Custom action error:', error);
            }
          }
          break;
      }
    };

    return (
      <Button
        variant={variant}
        size={size}
        color={color}
        fullWidth={fullWidth}
        disabled={disabled}
        loading={loading}
        onClick={handleClick}
        title={tooltip}
        leftSection={IconComponent && iconPosition === 'left' ? <IconComponent size={16} /> : undefined}
        rightSection={IconComponent && iconPosition === 'right' ? <IconComponent size={16} /> : undefined}
      >
        {text}
      </Button>
    );
  }
};