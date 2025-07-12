use serde_json::{Value, Map};
use crate::common::{Uuid, UtcDateTime};
use crate::services::entity::{Entity, CreateEntityRequest, UpdateEntityRequest};
use crate::model::types::{ModelEntity, FieldType};

/// Direct JSONB mapping for TorqueApp - no transformations
/// Entity data is stored exactly as it will be consumed by frontend components
pub struct DirectMapping;

impl DirectMapping {
    /// Convert FieldType to string representation
    fn field_type_to_string(field_type: &FieldType) -> &'static str {
        match field_type {
            FieldType::String { .. } => "string",
            FieldType::Integer { .. } => "integer",
            FieldType::Float { .. } => "float",
            FieldType::Boolean => "boolean",
            FieldType::DateTime => "datetime",
            FieldType::Date => "date",
            FieldType::Time => "time",
            FieldType::Json => "json",
            FieldType::Binary => "binary",
            FieldType::Enum { .. } => "enum",
            FieldType::Reference { .. } => "reference",
            FieldType::Array { .. } => "array",
        }
    }
    /// Prepare entity data for storage with minimal transformations
    /// Only adds required system fields (id, timestamps) and UI hints
    pub fn prepare_for_storage(
        data: Value,
        entity_type: &str,
        entity_definition: Option<&ModelEntity>,
    ) -> Value {
        let mut map = match data {
            Value::Object(m) => m,
            _ => Map::new(),
        };
        
        // Add system fields if not present
        if !map.contains_key("_id") {
            map.insert("_id".to_string(), Value::String(Uuid::new_v4().to_string()));
        }
        
        if !map.contains_key("_createdAt") {
            map.insert("_createdAt".to_string(), Value::String(UtcDateTime::now().to_string()));
        }
        
        if !map.contains_key("_updatedAt") {
            map.insert("_updatedAt".to_string(), Value::String(UtcDateTime::now().to_string()));
        }
        
        if !map.contains_key("_entityType") {
            map.insert("_entityType".to_string(), Value::String(entity_type.to_string()));
        }
        
        // If we have entity definition, add UI hints and ensure required fields
        if let Some(entity_def) = entity_definition {
            // Add UI hints for the entity
            let mut ui_hints = Map::new();
            ui_hints.insert("displayName".to_string(), Value::String(entity_def.display_name.clone()));
            ui_hints.insert("entityType".to_string(), serde_json::to_value(&entity_def.entity_type).unwrap_or(Value::Null));
            
            // Add field-level UI hints
            let mut field_hints = Map::new();
            for field in &entity_def.fields {
                let mut field_hint = Map::new();
                field_hint.insert("displayName".to_string(), Value::String(field.display_name.clone()));
                field_hint.insert("fieldType".to_string(), Value::String(Self::field_type_to_string(&field.field_type).to_string()));
                field_hint.insert("required".to_string(), Value::Bool(field.required));
                
                // Add UI config hints
                if let Some(label) = &field.ui_config.label {
                    field_hint.insert("label".to_string(), Value::String(label.clone()));
                }
                if let Some(placeholder) = &field.ui_config.placeholder {
                    field_hint.insert("placeholder".to_string(), Value::String(placeholder.clone()));
                }
                if let Some(help_text) = &field.ui_config.help_text {
                    field_hint.insert("helpText".to_string(), Value::String(help_text.clone()));
                }
                field_hint.insert("component".to_string(), Value::String(field.ui_config.component_type.clone()));
                
                field_hints.insert(field.name.clone(), Value::Object(field_hint));
                
                // Ensure required fields have defaults
                if field.required && !map.contains_key(&field.name) {
                    if let Some(default) = &field.default_value {
                        map.insert(field.name.clone(), default.clone());
                    }
                }
            }
            
            ui_hints.insert("fields".to_string(), Value::Object(field_hints));
            map.insert("_uiHints".to_string(), Value::Object(ui_hints));
        }
        
        Value::Object(map)
    }
    
    /// Extract entity data for frontend consumption
    /// Returns data exactly as stored (no transformation)
    pub fn extract_for_frontend(entity: &Entity) -> Value {
        entity.data.clone()
    }
    
    /// Extract UI hints from entity data
    pub fn extract_ui_hints<'a>(entity_data: &'a Value) -> Option<&'a Map<String, Value>> {
        entity_data
            .as_object()
            .and_then(|obj| obj.get("_uiHints"))
            .and_then(|hints| hints.as_object())
    }
    
    /// Get field UI hint for a specific field
    pub fn get_field_ui_hint<'a>(entity_data: &'a Value, field_name: &str) -> Option<&'a Map<String, Value>> {
        Self::extract_ui_hints(entity_data)
            .and_then(|hints| hints.get("fields"))
            .and_then(|fields| fields.as_object())
            .and_then(|fields| fields.get(field_name))
            .and_then(|field| field.as_object())
    }
    
    /// Create entity request with direct mapping
    pub fn create_entity_request(
        application_id: Uuid,
        entity_type: String,
        data: Value,
        entity_definition: Option<&ModelEntity>,
    ) -> CreateEntityRequest {
        let prepared_data = Self::prepare_for_storage(data, &entity_type, entity_definition);
        
        CreateEntityRequest {
            application_id,
            entity_type,
            data: prepared_data,
        }
    }
    
    /// Update entity request with direct mapping
    pub fn update_entity_request(
        data: Value,
        preserve_system_fields: bool,
    ) -> UpdateEntityRequest {
        let mut map = match data {
            Value::Object(m) => m,
            _ => Map::new(),
        };
        
        // Update the _updatedAt timestamp
        map.insert("_updatedAt".to_string(), Value::String(UtcDateTime::now().to_string()));
        
        // Remove system fields if not preserving them
        if !preserve_system_fields {
            map.remove("_id");
            map.remove("_createdAt");
            map.remove("_entityType");
        }
        
        UpdateEntityRequest {
            data: Value::Object(map),
        }
    }
    
    /// Build query filter for entity retrieval
    pub fn build_query_filter(filters: Option<Value>) -> Map<String, Value> {
        match filters {
            Some(Value::Object(map)) => map,
            _ => Map::new(),
        }
    }
    
    /// Format entity list response for frontend
    pub fn format_entity_list(
        entities: Vec<Entity>,
        page: u64,
        limit: u64,
        total: u64,
    ) -> Value {
        // Extract data directly without transformation
        let data: Vec<Value> = entities.into_iter()
            .map(|e| Self::extract_for_frontend(&e))
            .collect();
        
        serde_json::json!({
            "data": data,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "hasMore": (page * limit) < total
            }
        })
    }
    
    /// Generate DataGrid columns from entity definition
    pub fn generate_datagrid_columns(entity: &ModelEntity) -> Vec<Value> {
        let mut columns = vec![];
        
        // Add system columns
        columns.push(serde_json::json!({
            "key": "_id",
            "title": "ID",
            "dataType": "string",
            "sortable": true,
            "filterable": true,
            "width": 200,
            "hidden": true
        }));
        
        // Add field columns
        for field in &entity.fields {
            let data_type = match &field.field_type {
                FieldType::String { .. } => "string",
                FieldType::Integer { .. } | FieldType::Float { .. } => "number",
                FieldType::Boolean => "boolean",
                FieldType::DateTime | FieldType::Date | FieldType::Time => "date",
                FieldType::Json => "json",
                FieldType::Binary => "binary",
                FieldType::Enum { .. } => "enum",
                FieldType::Array { .. } => "array",
                FieldType::Reference { .. } => "reference",
            };
            
            columns.push(serde_json::json!({
                "key": field.name,
                "title": field.display_name,
                "dataType": data_type,
                "sortable": true,
                "filterable": true,
                "width": 150,
                "required": field.required,
                "uiConfig": field.ui_config
            }));
        }
        
        // Add timestamp columns
        columns.push(serde_json::json!({
            "key": "_createdAt",
            "title": "Created",
            "dataType": "date",
            "sortable": true,
            "filterable": true,
            "width": 180
        }));
        
        columns.push(serde_json::json!({
            "key": "_updatedAt",
            "title": "Updated",
            "dataType": "date",
            "sortable": true,
            "filterable": true,
            "width": 180
        }));
        
        columns
    }
    
    /// Generate form fields from entity definition
    pub fn generate_form_fields(entity: &ModelEntity) -> Vec<Value> {
        entity.fields.iter().map(|field| {
            let field_type = match &field.field_type {
                FieldType::String { .. } => {
                    if field.ui_config.custom_props.get("multiline").and_then(|v| v.as_bool()).unwrap_or(false) {
                        "textarea"
                    } else {
                        "text"
                    }
                },
                FieldType::Integer { .. } | FieldType::Float { .. } => "number",
                FieldType::Boolean => "checkbox",
                FieldType::DateTime => "datetime-local",
                FieldType::Date => "date",
                FieldType::Time => "time",
                FieldType::Binary => "file",
                FieldType::Enum { .. } => "select",
                FieldType::Array { .. } => "multiselect",
                FieldType::Reference { .. } => "select",
                FieldType::Json => "textarea",
            };
            
            serde_json::json!({
                "id": field.id,
                "name": field.name,
                "label": field.display_name,
                "type": field_type,
                "required": field.required,
                "defaultValue": field.default_value,
                "validation": field.validation,
                "uiConfig": field.ui_config
            })
        }).collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_prepare_for_storage() {
        let data = serde_json::json!({
            "name": "Test Item",
            "value": 42
        });
        
        let result = DirectMapping::prepare_for_storage(data, "test_entity", None);
        let obj = result.as_object().unwrap();
        
        assert!(obj.contains_key("_id"));
        assert!(obj.contains_key("_createdAt"));
        assert!(obj.contains_key("_updatedAt"));
        assert_eq!(obj.get("_entityType").unwrap().as_str().unwrap(), "test_entity");
        assert_eq!(obj.get("name").unwrap().as_str().unwrap(), "Test Item");
        assert_eq!(obj.get("value").unwrap().as_i64().unwrap(), 42);
    }
    
    #[test]
    fn test_ui_hints() {
        // Test that UI hints extraction works
        let data_with_hints = serde_json::json!({
            "name": "Test Item",
            "_uiHints": {
                "displayName": "Test Entity",
                "fields": {
                    "name": {
                        "displayName": "Name",
                        "label": "Item Name",
                        "placeholder": "Enter name...",
                        "helpText": "The name of the item"
                    }
                }
            }
        });
        
        // Test extraction
        let ui_hints = DirectMapping::extract_ui_hints(&data_with_hints).unwrap();
        assert_eq!(ui_hints.get("displayName").unwrap().as_str().unwrap(), "Test Entity");
        
        // Test field hint extraction
        let field_hint = DirectMapping::get_field_ui_hint(&data_with_hints, "name").unwrap();
        assert_eq!(field_hint.get("label").unwrap().as_str().unwrap(), "Item Name");
    }
}