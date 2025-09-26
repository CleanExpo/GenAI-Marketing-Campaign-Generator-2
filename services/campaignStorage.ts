// services/campaignStorage.ts

import { SavedCampaign, CampaignTemplate, UserProfile, CampaignExport } from '../types';

export class CampaignStorageService {
  private static readonly STORAGE_KEYS = {
    CAMPAIGNS: 'zenith_campaigns',
    TEMPLATES: 'zenith_templates',
    USER_PROFILE: 'zenith_user',
    EXPORTS: 'zenith_exports'
  };

  // Campaign Management
  static async saveCampaign(campaign: Omit<SavedCampaign, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<SavedCampaign> {
    const campaigns = this.getAllCampaigns();
    const id = this.generateId();
    const now = new Date();

    const savedCampaign: SavedCampaign = {
      ...campaign,
      id,
      createdAt: now,
      updatedAt: now,
      version: 1
    };

    campaigns.push(savedCampaign);
    this.storeCampaigns(campaigns);

    // Future: Send to CRM/Database
    // await this.syncToCRM(savedCampaign);

    return savedCampaign;
  }

  static async updateCampaign(id: string, updates: Partial<SavedCampaign>): Promise<SavedCampaign | null> {
    const campaigns = this.getAllCampaigns();
    const index = campaigns.findIndex(c => c.id === id);

    if (index === -1) return null;

    const existingCampaign = campaigns[index];
    const updatedCampaign: SavedCampaign = {
      ...existingCampaign,
      ...updates,
      id, // Preserve ID
      updatedAt: new Date(),
      version: existingCampaign.version + 1
    };

    campaigns[index] = updatedCampaign;
    this.storeCampaigns(campaigns);

    // Future: Sync to CRM/Database
    // await this.syncToCRM(updatedCampaign);

    return updatedCampaign;
  }

  static getAllCampaigns(): SavedCampaign[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.CAMPAIGNS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading campaigns:', error);
      return [];
    }
  }

  static getCampaign(id: string): SavedCampaign | null {
    const campaigns = this.getAllCampaigns();
    return campaigns.find(c => c.id === id) || null;
  }

  static async deleteCampaign(id: string): Promise<boolean> {
    const campaigns = this.getAllCampaigns();
    const filtered = campaigns.filter(c => c.id !== id);

    if (filtered.length === campaigns.length) return false;

    this.storeCampaigns(filtered);

    // Future: Delete from CRM/Database
    // await this.deleteFromCRM(id);

    return true;
  }

  static searchCampaigns(query: string, filters?: {
    status?: SavedCampaign['status'];
    tags?: string[];
    dateRange?: { from: Date; to: Date };
  }): SavedCampaign[] {
    let campaigns = this.getAllCampaigns();

    // Text search
    if (query) {
      const searchLower = query.toLowerCase();
      campaigns = campaigns.filter(c =>
        c.name.toLowerCase().includes(searchLower) ||
        c.description.toLowerCase().includes(searchLower) ||
        c.productDescription.toLowerCase().includes(searchLower) ||
        c.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Apply filters
    if (filters?.status) {
      campaigns = campaigns.filter(c => c.status === filters.status);
    }

    if (filters?.tags?.length) {
      campaigns = campaigns.filter(c =>
        filters.tags!.some(tag => c.tags.includes(tag))
      );
    }

    if (filters?.dateRange) {
      const { from, to } = filters.dateRange;
      campaigns = campaigns.filter(c => {
        const created = new Date(c.createdAt);
        return created >= from && created <= to;
      });
    }

    return campaigns.sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  // Template Management
  static getTemplates(): CampaignTemplate[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.TEMPLATES);
      return stored ? JSON.parse(stored) : this.getDefaultTemplates();
    } catch (error) {
      console.error('Error loading templates:', error);
      return this.getDefaultTemplates();
    }
  }

  static saveTemplate(template: Omit<CampaignTemplate, 'id' | 'usageCount'>): CampaignTemplate {
    const templates = this.getTemplates();
    const newTemplate: CampaignTemplate = {
      ...template,
      id: this.generateId(),
      usageCount: 0
    };

    templates.push(newTemplate);
    localStorage.setItem(this.STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));

    return newTemplate;
  }

  static useTemplate(templateId: string): CampaignTemplate | null {
    const templates = this.getTemplates();
    const template = templates.find(t => t.id === templateId);

    if (template) {
      template.usageCount += 1;
      localStorage.setItem(this.STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
    }

    return template || null;
  }

  // Export Management
  static async exportCampaign(campaign: SavedCampaign, format: CampaignExport['format']): Promise<CampaignExport> {
    const exportData: CampaignExport = {
      format,
      data: campaign,
      exportedAt: new Date(),
      exportedBy: 'current-user' // Future: Get from UserProfile
    };

    // Store export history
    const exports = this.getExportHistory();
    exports.push(exportData);
    localStorage.setItem(this.STORAGE_KEYS.EXPORTS, JSON.stringify(exports));

    return exportData;
  }

  static getExportHistory(): CampaignExport[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.EXPORTS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading export history:', error);
      return [];
    }
  }

  // User Profile Management (Future CRM Integration)
  static getUserProfile(): UserProfile | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.USER_PROFILE);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error loading user profile:', error);
      return null;
    }
  }

  static saveUserProfile(profile: UserProfile): void {
    localStorage.setItem(this.STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  }

  // Future CRM Integration Methods (Placeholder)
  private static async syncToCRM(campaign: SavedCampaign): Promise<void> {
    // TODO: Implement CRM synchronization
    // - Salesforce integration
    // - HubSpot integration
    // - Pipedrive integration
    // - Custom webhook integration
    console.log('Future CRM sync for campaign:', campaign.id);
  }

  private static async deleteFromCRM(campaignId: string): Promise<void> {
    // TODO: Implement CRM deletion
    console.log('Future CRM deletion for campaign:', campaignId);
  }

  // Utility Methods
  private static generateId(): string {
    return `zth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static storeCampaigns(campaigns: SavedCampaign[]): void {
    localStorage.setItem(this.STORAGE_KEYS.CAMPAIGNS, JSON.stringify(campaigns));
  }

  private static getDefaultTemplates(): CampaignTemplate[] {
    return [
      {
        id: 'template_saas',
        name: 'SaaS Product Launch',
        category: 'saas',
        description: 'Complete campaign template for SaaS product launches',
        settings: {
          targetPlatforms: ['LinkedIn', 'Twitter', 'Facebook'],
          useGoogleEAT: true,
          generateBacklinks: true,
          defaultImageStyle: 'Modern, Professional, Clean'
        },
        isPublic: true,
        usageCount: 0
      },
      {
        id: 'template_ecommerce',
        name: 'E-commerce Product',
        category: 'ecommerce',
        description: 'Optimized for product sales and conversions',
        settings: {
          targetPlatforms: ['Instagram', 'Facebook', 'Pinterest', 'TikTok'],
          findTrendingTopics: true,
          defaultImageStyle: 'Vibrant, Eye-catching, Product-focused'
        },
        isPublic: true,
        usageCount: 0
      },
      {
        id: 'template_healthcare',
        name: 'Healthcare Services',
        category: 'healthcare',
        description: 'Compliant healthcare marketing campaigns',
        settings: {
          useGoogleEAT: true,
          generateVerifiableText: true,
          targetPlatforms: ['LinkedIn', 'Facebook'],
          defaultImageStyle: 'Professional, Trustworthy, Medical'
        },
        isPublic: true,
        usageCount: 0
      }
    ];
  }
}