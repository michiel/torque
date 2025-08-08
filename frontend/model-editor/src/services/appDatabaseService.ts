// App Database Management API Service

export interface DatabaseStatus {
  exists: boolean;
  total_entities: number;
  entity_counts: Record<string, number>;
  last_seeded: string | null;
  schema_version: string;
}

export interface EntityOverview {
  entity_type: string;
  display_name: string;
  record_count: number;
  last_updated: string | null;
}

export interface EntityDataResponse {
  entities: any[];
  total_count: number;
  page: number;
  per_page: number;
}

export interface SeedRequest {
  max_instances_per_entity?: number; // Default: 5, Max: 10
  specific_entities?: string[]; // Empty = all entities
  preserve_existing: boolean; // Default: false
}

export interface SeedReport {
  entities_created: Record<string, number>;
  relationships_created: number;
  duration_ms: number;
  total_records: number;
}

export interface EmptyResponse {
  tables_emptied: number;
  duration_ms: number;
}

export interface SyncResponse {
  tables_created: number;
  indexes_created: number;
  duration_ms: number;
}

export interface DatabaseStats {
  status: DatabaseStatus;
  entities: EntityOverview[];
  database_size_bytes?: number;
}

class AppDatabaseService {
  private baseUrl = '/api/v1';
  
  // Allow dynamic configuration of base URL for Tauri environments
  public configure(baseUrl: string) {
    this.baseUrl = `${baseUrl}/api/v1`;
  }

  /**
   * Get database status and overview for a model
   */
  async getDatabaseStatus(modelId: string): Promise<DatabaseStatus> {
    const response = await fetch(`${this.baseUrl}/models/${modelId}/app-database/status`);
    if (!response.ok) {
      throw new Error(`Failed to get database status: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Get overview of all entities in the app database
   */
  async getEntitiesOverview(modelId: string): Promise<EntityOverview[]> {
    const response = await fetch(`${this.baseUrl}/models/${modelId}/app-database/entities`);
    if (!response.ok) {
      throw new Error(`Failed to get entities overview: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Get paginated entity data for a specific entity type
   */
  async getEntityData(
    modelId: string, 
    entityType: string, 
    page: number = 1, 
    perPage: number = 50
  ): Promise<EntityDataResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString()
    });
    
    const response = await fetch(
      `${this.baseUrl}/models/${modelId}/app-database/entities/${entityType}?${params}`
    );
    if (!response.ok) {
      throw new Error(`Failed to get entity data: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Seed the app database with fake data
   */
  async seedDatabase(modelId: string, request: SeedRequest): Promise<SeedReport> {
    const response = await fetch(`${this.baseUrl}/models/${modelId}/app-database/seed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to seed database: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Empty the app database (delete all data, keep schema)
   */
  async emptyDatabase(modelId: string): Promise<EmptyResponse> {
    const response = await fetch(`${this.baseUrl}/models/${modelId}/app-database`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to empty database: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Synchronize database schema with model definition
   */
  async syncSchema(modelId: string): Promise<SyncResponse> {
    const response = await fetch(`${this.baseUrl}/models/${modelId}/app-database/sync`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to sync schema: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Get detailed statistics about the app database
   */
  async getDatabaseStats(modelId: string): Promise<DatabaseStats> {
    const response = await fetch(`${this.baseUrl}/models/${modelId}/app-database/stats`);
    if (!response.ok) {
      throw new Error(`Failed to get database stats: ${response.statusText}`);
    }
    return response.json();
  }
}

export const appDatabaseService = new AppDatabaseService();