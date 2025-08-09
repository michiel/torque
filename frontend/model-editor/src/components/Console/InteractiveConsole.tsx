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
  const [textInput, setTextInput] = useState('');
  const [textHistory, setTextHistory] = useState<string[]>([]);
  const [textCommandHistory, setTextCommandHistory] = useState<string[]>([]);
  const [textHistoryIndex, setTextHistoryIndex] = useState(-1);
  const [commandStats, setCommandStats] = useState<Record<string, {count: number, avgTime: number, lastUsed: Date}>>({});
  
  const terminalRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
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
    console.log('[Console] Initializing session with serverUrl:', serverUrl);
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
      console.log('[Console] Server response:', data);
      
      if (data.result) {
        const newSession = {
          sessionId: data.result.sessionId,
          projectId: data.result.context?.projectId,
          projectName: data.result.context?.projectName,
          capabilities: data.result.capabilities || []
        };
        console.log('[Console] Creating real session:', newSession);
        setSession(newSession);
      } else {
        // Fallback session for when backend doesn't support console methods yet
        const fallbackSession = {
          sessionId: 'fallback-' + Date.now(),
          capabilities: ['help', 'echo']
        };
        console.log('[Console] Creating fallback session:', fallbackSession);
        setSession(fallbackSession);
      }
    } catch (error) {
      console.error('Failed to initialize console session:', error);
      // Create fallback session so console still works
      const fallbackSession = {
        sessionId: 'fallback-' + Date.now(),
        capabilities: ['help', 'echo']
      };
      console.log('[Console] Creating fallback session after error:', fallbackSession);
      setSession(fallbackSession);
    } finally {
      setIsLoading(false);
    }
  }, [serverUrl]);

  // Execute console command
  const executeCommand = useCallback(async (command: string) => {
    if (!session) return;
    
    const startTime = performance.now();
    let cmd = command.trim().toLowerCase();
    
    // Command aliases
    const aliases: Record<string, string> = {
      'h': 'help',
      '?': 'help', 
      'cls': 'clear',
      'c': 'clear',
      'quit': 'exit',
      'q': 'exit',
      'stat': 'status',
      'hist': 'history',
      'ls': 'project list',
      'pwd': 'status'
    };
    
    cmd = aliases[cmd] || cmd;
    
    // Handle local commands (both fallback sessions and real sessions)
    if (session.sessionId.startsWith('fallback-') || ['help', 'echo', 'clear', 'exit', 'status', 'history', 'aliases', 'stats', 'reset'].some(localCmd => cmd.startsWith(localCmd))) {
      let result = { success: true, output: '' };
      
      if (cmd === 'help') {
        const isOffline = session.sessionId.startsWith('fallback-');
        result.output = `🚀 Torque Interactive Console ${isOffline ? '(Offline Mode)' : '(Online Mode)'}

📋 Local Commands (always available):
  help [command]          - Show help for specific command or general help
  echo <message>          - Echo back the message  
  clear                   - Clear the console output
  exit                    - Close console overlay
  status                  - Show connection and session status
  history                 - Show command history (use arrow keys ↑↓)
  aliases                 - Show all available command aliases
  stats                   - Show command usage statistics and performance
  reset                   - Clear all statistics, history, and console output

🔧 Backend Commands (may timeout if server not running):
  project list            - List all available projects
  project new <name>      - Create new project with given name
  project use <id>        - Select project context for entity operations
  server status           - Show server health and status
  
💡 Tips:
  • Press Tab for command completion
  • Use ↑↓ arrows for command history
  • Press Ctrl+~ to toggle console visibility
  • Press Escape to close console
  • Commands are case-insensitive`;
      } else if (cmd.startsWith('help ')) {
        const helpCmd = cmd.substring(5).trim();
        const helpTexts: Record<string, string> = {
          'echo': 'echo <message> - Echoes the provided message back to the console',
          'clear': 'clear - Clears all output from the console screen',
          'exit': 'exit - Closes the console overlay',
          'status': 'status - Shows current connection status, session info, and available commands',
          'history': 'history - Displays the last 50 commands executed in this session',
          'project': `project commands:
  project list           - List all available projects in the system
  project new <name>     - Create a new project with the specified name
  project use <id>       - Switch to project context (enables entity commands)`,
          'server': 'server status - Shows server health, uptime, and system information',
          'stats': 'stats - Shows command usage analytics including execution counts, average response times, and usage patterns. Helps identify most frequently used commands and performance bottlenecks.',
          'aliases': 'aliases - Displays all available command shortcuts and their full command equivalents. Use aliases to type commands faster!',
          'reset': 'reset - Clears all accumulated statistics, command history, and console output. Provides a fresh start for the console session while maintaining connection.'
        };
        
        result.output = helpTexts[helpCmd] || `No help available for '${helpCmd}'. Try 'help' for all commands.`;
      } else if (cmd.startsWith('echo ')) {
        result.output = cmd.substring(5);
      } else if (cmd === 'clear') {
        result = { success: true, output: '', action: 'clear' };
      } else if (cmd === 'exit') {
        result = { success: true, output: 'Goodbye!', action: 'exit' };
      } else if (cmd === 'status') {
        const isOffline = session.sessionId.startsWith('fallback-');
        const sessionTime = new Date().toLocaleTimeString();
        const projectContext = session.projectName ? `${session.projectName} (${session.projectId})` : 'None';
        const totalCommands = Object.values(commandStats).reduce((sum, stats) => sum + stats.count, 0);
        const mostUsedCommand = Object.entries(commandStats).sort((a, b) => b[1].count - a[1].count)[0];
        
        result.output = `📊 Console Status Report
═══════════════════════════════════════
Mode: ${isOffline ? '🔴 Offline Mode' : '🟢 Online Mode'}
Session: ${session.sessionId.substring(0, 12)}...
Project Context: ${projectContext}
Server URL: ${serverUrl}
Current Time: ${sessionTime}
Command History: ${textCommandHistory.length} commands
Commands Executed: ${totalCommands}
${mostUsedCommand ? `Most Used Command: ${mostUsedCommand[0]} (${mostUsedCommand[1].count}x)` : 'No commands executed yet'}
═══════════════════════════════════════
Available Features:
  ✅ Local Commands (help, echo, clear, exit, status, history)
  ${isOffline ? '❌' : '⚠️'} Backend Commands (project list, project new, server status)
  ✅ Tab Completion (press Tab)
  ✅ Command History (↑↓ arrows)
  ✅ Keyboard Shortcuts (Ctrl+C, Ctrl+L, Escape)

${isOffline ? '⚠️ Server connection not available - running in offline mode' : '💡 Backend commands may timeout if server is not responding'}`;
      } else if (cmd === 'history') {
        if (textCommandHistory.length === 0) {
          result.output = 'No command history available.';
        } else {
          result.output = `Command History (last ${textCommandHistory.length} commands):

${textCommandHistory.map((cmd, i) => `  ${i + 1}: ${cmd}`).join('\n')}

Use arrow keys (↑↓) to navigate history.`;
        }
      } else if (cmd === 'aliases') {
        result.output = `🔗 Command Aliases
═════════════════
Short     Full Command
─────     ─────────────
h         help
?         help
cls       clear
c         clear
quit      exit
q         exit
stat      status
hist      history
ls        project list
pwd       status

💡 Aliases allow you to use shorter commands for faster typing!`;
      } else if (cmd === 'stats') {
        const statsEntries = Object.entries(commandStats).sort((a, b) => b[1].count - a[1].count);
        
        if (statsEntries.length === 0) {
          result.output = `📊 Command Usage Statistics
══════════════════════════════
No commands executed yet. Start using commands to see statistics!`;
        } else {
          const totalCommands = statsEntries.reduce((sum, [, stats]) => sum + stats.count, 0);
          const avgExecutionTime = statsEntries.reduce((sum, [, stats]) => sum + stats.avgTime, 0) / statsEntries.length;
          
          result.output = `📊 Command Usage Statistics
══════════════════════════════
Total Commands Executed: ${totalCommands}
Average Execution Time: ${Math.round(avgExecutionTime * 100) / 100}ms
Session Started: ${new Date().toLocaleString()}

Command Breakdown:
─────────────────
Command       Count    Avg Time    Last Used
──────────    ─────    ────────    ─────────
${statsEntries.slice(0, 10).map(([cmd, stats]) => 
  `${cmd.padEnd(12)} ${stats.count.toString().padEnd(8)} ${stats.avgTime.toString().padEnd(8)}ms  ${stats.lastUsed.toLocaleTimeString()}`
).join('\n')}

${statsEntries.length > 10 ? `... and ${statsEntries.length - 10} more commands` : ''}

💡 Command statistics help identify usage patterns and performance insights!`;
        }
      } else if (cmd === 'reset') {
        setCommandStats({});
        setTextCommandHistory([]);
        setTextHistory([]);
        result.output = `🔄 Console Reset Complete
═══════════════════════════
✅ Command statistics cleared
✅ Command history cleared  
✅ Console output cleared
✅ Session state reset

Console is ready for fresh usage tracking!`;
      } else if (cmd === '') {
        return { success: true, output: '' };
      } else {
        result = {
          success: false,
          output: `Unknown command: ${command.trim()}
Type 'help' for available commands.`
        };
      }
      
      // Handle special actions
      if (result.action === 'clear') {
        terminal.current?.clear();
        setTextHistory([]); // Clear text history too
      } else if (result.action === 'exit') {
        onToggle(false);
      }
      
      // Update command statistics
      const executionTime = performance.now() - startTime;
      updateCommandStats(command, executionTime);
      
      return result;
    }
    
    // Try backend execution for real sessions
    try {
      setIsLoading(true);
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
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
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const data = await response.json();
      const result = data.result || data.error;
      
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
      
      // Update command statistics for successful backend commands
      const executionTime = performance.now() - startTime;
      updateCommandStats(command, executionTime);
      
      return result;
    } catch (error) {
      console.error('Failed to execute command:', error);
      
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = `Command timed out after 10 seconds. This usually means the backend doesn't implement this command yet.`;
        } else {
          errorMessage = error.message;
        }
      }
      
      return {
        success: false,
        output: `Error: ${errorMessage}
        
Available commands while backend is being implemented:
  help, echo, clear, exit, status
  
Backend commands (may not work yet):
  project list, project new, server status`
      };
    } finally {
      setIsLoading(false);
    }
  }, [session, serverUrl, onToggle, terminal]);

  // Get current prompt
  const getPrompt = useCallback(() => {
    if (!session) return 'torque> ';
    
    const isOffline = session.sessionId.startsWith('fallback-');
    const prefix = isOffline ? 'torque[offline]' : 'torque';
    
    if (session?.projectName) {
      return `${prefix}:${session.projectName}> `;
    }
    return `${prefix}> `;
  }, [session]);

  // Helper function for tab completion
  const getCommonPrefix = useCallback((strings: string[]): string => {
    if (strings.length === 0) return '';
    if (strings.length === 1) return strings[0];
    
    let commonPrefix = '';
    const firstString = strings[0];
    
    for (let i = 0; i < firstString.length; i++) {
      const char = firstString[i];
      if (strings.every(str => str[i] === char)) {
        commonPrefix += char;
      } else {
        break;
      }
    }
    
    return commonPrefix;
  }, []);

  // Update command statistics
  const updateCommandStats = useCallback((command: string, executionTime: number) => {
    const baseCommand = command.trim().toLowerCase().split(' ')[0]; // Get base command without arguments
    
    setCommandStats(prev => {
      const existing = prev[baseCommand];
      if (existing) {
        const newCount = existing.count + 1;
        const newAvgTime = (existing.avgTime * existing.count + executionTime) / newCount;
        return {
          ...prev,
          [baseCommand]: {
            count: newCount,
            avgTime: Math.round(newAvgTime * 100) / 100, // Round to 2 decimals
            lastUsed: new Date()
          }
        };
      } else {
        return {
          ...prev,
          [baseCommand]: {
            count: 1,
            avgTime: Math.round(executionTime * 100) / 100,
            lastUsed: new Date()
          }
        };
      }
    });
  }, []);

  // Initialize terminal
  useEffect(() => {
    if (!terminalRef.current || terminal.current) return;

    console.log('[Console] Creating terminal instance');
    
    // Check if xterm CSS is loaded
    const xtermStyles = Array.from(document.styleSheets).find(sheet => 
      sheet.href?.includes('xterm') || 
      Array.from(sheet.cssRules || []).some(rule => 
        rule.cssText?.includes('.xterm')
      )
    );
    console.log('[Console] Xterm CSS loaded:', !!xtermStyles);

    // Create terminal instance
    const term = new Terminal({
      theme: terminalTheme[theme],
      fontFamily: 'JetBrains Mono, Consolas, monospace',
      fontSize: 14,
      lineHeight: 1.2,
      cursorBlink: true,
      allowTransparency: true,
      scrollback: 1000,
      rows: 20, // Ensure minimum size
      cols: 80,
    });

    // Add fit addon for responsive sizing
    const fit = new FitAddon();
    term.loadAddon(fit);
    
    // Skip WebGL addon - use canvas renderer for better compatibility
    console.log('[Console] Using canvas renderer for compatibility');

    // Store references first
    terminal.current = term;
    fitAddon.current = fit;

    // Check container dimensions
    const containerRect = terminalRef.current.getBoundingClientRect();
    console.log('[Console] Container dimensions:', {
      width: containerRect.width,
      height: containerRect.height,
      visible: containerRect.width > 0 && containerRect.height > 0
    });

    // Ensure container has proper styling for xterm
    if (terminalRef.current) {
      terminalRef.current.style.position = 'relative';
      terminalRef.current.style.width = '100%';
      terminalRef.current.style.height = '100%';
    }

    // Open terminal
    term.open(terminalRef.current);
    console.log('[Console] Terminal opened in container');
    
    // Force xterm element to be visible and properly sized
    if (term.element) {
      term.element.style.position = 'absolute';
      term.element.style.top = '0';
      term.element.style.left = '0';
      term.element.style.width = '100%';
      term.element.style.height = '100%';
      term.element.style.zIndex = '10';
      term.element.style.boxSizing = 'border-box';
      term.element.style.overflow = 'hidden';
      console.log('[Console] Applied explicit styling to terminal element');
    }
    
    // Fit and focus
    setTimeout(() => {
      // Force specific dimensions first
      term.resize(80, 20);
      console.log('[Console] Terminal resized to 80x20');
      
      fit.fit();
      term.focus();
      console.log('[Console] Terminal fitted and focused');
      
      // Check terminal dimensions after fit
      console.log('[Console] Terminal dimensions after fit:', {
        rows: term.rows,
        cols: term.cols,
        actualElement: !!term.element,
        elementStyle: term.element?.style.cssText
      });
      
      // Welcome message and immediate prompt
      term.clear();
      term.writeln('\x1b[32mTorque Interactive Console\x1b[0m');
      term.writeln('\x1b[36mType "help" for commands, Ctrl+~ to toggle\x1b[0m');
      term.write('\r\n');
      
      // Detailed terminal element inspection
      console.log('[Console] Terminal element detailed info:', {
        hasElement: !!term.element,
        elementClasses: term.element?.className,
        elementChildren: term.element?.childElementCount,
        containerChildren: terminalRef.current?.childElementCount,
        elementHTML: term.element?.innerHTML?.substring(0, 200) + '...',
        elementComputedStyle: term.element ? {
          display: window.getComputedStyle(term.element).display,
          visibility: window.getComputedStyle(term.element).visibility,
          opacity: window.getComputedStyle(term.element).opacity,
          width: window.getComputedStyle(term.element).width,
          height: window.getComputedStyle(term.element).height,
          position: window.getComputedStyle(term.element).position,
          zIndex: window.getComputedStyle(term.element).zIndex
        } : null
      });
      
      term.write('\x1b[33mtorque> \x1b[37m'); // Yellow prompt, white text
      console.log('[Console] Immediate prompt displayed with colors');
      
      // Force cursor to be visible
      term.focus();
      
      // Initialize session in background
      initializeSession();
    }, 100); // Small delay to ensure container is ready

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

    return () => {
      terminal.current?.dispose();
    };
  }, [session, history, historyIndex, executeCommand, getPrompt]);

  // Display initial prompt when session is ready
  useEffect(() => {
    if (!terminal.current || !session) {
      console.log('[Console] Not showing prompt:', { hasTerminal: !!terminal.current, hasSession: !!session });
      return;
    }

    console.log('[Console] Displaying initial prompt for session:', session.sessionId);

    // Clear the connecting prompt and show session status
    terminal.current.write('\r\n');
    
    const isOffline = session.sessionId.startsWith('fallback-');
    if (isOffline) {
      terminal.current.writeln('\x1b[33mRunning in offline mode - backend console methods not available\x1b[0m');
      terminal.current.writeln('Type "help" for available commands, Ctrl+~ to toggle visibility');
    } else {
      terminal.current.writeln('\x1b[32mConsole session established\x1b[0m');
      terminal.current.writeln('Type "help" for available commands, Ctrl+~ to toggle visibility');
    }
    terminal.current.write('\r\n');
    
    const prompt = getPrompt();
    console.log('[Console] Writing prompt:', prompt);
    terminal.current.write('\x1b[33m' + prompt + '\x1b[37m'); // Yellow prompt, white text
  }, [session, getPrompt]);

  // Handle window resize and console visibility changes
  useEffect(() => {
    if (!fitAddon.current || !terminal.current) return;

    let resizeTimeout: number;
    
    const handleResize = () => {
      // Debounce resize calls
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (fitAddon.current && terminal.current) {
          console.log('[Console] Resizing terminal due to container/window change');
          fitAddon.current.fit();
          terminal.current.focus();
        }
      }, 100);
    };

    // Listen for window resize
    window.addEventListener('resize', handleResize);
    
    // Listen for console visibility changes
    if (visible) {
      // When console becomes visible, resize after animation completes
      setTimeout(handleResize, animationSpeed + 50);
    }

    // Use ResizeObserver to detect container size changes
    let resizeObserver: ResizeObserver | undefined;
    if (terminalRef.current && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(terminalRef.current);
    }

    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
      resizeObserver?.disconnect();
    };
  }, [visible, animationSpeed]);

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

  // Manual resize function for external use
  const resizeTerminal = useCallback(() => {
    if (fitAddon.current && terminal.current && visible) {
      console.log('[Console] Manual terminal resize triggered');
      fitAddon.current.fit();
      terminal.current.focus();
    }
  }, [visible]);

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
            minHeight: '200px', // Ensure minimum height
            maxHeight: `calc(${height} - 48px)`,
            width: '100%',
            padding: '8px',
            overflow: 'hidden',
            backgroundColor: theme === 'dark' ? '#1e1e1e' : '#ffffff',
            position: 'relative',
            boxSizing: 'border-box', // Include padding in size calculations
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          
          {/* Working text-based terminal as fallback */}
          {session && (
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              right: '10px',
              bottom: '40px',
              zIndex: 15,
              display: 'flex',
              flexDirection: 'column',
              fontFamily: 'JetBrains Mono, Consolas, monospace',
              fontSize: '14px'
            }}>
              {/* Terminal output area */}
              <div style={{
                flex: 1,
                color: theme === 'dark' ? '#00ff00' : '#008000',
                whiteSpace: 'pre-wrap',
                overflowY: 'auto',
                paddingBottom: '10px'
              }}>
                🚀 Torque Interactive Console
                Type "help" for commands • Ctrl+~ to toggle • Tab for completion
                {'\n'}
                {textHistory.join('\n')}
              </div>
              
              {/* Input line */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                color: theme === 'dark' ? '#ffff00' : '#ff8800'
              }}>
                <span>{getPrompt()}</span>
                <input
                  ref={textInputRef}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter') {
                      const command = textInput.trim();
                      if (command) {
                        // Add to command history
                        setTextCommandHistory(prev => [...prev.slice(-49), command]); // Keep last 50
                        setTextHistoryIndex(-1);
                        
                        setTextHistory(prev => [...prev, `${getPrompt()}${command}`]);
                        setTextInput('');
                        
                        // Show loading indicator
                        setTextHistory(prev => [...prev, 'Executing command...']);
                        
                        const result = await executeCommand(command);
                        
                        // Remove loading indicator and add result
                        setTextHistory(prev => prev.slice(0, -1));
                        
                        if (result?.output) {
                          setTextHistory(prev => [...prev, result.output]);
                        }
                      }
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      if (textCommandHistory.length > 0) {
                        const newIndex = textHistoryIndex < textCommandHistory.length - 1 ? textHistoryIndex + 1 : textCommandHistory.length - 1;
                        setTextHistoryIndex(newIndex);
                        setTextInput(textCommandHistory[textCommandHistory.length - 1 - newIndex]);
                      }
                    } else if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      if (textHistoryIndex > 0) {
                        const newIndex = textHistoryIndex - 1;
                        setTextHistoryIndex(newIndex);
                        setTextInput(textCommandHistory[textCommandHistory.length - 1 - newIndex]);
                      } else if (textHistoryIndex === 0) {
                        setTextHistoryIndex(-1);
                        setTextInput('');
                      }
                    } else if (e.key === 'Tab') {
                      e.preventDefault();
                      // Tab completion for commands
                      const availableCommands = [
                        'help', 'echo', 'clear', 'exit', 'status', 'history', 'aliases', 'stats', 'reset',
                        'project list', 'project new', 'server status',
                        // Aliases
                        'h', '?', 'cls', 'c', 'quit', 'q', 'stat', 'hist', 'ls', 'pwd'
                      ];
                      const input = textInput.trim();
                      const matches = availableCommands.filter(cmd => cmd.startsWith(input));
                      
                      if (matches.length === 1) {
                        setTextInput(matches[0] + ' ');
                      } else if (matches.length > 1) {
                        // Show common prefix if there is one
                        const commonPrefix = getCommonPrefix(matches);
                        if (commonPrefix.length > input.length) {
                          setTextInput(commonPrefix);
                        } else {
                          setTextHistory(prev => [...prev, `\n${getPrompt()}${input}`, `Available completions: ${matches.join(', ')}`]);
                        }
                      }
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      onToggle(false);
                    } else if (e.ctrlKey && e.key === 'c') {
                      e.preventDefault();
                      setTextInput('');
                      setTextHistory(prev => [...prev, `${getPrompt()}${textInput}^C`]);
                    } else if (e.ctrlKey && e.key === 'l') {
                      e.preventDefault();
                      setTextHistory([]);
                    }
                  }}
                  style={{
                    flex: 1,
                    marginLeft: '5px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: theme === 'dark' ? '#ffffff' : '#000000',
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    outline: 'none'
                  }}
                  autoFocus
                />
              </div>
            </div>
          )}
        </Box>

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