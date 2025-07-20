# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Torque is a high-performance platform for designing, running and presenting applications, targeting Web frontends for humans and MCP APIs for AI agents. The platform emphasizes **speed as the top priority** and uses a model-driven architecture where applications are dynamically generated from visual models.

 - DESIGN.md and IMPLEMENTATION.md contain the project description 
 - DESIGN-MODEL-EDITOR.md contains the description and specifications for the model-editor frontend ui
 - TODO.md contains the implementation plan. Keep this file updated as changes are made
 - Reviews go to docs/reviews, are written in markdown, and are prefixed with the current date (example prefix : '2025-07-02-')
 - Plans go to docs/reviews, are written in markdown, and are prefixed with the current date (example prefix : '2025-07-02-')

## Tooling

 - Use any relevant cargo tooling, request its installation if it is not available
 - Remember to use playwright-mcp for frontend verification and troubleshooting
 - Request any relevant tooling

## Architecture Principles

### Core Design Philosophy
- **Performance First**: Every implementation decision prioritizes speed and optimization
- **Model-Driven**: Applications are generated from visual models stored as JSON
- **Real-time Synchronization**: Live updates between Model Editor and running TorqueApps
- **Client Agnostic**: JSON-RPC protocol supports multiple frontend implementations
- **Self-Contained**: Single Rust binary contains all functionality

### System Components
1. **Core Server** (Rust) - Self-contained binary with optimized database integration
2. **Model Editor** (React + GraphQL) - Visual interface for designing application models  
3. **TorqueApp Runtime** (React + JSON-RPC) - Dynamically generated application frontends
4. **XFlow Engine** (BoaJS) - Lightweight DAG-based workflow system for business logic

## Technology Stack

### Backend (Rust)
- **Runtime**: tokio (async), axum (HTTP), tower (middleware)
- **Database**: sea-orm with SQLite/PostgreSQL, hash-partitioned entities table
- **APIs**: async-graphql (Model Editor), jsonrpc-core (TorqueApp), axum-mcp (AI agents)
- **JavaScript**: boa_engine for embedded workflows with HTTP-Fetch support
- **Performance**: simd-json, mimalloc, dashmap, parking_lot for optimization

### Frontend (React)
- **Model Editor**: Apollo Client + GraphQL, Mantine UI, ReactFlow for visual editing
- **TorqueApp**: JSON-RPC client, dynamic component system with grid-based layouts
- **Development**: Storybook for component isolation, TypeScript throughout

## Database Architecture

### Core Tables
- `torque_models` - Design-time model definitions with JSONB storage
- `torque_applications` - Runtime application instances 
- `entities` - Universal entity storage (hash-partitioned by application_id into 8 partitions)
- `entity_relationships` - Bidirectional entity relationships
- `xflows` - Workflow definitions with DAG JSON
- `xflow_executions` - Workflow execution history (time-partitioned)

### Performance Optimizations
- Hash partitioning on `entities` table for load distribution
- GIN indexes on JSONB columns for fast queries
- Connection pooling with aggressive caching strategies
- Partition pruning for large datasets

## Development Workflow

### Project Structure (Planned)
```
src/
├── main.rs              # CLI with server, init, migrate, model, xflow commands
├── entity/              # High-performance entity CRUD with caching
├── model/               # Model service and GraphQL resolvers
├── xflow/               # XFlow engine with BoaJS runtime pool
├── jsonrpc/             # Dynamic JSON-RPC API for TorqueApp
├── server/              # HTTP server with GraphQL + JSON-RPC + MCP endpoints
└── sync/                # Real-time synchronization between components

frontend/
├── model-editor/        # React app for visual model design
├── torque-app/          # Dynamic React runtime for generated apps
└── components/          # Shared component library with Storybook
```

### Key Commands (From Implementation Plan)
```bash
# Server commands
cargo run -- server --bind 127.0.0.1:8080 --optimize
cargo run -- init ./my-project --database postgres
cargo run -- migrate --up
cargo run -- model create "My App"
cargo run -- xflow execute workflow_id --input '{"data": "value"}'

# Development
cargo build --release --features="simd,mimalloc"  # Performance build
cargo test                                        # Unit tests
npm run storybook                                 # Component development
npm run build-storybook                          # Storybook build
```

## Performance Requirements

### Targets (From Specification)
- Entity CRUD operations: <10ms
- Database queries: <100ms for 1M+ entities  
- XFlow execution: <50ms for simple workflows
- JSON-RPC API responses: <100ms
- Model Editor GraphQL: <50ms
- Entity cache hit rate: >95%
- System capacity: 10K+ concurrent users

### Optimization Strategies
- SIMD JSON parsing for high-throughput data processing
- DashMap for lock-free concurrent caching
- Connection pooling with mimalloc for memory optimization
- Hash partitioning for horizontal scaling
- BoaJS runtime pooling for XFlow execution

## Unique Architecture Patterns

### Dynamic Component System
TorqueApps receive complete UI layouts as JSON from JSON-RPC calls. Each page navigation triggers a new `loadPage` call that returns:
```json
{
  "components": [
    {
      "type": "DataGrid", 
      "position": {"row": 1, "col": 0, "width": 12, "height": 8},
      "props": {"entityType": "todo", "pagination": true}
    }
  ]
}
```

### Model-Driven Entity System
All application data is stored in a universal `entities` table with JSONB data column. Entity types are defined in Torque Models, not database schemas. This enables non-destructive schema changes and dynamic application generation.

### XFlow Workflow Integration
Business logic is implemented as DAG workflows that can:
- Execute JavaScript code in sandboxed BoaJS runtimes
- Trigger on entity lifecycle events (onCreate, onUpdate, etc.)
- Make HTTP requests via embedded fetch function
- Chain together for complex business processes

### Real-time Model Synchronization
Changes in the Model Editor automatically propagate to running TorqueApps via WebSocket connections, enabling live application updates without restarts.

## Implementation Status

**Current Phase**: Planning (0% complete)
**Next Priority**: Phase 1 - Core Foundation (Weeks 1-6)
- Project setup with performance-optimized Cargo.toml
- Database schema implementation with partitioning
- Core Rust services architecture

See TODO.md for detailed 36-week implementation plan with specific tasks and milestones.
