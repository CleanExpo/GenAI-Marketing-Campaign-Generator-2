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
  transform?: (value: unknown) => unknown;
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
  customFields: Record<string, unknown>;
}

export interface CRMDeal {
  id: string;
  name: string;
  amount?: number;
  stage: string;
  closeDate?: Date;
  contactId: string;
  companyId?: string;
  customFields: Record<string, unknown>;
}

export interface CRMCompany {
  id: string;
  name: string;
  domain?: string;
  industry?: string;
  size?: string;
  customFields: Record<string, unknown>;
}

export interface CRMCampaign {
  id: string;
  name: string;
  type: string;
  status: string;
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  customFields: Record<string, unknown>;
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

// Airtable Implementation
export class AirtableProvider extends CRMProvider {
  private baseId: string;
  private apiKey: string;
  private baseUrl: string;

  constructor(connection: CRMConnection) {
    super(connection);
    // Prioritize connection credentials over environment variables for manual connections
    this.apiKey = connection.configuration.credentials.apiKey || import.meta.env.VITE_AIRTABLE_API_KEY || '';
    this.baseId = connection.configuration.credentials.domain || import.meta.env.VITE_AIRTABLE_BASE_ID || ''; // Using domain field for base ID

    // Use proxy in both development and production since we don't have serverless function yet
    this.baseUrl = '/api/airtable';
  }

  async authenticate(): Promise<boolean> {
    try {
      // Test authentication by fetching base schema
      const response = await this.makeRequest(`/meta/bases/${this.baseId}/tables`);
      return response.tables && response.tables.length > 0;
    } catch {
      return false;
    }
  }

  async refreshToken(): Promise<boolean> {
    // Airtable uses API keys, no token refresh needed
    return true;
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.makeRequest(`/meta/bases/${this.baseId}/tables`);

      // Check if Airtable returned an error in the response body
      if (response.error) {
        throw new Error(`Airtable API Error: ${response.error.message || response.error.type || 'Unknown error'}`);
      }

      // Check if we have the expected tables array
      return response && Array.isArray(response.tables) && response.tables.length >= 0;
    } catch (error: any) {
      // Re-throw with more specific error message for debugging
      throw new Error(error.message || 'Connection test failed');
    }
  }

  async createContact(contact: Partial<CRMContact>): Promise<CRMContact> {
    const airtableRecord = this.mapToAirtableContact(contact);
    const response = await this.makeRequest(`/${this.baseId}/Contacts`, {
      method: 'POST',
      body: JSON.stringify({
        fields: airtableRecord,
        typecast: true
      })
    });
    return this.mapFromAirtableContact(response);
  }

  async updateContact(id: string, contact: Partial<CRMContact>): Promise<CRMContact> {
    const airtableRecord = this.mapToAirtableContact(contact);
    const response = await this.makeRequest(`/${this.baseId}/Contacts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        fields: airtableRecord,
        typecast: true
      })
    });
    return this.mapFromAirtableContact(response);
  }

  async getContact(id: string): Promise<CRMContact> {
    const response = await this.makeRequest(`/${this.baseId}/Contacts/${id}`);
    return this.mapFromAirtableContact(response);
  }

  async searchContacts(query: string): Promise<CRMContact[]> {
    const filterFormula = `OR(FIND("${query}", {Email}), FIND("${query}", {First Name}), FIND("${query}", {Last Name}), FIND("${query}", {Company}))`;
    const response = await this.makeRequest(`/${this.baseId}/Contacts?filterByFormula=${encodeURIComponent(filterFormula)}`);
    return response.records.map((record: any) => this.mapFromAirtableContact(record));
  }

  async createDeal(deal: Partial<CRMDeal>): Promise<CRMDeal> {
    const airtableRecord = this.mapToAirtableDeal(deal);
    const response = await this.makeRequest(`/${this.baseId}/Deals`, {
      method: 'POST',
      body: JSON.stringify({
        fields: airtableRecord,
        typecast: true
      })
    });
    return this.mapFromAirtableDeal(response);
  }

  async updateDeal(id: string, deal: Partial<CRMDeal>): Promise<CRMDeal> {
    const airtableRecord = this.mapToAirtableDeal(deal);
    const response = await this.makeRequest(`/${this.baseId}/Deals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        fields: airtableRecord,
        typecast: true
      })
    });
    return this.mapFromAirtableDeal(response);
  }

  async getDeal(id: string): Promise<CRMDeal> {
    const response = await this.makeRequest(`/${this.baseId}/Deals/${id}`);
    return this.mapFromAirtableDeal(response);
  }

  async createCompany(company: Partial<CRMCompany>): Promise<CRMCompany> {
    const airtableRecord = this.mapToAirtableCompany(company);
    const response = await this.makeRequest(`/${this.baseId}/Companies`, {
      method: 'POST',
      body: JSON.stringify({
        fields: airtableRecord,
        typecast: true
      })
    });
    return this.mapFromAirtableCompany(response);
  }

  async updateCompany(id: string, company: Partial<CRMCompany>): Promise<CRMCompany> {
    const airtableRecord = this.mapToAirtableCompany(company);
    const response = await this.makeRequest(`/${this.baseId}/Companies/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        fields: airtableRecord,
        typecast: true
      })
    });
    return this.mapFromAirtableCompany(response);
  }

  async getCompany(id: string): Promise<CRMCompany> {
    const response = await this.makeRequest(`/${this.baseId}/Companies/${id}`);
    return this.mapFromAirtableCompany(response);
  }

  async createCampaign(campaign: Partial<CRMCampaign>): Promise<CRMCampaign> {
    const airtableRecord = this.mapToAirtableCampaign(campaign);
    const response = await this.makeRequest(`/${this.baseId}/Campaigns`, {
      method: 'POST',
      body: JSON.stringify({
        fields: airtableRecord,
        typecast: true
      })
    });
    return this.mapFromAirtableCampaign(response);
  }

  async updateCampaign(id: string, campaign: Partial<CRMCampaign>): Promise<CRMCampaign> {
    const airtableRecord = this.mapToAirtableCampaign(campaign);
    const response = await this.makeRequest(`/${this.baseId}/Campaigns/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        fields: airtableRecord,
        typecast: true
      })
    });
    return this.mapFromAirtableCampaign(response);
  }

  async getCampaign(id: string): Promise<CRMCampaign> {
    const response = await this.makeRequest(`/${this.baseId}/Campaigns/${id}`);
    return this.mapFromAirtableCampaign(response);
  }

  async getCustomFields(objectType: string): Promise<Record<string, any>> {
    try {
      const response = await this.makeRequest(`/meta/bases/${this.baseId}/tables`);
      const table = response.tables.find((t: any) => t.name.toLowerCase() === objectType.toLowerCase());

      if (!table) return {};

      const customFields: Record<string, any> = {};
      table.fields.forEach((field: any) => {
        customFields[field.name] = {
          label: field.name,
          type: field.type,
          required: false // Airtable doesn't expose required field info via API
        };
      });

      return customFields;
    } catch (error) {
      console.error('Error fetching Airtable custom fields:', error);
      return {};
    }
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

    // Airtable supports batch operations with up to 10 records per request
    const batchSize = Math.min(10, this.connection.configuration.syncSettings.batchSize);

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);

      try {
        if (operation === 'create') {
          const airtableRecords = batch.map(record => ({
            fields: this.mapToAirtableContact(record),
            typecast: true
          }));

          const response = await this.makeRequest(`/${this.baseId}/Contacts`, {
            method: 'POST',
            body: JSON.stringify({ records: airtableRecords })
          });

          result.recordsCreated += response.records.length;
        } else {
          // Batch update
          const airtableRecords = batch.map(record => ({
            id: record.id,
            fields: this.mapToAirtableContact(record),
            typecast: true
          }));

          const response = await this.makeRequest(`/${this.baseId}/Contacts`, {
            method: 'PATCH',
            body: JSON.stringify({ records: airtableRecords })
          });

          result.recordsUpdated += response.records.length;
        }

        result.recordsProcessed += batch.length;

      } catch (error: any) {
        batch.forEach(record => {
          result.errors.push({
            recordId: record.id || 'unknown',
            error: error.message,
            retryable: true
          });
        });
      }
    }

    result.duration = Date.now() - startTime;
    result.success = result.errors.length === 0;
    return result;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    try {
      // Validate that we have required credentials
      if (!this.apiKey || !this.baseId) {
        throw new Error('Missing Airtable credentials. Please provide both API key and Base ID.');
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        ...options.headers
      };

      console.log(`🔄 Airtable API Request: ${options.method || 'GET'} ${this.baseUrl}${endpoint}`);

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`❌ Airtable API Error ${response.status}:`, errorBody);

        // Handle common Airtable API errors with specific guidance
        if (response.status === 401) {
          throw new Error('Invalid Airtable API key. Please check your credentials.');
        }
        if (response.status === 403) {
          throw new Error('Insufficient permissions. Make sure your API key has base:read and base:write scopes.');
        }
        if (response.status === 404) {
          throw new Error(`Base or table not found. Endpoint: ${endpoint}. Please check your Base ID and table names.`);
        }
        if (response.status === 422) {
          let detailedError = 'Field validation error. ';
          try {
            const errorJson = JSON.parse(errorBody);
            if (errorJson.error && errorJson.error.type === 'INVALID_REQUEST_UNKNOWN') {
              detailedError += 'Unknown field(s) in request. Check field names match exactly.';
            } else if (errorJson.error && errorJson.error.message) {
              detailedError += errorJson.error.message;
            }
          } catch {
            detailedError += errorBody;
          }
          throw new Error(detailedError);
        }

        throw new Error(`Airtable API error: ${response.status} ${response.statusText} - ${errorBody}`);
      }

      const result = await response.json();
      console.log(`✅ Airtable API Success: ${options.method || 'GET'} ${endpoint}`);
      return result;
    } catch (error: any) {
      // Handle specific JSON parsing errors (common when Airtable returns HTML error pages)
      if (error.message && error.message.includes('Unexpected token') && error.message.includes('<!DOCTYPE')) {
        throw new Error('Airtable API returned an HTML error page. This usually means the proxy is not working or CORS is blocking the request. Please restart the development server.');
      }

      // Provide helpful error messages for common issues
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error(`Network Error: Unable to connect to Airtable API. Please check your internet connection and restart the development server. ${error.message}`);
      }

      throw error;
    }
  }

  private mapToAirtableContact(contact: Partial<CRMContact>): any {
    return {
      'Email': contact.email,
      'First Name': contact.firstName,
      'Last Name': contact.lastName,
      'Company': contact.company,
      'Phone': contact.phone,
      'ZENITH Contact ID': contact.id,
      // Add custom fields
      ...Object.entries(contact.customFields || {}).reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {} as any)
    };
  }

  private mapFromAirtableContact(airtableRecord: any): CRMContact {
    const fields = airtableRecord.fields || {};
    return {
      id: airtableRecord.id,
      email: fields['Email'] || '',
      firstName: fields['First Name'],
      lastName: fields['Last Name'],
      company: fields['Company'],
      phone: fields['Phone'],
      customFields: this.extractAirtableCustomFields(fields, ['Email', 'First Name', 'Last Name', 'Company', 'Phone', 'ZENITH Contact ID'])
    };
  }

  private mapToAirtableDeal(deal: Partial<CRMDeal>): any {
    return {
      'Name': deal.name,
      'Amount': deal.amount,
      'Stage': deal.stage,
      'Close Date': deal.closeDate?.toISOString().split('T')[0],
      'Contact': deal.contactId ? [deal.contactId] : undefined, // Assuming linked record
      'Company': deal.companyId ? [deal.companyId] : undefined,
      'ZENITH Deal ID': deal.id,
      ...Object.entries(deal.customFields || {}).reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {} as any)
    };
  }

  private mapFromAirtableDeal(airtableRecord: any): CRMDeal {
    const fields = airtableRecord.fields || {};
    return {
      id: airtableRecord.id,
      name: fields['Name'] || '',
      amount: fields['Amount'],
      stage: fields['Stage'] || 'New',
      closeDate: fields['Close Date'] ? new Date(fields['Close Date']) : undefined,
      contactId: Array.isArray(fields['Contact']) ? fields['Contact'][0] : fields['Contact'],
      companyId: Array.isArray(fields['Company']) ? fields['Company'][0] : fields['Company'],
      customFields: this.extractAirtableCustomFields(fields, ['Name', 'Amount', 'Stage', 'Close Date', 'Contact', 'Company', 'ZENITH Deal ID'])
    };
  }

  private mapToAirtableCompany(company: Partial<CRMCompany>): any {
    // Map to actual Companies table fields in the base
    return {
      'Name': company.name,
      'Domain': company.domain,
      'Industry': company.industry,
      'Size': company.size,
      'ZENITH Company ID': company.id,
      ...Object.entries(company.customFields || {}).reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {} as any)
    };
  }

  private mapFromAirtableCompany(airtableRecord: any): CRMCompany {
    const fields = airtableRecord.fields || {};
    return {
      id: airtableRecord.id,
      name: fields['Name'] || '',
      domain: fields['Domain'],
      industry: fields['Industry'],
      size: fields['Size'],
      customFields: this.extractAirtableCustomFields(fields, ['Name', 'Domain', 'Industry', 'Size', 'ZENITH Company ID'])
    };
  }

  private mapToAirtableCampaign(campaign: Partial<CRMCampaign>): any {
    // Use only the fields that actually exist in the Campaigns table:
    // Name, Type, Status, Start Date, End Date, Budget

    // Create a descriptive name that includes ZENITH ID for tracking
    const campaignName = campaign.name || 'ZENITH Campaign';
    const zenithId = campaign.customFields?.zenith_campaign_id || campaign.id;
    const nameWithId = zenithId ? `${campaignName} [${zenithId.slice(-8)}]` : campaignName;

    return {
      'Name': nameWithId,
      'Type': campaign.type || 'Marketing Campaign',
      'Status': campaign.status || 'Planning',
      'Start Date': campaign.startDate?.toISOString().split('T')[0],
      'End Date': campaign.endDate?.toISOString().split('T')[0],
      'Budget': campaign.budget || 0
    };
  }

  private mapFromAirtableCampaign(airtableRecord: any): CRMCampaign {
    const fields = airtableRecord.fields || {};

    // Extract ZENITH ID from name if present (format: "Campaign Name [zenithId]")
    const name = fields['Name'] || '';
    const zenithIdMatch = name.match(/\[([^\]]+)\]$/);
    const zenithId = zenithIdMatch ? zenithIdMatch[1] : null;

    return {
      id: airtableRecord.id,
      name: zenithId ? name.replace(/\s*\[[^\]]+\]$/, '') : name, // Remove ZENITH ID from display name
      type: fields['Type'] || 'Marketing Campaign',
      status: fields['Status'] || 'Planning',
      startDate: fields['Start Date'] ? new Date(fields['Start Date']) : undefined,
      endDate: fields['End Date'] ? new Date(fields['End Date']) : undefined,
      budget: fields['Budget'] || 0,
      customFields: {
        // Store the extracted ZENITH ID
        zenith_campaign_id: zenithId,
        // Include other custom fields
        ...this.extractAirtableCustomFields(fields, [
          'Name', 'Type', 'Status', 'Start Date', 'End Date', 'Budget'
        ])
      }
    };
  }

  private extractAirtableCustomFields(fields: any, standardFields: string[]): Record<string, any> {
    const customFields: Record<string, any> = {};
    Object.keys(fields).forEach(key => {
      if (!standardFields.includes(key) && fields[key] !== null && fields[key] !== undefined) {
        customFields[key] = fields[key];
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
  static async testConnectionCredentials(config: CRMConfiguration): Promise<{ success: boolean; error?: string }> {
    try {
      // Create a temporary connection for testing
      const tempConnection: CRMConnection = {
        id: 'temp',
        provider: config.provider,
        name: `${config.provider} Test`,
        configuration: config,
        isActive: false,
        lastSync: null,
        syncStatus: 'disconnected',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const provider = this.createProvider(tempConnection);
      const isConnected = await provider.testConnection();

      return { success: isConnected };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async testExistingConnection(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const connection = this.connections.find(conn => conn.id === id);
      if (!connection) {
        return { success: false, error: 'Connection not found' };
      }

      const provider = this.createProvider(connection);
      const isConnected = await provider.testConnection();

      // Update connection status based on test result
      if (isConnected) {
        await this.updateConnectionSyncStatus(id, 'connected');
      } else {
        await this.updateConnectionSyncStatus(id, 'error', 'Connection test failed');
      }

      return { success: isConnected };
    } catch (error: any) {
      await this.updateConnectionSyncStatus(id, 'error', error.message);
      return { success: false, error: error.message };
    }
  }

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
      // Map campaign to CRM campaign with complete metadata
      const crmCampaign: Partial<CRMCampaign> = {
        name: campaign.name,
        type: 'Marketing Campaign',
        status: campaign.status === 'active' ? 'Active' : campaign.status === 'draft' ? 'Planning' : 'Completed',
        startDate: campaign.createdAt,
        customFields: {
          zenith_campaign_id: campaign.id,
          zenith_description: campaign.description,
          zenith_product_description: campaign.productDescription,
          zenith_tags: campaign.tags.join(','),
          zenith_result_data: campaign.result,
          zenith_settings: campaign.settings,
          zenith_created_at: campaign.createdAt.toISOString(),
          zenith_updated_at: campaign.updatedAt.toISOString(),
          zenith_version: campaign.version
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
      case 'airtable':
        return new AirtableProvider(connection);
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
    this.initializeEnvironmentConnections();
  }

  // Auto-create Airtable connection if environment variables are available
  private static initializeEnvironmentConnections(): void {
    // Use the correct Airtable.js environment variable names
    const airtableApiKey = import.meta.env.VITE_AIRTABLE_API_KEY;
    const airtableBaseId = import.meta.env.VITE_AIRTABLE_BASE_ID;

    if (airtableApiKey && airtableBaseId) {
      // Check if we already have an environment-based Airtable connection
      const existingEnvConnection = this.connections.find(
        conn => conn.provider === 'airtable' && conn.name === 'Environment Airtable'
      );

      if (!existingEnvConnection) {
        const envConnection: CRMConnection = {
          id: 'env-airtable',
          provider: 'airtable',
          name: 'Environment Airtable',
          configuration: {
            provider: 'airtable',
            credentials: {
              apiKey: airtableApiKey,
              domain: airtableBaseId
            },
            fieldMappings: [],
            syncSettings: {
              autoSync: false,
              syncInterval: 60,
              syncOnCreate: true,
              syncOnUpdate: false,
              conflictResolution: 'zenith_wins',
              batchSize: 10,
              retryAttempts: 3
            }
          },
          isActive: true,
          lastSync: null,
          syncStatus: 'connected',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        this.connections.push(envConnection);
        this.saveConnections();
        console.log('Auto-created Airtable connection from environment variables');
      } else {
        // Update existing connection to be active
        existingEnvConnection.isActive = true;
        existingEnvConnection.syncStatus = 'connected';
        this.saveConnections();
      }
    }
  }

  // Environment variable status
  static getEnvironmentStatus(): {
    hasAirtableConfig: boolean;
    airtableConfigured: boolean;
    environmentType: 'development' | 'production';
  } {
    // Use correct Airtable.js environment variable names
    const hasAirtableApiKey = !!(import.meta.env.VITE_AIRTABLE_API_KEY);
    const hasAirtableBaseId = !!(import.meta.env.VITE_AIRTABLE_BASE_ID);

    return {
      hasAirtableConfig: hasAirtableApiKey && hasAirtableBaseId,
      airtableConfigured: hasAirtableApiKey || hasAirtableBaseId,
      environmentType: import.meta.env.PROD ? 'production' : 'development'
    };
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