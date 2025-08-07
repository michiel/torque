import { useState, useEffect } from 'react'
import {
  Modal,
  Stack,
  TextInput,
  Textarea,
  Switch,
  Button,
  Group,
  Card,
  Text,
  SimpleGrid,
  Badge,
  ActionIcon,
  Collapse,
  Alert,
  Stepper,
  Divider,
  Title
} from '@mantine/core'
import {
  IconFolder,
  IconTemplate,
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconInfoCircle
} from '@tabler/icons-react'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { invoke } from '@tauri-apps/api/core'
import { 
  ProjectTemplate, 
  EnhancedProjectCreationOptions
} from '../types'

interface ProjectCreationModalProps {
  opened: boolean
  onClose: () => void
  onProjectCreated: () => void
}

export function ProjectCreationModal({ 
  opened, 
  onClose, 
  onProjectCreated 
}: ProjectCreationModalProps) {
  const [activeStep, setActiveStep] = useState(0)
  const [templates, setTemplates] = useState<ProjectTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showAdvanced, { toggle: toggleAdvanced }] = useDisclosure(false)
  
  // Form state
  const [formData, setFormData] = useState<EnhancedProjectCreationOptions>({
    name: '',
    description: '',
    template_id: undefined,
    location: '',
    include_sample_data: true,
    initialize_git: false
  })

  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null)

  useEffect(() => {
    if (opened) {
      loadTemplates()
      resetForm()
    }
  }, [opened])

  const loadTemplates = async () => {
    try {
      setLoadingTemplates(true)
      const templateList = await invoke<ProjectTemplate[]>('get_project_templates')
      setTemplates(templateList)
    } catch (error) {
      console.error('Failed to load templates:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to load project templates',
        color: 'red'
      })
    } finally {
      setLoadingTemplates(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      template_id: undefined,
      location: '',
      include_sample_data: true,
      initialize_git: false
    })
    setSelectedTemplate(null)
    setActiveStep(0)
  }

  const handleTemplateSelect = (template: ProjectTemplate) => {
    setSelectedTemplate(template)
    setFormData(prev => ({
      ...prev,
      template_id: template.id,
      include_sample_data: template.sample_data
    }))
  }

  const handleNext = () => {
    if (activeStep < 2) {
      setActiveStep(activeStep + 1)
    }
  }

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1)
    }
  }

  const handleCreateProject = async () => {
    if (!formData.name.trim()) {
      notifications.show({
        title: 'Error',
        message: 'Project name is required',
        color: 'red'
      })
      return
    }

    try {
      setCreating(true)
      
      await invoke('create_project_enhanced', {
        options: formData
      })

      notifications.show({
        title: 'Success',
        message: `Project "${formData.name}" created successfully`,
        color: 'green'
      })

      onProjectCreated()
      onClose()
    } catch (error) {
      console.error('Failed to create project:', error)
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to create project',
        color: 'red'
      })
    } finally {
      setCreating(false)
    }
  }

  const canProceed = () => {
    switch (activeStep) {
      case 0: return selectedTemplate !== null
      case 1: return formData.name.trim().length > 0
      case 2: return true
      default: return false
    }
  }


  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Create New Project"
      size="lg"
      styles={{
        body: { padding: '2rem' }
      }}
    >
      <Stack gap="xl">
        <Stepper active={activeStep} size="sm">
          <Stepper.Step
            label="Template"
            description="Choose a project template"
            icon={<IconTemplate size="1.2rem" />}
          />
          <Stepper.Step
            label="Details"
            description="Project information"
            icon={<IconFolder size="1.2rem" />}
          />
          <Stepper.Step
            label="Review"
            description="Confirm settings"
            icon={<IconCheck size="1.2rem" />}
          />
        </Stepper>

        <Divider />

        {/* Step 1: Template Selection */}
        {activeStep === 0 && (
          <Stack gap="md">
            <div>
              <Title order={4}>Choose a Template</Title>
              <Text size="sm" c="dimmed">
                Select a template to get started quickly with pre-configured models and sample data
              </Text>
            </div>

            {loadingTemplates ? (
              <Text>Loading templates...</Text>
            ) : (
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                {templates.map((template) => (
                  <Card
                    key={template.id}
                    withBorder
                    shadow="sm"
                    padding="lg"
                    style={{
                      cursor: 'pointer',
                      border: selectedTemplate?.id === template.id 
                        ? '2px solid var(--mantine-primary-color-filled)' 
                        : undefined
                    }}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <Stack gap="sm">
                      <Group justify="space-between">
                        <Text fw={600}>{template.name}</Text>
                        {template.is_builtin && (
                          <Badge size="xs" variant="light">Built-in</Badge>
                        )}
                      </Group>

                      <Text size="sm" c="dimmed" lineClamp={2}>
                        {template.description}
                      </Text>

                      <Group gap="xs">
                        <Badge size="xs" variant="outline">
                          {template.category}
                        </Badge>
                        {template.sample_data && (
                          <Badge size="xs" variant="outline" color="blue">
                            Sample Data
                          </Badge>
                        )}
                      </Group>

                      {selectedTemplate?.id === template.id && (
                        <Group justify="center" mt="xs">
                          <ActionIcon color="green" variant="filled">
                            <IconCheck size="1rem" />
                          </ActionIcon>
                        </Group>
                      )}
                    </Stack>
                  </Card>
                ))}
              </SimpleGrid>
            )}
          </Stack>
        )}

        {/* Step 2: Project Details */}
        {activeStep === 1 && (
          <Stack gap="md">
            <div>
              <Title order={4}>Project Details</Title>
              <Text size="sm" c="dimmed">
                Configure your new project settings
              </Text>
            </div>

            <TextInput
              label="Project Name"
              placeholder="My Awesome Project"
              value={formData.name}
              onChange={(event) => setFormData(prev => ({
                ...prev,
                name: event.currentTarget.value
              }))}
              required
            />

            <Textarea
              label="Description (Optional)"
              placeholder="Brief description of your project"
              value={formData.description}
              onChange={(event) => setFormData(prev => ({
                ...prev,
                description: event.currentTarget.value
              }))}
              minRows={2}
              maxRows={4}
            />

            <Group justify="space-between" mt="md">
              <Text fw={500}>Advanced Options</Text>
              <ActionIcon variant="subtle" onClick={toggleAdvanced}>
                {showAdvanced ? <IconChevronUp /> : <IconChevronDown />}
              </ActionIcon>
            </Group>

            <Collapse in={showAdvanced}>
              <Stack gap="md" pt="md">
                <TextInput
                  label="Custom Location (Optional)"
                  placeholder="Leave empty for default location"
                  value={formData.location}
                  onChange={(event) => setFormData(prev => ({
                    ...prev,
                    location: event.currentTarget.value
                  }))}
                />

                <Switch
                  label="Include sample data"
                  description="Add example data to help you get started"
                  checked={formData.include_sample_data}
                  onChange={(event) => setFormData(prev => ({
                    ...prev,
                    include_sample_data: event.currentTarget.checked
                  }))}
                />

                <Switch
                  label="Initialize Git repository"
                  description="Set up version control for your project"
                  checked={formData.initialize_git}
                  onChange={(event) => setFormData(prev => ({
                    ...prev,
                    initialize_git: event.currentTarget.checked
                  }))}
                />
              </Stack>
            </Collapse>
          </Stack>
        )}

        {/* Step 3: Review */}
        {activeStep === 2 && (
          <Stack gap="md">
            <div>
              <Title order={4}>Review & Create</Title>
              <Text size="sm" c="dimmed">
                Review your project settings before creation
              </Text>
            </div>

            <Card withBorder padding="lg">
              <Stack gap="sm">
                <Group justify="space-between">
                  <Text fw={600}>Project Name:</Text>
                  <Text>{formData.name}</Text>
                </Group>

                {formData.description && (
                  <Group justify="space-between" align="flex-start">
                    <Text fw={600}>Description:</Text>
                    <Text style={{ maxWidth: '60%', textAlign: 'right' }}>
                      {formData.description}
                    </Text>
                  </Group>
                )}

                <Group justify="space-between">
                  <Text fw={600}>Template:</Text>
                  <Text>{selectedTemplate?.name}</Text>
                </Group>

                <Group justify="space-between">
                  <Text fw={600}>Sample Data:</Text>
                  <Badge color={formData.include_sample_data ? 'green' : 'gray'}>
                    {formData.include_sample_data ? 'Included' : 'Not included'}
                  </Badge>
                </Group>

                <Group justify="space-between">
                  <Text fw={600}>Git Repository:</Text>
                  <Badge color={formData.initialize_git ? 'blue' : 'gray'}>
                    {formData.initialize_git ? 'Initialize' : 'Skip'}
                  </Badge>
                </Group>

                {formData.location && (
                  <Group justify="space-between" align="flex-start">
                    <Text fw={600}>Location:</Text>
                    <Text style={{ maxWidth: '60%', textAlign: 'right', fontSize: '0.85rem' }}>
                      {formData.location}
                    </Text>
                  </Group>
                )}
              </Stack>
            </Card>

            {selectedTemplate && (
              <Alert icon={<IconInfoCircle size="1rem" />} color="blue">
                This will create a new {selectedTemplate.name} project with{' '}
                {formData.include_sample_data ? 'sample data' : 'empty models'}.
              </Alert>
            )}
          </Stack>
        )}

        {/* Navigation */}
        <Group justify="space-between" mt="xl">
          <Group>
            {activeStep > 0 && (
              <Button variant="subtle" onClick={handleBack} disabled={creating}>
                Back
              </Button>
            )}
          </Group>

          <Group>
            <Button variant="subtle" onClick={onClose} disabled={creating}>
              Cancel
            </Button>
            
            {activeStep < 2 ? (
              <Button 
                onClick={handleNext} 
                disabled={!canProceed()}
              >
                Next
              </Button>
            ) : (
              <Button 
                onClick={handleCreateProject}
                loading={creating}
                leftSection={<IconCheck size="1rem" />}
              >
                Create Project
              </Button>
            )}
          </Group>
        </Group>
      </Stack>
    </Modal>
  )
}

export default ProjectCreationModal