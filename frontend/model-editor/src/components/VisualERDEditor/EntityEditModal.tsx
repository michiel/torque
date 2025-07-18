import React, { useState, useEffect } from 'react';
import {
  Modal,
  TextInput,
  Button,
  Stack,
  Group,
  Text,
  ActionIcon,
  Select,
  Switch,
  Paper,
  Divider,
  Alert
} from '@mantine/core';
import { IconPlus, IconTrash, IconAlertCircle } from '@tabler/icons-react';
import { useForm, useFieldArray } from 'react-hook-form';

interface EntityField {
  id: string;
  name: string;
  displayName: string;
  fieldType: string;
  required: boolean;
}

interface Entity {
  id: string;
  name: string;
  displayName: string;
  fields: EntityField[];
}

interface EntityEditModalProps {
  entity: Entity;
  isOpen: boolean;
  onClose: () => void;
  onSave: (entity: Entity) => Promise<void>;
  isCreating?: boolean;
}

const FIELD_TYPES = [
  { value: 'String', label: 'String' },
  { value: 'Integer', label: 'Integer' },
  { value: 'Float', label: 'Float' },
  { value: 'Boolean', label: 'Boolean' },
  { value: 'DateTime', label: 'DateTime' },
  { value: 'Reference', label: 'Reference' },
  { value: 'Array', label: 'Array' }
];

export const EntityEditModal: React.FC<EntityEditModalProps> = ({
  entity,
  isOpen,
  onClose,
  onSave,
  isCreating = false
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit, register, watch, setValue, formState: { errors } } = useForm<Entity>({
    defaultValues: entity
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'fields'
  });

  const nameValue = watch('name');

  // Auto-generate technical name from display name
  useEffect(() => {
    const displayName = watch('displayName');
    if (displayName && isCreating) {
      const technicalName = displayName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_{2,}/g, '_')
        .replace(/^_|_$/g, '');
      setValue('name', technicalName);
    }
  }, [watch('displayName'), isCreating, setValue]);

  const handleSave = async (data: Entity) => {
    setIsSaving(true);
    setError(null);

    try {
      // Validate required fields
      if (!data.displayName.trim()) {
        throw new Error('Display name is required');
      }
      if (!data.name.trim()) {
        throw new Error('Technical name is required');
      }

      // Validate field names are unique
      const fieldNames = data.fields.map(f => f.name);
      const duplicateNames = fieldNames.filter((name, index) => fieldNames.indexOf(name) !== index);
      if (duplicateNames.length > 0) {
        throw new Error(`Duplicate field names: ${duplicateNames.join(', ')}`);
      }

      // Ensure all fields have valid data
      const validatedFields = data.fields.map(field => ({
        ...field,
        id: field.id || `field-${Date.now()}-${Math.random()}`,
        name: field.name.trim(),
        displayName: field.displayName.trim(),
        fieldType: field.fieldType || 'String',
        required: field.required || false
      }));

      const validatedEntity = {
        ...data,
        fields: validatedFields
      };

      await onSave(validatedEntity);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save entity');
    } finally {
      setIsSaving(false);
    }
  };

  const addField = () => {
    append({
      id: `field-${Date.now()}-${Math.random()}`,
      name: '',
      displayName: '',
      fieldType: 'String',
      required: false
    });
  };

  const generateFieldName = (displayName: string) => {
    return displayName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_|_$/g, '');
  };

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={
        <Text size="lg" fw={700}>
          {isCreating ? 'Create Entity' : 'Edit Entity'}
        </Text>
      }
      size="lg"
      centered
      zIndex={1100}
      overlayProps={{ blur: 3 }}
    >
      <form onSubmit={handleSubmit(handleSave)}>
        <Stack gap="md">
          {error && (
            <Alert color="red" icon={<IconAlertCircle size={16} />}>
              {error}
            </Alert>
          )}

          <TextInput
            label="Display Name"
            placeholder="Customer, Order, Product..."
            {...register('displayName', { required: 'Display name is required' })}
            error={errors.displayName?.message}
          />

          <TextInput
            label="Technical Name"
            placeholder="customer, order, product..."
            {...register('name', { required: 'Technical name is required' })}
            error={errors.name?.message}
            description="Used in APIs and database. Use lowercase with underscores."
          />

          <Divider label="Fields" labelPosition="center" />

          <Stack gap="sm">
            {fields.map((field, index) => (
              <Paper key={field.id} p="md" withBorder>
                <Group align="start">
                  <Stack gap="xs" style={{ flex: 1 }}>
                    <Group align="end">
                      <TextInput
                        label="Display Name"
                        placeholder="Customer Name, Email..."
                        {...register(`fields.${index}.displayName`, { required: 'Display name is required' })}
                        error={errors.fields?.[index]?.displayName?.message}
                        style={{ flex: 1 }}
                        onChange={(e) => {
                          const displayName = e.target.value;
                          setValue(`fields.${index}.displayName`, displayName);
                          if (displayName) {
                            setValue(`fields.${index}.name`, generateFieldName(displayName));
                          }
                        }}
                      />
                      <TextInput
                        label="Technical Name"
                        placeholder="customer_name, email..."
                        {...register(`fields.${index}.name`, { required: 'Technical name is required' })}
                        error={errors.fields?.[index]?.name?.message}
                        style={{ flex: 1 }}
                      />
                    </Group>
                    <Group align="end">
                      <Select
                        label="Field Type"
                        data={FIELD_TYPES}
                        {...register(`fields.${index}.fieldType`)}
                        defaultValue={field.fieldType || 'String'}
                        onChange={(value) => setValue(`fields.${index}.fieldType`, value || 'String')}
                        style={{ flex: 1 }}
                      />
                      <Switch
                        label="Required"
                        {...register(`fields.${index}.required`)}
                        defaultChecked={field.required}
                        onChange={(event) => setValue(`fields.${index}.required`, event.currentTarget.checked)}
                      />
                    </Group>
                  </Stack>
                  <ActionIcon
                    color="red"
                    variant="light"
                    onClick={() => remove(index)}
                    disabled={fields.length <= 1}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              </Paper>
            ))}

            <Button
              variant="light"
              leftSection={<IconPlus size={16} />}
              onClick={addField}
              fullWidth
            >
              Add Field
            </Button>
          </Stack>

          <Group justify="flex-end" gap="sm">
            <Button variant="subtle" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" loading={isSaving}>
              {isCreating ? 'Create Entity' : 'Save Changes'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};