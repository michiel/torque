use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use serde::Serialize;
use crate::common::Uuid;

use crate::server::AppState;
use crate::services::app_database::{DatabaseStatus, EntityOverview, EntityDataResponse, PaginationParams};
use crate::services::fake_data::{SeedRequest, SeedReport, EmptyResponse, SyncResponse};
// Handler results using status codes for errors

/// GET /api/models/{model_id}/app-database/status
/// Get database status and overview for a model
pub async fn get_database_status(
    Path(model_id): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<DatabaseStatus>, StatusCode> {
    let status = state.services.app_database_service
        .get_database_status(&model_id)
        .await
        .map_err(|e| {
            tracing::error!("Failed to get database status for model {}: {}", model_id, e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    Ok(Json(status))
}

/// GET /api/models/{model_id}/app-database/entities
/// Get overview of all entities in the app database
pub async fn get_entities_overview(
    Path(model_id): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<Vec<EntityOverview>>, StatusCode> {
    let overview = state.services.app_database_service
        .get_entities_overview(&model_id)
        .await
        .map_err(|e| {
            tracing::error!("Failed to get entities overview for model {}: {}", model_id, e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    Ok(Json(overview))
}

/// GET /api/models/{model_id}/app-database/entities/{entity_type}
/// Get paginated entity data for a specific entity type
pub async fn get_entity_data(
    Path((model_id, entity_type)): Path<(String, String)>,
    Query(params): Query<PaginationParams>,
    State(state): State<AppState>,
) -> Result<Json<EntityDataResponse>, StatusCode> {
    let page = params.page.unwrap_or(1);
    let per_page = params.per_page.unwrap_or(50).min(100); // Cap at 100
    let offset = (page - 1) * per_page;

    // Get total count
    let total_count = state.services.app_database_service
        .get_entity_count(&model_id, &entity_type)
        .await
        .map_err(|e| {
            tracing::error!("Failed to get entity count for {}/{}: {}", model_id, entity_type, e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    // Get entities
    let entities = state.services.app_database_service
        .get_entities(&model_id, &entity_type, per_page, offset)
        .await
        .map_err(|e| {
            tracing::error!("Failed to get entities for {}/{}: {}", model_id, entity_type, e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    let response = EntityDataResponse {
        entities,
        total_count,
        page,
        per_page,
    };

    Ok(Json(response))
}

/// POST /api/models/{model_id}/app-database/seed
/// Seed the app database with fake data
pub async fn seed_database(
    Path(model_id): Path<String>,
    State(state): State<AppState>,
    Json(request): Json<SeedRequest>,
) -> Result<Json<SeedReport>, StatusCode> {
    // Validate request
    if let Some(max_instances) = request.max_instances_per_entity {
        if max_instances > 10 {
            return Err(StatusCode::BAD_REQUEST);
        }
    }

    // Get model definition  
    let model_uuid = model_id.parse::<Uuid>()
        .map_err(|_| StatusCode::BAD_REQUEST)?;
    
    let model = state.services.model_service
        .get_model(model_uuid)
        .await
        .map_err(|e| {
            tracing::error!("Failed to get model {}: {}", model_id, e);
            StatusCode::NOT_FOUND
        })?
        .ok_or(StatusCode::NOT_FOUND)?;

    // Ensure app database exists and schema is synced
    if let Err(e) = state.services.app_database_service.create_app_database(&model_id).await {
        tracing::warn!("Failed to create app database (may already exist): {}", e);
    }

    // Seed the database
    let report = state.services.fake_data_service
        .seed_model_data(&model_id, &model, &request)
        .await
        .map_err(|e| {
            tracing::error!("Failed to seed database for model {}: {}", model_id, e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    tracing::info!(
        "Seeded database for model {} - {} total records in {} entities ({}ms)",
        model_id, report.total_records, report.entities_created.len(), report.duration_ms
    );

    Ok(Json(report))
}

/// DELETE /api/models/{model_id}/app-database
/// Empty the app database (delete all data, keep schema)
pub async fn empty_database(
    Path(model_id): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<EmptyResponse>, StatusCode> {
    let start_time = std::time::Instant::now();

    // Get model to count entities
    let model_uuid = model_id.parse::<Uuid>()
        .map_err(|_| StatusCode::BAD_REQUEST)?;
    
    let model = state.services.model_service
        .get_model(model_uuid)
        .await
        .map_err(|e| {
            tracing::error!("Failed to get model {}: {}", model_id, e);
            StatusCode::NOT_FOUND
        })?
        .ok_or(StatusCode::NOT_FOUND)?;

    let tables_emptied = model.entities.len() as u64;

    // Empty the database
    state.services.app_database_service
        .empty_app_database(&model_id)
        .await
        .map_err(|e| {
            tracing::error!("Failed to empty database for model {}: {}", model_id, e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    let duration_ms = start_time.elapsed().as_millis() as u64;

    tracing::info!("Emptied database for model {} - {} tables ({}ms)", model_id, tables_emptied, duration_ms);

    Ok(Json(EmptyResponse {
        tables_emptied,
        duration_ms,
    }))
}

/// POST /api/models/{model_id}/app-database/sync
/// Synchronize database schema with model definition
pub async fn sync_schema(
    Path(model_id): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<SyncResponse>, StatusCode> {
    let start_time = std::time::Instant::now();

    // Get model to count entities
    let model_uuid = model_id.parse::<Uuid>()
        .map_err(|_| StatusCode::BAD_REQUEST)?;
    
    let model = state.services.model_service
        .get_model(model_uuid)
        .await
        .map_err(|e| {
            tracing::error!("Failed to get model {}: {}", model_id, e);
            StatusCode::NOT_FOUND
        })?
        .ok_or(StatusCode::NOT_FOUND)?;

    let tables_created = model.entities.len() as u64;
    let indexes_created = tables_created * 2; // Estimate: 2 indexes per table

    // Sync the schema
    state.services.app_database_service
        .sync_schema(&model_id)
        .await
        .map_err(|e| {
            tracing::error!("Failed to sync schema for model {}: {}", model_id, e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    let duration_ms = start_time.elapsed().as_millis() as u64;

    tracing::info!(
        "Synchronized schema for model {} - {} tables, {} indexes ({}ms)",
        model_id, tables_created, indexes_created, duration_ms
    );

    Ok(Json(SyncResponse {
        tables_created,
        indexes_created,
        duration_ms,
    }))
}

/// GET /api/models/{model_id}/app-database/stats
/// Get detailed statistics about the app database
pub async fn get_database_stats(
    Path(model_id): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<DatabaseStats>, StatusCode> {
    // Get database status
    let status = state.services.app_database_service
        .get_database_status(&model_id)
        .await
        .map_err(|e| {
            tracing::error!("Failed to get database status for model {}: {}", model_id, e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    // Get entities overview
    let entities_overview = state.services.app_database_service
        .get_entities_overview(&model_id)
        .await
        .map_err(|e| {
            tracing::error!("Failed to get entities overview for model {}: {}", model_id, e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    let stats = DatabaseStats {
        status,
        entities: entities_overview,
        database_size_bytes: None, // TODO: Calculate actual database size
    };

    Ok(Json(stats))
}

#[derive(Debug, Serialize)]
pub struct DatabaseStats {
    pub status: DatabaseStatus,
    pub entities: Vec<EntityOverview>,
    pub database_size_bytes: Option<u64>,
}