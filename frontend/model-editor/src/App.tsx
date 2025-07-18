import { Routes, Route } from 'react-router-dom'
import { AppShell } from '@mantine/core'

import { Header } from './components/Header'
import { HomePage } from './pages/HomePage'
import { ModelsPage } from './pages/ModelsPage'
import { ModelEditorPage } from './pages/ModelEditorPage'
import { ModelDetailsPage } from './pages/ModelDetailsPage'
import { CreateModelPage } from './pages/CreateModelPage'
import { LayoutEditorPage } from './pages/LayoutEditorPage'
import { EntityEditorPage } from './pages/EntityEditorPage'
import { RelationshipEditorPage } from './pages/RelationshipEditorPage'
import { ERDEditorPage } from './pages/ERDEditorPage'

function App() {
  return (
    <AppShell
      header={{ height: { base: 100 } }}
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
          <Route path="/models/:id" element={<ModelEditorPage />} />
          <Route path="/models/:modelId/details" element={<ModelDetailsPage />} />
          <Route path="/models/:modelId/entities/new" element={<EntityEditorPage />} />
          <Route path="/models/:modelId/entities/:entityId" element={<EntityEditorPage />} />
          <Route path="/models/:modelId/relationships/new" element={<RelationshipEditorPage />} />
          <Route path="/models/:modelId/relationships/:relationshipId" element={<RelationshipEditorPage />} />
          <Route path="/models/:modelId/layouts/new" element={<LayoutEditorPage />} />
          <Route path="/models/:modelId/layouts/:layoutId" element={<LayoutEditorPage />} />
          <Route path="/models/:modelId/erd" element={<ERDEditorPage />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  )
}

export default App