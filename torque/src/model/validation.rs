use crate::common::{Uuid, UtcDateTime};
use crate::model::types::*;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};

/// Comprehensive configuration error types for torque models
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ConfigurationError {
    // Entity-related errors
    MissingEntity {
        entity_id: Uuid,
        referenced_by: String,
        reference_type: ReferenceType,
    },
    
    // Field-related errors
    MissingEntityField {
        entity_id: Uuid,
        entity_name: String,
        field_name: String,
        referenced_by: String,
        reference_type: ReferenceType,
    },
    
    // Layout-related errors
    MissingStartPageLayout {
        expected_layout_id: Option<Uuid>,
        config_location: String,
    },
    
    LayoutEntityMismatch {
        layout_id: Uuid,
        layout_name: String,
        component_id: Uuid,
        component_type: String,
        expected_entity_id: Uuid,
        missing_entity: bool,
    },
    
    // Component configuration errors
    DataGridColumnMismatch {
        layout_id: Uuid,
        component_id: Uuid,
        entity_id: Uuid,
        entity_name: String,
        invalid_columns: Vec<InvalidColumn>,
    },
    
    FormFieldMismatch {
        layout_id: Uuid,
        component_id: Uuid,
        entity_id: Uuid,
        entity_name: String,
        invalid_fields: Vec<InvalidField>,
    },
    
    // Relationship errors
    BrokenRelationship {
        relationship_id: Uuid,
        relationship_name: String,
        from_entity_missing: bool,
        to_entity_missing: bool,
        from_field_missing: bool,
        to_field_missing: bool,
        from_entity_id: Uuid,
        to_entity_id: Uuid,
        from_field: String,
        to_field: String,
    },
    
    // Flow/XFlow errors
    FlowEntityReference {
        flow_id: Uuid,
        flow_name: String,
        missing_entity_id: Uuid,
        step_id: Option<Uuid>,
    },
    
    // Reference integrity errors
    OrphanedReference {
        source_type: String,
        source_id: Uuid,
        target_type: String,
        target_id: Uuid,
        reference_field: String,
    },
    
    // Type mismatch errors
    FieldTypeMismatch {
        entity_id: Uuid,
        entity_name: String,
        field_name: String,
        expected_type: String,
        actual_type: String,
        referenced_by: String,
    },
    
    // Validation errors
    InvalidValidationRule {
        validation_id: Uuid,
        entity_id: Option<Uuid>,
        field_id: Option<Uuid>,
        rule_expression: String,
        error_message: String,
    },
    
    // UI configuration errors
    InvalidComponentConfiguration {
        layout_id: Uuid,
        component_id: Uuid,
        component_type: String,
        configuration_errors: Vec<String>,
    },
    
    // Circular dependency errors
    CircularDependency {
        dependency_type: DependencyType,
        cycle_path: Vec<DependencyNode>,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ReferenceType {
    LayoutComponent,
    DataGridColumn,
    FormField,
    Relationship,
    FlowStep,
    ValidationRule,
    EntityConstraint,
    EntityIndex,
    LifecycleHook,
    CustomAction,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct InvalidColumn {
    pub column_name: String,
    pub field_name: String,
    pub issue: ColumnIssue,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ColumnIssue {
    FieldNotFound,
    TypeMismatch { expected: String, actual: String },
    InvalidSortable,
    InvalidFilterable,
    InvalidFormatter,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct InvalidField {
    pub field_name: String,
    pub issue: FieldIssue,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum FieldIssue {
    FieldNotFound,
    TypeMismatch { expected: String, actual: String },
    InvalidValidation,
    InvalidComponent,
    RequiredFieldMissing,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum DependencyType {
    EntityRelationship,
    ComponentEntity,
    FlowEntity,
    LayoutDependency,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct DependencyNode {
    pub node_type: String,
    pub node_id: Uuid,
    pub node_name: String,
}

/// Standardized configuration error report
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConfigurationErrorReport {
    pub model_id: Uuid,
    pub model_name: String,
    pub generated_at: UtcDateTime,
    pub total_errors: usize,
    pub errors_by_severity: ErrorSeverityCount,
    pub errors: Vec<ConfigurationErrorDetails>,
    pub suggestions: Vec<ErrorSuggestion>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorSeverityCount {
    pub critical: usize,
    pub high: usize,
    pub medium: usize,
    pub low: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConfigurationErrorDetails {
    pub id: Uuid,
    pub error: ConfigurationError,
    pub severity: ErrorSeverity,
    pub category: ErrorCategory,
    pub title: String,
    pub description: String,
    pub impact: ErrorImpact,
    pub location: ErrorLocation,
    pub suggested_fixes: Vec<String>,
    pub auto_fixable: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ErrorSeverity {
    Critical,  // Application will not work
    High,      // Major functionality broken
    Medium,    // Partial functionality affected
    Low,       // Minor issues or warnings
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ErrorCategory {
    DataModel,
    UserInterface,
    BusinessLogic,
    Integration,
    Performance,
    Security,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ErrorImpact {
    ApplicationUnstartable,
    FeatureUnavailable { feature: String },
    DataIntegrityIssue,
    PerformanceImpact,
    UserExperienceIssue,
    SecurityVulnerability,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorLocation {
    pub component_type: String,
    pub component_id: Uuid,
    pub component_name: String,
    pub path: Vec<String>,
    pub file_reference: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorSuggestion {
    pub title: String,
    pub description: String,
    pub action_type: SuggestionActionType,
    pub affected_errors: Vec<Uuid>,
    pub estimated_effort: EstimatedEffort,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SuggestionActionType {
    CreateMissingEntity,
    UpdateEntitySchema,
    FixLayoutConfiguration,
    RemoveInvalidReferences,
    UpdateValidationRules,
    RefactorRelationships,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum EstimatedEffort {
    Low,      // < 5 minutes
    Medium,   // 5-30 minutes
    High,     // 30+ minutes
    Complex,  // Requires design decisions
}

/// Model verification scanner
pub struct ModelVerificationScanner;

impl ModelVerificationScanner {
    pub fn new() -> Self {
        Self
    }
    
    /// Scan a model for configuration mismatches
    pub fn scan_model(&self, model: &TorqueModel) -> ConfigurationErrorReport {
        let mut errors = Vec::new();
        
        // Create entity lookup for quick reference validation
        let entity_map: HashMap<Uuid, &ModelEntity> = model.entities
            .iter()
            .map(|e| (e.id.clone(), e))
            .collect();
            
        let entity_field_map = self.build_entity_field_map(&model.entities);
        
        // 1. Scan for missing entity references
        errors.extend(self.scan_missing_entities(model, &entity_map));
        
        // 2. Scan for layout configuration issues
        errors.extend(self.scan_layout_issues(model, &entity_map, &entity_field_map));
        
        // 3. Scan for relationship integrity issues
        errors.extend(self.scan_relationship_issues(model, &entity_map, &entity_field_map));
        
        // 4. Scan for flow configuration issues
        errors.extend(self.scan_flow_issues(model, &entity_map));
        
        // 5. Scan for validation rule issues
        errors.extend(self.scan_validation_issues(model, &entity_map, &entity_field_map));
        
        // 6. Scan for circular dependencies
        errors.extend(self.scan_circular_dependencies(model, &entity_map));
        
        // 7. Check for orphaned references
        errors.extend(self.scan_orphaned_references(model, &entity_map));
        
        self.build_error_report(model, errors)
    }
    
    fn build_entity_field_map<'a>(&self, entities: &'a [ModelEntity]) -> HashMap<Uuid, HashMap<String, &'a EntityField>> {
        entities.iter()
            .map(|entity| {
                let field_map = entity.fields.iter()
                    .map(|field| (field.name.clone(), field))
                    .collect();
                (entity.id.clone(), field_map)
            })
            .collect()
    }
    
    fn scan_missing_entities(&self, model: &TorqueModel, _entity_map: &HashMap<Uuid, &ModelEntity>) -> Vec<ConfigurationErrorDetails> {
        let mut errors = Vec::new();
        
        // Check layouts for missing entities
        for layout in &model.layouts {
            for component in &layout.components {
                if let Some(entity_type) = component.properties.get("entityType") {
                    if let Some(entity_name) = entity_type.as_str() {
                        // Find entity by name
                        let entity_exists = model.entities.iter()
                            .any(|e| e.name == entity_name);
                            
                        if !entity_exists {
                            errors.push(self.create_missing_entity_error(
                                layout.id.clone(),
                                component.id.clone(),
                                entity_name,
                                "Layout Component"
                            ));
                        }
                    }
                }
            }
        }
        
        errors
    }
    
    fn scan_layout_issues(&self, model: &TorqueModel, entity_map: &HashMap<Uuid, &ModelEntity>, entity_field_map: &HashMap<Uuid, HashMap<String, &EntityField>>) -> Vec<ConfigurationErrorDetails> {
        let mut errors = Vec::new();
        
        for layout in &model.layouts {
            for component in &layout.components {
                match component.component_type.as_str() {
                    "DataGrid" => {
                        errors.extend(self.scan_datagrid_component(layout, component, model, entity_map, entity_field_map));
                    },
                    "TorqueForm" => {
                        errors.extend(self.scan_form_component(layout, component, model, entity_map, entity_field_map));
                    },
                    _ => {}
                }
            }
        }
        
        errors
    }
    
    fn scan_datagrid_component(
        &self,
        layout: &ModelLayout,
        component: &LayoutComponent,
        model: &TorqueModel,
        entity_map: &HashMap<Uuid, &ModelEntity>,
        entity_field_map: &HashMap<Uuid, HashMap<String, &EntityField>>
    ) -> Vec<ConfigurationErrorDetails> {
        let mut errors = Vec::new();
        
        // Get entity reference
        if let Some(entity_type) = component.properties.get("entityType").and_then(|v| v.as_str()) {
            let entity = model.entities.iter().find(|e| e.name == entity_type);
            
            if let Some(entity) = entity {
                // Check columns configuration
                if let Some(columns) = component.properties.get("columns").and_then(|v| v.as_array()) {
                    let mut invalid_columns = Vec::new();
                    
                    for column in columns {
                        if let Some(field_name) = column.get("field").and_then(|v| v.as_str()) {
                            let field_exists = entity.fields.iter().any(|f| f.name == field_name);
                            
                            if !field_exists {
                                invalid_columns.push(InvalidColumn {
                                    column_name: field_name.to_string(),
                                    field_name: field_name.to_string(),
                                    issue: ColumnIssue::FieldNotFound,
                                });
                            }
                        }
                    }
                    
                    if !invalid_columns.is_empty() {
                        let error = ConfigurationError::DataGridColumnMismatch {
                            layout_id: layout.id.clone(),
                            component_id: component.id.clone(),
                            entity_id: entity.id.clone(),
                            entity_name: entity.name.clone(),
                            invalid_columns,
                        };
                        
                        errors.push(self.create_error_details(
                            error,
                            ErrorSeverity::High,
                            ErrorCategory::UserInterface,
                            format!("DataGrid has invalid column configuration"),
                            format!("DataGrid component '{}' references non-existent fields in entity '{}'", component.id, entity.name),
                        ));
                    }
                }
            }
        }
        
        errors
    }
    
    fn scan_form_component(
        &self,
        layout: &ModelLayout,
        component: &LayoutComponent,
        model: &TorqueModel,
        _entity_map: &HashMap<Uuid, &ModelEntity>,
        _entity_field_map: &HashMap<Uuid, HashMap<String, &EntityField>>
    ) -> Vec<ConfigurationErrorDetails> {
        let mut errors = Vec::new();
        
        // Similar to DataGrid but for form fields
        if let Some(entity_type) = component.properties.get("entityType").and_then(|v| v.as_str()) {
            let entity = model.entities.iter().find(|e| e.name == entity_type);
            
            if let Some(entity) = entity {
                if let Some(fields) = component.properties.get("fields").and_then(|v| v.as_array()) {
                    let mut invalid_fields = Vec::new();
                    
                    for field_config in fields {
                        if let Some(field_name) = field_config.get("name").and_then(|v| v.as_str()) {
                            let field_exists = entity.fields.iter().any(|f| f.name == field_name);
                            
                            if !field_exists {
                                invalid_fields.push(InvalidField {
                                    field_name: field_name.to_string(),
                                    issue: FieldIssue::FieldNotFound,
                                });
                            }
                        }
                    }
                    
                    if !invalid_fields.is_empty() {
                        let error = ConfigurationError::FormFieldMismatch {
                            layout_id: layout.id.clone(),
                            component_id: component.id.clone(),
                            entity_id: entity.id.clone(),
                            entity_name: entity.name.clone(),
                            invalid_fields,
                        };
                        
                        errors.push(self.create_error_details(
                            error,
                            ErrorSeverity::High,
                            ErrorCategory::UserInterface,
                            format!("Form has invalid field configuration"),
                            format!("Form component '{}' references non-existent fields in entity '{}'", component.id, entity.name),
                        ));
                    }
                }
            }
        }
        
        errors
    }
    
    fn scan_relationship_issues(&self, model: &TorqueModel, entity_map: &HashMap<Uuid, &ModelEntity>, entity_field_map: &HashMap<Uuid, HashMap<String, &EntityField>>) -> Vec<ConfigurationErrorDetails> {
        let mut errors = Vec::new();
        
        for relationship in &model.relationships {
            let from_entity_missing = !entity_map.contains_key(&relationship.from_entity);
            let to_entity_missing = !entity_map.contains_key(&relationship.to_entity);
            
            let from_field_missing = if let Some(fields) = entity_field_map.get(&relationship.from_entity) {
                !fields.contains_key(&relationship.from_field)
            } else {
                true
            };
            
            let to_field_missing = if let Some(fields) = entity_field_map.get(&relationship.to_entity) {
                !fields.contains_key(&relationship.to_field)
            } else {
                true
            };
            
            if from_entity_missing || to_entity_missing || from_field_missing || to_field_missing {
                let error = ConfigurationError::BrokenRelationship {
                    relationship_id: relationship.id.clone(),
                    relationship_name: relationship.name.clone(),
                    from_entity_missing,
                    to_entity_missing,
                    from_field_missing,
                    to_field_missing,
                    from_entity_id: relationship.from_entity.clone(),
                    to_entity_id: relationship.to_entity.clone(),
                    from_field: relationship.from_field.clone(),
                    to_field: relationship.to_field.clone(),
                };
                
                errors.push(self.create_error_details(
                    error,
                    ErrorSeverity::Critical,
                    ErrorCategory::DataModel,
                    format!("Broken relationship: {}", relationship.name),
                    format!("Relationship '{}' references missing entities or fields", relationship.name),
                ));
            }
        }
        
        errors
    }
    
    fn scan_flow_issues(&self, model: &TorqueModel, entity_map: &HashMap<Uuid, &ModelEntity>) -> Vec<ConfigurationErrorDetails> {
        let mut errors = Vec::new();
        
        for flow in &model.flows {
            // Check trigger entity references
            if let FlowTrigger::EntityEvent { entity_id, .. } = &flow.trigger {
                if !entity_map.contains_key(entity_id) {
                    let error = ConfigurationError::FlowEntityReference {
                        flow_id: flow.id.clone(),
                        flow_name: flow.name.clone(),
                        missing_entity_id: entity_id.clone(),
                        step_id: None,
                    };
                    
                    errors.push(self.create_error_details(
                        error,
                        ErrorSeverity::High,
                        ErrorCategory::BusinessLogic,
                        format!("Flow references missing entity"),
                        format!("Flow '{}' trigger references non-existent entity", flow.name),
                    ));
                }
            }
            
            // Check step entity references
            for step in &flow.steps {
                // Scan step configuration for entity references
                if let Some(entity_id_value) = step.configuration.get("entity_id") {
                    if let Some(entity_id_str) = entity_id_value.as_str() {
                        if let Ok(entity_id) = entity_id_str.parse::<Uuid>() {
                            if !entity_map.contains_key(&entity_id) {
                                let error = ConfigurationError::FlowEntityReference {
                                    flow_id: flow.id.clone(),
                                    flow_name: flow.name.clone(),
                                    missing_entity_id: entity_id,
                                    step_id: Some(step.id.clone()),
                                };
                                
                                errors.push(self.create_error_details(
                                    error,
                                    ErrorSeverity::Medium,
                                    ErrorCategory::BusinessLogic,
                                    format!("Flow step references missing entity"),
                                    format!("Flow '{}' step '{}' references non-existent entity", flow.name, step.name),
                                ));
                            }
                        }
                    }
                }
            }
        }
        
        errors
    }
    
    fn scan_validation_issues(&self, model: &TorqueModel, entity_map: &HashMap<Uuid, &ModelEntity>, _entity_field_map: &HashMap<Uuid, HashMap<String, &EntityField>>) -> Vec<ConfigurationErrorDetails> {
        let mut errors = Vec::new();
        
        for validation in &model.validations {
            match &validation.scope {
                ValidationScope::Entity(entity_id) => {
                    if !entity_map.contains_key(entity_id) {
                        let error = ConfigurationError::InvalidValidationRule {
                            validation_id: validation.id.clone(),
                            entity_id: Some(entity_id.clone()),
                            field_id: None,
                            rule_expression: validation.rule.clone(),
                            error_message: "Entity referenced by validation rule does not exist".to_string(),
                        };
                        
                        errors.push(self.create_error_details(
                            error,
                            ErrorSeverity::Medium,
                            ErrorCategory::DataModel,
                            format!("Validation rule references missing entity"),
                            format!("Validation '{}' references non-existent entity", validation.name),
                        ));
                    }
                },
                ValidationScope::Field(field_id) => {
                    // Find field across all entities
                    let field_exists = model.entities.iter()
                        .any(|entity| entity.fields.iter().any(|field| field.id == *field_id));
                    
                    if !field_exists {
                        let error = ConfigurationError::InvalidValidationRule {
                            validation_id: validation.id.clone(),
                            entity_id: None,
                            field_id: Some(field_id.clone()),
                            rule_expression: validation.rule.clone(),
                            error_message: "Field referenced by validation rule does not exist".to_string(),
                        };
                        
                        errors.push(self.create_error_details(
                            error,
                            ErrorSeverity::Medium,
                            ErrorCategory::DataModel,
                            format!("Validation rule references missing field"),
                            format!("Validation '{}' references non-existent field", validation.name),
                        ));
                    }
                },
                _ => {}
            }
        }
        
        errors
    }
    
    fn scan_circular_dependencies(&self, model: &TorqueModel, entity_map: &HashMap<Uuid, &ModelEntity>) -> Vec<ConfigurationErrorDetails> {
        let mut errors = Vec::new();
        
        // Build dependency graph
        let mut graph: HashMap<Uuid, Vec<Uuid>> = HashMap::new();
        
        // Add entity relationships to graph
        for relationship in &model.relationships {
            graph.entry(relationship.from_entity.clone())
                .or_insert_with(Vec::new)
                .push(relationship.to_entity.clone());
        }
        
        // Detect cycles using DFS
        let mut visited = HashSet::new();
        let mut rec_stack = HashSet::new();
        
        for entity_id in entity_map.keys() {
            if !visited.contains(entity_id) {
                if let Some(cycle) = self.detect_cycle_dfs(entity_id.clone(), &graph, &mut visited, &mut rec_stack, entity_map) {
                    let error = ConfigurationError::CircularDependency {
                        dependency_type: DependencyType::EntityRelationship,
                        cycle_path: cycle,
                    };
                    
                    errors.push(self.create_error_details(
                        error,
                        ErrorSeverity::High,
                        ErrorCategory::DataModel,
                        format!("Circular dependency detected in entity relationships"),
                        format!("Circular dependency found in entity relationship chain"),
                    ));
                }
            }
        }
        
        errors
    }
    
    fn detect_cycle_dfs(
        &self,
        node: Uuid,
        graph: &HashMap<Uuid, Vec<Uuid>>,
        visited: &mut HashSet<Uuid>,
        rec_stack: &mut HashSet<Uuid>,
        entity_map: &HashMap<Uuid, &ModelEntity>
    ) -> Option<Vec<DependencyNode>> {
        visited.insert(node.clone());
        rec_stack.insert(node.clone());
        
        if let Some(neighbors) = graph.get(&node) {
            for neighbor in neighbors {
                if !visited.contains(neighbor) {
                    if let Some(cycle) = self.detect_cycle_dfs(neighbor.clone(), graph, visited, rec_stack, entity_map) {
                        return Some(cycle);
                    }
                } else if rec_stack.contains(neighbor) {
                    // Found a cycle, build the cycle path
                    let mut cycle = Vec::new();
                    if let Some(entity) = entity_map.get(neighbor) {
                        cycle.push(DependencyNode {
                            node_type: "Entity".to_string(),
                            node_id: neighbor.clone(),
                            node_name: entity.name.clone(),
                        });
                    }
                    if let Some(entity) = entity_map.get(&node) {
                        cycle.push(DependencyNode {
                            node_type: "Entity".to_string(),
                            node_id: node,
                            node_name: entity.name.clone(),
                        });
                    }
                    return Some(cycle);
                }
            }
        }
        
        rec_stack.remove(&node);
        None
    }
    
    fn scan_orphaned_references(&self, model: &TorqueModel, entity_map: &HashMap<Uuid, &ModelEntity>) -> Vec<ConfigurationErrorDetails> {
        let mut errors = Vec::new();
        
        // Scan for orphaned layout component references
        for layout in &model.layouts {
            for entity_id in &layout.target_entities {
                if !entity_map.contains_key(entity_id) {
                    let error = ConfigurationError::OrphanedReference {
                        source_type: "Layout".to_string(),
                        source_id: layout.id.clone(),
                        target_type: "Entity".to_string(),
                        target_id: entity_id.clone(),
                        reference_field: "target_entities".to_string(),
                    };
                    
                    errors.push(self.create_error_details(
                        error,
                        ErrorSeverity::Medium,
                        ErrorCategory::UserInterface,
                        format!("Layout references missing entity"),
                        format!("Layout '{}' references non-existent entity in target_entities", layout.name),
                    ));
                }
            }
        }
        
        errors
    }
    
    fn create_missing_entity_error(&self, _layout_id: Uuid, component_id: Uuid, entity_name: &str, reference_type: &str) -> ConfigurationErrorDetails {
        let error = ConfigurationError::MissingEntity {
            entity_id: Uuid::new_v4(), // Placeholder since we don't know the expected ID
            referenced_by: format!("{} ({})", reference_type, component_id),
            reference_type: ReferenceType::LayoutComponent,
        };
        
        self.create_error_details(
            error,
            ErrorSeverity::Critical,
            ErrorCategory::DataModel,
            format!("Missing entity: {}", entity_name),
            format!("{} references non-existent entity '{}'", reference_type, entity_name),
        )
    }
    
    fn create_error_details(
        &self,
        error: ConfigurationError,
        severity: ErrorSeverity,
        category: ErrorCategory,
        title: String,
        description: String,
    ) -> ConfigurationErrorDetails {
        let impact = self.determine_error_impact(&error);
        let location = self.determine_error_location(&error);
        let suggested_fixes = self.generate_suggested_fixes(&error);
        let auto_fixable = self.is_auto_fixable(&error);
        
        ConfigurationErrorDetails {
            id: Uuid::new_v4(),
            error,
            severity,
            category,
            title,
            description,
            impact,
            location,
            suggested_fixes,
            auto_fixable,
        }
    }
    
    fn determine_error_impact(&self, error: &ConfigurationError) -> ErrorImpact {
        match error {
            ConfigurationError::MissingStartPageLayout { .. } => ErrorImpact::ApplicationUnstartable,
            ConfigurationError::MissingEntity { .. } => ErrorImpact::FeatureUnavailable { feature: "Entity Operations".to_string() },
            ConfigurationError::BrokenRelationship { .. } => ErrorImpact::DataIntegrityIssue,
            ConfigurationError::DataGridColumnMismatch { .. } => ErrorImpact::FeatureUnavailable { feature: "Data Display".to_string() },
            ConfigurationError::FormFieldMismatch { .. } => ErrorImpact::FeatureUnavailable { feature: "Data Entry".to_string() },
            ConfigurationError::CircularDependency { .. } => ErrorImpact::DataIntegrityIssue,
            _ => ErrorImpact::UserExperienceIssue,
        }
    }
    
    fn determine_error_location(&self, error: &ConfigurationError) -> ErrorLocation {
        match error {
            ConfigurationError::MissingEntity { referenced_by, .. } => {
                ErrorLocation {
                    component_type: "Entity Reference".to_string(),
                    component_id: Uuid::new_v4(),
                    component_name: referenced_by.clone(),
                    path: vec!["Model".to_string(), "Entities".to_string()],
                    file_reference: None,
                }
            },
            ConfigurationError::DataGridColumnMismatch { layout_id, component_id, .. } => {
                ErrorLocation {
                    component_type: "DataGrid".to_string(),
                    component_id: component_id.clone(),
                    component_name: format!("DataGrid-{}", component_id),
                    path: vec!["Model".to_string(), "Layouts".to_string(), layout_id.to_string()],
                    file_reference: None,
                }
            },
            _ => {
                ErrorLocation {
                    component_type: "Unknown".to_string(),
                    component_id: Uuid::new_v4(),
                    component_name: "Unknown".to_string(),
                    path: vec!["Model".to_string()],
                    file_reference: None,
                }
            }
        }
    }
    
    fn generate_suggested_fixes(&self, error: &ConfigurationError) -> Vec<String> {
        match error {
            ConfigurationError::MissingEntity { .. } => {
                vec![
                    "Create the missing entity in the model".to_string(),
                    "Remove the reference to the missing entity".to_string(),
                    "Update the reference to point to an existing entity".to_string(),
                ]
            },
            ConfigurationError::DataGridColumnMismatch { invalid_columns, .. } => {
                let mut fixes = Vec::new();
                for column in invalid_columns {
                    fixes.push(format!("Remove column '{}' or add field '{}' to the entity", column.column_name, column.field_name));
                }
                fixes
            },
            ConfigurationError::BrokenRelationship { .. } => {
                vec![
                    "Create missing entities referenced by the relationship".to_string(),
                    "Add missing fields to the related entities".to_string(),
                    "Remove the broken relationship".to_string(),
                ]
            },
            _ => {
                vec!["Review and fix the configuration manually".to_string()]
            }
        }
    }
    
    fn is_auto_fixable(&self, error: &ConfigurationError) -> bool {
        matches!(error, 
            ConfigurationError::OrphanedReference { .. } |
            ConfigurationError::DataGridColumnMismatch { .. } |
            ConfigurationError::FormFieldMismatch { .. }
        )
    }
    
    fn build_error_report(&self, model: &TorqueModel, errors: Vec<ConfigurationErrorDetails>) -> ConfigurationErrorReport {
        let total_errors = errors.len();
        
        let mut critical = 0;
        let mut high = 0;
        let mut medium = 0;
        let mut low = 0;
        
        for error in &errors {
            match error.severity {
                ErrorSeverity::Critical => critical += 1,
                ErrorSeverity::High => high += 1,
                ErrorSeverity::Medium => medium += 1,
                ErrorSeverity::Low => low += 1,
            }
        }
        
        let errors_by_severity = ErrorSeverityCount {
            critical,
            high,
            medium,
            low,
        };
        
        let suggestions = self.generate_report_suggestions(&errors);
        
        ConfigurationErrorReport {
            model_id: model.id.clone(),
            model_name: model.name.clone(),
            generated_at: UtcDateTime::now(),
            total_errors,
            errors_by_severity,
            errors,
            suggestions,
        }
    }
    
    fn generate_report_suggestions(&self, errors: &[ConfigurationErrorDetails]) -> Vec<ErrorSuggestion> {
        let mut suggestions = Vec::new();
        
        // Group errors by type and generate consolidated suggestions
        let missing_entities: Vec<_> = errors.iter()
            .filter(|e| matches!(e.error, ConfigurationError::MissingEntity { .. }))
            .collect();
        
        if !missing_entities.is_empty() {
            suggestions.push(ErrorSuggestion {
                title: "Create Missing Entities".to_string(),
                description: format!("Create {} missing entities referenced by components", missing_entities.len()),
                action_type: SuggestionActionType::CreateMissingEntity,
                affected_errors: missing_entities.iter().map(|e| e.id.clone()).collect(),
                estimated_effort: EstimatedEffort::Medium,
            });
        }
        
        suggestions
    }
}

impl Default for ModelVerificationScanner {
    fn default() -> Self {
        Self::new()
    }
}