// services/brandKitService.ts

export interface BrandAssets {
  logo: {
    primary: string; // Base64 or URL
    secondary?: string;
    monochrome?: string;
    favicon?: string;
  };
  colors: {
    primary: string;
    secondary: string;
    accent?: string;
    background?: string;
    text: {
      primary: string;
      secondary: string;
    };
    gradients?: {
      name: string;
      colors: string[];
      direction?: string;
    }[];
  };
  typography: {
    headings: {
      family: string;
      weights: number[];
      fallbacks: string[];
    };
    body: {
      family: string;
      weights: number[];
      fallbacks: string[];
    };
    monospace?: {
      family: string;
      fallbacks: string[];
    };
  };
  spacing: {
    unit: number; // Base spacing unit in px
    scale: number[]; // Multipliers for consistent spacing
  };
  borderRadius: {
    small: string;
    medium: string;
    large: string;
    full: string;
  };
  shadows: {
    small: string;
    medium: string;
    large: string;
    elevated: string;
  };
}

export interface BrandGuidelines {
  voice: {
    tone: 'professional' | 'friendly' | 'authoritative' | 'playful' | 'technical';
    personality: string[];
    doAndDonts: {
      do: string[];
      dont: string[];
    };
  };
  messaging: {
    tagline?: string;
    value_proposition: string;
    key_messages: string[];
    brand_pillars: string[];
  };
  visual: {
    style: 'modern' | 'classic' | 'minimal' | 'bold' | 'organic' | 'industrial';
    imagery_style: string;
    icon_style: string;
    illustration_style?: string;
  };
  usage: {
    logo_minimum_size: string;
    logo_clear_space: string;
    color_usage_rules: string[];
    typography_hierarchy: string[];
    dos_and_donts: {
      do: string[];
      dont: string[];
    };
  };
}

export interface BrandKit {
  id: string;
  name: string;
  version: string;
  assets: BrandAssets;
  guidelines: BrandGuidelines;
  templates: BrandTemplate[];
  created_at: Date;
  updated_at: Date;
}

export interface BrandTemplate {
  id: string;
  name: string;
  category: 'social_media' | 'web' | 'print' | 'presentation' | 'email';
  description: string;
  preview_image?: string;
  css_variables: Record<string, string>;
  component_overrides: Record<string, any>;
}

export class BrandKitService {
  private static readonly STORAGE_KEY = 'zenith_brand_kit';
  private static readonly ZENITH_BRAND_KIT: BrandKit = {
    id: 'zenith_default',
    name: 'ZENITH Brand Kit',
    version: '1.0.0',
    assets: {
      logo: {
        primary: '/zenith-logo.png',
        monochrome: '/zenith-logo.png'
      },
      colors: {
        primary: '#06b6d4', // cyan-500
        secondary: '#1d4ed8', // blue-700
        accent: '#0891b2', // cyan-600
        background: '#0f172a', // slate-900
        text: {
          primary: '#ffffff',
          secondary: '#94a3b8' // slate-400
        },
        gradients: [
          {
            name: 'primary',
            colors: ['#06b6d4', '#1d4ed8'],
            direction: 'to right'
          },
          {
            name: 'accent',
            colors: ['#0891b2', '#0284c7'],
            direction: 'to bottom right'
          }
        ]
      },
      typography: {
        headings: {
          family: 'Inter',
          weights: [400, 500, 600, 700, 800],
          fallbacks: ['system-ui', 'sans-serif']
        },
        body: {
          family: 'Inter',
          weights: [400, 500, 600],
          fallbacks: ['system-ui', 'sans-serif']
        }
      },
      spacing: {
        unit: 4,
        scale: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 64]
      },
      borderRadius: {
        small: '0.375rem',
        medium: '0.5rem',
        large: '0.75rem',
        full: '9999px'
      },
      shadows: {
        small: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        medium: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        large: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        elevated: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
      }
    },
    guidelines: {
      voice: {
        tone: 'professional',
        personality: ['Innovative', 'Reliable', 'Forward-thinking', 'User-focused'],
        doAndDonts: {
          do: [
            'Use clear, action-oriented language',
            'Emphasize innovation and AI capabilities',
            'Maintain professional yet approachable tone',
            'Focus on user benefits and outcomes'
          ],
          dont: [
            'Use overly technical jargon without explanation',
            'Make unrealistic promises or claims',
            'Use passive voice excessively',
            'Ignore user pain points'
          ]
        }
      },
      messaging: {
        tagline: 'Elevate Your Marketing with AI',
        value_proposition: 'Transform your marketing strategy with AI-powered campaign generation that delivers results.',
        key_messages: [
          'AI-powered marketing campaign generation',
          'Comprehensive multi-channel strategies',
          'Data-driven audience insights',
          'Professional-grade creative assets',
          'Scalable campaign management'
        ],
        brand_pillars: ['Innovation', 'Efficiency', 'Results', 'Intelligence']
      },
      visual: {
        style: 'modern',
        imagery_style: 'Clean, professional, technology-focused with human elements',
        icon_style: 'Outline-style icons with consistent stroke width',
        illustration_style: 'Geometric, abstract representations of AI and marketing concepts'
      },
      usage: {
        logo_minimum_size: '24px height',
        logo_clear_space: '1x logo height on all sides',
        color_usage_rules: [
          'Primary cyan for interactive elements and CTAs',
          'Secondary blue for backgrounds and emphasis',
          'White text on dark backgrounds, dark text on light backgrounds',
          'Maintain 4.5:1 contrast ratio minimum'
        ],
        typography_hierarchy: [
          'H1: 2.25rem (36px) - Page titles',
          'H2: 1.875rem (30px) - Section headers',
          'H3: 1.5rem (24px) - Subsection headers',
          'Body: 1rem (16px) - Regular text',
          'Small: 0.875rem (14px) - Supporting text'
        ],
        dos_and_donts: {
          do: [
            'Use consistent spacing based on 4px grid',
            'Apply brand colors systematically',
            'Maintain visual hierarchy',
            'Ensure accessibility standards'
          ],
          dont: [
            'Distort or modify logo proportions',
            'Use brand colors outside approved palette',
            'Mix different visual styles',
            'Ignore responsive design principles'
          ]
        }
      }
    },
    templates: [
      // Social Media Templates
      {
        id: 'social_card',
        name: 'Social Media Card',
        category: 'social_media',
        description: 'Standard social media post template with ZENITH branding',
        css_variables: {
          '--primary-color': '#06b6d4',
          '--secondary-color': '#1d4ed8',
          '--text-color': '#ffffff',
          '--background-color': '#0f172a'
        },
        component_overrides: {
          backgroundColor: 'var(--background-color)',
          color: 'var(--text-color)',
          borderRadius: '0.75rem'
        }
      },
      {
        id: 'instagram_story',
        name: 'Instagram Story',
        category: 'social_media',
        description: 'Vertical story template optimized for Instagram and Facebook',
        css_variables: {
          '--gradient-start': '#06b6d4',
          '--gradient-end': '#1d4ed8',
          '--overlay-opacity': '0.7'
        },
        component_overrides: {
          background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))',
          aspectRatio: '9/16',
          minHeight: '600px'
        }
      },
      {
        id: 'linkedin_post',
        name: 'LinkedIn Professional Post',
        category: 'social_media',
        description: 'Professional-looking template for LinkedIn business posts',
        css_variables: {
          '--background-color': '#ffffff',
          '--text-color': '#2d3748',
          '--accent-color': '#06b6d4',
          '--border-color': '#e2e8f0'
        },
        component_overrides: {
          backgroundColor: 'var(--background-color)',
          color: 'var(--text-color)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }
      },
      {
        id: 'twitter_card',
        name: 'Twitter Card',
        category: 'social_media',
        description: 'Compact card design perfect for Twitter/X posts',
        css_variables: {
          '--background-color': '#1a202c',
          '--text-color': '#ffffff',
          '--accent-color': '#06b6d4'
        },
        component_overrides: {
          backgroundColor: 'var(--background-color)',
          color: 'var(--text-color)',
          maxWidth: '600px',
          padding: '1.5rem'
        }
      },

      // Web Templates
      {
        id: 'campaign_header',
        name: 'Campaign Header',
        category: 'web',
        description: 'Hero header component for campaign landing pages',
        css_variables: {
          '--gradient-start': '#06b6d4',
          '--gradient-end': '#1d4ed8',
          '--text-shadow': '0 2px 4px rgba(0,0,0,0.3)'
        },
        component_overrides: {
          background: 'linear-gradient(to right, var(--gradient-start), var(--gradient-end))',
          textShadow: 'var(--text-shadow)',
          minHeight: '400px'
        }
      },
      {
        id: 'feature_card',
        name: 'Feature Card',
        category: 'web',
        description: 'Card component for showcasing product features',
        css_variables: {
          '--card-background': '#ffffff',
          '--card-shadow': '0 4px 6px rgba(0,0,0,0.1)',
          '--border-radius': '0.75rem'
        },
        component_overrides: {
          backgroundColor: 'var(--card-background)',
          boxShadow: 'var(--card-shadow)',
          borderRadius: 'var(--border-radius)',
          padding: '2rem'
        }
      },
      {
        id: 'cta_banner',
        name: 'Call-to-Action Banner',
        category: 'web',
        description: 'Attention-grabbing banner for conversions',
        css_variables: {
          '--banner-bg': '#06b6d4',
          '--banner-text': '#ffffff',
          '--button-bg': '#1d4ed8',
          '--button-hover': '#1e3a8a'
        },
        component_overrides: {
          backgroundColor: 'var(--banner-bg)',
          color: 'var(--banner-text)',
          padding: '3rem 2rem',
          textAlign: 'center'
        }
      },
      {
        id: 'testimonial_card',
        name: 'Testimonial Card',
        category: 'web',
        description: 'Customer testimonial display component',
        css_variables: {
          '--testimonial-bg': '#f8fafc',
          '--quote-color': '#64748b',
          '--author-color': '#1e293b'
        },
        component_overrides: {
          backgroundColor: 'var(--testimonial-bg)',
          borderLeft: '4px solid #06b6d4',
          padding: '2rem'
        }
      },

      // Email Templates
      {
        id: 'email_header',
        name: 'Email Header',
        category: 'email',
        description: 'Professional email header with branding',
        css_variables: {
          '--email-bg': '#ffffff',
          '--header-bg': '#0f172a',
          '--header-text': '#ffffff'
        },
        component_overrides: {
          backgroundColor: 'var(--header-bg)',
          color: 'var(--header-text)',
          padding: '2rem',
          textAlign: 'center'
        }
      },
      {
        id: 'newsletter_template',
        name: 'Newsletter Layout',
        category: 'email',
        description: 'Complete newsletter template with sections',
        css_variables: {
          '--newsletter-bg': '#ffffff',
          '--section-border': '#e5e7eb',
          '--link-color': '#06b6d4'
        },
        component_overrides: {
          backgroundColor: 'var(--newsletter-bg)',
          maxWidth: '600px',
          margin: '0 auto'
        }
      },
      {
        id: 'email_cta',
        name: 'Email CTA Button',
        category: 'email',
        description: 'High-converting call-to-action button for emails',
        css_variables: {
          '--button-bg': '#06b6d4',
          '--button-text': '#ffffff',
          '--button-hover': '#0891b2'
        },
        component_overrides: {
          backgroundColor: 'var(--button-bg)',
          color: 'var(--button-text)',
          padding: '12px 24px',
          borderRadius: '6px',
          textDecoration: 'none',
          display: 'inline-block'
        }
      },

      // Presentation Templates
      {
        id: 'slide_title',
        name: 'Presentation Title Slide',
        category: 'presentation',
        description: 'Professional title slide for presentations',
        css_variables: {
          '--slide-bg': '#0f172a',
          '--title-color': '#ffffff',
          '--subtitle-color': '#94a3b8'
        },
        component_overrides: {
          backgroundColor: 'var(--slide-bg)',
          color: 'var(--title-color)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '600px'
        }
      },
      {
        id: 'slide_content',
        name: 'Content Slide',
        category: 'presentation',
        description: 'Standard content slide with bullet points',
        css_variables: {
          '--slide-bg': '#ffffff',
          '--heading-color': '#1e293b',
          '--text-color': '#475569'
        },
        component_overrides: {
          backgroundColor: 'var(--slide-bg)',
          color: 'var(--text-color)',
          padding: '3rem'
        }
      },
      {
        id: 'slide_chart',
        name: 'Data Visualization Slide',
        category: 'presentation',
        description: 'Slide template optimized for charts and graphs',
        css_variables: {
          '--slide-bg': '#f8fafc',
          '--chart-accent': '#06b6d4',
          '--grid-color': '#e2e8f0'
        },
        component_overrides: {
          backgroundColor: 'var(--slide-bg)',
          padding: '2rem'
        }
      },

      // Print Templates
      {
        id: 'business_card',
        name: 'Business Card',
        category: 'print',
        description: 'Standard business card design template',
        css_variables: {
          '--card-bg': '#ffffff',
          '--primary-text': '#1e293b',
          '--accent-color': '#06b6d4'
        },
        component_overrides: {
          backgroundColor: 'var(--card-bg)',
          width: '3.5in',
          height: '2in',
          padding: '0.25in'
        }
      },
      {
        id: 'flyer_template',
        name: 'Marketing Flyer',
        category: 'print',
        description: 'A4 flyer template for marketing materials',
        css_variables: {
          '--flyer-bg': '#ffffff',
          '--header-bg': '#06b6d4',
          '--text-color': '#1e293b'
        },
        component_overrides: {
          backgroundColor: 'var(--flyer-bg)',
          width: '210mm',
          height: '297mm',
          padding: '20mm'
        }
      },
      {
        id: 'brochure_fold',
        name: 'Tri-fold Brochure',
        category: 'print',
        description: 'Professional tri-fold brochure layout',
        css_variables: {
          '--brochure-bg': '#ffffff',
          '--panel-border': '#e5e7eb',
          '--heading-color': '#1e293b'
        },
        component_overrides: {
          backgroundColor: 'var(--brochure-bg)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '1rem'
        }
      }
    ],
    created_at: new Date(),
    updated_at: new Date()
  };

  // Get current brand kit
  static getCurrentBrandKit(): BrandKit {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const brandKit = JSON.parse(stored) as BrandKit;
        return this.mergeBrandKit(this.ZENITH_BRAND_KIT, brandKit);
      }
    } catch (error) {
      console.warn('Error loading stored brand kit, using default:', error);
    }
    return this.ZENITH_BRAND_KIT;
  }

  // Save brand kit updates
  static saveBrandKit(brandKit: Partial<BrandKit>): BrandKit {
    const current = this.getCurrentBrandKit();
    const updated: BrandKit = {
      ...current,
      ...brandKit,
      updated_at: new Date()
    };

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    return updated;
  }

  // Update specific brand assets
  static updateBrandAssets(assets: Partial<BrandAssets>): BrandKit {
    const current = this.getCurrentBrandKit();
    const updatedAssets = this.deepMerge(current.assets, assets);
    return this.saveBrandKit({ assets: updatedAssets });
  }

  // Update brand guidelines
  static updateBrandGuidelines(guidelines: Partial<BrandGuidelines>): BrandKit {
    const current = this.getCurrentBrandKit();
    const updatedGuidelines = this.deepMerge(current.guidelines, guidelines);
    return this.saveBrandKit({ guidelines: updatedGuidelines });
  }

  // Generate CSS custom properties from brand assets
  static generateCSSVariables(brandKit?: BrandKit): string {
    const kit = brandKit || this.getCurrentBrandKit();
    const { colors, typography, spacing, borderRadius, shadows } = kit.assets;

    const cssVars: string[] = [
      ':root {',
      `  /* Colors */`,
      `  --brand-primary: ${colors.primary};`,
      `  --brand-secondary: ${colors.secondary};`,
      `  --brand-accent: ${colors.accent || colors.primary};`,
      `  --brand-background: ${colors.background || '#ffffff'};`,
      `  --brand-text-primary: ${colors.text.primary};`,
      `  --brand-text-secondary: ${colors.text.secondary};`,
    ];

    // Add gradients
    if (colors.gradients) {
      colors.gradients.forEach(gradient => {
        const gradientValue = `linear-gradient(${gradient.direction || 'to right'}, ${gradient.colors.join(', ')})`;
        cssVars.push(`  --brand-gradient-${gradient.name}: ${gradientValue};`);
      });
    }

    // Add typography
    cssVars.push(
      `  /* Typography */`,
      `  --brand-font-heading: ${typography.headings.family}, ${typography.headings.fallbacks.join(', ')};`,
      `  --brand-font-body: ${typography.body.family}, ${typography.body.fallbacks.join(', ')};`
    );

    // Add spacing scale
    cssVars.push(`  /* Spacing */`);
    spacing.scale.forEach((multiplier, index) => {
      cssVars.push(`  --brand-space-${index}: ${spacing.unit * multiplier}px;`);
    });

    // Add border radius
    cssVars.push(
      `  /* Border Radius */`,
      `  --brand-radius-sm: ${borderRadius.small};`,
      `  --brand-radius-md: ${borderRadius.medium};`,
      `  --brand-radius-lg: ${borderRadius.large};`,
      `  --brand-radius-full: ${borderRadius.full};`
    );

    // Add shadows
    cssVars.push(
      `  /* Shadows */`,
      `  --brand-shadow-sm: ${shadows.small};`,
      `  --brand-shadow-md: ${shadows.medium};`,
      `  --brand-shadow-lg: ${shadows.large};`,
      `  --brand-shadow-xl: ${shadows.elevated};`,
      `}`
    );

    return cssVars.join('\n');
  }

  // Validate brand consistency
  static validateBrandConsistency(
    content: { colors?: string[]; fonts?: string[]; elements?: any[] }
  ): { valid: boolean; issues: string[]; suggestions: string[] } {
    const brandKit = this.getCurrentBrandKit();
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check colors
    if (content.colors) {
      const brandColors = [
        brandKit.assets.colors.primary,
        brandKit.assets.colors.secondary,
        brandKit.assets.colors.accent
      ].filter(Boolean);

      const unbrandedColors = content.colors.filter(color =>
        !brandColors.some(brandColor =>
          brandColor.toLowerCase() === color.toLowerCase()
        )
      );

      if (unbrandedColors.length > 0) {
        issues.push(`Non-brand colors detected: ${unbrandedColors.join(', ')}`);
        suggestions.push(`Consider using brand colors: ${brandColors.join(', ')}`);
      }
    }

    // Check fonts
    if (content.fonts) {
      const brandFonts = [
        brandKit.assets.typography.headings.family,
        brandKit.assets.typography.body.family
      ];

      const unbrandedFonts = content.fonts.filter(font =>
        !brandFonts.some(brandFont =>
          brandFont.toLowerCase().includes(font.toLowerCase())
        )
      );

      if (unbrandedFonts.length > 0) {
        issues.push(`Non-brand fonts detected: ${unbrandedFonts.join(', ')}`);
        suggestions.push(`Use brand fonts: ${brandFonts.join(', ')}`);
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      suggestions
    };
  }

  // Apply brand kit to campaign settings
  static applyToCampaignSettings(settings: any): any {
    const brandKit = this.getCurrentBrandKit();

    return {
      ...settings,
      brandColors: {
        primary: brandKit.assets.colors.primary,
        secondary: brandKit.assets.colors.secondary
      },
      companyLogo: brandKit.assets.logo.primary,
      defaultImageStyle: `${brandKit.guidelines.visual.style}, ${brandKit.guidelines.visual.imagery_style}`,
      nationalLanguage: this.getToneLanguageMapping(brandKit.guidelines.voice.tone)
    };
  }

  // Get available brand templates
  static getBrandTemplates(category?: BrandTemplate['category']): BrandTemplate[] {
    const brandKit = this.getCurrentBrandKit();
    if (category) {
      return brandKit.templates.filter(template => template.category === category);
    }
    return brandKit.templates;
  }

  // Add custom template
  static addTemplate(template: Omit<BrandTemplate, 'id'>): BrandKit {
    const brandKit = this.getCurrentBrandKit();
    const newTemplate: BrandTemplate = {
      ...template,
      id: `custom_${Date.now()}`
    };

    const updatedTemplates = [...brandKit.templates, newTemplate];
    return this.saveBrandKit({ templates: updatedTemplates });
  }

  // Update existing template
  static updateTemplate(templateId: string, updates: Partial<BrandTemplate>): BrandKit {
    const brandKit = this.getCurrentBrandKit();
    const updatedTemplates = brandKit.templates.map(template =>
      template.id === templateId ? { ...template, ...updates } : template
    );
    return this.saveBrandKit({ templates: updatedTemplates });
  }

  // Delete template
  static deleteTemplate(templateId: string): BrandKit {
    const brandKit = this.getCurrentBrandKit();
    const updatedTemplates = brandKit.templates.filter(template => template.id !== templateId);
    return this.saveBrandKit({ templates: updatedTemplates });
  }

  // Duplicate template
  static duplicateTemplate(templateId: string): BrandKit {
    const brandKit = this.getCurrentBrandKit();
    const originalTemplate = brandKit.templates.find(t => t.id === templateId);

    if (!originalTemplate) {
      throw new Error('Template not found');
    }

    const duplicatedTemplate: BrandTemplate = {
      ...originalTemplate,
      id: `${originalTemplate.id}_copy_${Date.now()}`,
      name: `${originalTemplate.name} (Copy)`
    };

    const updatedTemplates = [...brandKit.templates, duplicatedTemplate];
    return this.saveBrandKit({ templates: updatedTemplates });
  }

  // Apply brand colors to template
  static applyBrandColorsToTemplate(templateId: string): BrandKit {
    const brandKit = this.getCurrentBrandKit();
    const template = brandKit.templates.find(t => t.id === templateId);

    if (!template) {
      throw new Error('Template not found');
    }

    const updatedCssVariables = {
      ...template.css_variables,
      '--brand-primary': brandKit.assets.colors.primary,
      '--brand-secondary': brandKit.assets.colors.secondary,
      '--brand-accent': brandKit.assets.colors.accent || brandKit.assets.colors.primary,
      '--brand-text-primary': brandKit.assets.colors.text.primary,
      '--brand-text-secondary': brandKit.assets.colors.text.secondary
    };

    return this.updateTemplate(templateId, { css_variables: updatedCssVariables });
  }

  // Generate template CSS
  static generateTemplateCSS(template: BrandTemplate): string {
    const cssRules: string[] = [`/* Template: ${template.name} */`];

    // Add CSS variables
    if (Object.keys(template.css_variables).length > 0) {
      cssRules.push(`.template-${template.id} {`);
      Object.entries(template.css_variables).forEach(([key, value]) => {
        cssRules.push(`  ${key}: ${value};`);
      });
      cssRules.push(`}`);
    }

    // Add component overrides as CSS
    if (Object.keys(template.component_overrides).length > 0) {
      cssRules.push(`.template-${template.id} .component {`);
      Object.entries(template.component_overrides).forEach(([key, value]) => {
        const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        cssRules.push(`  ${cssKey}: ${value};`);
      });
      cssRules.push(`}`);
    }

    return cssRules.join('\n');
  }

  // Get template categories with counts
  static getTemplateCategoriesWithCounts(): Array<{
    category: BrandTemplate['category'];
    name: string;
    count: number;
    icon: string;
  }> {
    const brandKit = this.getCurrentBrandKit();
    const categories = ['social_media', 'web', 'email', 'presentation', 'print'] as const;

    return categories.map(category => {
      const count = brandKit.templates.filter(t => t.category === category).length;
      const categoryInfo = {
        social_media: { name: 'Social Media', icon: '📱' },
        web: { name: 'Web Components', icon: '🌐' },
        email: { name: 'Email Marketing', icon: '📧' },
        presentation: { name: 'Presentations', icon: '📊' },
        print: { name: 'Print Materials', icon: '🖨️' }
      };

      return {
        category,
        name: categoryInfo[category].name,
        count,
        icon: categoryInfo[category].icon
      };
    });
  }

  // Helper methods
  private static deepMerge(target: any, source: any): any {
    const result = { ...target };

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }

  private static mergeBrandKit(base: BrandKit, override: Partial<BrandKit>): BrandKit {
    return {
      ...base,
      ...override,
      assets: override.assets ? this.deepMerge(base.assets, override.assets) : base.assets,
      guidelines: override.guidelines ? this.deepMerge(base.guidelines, override.guidelines) : base.guidelines,
      templates: override.templates || base.templates
    };
  }

  private static getToneLanguageMapping(tone: BrandGuidelines['voice']['tone']): string {
    const mapping: Record<string, string> = {
      professional: 'Business Professional English',
      friendly: 'Conversational American English',
      authoritative: 'Academic English',
      playful: 'Creative Contemporary English',
      technical: 'Technical Documentation English'
    };
    return mapping[tone] || 'American English';
  }

  // Reset to default ZENITH brand kit
  static resetToDefault(): BrandKit {
    localStorage.removeItem(this.STORAGE_KEY);
    return this.ZENITH_BRAND_KIT;
  }

  // Export brand kit
  static exportBrandKit(): string {
    const brandKit = this.getCurrentBrandKit();
    return JSON.stringify(brandKit, null, 2);
  }

  // Import brand kit
  static importBrandKit(jsonString: string): BrandKit {
    try {
      const importedKit = JSON.parse(jsonString) as BrandKit;
      return this.saveBrandKit(importedKit);
    } catch (error) {
      throw new Error('Invalid brand kit format');
    }
  }
}