pub mod schema;
pub mod zero_copy;

pub use schema::*;

use async_graphql::Schema;

/// GraphQL schema type - can be either standard or optimized
pub enum GraphQLSchema {
    Standard(Schema<Query, Mutation, SubscriptionRoot>),
    Optimized(Schema<zero_copy::OptimizedQuery, zero_copy::OptimizedMutation, zero_copy::OptimizedSubscription>),
}

/// Create a new GraphQL schema based on configuration
pub fn create_schema(config: &GraphQLConfig) -> GraphQLSchema {
    if config.use_optimized_schema {
        GraphQLSchema::Optimized(zero_copy::create_optimized_schema())
    } else {
        GraphQLSchema::Standard(Schema::build(Query, Mutation, SubscriptionRoot).finish())
    }
}

/// Configuration for GraphQL optimization
pub struct GraphQLConfig {
    pub use_optimized_schema: bool,
}

impl Default for GraphQLConfig {
    fn default() -> Self {
        Self {
            use_optimized_schema: true, // Use optimized schema by default
        }
    }
}