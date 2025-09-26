// SEMrush API Service for competitor analysis and SEO data
// Documentation: https://www.semrush.com/api/

const SEMRUSH_API_KEY = import.meta.env.VITE_SEMRUSH_API_KEY;
const SEMRUSH_API_BASE = 'https://api.semrush.com';

export interface SEMrushDomainData {
  domain: string;
  organicKeywords: number;
  organicTraffic: number;
  organicCost: number;
  adwordsKeywords: number;
  adwordsTraffic: number;
  adwordsCost: number;
}

export interface SEMrushKeywordData {
  keyword: string;
  position: number;
  traffic: number;
  cost: number;
  url: string;
}

export interface CompetitorInsights {
  domain: string;
  seoMetrics: SEMrushDomainData;
  topKeywords: SEMrushKeywordData[];
  competitors: string[];
  error?: string;
}

// Get domain overview data from SEMrush
export const getDomainOverview = async (domain: string): Promise<SEMrushDomainData | null> => {
  if (!SEMRUSH_API_KEY) {
    console.warn('SEMrush API key not configured');
    return null;
  }

  try {
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const url = `${SEMRUSH_API_BASE}/?type=domain_overview&key=${SEMRUSH_API_KEY}&domain=${cleanDomain}&export_columns=Dn,Or,Ot,Oc,Ad,At,Ac&database=us`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`SEMrush API error: ${response.status}`);
    }

    const text = await response.text();
    const lines = text.trim().split('\n');

    if (lines.length < 2) {
      return null;
    }

    const data = lines[1].split(';');
    return {
      domain: cleanDomain,
      organicKeywords: parseInt(data[1]) || 0,
      organicTraffic: parseInt(data[2]) || 0,
      organicCost: parseFloat(data[3]) || 0,
      adwordsKeywords: parseInt(data[4]) || 0,
      adwordsTraffic: parseInt(data[5]) || 0,
      adwordsCost: parseFloat(data[6]) || 0,
    };
  } catch (error) {
    console.error('SEMrush API error:', error);
    return null;
  }
};

// Get top organic keywords for a domain
export const getTopKeywords = async (domain: string, limit: number = 10): Promise<SEMrushKeywordData[]> => {
  if (!SEMRUSH_API_KEY) {
    return [];
  }

  try {
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const url = `${SEMRUSH_API_BASE}/?type=domain_organic&key=${SEMRUSH_API_KEY}&domain=${cleanDomain}&export_columns=Ph,Po,Tr,Tc,Ur&database=us&limit=${limit}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`SEMrush API error: ${response.status}`);
    }

    const text = await response.text();
    const lines = text.trim().split('\n');

    const keywords: SEMrushKeywordData[] = [];
    for (let i = 1; i < lines.length; i++) {
      const data = lines[i].split(';');
      if (data.length >= 5) {
        keywords.push({
          keyword: data[0],
          position: parseInt(data[1]) || 0,
          traffic: parseInt(data[2]) || 0,
          cost: parseFloat(data[3]) || 0,
          url: data[4] || '',
        });
      }
    }

    return keywords;
  } catch (error) {
    console.error('SEMrush keywords API error:', error);
    return [];
  }
};

// Get main organic competitors for a domain
export const getCompetitors = async (domain: string, limit: number = 5): Promise<string[]> => {
  if (!SEMRUSH_API_KEY) {
    return [];
  }

  try {
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const url = `${SEMRUSH_API_BASE}/?type=domain_organic_organic&key=${SEMRUSH_API_KEY}&domain=${cleanDomain}&export_columns=Dn&database=us&limit=${limit}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`SEMrush API error: ${response.status}`);
    }

    const text = await response.text();
    const lines = text.trim().split('\n');

    const competitors: string[] = [];
    for (let i = 1; i < lines.length; i++) {
      const domain = lines[i].split(';')[0];
      if (domain) {
        competitors.push(domain);
      }
    }

    return competitors;
  } catch (error) {
    console.error('SEMrush competitors API error:', error);
    return [];
  }
};

// Comprehensive competitor analysis
export const analyzeCompetitor = async (domain: string): Promise<CompetitorInsights> => {
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');

  try {
    const [seoMetrics, topKeywords, competitors] = await Promise.all([
      getDomainOverview(cleanDomain),
      getTopKeywords(cleanDomain, 10),
      getCompetitors(cleanDomain, 5)
    ]);

    return {
      domain: cleanDomain,
      seoMetrics: seoMetrics || {
        domain: cleanDomain,
        organicKeywords: 0,
        organicTraffic: 0,
        organicCost: 0,
        adwordsKeywords: 0,
        adwordsTraffic: 0,
        adwordsCost: 0,
      },
      topKeywords,
      competitors,
    };
  } catch (error) {
    return {
      domain: cleanDomain,
      seoMetrics: {
        domain: cleanDomain,
        organicKeywords: 0,
        organicTraffic: 0,
        organicCost: 0,
        adwordsKeywords: 0,
        adwordsTraffic: 0,
        adwordsCost: 0,
      },
      topKeywords: [],
      competitors: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Check if SEMrush API is available
export const isSEMrushAvailable = (): boolean => {
  return !!SEMRUSH_API_KEY;
};

// Debug function to check environment variables (for development)
export const checkEnvironmentVariables = (): { gemini: boolean; semrush: boolean } => {
  return {
    gemini: !!import.meta.env.VITE_GEMINI_API_KEY,
    semrush: !!import.meta.env.VITE_SEMRUSH_API_KEY
  };
};