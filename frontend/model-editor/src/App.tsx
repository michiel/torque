import { Routes, Route } from 'react-router-dom'
import { AppShell } from '@mantine/core'
import { useEffect } from 'react'

import { Header } from './components/Header'
import { ServerStatus } from './components/ServerStatus'
import { HomePage } from './pages/HomePage'
import { ModelsPage } from './pages/ModelsPage'
import { ModelOverviewPage } from './pages/ModelOverviewPage'
import { ModelEditorPage } from './pages/ModelEditorPage'
import { AppPreviewerPage } from './pages/AppPreviewerPage'
import { ModelDetailsPage } from './pages/ModelDetailsPage'
import { CreateModelPage } from './pages/CreateModelPage'
import { LayoutEditorPage } from './pages/LayoutEditorPage'
import { EntityEditorPage } from './pages/EntityEditorPage'
import { RelationshipEditorPage } from './pages/RelationshipEditorPage'
import { ERDEditorPage } from './pages/ERDEditorPage'
import { DebugLayoutPage } from './pages/DebugLayoutPage'
import { ModelVerificationPage } from './pages/ModelVerificationPage'

function App() {
  useEffect(() => {
    // Debug Tauri API availability
    console.log('🧪 [App] Testing Tauri API availability...');
    console.log('🧪 [App] window.__TAURI__ exists:', typeof window !== 'undefined' && '__TAURI__' in window);
    console.log('🧪 [App] window.__TAURI__ value:', (window as any).__TAURI__);
    console.log('🧪 [App] NODE_ENV:', process.env.NODE_ENV);
    console.log('🧪 [App] VITE_TAURI_DEV:', process.env.VITE_TAURI_DEV);
    
    // Try to call Tauri API if available
    if (typeof window !== 'undefined' && '__TAURI__' in window) {
      const tauri = (window as any).__TAURI__;
      console.log('🧪 [App] Tauri API object:', tauri);
      
      // Test the test command
      try {
        console.log('🧪 [App] Calling test_tauri_api...');
        tauri.core.invoke('test_tauri_api')
          .then((result: string) => {
            console.log('✅ [App] test_tauri_api success:', result);
          })
          .catch((error: any) => {
            console.error('❌ [App] test_tauri_api failed:', error);
          });
      } catch (error) {
        console.error('❌ [App] Error calling test_tauri_api:', error);
      }
      
      // Test the port command
      try {
        console.log('🧪 [App] Calling get_server_port...');
        tauri.core.invoke('get_server_port')
          .then((result: any) => {
            console.log('✅ [App] get_server_port success:', result);
          })
          .catch((error: any) => {
            console.error('❌ [App] get_server_port failed:', error);
          });
      } catch (error) {
        console.error('❌ [App] Error calling get_server_port:', error);
      }
    } else {
      console.log('❌ [App] Tauri API not available - frontend not running in Tauri context');
    }
  }, []);

  return (
    <AppShell
      header={{ height: { base: 50 } }}
      padding={0}
      style={{ height: '100vh', overflow: 'hidden' }}
    >
      <AppShell.Header>
        <Header />
      </AppShell.Header>

      <AppShell.Main style={{ height: 'calc(100vh - 50px)', overflow: 'auto' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/models" element={<ModelsPage />} />
          <Route path="/models/new" element={<CreateModelPage />} />
          <Route path="/models/:id" element={<ModelOverviewPage />} />
          <Route path="/models/:id/editor" element={<ModelEditorPage />} />
          <Route path="/models/:id/previewer" element={<AppPreviewerPage />} />
          <Route path="/models/:id/editor/details" element={<ModelDetailsPage />} />
          <Route path="/models/:id/editor/entities/new" element={<EntityEditorPage />} />
          <Route path="/models/:id/editor/entities/:entityId" element={<EntityEditorPage />} />
          <Route path="/models/:id/editor/relationships/new" element={<RelationshipEditorPage />} />
          <Route path="/models/:id/editor/relationships/:relationshipId" element={<RelationshipEditorPage />} />
          <Route path="/models/:id/editor/layouts/new" element={<LayoutEditorPage />} />
          <Route path="/models/:id/editor/layouts/:layoutId" element={<LayoutEditorPage />} />
          <Route path="/models/:id/editor/erd" element={<ERDEditorPage />} />
          <Route path="/models/:id/verification" element={<ModelVerificationPage />} />
          <Route path="/debug-layout" element={<DebugLayoutPage />} />
        </Routes>
        <ServerStatus />
      </AppShell.Main>
    </AppShell>
  )
}

export default App