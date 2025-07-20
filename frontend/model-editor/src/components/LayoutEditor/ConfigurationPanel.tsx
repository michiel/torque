import React, { useState, useCallback } from 'react';
import { generateId } from '../../utils/idGenerator';
import {
  Card,
  Text,
  Stack,
  Group,
  Button,
  Select,
  TextInput,
  NumberInput,
  Switch,
  Divider,
  Tabs,
  Badge,
  Alert,
  ScrollArea,
  Checkbox,
  ActionIcon,
} from '@mantine/core';
import {
  IconSettings,
  IconPalette,
  IconDatabase,
  IconAlertCircle,
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconChevronUp,
  IconX,
} from '@tabler/icons-react';
import { LayoutEditorComponent, ValidationResult, ComponentConfiguration, FormFieldType } from './types';

interface ConfigurationPanelProps {
  component?: LayoutEditorComponent | null;
  onUpdate?: (componentId: string, configuration: ComponentConfiguration) => void;
  onValidate?: (component: LayoutEditorComponent) => Promise<ValidationResult[]>;
  entities?: Array<{ id: string; name: string; displayName: string; fields: any[] }>;
}

interface BasicConfigurationProps {
  component: LayoutEditorComponent;
  onUpdate: (config: ComponentConfiguration) => void;
}

const BasicConfiguration: React.FC<BasicConfigurationProps> = ({ component, onUpdate }) => {
  const handlePositionChange = (field: string, value: number) => {
    const newPosition = { ...component.position, [field]: value };
    onUpdate({
      ...component.configuration,
      // We'll need to update position through a different callback
    });
  };

  const handleStylingChange = (field: string, value: string) => {
    const newStyling = { ...component.configuration.styling, [field]: value };
    onUpdate({
      ...component.configuration,
      styling: newStyling
    });
  };

  return (
    <Stack gap="md">
      <Stack gap="xs">
        <Text size="sm" fw={500}>Position & Size</Text>
        <Group grow>
          <NumberInput
            label="Row"
            value={component.position.row}
            onChange={(value) => handlePositionChange('row', typeof value === 'number' ? value : 0)}
            min={0}
            max={11}
            size="xs"
          />
          <NumberInput
            label="Column"
            value={component.position.column}
            onChange={(value) => handlePositionChange('column', typeof value === 'number' ? value : 0)}
            min={0}
            max={11}
            size="xs"
          />
        </Group>
        <Group grow>
          <NumberInput
            label="Height (rows)"
            value={component.position.rowSpan}
            onChange={(value) => handlePositionChange('rowSpan', typeof value === 'number' ? value : 1)}
            min={1}
            max={12}
            size="xs"
          />
          <NumberInput
            label="Width (cols)"
            value={component.position.colSpan}
            onChange={(value) => handlePositionChange('colSpan', typeof value === 'number' ? value : 1)}
            min={1}
            max={12}
            size="xs"
          />
        </Group>
      </Stack>

      <Divider />

      <Stack gap="xs">
        <Text size="sm" fw={500}>Styling</Text>
        <TextInput
          label="Background Color"
          placeholder="#ffffff"
          value={component.configuration.styling?.backgroundColor || ''}
          onChange={(e) => handleStylingChange('backgroundColor', e.currentTarget.value)}
          size="xs"
        />
        <Group grow>
          <TextInput
            label="Padding"
            placeholder="8px"
            value={component.configuration.styling?.padding || ''}
            onChange={(e) => handleStylingChange('padding', e.currentTarget.value)}
            size="xs"
          />
          <TextInput
            label="Border Radius"
            placeholder="4px"
            value={component.configuration.styling?.borderRadius || ''}
            onChange={(e) => handleStylingChange('borderRadius', e.currentTarget.value)}
            size="xs"
          />
        </Group>
      </Stack>
    </Stack>
  );
};

interface DataGridConfigurationProps {
  component: LayoutEditorComponent;
  onUpdate: (config: ComponentConfiguration) => void;
  entities: Array<{ id: string; name: string; displayName: string; fields: any[] }>;
}

const DataGridConfiguration: React.FC<DataGridConfigurationProps> = ({ 
  component, 
  onUpdate, 
  entities 
}) => {
  const [selectedEntity, setSelectedEntity] = useState(
    component.configuration.dataGrid?.entityId || ''
  );

  const entity = entities.find(e => e.id === selectedEntity);
  const availableFields = entity?.fields || [];

  const handleEntityChange = (entityId: string) => {
    setSelectedEntity(entityId);
    const newConfig = {
      ...component.configuration,
      dataGrid: {
        entityId,
        columns: [],
        pagination: component.configuration.dataGrid?.pagination || { enabled: true, pageSize: 25 },
        filtering: component.configuration.dataGrid?.filtering || { enabled: true },
        sorting: component.configuration.dataGrid?.sorting || { enabled: true },
        actions: component.configuration.dataGrid?.actions || []
      }
    };
    onUpdate(newConfig);
  };

  const addColumn = (fieldId: string) => {
    const field = availableFields.find(f => f.id === fieldId);
    if (!field) return;

    const newColumn = {
      id: generateId(),
      fieldId: field.id,
      label: field.displayName || field.name,
      type: field.fieldType?.type || 'string',
      sortable: true,
      filterable: true,
      width: 'auto',
      alignment: 'left' as const
    };

    const currentColumns = component.configuration.dataGrid?.columns || [];
    const newConfig = {
      ...component.configuration,
      dataGrid: {
        ...component.configuration.dataGrid,
        entityId: selectedEntity,
        columns: [...currentColumns, newColumn],
        pagination: component.configuration.dataGrid?.pagination || { enabled: true, pageSize: 25 },
        filtering: component.configuration.dataGrid?.filtering || { enabled: true },
        sorting: component.configuration.dataGrid?.sorting || { enabled: true },
        actions: component.configuration.dataGrid?.actions || []
      }
    };
    onUpdate(newConfig);
  };

  const removeColumn = (columnId: string) => {
    const currentColumns = component.configuration.dataGrid?.columns || [];
    const newConfig = {
      ...component.configuration,
      dataGrid: {
        entityId: component.configuration.dataGrid?.entityId || selectedEntity,
        columns: currentColumns.filter(c => c.id !== columnId),
        pagination: component.configuration.dataGrid?.pagination || { enabled: true, pageSize: 25 },
        filtering: component.configuration.dataGrid?.filtering || { enabled: true },
        sorting: component.configuration.dataGrid?.sorting || { enabled: true },
        actions: component.configuration.dataGrid?.actions || []
      }
    };
    onUpdate(newConfig);
  };

  const updateColumn = (columnId: string, updates: Partial<typeof configuredColumns[0]>) => {
    const currentColumns = component.configuration.dataGrid?.columns || [];
    const newConfig = {
      ...component.configuration,
      dataGrid: {
        entityId: component.configuration.dataGrid?.entityId || selectedEntity,
        columns: currentColumns.map(c => 
          c.id === columnId ? { ...c, ...updates } : c
        ),
        pagination: component.configuration.dataGrid?.pagination || { enabled: true, pageSize: 25 },
        filtering: component.configuration.dataGrid?.filtering || { enabled: true },
        sorting: component.configuration.dataGrid?.sorting || { enabled: true },
        actions: component.configuration.dataGrid?.actions || []
      }
    };
    onUpdate(newConfig);
  };

  const moveColumn = (fromIndex: number, toIndex: number) => {
    const currentColumns = [...(component.configuration.dataGrid?.columns || [])];
    const [moved] = currentColumns.splice(fromIndex, 1);
    currentColumns.splice(toIndex, 0, moved);
    
    const newConfig = {
      ...component.configuration,
      dataGrid: {
        entityId: component.configuration.dataGrid?.entityId || selectedEntity,
        columns: currentColumns,
        pagination: component.configuration.dataGrid?.pagination || { enabled: true, pageSize: 25 },
        filtering: component.configuration.dataGrid?.filtering || { enabled: true },
        sorting: component.configuration.dataGrid?.sorting || { enabled: true },
        actions: component.configuration.dataGrid?.actions || []
      }
    };
    onUpdate(newConfig);
  };

  const updateDataGridSettings = (settings: any) => {
    const newConfig = {
      ...component.configuration,
      dataGrid: {
        ...component.configuration.dataGrid,
        ...settings
      }
    };
    onUpdate(newConfig);
  };

  const configuredColumns = component.configuration.dataGrid?.columns || [];

  return (
    <Stack gap="md">
      <Select
        label="Entity"
        placeholder="Select an entity"
        value={selectedEntity}
        onChange={(value) => value && handleEntityChange(value)}
        data={entities.map(e => ({ value: e.id, label: `${e.displayName} (${e.name})` }))}
        data-testid="datagrid-entity-select"
      />

      {selectedEntity && (
        <>
          <Stack gap="xs">
            <Text size="sm" fw={500}>Available Fields</Text>
            <Group gap="xs">
              {availableFields.map(field => (
                <Button
                  key={field.id}
                  variant="light"
                  size="xs"
                  onClick={() => addColumn(field.id)}
                  disabled={configuredColumns.some(c => c.fieldId === field.id)}
                  data-testid={`add-column-${field.name}`}
                >
                  {field.displayName || field.name}
                </Button>
              ))}
            </Group>
          </Stack>

          {configuredColumns.length > 0 && (
            <Stack gap="xs">
              <Text size="sm" fw={500}>Columns ({configuredColumns.length})</Text>
              {configuredColumns.map((column, index) => (
                <ColumnConfiguration
                  key={column.id}
                  column={column}
                  index={index}
                  totalColumns={configuredColumns.length}
                  onUpdate={(updates) => updateColumn(column.id, updates)}
                  onRemove={() => removeColumn(column.id)}
                  onMove={moveColumn}
                />
              ))}
            </Stack>
          )}

          <Divider />

          <DataGridSettings
            configuration={component.configuration.dataGrid}
            onUpdate={updateDataGridSettings}
          />
        </>
      )}
    </Stack>
  );
};

interface ColumnConfigurationProps {
  column: any;
  index: number;
  totalColumns: number;
  onUpdate: (updates: any) => void;
  onRemove: () => void;
  onMove: (fromIndex: number, toIndex: number) => void;
}

function ColumnConfiguration({ column, index, totalColumns, onUpdate, onRemove, onMove }: ColumnConfigurationProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card withBorder p="xs" data-testid={`column-config-${column.fieldId}`}>
      <Stack gap="xs">
        <Group justify="space-between">
          <Group gap="xs">
            <ActionIcon
              variant="subtle"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
            </ActionIcon>
            <Text size="sm" fw={500}>{column.label}</Text>
            <Badge size="xs" variant="light">{column.type}</Badge>
          </Group>
          
          <Group gap="xs">
            <ActionIcon
              variant="subtle"
              size="sm"
              onClick={() => onMove(index, Math.max(0, index - 1))}
              disabled={index === 0}
            >
              <IconChevronUp size={14} />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              size="sm"
              onClick={() => onMove(index, Math.min(totalColumns - 1, index + 1))}
              disabled={index === totalColumns - 1}
            >
              <IconChevronDown size={14} />
            </ActionIcon>
            <ActionIcon
              color="red"
              variant="subtle"
              size="sm"
              onClick={onRemove}
            >
              <IconX size={14} />
            </ActionIcon>
          </Group>
        </Group>

        {isExpanded && (
          <Stack gap="xs" pl="lg">
            <TextInput
              label="Display Label"
              value={column.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              size="xs"
            />
            
            <Group grow>
              <Select
                label="Alignment"
                value={column.alignment}
                onChange={(value) => onUpdate({ alignment: value })}
                data={[
                  { value: 'left', label: 'Left' },
                  { value: 'center', label: 'Center' },
                  { value: 'right', label: 'Right' }
                ]}
                size="xs"
              />
              
              <TextInput
                label="Width"
                value={column.width}
                onChange={(e) => onUpdate({ width: e.target.value })}
                placeholder="auto, 150px, 20%"
                size="xs"
              />
            </Group>

            <Group>
              <Checkbox
                label="Sortable"
                checked={column.sortable}
                onChange={(e) => onUpdate({ sortable: e.target.checked })}
                size="xs"
              />
              <Checkbox
                label="Filterable"
                checked={column.filterable}
                onChange={(e) => onUpdate({ filterable: e.target.checked })}
                size="xs"
              />
            </Group>
          </Stack>
        )}
      </Stack>
    </Card>
  );
}

interface DataGridSettingsProps {
  configuration: any;
  onUpdate: (settings: any) => void;
}

function DataGridSettings({ configuration, onUpdate }: DataGridSettingsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <Stack gap="xs">
      <Group justify="space-between">
        <Text size="sm" fw={500}>DataGrid Settings</Text>
        <Button
          variant="subtle"
          size="xs"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
        </Button>
      </Group>

      <Group>
        <Checkbox
          label="Enable Pagination"
          checked={configuration?.pagination?.enabled ?? true}
          onChange={(e) => onUpdate({
            pagination: { ...configuration?.pagination, enabled: e.target.checked }
          })}
        />
        
        <Checkbox
          label="Enable Filtering"
          checked={configuration?.filtering?.enabled ?? true}
          onChange={(e) => onUpdate({
            filtering: { ...configuration?.filtering, enabled: e.target.checked }
          })}
        />
        
        <Checkbox
          label="Enable Sorting"
          checked={configuration?.sorting?.enabled ?? true}
          onChange={(e) => onUpdate({
            sorting: { ...configuration?.sorting, enabled: e.target.checked }
          })}
        />
      </Group>

      {configuration?.pagination?.enabled && (
        <Select
          label="Page Size"
          value={configuration.pagination.pageSize?.toString() || '25'}
          onChange={(value) => onUpdate({
            pagination: { ...configuration.pagination, pageSize: parseInt(value || '25') }
          })}
          data={[
            { value: '10', label: '10 items' },
            { value: '25', label: '25 items' },
            { value: '50', label: '50 items' },
            { value: '100', label: '100 items' }
          ]}
          size="xs"
        />
      )}

      {showAdvanced && (
        <Stack gap="xs" p="xs" bg="gray.0">
          <Text size="xs" fw={500} color="dimmed">Advanced Settings</Text>
          
          <Group>
            <Checkbox
              label="Row Selection"
              checked={configuration?.selection?.enabled ?? false}
              onChange={(e) => onUpdate({
                selection: { ...configuration?.selection, enabled: e.target.checked }
              })}
              size="xs"
            />
            
            <Checkbox
              label="Row Highlighting"
              checked={configuration?.highlighting?.enabled ?? false}
              onChange={(e) => onUpdate({
                highlighting: { ...configuration?.highlighting, enabled: e.target.checked }
              })}
              size="xs"
            />
          </Group>

          <Select
            label="Density"
            value={configuration?.density || 'normal'}
            onChange={(value) => onUpdate({ density: value })}
            data={[
              { value: 'compact', label: 'Compact' },
              { value: 'normal', label: 'Normal' },
              { value: 'comfortable', label: 'Comfortable' }
            ]}
            size="xs"
          />
        </Stack>
      )}
    </Stack>
  );
}

interface FormConfigurationProps {
  component: LayoutEditorComponent;
  onUpdate: (config: ComponentConfiguration) => void;
  entities: Array<{ id: string; name: string; displayName: string; fields: any[] }>;
}

const FormConfiguration: React.FC<FormConfigurationProps> = ({ 
  component, 
  onUpdate, 
  entities 
}) => {
  const [selectedEntity, setSelectedEntity] = useState(
    component.configuration.form?.entityId || ''
  );

  const entity = entities.find(e => e.id === selectedEntity);
  const availableFields = entity?.fields || [];

  const handleEntityChange = (entityId: string) => {
    setSelectedEntity(entityId);
    const newConfig = {
      ...component.configuration,
      form: {
        entityId,
        fields: [],
        validation: component.configuration.form?.validation || { 
          clientSide: true, 
          serverSide: true, 
          realTime: true 
        },
        layout: component.configuration.form?.layout || 'single-column',
        submission: component.configuration.form?.submission || { action: 'create' }
      }
    };
    onUpdate(newConfig);
  };

  const addField = (fieldId: string) => {
    const field = availableFields.find(f => f.id === fieldId);
    if (!field) return;

    const fieldType = field.fieldType?.type || 'string';
    const inputType = getInputTypeForFieldType(fieldType);

    const newField = {
      id: generateId(),
      fieldId: field.id,
      label: field.displayName || field.name,
      type: inputType as FormFieldType,
      required: field.required || false,
      placeholder: '',
      helpText: '',
      validation: [],
      colSpan: 12
    };

    const currentFields = component.configuration.form?.fields || [];
    const newConfig = {
      ...component.configuration,
      form: {
        ...component.configuration.form,
        entityId: selectedEntity,
        fields: [...currentFields, newField],
        validation: component.configuration.form?.validation || { 
          clientSide: true, 
          serverSide: true, 
          realTime: true 
        },
        layout: component.configuration.form?.layout || 'single-column',
        submission: component.configuration.form?.submission || { action: 'create' }
      }
    };
    onUpdate(newConfig);
  };

  const removeField = (fieldId: string) => {
    const currentFields = component.configuration.form?.fields || [];
    const newConfig = {
      ...component.configuration,
      form: {
        entityId: component.configuration.form?.entityId || selectedEntity,
        fields: currentFields.filter(f => f.id !== fieldId),
        validation: component.configuration.form?.validation || { 
          clientSide: true, 
          serverSide: true, 
          realTime: true 
        },
        layout: component.configuration.form?.layout || 'single-column',
        submission: component.configuration.form?.submission || { action: 'create' }
      }
    };
    onUpdate(newConfig);
  };

  const updateField = (fieldId: string, updates: any) => {
    const currentFields = component.configuration.form?.fields || [];
    const newConfig = {
      ...component.configuration,
      form: {
        entityId: component.configuration.form?.entityId || selectedEntity,
        fields: currentFields.map(f => 
          f.id === fieldId ? { ...f, ...updates } : f
        ),
        validation: component.configuration.form?.validation || { 
          clientSide: true, 
          serverSide: true, 
          realTime: true 
        },
        layout: component.configuration.form?.layout || 'single-column',
        submission: component.configuration.form?.submission || { action: 'create' }
      }
    };
    onUpdate(newConfig);
  };

  const moveField = (fromIndex: number, toIndex: number) => {
    const currentFields = [...(component.configuration.form?.fields || [])];
    const [moved] = currentFields.splice(fromIndex, 1);
    currentFields.splice(toIndex, 0, moved);
    
    // Fields maintain their order by array position
    
    const newConfig = {
      ...component.configuration,
      form: {
        entityId: component.configuration.form?.entityId || selectedEntity,
        fields: currentFields,
        validation: component.configuration.form?.validation || { 
          clientSide: true, 
          serverSide: true, 
          realTime: true 
        },
        layout: component.configuration.form?.layout || 'single-column',
        submission: component.configuration.form?.submission || { action: 'create' }
      }
    };
    onUpdate(newConfig);
  };

  const updateFormSettings = (settings: any) => {
    const newConfig = {
      ...component.configuration,
      form: {
        ...component.configuration.form,
        ...settings
      }
    };
    onUpdate(newConfig);
  };

  const configuredFields = component.configuration.form?.fields || [];

  return (
    <Stack gap="md">
      <Select
        label="Entity"
        placeholder="Select an entity"
        value={selectedEntity}
        onChange={(value) => value && handleEntityChange(value)}
        data={entities.map(e => ({ value: e.id, label: `${e.displayName} (${e.name})` }))}
        data-testid="form-entity-select"
      />

      {selectedEntity && (
        <>
          <Stack gap="xs">
            <Text size="sm" fw={500}>Available Fields</Text>
            <Group gap="xs">
              {availableFields.map(field => (
                <Button
                  key={field.id}
                  variant="light"
                  size="xs"
                  onClick={() => addField(field.id)}
                  disabled={configuredFields.some(f => f.fieldId === field.id)}
                  data-testid={`add-field-${field.name}`}
                >
                  {field.displayName || field.name}
                </Button>
              ))}
            </Group>
          </Stack>

          {configuredFields.length > 0 && (
            <Stack gap="xs">
              <Text size="sm" fw={500}>Form Fields ({configuredFields.length})</Text>
              {configuredFields
                .map((field, index) => (
                <FormFieldConfiguration
                  key={field.id}
                  field={field}
                  index={index}
                  totalFields={configuredFields.length}
                  availableFields={availableFields}
                  onUpdate={(updates) => updateField(field.id, updates)}
                  onRemove={() => removeField(field.id)}
                  onMove={moveField}
                />
              ))}
            </Stack>
          )}

          <Divider />

          <FormSettings
            configuration={component.configuration.form}
            onUpdate={updateFormSettings}
          />
        </>
      )}
    </Stack>
  );
};

function getInputTypeForFieldType(fieldType: string): string {
  switch (fieldType) {
    case 'String': return 'text';
    case 'Int': return 'number';
    case 'Float': return 'number';
    case 'Boolean': return 'checkbox';
    case 'DateTime': return 'datetime-local';
    case 'Date': return 'date';
    case 'Time': return 'time';
    case 'Email': return 'email';
    case 'Phone': return 'tel';
    case 'URL': return 'url';
    case 'Password': return 'password';
    case 'Enum': return 'select';
    case 'Text': return 'textarea';
    default: return 'text';
  }
}

interface FormFieldConfigurationProps {
  field: any;
  index: number;
  totalFields: number;
  availableFields: any[];
  onUpdate: (updates: any) => void;
  onRemove: () => void;
  onMove: (fromIndex: number, toIndex: number) => void;
}

function FormFieldConfiguration({ 
  field, 
  index, 
  totalFields, 
  availableFields,
  onUpdate, 
  onRemove, 
  onMove 
}: FormFieldConfigurationProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const sourceField = availableFields.find(f => f.id === field.fieldId);
  const fieldType = sourceField?.fieldType?.type || 'String';

  return (
    <Card withBorder p="xs" data-testid={`form-field-config-${field.fieldId}`}>
      <Stack gap="xs">
        <Group justify="space-between">
          <Group gap="xs">
            <ActionIcon
              variant="subtle"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
            </ActionIcon>
            <Text size="sm" fw={500}>{field.label}</Text>
            <Badge size="xs" variant="light">{field.inputType}</Badge>
            {field.required && <Badge size="xs" color="red" variant="light">Required</Badge>}
          </Group>
          
          <Group gap="xs">
            <ActionIcon
              variant="subtle"
              size="sm"
              onClick={() => onMove(index, Math.max(0, index - 1))}
              disabled={index === 0}
            >
              <IconChevronUp size={14} />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              size="sm"
              onClick={() => onMove(index, Math.min(totalFields - 1, index + 1))}
              disabled={index === totalFields - 1}
            >
              <IconChevronDown size={14} />
            </ActionIcon>
            <ActionIcon
              color="red"
              variant="subtle"
              size="sm"
              onClick={onRemove}
            >
              <IconX size={14} />
            </ActionIcon>
          </Group>
        </Group>

        {isExpanded && (
          <Stack gap="xs" pl="lg">
            <Group grow>
              <TextInput
                label="Display Label"
                value={field.label}
                onChange={(e) => onUpdate({ label: e.target.value })}
                size="xs"
              />
              
              <Select
                label="Input Type"
                value={field.inputType}
                onChange={(value) => onUpdate({ inputType: value })}
                data={getInputTypeOptions(fieldType)}
                size="xs"
              />
            </Group>
            
            <Group grow>
              <TextInput
                label="Placeholder"
                value={field.placeholder || ''}
                onChange={(e) => onUpdate({ placeholder: e.target.value })}
                size="xs"
              />
              
              <NumberInput
                label="Width (columns)"
                value={field.colSpan || 12}
                onChange={(value) => onUpdate({ 
                  colSpan: typeof value === 'number' ? value : 12
                })}
                min={1}
                max={12}
                size="xs"
              />
            </Group>

            <TextInput
              label="Help Text"
              value={field.helpText || ''}
              onChange={(e) => onUpdate({ helpText: e.target.value })}
              size="xs"
            />

            <Group>
              <Checkbox
                label="Required"
                checked={field.required}
                onChange={(e) => onUpdate({ 
                  required: e.target.checked,
                  validation: { ...field.validation, required: e.target.checked }
                })}
                size="xs"
              />
            </Group>

            {fieldType === 'String' && (
              <Group grow>
                <NumberInput
                  label="Min Length"
                  value={field.validation?.minLength || 0}
                  onChange={(value) => onUpdate({ 
                    validation: { ...field.validation, minLength: value || 0 }
                  })}
                  min={0}
                  size="xs"
                />
                <NumberInput
                  label="Max Length"
                  value={field.validation?.maxLength || 255}
                  onChange={(value) => onUpdate({ 
                    validation: { ...field.validation, maxLength: value || 255 }
                  })}
                  min={1}
                  size="xs"
                />
              </Group>
            )}

            {['Int', 'Float'].includes(fieldType) && (
              <Group grow>
                <NumberInput
                  label="Min Value"
                  value={field.validation?.min}
                  onChange={(value) => onUpdate({ 
                    validation: { ...field.validation, min: value }
                  })}
                  size="xs"
                />
                <NumberInput
                  label="Max Value"
                  value={field.validation?.max}
                  onChange={(value) => onUpdate({ 
                    validation: { ...field.validation, max: value }
                  })}
                  size="xs"
                />
              </Group>
            )}

            {fieldType === 'String' && (
              <TextInput
                label="Pattern (RegEx)"
                value={field.validation?.pattern || ''}
                onChange={(e) => onUpdate({ 
                  validation: { ...field.validation, pattern: e.target.value || undefined }
                })}
                placeholder="^[a-zA-Z0-9]+$"
                size="xs"
              />
            )}
          </Stack>
        )}
      </Stack>
    </Card>
  );
}

function getInputTypeOptions(fieldType: string) {
  const baseOptions = [
    { value: 'text', label: 'Text Input' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'select', label: 'Select Dropdown' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'radio', label: 'Radio Group' }
  ];

  switch (fieldType) {
    case 'Int':
    case 'Float':
      return [
        { value: 'number', label: 'Number Input' },
        { value: 'range', label: 'Range Slider' },
        ...baseOptions
      ];
    case 'Boolean':
      return [
        { value: 'checkbox', label: 'Checkbox' },
        { value: 'switch', label: 'Switch' },
        { value: 'radio', label: 'Radio Group' }
      ];
    case 'DateTime':
      return [
        { value: 'datetime-local', label: 'Date & Time' },
        { value: 'date', label: 'Date Only' },
        { value: 'time', label: 'Time Only' },
        ...baseOptions
      ];
    case 'Date':
      return [
        { value: 'date', label: 'Date Picker' },
        ...baseOptions
      ];
    case 'Email':
      return [
        { value: 'email', label: 'Email Input' },
        ...baseOptions
      ];
    case 'Phone':
      return [
        { value: 'tel', label: 'Phone Input' },
        ...baseOptions
      ];
    case 'URL':
      return [
        { value: 'url', label: 'URL Input' },
        ...baseOptions
      ];
    case 'Password':
      return [
        { value: 'password', label: 'Password Input' },
        ...baseOptions
      ];
    case 'Enum':
      return [
        { value: 'select', label: 'Select Dropdown' },
        { value: 'radio', label: 'Radio Group' },
        { value: 'checkbox', label: 'Checkbox Group' },
        ...baseOptions
      ];
    default:
      return baseOptions;
  }
}

interface FormSettingsProps {
  configuration: any;
  onUpdate: (settings: any) => void;
}

function FormSettings({ configuration, onUpdate }: FormSettingsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <Stack gap="xs">
      <Group justify="space-between">
        <Text size="sm" fw={500}>Form Settings</Text>
        <Button
          variant="subtle"
          size="xs"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
        </Button>
      </Group>

      <Select
        label="Layout Style"
        value={configuration?.layout || 'single-column'}
        onChange={(value) => onUpdate({ layout: value })}
        data={[
          { value: 'single-column', label: 'Single Column' },
          { value: 'two-column', label: 'Two Columns' },
          { value: 'three-column', label: 'Three Columns' },
          { value: 'flexible', label: 'Flexible Grid' }
        ]}
        size="xs"
      />

      <Select
        label="Submit Action"
        value={configuration?.submission?.action || 'create'}
        onChange={(value) => onUpdate({
          submission: { ...configuration?.submission, action: value }
        })}
        data={[
          { value: 'create', label: 'Create New Record' },
          { value: 'update', label: 'Update Record' },
          { value: 'upsert', label: 'Create or Update' },
          { value: 'custom', label: 'Custom Action' }
        ]}
        size="xs"
      />

      <Group>
        <Checkbox
          label="Client-side Validation"
          checked={configuration?.validation?.clientSide ?? true}
          onChange={(e) => onUpdate({
            validation: { ...configuration?.validation, clientSide: e.target.checked }
          })}
          size="xs"
        />
        
        <Checkbox
          label="Server-side Validation"
          checked={configuration?.validation?.serverSide ?? true}
          onChange={(e) => onUpdate({
            validation: { ...configuration?.validation, serverSide: e.target.checked }
          })}
          size="xs"
        />
        
        <Checkbox
          label="Real-time Validation"
          checked={configuration?.validation?.realTime ?? true}
          onChange={(e) => onUpdate({
            validation: { ...configuration?.validation, realTime: e.target.checked }
          })}
          size="xs"
        />
      </Group>

      {showAdvanced && (
        <Stack gap="xs" p="xs" bg="gray.0">
          <Text size="xs" fw={500} color="dimmed">Advanced Settings</Text>
          
          <Group>
            <Checkbox
              label="Auto-save Draft"
              checked={configuration?.autoSave?.enabled ?? false}
              onChange={(e) => onUpdate({
                autoSave: { ...configuration?.autoSave, enabled: e.target.checked }
              })}
              size="xs"
            />
            
            <Checkbox
              label="Show Progress"
              checked={configuration?.progress?.enabled ?? false}
              onChange={(e) => onUpdate({
                progress: { ...configuration?.progress, enabled: e.target.checked }
              })}
              size="xs"
            />
          </Group>

          {configuration?.autoSave?.enabled && (
            <NumberInput
              label="Auto-save Interval (seconds)"
              value={configuration?.autoSave?.interval || 30}
              onChange={(value) => onUpdate({
                autoSave: { ...configuration?.autoSave, interval: value || 30 }
              })}
              min={5}
              max={300}
              size="xs"
            />
          )}

          <TextInput
            label="Success Message"
            value={configuration?.messages?.success || ''}
            onChange={(e) => onUpdate({
              messages: { ...configuration?.messages, success: e.target.value }
            })}
            placeholder="Record saved successfully"
            size="xs"
          />

          <TextInput
            label="Error Message"
            value={configuration?.messages?.error || ''}
            onChange={(e) => onUpdate({
              messages: { ...configuration?.messages, error: e.target.value }
            })}
            placeholder="Failed to save record"
            size="xs"
          />
        </Stack>
      )}
    </Stack>
  );
}

export const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  component,
  onUpdate,
  onValidate,
  entities = []
}) => {
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  const handleUpdate = useCallback((componentId: string, configuration: ComponentConfiguration) => {
    onUpdate?.(componentId, configuration);
  }, [onUpdate]);

  const handleConfigurationUpdate = useCallback((configuration: ComponentConfiguration) => {
    if (component) {
      handleUpdate(component.id, configuration);
    }
  }, [component, handleUpdate]);

  const handleValidation = useCallback(async () => {
    if (!component || !onValidate) return;
    
    setIsValidating(true);
    try {
      const results = await onValidate(component);
      setValidationResults(results);
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setIsValidating(false);
    }
  }, [component, onValidate]);

  React.useEffect(() => {
    if (component) {
      handleValidation();
    }
  }, [component, handleValidation]);

  if (!component) {
    return (
      <Card withBorder radius="md" h="100%" p="md">
        <Stack align="center" justify="center" h="100%">
          <IconSettings size={48} color="var(--mantine-color-gray-4)" />
          <Text color="dimmed" ta="center">
            Select a component to configure its properties
          </Text>
        </Stack>
      </Card>
    );
  }

  const hasErrors = validationResults.some(r => r.severity === 'error');
  const hasWarnings = validationResults.some(r => r.severity === 'warning');

  return (
    <Card withBorder radius="md" h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
      <Card.Section p="md" withBorder>
        <Group justify="space-between">
          <Stack gap={4}>
            <Text size="lg" fw={600}>
              Component Configuration
            </Text>
            <Group gap="xs">
              <Badge variant="light">{component.type}</Badge>
              {hasErrors && <Badge color="red" variant="light">Errors</Badge>}
              {hasWarnings && <Badge color="yellow" variant="light">Warnings</Badge>}
            </Group>
          </Stack>
        </Group>
      </Card.Section>

      <ScrollArea flex={1}>
        <Stack gap="md" p="md">
          {(hasErrors || hasWarnings) && (
            <Alert
              icon={hasErrors ? <IconAlertCircle size={16} /> : undefined}
              color={hasErrors ? 'red' : 'yellow'}
              title={hasErrors ? 'Configuration Errors' : 'Configuration Warnings'}
            >
              <Stack gap="xs">
                {validationResults.map((result, index) => (
                  <Text key={index} size="sm">
                    {result.field}: {result.message}
                  </Text>
                ))}
              </Stack>
            </Alert>
          )}

          <Tabs defaultValue="basic">
            <Tabs.List>
              <Tabs.Tab value="basic" leftSection={<IconSettings size={14} />}>
                Basic
              </Tabs.Tab>
              <Tabs.Tab value="styling" leftSection={<IconPalette size={14} />}>
                Styling
              </Tabs.Tab>
              {component.type === 'DataGrid' && (
                <Tabs.Tab value="datagrid" leftSection={<IconDatabase size={14} />}>
                  Data Grid
                </Tabs.Tab>
              )}
              {component.type === 'TorqueForm' && (
                <Tabs.Tab value="form" leftSection={<IconDatabase size={14} />}>
                  Form
                </Tabs.Tab>
              )}
            </Tabs.List>

            <Tabs.Panel value="basic" pt="md">
              <BasicConfiguration
                component={component}
                onUpdate={handleConfigurationUpdate}
              />
            </Tabs.Panel>

            <Tabs.Panel value="styling" pt="md">
              <Text size="sm" color="dimmed">
                Advanced styling options coming soon...
              </Text>
            </Tabs.Panel>

            {component.type === 'DataGrid' && (
              <Tabs.Panel value="datagrid" pt="md">
                <DataGridConfiguration
                  component={component}
                  onUpdate={handleConfigurationUpdate}
                  entities={entities}
                />
              </Tabs.Panel>
            )}

            {component.type === 'TorqueForm' && (
              <Tabs.Panel value="form" pt="md">
                <FormConfiguration
                  component={component}
                  onUpdate={handleConfigurationUpdate}
                  entities={entities}
                />
              </Tabs.Panel>
            )}
          </Tabs>
        </Stack>
      </ScrollArea>

      <Card.Section p="md" withBorder>
        <Group justify="space-between">
          <Group gap="xs">
            {validationResults.length === 0 && (
              <Group gap="xs">
                <IconCheck size={16} color="var(--mantine-color-green-6)" />
                <Text size="sm" color="green">Valid configuration</Text>
              </Group>
            )}
          </Group>
          
          <Button
            size="sm"
            variant="light"
            loading={isValidating}
            onClick={handleValidation}
          >
            Validate
          </Button>
        </Group>
      </Card.Section>
    </Card>
  );
};