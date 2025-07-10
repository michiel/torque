# Torque

A high-performance platform for designing, running, and presenting applications. Torque enables dynamic application generation from visual models, targeting both web frontends for humans and MCP APIs for AI agents.

## 🚀 Overview

Torque is built with performance as the top priority, featuring a model-driven architecture that generates applications dynamically from visual models. The platform provides real-time synchronization between the Model Editor and TorqueApp runtime, making it ideal for rapid application development and AI-agent interactions.

### Key Features

- **🏗️ Model-Driven Architecture**: Visual model editor with entities, relationships, flows, and layouts
- **⚡ High-Performance Runtime**: Rust backend with sub-10ms entity operations and <50ms GraphQL responses
- **⚛️ Dynamic React Frontend**: Component system that generates UIs from model definitions
- **🔄 Real-Time Synchronization**: WebSocket-based live updates between Model Editor and TorqueApp
- **🤖 AI-Friendly**: Native MCP API support for AI agent interactions via JSON-RPC 2.0
- **📊 Component System**: DataGrid, TorqueForm, TorqueButton, Text, Container, and Modal components

## 🏗️ Architecture

### Backend (Rust)
- **Axum HTTP Server** on port 8080
- **GraphQL API** for Model Editor operations
- **JSON-RPC 2.0 API** for TorqueApp runtime
- **WebSocket Real-time Sync** for live model updates
- **High-Performance Caching** with DashMap and broadcast channels
- **Database Layer** with Sea-ORM (SQLite/PostgreSQL support)

### Frontend
- **Model Editor** (React + TypeScript) on port 3000
- **TorqueApp Runtime** (React + TypeScript) on port 3001
- **Mantine UI Components** for professional interface
- **Apollo Client** for GraphQL integration
- **Dynamic Component Rendering** from JSON configurations

## 🚀 Quick Start

### Prerequisites

- **Rust** (latest stable)
- **Node.js** 18+ and npm
- **Git**

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd torque
   ```

2. **Start the development environment**
   ```bash
   ./scripts/dev.sh
   ```

   This will start:
   - Rust backend server on `http://localhost:8080`
   - Model Editor on `http://localhost:3000`
   - All APIs (GraphQL, JSON-RPC, WebSocket)

3. **Start TorqueApp frontend** (optional)
   ```bash
   cd frontend/torque-client
   npm install
   npm run dev
   ```
   - TorqueApp runtime on `http://localhost:3001`

### Running Tests

```bash
./scripts/test-dev.sh
```

## 📖 API Documentation

### GraphQL API (Model Editor)
- **Endpoint**: `http://localhost:8080/graphql`
- **Playground**: `http://localhost:8080/graphql/playground`
- **Operations**: Model CRUD, Entity management, Real-time subscriptions

### JSON-RPC 2.0 API (TorqueApp)
- **Endpoint**: `http://localhost:8080/rpc`
- **Methods**: `loadPage`, `loadEntityData`, `getFormDefinition`, `createEntity`, `updateEntity`, `deleteEntity`

### WebSocket API (Real-time Sync)
- **Endpoint**: `ws://localhost:8080/ws`
- **Features**: Live model change notifications, Client filtering, Auto-reconnection

## 🎨 Using the Model Editor

1. **Open the Model Editor**: `http://localhost:3000`
2. **Create a New Model**: Click "Create Model" and define your application structure
3. **Add Entities**: Define data structures with fields, types, and validation
4. **Create Relationships**: Link entities with one-to-many, many-to-many relationships
5. **Design Layouts**: Create responsive UI layouts with grid positioning
6. **Real-time Preview**: Changes are instantly reflected across all connected clients

## 🏃 Running TorqueApps

1. **Create a model** in the Model Editor
2. **Copy the model ID** from the URL or model details
3. **Navigate to TorqueApp**: `http://localhost:3001/app/{model-id}`
4. **Interact with your app**: The UI is dynamically generated from your model definition

### TorqueApp URLs
- **Home page**: `http://localhost:3001/`
- **Run an app**: `http://localhost:3001/app/{model-id}`
- **Specific page**: `http://localhost:3001/app/{model-id}/{page-name}`

## 🧩 Component System

### Available Components
- **DataGrid**: Tables with sorting, filtering, pagination
- **TorqueForm**: Dynamic forms with validation
- **TorqueButton**: Buttons with action handling
- **Text**: Typography with variants (h1-h6, body, caption)
- **Container**: Layout containers with styling
- **Modal**: Overlay dialogs for forms and content

### Action System
- **openModal**: Open forms and dialogs
- **navigateTo**: Navigate between pages
- **createEntity/updateEntity/deleteEntity**: CRUD operations

## 🔧 Development Scripts

- **`./scripts/dev.sh`**: Start full development environment
- **`./scripts/test-dev.sh`**: Run end-to-end tests with Playwright
- **`cargo run -p torque -- server`**: Start backend only
- **`cd frontend/model-editor && npm run dev`**: Start Model Editor only
- **`cd frontend/torque-client && npm run dev`**: Start TorqueApp only

## 📁 Project Structure

```
torque/
├── torque/                   # Rust backend
│   ├── src/
│   │   ├── server/          # HTTP server, GraphQL, JSON-RPC, WebSocket
│   │   ├── services/        # Model, Cache, Broadcast services
│   │   ├── model/           # Data types and events
│   │   └── main.rs
│   └── Cargo.toml
├── frontend/
│   ├── model-editor/        # React Model Editor
│   │   ├── src/
│   │   │   ├── components/  # UI components
│   │   │   ├── graphql/     # GraphQL queries and mutations
│   │   │   ├── hooks/       # React hooks (WebSocket, etc.)
│   │   │   └── providers/   # Context providers
│   │   └── package.json
│   └── torque-client/       # React TorqueApp Runtime
│       ├── src/
│       │   ├── components/  # Dynamic component system
│       │   ├── services/    # JSON-RPC client
│       │   ├── hooks/       # Data fetching hooks
│       │   └── types/       # TypeScript definitions
│       └── package.json
├── scripts/                 # Development and test scripts
└── README.md
```

## 🎯 Implementation Status

### ✅ Phase 1: Core Foundation (100% Complete)
- High-performance Rust server with comprehensive services architecture
- Database schema with partitioning and performance optimization
- Entity management with caching and real-time sync
- HTTP server with middleware and API endpoints

### ✅ Phase 2: Model System (100% Complete)
- GraphQL API backend with complete CRUD operations
- Professional React Model Editor with Mantine UI
- Real-time WebSocket synchronization with broadcast channels
- Comprehensive model system (entities, relationships, flows, layouts)

### ✅ Phase 3: TorqueApp Runtime (100% Complete)
- Complete JSON-RPC 2.0 API with 11 core methods
- Dynamic React frontend with component system
- Layout engine with grid-based responsive layouts
- Form generation with validation from entity schemas
- Component action system for user interactions

### 🔄 Phase 4: XFlow Engine (Planned)
- DAG-based workflow execution system
- BoaJS JavaScript runtime integration
- Visual workflow editor with React Flow
- Entity lifecycle hooks and webhook integration

### 🔄 Phase 5: MCP Integration (Planned)
- Full MCP API support for AI agents
- Bulk operations and performance optimizations
- AI-friendly data formats and query capabilities
- Tool composition and chaining for agent workflows

## 🚦 Health Check Endpoints

- **Backend Health**: `http://localhost:8080/health`
- **Backend Metrics**: `http://localhost:8080/metrics`
- **Backend Status**: `http://localhost:8080/status`

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** with proper testing
4. **Commit your changes**: `git commit -m 'Add amazing feature'`
5. **Push to the branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Rust](https://rust-lang.org/) and [Axum](https://github.com/tokio-rs/axum)
- Frontend powered by [React](https://reactjs.org/) and [Mantine](https://mantine.dev/)
- Real-time features using [tokio](https://tokio.rs/) broadcast channels
- Database integration with [Sea-ORM](https://www.sea-ql.org/SeaORM/)
- GraphQL implementation with [async-graphql](https://async-graphql.github.io/)

---

**Torque** - Transforming ideas into high-performance applications through model-driven development.