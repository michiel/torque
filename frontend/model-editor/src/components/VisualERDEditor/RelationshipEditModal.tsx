import React, { useState, useEffect } from 'react';
import {
  Modal,
  TextInput,
  Button,
  Stack,
  Group,
  Text,
  Select,
  Alert,
  Paper,
  Divider
} from '@mantine/core';
import { IconAlertCircle, IconArrowRight } from '@tabler/icons-react';
import { useForm } from 'react-hook-form';

interface Entity {
  id: string;
  name: string;
  displayName: string;
  fields: Array<{
    id: string;
    name: string;
    displayName: string;
    fieldType: string;
    required: boolean;
  }>;
}

interface Relationship {
  id: string;
  name: string;
  displayName: string;
  fromEntityId: string;
  toEntityId: string;
  relationshipType: string;
  fromFieldId: string;
  toFieldId: string;
}

interface RelationshipEditModalProps {
  relationship: Relationship;
  entities: Entity[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (relationship: Relationship) => Promise<void>;
}

const RELATIONSHIP_TYPES = [
  { value: 'one-to-one', label: 'One to One (1:1)' },
  { value: 'one-to-many', label: 'One to Many (1:n)' },
  { value: 'many-to-one', label: 'Many to One (n:1)' },
  { value: 'many-to-many', label: 'Many to Many (n:n)' }
];

export const RelationshipEditModal: React.FC<RelationshipEditModalProps> = ({
  relationship,
  entities,
  isOpen,
  onClose,
  onSave
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit, register, watch, setValue, formState: { errors } } = useForm<Relationship>({
    defaultValues: relationship
  });

  const fromEntityId = watch('fromEntityId');
  const toEntityId = watch('toEntityId');

  // Auto-generate technical name from display name
  useEffect(() => {
    const displayName = watch('displayName');
    if (displayName) {
      const technicalName = displayName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_{2,}/g, '_')
        .replace(/^_|_$/g, '');
      setValue('name', technicalName);
    }
  }, [watch('displayName'), setValue]);

  const fromEntity = entities.find(e => e.id === fromEntityId);
  const toEntity = entities.find(e => e.id === toEntityId);

  const fromEntityOptions = entities.map(entity => ({
    value: entity.id,
    label: entity.displayName
  }));

  const toEntityOptions = entities.map(entity => ({
    value: entity.id,
    label: entity.displayName
  }));

  const fromFieldOptions = fromEntity?.fields.map(field => ({
    value: field.id,
    label: field.displayName
  })) || [];

  const toFieldOptions = toEntity?.fields.map(field => ({
    value: field.id,
    label: field.displayName
  })) || [];

  const handleSave = async (data: Relationship) => {
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
      if (!data.fromEntityId) {
        throw new Error('From entity is required');
      }
      if (!data.toEntityId) {
        throw new Error('To entity is required');
      }
      if (data.fromEntityId === data.toEntityId) {
        throw new Error('From and To entities cannot be the same');
      }

      await onSave(data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save relationship');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={
        <Text size="lg" fw={700}>
          Edit Relationship
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
            placeholder="Customer has Orders, Product belongs to Category..."
            {...register('displayName', { required: 'Display name is required' })}
            error={errors.displayName?.message}
          />

          <TextInput
            label="Technical Name"
            placeholder="customer_orders, product_category..."
            {...register('name', { required: 'Technical name is required' })}
            error={errors.name?.message}
            description="Used in APIs and database. Use lowercase with underscores."
          />

          <Divider label="Relationship Configuration" labelPosition="center" />

          <Paper p="md" withBorder>
            <Stack gap="md">
              <Group align="center" justify="space-between">
                <Select
                  label="From Entity"
                  data={fromEntityOptions}
                  {...register('fromEntityId', { required: 'From entity is required' })}
                  defaultValue={relationship.fromEntityId}
                  onChange={(value) => setValue('fromEntityId', value || '')}
                  error={errors.fromEntityId?.message}
                  style={{ flex: 1 }}
                />
                
                <div style={{ paddingTop: '25px' }}>
                  <IconArrowRight size={20} />
                </div>
                
                <Select
                  label="To Entity"
                  data={toEntityOptions}
                  {...register('toEntityId', { required: 'To entity is required' })}
                  defaultValue={relationship.toEntityId}
                  onChange={(value) => setValue('toEntityId', value || '')}
                  error={errors.toEntityId?.message}
                  style={{ flex: 1 }}
                />
              </Group>

              <Select
                label="Relationship Type"
                data={RELATIONSHIP_TYPES}
                {...register('relationshipType', { required: 'Relationship type is required' })}
                defaultValue={relationship.relationshipType || 'one-to-many'}
                onChange={(value) => setValue('relationshipType', value || 'one-to-many')}
                error={errors.relationshipType?.message}
              />

              <Group align="end">
                <Select
                  label="From Field"
                  data={fromFieldOptions}
                  {...register('fromFieldId')}
                  defaultValue={relationship.fromFieldId}
                  onChange={(value) => setValue('fromFieldId', value || '')}
                  placeholder="Select field..."
                  style={{ flex: 1 }}
                  disabled={!fromEntity}
                />
                
                <Select
                  label="To Field"
                  data={toFieldOptions}
                  {...register('toFieldId')}
                  defaultValue={relationship.toFieldId}
                  onChange={(value) => setValue('toFieldId', value || '')}
                  placeholder="Select field..."
                  style={{ flex: 1 }}
                  disabled={!toEntity}
                />
              </Group>
            </Stack>
          </Paper>

          {fromEntity && toEntity && (
            <Alert color="blue" style={{ fontSize: '14px' }}>
              <Text size="sm">
                <strong>{fromEntity.displayName}</strong> {getRelationshipDescription(watch('relationshipType') || 'one-to-many')} <strong>{toEntity.displayName}</strong>
              </Text>
            </Alert>
          )}

          <Group justify="flex-end" gap="sm">
            <Button variant="subtle" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" loading={isSaving}>
              Save Relationship
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

function getRelationshipDescription(type: string): string {
  switch (type) {
    case 'one-to-one':
      return 'has one';
    case 'one-to-many':
      return 'has many';
    case 'many-to-one':
      return 'belongs to';
    case 'many-to-many':
      return 'has many';
    default:
      return 'relates to';
  }
}