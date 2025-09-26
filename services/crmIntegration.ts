// services/crmIntegration.ts

import { SavedCampaign, UserProfile } from '../types';

// CRM Provider Types
export type CRMProvider = 'salesforce' | 'hubspot' | 'pipedrive' | 'zoho' | 'monday' | 'airtable' | 'custom_webhook';

export interface CRMConnection {
  id: string;
  provider: CRMProvider;
  name: string;
  configuration: CRMConfiguration;
  isActive: boolean;
  lastSync: Date | null;
  syncStatus: 'connected' | 'error' | 'syncing' | 'disconnected';
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CRMConfiguration {
  provider: CRMProvider;
  credentials: {
    // OAuth tokens, API keys, etc.
    accessToken?: string;
    refreshToken?: string;
    apiKey?: string;
    domain?: string; // For provider-specific domains
    userId?: string;
    instanceUrl?: string;
  };
  fieldMappings: CRMFieldMapping[];
  syncSettings: CRMSyncSettings;
  webhookConfig?: CRMWebhookConfig;
}

export interface CRMFieldMapping {
  zenithField: keyof SavedCampaign | keyof UserProfile | string;
  crmField: string;
  direction: 'bidirectional' | 'to_crm' | 'from_crm';
  transform?: (value: any) => any;
  required: boolean;
}

export interface CRMSyncSettings {
  autoSync: boolean;
  syncInterval: number; // minutes
  syncOnCreate: boolean;
  syncOnUpdate: boolean;
  conflictResolution: 'crm_wins' | 'zenith_wins' | 'newest_wins' | 'manual_review';
  batchSize: number;
  retryAttempts: number;
}

export interface CRMWebhookConfig {
  enabled: boolean;
  url: string;
  secret: string;
  events: string[];
}

export interface CRMContact {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  phone?: string;
  customFields: Record<string, any>;
}

export interface CRMDeal {
  id: string;
  name: string;
  amount?: number;
  stage: string;
  closeDate?: Date;
  contactId: string;
  companyId?: string;
  customFields: Record<string, any>;
}

export interface CRMCompany {
  id: string;
  name: string;
  domain?: string;
  industry?: string;
  size?: string;
  customFields: Record<string, any>;
}

export interface CRMCampaign {
  id: string;
  name: string;
  type: string;
  status: string;
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  customFields: Record<string, any>;
}

export interface CRMSyncResult {
  success: boolean;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsSkipped: number;
  errors: CRMSyncError[];
  warnings: string[];
  duration: number; // milliseconds
}

export interface CRMSyncError {
  recordId: string;
  error: string;
  field?: string;
  retryable: boolean;
}

// Abstract CRM Provider Interface
export abstract class CRMProvider {
  protected connection: CRMConnection;

  constructor(connection: CRMConnection) {
    this.connection = connection;
  }

  // Authentication
  abstract authenticate(): Promise<boolean>;
  abstract refreshToken(): Promise<boolean>;
  abstract testConnection(): Promise<boolean>;

  // Contacts
  abstract createContact(contact: Partial<CRMContact>): Promise<CRMContact>;
  abstract updateContact(id: string, contact: Partial<CRMContact>): Promise<CRMContact>;
  abstract getContact(id: string): Promise<CRMContact>;
  abstract searchContacts(query: string): Promise<CRMContact[]>;

  // Deals/Opportunities
  abstract createDeal(deal: Partial<CRMDeal>): Promise<CRMDeal>;
  abstract updateDeal(id: string, deal: Partial<CRMDeal>): Promise<CRMDeal>;
  abstract getDeal(id: string): Promise<CRMDeal>;

  // Companies/Accounts
  abstract createCompany(company: Partial<CRMCompany>): Promise<CRMCompany>;
  abstract updateCompany(id: string, company: Partial<CRMCompany>): Promise<CRMCompany>;
  abstract getCompany(id: string): Promise<CRMCompany>;

  // Campaigns
  abstract createCampaign(campaign: Partial<CRMCampaign>): Promise<CRMCampaign>;
  abstract updateCampaign(id: string, campaign: Partial<CRMCampaign>): Promise<CRMCampaign>;
  abstract getCampaign(id: string): Promise<CRMCampaign>;

  // Custom Fields
  abstract getCustomFields(objectType: string): Promise<Record<string, any>>;

  // Batch operations
  abstract batchSync(records: any[], operation: 'create' | 'update'): Promise<CRMSyncResult>;
}

// Salesforce Implementation
export class SalesforceProvider extends CRMProvider {
  private baseUrl: string;

  constructor(connection: CRMConnection) {
    super(connection);
    this.baseUrl = connection.configuration.credentials.instanceUrl || '';
  }

  async authenticate(): Promise<boolean> {
    // OAuth 2.0 flow implementation
    // This would typically involve redirecting to Salesforce OAuth endpoint
    throw new Error('Salesforce authentication not implemented - requires OAuth setup');
  }

  async refreshToken(): Promise<boolean> {
    // Token refresh logic
    throw new Error('Token refresh not implemented');
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/services/data/v57.0/limits');
      return response.status === 200;
    } catch {
      return false;
    }
  }

  async createContact(contact: Partial<CRMContact>): Promise<CRMContact> {
    const response = await this.makeRequest('/services/data/v57.0/sobjects/Contact', {
      method: 'POST',
      body: JSON.stringify(this.mapToSalesforceContact(contact))
    });
    return this.mapFromSalesforceContact(response.data);
  }

  async updateContact(id: string, contact: Partial<CRMContact>): Promise<CRMContact> {
    await this.makeRequest(`/services/data/v57.0/sobjects/Contact/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(this.mapToSalesforceContact(contact))
    });
    return this.getContact(id);
  }

  async getContact(id: string): Promise<CRMContact> {
    const response = await this.makeRequest(`/services/data/v57.0/sobjects/Contact/${id}`);
    return this.mapFromSalesforceContact(response.data);
  }

  async searchContacts(query: string): Promise<CRMContact[]> {
    const soqlQuery = `SELECT Id, Email, FirstName, LastName, Company, Phone FROM Contact WHERE Email LIKE '%${query}%' OR FirstName LIKE '%${query}%' OR LastName LIKE '%${query}%'`;
    const response = await this.makeRequest(`/services/data/v57.0/query?q=${encodeURIComponent(soqlQuery)}`);
    return response.data.records.map((record: any) => this.mapFromSalesforceContact(record));
  }

  async createDeal(deal: Partial<CRMDeal>): Promise<CRMDeal> {
    const response = await this.makeRequest('/services/data/v57.0/sobjects/Opportunity', {
      method: 'POST',
      body: JSON.stringify(this.mapToSalesforceOpportunity(deal))
    });
    return this.mapFromSalesforceOpportunity(response.data);
  }

  async updateDeal(id: string, deal: Partial<CRMDeal>): Promise<CRMDeal> {
    await this.makeRequest(`/services/data/v57.0/sobjects/Opportunity/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(this.mapToSalesforceOpportunity(deal))
    });
    return this.getDeal(id);
  }

  async getDeal(id: string): Promise<CRMDeal> {
    const response = await this.makeRequest(`/services/data/v57.0/sobjects/Opportunity/${id}`);
    return this.mapFromSalesforceOpportunity(response.data);
  }

  async createCompany(company: Partial<CRMCompany>): Promise<CRMCompany> {
    const response = await this.makeRequest('/services/data/v57.0/sobjects/Account', {
      method: 'POST',
      body: JSON.stringify(this.mapToSalesforceAccount(company))
    });
    return this.mapFromSalesforceAccount(response.data);
  }

  async updateCompany(id: string, company: Partial<CRMCompany>): Promise<CRMCompany> {
    await this.makeRequest(`/services/data/v57.0/sobjects/Account/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(this.mapToSalesforceAccount(company))
    });
    return this.getCompany(id);
  }

  async getCompany(id: string): Promise<CRMCompany> {
    const response = await this.makeRequest(`/services/data/v57.0/sobjects/Account/${id}`);
    return this.mapFromSalesforceAccount(response.data);
  }

  async createCampaign(campaign: Partial<CRMCampaign>): Promise<CRMCampaign> {
    const response = await this.makeRequest('/services/data/v57.0/sobjects/Campaign', {
      method: 'POST',
      body: JSON.stringify(this.mapToSalesforceCampaign(campaign))
    });
    return this.mapFromSalesforceCampaign(response.data);
  }

  async updateCampaign(id: string, campaign: Partial<CRMCampaign>): Promise<CRMCampaign> {
    await this.makeRequest(`/services/data/v57.0/sobjects/Campaign/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(this.mapToSalesforceCampaign(campaign))
    });
    return this.getCampaign(id);
  }

  async getCampaign(id: string): Promise<CRMCampaign> {
    const response = await this.makeRequest(`/services/data/v57.0/sobjects/Campaign/${id}`);
    return this.mapFromSalesforceCampaign(response.data);
  }

  async getCustomFields(objectType: string): Promise<Record<string, any>> {
    const response = await this.makeRequest(`/services/data/v57.0/sobjects/${objectType}/describe`);
    const customFields: Record<string, any> = {};

    response.data.fields
      .filter((field: any) => field.custom)
      .forEach((field: any) => {
        customFields[field.name] = {
          label: field.label,
          type: field.type,
          required: !field.nillable
        };
      });

    return customFields;
  }

  async batchSync(records: any[], operation: 'create' | 'update'): Promise<CRMSyncResult> {
    const startTime = Date.now();
    const result: CRMSyncResult = {
      success: true,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsSkipped: 0,
      errors: [],
      warnings: [],
      duration: 0
    };

    // Salesforce batch processing would go here
    // This is a simplified implementation
    for (const record of records) {
      try {
        result.recordsProcessed++;
        if (operation === 'create') {
          await this.createContact(record);
          result.recordsCreated++;
        } else {
          await this.updateContact(record.id, record);
          result.recordsUpdated++;
        }
      } catch (error: any) {
        result.errors.push({
          recordId: record.id || 'unknown',
          error: error.message,
          retryable: true
        });
      }
    }

    result.duration = Date.now() - startTime;
    result.success = result.errors.length === 0;
    return result;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.connection.configuration.credentials.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`Salesforce API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  private mapToSalesforceContact(contact: Partial<CRMContact>): any {
    return {
      Email: contact.email,
      FirstName: contact.firstName,
      LastName: contact.lastName,
      Company: contact.company,
      Phone: contact.phone,
      ...contact.customFields
    };
  }

  private mapFromSalesforceContact(sfContact: any): CRMContact {
    return {
      id: sfContact.Id,
      email: sfContact.Email,
      firstName: sfContact.FirstName,
      lastName: sfContact.LastName,
      company: sfContact.Company,
      phone: sfContact.Phone,
      customFields: this.extractCustomFields(sfContact, ['Id', 'Email', 'FirstName', 'LastName', 'Company', 'Phone'])
    };
  }

  private mapToSalesforceOpportunity(deal: Partial<CRMDeal>): any {
    return {
      Name: deal.name,
      Amount: deal.amount,
      StageName: deal.stage,
      CloseDate: deal.closeDate?.toISOString().split('T')[0],
      ContactId: deal.contactId,
      AccountId: deal.companyId,
      ...deal.customFields
    };
  }

  private mapFromSalesforceOpportunity(sfOpp: any): CRMDeal {
    return {
      id: sfOpp.Id,
      name: sfOpp.Name,
      amount: sfOpp.Amount,
      stage: sfOpp.StageName,
      closeDate: sfOpp.CloseDate ? new Date(sfOpp.CloseDate) : undefined,
      contactId: sfOpp.ContactId,
      companyId: sfOpp.AccountId,
      customFields: this.extractCustomFields(sfOpp, ['Id', 'Name', 'Amount', 'StageName', 'CloseDate', 'ContactId', 'AccountId'])
    };
  }

  private mapToSalesforceAccount(company: Partial<CRMCompany>): any {
    return {
      Name: company.name,
      Website: company.domain,
      Industry: company.industry,
      NumberOfEmployees: company.size,
      ...company.customFields
    };
  }

  private mapFromSalesforceAccount(sfAccount: any): CRMCompany {
    return {
      id: sfAccount.Id,
      name: sfAccount.Name,
      domain: sfAccount.Website,
      industry: sfAccount.Industry,
      size: sfAccount.NumberOfEmployees,
      customFields: this.extractCustomFields(sfAccount, ['Id', 'Name', 'Website', 'Industry', 'NumberOfEmployees'])
    };
  }

  private mapToSalesforceCampaign(campaign: Partial<CRMCampaign>): any {
    return {
      Name: campaign.name,
      Type: campaign.type,
      Status: campaign.status,
      StartDate: campaign.startDate?.toISOString().split('T')[0],
      EndDate: campaign.endDate?.toISOString().split('T')[0],
      BudgetedCost: campaign.budget,
      ...campaign.customFields
    };
  }

  private mapFromSalesforceCampaign(sfCampaign: any): CRMCampaign {
    return {
      id: sfCampaign.Id,
      name: sfCampaign.Name,
      type: sfCampaign.Type,
      status: sfCampaign.Status,
      startDate: sfCampaign.StartDate ? new Date(sfCampaign.StartDate) : undefined,
      endDate: sfCampaign.EndDate ? new Date(sfCampaign.EndDate) : undefined,
      budget: sfCampaign.BudgetedCost,
      customFields: this.extractCustomFields(sfCampaign, ['Id', 'Name', 'Type', 'Status', 'StartDate', 'EndDate', 'BudgetedCost'])
    };
  }

  private extractCustomFields(record: any, standardFields: string[]): Record<string, any> {
    const customFields: Record<string, any> = {};
    Object.keys(record).forEach(key => {
      if (!standardFields.includes(key) && !key.endsWith('__c')) {
        customFields[key] = record[key];
      }
    });
    return customFields;
  }
}

// HubSpot Implementation (Placeholder)
export class HubSpotProvider extends CRMProvider {
  async authenticate(): Promise<boolean> {
    throw new Error('HubSpot integration not implemented');
  }

  async refreshToken(): Promise<boolean> {
    throw new Error('HubSpot integration not implemented');
  }

  async testConnection(): Promise<boolean> {
    throw new Error('HubSpot integration not implemented');
  }

  async createContact(contact: Partial<CRMContact>): Promise<CRMContact> {
    throw new Error('HubSpot integration not implemented');
  }

  async updateContact(id: string, contact: Partial<CRMContact>): Promise<CRMContact> {
    throw new Error('HubSpot integration not implemented');
  }

  async getContact(id: string): Promise<CRMContact> {
    throw new Error('HubSpot integration not implemented');
  }

  async searchContacts(query: string): Promise<CRMContact[]> {
    throw new Error('HubSpot integration not implemented');
  }

  async createDeal(deal: Partial<CRMDeal>): Promise<CRMDeal> {
    throw new Error('HubSpot integration not implemented');
  }

  async updateDeal(id: string, deal: Partial<CRMDeal>): Promise<CRMDeal> {
    throw new Error('HubSpot integration not implemented');
  }

  async getDeal(id: string): Promise<CRMDeal> {
    throw new Error('HubSpot integration not implemented');
  }

  async createCompany(company: Partial<CRMCompany>): Promise<CRMCompany> {
    throw new Error('HubSpot integration not implemented');
  }

  async updateCompany(id: string, company: Partial<CRMCompany>): Promise<CRMCompany> {
    throw new Error('HubSpot integration not implemented');
  }

  async getCompany(id: string): Promise<CRMCompany> {
    throw new Error('HubSpot integration not implemented');
  }

  async createCampaign(campaign: Partial<CRMCampaign>): Promise<CRMCampaign> {
    throw new Error('HubSpot integration not implemented');
  }

  async updateCampaign(id: string, campaign: Partial<CRMCampaign>): Promise<CRMCampaign> {
    throw new Error('HubSpot integration not implemented');
  }

  async getCampaign(id: string): Promise<CRMCampaign> {
    throw new Error('HubSpot integration not implemented');
  }

  async getCustomFields(objectType: string): Promise<Record<string, any>> {
    throw new Error('HubSpot integration not implemented');
  }

  async batchSync(records: any[], operation: 'create' | 'update'): Promise<CRMSyncResult> {
    throw new Error('HubSpot integration not implemented');
  }
}

// CRM Integration Service - Main orchestrator
export class CRMIntegrationService {
  private static readonly STORAGE_KEY = 'zenith_crm_connections';
  private static connections: CRMConnection[] = [];
  private static providers: Map<string, CRMProvider> = new Map();

  // Connection Management
  static async addConnection(config: CRMConfiguration): Promise<CRMConnection> {
    const connection: CRMConnection = {
      id: this.generateId(),
      provider: config.provider,
      name: `${config.provider} Connection`,
      configuration: config,
      isActive: false,
      lastSync: null,
      syncStatus: 'disconnected',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Test connection
    const provider = this.createProvider(connection);
    try {
      const isConnected = await provider.testConnection();
      if (isConnected) {
        connection.isActive = true;
        connection.syncStatus = 'connected';
      }
    } catch (error: any) {
      connection.syncStatus = 'error';
      connection.errorMessage = error.message;
    }

    this.connections.push(connection);
    this.saveConnections();
    return connection;
  }

  static async updateConnection(id: string, updates: Partial<CRMConnection>): Promise<CRMConnection | null> {
    const index = this.connections.findIndex(conn => conn.id === id);
    if (index === -1) return null;

    this.connections[index] = {
      ...this.connections[index],
      ...updates,
      updatedAt: new Date()
    };

    this.saveConnections();
    return this.connections[index];
  }

  static async deleteConnection(id: string): Promise<boolean> {
    const initialLength = this.connections.length;
    this.connections = this.connections.filter(conn => conn.id !== id);
    this.providers.delete(id);

    if (this.connections.length !== initialLength) {
      this.saveConnections();
      return true;
    }
    return false;
  }

  static getConnections(): CRMConnection[] {
    return [...this.connections];
  }

  static getActiveConnection(): CRMConnection | null {
    return this.connections.find(conn => conn.isActive && conn.syncStatus === 'connected') || null;
  }

  // Campaign Sync
  static async syncCampaign(campaign: SavedCampaign): Promise<CRMSyncResult> {
    const connection = this.getActiveConnection();
    if (!connection) {
      throw new Error('No active CRM connection found');
    }

    const provider = this.getProvider(connection.id);
    if (!provider) {
      throw new Error('CRM provider not initialized');
    }

    const startTime = Date.now();
    const result: CRMSyncResult = {
      success: true,
      recordsProcessed: 1,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsSkipped: 0,
      errors: [],
      warnings: [],
      duration: 0
    };

    try {
      // Map campaign to CRM campaign
      const crmCampaign: Partial<CRMCampaign> = {
        name: campaign.name,
        type: 'Marketing Campaign',
        status: campaign.status === 'active' ? 'Active' : 'Planned',
        startDate: campaign.createdAt,
        customFields: {
          zenith_campaign_id: campaign.id,
          zenith_description: campaign.description,
          zenith_product_description: campaign.productDescription,
          zenith_tags: campaign.tags.join(',')
        }
      };

      if (campaign.crmData?.campaignId) {
        await provider.updateCampaign(campaign.crmData.campaignId, crmCampaign);
        result.recordsUpdated++;
      } else {
        const created = await provider.createCampaign(crmCampaign);
        result.recordsCreated++;

        // Update campaign with CRM data
        campaign.crmData = {
          ...campaign.crmData,
          campaignId: created.id
        };
      }

      await this.updateConnectionSyncStatus(connection.id, 'connected');
    } catch (error: any) {
      result.success = false;
      result.errors.push({
        recordId: campaign.id,
        error: error.message,
        retryable: true
      });
      await this.updateConnectionSyncStatus(connection.id, 'error', error.message);
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  // Provider Management
  private static createProvider(connection: CRMConnection): CRMProvider {
    switch (connection.provider) {
      case 'salesforce':
        return new SalesforceProvider(connection);
      case 'hubspot':
        return new HubSpotProvider(connection);
      default:
        throw new Error(`Unsupported CRM provider: ${connection.provider}`);
    }
  }

  private static getProvider(connectionId: string): CRMProvider | null {
    if (!this.providers.has(connectionId)) {
      const connection = this.connections.find(conn => conn.id === connectionId);
      if (connection) {
        this.providers.set(connectionId, this.createProvider(connection));
      }
    }
    return this.providers.get(connectionId) || null;
  }

  // Utility Methods
  private static async updateConnectionSyncStatus(id: string, status: CRMConnection['syncStatus'], errorMessage?: string): Promise<void> {
    await this.updateConnection(id, {
      syncStatus: status,
      lastSync: new Date(),
      errorMessage
    });
  }

  private static generateId(): string {
    return `crm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static saveConnections(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.connections));
  }

  private static loadConnections(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.connections = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading CRM connections:', error);
      this.connections = [];
    }
  }

  // Initialize service
  static initialize(): void {
    this.loadConnections();
  }

  // Future: Webhook handling
  static async handleWebhook(provider: CRMProvider, payload: any): Promise<void> {
    // Process incoming webhook data
    // Update local campaigns based on CRM changes
    console.log('Webhook processing not yet implemented');
  }
}

// Auto-initialize on import
CRMIntegrationService.initialize();