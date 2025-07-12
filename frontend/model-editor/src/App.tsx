import { Routes, Route } from 'react-router-dom'
import { AppShell } from '@mantine/core'

import { Navigation } from './components/Navigation'
import { ModelsPage } from './pages/ModelsPage'
import { ModelEditorPage } from './pages/ModelEditorPage'
import { CreateModelPage } from './pages/CreateModelPage'
import { LayoutEditorPage } from './pages/LayoutEditorPage'

function App() {
  return (
    <AppShell
      navbar={{ width: 300, breakpoint: 'sm' }}
      padding="md"
    >
      <AppShell.Navbar>
        <Navigation />
      </AppShell.Navbar>

      <AppShell.Main>
        <Routes>
          <Route path="/" element={<ModelsPage />} />
          <Route path="/models" element={<ModelsPage />} />
          <Route path="/models/new" element={<CreateModelPage />} />
          <Route path="/models/:id" element={<ModelEditorPage />} />
          <Route path="/models/:modelId/layouts/new" element={<LayoutEditorPage />} />
          <Route path="/models/:modelId/layouts/:layoutId" element={<LayoutEditorPage />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  )
}

export default App