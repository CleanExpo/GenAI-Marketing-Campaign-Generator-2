/**
 * Comprehensive Airtable Service
 * Handles all Airtable operations with staff accountability and project management
 */

import Airtable from 'airtable';

// Core interfaces for Airtable integration
export interface AirtableConfig {
  apiKey: string;
  baseId: string;
  retryAttempts?: number;
  rateLimitDelay?: number;
}

export interface StaffMember {
  id: string;
  email: string;
  name: string;
  role: 'Admin' | 'Manager' | 'Creator' | 'Viewer';
  department?: string;
  phone?: string;
  profilePhoto?: string;
  assignedProjects: string[];
  isActive: boolean;
  createdAt: Date;
  lastActivity?: Date;
  workloadScore: number; // 0-100, calculated based on current assignments
  performanceRating: number; // 1-5 stars
}

export interface CampaignRecord {
  id: string;
  title: string;
  description: string;
  status: 'Draft' | 'In Review' | 'Approved' | 'In Production' | 'Completed' | 'Archived';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  clientId?: string;
  assignedStaff: string[]; // Staff member IDs
  createdBy: string; // Staff member ID
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  budget?: number;
  tags: string[];
  campaignData: any; // The AI-generated campaign content
  approvalHistory: ApprovalRecord[];
  projectId?: string;
  estimatedHours: number;
  actualHours: number;
  completionPercentage: number;
}

export interface ProjectRecord {
  id: string;
  name: string;
  description: string;
  clientId: string;
  status: 'Planning' | 'Active' | 'On Hold' | 'Completed' | 'Cancelled';
  startDate: Date;
  endDate?: Date;
  budget: number;
  assignedStaff: string[];
  projectManager: string; // Staff member ID
  campaigns: string[]; // Campaign IDs
  milestones: ProjectMilestone[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientRecord {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company: string;
  industry: string;
  contactPerson: string;
  brandKit?: any; // Brand kit data
  projects: string[]; // Project IDs
  accountManager: string; // Staff member ID
  createdAt: Date;
  lastContact?: Date;
  notes?: string;
  status: 'Active' | 'Inactive' | 'Prospect';
}

export interface ApprovalRecord {
  id: string;
  campaignId: string;
  approvedBy: string; // Staff member ID
  status: 'Pending' | 'Approved' | 'Rejected' | 'Requires Changes';
  comments?: string;
  timestamp: Date;
  version: number;
}

export interface ProjectMilestone {
  id: string;
  name: string;
  description: string;
  dueDate: Date;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Overdue';
  assignedTo: string; // Staff member ID
  completedAt?: Date;
  deliverables: string[];
}

export interface ActivityLog {
  id: string;
  staffId: string;
  action: 'Campaign Created' | 'Campaign Updated' | 'Campaign Approved' | 'Project Assigned' | 'Task Completed' | 'Client Contact' | 'File Uploaded';
  resourceId: string; // Campaign, Project, or Client ID
  resourceType: 'Campaign' | 'Project' | 'Client' | 'Task';
  details: string;
  metadata?: any;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface WorkloadAnalytics {
  staffId: string;
  currentProjects: number;
  currentCampaigns: number;
  completedThisMonth: number;
  averageCompletionTime: number; // in hours
  performanceScore: number; // 0-100
  utilizationRate: number; // 0-100 percentage
  upcomingDeadlines: number;
  overdueItems: number;
}

// Airtable Table Names
export const AIRTABLE_TABLES = {
  STAFF: 'Staff',
  CAMPAIGNS: 'Campaigns',
  PROJECTS: 'Projects',
  CLIENTS: 'Clients',
  APPROVALS: 'Approvals',
  ACTIVITY_LOGS: 'Activity_Logs',
  ASSIGNMENTS: 'Assignments',
  MILESTONES: 'Milestones'
} as const;

class AirtableService {
  private static instance: AirtableService;
  private base: Airtable.Base | null = null;
  private config: AirtableConfig | null = null;
  private rateLimitQueue: Promise<any>[] = [];
  private lastRequestTime = 0;
  private readonly MIN_REQUEST_INTERVAL = 200; // 5 requests per second max

  private constructor() {}

  static getInstance(): AirtableService {
    if (!AirtableService.instance) {
      AirtableService.instance = new AirtableService();
    }
    return AirtableService.instance;
  }

  /**
   * Initialize Airtable connection
   */
  async initialize(config: AirtableConfig): Promise<void> {
    try {
      this.config = {
        retryAttempts: 3,
        rateLimitDelay: 200,
        ...config
      };

      Airtable.configure({
        endpointUrl: 'https://api.airtable.com',
        apiKey: config.apiKey
      });

      this.base = Airtable.base(config.baseId);

      // Test connection
      await this.testConnection();

      console.log('✅ Airtable connection initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Airtable connection:', error);
      throw new Error('Airtable initialization failed');
    }
  }

  /**
   * Test Airtable connection
   */
  private async testConnection(): Promise<void> {
    if (!this.base) {
      throw new Error('Airtable not initialized');
    }

    try {
      // Try to access the base by attempting to list tables (most permissive test)
      // If no specific table exists, try common table names in order of preference
      const testTables = ['Staff', 'Campaigns', 'Projects', 'Clients', 'Table1', 'Table 1'];

      let connectionSuccess = false;
      let lastError = null;

      for (const tableName of testTables) {
        try {
          await this.base(tableName)
            .select({ maxRecords: 1 })
            .firstPage();
          connectionSuccess = true;
          console.log(`✅ Airtable connection verified using table: ${tableName}`);
          break;
        } catch (error) {
          lastError = error;
          console.log(`⚠️ Table '${tableName}' not accessible, trying next...`);
          continue;
        }
      }

      if (!connectionSuccess) {
        console.error('❌ No accessible tables found in base');
        throw new Error(`Connection test failed - no accessible tables found. Last error: ${lastError?.message || 'Unknown error'}`);
      }
    } catch (error) {
      if (error.message.includes('Connection test failed')) {
        throw error;
      }
      throw new Error(`Connection test failed - check API key and base ID. Error: ${error.message}`);
    }
  }

  /**
   * Rate limiting helper
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      await new Promise(resolve =>
        setTimeout(resolve, this.MIN_REQUEST_INTERVAL - timeSinceLastRequest)
      );
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Generic record creation with retry logic
   */
  private async createRecord<T>(tableName: string, fields: any, retries = 0): Promise<T> {
    if (!this.base) {
      throw new Error('Airtable not initialized');
    }

    try {
      await this.enforceRateLimit();

      const record = await this.base(tableName).create(fields);
      return {
        id: record.id,
        ...record.fields,
        createdAt: record.get('Created') || new Date()
      } as T;

    } catch (error: any) {
      if (retries < (this.config?.retryAttempts || 3) && this.isRetryableError(error)) {
        console.warn(`Retrying request to ${tableName}... Attempt ${retries + 1}`);
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
        return this.createRecord<T>(tableName, fields, retries + 1);
      }
      throw error;
    }
  }

  /**
   * Generic record update with retry logic
   */
  private async updateRecord<T>(tableName: string, recordId: string, fields: any, retries = 0): Promise<T> {
    if (!this.base) {
      throw new Error('Airtable not initialized');
    }

    try {
      await this.enforceRateLimit();

      const record = await this.base(tableName).update(recordId, fields);
      return {
        id: record.id,
        ...record.fields,
        updatedAt: new Date()
      } as T;

    } catch (error: any) {
      if (retries < (this.config?.retryAttempts || 3) && this.isRetryableError(error)) {
        console.warn(`Retrying update to ${tableName}... Attempt ${retries + 1}`);
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
        return this.updateRecord<T>(tableName, recordId, fields, retries + 1);
      }
      throw error;
    }
  }

  /**
   * Generic record retrieval
   */
  private async getRecords<T>(
    tableName: string,
    options?: {
      filterByFormula?: string;
      sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
      maxRecords?: number;
      fields?: string[];
    }
  ): Promise<T[]> {
    if (!this.base) {
      throw new Error('Airtable not initialized');
    }

    try {
      await this.enforceRateLimit();

      const records = await this.base(tableName).select(options || {}).all();

      return records.map(record => ({
        id: record.id,
        ...record.fields,
        createdAt: record.get('Created') || new Date(),
        updatedAt: record.get('Last Modified') || new Date()
      })) as T[];

    } catch (error) {
      console.error(`Error fetching records from ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    const retryableStatusCodes = [429, 502, 503, 504];
    return retryableStatusCodes.includes(error.statusCode) ||
           error.message?.includes('RATE_LIMIT') ||
           error.message?.includes('CONNECTION_ERROR');
  }

  // STAFF MANAGEMENT METHODS

  /**
   * Create new staff member
   */
  async createStaffMember(staffData: Omit<StaffMember, 'id' | 'createdAt' | 'workloadScore' | 'performanceRating'>): Promise<StaffMember> {
    const fields = {
      'Email': staffData.email,
      'Name': staffData.name,
      'Role': staffData.role,
      'Department': staffData.department || '',
      'Phone': staffData.phone || '',
      'Profile Photo': staffData.profilePhoto ? [{ url: staffData.profilePhoto }] : [],
      'Assigned Projects': staffData.assignedProjects,
      'Active': staffData.isActive,
      'Workload Score': 0,
      'Performance Rating': 3
    };

    return this.createRecord<StaffMember>(AIRTABLE_TABLES.STAFF, fields);
  }

  /**
   * Get all staff members
   */
  async getStaffMembers(activeOnly: boolean = true): Promise<StaffMember[]> {
    try {
      const filterByFormula = activeOnly ? '{Active} = 1' : '';

      return this.getRecords<StaffMember>(AIRTABLE_TABLES.STAFF, {
        filterByFormula,
        sort: [{ field: 'Name', direction: 'asc' }]
      });
    } catch (error) {
      console.warn('⚠️ Staff table access denied or unavailable:', error.message);
      // Return empty array to prevent UI crashes
      return [];
    }
  }

  /**
   * Get staff member by ID
   */
  async getStaffMember(staffId: string): Promise<StaffMember | null> {
    try {
      if (!this.base) {
        throw new Error('Airtable not initialized');
      }

      await this.enforceRateLimit();
      const record = await this.base(AIRTABLE_TABLES.STAFF).find(staffId);

      return {
        id: record.id,
        ...record.fields,
        createdAt: record.get('Created') || new Date()
      } as StaffMember;

    } catch (error) {
      console.error('Error fetching staff member:', error);
      return null;
    }
  }

  /**
   * Update staff member
   */
  async updateStaffMember(staffId: string, updates: Partial<StaffMember>): Promise<StaffMember> {
    const fields: any = {};

    if (updates.email) fields['Email'] = updates.email;
    if (updates.name) fields['Name'] = updates.name;
    if (updates.role) fields['Role'] = updates.role;
    if (updates.department) fields['Department'] = updates.department;
    if (updates.phone) fields['Phone'] = updates.phone;
    if (updates.assignedProjects) fields['Assigned Projects'] = updates.assignedProjects;
    if (updates.isActive !== undefined) fields['Active'] = updates.isActive;
    if (updates.workloadScore !== undefined) fields['Workload Score'] = updates.workloadScore;
    if (updates.performanceRating !== undefined) fields['Performance Rating'] = updates.performanceRating;

    return this.updateRecord<StaffMember>(AIRTABLE_TABLES.STAFF, staffId, fields);
  }

  // CAMPAIGN MANAGEMENT METHODS

  /**
   * Create new campaign
   */
  async createCampaign(campaignData: Omit<CampaignRecord, 'id' | 'createdAt' | 'updatedAt' | 'approvalHistory'>): Promise<CampaignRecord> {
    const fields = {
      'Title': campaignData.title,
      'Description': campaignData.description,
      'Status': campaignData.status,
      'Priority': campaignData.priority,
      'Client': campaignData.clientId ? [campaignData.clientId] : [],
      'Assigned Staff': campaignData.assignedStaff,
      'Created By': [campaignData.createdBy],
      'Due Date': campaignData.dueDate?.toISOString(),
      'Budget': campaignData.budget || 0,
      'Tags': campaignData.tags.join(', '),
      'Campaign Data': JSON.stringify(campaignData.campaignData),
      'Project': campaignData.projectId ? [campaignData.projectId] : [],
      'Estimated Hours': campaignData.estimatedHours,
      'Actual Hours': campaignData.actualHours,
      'Completion Percentage': campaignData.completionPercentage
    };

    const campaign = await this.createRecord<CampaignRecord>(AIRTABLE_TABLES.CAMPAIGNS, fields);

    // Log activity
    await this.logActivity({
      staffId: campaignData.createdBy,
      action: 'Campaign Created',
      resourceId: campaign.id,
      resourceType: 'Campaign',
      details: `Created campaign: ${campaignData.title}`,
      timestamp: new Date()
    });

    return campaign;
  }

  /**
   * Get campaigns with filtering
   */
  async getCampaigns(options?: {
    status?: string[];
    assignedTo?: string;
    clientId?: string;
    projectId?: string;
    limit?: number;
  }): Promise<CampaignRecord[]> {
    try {
      // First, check if the table has any records and field structure
      const testRecord = await this.base!(AIRTABLE_TABLES.CAMPAIGNS)
        .select({ maxRecords: 1 })
        .firstPage();

      // If table is empty or has no fields, throw specific error
      if (testRecord.length === 0 || Object.keys(testRecord[0]?.fields || {}).length === 0) {
        console.warn('⚠️ Campaigns table exists but has no records or field structure');
        throw new Error('Campaigns table field structure incomplete. Please add required fields: Title, Description, Status, Priority');
      }

      // Check if required fields exist
      const firstRecord = testRecord[0];
      const hasRequiredFields = ['Title', 'Status'].some(field =>
        Object.keys(firstRecord.fields).includes(field)
      );

      if (!hasRequiredFields) {
        console.warn('⚠️ Campaigns table missing required fields (Title, Status)');
        throw new Error('Campaigns table field structure incomplete. Missing required fields: Title, Status');
      }

      // Build filters only if we have proper field structure
      let filterFormula = '';
      const filters: string[] = [];

      if (options?.status && options.status.length > 0) {
        const statusFilter = options.status.map(s => `{Status} = '${s}'`).join(', ');
        filters.push(`OR(${statusFilter})`);
      }

      if (options?.assignedTo) {
        filters.push(`FIND('${options.assignedTo}', ARRAYJOIN({Assigned Staff}, ',')) > 0`);
      }

      if (options?.clientId) {
        filters.push(`FIND('${options.clientId}', ARRAYJOIN({Client}, ',')) > 0`);
      }

      if (options?.projectId) {
        filters.push(`FIND('${options.projectId}', ARRAYJOIN({Project}, ',')) > 0`);
      }

      if (filters.length > 0) {
        filterFormula = filters.length === 1 ? filters[0] : `AND(${filters.join(', ')})`;
      }

      // Only sort by fields that exist
      const sortFields = [];
      if (Object.keys(firstRecord.fields).includes('Priority')) {
        sortFields.push({ field: 'Priority', direction: 'desc' as const });
      }
      if (Object.keys(firstRecord.fields).includes('Due Date')) {
        sortFields.push({ field: 'Due Date', direction: 'asc' as const });
      }

      return this.getRecords<CampaignRecord>(AIRTABLE_TABLES.CAMPAIGNS, {
        filterByFormula: filterFormula,
        sort: sortFields.length > 0 ? sortFields : undefined,
        maxRecords: options?.limit || 100
      });

    } catch (error) {
      console.error('Error in getCampaigns:', error);
      // Return empty array instead of throwing error to prevent UI crashes
      return [];
    }
  }

  /**
   * Update campaign
   */
  async updateCampaign(campaignId: string, updates: Partial<CampaignRecord>, updatedBy: string): Promise<CampaignRecord> {
    const fields: any = {};

    if (updates.title) fields['Title'] = updates.title;
    if (updates.description) fields['Description'] = updates.description;
    if (updates.status) fields['Status'] = updates.status;
    if (updates.priority) fields['Priority'] = updates.priority;
    if (updates.assignedStaff) fields['Assigned Staff'] = updates.assignedStaff;
    if (updates.dueDate) fields['Due Date'] = updates.dueDate.toISOString();
    if (updates.budget !== undefined) fields['Budget'] = updates.budget;
    if (updates.tags) fields['Tags'] = updates.tags.join(', ');
    if (updates.campaignData) fields['Campaign Data'] = JSON.stringify(updates.campaignData);
    if (updates.completionPercentage !== undefined) fields['Completion Percentage'] = updates.completionPercentage;
    if (updates.actualHours !== undefined) fields['Actual Hours'] = updates.actualHours;

    const campaign = await this.updateRecord<CampaignRecord>(AIRTABLE_TABLES.CAMPAIGNS, campaignId, fields);

    // Log activity
    await this.logActivity({
      staffId: updatedBy,
      action: 'Campaign Updated',
      resourceId: campaignId,
      resourceType: 'Campaign',
      details: `Updated campaign: ${updates.title || 'Unknown'}`,
      timestamp: new Date()
    });

    return campaign;
  }

  // PROJECT MANAGEMENT METHODS

  /**
   * Create new project
   */
  async createProject(projectData: Omit<ProjectRecord, 'id' | 'createdAt' | 'updatedAt' | 'campaigns'>): Promise<ProjectRecord> {
    const fields = {
      'Name': projectData.name,
      'Description': projectData.description,
      'Client': [projectData.clientId],
      'Status': projectData.status,
      'Start Date': projectData.startDate.toISOString(),
      'End Date': projectData.endDate?.toISOString(),
      'Budget': projectData.budget,
      'Assigned Staff': projectData.assignedStaff,
      'Project Manager': [projectData.projectManager],
      'Milestones': JSON.stringify(projectData.milestones)
    };

    return this.createRecord<ProjectRecord>(AIRTABLE_TABLES.PROJECTS, fields);
  }

  /**
   * Get projects
   */
  async getProjects(options?: {
    status?: string[];
    managedBy?: string;
    clientId?: string;
  }): Promise<ProjectRecord[]> {
    try {
      let filterFormula = '';
      const filters: string[] = [];

      if (options?.status && options.status.length > 0) {
        const statusFilter = options.status.map(s => `{Status} = '${s}'`).join(', ');
        filters.push(`OR(${statusFilter})`);
      }

      if (options?.managedBy) {
        filters.push(`FIND('${options.managedBy}', ARRAYJOIN({Project Manager}, ',')) > 0`);
      }

      if (options?.clientId) {
        filters.push(`FIND('${options.clientId}', ARRAYJOIN({Client}, ',')) > 0`);
      }

      if (filters.length > 0) {
        filterFormula = filters.length === 1 ? filters[0] : `AND(${filters.join(', ')})`;
      }

      return this.getRecords<ProjectRecord>(AIRTABLE_TABLES.PROJECTS, {
        filterByFormula: filterFormula,
        sort: [{ field: 'Start Date', direction: 'desc' }]
      });
    } catch (error) {
      console.warn('⚠️ Projects table access error:', error.message);
      // Return empty array to prevent UI crashes
      return [];
    }
  }

  // CLIENT MANAGEMENT METHODS

  /**
   * Create new client
   */
  async createClient(clientData: Omit<ClientRecord, 'id' | 'createdAt' | 'projects'>): Promise<ClientRecord> {
    const fields = {
      'Name': clientData.name,
      'Email': clientData.email,
      'Phone': clientData.phone || '',
      'Company': clientData.company,
      'Industry': clientData.industry,
      'Contact Person': clientData.contactPerson,
      'Brand Kit': clientData.brandKit ? JSON.stringify(clientData.brandKit) : '',
      'Account Manager': [clientData.accountManager],
      'Last Contact': clientData.lastContact?.toISOString(),
      'Notes': clientData.notes || '',
      'Status': clientData.status
    };

    return this.createRecord<ClientRecord>(AIRTABLE_TABLES.CLIENTS, fields);
  }

  /**
   * Get clients
   */
  async getClients(activeOnly: boolean = true): Promise<ClientRecord[]> {
    const filterByFormula = activeOnly ? '{Status} = "Active"' : '';

    return this.getRecords<ClientRecord>(AIRTABLE_TABLES.CLIENTS, {
      filterByFormula,
      sort: [{ field: 'Company', direction: 'asc' }]
    });
  }

  // ACTIVITY LOGGING

  /**
   * Log user activity
   */
  async logActivity(activity: Omit<ActivityLog, 'id'>): Promise<ActivityLog> {
    const fields = {
      'Staff': [activity.staffId],
      'Action': activity.action,
      'Resource ID': activity.resourceId,
      'Resource Type': activity.resourceType,
      'Details': activity.details,
      'Metadata': activity.metadata ? JSON.stringify(activity.metadata) : '',
      'Timestamp': activity.timestamp.toISOString(),
      'IP Address': activity.ipAddress || '',
      'User Agent': activity.userAgent || ''
    };

    return this.createRecord<ActivityLog>(AIRTABLE_TABLES.ACTIVITY_LOGS, fields);
  }

  /**
   * Get activity logs
   */
  async getActivityLogs(options?: {
    staffId?: string;
    resourceType?: string;
    resourceId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<ActivityLog[]> {
    let filterFormula = '';
    const filters: string[] = [];

    if (options?.staffId) {
      filters.push(`FIND('${options.staffId}', ARRAYJOIN({Staff}, ',')) > 0`);
    }

    if (options?.resourceType) {
      filters.push(`{Resource Type} = '${options.resourceType}'`);
    }

    if (options?.resourceId) {
      filters.push(`{Resource ID} = '${options.resourceId}'`);
    }

    if (options?.startDate) {
      filters.push(`{Timestamp} >= '${options.startDate.toISOString()}'`);
    }

    if (options?.endDate) {
      filters.push(`{Timestamp} <= '${options.endDate.toISOString()}'`);
    }

    if (filters.length > 0) {
      filterFormula = filters.length === 1 ? filters[0] : `AND(${filters.join(', ')})`;
    }

    return this.getRecords<ActivityLog>(AIRTABLE_TABLES.ACTIVITY_LOGS, {
      filterByFormula: filterFormula,
      sort: [{ field: 'Timestamp', direction: 'desc' }],
      maxRecords: options?.limit || 50
    });
  }

  // ANALYTICS METHODS

  /**
   * Get staff workload analytics
   */
  async getStaffWorkload(staffId: string): Promise<WorkloadAnalytics> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get staff projects and campaigns
    const [projects, campaigns, activityLogs] = await Promise.all([
      this.getProjects({ managedBy: staffId, status: ['Planning', 'Active'] }),
      this.getCampaigns({ assignedTo: staffId, status: ['Draft', 'In Review', 'In Production'] }),
      this.getActivityLogs({
        staffId,
        startDate: monthStart,
        endDate: now
      })
    ]);

    // Calculate completion metrics
    const completedThisMonth = activityLogs.filter(
      log => log.action === 'Campaign Approved' || log.action === 'Task Completed'
    ).length;

    // Calculate average completion time (simplified calculation)
    const completedCampaigns = await this.getCampaigns({
      assignedTo: staffId,
      status: ['Completed']
    });

    let avgCompletionTime = 0;
    if (completedCampaigns.length > 0) {
      const totalTime = completedCampaigns.reduce((sum, campaign) =>
        sum + (campaign.actualHours || campaign.estimatedHours || 0), 0
      );
      avgCompletionTime = totalTime / completedCampaigns.length;
    }

    // Count upcoming deadlines (next 7 days)
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingDeadlines = campaigns.filter(
      campaign => campaign.dueDate &&
                  new Date(campaign.dueDate) <= nextWeek &&
                  new Date(campaign.dueDate) > now
    ).length;

    // Count overdue items
    const overdueItems = campaigns.filter(
      campaign => campaign.dueDate && new Date(campaign.dueDate) < now
    ).length;

    // Calculate performance score (0-100)
    const performanceScore = Math.min(100, Math.max(0,
      (completedThisMonth * 20) - (overdueItems * 10) +
      (upcomingDeadlines > 0 ? 10 : 0)
    ));

    // Calculate utilization rate (based on estimated vs actual capacity)
    const totalEstimatedHours = campaigns.reduce((sum, campaign) =>
      sum + (campaign.estimatedHours || 0), 0
    );
    const utilizationRate = Math.min(100, (totalEstimatedHours / 40) * 100); // Assuming 40h/week capacity

    return {
      staffId,
      currentProjects: projects.length,
      currentCampaigns: campaigns.length,
      completedThisMonth,
      averageCompletionTime: avgCompletionTime,
      performanceScore,
      utilizationRate,
      upcomingDeadlines,
      overdueItems
    };
  }

  /**
   * Bulk update staff workload scores
   */
  async updateAllStaffWorkloads(): Promise<void> {
    const staffMembers = await this.getStaffMembers();

    for (const staff of staffMembers) {
      try {
        const workload = await this.getStaffWorkload(staff.id);
        await this.updateStaffMember(staff.id, {
          workloadScore: workload.utilizationRate,
          performanceRating: Math.round(workload.performanceScore / 20) // Convert to 1-5 scale
        });
      } catch (error) {
        console.error(`Failed to update workload for staff ${staff.id}:`, error);
      }
    }
  }
}

// Export singleton instance
export const airtableService = AirtableService.getInstance();

// Initialize with environment variables
export const initializeAirtable = async (): Promise<void> => {
  const apiKey = import.meta.env.VITE_AIRTABLE_API_KEY;
  const baseId = import.meta.env.VITE_AIRTABLE_BASE_ID;

  if (!apiKey || !baseId) {
    throw new Error('Missing Airtable configuration. Please set VITE_AIRTABLE_API_KEY and VITE_AIRTABLE_BASE_ID environment variables.');
  }

  await airtableService.initialize({
    apiKey,
    baseId,
    retryAttempts: 3,
    rateLimitDelay: 200
  });
};

export default airtableService;