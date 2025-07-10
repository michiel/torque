pub mod schema;

pub use schema::*;

use async_graphql::Schema;

/// GraphQL schema type
pub type GraphQLSchema = Schema<Query, Mutation, SubscriptionRoot>;

/// Create a new GraphQL schema
pub fn create_schema() -> GraphQLSchema {
    Schema::build(Query, Mutation, SubscriptionRoot)
        .finish()
}