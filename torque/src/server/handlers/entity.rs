use crate::server::AppState;
use crate::services::entity::{CreateEntityRequest, UpdateEntityRequest, EntityQuery};
use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::Json,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use crate::common::{Uuid, UtcDateTime};

#[derive(Debug, Deserialize)]
pub struct ListEntitiesQuery {
    pub application_id: Option<Uuid>,
    pub entity_type: Option<String>,
    pub limit: Option<u64>,
    pub offset: Option<u64>,
}

#[derive(Debug, Serialize)]
pub struct EntityResponse {
    pub id: Uuid,
    pub application_id: Uuid,
    pub entity_type: String,
    pub data: Value,
    pub created_at: String,
    pub updated_at: String,
}

/// List entities with optional filtering
pub async fn list_entities(
    Query(params): Query<ListEntitiesQuery>,
    State(state): State<AppState>,
) -> Result<Json<Value>, StatusCode> {
    let query = EntityQuery {
        application_id: params.application_id,
        entity_type: params.entity_type,
        limit: params.limit,
        offset: params.offset,
        filters: None,
    };

    match state.services.entity_service.query_entities(query).await {
        Ok(entities) => {
            let entity_responses: Vec<EntityResponse> = entities
                .into_iter()
                .map(|e| EntityResponse {
                    id: e.id,
                    application_id: e.application_id,
                    entity_type: e.entity_type,
                    data: e.data,
                    created_at: e.created_at.to_iso8601(),
                    updated_at: e.updated_at.to_iso8601(),
                })
                .collect();

            let response = json!({
                "entities": entity_responses,
                "total": entity_responses.len(),
                "timestamp": UtcDateTime::now().to_iso8601()
            });

            Ok(Json(response))
        }
        Err(e) => {
            tracing::error!("Failed to list entities: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

/// Create a new entity
pub async fn create_entity(
    State(state): State<AppState>,
    Json(request): Json<CreateEntityRequest>,
) -> Result<Json<EntityResponse>, StatusCode> {
    match state.services.entity_service.create_entity(request).await {
        Ok(entity) => {
            let response = EntityResponse {
                id: entity.id,
                application_id: entity.application_id,
                entity_type: entity.entity_type,
                data: entity.data,
                created_at: entity.created_at.to_iso8601(),
                updated_at: entity.updated_at.to_iso8601(),
            };

            Ok(Json(response))
        }
        Err(e) => {
            tracing::error!("Failed to create entity: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

/// Get a specific entity by ID
pub async fn get_entity(
    Path(id): Path<Uuid>,
    State(state): State<AppState>,
) -> Result<Json<EntityResponse>, StatusCode> {
    match state.services.entity_service.get_entity(id.clone()).await {
        Ok(Some(entity)) => {
            let response = EntityResponse {
                id: entity.id,
                application_id: entity.application_id,
                entity_type: entity.entity_type,
                data: entity.data,
                created_at: entity.created_at.to_iso8601(),
                updated_at: entity.updated_at.to_iso8601(),
            };

            Ok(Json(response))
        }
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(e) => {
            tracing::error!("Failed to get entity {}: {}", id, e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

/// Update an existing entity
pub async fn update_entity(
    Path(id): Path<Uuid>,
    State(state): State<AppState>,
    Json(request): Json<UpdateEntityRequest>,
) -> Result<Json<EntityResponse>, StatusCode> {
    match state.services.entity_service.update_entity(id.clone(), request).await {
        Ok(Some(entity)) => {
            let response = EntityResponse {
                id: entity.id,
                application_id: entity.application_id,
                entity_type: entity.entity_type,
                data: entity.data,
                created_at: entity.created_at.to_iso8601(),
                updated_at: entity.updated_at.to_iso8601(),
            };

            Ok(Json(response))
        }
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(e) => {
            tracing::error!("Failed to update entity {}: {}", id, e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

/// Delete an entity
pub async fn delete_entity(
    Path(id): Path<Uuid>,
    State(state): State<AppState>,
) -> Result<Json<Value>, StatusCode> {
    match state.services.entity_service.delete_entity(id.clone()).await {
        Ok(true) => {
            let response = json!({
                "id": id,
                "deleted": true,
                "timestamp": UtcDateTime::now().to_iso8601()
            });

            Ok(Json(response))
        }
        Ok(false) => Err(StatusCode::NOT_FOUND),
        Err(e) => {
            tracing::error!("Failed to delete entity {}: {}", id, e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_entity_response_serialization() {
        let entity_response = EntityResponse {
            id: Uuid::new_v4(),
            application_id: Uuid::new_v4(),
            entity_type: "test".to_string(),
            data: json!({"name": "test entity"}),
            created_at: "2024-01-01T00:00:00Z".to_string(),
            updated_at: "2024-01-01T00:00:00Z".to_string(),
        };

        let serialized = serde_json::to_string(&entity_response).unwrap();
        assert!(serialized.contains("test entity"));
    }

    #[test]
    fn test_list_entities_query_parsing() {
        // Test query parameter structure
        let query = ListEntitiesQuery {
            application_id: Some(Uuid::new_v4()),
            entity_type: Some("test".to_string()),
            limit: Some(10),
            offset: Some(0),
        };

        assert_eq!(query.limit, Some(10));
        assert_eq!(query.entity_type, Some("test".to_string()));
    }
}