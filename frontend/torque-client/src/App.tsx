import { Routes, Route } from 'react-router-dom'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { ModalsProvider } from '@mantine/modals'
import { Home } from './pages/Home'
import { TorqueApp } from './pages/TorqueApp'

import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import '@mantine/dates/styles.css'

function App() {
  return (
    <MantineProvider>
      <ModalsProvider>
        <Notifications />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/app/:modelId" element={<TorqueApp />} />
          <Route path="/app/:modelId/:pageName" element={<TorqueApp />} />
        </Routes>
      </ModalsProvider>
    </MantineProvider>
  )
}

export default App
