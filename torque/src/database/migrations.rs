use sea_orm::{DatabaseConnection, Statement, ConnectionTrait};
use crate::Result;

pub async fn run_migrations(db: &DatabaseConnection) -> Result<()> {
    tracing::info!("Running database migrations");
    
    // Check if we're using SQLite or PostgreSQL
    let db_backend = db.get_database_backend();
    
    match db_backend {
        sea_orm::DatabaseBackend::Sqlite => {
            run_sqlite_migrations(db).await?;
        }
        sea_orm::DatabaseBackend::Postgres => {
            run_postgres_migrations(db).await?;
        }
        _ => {
            return Err(crate::Error::Configuration("Unsupported database backend".to_string()));
        }
    }
    
    tracing::info!("Database migrations completed");
    Ok(())
}

async fn run_sqlite_migrations(db: &DatabaseConnection) -> Result<()> {
    // SQLite-specific schema with performance optimizations
    let migrations = vec![
        create_torque_models_sqlite(),
        create_torque_applications_sqlite(),
        create_entities_sqlite(),
        create_entity_relationships_sqlite(),
        create_xflows_sqlite(),
        create_xflow_executions_sqlite(),
        create_system_config_sqlite(),
        create_performance_metrics_sqlite(),
        create_indexes_sqlite(),
    ];
    
    for migration in migrations {
        db.execute(Statement::from_string(db.get_database_backend(), migration)).await?;
    }
    
    Ok(())
}

async fn run_postgres_migrations(db: &DatabaseConnection) -> Result<()> {
    // PostgreSQL-specific schema with partitioning and advanced features
    let migrations = vec![
        create_torque_models_postgres(),
        create_torque_applications_postgres(),
        create_entities_postgres(),
        create_entity_relationships_postgres(),
        create_xflows_postgres(),
        create_xflow_executions_postgres(),
        create_system_config_postgres(),
        create_performance_metrics_postgres(),
        create_partitions_postgres(),
        create_indexes_postgres(),
    ];
    
    for migration in migrations {
        db.execute(Statement::from_string(db.get_database_backend(), migration)).await?;
    }
    
    Ok(())
}

fn create_torque_models_sqlite() -> String {
    r#"
    CREATE TABLE IF NOT EXISTS torque_models (
        id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
        model_json JSON NOT NULL,
        schema_json JSON NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(name, version)
    )
    "#.to_string()
}

fn create_torque_models_postgres() -> String {
    r#"
    CREATE TABLE IF NOT EXISTS torque_models (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
        model_json JSONB NOT NULL,
        schema_json JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(name, version)
    )
    "#.to_string()
}

fn create_torque_applications_sqlite() -> String {
    r#"
    CREATE TABLE IF NOT EXISTS torque_applications (
        id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
        model_id TEXT NOT NULL REFERENCES torque_models(id),
        name VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        config JSON NOT NULL DEFAULT '{}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(name)
    )
    "#.to_string()
}

fn create_torque_applications_postgres() -> String {
    r#"
    CREATE TABLE IF NOT EXISTS torque_applications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        model_id UUID NOT NULL REFERENCES torque_models(id),
        name VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        config JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(name)
    )
    "#.to_string()
}

fn create_entities_sqlite() -> String {
    r#"
    CREATE TABLE IF NOT EXISTS entities (
        id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
        application_id TEXT NOT NULL REFERENCES torque_applications(id) ON DELETE CASCADE,
        entity_type VARCHAR(255) NOT NULL,
        data JSON NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    "#.to_string()
}

fn create_entities_postgres() -> String {
    r#"
    CREATE TABLE IF NOT EXISTS entities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        application_id UUID NOT NULL REFERENCES torque_applications(id) ON DELETE CASCADE,
        entity_type VARCHAR(255) NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    ) PARTITION BY HASH (application_id)
    "#.to_string()
}

fn create_entity_relationships_sqlite() -> String {
    r#"
    CREATE TABLE IF NOT EXISTS entity_relationships (
        id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
        source_entity_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
        target_entity_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
        relationship_type VARCHAR(255) NOT NULL,
        relationship_data JSON DEFAULT '{}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(source_entity_id, target_entity_id, relationship_type)
    )
    "#.to_string()
}

fn create_entity_relationships_postgres() -> String {
    r#"
    CREATE TABLE IF NOT EXISTS entity_relationships (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        source_entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
        target_entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
        relationship_type VARCHAR(255) NOT NULL,
        relationship_data JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(source_entity_id, target_entity_id, relationship_type)
    )
    "#.to_string()
}

fn create_xflows_sqlite() -> String {
    r#"
    CREATE TABLE IF NOT EXISTS xflows (
        id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        application_id TEXT REFERENCES torque_applications(id) ON DELETE CASCADE,
        dag_json JSON NOT NULL,
        input_schema JSON NOT NULL,
        output_schema JSON NOT NULL,
        error_schema JSON NOT NULL,
        version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
        enabled BOOLEAN DEFAULT 1,
        priority INTEGER DEFAULT 5,
        max_execution_time_ms INTEGER DEFAULT 30000,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(name, application_id, version)
    )
    "#.to_string()
}

fn create_xflows_postgres() -> String {
    r#"
    CREATE TABLE IF NOT EXISTS xflows (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        application_id UUID REFERENCES torque_applications(id) ON DELETE CASCADE,
        dag_json JSONB NOT NULL,
        input_schema JSONB NOT NULL,
        output_schema JSONB NOT NULL,
        error_schema JSONB NOT NULL,
        version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
        enabled BOOLEAN DEFAULT true,
        priority INTEGER DEFAULT 5,
        max_execution_time_ms INTEGER DEFAULT 30000,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(name, application_id, version)
    )
    "#.to_string()
}

fn create_xflow_executions_sqlite() -> String {
    r#"
    CREATE TABLE IF NOT EXISTS xflow_executions (
        id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
        xflow_id TEXT NOT NULL REFERENCES xflows(id) ON DELETE CASCADE,
        trigger_type VARCHAR(100) NOT NULL,
        trigger_data JSON,
        input_data JSON NOT NULL,
        output_data JSON,
        error_data JSON,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        execution_time_ms INTEGER,
        node_count INTEGER
    )
    "#.to_string()
}

fn create_xflow_executions_postgres() -> String {
    r#"
    CREATE TABLE IF NOT EXISTS xflow_executions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        xflow_id UUID NOT NULL REFERENCES xflows(id) ON DELETE CASCADE,
        trigger_type VARCHAR(100) NOT NULL,
        trigger_data JSONB,
        input_data JSONB NOT NULL,
        output_data JSONB,
        error_data JSONB,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        completed_at TIMESTAMP WITH TIME ZONE,
        execution_time_ms INTEGER,
        node_count INTEGER
    ) PARTITION BY RANGE (started_at)
    "#.to_string()
}

fn create_system_config_sqlite() -> String {
    r#"
    CREATE TABLE IF NOT EXISTS system_config (
        key VARCHAR(255) PRIMARY KEY,
        value JSON NOT NULL,
        description TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    "#.to_string()
}

fn create_system_config_postgres() -> String {
    r#"
    CREATE TABLE IF NOT EXISTS system_config (
        key VARCHAR(255) PRIMARY KEY,
        value JSONB NOT NULL,
        description TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
    "#.to_string()
}

fn create_performance_metrics_sqlite() -> String {
    r#"
    CREATE TABLE IF NOT EXISTS performance_metrics (
        id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
        metric_type VARCHAR(100) NOT NULL,
        metric_name VARCHAR(255) NOT NULL,
        metric_value REAL NOT NULL,
        labels JSON DEFAULT '{}',
        recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    "#.to_string()
}

fn create_performance_metrics_postgres() -> String {
    r#"
    CREATE TABLE IF NOT EXISTS performance_metrics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        metric_type VARCHAR(100) NOT NULL,
        metric_name VARCHAR(255) NOT NULL,
        metric_value DOUBLE PRECISION NOT NULL,
        labels JSONB DEFAULT '{}',
        recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    ) PARTITION BY RANGE (recorded_at)
    "#.to_string()
}

fn create_partitions_postgres() -> String {
    // Create hash partitions for entities table (8 partitions for load distribution)
    r#"
    CREATE TABLE IF NOT EXISTS entities_0 PARTITION OF entities FOR VALUES WITH (MODULUS 8, REMAINDER 0);
    CREATE TABLE IF NOT EXISTS entities_1 PARTITION OF entities FOR VALUES WITH (MODULUS 8, REMAINDER 1);
    CREATE TABLE IF NOT EXISTS entities_2 PARTITION OF entities FOR VALUES WITH (MODULUS 8, REMAINDER 2);
    CREATE TABLE IF NOT EXISTS entities_3 PARTITION OF entities FOR VALUES WITH (MODULUS 8, REMAINDER 3);
    CREATE TABLE IF NOT EXISTS entities_4 PARTITION OF entities FOR VALUES WITH (MODULUS 8, REMAINDER 4);
    CREATE TABLE IF NOT EXISTS entities_5 PARTITION OF entities FOR VALUES WITH (MODULUS 8, REMAINDER 5);
    CREATE TABLE IF NOT EXISTS entities_6 PARTITION OF entities FOR VALUES WITH (MODULUS 8, REMAINDER 6);
    CREATE TABLE IF NOT EXISTS entities_7 PARTITION OF entities FOR VALUES WITH (MODULUS 8, REMAINDER 7);
    "#.to_string()
}

fn create_indexes_sqlite() -> String {
    r#"
    CREATE INDEX IF NOT EXISTS idx_torque_models_name ON torque_models(name);
    CREATE INDEX IF NOT EXISTS idx_torque_models_created_at ON torque_models(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_torque_applications_status ON torque_applications(status);
    CREATE INDEX IF NOT EXISTS idx_torque_applications_model_id ON torque_applications(model_id);
    CREATE INDEX IF NOT EXISTS idx_entities_app_type ON entities(application_id, entity_type);
    CREATE INDEX IF NOT EXISTS idx_entities_updated_at ON entities(updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_entity_relationships_source ON entity_relationships(source_entity_id, relationship_type);
    CREATE INDEX IF NOT EXISTS idx_entity_relationships_target ON entity_relationships(target_entity_id, relationship_type);
    CREATE INDEX IF NOT EXISTS idx_xflows_enabled ON xflows(enabled);
    CREATE INDEX IF NOT EXISTS idx_xflows_priority ON xflows(priority DESC);
    CREATE INDEX IF NOT EXISTS idx_xflows_application_id ON xflows(application_id);
    CREATE INDEX IF NOT EXISTS idx_xflow_executions_status ON xflow_executions(status);
    CREATE INDEX IF NOT EXISTS idx_xflow_executions_xflow_id ON xflow_executions(xflow_id);
    CREATE INDEX IF NOT EXISTS idx_xflow_executions_started_at ON xflow_executions(started_at DESC);
    "#.to_string()
}

fn create_indexes_postgres() -> String {
    r#"
    CREATE INDEX IF NOT EXISTS idx_torque_models_name ON torque_models(name);
    CREATE INDEX IF NOT EXISTS idx_torque_models_created_at ON torque_models(created_at DESC);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_torque_models_model_json_gin ON torque_models USING GIN (model_json);
    CREATE INDEX IF NOT EXISTS idx_torque_applications_status ON torque_applications(status) WHERE status = 'active';
    CREATE INDEX IF NOT EXISTS idx_torque_applications_model_id ON torque_applications(model_id);
    CREATE INDEX IF NOT EXISTS idx_entities_app_type ON entities(application_id, entity_type);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_entities_data_gin ON entities USING GIN (data);
    CREATE INDEX IF NOT EXISTS idx_entities_updated_at ON entities(updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_entity_relationships_source ON entity_relationships(source_entity_id, relationship_type);
    CREATE INDEX IF NOT EXISTS idx_entity_relationships_target ON entity_relationships(target_entity_id, relationship_type);
    CREATE INDEX IF NOT EXISTS idx_xflows_enabled ON xflows(enabled) WHERE enabled = true;
    CREATE INDEX IF NOT EXISTS idx_xflows_priority ON xflows(priority DESC) WHERE enabled = true;
    CREATE INDEX IF NOT EXISTS idx_xflows_application_id ON xflows(application_id);
    CREATE INDEX IF NOT EXISTS idx_xflow_executions_status ON xflow_executions(status);
    CREATE INDEX IF NOT EXISTS idx_xflow_executions_xflow_id ON xflow_executions(xflow_id);
    CREATE INDEX IF NOT EXISTS idx_xflow_executions_started_at ON xflow_executions(started_at DESC);
    "#.to_string()
}