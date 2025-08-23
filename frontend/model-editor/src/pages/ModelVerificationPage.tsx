import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import {
  Container,
  Paper,
  Title,
  Text,
  Stack,
  Group,
  Button,
  Alert,
  Loader,
  Badge,
  ActionIcon,
  Divider,
  SimpleGrid,
  Card,
  Box,
  ScrollArea,
  Tooltip,
} from '@mantine/core'
import { 
  IconArrowLeft, 
  IconAlertTriangle, 
  IconAlertCircle, 
  IconInfoCircle,
  IconBulb,
  IconChevronDown,
  IconChevronUp,
  IconBug,
  IconShieldCheck,
  IconClock,
  IconRefresh
} from '@tabler/icons-react'
import { useState } from 'react'
import { notifications } from '@mantine/notifications'
import { VERIFY_MODEL, GET_MODEL } from '../graphql/queries'
import { RemediationSection } from '../components/RemediationSection'

interface ConfigurationError {
  id: string
  error: any
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  category: 'DATA_MODEL' | 'USER_INTERFACE' | 'BUSINESS_LOGIC' | 'INTEGRATION' | 'PERFORMANCE' | 'SECURITY'
  title: string
  description: string
  impact: any
  location: {
    componentType: string
    componentId: string
    componentName: string
    path: string[]
    fileReference?: string
  }
  suggestedFixes: string[]
  autoFixable: boolean
}

interface ErrorSuggestion {
  title: string
  description: string
  actionType: string
  affectedErrors: string[]
  estimatedEffort: 'LOW' | 'MEDIUM' | 'HIGH' | 'COMPLEX'
}

interface VerificationReport {
  modelId: string
  modelName: string
  generatedAt: string
  totalErrors: number
  errorsBySeverity: {
    critical: number
    high: number
    medium: number
    low: number
  }
  errors: ConfigurationError[]
  suggestions: ErrorSuggestion[]
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'CRITICAL':
      return 'red'
    case 'HIGH':
      return 'orange'
    case 'MEDIUM':
      return 'yellow'
    case 'LOW':
      return 'blue'
    default:
      return 'gray'
  }
}

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'CRITICAL':
      return <IconAlertTriangle size={18} />
    case 'HIGH':
      return <IconAlertCircle size={18} />
    case 'MEDIUM':
      return <IconInfoCircle size={18} />
    case 'LOW':
      return <IconBulb size={18} />
    default:
      return <IconInfoCircle size={18} />
  }
}

const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'DATA_MODEL':
      return 'Data Model'
    case 'USER_INTERFACE':
      return 'User Interface'
    case 'BUSINESS_LOGIC':
      return 'Business Logic'
    case 'INTEGRATION':
      return 'Integration'
    case 'PERFORMANCE':
      return 'Performance'
    case 'SECURITY':
      return 'Security'
    default:
      return category
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

const ErrorCard = ({ error, isExpanded, onToggle, modelId, onRemediationComplete }: { 
  error: ConfigurationError
  isExpanded: boolean
  onToggle: () => void
  modelId: string
  onRemediationComplete?: () => void
}) => {
  return (
    <Card withBorder shadow="sm" radius="md">
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start">
          <Group gap="sm" align="flex-start">
            <Box mt={2}>
              {getSeverityIcon(error.severity)}
            </Box>
            <Stack gap="xs" style={{ flex: 1 }}>
              <Group gap="xs" align="center">
                <Text fw={600} size="sm">
                  {error.title}
                </Text>
                <Badge 
                  color={getSeverityColor(error.severity)} 
                  size="xs" 
                  variant="filled"
                >
                  {error.severity}
                </Badge>
                <Badge variant="light" size="xs">
                  {getCategoryLabel(error.category)}
                </Badge>
                {error.autoFixable && (
                  <Badge color="green" size="xs" variant="outline">
                    Auto-fixable
                  </Badge>
                )}
              </Group>
              <Text size="sm" c="dimmed">
                {error.description}
              </Text>
              <Group gap="xs" c="dimmed" style={{ fontSize: '12px' }}>
                <Text size="xs">
                  {error.location.componentType}: {error.location.componentName}
                </Text>
                <Text size="xs">•</Text>
                <Text size="xs">
                  {error.location.path.join(' > ')}
                </Text>
              </Group>
            </Stack>
          </Group>
          <ActionIcon
            variant="subtle"
            size="sm"
            onClick={onToggle}
          >
            {isExpanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
          </ActionIcon>
        </Group>

        {isExpanded && (
          <>
            <Divider />
            
            {/* Auto-remediation section for auto-fixable errors */}
            {error.autoFixable && (
              <RemediationSection
                error={error.error}
                modelId={modelId}
                isAutoFixable={error.autoFixable}
                onRemediationComplete={onRemediationComplete}
              />
            )}
            
            {/* Manual suggested fixes */}
            {error.suggestedFixes.length > 0 && (
              <Stack gap="xs">
                <Text size="sm" fw={500} c="dimmed">
                  💡 Suggested Fixes:
                </Text>
                {error.suggestedFixes.map((fix, index) => (
                  <Text key={index} size="sm" pl="md" style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '0', color: 'var(--mantine-color-dimmed)' }}>
                      •
                    </span>
                    {fix}
                  </Text>
                ))}
              </Stack>
            )}
          </>
        )}
      </Stack>
    </Card>
  )
}

export function ModelVerificationPage() {
  const { id: modelId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set())

  // Get model name for display
  const { data: modelData } = useQuery(GET_MODEL, {
    variables: { id: modelId },
    skip: !modelId,
  })

  // Verify model query
  const { data, loading, error, refetch } = useQuery(VERIFY_MODEL, {
    variables: { modelId },
    skip: !modelId,
    errorPolicy: 'all', // Don't throw errors, handle them gracefully
    onError: (error) => {
      console.warn('Verification query failed:', error.message)
      // Don't show notification for network errors - we'll show mock data instead
    },
  })

  const model = modelData?.model

  // Get report data or use mock data for demonstration
  const report: VerificationReport | null = (() => {
    // If we have real data from the query, use it
    if (data?.verifyModel) {
      return data.verifyModel
    }
    
    // If there's an error (likely network/backend unavailable), show mock data
    if (error) {
      return {
        modelId: modelId || 'demo-model',
        modelName: model?.name || 'Demo Model',
        generatedAt: new Date().toISOString(),
        totalErrors: 3,
        errorsBySeverity: {
          critical: 1,
          high: 1,
          medium: 1,
          low: 0,
        },
        errors: [
          {
            id: 'error-1',
            error: {},
            severity: 'CRITICAL' as const,
            category: 'DATA_MODEL' as const,
            title: 'Missing start page layout',
            description: 'The model has a start page configured, but the referenced layout does not exist.',
            impact: {},
            location: {
              componentType: 'Model Configuration',
              componentId: 'model-config',
              componentName: 'Start Page Setting',
              path: ['Model', 'Configuration', 'Start Page'],
              fileReference: undefined,
            },
            suggestedFixes: [
              'Create a layout with the referenced ID',
              'Update the start page configuration to point to an existing layout',
              'Remove the start page configuration to use the default home page',
            ],
            autoFixable: false,
          },
          {
            id: 'error-2',
            error: {},
            severity: 'HIGH' as const,
            category: 'USER_INTERFACE' as const,
            title: 'DataGrid references deleted entity',
            description: 'A DataGrid component in the "Dashboard" layout references an entity that no longer exists.',
            impact: {},
            location: {
              componentType: 'DataGrid',
              componentId: 'grid-projects',
              componentName: 'Projects Grid',
              path: ['Model', 'Layouts', 'Dashboard', 'Components'],
            },
            suggestedFixes: [
              'Update the DataGrid to reference an existing entity',
              'Remove the DataGrid component from the layout',
              'Create the missing entity "projects"',
            ],
            autoFixable: true,
          },
          {
            id: 'error-3',
            error: {},
            severity: 'MEDIUM' as const,
            category: 'DATA_MODEL' as const,
            title: 'Invalid relationship field',
            description: 'Relationship "user_projects" references field "user_id" which does not exist in the target entity.',
            impact: {},
            location: {
              componentType: 'Relationship',
              componentId: 'rel-user-projects',
              componentName: 'User Projects',
              path: ['Model', 'Relationships'],
            },
            suggestedFixes: [
              'Add the missing field "user_id" to the target entity',
              'Update the relationship to use an existing field',
              'Remove the invalid relationship',
            ],
            autoFixable: false,
          },
        ],
        suggestions: [
          {
            title: 'Fix missing entity references',
            description: 'Create or update entity references in 2 components to restore functionality',
            actionType: 'CREATE_MISSING_ENTITY',
            affectedErrors: ['error-1', 'error-2'],
            estimatedEffort: 'MEDIUM' as const,
          },
        ],
      }
    }
    
    // No data and no error - return null
    return null
  })()

  const toggleErrorExpansion = (errorId: string) => {
    const newExpanded = new Set(expandedErrors)
    if (newExpanded.has(errorId)) {
      newExpanded.delete(errorId)
    } else {
      newExpanded.add(errorId)
    }
    setExpandedErrors(newExpanded)
  }

  const handleRemediationComplete = () => {
    // Refetch verification data to get updated error list
    refetch()
  }

  const handleRefresh = () => {
    refetch()
  }

  const handleBack = () => {
    navigate(`/models/${modelId}`)
  }

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text>Verifying model configuration...</Text>
        </Stack>
      </Container>
    )
  }

  // Show error only for non-network errors, otherwise show mock data
  if (error && !error.message.includes('fetch') && !error.message.includes('NetworkError') && !report) {
    return (
      <Container size="xl" py="xl">
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Verification Error"
          color="red"
          variant="filled"
        >
          {error.message}
          <Group mt="md">
            <Button variant="white" size="sm" onClick={handleRefresh}>
              Try Again
            </Button>
            <Button variant="white" size="sm" onClick={handleBack}>
              Go Back
            </Button>
          </Group>
        </Alert>
      </Container>
    )
  }

  if (!report) {
    return (
      <Container size="xl" py="xl">
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="No Verification Data"
          color="orange"
        >
          Unable to load verification report for this model.
        </Alert>
      </Container>
    )
  }

  const hasErrors = report.totalErrors > 0

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Demo Data Notice */}
        {error && (
          <Alert
            icon={<IconInfoCircle size={16} />}
            title="Demo Mode"
            color="blue"
            variant="light"
          >
            Backend server not available. Showing demo verification data to demonstrate the UI.
          </Alert>
        )}

        {/* Header */}
        <Group justify="space-between">
          <Group>
            <ActionIcon
              variant="subtle"
              onClick={handleBack}
              size="lg"
              aria-label="Go back"
            >
              <IconArrowLeft size={20} />
            </ActionIcon>
            <Stack gap="xs">
              <Title order={2}>Model Verification</Title>
              <Text c="dimmed">
                {model?.name || report.modelName} • Generated {new Date(report.generatedAt).toLocaleString()}
              </Text>
            </Stack>
          </Group>
          <Button
            leftSection={<IconRefresh size={16} />}
            variant="light"
            onClick={handleRefresh}
          >
            Refresh
          </Button>
        </Group>

        {/* Summary */}
        <Paper shadow="sm" p="xl" withBorder>
          {!hasErrors ? (
            <Group>
              <IconShieldCheck size={48} color="var(--mantine-color-green-6)" />
              <Stack gap="xs">
                <Title order={3} c="green">
                  ✅ No Configuration Issues Found
                </Title>
                <Text c="dimmed">
                  Your model configuration looks great! All components, entities, and relationships are properly configured.
                </Text>
              </Stack>
            </Group>
          ) : (
            <Stack gap="md">
              <Group>
                <IconBug size={32} color="var(--mantine-color-red-6)" />
                <Stack gap="xs">
                  <Title order={3}>
                    {report.totalErrors} Configuration Issues Found
                  </Title>
                  <Text c="dimmed">
                    Review the issues below to ensure your model functions correctly.
                  </Text>
                </Stack>
              </Group>

              <SimpleGrid cols={4} spacing="md">
                <Card withBorder padding="md">
                  <Stack gap="xs" align="center">
                    <IconAlertTriangle size={24} color="var(--mantine-color-red-6)" />
                    <Text fw={700} size="xl">
                      {report.errorsBySeverity.critical}
                    </Text>
                    <Text size="sm" c="dimmed">
                      Critical
                    </Text>
                  </Stack>
                </Card>
                <Card withBorder padding="md">
                  <Stack gap="xs" align="center">
                    <IconAlertCircle size={24} color="var(--mantine-color-orange-6)" />
                    <Text fw={700} size="xl">
                      {report.errorsBySeverity.high}
                    </Text>
                    <Text size="sm" c="dimmed">
                      High
                    </Text>
                  </Stack>
                </Card>
                <Card withBorder padding="md">
                  <Stack gap="xs" align="center">
                    <IconInfoCircle size={24} color="var(--mantine-color-yellow-6)" />
                    <Text fw={700} size="xl">
                      {report.errorsBySeverity.medium}
                    </Text>
                    <Text size="sm" c="dimmed">
                      Medium
                    </Text>
                  </Stack>
                </Card>
                <Card withBorder padding="md">
                  <Stack gap="xs" align="center">
                    <IconBulb size={24} color="var(--mantine-color-blue-6)" />
                    <Text fw={700} size="xl">
                      {report.errorsBySeverity.low}
                    </Text>
                    <Text size="sm" c="dimmed">
                      Low
                    </Text>
                  </Stack>
                </Card>
              </SimpleGrid>
            </Stack>
          )}
        </Paper>

        {/* Errors List */}
        {hasErrors && (
          <Stack gap="md">
            <Group justify="space-between">
              <Title order={3}>Issues Found</Title>
              <Group gap="xs">
                <Button
                  size="xs"
                  variant="light"
                  onClick={() => setExpandedErrors(new Set(report.errors.map(e => e.id)))}
                >
                  Expand All
                </Button>
                <Button
                  size="xs"
                  variant="light"
                  onClick={() => setExpandedErrors(new Set())}
                >
                  Collapse All
                </Button>
              </Group>
            </Group>

            <Stack gap="sm">
              {report.errors.map((error) => (
                <ErrorCard
                  key={error.id}
                  error={error}
                  isExpanded={expandedErrors.has(error.id)}
                  onToggle={() => toggleErrorExpansion(error.id)}
                  modelId={modelId || ''}
                  onRemediationComplete={handleRemediationComplete}
                />
              ))}
            </Stack>
          </Stack>
        )}

        {/* Suggestions */}
        {report.suggestions.length > 0 && (
          <Stack gap="md">
            <Title order={3}>Recommended Actions</Title>
            <Stack gap="sm">
              {report.suggestions.map((suggestion, index) => (
                <Card key={index} withBorder shadow="sm" radius="md">
                  <Stack gap="sm">
                    <Group justify="space-between">
                      <Group gap="sm">
                        <IconBulb size={20} color="var(--mantine-color-blue-6)" />
                        <Text fw={600} size="sm">
                          {suggestion.title}
                        </Text>
                      </Group>
                      <Badge color={getEffortColor(suggestion.estimatedEffort)} size="xs">
                        {suggestion.estimatedEffort} effort
                      </Badge>
                    </Group>
                    <Text size="sm" c="dimmed" pl="md">
                      {suggestion.description}
                    </Text>
                    {suggestion.affectedErrors.length > 0 && (
                      <Text size="xs" c="dimmed" pl="md">
                        Affects {suggestion.affectedErrors.length} error(s)
                      </Text>
                    )}
                  </Stack>
                </Card>
              ))}
            </Stack>
          </Stack>
        )}
      </Stack>
    </Container>
  )
}