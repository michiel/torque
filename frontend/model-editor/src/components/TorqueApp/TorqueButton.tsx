import React, { memo } from 'react'
import { Button } from '@mantine/core'

interface TorqueButtonProps {
  id: string
  properties: {
    label?: string
    variant?: 'filled' | 'outline' | 'subtle' | 'light'
    color?: string
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    disabled?: boolean
    action?: {
      type: string
      [key: string]: any
    }
  }
  onAction?: (action: any) => void
}

export const TorqueButton = memo(function TorqueButton({
  id,
  properties,
  onAction
}: TorqueButtonProps) {
  const {
    label = 'Button',
    variant = 'filled',
    color = 'blue',
    size = 'md',
    disabled = false,
    action
  } = properties

  const handleClick = () => {
    if (action && onAction) {
      onAction({
        ...action,
        componentId: id
      })
    } else {
      console.log('Button clicked:', id)
    }
  }

  return (
    <Button
      variant={variant}
      color={color}
      size={size}
      disabled={disabled}
      onClick={handleClick}
    >
      {label}
    </Button>
  )
})