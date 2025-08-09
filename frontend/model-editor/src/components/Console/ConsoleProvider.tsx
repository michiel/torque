import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useTorqueConfig } from '../../providers/TorqueConfigProvider';
import InteractiveConsole from './InteractiveConsole';

export interface ConsoleContextType {
  visible: boolean;
  toggle: () => void;
  show: () => void;
  hide: () => void;
}

const ConsoleContext = createContext<ConsoleContextType | undefined>(undefined);

export interface ConsoleProviderProps {
  children: ReactNode;
  height?: string;
  theme?: 'dark' | 'light';
  animationSpeed?: number;
  enabled?: boolean;
}

export const ConsoleProvider: React.FC<ConsoleProviderProps> = ({
  children,
  height = '40vh',
  theme = 'dark',
  animationSpeed = 300,
  enabled = true,
}) => {
  const [visible, setVisible] = useState(false);
  const { jsonRpcUrl, baseUrl } = useTorqueConfig();

  const toggle = useCallback(() => {
    setVisible(prev => !prev);
  }, []);

  const show = useCallback(() => {
    setVisible(true);
  }, []);

  const hide = useCallback(() => {
    setVisible(false);
  }, []);

  const contextValue: ConsoleContextType = {
    visible,
    toggle,
    show,
    hide,
  };

  return (
    <ConsoleContext.Provider value={contextValue}>
      {children}
      {enabled && (
        <InteractiveConsole
          visible={visible}
          onToggle={setVisible}
          serverUrl={`${baseUrl}${jsonRpcUrl}`}
          height={height}
          theme={theme}
          animationSpeed={animationSpeed}
        />
      )}
    </ConsoleContext.Provider>
  );
};

export const useConsole = (): ConsoleContextType => {
  const context = useContext(ConsoleContext);
  if (!context) {
    throw new Error('useConsole must be used within a ConsoleProvider');
  }
  return context;
};

export default ConsoleProvider;