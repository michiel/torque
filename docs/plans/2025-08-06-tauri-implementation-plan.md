# Torque Tauri Desktop Application Implementation Plan

**Date:** 2025-08-06  
**Status:** Planning Phase  
**Target:** Cross-platform desktop application using Tauri v2

## Overview

Implementation of a cross-platform desktop application for Torque using Tauri v2, leveraging the existing Rust backend and React frontends with minimal modifications. The desktop app will provide full offline functionality while maintaining feature parity with the web version.

## Core Architecture Decisions

### 1. Embedded HTTP Server Approach
- Run Torque server internally on localhost with random port
- Preserves all existing GraphQL and JSON-RPC APIs without modification
- Enables maximum code reuse between web and desktop versions
- Frontend communicates via HTTP, not Tauri IPC

### 2. Data Storage Strategy
- **Database**: SQLite for simplicity and offline capability
- **Directories**: Use `directories` crate for platform-appropriate storage locations
- **File Format**: `.torque.json` extension for model exports
- **Offline-First**: Complete local functionality, remote connectivity as future roadmap item

### 3. Frontend Integration
- Reuse existing model-editor and torque-client React applications
- Minimal changes: only dynamic endpoint detection and Tauri entry points
- Maintain web version workflow: separate windows/views for different functions

### 4. Desktop Features
- **File Associations**: `.torque.json` files open with Torque Desktop
- **Auto-Updates**: GitHub-based updater using Tauri's built-in functionality
- **Cross-Platform**: Windows, macOS, and Linux support from day one

## Technical Implementation

### Project Structure
```
src-tauri/
├── Cargo.toml           # Dependencies: directories, tokio, torque crate
├── Tauri.toml          # App config, file associations, updater
├── src/
│   ├── main.rs         # Embedded server + Tauri initialization
│   ├── storage.rs      # Cross-platform data directory management
│   └── commands.rs     # Tauri IPC commands (minimal, if needed)
└── icons/              # Cross-platform application icons

frontend/tauri/         # Tauri-specific frontend wrapper
├── src/
│   ├── main.tsx        # Dynamic localhost endpoint detection
│   └── TauriApp.tsx    # Router combining model-editor + torque-client
├── package.json        # Tauri-specific frontend dependencies
└── dist/              # Built frontend for Tauri bundling
```

### Key Dependencies
- `tauri` v2 with filesystem, updater, and window management features
- `directories` for cross-platform data storage paths
- `tokio` for async runtime (shared with main torque crate)
- Main `torque` crate as workspace dependency for server functionality

### Backend Integration Pattern
```rust
// src-tauri/src/main.rs
use directories::ProjectDirs;
use torque::server::TorqueServer;

#[tokio::main]
async fn main() {
    // Determine platform-specific data directory
    let data_dir = ProjectDirs::from("com", "torque", "torque-desktop")
        .unwrap()
        .data_dir();
    
    // Initialize embedded Torque server
    let server = TorqueServer::new()
        .database_url(&format!("sqlite://{}/torque.db", data_dir.display()))
        .bind("127.0.0.1:0")  // Random port for isolation
        .build()
        .await;
    
    // Start Tauri with server port information
    tauri::Builder::default()
        .setup(move |app| {
            // Pass server port to frontend
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Frontend Adaptation Strategy
- Create thin wrapper in `frontend/tauri/` that detects embedded server port
- Modify existing GraphQL and JSON-RPC clients to use dynamic endpoints
- Bundle both model-editor and torque-client as different routes/views
- Minimal UI changes: only window controls and desktop-specific styling if needed

### Configuration Examples

#### File Associations (Tauri.toml)
```toml
[app.fileAssociations]
[[app.fileAssociations.associations]]
ext = ["torque.json"]
description = "Torque Model File"
role = "Editor"
```

#### Auto-Updater (Tauri.toml)
```toml
[updater]
active = true
endpoints = ["https://github.com/your-org/torque/releases/latest/download/{{target}}.{{archive-format}}"]
dialog = true
pubkey = "your-public-key-here"
```

## Implementation Phases

### Phase 1: Foundation (Week 1)
- Initialize Tauri v2 project structure
- Configure workspace dependencies with main torque crate
- Set up embedded HTTP server integration
- Create basic Tauri.toml configuration

**Deliverables:**
- Working Tauri app that starts embedded Torque server
- Basic window opens with localhost connection
- Cross-platform build configuration

### Phase 2: Frontend Integration (Week 2)
- Create Tauri-specific frontend entry points
- Implement dynamic endpoint detection for embedded server
- Bundle existing model-editor and torque-client applications
- Set up platform-specific data directories with `directories` crate

**Deliverables:**
- Model editor accessible in desktop app
- TorqueApp preview functionality working
- SQLite database storage in platform-appropriate locations

### Phase 3: Desktop Features (Week 3)
- Configure file associations for `.torque.json` files
- Implement auto-updater with GitHub releases
- Add desktop-specific UI enhancements (if needed)
- Test offline functionality thoroughly

**Deliverables:**
- File association working on all platforms
- Auto-updater configured and tested
- Full offline model creation and editing

### Phase 4: Polish & Packaging (Week 4)
- Cross-platform testing and bug fixes
- Configure signing and notarization for distribution
- Create packaging scripts and CI/CD integration
- Documentation and user guides

**Deliverables:**
- Signed, distributable packages for Windows, macOS, Linux
- CI/CD pipeline for automated builds and releases
- User documentation for installation and usage

## Benefits of This Approach

### Code Reuse Maximization
- 90%+ of existing Rust backend code unchanged
- React frontends require minimal modifications
- API contracts remain identical between web and desktop
- Development workflow stays consistent

### Platform Integration
- Native file associations for seamless workflow
- Platform-appropriate data storage locations
- Auto-updater for easy maintenance and feature delivery
- Desktop-class performance with embedded server

### Future Extensibility
- Architecture supports adding remote connectivity later
- Can easily add desktop-specific features (system tray, notifications)
- Maintains compatibility with web version for hybrid deployments
- Plugin architecture can be extended for desktop-specific integrations

## Risk Mitigation

### Technical Risks
- **Server Port Conflicts**: Use random port assignment and conflict detection
- **Data Migration**: Implement database migration strategy from web to desktop
- **Platform Differences**: Extensive testing on all target platforms
- **Bundle Size**: Optimize Rust binary and frontend assets for distribution

### User Experience Risks
- **Migration Path**: Provide import/export tools for existing web users
- **Performance**: Ensure embedded server doesn't impact desktop responsiveness
- **Updates**: Graceful handling of database schema changes during updates
- **Offline Limitations**: Clear communication about offline-only initial release

## Success Metrics

### Technical Metrics
- Application startup time < 3 seconds
- Memory usage < 200MB at idle
- Bundle size < 100MB for distribution
- Cross-platform compatibility score: 100%

### User Experience Metrics
- Feature parity with web version: 100%
- File association success rate: >95%
- Auto-update success rate: >98%
- User migration from web to desktop: >50% for active users

## Future Roadmap Items

### Planned Enhancements (Post-MVP)
1. **Remote Connectivity**: Connect to remote Torque instances
2. **Multi-Instance**: Support multiple local projects simultaneously
3. **System Integration**: System tray, notifications, global shortcuts
4. **Collaboration**: Real-time collaboration features for desktop users
5. **Plugin System**: Desktop-specific plugins and extensions

### Platform-Specific Features
- **Windows**: Jump lists, progress indicators, thumbnail toolbars
- **macOS**: Touch Bar integration, native menus, document-based architecture
- **Linux**: Desktop environment integration, package manager compatibility

This implementation plan provides a clear path to a fully-featured desktop application while maximizing code reuse and maintaining architectural consistency with the existing Torque platform.

## Implementation Status Update

**Last Updated**: 2025-08-06  
**Current Phase**: Phase 3 Planning (50% complete)
**Latest Achievement**: Phase 2 Complete - Real Server Integration ✅

### ✅ **COMPLETED PHASES**

#### Phase 1: Foundation (Week 1) - **✅ COMPLETED**
- ✅ Tauri v2 project structure with cross-platform configuration
- ✅ Workspace dependencies integrating main torque crate  
- ✅ Cross-platform data storage using directories crate
- ✅ Basic app icons and desktop application metadata
- ✅ Successful compilation and initial packaging (.deb, .rpm)

#### Phase 2: Real Server Integration (Week 2) - **✅ COMPLETED** 
- ✅ Embedded HTTP server with actual `torque::server::start_server()`
- ✅ Full ServiceRegistry, database setup, and configuration system
- ✅ SQLite database in platform-appropriate directories (`~/.local/share/torque-desktop/`)
- ✅ Tauri commands for dynamic port communication between Rust and React
- ✅ Frontend polling with health check validation and 30s timeout
- ✅ Complete development workflow: `cargo tauri dev` functional
- ✅ All existing APIs preserved: GraphQL, JSON-RPC, WebSocket

### 🔄 **REMAINING PHASES**

#### Phase 3: Desktop Features (Week 3) - **🟡 PLANNED**
- File associations for `.torque.json` files with double-click opening
- Auto-updater with GitHub releases integration and signing
- Desktop-specific UI enhancements and native menu integration
- Production-ready error handling and crash reporting

#### Phase 4: Production & Distribution (Week 4) - **🟡 PLANNED**
- Fix AppImage bundling (currently fails during build process)
- Cross-platform testing and packaging optimization  
- CI/CD automation with GitHub Actions for all platforms
- Code signing, notarization, and secure distribution setup

### Key Achievements
- **Real Torque Server**: Fully functional embedded server with complete API surface
- **Cross-Platform Storage**: Platform-appropriate SQLite database locations
- **Development Ready**: `./scripts/dev-tauri.sh` provides streamlined development workflow
- **Production Foundation**: Ready for file handling and desktop integration features

The desktop application foundation is solid and ready for Phase 3 implementation!