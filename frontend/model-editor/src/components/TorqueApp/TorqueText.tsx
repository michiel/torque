import React, { memo } from 'react'
import { Text, Title, Box } from '@mantine/core'

interface TorqueTextProps {
  id: string
  properties: {
    content?: string
    variant?: 'text' | 'title' | 'subtitle'
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    weight?: number
    color?: string
    align?: 'left' | 'center' | 'right'
  }
}

export const TorqueText = memo(function TorqueText({
  id,
  properties
}: TorqueTextProps) {
  const {
    content = 'Sample text content',
    variant = 'text',
    size = 'md',
    weight,
    color,
    align = 'left'
  } = properties

  const commonProps = {
    size: variant === 'title' ? 'lg' : size,
    fw: weight,
    c: color,
    ta: align as any
  }

  if (variant === 'title') {
    return (
      <Title order={2} {...commonProps}>
        {content}
      </Title>
    )
  }

  if (variant === 'subtitle') {
    return (
      <Title order={4} {...commonProps}>
        {content}
      </Title>
    )
  }

  return (
    <Text {...commonProps}>
      {content}
    </Text>
  )
})