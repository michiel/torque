# Layout

## Global layout

- The model-editor has a top horizontal panel that contains the logo, setting, profile, home navigation items. It is 100% of the viewport width. It has a small breadcumb trail on the bottom of the top panel
- The model-editor has a main panel which is 100% of the width and all the remaining height after the top panel. The default (home) view is a dashboard with top level application navigation items (create new model, list models)


## Global navigation rules

 - Popups are used for blocking decisions (yes/no decision, etc) or for editing sub components of an item open in the main viewport
    - Example : In the model editor, creating or editing an Entity should use the main layout panel
 - Tabs must be navigable - reloading the page should have the same open tab, and they they must be linkable

## Visual Layout editor

 - The visual layout editor allows the user to visually place and size torque app elements on a layout
 - The library for implementing the visual editor is pickeditor.com, with open source code at https://github.com/puckeditor/puck
 - The format for storing layouts should be independent of puckeditor, and transformations to and from puckeditor format should be made as part of the puckeditor component management.
 - The Torque Model layout json should not have direct references to puckeditor and should be editable by other components later

## Visual ERD editor

 - The model page has a button "Edit ERD" that goes to a new page for editing Entities and Relationships
 - The ERD editor uses https://github.com/xyflow/xyflow as the diagram editor
 - Nodes and edges have a drag icon for dragging and a tool icon for triggering an edit action
 - The diagram editor shows nodes (Entities) with their name and attributes. Nodes have a tool icon. Clicking on the node tool icon opens a popup with the Entity editor.
 - The diagram editor shows edges (Relationships) with their name and relationship type in shorthand text (e.g. one-to-many is '1:n'). Edges have a tool icon. Clicking on the edge tool icon opens a popup with the Relationship editor.
 - Nodes and edges are selectable, with shift held down for multi-select and de-select from group
 - Changes made in popups are saved as normal and the diagram is updated
 - The styling of the diagram editor is consistent with the application styling
 - As with the layout editor, a top bar has 'save' and 'back' buttons that operate the same way
 - The ERD editor has a collapsable actions menu overlay on the diagram. 
 - The collapsable actions menu has a section for selections that is contextual and depending on the selection it will have a delete selection option to click, which will remove the selected nodes and edges
 - The collapsable actions menu has a section for actions that include "Add Entity". Move the functionality that is currentin in the top bar next to the save button to this menu item and remove the top button.

## Navigation structure

### Model view

For a model, the url is /models/:id. This should give an overview of the selected model and navigation options for "Model editor" and "App previewer"

#### Model editor

Model editor has the current model editor structure with "Edit ERD", "Edit Details", "Import" and a dropdown with other functions. Below this the tabs for "Entities", "Relationships", "Layouts", "Flows"

#### App previewer

The model has a corresponding app database, which will contain ERD defined entities related to the model.

The app previewer has options to

 - View the contents of the app database
 - Empty the app database
 - Seed the app database with randomly generated data based on ERD attributes. This is a Torque function in Rust and uses https://docs.rs/fake/latest/fake/ . the frontend does not generate this data
 - Open the torque app for the model in the main panel


