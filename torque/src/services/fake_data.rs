use crate::{Result};
use sea_orm::DatabaseConnection;
use std::sync::Arc;
use std::collections::HashMap;
use crate::services::app_database::AppDatabaseService;
use crate::model::types::{TorqueModel, ModelEntity, ModelRelationship, RelationshipType};
use serde::{Serialize, Deserialize};
use fake::{Fake, Faker};
use fake::faker::*;
use rand::seq::SliceRandom;
use ::chrono::Utc;

/// Service for generating realistic fake data for app databases
#[derive(Clone)]
pub struct FakeDataService {
    app_database_service: Arc<AppDatabaseService>,
    max_instances_per_entity: usize,
}

#[derive(Debug, Serialize)]
pub struct SeedReport {
    pub entities_created: HashMap<String, u64>,
    pub relationships_created: u64,
    pub duration_ms: u64,
    pub total_records: u64,
}

#[derive(Debug, Deserialize)]
pub struct SeedRequest {
    pub max_instances_per_entity: Option<usize>, // Default: 5, Max: 10
    pub specific_entities: Option<Vec<String>>, // Empty = all entities
    pub preserve_existing: bool, // Default: false
}

impl Default for SeedRequest {
    fn default() -> Self {
        Self {
            max_instances_per_entity: Some(5),
            specific_entities: None,
            preserve_existing: false,
        }
    }
}

#[derive(Debug, Serialize)]
pub struct EmptyResponse {
    pub tables_emptied: u64,
    pub duration_ms: u64,
}

#[derive(Debug, Serialize)]
pub struct SyncResponse {
    pub tables_created: u64,
    pub indexes_created: u64,
    pub duration_ms: u64,
}

const BATCH_SIZE: usize = 100;

impl FakeDataService {
    pub fn new(app_database_service: Arc<AppDatabaseService>) -> Self {
        Self {
            app_database_service,
            max_instances_per_entity: 5, // Default max
        }
    }

    /// Seed entire model with fake data
    pub async fn seed_model_data(
        &self,
        model_id: &str,
        model: &TorqueModel,
        request: &SeedRequest,
    ) -> Result<SeedReport> {
        let start_time = std::time::Instant::now();
        let max_instances = request.max_instances_per_entity
            .unwrap_or(self.max_instances_per_entity)
            .min(10); // Cap at 10

        let mut entities_created = HashMap::new();
        let mut total_records = 0;

        // Clear existing data if not preserving
        if !request.preserve_existing {
            self.app_database_service.empty_app_database(model_id).await?;
        }

        // Get entities to seed
        let entities_to_seed: Vec<&ModelEntity> = if let Some(specific) = &request.specific_entities {
            model.entities.iter()
                .filter(|e| specific.contains(&e.name))
                .collect()
        } else {
            model.entities.iter().collect()
        };

        // Store generated entity IDs for relationship creation
        let mut entity_ids: HashMap<String, Vec<String>> = HashMap::new();

        // Generate data for each entity
        for entity in entities_to_seed {
            let count = self.seed_entity_data(model_id, entity, max_instances).await?;
            entities_created.insert(entity.name.clone(), count);
            total_records += count;

            // Collect generated IDs for relationships
            let ids = self.get_entity_ids(model_id, &entity.name).await?;
            entity_ids.insert(entity.name.clone(), ids);
        }

        // Generate relationships
        let relationships_created = self.generate_relationships(
            model_id,
            &model.relationships,
            &entity_ids,
        ).await?;

        let duration_ms = start_time.elapsed().as_millis() as u64;

        Ok(SeedReport {
            entities_created,
            relationships_created,
            duration_ms,
            total_records,
        })
    }

    /// Seed data for a specific entity
    pub async fn seed_entity_data(
        &self,
        model_id: &str,
        entity: &ModelEntity,
        count: usize,
    ) -> Result<u64> {
        let conn = self.app_database_service.get_connection();
        let _table_name = format!("app_{}_{}", model_id.replace('-', "_"), entity.name.to_lowercase());

        let mut records_created = 0;
        let batches = (count + BATCH_SIZE - 1) / BATCH_SIZE;

        for batch in 0..batches {
            let batch_size = std::cmp::min(BATCH_SIZE, count - batch * BATCH_SIZE);
            let fake_data = self.generate_batch_data(entity, batch_size);
            
            for data in fake_data {
                self.insert_record(model_id, &entity.name, data, &conn).await?;
                records_created += 1;
            }
        }

        tracing::info!("Seeded {} records for entity: {} in model: {}", records_created, entity.name, model_id);
        Ok(records_created)
    }

    /// Generate batch of fake data for an entity
    fn generate_batch_data(&self, entity: &ModelEntity, count: usize) -> Vec<HashMap<String, serde_json::Value>> {
        let mut batch = Vec::with_capacity(count);
        
        for _ in 0..count {
            let mut record = HashMap::new();
            
            // Generate data for each field
            for field in &entity.fields {
                let value = self.generate_fake_value(&field.field_type, &field.name);
                record.insert(field.name.clone(), value);
            }
            
            batch.push(record);
        }
        
        batch
    }

    /// Generate fake value based on field type and name
    pub fn generate_fake_value(&self, field_type: &crate::model::types::FieldType, field_name: &str) -> serde_json::Value {
        use crate::model::types::FieldType;
        match field_type {
            FieldType::String { .. } => self.generate_string_value(field_name),
            FieldType::Integer { .. } => self.generate_integer_value(field_name),
            FieldType::Float { .. } => self.generate_float_value(field_name),
            FieldType::Boolean => Faker.fake::<bool>().into(),
            FieldType::DateTime => Utc::now()
                .format("%Y-%m-%dT%H:%M:%S%.3fZ")
                .to_string()
                .into(),
            FieldType::Date => Utc::now()
                .format("%Y-%m-%d")
                .to_string()
                .into(),
            FieldType::Time => Utc::now()
                .format("%H:%M:%S")
                .to_string()
                .into(),
            FieldType::Json => {
                // Generate simple object
                let mut obj = serde_json::Map::new();
                obj.insert("key".to_string(), lorem::en::Word().fake::<String>().into());
                obj.insert("value".to_string(), (1..100).fake::<i32>().into());
                serde_json::Value::Object(obj)
            },
            FieldType::Binary => serde_json::Value::String("binary_data_placeholder".to_string()),
            FieldType::Enum { values } => {
                if !values.is_empty() {
                    values.choose(&mut rand::thread_rng())
                        .unwrap_or(&values[0])
                        .clone()
                        .into()
                } else {
                    serde_json::Value::String("unknown".to_string())
                }
            },
            FieldType::Reference { .. } => {
                // Generate a random UUID for reference
                crate::common::Uuid::new_v4().to_string().into()
            },
            FieldType::Array { .. } => {
                // Generate simple array of strings
                let items: Vec<String> = (0..3).map(|_| lorem::en::Word().fake()).collect();
                serde_json::to_value(items).unwrap_or(serde_json::Value::Null)
            },
        }
    }

    /// Generate string value based on field name context
    fn generate_string_value(&self, field_name: &str) -> serde_json::Value {
        let lower_name = field_name.to_lowercase();
        
        match lower_name.as_str() {
            "name" | "first_name" | "firstname" => {
                name::en::FirstName().fake::<String>().into()
            },
            "last_name" | "lastname" | "surname" => {
                name::en::LastName().fake::<String>().into()
            },
            "full_name" | "fullname" => {
                name::en::Name().fake::<String>().into()
            },
            "email" | "email_address" => {
                internet::en::SafeEmail().fake::<String>().into()
            },
            "phone" | "phone_number" | "mobile" | "cell" => {
                phone_number::en::PhoneNumber().fake::<String>().into()
            },
            "address" | "street_address" => {
                address::en::StreetName().fake::<String>().into()
            },
            "city" => {
                address::en::CityName().fake::<String>().into()
            },
            "state" | "province" => {
                address::en::StateName().fake::<String>().into()
            },
            "country" => {
                address::en::CountryName().fake::<String>().into()
            },
            "zip" | "zipcode" | "postal_code" => {
                address::en::ZipCode().fake::<String>().into()
            },
            "company" | "company_name" | "organization" => {
                company::en::CompanyName().fake::<String>().into()
            },
            "job_title" | "title" | "position" => {
                job::en::Title().fake::<String>().into()
            },
            "username" | "user_name" => {
                internet::en::Username().fake::<String>().into()
            },
            "website" | "url" | "homepage" => {
                internet::en::DomainSuffix().fake::<String>().into()
            },
            "description" | "bio" | "about" => {
                lorem::en::Sentence(3..8).fake::<String>().into()
            },
            "status" => {
                {
                    use rand::seq::SliceRandom;
                    vec!["active", "inactive", "pending", "completed"]
                        .choose(&mut rand::thread_rng())
                        .unwrap_or(&"active")
                        .to_string()
                        .into()
                }
            },
            "category" | "type" => {
                {
                    use rand::seq::SliceRandom;
                    vec!["standard", "premium", "basic", "advanced"]
                        .choose(&mut rand::thread_rng())
                        .unwrap_or(&"standard")
                        .to_string()
                        .into()
                }
            },
            _ => {
                // Default to lorem words for unknown fields
                lorem::en::Words(1..4).fake::<Vec<String>>().join(" ").into()
            }
        }
    }

    /// Generate integer value based on field name context
    fn generate_integer_value(&self, field_name: &str) -> serde_json::Value {
        let lower_name = field_name.to_lowercase();
        
        let range = match lower_name.as_str() {
            "age" => 18..80,
            "quantity" | "qty" | "count" => 1..100,
            "price" | "amount" | "cost" => 10..1000,
            "year" => 2020..2024,
            "rating" | "score" => 1..10,
            "priority" => 1..5,
            "level" => 1..10,
            _ => 1..1000,
        };
        
        range.fake::<i32>().into()
    }

    /// Generate float value based on field name context
    fn generate_float_value(&self, field_name: &str) -> serde_json::Value {
        let lower_name = field_name.to_lowercase();
        
        let value = match lower_name.as_str() {
            "price" | "amount" | "cost" => (10.0..1000.0).fake::<f64>(),
            "rating" | "score" => (1.0..5.0).fake::<f64>(),
            "percentage" | "percent" => (0.0..100.0).fake::<f64>(),
            "weight" => (0.1..100.0).fake::<f64>(),
            "height" => (0.1..3.0).fake::<f64>(),
            "latitude" | "lat" => (-90.0..90.0).fake::<f64>(),
            "longitude" | "lng" | "lon" => (-180.0..180.0).fake::<f64>(),
            _ => (1.0..1000.0).fake::<f64>(),
        };
        
        // Round to 2 decimal places
        ((value * 100.0).round() / 100.0).into()
    }

    /// Insert a single record into the database
    async fn insert_record(
        &self,
        model_id: &str,
        entity_name: &str,
        data: HashMap<String, serde_json::Value>,
        _conn: &DatabaseConnection,
    ) -> Result<()> {
        if data.is_empty() {
            return Ok(());
        }

        // Convert HashMap to JSON Value
        let json_data = serde_json::Value::Object(
            data.into_iter()
                .map(|(k, v)| (k, v))
                .collect()
        );

        // Use the unified AppEntities table through AppDatabaseService
        self.app_database_service
            .create_entity(model_id, entity_name, json_data)
            .await?;

        tracing::debug!("Inserted fake entity record for {} in model {}", entity_name, model_id);
        Ok(())
    }

    /// Get generated entity IDs for relationship creation
    async fn get_entity_ids(&self, model_id: &str, entity_name: &str) -> Result<Vec<String>> {
        // Get entities from the unified AppEntities table
        let entities = self.app_database_service
            .get_entities(model_id, entity_name, 1000, 0)  // Get up to 1000 entities
            .await?;

        // Extract IDs from the metadata added by get_entities
        let ids: Vec<String> = entities
            .into_iter()
            .filter_map(|entity| {
                if let serde_json::Value::Object(obj) = entity {
                    if let Some(serde_json::Value::String(id)) = obj.get("_id") {
                        Some(id.clone())
                    } else {
                        None
                    }
                } else {
                    None
                }
            })
            .collect();

        Ok(ids)
    }

    /// Generate relationships between entities
    pub async fn generate_relationships(
        &self,
        model_id: &str,
        relationships: &[ModelRelationship],
        entity_ids: &HashMap<String, Vec<String>>,
    ) -> Result<u64> {
        let conn = self.app_database_service.get_connection();
        let mut relationships_created = 0;

        for relationship in relationships {
            match relationship.relationship_type {
                RelationshipType::OneToMany => {
                    relationships_created += self.create_one_to_many_links(
                        model_id,
                        relationship,
                        entity_ids,
                        &conn,
                    ).await?;
                },
                RelationshipType::ManyToOne => {
                    relationships_created += self.create_one_to_many_links(
                        model_id,
                        relationship,
                        entity_ids,
                        &conn,
                    ).await?;
                },
                RelationshipType::ManyToMany => {
                    relationships_created += self.create_many_to_many_links(
                        model_id,
                        relationship,
                        entity_ids,
                        &conn,
                    ).await?;
                },
                RelationshipType::OneToOne => {
                    relationships_created += self.create_one_to_one_links(
                        model_id,
                        relationship,
                        entity_ids,
                        &conn,
                    ).await?;
                },
            }
        }

        Ok(relationships_created)
    }

    /// Create one-to-many relationship links
    async fn create_one_to_many_links(
        &self,
        _model_id: &str,
        _relationship: &ModelRelationship,
        _entity_ids: &HashMap<String, Vec<String>>,
        _conn: &DatabaseConnection,
    ) -> Result<u64> {
        // TODO: Implement relationship creation with proper entity name lookup
        tracing::warn!("One-to-many relationships not yet fully implemented in fake data generation");
        Ok(0)
    }

    /// Create many-to-many relationship links
    async fn create_many_to_many_links(
        &self,
        _model_id: &str,
        _relationship: &ModelRelationship,
        _entity_ids: &HashMap<String, Vec<String>>,
        _conn: &DatabaseConnection,
    ) -> Result<u64> {
        // TODO: Implement many-to-many relationships with junction tables
        tracing::warn!("Many-to-many relationships not yet implemented in fake data generation");
        Ok(0)
    }

    /// Create one-to-one relationship links
    async fn create_one_to_one_links(
        &self,
        _model_id: &str,
        _relationship: &ModelRelationship,
        _entity_ids: &HashMap<String, Vec<String>>,
        _conn: &DatabaseConnection,
    ) -> Result<u64> {
        // TODO: Implement one-to-one relationships with proper entity name lookup
        tracing::warn!("One-to-one relationships not yet fully implemented in fake data generation");
        Ok(0)
    }
}