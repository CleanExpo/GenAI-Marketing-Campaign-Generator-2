// types.ts

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