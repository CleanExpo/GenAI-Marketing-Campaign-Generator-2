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

export interface CampaignResult {
  targetAudience: string;
  keyMessaging: string[];
  socialMediaContent: {
    platform: string;
    contentExample: string;
  }[];
  seoKeywords: string[];
  adCopy: {
    headline: string;
    body: string;
  }[];
  aiImagePrompts?: string[];
  aiVideoConcepts?: string[];
  backlinkStrategy?: string[];
  trendingTopics?: {
    topic: string;
    angle: string;
  }[];
  metaData?: {
    title: string;
    description: string;
  };
  competitorAnalysis?: {
    competitor: string;
    strengths: string[];
    weaknesses: string[];
    strategy: string;
    strategyExamples?: string[];
  }[];
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