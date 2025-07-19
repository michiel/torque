# Overview

 - Torque is a platform for designing, running and presenting applications, primarily targeting the Web for humans and MCP APIs for AI agents.
 - Torque is written in Rust, using database backends for developing the Torque Model and running a Torque Application (Model instance)
     - A Torque Application can be referred to as a TorqueApp
 - Torque is fully asynchronous, using the tokio runtime, axum, tower
 - Torque is cross-platform and compiles for Linux, MacOS and Windows
 - Torque uses GraphQL for Web Frontend editing a Torque Model
 - Torque uses JSON-RPC for the dynamically generated Web Frontend running a Torque Application (of a Model instance)
     - The JSON-RPC protocol and TorqueApp content are client agnostic and can be used for creating other TorqueApp clients other than a React one
 - The Torque Web Frontend for editing a Torque Model and the TorqueApp frontend that is dynamically generated are two separate web applications
 - The Torque Model describes the Torque Application data model, user interface, integrations and other application elements
    - The Torque Model can be imported and exported as JSON and conforms to a JSON-Schema
    - A Torque Model can describe a workflow (or 'wizard') that guides a TorqueApp user through a set of questions and answers with validation
    - A Torque Model can describe a data entry or administrative interface for e.g. a set of data entities described or mapped in the Torque Model
 - The Torque Application is initially a Web Frontend developed in React
    - This React instance has components (example: forms, data grids) that are dynamically instantiated based on instructions and configuration received from the Torque Application server via JSON-RPC
    - A Torque Application supports i18n and l10n by default, and is fully accessible following ARIA guidelines
 - The Torque Model and a corresponding TorqueApp can be in one-way sync from Torque Model->Torque Application, for example a change to a specific datagrid defined in a TorqueModel will trigger an update of the view in the corresponding TorqueApp if a user is using it
 - Torque is fully self-contained in a single binary `torque`
    - The `torque` binary by default contains all functionality
 - The TorqueApp Data Model has lifecycle hooks for all entities (example: onCreate, onPersist, onChange, onDelete), that are triggered at the appropriate point in their lifecycle
 - The TorqueApp Data Model is a schema managed through sea-orm, that uses an 'AppEntities' table with entity metadata and a JSON blob for the Entity defined in the Torque Model
    - example: `model: $ModelUUID, entity: 'Post', id: $UUID,  json: { "name": "Joe Blow", phone: "123123123" }`
    - AppPreview operations are against this AppEntity table, scope by modelUUID
    - the AppEntity table contains multiple entity types. these can reference each other. referential integrity is maintained by Torque
    - The AppEntity table is for managing instances of Entities, not for Torque Model definition
 - Changes made to the data model of a TorqueApp are non-destructive, the human or AI agent can make changes without disrupting running instances and connected users
 - Supported databases are sqlite and postgres through sea-orm
 - Torque has a built-in, editable workflow system based on DAGs called 'xflows' that can contain discrete blocks of Javascript for logic and transformation
    - BoaJS is the embedded javascript engine. It explicitly does not support npm packages
    - XFlows can be attached to Entity lifecycle events
    - XFlows can be attached to user-defined webhooks
    - XFlows can be invoked directly
    - XFlows can invoke other XFlows
    - XFlows can invoke a HTTP-Fetch function exposed in the BoaJS context
    - All xflows have inputs, outputs and error states, all of which are types and can be represented and validated using JSON-Schema
    - XFlows are lightweight and execute quickly, speed is the priority
 - Logic and transformations are handled by workflows (DAG) that contain start, end, error nodes and connecting logic
    - DAGs have a visual editor as well as a JSON editor
 - For MCP APIs this project will use `axum-mcp` https://github.com/michiel/axum-mcp and make changes and updates to this library where necessary
 - For view on the frontend in the TorqueApp, the JSON-RPC interface sends a JSON layout with components embedded. Navigating to a new page will invoke a new JSON-RPC call for the new layout.
    - Add examples of the layout JSON to scenarios
 - Use mermaid diagrams to outline the interactions between user, model editor, database, torqueapp and app user
 - TorqueApp components are individually available for development and testing in storybook for React

## Visual Layout Editor

 - The Model Editor includes a comprehensive visual layout editor for designing TorqueApp interfaces
 - The layout editor supports drag-and-drop component placement with real-time preview
 - Components can be configured inline without switching views, including:
    - DataGrid configuration with column selection, filtering, sorting, and pagination
    - Form editor with field binding, validation rules, and layout options
    - Button actions with modal triggers, navigation, and entity operations
    - Text components with typography and styling options
    - Container components with responsive grid layouts
 - The layout editor validates component configurations against entity schemas
 - Layout definitions are stored as JSON with full schema validation
 - The component system is extensible through a plugin architecture for runtime component registration
 - All layout components have corresponding Storybook stories for development and testing

## Data Management and Import/Export

 - Complete model data can be exported as JSON including entities, relationships, flows, layouts, and sample data
 - JSON model exports conform to the comprehensive Torque Model JSON Schema
 - Data import supports validation, conflict resolution, and incremental updates
 - Bulk entity data import/export through CSV and JSON formats
 - Model templates and examples can be shared and imported
 - Data export includes entity instances with referential integrity preservation
 - Import/export operations support versioning and migration paths


# Scenarios

## My first application (TODO list)

- UserA opens a Web Browser, connected to the Torque Model Editor
- UserA creates a new project (TorqueApp) called 'TODO List'
- UserA creates a Todo Entity, adds properties status:enum(open|closed), label:string
- UserA creates a Form for creating and editing Todo entity instances
- UserA adds a Start page to the TODO List TorqueApp
- UserA adds a Button to popup the Todo edit form to create a new Todo entity, edit its properties in the Form and save it
- UserA adds a DataGrid to the Start page and connects it to the Todo Entity
- UserA then clicks on 'Run TorqueApp' to start the Todo list app, this opens a new browser window that loads the dynamic react client for the TorqueApp. The client connects to Torque via JSON-RPC, loads the Start page, instantiates the DataGrid, and the instantiated DataGrid for Todo items loads the Todo data








