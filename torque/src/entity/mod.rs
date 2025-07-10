// Entity management system with high-performance caching
// TODO: Implement in Phase 1, Week 3-4

pub mod service;
pub mod cache;
pub mod types;

pub use service::EntityService;
pub use cache::EntityCache;
pub use types::*;