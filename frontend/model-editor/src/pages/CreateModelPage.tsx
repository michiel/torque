import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@apollo/client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Stack,
  Title,
  Paper,
  TextInput,
  Textarea,
  Button,
  Group,
  Alert,
  LoadingOverlay,
  Container,
  Box,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconCheck, IconAlertCircle } from '@tabler/icons-react'

import { CREATE_MODEL } from '../graphql/mutations'
import { GET_MODELS } from '../graphql/queries'
import { CreateModelInput } from '../types/model'

const createModelSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
})

type CreateModelForm = z.infer<typeof createModelSchema>

export function CreateModelPage() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [createModel] = useMutation(CREATE_MODEL, {
    refetchQueries: [{ query: GET_MODELS }],
  })

  const form = useForm<CreateModelForm>({
    resolver: zodResolver(createModelSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  })

  const onSubmit = async (data: CreateModelForm) => {
    setIsSubmitting(true)
    
    try {
      const input: CreateModelInput = {
        name: data.name,
        description: data.description || undefined,
      }

      const result = await createModel({
        variables: { input },
      })

      if (result.data?.createModel) {
        notifications.show({
          title: 'Model created successfully',
          message: `${data.name} has been created`,
          color: 'green',
          icon: <IconCheck size={16} />,
        })

        navigate(`/models/${result.data.createModel.id}`)
      }
    } catch (error) {
      notifications.show({
        title: 'Error creating model',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Box style={{ minHeight: 'calc(100vh - 100px)', background: 'var(--mantine-color-gray-0)' }}>
      <Container size="xl" py="xl">
        <Stack>
          <Title order={1}>Create New Model</Title>

          <Paper shadow="sm" p="md" radius="md" withBorder maw={600} pos="relative">
        <LoadingOverlay visible={isSubmitting} />
        
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Model Name"
              placeholder="Enter model name..."
              required
              {...form.register('name')}
              error={form.formState.errors.name?.message}
            />

            <Textarea
              label="Description"
              placeholder="Describe what this model represents..."
              rows={4}
              {...form.register('description')}
              error={form.formState.errors.description?.message}
            />

            {form.formState.errors.root && (
              <Alert
                icon={<IconAlertCircle size={16} />}
                title="Validation Error"
                color="red"
              >
                {form.formState.errors.root.message}
              </Alert>
            )}

            <Group justify="flex-end" mt="md">
              <Button
                variant="subtle"
                onClick={() => navigate('/models')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={isSubmitting}
                disabled={!form.formState.isValid}
              >
                Create Model
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
        </Stack>
      </Container>
    </Box>
  )
}