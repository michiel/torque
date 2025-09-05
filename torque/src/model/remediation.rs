use crate::common::Uuid;
use crate::model::types::*;
use crate::model::validation::*;
use serde::{Deserialize, Serialize};

/// Remediation strategy for a configuration error
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RemediationStrategy {
    pub id: Uuid,
    pub error_type: String,
    pub strategy_type: RemediationStrategyType,
    pub title: String,
    pub description: String,
    pub parameters: Vec<RemediationParameter>,
    pub estimated_effort: EstimatedEffort,
    pub risk_level: RiskLevel,
    pub prerequisites: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RemediationStrategyType {
    /// Remove invalid references from components
    RemoveInvalidReferences,
    /// Create missing entities with minimal configuration
    CreateMissingEntity {
        entity_name: String,
        suggested_fields: Vec<SuggestedField>,
    },
    /// Add missing fields to existing entities
    AddMissingFields {
        entity_id: Uuid,
        entity_name: String,
        fields: Vec<SuggestedField>,
    },
    /// Update component configuration to remove invalid properties
    UpdateComponentConfiguration {
        layout_id: Uuid,
        component_id: Uuid,
        updates: Vec<ConfigurationUpdate>,
    },
    /// Remove orphaned references
    RemoveOrphanedReferences {
        reference_type: String,
        references: Vec<OrphanedReference>,
    },
    /// Fix relationship configuration
    FixRelationship {
        relationship_id: Uuid,
        fixes: Vec<RelationshipFix>,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RemediationParameter {
    pub name: String,
    pub description: String,
    pub parameter_type: ParameterType,
    pub required: bool,
    pub default_value: Option<serde_json::Value>,
    pub validation: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ParameterType {
    String,
    Integer,
    Boolean,
    EntityId,
    FieldName,
    FieldType,
    Select { options: Vec<SelectOption> },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SelectOption {
    pub value: String,
    pub label: String,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RiskLevel {
    Low,    // Safe to auto-apply
    Medium, // Requires review
    High,   // Major changes, high impact
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SuggestedField {
    pub name: String,
    pub display_name: String,
    pub field_type: FieldType,
    pub required: bool,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConfigurationUpdate {
    pub property_path: String,
    pub action: UpdateAction,
    pub value: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum UpdateAction {
    Remove,
    Update,
    Add,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrphanedReference {
    pub source_id: Uuid,
    pub target_id: Uuid,
    pub reference_field: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RelationshipFix {
    pub fix_type: RelationshipFixType,
    pub target_entity_id: Option<Uuid>,
    pub target_field: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RelationshipFixType {
    CreateMissingEntity,
    AddMissingField,
    UpdateReference,
    RemoveRelationship,
}

/// Remediation execution result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RemediationResult {
    pub strategy_id: Uuid,
    pub success: bool,
    pub changes_applied: Vec<ModelChange>,
    pub errors: Vec<String>,
    pub warnings: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelChange {
    pub change_type: ModelChangeType,
    pub component_type: String,
    pub component_id: Uuid,
    pub description: String,
    pub details: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ModelChangeType {
    EntityCreated,
    EntityUpdated,
    FieldAdded,
    FieldUpdated,
    LayoutUpdated,
    ComponentUpdated,
    RelationshipUpdated,
    RelationshipRemoved,
    ReferenceRemoved,
}

/// Remediation strategy generator
pub struct RemediationStrategyGenerator;

impl RemediationStrategyGenerator {
    pub fn new() -> Self {
        Self
    }

    /// Generate remediation strategies for a configuration error
    pub fn generate_strategies(&self, error: &ConfigurationErrorDetails) -> Vec<RemediationStrategy> {
        match &error.error {
            ConfigurationError::DataGridColumnMismatch { layout_id, component_id, entity_id, entity_name, invalid_columns } => {
                self.generate_datagrid_remediation_strategies(layout_id.clone(), component_id.clone(), entity_id.clone(), entity_name, invalid_columns)
            },
            ConfigurationError::FormFieldMismatch { layout_id, component_id, entity_id, entity_name, invalid_fields } => {
                self.generate_form_remediation_strategies(layout_id.clone(), component_id.clone(), entity_id.clone(), entity_name, invalid_fields)
            },
            ConfigurationError::MissingEntity { entity_id: _, referenced_by, reference_type } => {
                self.generate_missing_entity_remediation_strategies(referenced_by, reference_type)
            },
            ConfigurationError::OrphanedReference { source_type, source_id, target_type, target_id, reference_field } => {
                self.generate_orphaned_reference_remediation_strategies(source_type, source_id.clone(), target_type, target_id.clone(), reference_field)
            },
            ConfigurationError::BrokenRelationship { relationship_id, relationship_name, from_entity_missing, to_entity_missing, from_field_missing, to_field_missing, from_entity_id, to_entity_id, from_field, to_field } => {
                self.generate_relationship_remediation_strategies(relationship_id.clone(), relationship_name, *from_entity_missing, *to_entity_missing, *from_field_missing, *to_field_missing, from_entity_id.clone(), to_entity_id.clone(), from_field, to_field)
            },
            _ => {
                // For other error types, return empty strategies for now
                vec![]
            }
        }
    }

    fn generate_datagrid_remediation_strategies(
        &self,
        layout_id: Uuid,
        component_id: Uuid,
        entity_id: Uuid,
        entity_name: &str,
        invalid_columns: &[InvalidColumn]
    ) -> Vec<RemediationStrategy> {
        let mut strategies = Vec::new();

        // Strategy 1: Remove invalid columns from DataGrid
        let remove_columns_updates: Vec<ConfigurationUpdate> = invalid_columns.iter()
            .map(|col| ConfigurationUpdate {
                property_path: format!("columns[field='{}']", col.field_name),
                action: UpdateAction::Remove,
                value: None,
            })
            .collect();

        strategies.push(RemediationStrategy {
            id: Uuid::new_v4(),
            error_type: "DataGridColumnMismatch".to_string(),
            strategy_type: RemediationStrategyType::UpdateComponentConfiguration {
                layout_id,
                component_id,
                updates: remove_columns_updates,
            },
            title: "Remove Invalid Columns".to_string(),
            description: format!("Remove {} invalid column(s) from the DataGrid component", invalid_columns.len()),
            parameters: vec![],
            estimated_effort: EstimatedEffort::Low,
            risk_level: RiskLevel::Low,
            prerequisites: vec![],
        });

        // Strategy 2: Add missing fields to entity
        let suggested_fields: Vec<SuggestedField> = invalid_columns.iter()
            .filter(|col| matches!(col.issue, ColumnIssue::FieldNotFound))
            .map(|col| SuggestedField {
                name: col.field_name.clone(),
                display_name: col.field_name.clone(),
                field_type: FieldType::String { max_length: Some(255) },
                required: false,
                description: Some(format!("Field added to support DataGrid column '{}'", col.column_name)),
            })
            .collect();

        if !suggested_fields.is_empty() {
            strategies.push(RemediationStrategy {
                id: Uuid::new_v4(),
                error_type: "DataGridColumnMismatch".to_string(),
                strategy_type: RemediationStrategyType::AddMissingFields {
                    entity_id,
                    entity_name: entity_name.to_string(),
                    fields: suggested_fields,
                },
                title: "Add Missing Fields".to_string(),
                description: format!("Add {} missing field(s) to entity '{}'", invalid_columns.len(), entity_name),
                parameters: invalid_columns.iter().map(|col| RemediationParameter {
                    name: format!("field_type_{}", col.field_name),
                    description: format!("Field type for '{}'", col.field_name),
                    parameter_type: ParameterType::Select {
                        options: vec![
                            SelectOption { value: "String".to_string(), label: "Text".to_string(), description: Some("Short text field".to_string()) },
                            SelectOption { value: "Integer".to_string(), label: "Number".to_string(), description: Some("Whole numbers".to_string()) },
                            SelectOption { value: "Float".to_string(), label: "Decimal".to_string(), description: Some("Decimal numbers".to_string()) },
                            SelectOption { value: "Boolean".to_string(), label: "True/False".to_string(), description: Some("Boolean value".to_string()) },
                            SelectOption { value: "DateTime".to_string(), label: "Date & Time".to_string(), description: Some("Date and time".to_string()) },
                        ]
                    },
                    required: true,
                    default_value: Some(serde_json::json!("String")),
                    validation: None,
                }).collect(),
                estimated_effort: EstimatedEffort::Medium,
                risk_level: RiskLevel::Medium,
                prerequisites: vec!["Review field types before adding".to_string()],
            });
        }

        strategies
    }

    fn generate_form_remediation_strategies(
        &self,
        layout_id: Uuid,
        component_id: Uuid,
        entity_id: Uuid,
        entity_name: &str,
        invalid_fields: &[InvalidField]
    ) -> Vec<RemediationStrategy> {
        let mut strategies = Vec::new();

        // Strategy 1: Remove invalid fields from form
        let remove_fields_updates: Vec<ConfigurationUpdate> = invalid_fields.iter()
            .map(|field| ConfigurationUpdate {
                property_path: format!("fields[name='{}']", field.field_name),
                action: UpdateAction::Remove,
                value: None,
            })
            .collect();

        strategies.push(RemediationStrategy {
            id: Uuid::new_v4(),
            error_type: "FormFieldMismatch".to_string(),
            strategy_type: RemediationStrategyType::UpdateComponentConfiguration {
                layout_id,
                component_id,
                updates: remove_fields_updates,
            },
            title: "Remove Invalid Form Fields".to_string(),
            description: format!("Remove {} invalid field(s) from the form component", invalid_fields.len()),
            parameters: vec![],
            estimated_effort: EstimatedEffort::Low,
            risk_level: RiskLevel::Low,
            prerequisites: vec![],
        });

        // Strategy 2: Add missing fields to entity
        let suggested_fields: Vec<SuggestedField> = invalid_fields.iter()
            .filter(|field| matches!(field.issue, FieldIssue::FieldNotFound))
            .map(|field| SuggestedField {
                name: field.field_name.clone(),
                display_name: field.field_name.clone(),
                field_type: FieldType::String { max_length: Some(255) },
                required: false,
                description: Some(format!("Field added to support form field '{}'", field.field_name)),
            })
            .collect();

        if !suggested_fields.is_empty() {
            strategies.push(RemediationStrategy {
                id: Uuid::new_v4(),
                error_type: "FormFieldMismatch".to_string(),
                strategy_type: RemediationStrategyType::AddMissingFields {
                    entity_id,
                    entity_name: entity_name.to_string(),
                    fields: suggested_fields,
                },
                title: "Add Missing Fields to Entity".to_string(),
                description: format!("Add {} missing field(s) to entity '{}'", invalid_fields.len(), entity_name),
                parameters: invalid_fields.iter().map(|field| RemediationParameter {
                    name: format!("field_type_{}", field.field_name),
                    description: format!("Field type for '{}'", field.field_name),
                    parameter_type: ParameterType::Select {
                        options: vec![
                            SelectOption { value: "String".to_string(), label: "Text".to_string(), description: Some("Short text field".to_string()) },
                            SelectOption { value: "Integer".to_string(), label: "Number".to_string(), description: Some("Whole numbers".to_string()) },
                            SelectOption { value: "Float".to_string(), label: "Decimal".to_string(), description: Some("Decimal numbers".to_string()) },
                            SelectOption { value: "Boolean".to_string(), label: "True/False".to_string(), description: Some("Boolean value".to_string()) },
                            SelectOption { value: "DateTime".to_string(), label: "Date & Time".to_string(), description: Some("Date and time".to_string()) },
                        ]
                    },
                    required: true,
                    default_value: Some(serde_json::json!("String")),
                    validation: None,
                }).collect(),
                estimated_effort: EstimatedEffort::Medium,
                risk_level: RiskLevel::Medium,
                prerequisites: vec!["Review field types before adding".to_string()],
            });
        }

        strategies
    }

    fn generate_missing_entity_remediation_strategies(
        &self,
        referenced_by: &str,
        _reference_type: &ReferenceType
    ) -> Vec<RemediationStrategy> {
        vec![
            RemediationStrategy {
                id: Uuid::new_v4(),
                error_type: "MissingEntity".to_string(),
                strategy_type: RemediationStrategyType::CreateMissingEntity {
                    entity_name: "NewEntity".to_string(),
                    suggested_fields: vec![
                        SuggestedField {
                            name: "id".to_string(),
                            display_name: "ID".to_string(),
                            field_type: FieldType::Integer { min: None, max: None },
                            required: true,
                            description: Some("Primary key".to_string()),
                        },
                        SuggestedField {
                            name: "name".to_string(),
                            display_name: "Name".to_string(),
                            field_type: FieldType::String { max_length: Some(255) },
                            required: true,
                            description: Some("Entity name".to_string()),
                        },
                    ],
                },
                title: "Create Missing Entity".to_string(),
                description: format!("Create a new entity to satisfy the reference from {}", referenced_by),
                parameters: vec![
                    RemediationParameter {
                        name: "entity_name".to_string(),
                        description: "Name for the new entity".to_string(),
                        parameter_type: ParameterType::String,
                        required: true,
                        default_value: Some(serde_json::json!("NewEntity")),
                        validation: Some("^[A-Za-z][A-Za-z0-9_]*$".to_string()),
                    },
                    RemediationParameter {
                        name: "entity_display_name".to_string(),
                        description: "Display name for the new entity".to_string(),
                        parameter_type: ParameterType::String,
                        required: true,
                        default_value: Some(serde_json::json!("New Entity")),
                        validation: None,
                    },
                ],
                estimated_effort: EstimatedEffort::Medium,
                risk_level: RiskLevel::Medium,
                prerequisites: vec!["Define entity structure and purpose".to_string()],
            }
        ]
    }

    fn generate_orphaned_reference_remediation_strategies(
        &self,
        source_type: &str,
        source_id: Uuid,
        target_type: &str,
        target_id: Uuid,
        reference_field: &str
    ) -> Vec<RemediationStrategy> {
        vec![
            RemediationStrategy {
                id: Uuid::new_v4(),
                error_type: "OrphanedReference".to_string(),
                strategy_type: RemediationStrategyType::RemoveOrphanedReferences {
                    reference_type: format!("{} -> {}", source_type, target_type),
                    references: vec![OrphanedReference {
                        source_id,
                        target_id,
                        reference_field: reference_field.to_string(),
                    }],
                },
                title: "Remove Orphaned Reference".to_string(),
                description: format!("Remove orphaned reference from {} to missing {}", source_type, target_type),
                parameters: vec![],
                estimated_effort: EstimatedEffort::Low,
                risk_level: RiskLevel::Low,
                prerequisites: vec![],
            }
        ]
    }

    fn generate_relationship_remediation_strategies(
        &self,
        relationship_id: Uuid,
        relationship_name: &str,
        from_entity_missing: bool,
        to_entity_missing: bool,
        from_field_missing: bool,
        to_field_missing: bool,
        from_entity_id: Uuid,
        to_entity_id: Uuid,
        from_field: &str,
        to_field: &str
    ) -> Vec<RemediationStrategy> {
        let mut strategies = Vec::new();

        // Strategy 1: Remove broken relationship
        strategies.push(RemediationStrategy {
            id: Uuid::new_v4(),
            error_type: "BrokenRelationship".to_string(),
            strategy_type: RemediationStrategyType::FixRelationship {
                relationship_id: relationship_id.clone(),
                fixes: vec![RelationshipFix {
                    fix_type: RelationshipFixType::RemoveRelationship,
                    target_entity_id: None,
                    target_field: None,
                }],
            },
            title: "Remove Broken Relationship".to_string(),
            description: format!("Remove the broken relationship '{}'", relationship_name),
            parameters: vec![],
            estimated_effort: EstimatedEffort::Low,
            risk_level: RiskLevel::Medium,
            prerequisites: vec!["Ensure relationship removal won't break other components".to_string()],
        });

        // Strategy 2: Create missing entities if needed
        if from_entity_missing || to_entity_missing {
            let mut fixes = Vec::new();
            if from_entity_missing {
                fixes.push(RelationshipFix {
                    fix_type: RelationshipFixType::CreateMissingEntity,
                    target_entity_id: Some(from_entity_id.clone()),
                    target_field: None,
                });
            }
            if to_entity_missing {
                fixes.push(RelationshipFix {
                    fix_type: RelationshipFixType::CreateMissingEntity,
                    target_entity_id: Some(to_entity_id.clone()),
                    target_field: None,
                });
            }

            strategies.push(RemediationStrategy {
                id: Uuid::new_v4(),
                error_type: "BrokenRelationship".to_string(),
                strategy_type: RemediationStrategyType::FixRelationship {
                    relationship_id: relationship_id.clone(),
                    fixes,
                },
                title: "Create Missing Entities".to_string(),
                description: format!("Create missing entities for relationship '{}'", relationship_name),
                parameters: vec![],
                estimated_effort: EstimatedEffort::High,
                risk_level: RiskLevel::High,
                prerequisites: vec!["Define entity structures and purposes".to_string()],
            });
        }

        // Strategy 3: Add missing fields if entities exist but fields are missing
        if !from_entity_missing && !to_entity_missing && (from_field_missing || to_field_missing) {
            let mut fixes = Vec::new();
            if from_field_missing {
                fixes.push(RelationshipFix {
                    fix_type: RelationshipFixType::AddMissingField,
                    target_entity_id: Some(from_entity_id.clone()),
                    target_field: Some(from_field.to_string()),
                });
            }
            if to_field_missing {
                fixes.push(RelationshipFix {
                    fix_type: RelationshipFixType::AddMissingField,
                    target_entity_id: Some(to_entity_id.clone()),
                    target_field: Some(to_field.to_string()),
                });
            }

            strategies.push(RemediationStrategy {
                id: Uuid::new_v4(),
                error_type: "BrokenRelationship".to_string(),
                strategy_type: RemediationStrategyType::FixRelationship {
                    relationship_id,
                    fixes,
                },
                title: "Add Missing Fields".to_string(),
                description: format!("Add missing fields for relationship '{}'", relationship_name),
                parameters: vec![],
                estimated_effort: EstimatedEffort::Medium,
                risk_level: RiskLevel::Medium,
                prerequisites: vec!["Review field types and constraints".to_string()],
            });
        }

        strategies
    }
}

impl Default for RemediationStrategyGenerator {
    fn default() -> Self {
        Self::new()
    }
}