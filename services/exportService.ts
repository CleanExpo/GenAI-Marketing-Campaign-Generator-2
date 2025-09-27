// services/exportService.ts

import { SavedCampaign, CampaignResult } from '../types';

export interface ExportOptions {
  format: 'pdf' | 'csv' | 'json' | 'text';
  includeImages?: boolean;
  includeMetadata?: boolean;
  customFileName?: string;
}

// Lazy loader for jsPDF with caching and error handling
class PDFLibLoader {
  private static instance: any = null;
  private static isLoading = false;
  private static loadingPromise: Promise<any> | null = null;

  static async load() {
    if (this.instance) {
      return this.instance;
    }

    if (this.isLoading && this.loadingPromise) {
      return this.loadingPromise;
    }

    this.isLoading = true;
    this.loadingPromise = import('jspdf')
      .then((module) => {
        this.instance = module.jsPDF;
        this.isLoading = false;
        return this.instance;
      })
      .catch((error) => {
        this.isLoading = false;
        this.loadingPromise = null;
        throw new Error(`Failed to load PDF library: ${error.message}`);
      });

    return this.loadingPromise;
  }
}

export class ExportService {

  static async exportToPDF(campaign: SavedCampaign | CampaignResult, options: ExportOptions = {}): Promise<void> {
    try {
      const jsPDF = await PDFLibLoader.load();
    const doc = new jsPDF();

    // Document setup
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPosition = margin;

    // Helper function to add text with word wrapping
    const addText = (text: string, fontSize: number = 10, isBold: boolean = false) => {
      doc.setFontSize(fontSize);
      if (isBold) doc.setFont('helvetica', 'bold');
      else doc.setFont('helvetica', 'normal');

      const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
      doc.text(lines, margin, yPosition);
      yPosition += lines.length * fontSize * 0.4 + 5;

      // Check if we need a new page
      if (yPosition > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        yPosition = margin;
      }
    };

    // Title
    addText('ZENITH - Marketing Campaign Report', 20, true);
    yPosition += 10;

    // Campaign info (if SavedCampaign)
    if ('name' in campaign) {
      addText(`Campaign: ${campaign.name}`, 16, true);
      if (campaign.description) {
        addText(`Description: ${campaign.description}`, 12);
      }
      addText(`Created: ${new Date(campaign.createdAt).toLocaleDateString()}`, 10);
      yPosition += 10;
    }

    const result = 'result' in campaign ? campaign.result : campaign;

    // Target Audience
    addText('TARGET AUDIENCE', 14, true);
    addText(result.targetAudience, 10);
    yPosition += 5;

    // Key Messaging
    addText('KEY MESSAGING', 14, true);
    result.keyMessaging.forEach((message, index) => {
      addText(`${index + 1}. ${message}`, 10);
    });
    yPosition += 5;

    // Social Media Content
    addText('SOCIAL MEDIA CONTENT', 14, true);
    result.socialMediaContent.forEach(content => {
      addText(`${content.platform.toUpperCase()}:`, 12, true);
      addText(content.contentExample, 10);
      yPosition += 3;
    });

    // SEO Keywords
    if (result.seoKeywords?.length) {
      addText('SEO KEYWORDS', 14, true);
      addText(result.seoKeywords.join(', '), 10);
      yPosition += 5;
    }

    // Ad Copy
    if (result.adCopy?.length) {
      addText('ADVERTISING COPY', 14, true);
      result.adCopy.forEach((ad, index) => {
        addText(`Ad ${index + 1} - Headline:`, 12, true);
        addText(ad.headline, 10);
        addText('Body:', 12, true);
        addText(ad.body, 10);
        yPosition += 3;
      });
    }

    // AI Image Prompts
    if (result.aiImagePrompts?.length) {
      addText('AI IMAGE PROMPTS', 14, true);
      result.aiImagePrompts.forEach((prompt, index) => {
        addText(`${index + 1}. ${prompt}`, 10);
      });
      yPosition += 5;
    }

    // Competitor Analysis
    if (result.competitorAnalysis?.length) {
      addText('COMPETITOR ANALYSIS', 14, true);
      result.competitorAnalysis.forEach(comp => {
        addText(`${comp.competitor}:`, 12, true);
        addText(`Strategy: ${comp.strategy}`, 10);
        if (comp.strengths?.length) {
          addText(`Strengths: ${comp.strengths.join(', ')}`, 10);
        }
        if (comp.weaknesses?.length) {
          addText(`Weaknesses: ${comp.weaknesses.join(', ')}`, 10);
        }
        yPosition += 3;
      });
    }

    // Trending Topics
    if (result.trendingTopics?.length) {
      addText('TRENDING TOPICS', 14, true);
      result.trendingTopics.forEach(topic => {
        addText(`Topic: ${topic.topic}`, 12, true);
        addText(`Angle: ${topic.angle}`, 10);
        yPosition += 3;
      });
    }

    // Backlink Strategy
    if (result.backlinkStrategy?.length) {
      addText('BACKLINK STRATEGY', 14, true);
      result.backlinkStrategy.forEach((strategy, index) => {
        addText(`${index + 1}. ${strategy}`, 10);
      });
    }

    // Footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const footerText = `Generated by ZENITH AI Marketing Campaign Generator - ${new Date().toLocaleDateString()}`;
    const footerWidth = doc.getTextWidth(footerText);
    doc.text(footerText, (pageWidth - footerWidth) / 2, doc.internal.pageSize.getHeight() - 10);

    // Save the PDF
    const fileName = options.customFileName ||
      ('name' in campaign ? `${campaign.name.replace(/\s+/g, '_')}_Campaign.pdf` : 'Marketing_Campaign.pdf');
    doc.save(fileName);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      throw error;
    }
  }

  static exportToCSV(campaign: SavedCampaign | CampaignResult, options: ExportOptions = {}): void {
    const result = 'result' in campaign ? campaign.result : campaign;
    const csvData = [];

    // Campaign metadata (if available)
    if ('name' in campaign) {
      csvData.push(['Campaign Name', campaign.name]);
      csvData.push(['Description', campaign.description]);
      csvData.push(['Created', new Date(campaign.createdAt).toLocaleDateString()]);
      csvData.push(['Status', campaign.status]);
      csvData.push([]);  // Empty row
    }

    // Target Audience
    csvData.push(['Target Audience', result.targetAudience]);
    csvData.push([]);

    // Key Messaging
    csvData.push(['Key Messaging']);
    result.keyMessaging.forEach((message, index) => {
      csvData.push([`Message ${index + 1}`, message]);
    });
    csvData.push([]);

    // Social Media Content
    csvData.push(['Social Media Content']);
    csvData.push(['Platform', 'Content Example']);
    result.socialMediaContent.forEach(content => {
      csvData.push([content.platform, content.contentExample]);
    });
    csvData.push([]);

    // SEO Keywords
    if (result.seoKeywords?.length) {
      csvData.push(['SEO Keywords']);
      result.seoKeywords.forEach((keyword, index) => {
        csvData.push([`Keyword ${index + 1}`, keyword]);
      });
      csvData.push([]);
    }

    // Ad Copy
    if (result.adCopy?.length) {
      csvData.push(['Ad Copy']);
      csvData.push(['Ad Number', 'Headline', 'Body']);
      result.adCopy.forEach((ad, index) => {
        csvData.push([`Ad ${index + 1}`, ad.headline, ad.body]);
      });
      csvData.push([]);
    }

    // AI Image Prompts
    if (result.aiImagePrompts?.length) {
      csvData.push(['AI Image Prompts']);
      result.aiImagePrompts.forEach((prompt, index) => {
        csvData.push([`Prompt ${index + 1}`, prompt]);
      });
      csvData.push([]);
    }

    // Competitor Analysis
    if (result.competitorAnalysis?.length) {
      csvData.push(['Competitor Analysis']);
      csvData.push(['Competitor', 'Strategy', 'Strengths', 'Weaknesses']);
      result.competitorAnalysis.forEach(comp => {
        csvData.push([
          comp.competitor,
          comp.strategy,
          comp.strengths?.join('; ') || '',
          comp.weaknesses?.join('; ') || ''
        ]);
      });
      csvData.push([]);
    }

    // Convert to CSV string
    const csvString = csvData.map(row =>
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    // Download CSV
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const fileName = options.customFileName ||
      ('name' in campaign ? `${campaign.name.replace(/\s+/g, '_')}_Campaign.csv` : 'Marketing_Campaign.csv');

    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  static async copyToClipboard(campaign: SavedCampaign | CampaignResult): Promise<boolean> {
    try {
      const result = 'result' in campaign ? campaign.result : campaign;
      let text = '';

      // Campaign header
      if ('name' in campaign) {
        text += `🚀 ZENITH Marketing Campaign: ${campaign.name}\n`;
        text += `📝 ${campaign.description}\n`;
        text += `📅 Created: ${new Date(campaign.createdAt).toLocaleDateString()}\n\n`;
      } else {
        text += `🚀 ZENITH Marketing Campaign Report\n`;
        text += `📅 Generated: ${new Date().toLocaleDateString()}\n\n`;
      }

      // Target Audience
      text += `🎯 TARGET AUDIENCE\n${result.targetAudience}\n\n`;

      // Key Messaging
      text += `💡 KEY MESSAGING\n`;
      result.keyMessaging.forEach((message, index) => {
        text += `${index + 1}. ${message}\n`;
      });
      text += '\n';

      // Social Media Content
      text += `📱 SOCIAL MEDIA CONTENT\n`;
      result.socialMediaContent.forEach(content => {
        text += `${content.platform.toUpperCase()}:\n${content.contentExample}\n\n`;
      });

      // SEO Keywords
      if (result.seoKeywords?.length) {
        text += `🔍 SEO KEYWORDS\n${result.seoKeywords.join(', ')}\n\n`;
      }

      // Ad Copy
      if (result.adCopy?.length) {
        text += `📢 ADVERTISING COPY\n`;
        result.adCopy.forEach((ad, index) => {
          text += `Ad ${index + 1}:\nHeadline: ${ad.headline}\nBody: ${ad.body}\n\n`;
        });
      }

      // AI Image Prompts
      if (result.aiImagePrompts?.length) {
        text += `🎨 AI IMAGE PROMPTS\n`;
        result.aiImagePrompts.forEach((prompt, index) => {
          text += `${index + 1}. ${prompt}\n`;
        });
        text += '\n';
      }

      // Competitor Analysis
      if (result.competitorAnalysis?.length) {
        text += `🏢 COMPETITOR ANALYSIS\n`;
        result.competitorAnalysis.forEach(comp => {
          text += `${comp.competitor}:\nStrategy: ${comp.strategy}\n`;
          if (comp.strengths?.length) text += `Strengths: ${comp.strengths.join(', ')}\n`;
          if (comp.weaknesses?.length) text += `Weaknesses: ${comp.weaknesses.join(', ')}\n\n`;
        });
      }

      // Trending Topics
      if (result.trendingTopics?.length) {
        text += `📈 TRENDING TOPICS\n`;
        result.trendingTopics.forEach(topic => {
          text += `Topic: ${topic.topic}\nAngle: ${topic.angle}\n\n`;
        });
      }

      // Backlink Strategy
      if (result.backlinkStrategy?.length) {
        text += `🔗 BACKLINK STRATEGY\n`;
        result.backlinkStrategy.forEach((strategy, index) => {
          text += `${index + 1}. ${strategy}\n`;
        });
        text += '\n';
      }

      text += `\n✨ Generated by ZENITH AI Marketing Campaign Generator`;

      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }

  static exportToJSON(campaign: SavedCampaign | CampaignResult, options: ExportOptions = {}): void {
    const exportData = {
      exportedAt: new Date().toISOString(),
      exportedBy: 'ZENITH AI Marketing Campaign Generator',
      ...campaign
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const fileName = options.customFileName ||
      ('name' in campaign ? `${campaign.name.replace(/\s+/g, '_')}_Campaign.json` : 'Marketing_Campaign.json');

    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Batch export functionality
  static async exportMultipleFormats(
    campaign: SavedCampaign | CampaignResult,
    formats: ExportOptions['format'][],
    options: ExportOptions = {}
  ): Promise<{ [key: string]: boolean }> {
    const results: { [key: string]: boolean } = {};

    for (const format of formats) {
      try {
        switch (format) {
          case 'pdf':
            await this.exportToPDF(campaign, { ...options, format });
            results[format] = true;
            break;
          case 'csv':
            this.exportToCSV(campaign, { ...options, format });
            results[format] = true;
            break;
          case 'json':
            this.exportToJSON(campaign, { ...options, format });
            results[format] = true;
            break;
          case 'text':
            results[format] = await this.copyToClipboard(campaign);
            break;
        }
      } catch (error) {
        console.error(`Failed to export as ${format}:`, error);
        results[format] = false;
      }
    }

    return results;
  }
}