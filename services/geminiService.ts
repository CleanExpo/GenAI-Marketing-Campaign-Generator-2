import { GoogleGenAI, Type } from "@google/genai";
import { CampaignResult, AdvancedSettings } from '../types';
import { analyzeCompetitor, isSEMrushAvailable } from './semrushService';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY! });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    targetAudience: { type: Type.STRING },
    keyMessaging: { type: Type.ARRAY, items: { type: Type.STRING } },
    socialMediaContent: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          platform: { type: Type.STRING },
          contentExample: { type: Type.STRING },
        },
        required: ["platform", "contentExample"],
      },
    },
    seoKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
    adCopy: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          headline: { type: Type.STRING },
          body: { type: Type.STRING },
        },
        required: ["headline", "body"],
      },
    },
    aiImagePrompts: { type: Type.ARRAY, items: { type: Type.STRING } },
    aiVideoConcepts: { type: Type.ARRAY, items: { type: Type.STRING } },
    backlinkStrategy: { type: Type.ARRAY, items: { type: Type.STRING } },
    trendingTopics: {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                topic: { type: Type.STRING },
                angle: { type: Type.STRING },
            },
            required: ["topic", "angle"],
        },
    },
    metaData: {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
        },
        required: ["title", "description"],
    },
    competitorAnalysis: {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                competitor: { type: Type.STRING },
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                strategy: { type: Type.STRING },
                strategyExamples: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["competitor", "strengths", "weaknesses", "strategy"],
        },
    },
  },
  required: ["targetAudience", "keyMessaging", "socialMediaContent", "seoKeywords", "adCopy"]
};


export const generateMarketingCampaign = async (productDescription: string, generateMedia: boolean, settings: AdvancedSettings): Promise<CampaignResult> => {

  let prompt = `Generate a comprehensive marketing campaign for the following product: "${productDescription}".\n\n`;

  // --- Branding Context ---
  if (settings.companyName) prompt += `The campaign is for the company "${settings.companyName}".\n`;
  if (settings.companyWebsite) prompt += `Analyze the writing style, tone, and branding from their website: ${settings.companyWebsite}. The generated content should match this style. \n`;
  if (settings.brandColors.primary || settings.brandColors.secondary) prompt += `The brand's primary colors are ${settings.brandColors.primary} and secondary is ${settings.brandColors.secondary}. Visuals should incorporate this palette.\n`;
  if (settings.socialMediaLinks.length > 0) {
      prompt += `The company's social media profiles are:\n${settings.socialMediaLinks.map(l => `- ${l.platform}: ${l.url}`).join('\n')}\n`;
  }

  // --- Content & SEO ---
  if(settings.nationalLanguage) prompt += `All content must be written in ${settings.nationalLanguage}.\n`;
  if (settings.useGoogleEAT) prompt += `All written content must adhere to Google's E-E-A-T (Experience, Expertise, Authoritativeness, and Trustworthiness) guidelines.\n`;
  if (settings.useHemingwayStyle) prompt += `Write all copy in the style of Hemingway: clear, concise, and impactful.\n`;
  prompt += `Always generate SEO meta title and description for a webpage about this product.\n`

  // --- Strategic Directives ---
  if (settings.generateBacklinks) prompt += `Include a practical backlink generation strategy with actionable ideas.\n`;
  if (settings.findTrendingTopics) prompt += `Include a section with trending topics relevant to the product and creative angles to leverage them.\n`;
   if (settings.competitorWebsites.length > 0) {
    prompt += `\n--- Competitor Analysis ---\n`;
    prompt += `Analyze the following competitor websites:\n${settings.competitorWebsites.map(c => `- ${c.url}`).join('\n')}\n`;

    // If SEMrush is available, we'll add real SEO data to the analysis
    if (isSEMrushAvailable()) {
      prompt += `For each competitor, I will provide real SEO data including organic traffic, keyword rankings, and competitor insights from SEMrush. Use this data to enhance your analysis.\n`;
    }

    prompt += `For each competitor, provide a summary of their strengths, weaknesses, their overall marketing strategy, and 2-3 specific examples of their current marketing tactics (e.g., 'Runs a popular influencer campaign called #BrandChallenge', 'Uses retargeting ads on Facebook with a 10% discount').\n`;
  }

  // --- Media Generation ---
  if (generateMedia) {
    prompt += "Crucially, you must also provide creative prompts for AI image generation and concepts for short-form videos (e.g., TikTok, Reels).\n";
    if (settings.insertWatermark) prompt += `For AI image prompts, compose the scene to leave a clean, unobtrusive space for a logo or watermark to be added later.\n`;
    if (settings.generateVerifiableText) prompt += `For AI image prompts that include text, make a best effort to ensure the text is spelled correctly and is clearly legible.\n`;
  } else {
    prompt += "Do not generate AI image prompts or video concepts.\n";
  }

  // --- Platform Targeting ---
  if (settings.targetPlatforms.length > 0) {
    prompt += `Instead of a general strategy, generate a specific, ready-to-post content example for each of the following platforms: ${settings.targetPlatforms.join(', ')}. The content must be tailored to the platform's format and best practices (e.g., for Instagram, provide a caption with emojis and hashtags; for a Blog, provide a title and opening paragraph).\n`;
  }

  prompt += `Return the campaign as a JSON object adhering to the specified schema.`;

  const dynamicSchema = {...responseSchema};
  if (!generateMedia) {
      delete dynamicSchema.properties.aiImagePrompts;
      delete dynamicSchema.properties.aiVideoConcepts;
  }
  if (!settings.generateBacklinks) {
    delete dynamicSchema.properties.backlinkStrategy;
  }
  if (!settings.findTrendingTopics) {
    delete dynamicSchema.properties.trendingTopics;
  }
  if (settings.competitorWebsites.length === 0) {
    delete dynamicSchema.properties.competitorAnalysis;
  }

  // Enhance competitor analysis with SEMrush data if available
  let semrushData = '';
  if (isSEMrushAvailable() && settings.competitorWebsites.length > 0) {
    try {
      const competitorInsights = await Promise.all(
        settings.competitorWebsites.slice(0, 3).map(comp => analyzeCompetitor(comp.url))
      );

      semrushData = '\n--- SEMrush Competitor Data ---\n';
      competitorInsights.forEach(insight => {
        if (!insight.error) {
          semrushData += `${insight.domain}:\n`;
          semrushData += `- Organic Keywords: ${insight.seoMetrics.organicKeywords.toLocaleString()}\n`;
          semrushData += `- Organic Traffic: ${insight.seoMetrics.organicTraffic.toLocaleString()}\n`;
          semrushData += `- Top Keywords: ${insight.topKeywords.slice(0, 5).map(k => k.keyword).join(', ')}\n`;
          if (insight.competitors.length > 0) {
            semrushData += `- Main Competitors: ${insight.competitors.join(', ')}\n`;
          }
          semrushData += '\n';
        }
      });

      prompt += semrushData;
    } catch (error) {
      console.warn('SEMrush data fetch failed:', error);
    }
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: dynamicSchema,
      },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as CampaignResult;
  } catch (error) {
    console.error("Error generating marketing campaign:", error);
    throw new Error("Failed to generate marketing campaign. The model may have returned an invalid response.");
  }
};

export const generateImageFromPrompt = async (
    prompt: string, 
    aspectRatio: string, 
    style: string, 
    creativityLevel: number, 
    negativePrompt?: string
): Promise<string> => {
    
    let finalPrompt = prompt;

    // Add style to the prompt
    if (style && style.toLowerCase() !== 'none') {
        finalPrompt = `A ${style.toLowerCase()} style image of: ${prompt}`;
    }

    // Add creativity level guidance
    if (creativityLevel <= 3) {
        finalPrompt += ". Adhere closely to the prompt with low creative interpretation.";
    } else if (creativityLevel >= 8) {
        finalPrompt += ". Use a high level of creative interpretation and imagination.";
    }
    
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: finalPrompt,
            negativePrompt: negativePrompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: aspectRatio,
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        } else {
            throw new Error("No image was generated.");
        }
    } catch (error) {
        console.error("Error generating image:", error);
        throw new Error("Failed to generate image from prompt.");
    }
};