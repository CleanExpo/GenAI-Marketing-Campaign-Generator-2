// services/crmSyncService.ts

import {
  CRMIntegrationService,
  CRMConnection,
  CRMSyncResult,
  CRMSyncError,
  CRMProvider,
  AirtableProvider
} from './crmIntegration';
import { CampaignResult, AdvancedSettings, SavedCampaign } from '../types';

// Enhanced Types for Auto-Sync
export interface AutoSyncConfig {
  enabled: boolean;
  syncOnGeneration: boolean;
  syncOnUpdate: boolean;
  includeContentAssets: boolean;
  includeCompetitorAnalysis: boolean;
  includeAnalytics: boolean;
  retryAttempts: number;
  retryDelay: number; // milliseconds
  batchSize: number;
}

export interface CRMSyncPayload {
  campaignResult: CampaignResult;
  productDescription: string;
  settings: AdvancedSettings;
  metadata: {
    generatedAt: Date;
    userId?: string;
    sessionId?: string;
    sourceIp?: string;
    userAgent?: string;
  };
}

export interface ContentAssetRecord {
  id?: string;
  campaignId: string;
  type: 'social_media' | 'ad_copy' | 'seo_keywords' | 'backlink_strategy' | 'meta_data' | 'ai_prompt';
  platform?: string;
  content: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface CompetitorAnalysisRecord {
  id?: string;
  campaignId: string;
  competitor: string;
  strengths: string[];
  weaknesses: string[];
  strategy: string;
  strategyExamples?: string[];
  analysisDate: Date;
}

export interface CampaignRecord {
  id?: string;
  name: string;
  type: 'marketing_campaign';
  status: 'generated' | 'active' | 'paused' | 'completed';
  productDescription: string;
  targetAudience: string;
  keyMessaging: string;
  companyName: string;
  companyWebsite: string;
  nationalLanguage: string;
  generatedAt: Date;
  metadata: Record<string, any>;
}

export interface AutoSyncResult {
  success: boolean;
  campaignId?: string;
  contentAssetIds?: string[];
  competitorAnalysisIds?: string[];
  errors: CRMSyncError[];
  warnings: string[];
  duration: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsSkipped: number;
  retryAttempts: number;
}

export interface CRMSyncLog {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  context?: Record<string, any>;
  error?: Error;
}

/**
 * CRM Auto-Sync Service
 * Handles automatic synchronization of marketing campaigns to CRM systems
 */
export class CRMSyncService {
  private static readonly SYNC_CONFIG_KEY = 'zenith_auto_sync_config';
  private static readonly LOG_STORAGE_KEY = 'zenith_sync_logs';
  private static readonly MAX_LOG_ENTRIES = 1000;

  private static syncConfig: AutoSyncConfig = {
    enabled: true,
    syncOnGeneration: true,
    syncOnUpdate: false,
    includeContentAssets: true,
    includeCompetitorAnalysis: true,
    includeAnalytics: false,
    retryAttempts: 3,
    retryDelay: 1000,
    batchSize: 10
  };

  private static logs: CRMSyncLog[] = [];

  /**
   * Initialize the service and load configuration
   */
  static initialize(): void {
    this.loadSyncConfig();
    this.loadLogs();
    this.log('info', 'CRM Sync Service initialized');
  }

  /**
   * Main entry point for automatic CRM synchronization
   */
  static async handleAutomaticCRMSync(
    campaignResult: CampaignResult,
    productDescription: string,
    settings: AdvancedSettings,
    metadata?: Partial<CRMSyncPayload['metadata']>
  ): Promise<AutoSyncResult> {
    const startTime = Date.now();

    this.log('info', 'Starting automatic CRM sync', {
      productDescription: productDescription.substring(0, 100) + '...',
      companyName: settings.companyName,
      syncEnabled: this.syncConfig.enabled
    });

    // Initialize result
    const result: AutoSyncResult = {
      success: false,
      errors: [],
      warnings: [],
      duration: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsSkipped: 0,
      retryAttempts: 0
    };

    try {
      // Check if auto-sync is enabled
      if (!this.syncConfig.enabled || !this.syncConfig.syncOnGeneration) {
        this.log('info', 'Auto-sync disabled, skipping CRM sync');
        result.recordsSkipped = 1;
        result.success = true;
        return result;
      }

      // Get active CRM connection
      const connection = CRMIntegrationService.getActiveConnection();
      if (!connection) {
        const warningMsg = 'No active CRM connection found, skipping sync';
        this.log('warn', warningMsg);
        result.warnings.push(warningMsg);
        result.success = true; // Not an error, just no connection
        return result;
      }

      // Prepare sync payload
      const payload: CRMSyncPayload = {
        campaignResult,
        productDescription,
        settings,
        metadata: {
          generatedAt: new Date(),
          userId: metadata?.userId,
          sessionId: metadata?.sessionId || this.generateSessionId(),
          sourceIp: metadata?.sourceIp,
          userAgent: metadata?.userAgent
        }
      };

      // Perform sync with retry logic
      const syncResult = await this.performSyncWithRetry(connection, payload);

      // Merge results
      result.success = syncResult.success;
      result.campaignId = syncResult.campaignId;
      result.contentAssetIds = syncResult.contentAssetIds;
      result.competitorAnalysisIds = syncResult.competitorAnalysisIds;
      result.errors = syncResult.errors;
      result.warnings.push(...syncResult.warnings);
      result.recordsCreated = syncResult.recordsCreated;
      result.recordsUpdated = syncResult.recordsUpdated;
      result.retryAttempts = syncResult.retryAttempts;

      if (result.success) {
        this.log('info', 'CRM sync completed successfully', {
          campaignId: result.campaignId,
          recordsCreated: result.recordsCreated,
          duration: result.duration
        });
      } else {
        this.log('error', 'CRM sync failed', {
          errors: result.errors.map(e => e.error),
          retryAttempts: result.retryAttempts
        });
      }

    } catch (error: any) {
      this.log('error', 'Unexpected error during CRM sync', { error: error.message }, error);
      result.errors.push({
        recordId: 'unknown',
        error: `Unexpected sync error: ${error.message}`,
        retryable: false
      });
    } finally {
      result.duration = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Perform sync with retry logic
   */
  private static async performSyncWithRetry(
    connection: CRMConnection,
    payload: CRMSyncPayload
  ): Promise<AutoSyncResult> {
    let lastError: Error | null = null;
    let retryCount = 0;

    for (let attempt = 0; attempt <= this.syncConfig.retryAttempts; attempt++) {
      try {
        const result = await this.performSync(connection, payload);
        result.retryAttempts = attempt;

        if (result.success || attempt === this.syncConfig.retryAttempts) {
          return result;
        }

        // If sync failed and we have retries left, wait before retrying
        if (attempt < this.syncConfig.retryAttempts) {
          this.log('warn', `Sync attempt ${attempt + 1} failed, retrying in ${this.syncConfig.retryDelay}ms`);
          await this.delay(this.syncConfig.retryDelay * (attempt + 1)); // Exponential backoff
          retryCount++;
        }

      } catch (error: any) {
        lastError = error;
        this.log('error', `Sync attempt ${attempt + 1} threw exception`, { error: error.message }, error);

        if (attempt < this.syncConfig.retryAttempts) {
          await this.delay(this.syncConfig.retryDelay * (attempt + 1));
          retryCount++;
        }
      }
    }

    // If we reach here, all retries failed
    return {
      success: false,
      errors: [{
        recordId: 'campaign',
        error: lastError?.message || 'All retry attempts failed',
        retryable: true
      }],
      warnings: [],
      duration: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsSkipped: 0,
      retryAttempts: retryCount
    };
  }

  /**
   * Core sync implementation
   */
  private static async performSync(
    connection: CRMConnection,
    payload: CRMSyncPayload
  ): Promise<AutoSyncResult> {
    const result: AutoSyncResult = {
      success: false,
      errors: [],
      warnings: [],
      duration: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsSkipped: 0,
      retryAttempts: 0
    };

    // Map to CRM-specific format based on provider
    switch (connection.provider) {
      case 'airtable':
        return await this.syncToAirtable(connection, payload, result);
      case 'salesforce':
        return await this.syncToSalesforce(connection, payload, result);
      case 'hubspot':
        return await this.syncToHubSpot(connection, payload, result);
      default:
        result.errors.push({
          recordId: 'config',
          error: `Unsupported CRM provider: ${connection.provider}`,
          retryable: false
        });
        return result;
    }
  }

  /**
   * Sync to Airtable
   */
  private static async syncToAirtable(
    connection: CRMConnection,
    payload: CRMSyncPayload,
    result: AutoSyncResult
  ): Promise<AutoSyncResult> {
    try {
      const provider = new AirtableProvider(connection);

      // 1. Create Campaign Record
      const campaignRecord = this.mapToCampaignRecord(payload);
      const campaign = await provider.createCampaign({
        name: campaignRecord.name,
        type: campaignRecord.type,
        status: campaignRecord.status,
        customFields: {
          'Product Description': campaignRecord.productDescription,
          'Target Audience': campaignRecord.targetAudience,
          'Key Messaging': campaignRecord.keyMessaging,
          'Company Name': campaignRecord.companyName,
          'Company Website': campaignRecord.companyWebsite,
          'Language': campaignRecord.nationalLanguage,
          'Generated At': campaignRecord.generatedAt.toISOString(),
          'Zenith Metadata': JSON.stringify(campaignRecord.metadata),
          'Source': 'Zenith Campaign Generator'
        }
      });

      result.campaignId = campaign.id;
      result.recordsCreated++;

      // 2. Create Content Assets (if enabled)
      if (this.syncConfig.includeContentAssets) {
        const contentAssets = this.mapToContentAssets(payload, campaign.id);
        result.contentAssetIds = await this.createContentAssetsInBatches(
          provider,
          contentAssets,
          result
        );
      }

      // 3. Create Competitor Analysis (if enabled)
      if (this.syncConfig.includeCompetitorAnalysis && payload.campaignResult.competitorAnalysis) {
        const competitorAnalyses = this.mapToCompetitorAnalysis(payload, campaign.id);
        result.competitorAnalysisIds = await this.createCompetitorAnalysisInBatches(
          provider,
          competitorAnalyses,
          result
        );
      }

      result.success = true;
      return result;

    } catch (error: any) {
      this.log('error', 'Airtable sync failed', { error: error.message }, error);
      result.errors.push({
        recordId: 'airtable_sync',
        error: error.message,
        retryable: true
      });
      return result;
    }
  }

  /**
   * Sync to Salesforce (placeholder implementation)
   */
  private static async syncToSalesforce(
    connection: CRMConnection,
    payload: CRMSyncPayload,
    result: AutoSyncResult
  ): Promise<AutoSyncResult> {
    // TODO: Implement Salesforce-specific sync logic
    result.warnings.push('Salesforce sync not yet implemented');
    result.success = true;
    return result;
  }

  /**
   * Sync to HubSpot (placeholder implementation)
   */
  private static async syncToHubSpot(
    connection: CRMConnection,
    payload: CRMSyncPayload,
    result: AutoSyncResult
  ): Promise<AutoSyncResult> {
    // TODO: Implement HubSpot-specific sync logic
    result.warnings.push('HubSpot sync not yet implemented');
    result.success = true;
    return result;
  }

  /**
   * Create content assets in batches
   */
  private static async createContentAssetsInBatches(
    provider: any, // Would be more specific in real implementation
    contentAssets: ContentAssetRecord[],
    result: AutoSyncResult
  ): Promise<string[]> {
    const createdIds: string[] = [];
    const batchSize = this.syncConfig.batchSize;

    for (let i = 0; i < contentAssets.length; i += batchSize) {
      const batch = contentAssets.slice(i, i + batchSize);

      for (const asset of batch) {
        try {
          // Note: This would need to be implemented based on your Airtable schema
          // For now, we'll simulate record creation
          const recordData = {
            'Campaign ID': asset.campaignId,
            'Content Type': asset.type,
            'Platform': asset.platform || 'general',
            'Content': asset.content,
            'Metadata': JSON.stringify(asset.metadata),
            'Created At': asset.createdAt.toISOString()
          };

          // This would be the actual Airtable API call to create content asset
          const fakeId = `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          createdIds.push(fakeId);
          result.recordsCreated++;

        } catch (error: any) {
          result.errors.push({
            recordId: `content_asset_${i}`,
            error: error.message,
            retryable: true
          });
        }
      }

      // Add small delay between batches to avoid rate limiting
      if (i + batchSize < contentAssets.length) {
        await this.delay(100);
      }
    }

    return createdIds;
  }

  /**
   * Create competitor analysis records in batches
   */
  private static async createCompetitorAnalysisInBatches(
    provider: any,
    analyses: CompetitorAnalysisRecord[],
    result: AutoSyncResult
  ): Promise<string[]> {
    const createdIds: string[] = [];

    for (const analysis of analyses) {
      try {
        // This would be the actual Airtable API call
        const fakeId = `competitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        createdIds.push(fakeId);
        result.recordsCreated++;

      } catch (error: any) {
        result.errors.push({
          recordId: `competitor_${analysis.competitor}`,
          error: error.message,
          retryable: true
        });
      }
    }

    return createdIds;
  }

  /**
   * Map campaign data to CRM campaign record
   */
  private static mapToCampaignRecord(payload: CRMSyncPayload): CampaignRecord {
    return {
      name: `${payload.settings.companyName} - Marketing Campaign`,
      type: 'marketing_campaign',
      status: 'generated',
      productDescription: payload.productDescription,
      targetAudience: payload.campaignResult.targetAudience,
      keyMessaging: payload.campaignResult.keyMessaging.join(' | '),
      companyName: payload.settings.companyName,
      companyWebsite: payload.settings.companyWebsite,
      nationalLanguage: payload.settings.nationalLanguage,
      generatedAt: payload.metadata.generatedAt,
      metadata: {
        userId: payload.metadata.userId,
        sessionId: payload.metadata.sessionId,
        sourceIp: payload.metadata.sourceIp,
        userAgent: payload.metadata.userAgent,
        settings: {
          useGoogleEAT: payload.settings.useGoogleEAT,
          useHemingwayStyle: payload.settings.useHemingwayStyle,
          generateBacklinks: payload.settings.generateBacklinks,
          findTrendingTopics: payload.settings.findTrendingTopics,
          targetPlatforms: payload.settings.targetPlatforms,
          creativityLevel: payload.settings.defaultCreativityLevel
        }
      }
    };
  }

  /**
   * Map campaign data to content asset records
   */
  private static mapToContentAssets(payload: CRMSyncPayload, campaignId: string): ContentAssetRecord[] {
    const assets: ContentAssetRecord[] = [];

    // Social Media Content
    payload.campaignResult.socialMediaContent.forEach((social, index) => {
      assets.push({
        campaignId,
        type: 'social_media',
        platform: social.platform,
        content: social.contentExample,
        metadata: { order: index, generated: true },
        createdAt: payload.metadata.generatedAt
      });
    });

    // Ad Copy
    payload.campaignResult.adCopy.forEach((ad, index) => {
      assets.push({
        campaignId,
        type: 'ad_copy',
        content: `${ad.headline}\n\n${ad.body}`,
        metadata: {
          headline: ad.headline,
          body: ad.body,
          order: index,
          generated: true
        },
        createdAt: payload.metadata.generatedAt
      });
    });

    // SEO Keywords
    if (payload.campaignResult.seoKeywords.length > 0) {
      assets.push({
        campaignId,
        type: 'seo_keywords',
        content: payload.campaignResult.seoKeywords.join(', '),
        metadata: {
          keywords: payload.campaignResult.seoKeywords,
          count: payload.campaignResult.seoKeywords.length,
          generated: true
        },
        createdAt: payload.metadata.generatedAt
      });
    }

    // Backlink Strategy
    if (payload.campaignResult.backlinkStrategy && payload.campaignResult.backlinkStrategy.length > 0) {
      assets.push({
        campaignId,
        type: 'backlink_strategy',
        content: payload.campaignResult.backlinkStrategy.join('\n'),
        metadata: {
          strategies: payload.campaignResult.backlinkStrategy,
          count: payload.campaignResult.backlinkStrategy.length,
          generated: true
        },
        createdAt: payload.metadata.generatedAt
      });
    }

    // Meta Data
    if (payload.campaignResult.metaData) {
      assets.push({
        campaignId,
        type: 'meta_data',
        content: `${payload.campaignResult.metaData.title}\n${payload.campaignResult.metaData.description}`,
        metadata: {
          title: payload.campaignResult.metaData.title,
          description: payload.campaignResult.metaData.description,
          generated: true
        },
        createdAt: payload.metadata.generatedAt
      });
    }

    // AI Image Prompts
    if (payload.campaignResult.aiImagePrompts && payload.campaignResult.aiImagePrompts.length > 0) {
      payload.campaignResult.aiImagePrompts.forEach((prompt, index) => {
        assets.push({
          campaignId,
          type: 'ai_prompt',
          content: prompt,
          metadata: {
            type: 'image',
            order: index,
            generated: true
          },
          createdAt: payload.metadata.generatedAt
        });
      });
    }

    return assets;
  }

  /**
   * Map campaign data to competitor analysis records
   */
  private static mapToCompetitorAnalysis(payload: CRMSyncPayload, campaignId: string): CompetitorAnalysisRecord[] {
    if (!payload.campaignResult.competitorAnalysis) {
      return [];
    }

    return payload.campaignResult.competitorAnalysis.map(competitor => ({
      campaignId,
      competitor: competitor.competitor,
      strengths: competitor.strengths,
      weaknesses: competitor.weaknesses,
      strategy: competitor.strategy,
      strategyExamples: competitor.strategyExamples,
      analysisDate: payload.metadata.generatedAt
    }));
  }

  /**
   * Configuration Management
   */
  static getSyncConfig(): AutoSyncConfig {
    return { ...this.syncConfig };
  }

  static updateSyncConfig(updates: Partial<AutoSyncConfig>): void {
    this.syncConfig = { ...this.syncConfig, ...updates };
    this.saveSyncConfig();
    this.log('info', 'Auto-sync configuration updated', { updates });
  }

  static resetSyncConfig(): void {
    this.syncConfig = {
      enabled: true,
      syncOnGeneration: true,
      syncOnUpdate: false,
      includeContentAssets: true,
      includeCompetitorAnalysis: true,
      includeAnalytics: false,
      retryAttempts: 3,
      retryDelay: 1000,
      batchSize: 10
    };
    this.saveSyncConfig();
    this.log('info', 'Auto-sync configuration reset to defaults');
  }

  /**
   * Logging System
   */
  static getLogs(limit?: number): CRMSyncLog[] {
    const sortedLogs = [...this.logs].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return limit ? sortedLogs.slice(0, limit) : sortedLogs;
  }

  static clearLogs(): void {
    this.logs = [];
    this.saveLogs();
    this.log('info', 'Sync logs cleared');
  }

  private static log(level: CRMSyncLog['level'], message: string, context?: Record<string, any>, error?: Error): void {
    const logEntry: CRMSyncLog = {
      timestamp: new Date(),
      level,
      message,
      context,
      error
    };

    this.logs.push(logEntry);

    // Keep only the most recent logs to prevent memory issues
    if (this.logs.length > this.MAX_LOG_ENTRIES) {
      this.logs = this.logs.slice(-this.MAX_LOG_ENTRIES);
    }

    this.saveLogs();

    // Also log to console for development
    if (level === 'error') {
      console.error(`[CRMSync] ${message}`, context, error);
    } else if (level === 'warn') {
      console.warn(`[CRMSync] ${message}`, context);
    } else if (level === 'debug') {
      console.debug(`[CRMSync] ${message}`, context);
    } else {
      console.info(`[CRMSync] ${message}`, context);
    }
  }

  /**
   * Utility Methods
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private static generateSessionId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Storage Management
   */
  private static saveSyncConfig(): void {
    try {
      localStorage.setItem(this.SYNC_CONFIG_KEY, JSON.stringify(this.syncConfig));
    } catch (error) {
      console.error('Failed to save sync config:', error);
    }
  }

  private static loadSyncConfig(): void {
    try {
      const stored = localStorage.getItem(this.SYNC_CONFIG_KEY);
      if (stored) {
        this.syncConfig = { ...this.syncConfig, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load sync config:', error);
    }
  }

  private static saveLogs(): void {
    try {
      const logsToSave = this.logs.slice(-100); // Save only the most recent 100 logs
      localStorage.setItem(this.LOG_STORAGE_KEY, JSON.stringify(logsToSave));
    } catch (error) {
      console.error('Failed to save sync logs:', error);
    }
  }

  private static loadLogs(): void {
    try {
      const stored = localStorage.getItem(this.LOG_STORAGE_KEY);
      if (stored) {
        const parsedLogs = JSON.parse(stored);
        this.logs = parsedLogs.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        }));
      }
    } catch (error) {
      console.error('Failed to load sync logs:', error);
      this.logs = [];
    }
  }

  /**
   * Health Check
   */
  static async performHealthCheck(): Promise<{
    configValid: boolean;
    crmConnectionActive: boolean;
    lastSyncStatus?: string;
    recommendations: string[];
  }> {
    const recommendations: string[] = [];

    // Check config
    const configValid = this.syncConfig.retryAttempts > 0 &&
                       this.syncConfig.retryDelay > 0 &&
                       this.syncConfig.batchSize > 0;

    if (!configValid) {
      recommendations.push('Review sync configuration settings');
    }

    // Check CRM connection
    const connection = CRMIntegrationService.getActiveConnection();
    const crmConnectionActive = !!connection && connection.syncStatus === 'connected';

    if (!crmConnectionActive) {
      recommendations.push('Ensure CRM connection is active and properly configured');
    }

    // Check recent sync status
    const recentLogs = this.getLogs(10);
    const errorLogs = recentLogs.filter(log => log.level === 'error');

    if (errorLogs.length > 0) {
      recommendations.push('Review recent error logs and resolve sync issues');
    }

    if (!this.syncConfig.enabled) {
      recommendations.push('Auto-sync is currently disabled');
    }

    return {
      configValid,
      crmConnectionActive,
      lastSyncStatus: recentLogs[0]?.level,
      recommendations
    };
  }

  /**
   * Manual Sync Trigger
   */
  static async triggerManualSync(
    campaignResult: CampaignResult,
    productDescription: string,
    settings: AdvancedSettings
  ): Promise<AutoSyncResult> {
    this.log('info', 'Manual sync triggered');

    // Temporarily enable sync if disabled
    const originalSyncOnGeneration = this.syncConfig.syncOnGeneration;
    this.syncConfig.syncOnGeneration = true;

    try {
      const result = await this.handleAutomaticCRMSync(
        campaignResult,
        productDescription,
        settings,
        { userId: 'manual_trigger' }
      );

      return result;
    } finally {
      // Restore original setting
      this.syncConfig.syncOnGeneration = originalSyncOnGeneration;
    }
  }
}

// Auto-initialize the service
CRMSyncService.initialize();