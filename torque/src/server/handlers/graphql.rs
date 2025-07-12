use crate::server::AppState;
use crate::server::graphql::{create_schema, GraphQLConfig, GraphQLSchema};
use axum::{
    extract::State,
    http::StatusCode,
    response::{Html, Json},
};
use async_graphql::{http::GraphQLPlaygroundConfig, Request};
use serde_json::{json, Value};

/// GraphQL endpoint handler
pub async fn graphql_handler(
    State(state): State<AppState>,
    body: String,
) -> Result<Json<Value>, StatusCode> {
    tracing::debug!("GraphQL request received: {}", body);
    
    // Parse the GraphQL request
    let request: Request = match serde_json::from_str(&body) {
        Ok(req) => req,
        Err(e) => {
            tracing::error!("Failed to parse GraphQL request: {}", e);
            return Ok(Json(json!({
                "data": null,
                "errors": [{
                    "message": format!("Invalid GraphQL request: {}", e),
                    "extensions": {
                        "code": "PARSE_ERROR"
                    }
                }]
            })));
        }
    };
    
    let config = GraphQLConfig::default();
    let schema = create_schema(&config);
    
    let response = match schema {
        GraphQLSchema::Standard(s) => s.execute(request.data(state)).await,
        GraphQLSchema::Optimized(s) => s.execute(request.data(state)).await,
    };
    
    // Convert the response to JSON
    let json_response: Value = serde_json::to_value(response)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    Ok(Json(json_response))
}

/// GraphQL Playground handler
pub async fn playground() -> Html<String> {
    Html(
        async_graphql::http::playground_source(
            GraphQLPlaygroundConfig::new("/graphql")
                .subscription_endpoint("/ws")
        )
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_graphql_placeholder_response() {
        // TODO: Add actual GraphQL tests in Phase 2
        let playground_html = playground().await;
        assert!(playground_html.0.contains("GraphQL Playground"));
    }
}