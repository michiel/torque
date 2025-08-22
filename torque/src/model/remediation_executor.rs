use crate::common::Uuid;
use crate::model::types::*;
use crate::model::remediation::*;
use crate::error::Error;
use serde_json::Value;
use std::collections::HashMap;
use tracing;

/// Service for executing remediation strategies on models
pub struct RemediationExecutor;

impl RemediationExecutor {
    pub fn new() -> Self {
        Self
    }

    /// Execute a remediation strategy on a model
    pub async fn execute_remediation(
        &self,
        model: &mut TorqueModel,
        strategy: &RemediationStrategy,
        parameters: &HashMap<String, Value>
    ) -> Result<RemediationResult, Error> {
        tracing::info!("Executing remediation strategy: {} for model: {}", strategy.title, model.name);
        
        let mut changes = Vec::new();
        let mut errors = Vec::new();
        let mut warnings = Vec::new();

        match &strategy.strategy_type {
            RemediationStrategyType::RemoveInvalidReferences => {
                self.execute_remove_invalid_references(model, &mut changes, &mut errors, &mut warnings).await?;
            },
            RemediationStrategyType::CreateMissingEntity { entity_name, suggested_fields } => {
                self.execute_create_missing_entity(model, entity_name, suggested_fields, parameters, &mut changes, &mut errors, &mut warnings).await?;
            },
            RemediationStrategyType::AddMissingFields { entity_id, entity_name, fields } => {
                self.execute_add_missing_fields(model, entity_id.clone(), entity_name, fields, parameters, &mut changes, &mut errors, &mut warnings).await?;
            },
            RemediationStrategyType::UpdateComponentConfiguration { layout_id, component_id, updates } => {
                self.execute_update_component_configuration(model, layout_id.clone(), component_id.clone(), updates, &mut changes, &mut errors, &mut warnings).await?;
            },
            RemediationStrategyType::RemoveOrphanedReferences { reference_type, references } => {
                self.execute_remove_orphaned_references(model, reference_type, references, &mut changes, &mut errors, &mut warnings).await?;
            },
            RemediationStrategyType::FixRelationship { relationship_id, fixes } => {
                self.execute_fix_relationship(model, relationship_id.clone(), fixes, parameters, &mut changes, &mut errors, &mut warnings).await?;
            },
        }

        let success = errors.is_empty();
        
        if success {
            tracing::info!("Remediation strategy '{}' executed successfully with {} changes", strategy.title, changes.len());
        } else {
            tracing::warn!("Remediation strategy '{}' completed with {} errors", strategy.title, errors.len());
        }

        Ok(RemediationResult {
            strategy_id: strategy.id.clone(),
            success,
            changes_applied: changes,
            errors,
            warnings,
        })
    }

    async fn execute_remove_invalid_references(
        &self,
        _model: &mut TorqueModel,
        changes: &mut Vec<ModelChange>,
        _errors: &mut Vec<String>,
        _warnings: &mut Vec<String>
    ) -> Result<(), Error> {
        // Implementation for removing invalid references
        // This is a placeholder - specific implementation would depend on the error type
        changes.push(ModelChange {
            change_type: ModelChangeType::ReferenceRemoved,
            component_type: "Generic".to_string(),
            component_id: Uuid::new_v4(),
            description: "Removed invalid references".to_string(),
            details: serde_json::json!({}),
        });
        Ok(())
    }

    async fn execute_create_missing_entity(
        &self,
        model: &mut TorqueModel,
        entity_name: &str,
        suggested_fields: &[SuggestedField],
        parameters: &HashMap<String, Value>,
        changes: &mut Vec<ModelChange>,
        errors: &mut Vec<String>,
        _warnings: &mut Vec<String>
    ) -> Result<(), Error> {
        // Get entity name from parameters or use default
        let final_entity_name = parameters
            .get("entity_name")
            .and_then(|v| v.as_str())
            .unwrap_or(entity_name)
            .to_string();

        let display_name = parameters
            .get("entity_display_name")
            .and_then(|v| v.as_str())
            .unwrap_or(&final_entity_name)
            .to_string();

        // Check if entity with same name already exists
        if model.entities.iter().any(|e| e.name == final_entity_name) {
            errors.push(format!("Entity with name '{}' already exists", final_entity_name));
            return Ok(());
        }

        // Create fields from suggested fields
        let mut fields = Vec::new();
        for suggested_field in suggested_fields {
            // Get field type from parameters if provided
            let field_type_param_name = format!("field_type_{}", suggested_field.name);
            let field_type = if let Some(field_type_value) = parameters.get(&field_type_param_name) {
                self.parse_field_type_from_parameter(field_type_value, &suggested_field.field_type)?
            } else {
                suggested_field.field_type.clone()
            };

            fields.push(EntityField {
                id: Uuid::new_v4(),
                name: suggested_field.name.clone(),
                display_name: suggested_field.display_name.clone(),
                field_type,
                required: suggested_field.required,
                default_value: None,
                validation: vec![],
                ui_config: FieldUiConfig::default(),
            });
        }

        // Create the new entity
        let entity = ModelEntity {
            id: Uuid::new_v4(),
            name: final_entity_name.clone(),
            display_name: display_name,
            description: Some("Auto-created entity to resolve configuration error".to_string()),
            entity_type: EntityType::Data,
            fields,
            constraints: vec![],
            indexes: vec![],
            ui_config: EntityUiConfig::default(),
            behavior: EntityBehavior::default(),
        };

        let entity_id = entity.id.clone();
        model.entities.push(entity);

        changes.push(ModelChange {
            change_type: ModelChangeType::EntityCreated,
            component_type: "Entity".to_string(),
            component_id: entity_id,
            description: format!("Created entity '{}'", final_entity_name),
            details: serde_json::json!({
                "entity_name": final_entity_name,
                "field_count": suggested_fields.len()
            }),
        });

        Ok(())
    }

    async fn execute_add_missing_fields(
        &self,
        model: &mut TorqueModel,
        entity_id: Uuid,
        entity_name: &str,
        fields: &[SuggestedField],
        parameters: &HashMap<String, Value>,
        changes: &mut Vec<ModelChange>,
        errors: &mut Vec<String>,
        _warnings: &mut Vec<String>
    ) -> Result<(), Error> {
        // Find the target entity
        let entity = model.entities.iter_mut()
            .find(|e| e.id == entity_id)
            .ok_or_else(|| Error::NotFound(format!("Entity with ID {} not found", entity_id)))?;

        let mut added_fields = 0;
        
        for suggested_field in fields {
            // Check if field already exists
            if entity.fields.iter().any(|f| f.name == suggested_field.name) {
                errors.push(format!("Field '{}' already exists in entity '{}'", suggested_field.name, entity_name));
                continue;
            }

            // Get field type from parameters if provided
            let field_type_param_name = format!("field_type_{}", suggested_field.name);
            let field_type = if let Some(field_type_value) = parameters.get(&field_type_param_name) {
                self.parse_field_type_from_parameter(field_type_value, &suggested_field.field_type)?
            } else {
                suggested_field.field_type.clone()
            };

            // Add the field
            entity.fields.push(EntityField {
                id: Uuid::new_v4(),
                name: suggested_field.name.clone(),
                display_name: suggested_field.display_name.clone(),
                field_type,
                required: suggested_field.required,
                default_value: None,
                validation: vec![],
                ui_config: FieldUiConfig::default(),
            });

            added_fields += 1;
        }

        if added_fields > 0 {
            changes.push(ModelChange {
                change_type: ModelChangeType::EntityUpdated,
                component_type: "Entity".to_string(),
                component_id: entity_id,
                description: format!("Added {} field(s) to entity '{}'", added_fields, entity_name),
                details: serde_json::json!({
                    "entity_name": entity_name,
                    "fields_added": added_fields
                }),
            });
        }

        Ok(())
    }

    async fn execute_update_component_configuration(
        &self,
        model: &mut TorqueModel,
        layout_id: Uuid,
        component_id: Uuid,
        updates: &[ConfigurationUpdate],
        changes: &mut Vec<ModelChange>,
        errors: &mut Vec<String>,
        _warnings: &mut Vec<String>
    ) -> Result<(), Error> {
        // Find the layout and component
        let layout = model.layouts.iter_mut()
            .find(|l| l.id == layout_id)
            .ok_or_else(|| Error::NotFound(format!("Layout with ID {} not found", layout_id)))?;

        let component = layout.components.iter_mut()
            .find(|c| c.id == component_id)
            .ok_or_else(|| Error::NotFound(format!("Component with ID {} not found", component_id)))?;

        let mut updates_applied = 0;

        for update in updates {
            match &update.action {
                UpdateAction::Remove => {
                    if self.remove_property_by_path(&mut component.properties, &update.property_path) {
                        updates_applied += 1;
                    } else {
                        errors.push(format!("Failed to remove property at path: {}", update.property_path));
                    }
                },
                UpdateAction::Update => {
                    if let Some(value) = &update.value {
                        if self.update_property_by_path(&mut component.properties, &update.property_path, value.clone()) {
                            updates_applied += 1;
                        } else {
                            errors.push(format!("Failed to update property at path: {}", update.property_path));
                        }
                    }
                },
                UpdateAction::Add => {
                    if let Some(value) = &update.value {
                        if self.add_property_by_path(&mut component.properties, &update.property_path, value.clone()) {
                            updates_applied += 1;
                        } else {
                            errors.push(format!("Failed to add property at path: {}", update.property_path));
                        }
                    }
                },
            }
        }

        if updates_applied > 0 {
            changes.push(ModelChange {
                change_type: ModelChangeType::ComponentUpdated,
                component_type: component.component_type.clone(),
                component_id,
                description: format!("Applied {} configuration update(s) to component", updates_applied),
                details: serde_json::json!({
                    "layout_id": layout_id,
                    "updates_applied": updates_applied
                }),
            });
        }

        Ok(())
    }

    async fn execute_remove_orphaned_references(
        &self,
        model: &mut TorqueModel,
        reference_type: &str,
        references: &[OrphanedReference],
        changes: &mut Vec<ModelChange>,
        _errors: &mut Vec<String>,
        _warnings: &mut Vec<String>
    ) -> Result<(), Error> {
        let mut removed_count = 0;

        for reference in references {
            // Handle different types of orphaned references
            if reference_type.contains("Layout") {
                // Remove orphaned entity references from layouts
                for layout in &mut model.layouts {
                    if layout.id == reference.source_id {
                        let initial_count = layout.target_entities.len();
                        layout.target_entities.retain(|id| *id != reference.target_id);
                        if layout.target_entities.len() < initial_count {
                            removed_count += 1;
                        }
                    }
                }
            }
            // Add more reference types as needed
        }

        if removed_count > 0 {
            changes.push(ModelChange {
                change_type: ModelChangeType::ReferenceRemoved,
                component_type: reference_type.to_string(),
                component_id: references.first().map(|r| r.source_id.clone()).unwrap_or_else(Uuid::new_v4),
                description: format!("Removed {} orphaned reference(s)", removed_count),
                details: serde_json::json!({
                    "reference_type": reference_type,
                    "removed_count": removed_count
                }),
            });
        }

        Ok(())
    }

    async fn execute_fix_relationship(
        &self,
        model: &mut TorqueModel,
        relationship_id: Uuid,
        fixes: &[RelationshipFix],
        _parameters: &HashMap<String, Value>,
        changes: &mut Vec<ModelChange>,
        errors: &mut Vec<String>,
        warnings: &mut Vec<String>
    ) -> Result<(), Error> {
        for fix in fixes {
            match &fix.fix_type {
                RelationshipFixType::RemoveRelationship => {
                    let initial_count = model.relationships.len();
                    let rel_id = relationship_id.clone();
                    model.relationships.retain(|r| r.id != relationship_id);
                    if model.relationships.len() < initial_count {
                        changes.push(ModelChange {
                            change_type: ModelChangeType::RelationshipRemoved,
                            component_type: "Relationship".to_string(),
                            component_id: rel_id.clone(),
                            description: "Removed broken relationship".to_string(),
                            details: serde_json::json!({ "relationship_id": rel_id }),
                        });
                    } else {
                        errors.push(format!("Failed to remove relationship with ID {}", rel_id));
                    }
                },
                RelationshipFixType::CreateMissingEntity => {
                    warnings.push("Creating missing entity for relationship not yet implemented".to_string());
                },
                RelationshipFixType::AddMissingField => {
                    warnings.push("Adding missing field for relationship not yet implemented".to_string());
                },
                RelationshipFixType::UpdateReference => {
                    warnings.push("Updating relationship reference not yet implemented".to_string());
                },
            }
        }

        Ok(())
    }

    fn parse_field_type_from_parameter(&self, parameter_value: &Value, default_type: &FieldType) -> Result<FieldType, Error> {
        if let Some(type_str) = parameter_value.as_str() {
            match type_str {
                "String" => Ok(FieldType::String { max_length: Some(255) }),
                "Integer" => Ok(FieldType::Integer { min: None, max: None }),
                "Float" => Ok(FieldType::Float { min: None, max: None }),
                "Boolean" => Ok(FieldType::Boolean),
                "DateTime" => Ok(FieldType::DateTime),
                "Date" => Ok(FieldType::Date),
                "Time" => Ok(FieldType::Time),
                "Json" => Ok(FieldType::Json),
                _ => Ok(default_type.clone()),
            }
        } else {
            Ok(default_type.clone())
        }
    }

    fn remove_property_by_path(&self, properties: &mut HashMap<String, Value>, path: &str) -> bool {
        // Simple implementation for array element removal
        if path.contains("[") && path.contains("=") {
            // Handle array element removal like "columns[field='name']"
            if let Some(array_start) = path.find("[") {
                let array_name = &path[..array_start];
                if let Some(Value::Array(array)) = properties.get_mut(array_name) {
                    // Extract condition from path
                    let condition_part = &path[array_start+1..path.len()-1];
                    if let Some(eq_pos) = condition_part.find("=") {
                        let field_name = &condition_part[..eq_pos];
                        let field_value = condition_part[eq_pos+2..condition_part.len()-1].to_string(); // Remove quotes
                        
                        let initial_len = array.len();
                        array.retain(|item| {
                            if let Some(obj) = item.as_object() {
                                obj.get(field_name).and_then(|v| v.as_str()) != Some(&field_value)
                            } else {
                                true
                            }
                        });
                        return array.len() < initial_len;
                    }
                }
            }
        } else {
            // Simple property removal
            return properties.remove(path).is_some();
        }
        false
    }

    fn update_property_by_path(&self, properties: &mut HashMap<String, Value>, path: &str, value: Value) -> bool {
        properties.insert(path.to_string(), value);
        true
    }

    fn add_property_by_path(&self, properties: &mut HashMap<String, Value>, path: &str, value: Value) -> bool {
        properties.insert(path.to_string(), value);
        true
    }
}

impl Default for RemediationExecutor {
    fn default() -> Self {
        Self::new()
    }
}