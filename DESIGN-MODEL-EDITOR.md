# Layout

## Global layout

- The model-editor has a top horizontal panel that contains the logo, setting, profile, home navigation items. It is 100% of the viewport width. It has a small breadcumb trail on the bottom of the top panel
- The model-editor has a main panel which is 100% of the width and all the remaining height after the top panel. The default (home) view is a dashboard with top level application navigation items (create new model, list models)


## Global navigation rules

 - Popups are used for blocking decisions (yes/no decision, etc) or for editing sub components of an item open in the main viewport
    - Example : In the model editor, creating or editing an Entity should use the main layout panel
 - Tabs must be navigable - reloading the page should have the same open tab, and they they must be linkable


