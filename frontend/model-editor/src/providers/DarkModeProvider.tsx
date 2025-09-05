import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useMantineColorScheme } from '@mantine/core'

interface DarkModeContextType {
  isDarkMode: boolean
  toggleDarkMode: () => void
}

const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined)

interface DarkModeProviderProps {
  children: ReactNode
}

export function DarkModeProvider({ children }: DarkModeProviderProps) {
  const { colorScheme, setColorScheme } = useMantineColorScheme()
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Initialize dark mode state from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('torque-dark-mode')
    if (savedTheme !== null) {
      const dark = savedTheme === 'true'
      setIsDarkMode(dark)
      setColorScheme(dark ? 'dark' : 'light')
      document.documentElement.setAttribute('data-mantine-color-scheme', dark ? 'dark' : 'light')
    } else {
      // Check system preference
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      setIsDarkMode(prefersDark)
      setColorScheme(prefersDark ? 'dark' : 'light')
      document.documentElement.setAttribute('data-mantine-color-scheme', prefersDark ? 'dark' : 'light')
    }
  }, [setColorScheme])

  // Sync with Mantine color scheme changes
  useEffect(() => {
    setIsDarkMode(colorScheme === 'dark')
  }, [colorScheme])

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)
    setColorScheme(newDarkMode ? 'dark' : 'light')
    localStorage.setItem('torque-dark-mode', String(newDarkMode))
    
    // Update document attribute to prevent flash
    document.documentElement.setAttribute(
      'data-mantine-color-scheme', 
      newDarkMode ? 'dark' : 'light'
    )
  }

  const value = {
    isDarkMode,
    toggleDarkMode,
  }

  return (
    <DarkModeContext.Provider value={value}>
      {children}
    </DarkModeContext.Provider>
  )
}

export function useDarkMode() {
  const context = useContext(DarkModeContext)
  if (context === undefined) {
    throw new Error('useDarkMode must be used within a DarkModeProvider')
  }
  return context
}