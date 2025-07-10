import { Button } from '@mantine/core'

interface TorqueButtonProps {
  id: string
  text: string
  variant?: 'primary' | 'secondary' | 'danger' | 'outline'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  disabled?: boolean
  action?: {
    type: string
    modalType?: string
    entityName?: string
    entityId?: string
    navigateTo?: string
    [key: string]: any
  }
  onAction?: (action: any) => void
}

export function TorqueButton({
  id,
  text,
  variant = 'primary',
  size = 'md',
  disabled = false,
  action,
  onAction
}: TorqueButtonProps) {
  const handleClick = () => {
    if (action && onAction) {
      onAction(action)
    }
  }

  // Map TorqueApp variants to Mantine variants
  const getMantineVariant = (variant: string) => {
    switch (variant) {
      case 'primary':
        return 'filled'
      case 'secondary':
        return 'light'
      case 'danger':
        return 'filled'
      case 'outline':
        return 'outline'
      default:
        return 'filled'
    }
  }

  // Map TorqueApp variants to Mantine colors
  const getMantineColor = (variant: string) => {
    switch (variant) {
      case 'danger':
        return 'red'
      default:
        return 'blue'
    }
  }

  return (
    <Button
      variant={getMantineVariant(variant)}
      color={getMantineColor(variant)}
      size={size}
      disabled={disabled}
      onClick={handleClick}
      data-component-id={id}
    >
      {text}
    </Button>
  )
}