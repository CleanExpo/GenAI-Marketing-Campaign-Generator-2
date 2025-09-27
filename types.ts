// types.ts

// Enhanced Campaign Management Types
export interface SavedCampaign {
  id: string;
  name: string;
  description: string;
  productDescription: string;
  settings: AdvancedSettings;
  result: CampaignResult;
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'active' | 'archived' | 'template';
  tags: string[];
  version: number;
  // Future CRM integration fields
  crmData?: {
    contactId?: string;
    dealId?: string;
    companyId?: string;
    campaignId?: string;
    leadSource?: string;
    status?: string;
  };
}

export interface CampaignTemplate {
  id: string;
  name: string;
  category: 'saas' | 'ecommerce' | 'healthcare' | 'finance' | 'education' | 'nonprofit' | 'custom';
  description: string;
  settings: Partial<AdvancedSettings>;
  isPublic: boolean;
  usageCount: number;
}

// User & Workspace Management (Future CRM Integration)
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  company?: string;
  role?: string;
  subscription: 'free' | 'pro' | 'enterprise';
  preferences: UserPreferences;
  workspaceId?: string;
}

export interface UserPreferences {
  defaultLanguage: string;
  defaultCreativity: number;
  defaultImageStyle: string;
  favoriteTemplates: string[];
  exportFormats: ('pdf' | 'csv' | 'json')[];
}

export interface CampaignExport {
  format: 'pdf' | 'csv' | 'json' | 'docx';
  data: SavedCampaign;
  exportedAt: Date;
  exportedBy: string;
}

export interface CampaignResult extends CampaignData {
  // CampaignResult is now an alias for CampaignData for backward compatibility
}

export interface AdvancedSettings {
  companyName: string;
  companyWebsite: string;
  companyLogo?: string;
  brandColors: {
    primary: string;
    secondary: string;
  };
  socialMediaLinks: { platform: string; url: string }[];
  nationalLanguage: string;
  useGoogleEAT: boolean;
  useHemingwayStyle: boolean;
  generateBacklinks: boolean;
  findTrendingTopics: boolean;
  competitorWebsites: { url: string }[];
  insertWatermark: boolean;
  generateVerifiableText: boolean;
  targetPlatforms: string[];
  defaultAspectRatio: string;
  defaultNegativePrompt: string;
  defaultImageStyle: string;
  defaultCreativityLevel: number;
}

// Brand Kit and Campaign Data Types
export interface BrandKitData {
  id: string;
  name: string;
  logoUrl?: string;
  colors: {
    primary: string;
    secondary: string;
    accent?: string;
  };
  fonts: {
    primary: string;
    secondary?: string;
  };
  guidelines: string;
  assets: BrandAsset[];
  createdAt: Date;
  updatedAt: Date;
}

export interface BrandAsset {
  id: string;
  name: string;
  type: 'logo' | 'image' | 'document' | 'video';
  url: string;
  size?: number;
  dimensions?: {
    width: number;
    height: number;
  };
}

// Enhanced Campaign Data Types
export interface CampaignData {
  targetAudience: string;
  keyMessaging: string[];
  socialMediaContent: SocialMediaContent[];
  seoKeywords: string[];
  adCopy: AdCopy[];
  aiImagePrompts?: string[];
  aiVideoConcepts?: string[];
  backlinkStrategy?: string[];
  trendingTopics?: TrendingTopic[];
  metaData?: MetaData;
  competitorAnalysis?: CompetitorAnalysis[];
}

export interface SocialMediaContent {
  platform: string;
  contentExample: string;
  hashtags?: string[];
  mediaType?: 'text' | 'image' | 'video' | 'carousel';
}

export interface AdCopy {
  headline: string;
  body: string;
  cta?: string;
  platform?: string;
}

export interface TrendingTopic {
  topic: string;
  angle: string;
  relevanceScore?: number;
}

export interface MetaData {
  title: string;
  description: string;
  keywords?: string[];
}

export interface CompetitorAnalysis {
  competitor: string;
  strengths: string[];
  weaknesses: string[];
  strategy: string;
  strategyExamples?: string[];
  marketShare?: number;
}

// Error and API Response Types
export interface APIError {
  message: string;
  code?: string | number;
  details?: Record<string, unknown>;
  timestamp: Date;
}

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: APIError;
  metadata?: {
    requestId?: string;
    timestamp: Date;
    version?: string;
  };
}

// Generic utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Transformation function types
export type TransformFunction<T = unknown, R = unknown> = (value: T) => R;

// Async operation types
export interface AsyncOperation<T = unknown> {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: T;
  error?: APIError;
  startedAt: Date;
  completedAt?: Date;
}

// CRM Integration Types
export interface CRMRecord {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  customFields: Record<string, unknown>;
}

export interface SalesforceRecord {
  Id: string;
  CreatedDate: string;
  LastModifiedDate: string;
  attributes?: {
    type: string;
    url: string;
  };
  [key: string]: unknown;
}

export interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
  createdTime: string;
}

export interface AirtableResponse<T = AirtableRecord> {
  records: T[];
  offset?: string;
}

export interface AirtableTable {
  id: string;
  name: string;
  primaryFieldId: string;
  fields: AirtableField[];
}

export interface AirtableField {
  id: string;
  name: string;
  type: string;
  options?: Record<string, unknown>;
}

// Webhook and batch operation types
export interface WebhookPayload {
  event: string;
  data: Record<string, unknown>;
  timestamp: Date;
  source: string;
}

export interface BatchOperation<T = unknown> {
  records: T[];
  operation: 'create' | 'update' | 'delete';
  batchSize?: number;
  retryAttempts?: number;
}