# Start Layout Implementation

## Overview
Implemented the ability for TorqueApp to load the start layout first when opening a model, as configured in the Model Details page.

## Changes Made

### Backend (torque/src/jsonrpc/handlers.rs)
1. **Updated loadPage handler** to:
   - Check if a specific page name is provided
   - If no page name: Load the start page layout from model config (`startPageLayoutId`)
   - If page name provided: Find layout by name
   - Fallback: Use the first layout if no match found
   - Return empty layout if no layouts defined

2. **Layout loading logic**:
   ```rust
   // Determine which layout to load
   let layout_id = if let Some(page_name) = page_name {
       // Find layout by name
       model.layouts.iter()
           .find(|l| l.name.to_lowercase() == page_name.to_lowercase())
           .map(|l| l.id.clone())
   } else {
       // Use start page layout from config
       model.config.custom.get("startPageLayoutId")
           .and_then(|v| v.as_str())
           .and_then(|id| Uuid::parse(id).ok())
   };
   ```

### Frontend Updates

1. **TorqueApp.tsx**:
   - Removed default 'main' page name
   - Now passes undefined when no specific page requested
   - This triggers the backend to use start page layout

2. **PageRenderer.tsx**:
   - Removed default parameter for pageName
   - Properly handles undefined page name

3. **DataGrid.tsx**:
   - Enhanced to use columns from API response if not provided as props
   - Added `displayColumns` computed property
   - Fallback to API-provided columns for dynamic layouts

4. **Type Updates**:
   - Added `columns?: DataGridColumn[]` to LoadEntityDataResponse
   - Ensures proper type safety for dynamic column loading

## How It Works

1. When a user opens `/app/:modelId` without a page name:
   - Frontend sends loadPage request with no pageName
   - Backend checks model config for `startPageLayoutId`
   - Returns the configured start page layout

2. When a user opens `/app/:modelId/:pageName`:
   - Frontend sends loadPage request with specific pageName
   - Backend finds layout by name (case-insensitive)
   - Returns the matching layout

3. Fallback behavior:
   - If no start page configured and no page name: First layout
   - If page name not found: First layout
   - If no layouts: Empty grid layout

## Testing
1. Create a model with multiple layouts
2. Set a start page layout in Model Details
3. Navigate to `/app/{modelId}` - should load start layout
4. Navigate to `/app/{modelId}/specific-page` - should load that page