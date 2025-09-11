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
  const [macros, setMacros] = useState<Record<string, {commands: string[], description: string, created: Date}>>({});
  const [isRecording, setIsRecording] = useState<string | null>(null);
  const [recordedCommands, setRecordedCommands] = useState<string[]>([]);
  
  const terminalRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const terminal = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);
  const consoleRef = useRef<HTMLDivElement>(null);
  
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
    if (session.sessionId.startsWith('fallback-') || ['help', 'echo', 'clear', 'exit', 'status', 'history', 'aliases', 'stats', 'reset', 'export', 'import', 'macro'].some(localCmd => cmd.startsWith(localCmd))) {
      let result: { success: boolean; output: string; action?: string } = { success: true, output: '' };
      
      if (cmd === 'help') {
        const isOffline = session.sessionId.startsWith('fallback-');
        result.output = `Torque Interactive Console ${isOffline ? '(Offline Mode)' : '(Online Mode)'}

Local Commands (always available):
  help [command]          - Show help for specific command or general help
  echo <message>          - Echo back the message  
  clear                   - Clear the console output
  exit                    - Close console overlay
  status                  - Show connection and session status
  history                 - Show command history (use arrow keys ↑↓)
  aliases                 - Show all available command aliases
  stats                   - Show command usage statistics and performance
  reset                   - Clear all statistics, history, and console output
  export                  - Export session data, history, and statistics to JSON file
  import                  - Import session data from exported JSON file
  macro <cmd>             - Record and replay command sequences (see 'help macro')

Backend Commands (may timeout if server not running):
  project list            - List all available projects
  project new <name>      - Create new project with given name
  project use <id>        - Select project context for entity operations
  server status           - Show server health and status
  
Tips:
  - Press Tab for command completion
  - Use ↑↓ arrows for command history
  - Press Ctrl+~ to toggle console visibility
  - Press Escape to close console
  - Commands are case-insensitive`;
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
          'reset': 'reset - Clears all accumulated statistics, command history, and console output. Provides a fresh start for the console session while maintaining connection.',
          'export': 'export - Creates a downloadable JSON file containing complete session data including command history, usage statistics, project context, and performance metrics. Perfect for sharing sessions or creating backups.',
          'import': 'import - Imports session data from a previously exported JSON file. Merges command history, statistics, and session context with current session. Supports drag-and-drop or file selection.',
          'macro': `macro - Command automation system for recording and replaying command sequences.

Available macro commands:
• macro record <name>  - Start recording commands into a named macro
• macro stop           - Stop recording and save the current macro
• macro run <name>     - Execute a saved macro by name
• macro list           - Show all available macros with details
• macro show <name>    - Display detailed information about a specific macro
• macro delete <name>  - Delete a saved macro permanently

Perfect for automating repetitive tasks and creating complex workflows.`
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
        
        result.output = `Console Status Report
═══════════════════════════════════════
Mode: ${isOffline ? 'Offline Mode' : 'Online Mode'}
Session: ${session.sessionId.substring(0, 12)}...
Project Context: ${projectContext}
Server URL: ${serverUrl}
Current Time: ${sessionTime}
Command History: ${textCommandHistory.length} commands
Commands Executed: ${totalCommands}
${mostUsedCommand ? `Most Used Command: ${mostUsedCommand[0]} (${mostUsedCommand[1].count}x)` : 'No commands executed yet'}
${isRecording ? `Recording Macro: ${isRecording} (${recordedCommands.length} commands)` : ''}
Saved Macros: ${Object.keys(macros).length}
═══════════════════════════════════════
Available Features:
  [OK] Local Commands (help, echo, clear, exit, status, history)
  ${isOffline ? '[--]' : '[??]'} Backend Commands (project list, project new, server status)
  [OK] Tab Completion (press Tab)
  [OK] Command History (↑↓ arrows)
  [OK] Keyboard Shortcuts (Ctrl+C, Ctrl+L, Escape)

${isOffline ? 'Note: Server connection not available - running in offline mode' : 'Note: Backend commands may timeout if server is not responding'}`;
      } else if (cmd === 'history') {
        if (textCommandHistory.length === 0) {
          result.output = 'No command history available.';
        } else {
          result.output = `Command History (last ${textCommandHistory.length} commands):

${textCommandHistory.map((cmd, i) => `  ${i + 1}: ${cmd}`).join('\n')}

Use arrow keys (↑↓) to navigate history.`;
        }
      } else if (cmd === 'aliases') {
        result.output = `Command Aliases
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

Note: Aliases allow you to use shorter commands for faster typing.`;
      } else if (cmd === 'stats') {
        const statsEntries = Object.entries(commandStats).sort((a, b) => b[1].count - a[1].count);
        
        if (statsEntries.length === 0) {
          result.output = `Command Usage Statistics
══════════════════════════════
No commands executed yet. Start using commands to see statistics!`;
        } else {
          const totalCommands = statsEntries.reduce((sum, [, stats]) => sum + stats.count, 0);
          const avgExecutionTime = statsEntries.reduce((sum, [, stats]) => sum + stats.avgTime, 0) / statsEntries.length;
          
          result.output = `Command Usage Statistics
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

Note: Command statistics help identify usage patterns and performance insights.`;
        }
      } else if (cmd === 'reset') {
        setCommandStats({});
        setTextCommandHistory([]);
        setTextHistory([]);
        result.output = `Console Reset Complete
═══════════════════════════
[OK] Command statistics cleared
[OK] Command history cleared  
[OK] Console output cleared
[OK] Session state reset

Console is ready for fresh usage tracking.`;
      } else if (cmd === 'export') {
        const sessionData = {
          session: {
            sessionId: session.sessionId,
            projectId: session.projectId,
            projectName: session.projectName
          },
          statistics: commandStats,
          history: textCommandHistory,
          exportedAt: new Date().toISOString(),
          version: '1.0.0'
        };
        
        // Create downloadable JSON file
        const blob = new Blob([JSON.stringify(sessionData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `torque-console-session-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        result.output = `Session Export Complete
═══════════════════════════
[OK] Session data exported to JSON file
[OK] Command history: ${textCommandHistory.length} commands
[OK] Statistics: ${Object.keys(commandStats).length} tracked commands
[OK] Export timestamp: ${new Date().toLocaleString()}

Download should start automatically. The file contains:
- Session information and project context
- Complete command history
- Usage statistics and performance data
- Export metadata for reimporting`;
      } else if (cmd.startsWith('import ') || cmd === 'import') {
        result.output = `Session Import
═══════════════════
To import a console session:

DRAG & DROP METHOD:
   - Drag exported JSON file onto the console area
   - File will be automatically imported and merged
   - Visual feedback shows drop zone activation

MANUAL METHOD:
   - Use browser file picker (coming soon)
   - Select previously exported JSON file
   - Data will be merged with current session

IMPORT FEATURES:
   - Command history merging (no duplicates)
   - Statistics aggregation with proper averaging
   - Session metadata preservation
   - Error handling for invalid files

Note: Use 'export' to create importable session files.
      Current session will merge with imported data.`;
      } else if (cmd.startsWith('macro ')) {
        const macroArgs = cmd.substring(6).trim().split(' ');
        const subCommand = macroArgs[0];
        
        if (subCommand === 'record') {
          const macroName = macroArgs[1];
          if (!macroName) {
            result.output = `Error: Macro name required. Usage: macro record <name>`;
          } else if (isRecording) {
            result.output = `Error: Already recording macro '${isRecording}'. Use 'macro stop' first.`;
          } else {
            setIsRecording(macroName);
            setRecordedCommands([]);
            result.output = `Recording macro '${macroName}'
═══════════════════════════════════════
Commands will be recorded until you run 'macro stop'.
Recorded commands will be saved and can be replayed with 'macro run ${macroName}'.

Note: Recording started - type commands normally to add them to the macro.`;
          }
        } else if (subCommand === 'stop') {
          if (!isRecording) {
            result.output = `Error: No macro recording in progress. Use 'macro record <name>' to start.`;
          } else {
            const macroName = isRecording;
            setMacros(prev => ({
              ...prev,
              [macroName]: {
                commands: [...recordedCommands],
                description: `Recorded on ${new Date().toLocaleDateString()}`,
                created: new Date()
              }
            }));
            result.output = `Macro '${macroName}' saved successfully
═══════════════════════════════════════
Commands recorded: ${recordedCommands.length}
Commands: ${recordedCommands.join(', ')}

Use 'macro run ${macroName}' to execute this macro.
Use 'macro list' to see all available macros.`;
            setIsRecording(null);
            setRecordedCommands([]);
          }
        } else if (subCommand === 'run') {
          const macroName = macroArgs[1];
          if (!macroName) {
            result.output = `Error: Macro name required. Usage: macro run <name>`;
          } else if (!macros[macroName]) {
            result.output = `Error: Macro '${macroName}' not found. Use 'macro list' to see available macros.`;
          } else {
            const macro = macros[macroName];
            result.output = `Executing macro '${macroName}'
═══════════════════════════════════════
Commands to execute: ${macro.commands.length}
Created: ${macro.created.toLocaleDateString()}

Executing commands in sequence...`;
            
            // Execute macro commands sequentially (simplified - in reality would need proper async handling)
            setTimeout(async () => {
              for (const macroCmd of macro.commands) {
                setTextHistory(prev => [...prev, `${getPrompt()}${macroCmd} (macro)`]);
                const macroResult = await executeCommand(macroCmd);
                if (macroResult?.output) {
                  setTextHistory(prev => [...prev, macroResult.output]);
                }
                await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between commands
              }
              setTextHistory(prev => [...prev, `Macro '${macroName}' execution completed.`]);
            }, 100);
          }
        } else if (subCommand === 'list') {
          const macroList = Object.entries(macros);
          if (macroList.length === 0) {
            result.output = `No Macros Available
═══════════════════════════════════════
No command macros have been created yet.

Create your first macro:
1. Run 'macro record <name>'  
2. Execute commands normally
3. Run 'macro stop' to finish
4. Use 'macro run <name>' to replay`;
          } else {
            result.output = `📋 Available Command Macros
═══════════════════════════════════════
Name          Commands    Created
──────────    ────────    ─────────
${macroList.map(([name, macro]) => 
  `${name.padEnd(12)} ${macro.commands.length.toString().padEnd(10)} ${macro.created.toLocaleDateString()}`
).join('\n')}

${isRecording ? `\n🔴 Currently recording: ${isRecording}` : ''}

Usage:
• macro run <name>     - Execute macro
• macro delete <name>  - Delete macro  
• macro show <name>    - Show macro details`;
          }
        } else if (subCommand === 'delete') {
          const macroName = macroArgs[1];
          if (!macroName) {
            result.output = `Error: Macro name required. Usage: macro delete <name>`;
          } else if (!macros[macroName]) {
            result.output = `Error: Macro '${macroName}' not found.`;
          } else {
            setMacros(prev => {
              const updated = { ...prev };
              delete updated[macroName];
              return updated;
            });
            result.output = `Macro '${macroName}' deleted successfully.`;
          }
        } else if (subCommand === 'show') {
          const macroName = macroArgs[1];
          if (!macroName) {
            result.output = `Error: Macro name required. Usage: macro show <name>`;
          } else if (!macros[macroName]) {
            result.output = `Error: Macro '${macroName}' not found.`;
          } else {
            const macro = macros[macroName];
            result.output = `Macro Details: '${macroName}'
═══════════════════════════════════════
Description: ${macro.description}
Created: ${macro.created.toLocaleString()}  
Commands: ${macro.commands.length}

Command Sequence:
${macro.commands.map((cmd, i) => `  ${i + 1}. ${cmd}`).join('\n')}

Use 'macro run ${macroName}' to execute this sequence.`;
          }
        } else {
          result.output = `Error: Unknown macro command: ${subCommand}

Available macro commands:
- macro record <name>  - Start recording commands
- macro stop           - Stop recording  
- macro run <name>     - Execute macro
- macro list           - List all macros
- macro show <name>    - Show macro details
- macro delete <name>  - Delete macro

Note: Macros let you record and replay command sequences for automation.`;
        }
      } else if (cmd === '') {
        return { success: true, output: '' };
      } else {
        // Use suggestion system for unknown commands
        const suggestions = suggestCommand(command.trim());
        const suggestionText = suggestions.length > 0 
          ? `\n\nDid you mean: ${suggestions.map(s => `'${s}'`).join(', ')}?` 
          : `\n\nType 'help' to see all available commands.`;
          
        result = {
          success: false,
          output: `Unknown command: '${command.trim()}'${suggestionText}\n\nQuick commands: help, status, history, aliases`
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
      
      // Record command if macro recording is active (but don't record macro commands themselves)
      if (isRecording && !command.trim().toLowerCase().startsWith('macro')) {
        setRecordedCommands(prev => [...prev, command.trim()]);
      }
      
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
    let prefix = isOffline ? 'torque[offline]' : 'torque';
    
    // Add recording indicator to prompt
    if (isRecording) {
      prefix += `[🔴${isRecording}]`;
    }
    
    if (session?.projectName) {
      return `${prefix}:${session.projectName}> `;
    }
    return `${prefix}> `;
  }, [session, isRecording]);

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

  // Command validation and suggestion system
  const suggestCommand = useCallback((input: string): string[] => {
    const allCommands = [
      'help', 'echo', 'clear', 'exit', 'status', 'history', 'aliases', 'stats', 'reset', 'export', 'import',
      'macro record', 'macro stop', 'macro run', 'macro list', 'macro show', 'macro delete',
      'project list', 'project new', 'server status',
      // Include aliases
      'h', '?', 'cls', 'c', 'quit', 'q', 'stat', 'hist', 'ls', 'pwd'
    ];
    
    const inputLower = input.toLowerCase().trim();
    
    // Exact matches
    const exactMatches = allCommands.filter(cmd => cmd === inputLower);
    if (exactMatches.length > 0) return [];
    
    // Prefix matches
    const prefixMatches = allCommands.filter(cmd => cmd.startsWith(inputLower));
    if (prefixMatches.length > 0) return prefixMatches.slice(0, 3);
    
    // Fuzzy matching using Levenshtein-like approach
    const fuzzyMatches = allCommands
      .map(cmd => ({
        command: cmd,
        distance: getEditDistance(inputLower, cmd)
      }))
      .filter(match => match.distance <= 3 && match.distance < match.command.length * 0.6)
      .sort((a, b) => a.distance - b.distance)
      .map(match => match.command)
      .slice(0, 3);
    
    return fuzzyMatches;
  }, []);

  // Simple edit distance calculation for fuzzy matching
  const getEditDistance = useCallback((str1: string, str2: string): number => {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion  
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }, []);

  // Enhanced output formatting system
  const formatOutput = useCallback((text: string, type: 'success' | 'error' | 'info' | 'warning' = 'info'): string => {
    const icons = {
      success: '✅',
      error: '❌',
      info: 'ℹ️',
      warning: '⚠️'
    };
    
    // Add consistent spacing and formatting
    const lines = text.split('\n');
    const formattedLines = lines.map(line => {
      if (line.trim() === '') return line;
      if (line.startsWith('═') || line.startsWith('─')) return line; // Keep separator lines as-is
      return line;
    });
    
    return formattedLines.join('\n');
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

  // Import session data from JSON
  const importSessionData = useCallback(async (jsonData: any) => {
    try {
      if (!jsonData.version || !jsonData.session || !jsonData.history || !jsonData.statistics) {
        throw new Error('Invalid session file format');
      }
      
      // Merge command history (avoid duplicates)
      const newHistory = [...textCommandHistory];
      jsonData.history.forEach((cmd: string) => {
        if (!newHistory.includes(cmd)) {
          newHistory.push(cmd);
        }
      });
      setTextCommandHistory(newHistory.slice(-100)); // Keep last 100
      
      // Merge statistics
      setCommandStats(prev => {
        const merged = { ...prev };
        Object.entries(jsonData.statistics).forEach(([cmd, stats]: [string, any]) => {
          if (merged[cmd]) {
            // Merge existing stats
            const totalCount = merged[cmd].count + stats.count;
            const avgTime = (merged[cmd].avgTime * merged[cmd].count + stats.avgTime * stats.count) / totalCount;
            merged[cmd] = {
              count: totalCount,
              avgTime: Math.round(avgTime * 100) / 100,
              lastUsed: new Date(Math.max(merged[cmd].lastUsed.getTime(), new Date(stats.lastUsed).getTime()))
            };
          } else {
            merged[cmd] = {
              ...stats,
              lastUsed: new Date(stats.lastUsed)
            };
          }
        });
        return merged;
      });
      
      // Show import success message
      setTextHistory(prev => [...prev, `Session Import Successful
═══════════════════════════════
[OK] Imported ${jsonData.history.length} commands to history
[OK] Merged statistics for ${Object.keys(jsonData.statistics).length} commands  
[OK] Import from: ${new Date(jsonData.exportedAt).toLocaleString()}
[OK] Session version: ${jsonData.version}

Import completed successfully! Use 'stats' to see merged data.`]);
      
      return true;
    } catch (error) {
      setTextHistory(prev => [...prev, `Session Import Failed
═════════════════════════════
Error: ${error instanceof Error ? error.message : 'Unknown error'}

Please ensure you're importing a valid Torque console session file.
Use 'export' to create valid session files.`]);
      return false;
    }
  }, [textCommandHistory]);

  // Handle drag and drop
  useEffect(() => {
    if (!consoleRef.current) return;
    
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (consoleRef.current) {
        consoleRef.current.style.backgroundColor = 'rgba(0, 100, 200, 0.1)';
      }
    };
    
    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (consoleRef.current) {
        consoleRef.current.style.backgroundColor = '';
      }
    };
    
    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (consoleRef.current) {
        consoleRef.current.style.backgroundColor = '';
      }
      
      const files = Array.from(e.dataTransfer?.files || []);
      const jsonFile = files.find(file => file.type === 'application/json' || file.name.endsWith('.json'));
      
      if (jsonFile) {
        try {
          const text = await jsonFile.text();
          const jsonData = JSON.parse(text);
          await importSessionData(jsonData);
        } catch (error) {
          setTextHistory(prev => [...prev, `File Import Error: ${error instanceof Error ? error.message : 'Invalid JSON file'}`]);
        }
      } else {
        setTextHistory(prev => [...prev, 'Please drop a JSON session file. Use the "export" command to create valid session files.']);
      }
    };
    
    const consoleElement = consoleRef.current;
    consoleElement.addEventListener('dragover', handleDragOver);
    consoleElement.addEventListener('dragleave', handleDragLeave);
    consoleElement.addEventListener('drop', handleDrop);
    
    return () => {
      consoleElement.removeEventListener('dragover', handleDragOver);
      consoleElement.removeEventListener('dragleave', handleDragLeave);  
      consoleElement.removeEventListener('drop', handleDrop);
    };
  }, [importSessionData]);

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

    let resizeTimeout: ReturnType<typeof setTimeout>;
    
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
        ref={consoleRef}
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
              <div 
                ref={(el) => {
                  if (el && textHistory.length > 0) {
                    // Auto-scroll to bottom when new content is added
                    setTimeout(() => {
                      el.scrollTop = el.scrollHeight;
                    }, 0);
                  }
                }}
                style={{
                  flex: 1,
                  color: theme === 'dark' ? '#d4d4d4' : '#333333',
                  whiteSpace: 'pre-wrap',
                  overflowY: 'auto',
                  paddingBottom: '10px',
                  fontFamily: 'JetBrains Mono, Consolas, monospace',
                  fontSize: '13px',
                  lineHeight: '1.4',
                  scrollBehavior: 'smooth'
                }}
              >
                Torque Interactive Console
                Type "help" for commands • Ctrl+~ to toggle • Tab for completion
                {'\n'}
                {textHistory.join('\n')}
              </div>
              
              {/* Input line */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                color: theme === 'dark' ? '#569cd6' : '#0451a5',
                borderTop: `1px solid ${theme === 'dark' ? '#404040' : '#e0e0e0'}`,
                paddingTop: '8px'
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
                        'help', 'echo', 'clear', 'exit', 'status', 'history', 'aliases', 'stats', 'reset', 'export', 'import',
                        'macro record', 'macro stop', 'macro run', 'macro list', 'macro show', 'macro delete',
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