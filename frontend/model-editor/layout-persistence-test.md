# Layout Persistence Test

## Issue Fixed
Layout changes were not persisting when editing a layout, saving, navigating away, and reopening the same layout.

## Root Cause
Apollo Client cache was not being invalidated after layout saves because the `UPDATE_LAYOUT` and `CREATE_LAYOUT` mutations were missing `refetchQueries` configuration.

## Fix Applied
1. Added `refetchQueries` to both layout mutations to invalidate relevant cache entries
2. Enhanced WebSocket event handling for layout changes
3. Added proper error handling and debugging

## Test Steps
To verify the fix works:

1. **Start Development Server**
   ```bash
   cd /home/michiel/dev/torque
   ./scripts/dev.sh
   ```

2. **Open Model Editor**
   - Navigate to http://localhost:3000
   - Open an existing model or create a new one

3. **Edit a Layout**
   - Go to a layout in the layout editor
   - Make visible changes (add/remove/modify components)
   - Save the layout (should see "Layout Updated" notification)

4. **Navigate Away and Back**
   - Navigate to another page (entities, model details, etc.)
   - Return to the same layout in the layout editor

5. **Verify Persistence**
   - Changes should still be visible in the layout editor
   - Layout should load with all previously saved modifications

## Expected Behavior
- ✅ Layout changes persist across navigation
- ✅ "Layout updated successfully - cache invalidated" appears in console
- ✅ Fresh data loaded when reopening layout
- ✅ No stale cached data served

## Debug Console Messages
Watch for these console messages:
- `Layout updated successfully - cache invalidated` (on save)
- `Layout change detected, invalidating relevant caches` (on WebSocket events)
- `Handling WebSocket event: { type: "LayoutUpdated", ... }` (real-time sync)

## Technical Notes
The fix follows the same pattern used by all other successful mutations in the codebase:
- Entities: `refetchQueries: [{ query: GET_MODEL, variables: { id: modelId } }]`
- Relationships: `refetchQueries: [{ query: GET_MODEL, variables: { id: modelId } }]`
- Layouts: `refetchQueries: [{ query: GET_MODEL, variables: { id: modelId } }, { query: GET_LAYOUT, variables: { id: layoutId } }]`