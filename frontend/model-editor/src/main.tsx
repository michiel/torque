import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MantineProvider, ColorSchemeScript } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { ModalsProvider } from '@mantine/modals'

import { theme } from './theme'
import { TorqueConfigProvider } from './providers/TorqueConfigProvider'
import { WebSocketProvider } from './providers/WebSocketProvider'
import { DarkModeProvider } from './providers/DarkModeProvider'
import { ConsoleProvider } from './components/Console'
import App from './App'

import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import './styles/global.css'
import './styles/dark-mode.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <MantineProvider theme={theme}>
      <DarkModeProvider>
        <TorqueConfigProvider>
          <ModalsProvider>
            <Notifications />
            <WebSocketProvider>
              <ConsoleProvider theme="dark" height="45vh" enabled={true}>
                <App />
              </ConsoleProvider>
            </WebSocketProvider>
          </ModalsProvider>
        </TorqueConfigProvider>
      </DarkModeProvider>
    </MantineProvider>
  </BrowserRouter>,
)