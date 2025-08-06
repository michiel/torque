import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { invoke } from '@tauri-apps/api/core'

// Import existing frontend components (will need to be adapted)
// import ModelEditor from '../model-editor/src/App'
// import TorqueApp from '../torque-client/src/App'

interface ServerInfo {
  port?: number;
  status: 'starting' | 'running' | 'error';
  error?: string;
}

function App() {
  const [serverInfo, setServerInfo] = useState<ServerInfo>({ status: 'starting' });

  useEffect(() => {
    // Detect embedded server port
    detectServerPort();
  }, []);

  const detectServerPort = async () => {
    try {
      // Get port from Tauri backend with polling
      let port: number | null = null;
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds max wait time

      while (!port && attempts < maxAttempts) {
        try {
          port = await invoke<number | null>('get_server_port');
          if (port) {
            break;
          }
        } catch (error) {
          console.log('Waiting for server port...', error);
        }
        
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      }

      if (!port) {
        throw new Error('Server failed to start within timeout period');
      }
      
      // Test if server is accessible
      const response = await fetch(`http://127.0.0.1:${port}/health`);
      if (response.ok) {
        setServerInfo({ port, status: 'running' });
      } else {
        throw new Error('Server not responding to health check');
      }
    } catch (error) {
      console.error('Failed to detect server:', error);
      setServerInfo({ 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  if (serverInfo.status === 'starting') {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100vh',
        flexDirection: 'column'
      }}>
        <h2>Starting Torque Desktop...</h2>
        <p>Initializing embedded server...</p>
      </div>
    );
  }

  if (serverInfo.status === 'error') {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100vh',
        flexDirection: 'column',
        color: 'red'
      }}>
        <h2>Server Error</h2>
        <p>{serverInfo.error}</p>
        <button onClick={detectServerPort}>Retry</button>
      </div>
    );
  }

  return (
    <Router>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <nav style={{ 
          padding: '1rem', 
          borderBottom: '1px solid #ddd',
          backgroundColor: 'white',
          display: 'flex',
          gap: '1rem'
        }}>
          <a href="/model-editor" style={{ textDecoration: 'none', color: '#007acc' }}>
            Model Editor
          </a>
          <a href="/app" style={{ textDecoration: 'none', color: '#007acc' }}>
            TorqueApp Preview
          </a>
          <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#666' }}>
            Server: 127.0.0.1:{serverInfo.port}
          </span>
        </nav>
        
        <div style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Navigate to="/model-editor" replace />} />
            <Route path="/model-editor" element={<ModelEditorFrame serverPort={serverInfo.port} />} />
            <Route path="/app/*" element={<TorqueAppFrame serverPort={serverInfo.port} />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

function ModelEditorFrame({ serverPort }: { serverPort?: number }) {
  const modelEditorUrl = `http://127.0.0.1:${serverPort || 8080}/model-editor`;
  
  return (
    <iframe
      src={modelEditorUrl}
      style={{
        width: '100%',
        height: '100%',
        border: 'none'
      }}
      title="Torque Model Editor"
    />
  );
}

function TorqueAppFrame({ serverPort }: { serverPort?: number }) {
  const torqueAppUrl = `http://127.0.0.1:${serverPort || 8080}/app`;
  
  return (
    <iframe
      src={torqueAppUrl}
      style={{
        width: '100%',
        height: '100%',
        border: 'none'
      }}
      title="TorqueApp Preview"
    />
  );
}

export default App