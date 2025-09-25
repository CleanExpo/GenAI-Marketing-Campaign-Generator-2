// types.ts

export interface SocialMediaStrategy {
  platform: string;
  strategy: string;
}

export interface AdCopy {
  headline: string;
  body: string;
}

export interface MetaData {
  title: string;
  description: string;
}

export interface CampaignResult {
  targetAudience: string;
  keyMessaging: string[];
  socialMediaStrategy: SocialMediaStrategy[];
  seoKeywords: string[];
  adCopy: AdCopy[];
  aiImagePrompts?: string[];
  aiVideoConcepts?: string[];
  backlinkStrategy?: string[];
  trendingTopics?: { topic: string; angle: string; }[];
  metaData?: MetaData;
}

export interface SocialMediaLink {
  id: number;
  platform: string;
  url: string;
}

export interface AdvancedSettings {
  companyName: string;
  companyWebsite: string;
  brandColors: { primary: string; secondary: string; };
  companyLogo: string; // base64 string
  socialMediaLinks: SocialMediaLink[];
  semrushApiKey: string; // For future use
  insertWatermark: boolean;
  generateVerifiableText: boolean;
  nationalLanguage: string;
  useGoogleEAT: boolean;
  useHemingwayStyle: boolean;
  generateBacklinks: boolean;
  findTrendingTopics: boolean;
  targetPlatforms: string[];
}
