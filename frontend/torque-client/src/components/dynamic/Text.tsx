import { Title, Text as MantineText } from '@mantine/core'

interface TextProps {
  id: string
  text: string
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'caption' | 'subtitle'
  color?: string
  align?: 'left' | 'center' | 'right' | 'justify'
  weight?: number | 'normal' | 'bold'
  size?: string | number
}

export function Text({
  id,
  text,
  variant = 'body',
  color,
  align = 'left',
  weight,
  size
}: TextProps) {
  const isHeading = variant.startsWith('h')
  
  if (isHeading) {
    const order = parseInt(variant.slice(1)) as 1 | 2 | 3 | 4 | 5 | 6
    
    return (
      <Title
        order={order}
        c={color}
        ta={align}
        fw={weight}
        fz={typeof size === 'string' ? size : undefined}
        data-component-id={id}
      >
        {text}
      </Title>
    )
  }

  const getMantineSize = () => {
    switch (variant) {
      case 'caption':
        return 'xs'
      case 'subtitle':
        return 'lg'
      default:
        return (typeof size === 'string' ? size : undefined) || 'md'
    }
  }

  const getMantineWeight = () => {
    switch (variant) {
      case 'subtitle':
        return weight || 600
      default:
        return weight
    }
  }

  return (
    <MantineText
      size={getMantineSize()}
      c={color}
      ta={align}
      fw={getMantineWeight()}
      data-component-id={id}
    >
      {text}
    </MantineText>
  )
}