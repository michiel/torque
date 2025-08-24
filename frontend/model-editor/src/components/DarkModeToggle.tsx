import React from 'react'
import { ActionIcon, Tooltip } from '@mantine/core'
import { IconSun, IconMoon } from '@tabler/icons-react'
import { useDarkMode } from '../providers/DarkModeProvider'

export function DarkModeToggle() {
  const { isDarkMode, toggleDarkMode } = useDarkMode()

  return (
    <Tooltip label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'} position="bottom">
      <ActionIcon
        variant="subtle"
        size="md"
        onClick={toggleDarkMode}
        aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDarkMode ? <IconSun size={16} /> : <IconMoon size={16} />}
      </ActionIcon>
    </Tooltip>
  )
}