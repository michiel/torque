import React, { useState, useEffect } from 'react';
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
  Tabs,
  NumberInput,
  Switch,
  Checkbox,
  MultiSelect,
  Tooltip,
  Progress,
  Divider,
  Box
} from '@mantine/core';
import { 
  IconArrowLeft, 
  IconDatabase, 
  IconTrash, 
  IconPlus, 
  IconRefresh,
  IconPlant,
  IconInfoCircle,
  IconSettings,
  IconEye,
  IconDeviceDesktop
} from '@tabler/icons-react';
import { useQuery } from '@apollo/client';
import { notifications } from '@mantine/notifications';
import { GET_MODEL } from '../graphql/queries';
import { 
  appDatabaseService, 
  DatabaseStatus, 
  EntityOverview, 
  SeedRequest,
  SeedReport 
} from '../services/appDatabaseService';
import EntityDataModal from '../components/EntityDataModal';
import TorqueAppPreview from '../components/TorqueAppPreview';

interface RouteParams extends Record<string, string | undefined> {
  id: string;
}

export const AppPreviewerPage: React.FC = () => {
  const { id } = useParams<RouteParams>();
  const navigate = useNavigate();
  
  // Loading states
  const [isEmptyingDb, setIsEmptyingDb] = useState(false);
  const [isSeedingDb, setIsSeedingDb] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Modal states
  const [showEmptyModal, setShowEmptyModal] = useState(false);
  const [showSeedModal, setShowSeedModal] = useState(false);
  const [showEntityDataModal, setShowEntityDataModal] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<EntityOverview | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>('app-preview');
  
  // Database data
  const [databaseStatus, setDatabaseStatus] = useState<DatabaseStatus | null>(null);
  const [entitiesOverview, setEntitiesOverview] = useState<EntityOverview[]>([]);
  const [lastSeedReport, setLastSeedReport] = useState<SeedReport | null>(null);
  
  // Seed configuration
  const [seedConfig, setSeedConfig] = useState<SeedRequest>({
    max_instances_per_entity: 5,
    specific_entities: undefined,
    preserve_existing: false
  });

  const { data: modelData, loading: modelLoading, error: modelError } = useQuery(GET_MODEL, {
    variables: { id },
    skip: !id
  });

  const model = modelData?.model;

  // Load database data when component mounts or model changes
  useEffect(() => {
    if (id && model) {
      loadDatabaseData();
    }
  }, [id, model]);

  const loadDatabaseData = async () => {
    if (!id) return;
    
    setIsRefreshing(true);
    try {
      const [status, overview] = await Promise.all([
        appDatabaseService.getDatabaseStatus(id),
        appDatabaseService.getEntitiesOverview(id)
      ]);
      
      setDatabaseStatus(status);
      setEntitiesOverview(overview);
    } catch (error) {
      console.error('Failed to load database data:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load database information',
        color: 'red'
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleBack = () => {
    navigate(`/models/${id}`);
  };

  const handleEmptyDatabase = async () => {
    if (!id) return;
    
    setIsEmptyingDb(true);
    try {
      const result = await appDatabaseService.emptyDatabase(id);
      
      notifications.show({
        title: 'Database Emptied',
        message: `Emptied ${result.tables_emptied} tables in ${result.duration_ms}ms`,
        color: 'green'
      });
      
      setShowEmptyModal(false);
      
      // Refresh data
      await loadDatabaseData();
    } catch (error) {
      console.error('Failed to empty database:', error);
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to empty database',
        color: 'red'
      });
    } finally {
      setIsEmptyingDb(false);
    }
  };

  const handleSeedDatabase = async () => {
    if (!id) return;
    
    setIsSeedingDb(true);
    try {
      const result = await appDatabaseService.seedDatabase(id, seedConfig);
      setLastSeedReport(result);
      
      const totalEntities = Object.keys(result.entities_created).length;
      
      notifications.show({
        title: 'Database Seeded',
        message: `Created ${result.total_records} records across ${totalEntities} entities in ${result.duration_ms}ms`,
        color: 'green'
      });
      
      setShowSeedModal(false);
      
      // Refresh data
      await loadDatabaseData();
    } catch (error) {
      console.error('Failed to seed database:', error);
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to seed database',
        color: 'red'
      });
    } finally {
      setIsSeedingDb(false);
    }
  };

  const handleSyncSchema = async () => {
    if (!id) return;
    
    setIsSyncing(true);
    try {
      const result = await appDatabaseService.syncSchema(id);
      
      notifications.show({
        title: 'Schema Synchronized',
        message: `Created ${result.tables_created} tables and ${result.indexes_created} indexes in ${result.duration_ms}ms`,
        color: 'green'
      });
      
      // Refresh data
      await loadDatabaseData();
    } catch (error) {
      console.error('Failed to sync schema:', error);
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to sync schema',
        color: 'red'
      });
    } finally {
      setIsSyncing(false);
    }
  };


  const handleViewEntityData = (entity: EntityOverview) => {
    setSelectedEntity(entity);
    setShowEntityDataModal(true);
  };

  if (modelLoading || (model && !databaseStatus && !isRefreshing)) {
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
      <LoadingOverlay visible={isRefreshing} />
      <Stack gap="lg">
        {/* Header */}
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

        {/* Tabs */}
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="app-preview" leftSection={<IconDeviceDesktop size={16} />}>
              App Preview
            </Tabs.Tab>
            <Tabs.Tab value="database" leftSection={<IconDatabase size={16} />}>
              Database
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="app-preview">
            <Stack gap="lg" mt="lg" style={{ height: 'calc(100vh - 200px)' }}>
              {/* App Preview Content */}
              <Card shadow="sm" padding="lg" radius="md" withBorder style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Stack gap="md" style={{ height: '100%' }}>
                  <Group justify="space-between">
                    <Title order={4}>Live TorqueApp Preview</Title>
                    <Badge color="blue" variant="light">
                      Dynamic
                    </Badge>
                  </Group>
                  
                  {/* TorqueApp Preview Component */}
                  <Box style={{ flex: 1, height: '100%' }}>
                    <TorqueAppPreview
                      modelId={model.id}
                      modelName={model.name}
                    />
                  </Box>
                </Stack>
              </Card>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="database">
            <Stack gap="lg" mt="lg">
              {/* Database Status */}
              {databaseStatus && (
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  <Stack gap="md">
                    <Group justify="space-between">
                      <Title order={4}>Database Status</Title>
                      <Badge 
                        color={databaseStatus.exists ? 'green' : 'gray'} 
                        variant="light"
                      >
                        {databaseStatus.exists ? 'Active' : 'Not Created'}
                      </Badge>
                    </Group>
                    
                    {databaseStatus.exists && (
                      <Group gap="xl">
                        <div>
                          <Text size="sm" c="dimmed">Total Records</Text>
                          <Text size="xl" fw={700}>{databaseStatus.total_entities}</Text>
                        </div>
                        <div>
                          <Text size="sm" c="dimmed">Schema Version</Text>
                          <Text size="lg" fw={500}>{databaseStatus.schema_version}</Text>
                        </div>
                        {databaseStatus.last_seeded && (
                          <div>
                            <Text size="sm" c="dimmed">Last Seeded</Text>
                            <Text size="lg" fw={500}>
                              {new Date(databaseStatus.last_seeded).toLocaleDateString()}
                            </Text>
                          </div>
                        )}
                      </Group>
                    )}
                  </Stack>
                </Card>
              )}

              {/* Database Actions */}
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Stack gap="md">
                  <Group justify="space-between">
                    <div>
                      <Title order={4}>Database Management</Title>
                      <Text size="sm" c="dimmed">
                        Manage the app database for testing and development
                      </Text>
                    </div>
                    {lastSeedReport && (
                      <Tooltip 
                        label={`Last seed: ${lastSeedReport.total_records} records in ${lastSeedReport.duration_ms}ms`}
                        multiline
                      >
                        <ActionIcon variant="subtle" size="lg">
                          <IconInfoCircle size={16} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </Group>
                  
                  <Group gap="md">
                    <Button
                      leftSection={<IconPlant size={16} />}
                      onClick={() => setShowSeedModal(true)}
                      loading={isSeedingDb}
                      variant="filled"
                      disabled={!model?.entities || model.entities.length === 0}
                    >
                      Seed with Test Data
                    </Button>
                    <Button
                      leftSection={<IconTrash size={16} />}
                      onClick={() => setShowEmptyModal(true)}
                      loading={isEmptyingDb}
                      color="red"
                      variant="outline"
                      disabled={!databaseStatus?.exists}
                    >
                      Empty Database
                    </Button>
                    <Button
                      leftSection={<IconRefresh size={16} />}
                      onClick={loadDatabaseData}
                      loading={isRefreshing}
                      variant="subtle"
                    >
                      Refresh View
                    </Button>
                    <Button
                      leftSection={<IconSettings size={16} />}
                      onClick={handleSyncSchema}
                      loading={isSyncing}
                      variant="subtle"
                    >
                      Sync Schema
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
                      {entitiesOverview.length} entities
                    </Badge>
                  </Group>
                  
                  {entitiesOverview.length > 0 ? (
                    <Table>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Entity</Table.Th>
                          <Table.Th>Records</Table.Th>
                          <Table.Th>Last Updated</Table.Th>
                          <Table.Th>Actions</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {entitiesOverview.map((entity) => (
                          <Table.Tr key={entity.entity_type}>
                            <Table.Td>
                              <Text fw={500}>{entity.display_name}</Text>
                              <Text size="xs" c="dimmed">{entity.entity_type}</Text>
                            </Table.Td>
                            <Table.Td>
                              <Badge 
                                color={entity.record_count > 0 ? 'blue' : 'gray'} 
                                variant="light"
                              >
                                {entity.record_count}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm" c="dimmed">
                                {entity.last_updated 
                                  ? new Date(entity.last_updated).toLocaleDateString()
                                  : 'Never'
                                }
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              <Tooltip label="View entity data">
                                <ActionIcon 
                                  variant="subtle" 
                                  size="sm"
                                  disabled={entity.record_count === 0}
                                  onClick={() => handleViewEntityData(entity)}
                                >
                                  <IconEye size={14} />
                                </ActionIcon>
                              </Tooltip>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  ) : databaseStatus?.exists ? (
                    <Alert color="blue" title="No Data">
                      Database exists but contains no data. Use "Seed with Test Data" to populate it.
                    </Alert>
                  ) : (
                    <Alert color="orange" title="Database Not Created">
                      The app database hasn't been created yet. Use "Sync Schema" to initialize it.
                    </Alert>
                  )}
                </Stack>
              </Card>
            </Stack>
          </Tabs.Panel>
        </Tabs>

        {/* Seed Database Configuration Modal */}
        <Modal
          opened={showSeedModal}
          onClose={() => setShowSeedModal(false)}
          title="Seed Database with Test Data"
          centered
          size="md"
        >
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              Configure how test data should be generated for your app database.
            </Text>
            
            <NumberInput
              label="Max instances per entity"
              description="Number of fake records to create for each entity (1-10)"
              value={seedConfig.max_instances_per_entity}
              onChange={(value) => setSeedConfig(prev => ({ 
                ...prev, 
                max_instances_per_entity: typeof value === 'number' ? value : 5 
              }))}
              min={1}
              max={10}
              placeholder="5"
            />
            
            {model?.entities && model.entities.length > 0 && (
              <MultiSelect
                label="Specific entities (optional)"
                description="Leave empty to seed all entities"
                data={model.entities.map((entity: any) => ({
                  value: entity.name,
                  label: entity.displayName || entity.name
                }))}
                value={seedConfig.specific_entities || []}
                onChange={(value) => setSeedConfig(prev => ({
                  ...prev,
                  specific_entities: value.length > 0 ? value : undefined
                }))}
                placeholder="Select entities to seed"
                searchable
              />
            )}
            
            <Switch
              label="Preserve existing data"
              description="Keep existing records instead of clearing the database first"
              checked={seedConfig.preserve_existing}
              onChange={(event) => setSeedConfig(prev => ({
                ...prev,
                preserve_existing: event.currentTarget.checked
              }))}
            />
            
            {lastSeedReport && (
              <>
                <Divider />
                <div>
                  <Text size="sm" fw={500} mb="xs">Last Seed Report</Text>
                  <Text size="xs" c="dimmed">
                    Created {lastSeedReport.total_records} records across{' '}
                    {Object.keys(lastSeedReport.entities_created).length} entities in{' '}
                    {lastSeedReport.duration_ms}ms
                  </Text>
                  <Text size="xs" c="dimmed">
                    Relationships created: {lastSeedReport.relationships_created}
                  </Text>
                </div>
              </>
            )}
            
            <Group justify="flex-end" gap="md" mt="md">
              <Button 
                variant="subtle" 
                onClick={() => setShowSeedModal(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSeedDatabase}
                loading={isSeedingDb}
                leftSection={<IconPlant size={16} />}
              >
                Seed Database
              </Button>
            </Group>
          </Stack>
        </Modal>

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

        {/* Entity Data Modal */}
        {selectedEntity && (
          <EntityDataModal
            opened={showEntityDataModal}
            onClose={() => {
              setShowEntityDataModal(false);
              setSelectedEntity(null);
            }}
            modelId={id!}
            entityType={selectedEntity.entity_type}
            displayName={selectedEntity.display_name}
            recordCount={selectedEntity.record_count}
          />
        )}
      </Stack>
    </Container>
  );
};