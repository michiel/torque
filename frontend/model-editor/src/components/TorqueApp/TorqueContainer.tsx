import React, { memo } from 'react'
import { Box, Paper } from '@mantine/core'

interface TorqueContainerProps {
  id: string
  properties: {
    title?: string
    background?: string
    padding?: number
    border?: boolean
    shadow?: boolean
    children?: React.ReactNode
  }
}

export const TorqueContainer = memo(function TorqueContainer({
  id,
  properties
}: TorqueContainerProps) {
  const {
    title,
    background,
    padding = 16,
    border = true,
    shadow = false,
    children
  } = properties

  const containerContent = (
    <Box p={padding}>
      {title && (
        <Box mb="md">
          <strong>{title}</strong>
        </Box>
      )}
      {children || (
        <Box c="dimmed" fs="italic">
          Container content area
        </Box>
      )}
    </Box>
  )

  if (border || shadow) {
    return (
      <Paper
        withBorder={border}
        shadow={shadow ? 'sm' : undefined}
        style={{ background, height: '100%' }}
      >
        {containerContent}
      </Paper>
    )
  }

  return (
    <Box style={{ background, height: '100%' }}>
      {containerContent}
    </Box>
  )
})