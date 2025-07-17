use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{broadcast, RwLock};
use crate::common::{Uuid, UtcDateTime};
use axum::extract::ws::{WebSocket, Message};
use futures_util::{stream::SplitSink, SinkExt};
use tracing::{info, warn, debug, error};
use serde_json;

use crate::model::events::{ModelChangeEvent, ModelEventMessage};
use crate::Result;

/// Maximum number of queued events per broadcast channel
const BROADCAST_CHANNEL_SIZE: usize = 1000;

/// WebSocket client connection info
#[derive(Debug, Clone)]
pub struct WebSocketClient {
    pub client_id: String,
    pub connected_at: UtcDateTime,
    pub model_filter: Option<Uuid>, // Optional filter for specific model
}

/// High-performance broadcast service for real-time model synchronization
/// 
/// Architecture:
/// 1. Model service emits events to a broadcast channel
/// 2. WebSocket handlers subscribe to this channel in their send_task
/// 3. Each WebSocket handler sends messages to its own client
/// 
/// Note: The start_broadcast_loop method is NOT used to avoid duplicate sends.
/// WebSocket handlers already handle message distribution.
pub struct BroadcastService {
    /// Broadcast sender for model events
    event_sender: broadcast::Sender<ModelEventMessage>,
    /// Connected WebSocket clients
    clients: Arc<RwLock<HashMap<String, WebSocketClient>>>,
    /// WebSocket senders for active connections
    websocket_senders: Arc<RwLock<HashMap<String, SplitSink<WebSocket, Message>>>>,
}

impl BroadcastService {
    /// Create a new broadcast service
    pub fn new() -> Self {
        let (event_sender, _) = broadcast::channel(BROADCAST_CHANNEL_SIZE);
        
        Self {
            event_sender,
            clients: Arc::new(RwLock::new(HashMap::new())),
            websocket_senders: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Broadcast a model change event to all connected clients
    pub async fn broadcast_event(&self, event: ModelChangeEvent) -> Result<()> {
        let message = ModelEventMessage::new(event.clone());
        
        // Send to broadcast channel
        match self.event_sender.send(message) {
            Ok(receiver_count) => {
                if receiver_count > 0 {
                    debug!(
                        "Broadcasted {} to {} receivers: {}", 
                        event.description(),
                        receiver_count,
                        serde_json::to_string(&event).unwrap_or_default()
                    );
                } else {
                    // No receivers yet, this is normal during startup
                    debug!("No receivers for event: {}", event.description());
                }
                Ok(())
            }
            Err(broadcast::error::SendError(_)) => {
                // Channel has no receivers, this is normal during startup
                debug!("No active receivers for broadcast event: {}", event.description());
                Ok(())
            }
        }
    }

    /// Broadcast a model change event excluding a specific client
    pub async fn broadcast_event_excluding(&self, event: ModelChangeEvent, exclude_client: String) -> Result<()> {
        let message = ModelEventMessage::with_exclusion(event.clone(), exclude_client);
        
        match self.event_sender.send(message) {
            Ok(receiver_count) => {
                if receiver_count > 0 {
                    debug!(
                        "Broadcasted {} to {} receivers (excluding client): {}", 
                        event.description(),
                        receiver_count,
                        serde_json::to_string(&event).unwrap_or_default()
                    );
                } else {
                    debug!("No receivers for event: {}", event.description());
                }
                Ok(())
            }
            Err(broadcast::error::SendError(_)) => {
                // Channel has no receivers, this is normal during startup
                debug!("No active receivers for broadcast event: {}", event.description());
                Ok(())
            }
        }
    }

    /// Register a new WebSocket client
    pub async fn register_client(&self, client_id: String, model_filter: Option<Uuid>) -> Result<()> {
        let client = WebSocketClient {
            client_id: client_id.clone(),
            connected_at: UtcDateTime::now(),
            model_filter,
        };

        let mut clients = self.clients.write().await;
        clients.insert(client_id.clone(), client);
        
        info!("Registered WebSocket client: {}", client_id);
        Ok(())
    }

    /// Unregister a WebSocket client
    pub async fn unregister_client(&self, client_id: &str) -> Result<()> {
        // Remove from clients
        let mut clients = self.clients.write().await;
        clients.remove(client_id);

        // Remove WebSocket sender and close it
        let mut senders = self.websocket_senders.write().await;
        if let Some(mut sender) = senders.remove(client_id) {
            // Close the sender to ensure no more messages are sent
            let _ = sender.close().await;
            debug!("Closed WebSocket sender for client: {}", client_id);
        }
        
        info!("Unregistered WebSocket client: {}", client_id);
        Ok(())
    }

    /// Add a WebSocket sender for a client
    pub async fn add_websocket_sender(&self, client_id: String, sender: SplitSink<WebSocket, Message>) -> Result<()> {
        let mut senders = self.websocket_senders.write().await;
        senders.insert(client_id.clone(), sender);
        
        debug!("Added WebSocket sender for client: {}", client_id);
        Ok(())
    }

    /// Get a broadcast receiver for listening to events
    pub fn subscribe(&self) -> broadcast::Receiver<ModelEventMessage> {
        self.event_sender.subscribe()
    }

    /// Get the number of connected clients
    pub async fn client_count(&self) -> usize {
        self.clients.read().await.len()
    }

    /// Get connected client information
    pub async fn get_clients(&self) -> Vec<WebSocketClient> {
        self.clients.read().await.values().cloned().collect()
    }

    /// Send a message to a specific WebSocket client
    pub async fn send_to_client(&self, client_id: &str, message: ModelEventMessage) -> Result<()> {
        let message_json = serde_json::to_string(&message)
            .map_err(|e| crate::Error::Internal(format!("Failed to serialize message: {}", e)))?;

        let mut senders = self.websocket_senders.write().await;
        if let Some(sender) = senders.get_mut(client_id) {
            if let Err(e) = sender.send(Message::Text(message_json)).await {
                error!("Failed to send WebSocket message to {}: {}", client_id, e);
                // Remove the failed sender
                senders.remove(client_id);
                return Err(crate::Error::Internal(format!("WebSocket send failed: {}", e)));
            }
            debug!("Sent message to client {}", client_id);
        } else {
            warn!("No WebSocket sender found for client: {}", client_id);
        }

        Ok(())
    }

    /// Send a message to all connected WebSocket clients
    pub async fn send_to_all_clients(&self, message: ModelEventMessage) -> Result<()> {
        let message_json = serde_json::to_string(&message)
            .map_err(|e| crate::Error::Internal(format!("Failed to serialize message: {}", e)))?;

        let mut senders = self.websocket_senders.write().await;
        let mut failed_clients = Vec::new();

        // Send to all clients
        for (client_id, sender) in senders.iter_mut() {
            // Skip excluded client
            if let Some(ref exclude) = message.exclude_client {
                if client_id == exclude {
                    debug!("Skipping excluded client: {}", client_id);
                    continue;
                }
            }

            // Check model filter
            let clients = self.clients.read().await;
            if let Some(client) = clients.get(client_id) {
                if let Some(ref filter_model) = client.model_filter {
                    if *filter_model != message.event.model_id() {
                        debug!("Skipping client {} due to model filter", client_id);
                        continue;
                    }
                }
            }

            if let Err(e) = sender.send(Message::Text(message_json.clone())).await {
                // Check if this is a "sending after closing" error
                if e.to_string().contains("Sending after closing") {
                    debug!("WebSocket {} already closed, removing sender", client_id);
                } else {
                    warn!("Failed to send WebSocket message to {}: {}", client_id, e);
                }
                failed_clients.push(client_id.clone());
            }
        }

        // Remove failed senders
        for client_id in failed_clients {
            senders.remove(&client_id);
            info!("Removed failed WebSocket sender for client: {}", client_id);
        }

        Ok(())
    }

    /// Start the broadcast loop that forwards events to WebSocket clients
    pub async fn start_broadcast_loop(self: Arc<Self>) {
        let mut receiver = self.subscribe();
        
        info!("Started broadcast loop for WebSocket clients");
        
        loop {
            match receiver.recv().await {
                Ok(message) => {
                    if let Err(e) = self.send_to_all_clients(message).await {
                        error!("Failed to broadcast message to WebSocket clients: {}", e);
                    }
                }
                Err(broadcast::error::RecvError::Lagged(skipped)) => {
                    warn!("Broadcast receiver lagged, skipped {} messages", skipped);
                }
                Err(broadcast::error::RecvError::Closed) => {
                    error!("Broadcast channel closed, stopping broadcast loop");
                    break;
                }
            }
        }
    }
}

impl Default for BroadcastService {
    fn default() -> Self {
        Self::new()
    }
}