import React from 'react'
import { Box, Container as MantineContainer } from '@mantine/core'

interface ContainerProps {
  id: string
  children?: React.ReactNode
  maxWidth?: string | number
  padding?: string | number
  margin?: string | number
  backgroundColor?: string
  borderRadius?: string | number
  border?: string
  shadow?: string
  minHeight?: string | number
}

export function Container({
  id,
  children,
  maxWidth,
  padding = 'md',
  margin,
  backgroundColor,
  borderRadius,
  border,
  shadow,
  minHeight
}: ContainerProps) {
  const hasCustomStyling = backgroundColor || borderRadius || border || shadow || minHeight

  if (hasCustomStyling) {
    return (
      <Box
        maw={maxWidth}
        p={padding}
        m={margin}
        bg={backgroundColor}
        style={{
          borderRadius,
          border,
          boxShadow: shadow,
          minHeight
        }}
        data-component-id={id}
      >
        {children}
      </Box>
    )
  }

  return (
    <MantineContainer
      size={maxWidth}
      p={padding}
      m={margin}
      data-component-id={id}
    >
      {children}
    </MantineContainer>
  )
}