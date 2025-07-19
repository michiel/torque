use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(AppEntities::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(AppEntities::Id)
                            .uuid()
                            .not_null()
                            .primary_key(),
                    )
                    .col(
                        ColumnDef::new(AppEntities::ModelId)
                            .uuid()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(AppEntities::EntityType)
                            .string()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(AppEntities::Data)
                            .json()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(AppEntities::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(AppEntities::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null(),
                    )
                    .to_owned(),
            )
            .await?;

        // Create indexes for efficient querying
        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_app_entities_model_id")
                    .table(AppEntities::Table)
                    .col(AppEntities::ModelId)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_app_entities_model_entity")
                    .table(AppEntities::Table)
                    .col(AppEntities::ModelId)
                    .col(AppEntities::EntityType)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_app_entities_created_at")
                    .table(AppEntities::Table)
                    .col(AppEntities::CreatedAt)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(AppEntities::Table).to_owned())
            .await
    }
}

#[derive(Iden)]
enum AppEntities {
    Table,
    Id,
    ModelId,
    EntityType,
    Data,
    CreatedAt,
    UpdatedAt,
}