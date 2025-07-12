use serde::{Deserialize, Serialize};
use crate::common::Uuid;
use crate::common::UtcDateTime;
use crate::model::types::TorqueModel;

/// Event types for model changes
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
pub enum ModelChangeEvent {
    /// A model was created
    ModelCreated {
        model_id: Uuid,
        model: TorqueModel,
        timestamp: UtcDateTime,
    },
    /// A model was updated
    ModelUpdated {
        model_id: Uuid,
        model: TorqueModel,
        timestamp: UtcDateTime,
    },
    /// A model was deleted
    ModelDeleted {
        model_id: Uuid,
        timestamp: UtcDateTime,
    },
    /// An entity was added to a model
    EntityAdded {
        model_id: Uuid,
        entity_id: Uuid,
        timestamp: UtcDateTime,
    },
    /// An entity was updated in a model
    EntityUpdated {
        model_id: Uuid,
        entity_id: Uuid,
        timestamp: UtcDateTime,
    },
    /// An entity was removed from a model
    EntityRemoved {
        model_id: Uuid,
        entity_id: Uuid,
        timestamp: UtcDateTime,
    },
    /// A relationship was added to a model
    RelationshipAdded {
        model_id: Uuid,
        relationship_id: Uuid,
        timestamp: UtcDateTime,
    },
    /// A relationship was updated in a model
    RelationshipUpdated {
        model_id: Uuid,
        relationship_id: Uuid,
        timestamp: UtcDateTime,
    },
    /// A relationship was removed from a model
    RelationshipRemoved {
        model_id: Uuid,
        relationship_id: Uuid,
        timestamp: UtcDateTime,
    },
    /// A flow was added to a model
    FlowAdded {
        model_id: Uuid,
        flow_id: Uuid,
        timestamp: UtcDateTime,
    },
    /// A flow was updated in a model
    FlowUpdated {
        model_id: Uuid,
        flow_id: Uuid,
        timestamp: UtcDateTime,
    },
    /// A flow was removed from a model
    FlowRemoved {
        model_id: Uuid,
        flow_id: Uuid,
        timestamp: UtcDateTime,
    },
    /// A layout was added to a model
    LayoutAdded {
        model_id: Uuid,
        layout_id: Uuid,
        timestamp: UtcDateTime,
    },
    /// A layout was updated in a model
    LayoutUpdated {
        model_id: Uuid,
        layout_id: Uuid,
        timestamp: UtcDateTime,
    },
    /// A layout was removed from a model
    LayoutRemoved {
        model_id: Uuid,
        layout_id: Uuid,
        timestamp: UtcDateTime,
    },
}

impl ModelChangeEvent {
    /// Create a new model created event
    pub fn model_created(model: TorqueModel) -> Self {
        Self::ModelCreated {
            model_id: model.id.clone(),
            model,
            timestamp: UtcDateTime::now(),
        }
    }

    /// Create a new model updated event
    pub fn model_updated(model: TorqueModel) -> Self {
        Self::ModelUpdated {
            model_id: model.id.clone(),
            model,
            timestamp: UtcDateTime::now(),
        }
    }

    /// Create a new model deleted event
    pub fn model_deleted(model_id: Uuid) -> Self {
        Self::ModelDeleted {
            model_id,
            timestamp: UtcDateTime::now(),
        }
    }

    /// Create a new entity added event
    pub fn entity_added(model_id: Uuid, entity_id: Uuid) -> Self {
        Self::EntityAdded {
            model_id,
            entity_id,
            timestamp: UtcDateTime::now(),
        }
    }

    /// Create a new entity updated event
    pub fn entity_updated(model_id: Uuid, entity_id: Uuid) -> Self {
        Self::EntityUpdated {
            model_id,
            entity_id,
            timestamp: UtcDateTime::now(),
        }
    }

    /// Create a new entity removed event
    pub fn entity_removed(model_id: Uuid, entity_id: Uuid) -> Self {
        Self::EntityRemoved {
            model_id,
            entity_id,
            timestamp: UtcDateTime::now(),
        }
    }

    /// Create a new relationship added event
    pub fn relationship_added(model_id: Uuid, relationship_id: Uuid) -> Self {
        Self::RelationshipAdded {
            model_id,
            relationship_id,
            timestamp: UtcDateTime::now(),
        }
    }

    /// Create a new relationship updated event
    pub fn relationship_updated(model_id: Uuid, relationship_id: Uuid) -> Self {
        Self::RelationshipUpdated {
            model_id,
            relationship_id,
            timestamp: UtcDateTime::now(),
        }
    }

    /// Create a new relationship removed event
    pub fn relationship_removed(model_id: Uuid, relationship_id: Uuid) -> Self {
        Self::RelationshipRemoved {
            model_id,
            relationship_id,
            timestamp: UtcDateTime::now(),
        }
    }

    /// Create a new flow added event
    pub fn flow_added(model_id: Uuid, flow_id: Uuid) -> Self {
        Self::FlowAdded {
            model_id,
            flow_id,
            timestamp: UtcDateTime::now(),
        }
    }

    /// Create a new flow updated event
    pub fn flow_updated(model_id: Uuid, flow_id: Uuid) -> Self {
        Self::FlowUpdated {
            model_id,
            flow_id,
            timestamp: UtcDateTime::now(),
        }
    }

    /// Create a new flow removed event
    pub fn flow_removed(model_id: Uuid, flow_id: Uuid) -> Self {
        Self::FlowRemoved {
            model_id,
            flow_id,
            timestamp: UtcDateTime::now(),
        }
    }

    /// Create a new layout added event
    pub fn layout_added(model_id: Uuid, layout_id: Uuid) -> Self {
        Self::LayoutAdded {
            model_id,
            layout_id,
            timestamp: UtcDateTime::now(),
        }
    }

    /// Create a new layout updated event
    pub fn layout_updated(model_id: Uuid, layout_id: Uuid) -> Self {
        Self::LayoutUpdated {
            model_id,
            layout_id,
            timestamp: UtcDateTime::now(),
        }
    }

    /// Create a new layout removed event
    pub fn layout_removed(model_id: Uuid, layout_id: Uuid) -> Self {
        Self::LayoutRemoved {
            model_id,
            layout_id,
            timestamp: UtcDateTime::now(),
        }
    }

    /// Get the model ID associated with this event
    pub fn model_id(&self) -> Uuid {
        match self {
            Self::ModelCreated { model_id, .. } => model_id.clone(),
            Self::ModelUpdated { model_id, .. } => model_id.clone(),
            Self::ModelDeleted { model_id, .. } => model_id.clone(),
            Self::EntityAdded { model_id, .. } => model_id.clone(),
            Self::EntityUpdated { model_id, .. } => model_id.clone(),
            Self::EntityRemoved { model_id, .. } => model_id.clone(),
            Self::RelationshipAdded { model_id, .. } => model_id.clone(),
            Self::RelationshipUpdated { model_id, .. } => model_id.clone(),
            Self::RelationshipRemoved { model_id, .. } => model_id.clone(),
            Self::FlowAdded { model_id, .. } => model_id.clone(),
            Self::FlowUpdated { model_id, .. } => model_id.clone(),
            Self::FlowRemoved { model_id, .. } => model_id.clone(),
            Self::LayoutAdded { model_id, .. } => model_id.clone(),
            Self::LayoutUpdated { model_id, .. } => model_id.clone(),
            Self::LayoutRemoved { model_id, .. } => model_id.clone(),
        }
    }

    /// Get the timestamp of this event
    pub fn timestamp(&self) -> UtcDateTime {
        match self {
            Self::ModelCreated { timestamp, .. } => timestamp.clone(),
            Self::ModelUpdated { timestamp, .. } => timestamp.clone(),
            Self::ModelDeleted { timestamp, .. } => timestamp.clone(),
            Self::EntityAdded { timestamp, .. } => timestamp.clone(),
            Self::EntityUpdated { timestamp, .. } => timestamp.clone(),
            Self::EntityRemoved { timestamp, .. } => timestamp.clone(),
            Self::RelationshipAdded { timestamp, .. } => timestamp.clone(),
            Self::RelationshipUpdated { timestamp, .. } => timestamp.clone(),
            Self::RelationshipRemoved { timestamp, .. } => timestamp.clone(),
            Self::FlowAdded { timestamp, .. } => timestamp.clone(),
            Self::FlowUpdated { timestamp, .. } => timestamp.clone(),
            Self::FlowRemoved { timestamp, .. } => timestamp.clone(),
            Self::LayoutAdded { timestamp, .. } => timestamp.clone(),
            Self::LayoutUpdated { timestamp, .. } => timestamp.clone(),
            Self::LayoutRemoved { timestamp, .. } => timestamp.clone(),
        }
    }

    /// Get a human-readable description of the event
    pub fn description(&self) -> String {
        match self {
            Self::ModelCreated { model, .. } => format!("Model '{}' was created", model.name),
            Self::ModelUpdated { model, .. } => format!("Model '{}' was updated", model.name),
            Self::ModelDeleted { model_id, .. } => format!("Model {} was deleted", model_id),
            Self::EntityAdded { entity_id, .. } => format!("Entity {} was added", entity_id),
            Self::EntityUpdated { entity_id, .. } => format!("Entity {} was updated", entity_id),
            Self::EntityRemoved { entity_id, .. } => format!("Entity {} was removed", entity_id),
            Self::RelationshipAdded { relationship_id, .. } => format!("Relationship {} was added", relationship_id),
            Self::RelationshipUpdated { relationship_id, .. } => format!("Relationship {} was updated", relationship_id),
            Self::RelationshipRemoved { relationship_id, .. } => format!("Relationship {} was removed", relationship_id),
            Self::FlowAdded { flow_id, .. } => format!("Flow {} was added", flow_id),
            Self::FlowUpdated { flow_id, .. } => format!("Flow {} was updated", flow_id),
            Self::FlowRemoved { flow_id, .. } => format!("Flow {} was removed", flow_id),
            Self::LayoutAdded { layout_id, .. } => format!("Layout {} was added", layout_id),
            Self::LayoutUpdated { layout_id, .. } => format!("Layout {} was updated", layout_id),
            Self::LayoutRemoved { layout_id, .. } => format!("Layout {} was removed", layout_id),
        }
    }
}

/// WebSocket message wrapper for model events
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelEventMessage {
    /// The event data
    pub event: ModelChangeEvent,
    /// Optional client ID to exclude from broadcast (avoid echo)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub exclude_client: Option<String>,
}

impl ModelEventMessage {
    /// Create a new event message
    pub fn new(event: ModelChangeEvent) -> Self {
        Self {
            event,
            exclude_client: None,
        }
    }

    /// Create a new event message with client exclusion
    pub fn with_exclusion(event: ModelChangeEvent, exclude_client: String) -> Self {
        Self {
            event,
            exclude_client: Some(exclude_client),
        }
    }
}