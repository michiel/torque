# Interactive Console Component Design Proposal

**Date**: 2025-08-09  
**Status**: Draft  
**Priority**: Medium  

## Overview

Design and implement an interactive console component for TorqueApps that provides users with a command-line interface to interact with their application data, execute workflows, and perform administrative tasks directly within the browser.

## Problem Statement

Currently, users need to switch between the web interface and terminal to perform advanced operations, debug issues, or execute custom commands. An embedded interactive console would:

1. Provide power users with immediate access to application internals
2. Enable rapid prototyping and testing of XFlow workflows
3. Offer debugging capabilities for application development
4. Support administrative tasks without leaving the web interface

## Architecture

### Backend: Enhanced JSON-RPC and MCP Interface

The console leverages and extends the existing JSON-RPC interface. All new methods will be exposed through both JSON-RPC endpoints and MCP tools for AI agent access:

```rust
// New JSON-RPC methods to be added to torque/src/jsonrpc/handlers.rs
// Each method will also be automatically exposed as MCP tools via axum-mcp

// Project management methods (exposed as MCP tools: torque_list_projects, torque_create_project, etc.)
"listProjects" => list_projects(state, params).await,
"createProject" => create_project(state, params).await, 
"deleteProject" => delete_project(state, params).await,
"getProjectInfo" => get_project_info(state, params).await,

// Console session management (exposed as MCP tools: torque_create_console_session, etc.)
"createConsoleSession" => create_console_session(state, params).await,
"setProjectContext" => set_project_context(state, params).await,
"getConsoleState" => get_console_state(state, params).await,

// Enhanced introspection (exposed as MCP tools: torque_get_server_logs, etc.)
"getServerLogs" => get_server_logs(state, params).await,
"getCacheStats" => get_cache_stats(state, params).await,
```

**MCP Integration**: Using `axum-mcp`, all JSON-RPC methods are automatically exposed as MCP tools with the `torque_` prefix, enabling AI agents to:
- Manage projects programmatically
- Query server state and logs  
- Access all existing CRUD operations
- Monitor system performance

The console backend will:
- Use existing JSON-RPC methods (loadPage, loadEntityData, createEntity, etc.)
- Add new methods for project management and console session state
- Automatically expose all methods as MCP tools via axum-mcp
- Maintain project context per console session
- Provide command parsing and validation layer

### Frontend: Interactive Console Component

The console will be implemented as a global overlay that appears/disappears with **Ctrl + ~** keyboard shortcut, similar to developer consoles in games and IDEs.

```typescript
interface ConsoleComponent {
  // Global overlay - not positioned in TorqueApp layout grid
  overlay: true;
  
  // Configuration
  props: {
    prompt?: string;           // Custom prompt (default: "torque> ")
    height?: string;           // Terminal height (default: "40vh")
    theme?: 'dark' | 'light';  // Visual theme
    commands?: string[];       // Available commands
    history?: boolean;         // Enable command history
    autoComplete?: boolean;    // Enable tab completion
    toggleKey?: string;        // Keyboard shortcut (default: "Ctrl+`")
    animationSpeed?: number;   // Slide animation speed in ms
  };
}
```

### Communication Architecture

```
Browser Console Component
         ↓ JSON-RPC over WebSocket/HTTP
    Torque Server JSON-RPC Handler
         ↓ Console Command Parser
    Console Session Manager
         ↓ JSON-RPC Methods + MCP Tools (via axum-mcp)
    Model/Entity/Layout Services

AI Agents (Claude, etc.)
         ↓ MCP Protocol  
    axum-mcp Integration
         ↓ Same JSON-RPC Methods
    Model/Entity/Layout Services
```

**Dual Interface Design**: 
- **Human Users**: Console UI → JSON-RPC → Services
- **AI Agents**: MCP Protocol → axum-mcp → Same JSON-RPC Methods → Services

The console maintains session state including:
- Current project context (modelId) 
- Command history
- User authentication state
- Active monitoring subscriptions

**MCP Tool Benefits**:
- AI agents can programmatically manage Torque projects
- Consistent API surface between human console and AI access
- All console capabilities available to AI agents via MCP

## Command Interface

The console leverages the existing JSON-RPC MCP interface, providing both global commands and project-scoped commands after project selection.

### Global Commands (Available Without Project Selection)

```bash
# Project management
project list                          # List all available projects/models
project new <name> [description]      # Create new project/model
project delete <id>                   # Delete project/model
project info <id>                     # Show project details
project use <id>                      # Select project context

# System operations
server status                         # Server health and info
server capabilities                   # Available JSON-RPC methods
server logs --tail <n>               # Recent server logs
cache stats                          # Cache performance metrics

# Meta commands
help [command]                       # Show help for command
clear                               # Clear console output
history                             # Show command history
exit                                # Close console
```

### Project-Scoped Commands (Available After `project use <id>`)

Once a project is selected, the console prompt shows the project context and enables resource-specific commands:

```bash
# Context: myproject>

# Layout operations (maps to loadPage, getLayoutConfig JSON-RPC)
layout list                          # List all layouts in project
layout show [name]                   # Show layout definition
layout create <name> <config>        # Create new layout
layout update <name> <config>        # Update layout configuration

# Entity operations (maps to loadEntityData, createEntity, updateEntity, deleteEntity JSON-RPC)
entity list [type]                   # List entities, optionally filtered by type
entity show <id>                     # Show specific entity
entity create <type> <json_data>     # Create new entity
entity update <id> <json_data>       # Update existing entity  
entity delete <id>                   # Delete entity
entity query <filters>               # Query entities with filters

# Component operations (maps to getComponentConfig JSON-RPC)
component list                       # List available components
component config <type>              # Show component configuration

# Model operations (maps to getModelMetadata JSON-RPC)
model show                          # Show current project model
model entities                      # List model entity definitions
model relationships                 # Show entity relationships
model export                        # Export model as JSON
```

### Advanced Features

```bash
# XFlow operations (when XFlow engine is implemented)
xflow list                           # List available workflows
xflow execute <workflow_id> <input>  # Execute workflow with input
xflow status <execution_id>          # Check execution status
xflow logs <execution_id>            # Show execution logs

# Piping and chaining (future enhancement)
entity list todos | grep "completed: false" | count
entity query --type=user --active=true | entity update status="premium"

# JavaScript evaluation (using BoaJS engine)
js> const users = await jsonrpc('loadEntityData', {entityType: 'user'})
js> console.log(users.length)
js> await jsonrpc('createEntity', {entityType: 'todo', data: {title: 'New task'}})

# Real-time monitoring 
monitor entity-changes --type=order  # Watch entity modifications
monitor server-events                # Watch server-side events
```

## Implementation Plan

### Phase 1: Enhanced JSON-RPC and MCP Methods (Week 1-2) ✅ COMPLETED
- [x] Add new JSON-RPC methods for project management (listProjects, createProject, etc.)
- [x] Implement console session management methods (createConsoleSession, setProjectContext)
- [x] Add server introspection methods (getServerLogs, getCacheStats)
- [x] Ensure all new methods are automatically exposed as MCP tools via axum-mcp
- [x] Create ConsoleSession struct to maintain project context and state
- [ ] Update MCP tool documentation with new capabilities

### Phase 2: Console Command Parser (Week 2-3)
- [ ] Implement command parsing layer that translates console commands to JSON-RPC calls
- [ ] Add project context validation (ensure commands require valid project selection)
- [ ] Create command-to-JSON-RPC mapping for all supported operations
- [ ] Add tab completion data structures and logic

### Phase 3: Frontend Console Component (Week 3-4)
- [ ] Create React-based terminal component using xterm.js
- [ ] Implement global overlay with slide-down animation
- [ ] Add Ctrl + ~ keyboard shortcut listener
- [ ] Implement WebSocket client for command execution
- [ ] Add command history, auto-completion, and syntax highlighting
- [ ] Integration as global TorqueApp overlay system

### Phase 4: Advanced Features (Week 4-5)
- [ ] JavaScript evaluation sandbox using same BoaJS engine
- [ ] Command piping and chaining
- [ ] Real-time monitoring commands
- [ ] Export/import of command sessions

## Technical Specifications

### Console Component Props

```typescript
interface ConsoleProps {
  serverUrl?: string;                // Torque server URL
  theme?: 'dark' | 'light' | 'auto';
  prompt?: string;                   // Base prompt (default: "torque>")
  height?: string;                   // CSS height value (default: "40vh")
  visible?: boolean;                 // Controlled visibility state
  toggleKey?: string;                // Keyboard shortcut (default: "Ctrl+`")
  animationSpeed?: number;           // Slide animation duration in ms
  onCommandExecute?: (command: string, result: any) => void;
  onError?: (error: Error) => void;
  onToggle?: (visible: boolean) => void;
}

interface ConsoleSession {
  sessionId: string;
  projectId?: string;                // Currently selected project/model ID
  projectName?: string;              // Display name for prompt
  history: string[];                 // Command history
  capabilities: string[];            // Available JSON-RPC methods
}

interface ConsoleState {
  session: ConsoleSession;
  visible: boolean;
  animating: boolean;
  connecting: boolean;
}

// Command-to-JSON-RPC mapping
interface CommandMapping {
  command: string;                   // Console command pattern
  method: string;                    // JSON-RPC method name
  requiresProject: boolean;          // Whether project context is required
  paramMapping: Record<string, string>; // Parameter transformation
}
```

### JSON-RPC Protocol Integration

The console uses standard JSON-RPC 2.0 protocol, with console-specific extensions:

```typescript
// Standard JSON-RPC request, but with console session context
interface ConsoleJsonRpcRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params: {
    sessionId?: string;              // Console session identifier
    projectId?: string;              // Current project context
    [key: string]: any;              // Method-specific parameters
  };
}

// Console command execution flow:
// 1. Parse console command: "entity list todo"
// 2. Map to JSON-RPC: {"method": "loadEntityData", "params": {"entityType": "todo", "modelId": currentProjectId}}
// 3. Send to server via existing JSON-RPC endpoint
// 4. Format response for console display

// Example command mappings:
const commandMappings: CommandMapping[] = [
  {
    command: "project list",
    method: "listProjects", 
    requiresProject: false,
    paramMapping: {}
  },
  {
    command: "project use <id>",
    method: "setProjectContext",
    requiresProject: false, 
    paramMapping: {"id": "projectId"}
  },
  {
    command: "entity list [type]",
    method: "loadEntityData",
    requiresProject: true,
    paramMapping: {"type": "entityType", "projectId": "modelId"}
  },
  {
    command: "layout show [name]", 
    method: "loadPage",
    requiresProject: true,
    paramMapping: {"name": "pageName", "projectId": "modelId"}
  }
];
```

### Security Considerations

1. **Authentication**: Console sessions require valid JWT tokens
2. **Authorization**: Command execution respects user permissions
3. **Sandboxing**: JavaScript evaluation runs in isolated BoaJS context
4. **Rate Limiting**: Prevent abuse with command execution limits
5. **Audit Logging**: Log all console commands with user attribution

## Integration Points

### With Existing Components

- **TorqueDataGrid**: Console can query and display entity data via JSON-RPC
- **XFlow Editor**: Execute workflows and view results (future)
- **Model Editor**: Inspect and modify model definitions via GraphQL/JSON-RPC
- **Real-time Updates**: Console outputs update live via WebSocket

### With MCP Interface

- **AI Agent Access**: All console capabilities accessible via MCP tools
- **Programmatic Management**: AI agents can manage projects using same methods
- **Consistent API**: Single source of truth for both human and AI interfaces
- **Tool Discovery**: MCP capabilities endpoint lists all available tools

### With TorqueApp Layout System

The console operates as a global overlay and is not defined in individual page layouts. Instead, it's configured at the application level:

```json
{
  "application": {
    "name": "MyApp",
    "console": {
      "enabled": true,
      "theme": "dark",
      "prompt": "myapp> ",
      "height": "50vh",
      "toggleKey": "Ctrl+`",
      "commands": ["entity", "xflow", "model"]
    }
  }
}
```

## User Experience

### Visual Design
- **Global Overlay**: Slides down from top of screen when activated
- **Terminal Interface**: Monospace font with terminal-style appearance
- **Dark Theme**: Default dark theme with syntax highlighting for commands
- **Smooth Animation**: 300ms slide-down/up animation for show/hide
- **Semi-transparent Background**: Blurred backdrop behind console
- **Resizable Height**: Draggable bottom edge to adjust console height

### Interaction Patterns
- **Toggle Shortcut**: Ctrl + ~ to show/hide console globally
- **Context-Aware Prompt**: 
  - Global context: `torque> `
  - Project context: `torque:myproject> `
- **Standard Terminal Shortcuts**: 
  - Ctrl+C (interrupt command)
  - Ctrl+L (clear screen) 
  - Up/Down arrows (command history)
  - Tab (auto-completion based on current context)
  - Escape (close console)
- **Smart Tab Completion**:
  - Global context: completes `project`, `server`, `help` commands
  - Project context: completes `entity`, `layout`, `model`, `component` commands
  - Dynamic completion based on available resources (entity types, layout names)
- **Click Outside to Close**: Clicking outside console area hides it
- **Focus Management**: Console automatically focuses input when opened
- **Persistent Session**: Console state and project context persist across show/hide cycles

## Success Metrics

- **Adoption**: 30%+ of power users utilize console within first month
- **Performance**: Command execution <500ms for 95% of operations
- **Reliability**: <1% error rate for valid commands
- **Usability**: Average session duration >5 minutes indicates utility

## Risks and Mitigations

1. **Performance Impact**: Large output could slow browser
   - *Mitigation*: Pagination and output limits
   
2. **Security Vulnerabilities**: Code execution risks
   - *Mitigation*: Strict sandboxing and permission checks
   
3. **User Complexity**: Learning curve for non-technical users
   - *Mitigation*: Progressive disclosure and contextual help

## Future Enhancements

- **Collaborative Sessions**: Multiple users in same console session
- **Command Macros**: Save and replay command sequences  
- **Visual Output**: Rich rendering for charts and tables
- **Plugin System**: Custom commands via external modules
- **Mobile Support**: Touch-friendly console interface

## Conclusion

The Interactive Console Component will provide power users with direct access to Torque's capabilities while maintaining security and performance. By integrating with the MCP interface via axum-mcp, this feature offers a unified API surface for both human console users and AI agents.

**Key Benefits**:
- **Dual Interface**: Same capabilities accessible via console UI and MCP tools
- **AI Agent Integration**: Full project management and CRUD operations for AI agents
- **Consistent API**: Single source of truth across human and programmatic interfaces
- **Future-Proof**: Automatic MCP tool exposure for all new JSON-RPC methods

This feature differentiates Torque by offering visual, command-line, and AI agent interfaces within the same platform.

**Estimated Effort**: 5 weeks (1 developer)  
**Dependencies**: None (builds on existing JSON-RPC, WebSocket, and axum-mcp infrastructure)  
**Target Release**: Next minor version (v0.2.0)