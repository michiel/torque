# Torque Phase 3A Implementation: Enhanced Model Editor & Developer Experience

## Overview

Phase 3A focuses on enhancing the Model Editor with a comprehensive visual layout editor and improving developer experience through comprehensive testing and component documentation. This phase builds upon the solid foundation established in Phases 1-3.

## Key Features

### 1. Visual Layout Editor
- Drag-and-drop component placement with real-time preview
- Inline component configuration without view switching
- DataGrid and Form editors with entity binding
- Configuration validation against entity schemas
- Extensible component system with plugin architecture

### 2. Enhanced Developer Experience
- Comprehensive Storybook documentation for all components
- End-to-end Playwright test coverage
- Data import/export functionality
- Performance monitoring and optimization

---

## Technical Architecture

### Layout Editor System

```typescript
// Layout Editor Core Types
interface LayoutEditorComponent {
  id: string;
  type: ComponentType;
  position: GridPosition;
  configuration: ComponentConfiguration;
  entityBinding?: EntityBinding;
  validation: ValidationResult[];
}

interface GridPosition {
  row: number;
  column: number;
  rowSpan: number;
  colSpan: number;
}

interface ComponentConfiguration {
  // Base configuration
  styling: ComponentStyling;
  responsive: ResponsiveConfig;
  
  // Component-specific configuration
  dataGrid?: DataGridConfig;
  form?: FormConfig;
  button?: ButtonConfig;
  text?: TextConfig;
  container?: ContainerConfig;
}

interface DataGridConfig {
  entityId: string;
  columns: ColumnConfiguration[];
  pagination: PaginationConfig;
  filtering: FilterConfig;
  sorting: SortConfig;
  actions: GridAction[];
}

interface FormConfig {
  entityId: string;
  fields: FormFieldConfiguration[];
  validation: ValidationRuleSet;
  layout: FormLayout;
  submission: SubmissionConfig;
}
```

### Component Plugin System

```typescript
// Plugin Architecture for Extensible Components
interface ComponentPlugin {
  type: string;
  name: string;
  version: string;
  configurationSchema: JSONSchema;
  renderFunction: ComponentRenderFunction;
  editorComponent: ComponentEditorComponent;
}

interface ComponentRegistry {
  registerComponent(plugin: ComponentPlugin): void;
  getComponent(type: string): ComponentPlugin | null;
  listComponents(): ComponentPlugin[];
  validateConfiguration(type: string, config: any): ValidationResult;
}

// Runtime Component Loading
class RuntimeComponentLoader {
  private registry: Map<string, ComponentPlugin> = new Map();
  
  async loadComponent(url: string): Promise<ComponentPlugin> {
    // Dynamic import for runtime component loading
    const module = await import(url);
    const plugin = module.default as ComponentPlugin;
    this.registry.set(plugin.type, plugin);
    return plugin;
  }
}
```

### Layout Editor Implementation

```typescript
// Layout Editor Main Component
export const LayoutEditor: React.FC<LayoutEditorProps> = ({
  modelId,
  layoutId,
  onSave,
  onPreview
}) => {
  const [components, setComponents] = useState<LayoutEditorComponent[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [draggedComponent, setDraggedComponent] = useState<ComponentType | null>(null);

  // Component palette with available components
  const componentPalette = [
    { type: 'DataGrid', icon: 'table', label: 'Data Grid' },
    { type: 'TorqueForm', icon: 'form', label: 'Form' },
    { type: 'TorqueButton', icon: 'button', label: 'Button' },
    { type: 'Text', icon: 'text', label: 'Text' },
    { type: 'Container', icon: 'container', label: 'Container' },
    { type: 'Modal', icon: 'modal', label: 'Modal' }
  ];

  // Drag and drop handlers
  const handleDragStart = (componentType: ComponentType) => {
    setDraggedComponent(componentType);
  };

  const handleDrop = (position: GridPosition) => {
    if (!draggedComponent) return;
    
    const newComponent: LayoutEditorComponent = {
      id: generateId(),
      type: draggedComponent,
      position,
      configuration: getDefaultConfiguration(draggedComponent),
      validation: []
    };
    
    setComponents(prev => [...prev, newComponent]);
    setDraggedComponent(null);
  };

  // Real-time validation
  const validateComponent = useCallback(async (component: LayoutEditorComponent) => {
    const validation = await validateComponentConfiguration(
      component.type,
      component.configuration,
      component.entityBinding
    );
    return validation;
  }, []);

  return (
    <div className="layout-editor">
      <ComponentPalette
        components={componentPalette}
        onDragStart={handleDragStart}
      />
      
      <LayoutCanvas
        components={components}
        onDrop={handleDrop}
        onSelect={setSelectedComponent}
        selectedComponent={selectedComponent}
      />
      
      <ConfigurationPanel
        component={components.find(c => c.id === selectedComponent)}
        onUpdate={(id, config) => updateComponentConfiguration(id, config)}
        onValidate={validateComponent}
      />
      
      <PreviewPanel
        layout={{ components }}
        modelId={modelId}
      />
    </div>
  );
};
```

### DataGrid Configuration Editor

```typescript
// DataGrid Configuration Component
export const DataGridConfigEditor: React.FC<DataGridConfigProps> = ({
  config,
  entityId,
  onChange,
  onValidate
}) => {
  const [entities] = useEntities();
  const [selectedEntity, setSelectedEntity] = useState(entityId);
  const [columns, setColumns] = useState<ColumnConfiguration[]>(config.columns || []);
  
  const entity = entities.find(e => e.id === selectedEntity);
  const availableFields = entity?.fields || [];

  const addColumn = (field: EntityField) => {
    const newColumn: ColumnConfiguration = {
      id: generateId(),
      fieldId: field.id,
      label: field.displayName,
      type: field.fieldType,
      sortable: true,
      filterable: true,
      width: 'auto',
      alignment: 'left'
    };
    
    setColumns(prev => [...prev, newColumn]);
    onChange({ ...config, columns: [...columns, newColumn] });
  };

  const updateColumn = (columnId: string, updates: Partial<ColumnConfiguration>) => {
    const updatedColumns = columns.map(col => 
      col.id === columnId ? { ...col, ...updates } : col
    );
    setColumns(updatedColumns);
    onChange({ ...config, columns: updatedColumns });
  };

  return (
    <Stack gap="md">
      <Select
        label="Entity"
        value={selectedEntity}
        onChange={setSelectedEntity}
        data={entities.map(e => ({ value: e.id, label: e.displayName }))}
      />
      
      <Card withBorder>
        <Text fw={500} mb="sm">Available Fields</Text>
        <SimpleGrid cols={2} spacing="xs">
          {availableFields.map(field => (
            <Button
              key={field.id}
              variant="light"
              size="sm"
              onClick={() => addColumn(field)}
            >
              {field.displayName}
            </Button>
          ))}
        </SimpleGrid>
      </Card>
      
      <Card withBorder>
        <Text fw={500} mb="sm">Configured Columns</Text>
        <DragDropContext onDragEnd={handleColumnReorder}>
          <Droppable droppableId="columns">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {columns.map((column, index) => (
                  <Draggable key={column.id} draggableId={column.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <ColumnConfigurationRow
                          column={column}
                          onUpdate={(updates) => updateColumn(column.id, updates)}
                          onRemove={() => removeColumn(column.id)}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </Card>
      
      <ConfigurationTabs
        tabs={[
          { label: 'Pagination', content: <PaginationConfig config={config.pagination} onChange={onChange} /> },
          { label: 'Filtering', content: <FilterConfig config={config.filtering} onChange={onChange} /> },
          { label: 'Actions', content: <ActionsConfig config={config.actions} onChange={onChange} /> }
        ]}
      />
    </Stack>
  );
};
```

### Form Configuration Editor

```typescript
// Form Configuration Component
export const FormConfigEditor: React.FC<FormConfigProps> = ({
  config,
  entityId,
  onChange,
  onValidate
}) => {
  const [entities] = useEntities();
  const [selectedEntity, setSelectedEntity] = useState(entityId);
  const [fields, setFields] = useState<FormFieldConfiguration[]>(config.fields || []);
  const [layout, setLayout] = useState<FormLayout>(config.layout || 'single-column');
  
  const entity = entities.find(e => e.id === selectedEntity);
  const availableFields = entity?.fields || [];

  const addField = (entityField: EntityField) => {
    const newField: FormFieldConfiguration = {
      id: generateId(),
      fieldId: entityField.id,
      label: entityField.displayName,
      type: mapFieldTypeToFormComponent(entityField.fieldType),
      required: entityField.required,
      validation: entityField.validation,
      placeholder: `Enter ${entityField.displayName.toLowerCase()}`,
      helpText: entityField.description,
      colSpan: 1
    };
    
    setFields(prev => [...prev, newField]);
    onChange({ ...config, fields: [...fields, newField] });
  };

  const updateField = (fieldId: string, updates: Partial<FormFieldConfiguration>) => {
    const updatedFields = fields.map(field => 
      field.id === fieldId ? { ...field, ...updates } : field
    );
    setFields(updatedFields);
    onChange({ ...config, fields: updatedFields });
  };

  return (
    <Stack gap="md">
      <Select
        label="Entity"
        value={selectedEntity}
        onChange={setSelectedEntity}
        data={entities.map(e => ({ value: e.id, label: e.displayName }))}
      />
      
      <SegmentedControl
        label="Form Layout"
        value={layout}
        onChange={setLayout}
        data={[
          { label: 'Single Column', value: 'single-column' },
          { label: 'Two Columns', value: 'two-columns' },
          { label: 'Custom Grid', value: 'custom-grid' }
        ]}
      />
      
      <FormFieldPalette
        availableFields={availableFields}
        onAddField={addField}
      />
      
      <FormFieldList
        fields={fields}
        layout={layout}
        onUpdateField={updateField}
        onRemoveField={removeField}
        onReorderFields={reorderFields}
      />
      
      <FormPreview
        fields={fields}
        layout={layout}
        entity={entity}
      />
    </Stack>
  );
};
```

---

## Testing Infrastructure

### Playwright E2E Test Framework

```typescript
// tests/layout-editor.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Layout Editor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/models/test-model/layouts/new');
    await page.waitForSelector('[data-testid="layout-editor"]');
  });

  test('should create a new layout with DataGrid component', async ({ page }) => {
    // Drag DataGrid from palette to canvas
    await page.dragAndDrop(
      '[data-testid="component-palette-datagrid"]',
      '[data-testid="layout-canvas-grid-0-0"]'
    );
    
    // Verify component was added
    await expect(page.locator('[data-testid="component-datagrid-0"]')).toBeVisible();
    
    // Configure DataGrid
    await page.click('[data-testid="component-datagrid-0"]');
    await page.selectOption('[data-testid="datagrid-entity-select"]', 'customer');
    
    // Add columns
    await page.click('[data-testid="add-column-first_name"]');
    await page.click('[data-testid="add-column-last_name"]');
    await page.click('[data-testid="add-column-email"]');
    
    // Verify columns were added
    await expect(page.locator('[data-testid="column-first_name"]')).toBeVisible();
    await expect(page.locator('[data-testid="column-last_name"]')).toBeVisible();
    await expect(page.locator('[data-testid="column-email"]')).toBeVisible();
    
    // Save layout
    await page.click('[data-testid="save-layout"]');
    
    // Verify save success
    await expect(page.locator('[data-testid="save-success-notification"]')).toBeVisible();
  });

  test('should validate form configuration', async ({ page }) => {
    // Add form component
    await page.dragAndDrop(
      '[data-testid="component-palette-form"]',
      '[data-testid="layout-canvas-grid-0-0"]'
    );
    
    // Select form component
    await page.click('[data-testid="component-form-0"]');
    
    // Try to save without entity selection (should show validation error)
    await page.click('[data-testid="save-layout"]');
    await expect(page.locator('[data-testid="validation-error-entity-required"]')).toBeVisible();
    
    // Select entity
    await page.selectOption('[data-testid="form-entity-select"]', 'customer');
    
    // Add required fields
    await page.click('[data-testid="add-field-first_name"]');
    await page.click('[data-testid="add-field-email"]');
    
    // Save should now succeed
    await page.click('[data-testid="save-layout"]');
    await expect(page.locator('[data-testid="save-success-notification"]')).toBeVisible();
  });

  test('should preview layout in real-time', async ({ page }) => {
    // Add multiple components
    await page.dragAndDrop(
      '[data-testid="component-palette-text"]',
      '[data-testid="layout-canvas-grid-0-0"]'
    );
    
    await page.dragAndDrop(
      '[data-testid="component-palette-datagrid"]',
      '[data-testid="layout-canvas-grid-1-0"]'
    );
    
    // Open preview panel
    await page.click('[data-testid="preview-panel-toggle"]');
    
    // Verify components appear in preview
    await expect(page.locator('[data-testid="preview-text-component"]')).toBeVisible();
    await expect(page.locator('[data-testid="preview-datagrid-component"]')).toBeVisible();
    
    // Test responsive preview
    await page.click('[data-testid="preview-mobile"]');
    await expect(page.locator('[data-testid="preview-container"]')).toHaveClass(/mobile/);
    
    await page.click('[data-testid="preview-tablet"]');
    await expect(page.locator('[data-testid="preview-container"]')).toHaveClass(/tablet/);
    
    await page.click('[data-testid="preview-desktop"]');
    await expect(page.locator('[data-testid="preview-container"]')).toHaveClass(/desktop/);
  });
});

// tests/data-import-export.spec.ts
test.describe('Data Import/Export', () => {
  test('should export complete model data', async ({ page }) => {
    await page.goto('/models/customer-order');
    
    // Start export
    await page.click('[data-testid="export-model-button"]');
    await page.selectOption('[data-testid="export-format"]', 'json');
    await page.check('[data-testid="include-sample-data"]');
    
    // Download and verify file
    const download = await Promise.all([
      page.waitForEvent('download'),
      page.click('[data-testid="download-export"]')
    ]);
    
    const downloadedFile = download[0];
    expect(downloadedFile.suggestedFilename()).toBe('customer-order-model.json');
    
    // Verify file contents
    const path = await downloadedFile.path();
    const content = await fs.readFile(path, 'utf-8');
    const modelData = JSON.parse(content);
    
    expect(modelData.name).toBe('Customer Order Management');
    expect(modelData.entities).toHaveLength(2);
    expect(modelData.relationships).toHaveLength(1);
    expect(modelData.sample_data).toBeDefined();
  });

  test('should import model with validation', async ({ page }) => {
    await page.goto('/models/import');
    
    // Upload invalid model file
    await page.setInputFiles('[data-testid="file-input"]', 'tests/fixtures/invalid-model.json');
    
    // Verify validation errors
    await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-missing-entities"]')).toBeVisible();
    
    // Upload valid model file
    await page.setInputFiles('[data-testid="file-input"]', 'tests/fixtures/valid-model.json');
    
    // Complete import
    await page.click('[data-testid="import-model-button"]');
    
    // Verify success
    await expect(page.locator('[data-testid="import-success"]')).toBeVisible();
    
    // Verify imported model appears in list
    await page.goto('/models');
    await expect(page.locator('[data-testid="model-imported-test"]')).toBeVisible();
  });
});
```

### Component Test Coverage

```typescript
// tests/components/layout-editor-components.spec.ts
test.describe('Layout Editor Components', () => {
  test('ComponentPalette should render all available components', async ({ page }) => {
    await page.goto('/storybook/?path=/story/layout-editor--component-palette');
    
    // Verify all component types are present
    const expectedComponents = [
      'DataGrid', 'TorqueForm', 'TorqueButton', 'Text', 'Container', 'Modal'
    ];
    
    for (const component of expectedComponents) {
      await expect(page.locator(`[data-testid="palette-${component.toLowerCase()}"]`)).toBeVisible();
    }
  });

  test('DataGridConfigEditor should validate column configuration', async ({ page }) => {
    await page.goto('/storybook/?path=/story/layout-editor--datagrid-config-editor');
    
    // Test column addition
    await page.selectOption('[data-testid="entity-select"]', 'customer');
    await page.click('[data-testid="add-column-first_name"]');
    
    // Verify column appears in configuration
    await expect(page.locator('[data-testid="column-config-first_name"]')).toBeVisible();
    
    // Test column configuration
    await page.fill('[data-testid="column-width-first_name"]', '200px');
    await page.selectOption('[data-testid="column-alignment-first_name"]', 'center');
    
    // Verify configuration is updated
    const config = await page.evaluate(() => window.componentConfig);
    expect(config.columns[0].width).toBe('200px');
    expect(config.columns[0].alignment).toBe('center');
  });
});
```

---

## Data Import/Export System

### Backend API Extensions

```rust
// Backend API for import/export
#[derive(Debug, Serialize, Deserialize)]
pub struct ModelExportRequest {
    pub model_id: Uuid,
    pub include_sample_data: bool,
    pub include_entity_instances: bool,
    pub format: ExportFormat,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum ExportFormat {
    Json,
    Yaml,
    JsonCompressed,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ModelImportRequest {
    pub data: String,
    pub format: ExportFormat,
    pub validation_mode: ValidationMode,
    pub conflict_resolution: ConflictResolution,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum ValidationMode {
    Strict,      // Fail on any validation error
    Lenient,     // Warning on non-critical errors
    FixErrors,   // Attempt to fix common errors
}

#[derive(Debug, Serialize, Deserialize)]
pub enum ConflictResolution {
    Fail,        // Fail on any conflict
    Skip,        // Skip conflicting items
    Overwrite,   // Overwrite existing items
    Merge,       // Attempt to merge changes
}

impl ModelService {
    pub async fn export_model_complete(
        &self,
        request: ModelExportRequest
    ) -> Result<ModelExportData, Error> {
        let model = self.get_model(request.model_id).await?
            .ok_or_else(|| Error::NotFound("Model not found".to_string()))?;
        
        let mut export_data = ModelExportData {
            model: model.clone(),
            sample_data: None,
            entity_instances: None,
            metadata: ExportMetadata {
                exported_at: Utc::now(),
                torque_version: env!("CARGO_PKG_VERSION").to_string(),
                format: request.format,
            },
        };
        
        if request.include_sample_data {
            export_data.sample_data = Some(self.get_sample_data(request.model_id).await?);
        }
        
        if request.include_entity_instances {
            export_data.entity_instances = Some(
                self.get_entity_instances(request.model_id).await?
            );
        }
        
        Ok(export_data)
    }
    
    pub async fn import_model_complete(
        &self,
        request: ModelImportRequest
    ) -> Result<ModelImportResult, Error> {
        // Parse and validate import data
        let import_data: ModelExportData = match request.format {
            ExportFormat::Json | ExportFormat::JsonCompressed => {
                serde_json::from_str(&request.data)
                    .map_err(|e| Error::InvalidInput(format!("JSON parse error: {}", e)))?
            }
            ExportFormat::Yaml => {
                serde_yaml::from_str(&request.data)
                    .map_err(|e| Error::InvalidInput(format!("YAML parse error: {}", e)))?
            }
        };
        
        // Validate model structure
        let validation_result = self.validate_import_data(&import_data, &request.validation_mode).await?;
        
        if !validation_result.is_valid && request.validation_mode == ValidationMode::Strict {
            return Err(Error::ValidationFailed(validation_result.errors));
        }
        
        // Handle conflicts
        let existing_model = self.get_model_by_name(&import_data.model.name).await?;
        if existing_model.is_some() {
            match request.conflict_resolution {
                ConflictResolution::Fail => {
                    return Err(Error::Conflict("Model with this name already exists".to_string()));
                }
                ConflictResolution::Skip => {
                    return Ok(ModelImportResult {
                        model_id: existing_model.unwrap().id,
                        status: ImportStatus::Skipped,
                        warnings: validation_result.warnings,
                        errors: vec![],
                    });
                }
                ConflictResolution::Overwrite => {
                    self.delete_model(existing_model.unwrap().id).await?;
                }
                ConflictResolution::Merge => {
                    return self.merge_models(existing_model.unwrap(), import_data.model).await;
                }
            }
        }
        
        // Create model
        let model_id = self.create_model_from_import(import_data.model).await?;
        
        // Import sample data if provided
        if let Some(sample_data) = import_data.sample_data {
            self.import_sample_data(model_id, sample_data).await?;
        }
        
        // Import entity instances if provided
        if let Some(entity_instances) = import_data.entity_instances {
            self.import_entity_instances(model_id, entity_instances).await?;
        }
        
        Ok(ModelImportResult {
            model_id,
            status: ImportStatus::Success,
            warnings: validation_result.warnings,
            errors: vec![],
        })
    }
}
```

### Frontend Import/Export UI

```typescript
// Import/Export UI Components
export const ModelExportDialog: React.FC<ModelExportDialogProps> = ({
  modelId,
  opened,
  onClose
}) => {
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    format: 'json',
    includeSampleData: true,
    includeEntityInstances: false,
    compressed: false
  });
  
  const [exportMutation] = useMutation(EXPORT_MODEL_MUTATION);
  
  const handleExport = async () => {
    try {
      const result = await exportMutation({
        variables: {
          modelId,
          config: exportConfig
        }
      });
      
      const exportData = result.data.exportModel;
      const filename = `${exportData.model.name}-${exportData.metadata.exportedAt}.${exportConfig.format}`;
      
      // Trigger download
      const blob = new Blob([exportData.content], { 
        type: exportConfig.format === 'json' ? 'application/json' : 'application/x-yaml' 
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      
      notifications.show({
        title: 'Export Complete',
        message: `Model exported as ${filename}`,
        color: 'green'
      });
      
      onClose();
    } catch (error) {
      notifications.show({
        title: 'Export Failed',
        message: error.message,
        color: 'red'
      });
    }
  };
  
  return (
    <Modal opened={opened} onClose={onClose} title="Export Model">
      <Stack gap="md">
        <Select
          label="Format"
          value={exportConfig.format}
          onChange={(value) => setExportConfig(prev => ({ ...prev, format: value }))}
          data={[
            { value: 'json', label: 'JSON' },
            { value: 'yaml', label: 'YAML' },
            { value: 'json-compressed', label: 'JSON (Compressed)' }
          ]}
        />
        
        <Checkbox
          label="Include Sample Data"
          checked={exportConfig.includeSampleData}
          onChange={(event) => setExportConfig(prev => ({ 
            ...prev, 
            includeSampleData: event.currentTarget.checked 
          }))}
        />
        
        <Checkbox
          label="Include Entity Instances"
          checked={exportConfig.includeEntityInstances}
          onChange={(event) => setExportConfig(prev => ({ 
            ...prev, 
            includeEntityInstances: event.currentTarget.checked 
          }))}
        />
        
        <Group justify="flex-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleExport}>Export</Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export const ModelImportPage: React.FC = () => {
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importConfig, setImportConfig] = useState<ImportConfig>({
    validationMode: 'strict',
    conflictResolution: 'fail'
  });
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  
  const [importMutation] = useMutation(IMPORT_MODEL_MUTATION);
  const [validateMutation] = useMutation(VALIDATE_IMPORT_MUTATION);
  
  const handleFileSelect = async (file: File) => {
    setImportFile(file);
    
    // Auto-validate file
    const content = await file.text();
    try {
      const result = await validateMutation({
        variables: {
          data: content,
          format: file.name.endsWith('.yaml') ? 'yaml' : 'json'
        }
      });
      setValidationResult(result.data.validateImport);
    } catch (error) {
      setValidationResult({
        isValid: false,
        errors: [error.message],
        warnings: []
      });
    }
  };
  
  const handleImport = async () => {
    if (!importFile) return;
    
    const content = await importFile.text();
    try {
      const result = await importMutation({
        variables: {
          data: content,
          format: importFile.name.endsWith('.yaml') ? 'yaml' : 'json',
          config: importConfig
        }
      });
      
      const importResult = result.data.importModel;
      
      notifications.show({
        title: 'Import Complete',
        message: `Model imported successfully: ${importResult.modelId}`,
        color: 'green'
      });
      
      // Navigate to imported model
      window.location.href = `/models/${importResult.modelId}`;
    } catch (error) {
      notifications.show({
        title: 'Import Failed',
        message: error.message,
        color: 'red'
      });
    }
  };
  
  return (
    <Container size="md">
      <Stack gap="lg">
        <Title order={2}>Import Model</Title>
        
        <Dropzone
          onDrop={(files) => handleFileSelect(files[0])}
          accept={['application/json', 'text/yaml']}
          maxFiles={1}
        >
          <Text ta="center">Drop model file here or click to select</Text>
        </Dropzone>
        
        {importFile && (
          <Card withBorder>
            <Text fw={500}>Selected File: {importFile.name}</Text>
            <Text size="sm" c="dimmed">Size: {(importFile.size / 1024).toFixed(2)} KB</Text>
          </Card>
        )}
        
        {validationResult && (
          <ValidationResultDisplay result={validationResult} />
        )}
        
        <ImportConfigurationForm
          config={importConfig}
          onChange={setImportConfig}
        />
        
        <Group justify="flex-end">
          <Button
            onClick={handleImport}
            disabled={!importFile || (!validationResult?.isValid && importConfig.validationMode === 'strict')}
          >
            Import Model
          </Button>
        </Group>
      </Stack>
    </Container>
  );
};
```

---

## Comprehensive Storybook Documentation

### Enhanced Storybook Configuration

```typescript
// .storybook/main.ts (Enhanced)
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: [
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../src/**/*.story.@(js|jsx|mjs|ts|tsx)'
  ],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-links',
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-viewport',
    '@storybook/addon-backgrounds',
    '@storybook/addon-measure',
    '@storybook/addon-outline'
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  features: {
    buildStoriesJson: true,
    interactionsDebugger: true,
  },
  docs: {
    autodocs: 'tag',
    defaultName: 'Documentation'
  }
};

export default config;
```

### Component Stories

```typescript
// src/stories/LayoutEditor.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { LayoutEditor } from '../components/LayoutEditor';
import { MockProviders } from './decorators/MockProviders';

const meta: Meta<typeof LayoutEditor> = {
  title: 'Layout Editor/Main Editor',
  component: LayoutEditor,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'The main layout editor component that allows drag-and-drop design of TorqueApp interfaces.'
      }
    }
  },
  decorators: [MockProviders],
  argTypes: {
    modelId: {
      control: 'text',
      description: 'The ID of the model being edited'
    },
    layoutId: {
      control: 'text',
      description: 'The ID of the layout being edited (optional for new layouts)'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const EmptyCanvas: Story = {
  args: {
    modelId: 'customer-order-model',
    layoutId: undefined
  },
  parameters: {
    docs: {
      description: {
        story: 'An empty layout editor canvas ready for component placement.'
      }
    }
  }
};

export const WithComponents: Story = {
  args: {
    modelId: 'customer-order-model',
    layoutId: 'customer-dashboard'
  },
  parameters: {
    docs: {
      description: {
        story: 'Layout editor with pre-configured components showing the editing interface.'
      }
    }
  }
};

export const DataGridConfiguration: Story = {
  args: {
    modelId: 'customer-order-model',
    layoutId: 'customer-dashboard',
    selectedComponent: 'datagrid-customers'
  },
  parameters: {
    docs: {
      description: {
        story: 'Layout editor showing the DataGrid configuration panel.'
      }
    }
  }
};

// src/stories/DataGridConfigEditor.stories.tsx
export const DataGridConfigEditor_Stories: Meta<typeof DataGridConfigEditor> = {
  title: 'Layout Editor/DataGrid Config',
  component: DataGridConfigEditor,
  decorators: [MockProviders],
  parameters: {
    docs: {
      description: {
        component: 'Configuration editor for DataGrid components with entity binding and column management.'
      }
    }
  }
};

export const BasicConfiguration: StoryObj<typeof DataGridConfigEditor> = {
  args: {
    entityId: 'customer',
    config: {
      columns: [],
      pagination: { enabled: true, pageSize: 25 },
      filtering: { enabled: true },
      sorting: { enabled: true, defaultSort: null }
    }
  }
};

export const FullyConfigured: StoryObj<typeof DataGridConfigEditor> = {
  args: {
    entityId: 'customer',
    config: {
      columns: [
        {
          id: 'col-1',
          fieldId: 'first_name',
          label: 'First Name',
          type: 'string',
          sortable: true,
          filterable: true,
          width: '150px'
        },
        {
          id: 'col-2',
          fieldId: 'last_name',
          label: 'Last Name',
          type: 'string',
          sortable: true,
          filterable: true,
          width: '150px'
        },
        {
          id: 'col-3',
          fieldId: 'email',
          label: 'Email',
          type: 'string',
          sortable: true,
          filterable: true,
          width: '200px'
        }
      ],
      pagination: { enabled: true, pageSize: 25 },
      filtering: { enabled: true },
      sorting: { enabled: true, defaultSort: { field: 'last_name', direction: 'asc' } }
    }
  }
};
```

### Interactive Story Testing

```typescript
// src/stories/interactions/LayoutEditorInteractions.stories.tsx
import { within, userEvent, expect } from '@storybook/test';

export const DragAndDropComponent: Story = {
  args: {
    modelId: 'test-model'
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Find DataGrid in component palette
    const dataGridPalette = await canvas.findByTestId('component-palette-datagrid');
    
    // Find drop target on canvas
    const dropTarget = await canvas.findByTestId('layout-canvas-grid-0-0');
    
    // Simulate drag and drop
    await userEvent.dragAndDrop(dataGridPalette, dropTarget);
    
    // Verify component was added
    const addedComponent = await canvas.findByTestId('component-datagrid-0');
    await expect(addedComponent).toBeInTheDocument();
  }
};

export const ConfigureDataGrid: Story = {
  args: {
    modelId: 'customer-order-model'
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Add DataGrid component first
    const dataGridPalette = await canvas.findByTestId('component-palette-datagrid');
    const dropTarget = await canvas.findByTestId('layout-canvas-grid-0-0');
    await userEvent.dragAndDrop(dataGridPalette, dropTarget);
    
    // Select the component
    const addedComponent = await canvas.findByTestId('component-datagrid-0');
    await userEvent.click(addedComponent);
    
    // Configure entity
    const entitySelect = await canvas.findByTestId('datagrid-entity-select');
    await userEvent.selectOptions(entitySelect, 'customer');
    
    // Add columns
    const addFirstNameColumn = await canvas.findByTestId('add-column-first_name');
    await userEvent.click(addFirstNameColumn);
    
    const addLastNameColumn = await canvas.findByTestId('add-column-last_name');
    await userEvent.click(addLastNameColumn);
    
    // Verify columns were added
    const firstNameColumn = await canvas.findByTestId('column-config-first_name');
    const lastNameColumn = await canvas.findByTestId('column-config-last_name');
    
    await expect(firstNameColumn).toBeInTheDocument();
    await expect(lastNameColumn).toBeInTheDocument();
  }
};
```

---

## Implementation Timeline

### Phase 3A-1: Layout Editor Foundation (Weeks 1-2)
- Component palette and drag-and-drop system
- Basic layout canvas with grid positioning
- Component selection and basic configuration
- Real-time preview panel

### Phase 3A-2: Component Configuration Editors (Weeks 3-4)
- DataGrid configuration editor with entity binding
- Form configuration editor with field management
- Button and action configuration
- Validation system for component configurations

### Phase 3A-3: Enhanced Testing & Storybook (Weeks 5-6)
- Comprehensive Playwright E2E test suite
- Complete Storybook documentation for all components
- Interactive story testing with user flows
- Visual regression testing setup

### Phase 3A-4: Data Management (Weeks 7-8)
- Model import/export with full validation
- Entity data import/export (CSV, JSON)
- Conflict resolution and migration tools
- Performance optimization and caching

## Success Criteria

### Technical Metrics
- ✅ Layout editor supports all 6 core component types
- ✅ Component configuration validates against entity schemas
- ✅ 95%+ test coverage with Playwright E2E tests
- ✅ All components documented in Storybook with interactive examples
- ✅ Model import/export completes in <5 seconds for typical models
- ✅ Layout editor performs at 60fps during drag operations

### User Experience
- ✅ Visual layout creation without code switching
- ✅ Real-time configuration validation with helpful error messages
- ✅ One-click preview of layout changes
- ✅ Intuitive drag-and-drop interface
- ✅ Comprehensive component documentation and examples

### Extensibility
- ✅ Plugin architecture supports runtime component registration
- ✅ Component configuration system is schema-driven
- ✅ Layout definitions are fully serializable JSON
- ✅ Test framework supports new component types
- ✅ Storybook automatically discovers new component stories

This implementation provides a solid foundation for visual application development while maintaining the extensibility and performance requirements of the Torque platform.