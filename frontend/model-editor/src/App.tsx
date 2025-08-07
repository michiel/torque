import { Routes, Route } from 'react-router-dom'
import { AppShell } from '@mantine/core'

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

function App() {
  return (
    <AppShell
      header={{ height: { base: 50 } }}
      padding={0}
    >
      <AppShell.Header>
        <Header />
      </AppShell.Header>

      <AppShell.Main>
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
          <Route path="/debug-layout" element={<DebugLayoutPage />} />
        </Routes>
        <ServerStatus />
      </AppShell.Main>
    </AppShell>
  )
}

export default App