/**
 * SEO Service for Dynamic Meta Tag Management
 * Handles dynamic SEO optimization throughout the application
 */

interface SEOMetaTags {
  title: string;
  description: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImage?: string;
  twitterTitle: string;
  twitterDescription: string;
  canonicalUrl?: string;
}

interface SEOPageConfig {
  route: string;
  title: string;
  description: string;
  keywords: string[];
  priority: number;
}

class SEOService {
  private static instance: SEOService;
  private baseUrl = 'https://gen-ai-marketing-campaign-generator.vercel.app';
  private defaultImage = '/zenith-logo.png';

  private pages: SEOPageConfig[] = [
    {
      route: '/',
      title: 'ZENITH - AI Marketing Campaign Generator | Real-time SEO & CRM',
      description: 'Generate comprehensive marketing campaigns with Google Gemini AI. Features real-time competitive analysis, SEO optimization, and seamless Airtable CRM integration.',
      keywords: ['AI marketing campaign generator', 'marketing automation', 'SEO optimization', 'competitor analysis', 'Airtable CRM', 'Google Gemini AI'],
      priority: 1.0
    },
    {
      route: '/campaign-generator',
      title: 'AI Campaign Generator | ZENITH Marketing Automation',
      description: 'Create professional marketing campaigns instantly with AI. Advanced targeting, social media optimization, and competitive analysis built-in.',
      keywords: ['AI campaign generator', 'marketing automation', 'social media campaigns', 'content creation', 'digital marketing'],
      priority: 0.9
    },
    {
      route: '/crm-integration',
      title: 'Airtable CRM Integration | ZENITH Marketing Platform',
      description: 'Seamlessly integrate your marketing campaigns with Airtable CRM. Automatic lead tracking, campaign analytics, and team collaboration.',
      keywords: ['Airtable CRM integration', 'marketing CRM', 'lead tracking', 'campaign analytics', 'team collaboration'],
      priority: 0.8
    },
    {
      route: '/brand-kit',
      title: 'Brand Kit Manager | ZENITH Marketing Tools',
      description: 'Manage your brand assets, guidelines, and visual identity. Ensure consistent branding across all marketing campaigns.',
      keywords: ['brand kit manager', 'brand guidelines', 'visual identity', 'marketing assets', 'brand consistency'],
      priority: 0.8
    }
  ];

  public static getInstance(): SEOService {
    if (!SEOService.instance) {
      SEOService.instance = new SEOService();
    }
    return SEOService.instance;
  }

  /**
   * Update document meta tags dynamically
   */
  public updateMetaTags(config: Partial<SEOMetaTags>): void {
    const metaTags: SEOMetaTags = {
      title: config.title || 'ZENITH - AI Marketing Campaign Generator',
      description: config.description || 'AI-powered marketing campaign generation with real-time competitive analysis and CRM integration.',
      keywords: config.keywords || 'AI marketing, campaign generator, SEO optimization',
      ogTitle: config.ogTitle || config.title || 'ZENITH - AI Marketing Campaign Generator',
      ogDescription: config.ogDescription || config.description || 'AI-powered marketing campaign generation platform',
      ogImage: config.ogImage || this.defaultImage,
      twitterTitle: config.twitterTitle || config.title || 'ZENITH - AI Marketing Campaign Generator',
      twitterDescription: config.twitterDescription || config.description || 'AI-powered marketing campaign generation platform',
      canonicalUrl: config.canonicalUrl || window.location.href
    };

    // Update document title
    document.title = metaTags.title;

    // Update meta description
    this.updateMetaTag('name', 'description', metaTags.description);
    this.updateMetaTag('name', 'keywords', metaTags.keywords);

    // Update Open Graph tags
    this.updateMetaTag('property', 'og:title', metaTags.ogTitle);
    this.updateMetaTag('property', 'og:description', metaTags.ogDescription);
    this.updateMetaTag('property', 'og:url', metaTags.canonicalUrl);
    this.updateMetaTag('property', 'og:image', `${this.baseUrl}${metaTags.ogImage}`);

    // Update Twitter Card tags
    this.updateMetaTag('name', 'twitter:title', metaTags.twitterTitle);
    this.updateMetaTag('name', 'twitter:description', metaTags.twitterDescription);
    this.updateMetaTag('name', 'twitter:image', `${this.baseUrl}${metaTags.ogImage}`);

    // Update canonical URL
    this.updateCanonicalUrl(metaTags.canonicalUrl);
  }

  /**
   * Update meta tags for specific routes/pages
   */
  public updatePageSEO(route: string): void {
    const pageConfig = this.pages.find(page => page.route === route);
    if (pageConfig) {
      this.updateMetaTags({
        title: pageConfig.title,
        description: pageConfig.description,
        keywords: pageConfig.keywords.join(', '),
        canonicalUrl: `${this.baseUrl}${pageConfig.route === '/' ? '' : pageConfig.route}`
      });
    }
  }

  /**
   * Generate SEO-optimized campaign meta tags
   */
  public generateCampaignSEO(campaignData: {
    productName?: string;
    industry?: string;
    targetAudience?: string;
    campaignType?: string;
  }): SEOMetaTags {
    const { productName, industry, targetAudience, campaignType } = campaignData;

    const title = productName
      ? `${productName} Marketing Campaign | ZENITH AI Generator`
      : 'AI Marketing Campaign | ZENITH Generator';

    const description = `Generate professional marketing campaigns for ${productName || 'your product'} ${industry ? `in ${industry}` : ''} ${targetAudience ? `targeting ${targetAudience}` : ''}. AI-powered content creation with SEO optimization.`;

    const keywords = [
      productName && `${productName} marketing`,
      industry && `${industry} marketing campaigns`,
      targetAudience && `${targetAudience} targeting`,
      campaignType && `${campaignType} campaigns`,
      'AI marketing generator',
      'automated campaign creation'
    ].filter(Boolean).join(', ');

    return {
      title,
      description,
      keywords,
      ogTitle: title,
      ogDescription: description,
      twitterTitle: title,
      twitterDescription: description
    };
  }

  /**
   * Add structured data for campaigns
   */
  public addCampaignStructuredData(campaignData: {
    name: string;
    description: string;
    dateCreated: string;
    industry?: string;
    targetAudience?: string;
  }): void {
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      "name": campaignData.name,
      "description": campaignData.description,
      "dateCreated": campaignData.dateCreated,
      "creator": {
        "@type": "Organization",
        "name": "ZENITH AI Marketing Solutions"
      },
      "about": campaignData.industry,
      "audience": {
        "@type": "Audience",
        "audienceType": campaignData.targetAudience
      },
      "tool": {
        "@type": "SoftwareApplication",
        "name": "ZENITH AI Marketing Campaign Generator",
        "applicationCategory": "Marketing Software"
      }
    };

    this.addJSONLDStructuredData('campaign-schema', structuredData);
  }

  /**
   * Track SEO performance metrics
   */
  public trackSEOMetrics(): void {
    // Track page load performance for SEO
    if ('performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const loadTime = navigation.loadEventEnd - navigation.loadEventStart;

      // Log performance metrics (replace with your analytics service)
      console.info('SEO Performance Metrics:', {
        loadTime,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstContentfulPaint: this.getFirstContentfulPaint(),
        largestContentfulPaint: this.getLargestContentfulPaint()
      });
    }
  }

  /**
   * Helper methods
   */
  private updateMetaTag(attribute: string, name: string, content: string): void {
    let tag = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute(attribute, name);
      document.head.appendChild(tag);
    }
    tag.content = content;
  }

  private updateCanonicalUrl(url: string): void {
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;
  }

  private addJSONLDStructuredData(id: string, data: object): void {
    // Remove existing structured data with same ID
    const existing = document.getElementById(id);
    if (existing) {
      existing.remove();
    }

    // Add new structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = id;
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }

  private getFirstContentfulPaint(): number | null {
    const entries = performance.getEntriesByType('paint');
    const fcp = entries.find(entry => entry.name === 'first-contentful-paint');
    return fcp ? fcp.startTime : null;
  }

  private getLargestContentfulPaint(): number | null {
    return new Promise((resolve) => {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        resolve(lastEntry.startTime);
      }).observe({ entryTypes: ['largest-contentful-paint'] });
    }) as any;
  }

  /**
   * Generate breadcrumb structured data
   */
  public addBreadcrumbStructuredData(breadcrumbs: Array<{name: string, url: string}>): void {
    const breadcrumbData = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbs.map((crumb, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": crumb.name,
        "item": `${this.baseUrl}${crumb.url}`
      }))
    };

    this.addJSONLDStructuredData('breadcrumb-schema', breadcrumbData);
  }

  /**
   * Optimize images for SEO
   */
  public optimizeImageSEO(img: HTMLImageElement, alt: string, title?: string): void {
    img.alt = alt;
    if (title) img.title = title;

    // Add loading="lazy" for performance
    if ('loading' in img) {
      img.loading = 'lazy';
    }

    // Add width and height to prevent layout shift
    if (!img.width || !img.height) {
      img.onload = () => {
        img.width = img.naturalWidth;
        img.height = img.naturalHeight;
      };
    }
  }
}

export const seoService = SEOService.getInstance();
export default SEOService;