import React from 'react'
import { Modal as MantineModal } from '@mantine/core'

interface ModalProps {
  id: string
  opened: boolean
  onClose: () => void
  title?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full' | string | number
  centered?: boolean
  overlayProps?: any
  children?: React.ReactNode
}

export function Modal({
  id,
  opened,
  onClose,
  title,
  size = 'md',
  centered = false,
  overlayProps,
  children
}: ModalProps) {
  return (
    <MantineModal
      opened={opened}
      onClose={onClose}
      title={title}
      size={size}
      centered={centered}
      overlayProps={overlayProps}
      data-component-id={id}
    >
      {children}
    </MantineModal>
  )
}