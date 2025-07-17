import { Routes, Route } from 'react-router-dom'
import { AppShell } from '@mantine/core'

import { Header } from './components/Header'
import { HomePage } from './pages/HomePage'
import { ModelsPage } from './pages/ModelsPage'
import { ModelEditorPage } from './pages/ModelEditorPage'
import { CreateModelPage } from './pages/CreateModelPage'
import { LayoutEditorPage } from './pages/LayoutEditorPage'
import { EntityEditorPage } from './pages/EntityEditorPage'

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
          <Route path="/models/:modelId/entities/new" element={<EntityEditorPage />} />
          <Route path="/models/:modelId/entities/:entityId" element={<EntityEditorPage />} />
          <Route path="/models/:modelId/layouts/new" element={<LayoutEditorPage />} />
          <Route path="/models/:modelId/layouts/:layoutId" element={<LayoutEditorPage />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  )
}

export default App