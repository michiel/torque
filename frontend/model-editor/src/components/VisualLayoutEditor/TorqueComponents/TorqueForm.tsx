import { ComponentConfig } from '@measured/puck';
import { 
  Box, Stack, Group, Text, TextInput, Textarea, NumberInput, 
  Select, Checkbox, Switch, Button, Divider, Badge
} from '@mantine/core';
import { IconForms, IconSend, IconX } from '@tabler/icons-react';

export interface TorqueFormProps {
  entityType: string;
  formTitle: string;
  fields: Array<{
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'switch';
    required: boolean;
    placeholder?: string;
    options?: string[];
    validation?: string;
  }>;
  submitButtonText: string;
  cancelButtonText: string;
  showCancelButton: boolean;
  layout: 'stacked' | 'inline';
  spacing: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  submitAction: 'create' | 'update' | 'custom';
  customSubmitAction?: string;
  width?: string;
  maxWidth?: string;
}

export const TorqueFormComponent: ComponentConfig<TorqueFormProps> = {
  fields: {
    entityType: {
      type: 'select',
      label: 'Entity Type',
      options: [
        { label: 'Customer', value: 'customer' },
        { label: 'Order', value: 'order' },
        { label: 'Product', value: 'product' },
        { label: 'Invoice', value: 'invoice' }
      ]
    },
    formTitle: {
      type: 'text',
      label: 'Form Title',
      placeholder: 'Create New Customer'
    },
    fields: {
      type: 'array',
      label: 'Form Fields',
      defaultItemProps: {
        name: 'fieldName',
        label: 'Field Label',
        type: 'text',
        required: false
      },
      getItemSummary: (item) => item.label || item.name,
      arrayFields: {
        name: {
          type: 'text',
          label: 'Field Name',
          placeholder: 'firstName, email, etc.'
        },
        label: {
          type: 'text',
          label: 'Field Label',
          placeholder: 'First Name, Email Address, etc.'
        },
        type: {
          type: 'select',
          label: 'Field Type',
          options: [
            { label: 'Text Input', value: 'text' },
            { label: 'Text Area', value: 'textarea' },
            { label: 'Number Input', value: 'number' },
            { label: 'Select Dropdown', value: 'select' },
            { label: 'Checkbox', value: 'checkbox' },
            { label: 'Switch', value: 'switch' }
          ]
        },
        required: {
          type: 'radio',
          label: 'Required Field',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false }
          ]
        },
        placeholder: {
          type: 'text',
          label: 'Placeholder Text',
          placeholder: 'Enter your first name...'
        },
        options: {
          type: 'textarea',
          label: 'Select Options (one per line)',
          placeholder: 'Option 1\nOption 2\nOption 3'
        },
        validation: {
          type: 'text',
          label: 'Validation Rule',
          placeholder: 'email, phone, url, etc.'
        }
      }
    },
    submitButtonText: {
      type: 'text',
      label: 'Submit Button Text',
      placeholder: 'Create Customer'
    },
    cancelButtonText: {
      type: 'text',
      label: 'Cancel Button Text',
      placeholder: 'Cancel'
    },
    showCancelButton: {
      type: 'radio',
      label: 'Show Cancel Button',
      options: [
        { label: 'Yes', value: true },
        { label: 'No', value: false }
      ]
    },
    layout: {
      type: 'radio',
      label: 'Form Layout',
      options: [
        { label: 'Stacked', value: 'stacked' },
        { label: 'Inline', value: 'inline' }
      ]
    },
    spacing: {
      type: 'select',
      label: 'Field Spacing',
      options: [
        { label: 'Extra Small', value: 'xs' },
        { label: 'Small', value: 'sm' },
        { label: 'Medium', value: 'md' },
        { label: 'Large', value: 'lg' },
        { label: 'Extra Large', value: 'xl' }
      ]
    },
    submitAction: {
      type: 'select',
      label: 'Submit Action',
      options: [
        { label: 'Create Entity', value: 'create' },
        { label: 'Update Entity', value: 'update' },
        { label: 'Custom Action', value: 'custom' }
      ]
    },
    customSubmitAction: {
      type: 'text',
      label: 'Custom Submit Action (JavaScript)',
      placeholder: 'console.log("Form submitted")'
    },
    width: {
      type: 'text',
      label: 'Form Width',
      placeholder: '100%, 500px, etc.'
    },
    maxWidth: {
      type: 'text',
      label: 'Maximum Width',
      placeholder: '600px, 100%, etc.'
    }
  },
  defaultProps: {
    entityType: 'customer',
    formTitle: 'Create New Entry',
    fields: [
      {
        name: 'name',
        label: 'Name',
        type: 'text',
        required: true,
        placeholder: 'Enter name...'
      },
      {
        name: 'email',
        label: 'Email',
        type: 'text',
        required: true,
        placeholder: 'Enter email address...',
        validation: 'email'
      },
      {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        required: false,
        placeholder: 'Enter description...'
      }
    ],
    submitButtonText: 'Submit',
    cancelButtonText: 'Cancel',
    showCancelButton: true,
    layout: 'stacked',
    spacing: 'md',
    submitAction: 'create',
    width: '100%',
    maxWidth: '600px'
  },
  render: ({ 
    entityType, 
    formTitle, 
    fields, 
    submitButtonText, 
    cancelButtonText, 
    showCancelButton, 
    layout, 
    spacing, 
    submitAction, 
    customSubmitAction, 
    width, 
    maxWidth 
  }) => {
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      switch (submitAction) {
        case 'create':
          console.log(`Creating new ${entityType} entity`);
          break;
        case 'update':
          console.log(`Updating ${entityType} entity`);
          break;
        case 'custom':
          if (customSubmitAction) {
            try {
              eval(customSubmitAction);
            } catch (error) {
              console.error('Custom submit action error:', error);
            }
          }
          break;
      }
    };

    const handleCancel = () => {
      console.log('Form cancelled');
    };

    const renderField = (field: any) => {
      const commonProps = {
        label: field.label,
        placeholder: field.placeholder,
        required: field.required,
        size: 'md' as const
      };

      switch (field.type) {
        case 'text':
          return (
            <TextInput
              key={field.name}
              {...commonProps}
              type={field.validation === 'email' ? 'email' : field.validation === 'url' ? 'url' : 'text'}
            />
          );
        case 'textarea':
          return (
            <Textarea
              key={field.name}
              {...commonProps}
              rows={3}
            />
          );
        case 'number':
          return (
            <NumberInput
              key={field.name}
              {...commonProps}
            />
          );
        case 'select':
          return (
            <Select
              key={field.name}
              {...commonProps}
              data={field.options || []}
            />
          );
        case 'checkbox':
          return (
            <Checkbox
              key={field.name}
              label={field.label}
              required={field.required}
            />
          );
        case 'switch':
          return (
            <Switch
              key={field.name}
              label={field.label}
              required={field.required}
            />
          );
        default:
          return null;
      }
    };

    return (
      <Box
        style={{
          width: width || '100%',
          maxWidth: maxWidth || '600px',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          padding: '24px',
          backgroundColor: '#ffffff'
        }}
      >
        {/* Form Header */}
        <Group mb="lg" justify="space-between">
          <Group>
            <IconForms size={20} />
            <Text size="lg" fw={600}>
              {formTitle}
            </Text>
          </Group>
          <Badge variant="outline" size="sm">
            {entityType}
          </Badge>
        </Group>

        <Divider mb="lg" />

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Stack gap={spacing}>
            {fields.map((field) => renderField(field))}
          </Stack>

          {/* Form Actions */}
          <Group mt="xl" justify="flex-end">
            {showCancelButton && (
              <Button
                variant="outline"
                onClick={handleCancel}
                leftSection={<IconX size={16} />}
              >
                {cancelButtonText}
              </Button>
            )}
            <Button
              type="submit"
              leftSection={<IconSend size={16} />}
            >
              {submitButtonText}
            </Button>
          </Group>
        </form>
      </Box>
    );
  }
};