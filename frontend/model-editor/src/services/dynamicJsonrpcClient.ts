import { JsonRpcClient } from './jsonrpcClient';
import { getTorqueConfig } from '../utils/tauriConfig';

let dynamicJsonRpcClientInstance: JsonRpcClient | null = null;

// Get or create the JSON-RPC client instance with dynamic configuration
export const getDynamicJsonRpcClient = async (): Promise<JsonRpcClient> => {
  if (!dynamicJsonRpcClientInstance) {
    const config = await getTorqueConfig();
    dynamicJsonRpcClientInstance = new JsonRpcClient(config.baseUrl);
  }
  return dynamicJsonRpcClientInstance;
};

// For compatibility with existing code, export a client that automatically uses dynamic config
class DynamicJsonRpcClient {
  private clientPromise: Promise<JsonRpcClient>;

  constructor() {
    this.clientPromise = getDynamicJsonRpcClient();
  }

  async call<T = any>(method: string, params?: Record<string, any>): Promise<T> {
    const client = await this.clientPromise;
    return client.call<T>(method, params);
  }

  async loadPage(modelId: string, pageName?: string) {
    const client = await this.clientPromise;
    return client.loadPage(modelId, pageName);
  }

  async loadEntityData(modelId: string, entityName: string, page?: number, limit?: number) {
    const client = await this.clientPromise;
    return client.loadEntityData(modelId, entityName, page, limit);
  }

  async getFormDefinition(modelId: string, entityName: string) {
    const client = await this.clientPromise;
    return client.getFormDefinition(modelId, entityName);
  }

  async createEntity(modelId: string, entityName: string, data: Record<string, any>) {
    const client = await this.clientPromise;
    return client.createEntity(modelId, entityName, data);
  }

  async updateEntity(entityId: string, data: Record<string, any>) {
    const client = await this.clientPromise;
    return client.updateEntity(entityId, data);
  }

  async deleteEntity(entityId: string) {
    const client = await this.clientPromise;
    return client.deleteEntity(entityId);
  }

  async getComponentConfig(componentType: string) {
    const client = await this.clientPromise;
    return client.getComponentConfig(componentType);
  }

  async getLayoutConfig(layoutType: string) {
    const client = await this.clientPromise;
    return client.getLayoutConfig(layoutType);
  }

  async getModelMetadata(modelId: string) {
    const client = await this.clientPromise;
    return client.getModelMetadata(modelId);
  }

  async getCapabilities() {
    const client = await this.clientPromise;
    return client.getCapabilities();
  }

  async ping() {
    const client = await this.clientPromise;
    return client.ping();
  }
}

// Export a singleton instance that handles dynamic configuration
export const dynamicJsonRpcClient = new DynamicJsonRpcClient();