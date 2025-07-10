import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ApolloProvider } from '@apollo/client'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { ModalsProvider } from '@mantine/modals'

import { apolloClient } from './graphql/client'
import { theme } from './theme'
import { WebSocketProvider } from './providers/WebSocketProvider'
import App from './App'

import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <ApolloProvider client={apolloClient}>
      <MantineProvider theme={theme}>
        <ModalsProvider>
          <Notifications />
          <WebSocketProvider>
            <App />
          </WebSocketProvider>
        </ModalsProvider>
      </MantineProvider>
    </ApolloProvider>
  </BrowserRouter>,
)