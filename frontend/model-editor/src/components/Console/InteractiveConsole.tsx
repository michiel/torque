import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Box, Paper } from '@mantine/core';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebglAddon } from '@xterm/addon-webgl';
import '@xterm/xterm/css/xterm.css';

export interface ConsoleSession {
  sessionId: string;
  projectId?: string;
  projectName?: string;
  capabilities: string[];
}

export interface ConsoleProps {
  visible: boolean;
  onToggle: (visible: boolean) => void;
  serverUrl?: string;
  height?: string;
  theme?: 'dark' | 'light';
  animationSpeed?: number;
}

export interface ConsoleCommand {
  command: string;
  timestamp: Date;
  success?: boolean;
  output?: string;
}

const InteractiveConsole: React.FC<ConsoleProps> = ({
  visible,
  onToggle,
  serverUrl = '/rpc',
  height = '40vh',
  theme = 'dark',
  animationSpeed = 300,
}) => {
  const [session, setSession] = useState<ConsoleSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<ConsoleCommand[]>([]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminal = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);
  
  // Terminal theme configuration
  const terminalTheme = useMemo(() => ({
    dark: {
      background: '#1e1e1e',
      foreground: '#d4d4d4',
      cursor: '#ffffff',
      cursorAccent: '#000000',
      selection: '#ffffff40',
      black: '#000000',
      red: '#f44747',
      green: '#4ec9b0',
      yellow: '#ffcc02',
      blue: '#569cd6',
      magenta: '#c678dd',
      cyan: '#4ec9b0',
      white: '#d4d4d4',
    },
    light: {
      background: '#ffffff',
      foreground: '#333333',
      cursor: '#000000',
      cursorAccent: '#ffffff',
      selection: '#add6ff80',
      black: '#000000',
      red: '#cd3131',
      green: '#00bc00',
      yellow: '#949800',
      blue: '#0451a5',
      magenta: '#bc05bc',
      cyan: '#0598bc',
      white: '#555555',
    }
  }), []);

  // Initialize console session
  const initializeSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(serverUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'createConsoleSession',
          params: {}
        })
      });
      
      const data = await response.json();
      if (data.result) {
        setSession({
          sessionId: data.result.sessionId,
          projectId: data.result.context?.projectId,
          projectName: data.result.context?.projectName,
          capabilities: data.result.capabilities || []
        });
      }
    } catch (error) {
      console.error('Failed to initialize console session:', error);
    } finally {
      setIsLoading(false);
    }
  }, [serverUrl]);

  // Execute console command
  const executeCommand = useCallback(async (command: string) => {
    if (!session) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(serverUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'executeConsoleCommand',
          params: {
            sessionId: session.sessionId,
            command: command.trim()
          }
        })
      });
      
      const data = await response.json();
      const result = data.result || data.error;
      
      // Add to command history
      const commandRecord: ConsoleCommand = {
        command: command.trim(),
        timestamp: new Date(),
        success: result?.success ?? false,
        output: result?.output || result?.message || 'No response'
      };
      
      setHistory(prev => [...prev, commandRecord]);
      
      // Handle special actions
      if (result?.action === 'clear') {
        terminal.current?.clear();
      } else if (result?.action === 'exit') {
        onToggle(false);
      } else if (result?.data?.projectId) {
        // Update session with new project context
        setSession(prev => prev ? {
          ...prev,
          projectId: result.data.projectId,
          projectName: result.data.projectName
        } : null);
      }
      
      return result;
    } catch (error) {
      console.error('Failed to execute command:', error);
      const errorRecord: ConsoleCommand = {
        command: command.trim(),
        timestamp: new Date(),
        success: false,
        output: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
      setHistory(prev => [...prev, errorRecord]);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [session, serverUrl, onToggle]);

  // Get current prompt
  const getPrompt = useCallback(() => {
    if (session?.projectName) {
      return `torque:${session.projectName}> `;
    }
    return 'torque> ';
  }, [session]);

  // Initialize terminal
  useEffect(() => {
    if (!terminalRef.current || terminal.current) return;

    // Create terminal instance
    const term = new Terminal({
      theme: terminalTheme[theme],
      fontFamily: 'JetBrains Mono, Consolas, monospace',
      fontSize: 14,
      lineHeight: 1.2,
      cursorBlink: true,
      allowTransparency: true,
      scrollback: 1000,
    });

    // Add fit addon for responsive sizing
    const fit = new FitAddon();
    term.loadAddon(fit);
    
    // Add WebGL addon for better performance
    try {
      const webgl = new WebglAddon();
      term.loadAddon(webgl);
    } catch (e) {
      console.warn('WebGL addon failed to load, falling back to canvas renderer');
    }

    // Open terminal
    term.open(terminalRef.current);
    fit.fit();

    // Store references
    terminal.current = term;
    fitAddon.current = fit;

    // Welcome message
    term.writeln('\x1b[32mTorque Interactive Console\x1b[0m');
    term.writeln('Type "help" for available commands, Ctrl+~ to toggle visibility');
    term.write('\r\n');

    // Initialize session
    initializeSession();

    return () => {
      term.dispose();
    };
  }, [theme, terminalTheme, initializeSession]);

  // Handle terminal input
  useEffect(() => {
    if (!terminal.current) return;

    let currentInput = '';
    
    const handleData = async (data: string) => {
      const term = terminal.current!;
      
      for (const char of data) {
        const code = char.charCodeAt(0);
        
        if (code === 13) { // Enter
          term.write('\r\n');
          
          if (currentInput.trim()) {
            setCurrentCommand(currentInput.trim());
            
            // Execute command
            const result = await executeCommand(currentInput.trim());
            
            // Display output
            if (result?.output) {
              // Format output with proper line breaks
              const lines = result.output.split('\n');
              for (const line of lines) {
                if (line.trim()) {
                  const color = result.success ? '\x1b[37m' : '\x1b[31m'; // white or red
                  term.writeln(`${color}${line}\x1b[0m`);
                }
              }
            }
            
            // Add to history
            setHistory(prev => [
              ...prev.slice(-99), // Keep last 100 commands
              {
                command: currentInput.trim(),
                timestamp: new Date(),
                success: result?.success ?? false,
                output: result?.output
              }
            ]);
          }
          
          // Show new prompt
          const prompt = getPrompt();
          term.write(`\r${prompt}`);
          currentInput = '';
          setHistoryIndex(-1);
          
        } else if (code === 127) { // Backspace
          if (currentInput.length > 0) {
            currentInput = currentInput.slice(0, -1);
            term.write('\b \b');
          }
        } else if (code === 27) { // Escape sequences
          // Handle arrow keys for command history
          if (data.length === 3 && data[1] === '[') {
            if (data[2] === 'A') { // Up arrow
              const historyCmd = history[history.length - 1 - (historyIndex + 1)];
              if (historyCmd) {
                // Clear current input
                term.write('\r' + ' '.repeat(getPrompt().length + currentInput.length));
                term.write('\r' + getPrompt());
                
                // Set new input from history
                currentInput = historyCmd.command;
                term.write(currentInput);
                setHistoryIndex(historyIndex + 1);
              }
            } else if (data[2] === 'B') { // Down arrow
              if (historyIndex > 0) {
                const historyCmd = history[history.length - historyIndex];
                
                // Clear current input
                term.write('\r' + ' '.repeat(getPrompt().length + currentInput.length));
                term.write('\r' + getPrompt());
                
                if (historyCmd) {
                  currentInput = historyCmd.command;
                  term.write(currentInput);
                }
                setHistoryIndex(historyIndex - 1);
              } else if (historyIndex === 0) {
                // Clear to empty
                term.write('\r' + ' '.repeat(getPrompt().length + currentInput.length));
                term.write('\r' + getPrompt());
                currentInput = '';
                setHistoryIndex(-1);
              }
            }
          }
        } else if (code >= 32 && code <= 126) { // Printable characters
          currentInput += char;
          term.write(char);
        } else if (code === 3) { // Ctrl+C
          term.write('^C\r\n');
          term.write(getPrompt());
          currentInput = '';
          setHistoryIndex(-1);
        } else if (code === 12) { // Ctrl+L
          term.clear();
          term.write(getPrompt());
          currentInput = '';
        }
      }
    };

    terminal.current.onData(handleData);

    // Show initial prompt when session is ready
    if (session) {
      terminal.current.write(getPrompt());
    }

    return () => {
      terminal.current?.dispose();
    };
  }, [session, history, historyIndex, executeCommand, getPrompt]);

  // Handle window resize
  useEffect(() => {
    if (!fitAddon.current) return;

    const handleResize = () => {
      fitAddon.current?.fit();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === '`') {
        event.preventDefault();
        onToggle(!visible);
      } else if (event.key === 'Escape' && visible) {
        event.preventDefault();
        onToggle(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [visible, onToggle]);

  // Handle click outside to close
  const handleClickOutside = useCallback((event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onToggle(false);
    }
  }, [onToggle]);

  return (
    <Box
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        pointerEvents: visible ? 'auto' : 'none',
        backgroundColor: visible ? 'rgba(0, 0, 0, 0.3)' : 'transparent',
        backdropFilter: visible ? 'blur(2px)' : 'none',
        transition: `all ${animationSpeed}ms ease-in-out`,
      }}
      onClick={handleClickOutside}
    >
      <Paper
        shadow="xl"
        style={{
          position: 'absolute',
          top: visible ? '0' : `-${height}`,
          left: '0',
          right: '0',
          height: height,
          borderRadius: '0 0 8px 8px',
          overflow: 'hidden',
          transition: `top ${animationSpeed}ms ease-in-out`,
          backgroundColor: theme === 'dark' ? '#1e1e1e' : '#ffffff',
          borderBottom: `1px solid ${theme === 'dark' ? '#333' : '#e0e0e0'}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Console header */}
        <Box
          style={{
            padding: '8px 16px',
            backgroundColor: theme === 'dark' ? '#2d2d2d' : '#f5f5f5',
            borderBottom: `1px solid ${theme === 'dark' ? '#333' : '#e0e0e0'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            minHeight: '32px'
          }}
        >
          <Box style={{ 
            fontSize: '12px', 
            color: theme === 'dark' ? '#888' : '#666',
            fontFamily: 'monospace'
          }}>
            {isLoading ? 'Connecting...' : 
             session ? `Session: ${session.sessionId.substring(0, 8)}...` : 'Initializing...'}
          </Box>
          <Box style={{ 
            fontSize: '12px', 
            color: theme === 'dark' ? '#888' : '#666',
            cursor: 'pointer'
          }} onClick={() => onToggle(false)}>
            ✕
          </Box>
        </Box>

        {/* Terminal container */}
        <Box
          ref={terminalRef}
          style={{
            height: `calc(${height} - 48px)`,
            padding: '8px',
            overflow: 'hidden'
          }}
        />

        {/* Resize handle */}
        <Box
          style={{
            position: 'absolute',
            bottom: '0',
            left: '0',
            right: '0',
            height: '4px',
            backgroundColor: theme === 'dark' ? '#333' : '#e0e0e0',
            cursor: 'ns-resize',
          }}
          onMouseDown={(e) => {
            // TODO: Implement resize functionality
            e.preventDefault();
          }}
        />
      </Paper>
    </Box>
  );
};

export default InteractiveConsole;