use sea_orm::entity::prelude::*;
use sea_orm::Set;
use serde::{Deserialize, Serialize};

/// AppEntities table for storing TorqueApp entity instances across all models
/// This table uses a unified schema for all entity types with JSON storage
#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "app_entities")]
pub struct Model {
    /// Unique identifier for this entity instance
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: String,
    
    /// UUID of the Torque Model this entity belongs to
    #[sea_orm(indexed)]
    pub model_id: String,
    
    /// Entity type name as defined in the Torque Model (e.g., "Post", "User", "Todo")
    #[sea_orm(indexed)]
    pub entity_type: String,
    
    /// JSON blob containing the actual entity data as defined by the model
    /// Example: {"name": "Joe Blow", "phone": "123123123", "email": "joe@example.com"}
    pub data: Json,
    
    /// When this entity instance was created
    pub created_at: DateTime,
    
    /// When this entity instance was last updated
    pub updated_at: DateTime,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {
    /// Set timestamps on insert and update
    fn new() -> Self {
        use uuid::Uuid;
        use chrono::Utc;
        
        Self {
            id: Set(Uuid::new_v4().to_string()),
            created_at: Set(Utc::now().naive_utc()),
            updated_at: Set(Utc::now().naive_utc()),
            ..Default::default()
        }
    }

    fn before_save<'life0, 'async_trait, C>(
        mut self,
        _db: &'life0 C,
        insert: bool,
    ) -> core::pin::Pin<Box<
        dyn core::future::Future<Output = Result<Self, DbErr>> + core::marker::Send + 'async_trait,
    >>
    where
        'life0: 'async_trait,
        C: 'async_trait + ConnectionTrait,
        Self: 'async_trait,
    {
        Box::pin(async move {
            if !insert {
                self.updated_at = Set(chrono::Utc::now().naive_utc());
            }
            Ok(self)
        })
    }
}