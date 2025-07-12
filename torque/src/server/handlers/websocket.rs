use axum::{
    extract::{
        ws::{WebSocket, Message, WebSocketUpgrade},
        State, Query,
    },
    response::Response,
};
use futures_util::{sink::SinkExt, stream::StreamExt};
use serde::Deserialize;
use tracing::{info, warn, error, debug};
use crate::common::{Uuid, UtcDateTime};
use std::sync::Arc;

use crate::server::AppState;
use crate::model::events::{ModelChangeEvent, ModelEventMessage};
use crate::Result;

/// Query parameters for WebSocket connection
#[derive(Debug, Deserialize)]
pub struct WebSocketQuery {
    /// Optional client ID for identification
    pub client_id: Option<String>,
    /// Optional model ID to filter events
    pub model_filter: Option<String>,
}

/// Handle WebSocket upgrade for real-time model synchronization
pub async fn websocket_handler(
    ws: WebSocketUpgrade,
    Query(params): Query<WebSocketQuery>,
    State(state): State<AppState>,
) -> Response {
    info!("WebSocket connection requested with params: {:?}", params);
    
    ws.on_upgrade(move |socket| handle_websocket(socket, params, state))
}

/// Handle individual WebSocket connection
async fn handle_websocket(
    socket: WebSocket,
    params: WebSocketQuery,
    state: AppState,
) {
    // Generate client ID if not provided
    let client_id = params.client_id.unwrap_or_else(|| {
        format!("client_{}", Uuid::new_v4().to_string()[..8].to_string())
    });

    // Parse model filter if provided
    let model_filter = if let Some(model_id_str) = params.model_filter {
        match model_id_str.parse::<Uuid>() {
            Ok(uuid) => Some(uuid),
            Err(e) => {
                warn!("Invalid model_filter UUID '{}': {}", model_id_str, e);
                None
            }
        }
    } else {
        None
    };

    info!("WebSocket client connected: {} (model_filter: {:?})", client_id, model_filter);

    // Register client with broadcast service
    if let Err(e) = state.services.broadcast.register_client(client_id.clone(), model_filter).await {
        error!("Failed to register WebSocket client {}: {}", client_id, e);
        return;
    }

    // Split the socket into sender and receiver
    let (mut sender, mut receiver) = socket.split();

    // Subscribe to broadcast events
    let mut event_receiver = state.services.broadcast.subscribe();

    // Clone client_id for tasks
    let client_id_for_sender = client_id.clone();
    let client_id_for_cleanup = client_id.clone();
    let broadcast_service = state.services.broadcast.clone();

    // Task for sending events to client
    let send_task = tokio::spawn(async move {
        loop {
            match event_receiver.recv().await {
                Ok(message) => {
                    // Skip if this client should be excluded
                    if let Some(ref exclude_client) = message.exclude_client {
                        if exclude_client == &client_id_for_sender {
                            debug!("Skipping message for excluded client: {}", client_id_for_sender);
                            continue;
                        }
                    }

                    // Check model filter
                    if let Some(model_filter) = model_filter {
                        if message.event.model_id() != model_filter {
                            debug!("Skipping message due to model filter for client: {}", client_id_for_sender);
                            continue;
                        }
                    }

                    // Serialize and send the message
                    match serde_json::to_string(&message) {
                        Ok(json_str) => {
                            if let Err(e) = sender.send(Message::Text(json_str)).await {
                                error!("Failed to send WebSocket message to {}: {}", client_id_for_sender, e);
                                break;
                            }
                            debug!("Sent event to client {}: {}", client_id_for_sender, message.event.description());
                        }
                        Err(e) => {
                            error!("Failed to serialize event message: {}", e);
                        }
                    }
                }
                Err(tokio::sync::broadcast::error::RecvError::Lagged(skipped)) => {
                    warn!("Client {} lagged, skipped {} messages", client_id_for_sender, skipped);
                }
                Err(tokio::sync::broadcast::error::RecvError::Closed) => {
                    info!("Broadcast channel closed for client {}", client_id_for_sender);
                    break;
                }
            }
        }
    });

    // Task for receiving messages from client (for future bidirectional communication)
    let client_id_for_receiver = client_id.clone();
    let receive_task = tokio::spawn(async move {
        while let Some(msg) = receiver.next().await {
            match msg {
                Ok(Message::Text(text)) => {
                    debug!("Received message from client {}: {}", client_id_for_receiver, text);
                    // For now, just log received messages
                    // In the future, we could handle client-to-server commands here
                }
                Ok(Message::Close(_)) => {
                    info!("Client {} sent close message", client_id_for_receiver);
                    break;
                }
                Ok(_) => {
                    // Ignore other message types (binary, ping, pong)
                }
                Err(e) => {
                    error!("WebSocket error for client {}: {}", client_id_for_receiver, e);
                    break;
                }
            }
        }
    });

    // Wait for either task to complete
    tokio::select! {
        _ = send_task => {
            debug!("Send task completed for client {}", client_id);
        }
        _ = receive_task => {
            debug!("Receive task completed for client {}", client_id);
        }
    }

    // Cleanup: unregister client
    if let Err(e) = broadcast_service.unregister_client(&client_id_for_cleanup).await {
        error!("Failed to unregister WebSocket client {}: {}", client_id_for_cleanup, e);
    } else {
        info!("WebSocket client disconnected: {}", client_id_for_cleanup);
    }
}

/// Send a ping message to test WebSocket connection
pub async fn ping_websocket_clients(state: AppState) -> Result<()> {
    let ping_event = ModelChangeEvent::model_created(crate::model::types::TorqueModel {
        id: Uuid::new_v4(),
        name: "Ping Test".to_string(),
        description: Some("WebSocket connectivity test".to_string()),
        version: "1.0.0".to_string(),
        created_at: UtcDateTime::now(),
        updated_at: UtcDateTime::now(),
        created_by: "system".to_string(),
        config: crate::model::types::ModelConfig::default(),
        entities: vec![],
        relationships: vec![],
        flows: vec![],
        layouts: vec![],
        validations: vec![],
    });

    state.services.broadcast.broadcast_event(ping_event).await?;
    info!("Sent ping to all WebSocket clients");
    Ok(())
}