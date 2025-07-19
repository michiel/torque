# Backend Database Management Implementation Plan

## Overview

Implementation plan for backend features supporting the App Previewer functionality:
- App database management (view, empty, seed)
- Fake data generation using fake.rs (max 5 instances per entity)
- REST API endpoints for frontend integration

## Architecture Requirements

### Design Principles
- **Performance First**: Optimized database operations with connection pooling
- **Model-Driven**: Dynamic table creation based on Torque Model definitions
- **Safety First**: Separate app databases per model to prevent data mixing
- **Fake Data Quality**: Realistic test data generation using fake.rs

### Database Architecture

#### App Database Strategy
```
torque_app_db_{model_id}     # Separate database per model
├── dynamic tables per entity type
├── standardized ID and timestamp columns  
├── JSON storage for flexible field types
└── relationship enforcement via foreign keys
```

#### Core Database Operations
1. **Schema Management**: Dynamic table creation from model definitions
2. **Data Operations**: CRUD operations on app entities
3. **Seeding Operations**: Bulk insert of realistic fake data
4. **Cleanup Operations**: Truncate/drop operations for testing

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1)

#### 1.1 App Database Service
**File**: `/torque/src/services/app_database.rs`

```rust
pub struct AppDatabaseService {
    pool: Arc<DatabaseConnection>,
    cache: Arc<CacheService>,
    model_service: Arc<ModelService>,
}

impl AppDatabaseService {
    // Core database operations
    pub async fn create_app_database(&self, model_id: &str) -> Result<()>
    pub async fn drop_app_database(&self, model_id: &str) -> Result<()>
    pub async fn empty_app_database(&self, model_id: &str) -> Result<()>
    
    // Schema operations
    pub async fn sync_schema(&self, model_id: &str) -> Result<()>
    pub async fn create_entity_table(&self, model_id: &str, entity: &Entity) -> Result<()>
    
    // Data operations
    pub async fn get_entity_count(&self, model_id: &str, entity_type: &str) -> Result<u64>
    pub async fn get_entities(&self, model_id: &str, entity_type: &str, limit: u64, offset: u64) -> Result<Vec<serde_json::Value>>
}
```

#### 1.2 Database Schema Generation
**File**: `/torque/src/services/schema_generator.rs`

```rust
pub struct SchemaGenerator;

impl SchemaGenerator {
    pub fn generate_table_sql(entity: &Entity) -> String
    pub fn generate_index_sql(entity: &Entity) -> Vec<String>
    pub fn map_field_type(field_type: &str) -> &'static str
    pub fn generate_foreign_key_constraints(relationships: &[Relationship]) -> Vec<String>
}
```

#### 1.3 Fake Data Generation Service
**File**: `/torque/src/services/fake_data.rs`

```rust
use fake::{Fake, Faker};

pub struct FakeDataService {
    max_instances_per_entity: usize, // Default: 5
}

impl FakeDataService {
    pub async fn seed_model_data(&self, model_id: &str, model: &TorqueModel) -> Result<SeedReport>
    pub async fn seed_entity_data(&self, model_id: &str, entity: &Entity, count: usize) -> Result<Vec<serde_json::Value>>
    pub fn generate_fake_value(&self, field_type: &str, field_name: &str) -> serde_json::Value
    pub fn generate_relationships(&self, entities_data: &HashMap<String, Vec<serde_json::Value>>) -> Result<()>
}

pub struct SeedReport {
    pub entities_created: HashMap<String, u64>,
    pub relationships_created: u64,
    pub duration_ms: u64,
}
```

### Phase 2: REST API Endpoints (Week 1-2)

#### 2.1 App Database API Routes
**File**: `/torque/src/server/handlers/app_database.rs`

```rust
// GET /api/models/{model_id}/app-database/status
pub async fn get_database_status(Path(model_id): Path<String>) -> Result<Json<DatabaseStatus>>

// GET /api/models/{model_id}/app-database/entities
pub async fn get_entities_overview(Path(model_id): Path<String>) -> Result<Json<Vec<EntityOverview>>>

// GET /api/models/{model_id}/app-database/entities/{entity_type}
pub async fn get_entity_data(
    Path((model_id, entity_type)): Path<(String, String)>,
    Query(params): Query<PaginationParams>
) -> Result<Json<EntityDataResponse>>

// POST /api/models/{model_id}/app-database/seed
pub async fn seed_database(
    Path(model_id): Path<String>,
    Json(request): Json<SeedRequest>
) -> Result<Json<SeedReport>>

// DELETE /api/models/{model_id}/app-database
pub async fn empty_database(Path(model_id): Path<String>) -> Result<Json<EmptyResponse>>

// POST /api/models/{model_id}/app-database/sync
pub async fn sync_schema(Path(model_id): Path<String>) -> Result<Json<SyncResponse>>
```

#### 2.2 API Data Types
```rust
#[derive(Serialize)]
pub struct DatabaseStatus {
    pub exists: bool,
    pub total_entities: u64,
    pub entity_counts: HashMap<String, u64>,
    pub last_seeded: Option<chrono::DateTime<chrono::Utc>>,
    pub schema_version: String,
}

#[derive(Serialize)]
pub struct EntityOverview {
    pub entity_type: String,
    pub display_name: String,
    pub record_count: u64,
    pub last_updated: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Deserialize)]
pub struct SeedRequest {
    pub max_instances_per_entity: Option<usize>, // Default: 5, Max: 10
    pub specific_entities: Option<Vec<String>>, // Empty = all entities
    pub preserve_existing: bool, // Default: false
}
```

### Phase 3: Dynamic Schema Management (Week 2)

#### 3.1 Entity Table Generation
```sql
-- Example generated table for Customer entity
CREATE TABLE app_{model_id}_customer (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Dynamic fields based on entity definition
    name TEXT NOT NULL,
    email TEXT,
    phone_number TEXT,
    address JSONB,
    
    -- Metadata
    _entity_type TEXT DEFAULT 'customer',
    _model_id TEXT DEFAULT '{model_id}'
);

-- Indexes for performance
CREATE INDEX idx_app_{model_id}_customer_created_at ON app_{model_id}_customer(created_at);
CREATE INDEX idx_app_{model_id}_customer_email ON app_{model_id}_customer(email);
```

#### 3.2 Field Type Mapping
```rust
pub fn map_torque_field_to_sql(field_type: &str) -> &'static str {
    match field_type {
        "String" => "TEXT",
        "Integer" => "INTEGER",
        "Float" => "REAL",
        "Boolean" => "BOOLEAN",
        "DateTime" => "TIMESTAMP WITH TIME ZONE",
        "Reference" => "UUID", // Foreign key
        "Array" => "JSONB",
        "Object" => "JSONB",
        _ => "TEXT", // Fallback
    }
}
```

### Phase 4: Fake Data Generation (Week 2)

#### 4.1 Field-Specific Data Generation
```rust
impl FakeDataService {
    pub fn generate_fake_value(&self, field_type: &str, field_name: &str) -> serde_json::Value {
        use fake::faker::*;
        
        match field_type {
            "String" => match field_name.to_lowercase().as_str() {
                "name" | "first_name" => name::en::FirstName().fake::<String>().into(),
                "last_name" => name::en::LastName().fake::<String>().into(),
                "email" => internet::en::SafeEmail().fake::<String>().into(),
                "phone" | "phone_number" => phone_number::en::PhoneNumber().fake::<String>().into(),
                "address" => address::en::StreetAddress().fake::<String>().into(),
                "city" => address::en::CityName().fake::<String>().into(),
                "company" => company::en::CompanyName().fake::<String>().into(),
                _ => lorem::en::Word().fake::<String>().into(),
            },
            "Integer" => {
                let range = match field_name.to_lowercase().as_str() {
                    "age" => 18..80,
                    "quantity" | "count" => 1..100,
                    "price" | "amount" => 1..1000,
                    _ => 1..1000,
                };
                range.fake::<i32>().into()
            },
            "Float" => (1.0..1000.0).fake::<f64>().into(),
            "Boolean" => Faker.fake::<bool>().into(),
            "DateTime" => chrono::Utc::now().format("%Y-%m-%dT%H:%M:%S%.3fZ").to_string().into(),
            _ => serde_json::Value::Null,
        }
    }
}
```

#### 4.2 Relationship Generation
```rust
impl FakeDataService {
    pub async fn generate_relationships(
        &self,
        model_id: &str,
        relationships: &[Relationship],
        entities_data: &HashMap<String, Vec<String>> // entity_type -> list of IDs
    ) -> Result<()> {
        for relationship in relationships {
            match relationship.relationship_type {
                RelationshipType::OneToMany => {
                    self.create_one_to_many_links(model_id, relationship, entities_data).await?;
                },
                RelationshipType::ManyToMany => {
                    self.create_many_to_many_links(model_id, relationship, entities_data).await?;
                },
                // ... other relationship types
            }
        }
        Ok(())
    }
}
```

### Phase 5: Integration & Testing (Week 3)

#### 5.1 Service Integration
**File**: `/torque/src/services/mod.rs`
```rust
pub mod app_database;
pub mod fake_data;
pub mod schema_generator;

pub use app_database::AppDatabaseService;
pub use fake_data::FakeDataService;
pub use schema_generator::SchemaGenerator;
```

#### 5.2 API Route Registration
**File**: `/torque/src/server/routes.rs`
```rust
pub fn app_database_routes() -> Router<AppState> {
    Router::new()
        .route("/api/models/:model_id/app-database/status", get(get_database_status))
        .route("/api/models/:model_id/app-database/entities", get(get_entities_overview))
        .route("/api/models/:model_id/app-database/entities/:entity_type", get(get_entity_data))
        .route("/api/models/:model_id/app-database/seed", post(seed_database))
        .route("/api/models/:model_id/app-database", delete(empty_database))
        .route("/api/models/:model_id/app-database/sync", post(sync_schema))
}
```

## Dependencies & Cargo.toml Updates

### New Dependencies
```toml
[dependencies]
# Existing dependencies...

# Fake data generation
fake = { version = "2.9", features = ["derive", "chrono", "http"] }

# Additional database features
sea-orm = { version = "0.12", features = ["sqlx-postgres", "sqlx-sqlite", "runtime-tokio-rustls", "macros"] }

# JSON handling
serde_json = "1.0"

# UUID generation
uuid = { version = "1.0", features = ["v4", "serde"] }
```

## Error Handling Strategy

### Custom Error Types
```rust
#[derive(Debug, thiserror::Error)]
pub enum AppDatabaseError {
    #[error("App database not found for model: {model_id}")]
    DatabaseNotFound { model_id: String },
    
    #[error("Schema sync failed: {reason}")]
    SchemaSyncFailed { reason: String },
    
    #[error("Seeding failed for entity {entity_type}: {reason}")]
    SeedingFailed { entity_type: String, reason: String },
    
    #[error("Database operation failed: {0}")]
    DatabaseError(#[from] sea_orm::DbErr),
}
```

## Performance Considerations

### Optimization Strategies
1. **Connection Pooling**: Separate pools for app databases vs system database
2. **Batch Operations**: Bulk insert for seeding operations
3. **Caching**: Cache schema definitions and entity counts
4. **Indexing**: Automatic index creation for common query patterns
5. **Partitioning**: Consider partitioning for large datasets

### Memory Management
```rust
// Batch processing for large seeding operations
const BATCH_SIZE: usize = 100;

impl FakeDataService {
    pub async fn seed_entity_batch(&self, model_id: &str, entity: &Entity, count: usize) -> Result<()> {
        let batches = (count + BATCH_SIZE - 1) / BATCH_SIZE;
        
        for batch in 0..batches {
            let batch_size = std::cmp::min(BATCH_SIZE, count - batch * BATCH_SIZE);
            let fake_data = self.generate_batch_data(entity, batch_size);
            self.insert_batch(model_id, &entity.name, fake_data).await?;
        }
        
        Ok(())
    }
}
```

## Security Considerations

### Database Isolation
- Each model gets its own database/schema namespace
- Prevent cross-model data access
- Validate model ownership before operations

### Input Validation
```rust
pub fn validate_model_id(model_id: &str) -> Result<(), ValidationError> {
    if model_id.len() > 100 || !model_id.chars().all(|c| c.is_alphanumeric() || c == '-') {
        return Err(ValidationError::InvalidModelId);
    }
    Ok(())
}
```

## Testing Strategy

### Unit Tests
- Schema generation for various entity types
- Fake data generation for all field types
- Relationship creation logic
- Error handling scenarios

### Integration Tests
- Full seeding workflow
- Database cleanup operations
- API endpoint testing
- Performance benchmarks

## Deployment Considerations

### Database Migrations
- Auto-migration for app database schema changes
- Backup/restore procedures for app databases
- Cleanup policies for abandoned app databases

### Monitoring
- Track app database sizes
- Monitor seeding performance
- Alert on failed operations

## Success Criteria

### Functional Requirements ✅
- Create separate app databases per model
- Generate realistic fake data using fake.rs
- Limit to max 5 instances per entity (configurable)
- Provide REST API for all database operations
- Support viewing database contents
- Enable database cleanup/reset

### Performance Requirements ✅
- Seeding operations complete within 10 seconds for typical models
- Database queries return within 100ms
- Support up to 100 concurrent operations
- Memory usage remains under 100MB per operation

### Quality Requirements ✅
- 90%+ test coverage for core functionality
- Comprehensive error handling and logging
- Documentation for all public APIs
- Performance benchmarks and monitoring

## Timeline Summary

| Week | Focus | Deliverables |
|------|-------|-------------|
| Week 1 | Core Infrastructure | AppDatabaseService, SchemaGenerator, Basic API routes |
| Week 2 | Data Generation | FakeDataService, Complete API endpoints, Relationship handling |
| Week 3 | Integration & Polish | Testing, Performance optimization, Documentation |

This implementation plan provides a comprehensive foundation for the backend database management features required by the App Previewer functionality, following Torque's performance-first architecture principles.