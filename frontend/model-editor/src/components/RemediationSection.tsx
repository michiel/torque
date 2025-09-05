import React, { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import {
  Stack,
  Text,
  Button,
  Group,
  Alert,
  Badge,
  Loader,
  Card,
  ActionIcon,
  Tooltip,
  Modal,
  TextInput,
  Select,
  NumberInput,
  Checkbox,
  JsonInput,
} from '@mantine/core'
import {
  IconWand,
  IconAlertTriangle,
  IconCheck,
  IconSettings,
  IconRefresh,
  IconClock,
  IconShieldX,
  IconShieldCheck,
  IconInfoCircle,
} from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { GET_REMEDIATION_STRATEGIES, EXECUTE_AUTO_REMEDIATION, VERIFY_MODEL } from '../graphql/queries'

interface RemediationStrategy {
  id: string
  errorType: string
  strategyType: string
  title: string
  description: string
  parameters: {
    name: string
    description: string
    parameterType: string
    required: boolean
    defaultValue: any
    validation?: string
  }[]
  estimatedEffort: 'LOW' | 'MEDIUM' | 'HIGH' | 'COMPLEX'
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  prerequisites: string[]
}

interface RemediationSectionProps {
  error: any // The error object containing type and parameters
  modelId: string
  isAutoFixable: boolean
  onRemediationComplete?: () => void
}

const getRiskColor = (risk: string) => {
  switch (risk) {
    case 'LOW':
      return 'green'
    case 'MEDIUM':
      return 'yellow'
    case 'HIGH':
      return 'red'
    default:
      return 'gray'
  }
}

const getEffortColor = (effort: string) => {
  switch (effort) {
    case 'LOW':
      return 'green'
    case 'MEDIUM':
      return 'yellow'
    case 'HIGH':
      return 'orange'
    case 'COMPLEX':
      return 'red'
    default:
      return 'gray'
  }
}

const getRiskIcon = (risk: string) => {
  switch (risk) {
    case 'LOW':
      return <IconShieldCheck size={14} />
    case 'MEDIUM':
      return <IconInfoCircle size={14} />
    case 'HIGH':
      return <IconShieldX size={14} />
    default:
      return <IconInfoCircle size={14} />
  }
}

export function RemediationSection({ error, modelId, isAutoFixable, onRemediationComplete }: RemediationSectionProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<RemediationStrategy | null>(null)
  const [showParameterModal, setShowParameterModal] = useState(false)
  const [parameters, setParameters] = useState<{ [key: string]: any }>({})

  // Extract error type and parameters from the error object
  const errorType = error ? Object.keys(error)[0] : null
  const errorParameters = error && errorType ? error[errorType] : null

  // Query to get available remediation strategies
  const { data: strategiesData, loading: strategiesLoading, error: strategiesError } = useQuery(GET_REMEDIATION_STRATEGIES, {
    variables: { 
      input: {
        modelId,
        errorType,
        errorParameters
      }
    },
    skip: !isAutoFixable || !errorType || !errorParameters,
    errorPolicy: 'all',
  })

  // Mutation to execute auto-remediation
  const [executeRemediation, { loading: executingRemediation }] = useMutation(EXECUTE_AUTO_REMEDIATION, {
    refetchQueries: [{ query: VERIFY_MODEL, variables: { modelId } }],
    onCompleted: (data) => {
      const result = data.executeAutoRemediation
      if (result.success) {
        notifications.show({
          title: 'Auto-remediation successful',
          message: `Applied ${result.changesApplied.length} change(s) to fix the error`,
          color: 'green',
          icon: <IconCheck size={16} />,
        })
        setShowParameterModal(false)
        setSelectedStrategy(null)
        onRemediationComplete?.()
      } else {
        notifications.show({
          title: 'Auto-remediation failed',
          message: result.errors.join(', ') || 'Unknown error occurred',
          color: 'red',
          icon: <IconAlertTriangle size={16} />,
        })
      }
    },
    onError: (error) => {
      notifications.show({
        title: 'Auto-remediation failed',
        message: error.message,
        color: 'red',
        icon: <IconAlertTriangle size={16} />,
      })
    },
  })

  if (!isAutoFixable) {
    return null
  }

  if (strategiesLoading) {
    return (
      <Alert icon={<Loader size={16} />} color="blue">
        <Text size="sm">Loading remediation options...</Text>
      </Alert>
    )
  }

  if (strategiesError) {
    return (
      <Alert icon={<IconAlertTriangle size={16} />} color="red">
        <Text size="sm">Failed to load remediation options: {strategiesError.message}</Text>
      </Alert>
    )
  }

  const strategies: RemediationStrategy[] = strategiesData?.getRemediationStrategies || []

  if (strategies.length === 0) {
    return (
      <Alert icon={<IconInfoCircle size={16} />} color="yellow">
        <Text size="sm">No auto-remediation strategies available for this error</Text>
      </Alert>
    )
  }

  const handleStrategySelect = (strategy: RemediationStrategy) => {
    setSelectedStrategy(strategy)
    
    // Initialize parameters with default values
    const initialParams: { [key: string]: any } = {}
    strategy.parameters.forEach(param => {
      if (param.defaultValue !== null && param.defaultValue !== undefined) {
        initialParams[param.name] = param.defaultValue
      }
    })
    setParameters(initialParams)

    // If strategy has no parameters, execute immediately
    if (strategy.parameters.length === 0) {
      executeRemediation({
        variables: {
          input: {
            modelId,
            errorType,
            errorParameters,
            strategyType: strategy.strategyType,
            parameters: [],
          },
        },
      })
    } else {
      setShowParameterModal(true)
    }
  }

  const handleExecuteWithParameters = () => {
    if (!selectedStrategy) return

    const parameterInputs = selectedStrategy.parameters.map(param => ({
      name: param.name,
      value: parameters[param.name] || param.defaultValue,
    }))

    executeRemediation({
      variables: {
        input: {
          modelId,
          errorType,
          errorParameters,
          strategyType: selectedStrategy.strategyType,
          parameters: parameterInputs,
        },
      },
    })
  }

  const renderParameterInput = (parameter: any) => {
    const { name, description, parameterType, required, defaultValue } = parameter

    switch (parameterType) {
      case 'String':
        return (
          <TextInput
            key={name}
            label={name}
            description={description}
            required={required}
            value={parameters[name] || defaultValue || ''}
            onChange={(event) => setParameters(prev => ({ ...prev, [name]: event.currentTarget.value }))}
          />
        )
      case 'Integer':
        return (
          <NumberInput
            key={name}
            label={name}
            description={description}
            required={required}
            value={parameters[name] || defaultValue || 0}
            onChange={(value) => setParameters(prev => ({ ...prev, [name]: value }))}
          />
        )
      case 'Boolean':
        return (
          <Checkbox
            key={name}
            label={name}
            description={description}
            checked={parameters[name] || defaultValue || false}
            onChange={(event) => setParameters(prev => ({ ...prev, [name]: event.currentTarget.checked }))}
          />
        )
      case 'Select':
        // For select parameters, we'd need to parse the options from the parameter type
        return (
          <Select
            key={name}
            label={name}
            description={description}
            required={required}
            value={parameters[name] || defaultValue}
            onChange={(value) => setParameters(prev => ({ ...prev, [name]: value }))}
            data={[
              { value: 'String', label: 'Text' },
              { value: 'Integer', label: 'Number' },
              { value: 'Boolean', label: 'True/False' },
              { value: 'DateTime', label: 'Date & Time' },
            ]}
          />
        )
      default:
        return (
          <JsonInput
            key={name}
            label={name}
            description={description}
            required={required}
            value={JSON.stringify(parameters[name] || defaultValue || null, null, 2)}
            onChange={(value) => {
              try {
                setParameters(prev => ({ ...prev, [name]: JSON.parse(value) }))
              } catch (e) {
                // Invalid JSON, ignore
              }
            }}
          />
        )
    }
  }

  return (
    <>
      <Stack gap="xs">
        <Text size="sm" fw={500} c="dimmed">
          🪄 Auto-Remediation Options:
        </Text>
        {strategies.map((strategy) => (
          <Card key={strategy.id} withBorder padding="sm" radius="sm">
            <Stack gap="xs">
              <Group justify="space-between" align="flex-start">
                <Stack gap={4} style={{ flex: 1 }}>
                  <Group gap="xs" align="center">
                    <Text size="sm" fw={500}>{strategy.title}</Text>
                    <Badge color={getRiskColor(strategy.riskLevel)} size="xs" leftSection={getRiskIcon(strategy.riskLevel)}>
                      {strategy.riskLevel} Risk
                    </Badge>
                    <Badge color={getEffortColor(strategy.estimatedEffort)} size="xs" leftSection={<IconClock size={12} />}>
                      {strategy.estimatedEffort} Effort
                    </Badge>
                  </Group>
                  <Text size="xs" c="dimmed">{strategy.description}</Text>
                  {strategy.prerequisites.length > 0 && (
                    <Text size="xs" c="orange">
                      Prerequisites: {strategy.prerequisites.join(', ')}
                    </Text>
                  )}
                </Stack>
                <Group gap="xs">
                  {strategy.parameters.length > 0 && (
                    <Tooltip label="Requires parameters">
                      <ActionIcon size="sm" variant="subtle">
                        <IconSettings size={14} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                  <Button
                    size="xs"
                    variant="light"
                    color="blue"
                    leftSection={<IconWand size={14} />}
                    onClick={() => handleStrategySelect(strategy)}
                    loading={executingRemediation && selectedStrategy?.id === strategy.id}
                  >
                    Apply Fix
                  </Button>
                </Group>
              </Group>
            </Stack>
          </Card>
        ))}
      </Stack>

      {/* Parameter Configuration Modal */}
      <Modal
        opened={showParameterModal}
        onClose={() => setShowParameterModal(false)}
        title={`Configure ${selectedStrategy?.title}`}
        size="md"
      >
        {selectedStrategy && (
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              {selectedStrategy.description}
            </Text>
            
            {selectedStrategy.parameters.length > 0 && (
              <Stack gap="sm">
                <Text size="sm" fw={500}>Parameters:</Text>
                {selectedStrategy.parameters.map(renderParameterInput)}
              </Stack>
            )}

            <Group justify="flex-end" gap="sm">
              <Button variant="subtle" onClick={() => setShowParameterModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleExecuteWithParameters}
                loading={executingRemediation}
                leftSection={<IconWand size={16} />}
              >
                Execute Remediation
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </>
  )
}