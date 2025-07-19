import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Title, 
  Text, 
  Button, 
  Group, 
  Stack, 
  Alert, 
  LoadingOverlay,
  Card,
  Grid,
  ActionIcon,
  Modal,
  Table,
  Badge,
  Tabs
} from '@mantine/core';
import { 
  IconArrowLeft, 
  IconDatabase, 
  IconTrash, 
  IconPlus, 
  IconExternalLink,
  IconRefresh,
  IconSeed
} from '@tabler/icons-react';
import { useQuery } from '@apollo/client';
import { notifications } from '@mantine/notifications';
import { GET_MODEL } from '../graphql/queries';

interface RouteParams extends Record<string, string | undefined> {
  id: string;
}

export const AppPreviewerPage: React.FC = () => {
  const { id } = useParams<RouteParams>();
  const navigate = useNavigate();
  const [isEmptyingDb, setIsEmptyingDb] = useState(false);
  const [isSeedingDb, setIsSeedingDb] = useState(false);
  const [showEmptyModal, setShowEmptyModal] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>('database');

  const { data: modelData, loading: modelLoading, error: modelError } = useQuery(GET_MODEL, {
    variables: { id },
    skip: !id
  });

  const model = modelData?.model;

  const handleBack = () => {
    navigate(`/models/${id}`);
  };

  const handleEmptyDatabase = async () => {
    setIsEmptyingDb(true);
    try {
      // TODO: Implement API call to empty database
      console.log('Emptying app database for model:', id);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      notifications.show({
        title: 'Database Emptied',
        message: 'App database has been emptied successfully',
        color: 'green'
      });
      
      setShowEmptyModal(false);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to empty database',
        color: 'red'
      });
    } finally {
      setIsEmptyingDb(false);
    }
  };

  const handleSeedDatabase = async () => {
    setIsSeedingDb(true);
    try {
      // TODO: Implement API call to seed database with fake data
      console.log('Seeding app database for model:', id);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      notifications.show({
        title: 'Database Seeded',
        message: 'App database has been seeded with test data',
        color: 'green'
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to seed database',
        color: 'red'
      });
    } finally {
      setIsSeedingDb(false);
    }
  };

  const handleOpenTorqueApp = () => {
    // TODO: Implement opening Torque app in main panel
    console.log('Opening Torque app for model:', id);
    notifications.show({
      title: 'Feature Coming Soon',
      message: 'Torque app preview will be available soon',
      color: 'blue'
    });
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
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between">
          <Group gap="md">
            <ActionIcon variant="subtle" onClick={handleBack} size="lg">
              <IconArrowLeft size={20} />
            </ActionIcon>
            <div>
              <Title order={2}>App Previewer</Title>
              <Text size="sm" c="dimmed">
                {model.name} • Preview and manage app data
              </Text>
            </div>
          </Group>
          <Button
            leftSection={<IconExternalLink size={16} />}
            onClick={handleOpenTorqueApp}
          >
            Open Torque App
          </Button>
        </Group>

        {/* Tabs */}
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="database" leftSection={<IconDatabase size={16} />}>
              Database
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="database">
            <Stack gap="lg" mt="lg">
              {/* Database Actions */}
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Stack gap="md">
                  <Title order={4}>Database Management</Title>
                  <Text size="sm" c="dimmed">
                    Manage the app database for testing and development
                  </Text>
                  
                  <Group gap="md">
                    <Button
                      leftSection={<IconSeed size={16} />}
                      onClick={handleSeedDatabase}
                      loading={isSeedingDb}
                      variant="filled"
                    >
                      Seed with Test Data
                    </Button>
                    <Button
                      leftSection={<IconTrash size={16} />}
                      onClick={() => setShowEmptyModal(true)}
                      loading={isEmptyingDb}
                      color="red"
                      variant="outline"
                    >
                      Empty Database
                    </Button>
                    <Button
                      leftSection={<IconRefresh size={16} />}
                      variant="subtle"
                    >
                      Refresh View
                    </Button>
                  </Group>
                </Stack>
              </Card>

              {/* Database Contents */}
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Stack gap="md">
                  <Group justify="space-between">
                    <Title order={4}>Database Contents</Title>
                    <Badge color="gray" variant="light">
                      {model.entities?.length || 0} tables
                    </Badge>
                  </Group>
                  
                  {model.entities && model.entities.length > 0 ? (
                    <Table>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Entity</Table.Th>
                          <Table.Th>Records</Table.Th>
                          <Table.Th>Last Updated</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {model.entities.map((entity: any) => (
                          <Table.Tr key={entity.id}>
                            <Table.Td>
                              <Text fw={500}>{entity.displayName}</Text>
                              <Text size="xs" c="dimmed">{entity.name}</Text>
                            </Table.Td>
                            <Table.Td>
                              <Badge color="blue" variant="light">0</Badge>
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm" c="dimmed">Never</Text>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  ) : (
                    <Alert color="blue" title="No Entities">
                      This model doesn't have any entities yet. Create entities in the Model Editor to see data here.
                    </Alert>
                  )}
                </Stack>
              </Card>
            </Stack>
          </Tabs.Panel>
        </Tabs>

        {/* Empty Database Confirmation Modal */}
        <Modal
          opened={showEmptyModal}
          onClose={() => setShowEmptyModal(false)}
          title="Empty App Database"
          centered
        >
          <Stack gap="md">
            <Text>
              Are you sure you want to empty the app database? This will permanently delete all data in the application database for this model.
            </Text>
            <Alert color="red" title="Warning">
              This action cannot be undone. All application data will be lost.
            </Alert>
            <Group justify="flex-end" gap="md">
              <Button 
                variant="subtle" 
                onClick={() => setShowEmptyModal(false)}
              >
                Cancel
              </Button>
              <Button 
                color="red" 
                onClick={handleEmptyDatabase}
                loading={isEmptyingDb}
              >
                Empty Database
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Stack>
    </Container>
  );
};