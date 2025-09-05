import React from 'react'
import { Group, Badge, Text, ActionIcon, Loader } from '@mantine/core'
import { IconCheck, IconAlertTriangle } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { VERIFY_MODEL } from '../graphql/queries'

interface ModelVerificationStatusProps {
  modelId: string
  modelName: string
}

interface VerificationSummary {
  totalErrors: number
  errorsBySeverity: {
    critical: number
    high: number
    medium: number
    low: number
  }
}

export function ModelVerificationStatus({ modelId, modelName }: ModelVerificationStatusProps) {
  const navigate = useNavigate()
  
  const { data, loading, error } = useQuery(VERIFY_MODEL, {
    variables: { modelId },
    errorPolicy: 'all',
    pollInterval: 30000, // Refresh every 30 seconds
  })

  const handleClick = () => {
    navigate(`/models/${modelId}/verification`)
  }

  const getVerificationStatus = (): {
    color: string
    icon: React.ReactNode
    text: string
    severity?: 'critical' | 'high' | 'medium' | 'low'
  } => {
    if (loading) {
      return {
        color: 'gray',
        icon: <Loader size={14} />,
        text: 'Checking...'
      }
    }

    if (error || !data?.verifyModel) {
      return {
        color: 'gray',
        icon: <IconAlertTriangle size={14} />,
        text: 'Unknown'
      }
    }

    const summary: VerificationSummary = data.verifyModel
    const { totalErrors, errorsBySeverity } = summary

    if (totalErrors === 0) {
      return {
        color: 'green',
        icon: <IconCheck size={14} />,
        text: 'OK'
      }
    }

    // Determine severity level based on highest severity errors
    if (errorsBySeverity.critical > 0) {
      return {
        color: 'red',
        icon: <IconAlertTriangle size={14} />,
        text: `${totalErrors}`,
        severity: 'critical'
      }
    }

    if (errorsBySeverity.high > 0) {
      return {
        color: 'orange',
        icon: <IconAlertTriangle size={14} />,
        text: `${totalErrors}`,
        severity: 'high'
      }
    }

    if (errorsBySeverity.medium > 0) {
      return {
        color: 'yellow',
        icon: <IconAlertTriangle size={14} />,
        text: `${totalErrors}`,
        severity: 'medium'
      }
    }

    // Only low severity errors
    return {
      color: 'blue',
      icon: <IconAlertTriangle size={14} />,
      text: `${totalErrors}`,
      severity: 'low'
    }
  }

  const status = getVerificationStatus()

  return (
    <Group gap="xs" align="center">
      {/* Model name */}
      <Text size="sm" fw={500} c="dimmed">
        {modelName}
      </Text>
      
      {/* Verification status badge - styled like the "Live" badge */}
      <Badge
        variant="light"
        color={status.color}
        size="sm"
        style={{ 
          cursor: 'pointer',
          textTransform: 'none',
        }}
        onClick={handleClick}
        title={`Model verification status: ${status.text}${status.severity ? ` (${status.severity} severity)` : ''}`}
        leftSection={status.icon}
      >
        {status.text}
      </Badge>
    </Group>
  )
}