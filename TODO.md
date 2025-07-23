# Torque Implementation Plan

**Project Status**: 🎯 **Priority Refocus - TorqueApp MVP**  
**Last Updated**: 2025-07-23  
**Current Priority**: Implement functional TorqueApp MVP with DataGrid rendering and data population

---

## 🚨 Critical Priority: TorqueApp MVP Implementation

**Context**: During testing, we discovered that the TorqueApp frontend (Phase 3) is incomplete. While the JSON-RPC API infrastructure exists, the actual dynamic React frontend that renders layouts and populates DataGrids with data is not functional.

**Immediate Goal**: Implement a minimal viable TorqueApp that can:
1. ✅ Load start page layouts via JSON-RPC 
2. ✅ Render DataGrid components dynamically
3. ✅ Populate DataGrids with actual entity data 
4. ✅ Function as an embeddable standalone React component
5. ✅ Support model app preview in the Model Editor frontend

---

## 🎯 MVP Implementation Plan

### Phase MVP-1: Core TorqueApp Frontend (Week 1-2) - **🔴 URGENT**

**Status**: 🔴 **Not Started - Critical Priority**  
**Dependencies**: ✅ JSON-RPC API Complete (exists but needs data integration)  
**Key Deliverable**: Functional TorqueApp that renders sample todo-app model

#### MVP-1.1 TorqueApp Runtime Implementation - **🔴 URGENT**
- [ ] **P1** Fix existing torque-client to actually render layouts
  - [ ] Implement missing JSON-RPC `loadPage` integration
  - [ ] Connect DataGrid component to `loadEntityData` endpoint
  - [ ] Implement proper component rendering from JSON layout
  - [ ] Fix start page routing and layout loading
- [ ] **P1** Data population system
  - [ ] Implement sample data loading from model definitions
  - [ ] Connect entity queries to populate DataGrid with real data
  - [ ] Fix project entity rendering in todo-app sample
  - [ ] Add proper error handling for missing data
- [ ] **P1** Component system completion
  - [ ] Ensure all 6 components (DataGrid, Form, Button, Text, Container, Modal) work
  - [ ] Implement proper action handling (create, edit, delete)
  - [ ] Add modal dialogs for entity operations
  - [ ] Fix component positioning and styling

#### MVP-1.2 Sample Data Integration - **🔴 URGENT**
- [ ] **P1** Automatic sample data loading
  - [ ] Implement sample data insertion from model JSON files
  - [ ] Create CLI command to populate sample data: `torque model load-sample-data <model-id>`
  - [ ] Auto-populate data on model import for development
  - [ ] Add GraphQL mutations for bulk entity creation
- [ ] **P1** Todo app demonstration
  - [ ] Load project entities from todo-app.json sample_data
  - [ ] Ensure project_dashboard layout renders with populated DataGrid
  - [ ] Test all CRUD operations on project entities
  - [ ] Verify pagination, sorting, filtering work with real data

#### MVP-1.3 Embeddable Component Architecture - **🔴 URGENT**
- [ ] **P1** Standalone TorqueApp component
  - [ ] Create `<TorqueApp modelId="..." startPage="..." />` React component
  - [ ] Implement self-contained JSON-RPC client within component
  - [ ] Add proper prop interfaces for embedding in other React apps
  - [ ] Support custom API endpoints and configuration
- [ ] **P1** Model Editor integration
  - [ ] Add TorqueApp preview panel to Model Editor
  - [ ] Implement live preview updates when model changes
  - [ ] Add preview modal/drawer in layout editor
  - [ ] Connect to existing WebSocket real-time sync

### Phase MVP-2: Production Ready TorqueApp (Week 3-4) - **🟡 HIGH**

#### MVP-2.1 Performance and Polish
- [ ] **P1** TorqueApp performance optimization
  - [ ] Implement request caching in JSON-RPC client  
  - [ ] Add virtual scrolling for large DataGrids
  - [ ] Optimize component rendering with React.memo
  - [ ] Add loading states and skeleton screens
- [ ] **P1** Error handling and resilience
  - [ ] Comprehensive error boundary implementation
  - [ ] Graceful degradation for missing components
  - [ ] Connection retry logic for API failures
  - [ ] User-friendly error messages

#### MVP-2.2 Developer Experience
- [ ] **P1** TorqueApp development tools
  - [ ] Hot reload for layout changes during development
  - [ ] Debug mode with component tree visualization
  - [ ] Performance monitoring and metrics
  - [ ] Component library Storybook integration
- [ ] **P2** Documentation and examples
  - [ ] TorqueApp embedding guide
  - [ ] Model-to-app workflow documentation
  - [ ] Sample implementations and tutorials
  - [ ] API reference for JSON-RPC methods

---

## 🎯 Current Implementation Status Review

### ✅ **COMPLETED PHASES**

#### Phase 1: Core Foundation - **✅ COMPLETED**
- ✅ High-performance Rust server with database integration
- ✅ Entity management system with caching
- ✅ HTTP server with comprehensive API endpoints
- ✅ Service architecture with dependency injection
- ✅ Performance monitoring and testing framework

#### Phase 2: Model System - **✅ COMPLETED**  
- ✅ Model Editor with GraphQL API
- ✅ Professional React frontend with Mantine UI
- ✅ Real-time WebSocket synchronization
- ✅ Complete CRUD operations for models, entities, relationships
- ✅ Model import/export with JSON Schema validation

#### Phase 3: TorqueApp Infrastructure - **✅ PARTIALLY COMPLETED**
- ✅ JSON-RPC API server with 11 core methods
- ✅ Component type definitions and interfaces
- ✅ Basic React application structure
- 🔴 **MISSING**: Actual layout rendering and data population
- 🔴 **MISSING**: Working DataGrid with real entity data
- 🔴 **MISSING**: Embeddable component architecture

#### Phase VIS: Visual Layout Editor - **✅ COMPLETED**
- ✅ Complete Puck-based visual editor replacement
- ✅ All 5 core components with configuration editors
- ✅ Real-time preview and responsive design
- ✅ GraphQL backend integration with WebSocket sync
- ✅ Data migration from legacy editor
- ✅ Comprehensive Storybook documentation

---

## 🔄 **DEFERRED PHASES** (Post-MVP)

### Phase 3A: Enhanced Model Editor & Developer Experience - **40% Complete**
- ✅ Visual Layout Editor with Drag-and-Drop ✅
- ✅ DataGrid and Form Configuration Editors ✅  
- ✅ Comprehensive Storybook Documentation ✅
- 🟡 **DEFERRED**: Component Plugin Architecture
- 🟡 **DEFERRED**: End-to-End Playwright Testing
- 🟡 **DEFERRED**: Data Import/Export System

### Phase 4: XFlow Engine - **0% Complete - DEFERRED**
- 🟡 **DEFERRED**: XFlow DAG System
- 🟡 **DEFERRED**: BoaJS Runtime Integration  
- 🟡 **DEFERRED**: Visual and JSON Editors

### Phase 5: MCP Integration - **0% Complete - DEFERRED**
- 🟡 **DEFERRED**: axum-mcp Integration
- 🟡 **DEFERRED**: AI Agent API
- 🟡 **DEFERRED**: Advanced Features

### Phase 6: Production Ready - **0% Complete - DEFERRED**
- 🟡 **DEFERRED**: Performance Optimization
- 🟡 **DEFERRED**: Testing and Quality Assurance
- 🟡 **DEFERRED**: Deployment and Documentation

---

## 🎯 Success Criteria for MVP

### Critical MVP Requirements (Must Have)
1. ✅ **Functional TorqueApp Runtime**
   - [ ] Loads and renders project_dashboard layout from todo-app model
   - [ ] DataGrid displays actual project entities with all configured columns
   - [ ] Start page routing works: `/app/Todo%20Application/project_dashboard`
   - [ ] All CRUD operations functional through DataGrid actions

2. ✅ **Data Integration**
   - [ ] Sample data from model JSON automatically loaded into database
   - [ ] Project entities visible in DataGrid with correct data
   - [ ] Pagination, sorting, filtering work with real data
   - [ ] Entity relationships properly resolved and displayed

3. ✅ **Embeddable Component**
   - [ ] `<TorqueApp />` component works standalone
   - [ ] Can be embedded in Model Editor for live preview
   - [ ] Props interface supports modelId, startPage, apiEndpoint
   - [ ] Self-contained with no external dependencies

4. ✅ **Model Editor Integration**
   - [ ] Preview button in Model Editor opens TorqueApp in modal/drawer
   - [ ] Live preview updates when model changes
   - [ ] Layout changes reflect immediately in preview
   - [ ] WebSocket integration maintains real-time sync

### MVP Performance Targets
- [ ] Page load time: <2 seconds for typical model
- [ ] DataGrid rendering: <500ms for 100 entities
- [ ] JSON-RPC response time: <100ms average
- [ ] Component embedding: <1 second initialization

### MVP Quality Gates
- [ ] Todo-app model fully functional end-to-end
- [ ] All 6 TorqueApp components render correctly
- [ ] Error handling prevents crashes
- [ ] Works in latest Chrome, Firefox, Safari
- [ ] Responsive design works on mobile

---

## 🛠️ Implementation Strategy

### Development Approach
1. **Fix First**: Repair existing torque-client instead of rewriting
2. **Sample-Driven**: Use todo-app model as primary test case
3. **Incremental**: Get basic rendering working, then add features
4. **Real Data**: Focus on actual entity data, not mock data
5. **Embed Early**: Design for embedding from the start

### Development Environment Setup
```bash
# Terminal 1: Run Torque server
cargo run -- server --bind 127.0.0.1:8081

# Terminal 2: Load sample data
cargo run -- model import sample/models/todo-app.json
cargo run -- model load-sample-data "Todo Application"

# Terminal 3: Run TorqueApp frontend  
cd frontend/torque-client && npm run dev

# Terminal 4: Run Model Editor (for preview integration)
cd frontend/model-editor && npm run dev
```

### Testing Strategy
1. **Manual Testing**: Browser-based testing with real models
2. **Component Testing**: Individual component rendering
3. **Integration Testing**: Full model-to-app workflow
4. **Embedding Testing**: TorqueApp component in isolation

---

## 📋 Implementation Guidelines

### Priority Levels (Updated)
- **P1**: Critical for MVP - blocks basic functionality
- **P2**: Important for production but not MVP-blocking
- **P3**: Nice-to-have features for future releases

### Development Standards
- **MVP First**: Only implement what's needed for basic functionality
- **Real Data**: Use actual entities, not mock data
- **Component Isolation**: Each component should work independently
- **Error Resilience**: Graceful handling of missing data/APIs

### Quality Gates (MVP)
- [ ] Basic TorqueApp renders without errors
- [ ] DataGrid shows real entity data
- [ ] Component embedding works in isolation
- [ ] Model Editor preview integration functional

---

## 🔄 Risk Management (Updated)

### Critical MVP Risks
- **Data Loading**: Sample data may not load correctly into entities table
- **JSON-RPC Integration**: Existing API may not provide required data format
- **Component Rendering**: Dynamic component system may have gaps
- **Embedding Architecture**: Component isolation may break existing patterns

### Mitigation Strategies
- **Incremental Development**: Get basic DataGrid working first
- **Sample Data Priority**: Ensure todo-app sample data loads reliably
- **Component Testing**: Test each component in isolation before integration
- **Fallback Plans**: Simple static rendering if dynamic system fails

---

## 📅 MVP Milestone Calendar

| Week | Phase | Key Deliverable | Success Metric |
|------|-------|----------------|-----------------|
| 1 | MVP-1.1 | TorqueApp Runtime | DataGrid renders with data |
| 1 | MVP-1.2 | Sample Data Integration | Project entities visible |
| 2 | MVP-1.3 | Embeddable Component | `<TorqueApp />` works standalone |
| 2 | MVP-1.3 | Model Editor Integration | Preview modal functional |
| 3 | MVP-2.1 | Performance & Polish | <2s page load time |
| 4 | MVP-2.2 | Developer Experience | Documentation complete |

---

## 🎉 Post-MVP Roadmap

Once MVP is complete, return to original implementation plan:

1. **Complete Phase 3A**: Finish testing and plugin architecture
2. **Phase 4**: XFlow Engine implementation  
3. **Phase 5**: MCP Integration for AI agents
4. **Phase 6**: Production deployment and scaling

**MVP Success**: Working TorqueApp that demonstrates the complete model-driven application generation vision with real data and embeddable architecture.

---

*This TODO.md has been refocused to prioritize the critical TorqueApp MVP implementation. Original comprehensive plan preserved for post-MVP development.*