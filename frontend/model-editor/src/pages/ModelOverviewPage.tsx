import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Title, Text, Grid, Card, Button, Group, Stack, Alert, LoadingOverlay } from '@mantine/core';
import { IconEdit, IconEye, IconDatabase, IconSettings, IconFileImport } from '@tabler/icons-react';
import { useQuery } from '@apollo/client';
import { GET_MODEL } from '../graphql/queries';

interface RouteParams extends Record<string, string | undefined> {
  id: string;
}

export const ModelOverviewPage: React.FC = () => {
  const { id } = useParams<RouteParams>();
  const navigate = useNavigate();

  const { data: modelData, loading: modelLoading, error: modelError } = useQuery(GET_MODEL, {
    variables: { id },
    skip: !id
  });

  const model = modelData?.model;

  const handleModelEditor = () => {
    navigate(`/models/${id}/editor`);
  };

  const handleAppPreviewer = () => {
    navigate(`/models/${id}/previewer`);
  };

  if (modelLoading) {
    return (
      <Container size="lg" p="md">
        <LoadingOverlay visible />
      </Container>
    );
  }

  if (modelError) {
    return (
      <Container size="lg" p="md">
        <Alert color="red" title="Error">
          Failed to load model: {modelError.message}
        </Alert>
      </Container>
    );
  }

  if (!model) {
    return (
      <Container size="lg" p="md">
        <Alert color="orange" title="Model Not Found">
          The specified model could not be found.
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="lg" p="md">
      <Stack gap="xl">
        {/* Model Header */}
        <div>
          <Title order={1}>{model.name}</Title>
          <Text size="lg" c="dimmed">
            {model.description || 'No description provided'}
          </Text>
          <Group gap="xs" mt="xs">
            <Text size="sm" c="dimmed">
              Version: {model.version}
            </Text>
            <Text size="sm" c="dimmed">
              • Created: {new Date(model.createdAt).toLocaleDateString()}
            </Text>
            <Text size="sm" c="dimmed">
              • Updated: {new Date(model.updatedAt).toLocaleDateString()}
            </Text>
          </Group>
        </div>

        {/* Model Statistics */}
        <Grid>
          <Grid.Col span={3}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Stack gap="xs" align="center">
                <IconDatabase size={32} color="var(--mantine-color-blue-6)" />
                <Text fw={700} size="xl">{model.entities?.length || 0}</Text>
                <Text size="sm" c="dimmed">Entities</Text>
              </Stack>
            </Card>
          </Grid.Col>
          <Grid.Col span={3}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Stack gap="xs" align="center">
                <IconEdit size={32} color="var(--mantine-color-green-6)" />
                <Text fw={700} size="xl">{model.relationships?.length || 0}</Text>
                <Text size="sm" c="dimmed">Relationships</Text>
              </Stack>
            </Card>
          </Grid.Col>
          <Grid.Col span={3}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Stack gap="xs" align="center">
                <IconSettings size={32} color="var(--mantine-color-orange-6)" />
                <Text fw={700} size="xl">{model.layouts?.length || 0}</Text>
                <Text size="sm" c="dimmed">Layouts</Text>
              </Stack>
            </Card>
          </Grid.Col>
          <Grid.Col span={3}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Stack gap="xs" align="center">
                <IconFileImport size={32} color="var(--mantine-color-purple-6)" />
                <Text fw={700} size="xl">{model.flows?.length || 0}</Text>
                <Text size="sm" c="dimmed">Flows</Text>
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>

        {/* Navigation Options */}
        <Grid>
          <Grid.Col span={6}>
            <Card shadow="sm" padding="xl" radius="md" withBorder h="100%">
              <Stack gap="md" h="100%" justify="space-between">
                <div>
                  <Group gap="md" mb="md">
                    <IconEdit size={32} color="var(--mantine-color-blue-6)" />
                    <div>
                      <Title order={3}>Model Editor</Title>
                      <Text size="sm" c="dimmed">
                        Design and edit your data model
                      </Text>
                    </div>
                  </Group>
                  <Text size="sm">
                    Edit entities, relationships, layouts, and flows. Create and modify your data structure with visual tools and forms.
                  </Text>
                </div>
                <Button 
                  onClick={handleModelEditor}
                  size="md"
                  variant="filled"
                  fullWidth
                  leftSection={<IconEdit size={16} />}
                >
                  Open Model Editor
                </Button>
              </Stack>
            </Card>
          </Grid.Col>
          <Grid.Col span={6}>
            <Card shadow="sm" padding="xl" radius="md" withBorder h="100%">
              <Stack gap="md" h="100%" justify="space-between">
                <div>
                  <Group gap="md" mb="md">
                    <IconEye size={32} color="var(--mantine-color-green-6)" />
                    <div>
                      <Title order={3}>App Previewer</Title>
                      <Text size="sm" c="dimmed">
                        Preview and test your Torque app
                      </Text>
                    </div>
                  </Group>
                  <Text size="sm">
                    View app database contents, manage test data, and preview the generated Torque application in action.
                  </Text>
                </div>
                <Button 
                  onClick={handleAppPreviewer}
                  size="md"
                  variant="outline"
                  fullWidth
                  leftSection={<IconEye size={16} />}
                >
                  Open App Previewer
                </Button>
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  );
};